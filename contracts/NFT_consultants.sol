// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

//Uses openzeppelin v 5.0.0
import "./@openzeppelin-5/contracts/token/ERC721/ERC721.sol";
import "./@openzeppelin-5/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./@openzeppelin-5/contracts/access/Ownable.sol";
import "./@openzeppelin-5/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @dev Interface for a GWT token.
 */

interface GWT {
    function mint(address account, uint256 amount) external returns (bool);
    function burn(address account, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @dev Phenomenal Consultants contract. Provide discounts for bPNM and passive GWT farming for owners.
 * Pre-minted, NFT can be owned by bPNM users who purchased limit packs for 500+ USDT
 * Tokens rarity used to calculate discounts, stored in contract, immutable, not stored at IPFS metadata.
 */
contract PhenomenalConsultants is ERC721, ERC721Enumerable, Ownable {
    using SafeERC20 for IERC20;
    IERC20 public usdt;
    GWT public gwt;
    
    address private _promoter;//address for enabling promotion conditions
    address public feeCollector;//dev address for earning fees
    uint256 public numberOfTokens;//amount of tokens in collection. Should be 10000
    uint256 private mintNonce;
    uint immutable public transferFee = 10e18;//10 USDT transfer fee
    string private _baseTokenURI = "ipfs://bafybeiht73rqyi34oeasc7typtdaco54zxbwdmmdhwvzfi6t5pmp77lwai/"; 
    uint public gwtPerDayForHundredRarity = 1e18;//GWT daily profit for 100 rarity of NFT. Rarity = upperRarityBound - actual NFT rarity
    uint public immutable upperRarityBound = 1200;//Upper bound from which NFT rarity is substracted to calculate GWT income. Worst NFT rarity = 1040
    uint16[] public _availableTokenIds;//list of not minted NFT ID
    uint public releasedRarity;//already minted total rarity


    mapping(address => bool) internal allowedContractsMap;//map of contracts allowed to mint NFT

    
    mapping(uint256 => uint256) private _rarityLevels;// token ID -> rarity level
    mapping(uint256 => uint) private _nftLastClaimDate;//last date when NFT owner claimed GWT profit
    mapping(address => uint) public addressRarity;//address -> total owned NFT rarity

    event ClaimNftProfit(address indexed, uint256 tokenId, uint profit);
    event minted(address indexed, uint256 tokenId);

    
    constructor(address initialOwner, IERC20 _usdtTokenAddress, address _feeCollector, GWT _gwt, uint _numberOfTokens)
        ERC721("PhenomenalConsultants", "CNS")
        Ownable(initialOwner)
    {
        usdt = _usdtTokenAddress;
        feeCollector = _feeCollector;
        gwt = _gwt;
        _promoter = msg.sender;
        numberOfTokens = _numberOfTokens;

        for (uint16 i = 1; i <= numberOfTokens; i++) {
            _availableTokenIds.push(i);
        }

    }


    // Set rarity levels for multiple tokens
    /**
     * @dev Used once after contract deployment. Set rarity by batches for each of 10000 NFT
     * Rarity should not exceed max bound of 1040
     * @param tokenIds Array of token IDs in batch
     * @param rarityLevels Array of corresponding rarity levels for token Ids
     */
    function setBatchRarityLevels(uint16[] calldata tokenIds, uint16[] calldata rarityLevels) external onlyOwner {
        require(tokenIds.length == rarityLevels.length, "Input arrays must have the same length");
        uint16 tokenId;
        for (uint16 i = 0; i < tokenIds.length; i++) {
            // Do not allow to overwrite rarity            
            tokenId = tokenIds[i];
            require(_rarityLevels[tokenId] == 0, "Rarity already set");
            require(rarityLevels[i] < upperRarityBound,'Rarity < upperRarityBound');
            _rarityLevels[tokenId] = rarityLevels[i];

        }

    }

    
    /**
     * @dev Get rarity level for a specific token
     */
    function getTokenRarityLevel(uint256 tokenId) external view returns (uint256) {
        return _rarityLevels[tokenId];
    }

    /**
     * @dev Get total rarity of all owned NFTs for a specific address
     */
    function getAddressTotalRarityLevel(address userAddress) external view returns (uint256) {
        return addressRarity[userAddress];
    }

    /** 
     * @dev Generate random NFT number for mint
     * Use block time and difficulty to generate random number. 
     * Do not use chainlink VRF due to low risk of block difficulty and time can be faked by BSC validators.
     */
    function _getRandomNumber(uint256 upper) private returns (uint256) {
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, mintNonce))) % upper;
        mintNonce++;
        return random;
    }

    /**
     * @dev NFT minting. Only mint token owners of bPNM can mint.
     * Only allowed contracts can trigger (bPNM contract)
     * Selected token ID should have rarity
     */
    function mintNFT(address receiverAddress) external onlyAllowed {
        //check if not more than max nfts
        require(totalSupply()<numberOfTokens,'Max mint amount reached');
        
        //generate random index from free tokens IDs list
        uint freeTokenIdx = _getRandomNumber(_availableTokenIds.length);
        require(_rarityLevels[freeTokenIdx]>0,'[CNS] No rarity for token');//token should have rarity number
        //get tokenID
        uint tokenId = _availableTokenIds[freeTokenIdx];

        //mint token
        _safeMint(receiverAddress,tokenId);
        //remove token ID from not owned list
        _availableTokenIds[freeTokenIdx] = _availableTokenIds[_availableTokenIds.length-1];
        _availableTokenIds.pop();

        //set GWT last claim date to current block
        _nftLastClaimDate[tokenId] = block.timestamp;
        //increase receiver total rarity
        addressRarity[receiverAddress] += _rarityLevels[tokenId];

        releasedRarity += _rarityLevels[tokenId];

        emit minted(receiverAddress,tokenId);
    }


    /**
     * @dev Get token IDs owned by a specific address
     */
    function getTokensByOwner(address owner) public view returns (uint[] memory) {
        uint balance = balanceOf(owner);
        uint[] memory tokenIds = new uint[](balance);

        for (uint i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }

        return tokenIds;
    }

    /** 
     * @dev Claim GWT profit for all owned NFTs
     */
    function batchClaimGwtProfit() public {
        uint[] memory tokenIds = getTokensByOwner(msg.sender);
        uint totalProfit;
        uint tokenProfit;
        for (uint i=0; i < tokenIds.length; i++) {
            //calc total profit
            tokenProfit = _calcNftGwtProfit(tokenIds[i]);
            totalProfit += tokenProfit;
            //update token claim date
            _nftLastClaimDate[tokenIds[i]] = block.timestamp;
            //emit event
            emit ClaimNftProfit(msg.sender, tokenIds[i], tokenProfit);
        }
        require(gwt.mint(msg.sender,totalProfit),'GWT mint error');

    }

    /**
     * @dev Claim GWT profit for specific NFT ID
     */
    function claimNftGwtProfit(uint256 tokenId) public {
        require(msg.sender == _requireOwned(tokenId),'[CNS] Not token owner');
        //mint GWT profit to address
        uint profit = _calcNftGwtProfit(tokenId);
        require(gwt.mint(msg.sender,profit),'GWT mint error');
        //update token claim date
        _nftLastClaimDate[tokenId] = block.timestamp;

        //emit event
        emit ClaimNftProfit(msg.sender, tokenId, profit);


    }

    /** 
     * @dev Calculate profit generated by NFT since last claim or mint time
     * To calcultae we use upperRarityBound wich represent NFT with worst rarity stat. Less rarity = bigger profit.
     * @param tokenId ID of NFT
     */
    function _calcNftGwtProfit(uint256 tokenId) view public returns(uint){
        uint profitPerSecond = gwtPerDayForHundredRarity / 100 / 86400;
        uint secondsPassed = block.timestamp - _nftLastClaimDate[tokenId];//seconds since last claim
        uint claimableGwt = (upperRarityBound -  _rarityLevels[tokenId]) * profitPerSecond * secondsPassed;//lowest quality minus current quality * time passed

        return(claimableGwt);
    }

    /** 
     * @dev Calculate profit generated by all owned NFT since last claim or mint. 
     * @param _nftOwner  NFT owner address
     */
    function _calcAllNftGwtProfit(address _nftOwner) view public returns(uint){
        uint[] memory tokenIds = getTokensByOwner(_nftOwner);
        uint totalProfit;
        for (uint i=0; i < tokenIds.length; i++) {
            //calc total profit
            totalProfit += _calcNftGwtProfit(tokenIds[i]);
        }
        return totalProfit;
    }

    /**
     * @dev Override the transferFrom ERC721 function.
     * 10 USDT fee applied
     * When transferring NFT also move rarity to new owner.
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721, IERC721) {
        //get royalty 10 usdt to feecollector
        usdt.safeTransferFrom(msg.sender, feeCollector, transferFee);
        //decrease sender total rarity
        addressRarity[from] -= _rarityLevels[tokenId];
        addressRarity[to] += _rarityLevels[tokenId];

        // Call the original transferFrom function from the parent contract
        super.transferFrom(from, to, tokenId);

        
    }


    /**
     * @dev URI of NFT collection at IPFS
     * Each token ID from 1 to 10000 have ID.png and ID.json at URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Function to update the base URI, only callable by the owner.
     */
    function setBaseURI(string memory newBaseTokenURI) external onlyOwner {
        _baseTokenURI = newBaseTokenURI;
    }

    // The following functions are overrides required by Solidity.

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev promoter or owner can change daily GWT profit from 0.1 to 2 GWT for each 100 of clean rarity 
     */
    function setgwtPerDayForHundredRarity(uint amount) external onlyPromoter {
        require(1e17<=amount&&amount<=2e18, '[CNS] Out of range');
        gwtPerDayForHundredRarity = amount;
    }


    /**
     * @dev Check if caller is promoter or owner
     */
    modifier onlyPromoter() { 
        require(msg.sender == _promoter||msg.sender==owner(), "[CNS] Need promoter or higher"); 
        _; 
    }


    /**
     * @dev Changing address of _promoter
     */
    function changePromoter(address newPromoter) external onlyOwner {
        require(newPromoter!=address(0),'[CNS] Non zero address');
        _promoter = newPromoter;
    }


    /**
     * @dev Adding new address to the list of contracts that is allowed to mintNFT
     * @param allowedContract Allowed address
     */
    function addAllowedContract (address allowedContract) external onlyOwner {
        require(allowedContract!=address(0),'[CNS] Non zero address');
        allowedContractsMap[allowedContract] = true;
    }

    /**
     * @dev Removing address from the list of contracts that is allowed to mintNFT
     * @param allowedContract Allowed address to remove permission
     */
    function removeAllowedContract (address allowedContract) external onlyOwner {
        require(allowedContract!=address(0),'[CNS] Non zero address');
        allowedContractsMap[allowedContract] = false;
    }


    /**
     * @dev Check if checkedAddress is in allowed contracts list
     * @param checkedAddress Checked address
     */
    function returnAllowedContract(address checkedAddress) external view onlyOwner returns (bool) {
        return(allowedContractsMap[checkedAddress]);
    }

    /**
     * @dev Checks if address that made a call is on the map of allowed contracts
     */
    modifier onlyAllowed() { 
        require(allowedContractsMap[msg.sender], "403"); 
        _; 
    }


}