import { ethers } from "ethers";

export const SHADOWBOX_ABI = [
  "event EligibilityChecked(address indexed user, bytes32 eligibleCipher, uint256 nonce)",
  // Match the compiled Solidity ABI exactly: each externalEuintXX is encoded as bytes32
  "function submitEligibility(tuple(bytes32 balance, bytes32 nftFlags, bytes32 interactions, bytes32 sybilScore) fhePayload, bytes inputProof) external",
  "function nonce() external view returns (uint256)",
  "function paused() external view returns (bool)",
  "function getUserStatus(address user) external view returns (bool submitted, uint256 lastSubmissionTime, bool canSubmitNow)",
  "function getUserEligibility(address user) external view returns (bytes32)",
  "function getUserTier(address user) external view returns (bytes32)",
  "function getUserLootIndex(address user) external view returns (bytes32)",
  "function getUserRewardAmount(address user) external view returns (bytes32)",
];

export const REDEEMER_ABI = [
  "event VoucherRedeemed(address indexed user, uint256 rewardType, uint256 amount, bytes32 voucherHash)",
  "function redeem(tuple(address user, uint256 rewardType, uint256 amount, uint256 expiry, uint256 voucherNonce) voucher, bytes signature) external",
  "function rewardBalance(address) external view returns (uint256)",
  "function withdrawRewards() external",
  "function checkVoucher(tuple(address user, uint256 rewardType, uint256 amount, uint256 expiry, uint256 voucherNonce) voucher) external view returns (bool isValid, bool isUsed)",
  "function usedVouchers(bytes32) external view returns (bool)",
  "function signer() external view returns (address)",
];

export function getShadowBoxContract(
  addressOrName: string,
  signerOrProvider: ethers.Signer | ethers.Provider
) {
  return new ethers.Contract(addressOrName, SHADOWBOX_ABI, signerOrProvider);
}

export function getRedeemerContract(
  addressOrName: string,
  signerOrProvider: ethers.Signer | ethers.Provider
) {
  return new ethers.Contract(addressOrName, REDEEMER_ABI, signerOrProvider);
}

// ---------------------------------------------
// EVENT HELPERS
// ---------------------------------------------

export interface EligibilityCheckedEvent {
  user: string;
  eligibleCipher: string;
  nonce: bigint;
  transactionHash: string;
  blockNumber: number;
}

export async function getEligibilityEvents(
  contract: ethers.Contract,
  userAddress: string,
  fromBlock: number = 0
): Promise<EligibilityCheckedEvent[]> {
  const filter = contract.filters.EligibilityChecked(userAddress);
  const events = await contract.queryFilter(filter, fromBlock);

  return events.map((event: any) => ({
    user: event.args.user,
    eligibleCipher: event.args.eligibleCipher,
    nonce: event.args.nonce,
    transactionHash: event.transactionHash,
    blockNumber: event.blockNumber,
  }));
}
