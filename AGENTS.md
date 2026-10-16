<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:freebuff-workflow -->

## Ship every change

- **Commit and push every completed change right away.** No separate "should I push?" — the push is part of finishing a task, not a follow-up question.
- Order: verify the change first (typecheck, build, and a browser check through the interface the user actually uses), then `git add` only the files you touched, commit, and push to `origin/main`.
- Commit messages: short imperative sentence that says why the change exists, plus the Codebuff footer. Keep the working tree clean — do not leave finished work uncommitted.
- Do not commit or push when a check fails, when a change is still half-done, or when the user asked for work to stay local; say so in the reply instead.

<!-- END:freebuff-workflow -->
