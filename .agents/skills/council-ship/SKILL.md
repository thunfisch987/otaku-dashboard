---
name: Council Ship
description: Full-send mode for medium-to-big code changes. Makes the change, runs the three-model council on the result, automatically adopts all panel feedback, implements it, and reports. Autonomous, but strictly non-destructive.
---

# Council Ship

Full-send workflow for medium-to-big changes: implement, review, adopt all
feedback, re-verify, report.

## Workflow

1. **Set up the workspace before touching code.** Always work on a dedicated
   branch created for this run (e.g. `council/<topic>`); never commit to the
   branch that happens to be checked out, and never switch branches while the
   checkout has uncommitted changes without checking them first.
    - Ship **in place** on the dedicated branch when the work depends on the
      current uncommitted state or the live local env.
    - Host the branch in a **separate worktree** when the checkout has uncommitted
      changes unrelated to this task, or the change is a large restructuring.
      Set the worktree up fully so verification there is meaningful:
        - Install dependencies **from the lockfile, not loose**, with bun:
          `bun install --frozen-lockfile`. A frozen install is mandatory; if it
          fails, stop and report instead of regenerating the lockfile. Lockfile
          changes are only acceptable when the task itself adds/removes
          dependencies, and then as a deliberate, mentioned change.
        - Copy untracked env files (`.env*`) from the main checkout.
    - State in one line which you chose and why.
2. **Understand the request and read the relevant code first** — autonomy is not
   an excuse to skip comprehension. Draft a brief plan as you go.
3. **Implement** the change with focused edits following the project's existing
   style. Verify as you go (build/tests where available).
4. **Review.** Load the `council` skill and run the panel on the diff, with a
   short statement of intent.
5. **Adopt everything.** Work through the merged findings:
    - Implement every non-conflicting, actionable finding.
    - If members conflict on the same point, go with the majority/higher
      severity and note the tradeoff in the final report.
    - Skip findings that would violate the hard limits below; list every skipped
      finding and why in the report.
6. **Re-verify** after adopting: rerun builds/tests where available, and do a
   final read of the full diff for coherence (adopted patches can contradict
   earlier ones).
7. **Report** in merged-verdict style: what was shipped, the council's verdict,
   findings adopted, findings skipped and why, and how anything was verified.
   Always end with where the work landed — branch and (if used) worktree path —
   and how to merge or cleanly discard it.

## Hard limits (never do these, regardless of panel feedback)

- Never push, deploy, force-anything, or touch shared/remote branches.
- Never delete data, branches, or files outside this change's scope.
- Never modify env files, credentials, CI/CD, or package registries.
- Never run destructive shell commands or install system-level packages.
- If the user must approve something for the work to continue (e.g., a
  permission that requires a secret), stop and ask — do not improvise a
  workaround.

Everything else is fair game: restructure freely if the panel's merged verdict
demands it, and mention it as a top issue in your report.
