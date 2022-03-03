// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./ERC721A.sol";
import "./ReentrancyGuard.sol";
import "./MerkleProof.sol";
contract Template721 is ERC721A, Ownable, ReentrancyGuard {

    // Fandem wallet address
    address FANDEM = 0x1Dd7134A77f5e3E2E63162bBdcFD494140908270;
    
    // Max supply 
    uint256 public maxSupply;

    // Max amount to mint per transaction
    uint256 public maxMintPerTx;

    // Merkle Root
    bytes32 public merkleRoot;

    // Price Per NFT
    uint256 public price;
    uint256 public whitelistPrice;
    
    // The address to receive payment from sales
    address payable payee;

    // Boolean value, if true only whitelist can buy, if false public can buy
    bool public whitelistOnly = true;
    bool public saleOpen;
    
    // whitelist mapping
    mapping(address => bool) public hasMinted;

    constructor(
        string memory name,
        string memory symbol,
        uint256 _price,
        uint256 _wlPrice,
        uint256 _maxSupply,
        uint256 _maxMintPerTx,
        address payable _payee,
        string memory _uri
    ) 
    ERC721A(name, symbol, 50, _maxSupply) 
    {
        maxSupply = _maxSupply;
        maxMintPerTx = _maxMintPerTx;
        price = _price;
        whitelistPrice = _wlPrice;
        payee = _payee;
        URI = _uri;
    }

    function isWhitelisted(address _recipient, bytes32[] calldata _merkleProof) public view returns(bool) {
        bytes32 leaf = keccak256(abi.encodePacked(_recipient));
        return MerkleProof.verify(_merkleProof, merkleRoot, leaf);
    }
    
    function mint(uint256 amount, address _recipient, bytes32[] calldata _merkleProof) public payable nonReentrant {
        require(saleOpen, "Sale is closed");
        require(totalSupply() + amount <= maxSupply, "Not enough left");
        require(amount <= maxMintPerTx, "Exceeds maximum amount per purchase");
        
        // Check if whitelisted
        if(isWhitelisted(_recipient, _merkleProof) && !hasMinted[_recipient]) {
            // Restrict to one transaction per whitelisted account
            require(msg.value == whitelistPrice * amount, "Incorrect amount of ETH sent");
            
            hasMinted[_recipient] = true;
        } else {
            require(!whitelistOnly, "Purchasing only available for whitelisted addresses");
            require(msg.value == price * amount, "Incorrect amount of ETH sent");
        }

        // Pay payee
        (bool success,) = payee.call{value: (msg.value / 100) * 95}("");
        require(success, "Transfer fail");

        (bool successs,) = FANDEM.call{value: (msg.value / 100) * 5}("");
        require(successs, "Transfer fail");
        
        // Mint NFT to user wallet
        _safeMint(_recipient, amount);
    }

    function mintTo(uint amount, address _recipient) public onlyOwner {
        require(totalSupply() + amount <= maxSupply, "Not enough left to mint");
        _safeMint(_recipient, amount);
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        (bool success,) = _msgSender().call{value: balance}("");
        require(success, "Transfer fail");
    }

    function setURI(string memory _uri) public onlyOwner {
        URI = _uri;
    }

    function resetWhitelists(address[] memory whitelistedAddress) public onlyOwner {
        for(uint256 i = 0; i < whitelistedAddress.length; i++){
            hasMinted[whitelistedAddress[i]] = false;
        }
    }

    function setWhitelistState(bool state) public onlyOwner {
        whitelistOnly = state;
    }

    function setSaleState(bool state) public onlyOwner {
        saleOpen = state;
    }

    function setRoot(bytes32 root) public onlyOwner {
        merkleRoot = root;
    }

}
