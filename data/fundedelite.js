/* Funded Elite — 2 Step, 1 Step and Instant */

const feMaxStatic = (pct, retryPct, source) =>
  RB.rule({
    id: "max-loss",
    group: "killer",
    severity: "Hard breach",
    title: "Maximum loss (static)",
    value: `${pct}% of starting balance`,
    body: `The floor is fixed at ${pct}% below your starting balance and never trails. Equity touching it closes the account.${retryPct ? ` After a free retry the floor tightens to ${retryPct}%.` : ""}`,
    calc: `Floor = starting balance × (1 − ${pct}%).${retryPct ? ` Retry floor = starting balance × (1 − ${retryPct}%).` : ""}`,
    example: `On {size}: {amt:${pct}} of room; the floor is {floor:${pct}}.`,
    note: "Floating losses count. The floor does not move up as you profit.",
    source,
  });

const feMaxTrailing = (pct, source) =>
  RB.rule({
    id: "max-loss",
    group: "killer",
    severity: "Hard breach",
    title: "Maximum loss (trailing)",
    value: `${pct}% below the equity high`,
    body: `The floor is the highest equity ever reached minus ${pct}%. It moves up with every new equity high and never moves down. There is no ceiling, so you can breach while still above your starting balance.`,
    calc: `Floor = highest equity ever − (highest equity ever × ${pct}%).`,
    example: `On {size}, if equity peaks at {amt:110}, the floor becomes {amt:103.4} and stays there.`,
    note: "A trailing floor is much tighter than a static floor once you are in profit.",
    source,
  });

const feDailyStatic = (pct, retryPct, source) =>
  RB.rule({
    id: "daily-loss",
    group: "killer",
    severity: "Hard breach",
    title: "Daily loss limit",
    value: `${pct}% of the higher of prior close balance or equity`,
    body: `At the 5:00 PM New York reset, Funded Elite takes the higher of your closing balance or closing equity from the previous day. The next day's floor is ${pct}% below that value.${retryPct ? ` On a free retry the limit drops to ${retryPct}%.` : ""}`,
    calc: `Baseline = max(previous close balance, previous close equity). Floor = baseline × (1 − ${pct}%).`,
    example: `On {size}, if the higher prior close is {size}, the floor is {floor:${pct}}.`,
    note: "Open trades count; the limit is checked on equity.",
    source,
  });

const feDailyTrailing = (pct, source) =>
  RB.rule({
    id: "daily-loss",
    group: "killer",
    severity: "Hard breach",
    title: "Daily loss limit (trailing)",
    value: `${pct}% below the day's equity high`,
    body: `The floor follows the highest equity reached during the current trading day, so it moves up while you are in profit. It resets at the next 5:00 PM New York close.`,
    calc: `Floor = highest equity of the current day × (1 − ${pct}%).`,
    example: `On {size}, if equity reaches {amt:102.5}, the floor becomes {amt:99.425} for the rest of the day.`,
    note: "A green floating trade raises the floor immediately.",
    source,
  });

const feReset = (source) =>
  RB.rule({
    id: "reset",
    group: "ref",
    severity: "Reference",
    title: "Daily reset time",
    value: "5:00 PM New York",
    body: "The trading day resets at 5:00 PM New York time, matching the New York close. It follows US daylight saving time, so the UTC clock moves.",
    calc: "The daily floor is recalculated at 5:00 PM New York. The max-loss floor does not reset.",
    example: "In winter, 5:00 PM New York is 22:00 UTC; in summer, it is 21:00 UTC.",
    note: "Use the dashboard clock, not your local time.",
    source,
  });

const feRisk = (pct, source) =>
  RB.rule({
    id: "risk",
    group: "blocker",
    severity: "Hard breach",
    title: "Risk per instrument (funded)",
    value: `${pct}% per instrument per day`,
    body: `On a funded account you cannot risk more than 50% of the daily loss limit on the same instrument in one trading day. That is ${pct}% of the account. All trades on that instrument, in both directions, count together.`,
    calc: `Risk per instrument = furthest stop-loss risk, or the worst price reached while open, whichever is higher. Cap = daily loss limit × 50%.`,
    example: `On {size}, the cap is {amt:${pct}}. Two EURUSD trades risking {amt:${pct / 2}} each use the whole budget.`,
    note: "Risk is counted on the day the trade closes, even if it closes in profit. Breaking the rule can close the funded account; you can reset it.",
    source,
  });

const feScalp = (source) =>
  RB.rule({
    id: "scalp",
    group: "blocker",
    severity: "Soft, then hard",
    title: "Minimum holding time and scalp limit",
    value: "3 min · $500/$800 cap",
    body: "Every position must stay open at least 3 minutes, or 30 seconds with the Scalping add-on. Winning trades closed under the minimum time add to your scalp profit, which must stay below the account's scalp limit.",
    calc: `Scalp limit = {amtRange:0.5:0.4:150000} on {size}. Scalp profit = sum of winning trades closed under the minimum holding time.`,
    example: `On {size}, the scalp limit is {amtRange:0.5:0.4:150000}; a 45-second winning trade adds its full profit to that total.`,
    note: "Evaluation: an isolated short trade under the limit is a soft breach; scalp profit above the limit, or short trades throughout the challenge, is a hard breach. Funded: short trades are violations and can reduce the profit split; repeated soft breaches can reset the account.",
    source,
  });

const feNews = (source) =>
  RB.rule({
    id: "news",
    group: "ref",
    severity: "Reference",
    title: "News trading",
    value: "Allowed on every program",
    body: "News trading is allowed, including high-impact releases. High-frequency trading, hedging between accounts and setups designed to profit risk-free from volatility remain prohibited.",
    calc: "No news-window profit cap. Spread and slippage risk still apply.",
    example: "You can hold a position through CPI, but a latency or hedge-arbitrage setup is still prohibited.",
    source,
  });

const feWeekend = (source) =>
  RB.rule({
    id: "weekend",
    group: "blocker",
    severity: "Rule violation",
    title: "Weekend trading and holding",
    value: "Hold allowed · trade needs add-on",
    body: "Holding an open position over the weekend is allowed, and you can move stops or take-profit. Opening a new position, or closing one (including a stop or target being hit), on Saturday or Sunday requires the weekend add-on.",
    calc: "Without the add-on: hold and modify only. With the add-on: open and close allowed.",
    example: "A stop-loss triggering on Sunday without the add-on is a violation.",
    note: "This applies to evaluation and funded accounts.",
    source,
  });

const feLeverage = (source) =>
  RB.rule({
    id: "leverage",
    group: "ref",
    severity: "Reference",
    title: "Leverage",
    value: "FX 1:30 default · 1:50/1:100 optional",
    body: "Forex pairs are 1:30 by default and can be raised to 1:50 or 1:100 at checkout. Other asset classes have their own fixed leverage; check the symbol specification for gold and indices.",
    calc: "Margin = notional ÷ leverage.",
    example: "1 standard lot of EURUSD (100,000 notional) at 1:30 uses about $3,333 margin.",
    note: "The leverage choice is made at purchase and cannot be changed later.",
    source,
  });

const feMarginUsage = (source) =>
  RB.rule({
    id: "margin-usage",
    group: "blocker",
    severity: "Reference",
    title: "Margin usage",
    value: "Avg margin ÷ equity; lots = equity × target% ÷ (100 × price ÷ leverage)",
    body: "Margin usage is the margin used by all open positions ÷ account equity × 100. For XAUUSD, one lot is 100 oz and uses 100 × gold price ÷ leverage. Average margin usage for sizing is the sum of open XAUUSD lots ÷ equity × 100. Keep the average below your personal risk margin, typically 30% or the platform limit.",
    calc: `Average margin usage = Σ(lots × 100 × gold price ÷ leverage) ÷ equity × 100. Max lots for a target average usage = equity × target usage% ÷ (100 × gold price ÷ leverage).`,
    example: `At $4,000 gold and 1:10 funded, 1 lot uses $40,000 margin; if equity is {size}, usage is {amt:40} on a $100K account and {amt:20} on a $200K account. To target 30% average margin, max lots = equity × 30% ÷ $4,000 = {amt:7.5} on a $100K account, so use 7.5 lots.`,
    note: "Calculated example: 1 lot × 100 oz × $4,000 ÷ 1:10 = $40,000 margin; $40,000 ÷ $100,000 equity = 40% usage.",
    source,
  });

const feGold = (riskPct, source) =>
  RB.rule({
    id: "gold",
    group: "ref",
    severity: "Reference",
    title: "XAUUSD sizing guardrail",
    value: `Risk-based · ${riskPct}% cap`,
    body: `Funded Elite caps risk per instrument at ${riskPct}% of the account on a funded account. Gold has no separate published lot cap; size from the stop and then check the margin in the XAUUSD contract specification.`,
    calc: `Lots = size × ${riskPct}% ÷ (100 × stop distance in dollars). Gold: 1 lot = 100 oz.`,
    example: `On {size}, a ${riskPct}% risk budget with a $10 stop allows {goldRiskLots:${riskPct}:10} lots.`,
    note: "The same formula works at any leverage. If the margin at your platform's metal leverage is above 30% of the account, reduce the lot size.",
    source,
  });

const feExecution = (riskPct, source) =>
  RB.rule({
    id: "execution",
    group: "ref",
    severity: "Reference",
    title: "Execution safety checklist",
    value: "Reset · risk · gold · hold · weekend",
    body: `Before each session: confirm the 5:00 PM New York reset, keep each instrument under ${riskPct}% funded risk, size XAUUSD from the stop, hold at least 3 minutes unless the Scalping add-on is active, and remember that weekend opening or closing needs the add-on.`,
    calc: "A checklist, not a formula. Use the tighter of the firm cap and your personal cap.",
    example: `On {size}, the ${riskPct}% budget is {amt:${riskPct}}; a $10 stop allows {goldRiskLots:${riskPct}:10} lots.`,
    note: "The firm's dashboard and terms override this personal checklist.",
    source,
  });

const feProhibited = (source) =>
  RB.rule({
    id: "prohibited",
    group: "killer",
    severity: "Hard breach",
    title: "Prohibited execution",
    value: "No HFT · hedging · account sharing",
    body: "High-frequency trading, micro-scalping, latency arbitrage, hedging across accounts or firms, account sharing, passing services, IP sharing and gambling-style trading are prohibited. Copy trading between your own accounts must be disclosed first.",
    calc: "Trades must be your own, risk-managed and not coordinated with another trader.",
    example: "Running the same signal into a Funded Elite account and an external account can be treated as group trading.",
    note: "Violations can close the account and forfeit profits.",
    source,
  });

const fePayoutNone = (source) =>
  RB.rule({
    id: "payout-none",
    group: "ref",
    severity: "Reference",
    title: "No payout during evaluation",
    value: "Funded account only",
    body: "Evaluation accounts do not pay rewards. The funded stage starts after the challenge is passed.",
    calc: "Pass the evaluation first.",
    example: "Complete Phase 1 and Phase 2 before requesting a reward.",
    source,
  });

const feProfitTarget = (t1, t2, source) =>
  RB.rule({
    id: "profit-target",
    group: "pass",
    severity: "Condition",
    title: t2 ? "Profit targets" : "Profit target",
    value: t2 ? `${t1}% then ${t2}%` : `${t1}%`,
    body: t2
      ? `Phase 1 target is ${t1}% and Phase 2 target is ${t2}% of the account. The target can be changed at checkout within the published options.`
      : `The single evaluation target is ${t1}% of the account. The target can be changed at checkout within the published options.`,
    calc: t2
      ? `Phase 1 = size × ${t1}%; Phase 2 = size × ${t2}%.`
      : `Target = size × ${t1}%.`,
    example: t2
      ? `On {size}: {amt:${t1}} in Phase 1, then {amt:${t2}} in Phase 2.`
      : `On {size}: {amt:${t1}} to pass.`,
    source,
  });

const feMinDays = (thresholdPct, highPct, source) => {
  const higherAt200 = highPct > thresholdPct;
  const exampleToken = higherAt200
    ? `{amtRange:${thresholdPct}:${highPct}:150000}`
    : `{amt:${thresholdPct}}`;
  return RB.rule({
    id: "min-days",
    group: "pass",
    severity: "Condition",
    title: "Minimum profitable days",
    value: `3 days ≥${thresholdPct}%`,
    body: `Three days must close with a profit of at least ${thresholdPct}% of the account.${higherAt200 ? ` On a $200K 2-Step account the threshold rises to ${highPct}%.` : ""} Days do not need to be consecutive, and losing days do not reset the count.`,
    calc: `Qualifying day: closed daily P&L ≥ account × ${thresholdPct}%${higherAt200 ? ` (${highPct}% at $200K)` : ""}.`,
    example: `On {size}, each qualifying day needs at least ${exampleToken}.`,
    note: "The same count applies per payout on the funded stage.",
    source,
  });
};

const fePayout = (cycle, split, days, consistency, source) =>
  RB.rule({
    id: "payout",
    group: "blocker",
    severity: "Condition",
    title: "Payout cycle and split",
    value: `${split} · 21 then ${cycle}`,
    body: `The default reward share is ${split}. The first payout is after 21 days, then every ${cycle}. You need ${days} since the last payout.${consistency ? ` ${consistency}` : ""}`,
    calc: `Reward = eligible profit × ${split.replace("%", "")}%.`,
    example: `On {size}, {amt:5} of eligible profit pays {amt:${parseFloat(split) / 20}} at ${split}.`,
    note: "A free retry cuts the reward share to 50% on all payouts.",
    source,
  });

const feFreeRetry = (model, source) =>
  RB.rule({
    id: "free-retry",
    group: "blocker",
    severity: "Condition",
    title: "Free retry changes the rules",
    value: model === "2-step" ? "Daily 3% · split 50%" : "Max 6% · split 50%",
    body:
      model === "2-step"
        ? "If Phase 1 or Phase 2 is breached, a new Phase 1 account is created automatically. On the retry the daily loss drops from 5% to 3%, the Phase 1 minimum day rises to 1%, and the reward share becomes 50%."
        : "If the challenge is breached, a new Phase 1 account is created automatically. On the retry the maximum loss drops from 8% to 6% and the reward share becomes 50% for all payouts.",
    calc:
      model === "2-step"
        ? "Retry daily floor = prior close × (1 − 3%); retry split = 50%."
        : "Retry max floor = starting balance × (1 − 6%); retry split = 50%.",
    example:
      model === "2-step"
        ? `On {size}, the retry daily floor is {floor:3} instead of {floor:5}.`
        : `On {size}, the retry max floor is {floor:6} instead of {floor:8}.`,
    note: "The retry is automatic, not optional. A reset keeps the retry terms.",
    source,
  });

/* ------------------------------------------------------------------ */
/* 2 Step                                                              */
/* ------------------------------------------------------------------ */
RB.firms.push({
  id: "funded-elite",
  name: "Funded Elite",
  short: "FE",
  color: "#a78bfa",
  tagline: "Two-step, one-step and instant programs with a free retry.",
  models: [
    {
      id: "2-step",
      name: "2 Step + Free Retry",
      tagline: "Two phases, 8% then 5%, with a 5% daily floor.",
      sizes: "$7K–$300K",
      badges: [],
      phases: ["evaluation", "funded"],
      watchOut: [
        "The daily floor is set from the higher of the prior close balance or equity, so a green open trade can raise tomorrow's baseline.",
        "A free retry is automatic and cuts the split to 50%; it also drops the daily limit to 3% and raises the Phase 1 minimum day to 1%.",
        "Funded risk is capped at 2.5% per instrument per day, and funded trades under 3 minutes are violations.",
      ],
      headline: {
        evaluation: [
          RB.h("Profit target", "8% / 5%", "Phase 1 / Phase 2"),
          RB.h("Daily loss", "5%", "Floor {floor:5}"),
          RB.h("Max loss", "8% static", "Floor {floor:8}"),
          RB.h("Min days", "3", "≥0.5% · 1% at $200K"),
          RB.h("Payout", "After passing", "80% standard"),
          RB.h("Retry", "Automatic", "Split 50%"),
        ],
        funded: [
          RB.h("Payout split", "80%", "First 21 days, then 14"),
          RB.h("Daily loss", "5%", "Floor {floor:5}"),
          RB.h("Max loss", "8% static", "Floor {floor:8}"),
          RB.h("Risk / instrument", "2.5%", "{amt:2.5} per day"),
          RB.h("Scalp limit", "$500 / $800", "3-min minimum hold"),
          RB.h("Payout days", "3", "≥0.5% · 1% at $200K"),
        ],
      },
      facts: {
        evaluation: {
          "Profit target": "8% / 5%",
          "Daily loss": "5% of higher prior close",
          "Max loss": "8% static",
          "Min profitable days": "3 days ≥0.5% (1% at $200K)",
          Consistency: "None below $300K",
          Payout: "After passing",
          News: "Allowed",
          Weekend: "Hold allowed; trade needs add-on",
          Leverage: "FX 1:30 default",
          Reset: "5:00 PM New York",
          "Free retry": "Daily 3%, split 50%",
        },
        funded: {
          "Payout split": "80% (50% after retry)",
          "Daily loss": "5% of higher prior close",
          "Max loss": "8% static",
          "Risk per instrument": "2.5% per day",
          "Payout cycle": "21 days, then 14 days",
          "Payout days": "3 days ≥0.5% (1% at $200K)",
          Consistency: "None below $300K",
          News: "Allowed",
          Weekend: "Hold allowed; trade needs add-on",
          Leverage: "FX 1:30 default",
          Reset: "5:00 PM New York",
          "Min hold": "3 minutes (30s with add-on)",
        },
      },
      rules: {
        shared: [
          feMaxStatic(8, null, RB.sources.fe2),
          feDailyStatic(5, 3, RB.sources.feDaily),
          feReset(RB.sources.feReset),
          feRisk(2.5, RB.sources.feRisk),
          feScalp(RB.sources.feScalp),
          feNews(RB.sources.feNews),
          feWeekend(RB.sources.feWeekend),
          feLeverage(RB.sources.feLeverage),
          feMarginUsage(RB.sources.feLeverage),
          feGold(2.5, RB.sources.feRisk),
          feExecution(2.5, RB.sources.feRisk),
          feProhibited(RB.sources.feConduct),
          feMinDays(0.5, 1, RB.sources.feMinDays),
        ],
        evaluation: [
          feProfitTarget(8, 5, RB.sources.fe2),
          fePayoutNone(RB.sources.fe2),
          feFreeRetry("2-step", RB.sources.fe2),
        ],
        funded: [fePayout("14 days", "80%", "3 profitable days ≥0.5% (1% at $200K)", "", RB.sources.fePayout)],
      },
    },

    {
      id: "1-step",
      name: "1 Step + Free Retry",
      tagline: "One phase, 12% target, with a 3% daily floor.",
      sizes: "$7K–$300K",
      badges: [],
      phases: ["evaluation", "funded"],
      watchOut: [
        "The 1-Step has a 3% daily floor and an 8% static maximum floor. A free retry tightens the maximum to 6%.",
        "Funded risk is capped at 1.5% per instrument per day, tighter than the 2-Step.",
        "Funded trades under 3 minutes are violations, and the scalp profit cap is $500 at $100K / $800 at $200K.",
      ],
      headline: {
        evaluation: [
          RB.h("Profit target", "12%", "{amt:12} on {size}"),
          RB.h("Daily loss", "3%", "Floor {floor:3}"),
          RB.h("Max loss", "8% static", "Retry 6%"),
          RB.h("Min days", "3", "≥1% each"),
          RB.h("Payout", "After passing", "80% standard"),
          RB.h("Retry", "Automatic", "Split 50%"),
        ],
        funded: [
          RB.h("Payout split", "80%", "First 21 days, then 14"),
          RB.h("Daily loss", "3%", "Floor {floor:3}"),
          RB.h("Max loss", "8% static", "Retry 6%"),
          RB.h("Risk / instrument", "1.5%", "{amt:1.5} per day"),
          RB.h("Scalp limit", "$500 / $800", "3-min minimum hold"),
          RB.h("Payout days", "3", "≥1% each"),
        ],
      },
      facts: {
        evaluation: {
          "Profit target": "12%",
          "Daily loss": "3% of higher prior close",
          "Max loss": "8% static",
          "Min profitable days": "3 days ≥1%",
          Consistency: "None below $300K",
          Payout: "After passing",
          News: "Allowed",
          Weekend: "Hold allowed; trade needs add-on",
          Leverage: "FX 1:30 default",
          Reset: "5:00 PM New York",
          "Free retry": "Max 6%, split 50%",
        },
        funded: {
          "Payout split": "80% (50% after retry)",
          "Daily loss": "3% of higher prior close",
          "Max loss": "8% static",
          "Risk per instrument": "1.5% per day",
          "Payout cycle": "21 days, then 14 days",
          "Payout days": "3 days ≥1%",
          Consistency: "None below $300K",
          News: "Allowed",
          Weekend: "Hold allowed; trade needs add-on",
          Leverage: "FX 1:30 default",
          Reset: "5:00 PM New York",
          "Min hold": "3 minutes (30s with add-on)",
        },
      },
      rules: {
        shared: [
          feMaxStatic(8, 6, RB.sources.fe1),
          feDailyStatic(3, null, RB.sources.feDaily),
          feReset(RB.sources.feReset),
          feRisk(1.5, RB.sources.feRisk),
          feScalp(RB.sources.feScalp),
          feNews(RB.sources.feNews),
          feWeekend(RB.sources.feWeekend),
          feLeverage(RB.sources.feLeverage),
          feMarginUsage(RB.sources.feLeverage),
          feGold(1.5, RB.sources.feRisk),
          feExecution(1.5, RB.sources.feRisk),
          feProhibited(RB.sources.feConduct),
          feMinDays(1, 1, RB.sources.feMinDays),
        ],
        evaluation: [
          feProfitTarget(12, null, RB.sources.fe1),
          fePayoutNone(RB.sources.fe1),
          feFreeRetry("1-step", RB.sources.fe1),
        ],
        funded: [fePayout("14 days", "80%", "3 profitable days ≥1%", "", RB.sources.fePayout)],
      },
    },

    {
      id: "instant",
      name: "Instant",
      tagline: "Funded from day one with trailing limits and a 25% consistency rule.",
      sizes: "$7K–$200K",
      badges: [],
      phases: ["funded"],
      watchOut: [
        "Both limits trail: the daily floor follows the day's equity high, and the 6% maximum follows the all-time equity high.",
        "A 25% consistency rule blocks a payout if one day is too large a share of total profit.",
        "A 1% combined floating loss on all open positions is not a breach by itself, but it starts the three-strike reduction of your split.",
      ],
      headline: {
        funded: [
          RB.h("Payout split", "70% → 80%", "Payout 2 onward"),
          RB.h("Daily loss", "3% trailing", "Day's equity high"),
          RB.h("Max loss", "6% trailing", "All-time equity high"),
          RB.h("Consistency", "25%", "Best day <25%"),
          RB.h("Payout days", "4", "≥0.5% each"),
          RB.h("Payout cycle", "21 days", "Then every 21 days"),
        ],
      },
      facts: {
        funded: {
          "Payout split": "70% then 80%",
          "Daily loss": "3% trailing from day's high",
          "Max loss": "6% trailing from all-time high",
          Consistency: "25%",
          "Payout days": "4 days ≥0.5%",
          "Payout cycle": "First 21 days, then 21 days",
          "Floating loss": "1% three-strike policy",
          "Risk per instrument": "1.5% per day",
          News: "Allowed",
          Weekend: "Hold allowed; trade needs add-on",
          Leverage: "FX 1:30–1:100 · metals fixed",
          Reset: "5:00 PM New York",
          "Min hold": "3 minutes (30s with add-on)",
        },
      },
      rules: {
        shared: [
          feMaxTrailing(6, RB.sources.feInstant),
          feDailyTrailing(3, RB.sources.feDaily),
          feReset(RB.sources.feReset),
          feRisk(1.5, RB.sources.feRisk),
          feScalp(RB.sources.feScalp),
          feNews(RB.sources.feNews),
          feWeekend(RB.sources.feWeekend),
          feLeverage(RB.sources.feLeverage),
          feMarginUsage(RB.sources.feLeverage),
          feGold(1.5, RB.sources.feRisk),
          feExecution(1.5, RB.sources.feRisk),
          feProhibited(RB.sources.feConduct),
          RB.rule({
            id: "consistency",
            group: "blocker",
            severity: "Condition",
            title: "25% consistency rule",
            value: "Best day <25% of profit",
            body: "The highest-profit trading day must account for less than 25% of total profit when you request a payout. If it is larger, the account is not breached; you keep trading until the share falls below 25%.",
            calc: "Required total profit = best day ÷ 25%. Example: a {amt:2} best day needs more than {amt:8} total profit.",
            example: "On {size}, a {amt:1} best day needs more than {amt:4} total profit before a payout.",
            note: "The calculation restarts after every approved payout.",
            source: RB.sources.feInstant,
          }),
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
            source: RB.sources.feInstant,
          }),
        ],
        funded: [
          RB.rule({
            id: "payout",
            group: "blocker",
            severity: "Condition",
            title: "Payout cycle and split",
            value: "70% → 80% · 21 days",
            body: "The first payout is after 21 days at 70%. From the second payout the split is 80%, and the cycle stays at 21 days by default. Four profitable days of at least 0.5% are required per payout.",
            calc: "Reward = eligible profit × 70% on payout 1, then × 80%.",
            example: "On {size}, {amt:5} of eligible profit pays {amt:3.5} on payout 1 and {amt:4} on payout 2.",
            note: "The 95% add-on changes the ladder to 70% → 80% → 95% from payout 3.",
            source: RB.sources.fePayout,
          }),
        ],
      },
    },
  ],
});
