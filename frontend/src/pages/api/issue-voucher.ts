import type { NextApiRequest, NextApiResponse } from "next";
import { AbiCoder, Contract, JsonRpcProvider, Wallet, keccak256, getBytes, parseEther } from "ethers";

// This API runs server-side (Vercel function or local dev), so it can safely
// use a private key from env to sign vouchers.

const REDEEMER_ADDRESS = process.env.NEXT_PUBLIC_REDEEMER_ADDRESS || process.env.REDEEMER_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL;
const SIGNER_PRIVATE_KEY = process.env.VOUCHER_SIGNER_PRIVATE_KEY; // DO NOT expose to client

// Simple ABI fragment for Redeemer.redeem and rewardBalance
const REDEEMER_ABI = [
  "function redeem((address user,uint256 rewardType,uint256 amount,uint256 expiry,uint256 voucherNonce) voucher, bytes signature) external",
  "function rewardBalance(address) view returns (uint256)",
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!REDEEMER_ADDRESS || !RPC_URL || !SIGNER_PRIVATE_KEY) {
      return res.status(500).json({ error: "Server misconfigured: missing env vars" });
    }

    const { user, tier } = req.body as { user?: string; tier?: number };

    if (!user || typeof user !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'user'" });
    }

    // Map tier -> SHBX amount (you can tune these)
    const tierNum = Number(tier ?? 0);
    let amountHuman = "0";
    if (tierNum === 2) amountHuman = "1000"; // Gold
    else if (tierNum === 1) amountHuman = "500"; // Silver
    else if (tierNum === 0) amountHuman = "100"; // Bronze

    if (amountHuman === "0") {
      return res.status(400).json({ error: "No reward for this tier" });
    }

    const provider = new JsonRpcProvider(RPC_URL);
    const wallet = new Wallet(SIGNER_PRIVATE_KEY, provider);
    const redeemer = new Contract(REDEEMER_ADDRESS, REDEEMER_ABI, wallet);

    const amount = parseEther(amountHuman); // SHBX uses 18 decimals
    const rewardType = 0n; // token reward
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60); // 7 days
    const voucherNonce = BigInt(Date.now());

    const voucher = {
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

    const signature = await wallet.signMessage(getBytes(voucherHash));

    // Call redeem to credit rewardBalance[user]
    const tx = await redeemer.redeem(voucher, signature);
    await tx.wait();

    const balance: bigint = await redeemer.rewardBalance(user);

    return res.status(200).json({
      ok: true,
      txHash: tx.hash,
      rewardBalance: balance.toString(),
      amount: amount.toString(),
    });
  } catch (err: any) {
    console.error("issue-voucher error:", err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
