# ShadowBox — Hybrid Private Airdrops

> **Hybrid private airdrops**: private eligibility + private tier assignment + encrypted loot boxes using FHEVM.

ShadowBox demonstrates private eligibility, private tier assignment, and encrypted loot boxes using Fully Homomorphic Encryption on FHEVM. Users keep their eligibility data private; the contract learns only `eligible` + an encrypted reward blob. Decryption happens client-side after eligibility is confirmed.

## 🎯 What It Does

- **Private Eligibility Evaluation**: Users submit encrypted data (balance, NFT holdings, interactions, sybil scores)
- **Encrypted Tier Assignment**: Smart contracts compute tier (Bronze/Silver/Gold) without seeing inputs
- **Encrypted Loot Boxes**: On-chain generation of encrypted reward packages
- **Client-Side Decryption**: Users decrypt their rewards locally using wallet-derived keys
- **Voucher Redemption**: Optional token claim system with voucher validation

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Derive key from wallet signature (HKDF-SHA256)        │  │
│  │ 2. Encrypt eligibility data (libsodium)                  │  │
│  │ 3. Submit encrypted payload to FHEVM                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FHEVM Smart Contracts                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ShadowBoxCore                                            │  │
│  │   ├─ Evaluate eligibility (FHE circuits)                │  │
│  │   ├─ Assign tier (FHE computation)                      │  │
│  │   └─ Generate encrypted loot                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Redeemer                                                 │  │
│  │   └─ Validate and redeem vouchers                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 4. Fetch encrypted loot from events                      │  │
│  │ 5. Decrypt locally with same key                         │  │
│  │ 6. Redeem voucher for tokens/NFTs                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Project Structure

```
shadowbox/
├── contracts/              # Solidity smart contracts
│   ├── ShadowBoxCore.sol  # Main eligibility contract
│   ├── Redeemer.sol       # Voucher redemption contract
│   └── interfaces/        # Contract interfaces
├── fhe-circuits/          # FHE circuit configurations
│   ├── eligibility.fhe    # Eligibility evaluation
│   ├── tier.fhe          # Tier assignment
│   └── loot.fhe          # Loot generation
├── scripts/              # Deployment scripts
│   ├── deploy.ts        # Deploy contracts
│   └── seedLoot.ts      # Generate loot table
├── test/                # Contract tests
│   ├── eligibility.test.ts
│   └── redeem.test.ts
├── frontend/            # Next.js frontend
│   ├── src/
│   │   ├── pages/      # Next.js pages
│   │   ├── components/ # React components
│   │   ├── lib/       # Utilities and contracts
│   │   └── styles/    # CSS styles
│   └── package.json
├── hardhat.config.ts   # Hardhat configuration
└── package.json       # Root dependencies
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

Expected output:
```
  ShadowBoxCore - Eligibility Tests
    ✓ Should set the correct owner
    ✓ Should allow user to submit eligibility
    ✓ Should enforce cooldown between submissions
    ... (more tests)

  Redeemer - Voucher Tests
    ✓ Should allow redeeming valid voucher
    ✓ Should reject already used voucher
    ... (more tests)
```

### Deploy Contracts

```bash
# Deploy to local hardhat network
npm run node  # In one terminal
npm run deploy  # In another terminal

# Or deploy to Zama testnet
npm run deploy -- --network zama-testnet
```

Save the deployed contract addresses to `frontend/.env.local`:
```
NEXT_PUBLIC_SHADOWBOX_ADDRESS=0x...
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
Visit the homepage and connect your MetaMask wallet.

### 2. Prepare Eligibility Data
Navigate to `/prepare` and either:
- Use the "Generate Random" button for demo data
- Manually enter your eligibility metrics

### 3. Encrypt & Submit
Click "Encrypt & Submit":
1. Sign a message to derive your encryption key
2. Data is encrypted locally
3. Encrypted payload is submitted to the smart contract
4. Wait for transaction confirmation

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
If you received a voucher, use the redeem page to claim your tokens.

## 🔐 Privacy Guarantees

### What's Private (Encrypted On-Chain)
- ✅ Balance amounts
- ✅ NFT holdings and flags
- ✅ Interaction counts
- ✅ Sybil scores
- ✅ Assigned tier (Bronze/Silver/Gold)
- ✅ Loot box contents

### What's Public
- ℹ️ Eligibility boolean (yes/no)
- ℹ️ Submission timestamp
- ℹ️ Transaction hash

### Key Security
- 🔑 Keys derived from wallet signatures (never stored)
- 🔑 Encryption happens client-side
- 🔑 Decryption happens client-side
- 🔑 No keys transmitted to servers

## 🧪 Testing

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
- Next.js 14
- TypeScript
- TailwindCSS
- wagmi + RainbowKit
- ethers.js v6
- libsodium-wrappers (encryption)
- hkdf (key derivation)

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
- [ ] Demo video
- [ ] Live deployment

## 🤝 Contributing

This is a hackathon/demo project. For improvements:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Documentation**: [Blueprint](./shadow_box_full_blueprint_hybrid_shadow_airdrop.md)
- **Zama Docs**: https://docs.zama.ai
- **FHEVM**: https://github.com/zama-ai/fhevm

## ⚠️ Disclaimer

This is a proof-of-concept for educational purposes. The FHE integration uses a mock harness for local development. Production deployment requires proper FHEVM integration and security audits.

**DO NOT USE WITH REAL FUNDS WITHOUT PROPER AUDITS**

## 🎯 Submission

Built for **Zama Builder Track** - demonstrating practical use of Fully Homomorphic Encryption for privacy-preserving airdrops and reward distribution systems.

---

**Built with ❤️ for privacy-first rewards**
