// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MockToken} from "../src/MockToken.sol";
import {FlashLoanPool} from "../src/FlashLoanPool.sol";
import {FlashLoanBorrower} from "../src/FlashLoanBorrower.sol";

/**
 * @title DeployFlashLoan
 * @dev Deploy flash loan mock for BSC Testnet (chain 97)
 * Run: forge script script/DeployFlashLoan.s.sol --rpc-url bsc-testnet --broadcast
 */
contract DeployFlashLoan is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        MockToken token = new MockToken("Test USDT", "tUSDT", 18);
        token.mint(msg.sender, 1_000_000 * 10 ** 18);

        FlashLoanPool pool = new FlashLoanPool(address(token));
        token.mint(address(pool), 100_000 * 10 ** 18); // pool liquidity

        FlashLoanBorrower borrower = new FlashLoanBorrower(address(pool));

        console.log("MockToken:", address(token));
        console.log("FlashLoanPool:", address(pool));
        console.log("FlashLoanBorrower:", address(borrower));

        vm.stopBroadcast();
    }
}
