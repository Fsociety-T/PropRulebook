# Prop Rulebook

A fast browser-based rules reference for prop-firm accounts. This is a **personal study summary**, not an official rulebook — the firm's dashboard and terms always win. Rules change; re-check before sizing a trade.

## What's covered

- **FundedNext**: Stellar 2-Step, Stellar 1-Step
- **GOAT Funded**: 2 Step GOAT, 1 Step GOAT
- **The5ers**: 2 Step, High Stakes, Summer 2-Step (Limited)
- **Funded Elite**: 2 Step + Free Retry, 1 Step + Free Retry, Instant
- **FundingPips**: 2 Step Standard, 2 Step Flex, 1 Step Flex
- **Alpha Capital**: Alpha Pro 6%, 8%, 10% (variant switch)
- **FundedSquad**: 2 Step Squad (Legacy), 2 Step Lite, 2 Step Flex, One-Step Flex, Instant Flex
- **AquaFunded**: 2 Step Pro, Instant Funding Standard

The account-size selector is limited to **$100K and $200K**. Every rule shows severity, exact calculation, a dollar example, a source link and a verified date. Fees and refunds are excluded. Scaling is shown only where it changes drawdown limits. Funded execution guardrails cover the daily reset, margin usage, XAUUSD sizing, news windows and execution safety.

## Live site

<https://fsociety-t.github.io/PropRulebook/>

Published from the `main` branch root with GitHub Pages. Commit to `main` and Pages rebuilds automatically.

## How to run

Prop Rulebook is plain HTML, CSS and JavaScript. No build step, no dependencies, no Node required. Open the project folder in a file manager and double-click `index.html` — or serve it from any web server if you prefer:

```sh
# From a terminal in the project root:
python3 -m http.server 8000
# Then open http://localhost:8000
```

Works from `file://` too. Set your browser to a dark theme for the dashboard look.

## Files

```
index.html            page shell, topbar, sidebar, search overlay
styles.css            dark dashboard styling
app.js                routing, search, compare, size interpolation, printing
data/core.js          shared helpers, source registry, sizes, verified date
data/fundednext.js    FundedNext models and rules
data/goatfunded.js    GOAT Funded models and rules
data/the5ers.js       The5ers models and rules
data/fundedelite.js   Funded Elite models and rules
data/fundingpips.js   FundingPips models and rules
data/alpha.js         Alpha Pro factory for 6/8/10%
data/fundedsquad.js   FundedSquad models and rules
data/aquafunded.js    AquaFunded models and rules
data/extra.js         additional models for existing prop firms
data/rules.js         assembles window.RULEBOOK
data/sources.md       every official source and verification date
README.md             this file
```

## How to update

1. Fetch the official page listed next to the rule you want to change.
2. Compare it with the rule card, then edit the data file:
   - Copy the new text into the rule's `value`, `body`, `calc` or `example`.
   - Update `verified` on the rule (and on the model if needed).
   - Update `RB.sources.*` in `data/core.js` if the source URL changed.
   - If the official rules conflict, add a `note` and a badge instead of picking silently.
3. Reopen `index.html` to see the change. No other step is needed.

When a firm changes its model page, update:

- `tagline` and model `facts`/`headline` — what people see first.
- Rule text in `rules.shared`, `rules.evaluation` or `rules.funded`.
- `RB.sources` — new or moved pages.
- `badge` — `Legacy` or `Limited` model or `Date-dependent` rule.

## Testing notes

Use Firefox or Chrome. Check:

- Homepage opens on a rule page (`#/m/fundingpips/2-step-standard`).
- `Ctrl+K` search opens over every rule; `Esc` closes it.
- Sidebar model links, compare view with 2–4 models, `Show only differences`, account-size select, mobile drawer (≤960px), and print preview (Ctrl+P).
- On print, rule bodies open and source URLs are shown as footnotes.
- If the browser blocks storage, the app still works; only saved size/compare selection is lost.

## Disclaimer

**Personal study notes, not an official rulebook. The firm's dashboard and terms always win. Rules change — re-check before sizing a trade.**
