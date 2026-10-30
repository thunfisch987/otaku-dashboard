---
name: council-plan
description: Pre-implementation review for medium-to-big code changes. Drafts an implementation plan, has the four-model council critique it, applies the merged verdict, and waits for user approval before any code is written. Use when the user is about to start a medium-to-big change.
---

# Council Plan

Planning workflow for medium-to-big changes. Nothing is implemented until the
user approves the final plan.

## Workflow

1. **Understand first.** Read the relevant code and docs before proposing anything.
   Do not plan from the prompt alone.
2. **Draft a plan:** goal and out-of-scope items, approach (with alternatives you
   rejected, briefly), files/modules expected to change, risks and unknowns,
   ordered milestones with a checkpoint after each, and relevant verification.
3. **Load the `council` skill** and have the council review the plan. The review
   material is the plan plus the minimal surrounding context a reviewer needs
   (key file excerpts, constraints). Do not paste the whole repo. Ask reviewers
   for a score out of 10 and a brief rationale, following the shared council
   skill's three-round maximum.
4. **Revise the plan** according to the merged verdict. Track any council
   suggestion you consciously decided _not_ to take, and why.
5. **Present** the final plan with the council's merged verdict and top issues.
   **Stop here.** Wait for explicit user approval before touching code. If the
   user approves and wants the plan executed with auto-adopted feedback, point
   them to the `council-ship` skill.
