import { ethers } from "hardhat";

interface LootItem {
  id: number;
  name: string;
  type: "token" | "nft" | "voucher";
  tier: number;
  amount: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

async function main() {
  console.log("Seeding loot table data...\n");

  const lootTable: LootItem[] = [
    { id: 0, name: "Bronze Token Pack", type: "token", tier: 0, amount: "100", rarity: "common" },
    { id: 1, name: "Bronze NFT Badge", type: "nft", tier: 0, amount: "1", rarity: "common" },
    { id: 2, name: "Bronze Voucher", type: "voucher", tier: 0, amount: "50", rarity: "common" },
    
    { id: 3, name: "Silver Token Pack", type: "token", tier: 1, amount: "500", rarity: "rare" },
    { id: 4, name: "Silver NFT Badge", type: "nft", tier: 1, amount: "1", rarity: "rare" },
    { id: 5, name: "Silver Voucher", type: "voucher", tier: 1, amount: "250", rarity: "rare" },
    
    { id: 6, name: "Gold Token Pack", type: "token", tier: 2, amount: "1000", rarity: "epic" },
    { id: 7, name: "Gold NFT Badge", type: "nft", tier: 2, amount: "1", rarity: "epic" },
    { id: 8, name: "Gold Voucher", type: "voucher", tier: 2, amount: "500", rarity: "epic" },
    
    { id: 9, name: "Legendary Token Hoard", type: "token", tier: 2, amount: "5000", rarity: "legendary" },
    { id: 10, name: "Legendary NFT", type: "nft", tier: 2, amount: "1", rarity: "legendary" },
  ];

  for (let i = 11; i < 100; i++) {
    const tier = i % 3;
    const typeIndex = i % 3;
    const types: Array<"token" | "nft" | "voucher"> = ["token", "nft", "voucher"];
    const rarities: Array<"common" | "rare" | "epic" | "legendary"> = ["common", "rare", "epic", "legendary"];
    
    lootTable.push({
      id: i,
      name: `Random ${types[typeIndex]} #${i}`,
      type: types[typeIndex],
      tier: tier,
      amount: (100 + i * 10).toString(),
      rarity: rarities[tier],
    });
  }

  console.log(`Generated ${lootTable.length} loot items`);
  console.log("\nSample loot items:");
  console.table(lootTable.slice(0, 15));

  const fs = require('fs');
  const path = require('path');
  
  const outputDir = path.join(__dirname, '../frontend/src/data');
  const outputPath = path.join(outputDir, 'lootTable.json');
  
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      outputPath,
      JSON.stringify(lootTable, null, 2)
    );
    console.log(`\n✓ Loot table saved to: ${outputPath}`);
  } catch (error) {
    console.error("Error saving loot table:", error);
  }

  console.log("\nLoot distribution by tier:");
  const tierCounts = lootTable.reduce((acc, item) => {
    acc[item.tier] = (acc[item.tier] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  console.log("  Tier 0 (Bronze):", tierCounts[0] || 0, "items");
  console.log("  Tier 1 (Silver):", tierCounts[1] || 0, "items");
  console.log("  Tier 2 (Gold):", tierCounts[2] || 0, "items");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
