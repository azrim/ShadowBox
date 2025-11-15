import { ethers } from "ethers";

export interface EligibilityPayload {
  balance: string;
  nftFlags: number;
  interactions: number;
  sybilScore: number;
  metaNonce: number;
}

export function createMockEligibilityPayload(): EligibilityPayload {
  return {
    balance: ethers.parseEther((Math.random() * 10).toFixed(4)).toString(),
    nftFlags: Math.floor(Math.random() * 8),
    interactions: Math.floor(Math.random() * 50),
    sybilScore: Math.floor(Math.random() * 10000),
    metaNonce: Math.floor(Date.now() / 1000),
  };
}
