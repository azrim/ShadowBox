# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

ShadowBox is a hybrid private airdrop system built on Zama FHEVM. It combines:
- **Smart contracts** (Hardhat/TypeScript) in `contracts/` orchestrating eligibility checks, tier assignment, loot generation, and voucher redemption.
- **FHE circuit configuration** in `fhe-circuits/` describing encrypted computations (eligibility, tier, loot) used by the FHE layer.
- A **Next.js 14 frontend** in `frontend/` that derives encryption keys from wallet signatures, encrypts eligibility data client‑side, submits encrypted payloads on-chain, and decrypts loot locally.

The original design blueprint (`shadow_box_full_blueprint_hybrid_shadow_airdrop.md`) is **historical**; the current code may diverge (e.g., real FHE integration, Sepolia deployment instead of Zama testnet). Treat the live code and this file as the source of truth.

## Key commands

All commands assume you start from the repo root `ShadowBox/` unless otherwise noted.

### Root (contracts, FHE integration, scripts)

- **Install dependencies**
  - Root:
    - `npm install`
  - Frontend:
    - `cd frontend && npm install`

- **Compile contracts**
  - `npm run compile`  (alias for `hardhat compile`)

- **Run all contract tests**
  - `npm run test`  (alias for `hardhat test`)

- **Run specific contract tests (by file)**
  - `npx hardhat test test/eligibility.test.ts`
  - `npx hardhat test test/redeem.test.ts`

- **Coverage for contracts**
  - `npx hardhat coverage`

- **Start local Hardhat node**
  - `npm run node`  (alias for `hardhat node`)

- **Deploy contracts**
  - To the default configured network (`sepolia` via `hardhat.config.ts`):
    - `npm run deploy`
  - For explicit networks:
    - Local Hardhat network:
      - `npx hardhat node`
      - `npx hardhat run scripts/deploy.ts --network localhost`

- **Seed loot configuration**
  - `npm run seed`  (runs `scripts/seedLoot.ts` via Hardhat)

### Frontend (Next.js app in `frontend/`)

From `frontend/`:

- **Development server**
  - `npm run dev`
  - App runs at `http://localhost:3000`.

- **Production build & start**
  - `npm run build`
  - `npm run start`

- **Lint & type‑check**
  - `npm run lint`       (Next.js ESLint)
  - `npm run type-check` (TypeScript `tsc --noEmit`)

- **Example Vercel deployment command (from README)**
  - `vercel deploy`
  - Ensure environment variables are configured in Vercel (`NEXT_PUBLIC_SHADOWBOX_ADDRESS`, `NEXT_PUBLIC_REDEEMER_ADDRESS`, `NEXT_PUBLIC_RPC_URL`).

## Environment & configuration

The project relies on both **root** and **frontend** environment files. Use the examples in the repo as the source of truth.

- **Root `.env`**
  - Copy template: `cp .env.example .env`.
  - Holds values such as RPC URLs and deployer private key for Hardhat networks (e.g., Sepolia, Zama testnet). Hardhat scripts (`npm run deploy`, `npm run seed`, etc.) expect these to be configured.

- **Frontend `.env.local`**
  - From `frontend/`:
    - `cp .env.example .env.local`.
  - At minimum, set (per `README.md`):
    - `NEXT_PUBLIC_SHADOWBOX_ADDRESS`
    - `NEXT_PUBLIC_REDEEMER_ADDRESS`
    - `NEXT_PUBLIC_RPC_URL`
  - These connect the Next.js app to the deployed contracts and the correct RPC.

## High‑level architecture

### 1. Client flow (browser)

**Location:** `frontend/src/`

- **Key derivation & encryption**
  - The frontend derives an encryption key from a wallet signature (HKDF‑SHA256) and uses libsodium‑based primitives to encrypt eligibility data entirely client‑side.
- **Submission**
  - Encrypted payloads are submitted to the ShadowBox contracts using `ethers`/`wagmi` integration.
- **Decryption & loot reveal**
  - After eligibility is processed on-chain, the frontend reads encrypted loot from contract events, re‑derives the key via the same signature flow, and decrypts loot locally.
- **Main UI areas (per README)**
  - Connect wallet, prepare eligibility data (`/prepare`), submit & check status (`/status`), decrypt loot, and redeem vouchers.

The frontend is a standard Next.js 14 app:
- **Routing:** `frontend/src/pages/` hosts the main routes.
- **Reusable UI:** `frontend/src/components/` for shared UI blocks.
- **Domain logic helpers:** `frontend/src/lib/` for contract interaction, encryption helpers, and general utilities.
- **Styling:** TailwindCSS via PostCSS pipeline; styles live under `frontend/src/styles/`.

### 2. Smart contracts & FHE layer

**Location:** `contracts/`, `fhe-circuits/`, `test/`, `scripts/`, `hardhat.config.ts`

- **ShadowBoxCore (core eligibility contract)**
  - Receives encrypted eligibility payloads.
  - Uses FHEVM primitives (via `@fhevm/solidity` and circuit configs in `fhe-circuits/`) to:
    - Evaluate eligibility based on encrypted user metrics.
    - Assign encrypted tiers (Bronze/Silver/Gold).
    - Generate encrypted loot blobs.
  - Emits events that contain encrypted results (tier and loot) while keeping user inputs private.
  - Exposes a status view (`getUserStatus`) and owner controls (e.g., `setPaused`).

- **Redeemer (voucher redemption contract)**
  - Validates signed vouchers and ensures they are not reused.
  - Handles token/NFT reward distribution for valid vouchers.
  - Exposes helper methods (e.g., `checkVoucher`) and withdrawal logic.

- **FHE circuits** (`fhe-circuits/`)
  - Files like `eligibility.fhe`, `tier.fhe`, and `loot.fhe` define the homomorphic operations run by the FHEVM.
  - They mirror the logical steps described in `README.md` and the blueprint: eligibility evaluation → tier computation → loot generation.

- **Hardhat configuration & scripts**
  - `hardhat.config.ts` wires networks, compilers, paths, and plugins (`@nomicfoundation/hardhat-toolbox`, coverage, etc.).
  - `scripts/deploy.ts` handles deployment of `ShadowBoxCore`, `Redeemer`, and any related setup.
  - `scripts/seedLoot.ts` configures on-chain loot tables or reward metadata used by `ShadowBoxCore`.

### 3. Testing strategy

**Location:** `test/`

- Tests are written in TypeScript and run via Hardhat:
  - `test/eligibility.test.ts` focuses on ShadowBoxCore eligibility behavior, cooldowns, and event emission.
  - `test/redeem.test.ts` covers voucher validation, redeem flows, and edge cases like double spends.
- Use:
  - `npm run test` for the full suite.
  - `npx hardhat test test/eligibility.test.ts` (or another test file) to target specific areas.
  - `npx hardhat coverage` for coverage metrics.

## Additional references

- The main high‑level documentation is `README.md` (project description, usage flow, deployment and testing recipes).
- For a deeper protocol/cryptography description, consult `shadow_box_full_blueprint_hybrid_shadow_airdrop.md`.
- External docs referenced in `README.md`:
  - Zama docs: https://docs.zama.ai
  - FHEVM: https://github.com/zama-ai/fhevm
