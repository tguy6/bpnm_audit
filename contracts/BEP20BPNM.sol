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

    function treeUsers(address user) external view returns (address, address, address, address);
    function calcTreeNetwork(address _userAddress, uint _depth ) external view returns(uint);

}

/**
 * @dev Interface for a GWT token.
 */

interface GWT {

    function burn(address account, uint256 amount) external returns (bool);

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
 * @dev Interface for bPNM Marketing contract.
 */

interface BpnmMarketing {

    function _getPaymentContract(uint paymentID) external returns (IERC20);
    function feeCollector() external returns (address);
    function liquidityCollector() external returns (address);
    function isUserExists(address _user) external returns (bool);
    
}

/**
 * @dev Main contract of bPNM. Implementation of modified ERC20 bPNM token plus verifivation, marketplace.
 * Should be connected with Phenomenal tree, GWT token, Phenomenal Liquidity Distributor and NFT consultants collection.
 * BpnmMarketing contract used for activating users in Tree and grant them bPNM purchase limits
 */
contract BEP20BPNM is IERC20Metadata, Ownable {
    using SafeERC20 for IERC20;
    IERC20 public btcb;
    BpnmMarketing public _marketing;
    PhenomenalTreeInt public contractTree;
    PLD public _pld;
    GWT public gwt;
    Oracles public constant _chainLinkBtcOracle = Oracles(0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf);
    Oracles public constant _binanceBtcOracle = Oracles(0x83968bCa5874D11e02fD80444cDDB431a1DbEc0f);
    
    address private _promoter;//address for enabling promotion conditions
    address private _verificator;//address for verifying addresses
    address private _marketplaceAdministrator;//address for marketplace administration
    address immutable private firstUser;

    address public phenomenalLiquidityDistributor;//Phenomenal Liquidity Distributor (PLD), BTCB liquidity collector/distributor
    bool private PLDinited;//PLD can be inited only once

    uint public sellLimitMultiplier = 15;//Multiplier applied to token purchase amount (15 = 150%), to calculate max token value to sell. 

    uint immutable public gwtTransFeeCollector = 1e18;//USDT fee paid to feeCollector when buying turnover/earnLimit. 1 USDT, immutable
    uint public gwtTransFeeLiquidity = 1e18;//USDT fee stays in liquidity buying turnover/earnLimit. 1 USDT, mutable 0-2 USDT

    uint immutable public buyLimitExtra = 10;//Max 10% of extra bPNM buy limit user can purchase. Calculated from total accrued buy limit
    uint public buyLimitExtraPerGwt = 5e18;//Amount of USDT buy limit for bPNM purchase accrued for each 1 GWT
    uint immutable public sellLimitExtra = 10;//Max 10% of extra bPNM sell limit user can buy. Calculated from all sell limit deposited with bPNM purchases
    uint public sellLimitExtraPerGwt = 5e18;//Amount of USDT sell limit for bPNM sell accrued for each 1 GWT
    
    uint private totalbPNM = 0;//Total amount of bPNM tokens
    uint immutable public minbPNMBuyBtcbAmount = 1e14;//Min amount of BTCB that can be used to purchase bPNM at one transaction = 0.0001 BTCB
    
    uint public bpnmBuyFee = 15;//Fee in percent for bPNM purchase
    uint public bpnmSellFee = 5;//Fee in percent for bPNM sell

    bool public isLocked = true;//Global lock, locks activate/buybPNM/deposit/buy limit pack
    bool public prestartMode = true;//Activated on deploy. Allow only activate and limit pack purchase. Can be disabled once
    
    uint public totalMarketplaceItems;//Amount of marketplace items

    string private _name;
    string private _symbol;
    
    bool public _verificationNeeded;//if address verification is needed

    uint public _usedBtcOracle = 0;//0 = both used, latest BTC price selected. 1 - Used only Binance oracle, 2 - Used only ChainLink oracle

    struct UserTokenData {
        uint bpnmBalance;//User bPNM balance
        uint buyLimitLeft;//Amount of left limit to buy bPNM, in BTCB
        uint sellLimitLeft;//Amount of left limit to sell bPNM, in BTCB
    }

    struct LimitsPurchases {
        uint totalBuyLimit;//total amount of bPNM buy limit deposited from limit pack purchase 
        uint purchasedBuyLimit;//amount of purchased buy limit with GWT, can not increase 10% of total deposited buy limit from packs
        
        uint totalSellLimit;//total amount of bPNM sell limit deposited from bPNM purchase
        uint purchasedSellLimit;//amount of purchased sell limit with GWT, can not increase 10% of total deposited sell limit
    }

    struct MarketplaceItem {
        string name;//Item name
        string claimLink;//Item claim link, website etc. Provided by seller
        uint bpnmPrice;//Item price in bPNM
        
        bool isVerifyRequired;//if buyer verification required
        bool isLiquidityCompensated;//true if item cost should be compensated to sellerAddress with BTCB from liquidity
        
        bool isActive;
        address sellerAddress;
    }



    mapping(address => UserTokenData) public Users;
    mapping(address => string) public AddressToUsername;
    mapping(address => LimitsPurchases) public UserOverLimits;
    mapping(address => bool) public IsVerified;//user verification
    mapping(uint => MarketplaceItem) public Marketplace;//marketplace items
    mapping(address => uint[]) public UserOwnedMarketItems;//Marketplace items owned by address




    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     * Only used for _burn and _mint because bPNM can not be transferred to another address
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    event BpnmBuy(address indexed buyer, uint btcbAmount, uint bpnmAmount, uint price);
    event BpnmSell(address indexed seller, uint btcbAmount, uint bpnmAmount, uint price);
    
    event ItemAdded(address indexed sender, uint itemID);
    event ItemPurchased(address indexed buyer, uint itemID, uint price);
    event ItemGifted(address indexed sender, uint itemID, address receiver);
    event ItemPriceUpdated(address indexed sender, uint itemID, uint oldPrice, uint newPrice);
    
    event BuyLimitPurchase(address indexed receiver, uint gwtCost, uint accruedBuyLimit);
    event SellLimitPurchase(address indexed receiver, uint gwtCost, uint accruedSellLimit);
    

    constructor(IERC20 _btcbTokenAddress, PhenomenalTreeInt _treeAddress, GWT _gwt, address collectorBTCB) {
        require(address(_btcbTokenAddress)!=address(0),'[bPNM] Non zero address');
        require(address(_treeAddress)!=address(0),'[bPNM] Non zero address');
        require(address(_gwt)!=address(0),'[bPNM] Non zero address');
        require(collectorBTCB!=address(0),'[bPNM] Non zero address');


        _promoter = msg.sender;
        _verificator = msg.sender;
        _marketplaceAdministrator = msg.sender;
        _name = "bPNM";
        _symbol = "bPNM";
        firstUser = msg.sender;
        btcb = _btcbTokenAddress;
        contractTree = _treeAddress;
        gwt = _gwt;
        phenomenalLiquidityDistributor = collectorBTCB;
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
        Users[msg.sender].sellLimitLeft += btcbAmount*sellLimitMultiplier/10;
        //increase amount of sell limit deposited for all time
        UserOverLimits[msg.sender].totalSellLimit += btcbAmount*sellLimitMultiplier/10;

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
     * Deposit bPNM buy limit to user. Can be triggered only by MarketingBPNM contract on activate/LP purchase
     */
    function depositBuyLimit(uint limitAmount, address receiver) public returns (bool) {        
        require(msg.sender==address(_marketing),"[bPNM Only bPNM marketing allowed]");
        
        Users[receiver].buyLimitLeft += limitAmount;
        UserOverLimits[receiver].totalBuyLimit += limitAmount;

        return(true);
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
     * @dev Function for frontend to return user data for tree navigation [top - Requested Address - 3 - 9 positions]
     * Returns address of each position, network size 15 lvls deep, username, bPNM activation status
     */
    function getFrontTreeData(address searchedUser) public returns(address[14] memory addressList, string[14] memory usernamesList, bool[14] memory activeList, uint[14] memory networkSizeList){
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
            if (_marketing.isUserExists(addressList[i])) {
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

        MarketplaceItem memory newItem = MarketplaceItem({
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
        require(_marketing.isUserExists(receiver), "[bPNM] Receiver not exists");
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
        require(_marketing.isUserExists(msg.sender), "[bPNM] Buy limit pack first");
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

    function setSellLimitMultiplier(uint amount) external onlyPromoter {
        require(10<=amount&&amount<=30, '[bPNM] Out of range');
        sellLimitMultiplier = amount;
    }

    function setBuyLimitExtraPerGwt(uint amount) external onlyPromoter {
        require(5e18<=amount&&amount<=10e18, '[bPNM] Out of range');
        buyLimitExtraPerGwt = amount;
    }

    function setSellLimitExtraPerGwt(uint amount) external onlyPromoter {
        require(5e18<=amount&&amount<=10e18, '[bPNM] Out of range');
        sellLimitExtraPerGwt = amount;
    }

    function setBpnmBuyFee(uint amount) external onlyPromoter {
        require(amount<=20, '[bPNM] Out of range');
        bpnmBuyFee = amount;
    }

    function setBpnmSellFee(uint amount) external onlyPromoter {
        require(amount<=10, '[bPNM] Out of range');
        bpnmSellFee = amount;
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
     * @dev USDT fee payment 
     * Use currently active payment contract, USDT by default
     */
    function _payFeeForGWTtrans() private {
        //pay fee in USDT, to feeCollector and liquidityCollector
        IERC20 _paymentToken = _marketing._getPaymentContract(0);

        _paymentToken.safeTransferFrom(msg.sender, _marketing.feeCollector(), gwtTransFeeCollector);
        _paymentToken.safeTransferFrom(msg.sender, _marketing.liquidityCollector(), gwtTransFeeLiquidity);
        

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
        require(_marketing.isUserExists(msg.sender), "[bPNM] Please activate first"); 
        _; 
    }


    /**
     * @dev Contract functions lock
     * Affected functions: buyBpnm
     */
    modifier onlyUnlocked() { 
        require(!isLocked || msg.sender == owner(),"[bPNM] Locked"); 
        _; 
    }

    /**
     * @dev User verification status check
     * Checked at: buyBpnm
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
     * @dev Setting address of MarketingBPNM contract
     * Once address is set it cannot be changed in the future
     */
    function connectMarketingContract(BpnmMarketing marketingAddress) external onlyOwner {
        require(address(marketingAddress)!=address(0), '[bPNM] Non zero address');
        _marketing = marketingAddress;
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

}