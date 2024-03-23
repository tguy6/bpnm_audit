// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

//using OZ version 4.9.3 for compatibility with Phenomenal Tree and GWT
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev Interface for a bPNM.
 */
interface BpnmInt {
    function balanceOf(address account) external view returns (uint256);
    function _payment() external view returns (uint);//active payment ID
    function _getPaymentContract(uint paymentID) external view returns(IERC20);
    function liquidityCollector() external view returns(address);
    function getBtcPrice() external view returns(uint);
}


/**
 * @dev BTCB liquidity distributor for bPNM
 * Contract stores liquidity in BTCB. When triggered it checks if timer (24h by default) for new liquidity unlock is passed since last liquidity unlock and release new liquidity
 * Liquidity is released in amount equal to percent from bPNM liquidity at the moment of check with performance formula applied
 * If collector do not have enough liquidity then release all available collector liquidity
 */
contract PhenomenalLiquidityDistributor is Ownable {
    using SafeERC20 for IERC20;
    IERC20 public immutable btcb;
    BpnmInt public immutable bpnm;
    address private _promoter;//address for changing distribution conditions

    bool isPrestart = true;
    uint public LastLiquidityUnlockTime;//time of last BTCB iquidity unlock to bPNM liquidity
    uint public LiquidityUnlockPercent = 50;//amount in percent of liquidity that unlocked in period of time. 50 = 0.5%
    uint public LiquidityUnlockPeriod = 24 hours;//period when new liquidity is unlocked

    //event for unlock
    event LiquidityUnlock(uint indexed unlockTimestamp, uint unlockBtcbAmount, uint bpnmBtcbBalance);

    constructor(IERC20 _btcbTokenAddress, BpnmInt _bpnmTokenAddress) {
        require(address(_btcbTokenAddress)!=address(0),"[PLD] Non zero address");
        require(address(_bpnmTokenAddress)!=address(0),"[PLD] Non zero address");
        
        bpnm = _bpnmTokenAddress;
        btcb = _btcbTokenAddress;
    }

    /**
     * @dev Main function that triggered from bPNM on buyBpnm / sellBpnm / buyLimitPack
     * Unlock liquidity and transfer it to bPNM if 24h have passed since last unlock
     * Use performance formula that is applied to LiquidityUnlockPercent. The bigger reserves the closer unlocked liquidity amount to LiquidityUnlockPercent
     * Can be triggered by anyone to force unlock if timer is due.
     */
    function performUnlock() external returns(bool){
        uint pldBalance = btcb.balanceOf(address(this));//BTCB liquidity in PLD contract
        uint bpnmLiquidity = btcb.balanceOf(address(bpnm));//BTCB liquidity in bPNM contract
        
        if (isPrestart) {
            return(false);
        }

        //if no liquidity then no unlock
        if (pldBalance == 0||bpnmLiquidity == 0) {
            return(false);
        }

        //check if time passed after last liquidity unlock
        if ((LastLiquidityUnlockTime + LiquidityUnlockPeriod) > block.timestamp) {
            return(false);
        }
        //calc max unlock with formula
        IERC20 stableToken = bpnm._getPaymentContract(bpnm._payment());//stable payment contract system used in bPNM

        uint btcPrice = bpnm.getBtcPrice();
        uint feeLiquidityInUsdt = stableToken.balanceOf(bpnm.liquidityCollector());//USDT liquidity from fees
        uint feeLiquidityInBtcb = feeLiquidityInUsdt*1e18/btcPrice;//USDT liquidity from fees equivalent in BTCB

        //Release formula: (1 - ( btcb bpnm / (btcb bpnm + btcb pld + btcb usdt) )) * LiquidityUnlockPercent)
        uint unlockedBtcbPercent = (1e18-(bpnmLiquidity*1e18/(bpnmLiquidity+pldBalance+feeLiquidityInBtcb)))*LiquidityUnlockPercent/10000;
        uint unlockedBtcbAmount = unlockedBtcbPercent * bpnmLiquidity / 1e18;

        //transfer liquidity to bPNM
        if (unlockedBtcbAmount <= btcb.balanceOf(address(this))) {
            btcb.safeTransfer(address(bpnm),unlockedBtcbAmount);
        } else if (btcb.balanceOf(address(this))>0) {
            unlockedBtcbAmount = btcb.balanceOf(address(this));
            btcb.safeTransfer(address(bpnm),unlockedBtcbAmount);
        }

        //update last unlock time
        LastLiquidityUnlockTime = block.timestamp;

        //emit event
        emit LiquidityUnlock(LastLiquidityUnlockTime,unlockedBtcbAmount,bpnmLiquidity);
        return true;
    }

    /**
     * @dev Check if caller is promoter or owner
     */
    modifier onlyPromoter() { 
        require(msg.sender == _promoter||msg.sender==owner(), "[PLD] Need promoter or higher"); 
        _; 
    }

    /** 
     * @dev Change unlock period in range 12-48 hours. 24 by default
     * @param _hours Amount of hours for unlock period cooldown
     */
    function setUnlockPeriod(uint _hours) public onlyPromoter {
        require(12<=_hours&&_hours<=48, 'Out of range');
        LiquidityUnlockPeriod = _hours * 1 hours;

    }
    
    /** 
     * @dev Change unlock liquidity percent amount
     * @param _percent Amount of percents. 50 = 0.5%
     */
    function setUnlockPercent(uint _percent) public onlyPromoter {
        require(10<=_percent&&_percent<=100, 'Out of range');
        LiquidityUnlockPercent = _percent;

    }

    /** 
     * @dev Init PLD after bPNM prestart finished
     * Set last unlock to current block so when first bPNM purchase is performed PLD do not unlock liquidity but wait for 24h
     */
    function disablePrestart() external onlyPromoter {
        require(LastLiquidityUnlockTime==0&&isPrestart, '[PLD] Already disabled');
        isPrestart = false;
        LastLiquidityUnlockTime = block.timestamp;
    }

    /**
     * @dev Get promoter address
     */
    function promoter() external view onlyOwner returns(address) {
        return _promoter;
    }

    /**
     * @dev Changing address of _promoter
     */
    function changePromoter(address newPromoter) external onlyOwner {
        require(newPromoter!=address(0),'[PLD] Non zero address');
        _promoter = newPromoter;
    }


}