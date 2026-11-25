/* Prop Rulebook — hash routing, rendering, search, compare and size interpolation.
   Plain browser JavaScript; no build step, no dependencies. */

(() => {
  "use strict";

  const RB = window.RULEBOOK;
  const view = document.getElementById("view");
  const firmNav = document.getElementById("firm-nav");
  const sidebar = document.getElementById("sidebar");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");
  const menuBtn = document.getElementById("menu-btn");
  const searchOverlay = document.getElementById("search-overlay");
  const searchOpenBtn = document.getElementById("search-open");
  const searchCloseBtn = document.getElementById("search-close");
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  const sizeSelect = document.getElementById("size-select");
  const printBtn = document.getElementById("print-btn");
  const toastEl = document.getElementById("toast");

  if (!RB) {
    view.innerHTML =
      '<div class="notice notice-warn"><strong>Data failed to load.</strong> Check that the files in <code>data/</code> are next to <code>index.html</code>.</div>';
    return;
  }

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(`propRulebook.${key}`);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(`propRulebook.${key}`, JSON.stringify(value));
      } catch {
        /* file:// or private mode can block storage; the site still works. */
      }
    },
  };

  const state = {
    size: Number(store.get("size", 100000)),
    phase: store.get("phase", {}) || {},
    compare: store.get("compare", null),
    comparePhase: store.get("comparePhase", "evaluation"),
    onlyDiffs: Boolean(store.get("onlyDiffs", false)),
    pickerOpen: false,
    searchIndex: null,
    searchTerms: [],
    searchMatches: [],
    searchActive: 0,
  };

  if (!RB.sizes.includes(state.size)) state.size = 100000;

  /* ------------------------------------------------------------------ */
  /* Small helpers                                                       */
  /* ------------------------------------------------------------------ */

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const esc = (value) =>
    String(value === null || value === undefined ? "" : value).replace(
      /[&<>"']/g,
      (ch) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[ch]
    );

  const fmtMoney = (value) => money.format(Math.round(Number(value) || 0));

  function interp(text) {
    if (text === null || text === undefined) return "";
    return String(text)
      .replace(/\{amtRange:([\d.]+):([\d.]+):(\d+)\}/g, (_, a, b, threshold) => {
        const pct = state.size <= Number(threshold) ? Number(a) : Number(b);
        return fmtMoney((state.size * pct) / 100);
      })
      .replace(/\{amt:([\d.]+)\}/g, (_, pct) => fmtMoney((state.size * Number(pct)) / 100))
      .replace(/\{floor:([\d.]+)\}/g, (_, pct) => fmtMoney(state.size * (1 - Number(pct) / 100)))
      .replace(/\{goldLots:([\d.]+):([\d.]+):([\d.]+)\}/g, (_, leverage, marginPct, price) => {
        const lots =
          (state.size * (Number(marginPct) / 100) * Number(leverage)) /
          (100 * Number(price));
        return lots.toFixed(2);
      })
      .replace(/\{goldRiskLots:([\d.]+):([\d.]+)\}/g, (_, riskPct, stop) => {
        const lots = (state.size * Number(riskPct)) / 100 / (100 * Number(stop));
        return lots.toFixed(2);
      })
      .replace(/\{size\}/g, fmtMoney(state.size));
  }

  function sizeRange(sizes) {
    const numbers = Array.from(String(sizes).matchAll(/\$([\d.]+)K/gi)).map(
      (match) => parseFloat(match[1]) * 1000
    );
    if (!numbers.length) return null;
    return { min: Math.min(...numbers), max: Math.max(...numbers) };
  }

  function sevClass(severity) {
    const text = String(severity || "").toLowerCase();
    if (text.includes("hard")) return "hard";
    if (text.includes("soft") || text.includes("auto")) return "soft";
    if (text.includes("condition")) return "cond";
    if (text.includes("limited")) return "limited";
    return "ref";
  }

  const phaseLabel = (phase) => (phase === "evaluation" ? "Evaluation" : "Funded");

  const badgeClass = (badge) => {
    if (badge === "Legacy") return "badge-legacy";
    if (badge === "Limited") return "badge-limited";
    return "badge-date";
  };

  const modelHref = (model) => `#/m/${encodeURIComponent(model.firmId)}/${encodeURIComponent(model.id)}`;

  const ruleHref = (model, ruleId) =>
    `${modelHref(model)}?rule=${encodeURIComponent(ruleId)}`;

  const allModels = () => RB.firms.flatMap((firm) => firm.models);

  const findModel = (key) =>
    allModels().find((model) => model.key === key) || null;

  function getRules(model, phase) {
    const seen = new Map();
    [...(model.rules?.shared || []), ...(model.rules?.[phase] || [])].forEach((rule) => {
      seen.set(rule.id, rule);
    });
    return Array.from(seen.values());
  }

  function phaseFor(model) {
    const saved = state.phase[model.key];
    if (saved && model.phases.includes(saved)) return saved;
    return model.phases.includes("evaluation") ? "evaluation" : model.phases[0];
  }

  function defaultCompare() {
    const preferred = [
      "fundednext/stellar-2-step",
      "goat/2-step",
      "funded-elite/2-step",
      "aquafunded/2-step-pro",
    ].filter((key) => findModel(key));
    if (preferred.length >= 2) return preferred;
    return allModels().slice(0, 3).map((model) => model.key);
  }

  /* ------------------------------------------------------------------ */
  /* Routing                                                             */
  /* ------------------------------------------------------------------ */

  function parseHash() {
    let raw = location.hash || "";
    if (raw.startsWith("#")) raw = raw.slice(1);
    if (raw.startsWith("/")) raw = raw.slice(1);
    const [path, query] = raw.split("?");
    return {
      path,
      parts: path.split("/").filter(Boolean),
      params: new URLSearchParams(query || ""),
    };
  }

  function updateNavActive(route) {
    const key =
      route.parts[0] === "m" && route.parts.length >= 3
        ? `${decodeURIComponent(route.parts[1])}/${decodeURIComponent(route.parts[2])}`
        : "";

    qsa(".nav-model", firmNav).forEach((link) => {
      const keys = (link.dataset.keys || "").split(" ").filter(Boolean);
      const active = Boolean(key && keys.includes(key));
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    const section = route.parts[0] || "";
    qsa(".nav-secondary a", firmNav).forEach((link) => {
      const active = (link.dataset.route || "") === section;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function render(options = {}) {
    const route = parseHash();
    const scrollY = options.preserveScroll ? window.scrollY : 0;
    let title = "Prop Rulebook";
    let ruleId = null;

    if (!route.parts.length) {
      const firm = RB.firms[0];
      const model = firm.models.find((item) => !item.hideInSidebar) || firm.models[0];
      ruleId = renderModelPage(firm, model, route);
      title = `${model.name} · ${firm.name}`;
    } else if (route.parts[0] === "models") {
      renderIndex();
      title = "All models";
    } else if (route.parts[0] === "compare") {
      renderCompare();
      title = "Compare models";
    } else if (route.parts[0] === "sources") {
      renderSources();
      title = "Sources";
    } else if (route.parts[0] === "m" && route.parts.length >= 3) {
      const firmId = decodeURIComponent(route.parts[1]);
      const modelId = decodeURIComponent(route.parts[2]);
      const firm = RB.firms.find((item) => item.id === firmId);
      const model = firm?.models.find((item) => item.id === modelId);
      if (firm && model) {
        ruleId = renderModelPage(firm, model, route);
        title = `${model.name} · ${firm.name}`;
      } else {
        renderNotFound();
        title = "Not found";
      }
    } else {
      renderNotFound();
      title = "Not found";
    }

    document.title = `${title} · Prop Rulebook`;
    updateNavActive(route);
    closeNav(false);

    if (options.preserveScroll) window.scrollTo(0, scrollY);
    else window.scrollTo(0, 0);

    if (ruleId && !options.preserveScroll) {
      requestAnimationFrame(() => {
        const card = qsa(".rule", view).find((item) => item.dataset.rule === ruleId);
        if (!card) return;
        card.classList.add("is-open");
        const head = qs(".rule-head", card);
        if (head) head.setAttribute("aria-expanded", "true");
        card.scrollIntoView({ block: "center" });
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Navigation                                                          */
  /* ------------------------------------------------------------------ */

  function renderNav() {
    const secondary = `
      <div class="nav-secondary">
        <a href="#/models" data-route="models">All models</a>
        <a href="#/compare" data-route="compare">Compare</a>
        <a href="#/sources" data-route="sources">Sources</a>
        <a href="#/" data-route="">Rules home</a>
      </div>`;

    const firms = RB.firms
      .map((firm) => {
        const models = firm.models
          .filter((model) => !model.hideInSidebar)
          .map((model) => {
            const group = model.groupId
              ? firm.models.filter((item) => item.groupId === model.groupId)
              : [];
            const keys = group.length ? group.map((item) => item.key) : [model.key];
            const label = group.length ? "Alpha Pro" : model.name;
            const badge = (model.badges || [])[0];
            const meta = group.length
              ? group.map((item) => item.variantLabel || item.name).join(" · ")
              : badge
                ? `<span class="nav-badge ${badge === "Legacy" ? "is-legacy" : ""}">${esc(badge)}</span>`
                : "";
            return `
              <a class="nav-model" href="${modelHref(model)}" data-keys="${esc(keys.join(" "))}" title="${esc(model.name)}">
                <span class="nav-model-label">${esc(label)}</span>
                ${meta ? `<span class="nav-model-meta">${meta}</span>` : ""}
              </a>`;
          })
          .join("");

        return `
          <div class="nav-firm">
            <div class="nav-firm-head">
              <span class="nav-firm-mark" style="--firm:${esc(firm.color)}">${esc(firm.short)}</span>
              <div>
                <strong>${esc(firm.name)}</strong>
                <span>${firm.models.length} models</span>
              </div>
            </div>
            <div class="nav-models">${models}</div>
          </div>`;
      })
      .join("");

    firmNav.innerHTML = secondary + firms;
  }

  function toggleNav(open) {
    const shouldOpen = Boolean(open);
    sidebar.classList.toggle("is-open", shouldOpen);
    sidebarBackdrop.hidden = !shouldOpen;
    menuBtn.setAttribute("aria-expanded", String(shouldOpen));
    document.body.classList.toggle("nav-open", shouldOpen);
    if (shouldOpen) {
      const first = qs("a, button", sidebar);
      if (first) first.focus();
    }
  }

  function closeNav(focusButton = true) {
    if (!sidebar.classList.contains("is-open")) return;
    toggleNav(false);
    if (focusButton) menuBtn.focus();
  }

  /* ------------------------------------------------------------------ */
  /* Model page                                                          */
  /* ------------------------------------------------------------------ */

  function renderModelPage(firm, model, route) {
    view.dataset.modelKey = model.key;
    const ruleId = route.params.get("rule");
    let phase = phaseFor(model);

    if (ruleId) {
      const phaseWithRule = model.phases.find((item) =>
        (model.rules?.[item] || []).some((rule) => rule.id === ruleId)
      );
      if (phaseWithRule) phase = phaseWithRule;
    }

    state.phase[model.key] = phase;
    store.set("phase", state.phase);

    const group = model.groupId
      ? firm.models.filter((item) => item.groupId === model.groupId)
      : [];
    const variants =
      group.length > 1
        ? `<div class="variants">
             <span class="variants-label">Variant</span>
             ${group
               .map(
                 (item) =>
                   `<a class="variant-tab ${item.id === model.id ? "is-active" : ""}" href="${modelHref(item)}"${item.id === model.id ? ' aria-current="page"' : ""}>${esc(item.variantLabel || item.name)}</a>`
               )
               .join("")}
           </div>`
        : "";

    const badges = (model.badges || [])
      .map((badge) => `<span class="badge ${badgeClass(badge)}">${esc(badge)}</span>`)
      .join("");

    const range = sizeRange(model.sizes);
    const sizeNotice =
      range && (state.size < range.min || state.size > range.max)
        ? `<div class="notice notice-warn"><strong>Example size:</strong> ${fmtMoney(state.size)} is outside this model's listed range (${esc(model.sizes)}). The dollar examples still update, but confirm this size is offered.</div>`
        : "";

    const phaseToggle =
      model.phases.length > 1
        ? `<div class="segmented" role="group" aria-label="Rule phase">
             ${model.phases
               .map(
                 (item) =>
                   `<button type="button" data-phase="${item}" class="${item === phase ? "is-active" : ""}" aria-pressed="${item === phase}">${phaseLabel(item)}</button>`
               )
               .join("")}
           </div>`
        : `<span class="badge">${phaseLabel(model.phases[0])} only</span>`;

    const watchOut = (model.watchOut || []).length
      ? `<section class="watchout" aria-label="Watch out">
           <h2>Watch out</h2>
           <ul>${model.watchOut.map((item) => `<li>${esc(interp(item))}</li>`).join("")}</ul>
         </section>`
      : "";

    const stats = model.headline?.[phase] || [];
    const snapshot = stats.length
      ? `<section class="snapshot" aria-label="Key numbers">
           ${stats
             .map(
               (stat) => `<div class="stat">
                 <span class="stat-label">${esc(stat.label)}</span>
                 <strong class="stat-value">${esc(interp(stat.value))}</strong>
                 ${stat.sub ? `<span class="stat-sub">${esc(interp(stat.sub))}</span>` : ""}
               </div>`
             )
             .join("")}
         </section>`
      : "";

    const rules = getRules(model, phase);
    const grouped = { killer: [], blocker: [], pass: [], ref: [] };
    rules.forEach((rule) => {
      (grouped[rule.group] || grouped.ref).push(rule);
    });

    const sectionMeta = [
      { id: "killer", label: "Account killers", note: "Hard breaches and account-ending limits" },
      { id: "blocker", label: "Payout blockers", note: "Soft breaches and conditions that can withhold profit" },
      { id: "pass", label: "Passing conditions", note: "Targets and requirements to move forward" },
      { id: "ref", label: "Reference", note: "Practical context, not a pass/fail rule" },
    ];

    let cardIndex = 0;
    const ruleSections = sectionMeta
      .map((section) => {
        const items = grouped[section.id] || [];
        if (!items.length) return "";
        const cards = items
          .map((rule) => ruleCard(rule, cardIndex++))
          .join("");
        return `
          <section class="rule-section" data-group="${section.id}">
            <div class="section-head">
              <h2>${esc(section.label)}</h2>
              <span class="section-count">${items.length}</span>
              <p class="section-note">${esc(section.note)}</p>
            </div>
            <div class="rules">${cards}</div>
          </section>`;
      })
      .join("");

    view.innerHTML = `
      <div class="page">
        <header class="page-head">
          <div class="crumbs">
            <a href="#/models">All models</a>
            <span class="sep">/</span>
            <span>${esc(firm.name)}</span>
          </div>
          <div class="title-row">
            <div>
              <p class="eyebrow">${esc(firm.name)}</p>
              <h1>${esc(model.name)}</h1>
              <p class="tagline">${esc(model.tagline)}</p>
            </div>
            ${badges ? `<div class="badges">${badges}</div>` : ""}
          </div>
          <div class="meta-line">
            <span><strong>${model.phases.map(phaseLabel).join(" · ")}</strong></span>
            <span class="dot"></span>
            <span>Listed sizes <strong>${esc(model.sizes)}</strong></span>
            <span class="dot"></span>
            <span class="verified">Verified ${esc(RB.verified)}</span>
          </div>
          ${variants}
          ${sizeNotice}
        </header>

        ${watchOut}
        ${snapshot}

        <div class="toolbar">
          ${phaseToggle}
          <div class="toolbar-actions">
            <button class="btn btn-ghost" type="button" data-expand="all">Expand all</button>
            <button class="btn btn-ghost" type="button" data-expand="none">Collapse all</button>
          </div>
        </div>

        ${ruleSections}
        ${factsDetails(model)}
        ${siteFoot()}
      </div>`;

    return ruleId;
  }

  function ruleCard(rule, index) {
    const sev = sevClass(rule.severity);
    const details = [
      rule.calc ? detailBlock("Calculation", rule.calc) : "",
      rule.example ? detailBlock("Example", rule.example) : "",
      rule.note ? detailBlock("Note", rule.note, true) : "",
    ]
      .filter(Boolean)
      .join("");

    return `
      <article class="rule" data-sev="${sev}" data-rule="${esc(rule.id)}">
        <button class="rule-head" type="button" aria-expanded="false" aria-controls="rule-body-${index}">
          <span class="rule-severity">${esc(rule.severity)}</span>
          <span class="rule-title">${esc(rule.title)}${
            rule.badge ? `<span class="rule-flag">${esc(rule.badge)}</span>` : ""
          }</span>
          <span class="rule-value">${esc(interp(rule.value))}</span>
          <span class="rule-chev" aria-hidden="true"></span>
        </button>
        <div class="rule-body" id="rule-body-${index}">
          <p>${esc(interp(rule.body))}</p>
          ${details ? `<div class="rule-grid">${details}</div>` : ""}
          <div class="rule-foot">
            ${
              rule.source
                ? `<a href="${esc(rule.source.url)}" target="_blank" rel="noopener noreferrer">${esc(rule.source.label)} ↗</a>`
                : "<span>No source listed</span>"
            }
            <span class="verified">Verified ${esc(rule.verified || RB.verified)}</span>
          </div>
        </div>
      </article>`;
  }

  function detailBlock(label, text, wide) {
    return `<div class="detail${wide ? " detail-wide" : ""}"><span>${esc(label)}</span><p>${esc(
      interp(text)
    )}</p></div>`;
  }

  function factsDetails(model) {
    const phases = model.phases.filter((phase) => model.facts?.[phase]);
    if (!phases.length) return "";
    return `
      <details class="facts">
        <summary>Full fact sheet <span>${esc(phases.map(phaseLabel).join(" / "))}</span></summary>
        <div class="facts-body">
          ${phases
            .map(
              (phase) => `
                <h3>${phaseLabel(phase)}</h3>
                <table class="facts-table">
                  <tbody>
                    ${Object.entries(model.facts[phase])
                      .map(
                        ([label, value]) =>
                          `<tr><td>${esc(label)}</td><td>${esc(interp(value))}</td></tr>`
                      )
                      .join("")}
                  </tbody>
                </table>`
            )
            .join("")}
        </div>
      </details>`;
  }

  function siteFoot() {
    return `
      <footer class="site-foot">
        <p>${esc(RB.disclaimer)}</p>
        <p class="foot-meta">Verified ${esc(RB.verified)} · <a href="#/sources">Sources and verification dates</a> · <a href="#/models">All models</a></p>
      </footer>`;
  }

  /* ------------------------------------------------------------------ */
  /* Model index                                                         */
  /* ------------------------------------------------------------------ */

  function renderIndex() {
    view.removeAttribute("data-model-key");
    const models = allModels();
    const pages = models.filter((model) => !model.hideInSidebar);

    const firms = RB.firms
      .map((firm) => {
        const cards = firm.models
          .filter((model) => !model.hideInSidebar)
          .map((model) => modelCard(firm, model))
          .join("");
        return `
          <section class="index-firm">
            <div class="index-firm-head">
              <span class="nav-firm-mark" style="--firm:${esc(firm.color)}">${esc(firm.short)}</span>
              <div>
                <h2>${esc(firm.name)}</h2>
                <p>${esc(firm.tagline)}</p>
              </div>
            </div>
            <div class="model-grid">${cards}</div>
          </section>`;
      })
      .join("");

    view.innerHTML = `
      <div class="page">
        <header class="index-head">
          <p class="eyebrow">${models.length} models · ${pages.length} pages</p>
          <h1>All models</h1>
          <p>Every model is a one-page rule sheet with calculations, dollar examples, sources and verification dates. Pick a model, or <a href="#/compare">compare two to four side by side</a>.</p>
        </header>
        <div class="index-firms">${firms}</div>
        ${siteFoot()}
      </div>`;
  }

  function modelCard(firm, model) {
    const group = model.groupId
      ? firm.models.filter((item) => item.groupId === model.groupId)
      : [];
    const stats = (model.headline?.[model.phases[0]] || []).slice(0, 2);
    const quick = stats.map((stat) => `${stat.label} ${interp(stat.value)}`).join(" · ");
    const badges = (model.badges || [])
      .map((badge) => `<span class="badge ${badgeClass(badge)}">${esc(badge)}</span>`)
      .join("");
    const variants =
      group.length > 1
        ? `<div class="model-variants"><span>Variants</span>${group
            .map(
              (item) =>
                `<a href="${modelHref(item)}"${item.id === model.id ? ' aria-current="page"' : ""}>${esc(
                  item.variantLabel || item.name
                )}</a>`
            )
            .join("")}</div>`
        : "";

    return `
      <div class="model-card">
        <a class="model-card-link" href="${modelHref(model)}">
          <div class="model-card-top">
            <h3>${esc(model.name)}</h3>
            ${badges ? `<div class="model-card-badges">${badges}</div>` : ""}
          </div>
          <p>${esc(model.tagline)}</p>
          <div class="model-card-meta">
            <span>${esc(model.sizes)}</span>
            <span>${esc(model.phases.map(phaseLabel).join(" · "))}</span>
            ${quick ? `<span>${esc(quick)}</span>` : ""}
          </div>
        </a>
        ${variants}
      </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Compare                                                             */
  /* ------------------------------------------------------------------ */

  const COMPARE_RULE_LABELS = {
    "max-loss": "Maximum loss",
    "daily-loss": "Daily loss",
    inactivity: "Inactivity",
    news: "News window",
    "news-window": "News window",
    "news-intent": "News intent",
    weekend: "Weekend / overnight",
    "weekend-eval": "Weekend (evaluation)",
    leverage: "Leverage",
    reset: "Daily reset",
    lots: "Lot caps",
    "floating-risk": "Floating risk",
    "max-risk": "Max risk per asset",
    striking: "Striking System",
    duration: "Trade duration",
    prohibited: "Prohibited conduct",
    risk: "Funded risk limit",
    margin: "Margin cap",
    gold: "XAUUSD sizing",
    execution: "Execution checklist",
    scalp: "Min hold / scalp",
    payout: "Payout terms",
    "profit-cap": "Profit cap",
    consistency: "Consistency",
    "min-days": "Minimum days",
    "profit-target": "Profit target",
    "goat-guard": "Goat Guard",
    "quick-strike": "Quick Strike",
    "free-retry": "Free retry",
    ea: "Expert Advisors",
    float: "Floating loss",
  };

  function renderCompare() {
    view.removeAttribute("data-model-key");
    const validKeys = new Set(allModels().map((model) => model.key));
    state.compare = (Array.isArray(state.compare) ? state.compare : defaultCompare())
      .filter((key) => validKeys.has(key))
      .slice(0, 4);
    if (state.compare.length < 2) state.compare = defaultCompare().slice(0, 3);
    store.set("compare", state.compare);

    const selected = state.compare.map(findModel).filter(Boolean);
    const phase = state.comparePhase === "evaluation" ? "evaluation" : "funded";

    const pickerFirms = RB.firms
      .map(
        (firm) => `
          <div class="picker-firm">
            <h3>${esc(firm.name)}</h3>
            ${firm.models
              .map(
                (model) => `
                  <label class="picker-option">
                    <input type="checkbox" data-compare-key="${esc(model.key)}" ${
                      state.compare.includes(model.key) ? "checked" : ""
                    }>
                    <span>${esc(model.name)}</span>
                  </label>`
              )
              .join("")}
          </div>`
      )
      .join("");

    const phaseButtons = ["evaluation", "funded"]
      .map(
        (item) =>
          `<button type="button" data-compare-phase="${item}" class="${
            item === phase ? "is-active" : ""
          }" aria-pressed="${item === phase}">${phaseLabel(item)}</button>`
      )
      .join("");

    let comparison = "";
    if (selected.length < 2) {
      comparison = `<div class="compare-empty">Pick at least two models to compare. You can choose up to four.</div>`;
    } else {
      comparison = buildComparison(selected, phase);
    }

    view.innerHTML = `
      <div class="page">
        <header class="compare-head">
          <div>
            <p class="eyebrow">Side by side</p>
            <h1>Compare models</h1>
            <p>Choose two to four models. Dollar values follow the account-size selector. “Show only differences” hides rows where every selected model agrees.</p>
          </div>
        </header>

        <div class="compare-controls">
          <div class="compare-controls-left">
            <div class="segmented" role="group" aria-label="Compare phase">${phaseButtons}</div>
            <details class="picker" ${state.pickerOpen ? "open" : ""}>
              <summary>Choose models <span>${selected.length}/4</span></summary>
              <div class="picker-panel">${pickerFirms}</div>
            </details>
            <button class="btn btn-ghost" type="button" data-compare-reset>Reset</button>
          </div>
          <div class="compare-controls-right">
            <label class="switch">
              <input type="checkbox" id="only-diffs" ${state.onlyDiffs ? "checked" : ""}>
              Show only differences
            </label>
          </div>
        </div>

        <p class="compare-note">Hard-rule rows compare rule values, not full wording. A dash means the model does not list that fact or rule in this phase. Open a model page for the calculation, example and source.</p>

        ${comparison}
        ${siteFoot()}
      </div>`;
  }

  function buildComparison(selected, phase) {
    const factRows = [
      { label: "Firm", values: selected.map((model) => model.firmName) },
      { label: "Model", values: selected.map((model) => model.name) },
      { label: "Listed sizes", values: selected.map((model) => model.sizes) },
    ];

    const factKeys = [];
    selected.forEach((model) => {
      Object.keys(model.facts?.[phase] || {}).forEach((key) => {
        if (!factKeys.includes(key)) factKeys.push(key);
      });
    });

    factKeys.forEach((key) => {
      factRows.push({
        label: key,
        values: selected.map((model) => model.facts?.[phase]?.[key] ?? "—"),
      });
    });

    const ruleRows = [];
    const seenRuleIds = new Set();
    selected.forEach((model) => {
      getRules(model, phase).forEach((rule) => {
        if (!COMPARE_RULE_LABELS[rule.id] || seenRuleIds.has(rule.id)) return;
        seenRuleIds.add(rule.id);
        ruleRows.push({
          id: rule.id,
          label: COMPARE_RULE_LABELS[rule.id],
          cells: selected.map((item) => {
            const found = getRules(item, phase).find((candidate) => candidate.id === rule.id);
            return found
              ? { value: found.value, severity: found.severity }
              : { value: "—", severity: "" };
          }),
        });
      });
    });

    const factsTable = comparisonTable(
      selected,
      factRows,
      (row) => row.values.map((value) => ({ value, severity: "" }))
    );

    const rulesTable = ruleRows.length
      ? comparisonTable(selected, ruleRows, (row) => row.cells)
      : "";

    return `
      <h2 class="compare-section-title">Facts</h2>
      ${factsTable}
      ${
        rulesTable
          ? `<h2 class="compare-section-title">Hard rules</h2>${rulesTable}`
          : ""
      }`;
  }

  function comparisonTable(selected, rows, cellsForRow) {
    const bodyRows = rows
      .map((row) => {
        const cells = cellsForRow(row);
        const values = cells.map((cell) => String(cell.value ?? "—").trim().toLowerCase());
        const differs = new Set(values).size > 1;
        if (state.onlyDiffs && !differs) return "";
        return `<tr class="${differs ? "is-diff" : ""}">
          <th scope="row">${esc(row.label)}</th>
          ${cells
            .map(
              (cell) => `<td>${
                cell.severity
                  ? `<span class="cell-sev" data-sev="${sevClass(cell.severity)}">${esc(
                      cell.severity
                    )}</span>`
                  : ""
              }${esc(interp(cell.value))}</td>`
            )
            .join("")}
        </tr>`;
      })
      .filter(Boolean)
      .join("");

    if (!bodyRows) {
      return `<div class="compare-empty">No differences in this phase with the current selection.</div>`;
    }

    return `
      <div class="compare-wrap">
        <table class="compare-table">
          <thead>
            <tr>
              <th scope="col">Rule</th>
              ${selected
                .map(
                  (model) =>
                    `<th scope="col"><span class="firm">${esc(model.firmName)}</span>${esc(
                      model.name
                    )}</th>`
                )
                .join("")}
            </tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Sources                                                             */
  /* ------------------------------------------------------------------ */

  function renderSources() {
    view.removeAttribute("data-model-key");
    const entries = Object.entries(RB.sources);
    const groups = [
      { name: "FundedNext", prefix: "fn" },
      { name: "GOAT Funded", prefix: "goat" },
      { name: "The5ers", prefix: "t5" },
      { name: "Funded Elite", prefix: "fe" },
      { name: "FundingPips", prefix: "fp" },
      { name: "Alpha Capital", prefix: "alpha" },
      { name: "FundedSquad", prefix: "fs" },
      { name: "AquaFunded", prefix: "aq" },
    ];

    const used = new Set();
    const grouped = groups.map((group) => {
      const items = entries.filter(([key]) => key.startsWith(group.prefix));
      items.forEach(([key]) => used.add(key));
      return { ...group, items };
    });

    const other = entries.filter(([key]) => !used.has(key));
    if (other.length) grouped.push({ name: "Other", items: other });

    const sourceGroups = grouped
      .filter((group) => group.items.length)
      .map(
        (group) => `
          <section class="source-group">
            <h2>${esc(group.name)} <span class="section-count">${group.items.length}</span></h2>
            <div class="source-list">
              ${group.items
                .map(
                  ([, source]) => `
                    <div class="source-item">
                      <a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(
                        source.label
                      )} ↗</a>
                      <span class="source-url">${esc(source.url)}</span>
                    </div>`
                )
                .join("")}
            </div>
          </section>`
      )
      .join("");

    view.innerHTML = `
      <div class="page">
        <header class="index-head">
          <p class="eyebrow">Sources & verification</p>
          <h1>Where the rules come from</h1>
          <p>Every rule card links to one of these official pages. The rulebook was checked against them on ${esc(
            RB.verified
          )}. This is a personal summary, not the firm's official rulebook.</p>
        </header>

        <div class="notice"><strong>Read the date.</strong> Prop-firm rules change without much notice. Re-check the source before sizing a trade, especially when a rule is marked date-dependent or a model is marked Legacy or Limited.</div>

        <section class="source-group">
          <h2>Badge legend</h2>
          <div class="legend">
            <div class="legend-item"><span class="badge badge-legacy">Legacy</span><span>Discontinued model. Existing accounts keep the rules shown.</span></div>
            <div class="legend-item"><span class="badge badge-limited">Limited</span><span>Limited-time plan, allocation cap or promotional model.</span></div>
            <div class="legend-item"><span class="badge badge-date">Date-dependent</span><span>The rule changed on a known date. Check your purchase date.</span></div>
          </div>
        </section>

        <section class="source-group">
          <h2>How to read this site</h2>
          <div class="source-note">
            <p>Rules are grouped into account killers, payout blockers, passing conditions and reference. Each card shows the exact calculation, a dollar example at the selected account size, the source and the date checked.</p>
            <ul>
              <li>Examples use the account size in the top bar. They are arithmetic, not a promise that the size is offered for that model.</li>
              <li>Where official sources conflict, the card says so instead of picking a number silently.</li>
              <li>Fees, refunds and checkout terms are outside scope. Add-ons are shown inline only where they change a rule.</li>
            </ul>
          </div>
        </section>

        ${sourceGroups}
        ${siteFoot()}
      </div>`;
  }

  function renderNotFound() {
    view.removeAttribute("data-model-key");
    view.innerHTML = `
      <div class="page">
        <header class="index-head">
          <p class="eyebrow">404</p>
          <h1>Page not found</h1>
          <p>That route does not exist. <a href="#/models">Browse all models</a>, or go to the <a href="#/">rules home</a>.</p>
        </header>
        ${siteFoot()}
      </div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Search                                                              */
  /* ------------------------------------------------------------------ */

  function buildSearchIndex() {
    const items = [];
    RB.firms.forEach((firm) => {
      firm.models.forEach((model) => {
        items.push({
          type: "model",
          title: model.name,
          sub: `${firm.name} · ${model.sizes}`,
          value: "",
          text: [model.name, model.tagline, model.sizes, firm.name, (model.badges || []).join(" ")].join(
            " "
          ),
          href: modelHref(model),
          badge: (model.badges || [])[0] || "",
        });

        const seen = new Map();
        ["shared", ...model.phases].forEach((phase) => {
          (model.rules?.[phase] || []).forEach((rule) => {
            seen.set(rule.id, { rule, phase });
          });
        });

        seen.forEach(({ rule, phase }) => {
          items.push({
            type: "rule",
            title: rule.title,
            sub: `${firm.name} · ${model.name}`,
            phaseLabel: phase === "shared" ? "All phases" : phaseLabel(phase),
            value: rule.value,
            severity: rule.severity,
            badge: rule.badge || "",
            text: [rule.title, rule.body, rule.calc, rule.example, rule.note, rule.value, rule.severity]
              .filter(Boolean)
              .join(" "),
            href: ruleHref(model, rule.id),
          });
        });
      });
    });
    return items;
  }

  function openSearch() {
    if (!searchOverlay.hidden) {
      searchInput.focus();
      return;
    }
    closeNav(false);
    searchOverlay.hidden = false;
    document.body.classList.add("search-open");
    searchOpenBtn.setAttribute("aria-expanded", "true");
    searchInput.value = "";
    state.searchTerms = [];
    state.searchMatches = [];
    state.searchActive = 0;
    searchResults.innerHTML =
      '<div class="search-empty">Search every model, rule, calculation and example.</div>';
    searchInput.focus();
  }

  function closeSearch(focusButton = true) {
    if (searchOverlay.hidden) return;
    searchOverlay.hidden = true;
    document.body.classList.remove("search-open");
    searchOpenBtn.setAttribute("aria-expanded", "false");
    if (focusButton) searchOpenBtn.focus();
  }

  function runSearch() {
    if (!state.searchIndex) state.searchIndex = buildSearchIndex();
    const query = searchInput.value.trim();
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    state.searchTerms = terms;
    state.searchActive = 0;

    if (!query) {
      state.searchMatches = [];
      searchResults.innerHTML =
        '<div class="search-empty">Search every model, rule, calculation and example.</div>';
      return;
    }

    const matches = state.searchIndex
      .map((item) => {
        const haystack = `${item.title} ${item.sub} ${item.value || ""} ${item.text || ""} ${
          item.badge || ""
        }`.toLowerCase();
        if (!terms.every((term) => haystack.includes(term))) return null;

        const title = item.title.toLowerCase();
        const value = String(item.value || "").toLowerCase();
        const sub = item.sub.toLowerCase();
        let score = 0;
        if (title === query.toLowerCase()) score += 30;
        else if (title.includes(query.toLowerCase())) score += 14;
        if (value.includes(query.toLowerCase())) score += 8;
        if (sub.includes(query.toLowerCase())) score += 4;
        terms.forEach((term) => {
          if (title.includes(term)) score += 5;
          if (value.includes(term)) score += 3;
          if (sub.includes(term)) score += 1;
          if ((item.text || "").toLowerCase().includes(term)) score += 1;
        });
        if (item.type === "model") score += 2;
        return { ...item, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 24);

    state.searchMatches = matches;
    renderSearchResults();
  }

  function renderSearchResults() {
    if (!state.searchMatches.length) {
      searchResults.innerHTML = `<div class="search-empty">No rules matched “${esc(
        searchInput.value.trim()
      )}”. Try a broader term.</div>`;
      return;
    }

    searchResults.innerHTML = state.searchMatches
      .map(
        (item, index) => `
          <a class="search-result ${index === state.searchActive ? "is-active" : ""}" href="${esc(
            item.href
          )}" data-search-index="${index}">
            <span class="search-result-icon">${item.type === "rule" ? "R" : "M"}</span>
            <span class="search-result-main">
              <span class="search-result-title">
                ${highlight(item.title, state.searchTerms)}
                ${item.value ? `<span class="search-value">${esc(interp(item.value))}</span>` : ""}
                ${item.badge ? `<span class="badge badge-date">${esc(item.badge)}</span>` : ""}
              </span>
              <span class="search-result-sub">${esc(item.sub)}${
                item.phaseLabel ? ` · ${esc(item.phaseLabel)}` : ""
              }${item.severity ? ` · ${esc(item.severity)}` : ""}</span>
              ${
                item.type === "rule"
                  ? `<span class="search-result-snippet">${highlight(
                      makeSnippet(item.text, state.searchTerms),
                      state.searchTerms
                    )}</span>`
                  : ""
              }
            </span>
          </a>`
      )
      .join("");
  }

  function makeSnippet(text, terms) {
    const raw = String(text || "")
      .replace(/\s+/g, " ")
      .trim();
    const lower = raw.toLowerCase();
    let index = -1;
    terms.forEach((term) => {
      const found = lower.indexOf(term);
      if (found >= 0 && (index < 0 || found < index)) index = found;
    });
    if (index < 0) return raw.slice(0, 150) + (raw.length > 150 ? "…" : "");
    const start = Math.max(0, index - 55);
    const end = Math.min(raw.length, index + 115);
    return `${start > 0 ? "…" : ""}${raw.slice(start, end)}${end < raw.length ? "…" : ""}`;
  }

  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlight(text, terms) {
    const raw = String(text || "");
    if (!terms.length) return esc(raw);
    const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
    let output = "";
    let last = 0;
    let match;
    while ((match = pattern.exec(raw)) !== null) {
      if (match.index > last) output += esc(raw.slice(last, match.index));
      output += `<mark>${esc(match[0])}</mark>`;
      last = match.index + match[0].length;
      if (match[0].length === 0) pattern.lastIndex += 1;
    }
    output += esc(raw.slice(last));
    return output;
  }

  function moveSearch(direction) {
    if (!state.searchMatches.length) return;
    const total = state.searchMatches.length;
    state.searchActive = (state.searchActive + direction + total) % total;
    renderSearchResults();
    const active = qs(".search-result.is-active", searchResults);
    if (active) active.scrollIntoView({ block: "nearest" });
  }

  function openActiveSearchResult() {
    const item = state.searchMatches[state.searchActive];
    if (!item) return;
    const target = item.href;
    closeSearch(false);
    if (location.hash === target) render();
    else location.hash = target;
  }

  /* ------------------------------------------------------------------ */
  /* Toast                                                               */
  /* ------------------------------------------------------------------ */

  let toastTimer = null;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2600);
  }

  /* ------------------------------------------------------------------ */
  /* Events                                                              */
  /* ------------------------------------------------------------------ */

  function bindEvents() {
    menuBtn.addEventListener("click", () => {
      toggleNav(!sidebar.classList.contains("is-open"));
    });
    sidebarBackdrop.addEventListener("click", () => closeNav());
    firmNav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeNav(false);
    });

    searchOpenBtn.addEventListener("click", openSearch);
    searchCloseBtn.addEventListener("click", () => closeSearch());
    searchOverlay.addEventListener("click", (event) => {
      if (event.target === searchOverlay) closeSearch();
    });
    searchInput.addEventListener("input", runSearch);
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSearch(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSearch(-1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        openActiveSearchResult();
      }
    });
    searchResults.addEventListener("click", (event) => {
      if (event.target.closest(".search-result")) closeSearch(false);
    });

    sizeSelect.addEventListener("change", () => {
      state.size = Number(sizeSelect.value);
      store.set("size", state.size);
      render({ preserveScroll: true });
      toast(`Examples updated to ${fmtMoney(state.size)}`);
    });

    printBtn.addEventListener("click", () => window.print());

    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
        return;
      }
      if (event.key === "Escape") {
        if (!searchOverlay.hidden) {
          event.preventDefault();
          closeSearch();
        } else if (sidebar.classList.contains("is-open")) {
          event.preventDefault();
          closeNav();
        }
      }
    });

    window.addEventListener("hashchange", () => {
      closeSearch(false);
      render();
    });

    view.addEventListener("click", (event) => {
      const phaseButton = event.target.closest("[data-phase]");
      if (phaseButton) {
        const key = view.dataset.modelKey;
        if (!key) return;
        state.phase[key] = phaseButton.dataset.phase;
        store.set("phase", state.phase);
        render({ preserveScroll: true });
        return;
      }

      const comparePhase = event.target.closest("[data-compare-phase]");
      if (comparePhase) {
        state.comparePhase = comparePhase.dataset.comparePhase;
        store.set("comparePhase", state.comparePhase);
        render({ preserveScroll: true });
        return;
      }

      const reset = event.target.closest("[data-compare-reset]");
      if (reset) {
        state.compare = defaultCompare();
        store.set("compare", state.compare);
        render({ preserveScroll: true });
        toast("Compare selection reset");
        return;
      }

      const expand = event.target.closest("[data-expand]");
      if (expand) {
        const open = expand.dataset.expand === "all";
        qsa(".rule", view).forEach((card) => {
          card.classList.toggle("is-open", open);
          const head = qs(".rule-head", card);
          if (head) head.setAttribute("aria-expanded", String(open));
        });
        return;
      }

      const head = event.target.closest(".rule-head");
      if (head) {
        const card = head.closest(".rule");
        if (!card) return;
        const open = card.classList.toggle("is-open");
        head.setAttribute("aria-expanded", String(open));
      }
    });

    view.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-compare-key]");
      if (checkbox) {
        const key = checkbox.dataset.compareKey;
        if (checkbox.checked) {
          if (state.compare.includes(key)) return;
          if (state.compare.length >= 4) {
            checkbox.checked = false;
            toast("Compare up to 4 models.");
            return;
          }
          state.compare.push(key);
        } else {
          state.compare = state.compare.filter((item) => item !== key);
        }
        store.set("compare", state.compare);
        render({ preserveScroll: true });
        return;
      }

      if (event.target.id === "only-diffs") {
        state.onlyDiffs = event.target.checked;
        store.set("onlyDiffs", state.onlyDiffs);
        render({ preserveScroll: true });
      }
    });

    view.addEventListener(
      "toggle",
      (event) => {
        if (event.target.matches(".picker")) state.pickerOpen = event.target.open;
      },
      true
    );

    let printDetails = [];
    window.addEventListener("beforeprint", () => {
      printDetails = qsa("details").map((details) => details.open);
      qsa("details").forEach((details) => {
        details.open = true;
      });
    });
    window.addEventListener("afterprint", () => {
      qsa("details").forEach((details, index) => {
        if (typeof printDetails[index] === "boolean") details.open = printDetails[index];
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */

  function init() {
    sizeSelect.innerHTML = RB.sizes
      .map(
        (size) =>
          `<option value="${size}" ${size === state.size ? "selected" : ""}>${fmtMoney(size)}</option>`
      )
      .join("");

    renderNav();
    bindEvents();
    render();
  }

  init();
})();
