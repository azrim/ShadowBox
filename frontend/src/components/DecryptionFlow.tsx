"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { getFheInstance, getToken } from "@/lib/fhe";
import { getShadowBoxContract } from "@/lib/contracts";
import { rpcProvider } from "@/lib/provider";

interface DecryptionFlowProps {
  transactionHash?: string;
}

export default function DecryptionFlow({
  transactionHash,
}: DecryptionFlowProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [lootData, setLootData] = useState<any>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEvent, setHasEvent] = useState(false);

  useEffect(() => {
    if (transactionHash && address) {
      setHasEvent(true);
    }
  }, [transactionHash, address]);

  const handleDecrypt = async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    if (typeof window === "undefined" || !(window as any).ethereum) {
      setError("No injected wallet provider found in browser (window.ethereum is missing)");
      return;
    }

    setIsDecrypting(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contractAddress = process.env.NEXT_PUBLIC_SHADOWBOX_ADDRESS!;

      const fhe = await getFheInstance();

      const contract = getShadowBoxContract(contractAddress, rpcProvider);

      const token = await getToken(contractAddress, provider);
      const encEligibilityBytes: string = await contract.getUserEligibility(address);
      const encTierBytes: string = await contract.getUserTier(address);
      const encLootIndexBytes: string = await contract.getUserLootIndex(address);
      const encRewardAmountBytes: string = await contract.getUserRewardAmount(address);

      const handles = [
        { handle: encEligibilityBytes, contractAddress },
        { handle: encTierBytes, contractAddress },
        { handle: encLootIndexBytes, contractAddress },
        { handle: encRewardAmountBytes, contractAddress },
      ];

      const decrypted = await fhe.userDecrypt(
        handles,
        token.privateKey,
        token.publicKey,
        token.signature,
        [contractAddress],
        address,
        token.startTimestamp,
        token.durationDays
      );

      const eligibleVal = decrypted[encEligibilityBytes];
      const tierVal = decrypted[encTierBytes];
      const lootIndexVal = decrypted[encLootIndexBytes];
      const rewardAmountVal = decrypted[encRewardAmountBytes];

      setLootData({
        eligible: Boolean(eligibleVal),
        tier: tierVal != null ? Number(tierVal) : 0,
        lootIndex: lootIndexVal != null ? Number(lootIndexVal) : 0,
        rewardAmount:
          rewardAmountVal != null
            ? ethers.formatEther(rewardAmountVal.toString())
            : "0",
      });
    } catch (err: any) {
      console.error("Decryption error:", err);
      let message = err.message || "Failed to decrypt loot";
      if (
        message.includes("FHE_NODE_NOT_CONNECTED") ||
        message.includes("HTTP request failed")
      ) {
        message = "Failed to connect to FHE coprocessor. Please try again.";
      }
      setError(message);
    } finally {
      setIsDecrypting(false);
    }
  };

  const getTierName = (tier: number) =>
    ["Bronze", "Silver", "Gold"][tier] || "Unknown";

  const getTierColor = (tier: number) =>
    ["text-orange-400", "text-gray-300", "text-yellow-400"][tier] ||
    "text-gray-400";

  const handleClaim = async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    if (!lootData || !lootData.eligible) {
      setError("No claimable reward available");
      return;
    }

    if (typeof window === "undefined" || !(window as any).ethereum) {
      setError(
        "No injected wallet provider found in browser (window.ethereum is missing)",
      );
      return;
    }

    try {
      setIsClaiming(true);
      setError(null);

      // 1) Ask backend to issue + redeem voucher for this user & tier
      const res = await fetch("/api/issue-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: address, tier: lootData.tier }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to issue voucher");
      }

      // 2) Withdraw credited rewards via Redeemer
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const redeemerAddress = process.env.NEXT_PUBLIC_REDEEMER_ADDRESS!;

      const { getRedeemerContract } = await import("@/lib/contracts");
      const redeemer = getRedeemerContract(redeemerAddress, signer);

      const tx = await redeemer.withdrawRewards();
      await tx.wait();
    } catch (err: any) {
      console.error("Claim error:", err);
      setError(err.message || "Failed to claim rewards");
    } finally {
      setIsClaiming(false);
    }
  };

  if (!hasEvent && !error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-dark-800 rounded-lg p-8 border border-dark-700 text-center">
          <p className="text-dark-400">Loading submission data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <h2 className="text-2xl font-bold text-white mb-6">
          Decrypt Your Loot Box
        </h2>

        {!lootData ? (
          <>
            <div className="mb-6 p-4 bg-dark-700/50 rounded-lg">
              <p className="text-dark-400 text-sm mb-2">
                Your encrypted loot is stored on-chain. You will be asked to
                sign a message to generate your decryption token.
              </p>
            </div>

            <button
              onClick={handleDecrypt}
              disabled={isDecrypting || !hasEvent || !walletClient}
              className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-500 hover:to-primary-400 transition disabled:opacity-50 font-semibold"
            >
              {isDecrypting ? "Decrypting..." : "Decrypt Loot Box"}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bg-dark-700 rounded-lg p-6 border border-dark-600">
              <h3 className="text-xl font-bold text-white mb-4">
                🎉 Loot Unlocked{" "}
                {lootData.eligible && `(${getTierName(lootData.tier)})`}
              </h3>

              <p
                className={`font-semibold ${
                  lootData.eligible ? "text-green-400" : "text-red-400"
                } mb-2`}
              >
                Eligibility:{" "}
                {lootData.eligible ? "✓ Eligible" : "✗ Not Eligible"}
              </p>
              {lootData.eligible && (
                <>
                  <p
                    className={`font-semibold ${getTierColor(
                      lootData.tier,
                    )} mb-2`}
                  >
                    Tier: {getTierName(lootData.tier)}
                  </p>
                  <p className="text-white mb-2">
                    Reward Amount: {lootData.rewardAmount} SHBX
                  </p>
                  <p className="text-white mb-4">
                    Loot Index: {lootData.lootIndex}
                  </p>

                  <button
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition disabled:opacity-50"
                  >
                    {isClaiming ? "Claiming..." : "Claim Reward"}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
