/* Prop Rulebook — shared data helpers and source registry.
   Every rule is verified against the official pages linked in data/sources.md. */

const RB = {
  name: "Prop Rulebook",
  verified: "25 Nov 2026",
  disclaimer:
    "Personal study notes, not an official rulebook. The firm's dashboard and terms always win. Rules change — re-check before sizing a trade.",
  sizes: [100000],
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

/* ------------------------------------------------------------------ */
/* FundedNext sources                                                  */
/* ------------------------------------------------------------------ */
RB.sources.fn2 = RB.src(
  "FundedNext — Stellar 2-Step Challenge",
  "https://help.fundednext.com/en/articles/17255124-stellar-2-step-challenge"
);
RB.sources.fn1 = RB.src(
  "FundedNext — Stellar 1-Step Account",
  "https://help.fundednext.com/en/articles/17252927-stellar-1-step-account"
);
RB.sources.fnDaily = RB.src(
  "FundedNext — Daily vs maximum loss limit",
  "https://help.fundednext.com/en/articles/9941519-daily-loss-limit-vs-maximum-loss-limit"
);
RB.sources.fnNews = RB.src(
  "FundedNext — Is news trading allowed?",
  "https://help.fundednext.com/en/articles/10701447-is-news-trading-allowed-at-fundednext"
);
RB.sources.fnRisk = RB.src(
  "FundedNext — Risk limits on a FundedNext account",
  "https://help.fundednext.com/en/articles/14702245-what-are-the-risk-limits-on-a-fundednext-account"
);
RB.sources.fnLots = RB.src(
  "FundedNext — Maximum lot size",
  "https://help.fundednext.com/en/articles/11982225-what-is-the-maximum-lot-size-in-fundednext"
);
RB.sources.fnLeverage = RB.src(
  "FundedNext — CFD symbols and conditions",
  "https://fundednext.com/general-rules/cfds/symbols-and-conditions"
);
RB.sources.fnWeekend = RB.src(
  "FundedNext — Overnight and weekend holding",
  "https://help.fundednext.com/en/articles/11982358-does-fundednext-allow-holding-trades-over-the-night-weekend"
);
RB.sources.fnInactive = RB.src(
  "FundedNext — Inactivity period",
  "https://help.fundednext.com/en/articles/8019664-is-there-an-inactivity-period-for-my-accounts-in-fundednext-cfd"
);

/* ------------------------------------------------------------------ */
/* GOAT Funded sources                                                 */
/* ------------------------------------------------------------------ */
RB.sources.goat2 = RB.src(
  "GOAT Funded — 2 Step GOAT model",
  "https://help.goatfundedtrader.com/en/articles/13575348-2-step-goat-model"
);
RB.sources.goat1 = RB.src(
  "GOAT Funded — 1 Step model",
  "https://help.goatfundedtrader.com/en/articles/10630134-1-step-model"
);
RB.sources.goatMargin = RB.src(
  "GOAT Funded — 80% margin rule",
  "https://help.goatfundedtrader.com/en/articles/18469543-how-does-the-80-margin-rule-work"
);
RB.sources.goatNews = RB.src(
  "GOAT Funded — Is news trading allowed?",
  "https://help.goatfundedtrader.com/en/articles/10742084-is-news-trading-allowed"
);
RB.sources.goatGuard = RB.src(
  "GOAT Funded — What is Goat Guard?",
  "https://help.goatfundedtrader.com/en/articles/10742107-what-is-goat-guard"
);
RB.sources.goatPayout = RB.src(
  "GOAT Funded — Funded account reward guidelines",
  "https://help.goatfundedtrader.com/en/articles/11472001-funded-account-reward-guidelines"
);
RB.sources.goatLeverage = RB.src(
  "GOAT Funded — Account leverage",
  "https://help.goatfundedtrader.com/en/articles/10741910-what-is-the-account-leverage"
);
RB.sources.goatHold = RB.src(
  "GOAT Funded — Minimum holding time",
  "https://help.goatfundedtrader.com/en/articles/12849041-what-is-the-minimum-holding-time-for-trades"
);
RB.sources.goatWeekend = RB.src(
  "GOAT Funded — Weekend holding",
  "https://help.goatfundedtrader.com/en/articles/10742082-can-i-hold-trades-over-the-weekend"
);
RB.sources.goatProhibited = RB.src(
  "GOAT Funded — Prohibited trading practices",
  "https://help.goatfundedtrader.com/en/articles/10742118-what-are-prohibited-trading-practices"
);
RB.sources.goatInactive = RB.src(
  "GOAT Funded — Inactivity limit",
  "https://help.goatfundedtrader.com/en/articles/10742197-is-there-any-inactivity-limit"
);

/* ------------------------------------------------------------------ */
/* Funded Elite sources                                                */
/* ------------------------------------------------------------------ */
RB.sources.fe2 = RB.src(
  "Funded Elite — 2-Step Challenge + Free Retry",
  "https://faq.fundedelite.com/en/articles/17437194-2-step-challenge-free-retry"
);
RB.sources.fe1 = RB.src(
  "Funded Elite — 1-Step Challenge + Free Retry",
  "https://faq.fundedelite.com/en/articles/17437187-1-step-challenge-free-retry"
);
RB.sources.feInstant = RB.src(
  "Funded Elite — Instant and Instant Elite",
  "https://faq.fundedelite.com/en/articles/17437205-instant-and-instant-elite"
);
RB.sources.feScalp = RB.src(
  "Funded Elite — Minimum holding time and scalp limit",
  "https://faq.fundedelite.com/en/articles/17437279-minimum-holding-time-and-the-scalp-limit"
);
RB.sources.feDaily = RB.src(
  "Funded Elite — Daily loss limit calculation",
  "https://faq.fundedelite.com/en/articles/17437257-how-is-the-daily-loss-limit-calculated"
);
RB.sources.feMax = RB.src(
  "Funded Elite — Max loss limit calculation",
  "https://faq.fundedelite.com/en/articles/17437262-how-is-the-max-loss-limit-calculated"
);
RB.sources.feReset = RB.src(
  "Funded Elite — Trading day reset time",
  "https://faq.fundedelite.com/en/articles/17437295-what-time-does-the-trading-day-reset"
);
RB.sources.feRisk = RB.src(
  "Funded Elite — Risk per instrument (funded)",
  "https://faq.fundedelite.com/en/articles/17437285-how-much-can-i-risk-on-one-instrument-funded-only"
);
RB.sources.feNews = RB.src(
  "Funded Elite — Can I trade the news?",
  "https://faq.fundedelite.com/en/articles/17437302-can-i-trade-the-news"
);
RB.sources.feWeekend = RB.src(
  "Funded Elite — Weekend holding and trading",
  "https://faq.fundedelite.com/en/articles/17437306-can-i-trade-or-hold-positions-over-the-weekend"
);
RB.sources.feMinDays = RB.src(
  "Funded Elite — Minimum profitable trading days",
  "https://faq.fundedelite.com/en/articles/17437271-what-are-minimum-profitable-trading-days"
);
RB.sources.fe200 = RB.src(
  "Funded Elite — Rules for $200K and larger accounts",
  "https://faq.fundedelite.com/en/articles/17437220-rules-for-200k-and-larger-accounts"
);
RB.sources.feSplit = RB.src(
  "Funded Elite — Reward share",
  "https://faq.fundedelite.com/en/articles/17437345-what-is-a-reward-and-how-much-do-i-keep"
);
RB.sources.fePayout = RB.src(
  "Funded Elite — When can I request a payout?",
  "https://faq.fundedelite.com/en/articles/17437349-when-can-i-request-a-payout"
);
RB.sources.feLeverage = RB.src(
  "Funded Elite — Leverage, instruments and commissions",
  "https://faq.fundedelite.com/en/articles/17437290-leverage-instruments-and-commissions"
);
RB.sources.feConduct = RB.src(
  "Funded Elite — Allowed and prohibited practices",
  "https://faq.fundedelite.com/en/articles/17437297-at-a-glance"
);

/* ------------------------------------------------------------------ */
/* AquaFunded sources                                                  */
/* ------------------------------------------------------------------ */
RB.sources.aq2 = RB.src(
  "AquaFunded — 2 Step Pro",
  "https://help.aquafunded.com/en/articles/15281229-2-step-pro"
);
RB.sources.aqInstant = RB.src(
  "AquaFunded — Instant Funding Standard",
  "https://help.aquafunded.com/en/articles/10476448-instant-funding-standard"
);
RB.sources.aqOther = RB.src(
  "AquaFunded — Other rules (margin, tick scalping)",
  "https://help.aquafunded.com/en/articles/11831701-other-rules"
);
RB.sources.aqNews = RB.src(
  "AquaFunded — Is news trading allowed?",
  "https://help.aquafunded.com/en/articles/14785740-is-news-trading-allowed"
);
RB.sources.aqLots = RB.src(
  "AquaFunded — Is there a max lot limit?",
  "https://help.aquafunded.com/en/articles/11831670-is-there-a-max-lot-limit"
);
RB.sources.aqMinDays = RB.src(
  "AquaFunded — Minimum trading days",
  "https://help.aquafunded.com/en/articles/15255671-are-there-minimum-trading-days"
);
RB.sources.aqConsistency = RB.src(
  "AquaFunded — Consistency rule",
  "https://help.aquafunded.com/en/articles/11875903-consistency-rule"
);
RB.sources.aqFloat = RB.src(
  "AquaFunded — Maximum loss per trade policy",
  "https://help.aquafunded.com/en/articles/11875895-maximum-loss-per-trade-policy"
);
