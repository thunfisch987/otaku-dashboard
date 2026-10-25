# Tooling

Use Bun for package management and project scripts. Run `bun install` after
dependency changes, `bun run lint` for the hybrid lint suite, and `bun run
format:check` to check formatting. `bun fmt` is the project's built-in
formatter and reads its settings from `bunfig.toml`.

The pre-commit hook formats staged files with `bun fmt --staged`.

Oxlint checks standalone JavaScript/TypeScript files and Nuxt ESLint checks
Vue SFCs only, avoiding duplicate linting. Use `bun run lint:eslint` when a
full Nuxt ESLint pass is required.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
