# ShadowBox Blueprint — Hybrid Private Airdrops on FHEVM

## 1. Problem & Goals

### 1.1 Problem
Traditional airdrops and rewards programs leak a lot of information:
- Raw balances, NFT holdings, interaction histories, and sybil scores are either public or easily inferred.
- Reward tiers and amounts are often deducible from on-chain actions.
- Eligibility logic is embedded in public smart contracts, making targeting strategies fully transparent.

### 1.2 Goals
ShadowBox aims to provide a **hybrid private airdrop** system where:
- **Eligibility inputs** (balances, NFT flags, interactions, sybil scores) are kept private.
- **Tier assignment** (Bronze / Silver / Gold) is computed under encryption.
- **Loot box contents and reward amounts** are encrypted on-chain.
- Only a minimal **eligibility boolean** (yes/no) and high-level metadata are public.
- Users can still redeem **real on-chain rewards (SHBX tokens)** via a clean UX.

Non-goals:
- General-purpose private DeFi; this is focused on eligibility + loot/rewards.
- Fully anonymous accounts; the design is wallet-based but privacy-preserving for metrics.

---

## 2. High-Level Architecture

### 2.1 Components

1. **Browser dapp (Next.js + AppKit + wagmi)**
   - React UI for preparing eligibility inputs, viewing status, decrypting loot, and claiming rewards.
   - Uses **@reown/appkit** + **wagmi** + **WalletConnect** for wallet connection.
   - Uses **@zama-fhe/relayer-sdk** to encrypt inputs client-side and generate proofs.

2. **FHEVM smart contracts (Hardhat + @fhevm/solidity)**
   - `ShadowBoxCore`: main FHE-enabled airdrop contract.
   - `Redeemer`: voucher-based rewards contract for SHBX token claims.

3. **Backend API (Next.js API route)**
   - `/api/issue-voucher`: issues signed vouchers based on decrypted tier.
   - Uses a server-side signer key to authorize reward claims on `Redeemer`.

4. **FHE coprocessor / relayer**
   - External FHE node+relayer accessed via RPC.
   - Provides encryption, proof generation, and user-bound FHE tokens.

### 2.2 Data Flow

```text
User Browser (AppKit + wagmi + relayer SDK)
   ▼
1. User prepares metrics and clicks "Encrypt & Submit".
2. Relayer SDK encrypts inputs and produces handles + proof.
3. Dapp calls `ShadowBoxCore.submitEligibility(handles, proof)`.

FHEVM + Contracts
   ▼
4. `ShadowBoxCore` reconstructs encrypted values and evaluates:
   - Encrypted eligibility
   - Encrypted tier
   - Encrypted loot index
   - Encrypted reward amount
5. Encrypted outputs are stored on-chain and emitted in events.

User Browser (Decryption)
   ▼
6. User visits `/decrypt`, signs to get user-bound FHE token.
7. Relayer decrypts encrypted outputs for this user.
8. UI shows tier, loot index, and SHBX reward amount.

Backend + Redeemer
   ▼
9. Dapp calls `/api/issue-voucher` with { address, tier }.
10. Backend signs a voucher and redeems it against `Redeemer`.
11. User calls `withdrawRewards()` to pull SHBX tokens.
```

---

## 3. On-Chain Data Model & Types

### 3.1 Eligibility Inputs (Encrypted)

All inputs are encrypted client-side and sent as external encrypted integers.

- **balance**
  - Type (frontend): string (wei, 18 decimals), then `BigInt`.
  - Type (FHEVM external): `externalEuint64`.
  - Semantics: scaled ETH or token balance.

- **nftFlags**
  - Type: `externalEuint32`.
  - Semantics: bitfield for ownership / properties (e.g. bit 0 == owns OG NFT).

- **interactions**
  - Type: `externalEuint32`.
  - Semantics: count of prior protocol interactions.

- **sybilScore**
  - Type: `externalEuint32` with implicit scale (0–10,000).
  - Semantics: lower is better, e.g. <= 5000 accepted.

### 3.2 Encrypted Outputs

Stored as `bytes32` representing FHE ciphertexts.

- `userEligibility[user]` — eligibility flag
  - Logical type: `ebool`.

- `userTier[user]` — Bronze / Silver / Gold tier
  - Logical type: `euint8` (`0`=Bronze, `1`=Silver, `2`=Gold).

- `userLootIndex[user]` — loot table index
  - Logical type: `euint32`.

- `userRewardAmount[user]` — SHBX reward amount
  - Logical type: `euint256` (scaled with 18 decimals).

### 3.3 Public Metadata

- `eligible` boolean (decrypted off-chain but can be inferred from events if desired).
- Submission timestamp.
- Transaction hash and block number.
- Cooldown-related metadata.

---

## 4. Smart Contract Design

### 4.1 ShadowBoxCore

**Responsibilities**
- Accept encrypted eligibility payloads + proofs.
- Evaluate eligibility and tier with FHE operations.
- Generate loot and encrypted reward amounts.
- Store encrypted results per user.
- Enforce cooldown between submissions.
- Expose view functions for encrypted outputs and public status.

**Key Functions (conceptual)**

- `submitEligibility(EncryptedPayload payload, bytes inputProof)`
  - Reconstructs internal encrypted values with `FHE.fromExternal(...)`.
  - Runs `_evaluateFHE(...)` to compute eligibility, tier, loot index, and reward amount.
  - Serializes results to `bytes32` and stores in mappings.
  - Grants decryption rights to contract + user.
  - Emits events for off-chain indexing.

- `getUserStatus(address user)` → `(bool submitted, uint256 lastSubmissionTime, bool canSubmitNow)`
  - Used by frontend to render status page.

- `getUserEligibility`, `getUserTier`, `getUserLootIndex`, `getUserRewardAmount`
  - Return encrypted `bytes32` blobs for relayer-side decryption.

**FHE Logic Sketch**

```text
Inputs (encrypted):
- balance_e: euint64
- nftFlags_e: euint32
- interactions_e: euint32
- sybilScore_e: euint32

Constants:
- threshold_balance = 0.25e18
- min_interactions = 3
- max_sybil_score = 5000

Eligibility (encrypted):
- hasBalance = (balance_e >= threshold_balance)
- hasNFT = ((nftFlags_e & 1) != 0)
- enoughInteractions = (interactions_e >= min_interactions)
- goodSybil = (sybilScore_e <= max_sybil_score)
- eligible_e = hasBalance & hasNFT & enoughInteractions & goodSybil

Tier (encrypted):
- balance_norm = balance_e / 1e18
- score = balance_norm * 20 + interactions_e * 5
- tier_e =
    if score >= 200 → Gold (2)
    else if score >= 100 → Silver (1)
    else → Bronze (0)

Loot & reward (encrypted):
- randomSeed = keccak256(block.timestamp, nonce, user)
- random_e = FHE.asEuint32(randomSeed)
- baseProbability = tier_e * 20 + 30
- isWinner_e = (random_e % 100) < baseProbability
- lootIndex_e = random_e % maxLootItems
- rewardAmount_e = select(isWinner_e, tierRewardAmount, 0)
```

All comparisons, arithmetic, and conditional logic are implemented using FHE primitives (`FHE.ge`, `FHE.le`, `FHE.and`, `FHE.select`, `FHE.rem`, `FHE.add`, etc.).

### 4.2 Redeemer

**Responsibilities**
- Hold SHBX rewards and release them based on signed vouchers.
- Prevent double-spending of vouchers.
- Allow users to withdraw accumulated rewards.

**Voucher Model (conceptual)**

```text
Voucher {
  user: address
  tier: uint8
  amount: uint256
  nonce: uint256
  expiry: uint256
}
```

- Vouchers are signed by a backend signer key.
- `Redeemer` verifies the signature and enforces:
  - Non-expired, non-reused voucher.
  - Correct signer (configurable by owner).

**Key Functions**
- `redeem(Voucher voucher, bytes signature)`
  - Validates signature.
  - Marks voucher as used.
  - Credits rewards to `voucher.user`.

- `withdrawRewards()`
  - Transfers any accumulated SHBX rewards to `msg.sender`.

- `checkVoucher(Voucher voucher)`
  - Read-only validation helper for UIs.

---

## 5. Frontend Design

### 5.1 Tech Stack

- **Next.js 16** (pages router) for app + API routes.
- **React 18**.
- **@reown/appkit** + **wagmi v2** + **viem** + **WalletConnect** for wallet connection and chain interaction.
- **ethers v6** for some contract calls and formatting.
- **TailwindCSS** for styling.
- **@tanstack/react-query** for stateful data fetching.
- **@zama-fhe/relayer-sdk** for FHE input encryption and user-bound token handling.

### 5.2 Key Screens

1. **Home**
   - Introduces ShadowBox.
   - Contains the AppKit connect button.

2. **Prepare (`/prepare`)**
   - User inputs metrics (balance, NFT flags, interactions, sybil score) or clicks **Generate Random**.
   - On **Encrypt & Submit**:
     - Signs a message for FHE encryption.
     - Relayer SDK encrypts inputs and returns handles + proof.
     - Dapp calls `ShadowBoxCore.submitEligibility(...)`.

3. **Status (`/status`)**
   - Shows list of submissions and their public status.
   - Provides link to **Decrypt** if eligible.

4. **Decrypt (`/decrypt`)**
   - Uses relayer to decrypt `userEligibility`, `userTier`, `userLootIndex`, and `userRewardAmount`.
   - Displays eligibility, tier (Bronze/Silver/Gold), loot index, and SHBX reward.
   - Shows **Claim Reward** button if eligible.

5. **Demo (`/demo`)**
   - Embeds demo video and explains end-to-end flow.

### 5.3 Wallet & Network Handling

- Networks configured via `@reown/appkit/networks` (e.g. Sepolia).
- AppKit handles WalletConnect, injected wallets, and connection state.
- wagmi config is created through `WagmiAdapter` and shared via `WagmiProvider`.

---

## 6. FHEVM Integration Details

### 6.1 Relayer SDK

The frontend uses Zama's relayer SDK for:
- Creating an encrypted input builder: `fhe.createEncryptedInput(contractAddress, userAddress)`.
- Adding values in clear (JS) form and getting encrypted handles.
- Producing an `inputProof` that the on-chain contract can verify.

The contract receives:
- `EncryptedPayload` with external encrypted handles.
- `inputProof` to validate correctness.

### 6.2 User-Bound Decryption Token

For decrypting outputs, the frontend obtains a **user-bound FHE token** from the relayer containing:
- `publicKey` / `privateKey` pair bound to the specific user & contract.
- `signature` from the relayer.
- Validity window (`startTimestamp`, `durationDays`).

Decryption flow:
1. User signs a message in their wallet.
2. Relayer issues a token for this user.
3. Frontend fetches encrypted outputs from `ShadowBoxCore`.
4. Frontend calls `fhe.userDecrypt(handles, token.privateKey, token.publicKey, token.signature, [contractAddress], userAddress, token.startTimestamp, token.durationDays)`.
5. SDK returns decrypted scalars for each handle.

### 6.3 Permissions & Access Control

- `ShadowBoxCore` grants decryption rights to:
  - Itself (for internal use).
  - The specific user address.
- This prevents arbitrary third parties from decrypting other users' results.

---

## 7. Security & Privacy Considerations

### 7.1 Privacy

- Inputs, tiers, loot indices, and reward amounts are **never stored in plaintext** on-chain.
- Eligibility logic runs entirely over encrypted types.
- Decryption happens on the client using user-bound tokens, reducing trust in third parties.

### 7.2 Smart Contract Security

Recommended measures before production:
- Full audit of `ShadowBoxCore` and `Redeemer`.
- Tight bounds on FHE parameters and integer ranges.
- Validation of relayer / FHE node assumptions.
- Rate limiting or additional cooldown logic if needed.

### 7.3 Backend Security

- Backend signer key must be stored securely (e.g. HSM, KMS, or environment with strict access controls).
- Voucher issuance logic must strictly validate:
  - On-chain eligibility (do not trust only client claims).
  - Tier constraints and maximum rewards.

---

## 8. Deployment & Environments

### 8.1 Contracts

- **Local (Hardhat)**
  - `npx hardhat node`
  - `npx hardhat run scripts/deploy.ts --network localhost`

- **Testnet (e.g. Sepolia)**
  - Configure `.env` with `PRIVATE_KEY` and `SEPOLIA_RPC_URL`.
  - `npm run compile`
  - `npm run deploy`

### 8.2 Frontend

- Local dev: `cd frontend && npm run dev --webpack`.
- Vercel deployment:
  - Root dir: `frontend/`.
  - Build command: `npm run build`.
  - Env vars: chain IDs, RPC URLs, WalletConnect project ID, contract addresses, backend signer key.

---

## 9. Roadmap & Extensions

Potential future improvements:
- Support for multiple reward tokens / NFT drops.
- More advanced sybil scoring inputs and off-chain attestations.
- Per-campaign configuration for thresholds and tiering logic.
- Better analytics that preserve privacy (aggregate stats over encrypted cohorts).
- Native mobile dapp integration via WalletConnect.

---

ShadowBox demonstrates how **FHEVM** can be used to build practical, privacy-preserving airdrops where both **eligibility logic** and **reward sizing** are hidden, while preserving a familiar Web3 UX for end users.