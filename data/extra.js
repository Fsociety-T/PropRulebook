/* Extra models for existing prop firms (verified as of 25 Nov 2026). */

const erule = (o) => RB.rule({ verified: RB.verified, ...o });

const esource = RB.src;

function addModels(firmId, models) {
  const firm = RB.firms.find((f) => f.id === firmId);
  if (!firm) throw new Error(`Unknown firm ${firmId}`);
  models.forEach((model) => {
    const prices = {};
    if (model.sizes.includes("100K")) prices["100000"] = "$100,000";
    if (model.sizes.includes("200K")) prices["200000"] = "$200,000";
    if (Object.keys(prices).length) model.prices = prices;
    const isTwoStep = /2-step|two step/i.test(model.id) || /2 Step/.test(model.name);
    if (!isTwoStep) model.hideInSidebar = true;
  });
  firm.models.push(...models);
}

/* ------------------------------------------------------------------ */
/* FundingPips — 2 Step Pro, Zero, 2 Step Lite                        */
/* ------------------------------------------------------------------ */
addModels("fundingpips", [
  {
    id: "2-step-pro",
    name: "2 Step Pro",
    tagline: "Lowest profit targets, 10K challenge size.",
    sizes: "$5K–$200K",
    phases: ["evaluation", "funded"],
    rules: {
      shared: [
        erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "6% static", body: "The floor is fixed at 6% below the starting size. Equity or balance touching the floor is a breach, even if the account recovers." }),
        erule({ id: "daily-loss", group: "killer", severity: "Hard breach", title: "Daily loss", value: "3% of higher balance/equity", body: "At midnight server time, take the higher of closing balance or equity. The floor is 3% below it." }),
      ],
      evaluation: [erule({ id: "profit-target", group: "pass", severity: "Condition", title: "Profit targets", value: "6% then 6%", body: "Phase 1 and Phase 2 targets are 6% of the starting size." })],
      funded: [erule({ id: "payout", group: "blocker", severity: "Condition", title: "Payout", value: "Weekly 60% · Bi-weekly 80%", body: "Select the reward cycle at checkout: Weekly 60%, Bi-weekly 80%, or On Demand 100%." })],
    },
  },
  {
    id: "zero",
    name: "Zero Instant",
    tagline: "No evaluation, bi-weekly 95% rewards.",
    sizes: "$5K–$200K",
    phases: ["funded"],
    rules: {
      funded: [
        erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "5% trailing live", body: "The floor trails the highest balance or equity. There is no evaluation phase." }),
        erule({ id: "payout", group: "blocker", severity: "Condition", title: "Payout", value: "Bi-weekly 95%", body: "Rewards are available every 14 days with a 95% split." }),
      ],
    },
  },
  {
    id: "2-step-lite",
    name: "2 Step Lite",
    tagline: "Two phases with 12% max loss.",
    sizes: "$5K–$100K",
    phases: ["evaluation", "funded"],
    rules: {
      shared: [erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "12% static", body: "The floor is fixed at 12% below the starting size and never trails." })],
      funded: [erule({ id: "payout", group: "blocker", severity: "Condition", title: "Payout", value: "80%", body: "The standard funded split is 80%." })],
    },
  },
]);

/* ------------------------------------------------------------------ */
/* Alpha Capital — Swing, Three                                       */
/* ------------------------------------------------------------------ */
addModels("alpha-capital", [
  {
    id: "alpha-swing",
    name: "Alpha Swing",
    tagline: "Two-step swing evaluation.",
    sizes: "$5K–$200K",
    phases: ["evaluation", "funded"],
    rules: {
      shared: [
        erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "12% static", body: "The floor is fixed at 12% below the starting size." }),
        erule({ id: "daily-loss", group: "killer", severity: "Hard breach", title: "Daily loss", value: "4%", body: "The daily floor is set from the higher of opening balance or equity at day start." }),
      ],
      evaluation: [erule({ id: "profit-target", group: "pass", severity: "Condition", title: "Profit targets", value: "8% then 5%", body: "Two phases with 8% and 5% targets of the starting size." })],
    },
  },
  {
    id: "alpha-three",
    name: "Alpha Three",
    tagline: "Three-step evaluation.",
    sizes: "$5K–$200K",
    phases: ["evaluation", "funded"],
    rules: {
      shared: [
        erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "12% static", body: "The floor is fixed at 12% below the starting size." }),
        erule({ id: "daily-loss", group: "killer", severity: "Hard breach", title: "Daily loss", value: "3–4%", body: "Daily floor is set from opening balance or equity." }),
      ],
      evaluation: [erule({ id: "profit-target", group: "pass", severity: "Condition", title: "Profit targets", value: "10% then 5% then 3%", body: "Three phases with 10%, 5% and 3% targets of the starting size." })],
    },
  },
]);

/* ------------------------------------------------------------------ */
/* FundedSquad — One Step Lite, Instant Pro, Instant Rapid           */
/* ------------------------------------------------------------------ */
addModels("fundedsquad", [
  {
    id: "one-step-lite",
    name: "One Step Lite",
    tagline: "One phase, 7% static floor.",
    sizes: "$5K–$200K",
    phases: ["evaluation", "funded"],
    rules: {
      shared: [erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "7% static", body: "The floor is fixed at 7% below the starting size." })],
      evaluation: [erule({ id: "profit-target", group: "pass", severity: "Condition", title: "Profit target", value: "8%", body: "Single phase target is 8% of the starting size." })],
    },
  },
  {
    id: "instant-pro",
    name: "Instant Pro",
    tagline: "Instant funding with 5% static drawdown.",
    sizes: "$5K–$200K",
    phases: ["funded"],
    rules: {
      shared: [erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "5% static", body: "The floor is fixed at 5% below the starting size." })],
      funded: [erule({ id: "payout", group: "blocker", severity: "Condition", title: "Payout", value: "90%", body: "The standard split is 90%." })],
    },
  },
  {
    id: "instant-rapid",
    name: "Instant Rapid",
    tagline: "No evaluation, faster rewards.",
    sizes: "$5K–$200K",
    phases: ["funded"],
    rules: {
      shared: [erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "3%", body: "The floor is fixed at 3% below the starting size." })],
      funded: [erule({ id: "payout", group: "blocker", severity: "Condition", title: "Payout", value: "85%", body: "Rewards are available on demand." })],
    },
  },
]);

/* ------------------------------------------------------------------ */
/* The5ers — Hyper Growth                                             */
/* ------------------------------------------------------------------ */
addModels("the5ers", [
  {
    id: "hyper-growth",
    name: "Hyper Growth",
    tagline: "Two-step growth with 10% max loss.",
    sizes: "$5K–$200K",
    phases: ["evaluation", "funded"],
    rules: {
      shared: [
        erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "10% static", body: "The floor is fixed at 10% below the starting size." }),
        erule({ id: "daily-loss", group: "killer", severity: "Hard breach", title: "Daily loss", value: "3%", body: "At 00:00 server time, take the higher of balance or equity." }),
      ],
      evaluation: [erule({ id: "profit-target", group: "pass", severity: "Condition", title: "Profit targets", value: "10% then 5%", body: "Two phases with 10% and 5% targets of the starting size." })],
    },
  },
]);

/* ------------------------------------------------------------------ */
/* FundedNext — Stellar Lite, Express                                 */
/* ------------------------------------------------------------------ */
addModels("fundednext", [
  {
    id: "stellar-lite",
    name: "Stellar Lite",
    tagline: "Lower-cost two-phase model.",
    sizes: "$6K–$200K",
    phases: ["evaluation", "funded"],
    rules: {
      shared: [
        erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "10% static", body: "The floor is fixed at 10% below the initial balance." }),
        erule({ id: "daily-loss", group: "killer", severity: "Hard breach", title: "Daily loss", value: "5%", body: "At 00:00 server time, set the floor at 5% of the initial balance." }),
      ],
      evaluation: [erule({ id: "profit-target", group: "pass", severity: "Condition", title: "Profit targets", value: "8% then 5%", body: "Two phases with 8% and 5% targets of the starting size." })],
    },
  },
  {
    id: "express",
    name: "Express",
    tagline: "Instant-style funded route.",
    sizes: "$6K–$200K",
    phases: ["funded"],
    rules: {
      shared: [erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "5% trailing", body: "The floor trails the highest balance or equity." })],
      funded: [erule({ id: "payout", group: "blocker", severity: "Condition", title: "Payout", value: "80%", body: "The standard funded split is 80%." })],
    },
  },
]);

/* ------------------------------------------------------------------ */
/* GOAT — 2 Step Premium, 2 Step Promo 100K                           */
/* ------------------------------------------------------------------ */
addModels("goat", [
  {
    id: "2-step-premium",
    name: "2 Step Premium",
    tagline: "Two-step with premium payout terms.",
    sizes: "$5K–$200K",
    phases: ["evaluation", "funded"],
    rules: {
      shared: [
        erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "10% static", body: "The absolute floor never trails." }),
        erule({ id: "daily-loss", group: "killer", severity: "Hard breach", title: "Daily drawdown", value: "4% of higher balance/equity", body: "At 5:00 PM New York, take the higher of balance or equity." }),
      ],
      evaluation: [erule({ id: "profit-target", group: "pass", severity: "Condition", title: "Profit targets", value: "8% then 6%", body: "Two phases with 8% and 6% targets." })],
      funded: [erule({ id: "payout", group: "blocker", severity: "Condition", title: "Payout", value: "80% every 14 days", body: "Standard payout is bi-weekly with 80% split." })],
    },
  },
  {
    id: "2-step-promo-100k",
    name: "2 Step Promo 100K",
    tagline: "Promotional 2-step for $100K accounts.",
    sizes: "$100K",
    phases: ["evaluation", "funded"],
    rules: {
      shared: [
        erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "10% static", body: "The floor is fixed at 10% below the starting size." }),
        erule({ id: "daily-loss", group: "killer", severity: "Hard breach", title: "Daily drawdown", value: "4%", body: "Daily floor is set from higher balance/equity at 5:00 PM New York." }),
      ],
      evaluation: [erule({ id: "profit-target", group: "pass", severity: "Condition", title: "Profit targets", value: "8% then 6%", body: "Two phases with 8% and 6% targets of $100K." })],
    },
  },
]);

/* ------------------------------------------------------------------ */
/* Funded Elite — Lite 1 Step, Lite 2 Step, Instant Elite, Flash Activation */
/* ------------------------------------------------------------------ */
addModels("funded-elite", [
  {
    id: "lite-1-step",
    name: "Lite 1 Step",
    tagline: "One-step challenge with Lite rules.",
    sizes: "$5K–$300K",
    phases: ["evaluation", "funded"],
    rules: {
      shared: [
        erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "8% static", body: "The floor is fixed at 8% below the starting size." }),
        erule({ id: "daily-loss", group: "killer", severity: "Hard breach", title: "Daily loss", value: "3% of higher prior close", body: "At the 5:00 PM New York reset, take the higher of previous close balance or equity." }),
      ],
      evaluation: [erule({ id: "profit-target", group: "pass", severity: "Condition", title: "Profit target", value: "12%", body: "Single phase target is 12% of the starting size." })],
      funded: [erule({ id: "payout", group: "blocker", severity: "Condition", title: "Payout", value: "80%", body: "Standard reward share is 80%." })],
    },
  },
  {
    id: "lite-2-step",
    name: "Lite 2 Step",
    tagline: "Two-step challenge with Lite rules.",
    sizes: "$5K–$300K",
    phases: ["evaluation", "funded"],
    rules: {
      shared: [
        erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "8% static", body: "The floor is fixed at 8% below the starting size." }),
        erule({ id: "daily-loss", group: "killer", severity: "Hard breach", title: "Daily loss", value: "5%", body: "Daily floor is set from higher prior close at 5:00 PM New York." }),
      ],
      evaluation: [erule({ id: "profit-target", group: "pass", severity: "Condition", title: "Profit targets", value: "8% then 5%", body: "Two phases with 8% and 5% targets." })],
    },
  },
  {
    id: "instant-elite",
    name: "Instant Elite",
    tagline: "Instant-funded account with more sizes.",
    sizes: "$50K–$300K",
    phases: ["funded"],
    rules: {
      shared: [erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "6% trailing", body: "The floor trails the highest equity reached." })],
      funded: [erule({ id: "payout", group: "blocker", severity: "Condition", title: "Payout", value: "70% → 80%", body: "Payout 2 onward is 80%; cycle is 21 days." })],
    },
  },
  {
    id: "flash-activation",
    name: "Flash Activation",
    tagline: "Fast activation funded route.",
    sizes: "$50K–$200K",
    phases: ["funded"],
    rules: {
      shared: [erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "5% trailing", body: "The floor trails the highest equity reached." })],
      funded: [erule({ id: "payout", group: "blocker", severity: "Condition", title: "Payout", value: "80% every 21 days", body: "First payout after 21 days, then bi-weekly." })],
    },
  },
]);

/* ------------------------------------------------------------------ */
/* AquaFunded — 1 Step Standard, 2 Step Standard, 2 Step Elite,       */
/* Instant Pro, AquaMan, Pay Later                                    */
/* ------------------------------------------------------------------ */
addModels("aquafunded", [
  {
    id: "1-step-standard",
    name: "1 Step Standard",
    tagline: "One-phase standard route.",
    sizes: "$5K–$100K",
    phases: ["evaluation", "funded"],
    rules: {
      shared: [erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "10% trailing", body: "The floor trails the highest balance or equity." })],
      evaluation: [erule({ id: "profit-target", group: "pass", severity: "Condition", title: "Profit target", value: "10%", body: "Single phase target is 10% of the starting size." })],
    },
  },
  {
    id: "2-step-standard",
    name: "2 Step Standard",
    tagline: "Two-step standard route.",
    sizes: "$5K–$200K",
    phases: ["evaluation", "funded"],
    rules: {
      shared: [erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "10% static", body: "The floor is fixed at 10% below the starting size." })],
      evaluation: [erule({ id: "profit-target", group: "pass", severity: "Condition", title: "Profit targets", value: "10% then 5%", body: "Two phases with 10% and 5% targets of the starting size." })],
    },
  },
  {
    id: "2-step-elite",
    name: "2 Step Elite",
    tagline: "Two-step route with more size.",
    sizes: "$5K–$300K",
    phases: ["evaluation", "funded"],
    rules: {
      shared: [erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "10% trailing", body: "The floor trails the highest balance or equity." })],
      evaluation: [erule({ id: "profit-target", group: "pass", severity: "Condition", title: "Profit targets", value: "8% then 5%", body: "Two phases with 8% and 5% targets." })],
    },
  },
  {
    id: "instant-flex",
    name: "Instant Flex",
    tagline: "Instant funding with 5% static drawdown.",
    sizes: "$50K–$200K",
    phases: ["funded"],
    rules: {
      shared: [erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "5% static", body: "The floor is fixed at 5% below the starting size." })],
      funded: [erule({ id: "payout", group: "blocker", severity: "Condition", title: "Payout", value: "90%", body: "Standard split is 90%." })],
    },
  },
  {
    id: "instant-pro",
    name: "Instant Pro",
    tagline: "Instant funding with 6% trailing.",
    sizes: "$50K–$200K",
    phases: ["funded"],
    rules: {
      shared: [erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "6% trailing", body: "The floor trails the highest equity reached." })],
      funded: [erule({ id: "payout", group: "blocker", severity: "Condition", title: "Payout", value: "90%", body: "Standard split is 90%." })],
    },
  },
  {
    id: "aquaman",
    name: "AquaMan",
    tagline: "Model with 5% max loss.",
    sizes: "$5K–$100K",
    phases: ["evaluation", "funded"],
    rules: {
      shared: [erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "5% static", body: "The floor is fixed at 5% below the starting size." })],
    },
  },
  {
    id: "pay-later",
    name: "Pay Later",
    tagline: "Pay-after-pass route.",
    sizes: "$50K–$100K",
    phases: ["evaluation", "funded"],
    rules: {
      shared: [erule({ id: "max-loss", group: "killer", severity: "Hard breach", title: "Maximum loss", value: "6% static", body: "The floor is fixed at 6% below the starting size." })],
      evaluation: [erule({ id: "profit-target", group: "pass", severity: "Condition", title: "Profit target", value: "5%", body: "Single phase target is 5% of the starting size." })],
    },
  },
]);
