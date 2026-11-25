/* AquaFunded — 2 Step Pro and Instant Funding Standard */

const aqMaxTrail = (pct, source) =>
  RB.rule({
    id: "max-loss",
    group: "killer",
    severity: "Hard breach",
    title: "Maximum loss (trailing)",
    value: `${pct}% trailing`,
    body: `The floor trails your highest balance or equity. The dollar trail is fixed at ${pct}% of the initial balance: it moves up with every new high and never moves down.`,
    calc: `Floor = highest balance/equity reached − (initial balance × ${pct}%).`,
    example: `On {size}, a high of {amt:105} gives a floor of {amt:95}; a later high of {amt:108} moves it to {amt:98}.`,
    note: "The trail is measured from the initial balance, not from the current high. Floating losses count.",
    source,
  });

const aqDaily = (pct, source) =>
  RB.rule({
    id: "daily-loss",
    group: "killer",
    severity: "Hard breach",
    title: "Daily loss limit",
    value: `${pct}% of higher balance/equity at 00:00 UTC`,
    body: `At 00:00 UTC, AquaFunded takes the higher of your account balance or equity. The next day's floor is ${pct}% below that baseline. Floating losses count.`,
    calc: `Baseline = max(balance, equity) at 00:00 UTC. Floor = baseline × (1 − ${pct}%).`,
    example: `On {size}, if the higher value at reset is {size}, the floor is {floor:${pct}}.`,
    note: "The reset is 00:00 UTC every day.",
    source,
  });

const aqDailyTrail = (pct, source) =>
  RB.rule({
    id: "daily-loss",
    group: "killer",
    severity: "Hard breach",
    title: "Daily loss limit (trailing)",
    value: `${pct}% below the day's equity high`,
    body: `The floor follows the highest equity reached during the current trading day, so it moves up while you are in profit. It resets at 00:00 UTC.`,
    calc: `Floor = highest equity of the current day × (1 − ${pct}%).`,
    example: `On {size}, if equity reaches {amt:102.5}, the floor becomes {amt:99.425} for the rest of the day.`,
    note: "A green floating trade raises the floor immediately.",
    source,
  });

const aqReset = (source) =>
  RB.rule({
    id: "reset",
    group: "ref",
    severity: "Reference",
    title: "Daily reset time",
    value: "00:00 UTC",
    body: "The trading day resets at 00:00 UTC. The daily floor is recalculated from the higher of balance or equity at that moment.",
    calc: "The daily floor resets; the maximum-loss floor does not.",
    example: "00:00 UTC is 00:00 London in winter and 01:00 London in summer.",
    note: "Use the UTC clock, not your local time.",
    source,
  });

const aqConsistency = (pct, source) =>
  RB.rule({
    id: "consistency",
    group: "blocker",
    severity: "Condition",
    title: `${pct}% consistency rule`,
    value: `Best day <${pct}% of profit`,
    body: `The highest-profit trading day must account for less than ${pct}% of total profit in the payout period. If it is larger, the account is not breached; you keep trading until the share falls below the threshold.`,
    calc: `Required total profit = best day ÷ ${pct}%.`,
    example: `On {size}, a {amt:2} best day needs more than {amt:${200 / pct}} total profit at ${pct}%.`,
    note: "The calculation restarts after every approved payout.",
    source,
  });

const aqMinDays = (days, source) =>
  RB.rule({
    id: "min-days",
    group: "pass",
    severity: "Condition",
    title: "Minimum qualifying days",
    value: `${days} funded days`,
    body: `You need ${days} qualifying trading days before a reward. A qualifying day closes with at least 0.5% profit based on the initial balance. Days do not need to be consecutive.`,
    calc: `Qualifying day: closed daily P&L ≥ initial balance × 0.5%.`,
    example: `On {size}, each qualifying day needs at least {amt:0.5} of closed profit.`,
    note: "This is a funded-stage requirement.",
    source,
  });

const aqNoMinDays = (source) =>
  RB.rule({
    id: "min-days",
    group: "pass",
    severity: "Condition",
    title: "Minimum trading days",
    value: "None in evaluation",
    body: "The 2-Step Pro evaluation has no minimum trading day requirement. You can pass as soon as both profit targets are met and all rules are respected.",
    calc: "No day count in Phase 1 or Phase 2.",
    example: "A fast pass is allowed if the targets and loss limits are respected.",
    note: "The funded stage does require 3 qualifying days.",
    source,
  });

const aqProfitTarget = (t1, t2, source) =>
  RB.rule({
    id: "profit-target",
    group: "pass",
    severity: "Condition",
    title: "Profit targets",
    value: `${t1}% then ${t2}%`,
    body: `Phase 1 target is ${t1}% and Phase 2 target is ${t2}% of the initial balance.`,
    calc: `Phase 1 = size × ${t1}%; Phase 2 = size × ${t2}%.`,
    example: `On {size}: {amt:${t1}} in Phase 1, then {amt:${t2}} in Phase 2.`,
    source,
  });

const aqPayout = (source) =>
  RB.rule({
    id: "payout",
    group: "blocker",
    severity: "Condition",
    title: "Payout cycle and split",
    value: "90% · every 14 days",
    body: "The standard split is 90% and rewards are available every 14 days. All consistency, day-count and risk requirements must be met first.",
    calc: "Reward = eligible profit × 90%.",
    example: "On {size}, {amt:5} of eligible profit pays {amt:4.5}.",
    note: "Check the dashboard for any payout cap attached to your purchase date or account size.",
    source,
  });

const aqFloat = (source) =>
  RB.rule({
    id: "float",
    group: "blocker",
    severity: "Soft, then hard",
    title: "1% floating-loss three-strike policy",
    value: "1% of starting balance",
    body: "If the combined floating loss across all open positions reaches 1% of the starting balance, the strike policy applies. First strike: split drops to 50%. Second: split drops to 25%. Third: the funded account is permanently breached.",
    calc: `Floating loss = sum of unrealized P&L on all open positions. Trigger = −(starting balance × 1%).`,
    example: `On {size}, the trigger is {amt:1} of combined floating loss.`,
    note: "Closing at a smaller loss does not undo a trigger that already happened. This is separate from the daily and maximum loss limits.",
    source,
  });

const aqMargin = (source) =>
  RB.rule({
    id: "margin",
    group: "blocker",
    severity: "Rule violation",
    title: "80% margin rule",
    value: "≤80% of available margin",
    body: "A single trade or trading position cannot use more than 80% of the available margin on the account. The rule applies whether the trade wins or loses. Profits from violating trades are deducted; repeated or severe violations can lead to a reset or breach.",
    calc: `Margin used ÷ available margin × 100 ≤ 80%. Margin for one trade = lots × contract size × price ÷ leverage. Gold: 1 lot = 100 oz.`,
    example: `At $4,000 gold and 1:10 funded, 1 lot uses $40,000 margin; the 80% cap allows {goldLots:10:80:4000} lots on {size}.`,
    note: "This is per trade or position, not the whole account. It is stricter than a simple lot cap.",
    source,
  });

const aqLots = (source) =>
  RB.rule({
    id: "lots",
    group: "ref",
    severity: "Reference",
    title: "Lot caps",
    value: "No maximum lot size",
    body: "AquaFunded does not publish a maximum lot size. The 80% margin rule and the loss limits are the effective caps.",
    calc: "Size from risk and margin, not from a lot cap.",
    example: "A large lot that uses less than 80% margin is allowed; the same lot can still breach the loss limits.",
    source,
  });

const aqGold = (evalLev, fundedLev, source) =>
  RB.rule({
    id: "gold",
    group: "ref",
    severity: "Reference",
    title: "XAUUSD sizing guardrail",
    value: "80% hard cap · 30% personal",
    body: `AquaFunded has no fixed gold lot cap, but the 80% margin rule applies. This guardrail uses a 30% personal margin ceiling and a 1% risk budget. Gold is $4,000 in the example.`,
    calc: `Margin lots = size × margin % × leverage ÷ (100 × gold price). Risk lots = size × 1% ÷ (100 × stop distance).`,
    example: `On {size} at $4,000 gold, funded 1:${fundedLev}: 80% margin allows {goldLots:${fundedLev}:80:4000} lots; 30% allows {goldLots:${fundedLev}:30:4000} lots; a 1% risk budget with a $10 stop allows {goldRiskLots:1:10} lots. Use the smallest.`,
    note:
      evalLev === fundedLev
        ? `Leverage is 1:${fundedLev} in every phase. Recalculate at the live gold price.`
        : `Evaluation leverage is 1:${evalLev}: the 80% cap allows {goldLots:${evalLev}:80:4000} lots and the 30% ceiling allows {goldLots:${evalLev}:30:4000} lots. Recalculate at the live gold price.`,
    source,
  });

const aqNews = (source) =>
  RB.rule({
    id: "news",
    group: "blocker",
    severity: "Profit cap",
    title: "News profit cap",
    value: "0.5% of starting balance",
    body: "On a funded account, trading high-impact news is allowed, but profit from trades opened or closed from 5 minutes before to 5 minutes after a red-folder event is capped at 0.5% of the starting balance per payout cycle. The cap applies to accounts opened after 27 April 2026.",
    calc: `News profit cap = starting balance × 0.5%. Only profit above the cap is removed.`,
    example: `On {size}, the cap is {amt:0.5}. A {amt:1} news profit keeps {amt:0.5} and removes {amt:0.5}.`,
    note: "This is not a breach. Accounts opened before 27 April 2026 remain on the previous rule, which prohibited news trading on funded accounts.",
    source,
  });

const aqScalp = (source) =>
  RB.rule({
    id: "scalp",
    group: "blocker",
    severity: "Profit cap",
    title: "Sub-2-minute trades",
    value: "May be treated as tick scalping",
    body: "Trades held for under 2 minutes may be classified as tick scalping. On funded accounts, profits generated by this style may be removed under the trading policy.",
    calc: "Holding time = close time − open time. Sub-2-minute profits can be excluded.",
    example: "A 30-second winning trade can have its profit removed even if the account stays open.",
    note: "A few quick trades are not automatically a breach, but a strategy built on them is at risk.",
    source,
  });

const aqLeverage = (value, body, example, note, source) =>
  RB.rule({
    id: "leverage",
    group: "ref",
    severity: "Reference",
    title: "Leverage",
    value,
    body,
    calc: "Margin = notional ÷ leverage. Gold: 1 lot = 100 oz.",
    example,
    note,
    source,
  });

const aqProhibited = (source) =>
  RB.rule({
    id: "prohibited",
    group: "killer",
    severity: "Hard breach",
    title: "Prohibited execution",
    value: "No tick scalping · HFT · arbitrage",
    body: "Tick scalping, high-frequency trading, latency or reverse arbitrage, hedge arbitrage, emulators, delayed data, platform freezing and demo-server exploits are prohibited. Account sharing and passing services are also prohibited.",
    calc: "Trades must be your own and must not exploit the simulated environment.",
    example: "A bot that profits from a delayed feed or a frozen demo price is a prohibited strategy.",
    note: "Violations can close the account and forfeit profits.",
    source,
  });

const aqExecution = (source) =>
  RB.rule({
    id: "execution",
    group: "ref",
    severity: "Reference",
    title: "Execution safety checklist",
    value: "UTC reset · margin · gold · news · hold",
    body: "Before each session: confirm the 00:00 UTC reset, keep each position under 80% margin (30% personal), size XAUUSD from the smaller of the margin and 1% risk budgets, treat the news cap per payout cycle, and avoid sub-2-minute execution.",
    calc: "A checklist, not a formula. Use the tighter of the firm cap and your personal cap.",
    example: "At {size} funded, 1.00 lot of gold at $4,000 uses $40,000 margin at 1:10 — 40% of a $100K account and 20% of a $200K account.",
    note: "The firm's dashboard and terms override this personal checklist.",
    source,
  });

const aqPayoutNone = (source) =>
  RB.rule({
    id: "payout-none",
    group: "ref",
    severity: "Reference",
    title: "No payout during evaluation",
    value: "Funded account only",
    body: "Evaluation accounts do not pay rewards. The funded stage starts after both phases are passed.",
    calc: "Pass the evaluation first.",
    example: "Complete Phase 1 and Phase 2 before requesting a reward.",
    source,
  });

/* ------------------------------------------------------------------ */
/* 2 Step Pro                                                          */
/* ------------------------------------------------------------------ */
RB.firms.push({
  id: "aquafunded",
  name: "AquaFunded",
  short: "AQ",
  color: "#22d3ee",
  tagline: "Two-step and instant funding with trailing drawdown and a 90% split.",
  models: [
    {
      id: "2-step-pro",
      name: "2 Step Pro",
      tagline: "Two phases, 10% then 5%, with a 10% trailing floor.",
      sizes: "$5K–$200K",
      badges: [],
      phases: ["evaluation", "funded"],
      watchOut: [
        "The maximum loss is trailing: the floor moves up with every new balance or equity high and never moves down.",
        "The funded consistency rule is 50% for purchases on or after 31 August 2026. A single large day can block the payout.",
        "News profit is capped at 0.5% of the starting balance per payout cycle, and trades under 2 minutes may be treated as tick scalping.",
      ],
      headline: {
        evaluation: [
          RB.h("Profit target", "10% / 5%", "Phase 1 / Phase 2"),
          RB.h("Daily loss", "5%", "Floor {floor:5}"),
          RB.h("Max loss", "10% trailing", "Fixed $10K trail"),
          RB.h("Min days", "None", "Evaluation"),
          RB.h("Payout", "After passing", "90% funded split"),
          RB.h("Consistency", "50% funded", "New purchases"),
        ],
        funded: [
          RB.h("Payout split", "90%", "Every 14 days"),
          RB.h("Daily loss", "5%", "Floor {floor:5}"),
          RB.h("Max loss", "10% trailing", "Floor follows highs"),
          RB.h("Min days", "3", "≥0.5% each"),
          RB.h("Consistency", "50%", "Best day <50%"),
          RB.h("News cap", "0.5%", "{amt:0.5} per cycle"),
        ],
      },
      facts: {
        evaluation: {
          "Profit target": "10% / 5%",
          "Daily loss": "5% of higher balance/equity at 00:00 UTC",
          "Max loss": "10% trailing",
          "Min trading days": "None",
          Consistency: "None",
          Payout: "After passing",
          News: "0.5% cap applies",
          Weekend: "Allowed",
          Leverage: "FX 1:100 · gold 1:20",
          Reset: "00:00 UTC",
        },
        funded: {
          "Payout split": "90%",
          "Daily loss": "5% of higher balance/equity at 00:00 UTC",
          "Max loss": "10% trailing",
          "Min qualifying days": "3 days ≥0.5%",
          Consistency: "50% (25% before 31 Aug 2026)",
          "Payout cycle": "Every 14 days",
          News: "0.5% cap per payout cycle",
          Weekend: "Allowed",
          Leverage: "FX 1:50 · gold 1:10",
          Reset: "00:00 UTC",
        },
      },
      rules: {
        shared: [
          aqMaxTrail(10, RB.sources.aq2),
          aqDaily(5, RB.sources.aq2),
          aqReset(RB.sources.aq2),
          aqConsistency(50, RB.sources.aqConsistency),
          aqMargin(RB.sources.aqOther),
          aqLots(RB.sources.aqLots),
          aqGold(20, 10, RB.sources.aqOther),
          aqScalp(RB.sources.aqOther),
          aqLeverage(
            "FX 1:100 eval / 1:50 funded",
            "Evaluation: FX 1:100, indices and commodities 1:20, crypto 1:2. Funded: FX 1:50, indices and commodities 1:10, crypto 1:2.",
            "1 lot of XAUUSD at $4,000 uses $20,000 margin at 1:20 and $40,000 at 1:10.",
            "Funded leverage is lower than evaluation leverage on the 2-Step Pro.",
            RB.sources.aq2
          ),
          aqProhibited(RB.sources.aqOther),
          aqExecution(RB.sources.aqOther),
        ],
        evaluation: [
          aqProfitTarget(10, 5, RB.sources.aq2),
          aqNoMinDays(RB.sources.aq2),
          aqPayoutNone(RB.sources.aq2),
        ],
        funded: [
          aqMinDays(3, RB.sources.aqMinDays),
          aqNews(RB.sources.aqNews),
          aqPayout(RB.sources.aq2),
        ],
      },
    },

    {
      id: "instant-standard",
      name: "Instant Standard",
      tagline: "Funded from day one with a 90% split and trailing limits.",
      sizes: "$50K–$100K",
      badges: [],
      phases: ["funded"],
      watchOut: [
        "The $200K selector is outside this model's listed range. Instant Standard is offered at $50K and $100K.",
        "Both the daily and maximum floors trail: the daily follows the day's equity high, and the 5% maximum follows the all-time high.",
        "A 1% combined floating loss starts the three-strike split reduction, and the 15% consistency rule can block a payout.",
      ],
      headline: {
        funded: [
          RB.h("Payout split", "90%", "Every 14 days"),
          RB.h("Daily loss", "3% trailing", "Day's equity high"),
          RB.h("Max loss", "5% trailing", "All-time high"),
          RB.h("Consistency", "15%", "Best day <15%"),
          RB.h("Payout days", "5", "≥0.5% each"),
          RB.h("Floating cap", "1%", "Three strikes"),
        ],
      },
      facts: {
        funded: {
          "Payout split": "90%",
          "Daily loss": "3% trailing from day's high",
          "Max loss": "5% trailing from all-time high",
          Consistency: "15%",
          "Min qualifying days": "5 days ≥0.5%",
          "Payout cycle": "Every 14 days",
          "Floating loss": "1% three-strike policy",
          News: "0.5% cap per payout cycle",
          Weekend: "Allowed",
          Leverage: "FX 1:50 · gold 1:10",
          Reset: "00:00 UTC",
        },
      },
      rules: {
        shared: [
          aqMaxTrail(5, RB.sources.aqInstant),
          aqDailyTrail(3, RB.sources.aqInstant),
          aqReset(RB.sources.aqInstant),
          aqConsistency(15, RB.sources.aqConsistency),
          aqFloat(RB.sources.aqFloat),
          aqMargin(RB.sources.aqOther),
          aqLots(RB.sources.aqLots),
          aqGold(10, 10, RB.sources.aqOther),
          aqScalp(RB.sources.aqOther),
          aqLeverage(
            "FX 1:50 · gold 1:10",
            "Instant Standard uses FX 1:50, indices and commodities 1:10, and crypto 1:2.",
            "1 lot of XAUUSD at $4,000 uses $40,000 margin at 1:10.",
            "Leverage is the same in every phase on Instant Standard.",
            RB.sources.aqInstant
          ),
          aqProhibited(RB.sources.aqOther),
          aqExecution(RB.sources.aqOther),
        ],
        funded: [
          aqMinDays(5, RB.sources.aqMinDays),
          aqNews(RB.sources.aqNews),
          aqPayout(RB.sources.aqInstant),
        ],
      },
    },
  ],
});
