---
name: ui-options
description: Compare layout or interaction alternatives with real data. Seeds representative demo data, implements two to four variants in isolation, captures screenshots at phone and tablet sizes, and presents a pick-one comparison with a recommendation. Use when asked for options, alternatives, or "show me ways to display or design X".
---

# UI options

Use this when a layout decision is open, not for a single requested fix. The
goal is a decision the operator can make from screenshots, not from prose.

## 1. Frame the options

- Write two to four distinct approaches, each with a one-line tradeoff: density,
  reachability, extra taps, horizontal scroll, or discoverability.
- Name the data and states the comparison needs: many rows, long names, zero and
  low stock, several sales, an active preorder form.
- Do not write production code before the options are framed.

## 2. Seed real-looking data

```sh
bun run seed:dev:reset
```

This recreates the dev operator (sign in again through the dev login) and adds
demo rows with the `[demo] ` prefix, `dev-seed-` checkout ids, and the `dev-demo`
form slug. If the screen needs more rows than the seed provides, extend
`convex/devSeed.ts` on the throwaway branch. Do not hand-insert rows in
production or shape data only for the screenshot.

## 3. Implement each variant in isolation

- Use one branch or worktree per variant, or a single throwaway branch with a
  dev-only switch. Never leave alternative code on `main`.
- Keep the desktop layout unchanged unless the request includes it.
- Shared helpers may move, but the variants stay separate.

## 4. Verify and capture

- Open the dev server in the T3 preview (`preview_open`, then `preview_navigate`).
- Check each variant at 390×844 (phone) and 1024×768 (tablet), including
  overflow, tap targets, empty state, and loading state.
- Capture one screenshot per variant on the same data and viewport. Crop or
  resize with `magick` when available. If this host cannot capture, say so and
  ask the user for the shot; never describe a screenshot you did not take.

## 5. Present the comparison

Render inline HTML with `html_preview`, then `html_render`: one section per
variant with its screenshot, the one-line tradeoff, and the cost in extra taps,
code, or accessibility risk. End with one recommendation and ask which to adopt.
Keep the text short; the images do the work.

## 6. After the pick

- Keep only the chosen variant and delete the other branches and worktrees.
- Rebase on `origin/main` and run the checks. Stop there unless the user asked
  to push; continue with `ship-change` when they did.
