// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRedeemer {
    struct Voucher {
        address user;
        uint256 rewardType;
        uint256 amount;
        uint256 expiry;
        uint256 voucherNonce;
    }

    event VoucherRedeemed(
        address indexed user,
        uint256 rewardType,
        uint256 amount,
        bytes32 voucherHash
    );

    function redeem(
        Voucher calldata voucher,
        bytes calldata signature
    ) external;
}
