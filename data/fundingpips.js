/* FundingPips — 2 Step Standard, 2 Step Flex, 1 Step Flex */

const fpMaxLoss = (pct, source) =>
  RB.rule({
    id: "max-loss",
    group: "killer",
    severity: "Hard breach",
    title: "Maximum loss (static)",
    value: `${pct}% of starting size`,
    body: `The floor is fixed at ${pct}% below your starting account size. It never trails your profits. Equity or balance touching the floor is an immediate hard breach, even if the account recovers.`,
    calc: `Starting balance × (1 − ${pct}%). Both floating and closed losses count.`,
    example: `On {size}: {amt:${pct}} of room; the floor is {floor:${pct}}.`,
    note: "A breach is confirmed the moment the limit is touched, even briefly.",
    source,
  });

const fpDailyLoss = (pct, option, source) =>
  RB.rule({
    id: "daily-loss",
    group: "killer",
    severity: "Hard breach",
    title: "Daily loss limit",
    value: `${pct}% of the higher of opening balance or equity`,
    body: `At 00:00 platform time, FundingPips records the opening balance and opening equity. The higher number becomes the day's baseline. Equity cannot fall more than ${pct}% below it, including floating P&L.`,
    calc: `Baseline = max(opening balance, opening equity). Floor = baseline × (1 − ${pct}%).`,
    example: `On {size}, the limit is {amt:${pct}}. If opening equity is higher than opening balance, the dollar limit is calculated from that higher figure.`,
    note: option || "The limit resets at 00:00 platform time. Both floating and closed losses count.",
    source,
  });

const fpInactivity = (source) =>
  RB.rule({
    id: "inactivity",
    group: "killer",
    severity: "Hard breach",
    title: "30-day inactivity",
    value: "30 consecutive calendar days",
    body: "The account is breached if no trade is completed — opened and fully closed — within any 30-day window. An open position does not pause the clock.",
    calc: "The clock starts at account creation if you have not traded; otherwise it starts the day after your last trade was fully closed.",
    example: "A position left open for 31 days does not count as activity and the account can be closed.",
    source,
  });

const fpProhibited = (source) =>
  RB.rule({
    id: "prohibited",
    group: "killer",
    severity: "Hard breach",
    title: "Prohibited conduct",
    value: "External copy · group trading · HFT",
    body: "Copying trades from an external source, signal provider or trade-copier service into your FundingPips account as the slave is prohibited. Group trading, latency arbitrage, tick-scalping abuse and exploiting pricing errors are also prohibited.",
    calc: "Trades must be your own and not coordinated across accounts or third parties.",
    example: "Copying the same signal into a FundingPips account and a personal account can be treated as group trading.",
    note: "Read the full Trading Conduct and Security Standards; violations can close the account.",
    source,
  });

const fpLots = (source) =>
  RB.rule({
    id: "lots",
    group: "killer",
    severity: "Hard cap",
    title: "20-lot maximum per trade",
    value: "20 lots per click / trade",
    body: "A hard 20-lot limit is enforced at the platform level on every single trade. Crypto has a separate 1-lot limit per click.",
    calc: "The cap cannot be overridden by margin or leverage allowance.",
    example: "A single 25-lot FX order is rejected or treated as a rule violation.",
    source,
  });

const fpReset = (source) =>
  RB.rule({
    id: "reset",
    group: "ref",
    severity: "Reference",
    title: "Daily reset time",
    value: "00:00 platform time",
    body: "The trading day resets at 00:00 platform time. FundingPips lists summer time as UTC+3 (21:00 UTC) and winter time as UTC+2 (22:00 UTC).",
    calc: "The daily loss baseline is captured at 00:00 platform time; the clock follows the platform's seasonal server time.",
    example: "In winter, 00:00 platform time is 22:00 UTC; in summer, it is 21:00 UTC.",
    note: "Your platform clock may show a different local time. Use the server time shown in MT5 or cTrader.",
    source,
  });

const fpLeverage = (source) =>
  RB.rule({
    id: "leverage",
    group: "ref",
    severity: "Reference",
    title: "Leverage",
    value: "FX 1:100 · metals 1:30 · indices 1:20",
    body: "Standard account: FX 1:100, metals 1:30, energies 1:10, indices 1:20, crypto 1:2 during evaluation. On the Master account crypto changes to 1:1, and metals, indices and energies use temporary dynamic leverage.",
    calc: "Leverage is set per instrument class; margin = notional ÷ leverage (before dynamic tiers).",
    example: "1 standard lot of EURUSD (100,000 notional) at 1:100 requires about $1,000 margin.",
    note: "Swing and Swap-Free accounts have lower leverage. Check the model page before sizing.",
    source,
  });

const fpNewsIntent = (source) =>
  RB.rule({
    id: "news-intent",
    group: "killer",
    severity: "Hard breach",
    title: "No deliberate news trading",
    value: "Both phases",
    body: "Evaluation phases have no general news restriction and you can hold or manage trades through releases. However, purposely trading the news in either phase is prohibited and can result in account closure.",
    calc: "Intent is assessed from the pattern of entries around restricted events, not just one trade.",
    example: "Opening a fresh position seconds before a red-folder release and closing it after the spike is the behavior this rule targets.",
    note: "Use the FundingPips Economic Calendar on your dashboard as the official source.",
    source,
  });

const fpStriking = (source) =>
  RB.rule({
    id: "striking",
    group: "killer",
    severity: "Hard breach on 4th",
    title: "The Striking System (On Demand only)",
    value: "1% loss on one trade idea",
    body: "The Striking System applies only to models that offer an On Demand payout. It triggers when the closed and floating loss on one trade idea reaches 1% of the Master account size. A trade idea includes one trade, multiple same-direction trades on the same instrument, or new trades opened within 10 minutes of closing a losing trade.",
    calc: "Loss on the trade idea ÷ Master account size. Warnings are cumulative and do not reset between reward cycles.",
    example: "On {size}, a 1% loss is {amt:1}. 1st warning recorded; 2nd cuts the split by half; 3rd drops it to 20%; 4th closes the account.",
    note: "This rule is not present on every FundingPips model, only the models with an On Demand reward cycle.",
    source,
  });

const fpNewsWindow = (source) =>
  RB.rule({
    id: "news-window",
    group: "blocker",
    severity: "Soft breach",
    title: "News window on the Master account",
    value: "5 min before / after",
    body: "On the Master account, profits from trades opened or closed within 5 minutes before or after a restricted high-impact news event or speech can be deducted. Speeches run from 5 minutes before the start to 5 minutes after the end.",
    calc: "Restricted window = event time − 5 min to event time + 5 min. Trades opened 5 hours or more before the event are exempt.",
    example: "US CPI at 15:30 server time: no opening or closing on affected pairs from 15:25 to 15:35.",
    note: "Closing a partial order flags the entire order. If deductions push you through a loss limit, the account can still breach.",
    source,
  });

const fpWeekendMaster = (source) =>
  RB.rule({
    id: "weekend",
    group: "blocker",
    severity: "Auto-close",
    title: "No overnight or weekend holding on Master",
    value: "Swing add-on required",
    body: "On the Master account, overnight and weekend holding are not allowed unless the Swing add-on is active. The system automatically closes open positions in a 15-minute window.",
    calc: "Summer: auto-close 20:45–21:00 UTC. Winter: 21:45–22:00 UTC. Auto-closed trades do not breach the account.",
    example: "Without Swing, a position still open at 20:45 UTC in summer is closed by the system.",
    note: "Weekday overnight trades count as a valid trading day; weekend holds do not. Evaluation accounts can hold overnight and over the weekend.",
    source,
  });

const fpWeekendEval = (source) =>
  RB.rule({
    id: "weekend-eval",
    group: "ref",
    severity: "Reference",
    title: "Overnight and weekend holding in evaluation",
    value: "Allowed",
    body: "Overnight and weekend holding are allowed during evaluation for all instruments.",
    calc: "No add-on is required in evaluation.",
    example: "You can hold a position through the weekend during Phase 1 or Phase 2.",
    source,
  });

const fpMarginUsage = (source) =>
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

const fpPayoutNone = (source) =>
  RB.rule({
    id: "payout-none",
    group: "ref",
    severity: "Reference",
    title: "No payout during evaluation",
    value: "Master account only",
    body: "Rewards are only available on the Master account after the evaluation is passed.",
    calc: "Evaluation accounts do not pay rewards.",
    example: "Pass the required phases first.",
    source,
  });

const fpPayoutMin = (source) =>
  RB.rule({
    id: "payout-min",
    group: "blocker",
    severity: "Condition",
    title: "Minimum reward request",
    value: "1% of Master size",
    body: "The minimum reward request is 1% of the Master account size, including FundingPips' split.",
    calc: "Master account size × 1%.",
    example: "On {size}, the minimum reward request is {amt:1}.",
    source,
  });

const fpProfitTarget = (t1, t2, source) =>
  RB.rule({
    id: "profit-target",
    group: "pass",
    severity: "Condition",
    title: t2 ? "Profit targets" : "Profit target",
    value: t2 ? `${t1}% then ${t2}%` : `${t1}%`,
    body: t2
      ? `Phase 1 target is ${t1}%; Phase 2 target is ${t2}%. The target must be reached with all trades closed — profits from open trades do not count.`
      : `The single evaluation phase target is ${t1}%. The target must be reached with all trades closed — profits from open trades do not count.`,
    calc: t2
      ? `Phase 1 = size × ${t1}%; Phase 2 = size × ${t2}%.`
      : `Target = size × ${t1}%.`,
    example: t2
      ? `On {size}: {amt:${t1}} in Phase 1, then {amt:${t2}} in Phase 2.`
      : `On {size}: {amt:${t1}} to pass.`,
    source,
  });

const fpMinDays = (days, note, source) =>
  RB.rule({
    id: "min-days",
    group: "pass",
    severity: "Condition",
    title: "Minimum trading days",
    value: `${days} per phase`,
    body: `Complete at least ${days} trading days in each phase. Days do not need to be consecutive.`,
    calc: "A trading day is a day with trading activity, counted per phase.",
    example: `${days} separate days with at least one trade each.`,
    note,
    source,
  });

/* ------------------------------------------------------------------ */
/* 2 Step Standard                                                     */
/* ------------------------------------------------------------------ */
RB.firms.push({
  id: "fundingpips",
  name: "FundingPips",
  short: "FP",
  color: "#34d399",
  tagline: "Two-step and one-step evaluations with static drawdown.",
  models: [
    {
      id: "2-step-standard",
      name: "2 Step Standard",
      tagline: "The industry-standard two-phase evaluation.",
      sizes: "$5K–$100K",
      badges: [],
      phases: ["evaluation", "funded"],
      watchOut: [
        "The daily limit is measured from the higher of opening balance or equity. A green open trade can raise your loss baseline.",
        "The Striking System cuts your split after a 1% loss on one trade idea; the fourth warning closes the account.",
        "News profits inside the 5-minute window are deducted. The 5-hour exception only protects trades opened at least 5 hours before the event.",
      ],
      headline: {
        evaluation: [
          RB.h("Profit target", "8% / 5%", "Phase 1 / Phase 2"),
          RB.h("Daily loss", "5%", "{amt:5} · 3% option"),
          RB.h("Max loss", "10% static", "Floor {floor:10}"),
          RB.h("Min trading days", "3", "0 with 3% daily option"),
          RB.h("Consistency", "None", "Evaluation"),
          RB.h("Payout", "After passing", "60 / 80 / 100%"),
        ],
        funded: [
          RB.h("Payout split", "60 / 80 / 100%", "Weekly / bi-weekly / on-demand"),
          RB.h("Daily loss", "5%", "{amt:5} · 3% option"),
          RB.h("Max loss", "10% static", "Floor {floor:10}"),
          RB.h("Min payout", "1% of account", "{amt:1} on {size}"),
          RB.h("Consistency", "35% on-demand", "7 profitable days ≥0.5%"),
          RB.h("Schedule", "7 / 14 days / on-demand", "Clock starts at first trade"),
        ],
      },
      facts: {
        evaluation: {
          "Profit target": "8% / 5%",
          "Daily loss": "5% (3% option)",
          "Max loss": "10% static",
          "Min trading days": "3 (0 with 3% option)",
          Consistency: "None",
          Payout: "After passing",
          News: "No general restriction; no deliberate news trading",
          Weekend: "Allowed",
          Leverage: "FX 1:100",
          Reset: "00:00 platform time",
        },
        funded: {
          "Payout split": "60% / 80% / 100%",
          "Daily loss": "5% (3% option)",
          "Max loss": "10% static",
          "Min payout": "1% of account",
          Consistency: "35% on-demand + 7 profitable days",
          Schedule: "Weekly / 14 days / on-demand",
          News: "5-min window; profits deducted",
          Weekend: "Swing add-on required",
          Leverage: "FX 1:100",
          Reset: "00:00 platform time",
        },
      },
      rules: {
        shared: [
          fpMarginUsage(RB.sources.fpStandard),
          fpMaxLoss(10, RB.sources.fpStandard),
          fpDailyLoss(5, "Selecting the 3% daily loss option removes the minimum trading day requirement.", RB.sources.fpStandard),
          fpInactivity(RB.sources.fpStandard),
          fpProhibited(RB.sources.fpConduct),
          fpLots(RB.sources.fpStandard),
          fpNewsIntent(RB.sources.fpNews),
          fpReset(RB.sources.fpStandard),
          fpLeverage(RB.sources.fpStandard),
        ],
        evaluation: [
          fpProfitTarget(8, 5, RB.sources.fpStandard),
          fpMinDays(3, "Selecting the 3% daily loss option removes this requirement.", RB.sources.fpStandard),
          fpWeekendEval(RB.sources.fpNews),
          fpPayoutNone(RB.sources.fpStandard),
        ],
        funded: [
          fpNewsWindow(RB.sources.fpNews),
          fpWeekendMaster(RB.sources.fpNews),
          RB.rule({
            id: "payout",
            group: "blocker",
            severity: "Condition",
            title: "Reward cycles and splits",
            value: "60% / 80% / 100%",
            body: "Weekly pays 60% seven days after the first Master trade. Bi-weekly pays 80% every 14 days. On-demand pays 100% once the eligibility conditions are met.",
            calc: "The cycle starts from the first executed trade on the Master account; the split is chosen when the Master account is issued.",
            example: "First Master trade on Monday → weekly request the following Monday; bi-weekly request 14 days later.",
            source: RB.sources.fpStandard,
          }),
          RB.rule({
            id: "payout-eligibility",
            group: "blocker",
            severity: "Condition",
            title: "On-demand eligibility",
            value: "35% consistency + 7 profitable days",
            body: "For the 100% on-demand split, no single trading day can account for more than 35% of total profit, and you need at least 7 profitable days of 0.5% or more of the starting Master size. Both reset after each processed reward.",
            calc: "Best day ÷ total profit ≤ 35%. Profitable day = closed profit ≥ 0.5% of starting Master size.",
            example: "On {size}, each profitable day needs at least {amt:0.5}; a {amt:1} best day needs at least {amt:2.86} total profit to stay under 35%.",
            source: RB.sources.fpStandard,
          }),
          fpStriking(RB.sources.fpStandard),
          fpPayoutMin(RB.sources.fpStandard),
        ],
      },
    },

    /* ---------------------------------------------------------------- */
    /* 2 Step Flex                                                      */
    /* ---------------------------------------------------------------- */
    {
      id: "2-step-flex",
      name: "2 Step Flex",
      tagline: "Two phases, with a choice between an 80% and a 95% split.",
      sizes: "$5K–$100K",
      badges: [],
      phases: ["evaluation", "funded"],
      watchOut: [
        "The 95% bi-weekly split requires 3 profitable days of at least 0.5% each in every cycle. The 80% split has no such requirement.",
        "The 4% daily limit uses the higher of opening balance or equity — the same baseline trap as the Standard model.",
        "The Striking System still applies on the Master account. A 1% loss on one trade idea starts the warning ladder.",
      ],
      headline: {
        evaluation: [
          RB.h("Profit target", "10% / 8%", "Phase 1 / Phase 2"),
          RB.h("Daily loss", "4%", "{amt:4} on {size}"),
          RB.h("Max loss", "12% static", "Floor {floor:12}"),
          RB.h("Min trading days", "1 or 3", "80% split / 95% split"),
          RB.h("Consistency", "None", "Both bi-weekly splits"),
          RB.h("Payout", "After passing", "80 / 95 / 100%"),
        ],
        funded: [
          RB.h("Payout split", "80% or 95%", "Chosen at purchase"),
          RB.h("Daily loss", "4%", "{amt:4} on {size}"),
          RB.h("Max loss", "12% static", "Floor {floor:12}"),
          RB.h("Min payout", "1% of account", "{amt:1} on {size}"),
          RB.h("Consistency", "35% on-demand", "3 profitable days for 95%"),
          RB.h("Schedule", "14 days / on-demand", "95% needs 3 days per cycle"),
        ],
      },
      facts: {
        evaluation: {
          "Profit target": "10% / 8%",
          "Daily loss": "4%",
          "Max loss": "12% static",
          "Min trading days": "1 (80%) / 3 profitable days (95%)",
          Consistency: "None",
          Payout: "After passing",
          News: "No general restriction; no deliberate news trading",
          Weekend: "Allowed",
          Leverage: "FX 1:100",
          Reset: "00:00 platform time",
        },
        funded: {
          "Payout split": "80% or 95%",
          "Daily loss": "4%",
          "Max loss": "12% static",
          "Min payout": "1% of account",
          Consistency: "35% on-demand; 3 profitable days for 95%",
          Schedule: "14 days / on-demand",
          News: "5-min window; profits deducted",
          Weekend: "Swing add-on required",
          Leverage: "FX 1:100",
          Reset: "00:00 platform time",
        },
      },
      rules: {
        shared: [
          fpMarginUsage(RB.sources.fpStandard),
          fpMaxLoss(12, RB.sources.fpFlex2),
          fpDailyLoss(4, "The limit resets at 00:00 platform time. Both floating and closed losses count.", RB.sources.fpFlex2),
          fpInactivity(RB.sources.fpFlex2),
          fpProhibited(RB.sources.fpConduct),
          fpLots(RB.sources.fpFlex2),
          fpNewsIntent(RB.sources.fpNews),
          fpReset(RB.sources.fpFlex2),
          fpLeverage(RB.sources.fpFlex2),
        ],
        evaluation: [
          fpProfitTarget(10, 8, RB.sources.fpFlex2),
          RB.rule({
            id: "min-days",
            group: "pass",
            severity: "Condition",
            title: "Minimum trading days depend on your split",
            value: "1 day (80%) · 3 profitable days (95%)",
            body: "On the 80% split, complete at least 1 trading day per phase. On the 95% split, complete 3 profitable days per phase, each earning at least 0.5% of the starting balance.",
            calc: "Profitable day = closed profit ≥ 0.5% of starting size. Accounts purchased before 26 Aug 2026 keep 0 minimum days on the 80% split.",
            example: "On {size}, each 95%-split profitable day needs at least {amt:0.5}.",
            note: "Date-dependent: the 1-day rule applies to new and reset accounts from 26 Aug 2026.",
            badge: "Date-dependent",
            source: RB.sources.fpFlex2,
          }),
          fpWeekendEval(RB.sources.fpNews),
          fpPayoutNone(RB.sources.fpFlex2),
        ],
        funded: [
          fpNewsWindow(RB.sources.fpNews),
          fpWeekendMaster(RB.sources.fpNews),
          RB.rule({
            id: "payout",
            group: "blocker",
            severity: "Condition",
            title: "Reward cycles and splits",
            value: "80% / 95% / 100%",
            body: "Bi-weekly 80% has no other requirement. Bi-weekly 95% requires 3 profitable days in the cycle. On-demand 100% requires 35% consistency plus 7 profitable days.",
            calc: "The 14-day timer starts from the first Master trade. A profitable day is at least 0.5% of the starting Master size.",
            example: "A 95% request needs 3 days of at least {amt:0.5} each on {size} before the 14-day payout date.",
            source: RB.sources.fpFlex2,
          }),
          RB.rule({
            id: "payout-eligibility",
            group: "blocker",
            severity: "Condition",
            title: "On-demand eligibility",
            value: "35% consistency + 7 profitable days",
            body: "For the 100% on-demand split, no single trading day can account for more than 35% of total profit, and you need at least 7 profitable days of 0.5% or more of the starting Master size. Both reset after each processed reward.",
            calc: "Best day ÷ total profit ≤ 35%. Profitable day = closed profit ≥ 0.5% of starting Master size.",
            example: "On {size}, each profitable day needs at least {amt:0.5}.",
            source: RB.sources.fpFlex2,
          }),
          fpStriking(RB.sources.fpFlex2),
          fpPayoutMin(RB.sources.fpFlex2),
        ],
      },
    },

    /* ---------------------------------------------------------------- */
    /* 1 Step Flex                                                      */
    /* ---------------------------------------------------------------- */
    {
      id: "1-step-flex",
      name: "1 Step Flex",
      tagline: "One evaluation phase, no minimum trading days, 12% target.",
      sizes: "$5K–$100K",
      badges: [],
      phases: ["evaluation", "funded"],
      watchOut: [
        "The daily limit is 3% by default, with a 2% option. It is measured from the higher of opening balance or equity.",
        "The 12% target and 12% max loss leave no room for a wide-stop strategy. Size positions against the daily limit first.",
        "The Striking System applies on the Master account: a 1% loss on one trade idea starts the warning ladder.",
      ],
      headline: {
        evaluation: [
          RB.h("Profit target", "12%", "One phase"),
          RB.h("Daily loss", "3%", "{amt:3} · 2% option"),
          RB.h("Max loss", "12% static", "Floor {floor:12}"),
          RB.h("Min trading days", "0", "No minimum"),
          RB.h("Consistency", "None", "Evaluation"),
          RB.h("Payout", "After passing", "80 / 100%"),
        ],
        funded: [
          RB.h("Payout split", "80% / 100%", "Bi-weekly / on-demand"),
          RB.h("Daily loss", "3%", "{amt:3} · 2% option"),
          RB.h("Max loss", "12% static", "Floor {floor:12}"),
          RB.h("Min payout", "1% of account", "{amt:1} on {size}"),
          RB.h("Consistency", "35% on-demand", "7 profitable days ≥0.5%"),
          RB.h("Schedule", "14 days / on-demand", "Clock starts at first trade"),
        ],
      },
      facts: {
        evaluation: {
          "Profit target": "12%",
          "Daily loss": "3% (2% option)",
          "Max loss": "12% static",
          "Min trading days": "0",
          Consistency: "None",
          Payout: "After passing",
          News: "No general restriction; no deliberate news trading",
          Weekend: "Allowed",
          Leverage: "FX 1:100",
          Reset: "00:00 platform time",
        },
        funded: {
          "Payout split": "80% / 100%",
          "Daily loss": "3% (2% option)",
          "Max loss": "12% static",
          "Min payout": "1% of account",
          Consistency: "35% on-demand + 7 profitable days",
          Schedule: "14 days / on-demand",
          News: "5-min window; profits deducted",
          Weekend: "Swing add-on required",
          Leverage: "FX 1:100",
          Reset: "00:00 platform time",
        },
      },
      rules: {
        shared: [
          fpMarginUsage(RB.sources.fpStandard),
          fpMaxLoss(12, RB.sources.fpFlex1),
          fpDailyLoss(3, "The 2% daily loss option is available at purchase. The limit resets at 00:00 platform time.", RB.sources.fpFlex1),
          fpInactivity(RB.sources.fpFlex1),
          fpProhibited(RB.sources.fpConduct),
          fpLots(RB.sources.fpFlex1),
          fpNewsIntent(RB.sources.fpNews),
          fpReset(RB.sources.fpFlex1),
          fpLeverage(RB.sources.fpFlex1),
        ],
        evaluation: [
          fpProfitTarget(12, null, RB.sources.fpFlex1),
          RB.rule({
            id: "min-days",
            group: "pass",
            severity: "Condition",
            title: "Minimum trading days",
            value: "None",
            body: "There is no minimum trading day requirement and no time limit. Pass whenever the 12% target is reached.",
            calc: "Reach 12% with all trades closed.",
            example: "A single closed trade can pass the evaluation if it reaches {amt:12} on {size}.",
            source: RB.sources.fpFlex1,
          }),
          fpWeekendEval(RB.sources.fpNews),
          fpPayoutNone(RB.sources.fpFlex1),
        ],
        funded: [
          fpNewsWindow(RB.sources.fpNews),
          fpWeekendMaster(RB.sources.fpNews),
          RB.rule({
            id: "payout",
            group: "blocker",
            severity: "Condition",
            title: "Reward cycles and splits",
            value: "80% / 100%",
            body: "Bi-weekly pays 80% every two weeks. On-demand pays 100% once the eligibility conditions are met.",
            calc: "The bi-weekly profit must meet the 1% minimum of the account size first.",
            example: "On {size}, the minimum bi-weekly profit is {amt:1}.",
            source: RB.sources.fpFlex1,
          }),
          RB.rule({
            id: "payout-eligibility",
            group: "blocker",
            severity: "Condition",
            title: "On-demand eligibility",
            value: "35% consistency + 7 profitable days",
            body: "For the 100% on-demand split, no single trading day can account for more than 35% of total profit, and you need at least 7 profitable days of 0.5% or more of the starting Master size. Both reset after each processed reward.",
            calc: "Best day ÷ total profit ≤ 35%. Profitable day = closed profit ≥ 0.5% of starting Master size.",
            example: "On {size}, each profitable day needs at least {amt:0.5}.",
            source: RB.sources.fpFlex1,
          }),
          fpPayoutMin(RB.sources.fpFlex1),
        ],
      },
    },
  ],
});
