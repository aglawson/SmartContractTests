import { ethers } from "hardhat";
import { Signer } from "ethers";
import chai, { expect } from 'chai';
import { solidity } from 'ethereum-waffle';
const { constants } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const RECEIVER_MAGIC_VALUE = '0x150b7a02';


describe('ERC721A', function () {
  beforeEach(async function () {
    this.ERC721A = await ethers.getContractFactory('NFT');
    this.erc721a = await this.ERC721A.deploy('Test', 'TEST');
    this.ERC721Receiver = await ethers.getContractFactory('ERC721ReceiverMock');
    this.startTokenId = 0;

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
      const [owner, addr1, addr2, addr3] = await ethers.getSigners();
      this.owner = owner;
      this.addr1 = addr1;
      this.addr2 = addr2;
      this.addr3 = addr3;
      await this.erc721a['safeMint(address,uint256)'](addr1.address, 1);
      await this.erc721a['safeMint(address,uint256)'](addr2.address, 2);
      await this.erc721a['safeMint(address,uint256)'](addr3.address, 3);
    });

    describe('exists', async function () {
      it('verifies valid tokens', async function () {
        for (let tokenId = this.startTokenId; tokenId < 6 + this.startTokenId; tokenId++) {
          const exists = await this.erc721a.exists(tokenId);
          expect(exists).to.be.true;
        }
      });

      it('verifies invalid tokens', async function () {
        expect(await this.erc721a.exists(6 + 6)).to.be.false;
      });

      describe('balanceOf', async function () {
        it('returns the amount for a given address', async function () {
          expect(await this.erc721a.balanceOf(this.owner.address)).to.equal('0');
          expect(await this.erc721a.balanceOf(this.addr1.address)).to.equal('1');
          expect(await this.erc721a.balanceOf(this.addr2.address)).to.equal('2');
          expect(await this.erc721a.balanceOf(this.addr3.address)).to.equal('3');
        });

        it('throws an exception for the 0 address', async function () {
          await expect(this.erc721a.balanceOf(ZERO_ADDRESS)).to.be.reverted;
        });
      });

      describe('_numberMinted', async function () {
        it('returns the amount for a given address', async function () {
          expect(await this.erc721a.numberMinted(this.owner.address)).to.equal('0');
          expect(await this.erc721a.numberMinted(this.addr1.address)).to.equal('1');
          expect(await this.erc721a.numberMinted(this.addr2.address)).to.equal('2');
          expect(await this.erc721a.numberMinted(this.addr3.address)).to.equal('3');
        });
      });

      context('_totalMinted', async function () {
        it('has 6 totalMinted', async function () {
          const totalMinted = await this.erc721a.totalMinted();
          expect(totalMinted).to.equal('6');
        });
      });

    });

});
context('transfers', async function () {
  beforeEach(async function () {
    const [addr1, addr2] = await ethers.getSigners();
    //this.owner = owner;
    this.addr1 = addr1;
    this.addr2 = addr2;
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
  describe('mint', function () {
    this.beforeEach(async function () {
      const [owner, addr1, addr2, addr3] = await ethers.getSigners();
      this.owner = owner;
      this.addr1 = addr1;
      this.addr2 = addr2;
      this.addr3 = addr3;
      this.receiver = await this.ERC721Receiver.deploy(RECEIVER_MAGIC_VALUE);
    });
    const data = '0x42';
  
    it('successfully mints a single token', async function () {
      const mintTx = await this.erc721a['safeMint(address,uint256)'](this.receiver.address, 1);
      await expect(mintTx)
        .to.emit(this.erc721a, 'Transfer');
      //await expect(mintTx).to.not.emit(this.receiver, 'Received');
      expect(await this.erc721a.ownerOf(this.startTokenId)).to.equal(this.receiver.address);
    });
  
    it('successfully mints multiple tokens', async function () {
      const mintTx = await this.erc721a['safeMint(address,uint256)'](this.receiver.address, 5);
      for (let tokenId = this.startTokenId; tokenId < 5 + this.startTokenId; tokenId++) {
        await expect(mintTx)
          .to.emit(this.erc721a, 'Transfer')
          .withArgs(ZERO_ADDRESS, this.receiver.address, tokenId);
        //await expect(mintTx).to.not.emit(this.receiver, 'Received');
       await expect(await this.erc721a.ownerOf(tokenId)).to.equal(this.receiver.address);
      }
    });
  
    it('reverts for non-receivers', async function () {
      const nonReceiver = this.erc721a.address;
      await expect(this.erc721a['safeMint(address,uint256)'](nonReceiver, 1)).to.be.reverted;
    });
  
    it('rejects mints to the zero address', async function () {
      await expect(this.erc721a['safeMint(address,uint256)'](ZERO_ADDRESS, 1)).to.be.reverted;
    });
  
    it('requires quantity to be greater than 0', async function () {
      await expect(this.erc721a['safeMint(address,uint256)'](this.receiver.address, 0));
    });
  });

});

describe('Template Contract', function () {
  beforeEach(async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    this.owner = owner;
    this.addr1 = addr1;
    this.addr2 = addr2;

    this.Template721 = await ethers.getContractFactory('Template721');
    this.t721 = await this.Template721.deploy('Test', 'TEST', 2, 1, 100, 20, owner.address, 'ipfs.io/hashvalue/token_id=');
    //this.ERC721Receiver = await ethers.getContractFactory('ERC721ReceiverMock');
    this.startTokenId = 0;

    await this.t721.deployed();
  });

  context('with no minted tokens', async function () {
    it('verifies there are 0 minted tokens', async function () {
      const totalSupply = await this.t721.totalSupply();
      expect(totalSupply).to.equal(0);
    });
  });

  context('in default sale state', async function () {
    it('does not allow any purchases', async function () {
      await expect(this.t721['mint(uint256,address,bytes32[])'](1, this.addr1.address, [])).to.be.revertedWith('Sale is closed');
    });

    it('does allow owner to mint', async function () {
      const mintTo = await this.t721['mintTo(uint256,address)'](1, this.addr1.address);
      await expect(await this.t721.balanceOf(this.addr1.address)).to.equal(1);
    });

    it('does not allow non owner to mint for free', async function () {
      await expect(this.t721.connect(this.addr1)['mintTo(uint256,address)'](1, this.addr1.address)).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('has a false saleOpen value by default', async function () {
      const newState = await this.t721.saleOpen();
      await expect(newState).to.equal(false);
    });

    it('allows owner to change sale state', async function () {
      const stateChange = await this.t721.connect(this.owner)['setSaleState(bool)'](true);
      const newState = await this.t721.saleOpen();
      await expect(newState).to.equal(true);
    });

    it('does not allow non owner to change sale state', async function () {
      await expect(this.t721.connect(this.addr1)['setSaleState(bool)'](true)).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('has a true whitelistOnly value by default', async function () {
      const defaultState = await this.t721.whitelistOnly();
      await expect(defaultState).to.equal(true);
    });

    it('allows owner to change whitelistOnly state', async function () {
      const stateChange = await this.t721.connect(this.owner)['setWhitelistState(bool)'](false);
      const newState = await this.t721.saleOpen();
      await expect(newState).to.equal(false);
    });

    it('does not allow non owner to change whitelistOnly state', async function () {
      await expect(this.t721.connect(this.addr1)['setWhitelistState(bool)'](false)).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  context('public mint', async function () {
    this.beforeEach(async function () {
      await this.t721.connect(this.owner)['setWhitelistState(bool)'](false);
      await this.t721.connect(this.owner)['setSaleState(bool)'](true);
    });

    it('allows non-whitelisted address to mint', async function () {
      await this.t721.connect(this.addr1)['mint(uint256,address,bytes32[])'](1,this.addr1.address,[], {value: 2});
      // console.log('balance', await this.t721.balanceOf(this.addr1.address));
      await expect(await this.t721.balanceOf(this.addr1.address)).to.equal(1);
    });

    it('requires correct amount of eth', async function () {
      await expect(this.t721.connect(this.addr1)['mint(uint256,address,bytes32[])'](1,this.addr1.address,[],{value: 1})).to.be.revertedWith('Incorrect amount of ETH sent');
    });

    it('does not accept value higher than price', async function () {
      await expect(this.t721.connect(this.addr1)['mint(uint256,address,bytes32[])'](1,this.addr1.address,[],{value: 3})).to.be.revertedWith('Incorrect amount of ETH sent');
    });

    it('mints multiple', async function () {
      await this.t721.connect(this.addr1)['mint(uint256,address,bytes32[])'](20,this.addr1.address,[], {value: 40});
      await expect(await this.t721.balanceOf(this.addr1.address)).to.equal(20);
    });

    it('does not allow more than 20 per tx', async function () {
      await expect(this.t721.connect(this.addr1)['mint(uint256,address,bytes32[])'](21,this.addr1.address,[], {value: 42})).to.be.revertedWith('Exceeds maximum amount per purchase');
    })

    it('does not allow max supply to be exceeded', async function () {
      await this.t721.connect(this.owner).mintTo(50,this.addr2.address);
      await this.t721.connect(this.owner).mintTo(50,this.addr2.address);
      await expect(this.t721.connect(this.addr1)['mint(uint256,address,bytes32[])'](1,this.addr1.address,[], {value: 2})).to.be.revertedWith('Not enough left');
    });
  });


});