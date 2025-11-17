/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  reactStrictMode: true,

  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    if (!isServer) {
      config.resolve.fallback[
        "@react-native-async-storage/async-storage"
      ] = false;
    }

    // Ignore known circular dependency warnings from the relayer SDK
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /@zama-fhe\/relayer-sdk/,
        message: /Circular dependency/,
      },
    ];

    // ✅ Enable async WASM support for @zama-fhe/relayer-sdk/web
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    return config;
  },

  // ✅ Proxy to bypass CORS when calling the relayer
  async rewrites() {
    return [
      {
        source: "/api/relayer/:path*",
        destination: "https://relayer.testnet.zama.cloud/:path*",
      },
      {
        // Proxy FHE host chain RPC to avoid CORS issues in the browser
        // and route to the user-provided Sepolia RPC (e.g. Infura)
        source: "/api/fhe-rpc",
        destination: process.env.NEXT_PUBLIC_RPC_URL,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
