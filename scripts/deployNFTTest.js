const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const LotteryWinnerNFT = await hre.ethers.getContractFactory(
    "LotteryWinnerNFT"
  );
  const lotteryWinnerNFT = await LotteryWinnerNFT.deploy(
    "0x80273525B1548EeA1f211f4218Cf30c1a7C86b25"
  );

  await lotteryWinnerNFT.deployed();

  console.log("Lottery NFT deployed to:", lotteryWinnerNFT.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
