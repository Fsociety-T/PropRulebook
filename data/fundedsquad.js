/* FundedSquad — 2 Step Squad (legacy), 2 Step Lite, 2 Step Flex,
   One-Step Flex, Instant Flex */

const fsMaxLoss = (pct, source) =>
  RB.rule({
    id: "max-loss",
    group: "killer",
    severity: "Hard breach",
    title: "Maximum loss (static)",
    value: `${pct}% of initial balance`,
    body: `The maximum total drawdown is a static ${pct}% floor below your initial balance. It does not move as equity rises or falls.`,
    calc: `Initial balance × (1 − ${pct}%).`,
    example: `On {size}: the floor is {floor:${pct}}; {amt:${pct}} of room.`,
    note: "A breach closes the account immediately; there is no grace period.",
    source,
  });

const fsDailyLoss = (pct, source) =>
  RB.rule({
    id: "daily-loss",
    group: "killer",
    severity: "Hard breach",
    title: "Daily loss limit",
    value: `${pct}% of the higher of day-start balance or equity`,
    body: `At 12:00 AM UTC, FundedSquad checks the higher of account balance or account equity. That figure is the reference for the day; equity cannot fall more than ${pct}% below it.`,
    calc: `Baseline = max(balance, equity) at 00:00 UTC. Floor = baseline × (1 − ${pct}%).`,
    example: `On {size}, the daily limit is {amt:${pct}} from the higher of the two opening values.`,
    note: "The daily limit resets at 00:00 UTC. Floating and closed losses both count.",
    source,
  });

const fsInactivity = (source) =>
  RB.rule({
    id: "inactivity",
    group: "killer",
    severity: "Hard breach",
    title: "21-day inactivity",
    value: "21 consecutive calendar days",
    body: "No trading activity for 21 consecutive calendar days breaches the account. The clock starts on the purchase date, not on your first trade.",
    calc: "21 calendar days from purchase or from the last trading activity.",
    example: "Buy on the 1st, do not trade, and the account can be breached on the 22nd.",
    source,
  });

const fsEAs = (source) =>
  RB.rule({
    id: "eas",
    group: "killer",
    severity: "Hard breach",
    title: "Expert Advisors",
    value: "Allowed except HFT / gold arbitrage",
    body: "EAs are allowed if they follow all trading rules and do not use prohibited practices. High-frequency trading and gold-arbitrage EAs are not permitted.",
    calc: "The EA must not use prohibited execution patterns.",
    example: "A standard risk-management EA is fine; a latency gold-arbitrage bot is not.",
    source,
  });

const fsVPN = (source) =>
  RB.rule({
    id: "vpn",
    group: "killer",
    severity: "Hard breach",
    title: "VPN and VPS",
    value: "Not allowed",
    body: "All trading must be done without a VPN or VPS. Using either may result in an account violation.",
    calc: "Direct connection required.",
    example: "Trading from a VPS is not allowed.",
    source,
  });

const fsCopy = (source) =>
  RB.rule({
    id: "copy",
    group: "killer",
    severity: "Hard breach",
    title: "Copy trading",
    value: "Own FundedSquad accounts only",
    body: "Copy between your own FundedSquad evaluation and funded accounts in any direction. External accounts (even your own), other traders, signal providers, and third-party copiers are prohibited.",
    calc: "All copied accounts must be under your FundedSquad profile.",
    example: "Eval → funded is allowed; personal MT5 → FundedSquad is not.",
    source,
  });

const fsReset = (source) =>
  RB.rule({
    id: "reset",
    group: "ref",
    severity: "Reference",
    title: "Daily reset time",
    value: "00:00 UTC",
    body: "The trading day resets at 12:00 AM UTC. Daily drawdown is calculated from the day-start reference.",
    calc: "The daily baseline is captured at 00:00 UTC.",
    example: "00:00 UTC is midnight in London in winter.",
    source,
  });

const fsMarginUsage = (source) =>
  RB.rule({
    id: "margin-usage",
    group: "blocker",
    severity: "Rule violation",
    title: "Margin usage",
    value: "Margin ÷ equity ≤ firm max",
    body: "Margin used by open trades ÷ account equity × 100 must stay within the firm margin limit.",
    calc: "Margin usage = Σ(lots × contract size × price ÷ leverage) ÷ equity × 100.",
    example: `At {size}, using $40,000 margin gives {amt:40} on a $100K account and {amt:20} on a $200K account.`,
    source,
  });

const fsLeverage = (fx, source) =>
  RB.rule({
    id: "leverage",
    group: "ref",
    severity: "Reference",
    title: "Leverage",
    value: `FX 1:${fx} · metals 1:20 · crypto 1:2`,
    body: `Forex 1:${fx}. Metals, indices and commodities are 1:20 on most models (1:10 on Flex models). Crypto is 1:2.`,
    calc: "Margin = notional ÷ leverage.",
    example:
      fx === 50
        ? "1 lot EURUSD at 1:50 requires about $2,000 margin."
        : "1 lot EURUSD at 1:100 requires about $1,000 margin.",
    source,
  });

const fsLots = (source) =>
  RB.rule({
    id: "lots",
    group: "blocker",
    severity: "Hard cap",
    title: "Lot-size caps (funded stage)",
    value: "FX 0.2–8 lots · gold 0.1–4",
    body: "Per forex pair and gold: $2.5K 0.2 / 0.1; $5K 0.4 / 0.2; $10K 0.8 / 0.4; $25K 2.0 / 0.8; $50K 4.0 / 1.5; $100K 6.0 / 2.5; $200K 8.0 / 4.0.",
    calc: "Caps are per forex pair and per gold position, scaled by account size.",
    example: "On {size}, use the FX and gold caps for your account size in the list above.",
    note: "Applies to the funded stage of challenge models. Instant models have separate caps.",
    source,
  });

const fsInstantLots = (source) =>
  RB.rule({
    id: "lots",
    group: "blocker",
    severity: "Hard cap",
    title: "Lot-size caps",
    value: "FX 0.2–4 lots · gold 0.1–2.2",
    body: "Per forex pair and gold: $5K 0.2 / 0.1; $10K 0.4 / 0.2; $25K 1.0 / 0.45; $50K 2.0 / 0.9; $100K 3.0 / 1.7; $200K 4.0 / 2.2.",
    calc: "Caps are per forex pair and per gold position, scaled by account size.",
    example: "On {size}, use the FX and gold caps for your account size in the list above.",
    note: "Instant accounts use lower lot caps than challenge accounts.",
    source,
  });

const fsNews = (source) =>
  RB.rule({
    id: "news",
    group: "blocker",
    severity: "Soft breach",
    title: "News window on funded accounts",
    value: "4 min before / after",
    body: "Evaluation: news trading is fully allowed. Funded: no new trades from 4 minutes before to 4 minutes after a news event (8-minute window). Holding existing trades is allowed. Trades opened 2+ hours before the event are fully safe. Trades opened before the window but less than 2 hours before it may be held; if closed in profit during the window, the profit is removed. Opening inside the window, or triggering a pending order inside it, can lead to payout rejection.",
    calc: "Window = event − 4 min to event + 4 min. Only new entries are restricted; holding is fine.",
    example: "News at 14:00: no new trades from 13:56 to 14:04. A trade opened at 10:00 is fully safe.",
    note: "This applies to funded accounts; evaluation has no restriction.",
    source,
  });

const fsWeekendChallenge = (source) =>
  RB.rule({
    id: "weekend",
    group: "blocker",
    severity: "Rule violation",
    title: "Weekend holding",
    value: "Holding allowed · no new weekend trades",
    body: "Weekend holding is allowed by default on One-Step and Two-Step models in evaluation and funded. New positions cannot be opened during the weekend. The Weekend Add-On only permits holding existing positions.",
    calc: "Close or hold before the weekend; do not open new trades on Saturday or Sunday.",
    example: "A position opened Friday can be held over the weekend; a new Saturday entry is not allowed.",
    source,
  });

const fsWeekendInstant = (source) =>
  RB.rule({
    id: "weekend",
    group: "blocker",
    severity: "Rule violation",
    title: "Weekend holding",
    value: "Add-on required",
    body: "Instant models do not include weekend holding by default. Without the Weekend Add-On, all positions must be closed before the weekend. The add-on permits holding only; no new weekend trades.",
    calc: "Close all positions before the weekend unless the add-on is active.",
    example: "A position still open on Saturday without the add-on is a rule violation.",
    source,
  });

const fsDuration = (source) =>
  RB.rule({
    id: "duration",
    group: "killer",
    severity: "Rule violation",
    title: "Minimum trade duration",
    value: "60 sec (new) / 2 min (older)",
    body: "For funded accounts purchased after 2:00 AM UK time on 21 October 2026, every trade must be held at least 60 seconds. Older accounts follow the 2-minute rule across all phases. An add-on can remove the requirement for eligible accounts up to $10K (not Instant Flex).",
    calc: "Holding time = close time − open time. New purchases: funded stage only. Older purchases: all phases.",
    example: "A trade closed after 45 seconds on a new funded account is a violation unless the add-on is active.",
    note: "Date-dependent: confirm your purchase date. The 2-minute add-on is not available on Instant Flex.",
    badge: "Date-dependent",
    source,
  });

const fsFloatingRisk = (pct, firstSplit, source, instant) =>
  RB.rule({
    id: "floating-risk",
    group: "killer",
    severity: "Soft, then hard",
    title: "Max floating risk",
    value: `${pct}% of initial balance`,
    body: instant
      ? `If the combined floating loss across all open positions reaches ${pct}% of the initial account size, positions close and the profit split drops to ${firstSplit}%. A second trigger breaches and closes the account.`
      : `If combined floating loss across all open positions reaches ${pct}% of the initial balance at any time, the rule is violated, even if the trades recover. First violation: profit split drops to ${firstSplit}%. Second: account closed.`,
    calc: `Sum of open floating P&L ≤ −${pct}% of initial balance. Closed losses do not reduce the ${pct}% room.`,
    example: `On {size}, the threshold is {amt:${pct}}; one trade or several together can trigger it.`,
    source,
  });

const fsDailyCap = (source) =>
  RB.rule({
    id: "daily-cap",
    group: "blocker",
    severity: "Profit cap",
    title: "Daily profit limit",
    value: "$3,000 per trading day",
    body: "Maximum permitted profit is $3,000 per trading day across all funded account sizes. Profit above the cap is deducted on review. Exceeding the cap is not a breach.",
    calc: "Daily profit above $3,000 is removed from the account.",
    example: "A $4,500 day counts as $3,000; the extra $1,500 is deducted.",
    source,
  });

const fsPayout = (split, cycle, min, source) =>
  RB.rule({
    id: "payout",
    group: "blocker",
    severity: "Condition",
    title: "Payout terms",
    value: `${split} · ${cycle}`,
    body: `${split} profit split. Payout cycle: ${cycle}. Minimum payout: ${min}.`,
    calc: "Trader share = eligible profit × split.",
    example: "On {amt:1} eligible profit, your share is calculated at the stated split before fees.",
    source,
  });

const fsProfitTarget = (t1, t2, source) =>
  RB.rule({
    id: "profit-target",
    group: "pass",
    severity: "Condition",
    title: t2 ? "Profit targets" : "Profit target",
    value: t2 ? `${t1}% then ${t2}%` : `${t1}%`,
    body: t2
      ? `Phase 1 target is ${t1}%; Phase 2 target is ${t2}%. Both phases must be completed with all trades closed.`
      : `The evaluation target is ${t1}%. It must be reached with all trades closed.`,
    calc: t2 ? `Phase 1 = size × ${t1}%; Phase 2 = size × ${t2}%.` : `Target = size × ${t1}%.`,
    example: t2
      ? `On {size}: {amt:${t1}} in Phase 1, then {amt:${t2}} in Phase 2.`
      : `On {size}: {amt:${t1}} to pass.`,
    source,
  });

const fsMinDays = (days, source) =>
  RB.rule({
    id: "min-days",
    group: "blocker",
    severity: "Condition",
    title: "Payout trading days",
    value: `${days} at 0.5% each`,
    body: `Complete at least ${days} trading days before requesting a reward. Each qualifying day must generate at least 0.5% of the initial balance. Days do not need to be consecutive.`,
    calc: `Qualifying day = closed profit ≥ 0.5% of initial balance. Required days = ${days}.`,
    example: `On {size}, each qualifying day needs at least {amt:0.5}; complete ${days} such days.`,
    note: "This is a funded payout condition, not an evaluation requirement.",
    source,
  });

const fsEvalNoMinDays = (source) =>
  RB.rule({
    id: "min-days",
    group: "pass",
    severity: "Condition",
    title: "No minimum trading days",
    value: "None",
    body: "The evaluation phases have no minimum trading day requirement and no time limit. Pass whenever the profit target is reached.",
    calc: "Reach the target with all trades closed.",
    example: "A single closed trade can pass a phase if it reaches the target.",
    source,
  });

const fsPayoutNone = (source) =>
  RB.rule({
    id: "payout-none",
    group: "ref",
    severity: "Reference",
    title: "No payout during evaluation",
    value: "Funded stage only",
    body: "Rewards are only available after the evaluation is passed and the funded stage begins.",
    calc: "Evaluation accounts do not pay rewards.",
    example: "Pass the evaluation first.",
    source,
  });

const fsEvalNews = (source) =>
  RB.rule({
    id: "news-eval",
    group: "ref",
    severity: "Reference",
    title: "News trading in evaluation",
    value: "Fully allowed",
    body: "There is no restricted window during Phase 1 or Phase 2. You can open and close trades freely around news events.",
    calc: "No restriction during evaluation.",
    example: "A news trade in Phase 1 is allowed.",
    source,
  });

/* ------------------------------------------------------------------ */
/* Models                                                              */
/* ------------------------------------------------------------------ */
RB.firms.push({
  id: "fundedsquad",
  name: "FundedSquad",
  short: "FS",
  color: "#fb923c",
  tagline: "Two-step and one-step challenges, plus instant funding.",
  models: [
    {
      id: "2-step-squad",
      name: "2 Step Squad",
      tagline: "The discontinued two-step model. Existing accounts keep their rules.",
      sizes: "$5K–$200K",
      badges: ["Legacy"],
      phases: ["evaluation", "funded"],
      watchOut: [
        "This model is discontinued for new purchases. Existing challenges keep the rules shown here.",
        "The 1.5% floating-risk rule is separate from the daily and max loss. First violation cuts the split to 40%; the second closes the account.",
        "Funded accounts cannot open new trades inside the 4-minute news window. A pending order triggered inside it is also a violation.",
      ],
      headline: {
        evaluation: [
          RB.h("Profit target", "8% / 6%", "Phase 1 / Phase 2"),
          RB.h("Daily loss", "5%", "{amt:5} on {size}"),
          RB.h("Max loss", "12% static", "Floor {floor:12}"),
          RB.h("Min trading days", "None", "No time limit"),
          RB.h("Consistency", "None", "Evaluation"),
          RB.h("Payout", "After passing", "80% · 100% add-on"),
        ],
        funded: [
          RB.h("Payout split", "80%", "100% add-on"),
          RB.h("Daily loss", "5%", "{amt:5} on {size}"),
          RB.h("Max loss", "12% static", "Floor {floor:12}"),
          RB.h("Min payout", "$100 · 5 days", "5 profitable days at 0.5%"),
          RB.h("Floating risk", "1.5%", "{amt:1.5} on {size}"),
          RB.h("Daily profit cap", "$3,000", "Excess deducted"),
        ],
      },
      facts: {
        evaluation: {
          "Profit target": "8% / 6%",
          "Daily loss": "5%",
          "Max loss": "12% static",
          "Min trading days": "None",
          Consistency: "None",
          Payout: "After passing",
          News: "Allowed",
          Weekend: "Holding allowed; no new weekend trades",
          Leverage: "FX 1:100",
          Reset: "00:00 UTC",
        },
        funded: {
          "Payout split": "80% (100% add-on)",
          "Daily loss": "5%",
          "Max loss": "12% static",
          "Min payout": "$100",
          "Payout days": "5 at 0.5%",
          Consistency: "None",
          Schedule: "14 days (weekly add-on)",
          News: "4-min window; profits removed",
          Weekend: "Holding allowed; no new weekend trades",
          Leverage: "FX 1:100",
          Reset: "00:00 UTC",
        },
      },
      rules: {
        shared: [
          fsMarginUsage(RB.sources.fsSquad),
          fsMaxLoss(12, RB.sources.fsSquad),
          fsDailyLoss(5, RB.sources.fsSquad),
          fsInactivity(RB.sources.fsChallenge),
          fsEAs(RB.sources.fsChallenge),
          fsVPN(RB.sources.fsChallenge),
          fsCopy(RB.sources.fsChallenge),
          fsReset(RB.sources.fsDrawdown),
          fsLeverage(100, RB.sources.fsSquad),
        ],
        evaluation: [
          fsProfitTarget(8, 6, RB.sources.fsSquad),
          fsEvalNoMinDays(RB.sources.fsSquad),
          fsEvalNews(RB.sources.fsChallenge),
          fsWeekendChallenge(RB.sources.fsChallenge),
          fsPayoutNone(RB.sources.fsSquad),
        ],
        funded: [
          fsFloatingRisk(1.5, 40, RB.sources.fsSquad, false),
          fsNews(RB.sources.fsChallenge),
          fsWeekendChallenge(RB.sources.fsChallenge),
          fsDuration(RB.sources.fsChallenge),
          fsLots(RB.sources.fsChallenge),
          fsDailyCap(RB.sources.fsSquad),
          fsMinDays(5, RB.sources.fsSquad),
          fsPayout("80% (100% add-on)", "14 days (weekly add-on)", "$100", RB.sources.fsSquad),
        ],
      },
    },

    {
      id: "2-step-lite",
      name: "2 Step Lite",
      tagline: "A tighter two-step challenge with an 8% static floor.",
      sizes: "$5K–$200K",
      badges: [],
      phases: ["evaluation", "funded"],
      watchOut: [
        "The 8% static floor is the tightest of the FundedSquad two-step models. Size for it before the daily limit.",
        "The 1.5% floating-risk rule can cut your split to 40% even if the trade recovers.",
        "Funded accounts cannot open new trades inside the 4-minute news window.",
      ],
      headline: {
        evaluation: [
          RB.h("Profit target", "6% / 6%", "Phase 1 / Phase 2"),
          RB.h("Daily loss", "4%", "{amt:4} on {size}"),
          RB.h("Max loss", "8% static", "Floor {floor:8}"),
          RB.h("Min trading days", "None", "No time limit"),
          RB.h("Consistency", "None", "Evaluation"),
          RB.h("Payout", "After passing", "80% · 100% add-on"),
        ],
        funded: [
          RB.h("Payout split", "80%", "100% add-on"),
          RB.h("Daily loss", "4%", "{amt:4} on {size}"),
          RB.h("Max loss", "8% static", "Floor {floor:8}"),
          RB.h("Min payout", "$100 · 5 days", "5 profitable days at 0.5%"),
          RB.h("Floating risk", "1.5%", "{amt:1.5} on {size}"),
          RB.h("Daily profit cap", "$3,000", "Excess deducted"),
        ],
      },
      facts: {
        evaluation: {
          "Profit target": "6% / 6%",
          "Daily loss": "4%",
          "Max loss": "8% static",
          "Min trading days": "None",
          Consistency: "None",
          Payout: "After passing",
          News: "Allowed",
          Weekend: "Holding allowed; no new weekend trades",
          Leverage: "FX 1:100",
          Reset: "00:00 UTC",
        },
        funded: {
          "Payout split": "80% (100% add-on)",
          "Daily loss": "4%",
          "Max loss": "8% static",
          "Min payout": "$100",
          "Payout days": "5 at 0.5%",
          Consistency: "None",
          Schedule: "14 days (weekly add-on)",
          News: "4-min window; profits removed",
          Weekend: "Holding allowed; no new weekend trades",
          Leverage: "FX 1:100",
          Reset: "00:00 UTC",
        },
      },
      rules: {
        shared: [
          fsMarginUsage(RB.sources.fsSquad),
          fsMaxLoss(8, RB.sources.fsLite),
          fsDailyLoss(4, RB.sources.fsLite),
          fsInactivity(RB.sources.fsChallenge),
          fsEAs(RB.sources.fsChallenge),
          fsVPN(RB.sources.fsChallenge),
          fsCopy(RB.sources.fsChallenge),
          fsReset(RB.sources.fsDrawdown),
          fsLeverage(100, RB.sources.fsLite),
        ],
        evaluation: [
          fsProfitTarget(6, 6, RB.sources.fsLite),
          fsEvalNoMinDays(RB.sources.fsLite),
          fsEvalNews(RB.sources.fsChallenge),
          fsWeekendChallenge(RB.sources.fsChallenge),
          fsPayoutNone(RB.sources.fsLite),
        ],
        funded: [
          fsFloatingRisk(1.5, 40, RB.sources.fsLite, false),
          fsNews(RB.sources.fsChallenge),
          fsWeekendChallenge(RB.sources.fsChallenge),
          fsDuration(RB.sources.fsChallenge),
          fsLots(RB.sources.fsChallenge),
          fsDailyCap(RB.sources.fsLite),
          fsMinDays(5, RB.sources.fsLite),
          fsPayout("80% (100% add-on)", "14 days (weekly add-on)", "$100", RB.sources.fsLite),
        ],
      },
    },

    {
      id: "2-step-flex",
      name: "2 Step Flex",
      tagline: "Two-step challenge with a 12% static floor and 3 payout days.",
      sizes: "$5K–$200K",
      badges: [],
      phases: ["evaluation", "funded"],
      watchOut: [
        "The 4% daily limit is smaller than the 12% total floor, so the daily rule will usually be the one that ends the account.",
        "The 1.5% floating-risk rule is independent of both drawdown limits. Keep total open risk under it.",
        "The daily profit limit is $3,000. Excess profit is deducted, not treated as a breach.",
      ],
      headline: {
        evaluation: [
          RB.h("Profit target", "8% / 6%", "Phase 1 / Phase 2"),
          RB.h("Daily loss", "4%", "{amt:4} on {size}"),
          RB.h("Max loss", "12% static", "Floor {floor:12}"),
          RB.h("Min trading days", "None", "No time limit"),
          RB.h("Consistency", "None", "Evaluation"),
          RB.h("Payout", "After passing", "80% · 100% add-on"),
        ],
        funded: [
          RB.h("Payout split", "80%", "100% add-on"),
          RB.h("Daily loss", "4%", "{amt:4} on {size}"),
          RB.h("Max loss", "12% static", "Floor {floor:12}"),
          RB.h("Min payout", "$100 · 3 days", "3 profitable days at 0.5%"),
          RB.h("Floating risk", "1.5%", "{amt:1.5} on {size}"),
          RB.h("Daily profit cap", "$3,000", "Excess deducted"),
        ],
      },
      facts: {
        evaluation: {
          "Profit target": "8% / 6%",
          "Daily loss": "4%",
          "Max loss": "12% static",
          "Min trading days": "None",
          Consistency: "None",
          Payout: "After passing",
          News: "Allowed",
          Weekend: "Holding allowed; no new weekend trades",
          Leverage: "FX 1:100",
          Reset: "00:00 UTC",
        },
        funded: {
          "Payout split": "80% (100% add-on)",
          "Daily loss": "4%",
          "Max loss": "12% static",
          "Min payout": "$100",
          "Payout days": "3 at 0.5%",
          Consistency: "None",
          Schedule: "14 days",
          News: "4-min window; profits removed",
          Weekend: "Holding allowed; no new weekend trades",
          Leverage: "FX 1:100",
          Reset: "00:00 UTC",
        },
      },
      rules: {
        shared: [
          fsMarginUsage(RB.sources.fsSquad),
          fsMaxLoss(12, RB.sources.fsFlex),
          fsDailyLoss(4, RB.sources.fsFlex),
          fsInactivity(RB.sources.fsChallenge),
          fsEAs(RB.sources.fsChallenge),
          fsVPN(RB.sources.fsChallenge),
          fsCopy(RB.sources.fsChallenge),
          fsReset(RB.sources.fsDrawdown),
          fsLeverage(100, RB.sources.fsFlex),
        ],
        evaluation: [
          fsProfitTarget(8, 6, RB.sources.fsFlex),
          fsEvalNoMinDays(RB.sources.fsFlex),
          fsEvalNews(RB.sources.fsChallenge),
          fsWeekendChallenge(RB.sources.fsChallenge),
          fsPayoutNone(RB.sources.fsFlex),
        ],
        funded: [
          fsFloatingRisk(1.5, 40, RB.sources.fsFlex, false),
          fsNews(RB.sources.fsChallenge),
          fsWeekendChallenge(RB.sources.fsChallenge),
          fsDuration(RB.sources.fsChallenge),
          fsLots(RB.sources.fsChallenge),
          fsDailyCap(RB.sources.fsFlex),
          fsMinDays(3, RB.sources.fsFlex),
          fsPayout("80% (100% add-on)", "14 days", "$100", RB.sources.fsFlex),
        ],
      },
    },

    {
      id: "one-step-flex",
      name: "One-Step Flex",
      tagline: "One phase, 9% target, 10% static floor.",
      sizes: "$5K–$200K",
      badges: [],
      phases: ["evaluation", "funded"],
      watchOut: [
        "Forex leverage is 1:50 on this model, not 1:100. Margin requirements are double the other challenge models.",
        "The 3% daily limit and 10% static floor are separate. The 1.5% floating-risk rule is a third, independent limit.",
        "Funded accounts cannot open new trades inside the 4-minute news window.",
      ],
      headline: {
        evaluation: [
          RB.h("Profit target", "9%", "One phase"),
          RB.h("Daily loss", "3%", "{amt:3} on {size}"),
          RB.h("Max loss", "10% static", "Floor {floor:10}"),
          RB.h("Min trading days", "None", "No time limit"),
          RB.h("Consistency", "None", "Evaluation"),
          RB.h("Payout", "After passing", "80% · 100% add-on"),
        ],
        funded: [
          RB.h("Payout split", "80%", "100% add-on"),
          RB.h("Daily loss", "3%", "{amt:3} on {size}"),
          RB.h("Max loss", "10% static", "Floor {floor:10}"),
          RB.h("Min payout", "$100 · 3 days", "3 profitable days at 0.5%"),
          RB.h("Floating risk", "1.5%", "{amt:1.5} on {size}"),
          RB.h("Daily profit cap", "$3,000", "Excess deducted"),
        ],
      },
      facts: {
        evaluation: {
          "Profit target": "9%",
          "Daily loss": "3%",
          "Max loss": "10% static",
          "Min trading days": "None",
          Consistency: "None",
          Payout: "After passing",
          News: "Allowed",
          Weekend: "Holding allowed; no new weekend trades",
          Leverage: "FX 1:50",
          Reset: "00:00 UTC",
        },
        funded: {
          "Payout split": "80% (100% add-on)",
          "Daily loss": "3%",
          "Max loss": "10% static",
          "Min payout": "$100",
          "Payout days": "3 at 0.5%",
          Consistency: "None",
          Schedule: "14 days",
          News: "4-min window; profits removed",
          Weekend: "Holding allowed; no new weekend trades",
          Leverage: "FX 1:50",
          Reset: "00:00 UTC",
        },
      },
      rules: {
        shared: [
          fsMarginUsage(RB.sources.fsSquad),
          fsMaxLoss(10, RB.sources.fsOneFlex),
          fsDailyLoss(3, RB.sources.fsOneFlex),
          fsInactivity(RB.sources.fsChallenge),
          fsEAs(RB.sources.fsChallenge),
          fsVPN(RB.sources.fsChallenge),
          fsCopy(RB.sources.fsChallenge),
          fsReset(RB.sources.fsDrawdown),
          fsLeverage(50, RB.sources.fsOneFlex),
        ],
        evaluation: [
          fsProfitTarget(9, null, RB.sources.fsOneFlex),
          fsEvalNoMinDays(RB.sources.fsOneFlex),
          fsEvalNews(RB.sources.fsChallenge),
          fsWeekendChallenge(RB.sources.fsChallenge),
          fsPayoutNone(RB.sources.fsOneFlex),
        ],
        funded: [
          fsFloatingRisk(1.5, 40, RB.sources.fsOneFlex, false),
          fsNews(RB.sources.fsChallenge),
          fsWeekendChallenge(RB.sources.fsChallenge),
          fsDuration(RB.sources.fsChallenge),
          fsLots(RB.sources.fsChallenge),
          fsDailyCap(RB.sources.fsOneFlex),
          fsMinDays(3, RB.sources.fsOneFlex),
          fsPayout("80% (100% add-on)", "14 days", "$100", RB.sources.fsOneFlex),
        ],
      },
    },

    {
      id: "instant-flex",
      name: "Instant Flex",
      tagline: "Instant funded account with on-demand payouts.",
      sizes: "$5K–$200K",
      badges: [],
      phases: ["funded"],
      watchOut: [
        "News trading is a hard breach by default. Positions must be closed at least 5 minutes before the event; the add-on is the only exception.",
        "The 1% floating-risk rule closes positions and cuts the split to 30% on the first trigger. A second trigger closes the account.",
        "Weekend holding is not included. Without the add-on, all positions must be closed before the weekend.",
      ],
      headline: {
        funded: [
          RB.h("Payout split", "70%", "90% add-on"),
          RB.h("Daily loss", "3%", "{amt:3} on {size}"),
          RB.h("Max loss", "5% static", "Floor {floor:5}"),
          RB.h("Min trading days", "4 at 0.5%", "Before a reward"),
          RB.h("Floating risk", "1% combined", "{amt:1} on {size}"),
          RB.h("Payout", "On-demand · 4% max", "$100 minimum"),
        ],
      },
      facts: {
        funded: {
          "Payout split": "70% (90% add-on)",
          "Daily loss": "3% (higher of balance/equity)",
          "Max loss": "5% static",
          "Min trading days": "4 at 0.5%",
          "Floating risk": "1% combined floating",
          Payout: "On-demand; 4% max per request",
          News: "Hard breach; 5-min window",
          Weekend: "Add-on required",
          Leverage: "FX 1:50",
          Reset: "00:00 UTC",
        },
      },
      rules: {
        shared: [
          fsMarginUsage(RB.sources.fsSquad),
          RB.rule({
            id: "max-loss",
            group: "killer",
            severity: "Hard breach",
            title: "Maximum loss (static)",
            value: "5% of starting balance",
            body: "The absolute floor is 95% of your starting capital. Equity or balance must never drop below it.",
            calc: "Starting balance × 95%.",
            example: "On {size}, the floor is {floor:5}; {amt:5} of room.",
            source: RB.sources.fsInstantFlex,
          }),
          RB.rule({
            id: "daily-loss",
            group: "killer",
            severity: "Hard breach",
            title: "Daily loss limit",
            value: "3% of the higher of balance or equity",
            body: "At 12:00 AM UTC, FundedSquad checks the higher of account balance or equity. Equity cannot fall more than 3% below that reference during the day.",
            calc: "Baseline = max(balance, equity) at 00:00 UTC. Floor = baseline × 97%.",
            example: "On {size}, the daily limit is {amt:3}.",
            source: RB.sources.fsInstantFlex,
          }),
          fsFloatingRisk(1, 30, RB.sources.fsInstantFlex, true),
          fsInactivity(RB.sources.fsInstant),
          fsEAs(RB.sources.fsInstant),
          fsVPN(RB.sources.fsInstant),
          fsCopy(RB.sources.fsInstant),
          fsReset(RB.sources.fsInstantFlex),
          fsLeverage(50, RB.sources.fsInstantFlex),
        ],
        funded: [
          fsMinDays(4, RB.sources.fsInstantFlex),
          fsWeekendInstant(RB.sources.fsInstant),
          fsDuration(RB.sources.fsInstant),
          fsInstantLots(RB.sources.fsInstant),
          fsDailyCap(RB.sources.fsInstantFlex),
          RB.rule({
            id: "news-hard",
            group: "killer",
            severity: "Hard breach",
            title: "News trading (default)",
            value: "5 min before / during",
            body: "News trading is not allowed by default. No new trades or open positions from 5 minutes before the event, and no positions may be open during it. Positions must be closed at least 5 minutes before the event. Trading resumes 5 minutes after. Any violation in the funded stage is a hard breach.",
            calc: "Close all affected positions by event − 5 min. Do not reopen until event + 5 min.",
            example: "News at 14:00: be flat from 13:55 through 14:00; no new trades until 14:05.",
            note: "The News Trading Add-On must be purchased at checkout and allows trading before, during and after the event.",
            source: RB.sources.fsInstantFlex,
          }),
          RB.rule({
            id: "payout",
            group: "blocker",
            severity: "Condition",
            title: "Payout terms",
            value: "70% · on-demand · 4% max",
            body: "70% profit split, or 90% with the add-on. Payouts are on demand, capped at 4% per request. The minimum payout is $100.",
            calc: "Trader share = eligible profit × split; each request is capped at 4% of the account balance.",
            example: "On {size}, a 4% request cap is {amt:4} per payout.",
            note: "No refunds on Instant Flex.",
            source: RB.sources.fsInstantFlex,
          }),
        ],
      },
    },
  ],
});
