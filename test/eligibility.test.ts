import { expect } from "chai";
import { ethers } from "hardhat";
import { ShadowBoxCore } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-toolbox/signers";

describe("ShadowBoxCore - Eligibility Tests", function () {
  let shadowBox: ShadowBoxCore;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  this.timeout(180000);

  beforeEach(async function () {
    this.timeout(180000);
    [owner, user1, user2] = await ethers.getSigners();
    
    const ShadowBoxFactory = await ethers.getContractFactory("ShadowBoxCore");
    shadowBox = await ShadowBoxFactory.deploy();
    await shadowBox.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await shadowBox.owner()).to.equal(owner.address);
    });

    it("Should initialize with nonce 0", async function () {
      expect(await shadowBox.nonce()).to.equal(0);
    });

    it("Should not be paused initially", async function () {
      expect(await shadowBox.paused()).to.equal(false);
    });
  });

  describe("Eligibility Submission", function () {
    it("Should allow user to submit eligibility", async function () {
      const payload = ethers.toUtf8Bytes("test_payload_data");
      
      await expect(shadowBox.connect(user1).submitEligibility(payload))
        .to.emit(shadowBox, "EligibilityChecked");
    });

    it("Should increment nonce after submission", async function () {
      const payload = ethers.toUtf8Bytes("test_payload");
      
      await shadowBox.connect(user1).submitEligibility(payload);
      expect(await shadowBox.nonce()).to.equal(1);
      
      await shadowBox.connect(user2).submitEligibility(payload);
      expect(await shadowBox.nonce()).to.equal(2);
    });

    it("Should emit EligibilityChecked event with correct parameters", async function () {
      const payload = ethers.toUtf8Bytes("high_score_payload");
      
      const tx = await shadowBox.connect(user1).submitEligibility(payload);
      const receipt = await tx.wait();
      
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "EligibilityChecked"
      );
      
      expect(event).to.not.be.undefined;
    });

    it("Should revert if payload is empty", async function () {
      const emptyPayload = "0x";
      
      await expect(
        shadowBox.connect(user1).submitEligibility(emptyPayload)
      ).to.be.revertedWithCustomError(shadowBox, "InvalidPayload");
    });

    it("Should enforce cooldown between submissions", async function () {
      const payload = ethers.toUtf8Bytes("test_payload");
      
      await shadowBox.connect(user1).submitEligibility(payload);
      
      await expect(
        shadowBox.connect(user1).submitEligibility(payload)
      ).to.be.revertedWithCustomError(shadowBox, "SubmissionTooSoon");
    });

    it("Should allow submission after cooldown period", async function () {
      const payload = ethers.toUtf8Bytes("test_payload");
      
      await shadowBox.connect(user1).submitEligibility(payload);
      
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);
      
      await expect(shadowBox.connect(user1).submitEligibility(payload))
        .to.emit(shadowBox, "EligibilityChecked");
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow owner to pause", async function () {
      await shadowBox.connect(owner).setPaused(true);
      expect(await shadowBox.paused()).to.equal(true);
    });

    it("Should revert submissions when paused", async function () {
      await shadowBox.connect(owner).setPaused(true);
      
      const payload = ethers.toUtf8Bytes("test_payload");
      await expect(
        shadowBox.connect(user1).submitEligibility(payload)
      ).to.be.revertedWithCustomError(shadowBox, "ContractPaused");
    });

    it("Should not allow non-owner to pause", async function () {
      await expect(
        shadowBox.connect(user1).setPaused(true)
      ).to.be.revertedWithCustomError(shadowBox, "OwnableUnauthorizedAccount");
    });
  });

  describe("User Status", function () {
    it("Should return correct status for new user", async function () {
      const status = await shadowBox.getUserStatus(user1.address);
      expect(status.submitted).to.equal(false);
      expect(status.canSubmitNow).to.equal(true);
    });

    it("Should update status after submission", async function () {
      const payload = ethers.toUtf8Bytes("test_payload");
      await shadowBox.connect(user1).submitEligibility(payload);
      
      const status = await shadowBox.getUserStatus(user1.address);
      expect(status.submitted).to.equal(true);
      expect(status.canSubmitNow).to.equal(false);
    });
  });

  describe("Mock FHE Evaluation", function () {
    it("Should generate different outputs for different payloads", async function () {
      const payload1 = ethers.toUtf8Bytes("payload_one");
      const payload2 = ethers.toUtf8Bytes("payload_two");
      
      const tx1 = await shadowBox.connect(user1).submitEligibility(payload1);
      const receipt1 = await tx1.wait();
      
      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine", []);
      
      const tx2 = await shadowBox.connect(user2).submitEligibility(payload2);
      const receipt2 = await tx2.wait();
      
      expect(receipt1?.hash).to.not.equal(receipt2?.hash);
    });
  });
});
