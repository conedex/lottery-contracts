const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const Lottery = await hre.ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(
    "0x8C7382F9D8f56b33781fE506E897a4F1e2d17255", // VRF Coordinator
    "0x326C977E6efc84E512bB9C30f76E30c160eD06FB", // LINK Token
    "0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4", // Key Hash
    "0x80273525B1548EeA1f211f4218Cf30c1a7C86b25", // Mock ERC20 Token
    hre.ethers.utils.parseEther("1000000"), // 1 Mil Token per entry
    "0xF450B38cccFdcfAD2f98f7E4bB533151a2fB00E9", // Reward Wallet
    "0xf97C091179A4A4d666da7a2764dDeD4F932FC14A" // Registry Address
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
