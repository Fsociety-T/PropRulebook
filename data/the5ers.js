/* The5ers — 2 Step, High Stakes, Summer 2-Step */

const t5MaxLoss = (pct, source) =>
  RB.rule({
    id: "max-loss",
    group: "killer",
    severity: "Hard breach",
    title: "Maximum loss (static)",
    value: `${pct}% of initial balance`,
    body: `The maximum loss is an absolute ${pct}% floor below your initial balance. It does not trail your profits.`,
    calc: `Initial balance × (1 − ${pct}%).`,
    example: `On {size}: the floor is {floor:${pct}}; {amt:${pct}} of room.`,
    note: "A breach closes the account. The floor is measured on equity, so floating losses count.",
    source,
  });

const t5Daily = (pct, source) =>
  RB.rule({
    id: "daily-loss",
    group: "killer",
    severity: "Hard breach",
    title: "Daily loss limit",
    value: `${pct}% of the higher of prior close balance or equity`,
    body: `At 00:00 server time, The5ers uses the higher of the previous day's closing balance or closing equity. Equity cannot fall more than ${pct}% below that reference during the new day.`,
    calc: `Baseline = max(previous close balance, previous close equity). Floor = baseline × (1 − ${pct}%).`,
    example: `On {size}, the daily limit is {amt:${pct}}. If prior equity was higher, the dollar limit is based on that.`,
    note: "The reset is 00:00 server time. Both floating and closed losses count.",
    source,
  });

const t5News = (source) =>
  RB.rule({
    id: "news",
    group: "blocker",
    severity: "Soft breach",
    title: "News trading window",
    value: "2 min before / after",
    body: "No order may be executed from 2 minutes before to 2 minutes after a high-impact news release. Holding existing trades is allowed. Profits from trades executed in the window are deducted; losses remain yours.",
    calc: "Window = release − 2 min to release + 2 min, server time. Pending orders triggered inside the window count.",
    example: "US CPI at 15:30 server time: no execution from 15:28 to 15:32.",
    source,
  });

const t5Inactivity = (source) =>
  RB.rule({
    id: "inactivity",
    group: "killer",
    severity: "Hard breach",
    title: "Inactivity",
    value: "30 days eval / 60 days Pro",
    body: "Evaluation accounts expire after 30 consecutive days without a new trade; Pro accounts after 60 days. The clock starts at registration for evaluations.",
    calc: "Calendar days. Opening a new trade resets the clock; holding an existing position does not.",
    example: "A 31-day break on an evaluation account can expire it.",
    source,
  });

const t5Reset = (source) =>
  RB.rule({
    id: "reset",
    group: "ref",
    severity: "Reference",
    title: "Daily reset time",
    value: "00:00 server time",
    body: "The daily loss baseline is recalculated at 00:00 server time from the previous day's closing balance or equity, whichever is higher.",
    calc: "New day baseline = max(previous close balance, previous close equity).",
    example: "Check the server clock in MT5; it may differ from your local time.",
    source,
  });

const t5MarginUsage = (source) =>
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

const t5Leverage = (source) =>
  RB.rule({
    id: "leverage",
    group: "ref",
    severity: "Reference",
    title: "Leverage",
    value: "FX 1:100",
    body: "Forex leverage is 1:100.",
    calc: "Margin = notional ÷ 100.",
    example: "1 lot EURUSD requires about $1,000 margin.",
    source,
  });

const t5Weekend = (source) =>
  RB.rule({
    id: "weekend",
    group: "ref",
    severity: "Reference",
    title: "Overnight and weekend holding",
    value: "Allowed",
    body: "Overnight and weekend holding are allowed on this plan.",
    calc: "No weekend restriction is listed for this plan.",
    example: "You can hold a position through the weekend.",
    source,
  });

const t5PayoutNone = (source) =>
  RB.rule({
    id: "payout-none",
    group: "ref",
    severity: "Reference",
    title: "No payout during evaluation",
    value: "Pro account only",
    body: "Payouts are only processed after the evaluation is passed and the Pro account is issued.",
    calc: "Evaluation accounts do not pay rewards.",
    example: "Pass the evaluation first.",
    source,
  });

const t5ProfitTarget = (t1, t2, source) =>
  RB.rule({
    id: "profit-target",
    group: "pass",
    severity: "Condition",
    title: "Profit targets",
    value: `${t1}% / ${t2}%`,
    body: `New: Phase 1 ${t1}%, Phase 2 ${t2}%. Classic: Phase 1 8%, Phase 2 5%. Both versions share the same risk rules.`,
    calc: `Phase 1 = size × ${t1}% (New) or 8% (Classic); Phase 2 = size × ${t2}%.`,
    example: `On {size}: New Phase 1 is {amt:${t1}}; Classic Phase 1 is {amt:8}. Phase 2 is {amt:${t2}}.`,
    source,
  });

/* ------------------------------------------------------------------ */
/* 2 Step                                                              */
/* ------------------------------------------------------------------ */
RB.firms.push({
  id: "the5ers",
  name: "The5ers",
  short: "T5",
  color: "#60a5fa",
  tagline: "Two-step, high-stakes and limited Summer evaluations.",
  models: [
    {
      id: "2-step",
      name: "2 Step",
      tagline: "Two-phase evaluation with a 10% static floor and 3% daily limit.",
      sizes: "$5K–$200K",
      badges: [],
      phases: ["evaluation", "funded"],
      watchOut: [
        "The daily limit is 3% of the higher of the previous close balance or equity — not the current balance.",
        "The 50% consistency rule starts only on the Pro account. There is no consistency rule in evaluation.",
        "News orders executed inside the 2-minute window lose their profit. Pending orders triggered inside it count too.",
      ],
      headline: {
        evaluation: [
          RB.h("Profit target", "10% / 5%", "New · Classic 8% / 5%"),
          RB.h("Daily loss", "3%", "{amt:3} on {size}"),
          RB.h("Max loss", "10% static", "Floor {floor:10}"),
          RB.h("Min trading days", "None", "No time limit"),
          RB.h("Consistency", "None", "Evaluation"),
          RB.h("Payout", "80% · 14 days", "Cap depends on size"),
        ],
        funded: [
          RB.h("Payout split", "80%", "Pro account"),
          RB.h("Daily loss", "3%", "{amt:3} on {size}"),
          RB.h("Max loss", "10% static", "Floor {floor:10}"),
          RB.h("Min payout", "$250", "Every 14 days"),
          RB.h("Consistency", "50%", "Resets after payout"),
          RB.h("Payout cap", "$2,000 / $3,000", "$100K / $200K"),
        ],
      },
      facts: {
        evaluation: {
          "Profit target": "10% / 5% (New) · 8% / 5% (Classic)",
          "Daily loss": "3%",
          "Max loss": "10% static",
          "Min trading days": "None",
          Consistency: "None",
          Payout: "After passing",
          "Payout cap": "$2,000 ($100K) / $3,000 ($200K)",
          News: "2-min window; profits deducted",
          Weekend: "Allowed",
          Leverage: "FX 1:100",
          Reset: "00:00 server time",
        },
        funded: {
          "Payout split": "80%",
          "Daily loss": "3%",
          "Max loss": "10% static",
          "Min payout": "$250",
          Consistency: "50%",
          Schedule: "14 days; cap depends on size",
          "Payout cap": "$2,000 ($100K) / $3,000 ($200K)",
          News: "2-min window; profits deducted",
          Weekend: "Allowed",
          Leverage: "FX 1:100",
          Reset: "00:00 server time",
        },
      },
      rules: {
        shared: [
          t5MarginUsage(RB.sources.t5Two),
          t5MaxLoss(10, RB.sources.t5Two),
          t5Daily(3, RB.sources.t5Two),
          t5News(RB.sources.t5News),
          t5Inactivity(RB.sources.t5Inactive),
          t5Reset(RB.sources.t5Two),
          t5Leverage(RB.sources.t5Two),
          t5Weekend(RB.sources.t5Two),
        ],
        evaluation: [
          t5ProfitTarget(10, 5, RB.sources.t5Two),
          RB.rule({
            id: "min-days",
            group: "pass",
            severity: "Condition",
            title: "Minimum trading days",
            value: "None",
            body: "The 2-Step FAQ does not repeat the word “minimum” explicitly; the 2-Step rules list no minimum and the plan works as described. Confirm in the dashboard before passing.",
            calc: "Reach the target with all trades closed.",
            example: "A single closed trade can pass if it reaches the target.",
            note: "Source wording: the FAQ search found no explicit “no minimum days” line for the 2-Step plan. The 80% split is the standard Pro split; confirm in your account dashboard.",
            source: RB.sources.t5Two,
          }),
          t5PayoutNone(RB.sources.t5Two),
        ],
        funded: [
          RB.rule({
            id: "consistency",
            group: "blocker",
            severity: "Condition",
            title: "50% consistency",
            value: "Best day ≤ 50% of profit",
            body: "On the Pro account, no single trading day can account for more than 50% of total profit at the time of a payout request. The rule resets after each payout.",
            calc: "Best day ÷ total profit ≤ 50%.",
            example: "A {amt:1} best day requires at least {amt:2} total profit.",
            source: RB.sources.t5Consistency,
          }),
          RB.rule({
            id: "payout",
            group: "blocker",
            severity: "Condition",
            title: "Payout terms",
            value: "$250 min · $2,000 / $3,000 cap · 80%",
            body: "Payouts are available every 14 days on the Pro account. Minimum P&L is $250. The cap is $2,000 per cycle on the $100K plan and $3,000 on the $200K Pro plan. Profit split is 80%.",
            calc: "Trader share = eligible profit × 80%, subject to the cap for the account size.",
            example: "On {amt:1} eligible profit, you receive {amt:0.8}; the payout is capped at $2,000 on $100K and $3,000 on $200K.",
            source: RB.sources.t5Payout,
          }),
        ],
      },
    },

    /* ---------------------------------------------------------------- */
    /* High Stakes                                                      */
    /* ---------------------------------------------------------------- */
    {
      id: "high-stakes",
      name: "High Stakes",
      tagline: "Two-phase challenge with a 5% daily limit and 3 profitable days.",
      sizes: "$2.5K–$100K",
      badges: [],
      phases: ["evaluation", "funded"],
      watchOut: [
        "The 5% daily limit is the binding rule, not the 10% static floor. A single bad day can end the account.",
        "Each phase needs 3 profitable days of at least 0.5% — not just the profit target.",
        "The 50% consistency rule does not apply here. Do not carry the 2-Step rule across.",
      ],
      headline: {
        evaluation: [
          RB.h("Profit target", "10% / 5%", "New · Classic 8% / 5%"),
          RB.h("Daily loss", "5%", "{amt:5} on {size}"),
          RB.h("Max loss", "10% static", "Floor {floor:10}"),
          RB.h("Min profitable days", "3 at 0.5%", "Per phase"),
          RB.h("Consistency", "None", "No 50% rule"),
          RB.h("Payout", "After passing", "80% → 100%"),
        ],
        funded: [
          RB.h("Payout split", "80% → 100%", "Scales with 10% + 3 days"),
          RB.h("Daily loss", "5%", "{amt:5} on {size}"),
          RB.h("Max loss", "10% static", "Floor {floor:10}"),
          RB.h("Min payout", "$300 / $500", "$50K / $100K"),
          RB.h("Consistency", "None", "No 50% rule"),
          RB.h("Payout cap", "$3,000 / $4,000", "$50K / $100K"),
        ],
      },
      facts: {
        evaluation: {
          "Profit target": "10% / 5% (New) · 8% / 5% (Classic)",
          "Daily loss": "5%",
          "Max loss": "10% static",
          "Min trading days": "3 profitable days at 0.5%",
          Consistency: "None",
          Payout: "After passing",
          News: "2-min window; profits deducted",
          Weekend: "Allowed",
          Leverage: "FX 1:100",
          Reset: "00:00 server time",
        },
        funded: {
          "Payout split": "80% → 100%",
          "Daily loss": "5%",
          "Max loss": "10% static",
          "Min payout": "$300 ($50K) / $500 ($100K)",
          Consistency: "None",
          Schedule: "14 days; caps $3K / $4K",
          News: "2-min window; profits deducted",
          Weekend: "Allowed",
          Leverage: "FX 1:100",
          Reset: "00:00 server time",
        },
      },
      rules: {
        shared: [
          t5MarginUsage(RB.sources.t5Two),
          t5MaxLoss(10, RB.sources.t5HighDD),
          t5Daily(5, RB.sources.t5HighDD),
          t5News(RB.sources.t5News),
          t5Inactivity(RB.sources.t5HighRules),
          t5Reset(RB.sources.t5HighDD),
          t5Leverage(RB.sources.t5High),
          t5Weekend(RB.sources.t5High),
        ],
        evaluation: [
          t5ProfitTarget(10, 5, RB.sources.t5High),
          RB.rule({
            id: "min-days",
            group: "pass",
            severity: "Condition",
            title: "3 profitable days per phase",
            value: "3 at 0.5% each",
            body: "Each phase requires 3 profitable days, each closing at least 0.5% of the initial balance. The same 3 profitable days are required to scale on the Pro account.",
            calc: "Profitable day = closed profit ≥ 0.5% of initial balance. Positive profit = min(midnight balance, midnight equity) − previous day balance.",
            example: "On {size}, each profitable day needs at least {amt:0.5}.",
            source: RB.sources.t5High,
          }),
          t5PayoutNone(RB.sources.t5High),
        ],
        funded: [
          RB.rule({
            id: "consistency",
            group: "ref",
            severity: "Reference",
            title: "Consistency",
            value: "No 50% rule",
            body: "High Stakes does not apply the 50% daily consistency rule used on the 2-Step Pro account.",
            calc: "No consistency percentage is required.",
            example: "A strong day does not block a payout by itself.",
            source: RB.sources.t5HighRules,
          }),
          RB.rule({
            id: "payout",
            group: "blocker",
            severity: "Condition",
            title: "Payout terms",
            value: "80% → 100% · 14 days",
            body: "Start at an 80% split and scale to 100% by reaching the 10% target with 3 profitable days. Payouts every 14 days. Caps: $3,000 on $50K, $4,000 on $100K. Minimum P&L: $300 on $50K, $500 on $100K.",
            calc: "Trader share = eligible profit × split, subject to the size-based cap.",
            example: "On a $50K account, the cap is $3,000 and the minimum P&L is $300; on $100K, $4,000 and $500.",
            source: RB.sources.t5HighRules,
          }),
          RB.rule({
            id: "scaling",
            group: "ref",
            severity: "Reference",
            title: "Scaling changes the dollar limits",
            value: "10% target + 3 profitable days",
            body: "Reaching the 10% target with 3 profitable days scales the account. The max loss stays 10% of the new balance, so the dollar floor moves with the larger account.",
            calc: "New floor = new starting balance × 90%.",
            example: "If the account scales from {size} to a larger size, recalculate the 10% floor on the new balance.",
            source: RB.sources.t5Split,
          }),
        ],
      },
    },

    /* ---------------------------------------------------------------- */
    /* Summer 2-Step                                                    */
    /* ---------------------------------------------------------------- */
    {
      id: "summer-2-step",
      name: "Summer 2-Step",
      tagline: "Limited-time two-step plan with size-dependent payout caps.",
      sizes: "$50K–$200K",
      badges: ["Limited"],
      phases: ["evaluation", "funded"],
      watchOut: [
        "Limited-time plan. The FAQ caps purchases at 4 accounts (2× 10/5 and 2× 8/5); the current page also lists $200K options and a $600K aggregate buying-power cap. Confirm at checkout.",
        "The 50% consistency rule applies on the funded account, even though the evaluation has none.",
        "The FAQ states a $2,000 cap per payout cycle on the $100K plan; the $200K page states up to $3,000. Check the terms shown for your plan.",
      ],
      headline: {
        evaluation: [
          RB.h("Profit target", "10% / 5%", "New · Classic 8% / 5%"),
          RB.h("Daily loss", "3%", "{amt:3} on {size}"),
          RB.h("Max loss", "10% static", "Floor {floor:10}"),
          RB.h("Min trading days", "None", "Pass in one trade"),
          RB.h("Consistency", "None", "Evaluation"),
          RB.h("Payout", "80% · 14 days", "Cap depends on size"),
        ],
        funded: [
          RB.h("Payout split", "80%", "Pro account"),
          RB.h("Daily loss", "3%", "{amt:3} on {size}"),
          RB.h("Max loss", "10% static", "Floor {floor:10}"),
          RB.h("Min payout", "$250", "Every 14 days"),
          RB.h("Consistency", "50%", "Resets after payout"),
          RB.h("Payout cap", "$2,000 / $3,000", "$100K / $200K"),
        ],
      },
      facts: {
        evaluation: {
          "Profit target": "10% / 5% (New) · 8% / 5% (Classic)",
          "Daily loss": "3%",
          "Max loss": "10% static",
          "Min trading days": "None",
          Consistency: "None",
          Payout: "After passing",
          "Payout cap": "$2,000 ($100K) / $3,000 ($200K)",
          News: "2-min window; profits deducted",
          Weekend: "Allowed",
          Leverage: "FX 1:100",
          Reset: "00:00 server time",
        },
        funded: {
          "Payout split": "80%",
          "Daily loss": "3%",
          "Max loss": "10% static",
          "Min payout": "$250",
          Consistency: "50%",
          Schedule: "14 days; cap depends on size",
          "Payout cap": "$2,000 ($100K) / $3,000 ($200K)",
          News: "2-min window; profits deducted",
          Weekend: "Allowed",
          Leverage: "FX 1:100",
          Reset: "00:00 server time",
        },
      },
      rules: {
        shared: [
          t5MarginUsage(RB.sources.t5Two),
          t5MaxLoss(10, RB.sources.t5Summer),
          t5Daily(3, RB.sources.t5Summer),
          t5News(RB.sources.t5SummerFaq),
          t5Inactivity(RB.sources.t5Inactive),
          t5Reset(RB.sources.t5Summer),
          t5Leverage(RB.sources.t5Summer),
          t5Weekend(RB.sources.t5Summer),
        ],
        evaluation: [
          t5ProfitTarget(10, 5, RB.sources.t5Summer),
          RB.rule({
            id: "min-days",
            group: "pass",
            severity: "Condition",
            title: "No minimum trading days",
            value: "Pass in one trade",
            body: "There is no minimum trading day requirement in the Summer 2-Step evaluation. The plan advertises that you can pass in one trade.",
            calc: "Reach the profit target with all trades closed.",
            example: "One closed trade can satisfy Phase 1 if it reaches 10% (New) or 8% (Classic).",
            source: RB.sources.t5SummerFaq,
          }),
          RB.rule({
            id: "limited",
            group: "ref",
            severity: "Limited",
            title: "Limited-time allocation",
            value: "4 accounts / $600K buying power",
            body: "The FAQ says you can buy up to 4 accounts: 2× the 10/5 version and 2× the 8/5 version. The current Summer page also advertises up to 6 accounts, one $200K 10/5 and one $200K 8/5, and a $600,000 aggregate buying-power cap per trader. The two sources describe different allocations — confirm the limit shown at checkout.",
            calc: "FAQ: max 4 accounts. Current page: max $600,000 aggregate buying power.",
            example: "Two $200K accounts already use $400K of the $600K buying-power cap.",
            note: "Source conflict: the FAQ and the Summer page are not aligned on the account limit.",
            source: RB.sources.t5SummerFaq,
          }),
          t5PayoutNone(RB.sources.t5Summer),
        ],
        funded: [
          RB.rule({
            id: "consistency",
            group: "blocker",
            severity: "Condition",
            title: "50% consistency",
            value: "Best day ≤ 50% of profit",
            body: "On the funded account, no single trading day can account for more than 50% of total profit at the time of a payout request. The rule resets after each payout.",
            calc: "Best day ÷ total profit ≤ 50%.",
            example: "A {amt:1} best day requires at least {amt:2} total profit.",
            source: RB.sources.t5Consistency,
          }),
          RB.rule({
            id: "payout",
            group: "blocker",
            severity: "Condition",
            title: "Payout terms",
            value: "$250 min · $2,000 / $3,000 cap · 80%",
            body: "Payouts every 14 days on the funded account. Minimum P&L is $250 and the split is 80%. The FAQ states a cap of up to $2,000 per cycle; the $200K Summer page states a cap of up to $3,000. Confirm the cap on your plan.",
            calc: "Trader share = eligible profit × 80%, subject to the cap for the account size.",
            example: "On {amt:1} eligible profit, you receive {amt:0.8}; the cap is $2,000 on the $100K plan and up to $3,000 on the $200K plan.",
            note: "Source conflict on the cap: FAQ says $2,000; the $200K page says $3,000.",
            source: RB.sources.t5Summer,
          }),
        ],
      },
    },
  ],
});
