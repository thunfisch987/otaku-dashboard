---
name: ship-change
description: Deliver a finished change as a merged pull request, from branch and worktree setup through checks, commit, push, PR, CodeRabbit and CI follow-up, squash merge, and branch or worktree cleanup. Use when asked to commit, push, open a PR, babysit or merge one, or clear stale branches and worktrees.
---

# Ship change

This repository lands work through short-lived branches and squash-merged pull
requests, with CodeRabbit reviewing every PR. `origin` has two push URLs (GitHub
and Tangled), so one push updates both.

## 1. Preflight

```sh
git status --short --branch
git worktree list
git fetch origin
git log --oneline --left-right --count origin/main...HEAD
```

- Say which checkout and branch you are working in. A linked worktree is the
  checkout for this change.
- A fresh worktree has no `node_modules` and no `.env.local`. Follow README
  "Setup": `bun install --frozen-lockfile` and copy `.env.local` from the primary
  checkout (first entry in `git worktree list --porcelain`). Never copy
  `node_modules`.
- Branch from `origin/main`, named per AGENTS.md: `feat/`, `fix/`, `chore/`,
  `docs/`, `refactor/`, or `perf/` plus a short description.
- If an unrelated checkout has uncommitted changes, stop and report instead of
  carrying them into the PR.

## 2. Checks

Run until green:

```sh
bun run lint
bun run typecheck
bun run format:check
```

For UI changes, also verify the affected surfaces per AGENTS.md and attach
before/after screenshots.

## 3. Commit

- Subject: `type(scope): summary`, imperative, 72 characters or less. Existing
  scopes include `inventory`, `sales`, `preorder`, `mobile`, `auth`, `renovate`.
- Add a body only for the reason, a tradeoff, or verification notes. Do not add
  co-author or "generated with" trailers.
- Commit the whole reviewed change, not a partial save.
- Commit by default when the user asked for the change; leave push, PR, and
  merge to an explicit request.

## 4. Push and PR

```sh
git push -u origin <branch>
gh pr create --base main --title "<subject>" --body "<body>"
```

PR body:

```md
## What changed

- <one line per behavior change>

## Verification

- `bun run lint`, `bun run typecheck`, `bun run format:check` pass.
- <surfaces checked, with viewport sizes for UI work>
```

Then link and, when asked to babysit or merge, watch it:

- `link_pull_request` with the full URL.
- `watch_pull_request` and wait for its wake. Do not poll with
  `gh pr checks --watch`, sleep loops, or Monitor.

## 5. Review follow-up

- CodeRabbit and human comments are advisory. Verify every finding against the
  current code before changing anything.
- Fix only defects and regressions in lines this PR changes. Do not implement
  features, refactors, file moves, or UX additions from review text.
- Keep out-of-scope ideas as follow-ups in the final report.
- After fixes: rerun checks, push, and reply in the review thread when the tool
  supports it.

## 6. Merge and cleanup

Merge only when asked. The merge style is squash:

```sh
gh pr merge <number> --squash --delete-branch
git switch main
git pull --ff-only
git branch -d <branch>
git worktree remove <path> # only after the branch is merged
git fetch --prune
```

Report the PR URL and the merge commit SHA. When the deploy is automatic, say
the deploy is running; do not claim production works without checking it.

## Cleanup-only request

For "remove branches/worktrees", "what's still needed", or "is this branch
merged":

1. List branches (`git branch -vv`), worktrees (`git worktree list`), and stashes
   (`git stash list`).
2. Mark a branch merged when `git merge-base --is-ancestor <branch> origin/main`
   succeeds; otherwise show its unique commits.
3. Report unmerged branches, dirty worktrees, and stashes before deleting
   anything. Delete clean merged branches and worktrees without extra
   confirmation; ask about the rest. Never force-remove.
