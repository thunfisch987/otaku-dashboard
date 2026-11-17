---
name: second-opinion
description: Have one named delegate model review the current change. Resolves the exact model, hands it the diff and project rules, verifies its findings, and applies only in-scope fixes. Use when asked to "review with <model>", "let <model> check it", or for a single second opinion outside the council panel.
---

# Second opinion

For a panel, use `council` or `council-review` instead. This skill is one
reviewer, used when the user names a model.

## 1. Resolve the model

- Use the exact ID the user named. Call `orchestrator_capabilities` once per
  thread before the first `delegate_task`.
- If the model is missing, not free when the user asked for free, or fails to
  launch, say why and ask whether to use the fallback the user named. Never
  substitute silently.
- Report the model that actually reviewed in the final reply.

## 2. Prepare the material

- The changes to review: the `origin/main...HEAD` diff, `git diff`,
  `git diff --cached`, and each new untracked file. When HEAD equals
  `origin/main`, use `git show <sha>` for the commit the user named.
- Do not commit or stage anything for a review-only request; commit first only
  when the user asked for fixes or a commit.
- One paragraph of intent: what the change should do and what is out of scope.
- Checks already run and their results.
- The project rules that matter from AGENTS.md, not the whole file.
- Never send secrets, `.env.local`, or generated files.

## 3. Delegate a review only

Brief the delegate to:

- Review this diff for defects, regressions, data loss, security, and
  accessibility in changed lines only.
- Cite `file:line`, severity, and why it is a defect. No feature ideas, no
  refactors, no restating the diff.
- Not edit files. Review output only.

Launch one task and wait for the completion wake, not by polling.

## 4. Verify, then act

- Check every finding against the current code. Reject stale or incorrect ones
  with a one-line reason.
- Apply in-scope fixes only when the request includes fixing them; if the user
  asked only to review, report the findings and stop. After fixes, rerun
  `bun run lint`, `bun run typecheck`, and `bun run format:check`.
- Do not start another review round unless the user asks.

## 5. Report

Short bullets: accepted findings and fixes, rejected findings and why, checks,
and remaining risk. Name the model.
