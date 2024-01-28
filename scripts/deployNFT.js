const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const LotteryWinnerNFT = await hre.ethers.getContractFactory(
    "LotteryWinnerNFT"
  );
  const lotteryWinnerNFT = await LotteryWinnerNFT.deploy();

  await lotteryWinnerNFT.deployed();

  console.log("Lottery NFT deployed to:", lotteryWinnerNFT.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
