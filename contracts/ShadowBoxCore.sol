// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/lib/FheType.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import "encrypted-types/EncryptedTypes.sol";

contract ShadowBoxCore is ZamaEthereumConfig, Ownable, ReentrancyGuard {
    uint256 public nonce;
    bool public paused;

    mapping(address => uint256) public lastSubmission;
    mapping(address => bool) public hasSubmitted;

    mapping(address => bytes32) public userEligibility;
    mapping(address => bytes32) public userTier;
    mapping(address => bytes32) public userLootIndex;
    mapping(address => bytes32) public userRewardAmount;

    uint256 public constant SUBMISSION_COOLDOWN = 1 hours;

    struct EncryptedPayload {
        externalEuint64 balance;
        externalEuint32 nftFlags;
        externalEuint32 interactions;
        externalEuint32 sybilScore;
    }

    event EligibilityChecked(
        address indexed user,
        bytes32 eligibleCipher,
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
        EncryptedPayload calldata fhePayload,
        bytes calldata inputProof
    ) external nonReentrant {
        if (paused) revert ContractPaused();
        if (inputProof.length == 0) revert InvalidPayload();

        if (hasSubmitted[msg.sender]) {
            if (
                block.timestamp <
                lastSubmission[msg.sender] + SUBMISSION_COOLDOWN
            ) {
                revert SubmissionTooSoon();
            }
        }

        // Decode encrypted inputs from the relayer proof
        euint64 balance = FHE.fromExternal(fhePayload.balance, inputProof);
        euint32 nftFlags = FHE.fromExternal(fhePayload.nftFlags, inputProof);
        euint32 interactions = FHE.fromExternal(
            fhePayload.interactions,
            inputProof
        );
        euint32 sybilScore = FHE.fromExternal(
            fhePayload.sybilScore,
            inputProof
        );

        // Use the shared FHE evaluation helper so eligibility, tier, loot,
        // and reward are all computed inside the encrypted domain.
        uint256 currentNonce = nonce;
        nonce += 1;

        (
            ebool eligible,
            euint8 tier,
            euint32 lootIndex,
            euint256 rewardAmount
        ) = _evaluateFHE(balance, nftFlags, interactions, sybilScore, currentNonce);

        // Persist submission metadata
        lastSubmission[msg.sender] = block.timestamp;
        hasSubmitted[msg.sender] = true;

        // Grant decryption permissions to the contract and the user
        FHE.allowThis(eligible);
        FHE.allowThis(tier);
        FHE.allowThis(lootIndex);
        FHE.allowThis(rewardAmount);

        FHE.allow(eligible, msg.sender);
        FHE.allow(tier, msg.sender);
        FHE.allow(lootIndex, msg.sender);
        FHE.allow(rewardAmount, msg.sender);

        // Store encrypted blobs on-chain
        userEligibility[msg.sender] = FHE.toBytes32(eligible);
        userTier[msg.sender] = FHE.toBytes32(tier);
        userLootIndex[msg.sender] = FHE.toBytes32(lootIndex);
        userRewardAmount[msg.sender] = FHE.toBytes32(rewardAmount);

        emit EligibilityChecked(
            msg.sender,
            userEligibility[msg.sender],
            currentNonce
        );
    }

function _evaluateFHE(
        euint64 balance,
        euint32 nftFlags,
        euint32 interactions,
        euint32 sybilScore,
        uint256 currentNonce
    )
        internal
        returns (
            ebool eligible,
            euint8 tier,
            euint32 lootIndex,
            euint256 rewardAmount
        )
    {
        // 1. Eligibility Logic (more standard Web3 thresholds)
        // - Balance: >= 0.25 ETH
        // - NFT flags: at least one NFT flag set (bit 0)
        // - Interactions: >= 3
        // - Sybil score: <= 0.5 (scaled by 1e4 => 5000)
        euint64 threshold_balance = FHE.asEuint64(uint64(0.25 ether));
        euint32 required_flags = FHE.asEuint32(uint32(1));
        euint32 min_interactions = FHE.asEuint32(uint32(3));
        euint32 max_sybil_score = FHE.asEuint32(uint32(5000));

        ebool checkBalance = FHE.ge(balance, threshold_balance);
        ebool checkFlags = FHE.ne(
            FHE.and(nftFlags, required_flags),
            FHE.asEuint32(uint32(0))
        );
        ebool checkInteractions = FHE.ge(interactions, min_interactions);
        ebool checkSybil = FHE.le(sybilScore, max_sybil_score);

        eligible = FHE.and(
            FHE.and(checkBalance, checkFlags),
            FHE.and(checkInteractions, checkSybil)
        );

        // 2. Tier Logic
        // A more standard, linear scoring:
        //   score = balance_norm * 20 + interactions * 5
        //   Gold  : score >= 200
        //   Silver: score >= 100
        //   Bronze: otherwise
        euint64 balance_norm = FHE.div(balance, uint64(1 ether));
        euint64 score = FHE.add(
            FHE.mul(balance_norm, uint64(20)),
            FHE.asEuint64(FHE.mul(interactions, uint32(5)))
        );

        tier = FHE.select(
            FHE.ge(score, FHE.asEuint64(uint64(200))),
            FHE.asEuint8(uint8(2)), // Gold
            FHE.select(
                FHE.ge(score, FHE.asEuint64(uint64(100))),
                FHE.asEuint8(uint8(1)), // Silver
                FHE.asEuint8(uint8(0)) // Bronze
            )
        );
        tier = FHE.select(eligible, tier, FHE.asEuint8(uint8(0)));

        // 3. Loot Logic
        euint64 randomSeed = FHE.asEuint64(
            uint64(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            block.timestamp,
                            currentNonce,
                            msg.sender
                        )
                    )
                )
            )
        );
        euint64 encryptedNonce = FHE.asEuint64(uint64(currentNonce));

        euint64 randomValue = FHE.rem(
            FHE.add(randomSeed, encryptedNonce),
            uint64(100)
        );
        euint64 baseProbability = FHE.add(
            FHE.mul(FHE.asEuint64(tier), uint64(20)),
            FHE.asEuint64(uint64(30))
        );
        ebool isWinner = FHE.lt(randomValue, baseProbability);

        lootIndex = FHE.select(
            isWinner,
            FHE.asEuint32(FHE.rem(randomSeed, uint64(100))),
            FHE.asEuint32(uint32(0))
        );

        rewardAmount = FHE.select(
            FHE.eq(tier, FHE.asEuint8(uint8(2))),
            FHE.asEuint256(1000 ether), // Gold
            FHE.select(
                FHE.eq(tier, FHE.asEuint8(uint8(1))),
                FHE.asEuint256(500 ether), // Silver
                FHE.asEuint256(100 ether) // Bronze
            )
        );
        rewardAmount = FHE.select(
            FHE.and(isWinner, eligible),
            rewardAmount,
            FHE.asEuint256(0)
        );
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit ConfigUpdated(SUBMISSION_COOLDOWN, paused);
    }

    function getUserStatus(
        address user
    )
        external
        view
        returns (bool submitted, uint256 lastSubmissionTime, bool canSubmitNow)
    {
        submitted = hasSubmitted[user];
        lastSubmissionTime = lastSubmission[user];
        canSubmitNow =
            !paused &&
            (!submitted ||
                block.timestamp >= lastSubmissionTime + SUBMISSION_COOLDOWN);
    }

    function getUserEligibility(address user) external view returns (bytes32) {
        return userEligibility[user];
    }

    function getUserTier(address user) external view returns (bytes32) {
        return userTier[user];
    }

    function getUserLootIndex(address user) external view returns (bytes32) {
        return userLootIndex[user];
    }

    function getUserRewardAmount(address user) external view returns (bytes32) {
        return userRewardAmount[user];
    }
}
