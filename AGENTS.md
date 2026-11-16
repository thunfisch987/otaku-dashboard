# Project guidance

Rules for working in this repository. Architecture, project layout, scripts,
environment variables, and the full dev-login walkthrough live in
[README.md](./README.md).

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
  price snapshots. Shared Onigiri pricing comes from the
  `productCategoryPricing` row; seed data uses €3. Supply costs are tracked per
  product and per form item and totalled in the preparation view. Expected
  revenue per submission is not tracked.

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
  `bun install`.
- Run `bun run lint` and `bun run format:check` before finishing. Oxlint covers
  standalone JS/TS and Nuxt ESLint covers Vue SFCs; `bun run lint:eslint` runs
  the full ESLint pass. The pre-commit hook runs `bun fmt --staged`.
- Store shared agent skills in `.agents/skills/<name>/SKILL.md`; do not add
  tool-specific skill directories.

## Setting up a new worktree

A fresh worktree has no `node_modules` and no `.env.local`. Follow
[README.md](./README.md#setup); do not substitute a copied `node_modules` or a
committed `.env.local`.

## Dev servers

- If you leave the dev server running for me to check, start it with
  `bun run dev:tail` so I can reach it from my phone. A server you only need
  for your own verification can stay on `bun run dev`.

## Verifying signed-in surfaces in dev

Operator pages need a real Better Auth session; bypassing the route guard
renders a page that cannot load or write data. Sign in through the dev login in
[README.md](./README.md#verifying-signed-in-surfaces), including its
`ENABLE_DEV_TOOLS` and `DEV_AUTH_*` setup and restart. Convex functions read the
deployment environment, not `.env.local`: set those variables on the deployment
with `bunx convex env set` (see README, "Convex deployment environment") and
keep `.env.local` for Nuxt and the CLI.

- Never set `ENABLE_DEV_TOOLS` on a production deployment and never commit
  `DEV_AUTH_PASSWORD`.
- Public `preorder/[slug].vue` pages need no login; open them directly.
- Drive pages with the T3 Code preview tools (`preview_*`); the OpenCode
  `browser.*` tools do not work in this setup.

## Git

- Name branches with a conventional prefix and a short description, such as
  `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, or `perf/`
  (e.g. `fix/mobile-login-layout`).

## Agent communication

- A progress update is not completion: after announcing intended work, continue
  executing it in the same task. Do not end on a future-tense promise; report
  the completed result or the concrete blocker.
- Keep replies brief: lead with the result or next action, and skip filler,
  preamble, and restating the request. Add detail only for decisions or risk.
- Present lists and multi-part answers as bullet points, not comma-spliced
  prose.
- Use emojis where they add meaning or make status easier to scan; skip purely
  decorative ones.
- For plans, research, and comparisons, render the report as inline HTML with
  `html_preview` then `html_render`. Do not write a `.html` file and link it,
  and do not dump the report as chat prose.
- Only say a report is visible after `html_render` succeeds and the page
  appears in the thread. If it fails or does not appear, say so and fall back to
  short Markdown; never claim it rendered without the call.
- In both HTML and Markdown output, embed images inline. Never hand over a bare
  file link or path instead of showing the image.
- Prefer sending screenshots as attachments when a tool allows it; attachments
  always render full size. When embedding Markdown images instead, give each
  image its own paragraph: a blank line before and after, with any caption on a
  separate line. An image on the line directly under a caption renders as a tiny
  inline preview pill and reads as a broken image.
- For UI-visible changes, include before/after screenshots, or a short video
  when motion or timing matters, and name the surfaces checked.
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
