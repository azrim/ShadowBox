import { ethers } from "hardhat";
import { AbiCoder, keccak256, getBytes, parseEther } from "ethers";
import type { IRedeemer } from "../typechain-types";

async function main() {
  const redeemerAddress = process.env.REDEEMER_ADDRESS;
  const user = process.env.VOUCHER_USER;
  const amountHuman = process.env.VOUCHER_AMOUNT || "1000"; // in SHBX units

  if (!redeemerAddress) {
    throw new Error("REDEEMER_ADDRESS env var is required");
  }
  if (!user) {
    throw new Error("VOUCHER_USER env var is required");
  }

  const [signer] = await ethers.getSigners();
  console.log("Using signer:", signer.address);
  console.log("Redeemer:", redeemerAddress);
  console.log("Voucher user:", user);

  const amount = parseEther(amountHuman); // SHBX has 18 decimals
  const rewardType = 0n; // tokens
  const expiry = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60); // 7 days
  const voucherNonce = BigInt(Date.now()); // simple unique nonce based on timestamp

  const voucher: IRedeemer.VoucherStruct = {
    user,
    rewardType,
    amount,
    expiry,
    voucherNonce,
  };

  const abi = new AbiCoder();
  const encoded = abi.encode(
    ["address", "uint256", "uint256", "uint256", "uint256"],
    [voucher.user, voucher.rewardType, voucher.amount, voucher.expiry, voucher.voucherNonce]
  );
  const voucherHash = keccak256(encoded);

  console.log("Voucher hash:", voucherHash);

  const signature = await signer.signMessage(getBytes(voucherHash));
  console.log("Signature:", signature);

  const redeemer = (await ethers.getContractAt(
    "Redeemer",
    redeemerAddress,
    signer
  )) as unknown as IRedeemer;

  console.log("Calling redeem()...");
  const tx = await redeemer.redeem(voucher, signature);
  console.log("Redeem tx:", tx.hash);
  await tx.wait();
  console.log("Redeem confirmed.");

  const balance = await redeemer.rewardBalance(user);
  console.log("New rewardBalance for user:", balance.toString());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
