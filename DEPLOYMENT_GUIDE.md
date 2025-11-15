# ShadowBox Deployment Guide

## 🌊 Deploying to Sepolia Testnet

### Prerequisites

1. **Get Sepolia Testnet ETH** (~0.1 ETH needed)

   Choose one faucet:
   - **Alchemy Sepolia Faucet** (Recommended): https://sepoliafaucet.com
   - **Infura Sepolia Faucet**: https://www.infura.io/faucet/sepolia
   - **QuickNode Faucet**: https://faucet.quicknode.com/ethereum/sepolia
   - **Chainlink Faucet**: https://faucets.chain.link/sepolia

2. **Prepare Test Wallet**
   - Use a dedicated test wallet
   - **Never use your main wallet**
   - Export private key from MetaMask (without 0x prefix)

### Step 1: Configure Environment

```bash
cd /home/azrim/Data/Project/ShadowBox

# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

Add your configuration:
```bash
# Your test wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Sepolia RPC (use default or add your own)
SEPOLIA_RPC_URL=https://rpc.sepolia.org

# Optional: Use Alchemy for faster/more reliable RPC
# SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

### Step 2: Deploy Contracts

```bash
# Make sure you have funds
npx hardhat run scripts/deploy.ts --network sepolia
```

**Expected Output:**
```
Starting deployment...
Deploying contracts with account: 0x...
Account balance: 0.1 ETH

Deploying ShadowBoxCore...
✓ ShadowBoxCore deployed to: 0xABC123...

Deploying Redeemer...
✓ Redeemer deployed to: 0xDEF456...

============================================================
Deployment Summary
============================================================
Network: sepolia
Chain ID: 11155111

Contract Addresses:
  ShadowBoxCore: 0xABC123...
  Redeemer: 0xDEF456...
  Voucher Signer: 0x...
============================================================
```

### Step 3: Save Contract Addresses

**Important**: Copy these addresses! You'll need them for:
- Frontend environment variables
- README documentation
- Block explorer verification

### Step 4: Verify Contracts (Optional)

```bash
# Get Etherscan API key from https://etherscan.io/apis

# Add to .env
ETHERSCAN_API_KEY=your_api_key

# Verify ShadowBoxCore
npx hardhat verify --network sepolia <SHADOWBOX_ADDRESS>

# Verify Redeemer
npx hardhat verify --network sepolia <REDEEMER_ADDRESS> "<SIGNER_ADDRESS>"
```

### Step 5: Test on Sepolia

Visit Sepolia block explorer to see your contracts:
- https://sepolia.etherscan.io/address/<YOUR_CONTRACT_ADDRESS>

## 🔗 Frontend Configuration

After deployment, update your frontend:

```bash
cd frontend
cp .env.example .env.local
nano .env.local
```

Add deployed addresses:
```bash
NEXT_PUBLIC_SHADOWBOX_ADDRESS=0xABC123...
NEXT_PUBLIC_REDEEMER_ADDRESS=0xDEF456...
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.org
```

## 🚀 Deploy Frontend to Vercel

1. Go to https://vercel.com/new
2. Import: azrim/ShadowBox
3. Root Directory: `frontend`
4. Add Environment Variables (from above)
5. Deploy!

## 📊 Network Information

- **Network Name**: Sepolia
- **Chain ID**: 11155111
- **RPC URL**: https://rpc.sepolia.org
- **Block Explorer**: https://sepolia.etherscan.io
- **Faucets**: See Prerequisites section

## 🐛 Troubleshooting

### Deployment Fails: "Insufficient Funds"
- Get more Sepolia ETH from faucets
- Check your wallet balance

### Deployment Fails: "Network Error"
- Check your RPC URL
- Try using Alchemy or Infura RPC
- Check internet connection

### Contract Not Appearing in Explorer
- Wait 1-2 minutes for indexing
- Verify the transaction was successful
- Check the correct network (Sepolia)

## 🔐 Security Reminders

- ✅ Use a test wallet only
- ✅ Never commit .env to git
- ✅ Never share your private key
- ✅ Only use testnet funds
- ✅ Verify contract addresses before sharing

## 📝 Post-Deployment Checklist

- [ ] Save contract addresses
- [ ] Verify contracts on Etherscan (optional)
- [ ] Update frontend .env.local
- [ ] Deploy frontend to Vercel
- [ ] Test wallet connection
- [ ] Test eligibility submission
- [ ] Test decryption flow
- [ ] Update README with addresses
- [ ] Share demo link

---

**Need Help?** Check the main README.md or create an issue on GitHub.
