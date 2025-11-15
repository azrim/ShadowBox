# ShadowBox Deployment Guide

This guide walks you through deploying ShadowBox to production on Zama FHEVM testnet and Vercel.

## Prerequisites

- Node.js >= 18.x
- Funded wallet on Zama testnet (for deployment)
- Vercel account (for frontend hosting)
- GitHub account (for code hosting)

## Step 1: Prepare Your Environment

### 1.1 Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd ShadowBox
npm install
cd frontend
npm install
cd ..
```

### 1.2 Configure Environment Variables

Create `.env` in the root directory:

```bash
# Deployment wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Zama FHEVM RPC URL
ZAMA_RPC_URL=https://devnet.zama.ai

# Optional: Etherscan API for verification
ETHERSCAN_API_KEY=your_api_key
```

## Step 2: Deploy Smart Contracts

### 2.1 Compile Contracts

```bash
npx hardhat compile
```

Expected output:
```
Compiled 14 Solidity files successfully
```

### 2.2 Run Tests

```bash
npx hardhat test
```

Ensure all 31 tests pass.

### 2.3 Deploy to Zama Testnet

```bash
npx hardhat run scripts/deploy.ts --network zama-testnet
```

**Save the output!** You'll need the contract addresses:

```
ShadowBoxCore deployed to: 0x...
Redeemer deployed to: 0x...
Voucher Signer: 0x...
```

### 2.4 Generate Loot Table

```bash
npx hardhat run scripts/seedLoot.ts
```

This creates `frontend/src/data/lootTable.json` with 100 loot items.

### 2.5 Verify Contracts (Optional)

```bash
npx hardhat verify --network zama-testnet <SHADOWBOX_ADDRESS>
npx hardhat verify --network zama-testnet <REDEEMER_ADDRESS> "<SIGNER_ADDRESS>"
```

## Step 3: Configure Frontend

### 3.1 Create Frontend Environment File

Create `frontend/.env.local`:

```bash
# Contract addresses from Step 2.3
NEXT_PUBLIC_SHADOWBOX_ADDRESS=0x...
NEXT_PUBLIC_REDEEMER_ADDRESS=0x...

# Network configuration
NEXT_PUBLIC_CHAIN_ID=8009
NEXT_PUBLIC_RPC_URL=https://devnet.zama.ai

# Optional: WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 3.2 Test Frontend Locally

```bash
cd frontend
npm run dev
```

Open http://localhost:3000 and verify:
- Wallet connection works
- Contract addresses are correct
- You can prepare and submit eligibility data

## Step 4: Deploy Frontend to Vercel

### 4.1 Push to GitHub

```bash
git add .
git commit -m "feat: production-ready ShadowBox"
git push origin main
```

### 4.2 Import Project to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Configure Environment Variables:

```
NEXT_PUBLIC_SHADOWBOX_ADDRESS=0x...
NEXT_PUBLIC_REDEEMER_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=8009
NEXT_PUBLIC_RPC_URL=https://devnet.zama.ai
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

5. Click **Deploy**

### 4.3 Verify Deployment

Visit your Vercel URL (e.g., `shadowbox.vercel.app`) and test:
- Connect wallet
- Submit eligibility
- Check status
- Decrypt loot box

## Step 5: Post-Deployment Configuration

### 5.1 Fund Redeemer Contract

Send testnet ETH to the Redeemer contract to enable reward withdrawals:

```bash
# Using ethers.js or MetaMask
npx hardhat console --network zama-testnet

> const [owner] = await ethers.getSigners()
> await owner.sendTransaction({
    to: "<REDEEMER_ADDRESS>",
    value: ethers.parseEther("10")
  })
```

### 5.2 Update README

Update the main README.md with:
- Live frontend URL
- Deployed contract addresses
- Demo video link (if available)

## Step 6: Monitoring and Maintenance

### 6.1 Monitor Contract Events

Use block explorers or ethers.js to monitor:
- `EligibilityChecked` events on ShadowBoxCore
- `VoucherRedeemed` events on Redeemer

### 6.2 Contract Administration

As contract owner, you can:

**Pause/Unpause ShadowBoxCore:**
```javascript
await shadowBox.setPaused(true);  // Pause submissions
await shadowBox.setPaused(false); // Resume
```

**Update Redeemer Signer:**
```javascript
await redeemer.setSigner(newSignerAddress);
```

**Add Rewards to Redeemer:**
```javascript
await redeemer.addRewards({ value: ethers.parseEther("5") });
```

## Troubleshooting

### Contract Deployment Fails

- **Insufficient funds**: Ensure your wallet has enough testnet ETH
- **Gas price too low**: Check network congestion and adjust gas settings
- **RPC issues**: Try a different Zama RPC endpoint

### Frontend Connection Issues

- **Wrong network**: Ensure MetaMask is on Zama testnet (Chain ID 8009)
- **Contract not found**: Verify `NEXT_PUBLIC_SHADOWBOX_ADDRESS` is correct
- **CORS errors**: Check Vercel deployment logs for configuration issues

### Test Failures

- **Timeout errors**: Increase timeout in test files (`this.timeout(120000)`)
- **Signature verification fails**: Ensure signer address matches contract configuration
- **Deployment hangs**: Check Hardhat network configuration and RPC URL

## Security Considerations

### Before Mainnet Deployment

- [ ] Complete professional security audit
- [ ] Test on testnet for at least 2 weeks
- [ ] Implement rate limiting and anti-spam measures
- [ ] Add emergency pause mechanisms
- [ ] Set up monitoring and alerting
- [ ] Create incident response plan
- [ ] Document all admin operations
- [ ] Use multi-sig wallet for owner operations
- [ ] Implement timelocks for critical changes
- [ ] Test disaster recovery procedures

### Production Checklist

- [ ] All tests passing
- [ ] Code reviewed by multiple developers
- [ ] Smart contracts audited
- [ ] Frontend security review completed
- [ ] Environment variables secured
- [ ] Private keys properly managed (Hardware wallet/KMS)
- [ ] Backup and recovery procedures documented
- [ ] Monitoring dashboards configured
- [ ] User documentation complete
- [ ] Support channels established

## Cost Estimates

### Smart Contract Deployment

- **ShadowBoxCore**: ~2-3M gas (~$X on mainnet)
- **Redeemer**: ~1.5-2M gas (~$X on mainnet)
- **Total**: ~3.5-5M gas

### Ongoing Costs

- **Frontend hosting**: $0-20/month (Vercel free tier usually sufficient)
- **RPC costs**: Depends on usage
- **Domain**: ~$10-15/year
- **Monitoring**: Variable

## Support

For issues or questions:
- GitHub Issues: <your-repo-url>/issues
- Documentation: See README.md
- Zama Discord: https://discord.gg/zama

---

**Built with ❤️ for privacy-first rewards**
