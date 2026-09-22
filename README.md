# BBG

Next.js 16 app with the App Router, TypeScript, Tailwind CSS, ESLint, and React Compiler.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page lives at `src/app/page.tsx`.

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SITE_URL` for the environment you are running.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Turbopack dev server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check without emitting files |

## Layout

Application code lives in `src/`. Route files stay in `src/app/`. Shared helpers belong in `src/lib/`. Keep Server Components as the default and add `"use client"` only at interactive boundaries.
