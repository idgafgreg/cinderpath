---
name: iterate-until-playable
description: Keep Cinderpath work in a make/judge loop until gates pass.
---

# Iterate Until Playable

Preserve the requested change. Strengthen the proof around it.

## When to use

- The task is bigger than one file
- Words like "better", "done", or "feels good" showed up without a check

## Loop

1. Write the contract: outcome, files, constraints, definition of done.
2. Turn taste into gates. Example: "readable swing" becomes "startup is visible and contact cannot land before `active`".
3. Change the smallest owner: catalog, sim, render, or HUD. Do not edit all four unless the contract says so.
4. Judge with tests and a fixture walk. The implementer does not get to declare victory from memory.
5. Route each failed gate back to its owner. Re-run related gates.
6. Stop when every required gate passes, or name the exact blocker.

## Done when

- The original request is still what shipped
- Claims in the summary match commands that were actually run
