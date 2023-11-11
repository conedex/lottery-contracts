// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Lottery is VRFConsumerBase, Ownable {
    IERC20 public token;
    uint256 public tokenPerEntry;
    bytes32 internal keyHash;
    uint256 internal fee;
    address public rewardWallet;
    address public lastWinner;
    uint256 public lastPrize;
    uint256 public currentPool;
    uint256 public nextUserId;
    uint256 public generatedRandomNumber;
    mapping(address => bool) public admins;
    mapping(uint256 => address) public userIds;
    mapping(address => uint256) public winnings;

    event UserEntered(address indexed user, uint256 userId);
    event WinnerSelected(address winner, uint256 prize);

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
        address _admin
    ) VRFConsumerBase(_vrfCoordinator, _link) Ownable(msg.sender) {
        keyHash = _keyHash;
        fee = 100000000000000; // 0.0001 LINK
        token = IERC20(_token);
        tokenPerEntry = _tokenPerEntry;
        rewardWallet = _rewardWallet;
        admins[_admin] = true;
    }

    function enterLottery() external {
        require(token.transferFrom(msg.sender, address(this), tokenPerEntry), "Transfer failed");
        userIds[nextUserId] = msg.sender;
        emit UserEntered(msg.sender, nextUserId);
        nextUserId++;
        currentPool += tokenPerEntry;
    }

    function declareWinner() external onlyAdmin {
        require(generatedRandomNumber != 0, "Random number must be generated first");

        uint256 winnerId = generatedRandomNumber % nextUserId;
        lastWinner = userIds[winnerId];
        uint256 reward = (currentPool * 5) / 100;
        uint256 prize = currentPool - reward;

        require(token.transfer(lastWinner, prize), "Transfer to winner failed");
        require(token.transfer(rewardWallet, reward), "Transfer to reward wallet failed");

        lastPrize = prize;
        winnings[lastWinner] += prize;
        emit WinnerSelected(lastWinner, prize);

        currentPool = 0;
        nextUserId = 0;
        generatedRandomNumber = 0;
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        generatedRandomNumber = randomness;
    }

    function generateRandomNumber() external onlyAdmin {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK to pay fee");
        requestRandomness(keyHash, fee);
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
}
