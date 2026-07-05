const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying RitualWrapped contract to Ritual Chain...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`📋 Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} RITUAL\n`);

  console.log("⏳ Deploying...");
  const RitualWrapped = await ethers.getContractFactory("RitualWrapped");
  const ritualWrapped = await RitualWrapped.deploy();

  await ritualWrapped.waitForDeployment();

  const address = await ritualWrapped.getAddress();
  console.log(`\n✅ Deployed to: ${address}`);
  console.log(`🔗 Explorer: https://explorer.ritualfoundation.org/address/${address}\n`);
  console.log(`\n📝 NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
