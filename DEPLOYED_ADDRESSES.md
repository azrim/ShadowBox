# 🎉 ShadowBox - Deployed Contract Addresses

## Sepolia Testnet Deployment

**Deployed on**: 2025-11-15
**Network**: Sepolia Testnet
**Chain ID**: 11155111

### Contract Addresses

| Contract | Address | Explorer |
|----------|---------|----------|
| **ShadowBoxCore** | `0xb0C9bC0B03293ed74D0137A7F7B7f871FEA69810` | [View on Etherscan](https://sepolia.etherscan.io/address/0xb0C9bC0B03293ed74D0137A7F7B7f871FEA69810) |
| **Redeemer** | `0x2933582317d7aFeA834a940cfb134e4d66071Bc4` | [View on Etherscan](https://sepolia.etherscan.io/address/0x2933582317d7aFeA834a940cfb134e4d66071Bc4) |
| **Voucher Signer** | `0x2dA8ed2EC49F47b335b50e7F4b1150636Aab9b25` | [View on Etherscan](https://sepolia.etherscan.io/address/0x2dA8ed2EC49F47b335b50e7F4b1150636Aab9b25) |

### Frontend Environment Variables

Use these in your Vercel deployment:

```bash
NEXT_PUBLIC_SHADOWBOX_ADDRESS=0xb0C9bC0B03293ed74D0137A7F7B7f871FEA69810
NEXT_PUBLIC_REDEEMER_ADDRESS=0x2933582317d7aFeA834a940cfb134e4d66071Bc4
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/17b312609df54d1ca07e90a6ec0de6ce
```

### Verification Commands

To verify contracts on Etherscan:

```bash
# Verify ShadowBoxCore
npx hardhat verify --network sepolia 0xb0C9bC0B03293ed74D0137A7F7B7f871FEA69810

# Verify Redeemer
npx hardhat verify --network sepolia 0x2933582317d7aFeA834a940cfb134e4d66071Bc4 "0x2dA8ed2EC49F47b335b50e7F4b1150636Aab9b25"
```

### Network Details

- **Network Name**: Sepolia
- **Chain ID**: 11155111
- **RPC URL**: https://sepolia.infura.io/v3/17b312609df54d1ca07e90a6ec0de6ce
- **Block Explorer**: https://sepolia.etherscan.io
- **Faucets**: 
  - https://sepoliafaucet.com
  - https://faucets.chain.link/sepolia

### Quick Links

- **ShadowBoxCore on Etherscan**: https://sepolia.etherscan.io/address/0xb0C9bC0B03293ed74D0137A7F7B7f871FEA69810
- **Redeemer on Etherscan**: https://sepolia.etherscan.io/address/0x2933582317d7aFeA834a940cfb134e4d66071Bc4

---

**Next Steps**:
1. ✅ Contracts deployed
2. 🔄 Deploy frontend to Vercel
3. 🔄 Test live application
4. 🔄 Update README with live links
