import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import {
  getShadowBoxContract,
  getEligibilityEvents,
  type EligibilityCheckedEvent,
} from "@/lib/contracts";
import { rpcProvider } from "@/lib/provider";

export default function StatusView() {
  const { address } = useAccount();

  const [events, setEvents] = useState<EligibilityCheckedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      loadEvents();
    }
  }, [address]);

  const loadEvents = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const contractAddress = process.env.NEXT_PUBLIC_SHADOWBOX_ADDRESS!;
      const fromBlock = Number(process.env.NEXT_PUBLIC_DEPLOY_BLOCK || 0);

      const contract = getShadowBoxContract(contractAddress, rpcProvider);

      const userEvents = await getEligibilityEvents(
        contract,
        address,
        fromBlock
      );

      setEvents(userEvents.reverse());
    } catch (err: any) {
      console.error("Error loading events:", err);
      setError(err.message || "Failed to load eligibility events");
    } finally {
      setIsLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-dark-800 rounded-lg p-8 border border-dark-700 text-center">
          <p className="text-dark-400">
            Please connect your wallet to view your eligibility status
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            Your Eligibility Status
          </h2>
          <button
            onClick={loadEvents}
            disabled={isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {events.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-dark-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p>No eligibility submissions found</p>
            </div>
            <a
              href="/prepare"
              className="text-primary-400 hover:text-primary-300 transition"
            >
              Submit your first eligibility check →
            </a>
          </div>
        )}

        <div className="space-y-4">
          {events.map((event, index) => (
            <div
              key={`${event.transactionHash}-${index}`}
              className="bg-dark-700/50 rounded-lg p-4 border border-dark-600"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-900/30 text-blue-400 border border-blue-500/30`}
                  >
                    Submission Received
                  </span>
                </div>
                <span className="text-dark-400 text-sm">
                  Block #{event.blockNumber}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-dark-400 mb-1">Nonce</p>
                  <p className="text-white font-mono">
                    {event.nonce.toString()}
                  </p>
                </div>
                <div>
                  <p className="text-dark-400 mb-1">Transaction</p>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${event.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 font-mono text-xs break-all"
                  >
                    {event.transactionHash.slice(0, 10)}...
                    {event.transactionHash.slice(-8)}
                  </a>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-600">
                <p className="text-dark-400 text-sm mb-2">
                  Encrypted Eligibility:
                </p>
                <p className="text-dark-300 font-mono text-xs break-all">
                  {event.eligibleCipher.slice(0, 40)}...
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-dark-600">
                <a
                  href={`/decrypt?tx=${event.transactionHash}`}
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition"
                >
                  Decrypt Loot Box →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
