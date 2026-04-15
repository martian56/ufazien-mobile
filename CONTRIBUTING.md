# Contributing to Ufazien Mobile

Thanks for your interest in contributing! This document explains how to get involved.

## Getting Started

1. Fork and clone the repository.
2. Install dependencies: `npm install`
3. Start the dev server: `npm start`
4. Create a branch for your work: `git checkout -b feat/your-feature`

## Development

```bash
npm start            # Expo dev server
npm run lint         # Check for lint issues
npm run lint:fix     # Auto-fix lint issues
npm run format       # Format with Prettier
```

### Code Style

- **TypeScript** for all source files
- **Prettier** handles formatting (single quotes, trailing commas, 100 char width)
- **ESLint** via Expo config — run `npm run lint` before submitting
- Use the `@/` path alias for imports (`@/components`, `@/config`, etc.)

### Commit Messages

Use conventional commit prefixes:

```
feat(scope): add new feature
fix(scope): fix a bug
chore(scope): tooling, config, dependencies
```

Keep the subject line under 72 characters. Use the body for context when needed.

## Pull Requests

1. Make sure `npm run lint` passes with zero errors and warnings.
2. Keep PRs focused — one feature or fix per PR.
3. Write a clear description of what changed and why.
4. Link related issues using `Closes #123` in the PR body.
5. Request review from a maintainer.

## Reporting Bugs

Open an issue using the **Bug Report** template. Include:

- Steps to reproduce
- Expected vs actual behavior
- Device and OS version
- Screenshots if applicable

## Suggesting Features

Open an issue using the **Feature Request** template. Describe the problem you're solving and your proposed solution.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.
