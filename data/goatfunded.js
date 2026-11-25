/* GOAT Funded — 2 Step GOAT and 1 Step GOAT */

const goatMaxLoss = (pct, source) =>
  RB.rule({
    id: "max-loss",
    group: "killer",
    severity: "Hard breach",
    title: "Maximum loss (static)",
    value: `${pct}% of initial balance`,
    body: `The absolute floor is ${pct}% below your starting capital. It never trails. Equity or balance must stay above it at all times, including floating losses.`,
    calc: `Floor = initial balance × (1 − ${pct}%).`,
    example: `On {size}: {amt:${pct}} of room; the floor is {floor:${pct}}.`,
    note: "Touching the floor closes the account immediately.",
    source,
  });

const goatDaily = (pct, source, optionPct) =>
  RB.rule({
    id: "daily-loss",
    group: "killer",
    severity: "Hard breach",
    title: "Daily drawdown",
    value: `${pct}%${optionPct ? ` (${optionPct}% option)` : ""} of the higher of balance or equity`,
    body: `At 5:00 PM New York time, GOAT records the higher of your account balance or equity. The next day's floor is ${pct}% below that baseline.${
      optionPct ? ` A ${optionPct}% option can be chosen at checkout and cannot be changed later.` : ""
    } Floating losses count, and the floor resets at the next 5:00 PM New York close.`,
    calc: `Baseline = max(balance, equity) at 5:00 PM New York. Floor = baseline × (1 − ${pct}%).`,
    example: `On {size}, if the higher value at reset is {size}, the floor is {floor:${pct}}.`,
    note: "The reset follows New York daylight saving time, so the UTC clock moves.",
    source,
  });

const goatGuard = (source) =>
  RB.rule({
    id: "goat-guard",
    group: "killer",
    severity: "Soft, then hard",
    title: "Goat Guard floating loss",
    value: "2% of initial balance",
    body: "Goat Guard monitors the combined floating loss of all open positions. The threshold is 2% of the initial account size, not the current balance or equity. The first trigger sends a warning and cuts the profit split to 50%; a second trigger permanently closes the account.",
    calc: `Combined floating P&L ≤ −(initial balance × 2%). The threshold is fixed for the life of the account.`,
    example: `On {size}, Goat Guard triggers at {amt:2} of combined floating loss.`,
    note: "A new snapshot is created whenever a position is closed or opened. The same unchanged group fluctuating below the threshold does not trigger twice.",
    source,
  });

const goatMargin = (source) =>
  RB.rule({
    id: "margin",
    group: "blocker",
    severity: "Rule violation",
    title: "80% margin rule",
    value: "Margin used ÷ equity ≤ 80%",
    body: "Total margin used by all open trades cannot exceed 80% of account equity. Equity includes floating P&L, so a losing trade can push you over the limit without opening anything new. Going over does not close the trade; flagged profits are reviewed at payout and can be removed.",
    calc: `Margin usage = margin used by all open trades ÷ equity × 100. Margin for one trade = lots × contract size × price ÷ leverage. Gold: 1 lot = 100 oz.`,
    example: `At $4,000 gold and 1:10 funded, 1 lot uses $40,000 margin; the 80% cap allows {goldLots:10:80:4000} lots on {size}.`,
    note: "On an evaluation, flagged profits can invalidate the pass. On a funded account, the risk team can remove flagged profit or move the account back to evaluation.",
    source,
  });

const goatGold = (evalLev, fundedLev, source) =>
  RB.rule({
    id: "gold",
    group: "ref",
    severity: "Reference",
    title: "XAUUSD sizing guardrail",
    value: "80% hard cap · 30% personal",
    body: `GOAT has no fixed gold lot cap, but the 80% margin rule is enforced. This guardrail uses a 30% personal margin ceiling and a 1% risk budget. Gold is $4,000 in the example.`,
    calc: `Margin lots = size × margin % × leverage ÷ (100 × gold price). Risk lots = size × 1% ÷ (100 × stop distance).`,
    example: `On {size} at $4,000 gold, funded 1:${fundedLev}: 80% margin allows {goldLots:${fundedLev}:80:4000} lots; 30% allows {goldLots:${fundedLev}:30:4000} lots; a 1% risk budget with a $10 stop allows {goldRiskLots:1:10} lots. Use the smallest.`,
    note: `Evaluation leverage is 1:${evalLev}: the 80% cap allows {goldLots:${evalLev}:80:4000} lots and the 30% ceiling allows {goldLots:${evalLev}:30:4000} lots. Recalculate at the live gold price.`,
    source,
  });

const goatNews = (source) =>
  RB.rule({
    id: "news",
    group: "blocker",
    severity: "Profit cap",
    title: "News profit cap",
    value: "3% / 1% per release",
    body: "From 24 November 2026 the cap applies to each high-impact release, not to each trade. Every trade opened or closed from 5 minutes before to 5 minutes after a red-folder event counts toward that release. Accounts purchased on or after 10 November 2026 are capped at 3% of the initial balance per release; earlier accounts stay at 1%.",
    calc: `Add the profit of every trade linked to the release. Cap = initial balance × 3% (or 1% for older accounts). Only profit above the cap is removed.`,
    example: `On {size}, the new cap is {amt:3} per release; the old cap is {amt:1}. A release totalling {amt:4.5} keeps {amt:3} and removes {amt:1.5} on a new account.`,
    note: "This is not a breach. Losses are not capped and remain yours.",
    source,
  });

const goatProfitCap = (source) =>
  RB.rule({
    id: "profit-cap",
    group: "blocker",
    severity: "Profit cap",
    title: "Daily profit cap",
    value: "$3,000 per funded day",
    body: "Funded accounts have a $3,000 daily profit limit. Profit above the cap is deducted but does not breach the account.",
    calc: "Eligible daily profit = min(closed daily profit, $3,000).",
    example: "A $5,000 funded day counts as $3,000; the extra $2,000 is removed.",
    note: "The cap is fixed at $3,000, so it is 3% of a $100K account and 1.5% of a $200K account.",
    source,
  });

const goatMinDays = (evalDays, fundedDays, source) =>
  RB.rule({
    id: "min-days",
    group: "pass",
    severity: "Condition",
    title: "Minimum profitable days",
    value: `${evalDays} eval / ${fundedDays} funded`,
    body: `A profitable day requires at least one closed position and a daily profit of 0.5% or more of the initial balance, net of fees and commissions. The evaluation needs ${evalDays} such days. The funded stage needs ${fundedDays} per payout for accounts purchased from 25 July 2026 (${fundedDays - 1} before that date).`,
    calc: `Qualifying day: closed daily P&L ≥ initial balance × 0.5%. Days do not need to be consecutive.`,
    example: `On {size}, each qualifying day needs at least {amt:0.5} of closed profit.`,
    note: "The funded count resets after every payout.",
    source,
  });

const goatPayout = (source) =>
  RB.rule({
    id: "payout",
    group: "blocker",
    severity: "Condition",
    title: "Payout cycle and split",
    value: "80% · every 14 days",
    body: "The standard split is 80% and payouts are bi-weekly. For the first two payouts, the withdrawal is capped at 6% of the initial balance or $10,000, whichever is lower. The cap is removed after the second successful payout.",
    calc: `Payout = eligible profit × 80%, capped at min(initial × 6%, $10,000) for payouts 1 and 2.`,
    example: `On {size}, 6% is {amt:6}; the first-two-payout cap is the lower of that and $10,000 — $6,000 at $100K and $10,000 at $200K.`,
    note: "The 100% split add-on and the on-demand first reward are optional checkout terms. Check the current terms before choosing a payout route.",
    source,
  });

const goatHold = (source) =>
  RB.rule({
    id: "scalp",
    group: "blocker",
    severity: "Profit cap",
    title: "Minimum holding time",
    value: "1 minute funded",
    body: "On funded accounts, profit from a trade held for less than the minimum time is removed at payout. Accounts purchased from 6 October 2026 onward use 1 minute; earlier accounts use 2 minutes. Losses from those trades still count. This is not a breach.",
    calc: "Holding time = close time − open time. Trades below 60 seconds (or 120 seconds for older accounts) have their profit excluded.",
    example: "A 45-second trade that makes $800 on a new funded account contributes $0 to the payout.",
    note: "The rule applies to funded accounts only. Evaluation trades are not affected.",
    source,
  });

const goatLeverage = (value, body, example, source) =>
  RB.rule({
    id: "leverage",
    group: "ref",
    severity: "Reference",
    title: "Leverage",
    value,
    body,
    calc: "Margin = notional ÷ leverage. Gold: 1 lot = 100 oz.",
    example,
    note: "Funded leverage is half the evaluation leverage on FX, indices and commodities.",
    source,
  });

const goatProhibited = (source) =>
  RB.rule({
    id: "prohibited",
    group: "killer",
    severity: "Hard breach",
    title: "Prohibited execution",
    value: "No martingale · hedging · external copy",
    body: "All-or-nothing trading, martingale, hedging (inside one account or across accounts), external copy trading, third-party EAs and latency or pricing exploitation are prohibited. Only EAs you developed yourself are allowed, and GOAT can ask for the source code.",
    calc: "Trades must be independent, risk-managed and executed by you or your own code.",
    example: "Opening a buy and a sell on the same asset in two accounts is hedging, even with different lot sizes.",
    note: "Violations can close the account and forfeit profits and pending payouts.",
    source,
  });

const goatExecution = (source) =>
  RB.rule({
    id: "execution",
    group: "ref",
    severity: "Reference",
    title: "Execution safety checklist",
    value: "Reset · margin · gold · news · hold",
    body: "Before each session: confirm the 5:00 PM New York reset, keep total margin under 80% (30% personal), size XAUUSD from the smaller of the margin and 1% risk budgets, treat the news cap per release, hold funded trades at least 1 minute, and avoid martingale or hedging.",
    calc: "A checklist, not a formula. Use the tighter of the firm cap and your personal cap.",
    example: "At {size} funded, 1.00 lot of gold at $4,000 uses $40,000 margin at 1:10 — 40% of a $100K account and 20% of a $200K account.",
    note: "The firm's dashboard and terms override this personal checklist.",
    source,
  });

const goatInactive = (source) =>
  RB.rule({
    id: "inactivity",
    group: "killer",
    severity: "Hard breach",
    title: "30-day inactivity",
    value: "30 consecutive days",
    body: "If no trade is placed for 30 consecutive days, the account is breached. This applies to evaluation and funded accounts. A trade every 29 days keeps a buffer.",
    calc: "Place at least one trade every 30 days.",
    example: "A month with no executed order can close the account even if positions are still open.",
    source,
  });

const goatWeekend = (source) =>
  RB.rule({
    id: "weekend",
    group: "ref",
    severity: "Reference",
    title: "Weekend holding",
    value: "Allowed",
    body: "Positions can be held over the weekend on both evaluation and funded accounts.",
    calc: "No weekend add-on is required.",
    example: "A Friday position can be held through Sunday.",
    source,
  });

const goatPayoutNone = (source) =>
  RB.rule({
    id: "payout-none",
    group: "ref",
    severity: "Reference",
    title: "No payout during evaluation",
    value: "Funded account only",
    body: "Evaluation accounts do not pay rewards. The funded account starts after both steps are passed and reviewed.",
    calc: "Pass the evaluation first.",
    example: "Complete Step 1 and Step 2 before requesting a reward.",
    source,
  });

const goatProfitTarget = (t1, t2, source) =>
  RB.rule({
    id: "profit-target",
    group: "pass",
    severity: "Condition",
    title: t2 ? "Profit targets" : "Profit target",
    value: t2 ? `${t1}% then ${t2}%` : `${t1}%`,
    body: t2
      ? `Step 1 target is ${t1}% and Step 2 target is ${t2}% of the initial balance. There is no time limit.`
      : `The single evaluation target is ${t1}% of the initial balance. There is no time limit.`,
    calc: t2
      ? `Step 1 = size × ${t1}%; Step 2 = size × ${t2}%.`
      : `Target = size × ${t1}%.`,
    example: t2
      ? `On {size}: {amt:${t1}} in Step 1, then {amt:${t2}} in Step 2.`
      : `On {size}: {amt:${t1}} to pass.`,
    source,
  });

/* ------------------------------------------------------------------ */
/* 2 Step GOAT                                                         */
/* ------------------------------------------------------------------ */
RB.firms.push({
  id: "goat",
  name: "GOAT Funded",
  short: "GF",
  color: "#f59e0b",
  tagline: "Two-step and one-step evaluations with an 80% margin cap and Goat Guard.",
  models: [
    {
      id: "2-step",
      name: "2 Step GOAT",
      tagline: "Two phases, 8% then 6%, with a 4% daily floor.",
      sizes: "$5K–$200K",
      badges: [],
      phases: ["evaluation", "funded"],
      watchOut: [
        "The daily floor is set from the higher of balance or equity at 5:00 PM New York, so a green floating trade can raise the baseline.",
        "Funded accounts have a $3,000 daily profit cap and Goat Guard: a 2% combined floating loss cuts the split to 50%, and a second trigger closes the account.",
        "The 80% margin rule is enforced at payout. A position that fits your risk can still be flagged if margin usage goes over 80%.",
      ],
      headline: {
        evaluation: [
          RB.h("Profit target", "8% / 6%", "Step 1 / Step 2"),
          RB.h("Daily loss", "4%", "Floor {floor:4}"),
          RB.h("Max loss", "10% static", "Floor {floor:10}"),
          RB.h("Min days", "3 profitable", "≥0.5% each"),
          RB.h("Margin cap", "80%", "Margin ÷ equity"),
          RB.h("Payout", "After passing", "80% standard"),
        ],
        funded: [
          RB.h("Payout split", "80%", "Every 14 days"),
          RB.h("Daily loss", "4%", "Floor {floor:4}"),
          RB.h("Max loss", "10% static", "Floor {floor:10}"),
          RB.h("Goat Guard", "2%", "{amt:2} floating loss"),
          RB.h("Profit cap", "$3,000/day", "Excess deducted"),
          RB.h("Payout days", "4", "≥0.5% each"),
        ],
      },
      facts: {
        evaluation: {
          "Profit target": "8% / 6%",
          "Daily drawdown": "4% of higher balance/equity",
          "Max loss": "10% static",
          "Min profitable days": "3",
          Consistency: "None",
          "Margin cap": "80% of equity",
          Payout: "After passing",
          News: "Per-release cap applies",
          Weekend: "Allowed",
          Leverage: "FX 1:100 · gold 1:20",
          Reset: "5:00 PM New York",
        },
        funded: {
          "Payout split": "80%",
          "Daily drawdown": "4% of higher balance/equity",
          "Max loss": "10% static",
          "Goat Guard": "2% combined floating loss",
          "Daily profit cap": "$3,000",
          "Payout cycle": "Every 14 days",
          "Payout days": "4 profitable days ≥0.5%",
          "First-two cap": "min(6%, $10,000)",
          News: "3% or 1% per release",
          Weekend: "Allowed",
          Leverage: "FX 1:50 · gold 1:10",
          Reset: "5:00 PM New York",
        },
      },
      rules: {
        shared: [
          goatMaxLoss(10, RB.sources.goat2),
          goatDaily(4, RB.sources.goat2),
          goatMargin(RB.sources.goatMargin),
          goatGold(20, 10, RB.sources.goatMargin),
          goatNews(RB.sources.goatNews),
          goatMinDays(3, 4, RB.sources.goat2),
          goatLeverage(
            "FX 1:100 eval / 1:50 funded",
            "Evaluation: FX 1:100, indices and commodities 1:20, crypto 1:2. Funded: FX 1:50, indices and commodities 1:10, crypto 1:2.",
            "1 lot of XAUUSD at $4,000 uses $20,000 margin at 1:20 and $40,000 at 1:10.",
            RB.sources.goatLeverage
          ),
          goatProhibited(RB.sources.goatProhibited),
          goatExecution(RB.sources.goatMargin),
          goatInactive(RB.sources.goatInactive),
          goatWeekend(RB.sources.goatWeekend),
        ],
        evaluation: [
          goatProfitTarget(8, 6, RB.sources.goat2),
          goatPayoutNone(RB.sources.goat2),
        ],
        funded: [
          goatGuard(RB.sources.goatGuard),
          goatProfitCap(RB.sources.goat2),
          goatPayout(RB.sources.goat2),
          goatHold(RB.sources.goatHold),
        ],
      },
    },

    {
      id: "1-step",
      name: "1 Step GOAT",
      tagline: "One phase, 10% target, with a 6% static floor.",
      sizes: "$5K–$200K",
      badges: [],
      phases: ["evaluation", "funded"],
      watchOut: [
        "The daily floor is 3% (2% optional at checkout) and the maximum floor is 6% static. The 1-Step has much less room than the 2-Step.",
        "Funded accounts have the same $3,000 daily profit cap and Goat Guard as the 2-Step.",
        "The 80% margin rule and the 1-minute funded holding time both affect whether profit is paid.",
      ],
      headline: {
        evaluation: [
          RB.h("Profit target", "10%", "{amt:10} on {size}"),
          RB.h("Daily loss", "3%", "2% option"),
          RB.h("Max loss", "6% static", "Floor {floor:6}"),
          RB.h("Min days", "3 profitable", "≥0.5% each"),
          RB.h("Margin cap", "80%", "Margin ÷ equity"),
          RB.h("Payout", "After passing", "80% standard"),
        ],
        funded: [
          RB.h("Payout split", "80%", "Every 14 days"),
          RB.h("Daily loss", "3%", "2% option"),
          RB.h("Max loss", "6% static", "Floor {floor:6}"),
          RB.h("Goat Guard", "2%", "{amt:2} floating loss"),
          RB.h("Profit cap", "$3,000/day", "Excess deducted"),
          RB.h("Payout days", "4", "≥0.5% each"),
        ],
      },
      facts: {
        evaluation: {
          "Profit target": "10%",
          "Daily drawdown": "3% (2% option)",
          "Max loss": "6% static",
          "Min profitable days": "3",
          Consistency: "None",
          "Margin cap": "80% of equity",
          Payout: "After passing",
          News: "Per-release cap applies",
          Weekend: "Allowed",
          Leverage: "FX 1:100 · gold 1:20",
          Reset: "5:00 PM New York",
        },
        funded: {
          "Payout split": "80%",
          "Daily drawdown": "3% (2% option)",
          "Max loss": "6% static",
          "Goat Guard": "2% combined floating loss",
          "Daily profit cap": "$3,000",
          "Payout cycle": "Every 14 days",
          "Payout days": "4 profitable days ≥0.5%",
          "First-two cap": "min(6%, $10,000)",
          News: "3% or 1% per release",
          Weekend: "Allowed",
          Leverage: "FX 1:50 · gold 1:10",
          Reset: "5:00 PM New York",
        },
      },
      rules: {
        shared: [
          goatMaxLoss(6, RB.sources.goat1),
          goatDaily(3, RB.sources.goat1, 2),
          goatMargin(RB.sources.goatMargin),
          goatGold(20, 10, RB.sources.goatMargin),
          goatNews(RB.sources.goatNews),
          goatMinDays(3, 4, RB.sources.goat1),
          goatLeverage(
            "FX 1:100 eval / 1:50 funded",
            "Evaluation: FX 1:100, indices and commodities 1:20, crypto 1:2. Funded: FX 1:50, indices and commodities 1:10, crypto 1:2.",
            "1 lot of XAUUSD at $4,000 uses $20,000 margin at 1:20 and $40,000 at 1:10.",
            RB.sources.goatLeverage
          ),
          goatProhibited(RB.sources.goatProhibited),
          goatExecution(RB.sources.goatMargin),
          goatInactive(RB.sources.goatInactive),
          goatWeekend(RB.sources.goatWeekend),
        ],
        evaluation: [
          goatProfitTarget(10, null, RB.sources.goat1),
          goatPayoutNone(RB.sources.goat1),
        ],
        funded: [
          goatGuard(RB.sources.goatGuard),
          goatProfitCap(RB.sources.goat1),
          goatPayout(RB.sources.goat1),
          goatHold(RB.sources.goatHold),
        ],
      },
    },
  ],
});
