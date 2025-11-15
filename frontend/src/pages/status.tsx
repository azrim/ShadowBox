import Head from 'next/head';
import Layout from '@/components/Layout';
import StatusView from '@/components/StatusView';

export default function Status() {
  return (
    <>
      <Head>
        <title>Status - ShadowBox</title>
      </Head>
      <Layout>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Eligibility Status</h1>
          <p className="text-dark-400">
            View your eligibility submissions and decrypt your loot boxes
          </p>
        </div>

        <StatusView />
      </Layout>
    </>
  );
}
