import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "ShadowBox",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,

  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },

  ssr: false,
});

export { sepolia };
