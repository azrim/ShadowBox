// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IRedeemer.sol";

contract Redeemer is IRedeemer, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    address public signer;
    IERC20 public rewardToken;
    mapping(bytes32 => bool) public usedVouchers;
    mapping(address => uint256) public rewardBalance;
    
    uint256 public totalRewardsDistributed;
    bool public paused;
    
    error VoucherAlreadyUsed();
    error VoucherExpired();
    error InvalidSignature();
    error ContractPaused();
    error InsufficientRewards();

    event SignerUpdated(address indexed oldSigner, address indexed newSigner);
    event RewardsAdded(uint256 amount);

    constructor(address _signer, address _rewardToken) Ownable(msg.sender) {
        signer = _signer;
        rewardToken = IERC20(_rewardToken);
        paused = false;
    }

    function redeem(
        Voucher calldata voucher,
        bytes calldata signature
    ) external override nonReentrant {
        if (paused) revert ContractPaused();
        if (block.timestamp > voucher.expiry) revert VoucherExpired();
        
        bytes32 voucherHash = _hashVoucher(voucher);
        
        if (usedVouchers[voucherHash]) revert VoucherAlreadyUsed();
        
        bytes32 ethSignedHash = voucherHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedHash.recover(signature);
        
        if (recoveredSigner != signer) revert InvalidSignature();
        
        usedVouchers[voucherHash] = true;
        rewardBalance[voucher.user] += voucher.amount;
        totalRewardsDistributed += voucher.amount;
        
        emit VoucherRedeemed(
            voucher.user,
            voucher.rewardType,
            voucher.amount,
            voucherHash
        );
    }

    function _hashVoucher(Voucher calldata voucher) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            voucher.user,
            voucher.rewardType,
            voucher.amount,
            voucher.expiry,
            voucher.voucherNonce
        ));
    }

    function setSigner(address _signer) external onlyOwner {
        address oldSigner = signer;
        signer = _signer;
        emit SignerUpdated(oldSigner, _signer);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }

    /// @notice Owner can fund the Redeemer with reward tokens.
    function addRewards(uint256 amount) external onlyOwner {
        bool ok = rewardToken.transferFrom(msg.sender, address(this), amount);
        require(ok, "Token transfer failed");
        emit RewardsAdded(amount);
    }

    /// @notice Users withdraw their accumulated ERC20 rewards.
    function withdrawRewards() external nonReentrant {
        uint256 amount = rewardBalance[msg.sender];
        if (amount == 0) revert InsufficientRewards();
        
        rewardBalance[msg.sender] = 0;
        
        bool ok = rewardToken.transfer(msg.sender, amount);
        require(ok, "Token transfer failed");
    }

    function checkVoucher(Voucher calldata voucher) external view returns (bool isValid, bool isUsed) {
        bytes32 voucherHash = _hashVoucher(voucher);
        isUsed = usedVouchers[voucherHash];
        isValid = block.timestamp <= voucher.expiry && !isUsed;
    }

    receive() external payable {
        revert("ETH not accepted");
    }
}
