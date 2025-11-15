// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ShadowBox Reward Token
/// @dev Simple ERC20 used for rewarding eligible users via the Redeemer contract.
contract RewardToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("ShadowBox Reward", "SHBX") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }
}