import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import DecryptionFlow from '@/components/DecryptionFlow';

export default function Decrypt() {
  const router = useRouter();
  const { tx } = router.query;

  return (
    <>
      <Head>
        <title>Decrypt Loot - ShadowBox</title>
      </Head>
      <Layout>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Decrypt Your Loot Box</h1>
          <p className="text-dark-400">
            Use your wallet signature to decrypt your encrypted loot box locally
          </p>
        </div>

        <DecryptionFlow transactionHash={tx as string} />
      </Layout>
    </>
  );
}
