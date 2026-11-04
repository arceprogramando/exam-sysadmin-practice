---
name: no-push-unless-asked
description: >-
  Never git push (nor force-push) unless the user explicitly asked to push in
  this turn. Applies on every commit, deploy prep, "subí esto", or when finishing
  a fix. Use whenever about to run git push, gh pr create that pushes, or any
  remote publish of commits.
---

# No push unless asked

## Rule

**Do not run `git push`** (nor `git push --force`, `--tags` to remote, ni equivalentes) **unless the user explicitly asked to push in the current message.**

Explicit ask examples (OK to push):

- "pusheá", "push", "subilo al remote", "commit y push", "dale push"

Not enough (commit only, **no** push):

- "commit", "commiteá", "guardalo", "dejalo en local", "no pushees"
- Terminar un fix / "listo" / merge local sin decir push

## After a commit without push

Say the commit hash is **local only** and that you did **not** push. Do not offer to push unless they ask.

## Scope

Applies to this repo and any git remote for this project. Prefer asking once if unclear: "¿Push también?" — default if they already said no-push: **no push**.
