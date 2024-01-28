const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const LotteryBetaNFT = await hre.ethers.getContractFactory("LotteryBetaNFT");
  const lotteryBetaNFT = await LotteryBetaNFT.deploy();

  await lotteryBetaNFT.deployed();

  console.log("Lottery Beta NFT deployed to:", lotteryBetaNFT.address);

  // Specify the addresses to which you want to mint NFTs
  const addresses = [
    "0x3e34e6d9A7715CD32424594Ab8824e163F213DB5",
    "0x87DB90eb7B09a26B402EaA2821942bf961aAcE98",
    "0x3A11a65cA3d34CFD0a8f909dEb54c69765C4285c",
    "0x88f727f743cf6b0Afe9B28001fC3154F5671DaBe",
    "0x98aDfeF414F0E6ab74dce55a1Ae0aaf38739f3BB",
    "0xBc55D4AE4B746fc16E8ad54651c53AdCA99ACEa6",
    "0x993D7C9b23e543Ae4e35BAE8a6C719A351D0eea9",
    "0x77De78b96c9455Daa94dB1f9Ab972a9AA400fD2b",
    "0xEC340B0483496A7f1378245862dcd74c79F7d29a",
    "0x3601cfEa89c813aDeFB0F623743d0B2a7c5736Bf",
    "0x5fc0ADE9695788611964c26273A4BDB010610C27",
    "0x450E45C10B452B7Dc3FE61d399CEd36ed4b78C9F",
    "0xc97Be653562fe34717Cf52853172d7515012Bd76",
    "0x34B09342e07615bF11DAcaDe12Aaf74b87e525fB",
    "0x21571F39bcb29ef8F0Df49FB3e32bD8CD410FDC6",
    "0xF450B38cccFdcfAD2f98f7E4bB533151a2fB00E9",
    "0xa2520159f15408AC76099c4a6338829B13010ff7",
    "0xCE6a0C5451f97C2e2Ae549Db271177B4B97fff50",
    "0x9f6dE29436142E68d359fe5F26e2CB87C337E3C2",
    "0x565abaA8E8F522cf1d68F0b80848A013Fe22e0F7",
    "0x36Fe627c28A612609c06e10D9df51E85961fbf14",
    "0x98aDfeF414F0E6ab74dce55a1Ae0aaf38739f3BB",
    "0xD43827c580D2F9c21a1Ea6166489e4933c2B057C",
    "0xBed7879224beDdEBb3927EBA8Fd60bC8845908A0",
    "0x3e34e6d9A7715CD32424594Ab8824e163F213DB5",
    "0xd86c52d647Fb3c3c965024C6644531794CeE401C",
    "0xbf98f9C22E2a8084b193ABee872eAbDC92e0e050",
    "0x34B09342e07615bF11DAcaDe12Aaf74b87e525fB",
    "0xBCD33179e0fca2f0AE6F9cba31De713cD7f54089",
    "0x21571F39bcb29ef8F0Df49FB3e32bD8CD410FDC6",
    "0xD67f181c47a968EFDA05343474CB71a5BC93f96D",
    "0xEC1b363C258B6a24e3BF7FC096082F812a9fA9b0",
    "0xbf98f9C22E2a8084b193ABee872eAbDC92e0e050",
    "0x595AEeA9156aE306DE4D85a0190d38f6Bf066fCA",
    "0x25C8a3407dC368935bb87BB66a5f2C2792d0D90c",
    "0x88f727f743cf6b0Afe9B28001fC3154F5671DaBe",
    "0x4fAD104eC99e5A43A65d5d3F799Dd429De373222",
    "0xEC1b363C258B6a24e3BF7FC096082F812a9fA9b0",
    "0xF048E3303D4c05F3eeBE2161E619852C2e5e0E1f",
    "0x33e9dAb56B16694BC3329C3E9ca96D26BDbCa43A",
    "0xC95897cafeed91514787E484CDa63d22E0Bc023E",
    "0xF81836bA353AD9969F4c61C1523d5F0B31d8343c",
    "0xB4841113fB144fbB136c527ce2a70065bCEdCae4",
    "0xbA5Ce1Aea00772d9D4730eE76d8A1fB6ea9A1c99",
  ];

  // Mint an NFT to each address
  for (const address of addresses) {
    await lotteryBetaNFT.mint(address);
    console.log(`Minted NFT to ${address}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
