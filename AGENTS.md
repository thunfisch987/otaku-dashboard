# Tooling

Use Bun for package management and project scripts. Run `bun install` after
dependency changes, `bun run lint` for the hybrid lint suite, and `bun run
format:check` to check formatting. `bun fmt` is the project's built-in
formatter and reads its settings from `bunfig.toml`.

The pre-commit hook formats staged files with `bun fmt --staged`.

Oxlint checks standalone JavaScript/TypeScript files and Nuxt ESLint checks
Vue SFCs only, avoiding duplicate linting. Use `bun run lint:eslint` when a
full Nuxt ESLint pass is required.

Agent skills live in the project under `.agents/skills/` (one directory per
skill, containing a `SKILL.md`). This location works for both Codex and
OpenCode; do not add tool-specific skill folders such as `.claude/skills/`
or `.opencode/skills/`.

## Project vision

- This app supports events run by a non-profit youth organization.
- It is used on-site by 1–3 trusted operators. Everyone using the app needs
  access to every functionality; do not introduce role-based feature
  restrictions for these operators.
- The core purpose is tracking stock and money during events. Prioritize
  accurate, easy-to-review inventory changes and sales records.
- Operators need to download sales records for a selected day, suitable for
  end-of-event money and stock reconciliation.
- The point-of-sale flow should let an operator select one or more products,
  review the selection, then explicitly complete checkout. Avoid deducting
  stock immediately when a product is tapped; commit stock and money records
  together at checkout.
- Design for tablet-sized screens and quick use at an event, including clear
  touch targets and readable status/error feedback.
- Keep the app’s interface in English while it is being developed. The owner
  plans to translate it by hand after development is complete; do not add
  localization infrastructure unless requested.

## UI conventions

- Prefer `@nuxt/ui` components for interface elements. Build custom elements
  only when a suitable `@nuxt/ui` component cannot meet the need.
- Keep styling close to the built-in `@nuxt/ui` appearance. Prefer its
  component variants, design tokens, and defaults over bespoke CSS or heavy
  component overrides.

## Design / UI guidelines (extends "UI conventions" above)

- Make the flow obvious: clear next action, visible system state, and explicit
  confirmation before committing stock/money. Especially the
  `dash/pointofsale.vue` checkout (show
  items/qty/total/stock impact; disable the button while committing; a double-tap
  must never create a second sale) and `dash/` reconciliation. Apply the same to
  destructive actions (stock edits, deletions, reconciliation status changes):
  confirmations must name the specific product and quantity affected.
- Prefer simple systems; avoid decorative and architectural complexity. Keep
  feature-specific UI local (e.g., `dash/pointofsale` product selection,
  `Inventory/`
  display); extract a shared component only when genuinely reused. Small local
  duplication in the POS grid is preferable to a premature abstraction.
- Extend `@nuxt/ui` via variants, sizes, slots, and semantic design tokens
  (`text-default`, `text-muted`, `bg-elevated`, `border-muted`) instead of
  rebuilding controls, restyling raw Tailwind palette colors, or heavy overrides.
  Read the generated theme files (`.nuxt/ui/<component>.ts`) for exact slot
  names. The `nuxt-ui` skill in `.agents/skills/nuxt-ui/` documents component
  selection (Modal vs Slideover, tables, dashboard layout) — consult it rather
  than guessing component APIs.
- Shared components own their appearance (`OtakuNav.vue`, `OtakuFooter.vue`);
  pages own layout and composition (`index.vue`, `dash/`, `preorder/`,
  `privacy.vue`). The shell in `app.vue` is the operator shell; public customer
  pages (`preorder/`) must not render it — give them a minimal public layout,
  via a route-dependent shell in `app.vue` or a separate `app/layouts/` entry.
- Prefer local Tailwind utility classes. Add global CSS only for app-wide rules
  or unavoidable third-party styling.
- Performance and honest states: no continuously repainting or decorative loop
  animations (purposeful success/confirmation feedback stays allowed). Loading,
  partial data, errors, and disabled states must say what is actually happening.
  In `dash/`, loading ≠ empty ≠ zero: never render a "$0 / No sales" frame before
  the query resolves, and never present partial paginated results as totals.
- Know each surface's device: `preorder/[slug].vue` is a public page used on
  phones (compact, narrow, larger text); `dash/` is the operator surface
  used on tablets (generous touch targets). Review both, but don't
  judge one against the other's sizing.
- Assume flaky venue Wi-Fi: writes (especially checkout) need a retry path and
  clear "connection lost, not committed" feedback — never optimistically show a
  sale or stock change that didn't record.
- CSV downloads are core deliverables. Sales export in `dash/transactions.vue`
  (end-of-event money/stock reconciliation): consistent BOM/encoding, filename
  `sales-YYYY-MM-DD.csv`, button disabled while generating. Stock export in
  `Inventory/Table.vue` (list of stock, all/filtered/selected): same encoding
  and UX standards, filename `stock-YYYY-MM-DD.csv`.
- Never hardcode Tailwind palette colors (`text-gray-500`, `bg-gray-*`): they
  break dark mode. Existing `text-gray-*` usages are pre-existing debt to replace
  with semantic tokens when touched.
- Accuracy tie-breaker: when design polish conflicts with accurate, reviewable
  stock/money records, accuracy wins — call out the divergence instead of
  silently choosing. No UI may gate features by role (see Project vision).

### Pricing clarifications

- Product and shared prices are stable once a preorder form has been created
  for an event: operators do not change prices while a form is live. This is
  why preorder submissions do not need price snapshots.
- The shared Onigiri price defaults to €3.
- Expected revenue per submission is deliberately not tracked; a future
  addition may be an expected cost for supplies in preparation totals.

### Deliberately not guidelines (do not import)

The following habits from general style guides are intentionally rejected for
this project. Treat them as standing decisions, not gaps in these guidelines:

- Small local duplication beats premature abstraction — no "never duplicate
  markup/classes" rule.
- Custom CSS and animation are allowed for narrow, purposeful cases; only
  decorative, continuously-repainting motion is off-limits.
- Not everything must be reusable — the app is a focused event-operations tool.
- Interaction is touch-first for tablet operators; keyboard shortcuts stay
  optional and must never trap focus.

## Agent communication

- Before saying frontend work is done, state which relevant surfaces you
  checked.
- If a repository rule conflicts with the requested task, say so clearly and
  get human approval before breaking it.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
