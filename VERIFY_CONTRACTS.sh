#!/bin/bash
# Script to verify contracts on Etherscan

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           🔍 VERIFYING CONTRACTS ON ETHERSCAN                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Make sure you have ETHERSCAN_API_KEY in your .env file"
echo "Get one from: https://etherscan.io/apis"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Verifying ShadowBoxCore..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx hardhat verify --network sepolia 0xb0C9bC0B03293ed74D0137A7F7B7f871FEA69810

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Verifying Redeemer..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
npx hardhat verify --network sepolia 0x2933582317d7aFeA834a940cfb134e4d66071Bc4 "0x2dA8ed2EC49F47b335b50e7F4b1150636Aab9b25"

echo ""
echo "✅ Verification complete!"
echo "Check contracts on Etherscan:"
echo "  - https://sepolia.etherscan.io/address/0xb0C9bC0B03293ed74D0137A7F7B7f871FEA69810"
echo "  - https://sepolia.etherscan.io/address/0x2933582317d7aFeA834a940cfb134e4d66071Bc4"
