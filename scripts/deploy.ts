import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  console.log("Deploying ShadowBoxCore...");
  const ShadowBoxFactory = await ethers.getContractFactory("ShadowBoxCore");
  const shadowBox = await ShadowBoxFactory.deploy();
  await shadowBox.waitForDeployment();
  const shadowBoxAddress = await shadowBox.getAddress();
  console.log("✓ ShadowBoxCore deployed to:", shadowBoxAddress);

  console.log("\nDeploying RewardToken (SHBX)...");
  const RewardTokenFactory = await ethers.getContractFactory("RewardToken");
  const initialSupply = ethers.parseEther("1000000"); // 1,000,000 SHBX
  const rewardToken = await RewardTokenFactory.deploy(initialSupply);
  await rewardToken.waitForDeployment();
  const rewardTokenAddress = await rewardToken.getAddress();
  console.log("✓ RewardToken deployed to:", rewardTokenAddress);

  console.log("\nDeploying Redeemer...");
  const RedeemerFactory = await ethers.getContractFactory("Redeemer");
  const redeemer = await RedeemerFactory.deploy(deployer.address, rewardTokenAddress);
  await redeemer.waitForDeployment();
  const redeemerAddress = await redeemer.getAddress();
  console.log("✓ Redeemer deployed to:", redeemerAddress);

  console.log("\nFunding Redeemer with SHBX rewards...");
  const fundAmount = ethers.parseEther("500000"); // 500k SHBX to Redeemer
  const fundTx = await rewardToken.transfer(redeemerAddress, fundAmount);
  await fundTx.wait();
  console.log("✓ Redeemer funded with", ethers.formatEther(fundAmount), "SHBX");

  console.log("\n" + "=".repeat(60));
  console.log("Deployment Summary");
  console.log("=".repeat(60));
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("\nContract Addresses:");
  console.log("  ShadowBoxCore:", shadowBoxAddress);
  console.log("  RewardToken:", rewardTokenAddress);
  console.log("  Redeemer:", redeemerAddress);
  console.log("  Voucher Signer:", deployer.address);
  console.log("\n" + "=".repeat(60));

  console.log("\nVerification commands:");
  console.log(`npx hardhat verify --network sepolia ${shadowBoxAddress}`);
  console.log(
    `npx hardhat verify --network sepolia ${rewardTokenAddress} "${initialSupply.toString()}"`
  );
  console.log(
    `npx hardhat verify --network sepolia ${redeemerAddress} "${deployer.address}" "${rewardTokenAddress}"`
  );

  console.log("\nSave these addresses to your frontend .env file:");
  console.log(`NEXT_PUBLIC_SHADOWBOX_ADDRESS=${shadowBoxAddress}`);
  console.log(`NEXT_PUBLIC_REWARD_TOKEN_ADDRESS=${rewardTokenAddress}`);
  console.log(`NEXT_PUBLIC_REDEEMER_ADDRESS=${redeemerAddress}`);
  console.log(`VOUCHER_SIGNER_ADDRESS=${deployer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
