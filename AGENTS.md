<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## GitHub development workflow

For future development in this project, implement the requested changes, then run
`npm run lint`, `npx tsc --noEmit`, and `npm run build`. After all checks pass,
review the Git diff and scan the files to be published for secrets. Create a
descriptive commit and push to `origin/main` automatically. Report the commit
hash and GitHub commit link.

Do not push when validation fails, secrets are detected, or unexpected files are
included. Never force-push, overwrite unrelated remote content, or delete remote
history automatically. The target repository is `doselwon11/Encore` (public),
with `main` as its default branch.
