import { expect } from "chai";
import { ethers } from "hardhat";
import { Redeemer, RewardToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-toolbox/signers";

describe("Redeemer - Voucher Tests", function () {
  let redeemer: Redeemer;
  let rewardToken: RewardToken;
  let owner: SignerWithAddress;
  let signer: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  this.timeout(180000);

  async function createValidVoucher(user: string, amount: number = 100) {
    const expiry = Math.floor(Date.now() / 1000) + 86400;
    
    const voucher = {
      user: user,
      rewardType: 0,
      amount: ethers.parseEther(amount.toString()),
      expiry: expiry,
      voucherNonce: Math.floor(Math.random() * 1000000)
    };
    
    const voucherHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "uint256", "uint256"],
        [voucher.user, voucher.rewardType, voucher.amount, voucher.expiry, voucher.voucherNonce]
      )
    );
    
    const signature = await signer.signMessage(ethers.getBytes(voucherHash));
    
    return { voucher, signature };
  }

  beforeEach(async function () {
    this.timeout(180000);
    [owner, signer, user1, user2] = await ethers.getSigners();

    // Deploy ERC20 reward token with a large initial supply to the owner
    const RewardTokenFactory = await ethers.getContractFactory("RewardToken");
    rewardToken = (await RewardTokenFactory.deploy(
      ethers.parseEther("1000000")
    )) as RewardToken;
    await rewardToken.waitForDeployment();

    // Deploy Redeemer with signer and reward token address
    const RedeemerFactory = await ethers.getContractFactory("Redeemer");
    redeemer = (await RedeemerFactory.deploy(
      signer.address,
      await rewardToken.getAddress()
    )) as Redeemer;
    await redeemer.waitForDeployment();

    // Fund Redeemer with reward tokens via addRewards
    const redeemerAddress = await redeemer.getAddress();
    const fundingAmount = ethers.parseEther("100000");
    await rewardToken.approve(redeemerAddress, fundingAmount);
    await redeemer.connect(owner).addRewards(fundingAmount);
  });

  describe("Deployment", function () {
    it("Should set the correct signer", async function () {
      expect(await redeemer.signer()).to.equal(signer.address);
    });

    it("Should set the correct owner", async function () {
      expect(await redeemer.owner()).to.equal(owner.address);
    });

    it("Should not be paused initially", async function () {
      expect(await redeemer.paused()).to.equal(false);
    });
  });

  describe("Voucher Creation and Redemption", function () {
    it("Should allow redeeming valid voucher", async function () {
      const { voucher, signature } = await createValidVoucher(user1.address);
      
      await expect(redeemer.connect(user1).redeem(voucher, signature))
        .to.emit(redeemer, "VoucherRedeemed")
        .withArgs(
          user1.address,
          voucher.rewardType,
          voucher.amount,
          ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(
              ["address", "uint256", "uint256", "uint256", "uint256"],
              [voucher.user, voucher.rewardType, voucher.amount, voucher.expiry, voucher.voucherNonce]
            )
          )
        );
    });

    it("Should update reward balance after redemption", async function () {
      const { voucher, signature } = await createValidVoucher(user1.address);
      
      await redeemer.connect(user1).redeem(voucher, signature);
      
      const balance = await redeemer.rewardBalance(user1.address);
      expect(balance).to.equal(voucher.amount);
    });

    it("Should reject already used voucher", async function () {
      const { voucher, signature } = await createValidVoucher(user1.address);
      
      await redeemer.connect(user1).redeem(voucher, signature);
      
      await expect(
        redeemer.connect(user1).redeem(voucher, signature)
      ).to.be.revertedWithCustomError(redeemer, "VoucherAlreadyUsed");
    });

    it("Should reject expired voucher", async function () {
      const expiry = Math.floor(Date.now() / 1000) - 3600;
      
      const voucher = {
        user: user1.address,
        rewardType: 0,
        amount: ethers.parseEther("100"),
        expiry: expiry,
        voucherNonce: 12345
      };
      
      const voucherHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256", "uint256", "uint256", "uint256"],
          [voucher.user, voucher.rewardType, voucher.amount, voucher.expiry, voucher.voucherNonce]
        )
      );
      
      const signature = await signer.signMessage(ethers.getBytes(voucherHash));
      
      await expect(
        redeemer.connect(user1).redeem(voucher, signature)
      ).to.be.revertedWithCustomError(redeemer, "VoucherExpired");
    });

    it("Should reject voucher with invalid signature", async function () {
      const { voucher } = await createValidVoucher(user1.address);
      const invalidSignature = await user2.signMessage("invalid");
      
      await expect(
        redeemer.connect(user1).redeem(voucher, invalidSignature)
      ).to.be.revertedWithCustomError(redeemer, "InvalidSignature");
    });
  });

  describe("Reward Withdrawal", function () {
    it("Should allow user to withdraw rewards", async function () {
      const { voucher, signature } = await createValidVoucher(user1.address, 1);
      await redeemer.connect(user1).redeem(voucher, signature);

      const balanceBefore = await rewardToken.balanceOf(user1.address);
      const rewardAmount = await redeemer.rewardBalance(user1.address);

      await redeemer.connect(user1).withdrawRewards();

      const balanceAfter = await rewardToken.balanceOf(user1.address);
      expect(balanceAfter).to.equal(balanceBefore + rewardAmount);

      expect(await redeemer.rewardBalance(user1.address)).to.equal(0);
    });

    it("Should revert withdrawal with no rewards", async function () {
      await expect(
        redeemer.connect(user1).withdrawRewards()
      ).to.be.revertedWithCustomError(redeemer, "InsufficientRewards");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update signer", async function () {
      await expect(redeemer.connect(owner).setSigner(user1.address))
        .to.emit(redeemer, "SignerUpdated")
        .withArgs(signer.address, user1.address);
      
      expect(await redeemer.signer()).to.equal(user1.address);
    });

    it("Should not allow non-owner to update signer", async function () {
      await expect(
        redeemer.connect(user1).setSigner(user2.address)
      ).to.be.revertedWithCustomError(redeemer, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to pause", async function () {
      await redeemer.connect(owner).setPaused(true);
      expect(await redeemer.paused()).to.equal(true);
    });

    it("Should reject redemptions when paused", async function () {
      await redeemer.connect(owner).setPaused(true);
      
      const { voucher, signature } = await createValidVoucher(user1.address);
      
      await expect(
        redeemer.connect(user1).redeem(voucher, signature)
      ).to.be.revertedWithCustomError(redeemer, "ContractPaused");
    });
  });

  describe("Voucher Validation", function () {
    it("Should correctly check voucher validity", async function () {
      const { voucher } = await createValidVoucher(user1.address);
      
      const check = await redeemer.checkVoucher(voucher);
      expect(check.isValid).to.equal(true);
      expect(check.isUsed).to.equal(false);
    });

    it("Should mark voucher as used after redemption", async function () {
      const { voucher, signature } = await createValidVoucher(user1.address);
      
      await redeemer.connect(user1).redeem(voucher, signature);
      
      const check = await redeemer.checkVoucher(voucher);
      expect(check.isUsed).to.equal(true);
      expect(check.isValid).to.equal(false);
    });
  });
});
