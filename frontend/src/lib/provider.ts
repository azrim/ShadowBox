import { ethers } from "ethers";

// This provider is used for all read-only calls
export const rpcProvider = new ethers.JsonRpcProvider(
  process.env.NEXT_PUBLIC_RPC_URL!
);
