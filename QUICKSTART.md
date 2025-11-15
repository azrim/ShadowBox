# ShadowBox Quick Start Guide

Get ShadowBox running locally in 5 minutes!

## Prerequisites

```bash
node --version  # Should be >= 18.x
npm --version   # Should be >= 9.x
```

## Installation (2 minutes)

```bash
# Clone the repository
git clone <your-repo-url>
cd ShadowBox

# Install dependencies
npm install
cd frontend && npm install && cd ..
```

## Local Development (3 minutes)

### Terminal 1: Start Local Blockchain

```bash
npx hardhat node
```

Keep this running. You should see:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

### Terminal 2: Deploy Contracts

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

**Save the output!** Copy the contract addresses:
```
ShadowBoxCore deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Redeemer deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### Terminal 3: Run Frontend

```bash
cd frontend

# Create .env.local with your contract addresses
cat > .env.local << EOF
NEXT_PUBLIC_SHADOWBOX_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_REDEEMER_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
EOF

# Start development server
npm run dev
```

Open http://localhost:3000 in your browser!

## First Test Run

### 1. Configure MetaMask

1. Open MetaMask
2. Add Network:
   - **Network Name**: Hardhat Local
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH

3. Import Test Account:
   - Use private key from hardhat node output
   - Default test account: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### 2. Connect Wallet

1. Click "Connect Wallet" in the app
2. Select MetaMask
3. Approve connection

### 3. Submit Eligibility

1. Navigate to "Prepare" page
2. Click "Generate Random" for sample data
3. Click "Encrypt & Submit"
4. Sign the message in MetaMask
5. Approve the transaction
6. Wait for confirmation (~2 seconds)

### 4. Check Status

1. Navigate to "Status" page
2. You should see your submission
3. If eligible, click "Decrypt Loot Box"

### 5. Decrypt Loot

1. Sign the same message again
2. View your decrypted loot!
3. See tier, reward type, and amount

## Running Tests

```bash
# Run all tests
npm run test

# Expected output:
# 31 passing (2m)
```

## Common Issues

### "Transaction reverted"
- **Cause**: Contract not deployed or wrong address
- **Fix**: Redeploy contracts and update .env.local

### "Cannot connect to network"
- **Cause**: Hardhat node not running
- **Fix**: Ensure `npx hardhat node` is running in Terminal 1

### "Wrong network"
- **Cause**: MetaMask on wrong network
- **Fix**: Switch to Hardhat Local (Chain ID 31337)

### "Signature request failed"
- **Cause**: MetaMask locked or wrong account
- **Fix**: Unlock MetaMask and ensure correct account is selected

## Development Workflow

### Making Changes to Contracts

```bash
# 1. Edit contracts/ShadowBoxCore.sol or contracts/Redeemer.sol
# 2. Recompile
npx hardhat compile

# 3. Run tests
npm run test

# 4. Redeploy (stop and restart hardhat node first)
npx hardhat run scripts/deploy.ts --network localhost

# 5. Update frontend/.env.local with new addresses
```

### Making Changes to Frontend

```bash
cd frontend

# Edit files in src/
# Changes hot-reload automatically
# Check browser at http://localhost:3000
```

## Next Steps

- **Read the docs**: Check README.md for detailed information
- **Explore the code**: Start with contracts/ShadowBoxCore.sol
- **Run more tests**: Try different eligibility scenarios
- **Deploy to testnet**: See DEPLOYMENT.md for instructions

## Useful Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Clean build artifacts
npm run clean

# Type check frontend
cd frontend && npm run type-check

# Lint frontend
cd frontend && npm run lint
```

## Project Structure Overview

```
ShadowBox/
├── contracts/          # Smart contracts
│   ├── ShadowBoxCore.sol
│   └── Redeemer.sol
├── test/              # Contract tests
├── scripts/           # Deployment scripts
├── frontend/          # Next.js app
│   ├── src/
│   │   ├── pages/     # Routes
│   │   ├── components/
│   │   └── lib/       # Utils
│   └── package.json
└── hardhat.config.ts  # Hardhat config
```

## Getting Help

- **Documentation**: See README.md and ARCHITECTURE.md
- **Issues**: Check GitHub issues
- **Tests**: Run `npm test` for examples

---

**Ready to build privacy-first airdrops!** 🚀
