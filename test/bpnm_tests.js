const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");

  const { expect } = require("chai");
  const { BigNumber, bigNumberify, utils, parseEther, formatEther, constants  } = require("ethers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

  /**
   * @dev All tests for bPNM contract.
   * Note that _busd stands for USDT
   * During tests BTCB price is set to 50000 at bPNM contract. To test oracle price first line in getBtcPrice should be commented
   */
  describe("dPNM", () => {
    const owner = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const user1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const user2 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
    const user3 = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
    const user4 = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";
    const user5 = "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc";
    const user6 = "0x976EA74026E726554dB657fA54763abd0C3a0aa9";
    const user7 = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955";
    const user8 = "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f";
    const user9 = "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720";
    const user10 = "0xBcd4042DE499D14e55001CcbB24a551F3b954096";
    const user11 = "0x71bE63f3384f5fb98995898A86B02Fb2426c5788";
    const user12 = "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a";
    const user13 = "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec";
    const user14 = "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097";
    const user15 = "0xcd3B766CCDd6AE721141F452C550Ca635964ce71";
    const user16 = "0x2546BcD3c84621e976D8185a91A922aE77ECEc30";
    const user17 = "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E";
    const user18 = "0xdD2FD4581271e230360230F9337D5c0430Bf44C0";
    const user19 = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";
    const user20 = "0x09DB0a93B389bEF724429898f539AEB7ac2Dd55f";
    const user21 = "0x02484cb50AAC86Eae85610D6f4Bf026f30f6627D";
    const user22 = "0x08135Da0A343E492FA2d4282F2AE34c6c5CC1BbE";
    const user23 = "0x5E661B79FE2D3F6cE70F5AAC07d8Cd9abb2743F1";
    const user24 = "0x61097BA76cD906d2ba4FD106E757f7Eb455fc295";
    const user25 = "0xDf37F81dAAD2b0327A0A50003740e1C935C70913";
    const user26 = "0x553BC17A05702530097c3677091C5BB47a3a7931";
    const user27 = "0x87BdCE72c06C21cd96219BD8521bDF1F42C78b5e";
    const usdtOwner = "0x40Fc963A729c542424cD800349a7E4Ecc4896624";//user28
    const payment2Owner = "0x9DCCe783B6464611f38631e6C851bf441907c710";//user29
    const payment3Owner = "0x1BcB8e569EedAb4668e55145Cfeaf190902d3CF2";//user30
    const feeCollector = "0x8263Fce86B1b78F95Ab4dae11907d8AF88f841e7";//user31
    const busdOwner = "0xcF2d5b3cBb4D7bF04e3F7bFa8e27081B52191f91";//user32
    const liquidityCollector = "0x86c53Eb85D0B7548fea5C4B4F82b4205C8f6Ac18";//user33
    const btcbOwner = "0x1aac82773CB722166D7dA0d5b0FA35B0307dD99D";//user34
    const btcbCollector = "0x2f4f06d218E426344CFE1A83D53dAd806994D325";//user35

    /**
     * @dev Fixture. Deploying dPNM, Tree and GWT contract. Adding allowed contracts.
     * @returns 
     */
    async function deploybPNMandTree() {

        // Create the smart contract object to test from
        let signers = await ethers.getSigners();
        const _owner = signers[0];
        const _user1 = signers[1];
        const _user2 = signers[2];
        const _user3 = signers[3];
        const _busd_owner = signers[32];
        const _btcb_owner = signers[34];
        const _usdt_owner = signers[28];
        const _payment2_owner = signers[29];
        const _payment3_owner = signers[30];
        
        //deploy busd
        let Token = await ethers.getContractFactory("BEP20Token");
        const _busd = await Token.connect(_busd_owner).deploy();
        console.log("BUSD address=",_busd.address);
        
        //deploy Payment2
        Token = await ethers.getContractFactory("BEP20Payment2");
        const _payment2 = await Token.connect(_payment2_owner).deploy();
        console.log("Payment2 address=",_payment2.address);

        //deploy Payment3
        Token = await ethers.getContractFactory("BEP20Payment3");
        const _payment3 = await Token.connect(_payment3_owner).deploy();
        console.log("Payment3 address=",_payment3.address);

        //deploy btcb
        let btcbToken = await ethers.getContractFactory("BEP20BTCBToken");
        const _btcb = await btcbToken.connect(_btcb_owner).deploy();
        console.log("BTCB address=",_btcb.address);

        //deploy phenomenalTree
        Token = await ethers.getContractFactory("phenomenalTree");
        const _tree = await Token.connect(_owner).deploy();
        console.log("phenomenalTree address=",_tree.address);
            
        //deploy gwt
        Token = await ethers.getContractFactory("GWT_BEP20");
        _gwt = await Token.deploy();
        console.log("GWT address=",_gwt.address);

        const totalNft = 10000
        //deploy NFT consultants
        let nftCons = await ethers.getContractFactory("ERC721PhenomenalConsultants");
        const _nft = await nftCons.connect(_owner).deploy(owner,_busd.address,feeCollector,_gwt.address,totalNft);
        console.log("NFT address=",_nft.address);
        

        //deploy bpnm
        Token = await ethers.getContractFactory("BEP20BPNM");
        const _bpnm = await Token.connect(_owner).deploy(_btcb.address,_tree.address,_gwt.address, btcbCollector);
        console.log("bPNM address=",_bpnm.address);
        
        //deploy MarketingBPNM
        Token = await ethers.getContractFactory("MarketingBPNM");
        const _marketing = await Token.connect(_owner).deploy(_busd.address, _tree.address, _gwt.address, feeCollector, liquidityCollector, _nft.address, _bpnm.address);
        console.log("bPNM marketing address=",_marketing.address);
        
        //unlock bpnm
        await _bpnm.connectMarketingContract(_marketing.address)
        await _bpnm.triggerLock()
        await _marketing.triggerLock()
        
        //deploy btcbCollector
        let btcbColl = await ethers.getContractFactory("PhenomenalLiquidityDistributor");
        const _btcbCollector = await btcbColl.connect(_owner).deploy(_btcb.address,_bpnm.address,_marketing.address);
        // await _btcbCollector.init(_btcb.address,_bpnm.address);
        console.log("PLD address=",_btcbCollector.address);
        
        await _nft.addAllowedContract(_marketing.address)

        // make 20 batches of 500 tokens to set 10 000
        let totalRarity = 0;
        for (let x=1; x<=totalNft/500;x++) {
            //Set rarity for all tokens
            let tokenIds = []; // Replace with your actual token IDs
            let rarityLevels = []; // Replace with your actual rarity levels
            for (let i = 500*x-499; i <= 500*x; i++) {
                tokenIds.push(i);
                rarity = Math.floor(Math.random() * 1040) + 1;
                rarityLevels.push(rarity);
                
            }
            await _nft.setBatchRarityLevels(tokenIds,rarityLevels)
        }


        
        //add dpnm to allowed contracts to call phenomenalTree
        // await _tree.addAllowedContract(_bpnm.address);
        await _tree.addAllowedContract(_marketing.address);

        //add dpnm to allowed contracts to call gwt
        await _gwt.addAllowedContract(_bpnm.address);
        await _gwt.addAllowedContract(_nft.address);
        await _gwt.addAllowedContract(_marketing.address);
        //set dpnm address and feecollector for gwt
        await _gwt.init(_bpnm.address, feeCollector, _busd.address);
        //init btcbCollector correct address in bPNM
        await _bpnm.initBtcbLiquidityCollector(_btcbCollector.address);
        await _marketing.initBtcbLiquidityCollector(_btcbCollector.address);

        return { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing };
    }

       
    /**
    * @dev Fixture. First user make activation after contracts deployment */
    async function firstUserRegisters() {
        const { _bpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(deploybPNMandTree);

        //transfer 10 BUSD to user1 , increase allowance
        const transfer_weiValue = utils.parseEther("10");
        await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
        //increase allowance
        await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("10"))
        
        await _marketing.connect(_user1).activate(user1,owner,1);
        return { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing };

        

    }

    

        /**
     * @dev Fixture. First 16 users make activation. Each next user use ref link of previous user.
     * @returns 
     */
    async function SixteenUsersRegistered() {
        /* 10 users are registered after owner, each one use reflink of the previous user*/
        const { _bpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(deploybPNMandTree);
        let signers = await ethers.getSigners();

        // transfer 10 BUSD to each user, increase allowance
        const transfer_weiValue = utils.parseEther("10");
        await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user2,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user3,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user4,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user5,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user6,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user7,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user8,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user9,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user10,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user11,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user12,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user13,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user14,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user15,transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user16,transfer_weiValue)
        // increase allowance
        await _busd.connect(signers[1]).increaseAllowance(_marketing.address,utils.parseEther("10"))
        await _busd.connect(signers[2]).increaseAllowance(_marketing.address,utils.parseEther("10"))
        await _busd.connect(signers[3]).increaseAllowance(_marketing.address,utils.parseEther("10"))
        await _busd.connect(signers[4]).increaseAllowance(_marketing.address,utils.parseEther("10"))
        await _busd.connect(signers[5]).increaseAllowance(_marketing.address,utils.parseEther("10"))
        await _busd.connect(signers[6]).increaseAllowance(_marketing.address,utils.parseEther("10"))
        await _busd.connect(signers[7]).increaseAllowance(_marketing.address,utils.parseEther("10"))
        await _busd.connect(signers[8]).increaseAllowance(_marketing.address,utils.parseEther("10"))
        await _busd.connect(signers[9]).increaseAllowance(_marketing.address,utils.parseEther("10"))
        await _busd.connect(signers[10]).increaseAllowance(_marketing.address,utils.parseEther("10"))
        await _busd.connect(signers[11]).increaseAllowance(_marketing.address,utils.parseEther("10"))
        await _busd.connect(signers[12]).increaseAllowance(_marketing.address,utils.parseEther("10"))
        await _busd.connect(signers[13]).increaseAllowance(_marketing.address,utils.parseEther("10"))
        await _busd.connect(signers[14]).increaseAllowance(_marketing.address,utils.parseEther("10"))
        await _busd.connect(signers[15]).increaseAllowance(_marketing.address,utils.parseEther("10"))
        await _busd.connect(signers[16]).increaseAllowance(_marketing.address,utils.parseEther("10"))

        //activate users
        for (let i=1;i<=16;i++) {
            await _marketing.connect(signers[i]).activate(signers[i].address,signers[i-1].address,1);    
        }
        
        return { _bpnm, _busd, _tree, _owner, signers, _btcb, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing };


    }
    async function TwentyUsersRegisteredTopPack() {
        /* 10 users are registered after owner, each one use reflink of the previous user*/
        const { _bpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _marketing } = await loadFixture(deploybPNMandTree);
        let signers = await ethers.getSigners();

        const transfer_weiValue = utils.parseEther("10002");

        for (let i=1;i<=20;i++) {
            await _busd.connect(_busd_owner).transfer(signers[i].address,transfer_weiValue)
        }
        
        for (let i=1;i<=20;i++) {
            await _busd.connect(signers[i]).increaseAllowance(_marketing.address,transfer_weiValue)
            
        }
        
        //activate users
        for (let i=1;i<=20;i++) {
            await _marketing.connect(signers[i]).activate(signers[i].address,signers[i-1].address,12);    
        }
        
        return { _bpnm, _busd, _tree, _owner, signers, _marketing };


    }

    async function TwentyUsersRegisteredPackId9() {
        /* 10 users are registered after owner, each one use reflink of the previous user*/
        const { _bpnm, _busd, _tree, _owner,  _user1, _user2, _user3, _busd_owner, _marketing } = await loadFixture(deploybPNMandTree);
        let signers = await ethers.getSigners();

        const transfer_weiValue = utils.parseEther("1002");

        for (let i=1;i<=20;i++) {
            await _busd.connect(_busd_owner).transfer(signers[i].address,transfer_weiValue)
        }
        
        for (let i=1;i<=20;i++) {
            await _busd.connect(signers[i]).increaseAllowance(_marketing.address,transfer_weiValue)
            
        }
        
        //activate users
        for (let i=1;i<=20;i++) {
            await _marketing.connect(signers[i]).activate(signers[i].address,signers[i-1].address,9);    
        }
        
        return { _bpnm, _busd, _tree, _owner, signers, _marketing };


    }

        
    /** 
     * @dev Calculate total company balances for check that flows are correct     
     */
    async function calcCompanyValue(_busd,_bpnm,_marketing) {
        let signers = await ethers.getSigners();
        
        bpnmUsdtBalance = await _busd.balanceOf(_marketing.address)

        totalFrozen = await _marketing.totalFrozen()

        totalEarnings = await _marketing.totalUsersEarnings()

        usdtLiquidityBal = await _busd.balanceOf(liquidityCollector)
        
        feeCollBal = await _busd.balanceOf(feeCollector)
        
        console.log("")
        console.log("------Contract overview START-----")
        console.log("bPNM USDT= %s | Earnings= %s | Frozen= %s | Fee Collector= %s | USDT liq= %s | ", utils.formatEther(bpnmUsdtBalance), utils.formatEther(totalEarnings), utils.formatEther(totalFrozen), utils.formatEther(feeCollBal), utils.formatEther(usdtLiquidityBal))
        console.log("Total= %s USDT", Number(utils.formatEther(feeCollBal)) + Number(utils.formatEther(usdtLiquidityBal)) + Number(utils.formatEther(totalEarnings)) + Number(utils.formatEther(totalFrozen)))
        console.log("------Contract overview END-----")
        console.log("")
        // totalFunds = Number(utils.formatEther(feeCollBal)) + Number(utils.formatEther(usdtLiquidityBal)) + Number(utils.formatEther(totalEarnings)) + Number(utils.formatEther(totalFrozen))
        
        
    }


    /**
     * @dev Function for fast USDT deposit to user
     */
    async function depositUSDT(_busd,_receiver,_amount) {
        let signers = await ethers.getSigners();
        const _busd_owner = signers[32];
        
        //transfer BUSD to user1 , increase allowance
        const transfer_weiValue = utils.parseEther(_amount);
        await _busd.connect(_busd_owner).transfer(_receiver,transfer_weiValue)        
    }

    /**
     * @dev Function for fast BTCB deposit to user
     */
    async function depositBTCB(_btcb,_receiver,_amount) {
        let signers = await ethers.getSigners();
        const _btcb_owner = signers[34];
        
        //transfer BUSD to user1 , increase allowance
        const transfer_weiValue = utils.parseEther(_amount);
        await _btcb.connect(_btcb_owner).transfer(_receiver,transfer_weiValue)        
    }
    
    /**
     * @dev Function for fast payment2 deposit to user
     */
    async function depositP2(_payment2,_receiver,_amount) {
        let signers = await ethers.getSigners();
        const _payment2_owner = signers[29];
        
        //transfer balance
        const transfer_weiValue = utils.parseEther(_amount);
        await _payment2.connect(_payment2_owner).transfer(_receiver,transfer_weiValue)        
    }

    /**
     * @dev Function for fast payment3 deposit to user
     */
    async function depositP3(_payment3,_receiver,_amount) {
        let signers = await ethers.getSigners();
        const _payment3_owner = signers[30];
        
        //transfer balance
        const transfer_weiValue = utils.parseEther(_amount);
        await _payment3.connect(_payment3_owner).transfer(_receiver,transfer_weiValue)        
    }

    /**
     * 
     * @dev Disable bPNM prestart mode. Please note that before this function disablePrestart at PLD should be called
     */
    async function _disabelPrestart(_btcb,_btcbCollector,_owner,_bpnm) {
        //deposit 0.0002 btcb
        await depositBTCB(_btcb, _owner.address, "0.0002")
        //increase allowance
        await _btcb.connect(_owner).increaseAllowance(_bpnm.address,utils.parseEther("0.0002"))
        await _bpnm.disablePrestartMode();
        console.log("Prestart disabled");
        
    }

    /**
     * @dev Convert bigInt to float with 3 digits after comma
     */
    function _bigIntToFixedFloat(_number) {
        return parseFloat(utils.formatEther(_number)).toFixed(3)
    }

    /**
     * @dev enable_test allows to set which test blocks to run, should be all 1 to run all tests to measure coverage
     */
    // const enable_test = [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0]
    const enable_test = [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1]



    describe("==1) Deployment bPNM", function () {
        if (!enable_test[1]) {
            return(0)
        }

        it("Limit packs should be inited correctly", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(deploybPNMandTree);
            data = await _marketing.getLimitPack(1)
            console.log("🚀 ~ file: bpnm_tests.js:248 ~ data:", data)
            console.log(data.cost)
            expect(await _bpnm.prestartMode()).to.equal(true);
            expect(await _bpnm.name()).to.be.equal("bPNM")
            expect(await _bpnm.symbol()).to.be.equal("bPNM")
            expect(await _bpnm.decimals()).to.be.equal(18)
            expect(await _bpnm.promoter()).to.be.equal(_owner.address)
            expect(await _bpnm.bpnmPrice()).to.be.equal(utils.parseEther("0"))

        });

        it("Tree levels bonus percenta should be set correct", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(deploybPNMandTree);
            lvl1 = await _marketing.getTreeLevelBonus(1)
            lvl4 = await _marketing.getTreeLevelBonus(4)
            lvl5 = await _marketing.getTreeLevelBonus(5)
            lvl6 = await _marketing.getTreeLevelBonus(6)
            lvl9 = await _marketing.getTreeLevelBonus(9)
            lvl15 = await _marketing.getTreeLevelBonus(15)
                        
            expect(lvl1).to.equal(0);
            expect(lvl4).to.equal(1);
            expect(lvl5).to.equal(2);
            expect(lvl6).to.equal(3);
            expect(lvl9).to.equal(4);
            expect(lvl15).to.equal(4);
        });

        it("Zero user should be initiated", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(deploybPNMandTree);
            data = await _marketing.isUserExists(_owner.address)
            console.log(data)
            // expect(await _bpnm.prestartMode()).to.equal(true);
        });

        it("First user should be activated", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            data = await _marketing.isUserExists(user1)
            userdata = await _marketing.Users(user1)
            console.log("🚀 ~ file: bpnm_tests.js:124 ~ userdata:", userdata)
            console.log(data)
            expect(userdata.limitPackId).to.equal(1);
        });

        
    });

    describe("==2) First user activating", function () {
        if (!enable_test[2]) {
            return(0)
        }

        it("Should exist", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            data = await _marketing.isUserExists(user1)
            expect(data).to.equal(true);
            let signers = await ethers.getSigners();
            await expect(_marketing.connect(signers[1]).activate(signers[1].address,signers[1].address,1)).to.be.revertedWith("[bPNM] User already exists");
            //transfer disabled
            expect(await _bpnm.transfer(signers[1].address,1)).to.be.equal(false)
        });

        it("Have limit pack", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            data = await _marketing.Users(user1)
            // console.log("🚀 ~ file: bpnm_tests.js:301 ~ data:", data.limitPackId)
            
            
            expect(data.limitPackId).to.equal(1);
        });

        it("Prestart GWT deposited", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            gwtBal = await _gwt.balanceOf(user1)
            // console.log("🚀 ~ file: bpnm_tests.js:301 ~ data:", data.limitPackId)
            
            const bal = utils.parseEther("4");

            expect(gwtBal).to.equal(bal);
        });

        it("Earn limit increased", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            data = await _marketing.Users(user1)
            const weiValue = utils.parseEther("30");
            expect(data.earnLimitLeft).to.equal(weiValue);
        });

        it("USDT liquidity increased for 8 USDT, fee collector earned 2 USDT", async function () {
            //20%/2USDT goes to feecollector
            //28%/2.8 USDT goes to liquidity collector
            //52%/5.2 USDT goes to liquidity collector instead of marketing
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            usdtLiquidityBal = await _busd.balanceOf(liquidityCollector)
            feeCollBal = await _busd.balanceOf(feeCollector)
            const LCweiValue = utils.parseEther("8");
            const FCweiValue = utils.parseEther("2");
            expect(usdtLiquidityBal).to.equal(LCweiValue);
            expect(feeCollBal).to.equal(FCweiValue);
        });
    });
    
    //packs purchase tests for deep of 16 users in a tree
    describe("==3) Packs purchase. 16 users activated", function () {
        if (!enable_test[3]) {
            return(0)
        }

        //bonus for 16 users first activation of pack id1 goes 16 lvls up correctly to free and frozen
        //usdt liquidity filled correctly
        //fetch additional 15 users from tree is ok
        it("Bonus goes for 15 lvls up", async function () {
            const { _bpnm, _busd, _tree, _owner, signers, _btcb, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(SixteenUsersRegistered);
            data = await _marketing.isUserExists(user5)
            const frozen = await _marketing.addressFrozenTotal(signers[1].address,0)
            const lvl5frozen = utils.parseEther("0.16");//80% of bonus goes to frozen. lvl 5 bonus is 2% so 80% of 0.2 USDT
            const lvl14frozen = utils.parseEther("0.2");//50% of bonus goes to frozen. lvl 14 bonus is 4% so 50% of 0.4 USDT
            expect(frozen.frozenAmount[4]).to.equal(lvl5frozen);
            expect(frozen.frozenAmount[13]).to.equal(lvl14frozen);
            
            userdata = await _marketing.Users(signers[1].address)
            const lvl4bonus = utils.parseEther("0.1");//lvl 4 bonus is 1% so 0.1 USDT
            expect(userdata.balance.usdt).to.equal(lvl4bonus);
            const earnLimitLeft = utils.parseEther("29.9");//30 - 0.1
            expect(userdata.earnLimitLeft).to.equal(earnLimitLeft);

            const timestamp = frozen.startDates[4].toNumber();
            const date = new Date(timestamp * 1000); // Multiply by 1000 to convert seconds to milliseconds

            console.log("Time lock start, lvl5:%s",date)
            
            bpnmUsdtBalance = await _busd.balanceOf(_marketing.address)//
            console.log("🚀 ~ file: bpnm_tests.js:379 ~ bpnmUsdtBalance:", utils.formatEther(bpnmUsdtBalance))

            totalFrozen = await _marketing.totalFrozen()
            console.log("🚀 ~ file: bpnm_tests.js:382 ~ totalFrozen:", utils.formatEther(totalFrozen))

            totalEarnings = await _marketing.totalUsersEarnings()
            console.log("🚀 ~ file: bpnm_tests.js:379 ~ totalEarnings:", utils.formatEther(totalEarnings))
            //usdt liquidity filled correctly. Unused marketing goes to liquidity. 28% goes to liquidity
            //15 * 2.8 = 42
            usdtLiquidityBal = await _busd.balanceOf(liquidityCollector)//
            console.log("🚀 ~ file: bpnm_tests.js:380 ~ usdtLiquidityBal:", utils.formatEther(usdtLiquidityBal))
            const LCweiValue = utils.parseEther("8");
            // expect(usdtLiquidityBal).to.equal(LCweiValue);
            
            //usdt fee collector filled correctly
            feeCollBal = await _busd.balanceOf(feeCollector)
            console.log("🚀 ~ file: bpnm_tests.js:383 ~ feeCollBal:", utils.formatEther(feeCollBal))
            const FCweiValue = utils.parseEther("2");
            // expect(feeCollBal).to.equal(FCweiValue);
            
            totalFunds = Number(utils.formatEther(feeCollBal)) + Number(utils.formatEther(usdtLiquidityBal)) + Number(utils.formatEther(totalEarnings)) + Number(utils.formatEther(totalFrozen))
            console.log("🚀 ~ file: bpnm_tests.js:400 ~ totalFunds:", totalFunds)
            // expect(totalFunds).to.equal(160);//16 users for 10 usdt, total funds should be 160 usdt

            //add user1 some cashe to have fun)
            await depositUSDT(_busd, signers[1].address, "1000000")
            await depositBTCB(_btcb, signers[1].address, "1")
            //deposit owner so he can disable prestart
            await depositBTCB(_btcb, signers[0].address, "0.0002")
            await _btcb.increaseAllowance(_bpnm.address,utils.parseEther("0.0002"))
            
            await expect(_marketing.connect(signers[1]).activate(signers[1].address,constants.AddressZero,1)).to.be.revertedWith("[bPNM] Non zero address");
            await expect(_marketing.connect(signers[1]).activate(constants.AddressZero,signers[1].address,1)).to.be.revertedWith("[bPNM] Non zero address");
            await expect(_marketing.connect(signers[1]).activate(signers[20].address,signers[21].address,1)).to.be.revertedWith("[bPNM] Referrer not exists");
            await expect(_marketing.connect(signers[1]).activate(signers[20].address,signers[1].address,13)).to.be.revertedWith("[bPNM] Incorrect pack ID");
            
            await expect(_marketing.connect(signers[20]).buyLimitPack(1)).to.be.revertedWith("[bPNM] User not exists");
            await expect(_marketing.connect(signers[1]).buyLimitPack(12)).to.be.revertedWith("[bPNM] Not enough balance");



            // 🚀 [1] User 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 bal = 0.1 USDT
            // 1 = 0.0 USDT Frozen
            // 2 = 0.0 USDT Frozen
            // 3 = 0.0 USDT Frozen
            // 4 = 0.0 USDT Frozen
            // 5 = 0.16 USDT Frozen
            // 6 = 0.21 USDT Frozen
            // 7 = 0.21 USDT Frozen
            // 8 = 0.195 USDT Frozen
            // 9 = 0.26 USDT Frozen
            // 10 = 0.24 USDT Frozen
            // 11 = 0.24 USDT Frozen
            // 12 = 0.22 USDT Frozen
            // 13 = 0.22 USDT Frozen
            // 14 = 0.2 USDT Frozen
            // 15 = 0.2 USDT Frozen

            // for (let i=1;i<=16;i++) {
            //     console.log(signers[i].address)
            //     userdata = await _bpnm.Users(signers[i].address)
            //     //get frozen balances
            //     console.log("🚀 [%s] User %s bal = %s USDT", i, signers[i].address, utils.formatEther(userdata.balance.usdt))
            //     const frozen = await _bpnm.addressFrozenTotal(signers[i].address,0)
            //     for (let x = 0; x<=14; x++) {
            //         console.log("%s = %s USDT Frozen",x+1,utils.formatEther(frozen[x]))
            //     }
                
            // }
        });

        // // frozen unlocks from user1 package increase
        // // earn limit used to unfroze
        // // buy limit deposited
        it("Second pack purchase", async function () {
            const { _bpnm, _busd, _tree, _owner, signers, _btcb, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(SixteenUsersRegistered);
            //first user increase package to 1000
            await depositUSDT(_busd, signers[1].address, "1000")
            //increase allowance
            await _busd.connect(signers[1]).increaseAllowance(_marketing.address,utils.parseEther("1000"))
            //despoit 1000 usdt
            await _marketing.connect(signers[1]).replenishPaymentBalance(utils.parseEther("1000"))
            //purchase pack
            await _marketing.connect(signers[1]).buyLimitPack(9)

            const userData = await _marketing.Users(signers[1].address)
            console.log("🚀 ~ file: bpnm_tests.js:423 ~ userData:", userData)
            const frozen = await _marketing.addressFrozenTotal(signers[1].address,0)
            console.log("🚀 ~ file: bpnm_tests.js:427 ~ frozen:", frozen)
            
            //earnlimit increased from pack and decreased from frozen 29.9 + 2100 - 1.735 = 2128,165
            const earnLimit = utils.parseEther("2128.165")
            expect(userData.earnLimitLeft).to.equal(earnLimit);
            
            //frozen returned to balance 0.16+0.21+0.21+0.195+0.26+0.24+0.24+0.22 = 1.735
            const balance = utils.parseEther("1.835")
            expect(userData.balance.usdt).to.equal(balance);
            //total earn set to 1.835
            const totalEarned = utils.parseEther("1.835")
            expect(userData.totalEarned).to.equal(totalEarned);
            //buy limit is 10*4 + 1000*4 = 4040 / btc rate of 50000 = 0.0808
            const userBpnmData = await _bpnm.Users(signers[1].address)

            const buyLimit = utils.parseEther("0.0808")
            expect(userBpnmData.buyLimitLeft).to.equal(buyLimit);

            // user14 increase package to 1000. Check that new levels for user1 are opened
            await depositUSDT(_busd, signers[14].address, "1000")
            //increase allowance
            await _busd.connect(signers[14]).increaseAllowance(_marketing.address,utils.parseEther("1000"))
            //despoit 1000 usdt
            await _marketing.connect(signers[14]).replenishPaymentBalance(utils.parseEther("1000"))
            //purchase pack
            await _marketing.connect(signers[14]).buyLimitPack(9)

            const userData2 = await _marketing.Users(signers[1].address)
            console.log("🚀 ~ file: bpnm_tests.js:423 ~ userData:", userData2)
            const frozen2 = await _marketing.addressFrozenTotal(signers[1].address,0)
            console.log("🚀 ~ file: bpnm_tests.js:427 ~ frozen:", frozen2)
            
            //user14 payment goes to lvl13 of user1. 4% of pack cost goes to frozen, 55% is frozen with 10% fee for pack higher than 150 usdt. 40*0.55*0.9 = 19,8 USDT frozen + 0.22 previous balance
            const frozen13lvl = utils.parseEther("20.02")
            
            expect(frozen2[0][12]).to.equal(frozen13lvl);

            await expect(_marketing.connect(signers[1]).buyLimitPack(1)).to.be.revertedWith("[bPNM] Can not downgrade limit pack");
            //test max earn limit revert
    
            await depositUSDT(_busd, signers[2].address, "1000")
            //increase allowance
            await _busd.connect(signers[2]).increaseAllowance(_marketing.address,utils.parseEther("1000"))
            //despoit 1000 usdt
            await _marketing.connect(signers[2]).replenishPaymentBalance(utils.parseEther("1000"))
            //purchase pack
            await _marketing.connect(signers[2]).buyLimitPack(1)
            await _marketing.connect(signers[2]).buyLimitPack(1)
            await _marketing.connect(signers[2]).buyLimitPack(1)
            await _marketing.connect(signers[2]).buyLimitPack(1)
            await expect(_marketing.connect(signers[2]).buyLimitPack(1)).to.be.revertedWith("[bPNM] Max earn limit reached");
            await expect(_marketing.connect(signers[2]).buyLimitPack(13)).to.be.revertedWith("[bPNM] Incorrect pack ID");
            
        });



        // // unfroze is correct
        // // company balances are correct
        // // earnlimit used correctly
        // // 10% of status 150 usdt+ works ok
        it("First user waits until frozen timer expires", async function () {
            const { _bpnm, _busd, _tree, _owner, signers, _btcb, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(SixteenUsersRegistered);

            const frozen1 = await _marketing.addressFrozenTotal(signers[1].address,0)
            // console.log("🚀 ~ file: bpnm_tests.js:472 ~ frozen1:", frozen1)
            
            // await time.increase(60*60*24*10);//wait 10 days, so lvl 4-8 timers expires 
            
            // usdtLiquidityBal = await _busd.balanceOf(liquidityCollector)
            // console.log("🚀 ~ file: bpnm_tests.js:475 ~ usdtLiquidityBal:", usdtLiquidityBal)
            // feeCollBal = await _busd.balanceOf(feeCollector)
            // console.log("🚀 ~ file: bpnm_tests.js:477 ~ feeCollBal:", feeCollBal)

            //check amount of earn limit
            const earnlimit1 = await _marketing.Users(signers[1].address)
            // console.log("🚀 ~ file: bpnm_tests.js:536 ~ earnlimit1:", utils.formatEther(earnlimit1.earnLimitLeft))
            // console.log("🚀 ~ file: bpnm_tests.js:536 ~ balance1:", utils.formatEther(earnlimit1.balance.usdt))
            //user1 buy max pack, all unfrozes
            await calcCompanyValue(_busd,_bpnm,_marketing)
            //first user increase package to 1000, lvl 12 unlocked
            await depositUSDT(_busd, signers[1].address, "10000")
            //increase allowance
            await _busd.connect(signers[1]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
            //despoit 1000 usdt
            await _marketing.connect(signers[1]).replenishPaymentBalance(utils.parseEther("10000"))
            //purchase pack
            await _marketing.connect(signers[1]).buyLimitPack(12)
            
            await calcCompanyValue(_busd,_bpnm,_marketing)
            
            const frozen2 = await _marketing.addressFrozenTotal(signers[1].address,0)
            // console.log("🚀 ~ file: bpnm_tests.js:491 ~ frozen2:", frozen2)
            
            //check amount of earn limit
            const earnlimit2 = await _marketing.Users(signers[1].address)
            // console.log("🚀 ~ file: bpnm_tests.js:554 ~ earnlimit2:", utils.formatEther(earnlimit2.earnLimitLeft))
            // console.log("🚀 ~ file: bpnm_tests.js:554 ~ balance:", utils.formatEther(earnlimit2.balance.usdt))
            const earnLimitleft = utils.parseEther("20027.545");

            expect(earnlimit2.earnLimitLeft).to.equal(earnLimitleft);//+30 - 0.1 + 20000 - 2.355 = 20027.545

            //user16 buy pack 1 once more
            await depositUSDT(_busd, signers[16].address, "10")
            //increase allowance
            await _busd.connect(signers[16]).increaseAllowance(_marketing.address,utils.parseEther("10"))
            //despoit 1000 usdt
            await _marketing.connect(signers[16]).replenishPaymentBalance(utils.parseEther("10"))
            //purchase pack
            await _marketing.connect(signers[16]).buyLimitPack(1)
            
            //user1 should get bonus with 10% comission, 0.4 usdt - 10% = 0.36 usdt
            const earnlimit3 = await _marketing.Users(signers[1].address)
            // console.log("🚀 ~ file: bpnm_tests.js:575 ~ earnlimit3:", utils.formatEther(earnlimit3.earnLimitLeft))
            // console.log("🚀 ~ file: bpnm_tests.js:575 ~ balance:", utils.formatEther(earnlimit3.balance.usdt))
            expect(earnlimit3.earnLimitLeft).to.equal(utils.parseEther("20027.185"));//+30 - 0.1 + 20000 - 2.355 - 0.36 = 20027.185
            expect(earnlimit3.balance.usdt).to.equal(utils.parseEther("2.815"));

            await calcCompanyValue(_busd,_bpnm,_marketing)

            const treeUsers = await _marketing.getTreeNetwork(user1)
            // console.log("🚀 ~ file: bpnm_tests.js:584 ~ treeUsers:", treeUsers)
            const treeUsers2 = await _marketing.getTreeNetwork(user2)
            // console.log("🚀 ~ file: bpnm_tests.js:586 ~ user2:", treeUsers2)


            // usdtLiquidityBal = await _busd.balanceOf(liquidityCollector)
            // console.log("🚀 ~ file: bpnm_tests.js:491 ~ usdtLiquidityBal:", usdtLiquidityBal)
            // feeCollBal = await _busd.balanceOf(feeCollector)
            // console.log("🚀 ~ file: bpnm_tests.js:493 ~ feeCollBal:", feeCollBal)
            // const LCweiValue = utils.parseEther("8");
            // const FCweiValue = utils.parseEther("2");
            // expect(usdtLiquidityBal).to.equal(LCweiValue);
            // expect(feeCollBal).to.equal(FCweiValue);
            
            const firstLvl = await _bpnm.getFrontTreeData(user1);
            // console.log("🚀 ~ file: bpnm_tests.js:599 ~ firstLvl:", firstLvl)

            
        });



        // first users use big backs, the one user use small pack, next users use big backs to burn all earnlimit of small user.
        // Small pack users should be compressed
        // First user should reach comission from level 9 because of compressed lvl 4 and 6
        it("Compression check", async function () {
        /* 10 users are registered after owner, each one use reflink of the previous user*/
        const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing} = await loadFixture(deploybPNMandTree);
        let signers = await ethers.getSigners();

        // transfer 10 USDT to each user, increase allowance
        const usdt_10_transfer_weiValue = utils.parseEther("10");
        const usdt_10000_transfer_weiValue = utils.parseEther("10000");
        const usdt_100_transfer_weiValue = utils.parseEther("100");

        await _busd.connect(_busd_owner).transfer(user1,usdt_100_transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user2,usdt_10000_transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user3,usdt_10000_transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user4,usdt_10000_transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user5,usdt_10_transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user6,usdt_10000_transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user7,usdt_10_transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user8,usdt_10000_transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user9,usdt_10000_transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user10,usdt_10000_transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user11,usdt_10000_transfer_weiValue)
        await _busd.connect(_busd_owner).transfer(user12,usdt_10000_transfer_weiValue)

        // increase allowance
        await _busd.connect(signers[1]).increaseAllowance(_marketing.address,utils.parseEther("100"))
        await _busd.connect(signers[2]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
        await _busd.connect(signers[3]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
        await _busd.connect(signers[4]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
        await _busd.connect(signers[5]).increaseAllowance(_marketing.address,utils.parseEther("10"))
        await _busd.connect(signers[6]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
        await _busd.connect(signers[7]).increaseAllowance(_marketing.address,utils.parseEther("10"))
        await _busd.connect(signers[8]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
        await _busd.connect(signers[9]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
        await _busd.connect(signers[10]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
        await _busd.connect(signers[11]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
        await _busd.connect(signers[12]).increaseAllowance(_marketing.address,utils.parseEther("10000"))

        //activate users
        await _marketing.connect(signers[1]).activate(signers[1].address,signers[1-1].address,4);//Pack 1    
        for (let i=2;i<=4;i++) {
            await _marketing.connect(signers[i]).activate(signers[i].address,signers[i-1].address,12);//Pack 12    
        }
        await _marketing.connect(signers[5]).activate(signers[5].address,signers[5-1].address,1);//Pack 1, should be compressed fast 
        await _marketing.connect(signers[6]).activate(signers[6].address,signers[6-1].address,12);//Pack 12
        await _marketing.connect(signers[7]).activate(signers[7].address,signers[7-1].address,1);//Pack 1, should be compressed fast
        
        for (let i=8;i<=12;i++) {
            await _marketing.connect(signers[i]).activate(signers[i].address,signers[i-1].address,12);//Pack 12
        }
        
        const frozen5 = await _marketing.addressFrozenTotal(signers[5].address,0)
        // console.log("🚀 ~ file: bpnm_tests.js:664 ~ frozen5:", frozen5)
        
        const userData5 = await _marketing.Users(signers[5].address)
        console.log("🚀 ~ file: bpnm_tests.js:536 ~ earnlimit1:", utils.formatEther(userData5.earnLimitLeft))
        console.log("🚀 ~ file: bpnm_tests.js:536 ~ balance1:", utils.formatEther(userData5.balance.usdt))
        
        // const frozen7 = await _marketing.addressFrozenTotal(signers[7].address,0)
        // console.log("🚀 ~ file: bpnm_tests.js:664 ~ frozen5:", frozen7)
        
        let userData1 = await _marketing.Users(signers[1].address)
        console.log("1🚀 ~ file: bpnm_tests.js:875 ~ earnlimit1:", utils.formatEther(userData1.earnLimitLeft))
        console.log("1🚀 ~ file: bpnm_tests.js:876 ~ balance1:", utils.formatEther(userData1.balance.usdt))
        
        
        await _marketing.connect(signers[1]).buyLimitPack(4);    

        
        //user 10 buy pack once more, user 1 should receive bonus because of compressed levels
        await _busd.connect(_busd_owner).transfer(user10,usdt_10000_transfer_weiValue)
        await _busd.connect(signers[10]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
        await _marketing.connect(signers[10]).replenishPaymentBalance(utils.parseEther("10000"))
        
        await _marketing.connect(signers[10]).buyLimitPack(12);    
        
        
        userData1 = await _marketing.Users(signers[1].address)
        console.log("3🚀 ~ file: bpnm_tests.js:888 ~ earnlimit1:", utils.formatEther(userData1.earnLimitLeft))
        console.log("3🚀 ~ file: bpnm_tests.js:889 ~ balance1:", utils.formatEther(userData1.balance.usdt))
        
        
        await calcCompanyValue(_busd,_bpnm,_marketing)

        const usdtBal = utils.parseEther("380");//240-100+240=380
        expect(userData1.balance.usdt).to.equal(usdtBal);


        });


        it("Pack autopurchase check", async function () {
            /* 10 users are registered after owner, each one use reflink of the previous user*/
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(deploybPNMandTree);
            let signers = await ethers.getSigners();

            // transfer 10 BUSD to each user, increase allowance
            const usdt_10_transfer_weiValue = utils.parseEther("10");
            const usdt_10000_transfer_weiValue = utils.parseEther("10000");
            const usdt_100_transfer_weiValue = utils.parseEther("100");
            const usdt_250_transfer_weiValue = utils.parseEther("250");

            await _busd.connect(_busd_owner).transfer(user1,usdt_250_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user2,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user3,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user4,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user5,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user6,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user7,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user8,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user9,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user10,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user11,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user12,usdt_10000_transfer_weiValue)

            // await _busd.connect(_busd_owner).transfer(user13,transfer_weiValue)
            // await _busd.connect(_busd_owner).transfer(user14,transfer_weiValue)
            // await _busd.connect(_busd_owner).transfer(user15,transfer_weiValue)
            // await _busd.connect(_busd_owner).transfer(user16,transfer_weiValue)
            // increase allowance
            await _busd.connect(signers[1]).increaseAllowance(_marketing.address,utils.parseEther("250"))
            await _busd.connect(signers[2]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
            await _busd.connect(signers[3]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
            await _busd.connect(signers[4]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
            await _busd.connect(signers[5]).increaseAllowance(_marketing.address,utils.parseEther("10000"))//100 bonus
            await _busd.connect(signers[6]).increaseAllowance(_marketing.address,utils.parseEther("10000"))//200 bonus
            await _busd.connect(signers[7]).increaseAllowance(_marketing.address,utils.parseEther("10000"))//300
            await _busd.connect(signers[8]).increaseAllowance(_marketing.address,utils.parseEther("10000"))//300
            await _busd.connect(signers[9]).increaseAllowance(_marketing.address,utils.parseEther("10000"))//300
            await _busd.connect(signers[10]).increaseAllowance(_marketing.address,utils.parseEther("10000"))//400
            await _busd.connect(signers[11]).increaseAllowance(_marketing.address,utils.parseEther("10000"))//400
            await _busd.connect(signers[12]).increaseAllowance(_marketing.address,utils.parseEther("10000"))//frozen

            // await _busd.connect(signers[13]).increaseAllowance(_marketing.address,utils.parseEther("10"))
            // await _busd.connect(signers[14]).increaseAllowance(_marketing.address,utils.parseEther("10"))
            // await _busd.connect(signers[15]).increaseAllowance(_marketing.address,utils.parseEther("10"))
            // await _busd.connect(signers[16]).increaseAllowance(_marketing.address,utils.parseEther("10"))

            //activate users
            await _marketing.connect(signers[1]).activate(signers[1].address,signers[1-1].address,7);    
            await _marketing.connect(signers[1]).toggleLimitPackAutoRenew();    
            for (let i=2;i<=12;i++) {
                await _marketing.connect(signers[i]).activate(signers[i].address,signers[i-1].address,12);    
            }
            
            const frozen1 = await _marketing.addressFrozenTotal(signers[1].address,0)
            // console.log("🚀 ~ file: bpnm_tests.js:664 ~ frozen1:", frozen1)
            
            
            
            let userData1 = await _marketing.Users(signers[1].address)
            console.log("1🚀 ~ file: bpnm_tests.js:536 ~ earnlimit1:", utils.formatEther(userData1.earnLimitLeft))
            console.log("1🚀 ~ file: bpnm_tests.js:536 ~ balance1:", utils.formatEther(userData1.balance.usdt))
                    
            
            
            await calcCompanyValue(_busd,_bpnm,_marketing)

            const usdtBal = utils.parseEther("1050");//3 autopurchase = 750 | 2000 bonus - 10% = 1800 | 1800-750 = 1050
            expect(userData1.balance.usdt).to.equal(usdtBal);
            const earnLimit = utils.parseEther("520");//1 purchase + 3 autopurchase = 580*4 = 2320 | 2000 bonus - 10% = 1800 | 2320-1800 = 520
            expect(userData1.earnLimitLeft).to.equal(earnLimit);


            //test on low pack revert
            await depositUSDT(_busd, signers[13].address, "10")
            //increase allowance
            await _busd.connect(signers[13]).increaseAllowance(_marketing.address,utils.parseEther("10"))
            //activate
            await _marketing.connect(signers[13]).activate(signers[13].address,signers[1].address,1)


            await expect(_marketing.connect(signers[13]).toggleLimitPackAutoRenew()).to.be.revertedWith("[bPNM] Limit pack for 250 USDT or higher required");


        });


        it("+1% to marketing check", async function () {
            /* 10 users are registered after owner, each one use reflink of the previous user*/
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(deploybPNMandTree);
            let signers = await ethers.getSigners();

            // transfer 10 BUSD to each user, increase allowance
            const usdt_10_transfer_weiValue = utils.parseEther("10");
            const usdt_10000_transfer_weiValue = utils.parseEther("10100");
            const usdt_100_transfer_weiValue = utils.parseEther("100");
            const usdt_250_transfer_weiValue = utils.parseEther("250");

            await _busd.connect(_busd_owner).transfer(user1,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user2,usdt_100_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user3,usdt_100_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user4,usdt_100_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user5,usdt_100_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user6,usdt_100_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user7,usdt_100_transfer_weiValue)

            // increase allowance
            await _busd.connect(signers[1]).increaseAllowance(_marketing.address,utils.parseEther("10100"))
            await _busd.connect(signers[2]).increaseAllowance(_marketing.address,utils.parseEther("100"))
            await _busd.connect(signers[3]).increaseAllowance(_marketing.address,utils.parseEther("100"))
            await _busd.connect(signers[4]).increaseAllowance(_marketing.address,utils.parseEther("100"))
            await _busd.connect(signers[5]).increaseAllowance(_marketing.address,utils.parseEther("100"))//1 bonus
            await _busd.connect(signers[6]).increaseAllowance(_marketing.address,utils.parseEther("100"))//2 bonus
            await _busd.connect(signers[7]).increaseAllowance(_marketing.address,utils.parseEther("100"))//3 bonus

            //activate users
            await _marketing.connect(signers[1]).activate(signers[1].address,signers[1-1].address,12);    
            
            let gwtBal = await _gwt.balanceOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:830 ~ gwtBal:", utils.formatEther(gwtBal))
            
            //activate lvl 4 +1%
            await _marketing.connect(signers[1]).extendLvlMarketingBonus();    
            
            
            
            
            
            //users up to lvl4 buy pack
            for (let i=2;i<=6;i++) {
                await _marketing.connect(signers[i]).activate(signers[i].address,signers[i-1].address,4);    
            }
            
            //activate lvl 5 +1%. Cost 25 GWT
            await _marketing.connect(signers[1]).extendLvlMarketingBonus();    
            //activate lvl 6 +1%. Cost 500 GWT
            await _marketing.connect(signers[1]).extendLvlMarketingBonus();    
            

            await _marketing.connect(signers[7]).activate(signers[7].address,signers[7-1].address,4);    
            
            
            
            let userData1 = await _marketing.Users(signers[1].address)
            console.log("1🚀 ~ file: bpnm_tests.js:536 ~ earnlimit1:", utils.formatEther(userData1.earnLimitLeft))
            console.log("1🚀 ~ file: bpnm_tests.js:536 ~ balance1:", utils.formatEther(userData1.balance.usdt))
            
            
            gwtBal = await _gwt.balanceOf(user1)
            // console.log("🚀 ~ file: bpnm_tests.js:830 ~ gwtBal:", utils.formatEther(gwtBal))
            
            // await calcCompanyValue(_busd,_bpnm,_marketing)

            const internalUsdtBal = utils.parseEther("7.2");//lvl 4 1+1% = 2 USDT, lvl 5 = 2% = 2 USDT, lvl 6 = 3+1 = 4% = 4 USDT | Total = 2 + 2 + 4 = 8 USDT | 8 USDT - 10% fee = 7.2 USDT
            expect(userData1.balance.usdt).to.equal(internalUsdtBal);
            const usdtBal = utils.parseEther("94");//100 USDT - 3*2 USDT fee = 94
            expect(await _busd.balanceOf(user1)).to.equal(usdtBal);
            const gwtBalU1 = utils.parseEther("5465");//6000 - 10 - 25 - 500 = 5465
            expect(await _busd.balanceOf(user1)).to.equal(usdtBal);
            
            // const earnLimit = utils.parseEther("520");//1 purchase + 3 autopurchase = 580*4 = 2320 | 2000 bonus - 10% = 1800 | 2320-1800 = 520
            // expect(userData1.earnLimitLeft).to.equal(earnLimit);
            await expect(_marketing.connect(signers[8]).extendLvlMarketingBonus()).to.be.revertedWith("[bPNM] Please activate first");


        });
        
        it("Frozen unlocked to liquidity on timer finish", async function () {
            const { _bpnm, _busd, _tree, _owner, signers, _btcb, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(SixteenUsersRegistered);
            data = await _marketing.isUserExists(user5)
            frozen = await _marketing.addressFrozenTotal(signers[1].address,0)
            lvl5frozen = utils.parseEther("0.16");//80% of bonus goes to frozen. lvl 5 bonus is 2% so 80% of 0.2 USDT
            lvl14frozen = utils.parseEther("0.2");//50% of bonus goes to frozen. lvl 14 bonus is 4% so 50% of 0.4 USDT
            expect(frozen.frozenAmount[4]).to.equal(lvl5frozen);
            expect(frozen.frozenAmount[13]).to.equal(lvl14frozen);
            
            totalFrozen = await _marketing.totalFrozen()
            console.log("🚀 ~ file: bpnm_tests.js:382 ~ totalFrozen:", utils.formatEther(totalFrozen))
            expect(totalFrozen).to.equal(utils.parseEther("13.91"));
            
            //wait 3 days for level 5 timer to expire
            await time.increase(60*60*24*3);
            
            usdtLiquidityBal = await _busd.balanceOf(liquidityCollector)//
            expect(usdtLiquidityBal).to.equal(utils.parseEther("112.89"));
            // console.log("🚀 ~ file: bpnm_tests.js:380 ~ usdtLiquidityBal1:", utils.formatEther(usdtLiquidityBal))
            
            //trigger funds release
            await _marketing.releaseFrozenFunds(signers[1].address,1)
            
            totalFrozen = await _marketing.totalFrozen()
            expect(totalFrozen).to.equal(utils.parseEther("13.75"));
            // console.log("🚀 ~ file: bpnm_tests.js:382 ~ totalFrozen:", utils.formatEther(totalFrozen))
            
            //liquidity increased for 0.16
            usdtLiquidityBal = await _busd.balanceOf(liquidityCollector)//
            console.log("🚀 ~ file: bpnm_tests.js:380 ~ usdtLiquidityBal2:", utils.formatEther(usdtLiquidityBal))
            expect(usdtLiquidityBal).to.equal(utils.parseEther("113.05"));
            
            frozen = await _marketing.addressFrozenTotal(signers[1].address,0)
            lvl5frozen = utils.parseEther("0");
            lvl14frozen = utils.parseEther("0.2");//50% of bonus goes to frozen. lvl 14 bonus is 4% so 50% of 0.4 USDT
            expect(frozen.frozenAmount[4]).to.equal(lvl5frozen);
            expect(frozen.frozenAmount[13]).to.equal(lvl14frozen);
            
            
            
            //some lines for frontend tests
            //add user1 some cashe to have fun)
            await depositUSDT(_busd, signers[1].address, "1000000")
            await depositBTCB(_btcb, signers[1].address, "1")
            //deposit owner so he can disable prestart
            await depositBTCB(_btcb, signers[0].address, "0.0002")
            await _btcb.increaseAllowance(_bpnm.address,utils.parseEther("0.0002"))


            // 🚀 [1] User 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 bal = 0.1 USDT
            // 1 = 0.0 USDT Frozen
            // 2 = 0.0 USDT Frozen
            // 3 = 0.0 USDT Frozen
            // 4 = 0.0 USDT Frozen
            // 5 = 0.16 USDT Frozen
            // 6 = 0.21 USDT Frozen
            // 7 = 0.21 USDT Frozen
            // 8 = 0.195 USDT Frozen
            // 9 = 0.26 USDT Frozen
            // 10 = 0.24 USDT Frozen
            // 11 = 0.24 USDT Frozen
            // 12 = 0.22 USDT Frozen
            // 13 = 0.22 USDT Frozen
            // 14 = 0.2 USDT Frozen
            // 15 = 0.2 USDT Frozen

            // for (let i=1;i<=16;i++) {
            //     console.log(signers[i].address)
            //     userdata = await _bpnm.Users(signers[i].address)
            //     //get frozen balances
            //     console.log("🚀 [%s] User %s bal = %s USDT", i, signers[i].address, utils.formatEther(userdata.balance.usdt))
            //     const frozen = await _bpnm.addressFrozenTotal(signers[i].address,0)
            //     for (let x = 0; x<=14; x++) {
            //         console.log("%s = %s USDT Frozen",x+1,utils.formatEther(frozen[x]))
            //     }
                
            // }
        });

        //test situation when earn limit left cover part of bonus to unfreeze
        it("Earn limit covers part of frozen bonus", async function () {
            /* 10 users are registered after owner, each one use reflink of the previous user*/
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(deploybPNMandTree);
            let signers = await ethers.getSigners();

            // transfer 10 USDT to each user, increase allowance
            const usdt_10_transfer_weiValue = utils.parseEther("100");
            const usdt_10000_transfer_weiValue = utils.parseEther("10000");
            const usdt_100_transfer_weiValue = utils.parseEther("100");
    
            await _busd.connect(_busd_owner).transfer(user1,usdt_10_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user2,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user3,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user4,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user5,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user6,usdt_10000_transfer_weiValue)
    
            // increase allowance
            await _busd.connect(signers[1]).increaseAllowance(_marketing.address,utils.parseEther("100"))
            await _busd.connect(signers[2]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
            await _busd.connect(signers[3]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
            await _busd.connect(signers[4]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
            await _busd.connect(signers[5]).increaseAllowance(_marketing.address,utils.parseEther("100"))
            await _busd.connect(signers[6]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
    
            //activate users
            await _marketing.connect(signers[1]).activate(signers[1].address,signers[1-1].address,1);//Pack 1    
            for (let i=2;i<=4;i++) {
                await _marketing.connect(signers[i]).activate(signers[i].address,signers[i-1].address,12);//Pack 12    
            }
            await _marketing.connect(signers[5]).activate(signers[5].address,signers[4].address,1);//Pack 1    
            await _marketing.connect(signers[6]).activate(signers[6].address,signers[5].address,12);//Pack 12    
            
            frozen1 = await _marketing.addressFrozenTotal(signers[1].address,0)
            expect(frozen1.frozenAmount[4]).to.equal(utils.parseEther("160"));//2% of 10000 minus 80%
            
            // console.log("🚀 ~ file: bpnm_tests.js:664 ~ frozen5:", frozen5)
            
            userData1 = await _marketing.Users(signers[1].address)
            console.log("🚀 ~ file: bpnm_tests.js:536 ~ earnlimit1:", utils.formatEther(userData1.earnLimitLeft))
            console.log("🚀 ~ file: bpnm_tests.js:536 ~ balance1:", utils.formatEther(userData1.balance.usdt))
            
            
            
            //user 10 buy pack once more, should receive reward for all earn limit of 65 USDT
            await _marketing.connect(signers[1]).replenishPaymentBalance(utils.parseEther("25"))
            
            await _marketing.connect(signers[1]).buyLimitPack(2);    
            
            userData1 = await _marketing.Users(signers[1].address)
            console.log("🚀 ~ file: bpnm_tests.js:536 ~ earnlimit1:", utils.formatEther(userData1.earnLimitLeft))
            console.log("🚀 ~ file: bpnm_tests.js:536 ~ balance1:", utils.formatEther(userData1.balance.usdt))
            
            frozen1 = await _marketing.addressFrozenTotal(signers[1].address,0)
            expect(frozen1.frozenAmount[4]).to.equal(utils.parseEther("65.1"));//200-29.9-65
            
    
            //user 1 buy pack once more, should receive reward for all earn limit of 65 USDT
            await _marketing.connect(signers[1]).replenishPaymentBalance(utils.parseEther("25"))
            
            await _marketing.connect(signers[1]).buyLimitPack(2);    
            
            userData1 = await _marketing.Users(signers[1].address)
            console.log("🚀 ~ file: bpnm_tests.js:536 ~ earnlimit1:", utils.formatEther(userData1.earnLimitLeft))
            console.log("🚀 ~ file: bpnm_tests.js:536 ~ balance1:", utils.formatEther(userData1.balance.usdt))
            
            frozen1 = await _marketing.addressFrozenTotal(signers[1].address,0)
            expect(frozen1.frozenAmount[4]).to.equal(utils.parseEther("0.1"));//200-29.9-65-65
            
            //user 1 buy pack once more, should receive reward for all earn limit of 65 USDT
            await _marketing.connect(signers[1]).replenishPaymentBalance(utils.parseEther("25"))
            
            await _marketing.connect(signers[1]).buyLimitPack(2);    
            
            userData1 = await _marketing.Users(signers[1].address)
            console.log("🚀 ~ file: bpnm_tests.js:536 ~ earnlimit1:", utils.formatEther(userData1.earnLimitLeft))
            console.log("🚀 ~ file: bpnm_tests.js:536 ~ balance1:", utils.formatEther(userData1.balance.usdt))
            
            frozen1 = await _marketing.addressFrozenTotal(signers[1].address,0)
            expect(frozen1.frozenAmount[4]).to.equal(utils.parseEther("0"));//200-29.9-65-65
            
    
    
        });

        //move from frozen to liquidity on frozen bonus deposit
        it("New frozen bonus move old frozen to liquidity on timer fininshed", async function () {
            /* 10 users are registered after owner, each one use reflink of the previous user*/
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(deploybPNMandTree);
            let signers = await ethers.getSigners();

            // transfer 10 USDT to each user, increase allowance
            const usdt_10_transfer_weiValue = utils.parseEther("100");
            const usdt_10000_transfer_weiValue = utils.parseEther("10000");
            const usdt_100_transfer_weiValue = utils.parseEther("100");
    
            await _busd.connect(_busd_owner).transfer(user1,usdt_10_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user2,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user3,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user4,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user5,usdt_10000_transfer_weiValue)
            await _busd.connect(_busd_owner).transfer(user6,usdt_10000_transfer_weiValue)
    
            // increase allowance
            await _busd.connect(signers[1]).increaseAllowance(_marketing.address,utils.parseEther("100"))
            await _busd.connect(signers[2]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
            await _busd.connect(signers[3]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
            await _busd.connect(signers[4]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
            await _busd.connect(signers[5]).increaseAllowance(_marketing.address,utils.parseEther("100"))
            await _busd.connect(signers[6]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
    
            //activate users
            await _marketing.connect(signers[1]).activate(signers[1].address,signers[1-1].address,1);//Pack 1    
            for (let i=2;i<=4;i++) {
                await _marketing.connect(signers[i]).activate(signers[i].address,signers[i-1].address,12);//Pack 12    
            }
            await _marketing.connect(signers[5]).activate(signers[5].address,signers[4].address,1);//Pack 1    
            await _marketing.connect(signers[6]).activate(signers[6].address,signers[5].address,12);//Pack 12    
            
            frozen1 = await _marketing.addressFrozenTotal(signers[1].address,0)
            expect(frozen1.frozenAmount[4]).to.equal(utils.parseEther("160"));//2% of 10000 minus 80%
            
            
            userData1 = await _marketing.Users(signers[1].address)
            console.log("🚀 ~ file: bpnm_tests.js:536 ~ earnlimit1:", utils.formatEther(userData1.earnLimitLeft))
            console.log("🚀 ~ file: bpnm_tests.js:536 ~ balance1:", utils.formatEther(userData1.balance.usdt))
            
            usdtLiquidityBal = await _busd.balanceOf(liquidityCollector)//
            console.log("🚀 ~ file: bpnm_tests.js:1330 ~ usdtLiquidityBal:", usdtLiquidityBal)
            // expect(usdtLiquidityBal).to.equal(utils.parseEther("112.89"));
            // await calcCompanyValue(_busd,_bpnm,_marketing)

            //wait 3 days for level 5 timer to expire
            await time.increase(60*60*24*3);
            
            
            //user 10 buy pack once more, should receive reward for all earn limit of 65 USDT
            await _busd.connect(_busd_owner).transfer(user6,usdt_10000_transfer_weiValue)
            await _busd.connect(signers[6]).increaseAllowance(_marketing.address,utils.parseEther("10000"))
            await _marketing.connect(signers[6]).replenishPaymentBalance(utils.parseEther("10000"))
            await _marketing.connect(signers[6]).buyLimitPack(12);    
            
            // await calcCompanyValue(_busd,_bpnm,_marketing)

            userData1 = await _marketing.Users(signers[1].address)
            console.log("🚀 ~ file: bpnm_tests.js:536 ~ earnlimit1:", utils.formatEther(userData1.earnLimitLeft))
            console.log("🚀 ~ file: bpnm_tests.js:536 ~ balance1:", utils.formatEther(userData1.balance.usdt))
            
            frozen1 = await _marketing.addressFrozenTotal(signers[1].address,0)
            expect(frozen1.frozenAmount[4]).to.equal(utils.parseEther("0"));//all moved to liquidity
            
            usdtLiquidityBal = await _busd.balanceOf(liquidityCollector)//
            console.log("🚀 ~ file: bpnm_tests.js:1330 ~ usdtLiquidityBal:", usdtLiquidityBal)
            // expect(usdtLiquidityBal).to.equal(utils.parseEther("112.89"));

            
    
    
        });
    });

    describe("==4) Deposit/withdraw", function () {
        if (!enable_test[4]) {
            return(0)
        }


        it("Withdraw NO fee compensate", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 10 usdt
            await depositUSDT(_busd, _user1.address, "11")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("11"))
            //despoit 10 usdt
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("11"))
            
            //usdt deposited correctly
            userdata = await _marketing.Users(user1)
            console.log("U1 bal= %s USDT", utils.formatEther(userdata.balance.usdt))
            expect(userdata.balance.usdt).to.equal(utils.parseEther("11"));
            
            //perform withdraw
            await _marketing.connect(_user1).withdrawBalance(utils.parseEther("10"),0,1)

            userdata = await _marketing.Users(user1)
            console.log("U1 bal= %s USDT", utils.formatEther(userdata.balance.usdt))
            expect(userdata.balance.usdt).to.equal(utils.parseEther("1"));
            
            usdtBalanceBefore = await _busd.balanceOf(user1)
            console.log("USDT contract bal= %s USDT", utils.formatEther(usdtBalanceBefore))
            expect(usdtBalanceBefore).to.equal(utils.parseEther("9"));

            let signers = await ethers.getSigners();
            await expect(_marketing.connect(signers[22]).withdrawBalance(utils.parseEther("21"),0,1)).to.be.revertedWith("[bPNM] User not exists");
            await expect(_marketing.connect(signers[1]).withdrawBalance(utils.parseEther("1"),0,4)).to.be.revertedWith("[bPNM] Incorrect payment ID");
            await expect(_marketing.connect(signers[1]).withdrawBalance(utils.parseEther("1"),utils.parseEther("100"),1)).to.be.revertedWith("[bPNM] Not enough GWT to compensate");
            await expect(_marketing.connect(signers[1]).withdrawBalance(utils.parseEther("2"),0,1)).to.be.revertedWith("[bPNM] Not enough payment balance for withdraw");


        });
        
        //case when GWT more than max fee
        //case when GWT less than max fee
        //gwt burned
        //usdt deposited
        //contract liquidity correct
        it("Withdraw with GWT compensate", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 10 usdt
            await depositUSDT(_busd, _user1.address, "21")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("21"))
            //despoit 10 usdt
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("21"))
            
            await calcCompanyValue(_busd,_bpnm,_marketing)

            userdata = await _marketing.Users(user1)
            console.log("U1 bal= %s USDT", utils.formatEther(userdata.balance.usdt))
            expect(userdata.balance.usdt).to.equal(utils.parseEther("21"));
            
            //check gwt balance. Bought pack for 10 so 2X20% = 4 GWT
            gwtBalance = await _gwt.balanceOf(user1)
            console.log("U1 bal= %s GWT", utils.formatEther(gwtBalance))
            expect(gwtBalance).to.equal(utils.parseEther("4"));

            //withdraw 10 usdt, use 2 GWT to compensate, this is more than maxfee so should be used max amount of gwt for compensate
            await _marketing.connect(_user1).withdrawBalance(utils.parseEther("10"),utils.parseEther("2"),1)

            await calcCompanyValue(_busd,_bpnm,_marketing)

            //should be deposited 10 - 5% for matching, 5% - compensated by gwt, so total 9.5
            usdtBalanceAfter = await _busd.balanceOf(user1)
            console.log("USDT contract bal= %s USDT", utils.formatEther(usdtBalanceAfter))
            expect(usdtBalanceAfter).to.equal(utils.parseEther("9.5"));
            
            
            gwtBalanceAfter = await _gwt.balanceOf(user1)
            console.log("U1 bal= %s GWT", utils.formatEther(gwtBalanceAfter))
            expect(gwtBalanceAfter).to.equal(utils.parseEther("3.5"));

            //withdraw 10 usdt, use 0.1 GWT to compensate, this is LESS than maxfee so should be used exact amount of gwt for compensate
            await _marketing.connect(_user1).withdrawBalance(utils.parseEther("10"),utils.parseEther("0.1"),1)
            
            await calcCompanyValue(_busd,_bpnm,_marketing)

            //should be deposited 10 - 5% for matching, - 0.1 compensated by GWT, so total 10 - 0.5 - 0.4 = 9.1
            usdtBalanceAfter = await _busd.balanceOf(user1)
            console.log("USDT contract bal= %s USDT", utils.formatEther(usdtBalanceAfter))
            expect(usdtBalanceAfter).to.equal(utils.parseEther("18.6"));//9.5 + 9.1
            
            
            gwtBalanceAfter = await _gwt.balanceOf(user1)
            console.log("U1 bal= %s GWT", utils.formatEther(gwtBalanceAfter))
            expect(gwtBalanceAfter).to.equal(utils.parseEther("3.4"));


        });
        
        it("Deposit test", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            
            await calcCompanyValue(_busd,_bpnm,_marketing)
            
            //deposit with 21 usdt
            await depositUSDT(_busd, _user1.address, "21")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("21"))
            //despoit 21 usdt
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("21"))
            
            await calcCompanyValue(_busd,_bpnm,_marketing)

            //user internal balance deposited
            userdata = await _marketing.Users(user1)
            console.log("U1 bal= %s USDT", utils.formatEther(userdata.balance.usdt))
            expect(userdata.balance.usdt).to.equal(utils.parseEther("21"));
            
            //user internal balance deposited, 10 USDT first user + 21 USDT deposit from second
            contractBal = await _busd.balanceOf(_marketing.address)
            console.log("U1 bal= %s USDT", utils.formatEther(contractBal))
            expect(contractBal).to.equal(utils.parseEther("21"));

            let signers = await ethers.getSigners();
            await expect(_marketing.connect(signers[22]).replenishPaymentBalance(utils.parseEther("21"))).to.be.revertedWith("[bPNM] User not exists");

            

        });
        
        
        
        
        
    });

    describe("==5) Matching bonus tests", function () {
        if (!enable_test[5]) {
            return(0)
        }
        
        //matching bonus deposited
        //earn limit used
        it("Matching accrue on withdraw test", async function () {
            const { _bpnm, _busd, _tree, _owner, signers, _btcb, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(SixteenUsersRegistered);
    
            await calcCompanyValue(_busd,_bpnm,_marketing)

            //user7 buy pack for 1000 usdt, get gwt to activate matching, lvls visibility increased to 12
            //deposit with 10000 usdt + 2 USDT for matching activate fee
            await depositUSDT(_busd, signers[7].address, "1002")
            //increase allowance
            await _busd.connect(signers[7]).increaseAllowance(_marketing.address,utils.parseEther("1002"))
            //despoit 1000 usdt
            await _marketing.connect(signers[7]).replenishPaymentBalance(utils.parseEther("1000"))
            await _marketing.connect(signers[7]).buyLimitPack(9)

            //buy matching for U7
            await _marketing.connect(signers[7]).extendMatchingBonus()
            
            await calcCompanyValue(_busd,_bpnm,_marketing)

            //deposit with 10 usdt
            await depositUSDT(_busd, signers[14].address, "10")
            //increase allowance
            await _busd.connect(signers[14]).increaseAllowance(_marketing.address,utils.parseEther("10"))
            //despoit 10 usdt
            await _marketing.connect(signers[14]).replenishPaymentBalance(utils.parseEther("10"))
            
            
            //user7 balance before matching            
            console.log("User7 addr= %s",user7)
            userData = await _marketing.Users(user7)
            console.log("U7 balance= %s USDT", utils.formatEther(userData.balance.usdt))//funds got unfrozen
            console.log("U7 earn limit= %s USDT", utils.formatEther(userData.earnLimitLeft))//earn limit 30 + 2100 = 2130
            expect(userData.balance.usdt).to.equal(utils.parseEther("1.135"));
            expect(userData.earnLimitLeft).to.equal(utils.parseEther("2128.865"));
            
            await calcCompanyValue(_busd,_bpnm,_marketing)
            
            //user14 make withdraw and matching is distributed
            await _marketing.connect(signers[14]).withdrawBalance(utils.parseEther("10"),0,1)
            
            console.log("User7 addr= %s",user7)
            userData = await _marketing.Users(user7)
            console.log("U7 balance= %s USDT", utils.formatEther(userData.balance.usdt))
            console.log("U7 earn limit= %s USDT", utils.formatEther(userData.earnLimitLeft))//earn limit
            expect(userData.balance.usdt).to.equal(utils.parseEther("1.18"));//1.135 + 0.05 - 10% fee = 1.135 + 0.045 = 1.18
            expect(userData.earnLimitLeft).to.equal(utils.parseEther("2128.82"));//earnlimit left, 2130 - 1.135 - 0.045 = 2128.82 USDT
            
            await calcCompanyValue(_busd,_bpnm,_marketing)

            await expect(_marketing.connect(signers[22]).extendMatchingBonus()).to.be.revertedWith("[bPNM] Please activate first");


        });


        it("Matching expires on timeout", async function () {
            const { _bpnm, _busd, _tree, _owner, signers, _btcb, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(SixteenUsersRegistered);
    
            await calcCompanyValue(_busd,_bpnm,_marketing)

            //user7 buy pack for 1000 usdt, get gwt to activate matching, lvls visibility increased to 12
            //deposit with 10000 usdt + 2 USDT for matching activate fee
            await depositUSDT(_busd, signers[7].address, "1002")
            //increase allowance
            await _busd.connect(signers[7]).increaseAllowance(_marketing.address,utils.parseEther("1002"))
            //despoit 1000 usdt
            await _marketing.connect(signers[7]).replenishPaymentBalance(utils.parseEther("1000"))
            await _marketing.connect(signers[7]).buyLimitPack(9)

            //buy matching for U7
            await _marketing.connect(signers[7]).extendMatchingBonus()
            

            //deposit with 10 usdt
            await depositUSDT(_busd, signers[14].address, "10")
            //increase allowance
            await _busd.connect(signers[14]).increaseAllowance(_marketing.address,utils.parseEther("10"))
            //despoit 10 usdt
            await _marketing.connect(signers[14]).replenishPaymentBalance(utils.parseEther("10"))
            
            //wait for matching to expires
            await time.increase(60*60*24*30);//wait 30 days 

            
            //user7 balance before matching            
            console.log("User7 addr= %s",user7)
            userData = await _marketing.Users(user7)
            console.log("U7 balance= %s USDT", utils.formatEther(userData.balance.usdt))//funds got unfrozen
            console.log("U7 earn limit= %s USDT", utils.formatEther(userData.earnLimitLeft))//earn limit 30 + 2100 = 2130
            expect(userData.balance.usdt).to.equal(utils.parseEther("1.135"));
            expect(userData.earnLimitLeft).to.equal(utils.parseEther("2128.865"));
            
            await calcCompanyValue(_busd,_bpnm,_marketing)
            
            //user14 make withdraw and matching is distributed
            await _marketing.connect(signers[14]).withdrawBalance(utils.parseEther("10"),0,1)
            
            console.log("User7 addr= %s",user7)
            userData = await _marketing.Users(user7)
            console.log("U7 balance= %s USDT", utils.formatEther(userData.balance.usdt))
            console.log("U7 earn limit= %s USDT", utils.formatEther(userData.earnLimitLeft))//earn limit
            expect(userData.balance.usdt).to.equal(utils.parseEther("1.135"));//not changed
            expect(userData.earnLimitLeft).to.equal(utils.parseEther("2128.865"));//not chnaged
            
            await calcCompanyValue(_busd,_bpnm,_marketing)

        });

        
        //matching accrued to upline within lvls 5-15, each user get matching bonus
        //only required 10 users get bonus
        it("Matching on withdraw test. max packs", async function () {
            const { _bpnm, _busd, _tree, _owner, signers, _marketing } = await loadFixture(TwentyUsersRegisteredTopPack);
    
            await calcCompanyValue(_busd,_bpnm,_marketing)


            //all users buy matching
            for (let i=1;i<=20;i++) {
                await _marketing.connect(signers[i]).extendMatchingBonus();    
            }
    
            
            await calcCompanyValue(_busd,_bpnm,_marketing)

            //deposit with 10 usdt
            await depositUSDT(_busd, signers[20].address, "10")
            //increase allowance
            await _busd.connect(signers[20]).increaseAllowance(_marketing.address,utils.parseEther("10"))
            //despoit 10 usdt
            await _marketing.connect(signers[20]).replenishPaymentBalance(utils.parseEther("10"))
            
            
            
            //this user will not receive bonus
            userdata = await _marketing.Users(user4)
            console.log("U4 bal= %s USDT", utils.formatEther(userdata.balance.usdt))
            expect(userdata.balance.usdt).to.equal(utils.parseEther("3600"));
            
            //this user will received bonus last
            userdata = await _marketing.Users(user5)
            console.log("U5 bal= %s USDT", utils.formatEther(userdata.balance.usdt))
            expect(userdata.balance.usdt).to.equal(utils.parseEther("3600"));
            
            
            //matching accrued to upline
            await calcCompanyValue(_busd,_bpnm,_marketing)
            console.log("#####Make withdraw, matching accrued#####")
            
            //user14 make withdraw and matching is distributed
            await _marketing.connect(signers[20]).withdrawBalance(utils.parseEther("10"),0,1)
            
                        
            
            //this user did not receive bonus
            userdata = await _marketing.Users(user4)
            console.log("U4 bal= %s USDT", utils.formatEther(userdata.balance.usdt))
            expect(userdata.balance.usdt).to.equal(utils.parseEther("3600"));
            
            //this user received bonus last
            userdata = await _marketing.Users(user5)
            console.log("U5 bal= %s USDT", utils.formatEther(userdata.balance.usdt))
            expect(userdata.balance.usdt).to.equal(utils.parseEther("3600.045"));
            
        
            await calcCompanyValue(_busd,_bpnm,_marketing)

        });
        
        //unpaid matching levels are skipped
        //locked levels with paid matching deposited to frozen
        it("Matching deposited to frozen", async function () {
            const { _bpnm, _busd, _tree, _owner, signers, _marketing } = await loadFixture(TwentyUsersRegisteredPackId9);
    
            await calcCompanyValue(_busd,_bpnm,_marketing)

            userdata = await _marketing.Users(signers[14].address)
            console.log("U1 balance= %s USDT", utils.formatEther(userdata.balance.usdt))
            
            //check amount of frozen at lvl 14. User will get matching to frozen for this level because lvl 10 and 11 are skipped due to unpaid matching
            let frozenU2 = await _marketing.addressFrozenTotal(signers[2].address,1)
            console.log("🚀 ~ file: bpnm_tests.js:1092 ~ frozenU7:", frozenU2[0][13])
            expect(frozenU2[0][13]).to.equal(utils.parseEther("18"));


            //all users activate matching
            for (i=1;i<=9;i++) {
                await _marketing.connect(signers[i]).extendMatchingBonus()
            }
            //skip user 10 and 11 for matching activate, his level should be compressed
            for (i=12;i<=20;i++) {
                await _marketing.connect(signers[i]).extendMatchingBonus()
            }
            
            await calcCompanyValue(_busd,_bpnm,_marketing)

            //deposit with 10 usdt for user 15, this level is locked for U2
            await depositUSDT(_busd, signers[18].address, "10")
            //increase allowance
            await _busd.connect(signers[18]).increaseAllowance(_marketing.address,utils.parseEther("10"))
            //despoit 10 usdt
            await _marketing.connect(signers[18]).replenishPaymentBalance(utils.parseEther("10"))
            
            
            //user15 make withdraw and matching is distributed, U2 get bonus to frozen
            await _marketing.connect(signers[18]).withdrawBalance(utils.parseEther("10"),0,1)

            frozenU2 = await _marketing.addressFrozenTotal(signers[2].address,1)
            console.log("🚀 ~ file: bpnm_tests.js:1092 ~ frozenU7:", frozenU2[0][13])
            expect(frozenU2[0][13]).to.equal(utils.parseEther("18.0225"));//added 50% of 0.05 USDT minus 10% fee = 0.025 - 10% = 0.0225

            console.log("User2 addr= %s",user2)
            userData = await _marketing.Users(user2)
            console.log("U2 balance= %s USDT", utils.formatEther(userData.balance.usdt))
            
            
            await calcCompanyValue(_busd,_bpnm,_marketing)

        });
        
        //matching payment do not exceed 90 days
        //second matching payment add 30 days to previous date
        //gwt used correctly
        //usdt used correctly
        it("Matching max for 90 days + days added correctly ", async function () {
            const { _bpnm, _busd, _tree, _owner, signers, _btcb, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(SixteenUsersRegistered);
            //user7 buy pack for 2000 usdt, get gwt to activate matching 4 times
            //deposit with 20000 usdt + 4x2 USDT for matching activate fee
            await depositUSDT(_busd, signers[7].address, "2008")
            //increase allowance
            await _busd.connect(signers[7]).increaseAllowance(_marketing.address,utils.parseEther("2008"))
            //despoit 2000 usdt
            await _marketing.connect(signers[7]).replenishPaymentBalance(utils.parseEther("2000"))
            await _marketing.connect(signers[7]).buyLimitPack(10)
            
            gwtBal = await _gwt.balanceOf(signers[7].address)
            console.log("🚀 ~ file: bpnm_tests.js:1294 ~ gwtBal:", gwtBal)

            //buy matching for U7
            await _marketing.connect(signers[7]).extendMatchingBonus()
            //get date when matching is active
            userData = await _marketing.Users(user7)
            endDate1 = userData.matchingActiveUntil
            
            await _marketing.connect(signers[7]).extendMatchingBonus()
            //30 days should be added
            userData = await _marketing.Users(user7)
            endDate2 = userData.matchingActiveUntil
                        
            expect(Number(endDate2)-Number(endDate1)).to.equal(60*60*24*30);//30 days added

            await _marketing.connect(signers[7]).extendMatchingBonus()
            usdtBal = await _busd.balanceOf(signers[7].address)
            expect(usdtBal).to.equal(utils.parseEther("2"));//2000 pack + 2x2 usdt matching activation, left 2 USDT
            
            gwtBal = await _gwt.balanceOf(signers[7].address)
            expect(gwtBal).to.equal(utils.parseEther("204"));//10 USDT pack gives 4 GWT, 2000 pack gives 800 GWT, spent 200 + 200 + 200, left = 204
            
            //4 payment exceed 90 days so reverted
            await expect(_marketing.connect(signers[7]).extendMatchingBonus()).to.be.revertedWith("[bPNM] Max days reached");
            
            

        });
        
        //if matching expired new 30 days added at payment date not on expire date
        it("Days added correctly on expired matching payment", async function () {
            const { _bpnm, _busd, _tree, _owner, signers, _btcb, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(SixteenUsersRegistered);
    

            //user7 buy pack for 2000 usdt, get gwt to activate matching 4 times
            //deposit with 20000 usdt + 4x2 USDT for matching activate fee
            await depositUSDT(_busd, signers[7].address, "2008")
            //increase allowance
            await _busd.connect(signers[7]).increaseAllowance(_marketing.address,utils.parseEther("2008"))
            //despoit 2000 usdt
            await _marketing.connect(signers[7]).replenishPaymentBalance(utils.parseEther("2000"))
            await _marketing.connect(signers[7]).buyLimitPack(9)

            //buy matching for U7
            await _marketing.connect(signers[7]).extendMatchingBonus()
            //get date when matching is active
            userData = await _marketing.Users(user7)
            endDate1 = userData.matchingActiveUntil
            console.log("🚀 ~ file: bpnm_tests.js:1316 ~ endDate1:", endDate1)
            
            //wait for matching to expires
            await time.increase(60*60*24*40);//wait 40 days 

            
            await _marketing.connect(signers[7]).extendMatchingBonus()
            //30 days should be added from date of payment
            userData = await _marketing.Users(user7)
            endDate2 = userData.matchingActiveUntil
            console.log("🚀 ~ file: bpnm_tests.js:1325 ~ endDate2:", endDate2)
            
            
            expect(Number(endDate2)-Number(endDate1)).to.equal(60*60*24*40+1);//10 days skipped over first payment + 30 days added on second payment + 1 block
            
            

        });


        
    });


    describe("==7) Functions tests", function () {
        if (!enable_test[7]) {
            return(0)
        }

        //earn limit added
        //not exceed 10%
        //usdt fee applied
        it("Earn limit purchase", async function () {
            //test to buy over allowed 10%

            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "152")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("152"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("150"))
            
            userdata = await _marketing.Users(user1)
            console.log("🚀 ~ file: bpnm_tests.js:124 ~ earn_limit_before:", utils.formatEther(userdata.earnLimitLeft))
            // expect(userdata[4]).to.equal(utils.parseEther("10"));
            gwtBalance = await _gwt.balanceOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:290 ~ gwtBalance:", utils.formatEther(gwtBalance))
            usdtBalanceBefore = await _busd.balanceOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:292 ~ usdtBalanceBefore:", utils.formatEther(usdtBalanceBefore))
            
            //reverted if limit pack lower than 150 USDT
            await expect(_marketing.connect(_user1).buyEarnLimitWithGwt(utils.parseEther("1"))).to.be.revertedWith("[bPNM] 150 USDT or higher Limit Pack required");
            
            //buy 150 usdt limit pack
            await _marketing.connect(_user1).buyLimitPack(5)
            
            await _marketing.connect(_user1).buyEarnLimitWithGwt(utils.parseEther("1"))
            
            userdata = await _marketing.Users(user1)
            //earn limit increased
            expect(userdata.earnLimitLeft).to.equal(utils.parseEther("391"))//30 for pack1  + 360 for pack 5 + 1 bought = 391
            
            gwtBalance = await _gwt.balanceOf(user1)//2 USDT of earn limit = 1 GWT
            expect(gwtBalance).to.equal(utils.parseEther("63.5"))//4 for pack1  + 60 for pack 5 - 0.5 = 63.5
            
            usdtBalanceAfter = await _busd.balanceOf(user1)
            expect(usdtBalanceAfter).to.equal(utils.parseEther("0"))//150 +2 minus 150 for limit pack minus 2 for fee
            
            //first check is if exceeds 10%, so try to buy more than 10% to get revert
            overlimits = await _marketing.UserOverLimits(user1)
            leftFor10Percent = Number(utils.formatEther(overlimits.totalEarnLimit))/10-Number(utils.formatEther(overlimits.purchasedEarnLimit))
            console.log("🚀 ~ file: bpnm_tests.js:1616 ~ leftFor10Percent:", leftFor10Percent)
            
            await expect(_marketing.connect(_user1).buyEarnLimitWithGwt(utils.parseEther("39"))).to.be.revertedWith("[bPNM] Amount exceeds 10%");//30 + 360 = 390. 10% = 39. Bought 1 so left 38
            await expect(_marketing.connect(_user1).buyEarnLimitWithGwt(utils.parseEther("0"))).to.be.revertedWith("[bPNM] Need more than 0");

        });



        //purchase limit added
        //gwt removed
        //10% not exceed
        //fee taken
        it("Buy bPNM purchase limit. BTC rate = 50000", async function () {
            //test to buy over allowed 10%

            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 10 usdt
            await depositUSDT(_busd, _user1.address, "10")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("10"))
            //despoit 10 usdt
            
            userdata = await _bpnm.Users(user1)
            console.log("Buy limit: ", utils.formatEther(userdata.buyLimitLeft))
            // expect(userdata[4]).to.equal(utils.parseEther("10"));
            gwtBalance = await _gwt.balanceOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:290 ~ gwtBalance:", utils.formatEther(gwtBalance))
            usdtBalanceBefore = await _busd.balanceOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:292 ~ usdtBalanceBefore:", utils.formatEther(usdtBalanceBefore))
            
            expect(userdata.buyLimitLeft).to.equal(utils.parseEther("0.0008"))//10 USDT pack, 400% limit = 40 USDT. Btc price 50000, so limit = 40/50000 = 0.0008
            
            await _bpnm.connect(_user1).buyPurchaseLimit(utils.parseEther("1"))
            
            userdata = await _bpnm.Users(user1)
            expect(userdata.buyLimitLeft).to.equal(utils.parseEther("0.00082"))//1 GWT = 5 USDT of buy limit. 1 USDT = 1/ 50000 = 0.00002. Final 0.0008 + 0.00002 = 0.00082
            
            gwtBalance = await _gwt.balanceOf(user1)
            expect(gwtBalance).to.equal(utils.parseEther("3.8"))//buy pack = 4 GWT, 1 gwt = 5usdt of limit. 1 usdt of limit = 0.2 GWT. Final 4 - 0.2 = 3.8

            usdtBalanceAfter = await _busd.balanceOf(user1)
            expect(usdtBalanceAfter).to.equal(utils.parseEther("8"))//10 - 2 fee

            overlimits = await _bpnm.UserOverLimits(user1)
            leftFor10Percent = Number(utils.formatEther(overlimits.totalBuyLimit))/10-Number(utils.formatEther(overlimits.purchasedBuyLimit))
            console.log("🚀 ~ file: bpnm_tests.js:1658 ~ leftFor10Percent:", leftFor10Percent)

            await expect(_bpnm.connect(_user1).buyPurchaseLimit(utils.parseEther("4"))).to.be.revertedWith("[bPNM] Amount exceeds 10%");//0.0008 / 10 = 0.00008 0.00008*50000 = 4 USDT of limit max
            await expect(_bpnm.connect(_user1).buyPurchaseLimit(utils.parseEther("0"))).to.be.revertedWith("[bPNM] Need more than 0");

        });


        //fee takesn
        //10% not exceed
        //gwt taken
        //limit accrued
        it("Sell limit purchase", async function () {
            //test to buy over allowed 10%
            const {_bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing} = await loadFixture(firstUserRegisters);
            //deposit 0.0002 btcb
            await depositBTCB(_btcb, _owner.address, "0.0002")
            //increase allowance
            await _btcb.connect(_owner).increaseAllowance(_bpnm.address,utils.parseEther("0.0002"))
            console.log(await _btcb.balanceOf(_owner.address));
            await _btcbCollector.disablePrestart();//should be called before bPNM disable prestart so token price would not be increased on first bPNM buy
            await _bpnm.disablePrestartMode();
            
            //deposit with 10 usdt
            await depositUSDT(_busd, _user1.address, "10")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("10"))
            
            //deposit 1 btcb
            
            await depositBTCB(_btcb, _user1.address, "0.1")
            //increase allowance
            await _btcb.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("0.1"))
            
            
            console.log("totalSupply bPNM=", await _bpnm.totalSupply())
            console.log("price bPNM=", await _bpnm.bpnmPrice())
            //try to buy bpnm
            data = await _bpnm.connect(_user1).buyBpnm(utils.parseEther("0.0008"))
            console.log("price bPNM=", await _bpnm.bpnmPrice())

                                    
            userdata2 = await _bpnm.Users(user1)
            expect(userdata2.sellLimitLeft).to.equal(utils.parseEther("0.0012"))

            gwtBalance = await _gwt.balanceOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:290 ~ gwtBalance:", utils.formatEther(gwtBalance))
            usdtBalanceBefore = await _busd.balanceOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:292 ~ usdtBalanceBefore:", utils.formatEther(usdtBalanceBefore))
            
            await _bpnm.connect(_user1).buySellLimit(utils.parseEther("1"))
            
            userdata2 = await _bpnm.Users(user1)
            // console.log("🚀 ~ file: bpnm_tests.js:509 ~ userdata2:", utils.formatEther(userdata2.sellLimitLeft))
            expect(userdata2.sellLimitLeft).to.equal(utils.parseEther("0.00122"))//0.00012+0.00002

            gwtBalance = await _gwt.balanceOf(user1)
            expect(gwtBalance).to.equal(utils.parseEther("3.8"))//buy pack = 4 GWT, 1 gwt = 5usdt of limit. 1 usdt of limit = 0.2 GWT. Final 4 - 0.2 = 3.8

            console.log("🚀 ~ file: bpnm_tests.js:290 ~ gwtBalance:", utils.formatEther(gwtBalance))
            usdtBalanceAfter = await _busd.balanceOf(user1)
            // console.log("🚀 ~ file: bpnm_tests.js:292 ~ usdtBalanceAfter:", utils.formatEther(usdtBalanceAfter))
            expect(usdtBalanceAfter).to.equal(utils.parseEther("8"))//10 - 2 fee

            await expect(_bpnm.connect(_user1).buySellLimit(utils.parseEther("6"))).to.be.revertedWith("[bPNM] Amount exceeds 10%");//0.0012 / 10 = 0.00012 0.00012*50000 = 6 USDT of limit max
            await expect(_bpnm.connect(_user1).buySellLimit(utils.parseEther("0"))).to.be.revertedWith("[bPNM] Need more than 0");

        });

        //gwt decreased
        //lvl increased
        it("Buy 1% marketing", async function () {
            //test to buy over allowed 10%
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            
            
            //deposit with 10 usdt
            await depositUSDT(_busd, _user1.address, "10000")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("10000"))

            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("9000"));    

            await _marketing.connect(_user1).buyLimitPack(9);    


            gwtBalance = await _gwt.balanceOf(user1)
            
            expect(gwtBalance).to.equal(utils.parseEther("404"))//pack1 =4, pack9 = 400
            
            
            
            
            
            await _marketing.connect(_user1).extendLvlMarketingBonus()

            gwtBalance = await _gwt.balanceOf(user1)
            userData = await _marketing.connect(_user1).Users(user1)
            expect(gwtBalance).to.equal(utils.parseEther("304"))//404-100
            expect(Number(userData.extendedTreeLvl)).to.equal(4)//lvl4
            console.log("Active +1% lvl=",userData.extendedTreeLvl)
            
            
            
            
            await _marketing.connect(_user1).extendLvlMarketingBonus()

            gwtBalance = await _gwt.balanceOf(user1)
            userData = await _marketing.connect(_user1).Users(user1)
            expect(gwtBalance).to.equal(utils.parseEther("54"))//304-250
            expect(Number(userData.extendedTreeLvl)).to.equal(5)//lvl5
            
            console.log("Active +1% lvl=",userData.extendedTreeLvl)

        });

        // username set
        // unneeded symbols sanitized
        // length checked
        it("Set username", async function () {
            //test to buy over allowed 10%
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            
            
            
            await _bpnm.connect(_user1).setUsername('crypto5@$$$AN_')
            username = await _bpnm.getUsername(user1)
            console.log("🚀 ~ file: bpnm_tests.js:648 ~ username:", username)
            expect(username).to.equal("crypto5@AN_")//sanitize all except letters, numbers and @ and _

            await expect(_bpnm.connect(_user1).setUsername("12345678901234567")).to.be.revertedWith("[bPNM] Username should be less than 16 symbols");
            await expect(_bpnm.connect(_user1).setUsername("")).to.be.revertedWith("[bPNM] Username cannot be empty");
            await expect(_bpnm.connect(_user2).setUsername("John")).to.be.revertedWith("[bPNM] Please activate first");

        });

        //user set to verififed
        //user set to not verified
        //revert on verify protected operations

        it("Verification tests", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            
            
            //enable verify
            await _bpnm.triggerVerify();

            //set verificator role to user1
            await _bpnm.changeVerificator(_user1.address);
            //verify user1
            await _bpnm.connect(_user1).addressVerify(_user1.address);
            
            //deposit with 10 usdt
            await depositUSDT(_busd, _user1.address, "10000")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("10000"))
            
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("9000"));    
            
            await _marketing.connect(_user1).buyLimitPack(2);    
            
            await _bpnm.connect(_user1).addressVerify(_user1.address);
            
            
            await expect(_marketing.connect(_user1).buyLimitPack(2)).to.be.revertedWith("[bPNM] Need to verify");
            
            //when activating new activated address should be verified, activator not reauired to be verified
            await expect(_marketing.connect(_user1).activate(user17,user1,1)).to.be.revertedWith("[bPNM] Need to verify");
            
            //verify u17
            await _bpnm.connect(_user1).addressVerify(user17);
            await _marketing.connect(_user1).activate(user17,user1,1)
            isActiveU17 = await _marketing.isUserExists(user17)
            console.log("🚀 ~ file: bpnm_tests.js:1831 ~ isActiveU17:", isActiveU17)
            expect(isActiveU17).to.equal(true);



        });


    });
            
    describe("==8) bPNM buy tests", function () {
        if (!enable_test[8]) {
            return(0)
        }

        it("Buy limit in btcb accrued correctly", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);

            //deposit with 10 usdt
            await depositUSDT(_busd, _user1.address, "10")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("10"))
            
            userdata = await _bpnm.Users(user1)
            // console.log("🚀 ~ file: bpnm_tests.js:124 ~ buy limit:", utils.formatEther(userdata[4]))
            expect(userdata.buyLimitLeft).to.equal(utils.parseEther("0.0008"))//40 USDT with BTC price of 50000 = 0.0008 BTCB limit

        });

        it("After prestart mode disabled price is correct", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb,  _btcbCollector, _nft } = await loadFixture(firstUserRegisters);
            //deposit 0.0002 btcb
            await depositBTCB(_btcb, _owner.address, "0.0002")
            //increase allowance
            await _btcb.connect(_owner).increaseAllowance(_bpnm.address,utils.parseEther("0.0002"))
            console.log(await _btcb.balanceOf(_owner.address));

            await _btcbCollector.disablePrestart();//should be called before bPNM disable prestart so token price would not be increased on first bPNM buy
            await _bpnm.disablePrestartMode();

            const bPnmPrice = await _bpnm.bpnmPrice()
            // console.log("🚀 ~ file: bpnm_tests.js:1313 ~ bPnmPrice:", utils.formatEther(bPnmPrice))
            expect(bPnmPrice).to.equal(utils.parseEther("0.0002"))//Starting price is 0.0002

        });

        //user get bPNM
        //pld deposited with fee
        //buy limit used
        //sell limit accrued
        //bpnm price correct
        it("Buy bPNM", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            await _btcbCollector.disablePrestart();//should be called before bPNM disable prestart so token price would not be increased on first bPNM buy
            await _disabelPrestart(_btcb,_btcbCollector,_owner,_bpnm)
            
            

            //buy pack once more to get more limit
            await depositUSDT(_busd, _user1.address, "10")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("10"))
            //despoit 1000 usdt
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("10"))
            //purchase pack
            await _marketing.connect(_user1).buyLimitPack(1)
            
            //deposit 1 btcb
            
            await depositBTCB(_btcb, _user1.address, "0.1")
            //increase allowance
            await _btcb.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("0.1"))
            
            const totalSupply = await _bpnm.totalSupply()
            console.log("totalSupply bPNM=", utils.formatEther(totalSupply))
            expect(totalSupply).to.equal(utils.parseEther("1"))//after prestart disabled one token is minted

            const bpnmPrice = await _bpnm.bpnmPrice()
            console.log("price bPNM=", utils.formatEther(bpnmPrice))
            
            //buy bpnm
            data = await _bpnm.connect(_user1).buyBpnm(utils.parseEther("0.001"))
            
            const totalSupply2 = await _bpnm.totalSupply()
            console.log("totalSupply bPNM=", utils.formatEther(totalSupply2))
            expect(totalSupply2).to.equal(utils.parseEther("5.25"))//price 0.0002 so 0.001/0.0002 = 5 - 15% fee = 4.25 | 4.25+1 = 5.25
            
            const bpnmPrice2 = await _bpnm.bpnmPrice()
            console.log("price bPNM=", utils.formatEther(bpnmPrice2))
            
            const bpnmBal = await _bpnm.balanceOf(user1)
            console.log("User1 Balance bPNM=", utils.formatEther(bpnmBal))
            //user get correct bPNM amount
            expect(bpnmBal).to.equal(utils.parseEther("4.25"))//price 0.0002 so 0.1/0.0002 = 5 - 15% fee = 4.25
            
            const pldBalance = await _btcb.balanceOf(_btcbCollector.address)
            console.log("PLD= %s BTCB", utils.formatEther(pldBalance))
            //pld deposited with fee
            expect(pldBalance).to.equal(utils.parseEther("0.00015"))//15% of 0.001 = 0.00015
            
            const userData = await _bpnm.Users(user1)
            console.log("🚀 ~ file: bpnm_tests.js:1371 ~ userData:", utils.formatEther(userData.buyLimitLeft))
            expect(userData.buyLimitLeft).to.equal(utils.parseEther("0.0006"))//Buy limit | 0.0016 - 0.001 = 0.0006
            expect(userData.sellLimitLeft).to.equal(utils.parseEther("0.0015"))//Sell limit |  0.001 * 150% = 0.0015
            
            expect(bpnmPrice2).to.equal(utils.parseEther("0.0002"))//bpnm price not affected after purchase

            await expect(_bpnm.connect(_user1).buyBpnm(utils.parseEther("1"))).to.be.revertedWith("[bPNM] Not enough BTCB balance");
            await expect(_bpnm.connect(_user1).buyBpnm(utils.parseEther("0.09"))).to.be.revertedWith("[bPNM] Not enough buy limit");
            await expect(_bpnm.connect(_user1).buyBpnm(utils.parseEther("0.000009"))).to.be.revertedWith("[bPNM] Less than min buy");


        });

    });
            
    describe("==9) bPNM sell tests", function () {
        if (!enable_test[9]) {
            return(0)
        }

        //totalSupply updated
        //bpnm price not affected
        //pld balance increased with fee
        //btcb deposited to user
        //bpnm burned
        //sell limit updated
        it("Buy and sell bPNM", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            await _btcbCollector.disablePrestart();//should be called before bPNM disable prestart so token price would not be increased on first bPNM buy
            await _disabelPrestart(_btcb,_btcbCollector,_owner,_bpnm)
            
            //buy pack once more to get more limit
            await depositUSDT(_busd, _user1.address, "10")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("10"))
            //despoit 1000 usdt
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("10"))
            //purchase pack
            await _marketing.connect(_user1).buyLimitPack(1)


            //deposit btcb
            await depositBTCB(_btcb, _user1.address, "0.001")
            //increase allowance
            await _btcb.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("0.001"))
            
            //buy bpnm
            data = await _bpnm.connect(_user1).buyBpnm(utils.parseEther("0.001"))

            let totalSupply = await _bpnm.totalSupply()
            console.log("totalSupply bPNM=", utils.formatEther(totalSupply))
            expect(totalSupply).to.equal(utils.parseEther("5.25"))//price 0.0002 so 0.001/0.0002 = 5 - 15% fee = 4.25 | 4.25+1 = 5.25
            
            data = await _bpnm.connect(_user1).sellBpnm(utils.parseEther("1"))//selling 1 bpnm
            
            //total supply decreased
            totalSupply = await _bpnm.totalSupply()
            console.log("totalSupply bPNM=", utils.formatEther(totalSupply))
            expect(totalSupply).to.equal(utils.parseEther("4.25"))//5.25-1

            const bpnmPrice2 = await _bpnm.bpnmPrice()
            console.log("price bPNM=", utils.formatEther(bpnmPrice2))
            expect(bpnmPrice2).to.equal(utils.parseEther("0.0002"))//bpnm price not affected after sell

            const pldBalance = await _btcb.balanceOf(_btcbCollector.address)
            console.log("PLD= %s BTCB", utils.formatEther(pldBalance))
            //pld deposited with fee
            expect(pldBalance).to.equal(utils.parseEther("0.00016"))//15% of 0.001 = 0.00015 + 5% of 0.0002 = 0.00001 | total = 0.00015 + 0.00001 = 0.00016

            const btcbUserBalance = await _btcb.balanceOf(user1)
            console.log("User BTCB= %s BTCB", utils.formatEther(btcbUserBalance))
            //user deposited with btcb
            expect(btcbUserBalance).to.equal(utils.parseEther("0.00019"))//0.0002*0.95 = 0.00019

            const bpnmUserBalance = await _bpnm.balanceOf(user1)
            console.log("User bPNM= %s", utils.formatEther(bpnmUserBalance))
            //user deposited with btcb
            expect(bpnmUserBalance).to.equal(utils.parseEther("3.25"))//4.25-1

            //sell limit decreased
            const userData = await _bpnm.Users(user1)
            console.log("User sell lmt= %s", utils.formatEther(userData.sellLimitLeft))
            expect(userData.sellLimitLeft).to.equal(utils.parseEther("0.0013"))//Sell limit is 0.001*1.5 = 0.0015 | 0.0015-1*0.0002 = 0.0013

            await expect(_bpnm.connect(_user1).sellBpnm(utils.parseEther("1000"))).to.be.revertedWith("[bPNM] Not enough bPNM balance");

            
        });

        //increase token price to check if not more than sell limit can be sold
        it("Sell limit used correctly", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            await _btcbCollector.disablePrestart();//should be called before bPNM disable prestart so token price would not be increased on first bPNM buy
            await _disabelPrestart(_btcb,_btcbCollector,_owner,_bpnm)
            
            //buy pack once more to get more limit
            await depositUSDT(_busd, _user1.address, "10")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("10"))
            //despoit 1000 usdt
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("10"))
            //purchase pack
            await _marketing.connect(_user1).buyLimitPack(1)


            //deposit btcb
            await depositBTCB(_btcb, _user1.address, "0.001")
            //increase allowance
            await _btcb.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("0.001"))
            
            //buy bpnm
            data = await _bpnm.connect(_user1).buyBpnm(utils.parseEther("0.001"))

            let totalSupply = await _bpnm.totalSupply()
            console.log("totalSupply bPNM=", utils.formatEther(totalSupply))
            expect(totalSupply).to.equal(utils.parseEther("5.25"))//price 0.0002 so 0.001/0.0002 = 5 - 15% fee = 4.25 | 4.25+1 = 5.25
            
            //increase price
            //deposit PLD with 10 BTCB
            await depositBTCB(_btcb, _btcbCollector.address, "10")//deposit PLD
            for (i=1;i<150;i++) {
                await time.increase(60*60*24);//wait 24 hours
                //trigger unlock
                await _btcbCollector.performUnlock();
                bpnmPrice2 = await _bpnm.bpnmPrice()
                console.log("price bPNM=", utils.formatEther(bpnmPrice2))
    
            }

            await expect(_bpnm.connect(_user1).sellBpnm(utils.parseEther("4"))).to.be.revertedWith("[bPNM] Not enough sell limit");


            
        });


    });
            
    describe("==10) PLD test", function () {
        if (!enable_test[10]) {
            return(0)
        }
        
        //test performed with BTC price 50000
        //liquidity calculated correctly
        //unlocked on timer
        it("Liquidity unlocked correctly", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            await _btcbCollector.disablePrestart();//should be called before bPNM disable prestart so token price would not be increased on first bPNM buy
            await time.increase(60*60*24);//wait 24 hours

            //transfer liquidity
            //deposit 0.0002 btcb
            await depositBTCB(_btcb, _bpnm.address, "4.5")//deposit bpnm
            await depositBTCB(_btcb, _btcbCollector.address, "10.0000000")//deposit PLD
            await depositUSDT(_busd, liquidityCollector, "4000")//deposit usdt liquidity collector

            let bpnmBalanceBtcb = await _btcb.balanceOf(_bpnm.address)
            console.log("bPNM BTCB balance= %s BTCB",utils.formatEther(bpnmBalanceBtcb))
            //trigger unlock
            let unlockTime = await _btcbCollector.LastLiquidityUnlockTime();
            console.log("🚀 ~ file: bpnm_tests.js:727 ~ unlockTime:", unlockTime)
            await _btcbCollector.performUnlock();
            
            bpnmBalanceBtcb = await _btcb.balanceOf(_bpnm.address)
            console.log("bPNM BTCB balance= %s BTCB",utils.formatEther(bpnmBalanceBtcb))
            expect(bpnmBalanceBtcb).to.be.equal(utils.parseEther("4.515555631762614402"))//4.5 + 0.5% * (1-(4.5/(4.5 + 10 + (4000/50000))))*4.5
            await time.increase(60*60*23);//wait 23 hours
            
            pldBalanceBtcb = await _btcb.balanceOf(_btcbCollector.address)
            console.log("PLD BTCB balance= %s BTCB",utils.formatEther(pldBalanceBtcb))
            expect(Number(utils.formatEther(pldBalanceBtcb))+Number(utils.formatEther(bpnmBalanceBtcb))).to.be.equal(14.5)
            expect(pldBalanceBtcb).to.be.equal(utils.parseEther("9.984444368237385598"))//
            

            unlockTime = await _btcbCollector.LastLiquidityUnlockTime();
            console.log("🚀 ~ file: bpnm_tests.js:727 ~ unlockTime:", unlockTime)
            await _btcbCollector.performUnlock();
            expect(bpnmBalanceBtcb).to.be.equal(utils.parseEther("4.515555631762614402"))//not changed
            
            bpnmBalanceBtcb = await _btcb.balanceOf(_bpnm.address)
            console.log("bPNM BTCB balance= %s BTCB",utils.formatEther(bpnmBalanceBtcb))
            
            await time.increase(60*60*1);//wait 1 hour. Total 24+ hours, should release
            
            unlockTime = await _btcbCollector.LastLiquidityUnlockTime();
            console.log("🚀 ~ file: bpnm_tests.js:727 ~ unlockTime:", unlockTime)
            await _btcbCollector.performUnlock();
            bpnmBalanceBtcb = await _btcb.balanceOf(_bpnm.address)
            expect(bpnmBalanceBtcb).to.be.equal(utils.parseEther("4.531140948019931514"))//same formula as above
            
            bpnmBalanceBtcb = await _btcb.balanceOf(_bpnm.address)
            console.log("bPNM BTCB balance= %s BTCB",utils.formatEther(bpnmBalanceBtcb))
            
            await time.increase(60*60*1);//wait 1 hour. Less than 24 hours after last unlock, should not release
            
            unlockTime = await _btcbCollector.LastLiquidityUnlockTime();
            console.log("🚀 ~ file: bpnm_tests.js:727 ~ unlockTime:", unlockTime)
            await _btcbCollector.performUnlock();
            
            bpnmBalanceBtcb = await _btcb.balanceOf(_bpnm.address)
            console.log("bPNM BTCB balance= %s BTCB",utils.formatEther(bpnmBalanceBtcb))
            
            

        });

        //PLD balance less than required percent, so all is unlocked to zero balance
        it("Liquidity unlocked until zero PLD", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            await _btcbCollector.disablePrestart();//should be called before bPNM disable prestart so token price would not be increased on first bPNM buy
            await time.increase(60*60*24);//wait 24 hours

            //transfer liquidity
            //deposit 0.0002 btcb
            await depositBTCB(_btcb, _bpnm.address, "4.5")//deposit bpnm
            await depositBTCB(_btcb, _btcbCollector.address, "0.0010000")//deposit PLD
            await depositUSDT(_busd, liquidityCollector, "4000000")//deposit usdt liquidity collector

            let bpnmBalanceBtcb = await _btcb.balanceOf(_bpnm.address)
            console.log("bPNM BTCB balance= %s BTCB",utils.formatEther(bpnmBalanceBtcb))
            
            //trigger unlock
            await _btcbCollector.performUnlock();
            
            bpnmBalanceBtcb = await _btcb.balanceOf(_bpnm.address)
            console.log("bPNM BTCB balance= %s BTCB",utils.formatEther(bpnmBalanceBtcb))
            expect(bpnmBalanceBtcb).to.be.equal(utils.parseEther("4.501"))//4.5 + 0.001
            
            await time.increase(60*60*24);//wait 23 hours
            
            pldBalanceBtcb = await _btcb.balanceOf(_btcbCollector.address)
            console.log("PLD BTCB balance= %s BTCB",utils.formatEther(pldBalanceBtcb))
            // expect(Number(utils.formatEther(pldBalanceBtcb))+Number(utils.formatEther(bpnmBalanceBtcb))).to.be.equal(14.5)
            // expect(pldBalanceBtcb).to.be.equal(utils.parseEther("9.984444368237385625"))//
            
            await _btcbCollector.performUnlock();
            expect(bpnmBalanceBtcb).to.be.equal(utils.parseEther("4.501"))//not changed
            
            

        });

        //return false on PLD or bPNM zero BTCB balance
        it("Correct formula for zero PLD and ZERO usdtFee", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft } = await loadFixture(deploybPNMandTree);
            await _btcbCollector.disablePrestart();//should be called before bPNM disable prestart so token price would not be increased on first bPNM buy
            await time.increase(60*60*24);//wait 24 hours

            //transfer liquidity
            //deposit 0.0002 btcb
            await depositBTCB(_btcb, _bpnm.address, "4.5")//deposit bpnm
            await depositBTCB(_btcb, _btcbCollector.address, "0.0000000")//deposit PLD
            await depositUSDT(_busd, liquidityCollector, "0000000")//deposit usdt liquidity collector

            let bpnmBalanceBtcb = await _btcb.balanceOf(_bpnm.address)
            console.log("bPNM BTCB balance= %s BTCB",utils.formatEther(bpnmBalanceBtcb))
            
            //trigger unlock
            await _btcbCollector.performUnlock();
            
            bpnmBalanceBtcb = await _btcb.balanceOf(_bpnm.address)
            console.log("bPNM BTCB balance= %s BTCB",utils.formatEther(bpnmBalanceBtcb))
            // expect(bpnmBalanceBtcb).to.be.equal(utils.parseEther("4.501"))//4.5 + 0.001
            
            await time.increase(60*60*24);//wait 24 hours
            
            pldBalanceBtcb = await _btcb.balanceOf(_btcbCollector.address)
            console.log("PLD BTCB balance= %s BTCB",utils.formatEther(pldBalanceBtcb))
            // expect(Number(utils.formatEther(pldBalanceBtcb))+Number(utils.formatEther(bpnmBalanceBtcb))).to.be.equal(14.5)
            // expect(pldBalanceBtcb).to.be.equal(utils.parseEther("9.984444368237385625"))//
            
            unlockStatus = await _btcbCollector.performUnlock();
            expect(bpnmBalanceBtcb).to.be.equal(utils.parseEther("4.5"))//not changed
            
            

        });

    });
            
    //rarity for 10k tokens is set
    describe("==11) NFT tests", function () {
        if (!enable_test[11]) {
            return(0)
        }



        it("Rarity set for 10 000 token", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
                                    
                        
            //Get rarity
            const t0 = await _nft.getTokenRarityLevel(0)
            console.log('0 NFT Rarity=',t0)
            expect(t0).to.equal(utils.parseEther("0"))//tokens start from 1
            
            const t1 = await _nft.getTokenRarityLevel(1)
            console.log('1 NFT Rarity=',t1)
            expect(t1).to.not.equal(utils.parseEther("0"))//tokens start from 1
            
            const t1000 = await _nft.getTokenRarityLevel(1000)
            console.log('1000 NFT Rarity=',t1000)
            expect(t1000).to.not.equal(utils.parseEther("0"))//check between batches of 500 tokens
            
            const t1001 = await _nft.getTokenRarityLevel(1001)
            console.log('1001 NFT Rarity=',t1001)
            expect(t1001).to.not.equal(utils.parseEther("0"))//check between batches of 500 tokens
            
            const t10000 = await _nft.getTokenRarityLevel(10000)
            console.log('10000 NFT Rarity=',t10000)
            expect(t10000).to.not.equal(utils.parseEther("0"))//last token
            
            const t10001 = await _nft.getTokenRarityLevel(10001)
            console.log('10001 NFT Rarity=',t10001)
            expect(t10001).to.equal(utils.parseEther("0"))//not exist            

        });


        //mint tokens deposited on limit pack purchase
        //NFT minted
        //fee taken on NFT transfer
        //rarity moved correctly
        it("Token mint voucher accrued, NFT minted, NFT transferred.", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);

            //deposit user to purchase 2x limit packs for 1000 USDT
            const transfer_weiValue = utils.parseEther("2040");
            await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
            console.log('USDT bal=',await _busd.balanceOf(user1))

            // increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("2000"))
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("2000"));    
            await _marketing.connect(_user1).buyLimitPack(9);    
            await _marketing.connect(_user1).buyLimitPack(9);    
            let totalDistributedTokens = await _marketing.nftMintTokenDistributedAmount()
            console.log('Distributed mint tokens=',Number(totalDistributedTokens))
            expect(Number(totalDistributedTokens)).to.equal(20+4)//500 USDT of limit pack purchase to get 1 token. 2000 USDT = 4 tokens
            
            let u1MintBalance = await _marketing.MintTokenBalance(user1);
            console.log('U1 Mint tokens balance=',Number(u1MintBalance))
            expect(Number(u1MintBalance)).to.equal(4)//500 USDT of limit pack purchase to get 1 token. 2000 USDT = 4 tokens
            
            //mint nft to user with bpnm contract
            await _marketing.connect(_user1).mintNFT()
            console.log('USER 1 | NFT Owner=',await _nft.getTokensByOwner(_user1.address))
            
            await _marketing.connect(_user1).mintNFT()
            console.log('USER 1 | NFT Owner=',await _nft.getTokensByOwner(_user1.address))
            
            //if users start minitng NFT we cannot distribute first 20
            await expect(_nft.mintFirstTwenty(user1)).to.be.revertedWith('Zero supply needed');


            totalDistributedTokens = await _marketing.nftMintTokenDistributedAmount()
            console.log('Distributed mint tokens=',Number(totalDistributedTokens))
            expect(Number(totalDistributedTokens)).to.equal(20+4)//500 USDT of limit pack purchase to get 1 token. 2000 USDT = 4 tokens. Not changed after mint
            
            u1MintBalance = await _marketing.MintTokenBalance(user1);
            console.log('U1 Mint tokens balance=',Number(u1MintBalance))
            expect(Number(u1MintBalance)).to.equal(2)//500 USDT of limit pack purchase to get 1 token. 2000 USDT = 4 tokens. 2 already used for mint
            
            await _marketing.connect(_user1).mintNFT()
            console.log('USER 1 | NFT Owner=',await _nft.getTokensByOwner(_user1.address))
            
            await _marketing.connect(_user1).mintNFT()
            console.log('USER 1 | NFT Owner=',await _nft.getTokensByOwner(_user1.address))
            
            u1MintBalance = await _marketing.MintTokenBalance(user1);
            console.log('U1 Mint tokens balance=',Number(u1MintBalance))
            expect(Number(u1MintBalance)).to.equal(0)//500 USDT of limit pack purchase to get 1 token. 2000 USDT = 4 tokens. 4 already used for mint
            
            //get u1 tokens rarity
            let u1TotalRarity = await _nft.getAddressTotalRarityLevel(_user1.address);
            console.log('Owner total rarity=',Number(u1TotalRarity))
            let u1Tokens = await _nft.getTokensByOwner(_user1.address);//user owned token IDs
            let t1Rarity = await _nft.getTokenRarityLevel(Number(u1Tokens[0]))
            let t2Rarity = await _nft.getTokenRarityLevel(Number(u1Tokens[1]))
            let t3Rarity = await _nft.getTokenRarityLevel(Number(u1Tokens[2]))
            let t4Rarity = await _nft.getTokenRarityLevel(Number(u1Tokens[3]))
            
            expect(Number(t1Rarity)+Number(t2Rarity)+Number(t3Rarity)+Number(t4Rarity)).to.equal(Number(u1TotalRarity))//Total user NFT rarity should be correct
            
            //feecollector balance before transfer
            const feeCollectorBalBefore = await _busd.balanceOf(feeCollector)
            console.log("🚀 ~ file: bpnm_tests.js:2185 ~ feeCollectorBalBefore:", feeCollectorBalBefore)
            //transfer 2 tokens to u2
            await _busd.connect(_user1).increaseAllowance(_nft.address,utils.parseEther("20"))

            await _nft.connect(_user1).transferFrom(user1,user2,Number(u1Tokens[0]))
            await _nft.connect(_user1).transferFrom(user1,user2,Number(u1Tokens[3]))
            
            const feeCollectorBalAfter = await _busd.balanceOf(feeCollector)
            console.log("🚀 ~ file: bpnm_tests.js:2193 ~ feeCollectorBalAfter:", feeCollectorBalAfter)
            // expect(feeCollectorBalAfter-feeCollectorBalBefore).to.equal(utils.parseEther("20"))//fee is 20 usdt

            //fee should be taken
            const u1USDTbal = await _busd.balanceOf(user1)
            expect(u1USDTbal).to.equal(utils.parseEther("20"))//2040 - 1000 - 1000 - 2x10 = 20

            //get u1 tokens rarity. Rarity changed correctly
            u1TotalRarity = await _nft.getAddressTotalRarityLevel(_user1.address);
            console.log('U1 total rarity=',Number(u1TotalRarity))
            u1Tokens = await _nft.getTokensByOwner(_user1.address);//user owned token IDs
            t1Rarity = await _nft.getTokenRarityLevel(Number(u1Tokens[0]))
            t2Rarity = await _nft.getTokenRarityLevel(Number(u1Tokens[1]))
            
            expect(Number(t1Rarity)+Number(t2Rarity)).to.equal(Number(u1TotalRarity))//Total user NFT rarity should be correct
            
            //get u2 tokens rarity. Rarity changed correctly
            let u2TotalRarity = await _nft.getAddressTotalRarityLevel(_user2.address);
            console.log('U2 total rarity=',Number(u2TotalRarity))
            let u2Tokens = await _nft.getTokensByOwner(_user2.address);//user owned token IDs
            t1Rarity = await _nft.getTokenRarityLevel(Number(u2Tokens[0]))
            t2Rarity = await _nft.getTokenRarityLevel(Number(u2Tokens[1]))
            
            expect(Number(t1Rarity)+Number(t2Rarity)).to.equal(Number(u2TotalRarity))//Total user NFT rarity should be correct
            await expect(_marketing.connect(_user1).mintNFT()).to.be.revertedWith("[bPNM] Not enough mint tokens");

            //test revert, claim from other owner nft
            await expect(_nft.connect(_user2).claimNftGwtProfit(Number(u1Tokens[0]))).to.be.revertedWith('[CNS] Not token owner');

        });

        //no rounding to lower value
        it("Mint tokens rounding durin limit pack purchase", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            
            const transfer_weiValue = utils.parseEther("5000");
            await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
            console.log('USDT bal=',await _busd.balanceOf(user1))
            
            await _marketing.setNftMintTokenTurnoverRequired(utils.parseEther("2100"))

            // increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("5000"))
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("4000"));    
            await _marketing.connect(_user1).buyLimitPack(10);    
            const totalDistributedTokens = await _marketing.nftMintTokenDistributedAmount();
            expect(Number(totalDistributedTokens)).to.equal(20+0)//no rounding to lower. so 20 pre-minted NFT

            
            //claim gwt profit
            // console.log('GWT bal=',await _gwt.balanceOf(user1))

            // await time.increase(60*60*24*10);//wait 10 days 
            // await _nft.connect(_user1).batchClaimGwtProfit()
            // console.log('GWT bal=',await _gwt.balanceOf(user1))



        });

        //profit correct
        //gwt deposited
        //timers reseted
        //batch claim ok
        //single claim ok
        it("GWT income for NFT owning", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);

            //deposit user to purchase 2x limit packs for 1000 USDT
            const transfer_weiValue = utils.parseEther("2040");
            await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
    
            // increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("2000"))
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("2000"));    
            await _marketing.connect(_user1).buyLimitPack(9);    
            await _marketing.connect(_user1).buyLimitPack(9);    
            
            let u1MintBalance = await _marketing.MintTokenBalance(user1);
            console.log('U1 Mint tokens balance=',Number(u1MintBalance))
            expect(Number(u1MintBalance)).to.equal(4)//500 USDT of limit pack purchase to get 1 token. 2000 USDT = 4 tokens
            
            //mint nft to user with bpnm contract
            await _marketing.connect(_user1).mintNFT()            
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()
            
            u1Tokens = await _nft.getTokensByOwner(_user1.address);//user owned token IDs

            //show rarity of each nft
            let t1Rarirty = await _nft.getTokenRarityLevel(Number(u1Tokens[0]))
            console.log("\nU1 t1 rarity= %s", Number(t1Rarirty))
            let t2Rarirty = await _nft.getTokenRarityLevel(Number(u1Tokens[1]))
            console.log("U1 t2 rarity= %s", Number(t2Rarirty))
            let t3Rarirty = await _nft.getTokenRarityLevel(Number(u1Tokens[2]))
            console.log("U1 t3 rarity= %s", Number(t3Rarirty))
            let t4Rarirty = await _nft.getTokenRarityLevel(Number(u1Tokens[3]))
            console.log("U1 t4 rarity= %s", Number(t4Rarirty))


            //get u1 tokens rarity
            let u1TotalRarity = await _nft.getAddressTotalRarityLevel(_user1.address);
            console.log('==U1 total rarity=',Number(u1TotalRarity))

            //wait 100 days and claim GWT profit
            let u1gwtBalBefore = await _gwt.balanceOf(user1)
            console.log('\nU1 GWT bal before claim=',utils.formatEther(u1gwtBalBefore))
            console.log("\n==Waiting 100 days==\n")
            await time.increase(60*60*24*100);//wait 100 days 
            
            let t1Profit = await _nft._calcNftGwtProfit(Number(u1Tokens[0]))
            let t2Profit = await _nft._calcNftGwtProfit(Number(u1Tokens[1]))
            let t3Profit = await _nft._calcNftGwtProfit(Number(u1Tokens[2]))
            let t4Profit = await _nft._calcNftGwtProfit(Number(u1Tokens[3]))
            console.log("U1 t1 profit= %s", utils.formatEther(t1Profit))
            console.log("U1 t2 profit= %s", utils.formatEther(t2Profit))
            console.log("U1 t3 profit= %s", utils.formatEther(t3Profit))
            console.log("U1 t4 profit= %s", utils.formatEther(t4Profit))
            
            //check profit. We get 1 GWT for each 100 rarity daily, so for 100 days profit = 1200 - rarity amount
            const t1AwaitedProfit = 1200 - Number(t1Rarirty) //clean rarity is calculated by 1200 - rarity
            expect(t1AwaitedProfit).to.be.equal(Math.floor(utils.formatEther(t1Profit)))
            
            
            console.log("\n==Claim BATCH profit==")
            await _nft.connect(_user1).batchClaimGwtProfit()
            
            u1gwtBalAfter = await _gwt.balanceOf(user1)
            console.log('U1 GWT bal=',utils.formatEther(u1gwtBalAfter))
            const balDiff = Math.floor(Number(utils.formatEther(u1gwtBalAfter))-Number(utils.formatEther(u1gwtBalBefore)))
            const accruedProfit =  Math.floor(Number(utils.formatEther(t1Profit)) + Number(utils.formatEther(t2Profit)) + Number(utils.formatEther(t3Profit)) + Number(utils.formatEther(t4Profit)))
            
            console.log("🚀 ~ file: bpnm_tests.js:2356 ~ accruedProfit:", accruedProfit)
            expect(balDiff).to.be.equal(accruedProfit)
            
            //timers reseted
            t1Profit = await _nft._calcNftGwtProfit(Number(u1Tokens[0]))
            t2Profit = await _nft._calcNftGwtProfit(Number(u1Tokens[1]))
            t3Profit = await _nft._calcNftGwtProfit(Number(u1Tokens[2]))
            t4Profit = await _nft._calcNftGwtProfit(Number(u1Tokens[3]))
           console.log("U1 t1 profit= %s", utils.formatEther(t1Profit))
           console.log("U1 t2 profit= %s", utils.formatEther(t2Profit))
           console.log("U1 t3 profit= %s", utils.formatEther(t3Profit))
           console.log("U1 t4 profit= %s", utils.formatEther(t4Profit))
           
           expect(Math.floor(utils.formatEther(t4Profit))).to.be.equal(0)


           //test exact nft profit claim
            console.log("\n==Waiting 100 days==\n")
            await time.increase(60*60*24*100);//wait 100 days 
            
            
            t1Profit = await _nft._calcNftGwtProfit(Number(u1Tokens[0]))
            t2Profit = await _nft._calcNftGwtProfit(Number(u1Tokens[1]))
            t3Profit = await _nft._calcNftGwtProfit(Number(u1Tokens[2]))
            t4Profit = await _nft._calcNftGwtProfit(Number(u1Tokens[3]))
            console.log("U1 t1 profit= %s", utils.formatEther(t1Profit))
            console.log("U1 t2 profit= %s", utils.formatEther(t2Profit))
            console.log("U1 t3 profit= %s", utils.formatEther(t3Profit))
            console.log("U1 t4 profit= %s", utils.formatEther(t4Profit))
            
            console.log("\n==Claim t3 profit==")
            await _nft.connect(_user1).claimNftGwtProfit(Number(u1Tokens[2]))
            
            u1gwtBalAfter2 = await _gwt.balanceOf(user1)
            console.log('U1 GWT bal=',utils.formatEther(u1gwtBalAfter2))

            expect(Math.round(Number(utils.formatEther(u1gwtBalAfter2)) - Number(utils.formatEther(u1gwtBalAfter)))).to.be.equal(Math.round(Number(utils.formatEther(t3Profit))))
            
            t1Profit = await _nft._calcNftGwtProfit(Number(u1Tokens[0]))
            t2Profit = await _nft._calcNftGwtProfit(Number(u1Tokens[1]))
            t3Profit = await _nft._calcNftGwtProfit(Number(u1Tokens[2]))
            t4Profit = await _nft._calcNftGwtProfit(Number(u1Tokens[3]))
            console.log("U1 t1 profit= %s", utils.formatEther(t1Profit))
            console.log("U1 t2 profit= %s", utils.formatEther(t2Profit))
            console.log("U1 t3 profit= %s", utils.formatEther(t3Profit))
            console.log("U1 t4 profit= %s", utils.formatEther(t4Profit))
            
            const releasedRarity = await _nft.releasedRarity()
            console.log("Released rarity= %s", Number(releasedRarity))
            

        });

        //uri corect
        //uri changeable
        it("Token URi correct", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);

            //deposit user to purchase 2x limit packs for 1000 USDT
            const transfer_weiValue = utils.parseEther("2040");
            await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
    
            // increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("2000"))
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("2000"));    
            await _marketing.connect(_user1).buyLimitPack(9);    
            await _marketing.connect(_user1).buyLimitPack(9);    
            
            let u1MintBalance = await _marketing.MintTokenBalance(user1);
            console.log('U1 Mint tokens balance=',Number(u1MintBalance))
            expect(Number(u1MintBalance)).to.equal(4)//500 USDT of limit pack purchase to get 1 token. 2000 USDT = 4 tokens
            
            //mint nft to user with bpnm contract
            await _marketing.connect(_user1).mintNFT()            
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()
            
            u1Tokens = await _nft.getTokensByOwner(_user1.address);//user owned token IDs
            
            u1Uri = await _nft.tokenURI(Number(u1Tokens[0]));//user owned token IDs
            console.log("🚀 ~ file: bpnm_tests.js:2450 ~ u1Uri:", u1Uri)
            expect(u1Uri).to.equal("ipfs://bafybeihfjre5ijn2obfpp6bnmk7sefecygdu6suihayvc3kqzttafi7msm/"+u1Tokens[0])
            //update uri
            await _nft.setBaseURI("ipfs://helloworld/");//user owned token IDs
            
            u1Uri = await _nft.tokenURI(Number(u1Tokens[0]));//user owned token IDs
            console.log("🚀 ~ file: bpnm_tests.js:2450 ~ u1Uri:", u1Uri)
            expect(u1Uri).to.equal("ipfs://helloworld/"+u1Tokens[0])
        });

        //nft+gwt works
        //nft+ more tha needed gwt - works
        //all compensated by nft - ok
        it("Withdraw with NFT+GWT compensate", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);

            //deposit user to purchase limit packs for 2000 USDT
            const transfer_weiValue = utils.parseEther("20040");
            await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
    
            // increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("20040"))
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("20040"));    
            await _marketing.connect(_user1).buyLimitPack(10);    
            await _marketing.connect(_user1).buyLimitPack(10);    
            await _marketing.connect(_user1).buyLimitPack(10);    
            await _marketing.connect(_user1).buyLimitPack(10);    
            
            
            //mint 3 nft to user with bpnm contract
            await _marketing.connect(_user1).mintNFT()            
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()

            //get u1 tokens rarity
            let u1TotalRarity = await _nft.getAddressTotalRarityLevel(_user1.address);
            console.log("U1 rarity= %s", Number(u1TotalRarity))

            await calcCompanyValue(_busd,_bpnm,_marketing)

            userdata = await _marketing.Users(user1)
            console.log("U1 bal= %s USDT", utils.formatEther(userdata.balance.usdt))
            // expect(userdata.balance.usdt).to.equal(utils.parseEther("21"));
            
            //check gwt balance. Bought 10 and 4x2000 so 40% = 3204 GWT
            gwtBalance = await _gwt.balanceOf(user1)
            console.log("U1 bal= %s GWT", utils.formatEther(gwtBalance))

            const u1NftDiscount = (4*1200 - Number(u1TotalRarity)) / 100000 * 10
            //withdraw 10 usdt, use 2 GWT to compensate, this is more than maxfee so should be used max amount of gwt for compensate
            await _marketing.connect(_user1).withdrawBalance(utils.parseEther("10"),utils.parseEther("2"),1)
            console.log("\n==Make Withdraw #1==\n")
            
            await calcCompanyValue(_busd,_bpnm,_marketing)
            
            //should be deposited 10 - 5% for matching, 5% - compensated by gwt, so total 9.5
            usdtBalanceAfter = await _busd.balanceOf(user1)
            console.log("U1 USDT contract bal= %s USDT", utils.formatEther(usdtBalanceAfter))
            // expect(usdtBalanceAfter).to.equal(utils.parseEther("9.5"));
            
            
            gwtBalanceAfter = await _gwt.balanceOf(user1)
            console.log("U1 GWT bal= %s GWT", utils.formatEther(gwtBalanceAfter))
            // expect(gwtBalanceAfter).to.equal(utils.parseEther("5.5"));
            
            expect(_bigIntToFixedFloat(gwtBalanceAfter)).to.be.equal((3204-0.5+u1NftDiscount).toFixed(3))//should be used 0.5 GWT but amount of NFT discount is returned
            
            console.log("\n==Make Withdraw #2==\n")
            //withdraw 10 usdt, use 0.1 GWT to compensate, this is LESS than maxfee so should be used exact amount of gwt for compensate
            await _marketing.connect(_user1).withdrawBalance(utils.parseEther("10"),utils.parseEther("0.1"),1)
            
            await calcCompanyValue(_busd,_bpnm,_marketing)
            
            //should be deposited 10 - 5% for matching, - 0.1 compensated by GWT, so total 10 - 0.5 - 0.4 = 9.1
            usdtBalanceAfter2 = await _busd.balanceOf(user1)
            console.log("U1 USDT contract bal= %s USDT", utils.formatEther(usdtBalanceAfter2))
            // expect(usdtBalanceAfter).to.equal(utils.parseEther("18.6"));//9.5 + 9.1
            expect(_bigIntToFixedFloat(usdtBalanceAfter2)).to.be.equal((9.5+9+u1NftDiscount+0.10).toFixed(3))//first withdraw deposit 9.5, next deposit 9 minus fees + 0.1 compensated with GWT and else compensated with NFT
            
            
            gwtBalanceAfter2 = await _gwt.balanceOf(user1)
            console.log("U1 GWT bal= %s GWT", utils.formatEther(gwtBalanceAfter2))
            // expect(gwtBalanceAfter).to.equal(utils.parseEther("5.4"));
            
            //mint more nft. Test that NFT compensate all fee and do not use GWT
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()
            
            //withdraw 10 usdt, allow gwt compensate though all should be compensated with NFT
            await _marketing.connect(_user1).withdrawBalance(utils.parseEther("10"),utils.parseEther("2"),1)
            console.log("\n==Make Withdraw #3==\n")
            
            gwtBalanceAfter3 = await _gwt.balanceOf(user1)
            console.log("U1 GWT bal= %s GWT", utils.formatEther(gwtBalanceAfter3))
            expect(gwtBalanceAfter3).to.be.equal(gwtBalanceAfter2)//gwt not used

            //
            usdtBalanceAfter3 = await _busd.balanceOf(user1)
            console.log("U1 USDT contract bal= %s USDT", utils.formatEther(usdtBalanceAfter3))
            
            expect(Number(utils.formatEther(usdtBalanceAfter3))).to.be.equal(Number(utils.formatEther(usdtBalanceAfter2))+9.5)//got max withdraw with only 5% fee

        });

        //discount granted
        //not exceed 10%
        //returned to internal balance
        //liquidity compensate correctly
        it("NFT discount for limit pack purchase", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);

            //deposit user to purchase limit packs for 2000 USDT
            const transfer_weiValue = utils.parseEther("100000");
            await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
    
            // increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("100000"))
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("100000"));    
            await _marketing.connect(_user1).buyLimitPack(10);    
            await _marketing.connect(_user1).buyLimitPack(10);    
            await _marketing.connect(_user1).buyLimitPack(10);    
            await _marketing.connect(_user1).buyLimitPack(10);    
            await _marketing.connect(_user1).buyLimitPack(11);    
            
            
            //mint 4 nft to user with bpnm contract
            await _marketing.connect(_user1).mintNFT()            
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()

            discountSetting = await _marketing.nftDiscountForLimitPackPrice()

            //get u1 tokens rarity
            let u1TotalRarity = await _nft.getAddressTotalRarityLevel(_user1.address);
            console.log("U1 rarity= %s", Number(u1TotalRarity))

            await calcCompanyValue(_busd,_bpnm,_marketing)

            userdata = await _marketing.Users(user1)
            console.log("U1 bal= %s USDT", utils.formatEther(userdata.balance.usdt))
            // expect(userdata.balance.usdt).to.equal(utils.parseEther("21"));
            
            //check gwt balance. Bought pack for 10+2000 so 60% = 1206 GWT
            gwtBalance = await _gwt.balanceOf(user1)
            console.log("U1 bal= %s GWT", utils.formatEther(gwtBalance))

            const u1NftDiscount = (4*1200 - Number(u1TotalRarity)) / 1000000 * Number(discountSetting)
            console.log("🚀 ~ file: bpnm_tests.js:2640 ~ u1NftDiscount:", u1NftDiscount)
            let discountAmount = 10000*u1NftDiscount
            console.log("🚀 ~ file: bpnm_tests.js:2642 ~ discountAmount:", discountAmount)

            //buy lmit pack. Discount should be assigned
            await _marketing.connect(_user1).buyLimitPack(12)
            console.log("\n==Purchase pack #12==\n")
            
            await calcCompanyValue(_busd,_bpnm,_marketing)
            
            //check internal balance
            userdata = await _marketing.Users(user1)
            console.log("U1 bal= %s USDT", utils.formatEther(userdata.balance.usdt))
            expect(_bigIntToFixedFloat(userdata.balance.usdt)).to.equal((100000-8000-5000-10000+discountAmount).toFixed(3));//Deposit 100000, 4x2000 +5000 limit pack purchase, nftdiscount returned to balance
            
            console.log("\n==Purchase pack #12==\n")
            
            console.log("\n==Mint new NFTs==\n")
            //mint additional nft
            for (let i = 1; i<=16; i++) {
                await _marketing.connect(_user1).mintNFT()            
            }
            
            //get u1 tokens rarity
            u1TotalRarity = await _nft.getAddressTotalRarityLevel(_user1.address);
            console.log("U1 rarity= %s", Number(u1TotalRarity))
            
            
            //buy pack to get discount
            await _marketing.connect(_user1).buyLimitPack(12);    
            
            await calcCompanyValue(_busd,_bpnm,_marketing)
            
            userdata = await _marketing.Users(user1)
            console.log("U1 bal= %s USDT", utils.formatEther(userdata.balance.usdt))
            expect(_bigIntToFixedFloat(userdata.balance.usdt)).to.equal((100000-8000-5000-10000-10000+discountAmount+1000).toFixed(3));//Deposit 100000, 3x10000 limit pack purchase, nftdiscount returned for second pack, 10% of cost returned for last pack = 1000
            

        });

        //discount granted
        //max discount checked
        it("NFT discount for matching purchase", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);

            //deposit user to purchase limit packs for 2000 USDT
            const transfer_weiValue = utils.parseEther("100000");
            await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
    
            // increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("100000"))
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("90000"));    
            await _marketing.connect(_user1).buyLimitPack(10);    //4tokens   
            await _marketing.connect(_user1).buyLimitPack(10);    //4tokens
            await _marketing.connect(_user1).buyLimitPack(10);    //4tokens
            await _marketing.connect(_user1).buyLimitPack(10);    //4tokens
            
            
            
            //mint 3 nft to user with bpnm contract
            await _marketing.connect(_user1).mintNFT()            
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()

            discountSetting = await _marketing.nftDiscountForMatchingPayment()

            //get u1 tokens rarity
            let u1TotalRarity = await _nft.getAddressTotalRarityLevel(_user1.address);
            console.log("U1 rarity= %s", Number(u1TotalRarity))

            userdata = await _marketing.Users(user1)
            console.log("U1 bal= %s USDT", utils.formatEther(userdata.balance.usdt))
            // expect(userdata.balance.usdt).to.equal(utils.parseEther("21"));
            
            
            gwtBalance = await _gwt.balanceOf(user1)
            console.log("U1 bal= %s GWT", utils.formatEther(gwtBalance))
            
            const u1NftDiscount = (4*1200 - Number(u1TotalRarity)) / 1000000 * Number(discountSetting)
            const discountAmount = 200*u1NftDiscount

            console.log("\n==Matching payment 200 GWT==\n")
            //pay for matching
            await _marketing.connect(_user1).extendMatchingBonus()
            
            // await calcCompanyValue(_busd,_marketing,_marketing)
            
            //check internal balance
            userdata = await _marketing.Users(user1)
            console.log("U1 bal= %s USDT", utils.formatEther(userdata.balance.usdt))
            
            gwtBalance = await _gwt.balanceOf(user1)
            console.log("U1 bal= %s GWT", utils.formatEther(gwtBalance))
            expect(_bigIntToFixedFloat(gwtBalance)).to.equal((3204-200+discountAmount).toFixed(3));//Deposit 100000, 2x10000 limit pack purchase, nftdiscount returned to balance
            
            
            console.log("\n==Mint new NFTs==\n")
            //buy one more pack to mint more nft to get max discount
            await _marketing.connect(_user1).buyLimitPack(11);    //5tokens
            await _marketing.connect(_user1).buyLimitPack(11);    //5tokens
            await _marketing.connect(_user1).buyLimitPack(12);    //5tokens
            await _marketing.connect(_user1).buyLimitPack(12);    //5tokens
            
            
            //mint additional nft
            for (let i = 1; i<=32; i++) {
                await _marketing.connect(_user1).mintNFT()            
            }
            
            //get u1 tokens rarity
            u1TotalRarity = await _nft.getAddressTotalRarityLevel(_user1.address);
            console.log("U1 rarity= %s", Number(u1TotalRarity))
            
            //increase amount of discount for matching payment
            await _marketing.setNftDiscountForMatchingPayment(20)
            
            console.log("\n==Matching payment 200 GWT==\n")
            //pay for matching
            await _marketing.connect(_user1).extendMatchingBonus()
            
            discountSetting = await _marketing.nftDiscountForMatchingPayment()
            const u1NftDiscount2 = (36*1200 - Number(u1TotalRarity)) / 1000000 * Number(discountSetting)
            console.log("🚀 ~ file: bpnm_tests.js:2766 ~ u1NftDiscount2:", u1NftDiscount2)
            const discountAmount2 = 200*u1NftDiscount2
            console.log("🚀 ~ file: bpnm_tests.js:2767 ~ discountAmount2:", discountAmount2)
            

            
            
            // await calcCompanyValue(_busd,_bpnm,_marketing)
            
            gwtBalance = await _gwt.balanceOf(user1)
            console.log("U1 bal= %s GWT", utils.formatEther(gwtBalance))
            //check that max discount of 30% returned
            expect(_bigIntToFixedFloat(gwtBalance)).to.equal((3204+4000+8000-200+discountAmount-200+60).toFixed(3));//from packs,  - 2x200 payment plus discounts plus max discount
            
            
            
        });

        //not more than 5 tokens for pack 2500+
        //discount applied
        //max 10% correct
        it("NFT discount for +1% to marketing level purchase", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);

            //deposit user to purchase limit packs for 2000 USDT
            const transfer_weiValue = utils.parseEther("100000");
            await _busd.connect(_busd_owner).transfer(user1,transfer_weiValue)
    
            // increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("100000"))
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("30000"));    
            await _marketing.connect(_user1).buyLimitPack(10);    //4tokens
            await _marketing.connect(_user1).buyLimitPack(10);    //4tokens
            await _marketing.connect(_user1).buyLimitPack(10);    //4tokens
            await _marketing.connect(_user1).buyLimitPack(10);    //4tokens
            
            const u1MintTokens = await _marketing.MintTokenBalance(user1)
            expect(Number(u1MintTokens)).to.equal(16);

            //mint 3 nft to user with bpnm contract
            await _marketing.connect(_user1).mintNFT()            
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()
            await _marketing.connect(_user1).mintNFT()

            discountSetting = await _marketing.nftDiscountForAdditionalMarketingPercent()

            //get u1 tokens rarity
            let u1TotalRarity = await _nft.getAddressTotalRarityLevel(_user1.address);
            console.log("U1 rarity= %s", Number(u1TotalRarity))

            userdata = await _marketing.Users(user1)
            console.log("U1 bal= %s USDT", utils.formatEther(userdata.balance.usdt))
            // expect(userdata.balance.usdt).to.equal(utils.parseEther("21"));
            
            //check gwt balance. Bought pack for 10000 so 60% = 6000 GWT
            gwtBalance = await _gwt.balanceOf(user1)
            console.log("U1 bal= %s GWT", utils.formatEther(gwtBalance))
            
            const u1NftDiscount = (4*1200 - Number(u1TotalRarity)) / 1000000 * Number(discountSetting)
            let discountAmount = 100*u1NftDiscount

            console.log("\n==Lvl 4 payment 100 GWT==\n")//10, 25, 500, 1000
            
            //pay for matching
            await _marketing.connect(_user1).extendLvlMarketingBonus()
            
            // await calcCompanyValue(_busd,_bpnm,_marketing)
            
            //check internal balance
            userdata = await _marketing.Users(user1)
            console.log("U1 bal= %s USDT", utils.formatEther(userdata.balance.usdt))
            
            gwtBalance = await _gwt.balanceOf(user1)
            console.log("U1 bal= %s GWT", utils.formatEther(gwtBalance))
            expect(_bigIntToFixedFloat(gwtBalance)).to.equal((3204-100+discountAmount).toFixed(3));//3204 for packs, 100 payment, discount returned
            
            
            console.log("\n==Mint new NFTs==\n")
            await _marketing.connect(_user1).buyLimitPack(12);    //5tokens
            await _marketing.connect(_user1).buyLimitPack(12);    //5tokens

            //mint additional nft
            for (let i = 1; i<=22; i++) {
                await _marketing.connect(_user1).mintNFT()            
            }
            
            //get u1 tokens rarity
            u1TotalRarity = await _nft.getAddressTotalRarityLevel(_user1.address);
            console.log("U1 rarity= %s", Number(u1TotalRarity))
            
            //increase amount of discount for matching payment
            await _marketing.setNftDiscountForMatchingPayment(20)
            
            console.log("\n==Lvl 5 payment 250 GWT==\n")//10, 25, 500, 1000
            //pay for matching
            await _marketing.connect(_user1).extendLvlMarketingBonus()
            
            
            
            
            // await calcCompanyValue(_busd,_bpnm,_marketing)
            
            gwtBalance = await _gwt.balanceOf(user1)
            console.log("U1 bal= %s GWT", utils.formatEther(gwtBalance))
            expect(_bigIntToFixedFloat(gwtBalance)).to.equal((3204+8000-100+discountAmount-250+25).toFixed(3));//11604 from packs, 100 and 250 payment plus discounts
            
            
            
        });

        it("Reverts tests", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);

            await expect(_nft.connect(_user1).mintNFT(user1) ).to.be.revertedWith("403");
            await expect(_nft.connect(_user1).claimNftGwtProfit(123)).to.be.revertedWithCustomError(_nft,'ERC721NonexistentToken');//claim from non exist nft
            await expect(_nft.connect(_user1).returnAllowedContract(user1)).to.be.revertedWithCustomError(_nft,'OwnableUnauthorizedAccount');
            
            let tokenIds = [10001,10002]; // Replace with your actual token IDs
            let rarityLevels = [1]; // Replace with your actual rarity levels
            await expect(_nft.setBatchRarityLevels(tokenIds,rarityLevels)).to.be.revertedWith("Input arrays must have the same length");
            
            tokenIds = [10000]; // Replace with your actual token IDs
            rarityLevels = [1]; // Replace with your actual rarity levels
            await expect(_nft.setBatchRarityLevels(tokenIds,rarityLevels)).to.be.revertedWith("Rarity already set");
            
            tokenIds = [10001]; // Replace with your actual token IDs
            rarityLevels = [1201]; // Replace with your actual rarity levels
            await expect(_nft.setBatchRarityLevels(tokenIds,rarityLevels)).to.be.revertedWith("Rarity < upperRarityBound");
            
            await expect(_nft.connect(_user1).setBatchRarityLevels(tokenIds,rarityLevels)).to.be.revertedWithCustomError(_nft,'OwnableUnauthorizedAccount');

            
        });

        //first 20 tokens pre-minted
        
        it("First 20 tokens pre-minted", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            
            await _nft.mintFirstTwenty(user1)

            let totalDistributedTokens = await _marketing.nftMintTokenDistributedAmount()
            console.log('Distributed mint tokens=',Number(totalDistributedTokens))
            expect(Number(totalDistributedTokens)).to.equal(20)

            let u1Balance = await _nft.balanceOf(user1);
            console.log('U1 NFT tokens balance=',Number(u1Balance))
            expect(Number(u1Balance)).to.equal(20)

            let u1Tokens = await _nft.getTokensByOwner(_user1.address);//user owned token IDs
            let t1Rarity = await _nft.getTokenRarityLevel(Number(u1Tokens[0]))
            let t10Rarity = await _nft.getTokenRarityLevel(Number(u1Tokens[9]))
            let t20Rarity = await _nft.getTokenRarityLevel(Number(u1Tokens[19]))
            
            t1RealRarity = await _nft.getTokenRarityLevel(1)
            t10RealRarity = await _nft.getTokenRarityLevel(10)
            t20RealRarity = await _nft.getTokenRarityLevel(20)

            
            expect(Number(t1Rarity)).to.equal(Number(t1RealRarity))
            expect(Number(t10Rarity)).to.equal(Number(t10RealRarity))
            expect(Number(t20Rarity)).to.equal(Number(t20RealRarity))
            
            let u1TotalRarity = await _nft.getAddressTotalRarityLevel(_user1.address);
            let nftTotalRarity = await _nft.releasedRarity();
            expect(Number(u1TotalRarity)).to.equal(Number(nftTotalRarity))


            
            await expect(_nft.connect(_user1).mintFirstTwenty(user1)).to.be.revertedWithCustomError(_nft,'OwnableUnauthorizedAccount');

            
            
        });



    });
           
    describe("==12) Marketplace tests", function () {
        if (!enable_test[12]) {
            return(0)
        }

        //totalItems counter increased
        //item attributes set correctly
        it("Item add", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            
            
            totalItems = await _bpnm.totalMarketplaceItems()
            
            await _bpnm.addItemToMarketplace("Test item","http://test.com",utils.parseEther("10"),false,false,_user1.address)
            
            //items amount increased
            totalItems = await _bpnm.totalMarketplaceItems()
            expect(Number(totalItems)).to.equal(1);
            
            
            
            firstItem = await _bpnm.Marketplace(1)
            expect(firstItem.name).to.equal("Test item");
            expect(firstItem.claimLink).to.equal("http://test.com");
            expect(firstItem.bpnmPrice).to.equal(utils.parseEther("10"));
            expect(firstItem.sellerAddress).to.equal(_user1.address);

            await expect(_bpnm.addItemToMarketplace("Test item","http://test.com",utils.parseEther("0"),false,false,_user1.address)).to.be.revertedWith("[bPNM] Non zero price required");


        });

        it("Item can be enabled/disabled. Verify enabled/disabled", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            
            
            await _bpnm.addItemToMarketplace("Test item","http://test.com",utils.parseEther("10"),false,false,_user1.address)
            
            //items amount increased
            totalItems = await _bpnm.totalMarketplaceItems()
            expect(Number(totalItems)).to.equal(1);
            
            firstItem = await _bpnm.Marketplace(1)
            expect(firstItem.isActive).to.equal(false);
            
            //enable item
            await _bpnm.triggerMarketItemActive(1)
            
            firstItem = await _bpnm.Marketplace(1)
            expect(firstItem.isActive).to.equal(true);
            
            //disable item
            await _bpnm.triggerMarketItemActive(1)
            
            firstItem = await _bpnm.Marketplace(1)
            expect(firstItem.isActive).to.equal(false);
            
            //enable item verify
            await _bpnm.triggerMarketItemVerify(1)
            
            firstItem = await _bpnm.Marketplace(1)
            expect(firstItem.isVerifyRequired).to.equal(true);
            
            //disable item  verify
            await _bpnm.triggerMarketItemVerify(1)
            
            firstItem = await _bpnm.Marketplace(1)
            expect(firstItem.isVerifyRequired).to.equal(false);
            
            


        });

        //bPNM price not affected
        //pld increased
        //btcb transferred to product selle
        //product assigned to user
        //product not selled if not ctivated
        //bpnm of buyer decreased
        //only one purchase allowed
        //enough bpnm balance checked
        it("Purchase item with liquidity compensation", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit 0.0002 btcb
            await depositBTCB(_btcb, _owner.address, "0.0002")
            //increase allowance
            await _btcb.connect(_owner).increaseAllowance(_bpnm.address,utils.parseEther("0.0002"))
            await _btcbCollector.disablePrestart();//should be called before bPNM disable prestart so token price would not be increased on first bPNM buy
            await _bpnm.disablePrestartMode();
            
            //one more pack to get buy limit
            await depositUSDT(_busd, _user1.address, "10")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("10"))
            //despoit 1000 usdt
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("10"))
            //purchase pack
            await _marketing.connect(_user1).buyLimitPack(1)


            //deposit with 10 usdt
            await depositUSDT(_busd, _user1.address, "10")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("10"))
            
            //deposit 1 btcb
            
            await depositBTCB(_btcb, _user1.address, "0.1")
            //increase allowance
            await _btcb.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("0.1"))
            
            
            console.log("totalSupply bPNM=", await _bpnm.totalSupply())
            console.log("price bPNM=", await _bpnm.bpnmPrice())
            
            //add market item
            await _bpnm.addItemToMarketplace("Test item","http://test.com",utils.parseEther("1"),false,true,_user2.address)

            
            //enable item
            await _bpnm.triggerMarketItemActive(1)
            
            //test when not enough balance
            await expect(_bpnm.connect(_user1).purchaseMarketplaceItem(1)).to.be.revertedWith("[bPNM] Not enough bPNM balance");

            //disable item
            await _bpnm.triggerMarketItemActive(1)

            
            //try to buy bpnm
            data = await _bpnm.connect(_user1).buyBpnm(utils.parseEther("0.001"))
            
            //bpNM btcb balance increased
            bpnmBtcbBal = await _btcb.balanceOf(_bpnm.address)
            expect(bpnmBtcbBal).to.equal(utils.parseEther("0.00105"))//0.0002 + (0.001 - 15%) = 0.0002+0.00085 = 0.00105
            
            //pld balance
            pldBtcbBal = await _btcb.balanceOf(_btcbCollector.address)
            expect(pldBtcbBal).to.equal(utils.parseEther("0.00015"))//fee is 15% of 0.001 * 0.15 = 0.00015
            
            //bpnm deposited
            userbpnmBalance = await _bpnm.balanceOf(user1)
            console.log("U1 bPNM bal= %s BPNM", utils.formatEther(userbpnmBalance))
            expect(userbpnmBalance).to.equal(utils.parseEther("4.25"))//0.00085/0.0002 = 4.25 bPNM
                        
            
            firstItem = await _bpnm.Marketplace(1)
            // console.log("🚀 ~ file: bpnm_tests.js:1063 ~ firstItem:", firstItem)
            
            //test not active item purchase
            await expect(_bpnm.connect(_user1).purchaseMarketplaceItem(1)).to.be.revertedWith("[bPNM] Item is not active");
            await expect(_bpnm.connect(_user2).purchaseMarketplaceItem(1)).to.be.revertedWith("[bPNM] Buy limit pack first");
            
            //enable item
            await _bpnm.triggerMarketItemActive(1)
            
            isProductOwned = await _bpnm.isMarketplaceItemOwnedBy(1,user1)
            console.log("🚀 ~ file: bpnm_tests.js:1070 ~ isProductOwned:", isProductOwned)
            expect(isProductOwned).to.equal(false)
            
            //product owner have 0 BTCB balance
            productOwnerBtcbBalance = await _btcb.balanceOf(user2)
            expect(productOwnerBtcbBalance).to.equal(utils.parseEther("0"))
            
            bpnmPrice = await _bpnm.bpnmPrice()
            console.log("🚀 ~ file: bpnm_tests.js:1100 ~ bpnmPrice:", bpnmPrice)
            expect(bpnmPrice).to.equal(utils.parseEther("0.0002"))
            
            //purchase item
            await _bpnm.connect(_user1).purchaseMarketplaceItem(1)
            
            //only one purchased is allowed
            await expect(_bpnm.connect(_user1).purchaseMarketplaceItem(1)).to.be.revertedWith("[bPNM] Already owned");
            
            
            userbpnmBalance = await _bpnm.balanceOf(user1)
            console.log("U1 bPNM bal= %s BPNM", utils.formatEther(userbpnmBalance))
            expect(userbpnmBalance).to.equal(utils.parseEther("3.25"))//4.25 - 1 = 3.25
            
            userItems = await _bpnm.ownedMarketplaceItemsOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:1066 ~ userItems:", userItems)
            
            isProductOwned = await _bpnm.isMarketplaceItemOwnedBy(1,user1)
            console.log("🚀 ~ file: bpnm_tests.js:1070 ~ isProductOwned:", isProductOwned)
            expect(isProductOwned).to.equal(true)
            
            //product owner compensated with  0.0002 btcb - 5%
            productOwnerBtcbBalance = await _btcb.balanceOf(user2)
            expect(productOwnerBtcbBalance).to.equal(utils.parseEther("0.00019"))//0.0002 -5% fee = 0.00019
            
            //bpnm price not affected
            bpnmPrice = await _bpnm.bpnmPrice()
            console.log("🚀 ~ file: bpnm_tests.js:1100 ~ bpnmPrice:", bpnmPrice)
            expect(bpnmPrice).to.equal(utils.parseEther("0.0002"))
            
            //bpNM btcb balance decreased
            bpnmBtcbBal = await _btcb.balanceOf(_bpnm.address)
            expect(bpnmBtcbBal).to.equal(utils.parseEther("0.00085"))//0.00105 - 0.0002 = 0.00085
            
            //pld balance
            pldBtcbBal = await _btcb.balanceOf(_btcbCollector.address)
            expect(pldBtcbBal).to.equal(utils.parseEther("0.00016"))//fee is 5% of 0.0002 * 0.5 + 0.00015 = 0.00016
            

            
            
        });
        
        //item cost in btcb 100% goes to PLD
        it("Purchase item NO liquidity compensation", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit 0.0002 btcb
            await depositBTCB(_btcb, _owner.address, "0.0002")
            //increase allowance
            await _btcb.connect(_owner).increaseAllowance(_bpnm.address,utils.parseEther("0.0002"))
            await _btcbCollector.disablePrestart();//should be called before bPNM disable prestart so token price would not be increased on first bPNM buy
            await _bpnm.disablePrestartMode();
            
            //one more pack to get buy limit
            await depositUSDT(_busd, _user1.address, "10")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("10"))
            //despoit 1000 usdt
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("10"))
            //purchase pack
            await _marketing.connect(_user1).buyLimitPack(1)

            //deposit with 10 usdt
            await depositUSDT(_busd, _user1.address, "10")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("10"))
            
            //deposit 1 btcb
            
            await depositBTCB(_btcb, _user1.address, "0.1")
            //increase allowance
            await _btcb.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("0.1"))
            
            
            console.log("totalSupply bPNM=", await _bpnm.totalSupply())
            console.log("price bPNM=", await _bpnm.bpnmPrice())
            
            //add market item
            await _bpnm.addItemToMarketplace("Test item","http://test.com",utils.parseEther("1"),false,false,_user2.address)

            
            //try to buy bpnm
            data = await _bpnm.connect(_user1).buyBpnm(utils.parseEther("0.001"))
            
            //bpNM btcb balance increased
            bpnmBtcbBal = await _btcb.balanceOf(_bpnm.address)
            expect(bpnmBtcbBal).to.equal(utils.parseEther("0.00105"))//0.0002 + (0.001 - 15%) = 0.0002+0.00085 = 0.00105
            
            //pld balance
            pldBtcbBal = await _btcb.balanceOf(_btcbCollector.address)
            expect(pldBtcbBal).to.equal(utils.parseEther("0.00015"))//fee is 15% of 0.001 * 0.15 = 0.00015
            
            //bpnm deposited
            userbpnmBalance = await _bpnm.balanceOf(user1)
            console.log("U1 bPNM bal= %s BPNM", utils.formatEther(userbpnmBalance))
            expect(userbpnmBalance).to.equal(utils.parseEther("4.25"))//0.00085/0.0002 = 4.25 bPNM
                        
            
            firstItem = await _bpnm.Marketplace(1)
            // console.log("🚀 ~ file: bpnm_tests.js:1063 ~ firstItem:", firstItem)
            
            
            //enable item
            await _bpnm.triggerMarketItemActive(1)
            
            isProductOwned = await _bpnm.isMarketplaceItemOwnedBy(1,user1)
            console.log("🚀 ~ file: bpnm_tests.js:1070 ~ isProductOwned:", isProductOwned)
            expect(isProductOwned).to.equal(false)
            
            //product owner have 0 BTCB balance
            productOwnerBtcbBalance = await _btcb.balanceOf(user2)
            expect(productOwnerBtcbBalance).to.equal(utils.parseEther("0"))
            
            bpnmPrice = await _bpnm.bpnmPrice()
            console.log("🚀 ~ file: bpnm_tests.js:1100 ~ bpnmPrice:", bpnmPrice)
            expect(bpnmPrice).to.equal(utils.parseEther("0.0002"))
            
            //purchase item
            await _bpnm.connect(_user1).purchaseMarketplaceItem(1)
                        
            
            userbpnmBalance = await _bpnm.balanceOf(user1)
            console.log("U1 bPNM bal= %s BPNM", utils.formatEther(userbpnmBalance))
            expect(userbpnmBalance).to.equal(utils.parseEther("3.25"))//4.25 - 1 = 3.25
            
            userItems = await _bpnm.ownedMarketplaceItemsOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:1066 ~ userItems:", userItems)
            
            isProductOwned = await _bpnm.isMarketplaceItemOwnedBy(1,user1)
            console.log("🚀 ~ file: bpnm_tests.js:1070 ~ isProductOwned:", isProductOwned)
            expect(isProductOwned).to.equal(true)
            
            //product owner not compensated
            productOwnerBtcbBalance = await _btcb.balanceOf(user2)
            expect(productOwnerBtcbBalance).to.equal(utils.parseEther("0"))
            
            //bpnm price not affected
            bpnmPrice = await _bpnm.bpnmPrice()
            console.log("🚀 ~ file: bpnm_tests.js:1100 ~ bpnmPrice:", bpnmPrice)
            expect(bpnmPrice).to.equal(utils.parseEther("0.0002"))
            
            //bpNM btcb balance decreased
            bpnmBtcbBal = await _btcb.balanceOf(_bpnm.address)
            expect(bpnmBtcbBal).to.equal(utils.parseEther("0.00085"))//0.00105 - 0.0002 = 0.00085
            
            //pld balance
            pldBtcbBal = await _btcb.balanceOf(_btcbCollector.address)
            expect(pldBtcbBal).to.equal(utils.parseEther("0.00035"))//bpnm price is 0.0002, 1 bpnm goes to PLD, 0.00015 + 0.0002 = 0.00035
            
            
            
        });
        
        //gifted correctly
        //own single item
        //only owner can gift
        it("Gift item to user", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            
            

            await _bpnm.addItemToMarketplace("Test item","http://test.com",utils.parseEther("10"),false,false,_user1.address)

            
            firstItem = await _bpnm.Marketplace(1)
            console.log("🚀 ~ file: bpnm_tests.js:1063 ~ firstItem:", firstItem)

            //revert if not active
            await expect(_bpnm.connect(_user1).giftMarketItemToAddress(1,user2)).to.be.revertedWith("[bPNM] Item is not active");
            
            //enable item
            await _bpnm.triggerMarketItemActive(1)
            
            isProductOwned = await _bpnm.isMarketplaceItemOwnedBy(1,user1)
            console.log("🚀 ~ file: bpnm_tests.js:1070 ~ isProductOwned:", isProductOwned)
            expect(isProductOwned).to.equal(false)//not owned
            
            //only owner can gift
            await expect(_bpnm.giftMarketItemToAddress(1,user1)).to.be.revertedWith("[bPNM] Only item owner can gift");

            //gift item to user
            await _bpnm.connect(_user1).giftMarketItemToAddress(1,user1)
            
            
            userItems = await _bpnm.ownedMarketplaceItemsOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:1066 ~ userItems:", userItems)
            
            isProductOwned = await _bpnm.isMarketplaceItemOwnedBy(1,user1)
            console.log("🚀 ~ file: bpnm_tests.js:1076 ~ isProductOwned:", isProductOwned)
            expect(isProductOwned).to.equal(true)//owned
            
            

            //can have single item
            await expect(_bpnm.connect(_user1).giftMarketItemToAddress(1,user1)).to.be.revertedWith("[bPNM] Already owned");
            await expect(_bpnm.connect(_user1).giftMarketItemToAddress(1,user2)).to.be.revertedWith("[bPNM] Receiver not exists");
            

            

            
        });

        //price updated by seller
        //item disabled by seller
        //seller cannot enable item
        it("Item seller update item", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            
            

            await _bpnm.addItemToMarketplace("Test item","http://test.com",utils.parseEther("10"),false,false,_user1.address)

            //enable item
            await _bpnm.triggerMarketItemActive(1)
            
            firstItem = await _bpnm.Marketplace(1)
            expect(firstItem.isActive).to.equal(true);
            
            //only seller can update price
            await expect(_bpnm.updateMarketItemPriceBySeller(1,utils.parseEther("5"))).to.be.revertedWith("[bPNM] Only item seller can update price");
            
            //update price            
            await _bpnm.connect(_user1).updateMarketItemPriceBySeller(1,utils.parseEther("5"))
            await expect(_bpnm.connect(_user1).updateMarketItemPriceBySeller(1,utils.parseEther("0"))).to.be.revertedWith("[bPNM] Non zero price required");
            
            firstItem = await _bpnm.Marketplace(1)
            expect(firstItem.bpnmPrice).to.equal(utils.parseEther("5"));
            
            //only seller can disable
            await expect(_bpnm.disableMarketItemActiveBySeller(1)).to.be.revertedWith("[bPNM] Only item seller can disable");
            
            //disable item
            await _bpnm.connect(_user1).disableMarketItemActiveBySeller(1)
            
            firstItem = await _bpnm.Marketplace(1)
            expect(firstItem.isActive).to.equal(false);
            
            //seller can not enable item
            await expect(_bpnm.connect(_user1).disableMarketItemActiveBySeller(1)).to.be.revertedWith("[bPNM] Not active item");

            

            
        });

        it("Market admin functions", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            
            
            await _bpnm.addItemToMarketplace("Test item","http://test.com",utils.parseEther("10"),false,false,_user1.address)
            
            //updateMarketItemPrice            
            await _bpnm.updateMarketItemPrice(1,utils.parseEther("5"))
            await _bpnm.updateMarketItemName(1,"Jimbo jumper")
            await _bpnm.updateMarketItemClaimLink(1,"http://newlink.com")
            
            firstItem = await _bpnm.Marketplace(1)
            expect(firstItem.bpnmPrice).to.equal(utils.parseEther("5"));
            expect(firstItem.name).to.equal("Jimbo jumper");
            expect(firstItem.claimLink).to.equal("http://newlink.com");
            
            
            //item should exist
            await expect(_bpnm.updateMarketItemPrice(2,utils.parseEther("5"))).to.be.revertedWith("[bPNM] Item not exist");
            
            //only market admin
            await expect(_bpnm.connect(_user1).updateMarketItemPrice(2,utils.parseEther("5"))).to.be.revertedWith("[bPNM] Need marketplaceAdministrator or higher");
            
            await expect(_bpnm.triggerMarketItemActive(2)).to.be.revertedWith("[bPNM] Item not exist");
            await expect(_bpnm.triggerMarketItemVerify(2)).to.be.revertedWith("[bPNM] Item not exist");
            await expect(_bpnm.updateMarketItemPrice(2, utils.parseEther("5"))).to.be.revertedWith("[bPNM] Item not exist");
            await expect(_bpnm.updateMarketItemName(2,"Item")).to.be.revertedWith("[bPNM] Item not exist");
            await expect(_bpnm.updateMarketItemClaimLink(2,"Link")).to.be.revertedWith("[bPNM] Item not exist");

            
            

            
        });



    });

    describe("==13) Admin funcs", function () {
        if (!enable_test[13]) {
            return(0)
        }

        
        it("setBuyLimitMultiplier", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "152")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("152"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("150"))
            
            userdata = await _bpnm.Users(user1)
            expect(userdata.buyLimitLeft).to.equal(utils.parseEther("0.0008"));//40/50000 = 0.0008
            
            
            await _marketing.setBuyLimitMultiplier(5)//should get 500% buy limit
            
            //buy 10 usdt limit pack
            await _marketing.connect(_user1).buyLimitPack(1)
            
            
            userdata = await _bpnm.Users(user1)
            expect(userdata.buyLimitLeft).to.equal(utils.parseEther("0.0018"));//40/50000 = 0.0008 + 50/50000 = 0.0018
            
            //check overlimits
            overlimits = await _bpnm.UserOverLimits(user1)
            expect(overlimits.totalBuyLimit).to.equal(utils.parseEther("0.0018"));//40/50000 = 0.0008 + 50/50000 = 0.0018
        
            await expect(_marketing.setBuyLimitMultiplier(0)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.setBuyLimitMultiplier(6)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.connect(_user1).setBuyLimitMultiplier(6)).to.be.revertedWith("[bPNM] Need promoter or higher");

            
            

        });

        it("setSellLimitMultiplier", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);

            //deposit 0.0002 btcb
            await depositBTCB(_btcb, _owner.address, "0.0002")
            //increase allowance
            await _btcb.connect(_owner).increaseAllowance(_bpnm.address,utils.parseEther("0.0002"))
            console.log(await _btcb.balanceOf(_owner.address));
            await _btcbCollector.disablePrestart();//should be called before bPNM disable prestart so token price would not be increased on first bPNM buy
            await _bpnm.disablePrestartMode();
            
            //deposit with 10 usdt
            await depositUSDT(_busd, _user1.address, "10")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("10"))
            
            //deposit 1 btcb
            
            await depositBTCB(_btcb, _user1.address, "0.1")
            //increase allowance
            await _btcb.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("0.1"))
            
            
            console.log("totalSupply bPNM=", await _bpnm.totalSupply())
            console.log("price bPNM=", await _bpnm.bpnmPrice())
            //try to buy bpnm
            data = await _bpnm.connect(_user1).buyBpnm(utils.parseEther("0.0004"))
            console.log("price bPNM=", await _bpnm.bpnmPrice())
            
            
            userdata2 = await _bpnm.Users(user1)
            expect(userdata2.sellLimitLeft).to.equal(utils.parseEther("0.0006"))
            
            
            await _bpnm.setSellLimitMultiplier(20)//should get 200% sell limit
            
            data = await _bpnm.connect(_user1).buyBpnm(utils.parseEther("0.0004"))
            
            userdata = await _bpnm.Users(user1)
            expect(userdata.sellLimitLeft).to.equal(utils.parseEther("0.0014"));//0.0004+0.0008
            //check overlimits
            overlimits = await _bpnm.UserOverLimits(user1)
            expect(overlimits.totalSellLimit).to.equal(utils.parseEther("0.0014"));//0.0004+0.0008
            
            await expect(_bpnm.setSellLimitMultiplier(9)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_bpnm.setSellLimitMultiplier(31)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_bpnm.connect(_user1).setSellLimitMultiplier(6)).to.be.revertedWith("[bPNM] Need promoter or higher");

            
            

        });

        it("setLimitPackPurchaseGwtCompensation", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "152")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("152"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("150"))
            
            
            gwtBalance = await _gwt.balanceOf(user1)
            expect(gwtBalance).to.equal(utils.parseEther("4"));//2x2
            
            
            await _marketing.setLimitPackPurchaseGwtCompensation(25)//should get 25% GWT (x2 on prestart so 50%)
            
            //buy 10 usdt limit pack
            await _marketing.connect(_user1).buyLimitPack(1)
            
            gwtBalance = await _gwt.balanceOf(user1)
            expect(gwtBalance).to.equal(utils.parseEther("9"));//2x2 + 2.5x2 = 9
                    
            await expect(_marketing.setLimitPackPurchaseGwtCompensation(9)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.setLimitPackPurchaseGwtCompensation(26)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.connect(_user1).setLimitPackPurchaseGwtCompensation(6)).to.be.revertedWith("[bPNM] Need promoter or higher");

            
            

        });

        it("setMatchingBonusGwtCost", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 500 + 2 usdt
            await depositUSDT(_busd, _user1.address, "502")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("502"))
            //despoit 500 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("500"))
            
            await _marketing.setMatchingBonusGwtCost(utils.parseEther("250"))
            
            //buy 10 usdt limit pack
            await _marketing.connect(_user1).buyLimitPack(8)
            
            // await expect(_marketing.connect(_user1).extendMatchingBonus()).not.to.be.reverted;
            await expect(_marketing.connect(_user1).extendMatchingBonus()).to.be.revertedWith("[bPNM] Not enough GWT to extend matching bonus");

                    
            await expect(_marketing.setMatchingBonusGwtCost(utils.parseEther("199"))).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.setMatchingBonusGwtCost(utils.parseEther("501"))).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.connect(_user1).setMatchingBonusGwtCost(6)).to.be.revertedWith("[bPNM] Need promoter or higher");

            
            

        });

        it("setMatchingBonusExtendPeriod", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 500 + 2 usdt
            await depositUSDT(_busd, _user1.address, "502")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("502"))
            //despoit 500 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("500"))
            
            await _marketing.setMatchingBonusExtendPeriod(40)
            await _marketing.connect(_user1).buyLimitPack(8)

            await _marketing.connect(_user1).extendMatchingBonus()

            const blockNum = await ethers.provider.getBlockNumber();
            const block = await ethers.provider.getBlock(blockNum);
            const timestamp = block.timestamp;
            
            
            userData = await _marketing.Users(user1)
            
            diff = Number(userData.matchingActiveUntil) - timestamp;
            
            expect(diff).to.be.equal(60*60*24*40);//difference should be 40 days
            

                    
            await expect(_marketing.setMatchingBonusExtendPeriod(utils.parseEther("29"))).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.setMatchingBonusExtendPeriod(utils.parseEther("46"))).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.connect(_user1).setMatchingBonusExtendPeriod(6)).to.be.revertedWith("[bPNM] Need promoter or higher");

        });

        it("setEarnLimitExtraPerGwt", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "152")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("152"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("150"))
            
            await _marketing.connect(_user1).buyLimitPack(5)
            
            userdata = await _marketing.Users(user1)
            expect(userdata.earnLimitLeft).to.equal(utils.parseEther("390"));//
            

            
            await _marketing.setEarnLimitExtraPerGwt(utils.parseEther("5"))//5 USDT of earn limit for 1 GWT
            
            //buy 5 USDT of earn limit
            await _marketing.connect(_user1).buyEarnLimitWithGwt(utils.parseEther("5"))
            
            
            userdata = await _marketing.Users(user1)
            expect(userdata.earnLimitLeft).to.equal(utils.parseEther("395"));//

            
            gwtBalance = await _gwt.balanceOf(user1)
            expect(gwtBalance).to.equal(utils.parseEther("63"));//4+60-1
        
            await expect(_marketing.setEarnLimitExtraPerGwt(utils.parseEther("1.99"))).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.setEarnLimitExtraPerGwt(utils.parseEther("5.01"))).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.connect(_user1).setEarnLimitExtraPerGwt(6)).to.be.revertedWith("[bPNM] Need promoter or higher");

            
            

        });

        it("setBuyLimitExtraPerGwt", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "152")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("150"))
            await _busd.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("2"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("150"))
            
            await _marketing.connect(_user1).buyLimitPack(5)
            
            userdata = await _bpnm.Users(user1)
            expect(userdata.buyLimitLeft).to.equal(utils.parseEther("0.0128"));//0.0008+0.012
            

            
            await _bpnm.setBuyLimitExtraPerGwt(utils.parseEther("10"))//10 USDT of buy limit for 1 GWT
            
            //buy 10 USDT of buy limit
            await _bpnm.connect(_user1).buyPurchaseLimit(utils.parseEther("10"))
            
            
            userdata = await _bpnm.Users(user1)
            expect(userdata.buyLimitLeft).to.equal(utils.parseEther("0.013"));//0.0128+0.0002

            
            gwtBalance = await _gwt.balanceOf(user1)
            expect(gwtBalance).to.equal(utils.parseEther("63"));//4+60-1
        
            await expect(_bpnm.setBuyLimitExtraPerGwt(utils.parseEther("4.99"))).to.be.revertedWith("[bPNM] Out of range");
            await expect(_bpnm.setBuyLimitExtraPerGwt(utils.parseEther("10.01"))).to.be.revertedWith("[bPNM] Out of range");
            await expect(_bpnm.connect(_user1).setBuyLimitExtraPerGwt(6)).to.be.revertedWith("[bPNM] Need promoter or higher");

            
            

        });

        it("setSellLimitExtraPerGwt", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);

            //deposit 0.0002 btcb
            await depositBTCB(_btcb, _owner.address, "0.0002")
            //increase allowance
            await _btcb.connect(_owner).increaseAllowance(_bpnm.address,utils.parseEther("0.0002"))
            console.log(await _btcb.balanceOf(_owner.address));
            await _btcbCollector.disablePrestart();//should be called before bPNM disable prestart so token price would not be increased on first bPNM buy
            await _bpnm.disablePrestartMode();
            
            //deposit with 10 usdt
            await depositUSDT(_busd, _user1.address, "10")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("10"))
            
            //deposit 1 btcb
            
            await depositBTCB(_btcb, _user1.address, "0.1")
            //increase allowance
            await _btcb.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("0.1"))
            
            
            console.log("totalSupply bPNM=", await _bpnm.totalSupply())
            console.log("price bPNM=", await _bpnm.bpnmPrice())
            //try to buy bpnm
            data = await _bpnm.connect(_user1).buyBpnm(utils.parseEther("0.0008"))
            console.log("price bPNM=", await _bpnm.bpnmPrice())
            
            
            userdata2 = await _bpnm.Users(user1)
            expect(userdata2.sellLimitLeft).to.equal(utils.parseEther("0.0012"))
            
            
            await _bpnm.setSellLimitExtraPerGwt(utils.parseEther("10"))//10 USDT of sell limit for 1 GWT
            

            data = await _bpnm.connect(_user1).buySellLimit(utils.parseEther("4"))
            
            userdata = await _bpnm.Users(user1)
            expect(userdata.sellLimitLeft).to.equal(utils.parseEther("0.00128"));//0.0012+0.00008
            
            gwtBalance = await _gwt.balanceOf(user1)
            expect(gwtBalance).to.equal(utils.parseEther("3.6"));//4-0.4

            
            await expect(_bpnm.setSellLimitExtraPerGwt(utils.parseEther("4.99"))).to.be.revertedWith("[bPNM] Out of range");
            await expect(_bpnm.setSellLimitExtraPerGwt(utils.parseEther("10.01"))).to.be.revertedWith("[bPNM] Out of range");
            await expect(_bpnm.connect(_user1).setSellLimitExtraPerGwt(6)).to.be.revertedWith("[bPNM] Need promoter or higher");
            
            

        });

        it("setWithdrawBaseFee", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "150")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("150"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("150"))
            
            
            
            userdata = await _marketing.Users(user1)
            expect(userdata.balance.usdt).to.equal(utils.parseEther("150"));//150 
            

            
            await _marketing.setWithdrawBaseFee(6)//5% matching +1% to liquidity
            
            //buy 10 USDT of buy limit
            await _marketing.connect(_user1).withdrawBalance(utils.parseEther("10"),0,1)
            
            
            userdata = await _marketing.Users(user1)
            expect(userdata.balance.usdt).to.equal(utils.parseEther("140"));//150 + 0.1 ref - 10


            await calcCompanyValue(_busd,_bpnm,_marketing)

            
            usdtBalance = await _busd.balanceOf(user1)
            expect(usdtBalance).to.equal(utils.parseEther("9.4"));//10-6%
        
            await expect(_marketing.setWithdrawBaseFee(5)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.setWithdrawBaseFee(11)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.connect(_user1).setWithdrawBaseFee(6)).to.be.revertedWith("[bPNM] Need promoter or higher");

            
            

        });

        it("setBpnmBuyFee", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);

            //deposit 0.0002 btcb
            await depositBTCB(_btcb, _owner.address, "0.0002")
            //increase allowance
            await _btcb.connect(_owner).increaseAllowance(_bpnm.address,utils.parseEther("0.0002"))
            console.log(await _btcb.balanceOf(_owner.address));
            await _btcbCollector.disablePrestart();//should be called before bPNM disable prestart so token price would not be increased on first bPNM buy
            await _bpnm.disablePrestartMode();
            
            //deposit with 10 usdt
            await depositUSDT(_busd, _user1.address, "10")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("10"))
            
            //deposit 1 btcb
            
            await depositBTCB(_btcb, _user1.address, "0.1")
            //increase allowance
            await _btcb.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("0.1"))
            
            
            console.log("totalSupply bPNM=", await _bpnm.totalSupply())
            console.log("price bPNM=", await _bpnm.bpnmPrice())
            
            await _bpnm.setBpnmBuyFee(0)//no fee
            
            //try to buy bpnm
            data = await _bpnm.connect(_user1).buyBpnm(utils.parseEther("0.0004"))
            console.log("price bPNM=", await _bpnm.bpnmPrice())
            
            
            userdata2 = await _bpnm.Users(user1)
            expect(userdata2.bpnmBalance).to.equal(utils.parseEther("2"))//price 0.0002, purchase 0.0004 so 2 bpnm
            
            
            await _bpnm.setBpnmBuyFee(20)//no fee
            
            data = await _bpnm.connect(_user1).buyBpnm(utils.parseEther("0.0004"))//
            
            userdata = await _bpnm.Users(user1)
            expect(userdata.bpnmBalance).to.equal(utils.parseEther("3.6"));//2+1.6

            
            
            await expect(_bpnm.setBpnmBuyFee(21)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_bpnm.connect(_user1).setBpnmBuyFee(6)).to.be.revertedWith("[bPNM] Need promoter or higher");

            
            

        });


        it("setBpnmSellFee", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);

            //deposit 0.0002 btcb
            await depositBTCB(_btcb, _owner.address, "0.0002")
            //increase allowance
            await _btcb.connect(_owner).increaseAllowance(_bpnm.address,utils.parseEther("0.0002"))
            console.log(await _btcb.balanceOf(_owner.address));
            await _btcbCollector.disablePrestart();//should be called before bPNM disable prestart so token price would not be increased on first bPNM buy
            await _bpnm.disablePrestartMode();
            
            //deposit with 10 usdt
            await depositUSDT(_busd, _user1.address, "10")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("10"))
            
            //deposit 1 btcb
            
            await depositBTCB(_btcb, _user1.address, "0.0004")
            //increase allowance
            await _btcb.connect(_user1).increaseAllowance(_bpnm.address,utils.parseEther("0.0004"))
            
            
            console.log("totalSupply bPNM=", await _bpnm.totalSupply())
            console.log("price bPNM=", await _bpnm.bpnmPrice())
            
            
            
            //try to buy bpnm
            data = await _bpnm.connect(_user1).buyBpnm(utils.parseEther("0.0004"))
            console.log("price bPNM=", await _bpnm.bpnmPrice())
            
            
            
            userdata2 = await _bpnm.Users(user1)
            expect(userdata2.bpnmBalance).to.equal(utils.parseEther("1.7"))//2-15%
            

            await _bpnm.setBpnmSellFee(0)//no fee
            
            //sell bpnm
            data = await _bpnm.connect(_user1).sellBpnm(utils.parseEther("1"))
            
            btcbBalance = await _btcb.balanceOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:3850 ~ btcbBalance:", btcbBalance)
            expect(btcbBalance).to.equal(utils.parseEther("0.0002"));//1 bpnm for 0.0002
            
            
            await _bpnm.setBpnmSellFee(10)//10%
            
            data = await _bpnm.connect(_user1).sellBpnm(utils.parseEther("0.5"))
            
            btcbBalance = await _btcb.balanceOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:3850 ~ btcbBalance:", btcbBalance)
            expect(btcbBalance).to.equal(utils.parseEther("0.00029"));//0.0002 + 0.0001-10%
            
            
            
            await expect(_bpnm.setBpnmSellFee(11)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_bpnm.connect(_user1).setBpnmSellFee(6)).to.be.revertedWith("[bPNM] Need promoter or higher");

            
            

        });

        it("setNftMintTokenMaxAmount", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);

            
            await _marketing.setNftMintTokenMaxAmount(4000)
            
            data = await _marketing.nftMintTokenMaxAmount()
            
            
            expect(Number(data)).to.equal(4000);
            
            
            
            await expect(_marketing.setNftMintTokenMaxAmount(2999)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.setNftMintTokenMaxAmount(10001)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.connect(_user1).setNftMintTokenMaxAmount(6)).to.be.revertedWith("[bPNM] Need promoter or higher");

            
            

        });

        it("setNftMintTokenTurnoverRequired", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "2000")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("2000"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("2000"))
            
            //increase to 1000 USDT for 1 mint token
            await _marketing.setNftMintTokenTurnoverRequired(utils.parseEther("1000"))
            
            await _marketing.connect(_user1).buyLimitPack(10)
            
            userdata = await _marketing.MintTokenBalance(user1)
            expect(Number(userdata)).to.equal(2);
            
        
            await expect(_marketing.setNftMintTokenTurnoverRequired(utils.parseEther("499"))).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.setNftMintTokenTurnoverRequired(utils.parseEther("5001"))).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.connect(_user1).setNftMintTokenTurnoverRequired(6)).to.be.revertedWith("[bPNM] Need promoter or higher");

        });

        it("setNftDiscountForLimitPackPrice", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "1500")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("1500"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("1500"))
            
            //buy pack to get nft token
            await _marketing.connect(_user1).buyLimitPack(8)
            userData = await _marketing.Users(user1)
            expect(userData.balance.usdt).to.equal(utils.parseEther("1000"));//1500-500
            
            //mint nft
            discountSetting = await _marketing.nftDiscountForLimitPackPrice()
            await _marketing.connect(_user1).mintNFT()            
            u1TotalRarity = await _nft.getAddressTotalRarityLevel(_user1.address);
            discount = (1200-Number(u1TotalRarity))*1e18/1000000*Number(discountSetting)
            console.log("🚀 ~ file: bpnm_tests.js:3936 ~ discount:", discount)
            newPackPrice = 500-500/1e18*discount
            console.log("🚀 ~ file: bpnm_tests.js:3938 ~ newPackPrice:", newPackPrice)
            
            //buy pack to get discount
            await _marketing.connect(_user1).buyLimitPack(8)
            userData = await _marketing.Users(user1)
            console.log("🚀 ~ file: bpnm_tests.js:3943 ~ userData:", userData.balance.usdt)
            expect(userData.balance.usdt).to.equal(utils.parseEther((1000-newPackPrice).toString()));//1000-500+discount
            
            //increase discount
            await _marketing.setNftDiscountForLimitPackPrice(20)
            
            discountSetting = await _marketing.nftDiscountForLimitPackPrice()
            discount = (1200-Number(u1TotalRarity))*1e18/1000000*Number(discountSetting)
            console.log("🚀 ~ file: bpnm_tests.js:3936 ~ discount:", discount)
            newPackPrice2 = 500-500/1e18*discount
            console.log("🚀 ~ file: bpnm_tests.js:3938 ~ newPackPrice2:", newPackPrice2)
            
            
            //buy pack to check increased discount
            await _marketing.connect(_user1).buyLimitPack(8)
            userData = await _marketing.Users(user1)
            console.log("🚀 ~ file: bpnm_tests.js:3943 ~ userData:", userData.balance.usdt)
            console.log(newPackPrice+newPackPrice2)
            expect(_bigIntToFixedFloat(userData.balance.usdt)).to.equal(((1000-(newPackPrice+newPackPrice2)).toFixed(3)));//1000-500+discount

            
            
        
            await expect(_marketing.setNftDiscountForLimitPackPrice(0)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.setNftDiscountForLimitPackPrice(21)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.connect(_user1).setNftDiscountForLimitPackPrice(6)).to.be.revertedWith("[bPNM] Need promoter or higher");

        });

        it("setNftDiscountForMatchingPayment", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "1504")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("1504"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("1500"))
            
            
            await _marketing.connect(_user1).buyLimitPack(9)
            userData = await _marketing.Users(user1)
            
            discountSetting = await _marketing.nftDiscountForMatchingPayment()
            await _marketing.connect(_user1).mintNFT()            
            u1TotalRarity = await _nft.getAddressTotalRarityLevel(_user1.address);
            discount = (1200-Number(u1TotalRarity))*1e18/1000000*Number(discountSetting)
            console.log("🚀 ~ file: bpnm_tests.js:3936 ~ discount:", discount)
            newMatchingPrice = 200-200/1e18*discount
            console.log("🚀 ~ file: bpnm_tests.js:3938 ~ newPackPrice:", newMatchingPrice)
            
            //buy matching
            await _marketing.connect(_user1).extendMatchingBonus()
            
            gwtBalance = await _gwt.balanceOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:3998 ~ gwtBalance:", gwtBalance)
            expect(_bigIntToFixedFloat(gwtBalance)).to.equal(((404-(newMatchingPrice)).toFixed(3)));//1000-500+discount
            
            
            //change discount
            await _marketing.setNftDiscountForMatchingPayment(20)
            //buy matching with new discount
            await _marketing.connect(_user1).extendMatchingBonus()
            
            discountSetting = await _marketing.nftDiscountForMatchingPayment()
            expect(Number(discountSetting)).to.be.equal(20)
            discount = (1200-Number(u1TotalRarity))*1e18/1000000*Number(discountSetting)
            console.log("🚀 ~ file: bpnm_tests.js:3936 ~ discount:", discount)
            newMatchingPrice2 = 200-200/1e18*discount
            
            gwtBalance = await _gwt.balanceOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:3998 ~ gwtBalance:", gwtBalance)
            expect(_bigIntToFixedFloat(gwtBalance)).to.equal(((404-(newMatchingPrice+newMatchingPrice2)).toFixed(3)));//1000-500+discount
            
        
            await expect(_marketing.setNftDiscountForMatchingPayment(0)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.setNftDiscountForMatchingPayment(21)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.connect(_user1).setNftDiscountForMatchingPayment(6)).to.be.revertedWith("[bPNM] Need promoter or higher");

        });

        it("setNftDiscountForAdditionalMarketingPercent", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "1504")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("1504"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("1500"))
            
            
            await _marketing.connect(_user1).buyLimitPack(9)
            userData = await _marketing.Users(user1)
            
            discountSetting = await _marketing.nftDiscountForAdditionalMarketingPercent()
            expect(Number(discountSetting)).to.be.equal(10)
            await _marketing.connect(_user1).mintNFT()            
            u1TotalRarity = await _nft.getAddressTotalRarityLevel(_user1.address);
            discount = (1200-Number(u1TotalRarity))*1e18/1000000*Number(discountSetting)
            console.log("🚀 ~ file: bpnm_tests.js:3936 ~ discount:", discount)
            newPlusOnePrice = 100-100/1e18*discount
            console.log("🚀 ~ file: bpnm_tests.js:3938 ~ newPackPrice:", newPlusOnePrice)
            
            //buy +1%
            await _marketing.connect(_user1).extendLvlMarketingBonus()
            
            gwtBalance = await _gwt.balanceOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:3998 ~ gwtBalance:", gwtBalance)
            expect(_bigIntToFixedFloat(gwtBalance)).to.equal(((404-(newPlusOnePrice)).toFixed(3)));
            
            
            //change discount
            await _marketing.setNftDiscountForAdditionalMarketingPercent(20)
            //buy +1% new discount
            await _marketing.connect(_user1).extendLvlMarketingBonus()
            
            discountSetting = await _marketing.nftDiscountForAdditionalMarketingPercent()
            expect(Number(discountSetting)).to.be.equal(20)
            discount = (1200-Number(u1TotalRarity))*1e18/1000000*Number(discountSetting)
            console.log("🚀 ~ file: bpnm_tests.js:3936 ~ discount:", discount)
            newPlusOnePrice2 = 250-250/1e18*discount
            
            gwtBalance = await _gwt.balanceOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:3998 ~ gwtBalance:", gwtBalance)
            expect(_bigIntToFixedFloat(gwtBalance)).to.equal(((404-(newPlusOnePrice+newPlusOnePrice2)).toFixed(3)));
            
        
            await expect(_marketing.setNftDiscountForAdditionalMarketingPercent(0)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.setNftDiscountForAdditionalMarketingPercent(21)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.connect(_user1).setNftDiscountForAdditionalMarketingPercent(6)).to.be.revertedWith("[bPNM] Need promoter or higher");

        });

        it("setNftDiscountForWithdraw", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "1500")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("1500"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("1500"))
            
            await _marketing.connect(_user1).buyLimitPack(8)


            discountSetting = await _marketing.nftDiscountForWithdraw()
            expect(Number(discountSetting)).to.be.equal(10)
    
            await _marketing.connect(_user1).mintNFT()            
    
            u1TotalRarity = await _nft.getAddressTotalRarityLevel(_user1.address);
            discount = (1200-Number(u1TotalRarity))*1e18/1000000*Number(discountSetting)
            console.log("🚀 ~ file: bpnm_tests.js:3936 ~ discount:", discount)
            withdrawCashback = 100/1e18*discount
            console.log("🚀 ~ withdrawCashback:", withdrawCashback)
            
            //withdraw 100 USDT
            await _marketing.connect(_user1).withdrawBalance(utils.parseEther("100"),0,1)
            
            usdtBalance = await _busd.balanceOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:3998 ~ usdtBalance:", usdtBalance)
            expect(_bigIntToFixedFloat(usdtBalance)).to.equal(((90+withdrawCashback).toFixed(3)));
            
            
            //change discount
            await _marketing.setNftDiscountForWithdraw(20)
            //new withdraw
            await _marketing.connect(_user1).withdrawBalance(utils.parseEther("100"),0,1)
            
            discountSetting = await _marketing.nftDiscountForWithdraw()
            expect(Number(discountSetting)).to.be.equal(20)
            discount = (1200-Number(u1TotalRarity))*1e18/1000000*Number(discountSetting)
            console.log("🚀 ~ file: bpnm_tests.js:3936 ~ discount:", discount)
            withdrawCashback2 = 100/1e18*discount
            
            usdtBalance = await _busd.balanceOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:3998 ~ usdtBalance:", usdtBalance)
            expect(_bigIntToFixedFloat(usdtBalance)).to.equal(((180+withdrawCashback+withdrawCashback2).toFixed(3)));
            
        
            await expect(_marketing.setNftDiscountForWithdraw(0)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.setNftDiscountForWithdraw(21)).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.connect(_user1).setNftDiscountForWithdraw(6)).to.be.revertedWith("[bPNM] Need promoter or higher");

        });

        it("setgwtTransFeeLiquidity", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "1504")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("1504"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("1500"))
            
            await _marketing.connect(_user1).buyLimitPack(8)

            

            feeSetting = await _marketing.gwtTransFeeLiquidity()
            expect(feeSetting).to.be.equal(utils.parseEther("1"))
            
            
            
            //buy earn limit, uses GWT fee
            await _marketing.connect(_user1).buyEarnLimitWithGwt(utils.parseEther("10"))
            
            usdtBalance = await _busd.balanceOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:3998 ~ gwtBalance:", usdtBalance)
            expect(utils.formatEther(usdtBalance)).to.equal("2.0");
            
            
            //change discount
            await _marketing.setgwtTransFeeLiquidity(utils.parseEther("0"))
            
            feeSetting = await _marketing.gwtTransFeeLiquidity()
            expect(feeSetting).to.be.equal(utils.parseEther("0"))
            
            
            //buy earn limit, uses GWT fee
            await _marketing.connect(_user1).buyEarnLimitWithGwt(utils.parseEther("10"))
            
            usdtBalance = await _busd.balanceOf(user1)
            console.log("🚀 ~ file: bpnm_tests.js:3998 ~ gwtBalance:", usdtBalance)
            expect(utils.formatEther(usdtBalance)).to.equal("1.0");
            
            
        
            await expect(_marketing.setgwtTransFeeLiquidity(utils.parseEther("2.01"))).to.be.revertedWith("[bPNM] Out of range");
            await expect(_marketing.connect(_user1).setgwtTransFeeLiquidity(6)).to.be.revertedWith("[bPNM] Need promoter or higher");

        });

        it("changeFeeCollector", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "1504")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("1504"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("1500"))
            
            
            //change fee collector
            await _marketing.changeFeeCollector(user19)
            
            await _marketing.connect(_user1).buyLimitPack(1)
            
            //new collector should get fee
            usdtBalance = await _busd.balanceOf(user19)
            console.log("🚀 ~ file: bpnm_tests.js:3998 ~ gwtBalance:", usdtBalance)
            expect(utils.formatEther(usdtBalance)).to.equal("2.0");
            
            
            
            
        
            await expect(_marketing.changeFeeCollector(constants.AddressZero)).to.be.revertedWith("[bPNM] Non zero address");
            await expect(_marketing.connect(_user1).changeFeeCollector(user19)).to.be.revertedWith("Ownable: caller is not the owner");

        });

        it("changeLiquidityCollector", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "1504")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("1504"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("1500"))
            
            
            //change fee collector
            await _marketing.changeLiquidityCollector(user19)
            
            await _marketing.connect(_user1).buyLimitPack(1)
            
            //new collector should get fee
            usdtBalance = await _busd.balanceOf(user19)
            console.log("🚀 ~ file: bpnm_tests.js:3998 ~ gwtBalance:", usdtBalance)
            expect(utils.formatEther(usdtBalance)).to.equal("8.0");
            
            
            
            
        
            await expect(_marketing.changeLiquidityCollector(constants.AddressZero)).to.be.revertedWith("[bPNM] Non zero address");
            await expect(_marketing.connect(_user1).changeLiquidityCollector(user19)).to.be.revertedWith("Ownable: caller is not the owner");

        });

        it("changePromoter", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "1504")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("1504"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("1500"))
            
            
            await expect(_marketing.connect(_user1).setNftDiscountForWithdraw(1)).to.be.revertedWith("[bPNM] Need promoter or higher");

            //change promoter to user1
            await _marketing.changePromoter(user1)
            
            await expect(_marketing.connect(_user1).setNftDiscountForWithdraw(1)).not.to.be.reverted;

            //new collector should get fee
            newSetting = await _marketing.nftDiscountForWithdraw()
            expect(Number(newSetting)).to.equal(1);
            
            
            
            
        
            await expect(_marketing.changePromoter(constants.AddressZero)).to.be.revertedWith("[bPNM] Non zero address");
            await expect(_marketing.connect(_user1).changePromoter(user19)).to.be.revertedWith("Ownable: caller is not the owner");
        });
        
        it("changeVerificator", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "1504")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("1504"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("1500"))
            
            
            await expect(_bpnm.connect(_user1).addressVerify(user19)).to.be.revertedWith("[bPNM] Verificator role needed");

            //change verificator to user1
            await _bpnm.changeVerificator(user1)
            
            await expect(_bpnm.connect(_user1).addressVerify(user19)).not.to.be.reverted;

            //new user verified
            newSetting = await _bpnm.IsVerified(user19)
            expect(newSetting).to.equal(true);
            
            
            
            
        
            await expect(_bpnm.changeVerificator(constants.AddressZero)).to.be.revertedWith("[bPNM] Non zero address");
            await expect(_bpnm.connect(_user1).changeVerificator(user19)).to.be.revertedWith("Ownable: caller is not the owner");

        });

        it("changeMarketplaceAdministrator", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "1504")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("1504"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("1500"))
            
            
            await expect(_bpnm.connect(_user1).addItemToMarketplace("Test item","http://test.com",utils.parseEther("10"),false,false,_user1.address)).to.be.revertedWith("[bPNM] Need marketplaceAdministrator or higher");

            //change verificator to user1
            await _bpnm.changeMarketplaceAdministrator(user1)
            
            await expect(_bpnm.connect(_user1).addItemToMarketplace("Test item","http://test.com",utils.parseEther("10"),false,false,_user1.address)).not.to.be.reverted;

            //items amount increased
            totalItems = await _bpnm.totalMarketplaceItems()
            expect(Number(totalItems)).to.equal(1);
            
            
                    

            
        
            await expect(_bpnm.changeMarketplaceAdministrator(constants.AddressZero)).to.be.revertedWith("[bPNM] Non zero address");
            await expect(_bpnm.connect(_user1).changeMarketplaceAdministrator(user19)).to.be.revertedWith("Ownable: caller is not the owner");

        });

        it("setBtcOracle", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            
            //change verificator to user1
            await _bpnm.setBtcOracle(2)
            
            //oracle changed
            expect(Number(await _bpnm._usedBtcOracle())).to.equal(2);
            
            await expect(_bpnm.setBtcOracle(3)).to.be.revertedWith("[bPNM] Incorrect oracle selector");
            await expect(_bpnm.connect(_user1).setBtcOracle(user19)).to.be.revertedWith("Ownable: caller is not the owner");

        });

        it("triggerLock", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "1504")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("1504"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("1500"))
            
            //enable lock
            await _marketing.triggerLock()
            
            await expect(_marketing.connect(_user1).buyLimitPack(1)).to.be.revertedWith("[bPNM] Locked");
            await expect(_marketing.connect(_user1).activate(user2,user1,1)).to.be.revertedWith("[bPNM] Locked");
            
            //disable lock
            await _marketing.triggerLock()
            
            await expect(_marketing.connect(_user1).buyLimitPack(1)).not.to.be.reverted;

            await expect(_marketing.connect(_user1).triggerLock()).to.be.revertedWith("Ownable: caller is not the owner");

        });

        it("Get payment contracts", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            
            const p0 = await _marketing._getPaymentContract(0)
            const p1 = await _marketing._getPaymentContract(1)
            const p2 = await _marketing._getPaymentContract(2)
            const p3 = await _marketing._getPaymentContract(3)
            expect(p0).to.be.equal(_busd.address)
            expect(p1).to.be.equal(_busd.address)
            await expect(_marketing._getPaymentContract(4)).to.be.revertedWith("[bPNM] Incorrect payment ID");

        });
        
        //for NFT
        it("setgwtPerDayForHundredRarity", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            //deposit with 150 + 2 usdt
            await depositUSDT(_busd, _user1.address, "1504")
            //increase allowance
            await _busd.connect(_user1).increaseAllowance(_marketing.address,utils.parseEther("1504"))
            //despoit 150 usdt to internal balance
            await _marketing.connect(_user1).replenishPaymentBalance(utils.parseEther("1500"))
            
            await _marketing.connect(_user1).buyLimitPack(8)

            //get nft
            await _marketing.connect(_user1).mintNFT()   

            rarity = await _nft.getAddressTotalRarityLevel(user1)         
            console.log("🚀 ~ file: bpnm_tests.js:4692 ~ rarity:", Number(rarity))
            
            //wait 1 day
            await time.increase(60*60*24*1);
            
            //get total profit
            profit1 = await _nft._calcAllNftGwtProfit(user1)
            // console.log("Profit=",utils.formatEther(profit))
            await _nft.connect(_user1).batchClaimGwtProfit()
            
            //increase profit amount
            await _nft.setgwtPerDayForHundredRarity(utils.parseEther("2"))
            
            //wait 1 day
            await time.increase(60*60*24*1-1);
            
            //get total profit
            profit2 = await _nft._calcAllNftGwtProfit(user1)
            expect(_bigIntToFixedFloat(profit2)).to.be.equal((_bigIntToFixedFloat(profit1)*2).toFixed(3))
            await expect(_nft.setgwtPerDayForHundredRarity(utils.parseEther("2.01"))).to.be.revertedWith("[CNS] Out of range");

        });

        it("changePromoter_NFT", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
                        
            await expect(_nft.connect(_user1).setgwtPerDayForHundredRarity(utils.parseEther("2"))).to.be.revertedWith("[CNS] Need promoter or higher");

            //change promoter to user1
            await _nft.changePromoter(user1)
            
            await expect(_nft.connect(_user1).setgwtPerDayForHundredRarity(utils.parseEther("2"))).not.to.be.reverted;

        
            await expect(_nft.changePromoter(constants.AddressZero)).to.be.revertedWith("[CNS] Non zero address");
            await expect(_nft.connect(_user1).changePromoter(user19)).to.be.revertedWithCustomError(_nft,'OwnableUnauthorizedAccount');

        });

        it("removeAllowedContract_NFT", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);

            await _nft.addAllowedContract(user19)
            expect(await _nft.returnAllowedContract(user19)).to.be.equal(true);

            await expect(_nft.removeAllowedContract(user19)).not.to.be.reverted;

            expect(await _nft.returnAllowedContract(user19)).to.be.equal(false);
        

            await expect(_nft.removeAllowedContract(constants.AddressZero)).to.be.revertedWith("[CNS] Non zero address");
            await expect(_nft.addAllowedContract(constants.AddressZero)).to.be.revertedWith("[CNS] Non zero address");
            await expect(_nft.connect(_user1).removeAllowedContract(user19)).to.be.revertedWithCustomError(_nft,'OwnableUnauthorizedAccount');
            await expect(_nft.connect(_user1).addAllowedContract(user19)).to.be.revertedWithCustomError(_nft,'OwnableUnauthorizedAccount');

        });

        //for PLD
        it("setUnlockPeriod", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            await _btcbCollector.disablePrestart();//should be called before bPNM disable prestart so token price would not be increased on first bPNM buy

            //transfer liquidity
            //deposit 0.0002 btcb
            await depositBTCB(_btcb, _bpnm.address, "4.5")//deposit bpnm
            await depositBTCB(_btcb, _btcbCollector.address, "10.0000000")//deposit PLD
            await depositUSDT(_busd, liquidityCollector, "4000")//deposit usdt liquidity collector

            let bpnmBalanceBtcb = await _btcb.balanceOf(_bpnm.address)
            console.log("bPNM BTCB balance= %s BTCB",utils.formatEther(bpnmBalanceBtcb))
            
            //trigger unlock
            await _btcbCollector.performUnlock();//--unlock
            unlockTime1 = await _btcbCollector.LastLiquidityUnlockTime();
            
            expect(bpnmBalanceBtcb).to.be.equal(utils.parseEther("4.5"))//not changed, 24h not passed since prestart disabled
            
            await time.increase(60*60*24);//wait 24 hours

            await _btcbCollector.performUnlock();//--unlock
            unlockTime2 = await _btcbCollector.LastLiquidityUnlockTime();
            
            expect(Number(unlockTime1)).to.be.not.equal(Number(unlockTime2))//unlock times are different
            
            
            bpnmBalanceBtcb = await _btcb.balanceOf(_bpnm.address)
            console.log("bPNM BTCB balance= %s BTCB",utils.formatEther(bpnmBalanceBtcb))
            expect(bpnmBalanceBtcb).to.be.equal(utils.parseEther("4.515555631762614402"))//4.5 + 0.5% * (1-(4.5/(4.5 + 10 + (4000/50000))))*4.5
            
            //set unlock each 48hours
            await _btcbCollector.setUnlockPeriod(48);
            
            await time.increase(60*60*24);//wait 24 hours
            await _btcbCollector.performUnlock();//--unlock
            unlockTime3 = await _btcbCollector.LastLiquidityUnlockTime();

            //wait 24h to check that no unlock
            bpnmBalanceBtcb = await _btcb.balanceOf(_bpnm.address)
            expect(bpnmBalanceBtcb).to.be.equal(utils.parseEther("4.515555631762614402"))//4.5 + 0.5% * (1-(4.5/(4.5 + 10 + (4000/50000))))*4.5
            expect(Number(unlockTime3)).to.be.equal(Number(unlockTime2))//unlock times are equal
            
            await time.increase(60*60*24);//wait 24 hours more, total 48 hours
            await _btcbCollector.performUnlock();//now should unlock
            unlockTime4 = await _btcbCollector.LastLiquidityUnlockTime();
            
            expect(Number(unlockTime3)).to.not.be.equal(Number(unlockTime4))//unlock times are different
            
            bpnmBalanceBtcb = await _btcb.balanceOf(_bpnm.address)
            console.log("bPNM BTCB balance= %s BTCB",utils.formatEther(bpnmBalanceBtcb))
            expect(bpnmBalanceBtcb).to.be.equal(utils.parseEther("4.531140948019931514"))

            await expect(_btcbCollector.setUnlockPeriod(1)).to.be.revertedWith("Out of range");

        });
        //PLD
        it("setUnlockPercent", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            await _btcbCollector.disablePrestart();//should be called before bPNM disable prestart so token price would not be increased on first bPNM buy

            //transfer liquidity
            //deposit 0.0002 btcb
            await depositBTCB(_btcb, _bpnm.address, "4.5")//deposit bpnm
            await depositBTCB(_btcb, _btcbCollector.address, "10.0000000")//deposit PLD
            await depositUSDT(_busd, liquidityCollector, "4000")//deposit usdt liquidity collector

            let bpnmBalanceBtcb = await _btcb.balanceOf(_bpnm.address)
            console.log("bPNM BTCB balance= %s BTCB",utils.formatEther(bpnmBalanceBtcb))
            
            await time.increase(60*60*24);//wait 24 hours
            
            //double percent
            await _btcbCollector.setUnlockPercent(100);
            
            //trigger unlock
            await _btcbCollector.performUnlock();//--unlock
            unlockTime1 = await _btcbCollector.LastLiquidityUnlockTime();
            
            bpnmBalanceBtcb = await _btcb.balanceOf(_bpnm.address)
            console.log("bPNM BTCB balance= %s BTCB",utils.formatEther(bpnmBalanceBtcb))
            
            // expect(bpnmBalanceBtcb).to.be.equal(utils.parseEther("4.515555631762614375"))//4.5 + 0.5% * (1-(4.5/(4.5 + 10 + (4000/50000) )))*4.5
            expect(bpnmBalanceBtcb).to.be.equal(utils.parseEther("4.531111263525228804"))//4.5 + 1% * (1-(4.5/(4.5 + 10 + (4000/50000) )))*4.5
            

            await expect(_btcbCollector.setUnlockPercent(200)).to.be.revertedWith("Out of range");

        });
        //PLD
        it("changePromoter", async function () {
            const { _bpnm, _busd, _tree, _owner, _user1, _user2, _user3, _busd_owner, _gwt, _btcb, _btcbCollector, _nft, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(firstUserRegisters);
            
            
            await expect(_btcbCollector.connect(_user1).setUnlockPeriod(12)).to.be.revertedWith("[PLD] Need promoter or higher");
            await expect(_btcbCollector.connect(_user1).setUnlockPercent(100)).to.be.revertedWith("[PLD] Need promoter or higher");

            //change promoter to user1
            await _btcbCollector.changePromoter(user1)
            
            await expect(_btcbCollector.connect(_user1).setUnlockPeriod(12)).not.to.be.reverted;
            await expect(_btcbCollector.connect(_user1).setUnlockPercent(100)).not.to.be.reverted;

            promoter = await _btcbCollector.promoter()
           
            await expect(_btcbCollector.connect(_user1).promoter()).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(_btcbCollector.changePromoter(constants.AddressZero)).to.be.revertedWith("[PLD] Non zero address");
            await expect(_btcbCollector.connect(_user1).changePromoter(user19)).to.be.revertedWith("Ownable: caller is not the owner");

        });

    });


    //default payment system is USDT, check if changed to payment2 all is ok
    describe("==14) Test new payment systems", function () {
        if (!enable_test[14]) {
            return(0)
        }


        
        //+new deposit works
        //+new withdraw works
        //+withdraw of old balance works
        
        it("Deposit/withdraw. Payment2", async function () {
            const { _bpnm, _busd, _tree, _owner, signers, _btcb, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(SixteenUsersRegistered);
            //payment systme changed
            await _marketing.switchPayment(_payment2.address, 2)
            const paymentId = await _marketing._payment()
            expect(paymentId).to.equal(2)
            
            //make some balance in payment2 for user1
            await depositP2(_payment2, signers[1].address, "1000")
            expect(await _payment2.balanceOf(signers[1].address)).to.equal(utils.parseEther("1000"))

            //make new deposit
            await _payment2.connect(signers[1]).increaseAllowance(_marketing.address,utils.parseEther("100"))
            await _marketing.connect(signers[1]).replenishPaymentBalance(utils.parseEther("100"))
            expect(await _payment2.balanceOf(signers[1].address)).to.equal(utils.parseEther("900"))
            
            //contract balance increased
            expect(await _payment2.balanceOf(_marketing.address)).to.equal(utils.parseEther("100"))
            
            //check new balance deposited to user
            userdataU1 = await _marketing.Users(signers[1].address)
            expect(userdataU1.balance.payment2).to.equal(utils.parseEther("100"))
            
            //make withdraw
            await _marketing.connect(signers[1]).withdrawBalance(utils.parseEther("10"),0,2)
            expect(await _payment2.balanceOf(signers[1].address)).to.equal(utils.parseEther("909"))//900 + (10 - 10%)
            expect(await _payment2.balanceOf(_marketing.address)).to.equal(utils.parseEther("90"))//100-10
            expect(await _payment2.balanceOf(liquidityCollector)).to.equal(utils.parseEther("1"))//10% of 10
            
            
            //withdraw old USDT balance
            await _marketing.connect(signers[1]).withdrawBalance(utils.parseEther("0.1"),0,1)//withdraw to usdt
            expect(await _busd.balanceOf(signers[1].address)).to.equal(utils.parseEther("0.09"))//0.1-10%


            
        });

        it("Deposit/withdraw. Payment3", async function () {
            const { _bpnm, _busd, _tree, _owner, signers, _btcb, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(SixteenUsersRegistered);
            //payment systme changed
            await _marketing.switchPayment(_payment3.address, 3)
            const paymentId = await _marketing._payment()
            expect(paymentId).to.equal(3)
            
            //make some balance in payment2 for user1
            await depositP3(_payment3, signers[1].address, "1000")
            expect(await _payment3.balanceOf(signers[1].address)).to.equal(utils.parseEther("1000"))

            //make new deposit
            await _payment3.connect(signers[1]).increaseAllowance(_marketing.address,utils.parseEther("100"))
            await _marketing.connect(signers[1]).replenishPaymentBalance(utils.parseEther("100"))
            expect(await _payment3.balanceOf(signers[1].address)).to.equal(utils.parseEther("900"))
            
            //contract balance increased
            expect(await _payment3.balanceOf(_marketing.address)).to.equal(utils.parseEther("100"))
            
            //check new balance deposited to user
            userdataU1 = await _marketing.Users(signers[1].address)
            expect(userdataU1.balance.payment3).to.equal(utils.parseEther("100"))
            
            //make withdraw
            await _marketing.connect(signers[1]).withdrawBalance(utils.parseEther("10"),0,3)
            expect(await _payment3.balanceOf(signers[1].address)).to.equal(utils.parseEther("909"))//900 + (10 - 10%)
            expect(await _payment3.balanceOf(_marketing.address)).to.equal(utils.parseEther("90"))//100-10
            expect(await _payment3.balanceOf(liquidityCollector)).to.equal(utils.parseEther("1"))//10% of 10
            
            
            //withdraw old USDT balance
            await _marketing.connect(signers[1]).withdrawBalance(utils.parseEther("0.1"),0,1)//withdraw to usdt
            expect(await _busd.balanceOf(signers[1].address)).to.equal(utils.parseEther("0.09"))//0.1-10%


            
        });

        //+new activation works
        //+new status buy works
        //+new frozen balances used
        //+new frozen released

        //+fee is taken in new payment
        //+frozen of usdt released manually
        //+matching deposited to new

        it("Activation/Pack buy. Payment2", async function () {
            const { _bpnm, _busd, _tree, _owner, signers, _btcb, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(SixteenUsersRegistered);
            expect(await _marketing._getPaymentContract(0)).to.be.equal(_busd.address)
            expect(await _marketing._getPaymentContract(1)).to.be.equal(_busd.address)
            //payment systme changed
            await _marketing.switchPayment(_payment2.address, 2)
            const paymentId = await _marketing._payment()
            expect(paymentId).to.equal(2)
            expect(await _marketing._getPaymentContract(0)).to.be.equal(_payment2.address)
            expect(await _marketing._getPaymentContract(2)).to.be.equal(_payment2.address)
            //make some balance in payment2 for user1
            await depositP2(_payment2, signers[1].address, "1000")
            expect(await _payment2.balanceOf(signers[1].address)).to.equal(utils.parseEther("1000"))
            
            //make new deposit
            await _payment2.connect(signers[1]).increaseAllowance(_marketing.address,utils.parseEther("10"))
            await _marketing.connect(signers[1]).replenishPaymentBalance(utils.parseEther("10"))
            
            //contract balance increased
            // expect(await _payment2.balanceOf(_marketing.address)).to.equal(utils.parseEther("100"))
            
            
            //purchase pack
            await _marketing.connect(signers[1]).buyLimitPack(1)
            
            //new balance used
            userdataU1 = await _marketing.Users(signers[1].address)
            expect(userdataU1.balance.payment2).to.equal(utils.parseEther("0"))
            
            // expect(await _payment2.balanceOf(signers[1].address)).to.equal(utils.parseEther("909"))//900 + (10 - 10%)
            // expect(await _payment2.balanceOf(_marketing.address)).to.equal(utils.parseEther("90"))//100-10
            expect(await _payment2.balanceOf(feeCollector)).to.equal(utils.parseEther("2"))//20% of 10
            expect(await _payment2.balanceOf(liquidityCollector)).to.equal(utils.parseEther("8"))//10 - 2
            
            //user5 buy pack, user1 should get 0.1 to new balance as ref from level 4
            //make some balance in payment2 for user5
            await depositP2(_payment2, signers[5].address, "10")
            await _payment2.connect(signers[5]).increaseAllowance(_marketing.address,utils.parseEther("10"))
            await _marketing.connect(signers[5]).replenishPaymentBalance(utils.parseEther("10"))
            await _marketing.connect(signers[5]).buyLimitPack(1)
            
            //check u1 internal balance
            userdataU1 = await _marketing.Users(signers[1].address)
            expect(userdataU1.balance.payment2).to.equal(utils.parseEther("0.1"))
            
            //user6 buy pack, user1 should get 0.16 to new FROZEN balance as ref
            //make some balance in payment2 for user4
            await depositP2(_payment2, signers[6].address, "10")
            await _payment2.connect(signers[6]).increaseAllowance(_marketing.address,utils.parseEther("10"))
            await _marketing.connect(signers[6]).replenishPaymentBalance(utils.parseEther("10"))
            await _marketing.connect(signers[6]).buyLimitPack(1)
            
            //check u1 frozen balance
            
            const frozen = await _marketing.addressFrozenTotal(signers[1].address,2)
            expect(frozen[0][4]).to.equal(utils.parseEther("0.16"))
            
            //activate some address with payment2
            await depositP2(_payment2, signers[19].address, "10")
            await _payment2.connect(signers[19]).increaseAllowance(_marketing.address,utils.parseEther("10"))
            await _marketing.connect(signers[19]).activate(signers[19].address,signers[4].address,1)
            
            //check u1 internal balance
            userdataU1 = await _marketing.Users(signers[1].address)
            expect(userdataU1.balance.payment2).to.equal(utils.parseEther("0.2"))//new user in lvl4 so get ref
            
            //increase pack for u1 so payment2 funds unfrozen
            await _payment2.connect(signers[1]).increaseAllowance(_marketing.address,utils.parseEther("500"))
            await _marketing.connect(signers[1]).replenishPaymentBalance(utils.parseEther("500"))
            await _marketing.connect(signers[1]).buyLimitPack(8)
            
            userdataU1 = await _marketing.Users(signers[1].address)
            expect(userdataU1.balance.payment2).to.equal(utils.parseEther("0.36"))//0.2 + 0.16 = 0.36
            expect(userdataU1.balance.usdt).to.equal(utils.parseEther("0.1"))//unchanged
            
            //buy new earnlimit, fee in payment2 should be taken
            await _payment2.connect(signers[1]).increaseAllowance(_marketing.address,utils.parseEther("2"))
            await _marketing.connect(signers[1]).buyEarnLimitWithGwt(utils.parseEther("1"))
            
            expect(await _payment2.balanceOf(signers[1].address)).to.be.equal(utils.parseEther("488"))//1000 - 10 - 500 - 2
            
            //release frozen funds in USDT
            let frozenUSDT = await _marketing.addressFrozenTotal(signers[1].address,1)
            // console.log("🚀 ~ file: bpnm_tests.js:4603 ~ frozenUSDT:", frozenUSDT)
            await _marketing.connect(signers[1]).releaseFrozenFunds(signers[1].address,1)
            frozenUSDT = await _marketing.addressFrozenTotal(signers[1].address,1)
            // console.log("🚀 ~ file: bpnm_tests.js:4606 ~ frozenUSDT:", frozenUSDT)
            
            userdataU1 = await _marketing.Users(signers[1].address)
            expect(userdataU1.balance.usdt).to.equal(utils.parseEther("1.615"))//0.1+0.16+0.21+0.21+0.195+0.26+0.24+0.24

            //matching deposited to payment2
            await _payment2.connect(signers[1]).increaseAllowance(_marketing.address,utils.parseEther("2"))
            await _marketing.connect(signers[1]).extendMatchingBonus()

            //make some balance in payment2 for user8
            await depositP2(_payment2, signers[8].address, "100")
            await _payment2.connect(signers[8]).increaseAllowance(_marketing.address,utils.parseEther("100"))
            await _marketing.connect(signers[8]).replenishPaymentBalance(utils.parseEther("100"))
            await _marketing.connect(signers[8]).withdrawBalance(utils.parseEther("100"),0,2)

            //check new balance deposited to user
            userdataU1 = await _marketing.Users(signers[1].address)
            expect(userdataU1.balance.payment2).to.equal(utils.parseEther("0.81"))//0.36 + (0.5 - 10%)

        });

        it("Activation/Pack buy. Payment3", async function () {
            const { _bpnm, _busd, _tree, _owner, signers, _btcb, _payment2, _payment3, _payment2_owner, _payment3_owner, _marketing } = await loadFixture(SixteenUsersRegistered);
            //payment systme changed
            await _marketing.switchPayment(_payment3.address, 3)
            const paymentId = await _marketing._payment()
            expect(paymentId).to.equal(3)
            expect(await _marketing._getPaymentContract(0)).to.be.equal(_payment3.address)
            expect(await _marketing._getPaymentContract(3)).to.be.equal(_payment3.address)
            //make some balance in payment2 for user1
            await depositP3(_payment3, signers[1].address, "1000")
            expect(await _payment3.balanceOf(signers[1].address)).to.equal(utils.parseEther("1000"))
            
            //make new deposit
            await _payment3.connect(signers[1]).increaseAllowance(_marketing.address,utils.parseEther("10"))
            await _marketing.connect(signers[1]).replenishPaymentBalance(utils.parseEther("10"))
            
            //contract balance increased
            // expect(await _payment2.balanceOf(_marketing.address)).to.equal(utils.parseEther("100"))
            
            
            //purchase pack
            await _marketing.connect(signers[1]).buyLimitPack(1)
            
            //new balance used
            userdataU1 = await _marketing.Users(signers[1].address)
            expect(userdataU1.balance.payment3).to.equal(utils.parseEther("0"))
            
            // expect(await _payment2.balanceOf(signers[1].address)).to.equal(utils.parseEther("909"))//900 + (10 - 10%)
            // expect(await _payment2.balanceOf(_marketing.address)).to.equal(utils.parseEther("90"))//100-10
            expect(await _payment3.balanceOf(feeCollector)).to.equal(utils.parseEther("2"))//20% of 10
            expect(await _payment3.balanceOf(liquidityCollector)).to.equal(utils.parseEther("8"))//10 - 2
            
            //user5 buy pack, user1 should get 0.1 to new balance as ref from level 4
            //make some balance in payment2 for user5
            await depositP3(_payment3, signers[5].address, "10")
            await _payment3.connect(signers[5]).increaseAllowance(_marketing.address,utils.parseEther("10"))
            await _marketing.connect(signers[5]).replenishPaymentBalance(utils.parseEther("10"))
            await _marketing.connect(signers[5]).buyLimitPack(1)
            
            //check u1 internal balance
            userdataU1 = await _marketing.Users(signers[1].address)
            expect(userdataU1.balance.payment3).to.equal(utils.parseEther("0.1"))
            
            //user6 buy pack, user1 should get 0.16 to new FROZEN balance as ref
            //make some balance in payment2 for user4
            await depositP3(_payment3, signers[6].address, "10")
            await _payment3.connect(signers[6]).increaseAllowance(_marketing.address,utils.parseEther("10"))
            await _marketing.connect(signers[6]).replenishPaymentBalance(utils.parseEther("10"))
            await _marketing.connect(signers[6]).buyLimitPack(1)
            
            //check u1 frozen balance
            
            const frozen = await _marketing.addressFrozenTotal(signers[1].address,3)
            expect(frozen[0][4]).to.equal(utils.parseEther("0.16"))
            
            //activate some address with payment2
            await depositP3(_payment3, signers[19].address, "10")
            await _payment3.connect(signers[19]).increaseAllowance(_marketing.address,utils.parseEther("10"))
            await _marketing.connect(signers[19]).activate(signers[19].address,signers[4].address,1)
            
            //check u1 internal balance
            userdataU1 = await _marketing.Users(signers[1].address)
            expect(userdataU1.balance.payment3).to.equal(utils.parseEther("0.2"))//new user in lvl4 so get ref
            
            //increase pack for u1 so payment2 funds unfrozen
            await _payment3.connect(signers[1]).increaseAllowance(_marketing.address,utils.parseEther("500"))
            await _marketing.connect(signers[1]).replenishPaymentBalance(utils.parseEther("500"))
            await _marketing.connect(signers[1]).buyLimitPack(8)
            
            userdataU1 = await _marketing.Users(signers[1].address)
            expect(userdataU1.balance.payment3).to.equal(utils.parseEther("0.36"))//0.2 + 0.16 = 0.36
            expect(userdataU1.balance.usdt).to.equal(utils.parseEther("0.1"))//unchanged
            
            //buy new earnlimit, fee in payment2 should be taken
            await _payment3.connect(signers[1]).increaseAllowance(_marketing.address,utils.parseEther("2"))
            await _marketing.connect(signers[1]).buyEarnLimitWithGwt(utils.parseEther("1"))
            
            expect(await _payment3.balanceOf(signers[1].address)).to.be.equal(utils.parseEther("488"))//1000 - 10 - 500 - 2
            
            //release frozen funds in USDT
            let frozenUSDT = await _marketing.addressFrozenTotal(signers[1].address,1)
            // console.log("🚀 ~ file: bpnm_tests.js:4603 ~ frozenUSDT:", frozenUSDT)
            await _marketing.connect(signers[1]).releaseFrozenFunds(signers[1].address,1)
            frozenUSDT = await _marketing.addressFrozenTotal(signers[1].address,1)
            // console.log("🚀 ~ file: bpnm_tests.js:4606 ~ frozenUSDT:", frozenUSDT)
            
            userdataU1 = await _marketing.Users(signers[1].address)
            expect(userdataU1.balance.usdt).to.equal(utils.parseEther("1.615"))//0.1+0.16+0.21+0.21+0.195+0.26+0.24+0.24

            //matching deposited to payment2
            await _payment3.connect(signers[1]).increaseAllowance(_marketing.address,utils.parseEther("2"))
            await _marketing.connect(signers[1]).extendMatchingBonus()

            //make some balance in payment2 for user8
            await depositP3(_payment3, signers[8].address, "100")
            await _payment3.connect(signers[8]).increaseAllowance(_marketing.address,utils.parseEther("100"))
            await _marketing.connect(signers[8]).replenishPaymentBalance(utils.parseEther("100"))
            await _marketing.connect(signers[8]).withdrawBalance(utils.parseEther("100"),0,3)

            //check new balance deposited to user
            userdataU1 = await _marketing.Users(signers[1].address)
            expect(userdataU1.balance.payment3).to.equal(utils.parseEther("0.81"))//0.36 + (0.5 - 10%)

            await expect(_marketing.connect(signers[1]).releaseFrozenFunds(signers[1].address,4)).to.be.revertedWith("[bPNM] Incorrect payment ID");
            await expect(_marketing.connect(signers[1]).releaseFrozenFunds(constants.AddressZero,1)).to.be.revertedWith("[bPNM] Non zero address");

        });

        //pld use payment2 to calculate release amount

    });




            
  });
