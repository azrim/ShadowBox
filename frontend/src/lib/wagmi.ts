import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { hardhat } from 'wagmi/chains';

const zamaTestnet = {
  id: 8009,
  name: 'Zama Devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ZAMA',
    symbol: 'ZAMA',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://devnet.zama.ai'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://devnet.zama.ai'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.zama.ai' },
  },
  testnet: true,
} as const;

export const config = getDefaultConfig({
  appName: 'ShadowBox',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [zamaTestnet, hardhat],
  transports: {
    [zamaTestnet.id]: http(),
    [hardhat.id]: http(),
  },
  ssr: false,
});

export { zamaTestnet };
