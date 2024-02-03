// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./LotteryNFT.sol";

contract Lottery is VRFConsumerBase, Ownable, Pausable {
    LotteryWinnerNFT public nftContract;
    IERC20 public token;
    uint256 public tokenPerEntry;
    bytes32 internal keyHash;
    uint256 internal fee;
    address public rewardWallet;
    address public lastWinner;
    address public coneTreasury;
    uint256 public lastPrize;
    uint256 public currentPool;
    uint256 public nextUserId;
    uint256 public generatedRandomNumber;
    uint256 public currentLotteryVersion = 3;
    uint256 public winnerFee;
    uint256 public coneTreasuryFee;
    mapping(address => bool) public admins;
    mapping(uint256 => address) public userIds;
    mapping(address => uint256) public winnings;
    mapping(address => uint256) public totalWinnings;
    mapping(address => uint256) public userContributions;
    mapping(address => uint256) public userLastParticipationVersion;
    mapping(uint256 => address) public versionWinners;

    event UserEntered(address indexed user, uint256 userId);
    event RandomNumberGenerated(uint256 randomNumber);
    event WinnerSelected(address winner, uint256 prize, uint256 version);
    event LotteryStarted(uint256 version);

    modifier onlyAdmin() {
        require(admins[msg.sender], "Only admin can call this function");
        _;
    }

    constructor(
        address _vrfCoordinator,
        address _link,
        bytes32 _keyHash,
        address _token,
        uint256 _tokenPerEntry,
        address _rewardWallet,
        address _admin,
        address _coneTreasury,
        uint256 _winnerFee,
        uint256 _coneTreasuryFee,
        address _nftContract
    ) VRFConsumerBase(_vrfCoordinator, _link) Ownable(msg.sender) {
        keyHash = _keyHash;
        fee = 100000000000000; // 0.0001 LINK
        token = IERC20(_token);
        tokenPerEntry = _tokenPerEntry;
        rewardWallet = _rewardWallet;
        admins[_admin] = true;
        coneTreasury = _coneTreasury;
        winnerFee = _winnerFee;
        coneTreasuryFee = _coneTreasuryFee;
        nftContract = LotteryWinnerNFT(_nftContract);
    }

    function enterLottery(uint256 numEntries) external whenNotPaused {
        uint256 totalTokens = numEntries * tokenPerEntry;
        require(token.balanceOf(msg.sender) >= totalTokens, "Insufficient tokens to enter");
        require(token.transferFrom(msg.sender, address(this), totalTokens), "Transfer failed");

        for (uint256 i = 0; i < numEntries; i++) {
            userIds[nextUserId] = msg.sender;
            emit UserEntered(msg.sender, nextUserId);
            nextUserId++;
        }

        currentPool += totalTokens;
        userContributions[msg.sender] += totalTokens;
        userLastParticipationVersion[msg.sender] = currentLotteryVersion;
    }

    function declareWinner() external onlyAdmin {
        require(nextUserId > 0, "No participants in the lottery");
        require(generatedRandomNumber != 0, "Random number must be generated first");
        uint256 winnerId = generatedRandomNumber % nextUserId;
        lastWinner = userIds[winnerId];
        uint256 reward = (currentPool * winnerFee) / 100;
        uint256 coneTreasuryReward = (reward * coneTreasuryFee) / 100;
        uint256 rewardWalletReward = reward - coneTreasuryReward;
        uint256 prize = currentPool - reward;

        require(token.transfer(lastWinner, prize), "Transfer to winner failed");
        require(token.transfer(rewardWallet, rewardWalletReward), "Transfer to reward wallet failed");
        require(token.transfer(coneTreasury, coneTreasuryReward), "Transfer to cone treasury failed");

        lastPrize = prize;
        winnings[lastWinner] += prize;
        totalWinnings[lastWinner] += prize;
        versionWinners[currentLotteryVersion] = lastWinner;
        emit WinnerSelected(lastWinner, prize, currentLotteryVersion);

        // Resetting for the next lottery
        currentPool = 0;
        nextUserId = 0;
        generatedRandomNumber = 0;
        currentLotteryVersion++;

        emit LotteryStarted(currentLotteryVersion);
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        generatedRandomNumber = randomness;
        emit RandomNumberGenerated(randomness);
    }

    function generateRandomNumber() external onlyAdmin {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK to pay fee");
        requestRandomness(keyHash, fee);
    }

    function getUserContributions(address user) external view returns (uint256) {
        if (userLastParticipationVersion[user] == currentLotteryVersion) {
            return userContributions[user];
        } else {
            return 0;
        }
    }

    function setTokenPerEntry(uint256 _tokenPerEntry) external onlyOwner {
        tokenPerEntry = _tokenPerEntry;
    }

    function addAdmin(address _admin) external onlyOwner {
        admins[_admin] = true;
    }

    function removeAdmin(address _admin) external onlyOwner {
        require(admins[_admin], "Address is not an admin");
        delete admins[_admin];
    }


    function withdrawLink() external onlyOwner {
        require(LINK.transfer(msg.sender, LINK.balanceOf(address(this))), "Transfer failed");
    }

    function getLastWinner() external view returns (address) {
        return lastWinner;
    }

    function getLastPrize() external view returns (uint256) {
        return lastPrize;
    }

    function getCurrentPool() external view returns (uint256) {
        return currentPool;
    }

    function getUserBalance() external view returns (uint256) {
        return token.balanceOf(msg.sender);
    }

    function getUserContributions() external view returns (uint256) {
        if (userLastParticipationVersion[msg.sender] != currentLotteryVersion) {
            return 0;
        }

        return userContributions[msg.sender];
    }

    function getWinner(uint256 version) external view returns (address) {
        return versionWinners[version];
    }

    function getUserEntries(address user) external view returns (uint256) {
        if (userLastParticipationVersion[user] != currentLotteryVersion) {
            return 0;
        }

        return userContributions[user] / tokenPerEntry;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setRewardWallet(address _rewardWallet) external onlyOwner {
        rewardWallet = _rewardWallet;
    }

    function setConeTreasury(address _coneTreasury) external onlyOwner {
        coneTreasury = _coneTreasury;
    }

    function setWinnerFee(uint256 _winnerFee) external onlyOwner {
        winnerFee = _winnerFee;
    }

    function setConeTreasuryFee(uint256 _coneTreasuryFee) external onlyOwner {
        coneTreasuryFee = _coneTreasuryFee;
    }

    function setWinnerNFT(address _nftContract) public onlyOwner {
        nftContract = LotteryWinnerNFT(_nftContract);
    }
    
    function winnerNft() public onlyAdmin {
        nftContract.mint(lastWinner);
    }

    function withdrawTokens() external onlyOwner whenPaused {
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        require(token.transfer(msg.sender, balance), "Transfer failed");
    }
}

