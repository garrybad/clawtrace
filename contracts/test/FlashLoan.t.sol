// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {MockToken} from "../src/MockToken.sol";
import {FlashLoanPool} from "../src/FlashLoanPool.sol";
import {FlashLoanBorrower} from "../src/FlashLoanBorrower.sol";

contract FlashLoanTest is Test {
    MockToken token;
    FlashLoanPool pool;
    FlashLoanBorrower borrower;

    function setUp() public {
        token = new MockToken("Test USDT", "tUSDT", 18);
        token.mint(address(this), 1_000_000 * 10 ** 18);

        pool = new FlashLoanPool(address(token));
        token.mint(address(pool), 100_000 * 10 ** 18);

        borrower = new FlashLoanBorrower(address(pool));
    }

    function test_executeFlashLoan_reverts() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                FlashLoanBorrower.InsufficientRepayment.selector,
                1e18 + 9e14, // amount + 0.09% fee
                1e18
            )
        );
        borrower.executeFlashLoan(1e18);
    }

    function test_executeFlashLoanAndRevert_reverts() public {
        vm.expectRevert("Arbitrage failed: insufficient profit");
        borrower.executeFlashLoanAndRevert(1e18);
    }
}
