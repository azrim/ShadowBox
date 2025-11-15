// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IFHEEvaluator {
    function evaluateEligibility(
        bytes calldata fhePayload,
        uint256 nonce
    ) external view returns (bool eligible, bytes memory tierCipher, bytes memory lootCipher);
}
