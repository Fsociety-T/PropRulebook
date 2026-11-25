/* FundedNext — Stellar 2-Step and Stellar 1-Step */

const fnMaxLoss = (pct, source) =>
  RB.rule({
    id: "max-loss",
    group: "killer",
    severity: "Hard breach",
    title: "Maximum loss (static)",
    value: `${pct}% of initial balance`,
    body: `The floor is fixed at ${pct}% below your initial balance. It does not trail your profits. Profits increase the dollar distance to the floor, but the floor itself stays at the starting level. Equity or balance touching it is a breach, even if the account recovers.`,
    calc: `Floor = initial balance × (1 − ${pct}%). Floating and closed losses both count.`,
    example: `On {size}: {amt:${pct}} of room; the floor is {floor:${pct}}.`,
    note: "A breach is confirmed when the floor is touched, even briefly.",
    source,
  });

const fnDaily = (pct, source) =>
  RB.rule({
    id: "daily-loss",
    group: "killer",
    severity: "Hard breach",
    title: "Daily loss limit",
    value: `${pct}% of initial balance`,
    body: `The daily floor is set from the initial balance, not from the previous close. At 00:00 server time it resets to initial × (1 − ${pct}%). Profit made earlier in the day adds room above the floor, but the floor does not move up with profit.`,
    calc: `Floor = initial balance × (1 − ${pct}%). Room from current equity = current equity − floor.`,
    example: `On {size}, the floor is {floor:${pct}}. If you are up {amt:2} intraday, you can lose {amt:${pct + 2}} from the day's high before touching it.`,
    note: "Server time is GMT+3 during daylight saving and GMT+2 otherwise. Floating losses count.",
    source,
  });

const fnReset = (source) =>
  RB.rule({
    id: "reset",
    group: "ref",
    severity: "Reference",
    title: "Daily reset time",
    value: "00:00 server time",
    body: "The trading day resets at 00:00 server time. FundedNext uses GMT+3 during daylight saving and GMT+2 for the rest of the year.",
    calc: "The daily floor is recalculated at the reset. The maximum-loss floor does not reset.",
    example: "In winter, 00:00 server time is 22:00 UTC; in summer, it is 21:00 UTC.",
    note: "Use the server clock in MT5, cTrader or Match-Trader, not your local clock.",
    source,
  });

const fnLeverage = (value, body, example, source) =>
  RB.rule({
    id: "leverage",
    group: "ref",
    severity: "Reference",
    title: "Leverage",
    value,
    body,
    calc: "Margin = notional ÷ leverage. Gold uses 100 ounces per lot.",
    example,
    note: "Leverage is lower once funded. Recalculate gold and index margin after you pass.",
    source,
  });

const fnRisk = (source) =>
  RB.rule({
    id: "risk",
    group: "blocker",
    severity: "Rule violation",
    title: "3% funded risk limit",
    value: "3% max risk at any time",
    body: "On a FundedNext Account, total risk at any moment cannot exceed 3% of the initial balance. Risk is the maximum potential loss from stop-loss placement plus the worst realized and floating loss across all open trades.",
    calc: "Risk = max potential loss from stops, or the worst floating loss, ÷ initial balance. Keep the total at or below 3%.",
    example: "On {size}, the ceiling is {amt:3}. Two trades risking {amt:1.5} each already use the whole budget.",
    note: "First violation: formal warning and 100% of the profit from the violating trades is deducted. Second: the account is permanently reclassified to a 1% risk parameter.",
    source,
  });

const fnMarginUsage = (source) =>
  RB.rule({
    id: "margin-usage",
    group: "blocker",
    severity: "Rule violation",
    title: "Margin usage guardrail",
    value: "Target ≤30% (firm max varies)",
    body: "Margin usage is the margin used by open positions ÷ account balance × 100. For XAUUSD, one lot is 100 oz and uses 100 × gold price ÷ leverage. Average margin usage for sizing is the sum of open XAUUSD lots ÷ balance × 100. This guardrail is personal; keep total margin below the firm maximum.",
    calc: `Average margin usage = Σ(lots × 100 × gold price ÷ leverage) ÷ balance × 100.`,
    example: `At {size}, 1 lot of XAUUSD at $4,000 and 1:15 funded uses $26,667 margin; usage is about {amt:26.7} on a $100K account and {amt:13.3} on a $200K account.`,
    note: "FundedNext publishes no fixed lot cap. Use the smaller of the 3% risk budget and the margin ceiling; margin use should stay comfortably below any firm maximum.",
    source,
  });

const fnNews = (source) =>
  RB.rule({
    id: "news",
    group: "blocker",
    severity: "Profit cap",
    title: "News window",
    value: "Funded: 40% of profit counts",
    body: "News trading is allowed in both phases. On a FundedNext Account, trades opened or closed from 5 minutes before to 5 minutes after a listed high-impact event are subject to the News Reward Share Rule: only 40% of the profit from those trades counts toward your reward. Losses count in full.",
    calc: "Counted news profit = profit from affected trades × 40%. The adjustment is made after the cycle ends.",
    example: "On {size}, {amt:2} of news-window profit counts as {amt:0.8}; the other {amt:1.2} is removed from the reward calculation.",
    note: "The challenge phase has no general news restriction. The affected-symbol and event list is in the FundedNext dashboard.",
    source,
  });

const fnQuickStrike = (source) =>
  RB.rule({
    id: "quick-strike",
    group: "blocker",
    severity: "Condition",
    title: "Quick Strike below 30%",
    value: "<30% of profit from <30s trades",
    body: "A Quick Strike trade is any position closed within 30 seconds of opening. The share of total recorded profit that comes from these trades is measured per cycle and must stay below 30% at all times.",
    calc: "Quick Strike % = profit from trades closed in under 30 seconds ÷ total recorded profit × 100.",
    example: "On {size}, if total profit is {amt:5}, profit from sub-30-second trades must stay below {amt:1.5}.",
    note: "This applies in both phases. A strategy built on sub-30-second execution is not compatible with the rule.",
    source,
  });

const fnEa = (source) =>
  RB.rule({
    id: "ea",
    group: "killer",
    severity: "Hard breach",
    title: "Expert Advisors at $50K+",
    value: "Not permitted",
    body: "EA use is not permitted on account sizes of $50,000 and above. The EA Add-On and VPS & EA Add-On are disabled for these sizes. The $100K and $200K accounts covered here must be traded manually.",
    calc: "No autonomous or assistive EA execution on the account.",
    example: "Running an EA on a $100K Stellar account is a rule violation even if the EA only manages stops.",
    note: "Custom indicators are not the same as an executing EA, but confirm with support before relying on automation.",
    source,
  });

const fnLots = (source) =>
  RB.rule({
    id: "lots",
    group: "ref",
    severity: "Reference",
    title: "Lot caps",
    value: "No fixed maximum",
    body: "FundedNext does not set a hard lot cap on Challenge or FundedNext Accounts. The effective ceiling is margin plus the funded 3% risk limit. FundedNext recommends keeping margin usage around 20–30%.",
    calc: "Size from risk first, then check that the margin used leaves room for floating losses.",
    example: "A position that fits the margin can still breach the 3% risk limit if the stop is wide.",
    source,
  });

const fnGold = (evalLev, fundedLev, source) =>
  RB.rule({
    id: "gold",
    group: "ref",
    severity: "Reference",
    title: "XAUUSD sizing guardrail",
    value: "30% margin · 3% risk",
    body: `FundedNext sets no fixed gold lot cap. Two ceilings matter: the funded 3% risk limit and the margin you choose to use. This guardrail uses a 30% margin ceiling (FundedNext recommends 20–30%) and a $4,000 gold price.`,
    calc: `Margin lots = size × 30% × leverage ÷ (100 × gold price). Risk lots = size × 3% ÷ (100 × stop distance).`,
    example: `On {size} at $4,000 gold: 30% margin at 1:${fundedLev} funded allows {goldLots:${fundedLev}:30:4000} lots; a 3% risk budget with a $10 stop allows {goldRiskLots:3:10} lots. Use the smaller.`,
    note: `Evaluation leverage is 1:${evalLev}, so the same 30% ceiling allows {goldLots:${evalLev}:30:4000} lots. During evaluation there is no firm 3% risk cap; the 3% budget is a personal guardrail. Recalculate at the live gold price; the risk cap does not change with leverage.`,
    source,
  });

const fnExecution = (source) =>
  RB.rule({
    id: "execution",
    group: "ref",
    severity: "Reference",
    title: "Execution safety checklist",
    value: "Reset · margin · gold · news · hold",
    body: "Before each session: confirm the 00:00 server reset, keep margin under 30%, size XAUUSD from the smaller of the 3% risk budget and the margin ceiling, avoid fresh entries inside the 5-minute news window unless you accept the 40% haircut, and keep sub-30-second trades below 30% of profit.",
    calc: "A checklist, not a formula. If two limits disagree, use the tighter one.",
    example: "At {size}, 1.00 lot of gold at $4,000 uses $26,667 margin at 1:15 funded — 26.7% of a $100K account and 13.3% of a $200K account, inside the 30% guardrail.",
    note: "The firm's dashboard and terms override this personal checklist.",
    source,
  });

const fnInactivity = (source) =>
  RB.rule({
    id: "inactivity",
    group: "blocker",
    severity: "Condition",
    title: "30-day inactivity",
    value: "30 consecutive calendar days",
    body: "The account can be marked inactive if no trade is placed for 30 consecutive calendar days. Weekends and holidays count. Do not rely on an untouched open position to keep the account active.",
    calc: "Place at least one trade every 30 days. A 29-day buffer is safer.",
    example: "A 31-day holiday with no new order can expire the account.",
    source,
  });

const fnWeekend = (source) =>
  RB.rule({
    id: "weekend",
    group: "ref",
    severity: "Reference",
    title: "Overnight and weekend holding",
    value: "Allowed",
    body: "Trades can be held overnight and over the weekend on both Challenge and FundedNext Accounts. Swap charges still apply.",
    calc: "No weekend add-on is required.",
    example: "A position opened on Friday can be held through the weekend.",
    source,
  });

const fnPayoutNone = (source) =>
  RB.rule({
    id: "payout-none",
    group: "ref",
    severity: "Reference",
    title: "No payout during evaluation",
    value: "Funded account only",
    body: "Rewards are only available on the FundedNext Account after the challenge is passed.",
    calc: "Challenge accounts do not pay rewards.",
    example: "Pass the required phase or phases first.",
    source,
  });

const fnProfitTarget = (t1, t2, source) =>
  RB.rule({
    id: "profit-target",
    group: "pass",
    severity: "Condition",
    title: t2 ? "Profit targets" : "Profit target",
    value: t2 ? `${t1}% then ${t2}%` : `${t1}%`,
    body: t2
      ? `Phase 1 target is ${t1}% and Phase 2 target is ${t2}% of the initial balance. There is no time limit.`
      : `The single challenge target is ${t1}% of the initial balance. There is no time limit.`,
    calc: t2
      ? `Phase 1 = size × ${t1}%; Phase 2 = size × ${t2}%.`
      : `Target = size × ${t1}%.`,
    example: t2
      ? `On {size}: {amt:${t1}} in Phase 1, then {amt:${t2}} in Phase 2.`
      : `On {size}: {amt:${t1}} to pass.`,
    source,
  });

const fnMinDays = (days, source) =>
  RB.rule({
    id: "min-days",
    group: "pass",
    severity: "Condition",
    title: "Minimum trading days",
    value: `${days} separate days`,
    body: `Place at least one trade on ${days} separate calendar days. The days do not need to be consecutive. Reaching the profit target early does not bypass the requirement.`,
    calc: `${days} distinct days with at least one trade each.`,
    example: `${days} separate days with at least one executed trade.`,
    note: "The No Minimum Trading Days add-on is only sold on $6K, $15K and $25K accounts, not on $100K or $200K.",
    source,
  });

const fnPayout = (cycle, source, showOptions) =>
  RB.rule({
    id: "payout",
    group: "blocker",
    severity: "Condition",
    title: "Reward cycle and split",
    value: `80% · ${cycle}`,
    body: `The standard FundedNext Account pays 80% of account growth. The cycle starts with the first funded trade and is ${cycle}.${
      showOptions
        ? " The 3-Day Performance Reward option pays 60%, and the On-Demand option pays 90%; both change the cycle conditions."
        : ""
    }`,
    calc: "Reward = eligible profit × 80%. Scale-Up raises the standard split to 90%; the Lifetime 95% add-on overrides it.",
    example: "On {size}, {amt:5} of eligible profit pays {amt:4} at 80%.",
    note: "The 15% reward from the challenge targets is separate and is tied to Scale-Up eligibility.",
    source,
  });

/* ------------------------------------------------------------------ */
/* Stellar 2-Step                                                      */
/* ------------------------------------------------------------------ */
RB.firms.push({
  id: "fundednext",
  name: "FundedNext",
  short: "FN",
  color: "#60a5fa",
  tagline: "Stellar two-step and one-step evaluations with fixed loss limits.",
  models: [
    {
      id: "stellar-2-step",
      name: "Stellar 2-Step",
      tagline: "Two phases, 8% then 5%, with a static 10% floor.",
      sizes: "$6K–$200K",
      badges: [],
      phases: ["evaluation", "funded"],
      watchOut: [
        "The daily floor is 5% of the initial balance, not 5% of the previous close. Intraday profit widens the room but does not move the floor.",
        "Once funded, total risk at any moment is capped at 3%. The first breach is a warning and profit deduction; the second reclassifies the account to 1%.",
        "Only 40% of profit from trades inside a 5-minute high-impact news window counts toward a reward. EAs are not allowed at $100K or $200K.",
      ],
      headline: {
        evaluation: [
          RB.h("Profit target", "8% / 5%", "Phase 1 / Phase 2"),
          RB.h("Daily loss", "5%", "Floor {floor:5}"),
          RB.h("Max loss", "10% static", "Floor {floor:10}"),
          RB.h("Min trading days", "5 per phase", "Separate calendar days"),
          RB.h("Quick Strike", "<30%", "Trades closed under 30s"),
          RB.h("Payout", "After passing", "80% standard"),
        ],
        funded: [
          RB.h("Payout split", "80%", "90% after Scale-Up"),
          RB.h("Daily loss", "5%", "Floor {floor:5}"),
          RB.h("Max loss", "10% static", "Floor {floor:10}"),
          RB.h("Funded risk", "3%", "{amt:3} max at any time"),
          RB.h("News profit", "40% counts", "5-minute window"),
          RB.h("Cycle", "21 days", "Then 14 days"),
        ],
      },
      facts: {
        evaluation: {
          "Profit target": "8% / 5%",
          "Daily loss": "5% of initial balance",
          "Max loss": "10% static",
          "Min trading days": "5 per phase",
          Consistency: "None",
          "Quick Strike": "Below 30%",
          Payout: "After passing",
          News: "Allowed",
          Weekend: "Allowed",
          Leverage: "FX 1:100 · gold 1:25",
          Reset: "00:00 server time",
          EAs: "Not allowed at $50K+",
        },
        funded: {
          "Payout split": "80% (90% after Scale-Up)",
          "Daily loss": "5% of initial balance",
          "Max loss": "10% static",
          "Funded risk": "3% at any time",
          "Payout cycle": "21 days, then 14 days",
          "Min payout": "No fixed minimum",
          News: "5-min window; 40% of profit counts",
          Weekend: "Allowed",
          Leverage: "FX 1:100 · gold 1:15",
          Reset: "00:00 server time",
          EAs: "Not allowed at $50K+",
        },
      },
      rules: {
        shared: [
          fnMaxLoss(10, RB.sources.fn2),
          fnDaily(5, RB.sources.fnDaily),
          fnReset(RB.sources.fn2),
          fnLeverage(
            "FX 1:100 · gold 1:25 eval / 1:15 funded",
            "Challenge: FX 1:100, indices and commodities 1:25. Funded: FX 1:100, indices and commodities 1:15. Crypto is 1:1 and stocks 1:2 in both phases.",
            "1 lot of XAUUSD at $4,000 uses $16,000 margin at 1:25 and $26,667 at 1:15.",
            RB.sources.fnLeverage
          ),
          fnNews(RB.sources.fnNews),
          fnQuickStrike(RB.sources.fn2),
          fnEa(RB.sources.fn2),
          fnLots(RB.sources.fnLots),
          fnMarginUsage(RB.sources.fnRisk),
          fnGold(25, 15, RB.sources.fnRisk),
          fnExecution(RB.sources.fnRisk),
          fnInactivity(RB.sources.fnInactive),
          fnWeekend(RB.sources.fnWeekend),
        ],
        evaluation: [
          fnProfitTarget(8, 5, RB.sources.fn2),
          fnMinDays(5, RB.sources.fn2),
          fnPayoutNone(RB.sources.fn2),
        ],
        funded: [fnRisk(RB.sources.fnRisk), fnPayout("21 days, then 14 days", RB.sources.fn2, true)],
      },
    },

    {
      id: "stellar-1-step",
      name: "Stellar 1-Step",
      tagline: "One phase, 10% target, with a tighter 6% floor.",
      sizes: "$6K–$200K",
      badges: [],
      phases: ["evaluation", "funded"],
      watchOut: [
        "The 1-Step has a 3% daily floor and a 6% static maximum floor — half the room of the 2-Step. Size accordingly.",
        "Funded risk is still capped at 3%, and the first violation is a warning plus profit deduction.",
        "EAs are not allowed at $100K or $200K, and only 40% of news-window profit counts once funded.",
      ],
      headline: {
        evaluation: [
          RB.h("Profit target", "10%", "{amt:10} on {size}"),
          RB.h("Daily loss", "3%", "Floor {floor:3}"),
          RB.h("Max loss", "6% static", "Floor {floor:6}"),
          RB.h("Min trading days", "2", "Separate calendar days"),
          RB.h("Quick Strike", "<30%", "Trades closed under 30s"),
          RB.h("Payout", "After passing", "80% standard"),
        ],
        funded: [
          RB.h("Payout split", "80%", "90% after Scale-Up"),
          RB.h("Daily loss", "3%", "Floor {floor:3}"),
          RB.h("Max loss", "6% static", "Floor {floor:6}"),
          RB.h("Funded risk", "3%", "{amt:3} max at any time"),
          RB.h("News profit", "40% counts", "5-minute window"),
          RB.h("Cycle", "5 business days", "80% standard"),
        ],
      },
      facts: {
        evaluation: {
          "Profit target": "10%",
          "Daily loss": "3% of initial balance",
          "Max loss": "6% static",
          "Min trading days": "2",
          Consistency: "None",
          "Quick Strike": "Below 30%",
          Payout: "After passing",
          News: "Allowed",
          Weekend: "Allowed",
          Leverage: "FX 1:30 · gold 1:15",
          Reset: "00:00 server time",
          EAs: "Not allowed at $50K+",
        },
        funded: {
          "Payout split": "80% (90% after Scale-Up)",
          "Daily loss": "3% of initial balance",
          "Max loss": "6% static",
          "Funded risk": "3% at any time",
          "Payout cycle": "5 business days",
          "Min payout": "No fixed minimum",
          News: "5-min window; 40% of profit counts",
          Weekend: "Allowed",
          Leverage: "FX 1:30 · gold 1:10",
          Reset: "00:00 server time",
          EAs: "Not allowed at $50K+",
        },
      },
      rules: {
        shared: [
          fnMaxLoss(6, RB.sources.fn1),
          fnDaily(3, RB.sources.fnDaily),
          fnReset(RB.sources.fn1),
          fnLeverage(
            "FX 1:30 · gold 1:15 eval / 1:10 funded",
            "Challenge: FX 1:30, indices 1:10, commodities 1:15. Funded: FX 1:30, indices and commodities 1:10. Crypto is 1:1 and stocks 1:2 in both phases.",
            "1 lot of XAUUSD at $4,000 uses $26,667 margin at 1:15 and $40,000 at 1:10.",
            RB.sources.fnLeverage
          ),
          fnNews(RB.sources.fnNews),
          fnQuickStrike(RB.sources.fn1),
          fnEa(RB.sources.fn1),
          fnLots(RB.sources.fnLots),
          fnGold(15, 10, RB.sources.fnRisk),
          fnExecution(RB.sources.fnRisk),
          fnInactivity(RB.sources.fnInactive),
          fnWeekend(RB.sources.fnWeekend),
        ],
        evaluation: [
          fnProfitTarget(10, null, RB.sources.fn1),
          fnMinDays(2, RB.sources.fn1),
          fnPayoutNone(RB.sources.fn1),
        ],
        funded: [fnRisk(RB.sources.fnRisk), fnPayout("5 business days", RB.sources.fn1, false)],
      },
    },
  ],
});
