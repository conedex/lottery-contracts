const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lottery Contract", function () {
  let mockToken;
  let mockLottery10;
  let owner, otherAccounts;

  beforeEach(async function () {
    [owner, ...otherAccounts] = await ethers.getSigners();

    // Deploy Mock Token
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy(
      "MockToken",
      "MTK",
      ethers.utils.parseEther("1000000000000000000000000")
    );

    console.log({
      vrfCoordinator: "0x3d2341ADb2D31f1c5530cDC622016af293177AE0",
      linkToken: "0xb0897686c545045aFc77CF20eC7A532E3120E0F1",
      keyHash:
        "0xf86195cf7690c55907b2b611ebb7343a6f649bff128701cc542f0569e2c549da",
      mockTokenAddress: mockToken.address,
      ownerAddress: owner.address, // Reward wallet address
      NFTContractAddress: "0xA2B35dFA644464e031d3a4BE36FD38Ad9BA896B6",
    });

    // Deploy Lottery contract, using deployed mock token address
    const MockLottery10 = await ethers.getContractFactory("MockLottery10");
    mockLottery10 = await MockLottery10.deploy(
      "0x3d2341ADb2D31f1c5530cDC622016af293177AE0", // VRF Coordinator Mock address
      "0xb0897686c545045aFc77CF20eC7A532E3120E0F1", // Mock LINK Token address
      "0xf86195cf7690c55907b2b611ebb7343a6f649bff128701cc542f0569e2c549da", // Key Hash for VRF (can be mock for local testing)
      mockToken.address, // Mock token for entry fee
      ethers.utils.parseEther("10000"), // Token per entry
      owner.address, // Reward wallet address
      owner.address, // Admin address
      owner.address, // Cone treasury address
      10, // Winner fee percentage
      50, // Cone treasury fee percentage
      "0xA2B35dFA644464e031d3a4BE36FD38Ad9BA896B6" // NFT Contract address
    );
  });

  it("simplified test", async function () {
    const tokenAmount = ethers.utils.parseEther("10000");
    await mockToken.transfer(otherAccounts[0].address, tokenAmount);
    await mockToken
      .connect(otherAccounts[0])
      .approve(mockLottery10.address, tokenAmount);
    const allowance = await mockToken.allowance(
      otherAccounts[0].address,
      mockLottery10.address
    );
    console.log(
      `Allowance for account 0: ${ethers.utils.formatEther(allowance)}`
    );
    await mockLottery10.connect(otherAccounts[0]).enterLottery(1); // Assuming '1' is the correct argument for the number of entries or however it's defined in your contract
    const balanceAfter = await mockToken.balanceOf(otherAccounts[0].address);
    console.log(
      `Account 0 balance after entering the lottery: ${ethers.utils.formatEther(
        balanceAfter
      )}`
    );
  });

  it("single user buys 100 entries", async function () {
    const entries = 100;
    const tokenAmount = ethers.utils.parseEther("10000").mul(entries); // 100 entries
    await mockToken.transfer(otherAccounts[0].address, tokenAmount);
    await mockToken
      .connect(otherAccounts[0])
      .approve(mockLottery10.address, tokenAmount);

    const tx = await mockLottery10
      .connect(otherAccounts[0])
      .enterLottery(entries);
    const receipt = await tx.wait();

    console.log(`Gas used for 100 entries: ${receipt.gasUsed.toString()}`);
  });

  it("single user buys 1000 entries", async function () {
    const entries = 1000;
    const tokenAmount = ethers.utils.parseEther("10000").mul(entries); // 10,000 entries
    await mockToken.transfer(otherAccounts[0].address, tokenAmount);
    await mockToken
      .connect(otherAccounts[0])
      .approve(mockLottery10.address, tokenAmount);

    const tx = await mockLottery10
      .connect(otherAccounts[0])
      .enterLottery(entries);
    const receipt = await tx.wait();

    console.log(`Gas used for 10000 entries: ${receipt.gasUsed.toString()}`);
  });

  it("single user enters and declare winner", async function () {
    const tokenAmount = ethers.utils.parseEther("10000");
    // Transfer tokens to the first account
    await mockToken.transfer(otherAccounts[0].address, tokenAmount);
    console.log(
      `Transferred ${ethers.utils.formatEther(tokenAmount)} tokens to account 0`
    );

    // Approve the lottery contract to spend tokens on behalf of the first account
    await mockToken
      .connect(otherAccounts[0])
      .approve(mockLottery10.address, tokenAmount);
    console.log(
      `Account 0 approved lottery contract to spend ${ethers.utils.formatEther(
        tokenAmount
      )} tokens`
    );

    // Enter the lottery
    await mockLottery10.connect(otherAccounts[0]).enterLottery(1);
    console.log(`Account 0 entered the lottery with 1 entry`);

    // Generate a random number for testing purposes
    await mockLottery10.setGeneratedRandomNumberForTesting(
      ethers.utils.randomBytes(32)
    );
    console.log(`Generated random number for testing`);

    // Declare the winner
    const tx = await mockLottery10.declareWinner();
    const receipt = await tx.wait();
    console.log(`Declared winner, gas used: ${receipt.gasUsed}`);
  });

  it("multiple users enter with more than one entry without declare winner", async function () {
    const entryFee = ethers.utils.parseEther("10000");
    const entries = 5; // Each user will enter 5 times
    const requiredTokenAmount = entryFee.mul(entries);

    for (let i = 0; i < otherAccounts.length; i++) {
      // Transfer tokens to each account
      await mockToken.transfer(otherAccounts[i].address, requiredTokenAmount);
      console.log(
        `Transferred ${ethers.utils.formatEther(
          requiredTokenAmount
        )} tokens to account ${i}`
      );

      // Approve the lottery contract to spend tokens
      await mockToken
        .connect(otherAccounts[i])
        .approve(mockLottery10.address, requiredTokenAmount);
      console.log(
        `Account ${i} approved lottery contract to spend ${ethers.utils.formatEther(
          requiredTokenAmount
        )} tokens`
      );

      // Enter the lottery
      await mockLottery10.connect(otherAccounts[i]).enterLottery(entries);
      console.log(`Account ${i} entered the lottery with ${entries} entries`);
    }

    // Note: We're not calling declareWinner in this test
  });

  it("declareWinner simulation with mocked randomness", async function () {
    const entryFee = ethers.utils.parseEther("10000");
    const entries = 10;
    const requiredTokenAmount = entryFee.mul(entries);

    console.log(
      `Contract initial balance: ${ethers.utils.formatEther(
        await mockToken.balanceOf(mockLottery10.address)
      )}`
    );

    // Transfer and approve tokens for each account
    for (let i = 0; i < otherAccounts.length; i++) {
      console.log(
        `Account ${i} initial balance: ${ethers.utils.formatEther(
          await mockToken.balanceOf(otherAccounts[i].address)
        )}`
      );

      try {
        await mockToken.transfer(otherAccounts[i].address, requiredTokenAmount);
        await mockToken
          .connect(otherAccounts[i])
          .approve(mockLottery10.address, requiredTokenAmount);
      } catch (error) {
        console.error(`Error processing account ${i}:`, error);
      }

      console.log(
        `Account ${i} balance after transfer: ${ethers.utils.formatEther(
          await mockToken.balanceOf(otherAccounts[i].address)
        )}`
      );
      const allowance = await mockToken.allowance(
        otherAccounts[i].address,
        mockLottery10.address
      );
      console.log(
        `Allowance for account ${i}: ${ethers.utils.formatEther(allowance)}`
      );
    }

    // Enter the lottery with each account
    for (let i = 0; i < otherAccounts.length; i++) {
      const balanceBefore = await mockToken.balanceOf(otherAccounts[i].address);
      console.log(
        `Account ${i} balance before entering: ${ethers.utils.formatEther(
          balanceBefore
        )}`
      );

      const tx = await mockLottery10
        .connect(otherAccounts[i])
        .enterLottery(entries);
      const receipt = await tx.wait();

      const balanceAfter = await mockToken.balanceOf(otherAccounts[i].address);
      console.log(
        `Account ${i} balance after entering: ${ethers.utils.formatEther(
          balanceAfter
        )}`
      );
      console.log(
        `Gas used for account ${i} to enter: ${receipt.gasUsed.toString()}`
      );
    }

    console.log(
      `Contract balance before declaring winner: ${ethers.utils.formatEther(
        await mockToken.balanceOf(mockLottery10.address)
      )}`
    );
    // Generate a random number for testing purposes
    await mockLottery10.setGeneratedRandomNumberForTesting(
      ethers.utils.randomBytes(32)
    );
    console.log(`Generated random number for testing`);

    // Declare the winner
    const tx = await mockLottery10.declareWinner();
    const receipt = await tx.wait();

    console.log(`Gas used to declare winner: ${receipt.gasUsed}`);
    console.log(
      `Contract balance after declaring winner: ${ethers.utils.formatEther(
        await mockToken.balanceOf(mockLottery10.address)
      )}`
    );
  });

  it("should not select the zero address as a winner", async function () {
    // Setup: Enter the lottery with a few accounts
    const entryFee = ethers.utils.parseEther("10000");
    const tokenAmount = entryFee; // Assuming one entry per account
    const entries = 1; // One entry per user

    // Transfer tokens and approve for the first few accounts
    for (let i = 0; i < 5; i++) {
      await mockToken.transfer(otherAccounts[i].address, tokenAmount);
      await mockToken
        .connect(otherAccounts[i])
        .approve(mockLottery10.address, tokenAmount);
      await mockLottery10.connect(otherAccounts[i]).enterLottery(entries);
    }

    // Generate a random number for testing purposes
    await mockLottery10.setGeneratedRandomNumberForTesting(
      ethers.utils.randomBytes(32)
    );

    // Declare the winner
    await mockLottery10.declareWinner();

    // Check that the lastWinner is not the zero address
    const lastWinner = await mockLottery10.getLastWinner();
    expect(lastWinner).to.not.equal(
      "0x0000000000000000000000000000000000000000",
      "The zero address should not be a winner"
    );
  });

  it("correctly sends funds to the new reward wallet after declaring a winner", async function () {
    // Set a new reward wallet address
    const newRewardWallet = otherAccounts[1].address; // Assuming otherAccounts[1] is not participating in the lottery
    await mockLottery10.setRewardWallet(newRewardWallet);

    // Proceed with the lottery entry and winner declaration as usual
    // For simplicity, using one account to enter
    const tokenAmount = ethers.utils.parseEther("10000");
    await mockToken.transfer(otherAccounts[0].address, tokenAmount);
    await mockToken
      .connect(otherAccounts[0])
      .approve(mockLottery10.address, tokenAmount);
    await mockLottery10.connect(otherAccounts[0]).enterLottery(1);

    // Generate a random number for testing purposes
    await mockLottery10.setGeneratedRandomNumberForTesting(
      ethers.utils.randomBytes(32)
    );

    // Declare the winner
    const balanceBefore = await mockToken.balanceOf(newRewardWallet);
    await mockLottery10.declareWinner();
    const balanceAfter = await mockToken.balanceOf(newRewardWallet);

    // Check that the new reward wallet received the correct funds
    const expectedIncrease = ethers.utils.parseEther("500"); // Assuming the reward is 10% of the entry fee
    expect(balanceAfter.sub(balanceBefore)).to.equal(expectedIncrease);
  });

  it("correctly sends funds to the new cone treasury after declaring a winner", async function () {
    // Set a new cone treasury address
    const newConeTreasury = otherAccounts[2].address; // Assuming otherAccounts[2] is not participating in the lottery
    await mockLottery10.setConeTreasury(newConeTreasury);

    // Proceed with the lottery entry and winner declaration as usual
    // For simplicity, using one account to enter
    const tokenAmount = ethers.utils.parseEther("10000");
    await mockToken.transfer(otherAccounts[0].address, tokenAmount);
    await mockToken
      .connect(otherAccounts[0])
      .approve(mockLottery10.address, tokenAmount);
    await mockLottery10.connect(otherAccounts[0]).enterLottery(1);

    // Generate a random number for testing purposes
    await mockLottery10.setGeneratedRandomNumberForTesting(
      ethers.utils.randomBytes(32)
    );

    // Declare the winner
    const balanceBefore = await mockToken.balanceOf(newConeTreasury);
    await mockLottery10.declareWinner();
    const balanceAfter = await mockToken.balanceOf(newConeTreasury);

    // Check that the new cone treasury received the correct funds
    const expectedIncrease = ethers.utils.parseEther("500"); // Assuming the cone treasury fee is 5% of the entry fee
    expect(balanceAfter.sub(balanceBefore)).to.equal(expectedIncrease);
  });
});
