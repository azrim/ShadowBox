import { ethers } from 'ethers';

export const SHADOWBOX_ABI = [
  "event EligibilityChecked(address indexed user, bool eligible, bytes tierCipher, bytes lootCipher, uint256 nonce)",
  "function submitEligibility(bytes calldata fhePayload) external",
  "function nonce() external view returns (uint256)",
  "function paused() external view returns (bool)",
  "function getUserStatus(address user) external view returns (bool submitted, uint256 lastSubmissionTime, bool canSubmitNow)",
  "function lastSubmission(address) external view returns (uint256)",
  "function hasSubmitted(address) external view returns (bool)",
];

export const REDEEMER_ABI = [
  "event VoucherRedeemed(address indexed user, uint256 rewardType, uint256 amount, bytes32 voucherHash)",
  "function redeem(tuple(address user, uint256 rewardType, uint256 amount, uint256 expiry, uint256 voucherNonce) voucher, bytes calldata signature) external",
  "function rewardBalance(address) external view returns (uint256)",
  "function withdrawRewards() external",
  "function checkVoucher(tuple(address user, uint256 rewardType, uint256 amount, uint256 expiry, uint256 voucherNonce) voucher) external view returns (bool isValid, bool isUsed)",
  "function usedVouchers(bytes32) external view returns (bool)",
  "function signer() external view returns (address)",
];

export function getShadowBoxContract(
  addressOrName: string,
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  return new ethers.Contract(addressOrName, SHADOWBOX_ABI, signerOrProvider);
}

export function getRedeemerContract(
  addressOrName: string,
  signerOrProvider: ethers.Signer | ethers.Provider
): ethers.Contract {
  return new ethers.Contract(addressOrName, REDEEMER_ABI, signerOrProvider);
}

export interface EligibilityCheckedEvent {
  user: string;
  eligible: boolean;
  tierCipher: string;
  lootCipher: string;
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
    eligible: event.args.eligible,
    tierCipher: event.args.tierCipher,
    lootCipher: event.args.lootCipher,
    nonce: event.args.nonce,
    transactionHash: event.transactionHash,
    blockNumber: event.blockNumber,
  }));
}

export async function waitForEligibilityEvent(
  contract: ethers.Contract,
  userAddress: string,
  timeoutMs: number = 60000
): Promise<EligibilityCheckedEvent> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      contract.off('EligibilityChecked', listener);
      reject(new Error('Timeout waiting for eligibility event'));
    }, timeoutMs);

    const listener = (user: string, eligible: boolean, tierCipher: string, lootCipher: string, nonce: bigint, event: any) => {
      if (user.toLowerCase() === userAddress.toLowerCase()) {
        clearTimeout(timer);
        contract.off('EligibilityChecked', listener);
        resolve({
          user,
          eligible,
          tierCipher,
          lootCipher,
          nonce,
          transactionHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
        });
      }
    };

    contract.on('EligibilityChecked', listener);
  });
}
