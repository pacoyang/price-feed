// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {OffchainAggregator} from "../src/OffchainAggregator.sol";

contract OffchainAggregatorTest is Test {
    OffchainAggregator public aggregator;

    function setUp() public {
        aggregator = new OffchainAggregator();
    }

    function test_transmit() public {
        uint80 roundId = 110680464442257320685;
        aggregator.transmit(
          roundId,
          3986495534369,
          1706190947
        );
        console2.log(aggregator.latestRound());
        assertEq(aggregator.latestRound(), roundId & 0xFFFFFFFFFFFFFFFF);
    }
}
