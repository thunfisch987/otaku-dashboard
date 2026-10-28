---
name: Council Review
description: Post-change review for medium-to-big code changes. Collects the diff, has the three-model council review it, and reports a merged verdict plus top issues. Read-only by default — it does not apply fixes until the user picks which issues to address. Use when changes are already made.
---

# Council Review

Review workflow for changes that already exist. This skill does not modify code
on its own.

## Workflow

1. **Collect the changes.** Default: uncommitted state (`git diff` HEAD plus —
   `git status` — untracked files). If the user names a branch, commit range, or
   PR, collect that instead. State plainly what you reviewed.
2. **Load the `council` skill** and delegate one independent review per member.
   Material: the diff (or the important hunks, if it is huge) plus one short
   paragraph of intent/context. Never send secrets, env files, or large
   generated artifacts to the delegates.
3. **Merge and report** per the council procedure: merged verdict, issue count,
   top issues ranked by severity and member agreement.
4. **Stop after reporting.** Do not implement fixes. If the user wants the
   findings applied automatically, switch to the `council-ship` skill.
