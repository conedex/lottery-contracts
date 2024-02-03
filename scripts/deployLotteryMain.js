const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const Lottery = await hre.ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(
    "0x3d2341ADb2D31f1c5530cDC622016af293177AE0", // VRF Coordinator
    "0xb0897686c545045aFc77CF20eC7A532E3120E0F1", // LINK Token
    "0xf86195cf7690c55907b2b611ebb7343a6f649bff128701cc542f0569e2c549da", // Key Hash
    "0xbA777aE3a3C91fCD83EF85bfe65410592Bdd0f7c", // ERC20 Token Address for Lottery
    hre.ethers.utils.parseEther("10000"), // 10.000 Token per entry
    "0x1b60222B8f2421A42807CcbA3394237E27f6D40E", // Reward Wallet
    "0x1b60222B8f2421A42807CcbA3394237E27f6D40E", // Admin
    "0x5af0b2d05e82676BDe59BB95C861fd4688B9D805", //Cone Treasury
    20, // 20% rewardWallet Amount deducted from prize money
    25, // 25% ConeHead Treeasury amount deduction from rewardWallet amount
    "0xA2B35dFA644464e031d3a4BE36FD38Ad9BA896B6" //NFT Address
  );

  await lottery.deployed();

  console.log("Lottery deployed to:", lottery.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
