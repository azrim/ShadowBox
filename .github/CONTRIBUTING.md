# Contributing to ShadowBox

Thanks for your interest in contributing to ShadowBox! This project explores hybrid private airdrops on FHEVM. Contributions that improve security, reliability, and developer experience are especially welcome.

## How to Contribute

### 1. Fork & Branch

1. Fork the repository to your own GitHub account.
2. Clone your fork locally.
3. Create a feature branch:

```bash
git checkout -b feat/my-awesome-change
```

Please avoid working directly on the `main` branch.

### 2. Set Up the Project

Follow the instructions in `README.md` to:

1. Install dependencies at the root and in `frontend/`.
2. Configure `.env` and `frontend/.env.local`.
3. Compile and deploy contracts (local or testnet).
4. Run the frontend locally.

Make sure you can run:

```bash
# contracts
npm run compile
npm run test

# frontend
cd frontend
npm run lint
npm run type-check
npm run dev --webpack
```

### 3. Coding Guidelines

- Use existing patterns and styles in the codebase as a guide.
- Favor small, composable functions and clear naming.
- Keep public APIs (contracts, lib functions) well-documented with comments.
- For Solidity:
  - Target the same pragma as existing contracts.
  - Use OpenZeppelin primitives where appropriate.
  - Avoid unnecessary state writes and external calls.
- For TypeScript / React:
  - Use functional components and hooks.
  - Keep components presentational where possible; push logic into `lib/`.

### 4. Tests

- Add or update tests for any behavior changes.
- For contracts:
  - Put tests under `test/`.
  - Prefer clear, behavior-driven test names.
- For frontend:
  - If adding complex logic, consider extracting it to a testable utility.

Before opening a PR, please run:

```bash
# root
npm run test

# optional but recommended
npx hardhat coverage

# frontend
cd frontend
npm run lint
npm run type-check
```

### 5. Commit Messages

Use clear, descriptive commit messages, e.g.

- `feat(core): add cooldown to eligibility submissions`
- `fix(frontend): handle FHE node disconnection`
- `chore: bump wagmi and viem versions`

### 6. Pull Requests

When opening a PR, include:

- A short summary of the change.
- Whether it affects contracts, frontend, or both.
- Any breaking changes or migration steps.
- How you tested it (commands, networks, accounts used).

Small, focused PRs are much easier to review than large batches of unrelated changes.

### 7. Design & Security Changes

For changes that affect:
- Eligibility logic or FHE circuits
- Reward sizing and tiers
- Voucher issuance / Redeemer behavior
- Security-sensitive code paths

Please:
- Describe the threat model or rationale.
- Point to the relevant sections in `SHADOWBOX_BLUEPRINT.md` if you’re updating the design.
- Consider adding notes to the blueprint when the architecture meaningfully changes.

### 8. Code of Conduct

Be respectful and constructive in all interactions. Assume good faith and focus on technical feedback.

---

Thank you for helping improve ShadowBox!