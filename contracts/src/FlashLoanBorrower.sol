// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IFlashLoanReceiver} from "./IFlashLoanReceiver.sol";
import {FlashLoanPool} from "./FlashLoanPool.sol";

/**
 * @title FlashLoanBorrower
 * @dev Borrower that INTENTIONALLY REVERTS in executeOperation for ClawTrace testing
 * - executeFlashLoan(amount): reverts with InsufficientRepayment (no tokens to repay fee)
 * - executeFlashLoanAndRevert(amount): reverts with "Arbitrage failed" (force revert)
 */
contract FlashLoanBorrower is IFlashLoanReceiver {
    using SafeERC20 for IERC20;

    FlashLoanPool public immutable pool;

    error InsufficientRepayment(uint256 required, uint256 provided);

    constructor(address _pool) {
        pool = FlashLoanPool(_pool);
    }

    /**
     * @dev Initiate flash loan - will revert in callback (no tokens to repay)
     */
    function executeFlashLoan(uint256 amount) external {
        pool.flashLoan(address(this), amount, "");
    }

    /**
     * @dev Initiate flash loan - force revert with message (data[0] == 1)
     */
    function executeFlashLoanAndRevert(uint256 amount) external {
        pool.flashLoan(address(this), amount, hex"01");
    }

    /**
     * @dev Callback - reverts when data[0]==1, else reverts on InsufficientRepayment
     */
    function executeOperation(
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external override returns (bool) {
        require(msg.sender == address(pool), "FlashLoanBorrower: caller not pool");

        // Force revert path for executeFlashLoanAndRevert
        if (data.length > 0 && data[0] == 0x01) {
            revert("Arbitrage failed: insufficient profit");
        }

        // Normal path: we received `amount` tokens but have no extra to repay fee
        uint256 totalRepay = amount + fee;
        uint256 ourBalance = IERC20(token).balanceOf(address(this));

        if (ourBalance < totalRepay) {
            revert InsufficientRepayment(totalRepay, ourBalance);
        }

        IERC20(token).forceApprove(address(pool), totalRepay);
        return true;
    }
}
