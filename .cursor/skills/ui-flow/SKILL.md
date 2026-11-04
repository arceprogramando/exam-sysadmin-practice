---
name: ui-flow
description: >-
  Reviews whether a screen's controls and copy match what the person is trying
  to do. Use when the user asks for a UI, UX, or copy review, when a control
  looks like the main action but is only a choice, when a flow or a sentence
  is confusing, or when they mention buttons, toggles, wording, or "no se
  entiende".
---

# UI flow

Review the live control and the step around it. One decision per control. Do not redesign the page.

## What to check

1. What the person wants on this step.
2. What they see before reading the paragraph.
3. Which control looks like the thing that continues.
4. What actually happens if they use it, on this same screen.

A filled pill is the continue action. A choice that uses that same fill is read as the continue action. The person does not learn that the other option is available.

## Rules

- One continue action per step. The others stay quiet.
- A choice (edition, mode, filter) sits in one shared track. The selected item is marked inside that track. It does not borrow the continue button's fill.
- The other options stay visible in that same track. Hiding them, or styling only one as a button, reads as "there is nothing to switch".
- A paragraph under the control does not fix a shape that already said the wrong thing.
- In a timed practice with no pauses, do not add a hint the real exam would not show. A choice made before the clock starts is fine.

## Copy

Copy is the text on the control.

- The button names the result, including which version.
- If a choice changes that result, the button text changes with the choice.
- One sentence under the control. Delete the sentence that repeats the button.

## Answer

Use this shape:

```markdown
## [Control]
Quiere: …
Ve, antes de leer: …
El control parece: …
Hace en realidad: …
Decisión: …
```

The decision is one change: restyle, move, relabel, or leave it. Name the file if you change it.
