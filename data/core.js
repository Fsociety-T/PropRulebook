/* Prop Rulebook — shared data helpers and source registry.
   Every rule is verified against the official pages linked in data/sources.md. */

const RB = {
  name: "Prop Rulebook",
  verified: "21 Nov 2026",
  disclaimer:
    "Personal study notes, not an official rulebook. The firm's dashboard and terms always win. Rules change — re-check before sizing a trade.",
  sizes: [5000, 10000, 25000, 50000, 100000, 200000],
  firms: [],
  sources: {},
};

RB.h = (label, value, sub) => ({ label, value, sub: sub || "" });

RB.src = (label, url) => ({ label, url });

RB.rule = (o) =>
  Object.assign(
    {
      verified: RB.verified,
      group: "killer",
      severity: "Hard breach",
      calc: "",
      example: "",
      note: "",
      badge: null,
    },
    o
  );

/* ------------------------------------------------------------------ */
/* FundingPips sources                                                 */
/* ------------------------------------------------------------------ */
RB.sources.fpStandard = RB.src(
  "FundingPips — 2 Step Standard",
  "https://help.fundingpips.com/hc/en-us/articles/34501809112081-2-Step-Standard"
);
RB.sources.fpFlex2 = RB.src(
  "FundingPips — 2 Step Flex",
  "https://help.fundingpips.com/hc/en-us/articles/47835196271249-2-Step-Flex"
);
RB.sources.fpFlex1 = RB.src(
  "FundingPips — 1 Step Flex",
  "https://help.fundingpips.com/hc/en-us/articles/34501697434385-1-Step-Flex"
);
RB.sources.fpNews = RB.src(
  "FundingPips — News Trading & Weekend Holding",
  "https://help.fundingpips.com/hc/en-us/articles/34504137479441-News-Trading-Weekend-Holding"
);
RB.sources.fpConduct = RB.src(
  "FundingPips — Trading Conduct and Security Standards",
  "https://help.fundingpips.com/hc/en-us/articles/34505029138449-Trading-Conduct-and-Security-Standards"
);
RB.sources.fpObjectives = RB.src(
  "FundingPips — Trading Objectives",
  "https://fundingpips.com/trading-objectives"
);

/* ------------------------------------------------------------------ */
/* Alpha Capital sources                                               */
/* ------------------------------------------------------------------ */
RB.sources.alphaPro = RB.src(
  "Alpha Capital — Alpha Pro",
  "https://alphacapitalgroup.uk/product/alpha-pro"
);
RB.sources.alphaDaily = RB.src(
  "Alpha Capital — Daily risk limits",
  "https://help.alphacapitalgroup.uk/en/articles/6934210-what-are-the-daily-risk-limits-and-how-do-they-work"
);
RB.sources.alphaMax = RB.src(
  "Alpha Capital — Maximum total loss",
  "https://help.alphacapitalgroup.uk/en/articles/6934220-what-is-the-maximum-total-loss"
);
RB.sources.alphaNews = RB.src(
  "Alpha Capital — Can I trade news?",
  "https://help.alphacapitalgroup.uk/en/articles/9293522-can-i-trade-news"
);
RB.sources.alphaWeekend = RB.src(
  "Alpha Capital — Weekend holding",
  "https://help.alphacapitalgroup.uk/en/articles/6934247-can-i-hold-trades-over-the-weekend"
);
RB.sources.alphaRisk = RB.src(
  "Alpha Capital — Max Risk per asset",
  "https://help.alphacapitalgroup.uk/en/articles/15888623-what-is-the-max-risk-rule-and-how-does-it-work"
);
RB.sources.alphaDuration = RB.src(
  "Alpha Capital — 2-minute average trade duration",
  "https://help.alphacapitalgroup.uk/en/articles/8447268-what-is-the-2-minute-average-trade-duration-rule"
);
RB.sources.alphaEA = RB.src(
  "Alpha Capital — Expert Advisors",
  "https://help.alphacapitalgroup.uk/en/articles/6934236-can-i-use-an-expert-advisor-ea"
);
RB.sources.alphaCopy = RB.src(
  "Alpha Capital — Copy trading",
  "https://help.alphacapitalgroup.uk/en/articles/8786973-is-copy-trading-allowed"
);
RB.sources.alphaIP = RB.src(
  "Alpha Capital — VPN, VPS and the IP rule",
  "https://help.alphacapitalgroup.uk/en/articles/8420522-what-is-the-ip-rule-are-vpns-and-vpss-allowed"
);
RB.sources.alphaInactive = RB.src(
  "Alpha Capital — Inactivity",
  "https://help.alphacapitalgroup.uk/en/articles/8420080-inactivity"
);
RB.sources.alphaHedge = RB.src(
  "Alpha Capital — Hedging and stacking",
  "https://help.alphacapitalgroup.uk/en/articles/6933901-what-is-classified-as-hedging-and-stacking"
);
RB.sources.alphaProhibited = RB.src(
  "Alpha Capital — Prohibited strategies",
  "https://help.alphacapitalgroup.uk/en/articles/6934275-what-are-prohibited-trading-strategies"
);
RB.sources.alphaBiweekly = RB.src(
  "Alpha Capital — Bi-weekly performance fee",
  "https://help.alphacapitalgroup.uk/en/articles/10570531-bi-weekly-performance-fee"
);
RB.sources.alphaOnDemand = RB.src(
  "Alpha Capital — On-demand performance fee",
  "https://help.alphacapitalgroup.uk/en/articles/10102634-on-demand-performance-fee"
);

/* ------------------------------------------------------------------ */
/* FundedSquad sources                                                 */
/* ------------------------------------------------------------------ */
RB.sources.fsChallenge = RB.src(
  "FundedSquad — Challenge account trading rules",
  "https://intercom.help/fundedsquad/en/articles/17013981-challenge-account-trading-rules"
);
RB.sources.fsInstant = RB.src(
  "FundedSquad — Instant account trading rules",
  "https://intercom.help/fundedsquad/en/articles/17015480-instant-account-trading-rules"
);
RB.sources.fsSquad = RB.src(
  "FundedSquad — 2-Step Squad overview (legacy)",
  "https://intercom.help/fundedsquad/en/articles/17013951-2-step-squad-evaluation-account-overview-discountinued"
);
RB.sources.fsLite = RB.src(
  "FundedSquad — 2-Step Lite overview",
  "https://intercom.help/fundedsquad/en/articles/17013904-2-step-lite-evaluation-account-overview"
);
RB.sources.fsFlex = RB.src(
  "FundedSquad — 2-Step Flex overview",
  "https://intercom.help/fundedsquad/en/articles/17673280-2-step-flex-evaluation-account-overview"
);
RB.sources.fsOneFlex = RB.src(
  "FundedSquad — One-Step Flex overview",
  "https://intercom.help/fundedsquad/en/articles/17673656-one-step-flex-challenge-model"
);
RB.sources.fsInstantFlex = RB.src(
  "FundedSquad — Instant Flex overview",
  "https://intercom.help/fundedsquad/en/articles/16976053-instant-flex-overview"
);
RB.sources.fsDrawdown = RB.src(
  "FundedSquad — Daily drawdown",
  "https://intercom.help/fundedsquad/en/articles/12303068-daily-drawdown"
);
RB.sources.fsPayout = RB.src(
  "FundedSquad — Payout guide",
  "https://intercom.help/fundedsquad/en/articles/17135683-your-payout-guide-eligibility-requests-processing"
);

/* ------------------------------------------------------------------ */
/* The5ers sources                                                     */
/* ------------------------------------------------------------------ */
RB.sources.t5Two = RB.src(
  "The5ers — 2-Step plan rules",
  "https://the5ers.com/faqs/2-step-plan-rules-specifications"
);
RB.sources.t5High = RB.src(
  "The5ers — High Stakes",
  "https://the5ers.com/high-stakes"
);
RB.sources.t5HighRules = RB.src(
  "The5ers — High Stakes general rules",
  "https://the5ers.com/faqs/what-are-the-general-rules-for-the-high-stakes-program"
);
RB.sources.t5HighDD = RB.src(
  "The5ers — High Stakes drawdown",
  "https://the5ers.com/faqs/what-is-the-drawdown-rule-for-high-stakes"
);
RB.sources.t5Summer = RB.src(
  "The5ers — Summer Plan",
  "https://the5ers.com/summer-plan"
);
RB.sources.t5SummerFaq = RB.src(
  "The5ers — Summer Plan FAQ",
  "https://the5ers.com/faqs/what-is-the-summer-plan-and-what-are-my-options"
);
RB.sources.t5News = RB.src(
  "The5ers — Can I trade during news?",
  "https://the5ers.com/faqs/can-i-trade-during-news"
);
RB.sources.t5Consistency = RB.src(
  "The5ers — How is consistency calculated?",
  "https://the5ers.com/faqs/how-is-the-consistency-calculated"
);
RB.sources.t5Inactive = RB.src(
  "The5ers — Inactivity and account expiry",
  "https://the5ers.com/faqs/what-is-the-inactivity-rule-account-feature"
);
RB.sources.t5Payout = RB.src(
  "The5ers — Payouts, profit split and consistency",
  "https://the5ers.com/faqs/how-do-payouts-profit-split-and-consistency-work-on-the-200k-funded-account-2"
);
RB.sources.t5Split = RB.src(
  "The5ers — Profit split and scaling",
  "https://the5ers.com/faqs/how-much-is-the-profit-split-in-the5ers"
);
