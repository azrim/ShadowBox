if (typeof window !== "undefined") {
  window.global = window;
}

import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { createAppKit } from "@reown/appkit/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { config, wagmiAdapter, projectId, networks } from "@/lib/wagmi";

const queryClient = new QueryClient();

// AppKit metadata
const metadata = {
  name: "ShadowBox",
  description: "Hybrid Private Airdrops on Zama FHEVM",
  url: "http://localhost:3000",
  icons: ["https://avatars.githubusercontent.com/u/37784886?s=200&v=4"],
};

let appKitInitialized = false;

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (appKitInitialized) return;
    if (typeof window === "undefined") return;

    const appKitNetworks = networks as unknown as [any, ...any[]];

    createAppKit({
      adapters: [wagmiAdapter],
      projectId,
      networks: appKitNetworks,
      metadata,
      features: {
        analytics: true,
      },
    });

    appKitInitialized = true;
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <>
          <Component {...pageProps} />
          <SpeedInsights />
        </>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
