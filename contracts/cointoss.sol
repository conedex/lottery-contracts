// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";


contract CoinTossGame is VRFConsumerBase, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    IERC20 public token; 
    bytes32 internal keyHash;
    uint256 internal fee;

    struct Bet {
        address bettor;
        uint256 amount;
        bool betOnHeads;
        bool settled;
    }

    mapping(address => bool) public admins;
    mapping(uint256 => Bet) public bets;
    mapping(address => uint256) public userBalances;
    uint256 public nextBetId;
    uint256 public roundId;
    bool public roundInProgress = false;
    uint256 public randomness;
    uint256 public entryFee;

    event BetPlaced(uint256 betId, address bettor, uint256 amount, bool betOnHeads);
    event RoundExecuted(uint256 roundId, bool coinTossResult);
    event BetSettled(uint256 betId, address bettor, uint256 amountWon);
    event Withdrawn(address user, uint256 amount);

    modifier onlyAdmin() {
        require(admins[msg.sender], "Only admin can call this function");
        _;
    }

    constructor(
        address _vrfCoordinator,
        address _linkToken,
        bytes32 _keyHash,
        address _token,
        uint _entryFee
    )
        VRFConsumerBase(_vrfCoordinator, _linkToken) Ownable(msg.sender)
    {
        keyHash = _keyHash;
        fee = 100000000000000; // 0.0001 LINK
        token = IERC20(_token);
        entryFee = _entryFee;
    }

    function placeBet(uint256 _amount, bool _betOnHeads) external whenNotPaused {
        require(!roundInProgress, "Round in progress, wait for it to end before placing a bet");
        uint256 totalBetAmount = userBalances[msg.sender] + _amount;
        require(totalBetAmount >= entryFee, "Must pay the entry fee to place a bet");

        if (userBalances[msg.sender] >= entryFee) {
            userBalances[msg.sender] -= entryFee;
        } else {
            uint256 amountToTransfer = entryFee - userBalances[msg.sender];
            token.safeTransferFrom(msg.sender, address(this), amountToTransfer);
            userBalances[msg.sender] = 0;
        }

        bets[nextBetId] = Bet({
            bettor: msg.sender,
            amount: entryFee,
            betOnHeads: _betOnHeads,
            settled: false
        });

        emit BetPlaced(nextBetId, msg.sender, entryFee, _betOnHeads);
        nextBetId++;
    }

    function executeRound() external onlyAdmin whenNotPaused{
        require(!roundInProgress, "Round already in progress");
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK");

        requestRandomness(keyHash, fee);
        roundInProgress = true;
    }

    function fulfillRandomness(bytes32, uint256 _randomness) internal override {
        randomness = _randomness;
    }

    function declareWinner() external onlyAdmin {
        require(roundInProgress, "No round in progress");
        require(randomness != 0, "Randomness not yet available");

        bool coinTossResult = randomness % 2 == 0;
        emit RoundExecuted(roundId, coinTossResult);

        for (uint256 i = 0; i < nextBetId; i++) {
            if (!bets[i].settled) {
                uint256 payout = 0;
                if ((bets[i].betOnHeads && coinTossResult) || (!bets[i].betOnHeads && !coinTossResult)) {
                    payout = bets[i].amount * 2;
                    userBalances[bets[i].bettor] += payout;
                }
                bets[i].settled = true;
                emit BetSettled(i, bets[i].bettor, payout);
            }
        }

        roundInProgress = false;
        randomness = 0;
        roundId++;
    }

    function addAdmin(address _admin) external onlyOwner whenNotPaused{
        admins[_admin] = true;
    }

    function removeAdmin(address _admin) external onlyOwner {
        require(admins[_admin], "Address is not an admin");
        delete admins[_admin];
    }

    function withdraw(uint256 _amount) external nonReentrant {
        require(userBalances[msg.sender] >= _amount, "Insufficient balance");
        require(token.balanceOf(address(this)) >= _amount, "Not enough funds in the contract");
        userBalances[msg.sender] -= _amount;
        token.safeTransfer(msg.sender, _amount);
        emit Withdrawn(msg.sender, _amount);
    }

    function withdrawLink(uint256 _amount) external onlyOwner {
        require(LINK.transfer(msg.sender, _amount), "Transfer failed");
    }
}
