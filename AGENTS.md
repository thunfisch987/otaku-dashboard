# Tooling

Use Bun for package management and project scripts. Run `bun install` after
dependency changes, `bun run lint` for the hybrid lint suite, and `bun run
format:check` to check formatting. `bun fmt` is the project's built-in
formatter and reads its settings from `bunfig.toml`.

The pre-commit hook formats staged files with `bun fmt --staged`.

Oxlint checks standalone JavaScript/TypeScript files and Nuxt ESLint checks
Vue SFCs only, avoiding duplicate linting. Use `bun run lint:eslint` when a
full Nuxt ESLint pass is required.

## Project vision

- This app supports events run by a non-profit youth organization.
- It is used on-site by 1–3 trusted operators. Everyone using the app needs
  access to every functionality; do not introduce role-based feature
  restrictions for these operators.
- The core purpose is tracking stock and money during events. Prioritize
  accurate, easy-to-review inventory changes and sales records.
- The point-of-sale flow should let an operator select one or more products,
  review the selection, then explicitly complete checkout. Avoid deducting
  stock immediately when a product is tapped; commit stock and money records
  together at checkout.
- Design for tablet-sized screens and quick use at an event, including clear
  touch targets and readable status/error feedback.
- Keep the app’s interface in English while it is being developed. The owner
  plans to translate it by hand after development is complete; do not add
  localization infrastructure unless requested.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
