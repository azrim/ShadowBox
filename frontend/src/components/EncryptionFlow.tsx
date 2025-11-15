import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import {
  createMockEligibilityPayload,
  type EligibilityPayload,
} from "@/lib/crypto";
import { getShadowBoxContract } from "@/lib/contracts";
import { getFheInstance } from "@/lib/fhe";

interface EncryptionFlowProps {
  onSuccess?: (txHash: string) => void;
}

export default function EncryptionFlow({ onSuccess }: EncryptionFlowProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [payload, setPayload] = useState<EligibilityPayload>(
    createMockEligibilityPayload()
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"prepare" | "encrypt" | "submit" | "done">(
    "prepare"
  );
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setPayload(createMockEligibilityPayload());
  };

  const handleSubmit = async () => {
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    if (typeof window === "undefined" || !(window as any).ethereum) {
      setError("No injected wallet provider found in browser (window.ethereum is missing)");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStep("encrypt");

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contractAddress = process.env.NEXT_PUBLIC_SHADOWBOX_ADDRESS!;

      const fhe = await getFheInstance();

      const inputBuilder = fhe.createEncryptedInput(contractAddress, address);
      inputBuilder.add64(BigInt(payload.balance));
      inputBuilder.add32(payload.nftFlags);
      inputBuilder.add32(payload.interactions);
      inputBuilder.add32(payload.sybilScore);

      const { handles, inputProof } = await inputBuilder.encrypt();
      const encryptedPayload = {
        balance: handles[0],
        nftFlags: handles[1],
        interactions: handles[2],
        sybilScore: handles[3],
      };

      setStep("submit");
      const contract = getShadowBoxContract(contractAddress, signer);
      const txRequest = await contract.submitEligibility.populateTransaction(
        encryptedPayload,
        inputProof
      );

      txRequest.gasLimit = 600_000n;

      const tx = await signer.sendTransaction(txRequest);
      console.log("Submitted tx:", tx.hash);
      await tx.wait();

      if (onSuccess) onSuccess(tx.hash);
      setStep("done");
    } catch (err: any) {
      console.error("FHE encryption / submit error:", err);
      let message = err.message || "Submission failed";
      if (
        message.includes("FHE_NODE_NOT_CONNECTED") ||
        message.includes("HTTP request failed")
      ) {
        message =
          "Failed to connect to FHE coprocessor. Please check your RPC and network connection.";
      }
      setError(message);
      setStep("prepare");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepMessage = () => {
    switch (step) {
      case "encrypt":
        return "Encrypting your eligibility data & generating proof...";
      case "submit":
        return "Submitting to FHEVM... Please approve the transaction.";
      case "done":
        return "Successfully submitted! Check your status.";
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <h2 className="text-2xl font-bold text-white mb-6">
          Prepare Eligibility Data
        </h2>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Balance (ETH)
            </label>
            <input
              type="text"
              value={ethers.formatEther(payload.balance)}
              onChange={(e) =>
                setPayload({
                  ...payload,
                  balance: ethers.parseEther(e.target.value || "0").toString(),
                })
              }
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isProcessing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              NFT Flags (0–255)
            </label>
            <input
              type="number"
              value={payload.nftFlags}
              onChange={(e) =>
                setPayload({
                  ...payload,
                  nftFlags: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isProcessing}
              min="0"
              max="255"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Interactions
            </label>
            <input
              type="number"
              value={payload.interactions}
              onChange={(e) =>
                setPayload({
                  ...payload,
                  interactions: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isProcessing}
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Sybil Score (0–10000)
            </label>
            <input
              type="number"
              value={payload.sybilScore}
              onChange={(e) =>
                setPayload({
                  ...payload,
                  sybilScore: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isProcessing}
              min="0"
              max="10000"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleGenerate}
            disabled={isProcessing}
            className="px-6 py-2 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Random
          </button>

          <button
            onClick={handleSubmit}
            disabled={isProcessing || !address}
            className="flex-1 px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-500 hover:to-primary-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Encrypt & Submit"}
          </button>
        </div>

        {/* Step Message */}
        {getStepMessage() && (
          <div className="mt-4 p-4 bg-primary-900/20 border border-primary-500/30 rounded-lg">
            <p className="text-primary-400 text-sm">{getStepMessage()}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Note */}
        <div className="mt-6 p-4 bg-dark-700/50 rounded-lg">
          <p className="text-dark-400 text-sm">
            <strong>Privacy Note:</strong> Your data is encrypted locally before
            submission. Your eligibility, tier, and loot all remain encrypted
            on-chain.
          </p>
        </div>
      </div>
    </div>
  );
}
