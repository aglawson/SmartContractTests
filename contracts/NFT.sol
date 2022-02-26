pragma solidity ^0.8.0;
import "./ERC721A.sol";
contract NFT is ERC721A {
    constructor(string memory name_, string memory symbol_) ERC721A(name_, symbol_, 100, 10000) {}

    function numberMinted(address owner) public view returns (uint256) {
        return _numberMinted(owner);
    }

    function baseURI() public view returns (string memory) {
        return _baseURI();
    }

    function safeMint(address to, uint256 quantity) public {
        _safeMint(to, quantity);
    }

    function safeMint(
        address to,
        uint256 quantity,
        bytes memory _data
    ) public {
        _safeMint(to, quantity, _data);
    }

    function mint(
        address to,
        uint256 quantity,
        bytes memory _data,
        bool safe
    ) public {
        mint(to, quantity, _data, safe);
    }

}