# ShadowBox — Hybrid Private Airdrops

> **Hybrid private airdrops**: private eligibility + private tier assignment + encrypted loot boxes using FHEVM.

ShadowBox demonstrates private eligibility, private tier assignment, and encrypted loot boxes using Fully Homomorphic Encryption on FHEVM. Users keep their eligibility data private; the contract learns only `eligible` + an encrypted reward blob. Decryption happens client-side after eligibility is confirmed.

## 🌐 Live Demo

- Live dapp: https://shadow-box-beta.vercel.app
- Demo video: available on the `/demo` page (both locally and on the live dapp).

## 🎯 What It Does

- **Private Eligibility Evaluation**: Users submit encrypted data (balance, NFT holdings, interactions, sybil scores)
- **Encrypted Tier Assignment**: Smart contracts compute tier (Bronze/Silver/Gold) without seeing inputs
- **Encrypted Loot Boxes**: On-chain generation of encrypted reward packages
- **Client-Side Decryption**: Users decrypt their rewards locally using wallet-derived keys
- **Voucher Redemption**: Optional token claim system with voucher validation

## 🏗️ Architecture

The system has three main parts: the browser dapp, the FHEVM smart contracts, and the voucher-based reward path.

```text
┌─────────────────────────────────────────────────────────────────┐
│                         Browser dapp                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Connect wallet via AppKit + wagmi                     │  │
│  │ 2. Build eligibility payload in React UI                 │  │
│  │ 3. Encrypt inputs with Zama FHE relayer SDK              │  │
│  │ 4. Submit encrypted payload + proof to FHEVM             │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FHEVM smart contracts                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ShadowBoxCore                                            │  │
│  │   ├─ Evaluate eligibility (encrypted)                    │  │
│  │   ├─ Assign tier (Bronze/Silver/Gold under FHE)          │  │
│  │   └─ Generate encrypted loot + reward amount             │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Redeemer                                                 │  │
│  │   ├─ Accept signed vouchers from backend                 │  │
│  │   └─ Allow users to withdraw SHBX rewards                │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Browser dapp                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 5. Fetch encrypted outputs via RPC/events                │  │
│  │ 6. Decrypt locally with user-bound FHE token             │  │
│  │ 7. Call backend API to issue voucher + redeem on-chain   │  │
│  │ 8. Withdraw SHBX via Redeemer contract                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Project Structure

```text
ShadowBox/
├── contracts/                  # Solidity smart contracts
│   ├── Redeemer.sol           # Voucher-based reward contract
│   ├── RewardToken.sol        # ERC20 SHBX reward token
│   ├── ShadowBoxCore.sol      # Main FHE eligibility + loot contract
│   └── interfaces/
│       └── IRedeemer.sol      # Redeemer interface
├── fhe-circuits/              # FHE circuit configs (mirrors on-chain logic)
│   ├── eligibility.fhe        # Eligibility checks
│   ├── loot.fhe               # Loot & reward generation
│   └── tier.fhe               # Tier scoring
├── scripts/                   # Hardhat scripts
│   ├── deploy.ts              # Deploy ShadowBoxCore, RewardToken, Redeemer
│   ├── issueVoucher.ts        # (Optional) local voucher issuance helper
│   └── seedLoot.ts            # Seed loot configuration / rewards
├── test/                      # Contract tests
│   ├── eligibility.test.ts    # ShadowBoxCore tests
│   └── redeem.test.ts         # Redeemer + RewardToken tests
├── frontend/                  # Next.js dapp (AppKit + wagmi + relayer SDK)
│   ├── next.config.js
│   ├── public/
│   │   ├── favicon.ico
│   │   └── shadowbox-demo.webm
│   └── src/
│       ├── components/        # React UI (EncryptionFlow, DecryptionFlow, etc.)
│       ├── data/              # Static content / copy
│       ├── lib/               # Contracts, FHE helpers, error helpers, providers
│       ├── pages/             # /, /prepare, /status, /decrypt, /demo, API routes
│       ├── styles/            # Tailwind base styles
│       ├── types/             # Shared TS types
│       └── utils/             # Frontend utilities
├── typechain-types/           # TypeScript bindings for contracts
├── .github/                   # Contributing docs, issue and PR templates
├── hardhat.config.ts          # Hardhat configuration
├── package.json               # Root dependencies & scripts
├── SHADOWBOX_BLUEPRINT.md     # Detailed architectural blueprint
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- npm or yarn
- MetaMask or compatible wallet

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ShadowBox

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Configure Environment

```bash
# Root .env
cp .env.example .env
# Edit .env with your private key and RPC URL

# Frontend .env
cd frontend
cp .env.example .env.local
# Edit .env.local with contract addresses after deployment
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm run test
```

You should see output similar to:
```text
  ShadowBoxCore - Tests
    Deployment
      ✓ Should set the correct owner
      ✓ Should initialize with nonce 0
      ✓ Should not be paused initially
    Pause Functionality
      ✓ Should allow owner to pause and unpause
      ✓ Should emit ConfigUpdated event when paused/unpaused
      ✓ Should revert submissions when paused
      ✓ Should not allow non-owner to pause
    User Status
      ✓ Should return correct status for new user
      ✓ Should return correct status when paused
    Eligibility Submission (FHE)
      ✓ Should revert if inputProof is empty
      - Should allow a user to submit eligibility
      - Should enforce cooldown between submissions
      - Should allow submission after cooldown period

  Redeemer - Voucher Tests
    Deployment
      ✓ Should set the correct signer
      ✓ Should set the correct owner
      ✓ Should not be paused initially
    Voucher Creation and Redemption
      ✓ Should allow redeeming valid voucher
      ✓ Should update reward balance after redemption
      ✓ Should reject already used voucher
      ✓ Should reject expired voucher
      ✓ Should reject voucher with invalid signature
    Reward Withdrawal
      ✓ Should allow user to withdraw rewards
      ✓ Should revert withdrawal with no rewards
    Admin Functions
      ✓ Should allow owner to update signer
      ✓ Should not allow non-owner to update signer
      ✓ Should allow owner to pause
      ✓ Should reject redemptions when paused
    Voucher Validation
      ✓ Should correctly check voucher validity
      ✓ Should mark voucher as used after redemption

  26 passing
  3 pending
```

> Note: the pending tests correspond to FHEVM-dependent flows that require a live FHE node; they are intentionally marked with `it.skip`.

### Deploy Contracts

```bash
# Deploy to local Hardhat network
npm run node          # In one terminal
npm run deploy        # In another terminal (uses default network config)

# Or deploy directly to Sepolia (configured in hardhat.config.ts)
npm run deploy
```

Save the deployed contract addresses to `frontend/.env.local`:
```
NEXT_PUBLIC_SHADOWBOX_ADDRESS=0x...
NEXT_PUBLIC_REWARD_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_REDEEMER_ADDRESS=0x...
```

### Run Frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎮 Usage Flow

### 1. Connect Wallet
Visit the homepage and connect your wallet using the AppKit-powered connect button (wagmi + WalletConnect under the hood).

### 2. Prepare Eligibility Data
Navigate to `/prepare` and either:
- Use the "Generate Random" button for demo data
- Manually enter your eligibility metrics

### 3. Encrypt & Submit
Click "Encrypt & Submit":
1. Sign a message in your wallet to authorize FHE encryption
2. The frontend uses the Zama FHE relayer SDK to encrypt your inputs and generate a proof
3. The encrypted payload + proof is submitted to the `ShadowBoxCore` contract
4. Wait for the FHEVM transaction confirmation

### 4. Check Status
Visit `/status` to view your submissions. You'll see:
- Eligibility result (✓ Eligible or ✗ Not Eligible)
- Transaction hash and block number
- Decrypt button (for eligible submissions)

### 5. Decrypt Loot
Click "Decrypt Loot Box":
1. Sign the same message to re-derive your key
2. Fetch encrypted loot from contract events
3. Decrypt locally to reveal your rewards

### 6. Redeem Voucher
If you received a voucher, use the redeem flow to claim your tokens:
- The frontend calls the backend `/api/issue-voucher` route with your address and tier
- The backend issues and redeems a signed voucher against the `Redeemer` contract
- You then call `withdrawRewards()` from the dapp to pull SHBX tokens to your wallet

## 🔐 Privacy Guarantees

### What's Private (Encrypted On-Chain)
- ✅ Eligibility inputs (balance, NFT flags, interaction counts, sybil scores)
- ✅ Assigned tier (Bronze/Silver/Gold)
- ✅ Loot box index and reward amount (SHBX)
- ✅ All intermediate scoring and randomness inside `_evaluateFHE`
- ✅ Decrypted tier/loot/reward values (only revealed in the user’s browser)

### What's Public
- ℹ️ Your wallet address and that you interacted with the contracts
- ℹ️ Existence and timing of an eligibility submission (events + block timestamp)
- ℹ️ Transaction hashes and gas usage
- ℹ️ That a reward was claimed (Redeemer events and SHBX transfers)

### Key & Relayer Security
- 🔑 Wallet private keys never leave the wallet provider (AppKit / injected wallet)
- 🔑 Eligibility inputs are encrypted via the Zama FHE relayer SDK before they hit the FHEVM contract
- 🔑 Decryption of outputs uses user-bound FHE tokens and happens in the browser
- 🔑 Backend voucher API only sees your address and tier, never raw eligibility metrics or FHE secrets

## 🧠 Detailed Design & FHEVM Integration

### 1. Project Summary

ShadowBox is a hybrid private airdrop system built on Zama FHEVM. Users prove eligibility for a rewards program by submitting encrypted on-chain metrics—balance, NFT flags, interaction counts, and sybil scores—without revealing any of these values to the contracts or other users. The contracts only learn a minimal eligibility flag and store all other computed results (tier, loot index, reward amount) as ciphertext.

On top of this encrypted eligibility pipeline, ShadowBox adds an encrypted tier and loot system and a token-based reward claim path. Users decrypt their loot locally in the browser using keys derived from their wallet signatures, then claim SHBX reward tokens via a voucher-based Redeemer contract. The end result is a fully on-chain airdrop flow where scoring and reward sizing happen under FHE, while the UX still feels like a standard Web3 dapp.

### 2. FHEVM Integration

**Encrypted data & results**
- Inputs encrypted client-side:
  - Balance (scaled 18-decimals, euint64)
  - NFT flags bitfield (euint32)
  - Interaction count (euint32)
  - Sybil score (scaled 0–10,000, euint32)
- On-chain FHE-computed outputs stored encrypted:
  - Eligibility boolean (`ebool` → `bytes32`)
  - Tier (0/1/2 as `euint8` → `bytes32`)
  - Loot index (`euint32` → `bytes32`)
  - Reward amount (`euint256` → `bytes32`, interpreted as SHBX amount)

**How `@fhevm/solidity` is used**
- `ShadowBoxCore` now inherits `ZamaEthereumConfig` and uses `FHE`/`FheType` primitives from `@fhevm/solidity` plus `externalEuintXX` handles from `encrypted-types`.
- `submitEligibility` takes an `EncryptedPayload` made of external encrypted integers and an `inputProof`, then reconstructs internal encrypted values using `FHE.fromExternal(...)`.
- The `_evaluateFHE` helper performs all logic over encrypted types:
  - Eligibility checks with `FHE.ge`, `FHE.le`, `FHE.and`, `FHE.ne`.
  - Tier scoring with encrypted arithmetic and nested `FHE.select` calls.
  - Loot randomness using an encrypted random seed derived from `keccak256(block.timestamp, nonce, msg.sender)` and `FHE.rem`/`FHE.add`.
- After computing encrypted results, the contract grants decryption rights (`FHE.allowThis`, `FHE.allow`) to itself and the user, and serializes each encrypted value into `bytes32` via `FHE.toBytes32(...)` for storage.

**How circuits map to Solidity**
- `fhe-circuits/eligibility.fhe` mirrors `_evaluateFHE` eligibility:
  - `threshold_balance = 0.25e18`, `min_interactions = 3`, `max_sybil_score = 5000`, and checks `(balance >= threshold_balance) & ((nftFlags & 1) != 0) & (interactions >= min_interactions) & (sybilScore <= max_sybil_score)`.
- `fhe-circuits/tier.fhe` mirrors the tier score:
  - `balance_norm = balance / 1e18`
  - `score = balance_norm * 20 + interactions * 5`
  - Gold if `score >= 200`, Silver if `score >= 100`, else Bronze.
- `fhe-circuits/loot.fhe` mirrors loot generation:
  - `randomValue = (randomSeed + nonce) % 100`
  - `baseProbability = tier * 20 + 30`
  - Winner if `randomValue < baseProbability`.
  - Loot index is `randomSeed % max_loot_items`, reward amount is `100 / 500 / 1000 * 1e18` tokens gated by `isWinner`.

### 3. How to Run

**Local dev (contracts + frontend)**
1. Install dependencies:
   ```bash
   git clone <your-repo-url>
   cd ShadowBox
   npm install
   cd frontend && npm install && cd ..
   ```
2. Configure root `.env` (for Hardhat Sepolia deploy):
   ```bash
   cp .env.example .env
   # Edit .env with:
   #   PRIVATE_KEY=<sepolia deployer private key>
   #   SEPOLIA_RPC_URL=<your Sepolia RPC URL>
   ```
3. Compile & deploy contracts to Sepolia:
   ```bash
   npm run compile
   npm run deploy
   # Save the printed ShadowBoxCore, RewardToken, Redeemer addresses
   ```
4. Configure frontend `.env.local`:
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local with values from deploy output:
   #   NEXT_PUBLIC_SHADOWBOX_ADDRESS=<ShadowBoxCore>
   #   NEXT_PUBLIC_REWARD_TOKEN_ADDRESS=<RewardToken>
   #   NEXT_PUBLIC_REDEEMER_ADDRESS=<Redeemer>
   #   NEXT_PUBLIC_CHAIN_ID=11155111
   #   NEXT_PUBLIC_RPC_URL=<your Sepolia RPC URL>
   #   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<WalletConnect project id>
   # Server-only envs for API route:
   #   RPC_URL=<same Sepolia RPC URL>
   #   REDEEMER_ADDRESS=<Redeemer>
   #   VOUCHER_SIGNER_PRIVATE_KEY=<same key used as signer/deployer>
   ```
5. Run the app locally:
   ```bash
   # from frontend/
   npm run dev --webpack
   # open http://localhost:3000
   ```

**Vercel deployment (frontend only)**
- Root directory: `frontend/`.
- Build command: `npm run build`.
- Env vars in Vercel:
  - `NEXT_PUBLIC_SHADOWBOX_ADDRESS`, `NEXT_PUBLIC_REWARD_TOKEN_ADDRESS`, `NEXT_PUBLIC_REDEEMER_ADDRESS`
  - `NEXT_PUBLIC_CHAIN_ID=11155111`
  - `NEXT_PUBLIC_RPC_URL=<Sepolia RPC>`
  - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your project id>`
  - `RPC_URL=<same Sepolia RPC>`
  - `REDEEMER_ADDRESS=<Redeemer address>`
  - `VOUCHER_SIGNER_PRIVATE_KEY=<signer private key>`

### 4. Deployed Addresses (Sepolia)

> NOTE: replace with the latest values from your most recent `npm run deploy` output.

- `ShadowBoxCore`: `0xE3255bdCf40F0BB4dCd5E8e7b2871833a5D19493`
- `RewardToken (SHBX)`: `0x099a122bE76c64BB8B71E26c30E47825e91E1557`
- `Redeemer`: `0xC9De8A814cCcA8ce752253a5193AAD48d3DCB4f0`

### 5. User Flow (Demo)

1. **Connect Wallet** – Open the app, connect a Sepolia wallet via AppKit/wagmi.
2. **Prepare** – Go to `/prepare` and set eligibility inputs (balance, NFT flags, interactions, sybil score) or use the random generator.
3. **Submit (FHE)** – Click **Encrypt & Submit**; the frontend derives a key from a wallet signature, encrypts inputs via the FHE relayer SDK, and calls `ShadowBoxCore.submitEligibility` with encrypted payload + proof.
4. **Status** – Visit `/status` to see your submissions and on-chain `EligibilityChecked` events.
5. **Decrypt** – Go to `/decrypt` (or via the status link), re-sign to re-derive the key, fetch encrypted outputs (`userEligibility`, `userTier`, `userLootIndex`, `userRewardAmount`), and decrypt locally to reveal tier, loot index, and SHBX reward.
6. **Claim Reward** – Click **Claim Reward** to trigger the backend `/api/issue-voucher` route (which issues and redeems a signed voucher based on your tier) and then call `Redeemer.withdrawRewards()` from the browser, transferring SHBX tokens to your wallet.

## 🧪 Testing

Most of the suite runs entirely against Hardhat locally. A small number of FHEVM-dependent tests are skipped by default.

### Run All Tests
```bash
npm run test
```

### Run Specific Tests
```bash
npx hardhat test test/eligibility.test.ts
npx hardhat test test/redeem.test.ts
```

### Coverage
```bash
npx hardhat coverage
```

## 📝 Smart Contract API

### ShadowBoxCore

**submitEligibility(bytes fhePayload)**
- Submit encrypted eligibility data
- Emits `EligibilityChecked` event with encrypted tier and loot
- Enforces 1-hour cooldown between submissions

**getUserStatus(address user)**
- View user's submission status
- Returns: (submitted, lastSubmissionTime, canSubmitNow)

**setPaused(bool)**
- Owner-only function to pause/unpause submissions

### Redeemer

**redeem(Voucher voucher, bytes signature)**
- Redeem a signed voucher for rewards
- Validates signature against authorized signer
- Prevents double-spending

**withdrawRewards()**
- Withdraw accumulated rewards to your wallet

**checkVoucher(Voucher voucher)**
- Check if a voucher is valid and unused

## 🌐 Deployment

### Local Development
```bash
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost
```

### Zama Testnet
```bash
npx hardhat run scripts/deploy.ts --network zama-testnet
```

### Frontend (Vercel)
```bash
cd frontend
vercel deploy
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SHADOWBOX_ADDRESS`
- `NEXT_PUBLIC_REDEEMER_ADDRESS`
- `NEXT_PUBLIC_RPC_URL`

## 🛠️ Tech Stack

### Smart Contracts
- Solidity ^0.8.24
- Hardhat
- OpenZeppelin Contracts
- Zama FHEVM SDK

### Frontend
- Next.js 16 (pages router)
- React 18
- TypeScript
- TailwindCSS
- @reown/appkit + wagmi v2 + viem + WalletConnect
- @tanstack/react-query
- ethers v6
- @zama-fhe/relayer-sdk (FHE encryption + proofs)

### Testing
- Hardhat Toolbox
- Chai assertions
- TypeScript

## 📋 Development Checklist

- [x] Smart contracts implemented
- [x] Mock FHE harness for testing
- [x] Comprehensive test suite
- [x] Deployment scripts
- [x] Frontend with wallet integration
- [x] Key derivation and encryption
- [x] Event listening and status tracking
- [x] Decryption flow
- [x] Vercel configuration
- [ ] Production FHE integration
- [x] Demo video (embedded on `/demo` page)
- [x] Live deployment (`https://shadow-box-beta.vercel.app`)

## 🤝 Contributing

This is currently a demo project. For improvements:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Live dapp**: https://shadow-box-beta.vercel.app
- **Documentation**: [Blueprint](./SHADOWBOX_BLUEPRINT.md)
- **Zama Docs**: https://docs.zama.ai
- **FHEVM**: https://github.com/zama-ai/fhevm

## ⚠️ Disclaimer

This is a proof-of-concept for educational purposes. The FHE integration uses a mock harness for local development. Production deployment requires proper FHEVM integration and security audits.

**DO NOT USE WITH REAL FUNDS WITHOUT PROPER AUDITS**

