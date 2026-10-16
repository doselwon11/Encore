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

## Social Media Export Studio

Open **Social Media Export Studio** below the existing Export poster button.
Choose Standard poster (1000 × 1500), Square (1080 × 1080), Portrait
(1080 × 1350), or Story (1080 × 1920), name the file, and download a PNG.
The original adaptive poster and schedule exports remain available.

All eleven templates use the same renderer and bundled multilingual fonts as
the live preview. Social canvases reflow the lineup and fit typography, spacing,
and vector artwork within exact pixel dimensions. Dense lineups show a review
notice; an export that cannot fit safely is blocked with an explanation.
Story reserves 250 pixels at the top/bottom and 60 pixels at each side for
content. Safe-area guides are preview overlays and are never exported.
Format changes and export filenames do not modify a saved festival's design.
A download-again link is provided after rendering if automatic download is blocked.

## AI Festival Lineup Creator

Choose **AI Create** in My Festivals (or in New festival). Enter genres, favorite
artists, location, first date, length (1–7 days), lineup size (6–24 artists), visual
style, optional output language, and an optional schedule. Briefs can use English,
Japanese, Korean, Vietnamese, or other supported model languages.

Generation opens an **unsaved review** with the normal editor, design studio,
lineup controls, schedule builder, and poster preview. Only **Save as new
festival** writes the draft to the project library. Existing projects are never
replaced. Leaving a generated review or returning to the brief asks before
throwing away preview edits. Fictional-concept labels persist in the library,
editor, poster PNGs/social exports, and schedule exports. Artists are suggestions,
not confirmed bookings, endorsements, or statements about availability.

### Server configuration

Use Node.js 22 or newer (required by the installed OpenAI SDK).

1. Copy `.env.example` to `.env.local` (already ignored by Git).
2. Set `OPENAI_API_KEY` locally or in the deployment's secret settings. Never use
   a `NEXT_PUBLIC_` variable, paste the key into the app, or commit credentials.
3. Set `AI_CREATE_ENABLED=true`. Without both this flag and a key, the endpoint
   returns a safe 503 response; other Encore features still work.
4. Optionally set server-only `OPENAI_MODEL` (default `gpt-4.1-mini`, which must be
   accessible to your API project) and restart Next.js.
5. For deployment, set `APP_ORIGIN` to the exact browser origin, without a trailing
   slash, and configure the public-deployment protections below before enabling.

`POST /api/ai/festival` uses the official OpenAI SDK's Responses API with strict
Zod structured output, a second semantic validation pass, `store:false`, no tools,
a 4,000 output-token cap, and zero automatic retries. Only the submitted brief is
sent; existing saved festivals and localStorage are not uploaded. Optional
schedules require every artist exactly once, valid local dates, valid stages,
positive durations, and no overlaps, including midnight continuations. Invalid,
refused, incomplete, or failed responses cannot become saved projects. Error
responses never expose provider details or credentials. Application code does
not log briefs or model responses; consult OpenAI's API data policies for
provider-side handling. See the [official Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs).

### Abuse and cost controls — public deployment requirements

The starter endpoint accepts same-origin JSON POSTs only, rejects bodies above
16 KB (including chunked bodies), bounds every input field, limits upload time to
5 seconds, SDK time to 45 seconds, route generation to 50 seconds, and browser
waiting to 60 seconds. Cancellation aborts the upstream request when possible;
a request already processed may still incur usage. SDK errors are sanitized.

A signed HttpOnly/SameSite cookie identifies a browser session. Per **server
process**, limits are 3 attempts per session per 10 minutes, at most 2 concurrent
requests (1 per session), 20 attempts per hour and 100 per day globally. Failed
attempts consume quota. Session storage is bounded. Output tokens and lineup
size are capped, and clients cannot select arbitrary models or generation limits.

**These in-memory limits are a starter safeguard, not sufficient protection for
an unauthenticated public AI endpoint.** They reset on process restart, do not
coordinate between workers/regions, and clearing cookies bypasses the per-session
limit. Before enabling publicly, require authentication, use shared atomic
Redis/database limits keyed by verified user and trusted edge IP (do not trust
arbitrary forwarded-IP headers), enforce global tenant budgets/concurrency and
request-size/time limits at the gateway, add bot challenges as appropriate, and
set API-project spend limits/alerts. Protect access to the API key. Use shared
limits that fail closed; keep `AI_CREATE_ENABLED=false` until these controls are
configured. A custom higher-cost `OPENAI_MODEL` changes the cost of each request.

### AI verification

`npm test` covers multilingual briefs, strict SDK requests, invalid inputs,
CSRF/content-type/body limits, missing configuration, sanitized failures,
refusals, incomplete responses, timeouts/abort, session signatures, concurrency
and request budgets, invalid/overlapping midnight schedules, and the isolated
preview → edit → save → reload workflow. Provider responses are mocked in tests;
no API credential or paid OpenAI call is required to run validation.
