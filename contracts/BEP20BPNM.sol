// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

//using OZ version 4.9.3 for compatibility with Phenomenal Tree and GWT
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20Metadata {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}


/**
 * @dev Interface for a phenomenal tree contract.
 */
interface PhenomenalTreeInt {

    function positionUser(address newUser, address referrerAddress, uint8 lvlsDeep) external;
    function getLvlsUp(address searchedAddress) external view returns(address[15] memory);
    function treeUsers(address user) external view returns (address, address, address, address);
    function isUserexist(address userAddress) external view returns(bool);
    function calcTreeNetwork(address _userAddress, uint _depth ) external view returns(uint);

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
 * @dev Interface for Binance and ChainLink oracles for BTC/USD price.
 */

interface Oracles {

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80);

}

/**
 * @dev Interface for Phenomenal Liquidity Distributor.
 */

interface PLD {

    function performUnlock() external returns (bool);
    
}

/**
 * @dev Main contract of bPNM. Implementation of modified ERC20 bPNM token, initial address activation, limit packs purchase and marketplace.
 * Should be connected with Phenomenal tree, GWT token, Phenomenal Liquidity Distributor and NFT consultants collection.
 */
contract BEP20BPNM is IERC20Metadata, Ownable {
    using SafeERC20 for IERC20;
    IERC20 public usdt;// Main limit packs payment method. Activated by default
    IERC20 public payment2;// Alternative limit packs payment method. Can be switched from USDT or payment3
    IERC20 public payment3;// Alternative limit packs payment method. Can be switched from USDT or payment2
    IERC20 public btcb;
    PhenomenalTreeInt public contractTree;
    NftConsultantsInt public nftCollection;
    PLD public _pld;
    GWT public gwt;
    Oracles public constant _chainLinkBtcOracle = Oracles(0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf);
    Oracles public constant _binanceBtcOracle = Oracles(0x83968bCa5874D11e02fD80444cDDB431a1DbEc0f);
    
    address private _promoter;//address for enabling promotion conditions
    address private _verificator;//address for verifying addresses
    address private _marketplaceAdministrator;//address for marketplace administration
    address immutable private firstUser;

    address private feeCollector;//address for earning fees
    address public liquidityCollector;//USDT liquidity collector
    address public phenomenalLiquidityDistributor;//Phenomenal Liquidity Distributor (PLD), BTCB liquidity collector/distributor
    bool private PLDinited;//PLD can be inited only once

    uint public totalUsers = 0;
    uint public totalUsersEarnings = 0;//Total user USDT earnings accumulated for all time.
    uint public totalFrozen = 0;//Total user USDT earnings frozen on tree levels right now
    
    uint public buyLimitMultiplier = 4;//Multiplier applied to limit pack cost to calculate bPNM token purchase limit
    uint public sellLimitMultiplier = 15;//Multiplier applied to token purchase amount (15 = 150%), to calculate max token value to sell. 

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
    uint immutable public buyLimitExtra = 10;//Max 10% of extra bPNM buy limit user can purchase. Calculated from total accrued buy limit
    uint public buyLimitExtraPerGwt = 5e18;//Amount of USDT buy limit for bPNM purchase accrued for each 1 GWT
    uint immutable public sellLimitExtra = 10;//Max 10% of extra bPNM sell limit user can buy. Calculated from all sell limit deposited with bPNM purchases
    uint public sellLimitExtraPerGwt = 5e18;//Amount of USDT sell limit for bPNM sell accrued for each 1 GWT
    
    uint public withdrawBaseFee = 10;//Base withdraw fee percent. Can be 6-10
    uint immutable public withdrawMinFee = 5;//Min withdraw fee percent. Immutable, used for matching bonus distribution.

    uint private totalbPNM = 0;//Total amount of bPNM tokens
    uint immutable public minbPNMBuyBtcbAmount = 1e14;//Min amount of BTCB that can be used to purchase bPNM at one transaction = 0.0001 BTCB
    
    uint public bpnmBuyFee = 15;//Fee in percent for bPNM purchase
    uint public bpnmSellFee = 5;//Fee in percent for bPNM sell

    bool public isLocked = true;//Global lock, locks activate/buybPNM/deposit/buy limit pack
    bool public prestartMode = true;//Activated on deploy. Allow only activate and limit pack purchase. Can be disabled once
    
    uint public nftMintTokenMaxAmount = 3000;//Max amount of tokens to mint NFT. Can be increased up to 10 000
    uint public nftMintTokenDistributedAmount=20;//Distributed amount of tokens to mint NFT. First 20 pre-minted
    uint public nftMintTokenTurnoverRequired = 500e18;//Amount of turnover required to get 1 NFT mint token.
    
    uint public nftDiscountForLimitPackPrice = 10;//Amount of discount user get for each point of rarity for LP purchase. 1 = 0.0001%. Rarity calcs as 1200-NFT rarity. With rarity = 1000 total discount is 1000*0.0001%*10=1%. Max 10%
    uint public nftDiscountForMatchingPayment = 10;//Amount of discount user get for each point of rarity for matching GWT payment. 1 = 0.0001%. With rarity = 1000 total discount is 1000*0.001%*10=1%. Max 30%
    uint public nftDiscountForAdditionalMarketingPercent = 10;//Amount of discount user get for each point of rarity for marketing additional +1% GWT payment. Rarity calcs as 1200-NFT rarity. 1 = 0.0001%. With rarity = 1000 total discount is 1000*0.001%*10=1%. Max 10%
    uint public nftDiscountForWithdraw = 10;//Amount of discount user get for each point of rarity for balance withdraw (USDT by default). Rarity calcs as 1200-NFT rarity. 1 = 0.0001%. With rarity = 1000 total discount is 1000*0.0001%*10=1%. Max 5%
    
    
    uint public totalMarketplaceItems;//Amount of marketplace items

    string private _name;
    string private _symbol;
    
    bool private _verificationNeeded;//if address verification is needed

    uint public _payment = 1;//ID of active payment method for Limit Pack purchase, usdt == 1, payment2 == 2, payment3 == 3
    uint public _usedBtcOracle = 0;//0 = both used, latest BTC price selected. 1 - Used only Binance oracle, 2 - Used only ChainLink oracle

    limitPack[] public limitPacks;//List of limit packs
    treeLvlData[] public treeLvls;//List of tree levels config
    uint256[16] public additionalPercentCost;//Cost to unlock marketing +1% for each level. Starts with element ID 1

    struct User {
        address referrer;//By whom user has been referred to bPNM
        uint bpnmBalance;//User bPNM balance
        _balance balance;//USDT/Paymnet2/Payment3 balances
        uint earnLimitLeft;//Amount of left earn limit
        uint buyLimitLeft;//Amount of left limit to buy bPNM, in BTCB
        uint sellLimitLeft;//Amount of left limit to sell bPNM, in BTCB
        uint totalEarned;//Total rewards received from 15 lvls down from tree. Unilevel and matching bonus.
        uint networkTurnover;//Total turnover generated by network in a 15 lvl tree depth with Limit Packs purchases
        uint limitPackId;//Currently active limit pack by ID, starting from 1
        uint extendedTreeLvl;//Max extended tree level, added +1% for marketing bonus to levels below including this
        bool limitPackAutoRenew;//If enabled, new limit pack will be purchased when earn limit comes to an end
        uint matchingActiveUntil;//Date when matching bonus is expiring, should be extended with GWT payment
        
    }

    struct _balance {
        uint usdt;//User USDT balance
        uint payment2;//User payment2 balance. Reserve, might be used if moved from usdt to new payment token.
        uint payment3;//User payment3 balance. Reseve, might be used if moved from usdt to new payment token.
    }

    struct _balanceFrozen {
        uint usdt;//Frozen USDT balance. Struct used for each tree Lvl
        uint payment2;//Frozen payment2 balance. Reserve, might be used if moved from usdt to new payment token.
        uint payment3;//Frozen payment3 balance. Reseve, might be used if moved from usdt to new payment token.
    }

    struct frozenFundsStruct {
        _balanceFrozen balance;//amount of frozen funds on a level
        uint startDate;//date from which frozen period timer starts for this level
    }

    struct limitPack {
        uint cost;//cost of limit pack
        uint treeDepth;//max tree depth unlocked by limit pack
        uint earnLimit;//earn limit deposited with limit pack purchase
        
    }

    struct treeLvlData {
        uint bonus;//bonus in percent from limit pack purchases on this level
        uint frozenPercent;//percent of funds that is frozen when corresponding tree level is not unlocked with limit pack
        uint maxFreezePeriod;//period of time before frozen funds are transferred to liquidity
        
    }

    struct limitsPurchases {
        uint totalEarnLimit;//total amount of earn limit deposited from limit pack purchase
        uint purchasedEarnLimit;//amount of purchased earn limit with GWT, can not increase 10% of total deposited earn limit from packs
        
        uint totalBuyLimit;//total amount of bPNM buy limit deposited from limit pack purchase 
        uint purchasedBuyLimit;//amount of purchased buy limit with GWT, can not increase 10% of total deposited buy limit from packs
        
        uint totalSellLimit;//total amount of bPNM sell limit deposited from bPNM purchase
        uint purchasedSellLimit;//amount of purchased sell limit with GWT, can not increase 10% of total deposited sell limit
    }

    struct marketplaceItem {
        string name;//Item name
        string claimLink;//Item claim link, website etc. Provided by seller
        uint bpnmPrice;//Item price in bPNM
        
        bool isVerifyRequired;//if buyer verification required
        bool isLiquidityCompensated;//true if item cost should be compensated to sellerAddress with BTCB from liquidity
        
        bool isActive;
        address sellerAddress;
    }



    mapping(address => User) public Users;
    mapping(address => string) public AddressToUsername;
    mapping(address => uint) public MintTokenBalance;//amount of mint tokens user have. Required for NFT minting
    mapping(address => limitsPurchases) public UserOverLimits;
    mapping(address => frozenFundsStruct[16]) public FrozenFunds;//mapping for user frozen funds, count starts from 1 to 15
    mapping(address => bool) public IsVerified;//user verification
    mapping(uint => marketplaceItem) public Marketplace;//marketplace items
    mapping(address => uint[]) public UserOwnedMarketItems;//Marketplace items owned by address
    mapping(address => uint[16]) public UsersAtTreeLvl;//Amount of addresses on each tree lvl. Starts from 1




    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     * Only used for _burn and _mint because bPNM can not be transferred to another address
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Deposit(address indexed sender, uint paymentID, uint amount);
    event Withdraw(address indexed receiver, uint paymentID, uint amount);
    
    event LimitPackPurchase(address indexed buyer, uint packID, bool isManual);
    event Activation(address indexed newAddress, address refAddress, uint packID, address signer);
    
    event BpnmBuy(address indexed buyer, uint btcbAmount, uint bpnmAmount, uint price);
    event BpnmSell(address indexed seller, uint btcbAmount, uint bpnmAmount, uint price);
    
    event TreeBonus(address indexed sender, address indexed receiver, uint amount, uint lvl, uint paymentID, bool isFrozen);
    event MatchingBonus(address indexed sender, address indexed receiver, uint amount, uint lvl, uint paymentID, bool isFrozen);
    
    event ItemAdded(address indexed sender, uint itemID);
    event ItemPurchased(address indexed buyer, uint itemID, uint price);
    event ItemGifted(address indexed sender, uint itemID, address receiver);
    event ItemPriceUpdated(address indexed sender, uint itemID, uint oldPrice, uint newPrice);
    
    event LockedMovedToLiquidity(address indexed from, uint amount, uint lvl);
    event LockedFundsReleased(address indexed to, uint amount, uint lvl);
    
    event MatchingBonusExtended(address indexed receiver, uint gwtCost, uint addedDays);
    
    event LpAutoRenewToggled(address indexed from, bool isEnabled);
    
    event EarnLimitPurchase(address indexed receiver, uint gwtCost, uint accruedEarnLimit);
    event BuyLimitPurchase(address indexed receiver, uint gwtCost, uint accruedBuyLimit);
    event SellLimitPurchase(address indexed receiver, uint gwtCost, uint accruedSellLimit);
    
    event ExtendLvlBonus(address indexed receiver, uint gwtCost, uint lvl);
    

    constructor(IERC20 _depositTokenAddress, IERC20 _btcbTokenAddress, PhenomenalTreeInt _treeAddress, GWT _gwt, address _feeCollector, address _stableLiquidityCollector, address collectorBTCB, NftConsultantsInt _nftCollection) {
    require(address(_depositTokenAddress)!=address(0),'[bPNM] Non zero address');
    require(address(_btcbTokenAddress)!=address(0),'[bPNM] Non zero address');
    require(address(_treeAddress)!=address(0),'[bPNM] Non zero address');
    require(address(_gwt)!=address(0),'[bPNM] Non zero address');
    require(_feeCollector!=address(0),'[bPNM] Non zero address');
    require(collectorBTCB!=address(0),'[bPNM] Non zero address');
    require(address(_nftCollection)!=address(0),'[bPNM] Non zero address');

    _promoter = msg.sender;
    _verificator = msg.sender;
    _marketplaceAdministrator = msg.sender;
    _name = "bPNM";
    _symbol = "bPNM";
    firstUser = msg.sender;
    init(_depositTokenAddress, _btcbTokenAddress, _treeAddress, _gwt, _feeCollector, _stableLiquidityCollector, collectorBTCB, _nftCollection);

    
    }

    /**
     * @dev Init contract once on deploy
     */

    function init(IERC20 _depositTokenAddress, IERC20 _btcbTokenAddress, PhenomenalTreeInt _treeAddress, GWT _gwt, address _feeCollector, address _stableLiquidityCollector, address collectorBTCB, NftConsultantsInt _nftCollection) private {
        require(_feeCollector!=address(0),'[bPNM] Non zero address');
        require(_stableLiquidityCollector!=address(0),'[bPNM] Non zero address');

        usdt = _depositTokenAddress;
        btcb = _btcbTokenAddress;
        contractTree = _treeAddress;
        nftCollection = _nftCollection;
        gwt = _gwt;
        feeCollector = _feeCollector;
        liquidityCollector = _stableLiquidityCollector;
        phenomenalLiquidityDistributor = collectorBTCB;

        //create first user
        _createUser(msg.sender, address(0));

        //Set limit packs data | Cost / Allowed levels / Earn limit
        
        //fake item
        limitPacks.push(limitPack(0,0,0));
        //ID=1 | LVL = 4 | Cost = 10 USDT
        limitPacks.push(limitPack(10e18,4,30e18));
        //ID=2 | LVL = 5 | Cost = 25 USDT
        limitPacks.push(limitPack(25e18,5,65e18));
        //ID=3 | LVL = 6 | Cost = 50 USDT
        limitPacks.push(limitPack(50e18,6,125e18));
        //ID=4 | LVL = 7 | Cost = 100 USDT
        limitPacks.push(limitPack(100e18,7,240e18));
        //ID=5 | LVL = 8 | Cost = 150 USDT
        limitPacks.push(limitPack(150e18,8,360e18));
        //ID=6 | LVL = 9 | Cost = 200 USDT
        limitPacks.push(limitPack(200e18,9,480e18));
        //ID=7 | LVL = 10 | Cost = 250 USDT
        limitPacks.push(limitPack(250e18,10,580e18));
        //ID=8 | LVL = 11 | Cost = 500 USDT
        limitPacks.push(limitPack(500e18,11,1100e18));
        //ID=9 | LVL = 12 | Cost = 1 000 USDT
        limitPacks.push(limitPack(1000e18,12,2100e18));
        //ID=10 | LVL = 13 | Cost = 2 000 USDT
        limitPacks.push(limitPack(2000e18,13,4100e18));
        //ID=11 | LVL = 14 | Cost = 5 000 USDT
        limitPacks.push(limitPack(5000e18,14,10000e18));
        //ID=12 | LVL = 15 | Cost = 10 000 USDT
        limitPacks.push(limitPack(10000e18,15,20000e18));

        
        //Set tree levels data | Bonus % / Freeze fee / Frezze period
        //lvl 0-3
        treeLvls.push(treeLvlData(0,0,0 days));//treeLvls[0] is not used 
        treeLvls.push(treeLvlData(0,0,0 days));//lvl1
        treeLvls.push(treeLvlData(0,0,0 days));//lvl2
        treeLvls.push(treeLvlData(0,0,0 days));//lvl3
        //lvl4
        treeLvls.push(treeLvlData(1,0,0 days));
        //lvl5
        treeLvls.push(treeLvlData(2,80,3 days));
        //lvl6
        treeLvls.push(treeLvlData(3,70,4 days));
        //lvl7
        treeLvls.push(treeLvlData(3,70,5 days));
        //lvl8
        treeLvls.push(treeLvlData(3,65,7 days));
        //lvl9
        treeLvls.push(treeLvlData(4,65,12 days));
        //lvl10
        treeLvls.push(treeLvlData(4,60,21 days));
        //lvl11
        treeLvls.push(treeLvlData(4,60,28 days));
        //lvl12
        treeLvls.push(treeLvlData(4,55,40 days));
        //lvl13
        treeLvls.push(treeLvlData(4,55,60 days));
        //lvl14
        treeLvls.push(treeLvlData(4,50,80 days));
        //lvl15
        treeLvls.push(treeLvlData(4,50,120 days));

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
        _balance memory balance = _balance(0, 0, 0);

        User memory user = User({
        referrer: _referrerAddress,
        balance: balance,
        bpnmBalance: 0,
        earnLimitLeft: 0,
        buyLimitLeft: 0,
        sellLimitLeft: 0,
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
    function getLimitPack(uint id) public view returns (limitPack memory) {
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

        if (_verificationNeeded) {
            require(IsVerified[newUser],"[bPNM] Need to verify"); 
        }
        
        
        //creating user record at bPNM
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

    //Private buy limit pack, purchase should be paid from internal user usdt balance, can be triggered by contract on auto renew
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
        uint buyLimitAmount = limitPacks[packID].cost*buyLimitMultiplier*1e18/getBtcPrice();
        //increase bPNM buy limit 
        Users[buyerAddress].buyLimitLeft += buyLimitAmount;
        //increase amount of buy limit deposited by limit packs for all time
        UserOverLimits[buyerAddress].totalBuyLimit += buyLimitAmount;

        //accrue gwt compensation
        if (prestartMode) {
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

    /** Fetch BTC price from oracles
     * @dev Binance and ChainLink oracles are used. Latest BTC price is returned. 
     * Revert if both oracles provide price older than 4 hours
     * Increase BTC price decimals from 8 to 18
     */
    function getBtcPrice() public view returns(uint btcActualPrice){
        //Set price to 50,000.00 for testing purposes, SHOULD BE COMMENTED BEFORE DEPLOYMENT!
        return(5000000000000*1e10);//Comment before deployment
        
        (uint80 roundId_b, int256 answer_b, uint256 startedAt_b, uint256 updatedAt_b, uint80 answeredInRound_b) = _binanceBtcOracle.latestRoundData();
        (uint80 roundId_c, int256 answer_c, uint256 startedAt_c, uint256 updatedAt_c, uint80 answeredInRound_c) = _chainLinkBtcOracle.latestRoundData();
        if(_usedBtcOracle == 0) {
            //get latest of 2 oracles. Price should not be older than 4 hours
            if (updatedAt_c > updatedAt_b) {
                require(updatedAt_c > (block.timestamp - 60*60*4),"[bPNM] Price is older than 4 hours");
                return(uint(answer_c)*1e10);//increase decimals from 8 to 18
            } else {
                require(updatedAt_b > (block.timestamp - 60*60*4),"[bPNM] Price is older than 4 hours");
                return(uint(answer_b)*1e10);//increase decimals from 8 to 18
            }
        } else if (_usedBtcOracle == 1) {
            //get from Binance
            require(updatedAt_b > (block.timestamp - 60*60*4),"[bPNM] Price is older than 4 hours");
            return(uint(answer_b)*1e10);//increase decimals from 8 to 18
        } else if (_usedBtcOracle == 2) {
            //get from ChainLink
            require(updatedAt_c > (block.timestamp - 60*60*4),"[bPNM] Price is older than 4 hours");
            return(uint(answer_c)*1e10);//increase decimals from 8 to 18
        }
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
     * @dev Function to purchase bPNM token. Purchase with BTCB contract balance.
     * Can be purchased not more than bPNM purchase limit
     * Net token worth liquidity stays in this contract, liquidity for token growth transferred to phenomenalLiquidityDistributor for future distribution
     * bPNM sell limit accrued to user for 150% of gross purchase BTCB amount (can be modified 100%-300%)
     * PLD liquidity unlock is triggered
     * @param btcbAmount Amount of BTCB for which bPNM token would be purchased
     */
    function buyBpnm(uint btcbAmount) public onlyActivated onlyVerified notPrestart onlyUnlocked{
        require(btcb.balanceOf(msg.sender)>=btcbAmount, "[bPNM] Not enough BTCB balance");
        require(Users[msg.sender].buyLimitLeft>=btcbAmount, "[bPNM] Not enough buy limit");
        require(minbPNMBuyBtcbAmount<btcbAmount, "[bPNM] Less than min buy");
        uint purchaseBpnmPrice = bpnmPrice();//this token price used to calc token amount
        //transfer BTCB for phenomenalLiquidityDistributor (PLD) liquidiy
        uint collectorFee = btcbAmount*bpnmBuyFee/100;
        btcb.safeTransferFrom(msg.sender, phenomenalLiquidityDistributor, collectorFee);
        //transfer BTCB for net token value
        uint netPurchase = btcbAmount-collectorFee;
        btcb.safeTransferFrom(msg.sender, address(this), netPurchase);

        //decrease buy limit
        Users[msg.sender].buyLimitLeft -= btcbAmount;
        //deposit bPNM tokens
        uint bpnmDeposited = netPurchase*1e18/purchaseBpnmPrice;
        _mint(msg.sender,bpnmDeposited);

        //accrue token sell limit
        Users[msg.sender].sellLimitLeft += btcbAmount/10*sellLimitMultiplier;
        //increase amount of sell limit deposited for all time
        UserOverLimits[msg.sender].totalSellLimit += btcbAmount/10*sellLimitMultiplier;

        //check if new liquidity can be released from PLD, after purchase with fixed bPNM price
        _pld.performUnlock();

        emit BpnmBuy(msg.sender,btcbAmount,bpnmDeposited,purchaseBpnmPrice);

    }

    /**
     * @dev bPNM sell function.
     * BTCB value of sold tokens can not excess sell limit.
     * PLD liquidity unlock is triggered before calculating bPNM price for operation
     * Decrease sell limit for gross bPNM value in BTCB
     */
    function sellBpnm(uint bpnmAmount) public onlyActivated notPrestart{
        require(Users[msg.sender].bpnmBalance>=bpnmAmount, "[bPNM] Not enough bPNM balance");
        require(Users[msg.sender].sellLimitLeft>=bpnmAmount*bpnmPrice()/1e18, "[bPNM] Not enough sell limit");

        //check if new liquidity can be released from PLD, before calculating bPNM price
        _pld.performUnlock();
        uint sellBpnmPrice = bpnmPrice();//this token price used to calc btcb amount

        uint collectorFee = bpnmAmount*sellBpnmPrice*bpnmSellFee/1e18/100;

        //transfer sell fee to liquidity
        btcb.safeTransfer(phenomenalLiquidityDistributor,collectorFee);

        //transfer btcb to seller minus fee
        uint btcbCompensateAmount = bpnmAmount*sellBpnmPrice/1e18-collectorFee;
        btcb.safeTransfer(msg.sender,btcbCompensateAmount);

        //burn sold bPNM tokens
        _burn(msg.sender,bpnmAmount);
        //decrease sell limit
        Users[msg.sender].sellLimitLeft -= bpnmAmount*sellBpnmPrice/1e18;

        emit BpnmSell(msg.sender,btcbCompensateAmount,bpnmAmount,sellBpnmPrice);
    }

    /** 
     * @dev Calculate net bPNM price according to bPNM liquidity BTCB stored liquidity
     */
    function bpnmPrice() public view returns(uint price) {
        if (totalSupply() == 0) {
            return(0);
        } else {
            return(btcb.balanceOf(address(this))*1e18/totalSupply());
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

        emit LpAutoRenewToggled(msg.sender,Users[msg.sender].limitPackAutoRenew);
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

        //check if any funds has to be released from frozen with new pack
        releaseFrozenFunds(msg.sender,_payment);

        //emit event
        emit EarnLimitPurchase(msg.sender,earnLimitAmount*1e18/earnLimitExtraPerGwt,earnLimitAmount);
    }

    /** 
     * @dev Buy bpNM token purchase limit with GWT
     * Can not exceed 10% of total received amount of buy limit from limit packs purchase
     * Fee is taken in USDT
     * @param usdtPurchaseLimitAmount Amount of buy limit in USDT, will be converted to BTCB with current BTCB/USDT rate
     */
    function buyPurchaseLimit(uint usdtPurchaseLimitAmount) public onlyActivated {
        require(usdtPurchaseLimitAmount>0,"[bPNM] Need more than 0");
        uint btcbPurchaseAmount = usdtPurchaseLimitAmount*1e18/getBtcPrice();//convert usdt amount to btcb
        require(UserOverLimits[msg.sender].totalBuyLimit*buyLimitExtra/100>=btcbPurchaseAmount+UserOverLimits[msg.sender].purchasedBuyLimit, "[bPNM] Amount exceeds 10%");

        //get usdt fee
        _payFeeForGWTtrans();

        //burn GWT for payment
        require(gwt.burn(msg.sender,usdtPurchaseLimitAmount*1e18/buyLimitExtraPerGwt),'[bPNM] GWT burn error');

        //deposit additional buy limit
        UserOverLimits[msg.sender].purchasedBuyLimit += btcbPurchaseAmount;//increase purchased amount of buy limit in btcb
        Users[msg.sender].buyLimitLeft += btcbPurchaseAmount;//increase left limit

        emit BuyLimitPurchase(msg.sender, usdtPurchaseLimitAmount*1e18/buyLimitExtraPerGwt, btcbPurchaseAmount);
    }

    /** 
     * @dev Buy bPNM token sell limit for GWT
     * Can not exceed 10% of total amount of received sell limit from bPNM purchases
     * Fee is taken in USDT
     * @param usdtSellLimitAmount Amount of sell limit in USDT, will be converted to BTCB with current BTCB/USDT rate
     */
    function buySellLimit(uint usdtSellLimitAmount) public onlyActivated {
        require(usdtSellLimitAmount>0,"[bPNM] Need more than 0");
        uint btcbSellAmount = usdtSellLimitAmount*1e18/getBtcPrice();//convert usdt amount to btcb
        require(UserOverLimits[msg.sender].totalSellLimit*sellLimitExtra/100>=btcbSellAmount+UserOverLimits[msg.sender].purchasedSellLimit, "[bPNM] Amount exceeds 10%");

        //get usdt fee
        _payFeeForGWTtrans();

        //burn GWT for payment
        require(gwt.burn(msg.sender,usdtSellLimitAmount*1e18/sellLimitExtraPerGwt),'[bPNM] GWT burn error');

        //deposit additional buy limit
        UserOverLimits[msg.sender].purchasedSellLimit += btcbSellAmount;//increase purchased amount of sell limit in btcb
        Users[msg.sender].sellLimitLeft += btcbSellAmount;//increase left limit

        emit SellLimitPurchase(msg.sender, usdtSellLimitAmount*1e18/sellLimitExtraPerGwt, btcbSellAmount);
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
     * @dev Function to associate username with address.
     * Usernaem sanitization is provided. 
     * Max length is 16
     * Unique is not required
     */
    function setUsername(string memory newUsername) public onlyActivated {        
        string memory sanitizedUsername = _sanitizeUsername(newUsername);
        require(bytes(sanitizedUsername).length > 0, "[bPNM] Username cannot be empty");
        require(bytes(sanitizedUsername).length <= 16, "[bPNM] Username should be less than 16 symbols");

        AddressToUsername[msg.sender] = sanitizedUsername;
    }

    /**
     * @dev Sanitize a username by removing symbols that can harm the frontend
     * Allowed a-z, A-z, 0-9, _, @
     */
    function _sanitizeUsername(string memory username) internal pure returns (string memory) {
        bytes memory usernameBytes = bytes(username);
        bytes memory result = new bytes(usernameBytes.length); // Allocate maximum possible size
        uint256 resultIndex = 0;

        for (uint256 i = 0; i < usernameBytes.length; i++) {
            // Include only alphanumeric characters, underscores, and '@'
            if (
                (usernameBytes[i] >= bytes1("0") && usernameBytes[i] <= bytes1("9")) || // 0-9
                (usernameBytes[i] >= bytes1("A") && usernameBytes[i] <= bytes1("Z")) || // A-Z
                (usernameBytes[i] >= bytes1("a") && usernameBytes[i] <= bytes1("z")) || // a-z
                (usernameBytes[i] == bytes1("_")) || // underscore
                (usernameBytes[i] == bytes1("@")) // '@'
            ) {
                result[resultIndex] = usernameBytes[i];
                resultIndex++;
            }
        }

        // Trim the result array to actual size
        bytes memory trimmedResult = new bytes(resultIndex);
        for (uint256 j = 0; j < resultIndex; j++) {
            trimmedResult[j] = result[j];
        }

        return string(trimmedResult);
    }

    /**
     * @dev Get the username associated with the address
     */
    function getUsername(address usernameAddress) public view returns (string memory) {
        return AddressToUsername[usernameAddress];
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
     * @dev Function for frontend to return user data for tree navigation [top - Requested Address - 3 - 9 positions]
     * Returns address of each position, network size 15 lvls deep, username, bPNM activation status
     */
    function getFrontTreeData(address searchedUser) public view returns(address[14] memory addressList, string[14] memory usernamesList, bool[14] memory activeList, uint[14] memory networkSizeList){
        //0 - top1, 1 - searched, 2-4 - lvl1, 5-14 - lvl2
        //get 3 users in 1st level
        address top;
        addressList[1] = searchedUser;
        ( addressList[0], addressList[2], addressList[3], addressList[4]) = contractTree.treeUsers(searchedUser);
        
        //get 3 left users on lvl2
        if (addressList[2] != address(0)) {
            ( top,  addressList[5],  addressList[6],  addressList[7]) = contractTree.treeUsers(addressList[2]);
        }
        //get 3 center users on lvl2
        if (addressList[3] != address(0)) {
            ( top,  addressList[8],  addressList[9],  addressList[10]) = contractTree.treeUsers(addressList[3]);
        }
        //get 3 right users on lvl2
        if (addressList[4] != address(0)) {
            ( top,  addressList[11],  addressList[12],  addressList[13]) = contractTree.treeUsers(addressList[4]);
        }

        //get usernames, bPNM activation status and network size in bPNM
        for (uint i; i<=13; i++) {
            usernamesList[i] = getUsername(addressList[i]);
            if (isUserExists(addressList[i])) {
                activeList[i] = true;
            } 
            networkSizeList[i] = contractTree.calcTreeNetwork(addressList[i],15);
        }

        return(addressList, usernamesList, activeList, networkSizeList);
    }


    //=======Marketplace section START=======

    /**
     * @dev Add new item to marketplace. 
     * No sanitization because can be added only by marketplace admin
     */
    function addItemToMarketplace(string memory itemName, string memory itemLink, uint itemPrice, bool verifyRequired, bool liquidityCompensated, address seller ) external onlyMarketAdmin returns(uint itemID){
        require(itemPrice>0,"[bPNM] Non zero price required");

        marketplaceItem memory newItem = marketplaceItem({
            name: itemName,
            claimLink: itemLink,
            bpnmPrice: itemPrice,
            isVerifyRequired: verifyRequired,
            isLiquidityCompensated: liquidityCompensated,
            isActive: false,
            sellerAddress: seller
        });

        Marketplace[totalMarketplaceItems+1] = newItem;
        totalMarketplaceItems += 1;
        emit ItemAdded(msg.sender, totalMarketplaceItems);
        return(totalMarketplaceItems);
    }

    /**
     * @dev Enable/disable item 
     */
    function  triggerMarketItemActive(uint itemID) external onlyMarketAdmin {
        require(Marketplace[itemID].bpnmPrice > 0,"[bPNM] Item not exist");
        Marketplace[itemID].isActive = !Marketplace[itemID].isActive;
    }

    /**
     * @dev Enable/disable item verify requirement
     */
    function  triggerMarketItemVerify(uint itemID) external onlyMarketAdmin {
        require(Marketplace[itemID].bpnmPrice > 0,"[bPNM] Item not exist");
        Marketplace[itemID].isVerifyRequired = !Marketplace[itemID].isVerifyRequired;
    }

    /**
     * @dev Update price in bPNM
     */
    function  updateMarketItemPrice(uint itemID, uint itemPrice) external onlyMarketAdmin {
        require(Marketplace[itemID].bpnmPrice > 0,"[bPNM] Item not exist");
        require(itemPrice > 0,"[bPNM] Non zero price required");
        Marketplace[itemID].bpnmPrice = itemPrice;
    }

    /**
     * @dev Update item name
     */
    function  updateMarketItemName(uint itemID, string memory itemName) external onlyMarketAdmin {
        require(Marketplace[itemID].bpnmPrice > 0,"[bPNM] Item not exist");
        Marketplace[itemID].name = itemName;
    }

    /**
     * @dev Update item claim link
     */
    function  updateMarketItemClaimLink(uint itemID, string memory itemLink) external onlyMarketAdmin {
        require(Marketplace[itemID].bpnmPrice > 0,"[bPNM] Item not exist");
        Marketplace[itemID].claimLink = itemLink;
    }

    /**
     * @dev Seller of item can give it to another address
     * Item should be active
     * Receiver should be activated in bPNM
     * Receiver should not own item
     * Verification check applied if needed
     */
    function  giftMarketItemToAddress(uint itemID, address receiver) external {
        require(Marketplace[itemID].sellerAddress == msg.sender,"[bPNM] Only item owner can gift");
        require(Marketplace[itemID].isActive,"[bPNM] Item is not active");
        require(isUserExists(receiver), "[bPNM] Receiver not exists");
        require(!isMarketplaceItemOwnedBy(itemID,receiver),"[bPNM] Already owned");

        if (Marketplace[itemID].isVerifyRequired&&!IsVerified[receiver]) {
            revert("[bPNM] Receiver verification required");
        } else {
            UserOwnedMarketItems[receiver].push(itemID);
        }
        emit ItemGifted(msg.sender,itemID,receiver); 

    }

    /**
     * @dev Item seller can disable item so it can not be purchased
     */
    function  disableMarketItemActiveBySeller(uint itemID) external {
        require(Marketplace[itemID].sellerAddress == msg.sender,"[bPNM] Only item seller can disable");
        require(Marketplace[itemID].isActive,"[bPNM] Not active item");
        Marketplace[itemID].isActive = false;
    }

    /**
     * @dev Item seller can update price
     */
    function  updateMarketItemPriceBySeller(uint itemID, uint itemPrice) external {
        require(Marketplace[itemID].sellerAddress == msg.sender,"[bPNM] Only item seller can update price");
        require(itemPrice > 0,"[bPNM] Non zero price required");
        
        emit ItemPriceUpdated(msg.sender,itemID,Marketplace[itemID].bpnmPrice,itemPrice);

        Marketplace[itemID].bpnmPrice = itemPrice;
    }



    /**
     * @dev List of items owned by address
     */
    function ownedMarketplaceItemsOf(address _address) public view returns(uint[] memory){
        return(UserOwnedMarketItems[_address]);
    }

    /**
     * @dev Check if address own item
     */
    function isMarketplaceItemOwnedBy(uint itemID, address _address) public view returns(bool isOwner){
        uint[] memory userItems = UserOwnedMarketItems[_address];
        bool found = false;
        for (uint i = 0; i < userItems.length; i++) {
            if (userItems[i] == itemID) {
                found = true;
                break;
            }
        }
        return(found);
    }
    /**
     * @dev Marketplace item purchase
     * Address has to be activated at bPNM
     * Each item can be purchased only once by address
     * If item not required for liquidity compensation than bPNM are burned and liquidity forwarded to PLD
     * Applied the same fee as for bPNM sell. Fee goes to PLD
     * bPNM sell limit is not used for marketplace item purchase
     */
    function purchaseMarketplaceItem(uint itemID) public {
        require(isUserExists(msg.sender), "[bPNM] Buy limit pack first");
        require(Marketplace[itemID].isActive,"[bPNM] Item is not active");
        require(Marketplace[itemID].bpnmPrice <= Users[msg.sender].bpnmBalance,"[bPNM] Not enough bPNM balance");
        require(!isMarketplaceItemOwnedBy(itemID,msg.sender),"[bPNM] Already owned");

        if (Marketplace[itemID].isVerifyRequired&&!IsVerified[msg.sender]) {
            revert("[bPNM] Verification required");
        }
        
        uint sellBpnmPrice = bpnmPrice();//this token price used to calc btcb amount

        //compensate price with BTCB
        if (Marketplace[itemID].isLiquidityCompensated) {
            uint collectorFee = Marketplace[itemID].bpnmPrice*sellBpnmPrice*bpnmSellFee/1e18/100;
            //transfer purchase fee to PLD
            btcb.safeTransfer(phenomenalLiquidityDistributor,collectorFee);
            //transfer net BTCB amount to seller
            btcb.safeTransfer(Marketplace[itemID].sellerAddress,Marketplace[itemID].bpnmPrice*sellBpnmPrice/1e18-collectorFee);
        } else {
            //transfer all bPNM value to PLD
            btcb.safeTransfer(phenomenalLiquidityDistributor,Marketplace[itemID].bpnmPrice*sellBpnmPrice/1e18);
        }
        
        //burn bPNM for item price
        _burn(msg.sender,Marketplace[itemID].bpnmPrice);

        UserOwnedMarketItems[msg.sender].push(itemID);

        //emit event
        emit ItemPurchased(msg.sender, itemID, Marketplace[itemID].bpnmPrice);

    }
    //=======Marketplace section END=======


    
    /**
     * @dev Set whuch BTC oracle to use.
     * 0 = both used, latest selected. 
     * 1 - Used only Binance, 
     * 2 - Used only ChainLink
     */
    function setBtcOracle(uint _selector) external onlyOwner {
        require(_selector <=2,"[bPNM] Incorrect oracle selector");
        _usedBtcOracle = _selector;
    }


    /**
     * Section for updating mutable parameters in predefined ranges
     */

    function setBuyLimitMultiplier(uint amount) external onlyPromoter {
        require(3<=amount&&amount<=5, '[bPNM] Out of range');
        buyLimitMultiplier = amount;
    }

    function setSellLimitMultiplier(uint amount) external onlyPromoter {
        require(10<=amount&&amount<=30, '[bPNM] Out of range');
        sellLimitMultiplier = amount;
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

    function setBuyLimitExtraPerGwt(uint amount) external onlyPromoter {
        require(5e18<=amount&&amount<=10e18, '[bPNM] Out of range');
        buyLimitExtraPerGwt = amount;
    }

    function setSellLimitExtraPerGwt(uint amount) external onlyPromoter {
        require(5e18<=amount&&amount<=10e18, '[bPNM] Out of range');
        sellLimitExtraPerGwt = amount;
    }

    function setWithdrawBaseFee(uint amount) external onlyPromoter {
        require(6<=amount&&amount<=10, '[bPNM] Out of range');
        withdrawBaseFee = amount;
    }

    function setBpnmBuyFee(uint amount) external onlyPromoter {
        require(amount<=20, '[bPNM] Out of range');
        bpnmBuyFee = amount;
    }

    function setBpnmSellFee(uint amount) external onlyPromoter {
        require(amount<=10, '[bPNM] Out of range');
        bpnmSellFee = amount;
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

    //Update settings section END


    /**
     * @dev Check if user activated at bPNM
     */    
    function isUserExists(address user) public view returns (bool) {
        return (Users[user].referrer != address(0)||user==firstUser);
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
     * @dev Returns the name of the token.
     */
    function name() external view virtual override returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() external view virtual override returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC20} uses, unless this function is
     * overridden;
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() external view virtual override returns (uint8) {
        return 18;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public view returns (uint) {
        return totalbPNM;
    }

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function _mint(address account, uint amount) internal virtual {
        require(account != address(0), "[bPNM] ERC20: mint to the zero address");

        totalbPNM += amount;
        Users[account].bpnmBalance += amount;
        emit Transfer(address(0), account, amount);

    }

    /**
     * @dev Destroys `amount` tokens from `account`, reducing the
     * total supply.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - `account` must have at least `amount` tokens.
     */
    function _burn(address account, uint amount) internal virtual {
        require(account != address(0), "[bPNM] ERC20: burn from the zero address");
        require(Users[account].bpnmBalance >= amount, "[bPNM] ERC20: burn amount exceeds balance");

        
        Users[account].bpnmBalance -= amount;    
        totalbPNM -= amount;
        
        emit Transfer(account, address(0), amount);

    }

    /**
     * @dev dPNM is not transferable, returns false
     */
    function transfer(address to, uint256 amount) external pure returns (bool) {
        return (false);
    }


    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account) external view returns (uint256) {
        return Users[account].bpnmBalance;
    }

    /**
     * @dev Get promoter address
     */
    function promoter() external view onlyOwner returns(address) {
        return _promoter;
    }

    /**
     * @dev Check if user is in struct so activated
     */
    modifier onlyActivated() { 
        require(Users[msg.sender].referrer != address(0)||msg.sender==firstUser, "[bPNM] Please activate first"); 
        _; 
    }


    /**
     * @dev Contract functions lock
     * activate / buyLimitPack / buyBpnm / replenishPaymentBalance
     */
    modifier onlyUnlocked() { 
        require(!isLocked || msg.sender == owner(),"[bPNM] Locked"); 
        _; 
    }

    /**
     * @dev User verification status check
     * activate / buyLimitPack / buyBpnm / replenishPaymentBalance / 
     */
    modifier onlyVerified() { 
        if (_verificationNeeded) {
            require(IsVerified[msg.sender] || msg.sender == owner(),"[bPNM] Need to verify"); 
        }
        _; 
    }

    /**
     * @dev Prestart check
     */
    modifier notPrestart() { 
        require(!prestartMode, "[bPNM] After Prestart"); 
        _; 
    }

    /**
     * @dev Check if caller is promoter or owner
     */
    modifier onlyPromoter() { 
        require(msg.sender == _promoter||msg.sender==owner(), "[bPNM] Need promoter or higher"); 
        _; 
    }

    /**
     * @dev Check if caller is marketplaceAdministrator or owner
     */
    modifier onlyMarketAdmin() { 
        require(msg.sender == _marketplaceAdministrator||msg.sender==owner(), "[bPNM] Need marketplaceAdministrator or higher"); 
        _; 
    }

    /**
     * @dev Prestart activated at deploy, once deactivated cannot be enabled
     * During prestart bPNM buy/sell not allowed. Only activation to gain liquidity
     * When prestart disabled 1 bPNM is minted and 0.0002 BTCB goes to liquidity leading to bPNM price of 0.0002 BTCB/bPNM
     */
    function disablePrestartMode() external onlyOwner {
        require(prestartMode,"[bPNM] Already disabled");
        require(PLDinited,'[bPNM] Init Phenomenal Liquidity Distributor');
        prestartMode = false;
        //deposit 0.0002 BTCB
        btcb.safeTransferFrom(msg.sender, address(this), 2*1e14);
        //deposit first user 1 bPNM
        _mint(firstUser,1e18);
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

    /**
     * @dev Setting address of btcbLiquidityCollector
     * Should be triggered after bPNM deployment once PLD address is deployed and address is known.
     * Once address is set it cannot be changed in the future
     */
    function initBtcbLiquidityCollector(PLD newCollector) external onlyOwner {
        require(address(newCollector)!=address(0),'[bPNM] Non zero address');
        require(!PLDinited,'[bPNM] Already inited');
        phenomenalLiquidityDistributor = address(newCollector);
        _pld = newCollector;
        PLDinited = true;
    }

    /**
     * @dev Changing address of _promoter
     */
    function changePromoter(address newPromoter) external onlyOwner {
        require(newPromoter!=address(0),'[bPNM] Non zero address');
        _promoter = newPromoter;
    }

    /**
     * @dev Changing address of _verificator
     */
    function changeVerificator(address newVerificator) external onlyOwner {
        require(newVerificator!=address(0),'[bPNM] Non zero address');
        _verificator = newVerificator;
    }

    /**
     * @dev Changing address of _marketplaceAdministrator
     */
    function changeMarketplaceAdministrator(address newAdmin) external onlyOwner {
        require(newAdmin!=address(0),'[bPNM] Non zero address');
        _marketplaceAdministrator = newAdmin;
    }

    /**
     * @dev Lock/unlock functions
     * Affected functions: activate / buyLimitPack / buyBpnm / replenishPaymentBalance
     */
    function triggerLock() external onlyOwner() {
        isLocked = !isLocked;
    }

    /**
     * @dev Trigger verification status
     * In case user verification is required this allows to enable verififcation
     * Checked functions: activate / buyLimitPack / buyBpnm / replenishPaymentBalance
     */
    function triggerVerify() external onlyOwner {
        
        _verificationNeeded = !_verificationNeeded;
    }

    /**
     * @dev Trigger to add/remove verification for address
     */
    function addressVerify(address verifiedAddress) external {
        require(msg.sender==_verificator||msg.sender==owner(),'[bPNM] Verificator role needed');
        IsVerified[verifiedAddress] = !IsVerified[verifiedAddress];
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