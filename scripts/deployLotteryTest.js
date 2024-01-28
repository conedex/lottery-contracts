const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const Lottery = await hre.ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(
    "0x8C7382F9D8f56b33781fE506E897a4F1e2d17255", // VRF Coordinator
    "0x326C977E6efc84E512bB9C30f76E30c160eD06FB", // LINK Token
    "0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4", // Key Hash
    "0x80273525B1548EeA1f211f4218Cf30c1a7C86b25", // ERC20 Token Address for Lottery
    hre.ethers.utils.parseEther("10000"), // 10.000 Token per entry
    "0xF450B38cccFdcfAD2f98f7E4bB533151a2fB00E9", // Reward Wallet
    "0xF450B38cccFdcfAD2f98f7E4bB533151a2fB00E9", // Admin
    "0x0000000000000000000000000000000000000000", //Cone Treasury
    10, // 10% rewardWallet Amount deducted from prize money
    50, // 50% ConeHead Treeasury amount deduction from rewardWallet amount
    "0x6Bd3a2F6b91830E964a5b3906E0DBF92a5A5Cc53" //Cone Head NFT Contract Address
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
