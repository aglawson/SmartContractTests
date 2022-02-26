import { ethers } from "hardhat";
import { Signer } from "ethers";
import chai, { expect } from 'chai';
import { solidity } from 'ethereum-waffle';

describe('ERC721A', function () {
  beforeEach(async function () {
    this.ERC721A = await ethers.getContractFactory('NFT');
    this.erc721a = await this.ERC721A.deploy('Test', 'TEST');
    await this.erc721a.deployed();
  });

  context('with no minted tokens', async function () {
    it('verifies there are 0 minted tokens', async function () {
      const totalSupply = await this.erc721a.totalSupply();
      expect(totalSupply).to.equal(0);
    });
  });

  context('with minted tokens', async function () {
    beforeEach(async function () {
      const [addr1] = await ethers.getSigners();
      this.addr1 = addr1;
      await this.erc721a['safeMint(address,uint256)'](addr1.address, 5);
    });

    it('validates the mint function', async function () {
      const totalSupply = await this.erc721a.totalSupply();
      expect(totalSupply).to.equal(5);
    });
  });

  context('minting', async function () {
    it('validates the mint limit', async function () {
      const [addr1] = await ethers.getSigners();
      await expect(this.erc721a['safeMint(address,uint256)'](addr1.address, 101)).to.be.reverted;
    });

    it('validates the mint function', async function () {
      const [addr1] = await ethers.getSigners();
      await expect(this.erc721a['safeMint(address,uint256)'](addr1.address, 1)).to.emit(this.erc721a, 'Transfer');
    });

    it('validates minting multiple tokens', async function () {
      const [addr1] = await ethers.getSigners();
      await expect(this.erc721a['safeMint(address,uint256)'](addr1.address, 100)).to.emit(this.erc721a, 'Transfer');
    });


    context('transfers', async function () {
      beforeEach(async function () {
        const [addr1, addr2] = await ethers.getSigners();
        this.addr1 = addr1;
        this.addr2 = addr2;
        const tokenId = 0;
        const tokenId1 = 1;
        await this.erc721a['safeMint(address,uint256)'](addr1.address, 1);
        await this.erc721a['safeMint(address,uint256)'](addr2.address, 1);
      });

      it('validates transferring tokens', async function () {
        await expect(this.erc721a['transferFrom(address,address,uint256)'](this.addr1.address, this.addr2.address, 0)).to.emit(this.erc721a, 'Transfer');
      });

      it('validates transfer restrictions', async function () {
        await expect(this.erc721a['transferFrom(address,address,uint256)'](this.addr2.address, this.addr1.address, 0)).to.be.reverted;
      });

    });

  });
  
});