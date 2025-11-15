import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import EncryptionFlow from '@/components/EncryptionFlow';

export default function Prepare() {
  const router = useRouter();

  const handleSuccess = (txHash: string) => {
    setTimeout(() => {
      router.push('/status');
    }, 2000);
  };

  return (
    <>
      <Head>
        <title>Prepare Eligibility - ShadowBox</title>
      </Head>
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Check Your Eligibility</h1>
            <p className="text-dark-400">
              Prepare and submit your encrypted eligibility data to the ShadowBox contract
            </p>
          </div>

          <EncryptionFlow onSuccess={handleSuccess} />

          <div className="mt-8 bg-dark-800 rounded-lg p-6 border border-dark-700">
            <h3 className="text-lg font-bold text-white mb-4">What Happens Next?</h3>
            <ol className="space-y-3 text-dark-300">
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 bg-primary-600 text-white rounded-full text-center text-sm leading-6 mr-3 flex-shrink-0">1</span>
                <p>You'll be asked to sign a message to derive your encryption key (no gas cost)</p>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 bg-primary-600 text-white rounded-full text-center text-sm leading-6 mr-3 flex-shrink-0">2</span>
                <p>Your data is encrypted locally in your browser using this key</p>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 bg-primary-600 text-white rounded-full text-center text-sm leading-6 mr-3 flex-shrink-0">3</span>
                <p>The encrypted payload is submitted to the FHEVM smart contract</p>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 bg-primary-600 text-white rounded-full text-center text-sm leading-6 mr-3 flex-shrink-0">4</span>
                <p>The contract evaluates eligibility and generates an encrypted loot box</p>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-6 h-6 bg-primary-600 text-white rounded-full text-center text-sm leading-6 mr-3 flex-shrink-0">5</span>
                <p>You'll be redirected to the status page to view your results</p>
              </li>
            </ol>
          </div>
        </div>
      </Layout>
    </>
  );
}
