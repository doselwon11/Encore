This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Festival projects

My Festivals stores projects and the active editor in this browser using
`encore-projects-v1`. Create blank or sample festivals, open them, rename,
duplicate, or delete them from the dashboard. Edits save immediately; the editor
retains its live poster, palette controls, lineup tools, and PNG export.

The previous `encore-festival-v1` draft migrates automatically and remains as a
backup. Invalid project payloads are backed up under `encore-projects-recovery-*`
before replacement. A visible warning explains unavailable storage or failed
writes; changes remain usable in memory for the current session. Projects are
local to the browser and are not synced to other devices.

Run `npm test` with Node.js 22.18+ to verify project creation, independent copies,
migration, persistence, invalid data recovery, and storage failure handling.
Run `npm run lint`, `npx tsc --noEmit`, and `npm run build` before publishing.
