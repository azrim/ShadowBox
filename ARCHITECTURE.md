# ShadowBox Architecture

## System Overview

ShadowBox is a privacy-preserving airdrop system that uses Fully Homomorphic Encryption (FHE) to keep user data private while still computing eligibility, tier assignment, and reward distribution on-chain.

## Core Components

### 1. Smart Contracts

#### ShadowBoxCore
**Purpose**: Main contract for eligibility evaluation and loot generation

**Key Features**:
- Accepts encrypted user data payloads
- Evaluates eligibility using FHE circuits (currently mocked)
- Assigns tier (Bronze/Silver/Gold) in encrypted form
- Generates encrypted loot boxes
- Enforces cooldown periods between submissions
- Emits `EligibilityChecked` events with encrypted data

**State Variables**:
```solidity
uint256 public nonce;              // Increments with each submission
bool public paused;                // Admin pause switch
mapping(address => uint256) public lastSubmission;  // Cooldown tracking
mapping(address => bool) public hasSubmitted;       // First submission flag
```

**Main Functions**:
- `submitEligibility(bytes fhePayload)` - Submit encrypted data
- `getUserStatus(address)` - Check submission status
- `setPaused(bool)` - Admin pause control

#### Redeemer
**Purpose**: Handles voucher validation and reward redemption

**Key Features**:
- Validates cryptographically signed vouchers
- Prevents voucher replay attacks
- Manages reward balances
- Enables ETH reward withdrawals
- Supports pausing and signer updates

**State Variables**:
```solidity
address public signer;                          // Authorized voucher signer
mapping(bytes32 => bool) public usedVouchers;   // Prevents double-spend
mapping(address => uint256) public rewardBalance; // User reward tracking
```

**Main Functions**:
- `redeem(Voucher, signature)` - Redeem a signed voucher
- `withdrawRewards()` - Withdraw accumulated rewards
- `checkVoucher(Voucher)` - Validate voucher without redemption
- `setSigner(address)` - Update authorized signer

### 2. FHE Circuits

Currently implemented as mock circuits for local development. Production deployment requires integration with Zama FHEVM.

#### eligibility.fhe
Evaluates: `balance >= threshold AND nftFlags != 0 AND interactions >= min AND sybilScore <= max`

#### tier.fhe
Computes tier based on weighted score: `(balance * 40 + interactions * 20 + eligibilityScore)`

#### loot.fhe
Generates randomized loot with tier-weighted probability

### 3. Frontend Application

**Technology Stack**:
- Next.js 14 (React framework)
- TypeScript (type safety)
- TailwindCSS (styling)
- wagmi + RainbowKit (wallet integration)
- ethers.js v6 (blockchain interaction)
- libsodium-wrappers (encryption)
- hkdf (key derivation)

**Key Pages**:

| Page | Purpose |
|------|---------|
| `/` | Landing page with feature overview |
| `/demo` | Interactive demo scenarios |
| `/prepare` | Eligibility data input and submission |
| `/status` | View submission history and results |
| `/decrypt` | Decrypt and view loot box contents |

**Key Components**:

| Component | Responsibility |
|-----------|---------------|
| `Layout` | Navigation and common UI structure |
| `ConnectWallet` | Wallet connection UI |
| `EncryptionFlow` | Data encryption and submission |
| `StatusView` | Display eligibility events |
| `DecryptionFlow` | Loot box decryption |

## Data Flow

### 1. Eligibility Submission Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. User enters data
       ▼
┌─────────────────────┐
│ createEligibility   │
│ Payload()           │
└──────┬──────────────┘
       │ 2. Structure data
       ▼
┌─────────────────────┐
│ deriveKeyFrom       │
│ Signature()         │ ◄─── User signs message
└──────┬──────────────┘
       │ 3. HKDF key derivation
       ▼
┌─────────────────────┐
│ encryptPayload()    │ ◄─── libsodium AES-GCM
└──────┬──────────────┘
       │ 4. Encrypted payload
       ▼
┌─────────────────────┐
│ submitEligibility() │ ───► ShadowBoxCore.sol
└──────┬──────────────┘
       │ 5. Transaction sent
       ▼
┌─────────────────────┐
│ FHE Evaluation      │
│ (Mock/Real)         │
└──────┬──────────────┘
       │ 6. Compute results
       ▼
┌─────────────────────┐
│ Emit Eligibility    │
│ Checked Event       │
└──────┬──────────────┘
       │ 7. Event logged
       ▼
┌─────────────────────┐
│ Frontend listens    │
│ for event           │
└─────────────────────┘
```

### 2. Loot Decryption Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. Fetch event
       ▼
┌─────────────────────┐
│ Get lootCipher      │
│ from event          │
└──────┬──────────────┘
       │ 2. Extract encrypted data
       ▼
┌─────────────────────┐
│ deriveKeyFrom       │
│ Signature()         │ ◄─── Same signature as encryption
└──────┬──────────────┘
       │ 3. Regenerate same key
       ▼
┌─────────────────────┐
│ decryptLootCipher() │ ◄─── libsodium decrypt
└──────┬──────────────┘
       │ 4. Plaintext loot data
       ▼
┌─────────────────────┐
│ Display loot        │
│ {tier, type,        │
│  amount, voucher}   │
└──────┬──────────────┘
       │ 5. Show UI
       ▼
┌─────────────────────┐
│ Optional: Redeem    │
│ voucher             │
└─────────────────────┘
```

### 3. Voucher Redemption Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. User has voucher data
       ▼
┌─────────────────────┐
│ Voucher = {         │
│   user, type,       │
│   amount, expiry,   │
│   nonce             │
│ }                   │
└──────┬──────────────┘
       │ 2. Voucher struct
       ▼
┌─────────────────────┐
│ hash = keccak256(   │
│   encode(voucher)   │
│ )                   │
└──────┬──────────────┘
       │ 3. Compute hash
       ▼
┌─────────────────────┐
│ signature = sign(   │
│   hash, signerKey   │
│ )                   │ ◄─── Off-chain signer
└──────┬──────────────┘
       │ 4. Create signature
       ▼
┌─────────────────────┐
│ redeem(voucher,     │
│   signature)        │ ───► Redeemer.sol
└──────┬──────────────┘
       │ 5. Submit transaction
       ▼
┌─────────────────────┐
│ Validate:           │
│ - Not expired       │
│ - Not used          │
│ - Valid signature   │
└──────┬──────────────┘
       │ 6. Checks pass
       ▼
┌─────────────────────┐
│ Update:             │
│ - Mark used         │
│ - Credit balance    │
└──────┬──────────────┘
       │ 7. State updated
       ▼
┌─────────────────────┐
│ User withdraws      │
│ rewards             │
└─────────────────────┘
```

## Cryptographic Primitives

### Key Derivation (HKDF)

```typescript
message = `shadowbox:key:${timestamp}`
signature = wallet.signMessage(message)  // ECDSA signature
key = HKDF-SHA256(signature, salt=null, info="shadowbox-key", length=32)
```

**Properties**:
- Deterministic: same signature → same key
- Unpredictable: signature acts as high-entropy input
- Unique per timestamp: prevents replay if desired

### Symmetric Encryption (libsodium)

```typescript
nonce = randombytes(24)  // crypto_secretbox_NONCEBYTES
cipher = crypto_secretbox_easy(plaintext, nonce, key)
```

**Algorithm**: XSalsa20-Poly1305 (authenticated encryption)

**Security**:
- 256-bit key
- 192-bit nonce
- Authenticated (prevents tampering)

### Signature Verification (ECDSA)

```solidity
voucherHash = keccak256(abi.encode(voucher))
ethSignedHash = keccak256("\x19Ethereum Signed Message:\n32", voucherHash)
recoveredSigner = ecrecover(ethSignedHash, v, r, s)
require(recoveredSigner == authorizedSigner)
```

## Security Model

### Threat Model

**Assumptions**:
1. User's wallet private key is secure
2. Browser environment is not compromised
3. HTTPS prevents MITM attacks
4. Smart contract is correctly implemented

**Adversary Capabilities**:
- Can observe all on-chain data
- Can submit own eligibility checks
- Can attempt voucher forgery
- Cannot break ECDSA or decrypt ciphertexts

### Privacy Guarantees

| Data | Visibility |
|------|-----------|
| Balance | ❌ Encrypted on-chain |
| NFT holdings | ❌ Encrypted on-chain |
| Interactions | ❌ Encrypted on-chain |
| Sybil score | ❌ Encrypted on-chain |
| Eligibility boolean | ✅ Public on-chain |
| Tier assignment | ❌ Encrypted on-chain |
| Loot contents | ❌ Encrypted on-chain |
| Decrypted loot | ❌ Local only |

### Attack Vectors & Mitigations

| Attack | Mitigation |
|--------|-----------|
| Voucher replay | Track used vouchers on-chain |
| Voucher forgery | Cryptographic signature verification |
| Front-running | Cooldown period, nonce-based randomness |
| Key theft | Keys never stored, derived on-demand |
| DoS submissions | Rate limiting via cooldown |
| Contract pause abuse | Owner-only, auditable |

## Performance Considerations

### Gas Costs

**ShadowBoxCore.submitEligibility()**:
- Mock mode: ~150k-200k gas
- Real FHE: TBD (depends on circuit complexity)

**Redeemer.redeem()**:
- Voucher validation: ~50k-80k gas

### Frontend Performance

- Initial load: ~2-3s
- Wallet connection: <1s
- Encryption: <100ms
- Decryption: <100ms
- Transaction confirmation: 2-15s (network dependent)

## Scalability

### Current Limitations

1. **Sequential submissions**: 1-hour cooldown per user
2. **On-chain storage**: Events only, minimal state
3. **FHE computation**: May be slower than plaintext

### Scaling Strategies

1. **Layer 2**: Deploy on L2 for lower costs
2. **Batch processing**: Aggregate multiple submissions
3. **Off-chain computation**: Use FHE off-chain with ZK proofs
4. **Parallel processing**: Remove global locks

## Future Enhancements

### Short Term
- [ ] Real FHEVM integration
- [ ] Enhanced UI/UX
- [ ] Mobile wallet support
- [ ] Multi-token rewards

### Long Term
- [ ] Cross-chain support
- [ ] Delegated eligibility checks
- [ ] Dynamic tier thresholds
- [ ] On-chain governance
- [ ] Advanced anti-sybil measures

## Testing Strategy

### Unit Tests
- Contract logic (31 tests, all passing)
- Encryption/decryption utilities
- Key derivation functions

### Integration Tests
- End-to-end submission flow
- Event listening and parsing
- Voucher redemption flow

### Security Tests
- Signature verification
- Replay attack prevention
- Access control checks
- Pause mechanisms

## Deployment Checklist

- [x] Compile contracts
- [x] Run test suite
- [ ] Security audit
- [ ] Testnet deployment
- [ ] Frontend deployment
- [ ] Monitoring setup
- [ ] User documentation
- [ ] Bug bounty program

---

**Last Updated**: 2025-11-15
