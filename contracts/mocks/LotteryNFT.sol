//SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../utils/Counters.sol";


contract LotteryWinnerNFT is ERC721, ERC721Burnable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdTracker;

    uint256 public mintPrice;
    uint256 public totalSupply;
    uint256 public totalBurned;
    uint256 public mintStopValue;
    string public baseTokenUri;
    address public ownerAddress;
    mapping(address => uint256) public walletMints;
    mapping(address => bool) public admins;

    modifier onlyAdmin() {
        require(admins[msg.sender], "Only admin can call this function");
        _;
    }

    constructor() ERC721("Bitcone Lottery Winner", "CONEW") Ownable(msg.sender) {
        totalSupply = 0;
    }

    function setBaseTokenUri(string calldata baseTokenUri_) external onlyOwner {
        baseTokenUri = baseTokenUri_;
    }

    function tokenURI(uint256 tokenId_) public view override returns (string memory) {
        require(ownerOf(tokenId_) != address(0), "Token does not exist!");
        return string(abi.encodePacked(baseTokenUri, Strings.toString(tokenId_), ".json"));
    }


    function mint(address to) public onlyOwner {

        uint256 newTokenId = totalSupply + 1;
        _safeMint(to, newTokenId);
        totalSupply++;
    }


    function burn(uint256 tokenId) public virtual override {
        super.burn(tokenId);
        totalBurned++;
    }

    function addAdmin(address _admin) external onlyOwner {
        admins[_admin] = true;
    }

    function removeAdmin(address _admin) external onlyOwner {
        require(admins[_admin], "Address is not an admin");
        delete admins[_admin];
    }

}