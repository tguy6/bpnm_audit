// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

//using OZ version 4.9.3 for compatibility with Phenomenal Tree and GWT
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
/**
 * @dev Interface for main BEP20BPNM token contract.
 */
interface Bpnm {

    function getBtcPrice() external returns (uint);
    function prestartMode() external returns(bool);
    function depositBuyLimit(uint limitAmount, address receiver) external returns(bool);
    function _verificationNeeded() external returns(bool);
    function IsVerified(address userAddress) external returns(bool);
}

/**
 * @dev Interface for a phenomenal tree contract.
 */
interface PhenomenalTreeInt {

    function positionUser(address newUser, address referrerAddress, uint8 lvlsDeep) external;
    function getLvlsUp(address searchedAddress) external view returns(address[15] memory);
    function isUserexist(address userAddress) external view returns(bool);

}

/**
 * @dev Interface for a NFT Consultants collection.
 */
interface NftConsultantsInt {

    function mintNFT(address receiverAddress) external;
    function getAddressTotalRarityLevel(address userAddress) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);

}

/**
 * @dev Interface for a GWT token.
 */

interface GWT {

    function mint(address account, uint256 amount) external returns (bool);
    function burn(address account, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);

}

/**
 * @dev Interface for Phenomenal Liquidity Distributor.
 */

interface PLD {

    function performUnlock() external returns (bool);
    
}

/**
 *  MarketingBPNM handles all marketing activites for bPNM users such as:
 * New user activation
 * Limit Pack purchase
 * USDT deposit/withdraw
 * NFT minting
 * Should be connected to BEP20BPNM with connectMarketingContract after deploy
 */
contract MarketingBPNM is Ownable {
    Bpnm private _bpnm;
    PLD public _pld;

    using SafeERC20 for IERC20;
    IERC20 public usdt;// Main limit packs payment method. Activated by default
    IERC20 public payment2;// Alternative limit packs payment method. Can be switched from USDT or payment3
    IERC20 public payment3;// Alternative limit packs payment method. Can be switched from USDT or payment2

    PhenomenalTreeInt public contractTree;
    NftConsultantsInt public nftCollection;

    GWT public gwt;

    address private _promoter;//address for enabling promotion conditions
    address immutable private firstUser;

    address public feeCollector;//address for earning fees
    address public liquidityCollector;//USDT liquidity collector

    uint public totalUsers = 0;
    uint public totalUsersEarnings = 0;//Total user USDT earnings accumulated for all time.
    uint public totalFrozen = 0;//Total user USDT earnings frozen on tree levels right now

    uint public buyLimitMultiplier = 4;//Multiplier applied to limit pack cost to calculate bPNM token purchase limit

    uint public limitPackPurchaseGwtCompensation = 20;//20% of Limit Pack cost deposited to user as GWT compensation
    
    uint immutable public marketingDistributionFromPack = 52;//Percent from limit pack cost distributed to marketing rewards
    uint immutable public feeCollectorFromPack = 20;//Percent amount deposited to fee collector
    uint immutable public liquidityCollectorFromPack = 28;//Percent amount deposited to USDT liquidity collector

    uint immutable public gwtTransFeeCollector = 1e18;//USDT fee paid to feeCollector when buying turnover/earnLimit. 1 USDT, immutable
    uint public gwtTransFeeLiquidity = 1e18;//USDT fee stays in liquidity buying turnover/earnLimit. 1 USDT, mutable 0-2 USDT

    uint public matchingBonusGwtCost = 200e18;//Matching bonus monthly cost in GWT
    uint public matchingBonusExtendPeriod = 30 days;//Matching bonus extend period
    uint immutable public matchingMaxPeriod = 90 days;//Max amount of days for active matching bonus address can hold
    
    uint immutable public earnLimitExtra = 10;//Max +10% earn limit can be purchased additionally. Calculated from total accrued earn limit
    uint public earnLimitExtraPerGwt = 2e18;//Amount of USDT earn limit accrued for each 1 GWT on purchase

    uint public withdrawBaseFee = 10;//Base withdraw fee percent. Can be 6-10
    uint immutable public withdrawMinFee = 5;//Min withdraw fee percent. Immutable, used for matching bonus distribution.

    bool public isLocked = true;//Global lock, locks activate/buybPNM/deposit/buy limit pack

    uint public nftMintTokenMaxAmount = 3000;//Max amount of tokens to mint NFT. Can be increased up to 10 000
    uint public nftMintTokenDistributedAmount=20;//Distributed amount of tokens to mint NFT. First 20 pre-minted
    uint public nftMintTokenTurnoverRequired = 500e18;//Amount of turnover required to get 1 NFT mint token.

    uint public nftDiscountForLimitPackPrice = 10;//Amount of discount user get for each point of rarity for LP purchase. 1 = 0.0001%. Rarity calcs as 1200-NFT rarity. With rarity = 1000 total discount is 1000*0.0001%*10=1%. Max 10%
    uint public nftDiscountForMatchingPayment = 10;//Amount of discount user get for each point of rarity for matching GWT payment. 1 = 0.0001%. With rarity = 1000 total discount is 1000*0.001%*10=1%. Max 30%
    uint public nftDiscountForAdditionalMarketingPercent = 10;//Amount of discount user get for each point of rarity for marketing additional +1% GWT payment. Rarity calcs as 1200-NFT rarity. 1 = 0.0001%. With rarity = 1000 total discount is 1000*0.001%*10=1%. Max 10%
    uint public nftDiscountForWithdraw = 10;//Amount of discount user get for each point of rarity for balance withdraw (USDT by default). Rarity calcs as 1200-NFT rarity. 1 = 0.0001%. With rarity = 1000 total discount is 1000*0.0001%*10=1%. Max 5%

    uint public _payment = 1;//ID of active payment method for Limit Pack purchase, usdt == 1, payment2 == 2, payment3 == 3

    LimitPack[13] public limitPacks;//List of limit packs
    TreeLvlData[16] public treeLvls;//List of tree levels config
    uint256[16] public additionalPercentCost;//Cost to unlock marketing +1% for each level. Starts with element ID 1

    struct User {
        address referrer;//By whom user has been referred to bPNM
        Balance balance;//USDT/Paymnet2/Payment3 balances
        uint earnLimitLeft;//Amount of left earn limit
        uint totalEarned;//Total rewards received from 15 lvls down from tree. Unilevel and matching bonus.
        uint networkTurnover;//Total turnover generated by network in a 15 lvl tree depth with Limit Packs purchases
        uint limitPackId;//Currently active limit pack by ID, starting from 1
        uint extendedTreeLvl;//Max extended tree level, added +1% for marketing bonus to levels below including this
        bool limitPackAutoRenew;//If enabled, new limit pack will be purchased when earn limit comes to an end
        uint matchingActiveUntil;//Date when matching bonus is expiring, should be extended with GWT payment
    }

    struct Balance {
        uint usdt;//User USDT balance
        uint payment2;//User payment2 balance. Reserve, might be used if moved from usdt to new payment token.
        uint payment3;//User payment3 balance. Reseve, might be used if moved from usdt to new payment token.
    }

    struct BalanceFrozen {
        uint usdt;//Frozen USDT balance. Struct used for each tree Lvl
        uint payment2;//Frozen payment2 balance. Reserve, might be used if moved from usdt to new payment token.
        uint payment3;//Frozen payment3 balance. Reseve, might be used if moved from usdt to new payment token.
    }

    struct FrozenFundsStruct {
        BalanceFrozen balance;//amount of frozen funds on a level
        uint startDate;//date from which frozen period timer starts for this level
    }

    struct LimitPack {
        uint cost;//cost of limit pack
        uint treeDepth;//max tree depth unlocked by limit pack
        uint earnLimit;//earn limit deposited with limit pack purchase
        
    }

    struct TreeLvlData {
        uint bonus;//bonus in percent from limit pack purchases on this level
        uint frozenPercent;//percent of funds that is frozen when corresponding tree level is not unlocked with limit pack
        uint maxFreezePeriod;//period of time before frozen funds are transferred to liquidity
        
    }

    struct LimitsPurchases {
        uint totalEarnLimit;//total amount of earn limit deposited from limit pack purchase
        uint purchasedEarnLimit;//amount of purchased earn limit with GWT, can not increase 10% of total deposited earn limit from packs
    }

    mapping(address => User) public Users;

    mapping(address => uint) public MintTokenBalance;//amount of mint tokens user have. Required for NFT minting
    mapping(address => LimitsPurchases) public UserOverLimits;
    mapping(address => FrozenFundsStruct[16]) public FrozenFunds;//mapping for user frozen funds, count starts from 1 to 15
    mapping(address => uint[16]) public UsersAtTreeLvl;//Amount of addresses on each tree lvl. Starts from 1
    
    event Deposit(address indexed sender, uint paymentID, uint amount);
    event Withdraw(address indexed receiver, uint paymentID, uint amount);
    
    event LimitPackPurchase(address indexed buyer, uint packID, bool isManual);
    event Activation(address indexed newAddress, address refAddress, uint packID, address signer);
    
    event TreeBonus(address indexed sender, address indexed receiver, uint amount, uint lvl, uint paymentID, bool isFrozen);
    event MatchingBonus(address indexed sender, address indexed receiver, uint amount, uint lvl, uint paymentID, bool isFrozen);
    
    event LockedMovedToLiquidity(address indexed from, uint amount, uint lvl);
    event LockedFundsReleased(address indexed to, uint amount, uint lvl);
    
    event MatchingBonusExtended(address indexed receiver, uint gwtCost, uint addedDays);
    
    event EarnLimitPurchase(address indexed receiver, uint gwtCost, uint accruedEarnLimit);

    event ExtendLvlBonus(address indexed receiver, uint gwtCost, uint lvl);



    constructor(IERC20 _depositTokenAddress, PhenomenalTreeInt _treeAddress, GWT _gwt, address _feeCollector, address _stableLiquidityCollector, NftConsultantsInt _nftCollection, Bpnm _bpnmAddress) {
        require(address(_depositTokenAddress)!=address(0),'[bPNM] Non zero address');
        require(address(_treeAddress)!=address(0),'[bPNM] Non zero address');
        require(address(_gwt)!=address(0),'[bPNM] Non zero address');
        require(_feeCollector!=address(0),'[bPNM] Non zero address');
        require(address(_nftCollection)!=address(0),'[bPNM] Non zero address');
        require(address(_bpnmAddress)!=address(0),'[bPNM] Non zero address');
    
        _promoter = msg.sender;
        firstUser = msg.sender;
        init(_depositTokenAddress, _treeAddress, _gwt, _feeCollector, _stableLiquidityCollector, _nftCollection, _bpnmAddress);

    
    }

    /**
     * @dev Init contract once on deploy
     */

    function init(IERC20 _depositTokenAddress, PhenomenalTreeInt _treeAddress, GWT _gwt, address _feeCollector, address _stableLiquidityCollector, NftConsultantsInt _nftCollection, Bpnm _bpnmAddress) private {
        require(_feeCollector!=address(0),'[bPNM] Non zero address');
        require(_stableLiquidityCollector!=address(0),'[bPNM] Non zero address');

        usdt = _depositTokenAddress;
        contractTree = _treeAddress;
        nftCollection = _nftCollection;
        gwt = _gwt;
        feeCollector = _feeCollector;
        liquidityCollector = _stableLiquidityCollector;
        _bpnm = _bpnmAddress;

        //create first user
        _createUser(msg.sender, address(0));

        //Set limit packs data | Cost / Allowed levels / Earn limit
        
        //fake item
        limitPacks[0]=(LimitPack(0,0,0));
        //ID=1 | LVL = 4 | Cost = 10 USDT
        limitPacks[1]=(LimitPack(10e18,4,30e18));
        //ID=2 | LVL = 5 | Cost = 25 USDT
        limitPacks[2]=(LimitPack(25e18,5,65e18));
        //ID=3 | LVL = 6 | Cost = 50 USDT
        limitPacks[3]=(LimitPack(50e18,6,125e18));
        //ID=4 | LVL = 7 | Cost = 100 USDT
        limitPacks[4]=(LimitPack(100e18,7,240e18));
        //ID=5 | LVL = 8 | Cost = 150 USDT
        limitPacks[5]=(LimitPack(150e18,8,360e18));
        //ID=6 | LVL = 9 | Cost = 200 USDT
        limitPacks[6]=(LimitPack(200e18,9,480e18));
        //ID=7 | LVL = 10 | Cost = 250 USDT
        limitPacks[7]=(LimitPack(250e18,10,580e18));
        //ID=8 | LVL = 11 | Cost = 500 USDT
        limitPacks[8]=(LimitPack(500e18,11,1100e18));
        //ID=9 | LVL = 12 | Cost = 1 000 USDT
        limitPacks[9]=(LimitPack(1000e18,12,2100e18));
        //ID=10 | LVL = 13 | Cost = 2 000 USDT
        limitPacks[10]=(LimitPack(2000e18,13,4100e18));
        //ID=11 | LVL = 14 | Cost = 5 000 USDT
        limitPacks[11]=(LimitPack(5000e18,14,10000e18));
        //ID=12 | LVL = 15 | Cost = 10 000 USDT
        limitPacks[12]=(LimitPack(10000e18,15,20000e18));

        
        //Set tree levels data | Bonus % / Freeze fee / Frezze period
        //lvl 0-3
        treeLvls[0]=(TreeLvlData(0,0,0 days));//treeLvls[0] is not used 
        treeLvls[1]=(TreeLvlData(0,0,0 days));//lvl1
        treeLvls[2]=(TreeLvlData(0,0,0 days));//lvl2
        treeLvls[3]=(TreeLvlData(0,0,0 days));//lvl3
        //lvl4
        treeLvls[4]=(TreeLvlData(1,0,0 days));
        //lvl5
        treeLvls[5]=(TreeLvlData(2,80,3 days));
        //lvl6
        treeLvls[6]=(TreeLvlData(3,70,4 days));
        //lvl7
        treeLvls[7]=(TreeLvlData(3,70,5 days));
        //lvl8
        treeLvls[8]=(TreeLvlData(3,65,7 days));
        //lvl9
        treeLvls[9]=(TreeLvlData(4,65,12 days));
        //lvl10
        treeLvls[10]=(TreeLvlData(4,60,21 days));
        //lvl11
        treeLvls[11]=(TreeLvlData(4,60,28 days));
        //lvl12
        treeLvls[12]=(TreeLvlData(4,55,40 days));
        //lvl13
        treeLvls[13]=(TreeLvlData(4,55,60 days));
        //lvl14
        treeLvls[14]=(TreeLvlData(4,50,80 days));
        //lvl15
        treeLvls[15]=(TreeLvlData(4,50,120 days));

        //Set cost to add additional +1% for a level
        additionalPercentCost[4] = 100e18;
        additionalPercentCost[5] = 250e18;
        additionalPercentCost[6] = 500e18;
        additionalPercentCost[7] = 1000e18;
        additionalPercentCost[8] = 2500e18;
        additionalPercentCost[9] = 5000e18;
        additionalPercentCost[10] = 10000e18;
        additionalPercentCost[11] = 20000e18;
        additionalPercentCost[12] = 30000e18;
        additionalPercentCost[13] = 50000e18;
        additionalPercentCost[14] = 70000e18;
        additionalPercentCost[15] = 90000e18;
    }

    /**
     * @dev New user structs creation
     * Do not position user in a tree, only records for bPNM contract
     * @param _userAddress - new created address
     * @param _referrerAddress - address by whom referred
     */
    function _createUser(address _userAddress, address _referrerAddress) private {
        Balance memory balance = Balance(0, 0, 0);

        User memory user = User({
        referrer: _referrerAddress,
        balance: balance,
        earnLimitLeft: 0,
        totalEarned: 0,
        networkTurnover: 0,
        limitPackId: 0,
        extendedTreeLvl: 0,
        limitPackAutoRenew: false,
        matchingActiveUntil: 0
        });

        Users[_userAddress] = user;

        totalUsers += 1;
    }

    /**
     * 
     * @param id Get limit pack information
     */
    function getLimitPack(uint id) public view returns (LimitPack memory) {
        return(limitPacks[id]);
    }

    /**
     * @param lvl Get tree level bonus information
     */
    function getTreeLevelBonus(uint lvl) public view returns (uint) {
        return(treeLvls[lvl].bonus);
    }

    /**
     * @dev Activate function used by each new address to join bPNM. When activating limitPackID limit pack is assigned
     * Activate can be used only once for each address.
     * New user should not exist in bPNM. New user can exist in Phenomenal tree
     * Refferer required to exist in bPNM only if new user is not exist in Tree.
     * Can be triggered and paid by any address.
     * If verification enabled then newUser should be verified
     * Use USDT from contract, not from internal bPNM balance.
     * @param newUser Joining user address
     * @param referrerAddress Referrer address used for positioning new user in tree
     */
    function activate(address newUser, address referrerAddress, uint limitPackID) onlyUnlocked external{
        require((newUser!=address(0))&&(referrerAddress!=address(0)),'[bPNM] Non zero address');
        require(!isUserExists(newUser), "[bPNM] User already exists");
        require((limitPackID>0&&(limitPackID<=12)), "[bPNM] Incorrect pack ID");

        //if user already exist in tree then referrer not required to exist in bPNM
        if (!contractTree.isUserexist(newUser)) {
            require(isUserExists(referrerAddress), "[bPNM] Referrer not exists");
        }

        if (_bpnm._verificationNeeded()) {
            require(_bpnm.IsVerified(newUser),"[bPNM] Need to verify"); 
        }
        
        
        //creating user record
        _createUser(newUser, referrerAddress);
        
        //positioning user to Phenomenal tree
        contractTree.positionUser(newUser,referrerAddress,15);
        
        //deposit internal balance of new user by msg.sender
        _replenishPaymentBalance(limitPacks[limitPackID].cost,newUser);

        //purchasing first limit pack
        _buyLimitPack(limitPackID, newUser, 0);

        //update upline network counters
        _updateNetwork(newUser);

        emit Activation(newUser, referrerAddress, limitPackID, msg.sender);
    }

    /**
     * @dev Function increase amount of activated addresses on each tree level for address
     */
    function _updateNetwork(address newAddress) private {
        address[15] memory uplineUsers = contractTree.getLvlsUp(newAddress);
        for (uint i = 0; i<15; i++) {
            UsersAtTreeLvl[uplineUsers[i]][i+1] += 1;
        }
    }
    /** 
     * @dev Deposit user internal balance with selected payment method (usdt, payment2, payment3)
     */
    function _depositBalance(address receiver, uint amount, uint paymentID) internal {
        if (paymentID == 0) {
            paymentID = _payment;
        }

        if (paymentID == 1) {
            Users[receiver].balance.usdt += amount;
        }
        if (paymentID == 2) {
            Users[receiver].balance.payment2 += amount;
        }
        if (paymentID == 3) {
            Users[receiver].balance.payment3 += amount;
        }
    }

    /** 
     * @dev Charge user internal balance with selected payment method (usdt, payment2, payment3)
     */
    function _chargeBalance(address receiver, uint amount, uint paymentID) internal {
        if (paymentID == 0) {
            paymentID = _payment;
        }

        if (paymentID == 1) {
            Users[receiver].balance.usdt -= amount;
        }
        if (paymentID == 2) {
            Users[receiver].balance.payment2 -= amount;
        }
        if (paymentID == 3) {
            Users[receiver].balance.payment3 -= amount;
        }
    }

    /** 
     * @dev Deposit user frozen balance on a tree level with selected payment method (usdt, payment2, payment3)
     */
    function _depositFrozenBalance(address receiver, uint amount, uint lvl, uint paymentID) internal {
        if (paymentID == 0) {
            paymentID = _payment;
        }

        if (paymentID == 1) {
            FrozenFunds[receiver][lvl].balance.usdt += amount;
        }
        if (paymentID == 2) {
            FrozenFunds[receiver][lvl].balance.payment2 += amount;
        }
        if (paymentID == 3) {
            FrozenFunds[receiver][lvl].balance.payment3 += amount;
        }
    }

    /** 
     * @dev Charge user frozen balance on a tree level with selected payment method (usdt, payment2, payment3)
     */
    function _chargeFrozenBalance(address receiver, uint amount, uint lvl, uint paymentID) internal {
        if (paymentID == 0) {
            paymentID = _payment;
        }

        if (paymentID == 1) {
            FrozenFunds[receiver][lvl].balance.usdt -= amount;
        }
        if (paymentID == 2) {
            FrozenFunds[receiver][lvl].balance.payment2 -= amount;
        }
        if (paymentID == 3) {
            FrozenFunds[receiver][lvl].balance.payment3 -= amount;
        }
    }

    /**
     * @dev Return instance of selected active payment contract.
     */
    function _getPaymentContract(uint paymentID) public view returns (IERC20 paymentContract){
        require(paymentID<=3,"[bPNM] Incorrect payment ID");

        if (paymentID == 0) {
            paymentID = _payment;
        }
        if (paymentID == 1) { 
            return usdt;
        }
        if (paymentID == 2) { 
            return payment2;
        }
        if (paymentID == 3) { 
            return payment3;
        }
    }

    /** 
     * @dev Wrapper for Limit Pack purchase by user. 
     * User should exist in bPNM, prior activation required.
     * Required internal USDT balance, balance should be deposited prior.
     * Can not purchase Limit Pack lower than current.
     * Can not purchase limit pack if after purchase earn limit balance would exceed 500% of purchasing limit pack
     * Can only be triggered after initial activate
    */
    function buyLimitPack(uint packID) onlyVerified onlyUnlocked public {
        require(isUserExists(msg.sender), "[bPNM] User not exists");
        require((packID>0&&(packID<=12)), "[bPNM] Incorrect pack ID");
        require(Users[msg.sender].limitPackId<=packID, "[bPNM] Can not downgrade limit pack");
        require(_addressPaymentBalance(msg.sender,0)>=limitPacks[packID].cost, "[bPNM] Not enough balance");
        require((Users[msg.sender].earnLimitLeft+limitPacks[packID].earnLimit)<=limitPacks[packID].earnLimit*5, "[bPNM] Max earn limit reached");
        
        _buyLimitPack(packID,msg.sender,0);
        //check if new liquidity can be released from PLD
        _pld.performUnlock();

        emit LimitPackPurchase(msg.sender,packID,true);
    }

    /**
     * @dev Limit pack purchase. This function can be triggered from buyLimitPack or automatically if auto-purchase is enabled by user.
     * Check if user own NFT, if owns then discount is applied as cashback. Not more than 10%
     * Deposit earn limit and bPNM purchase limit.
     * All frozen funds are checked if anything can be unfrozen or transferred to liquidity on timer expire.
     * GWT compensation of 20% from pack cost is accrued, doubled in Prestar mode.
     * Deposit tokens for NFT minting for each nftMintTokenTurnoverRequired in pack cost, not more than 5 for one pack purchase.
     */
    function _buyLimitPack(uint packID, address buyerAddress, uint paymentID) private returns (bool){
        //get payment from internal balance
        _chargeBalance(buyerAddress,limitPacks[packID].cost,paymentID);

        //check if have nft for payment discount
        uint totalNftRarity = nftCollection.getAddressTotalRarityLevel(buyerAddress);
        uint discountAmount;
        if (totalNftRarity > 0) {
            uint nftOwned = nftCollection.balanceOf(buyerAddress);
            discountAmount = limitPacks[packID].cost / 1e6 * (1200 * nftOwned - totalNftRarity) * nftDiscountForLimitPackPrice;
            if (discountAmount > limitPacks[packID].cost/10) {
                //discount can not be more than 10% of limit pack cost
                discountAmount = limitPacks[packID].cost/10;
            }
            //deposit discount back to balance
            _depositBalance(buyerAddress,discountAmount, paymentID);
        }

        //assign earn limit
        UserOverLimits[buyerAddress].totalEarnLimit += limitPacks[packID].earnLimit;//increase amount of earn limit deposited by limit packs for all time
        Users[buyerAddress].earnLimitLeft += limitPacks[packID].earnLimit;
        
        //set new packID
        Users[buyerAddress].limitPackId = packID;
        
        //check if any funds has to be released from frozen with new pack
        releaseFrozenFunds(buyerAddress,paymentID);
        uint buyLimitAmount = limitPacks[packID].cost*buyLimitMultiplier*1e18/_bpnm.getBtcPrice();

        //increase bPNM buy limit+totalBuyLimit at bPNM contract storage
        _bpnm.depositBuyLimit(buyLimitAmount, buyerAddress);
        
        //accrue gwt compensation
        if (_bpnm.prestartMode()) {
            //x2 for prestart
            require(gwt.mint(buyerAddress,limitPacks[packID].cost*limitPackPurchaseGwtCompensation*2/100),'[bPNM] GWT mint error');
        } else {
            require(gwt.mint(buyerAddress,limitPacks[packID].cost*limitPackPurchaseGwtCompensation/100),'[bPNM] GWT mint error');

        }

        //distribute bonus to tree upline
        uint moveToLiquidity = _uplineBonusDistribution(buyerAddress, limitPacks[packID].cost, false, paymentID);
        //transfer to fee collector
        IERC20 _paymentToken = _getPaymentContract(paymentID);

        _paymentToken.safeTransfer(feeCollector, limitPacks[packID].cost*feeCollectorFromPack/100);

        //transfer to liquidity not distributed rewards, substract discount granted by NFT
        _paymentToken.safeTransfer(liquidityCollector, moveToLiquidity+(limitPacks[packID].cost*liquidityCollectorFromPack/100)-discountAmount);
        
        //deposit NFT mint tokens if available
        uint leftTokenEmission = nftMintTokenMaxAmount-nftMintTokenDistributedAmount; 
        if (leftTokenEmission>0) {
            uint tokensAmount = limitPacks[packID].cost/nftMintTokenTurnoverRequired;
            //not more than 5 tokens from 1 pack purchase
            if (tokensAmount > 5) {
                tokensAmount = 5;
            }
            if (tokensAmount<=leftTokenEmission) {
                MintTokenBalance[buyerAddress] += tokensAmount;
                nftMintTokenDistributedAmount += tokensAmount;
            } 
            else {
                MintTokenBalance[buyerAddress] += leftTokenEmission;
                nftMintTokenDistributedAmount += leftTokenEmission;
            }
        }
        
        return(true);
    }

    /** 
     * @dev Function check 5-15 tree levels for frozen funds. 
     * Triggered automatically on new Limit Pack purchase, USDT withdrawal, earn limit purchase. 
     * Can be triggered manually.
     * If timer is overdue, funds are released to liquidityCollector.
     * If earn limit and limit pack allows then funds moved to internal balance. Earn limit used for unlock amount
     * Can unlock part of funds if available earn limit do not cover all.
     */
    function releaseFrozenFunds(address releaseAddress, uint paymentID) public {
        require(releaseAddress!=address(0),'[bPNM] Non zero address');
        require(paymentID<=3,"[bPNM] Incorrect payment ID");
        uint packID = Users[releaseAddress].limitPackId;
        uint maxUnlockedLvl = getLimitPack(packID).treeDepth;
        
        //iterate from level 5 to 15. At 1-4 funds can not be frozen.
        for (uint lvl=5;lvl<=15;lvl++) {
            //check if have funds at level to unfreeze
            uint frozenAmount = _addressFrozenBalance(releaseAddress,lvl,paymentID);
            
            //skip level if no frozen funds
            if (frozenAmount == 0) {
                continue;
            }

            //check if timer is not overdue, if overdue then move funds to liquidity
            if ((FrozenFunds[releaseAddress][lvl].startDate + treeLvls[lvl].maxFreezePeriod) < block.timestamp) {
                IERC20 _paymentToken = _getPaymentContract(paymentID);

                _paymentToken.safeTransfer(liquidityCollector, frozenAmount);
                //reset frozen amount
                _chargeFrozenBalance(releaseAddress,frozenAmount,lvl,paymentID);
                totalFrozen -= frozenAmount;
                //emit event that funds moved to liquidity
                emit LockedMovedToLiquidity(releaseAddress, frozenAmount, lvl);
                //proceed to next level
                continue;
            }

            //unfreeze frozen funds if left earnLimit allows + limit pack grant access to this level
            
            if (maxUnlockedLvl>=lvl) {
                uint unfreezeAmount;
                if ((Users[releaseAddress].earnLimitLeft>=frozenAmount)) {
                    unfreezeAmount = frozenAmount;
                } else {
                    unfreezeAmount = Users[releaseAddress].earnLimitLeft;
                } 

                _chargeFrozenBalance(releaseAddress,unfreezeAmount,lvl,paymentID);
                _depositBalance(releaseAddress,unfreezeAmount,paymentID);

                Users[releaseAddress].earnLimitLeft -= unfreezeAmount;
                Users[releaseAddress].totalEarned += unfreezeAmount;
                totalUsersEarnings += unfreezeAmount;
                totalFrozen -= unfreezeAmount;
                
                //emit event that locked funds are released
                emit LockedFundsReleased(releaseAddress, frozenAmount, lvl);

                }
        }
    }

    /** 
     * @dev Distribute unilevel reward from Limit Pack purchase or matching bonus reward to upline levels in the tree.
     * Reward deposited to internal USDT balance (or reserve active payment system)
     * Unilevel bonus distributed to 15 lvls up, or more if some levels are compresed
     * Matching bonus distributed to 10 lvls up starting from level 5, or more if some levels are compresed
     * Compress levels where earnLimit == 0
     * Compress level where matching bonus is expired for matching bonus rewards, starting from level 6
     * Check if user have extended tree marketing bonus of +1%
     * Check if deposited lvl is unlocked for user by limit pack, if locked then deposit to frozen
     * When deposit matching first 5 levels are skipped no matter if they have matching active or not, next levels are checked for compression
     * @param processedAmount Limit pack purchase cost, or matching bonus summ
     * @param isMatchingBonus If true then distribute matching reward, else from limit pack purchase
     * @return leftover return amount of not distributed bonus 
     */
    function _uplineBonusDistribution(address buyerAddress, uint processedAmount, bool isMatchingBonus, uint paymentID) private returns(uint leftover){
        //get 15 upper levels from tree
        address[15] memory uplineUsers = contractTree.getLvlsUp(buyerAddress);
        uint activeIndex = 0;//index where we at in the current upline addresses list
        uint8 overlimitLevel = 16;//level where to stop
        uint8 activeLevel = 1;//we need to distribute bonus to 15 levels up (10 lvls for matching, skipping first 5) skipping compressed levels
        if (isMatchingBonus) {
            activeIndex = 5;//index where we at in the current upline addresses list, matching bonus skips first 5 levels
            activeLevel = 6;//matching starts with lvl 6
        } 
        uint matchingBonusAmount = processedAmount/10;//each address get 0.5% from 5%
        uint usedBonus = 0;//part of bonus that is distributed
        uint accruedBonus;
        uint bonusPercent;//var for percent of tree bonus
        uint packCost = processedAmount;
        while(true) {
            //if we checked all 15 records for upline but did not generate 15 bonuses due to compression, we need to fetch new 15 records for upline
            if (activeIndex == 15) {
                uplineUsers = contractTree.getLvlsUp(uplineUsers[14]);
                activeIndex = 0;
            }
            
            //if we distributed all 15 bonuses, or if next upline is zero address (top of tree) then finish
            if ((activeLevel == overlimitLevel)||(uplineUsers[activeIndex]==address(0))) {
                break;
            }

            //compress and skip this level if earn limit = 0
            if (Users[uplineUsers[activeIndex]].earnLimitLeft == 0) {
                activeIndex += 1;
                continue;
            } 

            //if depositing matching bonus and user matching bonus activation is expired then compress and skip level
            if (isMatchingBonus&&(Users[uplineUsers[activeIndex]].matchingActiveUntil < block.timestamp)) { 
                activeIndex += 1;
                continue;
            }

            //if unilevel bonus and level 1-3 then go to next level
            if (!isMatchingBonus&&activeLevel<4) {
                activeIndex += 1;
                activeLevel += 1;
                continue;
            } 


            //user have earn limit, so check if this level is opened for his current limit pack
            if (!_isLvlOpened(uplineUsers[activeIndex],activeLevel)&&isMatchingBonus) {
                // Level Closed | Matching bonus
                //part of matching bonus has to be deposited to frozen
                accruedBonus = _depositFrozenBonusToUser(matchingBonusAmount*treeLvls[activeLevel].frozenPercent/100,uplineUsers[activeIndex],activeLevel,paymentID);
                usedBonus += accruedBonus;

                emit MatchingBonus(buyerAddress,uplineUsers[activeIndex],accruedBonus,activeLevel,paymentID,true);
            } else if (!_isLvlOpened(uplineUsers[activeIndex],activeLevel)&&!isMatchingBonus) {
                // Level Closed | Unilevel bonus
                //part of unilevel bonus has to be deposited to frozen
                accruedBonus = _depositFrozenBonusToUser(packCost*treeLvls[activeLevel].bonus*treeLvls[activeLevel].frozenPercent/10000, uplineUsers[activeIndex], activeLevel, paymentID);
                usedBonus += accruedBonus;

                emit TreeBonus(buyerAddress,uplineUsers[activeIndex],accruedBonus,activeLevel,paymentID,true);
            } else if (_isLvlOpened(uplineUsers[activeIndex],activeLevel)&&isMatchingBonus) {
                // Level Opened | Matching bonus
                //Matching bonus use earn limit and deposited to address internal balance
                accruedBonus = _depositBonusToUser(matchingBonusAmount, uplineUsers[activeIndex], paymentID);
                usedBonus += accruedBonus;

                emit MatchingBonus(buyerAddress,uplineUsers[activeIndex],accruedBonus,activeLevel,paymentID,false);
            } else if (_isLvlOpened(uplineUsers[activeIndex],activeLevel)&&!isMatchingBonus) {
                // Level Opened | Unilevel bonus
                //Unilevel bonus use earn limit and deposited to address internal balance
                bonusPercent = treeLvls[activeLevel].bonus;
                
                //check if additional +1% has to be applied for this address and tree level
                if (Users[uplineUsers[activeIndex]].extendedTreeLvl >= activeLevel) {
                    bonusPercent += 1;
                } 

                accruedBonus = _depositBonusToUser(packCost*bonusPercent/100, uplineUsers[activeIndex], paymentID);
                usedBonus += accruedBonus;

                emit TreeBonus(buyerAddress,uplineUsers[activeIndex],accruedBonus,activeLevel,paymentID,false);

            }
                
            //increase user network turnover
            if (!isMatchingBonus) {
                Users[uplineUsers[activeIndex]].networkTurnover += packCost;
            }
            activeIndex += 1;
            activeLevel += 1;
            

        }

        //return amount of bonus that has not been used, so it can be returned to liquidity
        if (isMatchingBonus) {
            return(processedAmount-usedBonus);
        } else {
            return(processedAmount*marketingDistributionFromPack/100-usedBonus);
        }


    }

    /**
     * @dev Check if current user's Limit Pack is qualified to get bonus from requested level
     */
    function _isLvlOpened(address checkedAddress, uint lvl) private view returns (bool isOpened) {
        return(getLimitPack(Users[checkedAddress].limitPackId).treeDepth >= lvl);
    }

    /** 
     * @dev Deposit USDT bonus to a user internal balance. Triggered when bonus are generated for user
     * Check if new limit pack purchase should be triggered if left earn limit do not cover whole bonus
     * Check if earn limit cover all bonus
     * Decrease earn limit for deposited amount
     * Charge 10% fee if active Limit Pack is for 150 USDT or higher
     * If not enough earn limit use max possible, excess bonus goes to liquidity
     * @param depositAmount Amount in USDT how much has to be deposited
     * @return  depositedAmount Amount that deposited to user
     */
    function _depositBonusToUser(uint depositAmount, address receiver, uint paymentID) private returns (uint depositedAmount){
        //charge 10% fee if Limit Pack for 150 USDT or higher
        if (Users[receiver].limitPackId >= 5) {
            depositAmount = depositAmount*90/100;
        }

        //if user earn limit left is less or equal to deposited bonus then try to purchase new Limit Pack to fill earn limit
        if (Users[receiver].earnLimitLeft<=depositAmount) {
            //check if auto renew limit pack is enabled and user have enough internal balance
            if (Users[receiver].limitPackAutoRenew&&(_addressPaymentBalance(receiver,paymentID)>=limitPacks[Users[receiver].limitPackId].cost)) {
                _buyLimitPack(Users[receiver].limitPackId,receiver,paymentID);
                emit LimitPackPurchase(receiver,Users[receiver].limitPackId,false);
            }
        }
        
        //Check if earn limit cover whole bonus
        if (Users[receiver].earnLimitLeft>=depositAmount) {
            //all bonus covered by limit
            _depositBalance(receiver,depositAmount,paymentID);
            //decrease earn limit
            Users[receiver].earnLimitLeft -= depositAmount;
            //increase total earned
            Users[receiver].totalEarned += depositAmount;
            totalUsersEarnings += depositAmount;

            //return deposited amount
            return(depositAmount);
        } else {
            //deposit amount equal to left earn limit, else goes to liquidity
            uint deposited = Users[receiver].earnLimitLeft;
            //deposit amount equal to earn limit
            _depositBalance(receiver, deposited, paymentID);
            //set earn limit to 0
            Users[receiver].earnLimitLeft = 0;
            //increase total earned
            Users[receiver].totalEarned += deposited;
            totalUsersEarnings += deposited;

            //return deposited amount
            return(deposited);

        }

    }
    
    /** 
     * @dev Triggered when tree level is not unlocked by user Limit Pack. Deposit funds to user frozen funds for specified tree level
     * Set timer on first deposit
     * If timer for freeze is overdue then move all funds to liquidity from specified level
     * If Limit Pack for 150 USDT or higher then get 10% fee on frozen amount
     * @param amount Amount to be deposited to frozen. Comes with already substracted percent
     * @param receiver Receiver address
     * @param lvl Level for which to deposit
     * @return usedAmount Amount that has been deposited to frozen
     */
    function _depositFrozenBonusToUser(uint amount, address receiver, uint lvl, uint paymentID) private returns(uint usedAmount){
        //if this is first deposit, then set timer
        if (FrozenFunds[receiver][lvl].startDate == 0) {
            FrozenFunds[receiver][lvl].startDate = block.timestamp;
        }

        //if timer is overdue then move all funds to liquidity and reset frozen funds
        if ((FrozenFunds[receiver][lvl].startDate + treeLvls[lvl].maxFreezePeriod) < block.timestamp) {
            uint frozenLevelBalance = _addressFrozenBalance(receiver,lvl, paymentID);
            
            if (frozenLevelBalance == 0) {
                return(0);
            }

            //move all frozen funds to liquidity
            IERC20 _paymentToken = _getPaymentContract(paymentID);
            _paymentToken.safeTransfer(liquidityCollector, frozenLevelBalance);
            //reset frozen amount
            _chargeFrozenBalance(receiver, frozenLevelBalance, lvl, paymentID);
            totalFrozen -= frozenLevelBalance;
            return(0);
        } else {
            //timer is not overdue so deposit to frozen balance of corresponding level
            //charge 10% fee if Limit Pack for 150 USDT or higher
            if (Users[receiver].limitPackId >= 5) {
                amount = amount*90/100;
            }

            _depositFrozenBalance(receiver,amount,lvl,paymentID);  
            totalFrozen += amount;
            return(amount);
        }
    }

    /**
     * @dev User USDT internal balance deposit wrapper
     */
    function replenishPaymentBalance(uint amount) onlyVerified onlyUnlocked public {
        require(isUserExists(msg.sender), "[bPNM] User not exists");
        _replenishPaymentBalance(amount, msg.sender);
    }

    /** 
     * @dev Replenish user balance with currently active payment token, USDT by default
     * Only user who already activated can deposit
     * Can be triggered by other msg.sender user in case of first activation, then msg.sender replenish new user balance for limit pack payment amount
     */
    function _replenishPaymentBalance(uint amount, address receiverAddress) private {
        IERC20 _paymentToken = _getPaymentContract(0);
        _paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        
        _depositBalance(receiverAddress,amount,0);
        emit Deposit(receiverAddress,_payment,amount);
    }

    /** 
     * @dev Withdraw internal balance to external contract using selected payment contract
     * Fee automatically decreased with ownable NFT. Not more than 5%
     * If GWT provided for fee compensation it will be calculated after NFT discount. GWT+NFT discount not more than 5%
     * 5% is used for matching bonus distribution to upline
     * Left fee after matching distribution anf GWT+NFT compensation moved to USDT liquidity
     * All tree levels are checked if frozen funds can be unlocked.
     * @param withdrawAmount USDT amount to withdraw
     * @param compensateGWT USDT fee amount compensated by GWT. 1 USDT of fee = 1 GWT. Not more than 5%
     */
    function withdrawBalance(uint withdrawAmount, uint compensateGWT, uint paymentID) public {
        require(isUserExists(msg.sender), "[bPNM] User not exists");
        require((paymentID>0)&&(paymentID<=3), "[bPNM] Incorrect payment ID");//1 - USDT, 2 - payment2, 3 - payment3
        require(gwt.balanceOf(msg.sender) >= compensateGWT,"[bPNM] Not enough GWT to compensate");
        require(_addressPaymentBalance(msg.sender,paymentID) >= withdrawAmount,"[bPNM] Not enough payment balance for withdraw");
        
        //payment reserved for matching bonus
        uint matchingPayment = withdrawAmount*withdrawMinFee/100;
        //max fee that can be applied excluding matching bonus
        uint maxFee = withdrawAmount*withdrawBaseFee/100 - matchingPayment;
        
        //check if have NFT discount
        uint totalNftRarity = nftCollection.getAddressTotalRarityLevel(msg.sender);
        uint nftDiscountAmount;

        if (totalNftRarity > 0) {
            //each NFT rarity calcs as 1200 - NFT rarity.
            uint nftOwned = nftCollection.balanceOf(msg.sender);
            nftDiscountAmount = withdrawAmount * (1200*nftOwned-totalNftRarity) * nftDiscountForWithdraw / 1e6;
            //decrease maxFee for discount granted with NFT owning
            nftDiscountAmount >= maxFee ? maxFee = 0 : maxFee -= nftDiscountAmount;
            
        }

        //check if left fee can be compensated with GWT
        if ((compensateGWT > 0)&&(maxFee>0)) {
            if (compensateGWT >= maxFee) {
                require(gwt.burn(msg.sender,maxFee),'[bPNM] GWT burn error');
                maxFee = 0;
            } else {
                require(gwt.burn(msg.sender,compensateGWT),'[bPNM] GWT burn error');
                maxFee -= compensateGWT;
            }
        }

        IERC20 _paymentToken = _getPaymentContract(paymentID);

        //transfer usdt minus fee
        _chargeBalance(msg.sender,withdrawAmount,paymentID);
        _paymentToken.safeTransfer(msg.sender, withdrawAmount-matchingPayment-maxFee);

        //distribute matching bonus for tree upline
        uint unspentBonusFromMatching = _uplineBonusDistribution(msg.sender, matchingPayment, true, paymentID);
        
        //move to liquidity uncompensated fee + not distributed matching bonus 
        _paymentToken.safeTransfer(liquidityCollector, unspentBonusFromMatching+maxFee);

        //check if any funds has to be released from frozen balances of tree levels
        releaseFrozenFunds(msg.sender,paymentID);
        
        emit Withdraw(msg.sender,paymentID,withdrawAmount);
        
    }

    /** 
     * @dev Return amount of address available internal balance in selected paymentID (usdt, payment2, payment3)
     * 0 to auto select currently active balance
     */
    function _addressPaymentBalance(address _address, uint paymentID) internal view returns (uint balance) {
        if (paymentID == 0) {
            paymentID = _payment;
        }
        if (paymentID == 1) {
            return Users[_address].balance.usdt;
        }
        if (paymentID == 2) {
            return Users[_address].balance.payment2;
        }
        if (paymentID == 3) {
            return Users[_address].balance.payment3;
        }
    }

    /** 
     * @dev Return amount of address balance frozen in a specified tree level for selected paymentID (usdt, payment2, payment3)
     * 0 to auto select currently active balance
     */
    function _addressFrozenBalance(address _address, uint lvl, uint paymentID) internal view returns (uint balance) {
        if (paymentID == 0) {
            paymentID = _payment;
        }

        if (paymentID == 1) {
            return FrozenFunds[_address][lvl].balance.usdt;
        }
        if (paymentID == 2) {
            return FrozenFunds[_address][lvl].balance.payment2;
        }
        if (paymentID == 3) {
            return FrozenFunds[_address][lvl].balance.payment3;
        }
    }

    /** 
     * @dev Return frozen balance + timers of each level for address in selected payment contract balance
     * 
     */
    function addressFrozenTotal(address _address, uint paymentID) public view returns (uint[15] memory frozenAmount, uint[15] memory startDates) {
        require(paymentID <= 3, "[bPNM] Incorrect payment ID");

        uint[15] memory balances;

        if (paymentID == 0) {
            paymentID = _payment;
        }

        for (uint lvl = 0; lvl <= 14; lvl++) {
            if (paymentID == 1) {
                balances[lvl] = FrozenFunds[_address][lvl+1].balance.usdt;
            } else if (paymentID == 2) {
                balances[lvl] = FrozenFunds[_address][lvl+1].balance.payment2;
            } else if (paymentID == 3) {
                balances[lvl] = FrozenFunds[_address][lvl+1].balance.payment3;
            }
            startDates[lvl] = FrozenFunds[_address][lvl+1].startDate;
        }

        return (balances, startDates);
    }

    /** 
     * @dev Function to extend matching bonus for 30 days
     * Can not be more than 90 days total
     * NFT owning can grant discount up to 30%
     * Fee for 2 USDT is applied
     * Payment is processed with GWT token
     */
    function extendMatchingBonus() public onlyActivated{
        require((Users[msg.sender].matchingActiveUntil+matchingBonusExtendPeriod)<=(block.timestamp+matchingMaxPeriod),"[bPNM] Max days reached");
        //check if have NFT discount
        uint totalNftRarity = nftCollection.getAddressTotalRarityLevel(msg.sender);
        uint discountAmount;
        uint finalPaymentAmount = matchingBonusGwtCost;
        if (totalNftRarity > 0) {
            uint nftOwned = nftCollection.balanceOf(msg.sender);
            discountAmount = matchingBonusGwtCost * (nftOwned*1200 - totalNftRarity) * nftDiscountForMatchingPayment / 1e6;
            if (discountAmount > matchingBonusGwtCost*30/100) {
                //discount can not be more than 30% of cost
                discountAmount = matchingBonusGwtCost*30/100;
            }
            //decrease price for discount
            finalPaymentAmount -= discountAmount;
        }

        require(gwt.balanceOf(msg.sender) >= finalPaymentAmount,"[bPNM] Not enough GWT to extend matching bonus");
        //get usdt fee
        _payFeeForGWTtrans();

        //burn GWT for payment
        require(gwt.burn(msg.sender,finalPaymentAmount),'[bPNM] GWT burn error');

        //emit event 
        emit MatchingBonusExtended(msg.sender,finalPaymentAmount,matchingBonusExtendPeriod);
        
        //add days to date        
        if (Users[msg.sender].matchingActiveUntil >= block.timestamp) {
            //matching is active
            Users[msg.sender].matchingActiveUntil += matchingBonusExtendPeriod;
            return();
        } else {
            //matching not active or expired
            Users[msg.sender].matchingActiveUntil = block.timestamp + matchingBonusExtendPeriod;
            return();
        }
    }

    /** 
     * @dev Inverse limit pack auto renew
     * Can be enabled only when current limit pack is for 250 USDT or higher
     */
    function toggleLimitPackAutoRenew() public onlyActivated{
        require(Users[msg.sender].limitPackId >= 7, "[bPNM] Limit pack for 250 USDT or higher required");
        Users[msg.sender].limitPackAutoRenew = !Users[msg.sender].limitPackAutoRenew;
    }

    /** 
     * @dev Purchase additional earn limit with GWT
     * Limit Pack for 150 USDT or higher is required
     * Can not exceed 10% of total amount of received earn limit from limit packs purchase
     * Fee in USDT is taken
     * All tree levels are checked if frozen funds can be unlocked after new earn limit is added
     * @param earnLimitAmount Amount of USDT earn limit to be purchased
     */
    function buyEarnLimitWithGwt(uint earnLimitAmount) public onlyActivated{
        require(earnLimitAmount>0,"[bPNM] Need more than 0");
        require(Users[msg.sender].limitPackId>=5,"[bPNM] 150 USDT or higher Limit Pack required");
        require(UserOverLimits[msg.sender].totalEarnLimit*earnLimitExtra/100>=earnLimitAmount+UserOverLimits[msg.sender].purchasedEarnLimit, "[bPNM] Amount exceeds 10%");

        //get usdt fee
        _payFeeForGWTtrans();

        //burn GWT for payment
        require(gwt.burn(msg.sender,earnLimitAmount*1e18/earnLimitExtraPerGwt),'[bPNM] GWT burn error');

        //deposit additional limit
        UserOverLimits[msg.sender].purchasedEarnLimit += earnLimitAmount;//increase purchased amount
        Users[msg.sender].earnLimitLeft += earnLimitAmount;//increase left limit

        //check if any funds has to be released from frozen with new limit
        releaseFrozenFunds(msg.sender,_payment);

        //emit event
        emit EarnLimitPurchase(msg.sender,earnLimitAmount*1e18/earnLimitExtraPerGwt,earnLimitAmount);
    }

    /** 
     * @dev Mint NFT from consultants collection with mint token
     *  In order to mint NFT mint token is required. Mint tokens provided when purchasing limit pack
     */
    function mintNFT() public onlyActivated {
        //check that user have NFT tokens to mint
        require(MintTokenBalance[msg.sender] > 0,'[bPNM] Not enough mint tokens');
        //burn 1 mint token
        MintTokenBalance[msg.sender] -= 1;
        //mint NFT
        nftCollection.mintNFT(msg.sender);
    }

    /**
     * @dev Add +1% for unilevel bonus received from tree level.
     * Levels are unlocked one after another starting from level 4. 
     * One level can be unlocked on one function call.
     * Fee 2 USDT is applied for transaction.
     * NFT owning grant discount not more than 10%
     */
    function extendLvlMarketingBonus() public onlyActivated {
        uint currentLvl = Users[msg.sender].extendedTreeLvl;
        require(currentLvl<15,'[bPNM] Max level purchased');
        uint nextLvlCost = additionalPercentCost[4];//cost to unlock lvl4
        if (currentLvl >= 4) {
            nextLvlCost = additionalPercentCost[currentLvl+1];
        }
        
        //take fee
        _payFeeForGWTtrans();

        //check if have nft for payment discount
        uint totalNftRarity = nftCollection.getAddressTotalRarityLevel(msg.sender);
        uint discountAmount;
        if (totalNftRarity > 0) {
            uint nftOwned = nftCollection.balanceOf(msg.sender);
            discountAmount = nextLvlCost * (1200*nftOwned - totalNftRarity) * nftDiscountForAdditionalMarketingPercent / 1e6;
            if (discountAmount > nextLvlCost/10) {
                //discount can not be more than 10% of cost
                discountAmount = nextLvlCost/10;
            }
            nextLvlCost -= discountAmount;
        }
        
        //burn GWT for payment amount
        require(gwt.balanceOf(msg.sender)>=nextLvlCost,'[bPNM] Not enough GWT');
        require(gwt.burn(msg.sender,nextLvlCost),'[bPNM] GWT burn error');
        
        //activate level
        if (currentLvl == 0) {
            Users[msg.sender].extendedTreeLvl = 4;

        } else {
            Users[msg.sender].extendedTreeLvl += 1;
        }        

        emit ExtendLvlBonus(msg.sender, nextLvlCost, Users[msg.sender].extendedTreeLvl);
    }

    /**
     * @dev get array of users at each tree level that activated at bPNM
     */
    function getTreeNetwork(address account) external view returns(uint[15] memory networkAtLevel) {
        for (uint i=0;i<15;i++) {
            networkAtLevel[i] = UsersAtTreeLvl[account][i+1];
        }
        return(networkAtLevel);
    }

    /**
     * @dev USDT fee payment 
     * Use currently active payment contract, USDT by default
     */
    function _payFeeForGWTtrans() private {
        //pay fee in USDT, to feeCollector and liquidityCollector
        IERC20 _paymentToken = _getPaymentContract(0);

        _paymentToken.safeTransferFrom(msg.sender, feeCollector, gwtTransFeeCollector);
        _paymentToken.safeTransferFrom(msg.sender, liquidityCollector, gwtTransFeeLiquidity);
        

    }

    /**
     * Section for updating mutable parameters in predefined ranges
     */


    function setBuyLimitMultiplier(uint amount) external onlyPromoter {
        require(3<=amount&&amount<=5, '[bPNM] Out of range');
        buyLimitMultiplier = amount;
    }

    function setLimitPackPurchaseGwtCompensation(uint amount) external onlyPromoter {
        require(10<=amount&&amount<=25, '[bPNM] Out of range');
        limitPackPurchaseGwtCompensation = amount;
    }

    function setMatchingBonusGwtCost(uint amount) external onlyPromoter {
        require(200e18<=amount&&amount<=500e18, '[bPNM] Out of range');
        matchingBonusGwtCost = amount;
    }

    function setMatchingBonusExtendPeriod(uint amount) external onlyPromoter {
        require(30<=amount&&amount<=45, '[bPNM] Out of range');
        matchingBonusExtendPeriod = amount * 1 days;
    }

    function setEarnLimitExtraPerGwt(uint amount) external onlyPromoter {
        require(2e18<=amount&&amount<=5e18, '[bPNM] Out of range');
        earnLimitExtraPerGwt = amount;
    }

    function setWithdrawBaseFee(uint amount) external onlyPromoter {
        require(6<=amount&&amount<=10, '[bPNM] Out of range');
        withdrawBaseFee = amount;
    }

    function setNftMintTokenMaxAmount(uint amount) external onlyPromoter {
        require(3000<=amount&&amount<=10000, '[bPNM] Out of range');
        nftMintTokenMaxAmount = amount;
    }

    function setNftMintTokenTurnoverRequired(uint amount) external onlyPromoter {
        require(500e18<=amount&&amount<=5000e18, '[bPNM] Out of range');
        nftMintTokenTurnoverRequired = amount;
    }

    function setNftDiscountForLimitPackPrice(uint amount) external onlyPromoter {
        require(1<=amount&&amount<=20, '[bPNM] Out of range');
        nftDiscountForLimitPackPrice = amount;
    }

    function setNftDiscountForMatchingPayment(uint amount) external onlyPromoter {
        require(1<=amount&&amount<=20, '[bPNM] Out of range');
        nftDiscountForMatchingPayment = amount;
    }

    function setNftDiscountForAdditionalMarketingPercent(uint amount) external onlyPromoter {
        require(1<=amount&&amount<=20, '[bPNM] Out of range');
        nftDiscountForAdditionalMarketingPercent = amount;
    }

    function setNftDiscountForWithdraw(uint amount) external onlyPromoter {
        require(1<=amount&&amount<=20, '[bPNM] Out of range');
        nftDiscountForWithdraw = amount;
    }

    /**
     * @dev Change fee in USDT that goes to USDT liquidity when limits/options bought with GWT
     * Should be in range 0-2 USDT
     */
    function setgwtTransFeeLiquidity(uint amount) external onlyPromoter {
        require(amount<=2e18, '[bPNM] Out of range');
        gwtTransFeeLiquidity = amount;
    }

    /**
     * @dev Changing address of feeCollector
     */
    function changeFeeCollector(address newCollector) external onlyOwner {
        require(newCollector!=address(0),'[bPNM] Non zero address');
        feeCollector = newCollector;
    }

    /**
     * @dev Changing address of usdt liquidityCollector
     */
    function changeLiquidityCollector(address newCollector) external onlyOwner {
        require(newCollector!=address(0),'[bPNM] Non zero address');
        liquidityCollector = newCollector;
    }


    //Update settings section END


    /**
     * @dev Setting address of btcbLiquidityCollector
     * Should be triggered after bPNM deployment once PLD address is deployed and address is known.
     * Once address is set it cannot be changed in the future
     */
    function initBtcbLiquidityCollector(PLD pldContract) external onlyOwner {
        require(address(pldContract)!=address(0),'[bPNM] Non zero address');
        require(address(_pld)==address(0),'[bPNM] Already set');
                
        _pld = pldContract;
    }


    /**
     * @dev Lock/unlock functions
     * Affected functions: activate / buyLimitPack / replenishPaymentBalance
     */
    function triggerLock() external onlyOwner() {
        isLocked = !isLocked;
    }

    /**
     * @dev Check if user is in struct so activated
     */
    modifier onlyActivated() { 
        require(Users[msg.sender].referrer != address(0)||msg.sender==firstUser, "[bPNM] Please activate first"); 
        _; 
    }

    /**
     * @dev Check if user activated at bPNM
     */    
    function isUserExists(address user) public view returns (bool) {
        return (Users[user].referrer != address(0)||user==firstUser);
    }

    /**
     * @dev Changing address of _promoter
     */
    function changePromoter(address newPromoter) external onlyOwner {
        require(newPromoter!=address(0),'[bPNM] Non zero address');
        _promoter = newPromoter;
    }

    /**
     * @dev Check if caller is promoter or owner
     */
    modifier onlyPromoter() { 
        require(msg.sender == _promoter||msg.sender==owner(), "[bPNM] Need promoter or higher"); 
        _; 
    }


    /**
     * @dev User verification status check
     * activate / buyLimitPack / replenishPaymentBalance
     */
    modifier onlyVerified() { 
        if (_bpnm._verificationNeeded()) {
            require(_bpnm.IsVerified(msg.sender) || msg.sender == owner(),"[bPNM] Need to verify"); 
        }
        _; 
    }

    /**
     * @dev Contract functions lock
     * activate / buyLimitPack / replenishPaymentBalance
     */
    modifier onlyUnlocked() { 
        require(!isLocked || msg.sender == owner(),"[bPNM] Locked"); 
        _; 
    }

 /**
     * @dev Switch payment system.
     * USDT used by default. payment2 and payment3 are alternatives (like USDC or DAI)
     * User have balance for each payment system to not mix balances
     * Each tree level have frozen balances in 3 payment systems.
     * Once payment system is changed unlock of frozen funds or withdrawal for previously used payment system has to be triggered manually
     * payment2 and payment3 can be filled with address only once
     */
    function switchPayment(IERC20 newPaymentContract, uint paymentID) public onlyOwner {
        require(address(newPaymentContract)!=address(0),'[bPNM] Non zero address');
        require(paymentID>0&&paymentID<=3,'[bPNM] Incorrect payment ID');
        require(newPaymentContract.totalSupply() > 0, "[bPNM] Not a valid IERC20 contract");

        if (paymentID == 2&&address(payment2)==address(0)) {
            payment2 = newPaymentContract;
        }
        if (paymentID == 3&&address(payment3)==address(0)) {
            payment3 = newPaymentContract;
        }
        _payment = paymentID;
    }

}