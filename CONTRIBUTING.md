# Contributing to PawStep

## Reporting bugs and requesting features

Open a GitHub Issue at `https://github.com/aalsmeerwtmh-maker/project115/issues`.

For bugs, include:

- Device model and OS version
- Reproduction steps
- Expected vs. actual behavior
- Relevant logs from Metro or EAS Build

For features, describe the user problem being solved, not just the solution. Reference the relevant phase from `dev_plan.md` if applicable.

---

## Branch naming

| Type                    | Pattern                     | Example                       |
| ----------------------- | --------------------------- | ----------------------------- |
| New feature             | `feature/short-description` | `feature/step-counter-hook`   |
| Bug fix                 | `fix/short-description`     | `fix/growth-formula-rounding` |
| Chores, config, tooling | `chore/short-description`   | `chore/update-eas-cli`        |

Keep descriptions lowercase, hyphen-separated, and short enough to scan in a branch list.

---

## Commit messages

Use imperative mood. Think "this commit will \_\_\_".

```
Add step counter hook
Fix growth formula rounding on day boundary
Update EAS build profile for preview
Remove hardcoded step goal constant
```

Rules:

- Subject line: 50 characters or fewer, no period at the end
- No ticket numbers or "WIP" commits in the main branch history — squash before merging
- If a commit needs context, add a blank line after the subject and a paragraph body

---

## Pull request process

Every PR must include:

1. **Passing checks** — `npm run typecheck` and `npm run lint` must be clean before requesting review. No reviewer should have to fix type errors for you.
2. **Description** — what changed and why. One paragraph is enough for small PRs; link to the relevant Issue for larger ones.
3. **Screenshots** for any UI change — before and after, on at least one platform. Annotate if the change is subtle.
4. **Test notes** — if the change touches game logic (`src/game/`), include the Jest command that covers it and confirm it passes.

Keep PRs focused. A PR that adds a feature, refactors unrelated code, and fixes a typo is harder to review than three smaller PRs.

---

## Code review expectations

**As an author:**

- Respond to all comments before re-requesting review.
- If you disagree, explain why — do not silently revert the change to close the thread.

**As a reviewer:**

- Point to the specific line and explain what the problem is. "This looks wrong" is not feedback.
- Distinguish blocking issues from suggestions: use "nit:" for style preferences you would not block on.
- Approve only when all checks pass and no blocking issues remain open.
- Be kind. The person on the other side of the PR is a teammate.

---

## What NOT to do

### Never commit these

| What                         | Why                                                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ios/` or `android/` folders | We stay in the Expo managed workflow. EAS runs `expo prebuild` during cloud builds. Committing these folders means manually maintaining native files forever. |
| `.env`                       | Contains secret keys (`GOOGLE_MAPS_ANDROID_KEY`). Set secrets via `eas secret:create` instead.                                                                |
| `*.apk`, `*.ipa`, `*.aab`    | Binary build artifacts; EAS stores them.                                                                                                                      |

### Never do in code

- **Do not use `// eslint-disable`** to suppress a lint error. Fix the underlying issue. If a rule is genuinely wrong for the project, change the ESLint config and document why.
- **Do not hardcode UI strings in JSX.** All user-visible text goes in `src/i18n/en.ts` as named constants. This is required so Traditional Chinese (zh-TW) can be added later without grep-and-pray.
- **Do not call `src/db/repositories/` directly from a screen component.** Screens go through a Zustand store or a custom hook. This rule keeps screens testable and prevents scattered DB calls.
- **Do not add React imports or SQLite calls to `src/game/`.** That folder is pure TypeScript — no React, no native modules. Keeping it pure is what makes the game logic unit-testable in plain Node.

---

## Running checks locally

```bash
npm run typecheck   # zero errors required
npm run lint        # zero errors required
npm run format      # auto-formats; run before committing
npm run doctor      # checks Expo SDK version mismatches
```
