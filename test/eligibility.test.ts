import "@nomicfoundation/hardhat-toolbox"; // This loads the chai matchers
import { expect } from "chai";
import { ethers } from "hardhat";
import { ShadowBoxCore } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

// This is the corrected dummy payload.
// It now matches the nested struct { bytes data; }
// for each 'externalEuint' type in the contract.
const dummyEncryptedPayload = {
  balance: { data: "0x00" },
  nftFlags: { data: "0x00" },
  interactions: { data: "0x00" },
  sybilScore: { data: "0x00" },
};
const dummyInputProof = "0x01"; // Must be non-empty
const emptyInputProof = "0x";

describe("ShadowBoxCore - Tests", function () {
  let shadowBox: ShadowBoxCore;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  // Use a fixture to deploy the contract once
  async function deployShadowBoxFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    const ShadowBoxFactory = await ethers.getContractFactory("ShadowBoxCore");
    const shadowBox = await ShadowBoxFactory.deploy();
    await shadowBox.waitForDeployment();

    return { shadowBox, owner, user1, user2 };
  }

  beforeEach(async function () {
    // Load the fixture for each test
    const fixtures = await loadFixture(deployShadowBoxFixture);
    shadowBox = fixtures.shadowBox;
    owner = fixtures.owner;
    user1 = fixtures.user1;
    user2 = fixtures.user2;
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

  describe("Pause Functionality", function () {
    it("Should allow owner to pause and unpause", async function () {
      await shadowBox.connect(owner).setPaused(true);
      expect(await shadowBox.paused()).to.equal(true);

      await shadowBox.connect(owner).setPaused(false);
      expect(await shadowBox.paused()).to.equal(false);
    });

    it("Should emit ConfigUpdated event when paused/unpaused", async function () {
      const cooldown = await shadowBox.SUBMISSION_COOLDOWN();
      await expect(shadowBox.connect(owner).setPaused(true))
        .to.emit(shadowBox, "ConfigUpdated")
        .withArgs(cooldown, true);
    });

    it("Should revert submissions when paused", async function () {
      await shadowBox.connect(owner).setPaused(true);

      // This will now pass the ethers encoding and be reverted by the contract
      await expect(
        shadowBox
          .connect(user1)
          .submitEligibility(dummyEncryptedPayload, dummyInputProof)
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
      expect(status.lastSubmissionTime).to.equal(0);
      expect(status.canSubmitNow).to.equal(true);
    });

    it("Should return correct status when paused", async function () {
      await shadowBox.connect(owner).setPaused(true);
      const status = await shadowBox.getUserStatus(user1.address);
      expect(status.canSubmitNow).to.equal(false);
    });
  });

  describe("Eligibility Submission (FHE)", function () {
    it("Should revert if inputProof is empty", async function () {
      // This will also pass encoding and be reverted by the contract
      await expect(
        shadowBox
          .connect(user1)
          .submitEligibility(dummyEncryptedPayload, emptyInputProof)
      ).to.be.revertedWithCustomError(shadowBox, "InvalidPayload");
    });

    // --- FHE-dependent tests ---
    // These tests require a real FHEVM node to provide a valid InputProof
    // and encrypted payload. We skip them in a simple unit test environment.

    it.skip("Should allow a user to submit eligibility", async function () {
      // This test requires a valid, encrypted payload and proof.
      // const { payload, proof } = await createValidFheInput(user1.address);
      // await expect(shadowBox.connect(user1).submitEligibility(payload, proof))
      //   .to.emit(shadowBox, "EligibilityChecked");
    });

    it.skip("Should enforce cooldown between submissions", async function () {
      // 1. Submit first tx (requires valid FHE data)
      // 2. Expect second tx to revert
      // await shadowBox.connect(user1).submitEligibility(payload, proof);
      // await expect(
      //   shadowBox.connect(user1).submitEligibility(payload, proof)
      // ).to.be.revertedWithCustomError(shadowBox, "SubmissionTooSoon");
    });

    it.skip("Should allow submission after cooldown period", async function () {
      // 1. Submit first tx (requires valid FHE data)
      // 2. Increase time
      // await ethers.provider.send("evm_increaseTime", [3601]); // 1 hour + 1 sec
      // await ethers.provider.send("evm_mine", []);
      // 3. Expect second tx to succeed
      // await expect(shadowBox.connect(user1).submitEligibility(payload, proof))
      //   .to.emit(shadowBox, "EligibilityChecked");
    });
  });
});
