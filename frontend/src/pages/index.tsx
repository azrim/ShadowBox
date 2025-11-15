import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";

export default function Home() {
  const { isConnected } = useAccount();
  const [isMounted, setIsMounted] = useState(false); // Add mounted state

  useEffect(() => setIsMounted(true), []); // Set mounted to true on client

  return (
    <>
      <Head>
        <title>ShadowBox - Hybrid Private Airdrops</title>
      </Head>
      <Layout>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 mb-6">
              ShadowBox
            </h1>
            <p className="text-2xl text-dark-300 mb-4">
              Hybrid Private Airdrops on Zama FHEVM
            </p>
            <p className="text-lg text-dark-400 max-w-3xl mx-auto mb-12">
              Privately prove eligibility, receive encrypted tier assignments,
              and open encrypted loot boxes—all without exposing your underlying
              data.
            </p>

            <div className="flex justify-center space-x-4 mb-16">
              {!isMounted ? null : isConnected ? (
                <>
                  <Link
                    href="/prepare"
                    className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-500 hover:to-primary-400 transition font-semibold text-lg"
                  >
                    Check Eligibility →
                  </Link>
                  <Link
                    href="/demo"
                    className="px-8 py-4 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition font-semibold text-lg"
                  >
                    View Demo
                  </Link>
                </>
              ) : (
                <div className="text-dark-400">
                  Connect your wallet to get started
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <div className="text-primary-400 mb-4">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Private Eligibility
              </h3>
              <p className="text-dark-400">
                Prove you're eligible without revealing your balance, NFTs, or
                transaction history. Only a boolean is exposed.
              </p>
            </div>

            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <div className="text-primary-400 mb-4">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Encrypted Tiers
              </h3>
              <p className="text-dark-400">
                Get assigned to Bronze, Silver, or Gold tiers through FHE
                computation. Your tier stays encrypted on-chain.
              </p>
            </div>

            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <div className="text-primary-400 mb-4">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Mystery Loot Boxes
              </h3>
              <p className="text-dark-400">
                Open encrypted loot boxes client-side to reveal tokens, NFTs, or
                vouchers. Decrypt with your wallet signature.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-900/20 to-primary-800/10 border border-primary-500/30 rounded-lg p-8 mb-20">
            <h2 className="text-2xl font-bold text-white mb-4">How It Works</h2>

            <div className="mb-4 text-sm text-dark-300">
              <p className="font-semibold text-white mb-1">Eligibility (roughly):</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Balance ≥ 0.25 ETH</li>
                <li>At least one NFT flag set (NFT flags is an odd number)</li>
                <li>Interactions ≥ 3</li>
                <li>Sybil score ≤ 0.5 (scaled as ≤ 5000 in the form)</li>
              </ul>
            </div>

            <ol className="space-y-4 text-dark-300">
              <li className="flex items-start">
                <span className="inline-block w-8 h-8 bg-primary-600 text-white rounded-full text-center leading-8 mr-4 flex-shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-white">Connect & Sign:</strong>{" "}
                  Connect your wallet and sign a message to derive an encryption
                  key locally.
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-8 h-8 bg-primary-600 text-white rounded-full text-center leading-8 mr-4 flex-shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-white">Encrypt Data:</strong> Your
                  eligibility data (balance, NFTs, interactions) is encrypted in
                  your browser.
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-8 h-8 bg-primary-600 text-white rounded-full text-center leading-8 mr-4 flex-shrink-0">
                  3
                </span>
                <div>
                  <strong className="text-white">FHE Evaluation:</strong> Submit
                  encrypted data to FHEVM. Smart contracts compute eligibility,
                  tier, and loot—all in encrypted form.
                </div>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-8 h-8 bg-primary-600 text-white rounded-full text-center leading-8 mr-4 flex-shrink-0">
                  4
                </span>
                <div>
                  <strong className="text-white">Decrypt & Claim:</strong> Fetch
                  your encrypted loot box and decrypt it locally. Redeem
                  vouchers for actual rewards.
                </div>
              </li>
            </ol>
          </div>

          <div className="text-center py-12 border-t border-dark-700">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to Try?
            </h2>
            <p className="text-dark-400 mb-8">
              Experience private, fair, and dynamic airdrops powered by Fully
              Homomorphic Encryption
            </p>
            {!isMounted ? (
              <p className="text-dark-500">
                Connect your wallet above to begin
              </p>
            ) : isConnected ? (
              <Link
                href="/prepare"
                className="inline-block px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-500 hover:to-primary-400 transition font-semibold text-lg"
              >
                Get Started →
              </Link>
            ) : (
              <p className="text-dark-500">
                Connect your wallet above to begin
              </p>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
