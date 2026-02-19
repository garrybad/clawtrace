// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IFlashLoanReceiver
 * @dev Interface for flash loan callback - borrower must implement this
 */
interface IFlashLoanReceiver {
    /**
     * @dev Called by the pool when flash loan is initiated
     * @param token The loaned token address
     * @param amount The loaned amount
     * @param fee The flash loan fee (e.g. 0.09% = 9)
     * @param data Optional calldata passed by initiator
     */
    function executeOperation(
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external returns (bool);
}
