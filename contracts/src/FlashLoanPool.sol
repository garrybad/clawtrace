// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IFlashLoanReceiver} from "./IFlashLoanReceiver.sol";

/**
 * @title FlashLoanPool
 * @dev Simple flash loan pool for testing - BSC Testnet
 * Flow: borrow -> callback executeOperation -> repay (or revert)
 */
contract FlashLoanPool {
    using SafeERC20 for IERC20;

    uint256 public constant FEE_BPS = 9; // 0.09%
    address public immutable token;

    error InsufficientLiquidity(uint256 requested, uint256 available);
    error FlashLoanNotRepaid(uint256 expected, uint256 actual);
    error InvalidReceiver();
    error InvalidAmount();

    constructor(address _token) {
        token = _token;
    }

    /**
     * @dev Deposit tokens to provide liquidity
     */
    function deposit(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @dev Execute flash loan
     * @param receiver Contract implementing IFlashLoanReceiver
     * @param amount Amount to borrow
     * @param data Optional data passed to callback
     */
    function flashLoan(
        address receiver,
        uint256 amount,
        bytes calldata data
    ) external {
        if (receiver == address(0)) revert InvalidReceiver();
        if (amount == 0) revert InvalidAmount();

        uint256 balanceBefore = IERC20(token).balanceOf(address(this));
        if (balanceBefore < amount) revert InsufficientLiquidity(amount, balanceBefore);

        uint256 fee = (amount * FEE_BPS) / 10000;
        uint256 totalRepay = amount + fee;

        // 1. Transfer loan to receiver
        IERC20(token).safeTransfer(receiver, amount);

        // 2. Callback - receiver must repay amount + fee
        bool success = IFlashLoanReceiver(receiver).executeOperation(token, amount, fee, data);

        if (!success) {
            revert("FlashLoan: executeOperation returned false");
        }

        // 3. Verify repayment
        uint256 balanceAfter = IERC20(token).balanceOf(address(this));
        if (balanceAfter < balanceBefore + fee) {
            revert FlashLoanNotRepaid(totalRepay, balanceAfter - balanceBefore);
        }
    }

    function balance() external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
