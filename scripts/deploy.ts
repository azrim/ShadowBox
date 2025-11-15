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

  console.log("\nDeploying Redeemer...");
  const RedeemerFactory = await ethers.getContractFactory("Redeemer");
  const redeemer = await RedeemerFactory.deploy(deployer.address);
  await redeemer.waitForDeployment();
  const redeemerAddress = await redeemer.getAddress();
  console.log("✓ Redeemer deployed to:", redeemerAddress);

  console.log("\n" + "=".repeat(60));
  console.log("Deployment Summary");
  console.log("=".repeat(60));
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("\nContract Addresses:");
  console.log("  ShadowBoxCore:", shadowBoxAddress);
  console.log("  Redeemer:", redeemerAddress);
  console.log("  Voucher Signer:", deployer.address);
  console.log("\n" + "=".repeat(60));
  
  console.log("\nVerification commands:");
  console.log(`npx hardhat verify --network <network-name> ${shadowBoxAddress}`);
  console.log(`npx hardhat verify --network <network-name> ${redeemerAddress} "${deployer.address}"`);

  console.log("\nSave these addresses to your frontend .env file:");
  console.log(`NEXT_PUBLIC_SHADOWBOX_ADDRESS=${shadowBoxAddress}`);
  console.log(`NEXT_PUBLIC_REDEEMER_ADDRESS=${redeemerAddress}`);
  console.log(`VOUCHER_SIGNER_ADDRESS=${deployer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
