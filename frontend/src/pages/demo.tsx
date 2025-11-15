import Head from 'next/head';
import Layout from '@/components/Layout';

export default function Demo() {
  return (
    <>
      <Head>
        <title>Demo - ShadowBox</title>
      </Head>
      <Layout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Interactive Demo</h1>
          
          <div className="bg-dark-800 rounded-lg p-6 border border-dark-700 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Demo Video</h2>
            <div className="aspect-video bg-dark-700 rounded-lg flex items-center justify-center">
              <p className="text-dark-400">Demo video placeholder</p>
            </div>
            <p className="text-dark-400 mt-4">
              Watch how ShadowBox enables private airdrops using Fully Homomorphic Encryption
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <h3 className="text-xl font-bold text-white mb-4">Sample Scenario 1</h3>
              <div className="space-y-2 text-sm">
                <p className="text-dark-400">Input:</p>
                <ul className="list-disc list-inside text-dark-300 space-y-1">
                  <li>Balance: 5.25 ETH</li>
                  <li>NFTs: 3 holdings</li>
                  <li>Interactions: 42</li>
                  <li>Sybil Score: 0.12</li>
                </ul>
                <p className="text-green-400 font-semibold mt-3">Result: ✓ Eligible (Gold Tier)</p>
              </div>
            </div>

            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <h3 className="text-xl font-bold text-white mb-4">Sample Scenario 2</h3>
              <div className="space-y-2 text-sm">
                <p className="text-dark-400">Input:</p>
                <ul className="list-disc list-inside text-dark-300 space-y-1">
                  <li>Balance: 0.15 ETH</li>
                  <li>NFTs: 0 holdings</li>
                  <li>Interactions: 3</li>
                  <li>Sybil Score: 0.85</li>
                </ul>
                <p className="text-red-400 font-semibold mt-3">Result: ✗ Not Eligible</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-900/20 to-primary-800/10 border border-primary-500/30 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Privacy Guarantees</h3>
            <div className="space-y-3 text-dark-300">
              <div className="flex items-start">
                <span className="text-green-400 mr-3">✓</span>
                <div>
                  <strong className="text-white">What's Private:</strong> Balance, NFT holdings, interaction count, sybil scores—all encrypted
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-primary-400 mr-3">ℹ</span>
                <div>
                  <strong className="text-white">What's Public:</strong> Only an eligibility boolean (yes/no) is revealed on-chain
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-400 mr-3">✓</span>
                <div>
                  <strong className="text-white">Encrypted Outputs:</strong> Tier and loot box remain encrypted until you decrypt them locally
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href="/prepare"
              className="inline-block px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-500 hover:to-primary-400 transition font-semibold"
            >
              Try It Yourself →
            </a>
          </div>
        </div>
      </Layout>
    </>
  );
}
