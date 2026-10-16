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

## Advanced poster design studio

Open a festival, then choose **Design**. Typography controls apply independently
to the title, artists, tagline, and event details. Background controls include
four colors, gradient direction, patterns, texture, glow, and decoration toggles.
The template gallery offers Neon Waves, Tokyo Nights, Golden Hour, Minimalist,
and Retro Festival, each with different artwork and layout. Applying a template
requires confirmation and keeps festival details and artists intact.

Design settings live inside each festival record. Older projects keep their
palette and receive defaults only when rendered; opening them does not rewrite
their saved design. Copies have independent settings. Long text wraps and the
poster grows vertically when needed to keep large lineups visible.

Poster fonts (Geist, Barlow Condensed, DM Serif Display, and Noto Sans JP) are
bundled locally under `public/fonts`, with their SIL Open Font Licenses. PNG
export waits for font loading, embeds the fonts, and uses the same poster DOM as
the preview. The export dialog displays the actual generated bitmap and offers
a download link if automatic downloading is blocked by the browser.

## Festival schedule builder

The **Schedule** tab saves stages, festival dates, timezone labels and artist
performances with each festival. Existing projects receive an empty schedule
without changing their lineup, poster design, or saved data. Invalid schedule
payloads remain untouched until explicitly replaced through a confirmation.

Add stages and dates, then use **Assign / Add performance**, or drag artist
handles onto a stage’s 15-minute slots. Drag existing performances to move them
while preserving duration. Keyboard handles support Space, arrows, and Escape;
the Edit form provides exact date/time/stage alternatives on desktop and mobile.

Times are stored as explicit festival-local `YYYY-MM-DDTHH:mm` calendar values,
not browser-local timestamps or UTC instants. **Ends next day** creates an
explicit following-date end time. Overnight performances appear on both calendar
dates, with an automatic continuation view after the last festival day. Changing
the optional IANA timezone label does not shift the wall-clock schedule.

Stage overlaps and simultaneous artist double-bookings are conflicts. Repeated
non-overlapping bookings are review advisories, including sets on different
days. Conflicts do not prevent planning; they appear in the editor and as draft
markers in PNG exports. Touching end/start boundaries are permitted.

Export the selected date or all dates as a high-resolution PNG with embedded
fonts, all stage columns, and full performance details. Large schedules can be
exported one day at a time. Stage/day/performance deletion requires confirmation.
Run `npm test` for midnight, calendar boundaries, timezone independence, booking
conflicts, project persistence, and poster-design regression coverage.

## Expanded template collection

The Design → Templates gallery includes Japanese City Pop (coastal record sleeve),
Brutalist (concrete flyer), Psychedelic (liquid eye), Editorial (numbered music
journal), Cyber Rave (circuit terminal), and Botanical (herbarium invitation),
alongside the original five templates. Thumbnails fit the entire sample poster;
the labeled selector and thumbnail buttons both offer a confirmation before
replacing a project's typography/background settings. Existing saved designs
are never changed merely by opening the gallery.

All six illustrations are original inline SVG/CSS. Text flows vertically for
long titles and large lineups instead of being cropped to a fixed page height.
PNG uses that same poster DOM, vector artwork, colors and embedded local fonts.
Japanese and Korean select bundled Noto Sans fallbacks; Vietnamese serif text
uses Noto Serif for complete diacritics. Added fonts are from Google Fonts under
the SIL Open Font License; license files are in `public/fonts`.
