# Contributing to ShadowBox

Thank you for your interest in contributing to ShadowBox! This document provides guidelines for contributing to the project.

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Install dependencies: `npm install && cd frontend && npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Code Standards

### Solidity

- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use Solidity ^0.8.24
- Include NatSpec comments for all public/external functions
- Write comprehensive tests for all contract logic
- Run `npx hardhat test` before committing

### TypeScript/React

- Use TypeScript for all frontend code
- Follow React best practices
- Use functional components with hooks
- Maintain proper type safety
- Run `npm run type-check` before committing

### Testing

- Maintain > 90% test coverage
- Include both positive and negative test cases
- Test edge cases and error conditions
- Mock external dependencies appropriately

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new encryption algorithm
fix: resolve voucher signature validation
docs: update deployment guide
test: add tests for tier assignment
refactor: optimize loot generation
```

## Pull Request Process

1. Update documentation for any changed functionality
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md if applicable
5. Request review from maintainers

## Security

- Never commit private keys or sensitive data
- Report security vulnerabilities privately to maintainers
- Follow secure coding practices
- Review dependencies for known vulnerabilities

## Code Review

All submissions require review. Reviewers will check:
- Code quality and style
- Test coverage
- Documentation completeness
- Security considerations
- Performance implications

## Getting Help

- Check existing issues and discussions
- Ask questions in GitHub Discussions
- Join the community Discord (if available)

Thank you for contributing! 🎉
