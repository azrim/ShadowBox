export interface ParsedError {
  raw: string;
  code?: string | number;
  friendly: string;
}

/**
 * Parse an error thrown by ethers / RPC / contract calls into
 * a raw string + a more user-friendly message. This is intentionally
 * simple string matching so it works in both browser and API routes.
 */
export function parseEthersError(err: any): ParsedError {
  if (!err) {
    return { raw: "", friendly: "Unknown error" };
  }

  const raw =
    err.message ||
    err.shortMessage ||
    (err.error && err.error.message) ||
    (typeof err === "string" ? err : "");

  const code = (err as any).code;

  let friendly = "Transaction failed";

  // Common wallet / RPC cases
  if (code === 4001 || raw.includes("ACTION_REJECTED")) {
    friendly = "Transaction was rejected in your wallet.";
  } else if (raw.includes("insufficient funds")) {
    friendly = "Insufficient funds to pay for gas.";
  }

  return { raw, code, friendly };
}

/** Map ShadowBoxCore revert reasons to UX copy. */
export function mapShadowBoxError(raw: string): string {
  if (!raw) return "Submission failed";

  if (raw.includes("SubmissionTooSoon") || raw.includes("errorName=SubmissionTooSoon")) {
    return "You are on cooldown and cannot submit again yet.";
  }
  if (raw.includes("ContractPaused") || raw.includes("errorName=ContractPaused")) {
    return "Submissions are currently paused by the contract admin.";
  }
  if (raw.includes("InvalidPayload") || raw.includes("errorName=InvalidPayload")) {
    return "The encrypted payload or proof was invalid. Please try again.";
  }
  if (raw.includes("FHE_NODE_NOT_CONNECTED") || raw.includes("HTTP request failed")) {
    return "Failed to connect to FHE coprocessor. Please check your RPC and network connection.";
  }

  return raw;
}

/** Map Redeemer revert reasons to UX copy. */
export function mapRedeemerError(raw: string): string {
  if (!raw) return "Failed to claim rewards";

  if (raw.includes("AlreadyClaimed") || raw.includes("errorName=AlreadyClaimed")) {
    return "You have already claimed your reward for this campaign.";
  }
  if (raw.includes("VoucherExpired") || raw.includes("errorName=VoucherExpired")) {
    return "This reward voucher has expired.";
  }
  if (raw.includes("VoucherAlreadyUsed") || raw.includes("errorName=VoucherAlreadyUsed")) {
    return "This voucher has already been used.";
  }
  if (raw.includes("ContractPaused") || raw.includes("errorName=ContractPaused")) {
    return "Rewards are temporarily paused by the contract admin.";
  }
  if (raw.includes("InsufficientRewards") || raw.includes("errorName=InsufficientRewards")) {
    return "No rewards are available to withdraw right now.";
  }

  return raw;
}
