// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ShadowBoxCore is Ownable, ReentrancyGuard {
    uint256 public nonce;
    bool public paused;
    
    mapping(address => uint256) public lastSubmission;
    mapping(address => bool) public hasSubmitted;
    
    uint256 public constant SUBMISSION_COOLDOWN = 1 hours;
    
    event EligibilityChecked(
        address indexed user,
        bool eligible,
        bytes tierCipher,
        bytes lootCipher,
        uint256 nonce
    );
    
    event ConfigUpdated(uint256 cooldown, bool paused);
    
    error ContractPaused();
    error SubmissionTooSoon();
    error InvalidPayload();

    constructor() Ownable(msg.sender) {
        nonce = 0;
        paused = false;
    }

    function submitEligibility(
        bytes calldata fhePayload
    ) external nonReentrant {
        if (paused) revert ContractPaused();
        if (fhePayload.length == 0) revert InvalidPayload();
        
        if (hasSubmitted[msg.sender]) {
            if (block.timestamp < lastSubmission[msg.sender] + SUBMISSION_COOLDOWN) {
                revert SubmissionTooSoon();
            }
        }
        
        (bool eligible, bytes memory tierCipher, bytes memory lootCipher) = 
            _evaluateFHE(fhePayload, nonce);
        
        lastSubmission[msg.sender] = block.timestamp;
        hasSubmitted[msg.sender] = true;
        nonce += 1;
        
        emit EligibilityChecked(
            msg.sender,
            eligible,
            tierCipher,
            lootCipher,
            nonce - 1
        );
    }
    
    function _evaluateFHE(
        bytes calldata fhePayload,
        uint256 currentNonce
    ) internal view returns (bool eligible, bytes memory tierCipher, bytes memory lootCipher) {
        uint256 mockScore = uint256(keccak256(fhePayload)) % 100;
        eligible = mockScore >= 30;
        
        uint8 tier = eligible ? uint8(mockScore % 3) : 0;
        tierCipher = abi.encodePacked(
            keccak256(abi.encodePacked(fhePayload, "tier", currentNonce)),
            tier
        );
        
        uint256 lootIndex = uint256(keccak256(abi.encodePacked(
            fhePayload,
            currentNonce,
            block.timestamp,
            msg.sender
        ))) % 100;
        
        lootCipher = abi.encodePacked(
            keccak256(abi.encodePacked(fhePayload, "loot", currentNonce)),
            lootIndex,
            tier,
            eligible
        );
        
        return (eligible, tierCipher, lootCipher);
    }
    
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit ConfigUpdated(SUBMISSION_COOLDOWN, paused);
    }
    
    function getUserStatus(address user) external view returns (
        bool submitted,
        uint256 lastSubmissionTime,
        bool canSubmitNow
    ) {
        submitted = hasSubmitted[user];
        lastSubmissionTime = lastSubmission[user];
        canSubmitNow = !paused && 
            (!submitted || block.timestamp >= lastSubmissionTime + SUBMISSION_COOLDOWN);
    }
}
