# Project guidance

## Product and records

- This app supports events run by a non-profit youth organization and is used
  on-site by 1–3 trusted operators. Everyone has access to every feature; do
  not add role-based feature restrictions.
- Stock and money records must be accurate and easy to review. A POS sale is
  committed only at explicit checkout, with stock and money recorded together.
  Before checkout, show items, quantities, total, and stock impact; prevent
  double submission, disable the action while saving, and provide a retry path
  with clear “not committed” feedback when connectivity fails.
- Confirm destructive or reconciliation actions with the affected product and
  quantity. Keep loading, empty, zero, partial, error, and disabled states
  distinct. Never show provisional zero-sales totals before data loads or treat
  partial paginated data as a total.
- Operators need a selected day's sales CSV for reconciliation and stock CSVs
  for all, filtered, or selected rows. Export both as UTF-8 with BOM, disable
  the button while generating, and use `sales-YYYY-MM-DD.csv` and
  `stock-YYYY-MM-DD.csv`.
- Prices stay stable while a preorder form is live, so submissions do not need
  price snapshots. Shared Onigiri defaults to €3. Expected revenue per
  submission is not tracked; a future preparation feature may track supply
  costs instead.

## Interface

- Keep the interface in English; do not add localization infrastructure unless
  requested. Use concise, descriptive copy, clear status/error feedback, and
  make the next action and system state clear.
- Design the operator `dash/` for tablet use with generous touch targets; the
  public `preorder/[slug].vue` flow is for phones and needs a compact layout and
  readable text. Review each surface for its device.
- Prefer `@nuxt/ui` components, variants, slots, defaults, and semantic tokens
  (`text-default`, `text-muted`, `bg-elevated`, `border-muted`). Consult the
  project `nuxt-ui` skill and generated `.nuxt/ui/<component>.ts` theme files
  for component APIs and slot names. Avoid hardcoded Tailwind palette colors;
  replace existing `text-gray-*` debt when touching it.
- Keep feature UI and styling local; extract shared components when they are
  genuinely reused. Shared components own their appearance; pages own layout.
  Prefer local utility classes and reserve global CSS for app-wide rules or
  unavoidable third-party styling.
- `app.vue` is the operator shell. Public preorder pages use a minimal public
  layout and must not render the operator shell.
- Avoid decorative, continuously repainting animations. Purposeful success
  feedback and narrow custom CSS are fine. Keyboard shortcuts are optional and
  must not trap focus.
- When visual polish conflicts with accurate stock or money records, prioritize
  accuracy and call out the tradeoff.

## Tooling

- Use Bun for package management and scripts. After dependency changes, run
  `bun install`; use `bun run lint` for the hybrid lint suite and
  `bun run format:check` to check formatting. `bun fmt` uses `bunfig.toml`;
  the pre-commit hook runs `bun fmt --staged`.
- Oxlint covers standalone JS/TS; Nuxt ESLint covers Vue SFCs. Run
  `bun run lint:eslint` for a full Nuxt ESLint pass.
- Store shared agent skills in `.agents/skills/<name>/SKILL.md`; do not add
  tool-specific skill directories.

## Agent communication

- A progress update is not completion: after announcing intended work, continue
  executing it in the same task. Do not end on a future-tense promise; report
  the completed result or the concrete blocker.
- When a subagent implements a change and council review is requested, assign
  the review to that same subagent for its isolated change. It owns the review
  and report; the parent should not duplicate it.
- Before reporting frontend work as done, state which relevant surfaces you
  checked. Keep final reports short and precise after completing the task.
- If a repository rule conflicts with the requested task, explain the conflict
  and get human approval before breaking the rule.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev). Before changing Convex code,
read `convex/_generated/ai/guidelines.md`; its instructions take precedence
over general Convex knowledge. Convex skills can be installed with
`npx convex ai-files install`.

<!-- convex-ai-end -->
