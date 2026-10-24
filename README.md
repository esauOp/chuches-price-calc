# Chuches Price Calc

A browser-based price calculator for 3D printing. It works out what one printed piece really costs (filament, electricity, machine wear, failed prints, labor, extras and overhead) and turns that cost into a selling price. Platform commissions and IVA are already included in that price, so they don't come out of your profit.

Everything runs client-side. There is no backend and no account: your data stays in the browser's `localStorage`, and you can move it between devices with JSON export/import.

All amounts are in Mexican pesos (MXN).

## Features

- **Calculator**: price one unit or a batch, with a live cost breakdown, a chart, margin, and warnings.
  - Multiple build plates per part, each with its own printer, print time and one or more filaments (multi-material / AMS).
  - Setup and post-processing time, a one-off design fee, hardware (magnets, inserts, screws…), packaging and shipping.
  - Per-quote failure rate, markup, sales channel, IVA toggle and quantity discount tiers.
  - Sticky summary on desktop; a fixed price bar on mobile.
- **Quotes**: save, search (by name or client), open, duplicate and delete quotes. Saved quotes are **recalculated with your current costs**, so changing a filament price updates every quote that uses it.
- **Settings**: manage your profiles and defaults:
  - Printers: purchase price, expected lifetime hours, power draw, maintenance per hour.
  - Materials: type, color, spool price, spool weight, waste %.
  - Hardware catalog and packaging options.
  - Sales channels: % commission and fixed fee per order (e.g. Mercado Libre, Mercado Pago, Etsy).
  - General: electricity price (MXN/kWh), labor rate (MXN/h), default failure / overhead / markup / IVA %, price rounding rule, and default printer, material and channel.
  - Data & backup: export or import everything as JSON, or reset to the example data.
- Light and dark themes (follows the system preference by default).

## How the price is calculated

Everything is computed **per unit**. Batch-level costs are split across the quantity. The logic lives in [`src/domain/pricing.ts`](src/domain/pricing.ts).

### 1. Production cost

| Component | Formula |
| --- | --- |
| Material | `grams × (spool price / spool weight) × (1 + waste %)`, summed over every filament on every plate |
| Electricity | `hours × printer watts × electricity price / 1000` |
| Machine | `hours × (purchase price / lifetime hours + maintenance per hour)` |
| Failure | `(material + electricity + machine) × failure %` |
| Labor | `(setup minutes / quantity + post-processing minutes) / 60 × labor rate` |
| Design | `design fee / quantity` |
| Hardware | `Σ qty × unit cost` |
| Packaging | cost of the selected packaging |
| Overhead | `subtotal of the above × overhead %` |

**Cost** = subtotal + overhead.

### 2. Selling price

1. **Base price** = `cost × (1 + markup %)`
2. **Discount** = base price × the discount of the highest tier whose minimum quantity is reached.
3. **Net**, the amount you need to keep = `base price − discount + shipping / quantity`
4. The final price is grossed up so that the platform commission (charged on the tax-included price) and IVA are covered:

   ```
   price = (net + fixed fee / quantity) / (1 − fee % − IVA / (1 + IVA))
   ```

5. **Rounding** always goes up, so it only adds profit. Options: none, nearest 1, 5 or 10, or ending in 9 (e.g. 149).

**Profit** = `price − platform fee − IVA − cost − shipping`. **Margin** is profit as a share of revenue excluding tax.

### Warnings

The calculator flags these cases instead of failing silently:

- A plate has no printer, or a filament line has no material.
- A material has a spool weight of 0 g.
- The selected packaging or sales channel no longer exists.
- Fees plus tax take 100% or more of the price, so no price can work.
- The price is at or below cost (error), or the margin is below 20% (warning).

## Tech stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev) for dev server and build
- [Tailwind CSS v4](https://tailwindcss.com) with [Radix UI](https://www.radix-ui.com) primitives (shadcn-style components in `src/components/ui`)
- [Zustand](https://zustand.docs.pmnd.rs) with the `persist` middleware for state and `localStorage` persistence
- [Zod](https://zod.dev) schemas for data types and backup validation
- [Recharts](https://recharts.org) for the cost breakdown chart
- [Lucide](https://lucide.dev) icons
- [Vitest](https://vitest.dev) for unit tests

## Getting started

Requirements: Node.js 24 (see [`.nvmrc`](.nvmrc)).

```bash
nvm use
npm install
npm run dev
```

Then open the URL Vite prints (by default http://localhost:5173).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the unit tests once |
| `npm run typecheck` | Type-check without emitting files |

The production build is a static site, so `dist/` can be deployed to any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages…).

## Project structure

```
src/
├── App.tsx                  # Shell: header, tabs, theme toggle
├── main.tsx                 # Entry point
├── index.css                # Tailwind setup and theme tokens
├── domain/                  # Framework-free business logic
│   ├── schemas.ts           # Zod schemas (source of truth for data shapes)
│   ├── types.ts             # Types inferred from schemas + breakdown types
│   ├── pricing.ts           # calculateQuote, applyRounding, discountFor
│   ├── pricing.test.ts      # Unit tests for the pricing engine
│   └── defaults.ts          # Seed data and new-quote template
├── store/
│   └── useAppStore.ts       # Zustand store: profiles, quotes, draft, import/export
├── features/
│   ├── calculator/          # Calculator page, form sections, summary and chart
│   ├── quotes/              # Saved quotes list
│   └── settings/            # Profile managers, general settings, backup
├── components/              # Shared form fields, sections and UI primitives
└── lib/                     # Formatting (MXN, %, durations) and utilities
```

The pricing engine in `src/domain` has no React dependencies, so you can test it or reuse it outside the UI.

## Data and privacy

- Everything is stored in your browser's `localStorage` under the key `chuches-price-calc`; the theme preference is stored under `theme`.
- Clearing site data or switching browsers or devices loses your data unless you export a backup first (**Settings → Data & backup → Export backup**).
- Imported backups are validated against the Zod schemas. **Importing replaces** all current profiles, settings and quotes.
- The default profiles (Bambu Lab P1S, Ender 3 V3, generic PLA/PETG/TPU/ABS, common sales channels) are rough MXN examples. Change them in Settings to match your real costs.

## Testing

The pricing engine is covered by unit tests in [`src/domain/pricing.test.ts`](src/domain/pricing.test.ts). They cover each cost component, splitting batch costs across the quantity, the fee and IVA gross-up, rounding, discount tiers, and edge cases like missing references, zero-weight spools, impossible fee combinations and invalid quantities.

```bash
npm test
```
