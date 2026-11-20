---
name: ship-change
description: Deliver a finished change as a merged pull request, from branch and worktree setup through checks, commit, a local council review, push, PR, CodeRabbit and CI follow-up, squash merge, and branch or worktree cleanup. Use when asked to commit, push, open a PR, babysit or merge one, or clear stale branches and worktrees.
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

## 4. Local council review

Review locally before the branch goes to GitHub, so cheap fixes land before
CodeRabbit and CI spend a round on them. Run this once per branch, before the
first push. Skip it only when the request is commit-only or the user explicitly
says to skip.

- Load the `council` skill and run the panel on the committed branch diff,
  `origin/main...HEAD`, with one short paragraph of intent and the checks
  already run. Anything that belongs to the change must be committed first; do
  not point reviewers at untracked files.
- If the panel cannot launch at all (provider unavailable, quota, or auth), do
  not continue silently: report which members failed and ask whether to ship
  without the review. Record the council as not run in the final report.
- Apply in-scope fixes only, using the same bar as the post-PR review in §6:
  defects and regressions in lines this change touches, plus stale references
  that this change makes incorrect — another file quoting the old model roster,
  step number, or command is in scope even though its line is untouched. Do not
  implement features, refactors, file moves, or UX additions from panel
  feedback; list those as follow-ups.
- Re-run the §2 checks after the fixes, then commit them. Amend the existing
  commit only when it is unpushed and the fix belongs in it; otherwise add
  `fix: address local review`.
- Run another panel round only when the fixes change behavior enough to warrant
  a fresh look, within the council's three-round limit.
- Report the merged verdict, the score table, the findings applied, and the
  skipped findings with one-line reasons. Do not add council results to the PR
  description.

## 5. Push and PR

```sh
git push -u origin <branch>
```

Open a real PR, not a draft, so CodeRabbit runs. When the `pull_request_*`
tools are available, use `pull_request_create` with base `main`; it links the
PR for you. Otherwise use `gh pr create --base main --title "<subject>" --body
"<body>"` and `link_pull_request` with the full URL.

PR body:

```md
## What changed

- <one line per behavior change>

## Verification

- `bun run lint`, `bun run typecheck`, `bun run format:check` pass.
- <surfaces checked, with viewport sizes for UI work>
```

Then, when asked to babysit or merge, watch it:

- `watch_pull_request` and wait for its wake. Do not poll with
  `gh pr checks --watch`, sleep loops, or Monitor.
- Read failing checks with `ci_logs` and re-run them with `ci_rerun` when
  available; otherwise use `gh`.

## 6. Review follow-up

- CodeRabbit and human comments are advisory. Verify every finding against the
  current code before changing anything.
- The CodeRabbit check can be green while its comments are still arriving. Wait
  for its review, not the check, before calling the PR ready.
- Fix only defects and regressions in lines this PR changes. Do not implement
  features, refactors, file moves, or UX additions from review text.
- Keep out-of-scope ideas as follow-ups in the final report.
- After fixes: rerun checks, push, and reply in the review thread with
  `pull_request_respond` when available.

## Questions and settlement

Ask with the harness question tool, never in prose: `question` in OpenCode/T3,
`AskUserQuestion` in Claude Code, `request_user_input` in Codex. A prose
question is only text, so the thread still settles and the question can be
missed.

A pending question blocks auto-settle. If the PR is already merged or the thread
settled during this turn, unsettle it before asking:

1. `t3_thread_organize` with `action: "unsettle"`.
2. `t3_thread_organize` with `action: "mark_unread"` when it should return to
   the inbox.
3. Ask with the `question` tool. The thread stays waiting until the user
   answers.

Ask only when the goal is ambiguous, a required check cannot pass, the next step
is outside this skill's grant, or you cannot prove the change. Put the PR link,
current state, blocker, and 2–5 options in the question, with your
recommendation first. Decide everything else yourself and list those decisions
in the final report.

## 7. Merge and cleanup

Merge only when asked. The merge style is squash. Use `pull_request_merge`
when available; otherwise `gh pr merge <number> --squash`.

After the merge, delete the remote branch when it still exists:

```sh
git push origin --delete <branch>
```

Skip this when GitHub's "Automatically delete head branches" already removed it.

Do not remove the worktree from this thread. T3 owns that lifecycle:

- **Settings → Worktrees → Cleanup → Delete merged worktrees** removes a
  T3-managed worktree after its PR merges and its commits are in the default
  branch. Squash and rebase merges count.
- Active sessions and shared worktrees are skipped, so a pending question keeps
  the worktree until the thread settles.
- Branches and thread history are kept. "Keep worktrees with local changes"
  defaults to "Uncommitted changes", which deletes ignored files such as `.env`
  and build output.

From a linked worktree you cannot switch to `main`, delete the branch you have
checked out, or remove the worktree you are running in. Do not try, and do not
`cd` to the primary checkout to remove your own worktree.

Local branch cleanup happens only from the primary checkout, after confirming
the PR is `MERGED` and its head SHA equals `git rev-parse <branch>`:

```sh
git switch main
git pull --ff-only
git branch -D <branch>
git fetch --prune
```

When you are in a linked worktree, report the worktree path, branch, and merge
commit, and leave that block to the parent or user. Never force-remove a
worktree or branch.

Report the PR URL and the merge commit SHA. When the deploy is automatic, say
the deploy is running; do not claim production works without checking it.

## Cleanup-only request

For "remove branches/worktrees", "what's still needed", or "is this branch
merged":

1. List branches (`git branch -vv`), worktrees (`git worktree list`), and stashes
   (`git stash list`).
2. Before deleting a branch, check it against its PR: the PR must be `MERGED`
   and its `headRefOid` must equal `git rev-parse <branch>`. Anything newer is
   work done after the merge; report it instead of deleting. Without a PR, use
   `git merge-base --is-ancestor` and ask before deleting a squash merge. A
   verified squash merge needs `git branch -D`.
3. Never remove the worktree the thread is running in. T3's "Delete merged
   worktrees" cleanup owns merged worktrees; report the rest.
4. Report unmerged branches, dirty worktrees, and stashes before deleting
   anything. From the primary checkout, delete clean merged branches and other
   clean worktrees without extra confirmation; ask about the rest. From a linked
   worktree, report the `git worktree remove` and `git branch -D` commands for
   the primary instead of running them. Never force-remove.
