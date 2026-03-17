
let currentStrategy = "balanced";
let originalAlternativeRows = [];

function scoreMachineCandidateStrategy(r, strategy){
  const load = Number(r.loadPct) || 0;
  const energy = Number(r.energy) || 0;
  const co2 = Number(r.co2) || 0;
  const water = Number(r.water) || 0;
  const loadPenalty = Math.abs(75 - load);

  let score;
  if(strategy === "eco"){
    score = 0.6*co2 + 0.2*energy + 0.1*(water/100) + 0.1*loadPenalty;
  } else if(strategy === "energy"){
    score = 0.6*energy + 0.2*co2 + 0.1*(water/100) + 0.1*loadPenalty;
  } else if(strategy === "capacity"){
    score = 0.6*loadPenalty + 0.2*energy + 0.1*co2 + 0.1*(water/100);
  } else {
    score = 0.4*loadPenalty + 0.3*energy + 0.2*co2 + 0.1*(water/100);
  }
  return Number(score.toFixed(1));
}

function rankMachinesByStrategy(rows, strategy){
  return (rows||[]).map(r => ({
    ...r,
    decisionScore: scoreMachineCandidateStrategy(r, strategy)
  })).sort((a,b)=>a.decisionScore - b.decisionScore);
}

function attachStrategyHandler(rows){
  const sel = document.getElementById("zpStrategySelect");
  if(!sel) return;

  sel.value = currentStrategy;

  sel.onchange = ()=>{
    currentStrategy = sel.value;
    const sourceRows = (originalAlternativeRows && originalAlternativeRows.length)
      ? originalAlternativeRows
      : rows;
    const ranked = rankMachinesByStrategy(sourceRows, currentStrategy);
    console.log("[STRATEGY]", currentStrategy, ranked.map(r => ({
      machine: r.machine,
      score: r.decisionScore,
      load: r.loadPct,
      energy: r.energy,
      co2: r.co2,
      water: r.water
    })));
    if (window.__ZP_ALT_RENDER_ROWS_WITH_SELECTED__) {
      window.__ZP_ALT_RENDER_ROWS_WITH_SELECTED__(ranked, ranked[1] ? 1 : 0);
    }
  };
}

(function () {
  const PANEL_ID = "zpProductionAlternatives";
  const BODY_ID = "zpAltBody";
  const BADGE_ID = "zpAltBadge";

  function $(id) {
    return document.getElementById(id);
  }

  function text(v, fallback = "—") {
    if (v === null || v === undefined || v === "") return fallback;
    return String(v);
  }

  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function fmtNumber(v, digits = 0) {
    const n = num(v);
    if (n === null) return "—";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(n);
  }

  function fmtPct(v) {
    const n = num(v);
    if (n === null) return "—";
    return `${fmtNumber(n, 1)}%`;
  }

  function fmtUnit(v, unit, digits = 0) {
    const n = num(v);
    if (n === null) return "—";
    return `${fmtNumber(n, digits)} ${unit}`;
  }

  function fmtSigned(v, digits = 1, suffix = "") {
    const n = num(v);
    if (n === null) return "—";
    const abs = Math.abs(n);
    const sign = n > 0 ? "+" : n < 0 ? "−" : "±";
    return `${sign}${fmtNumber(abs, digits)}${suffix ? ` ${suffix}` : ""}`;
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function resolveSupabaseConfig() {
    const cfg = window.ZeroConfig || window.ZERO_CONFIG || window.__ZERO_CONFIG__ || {};
    return {
      url:
        cfg.supabaseUrl ||
        cfg.SUPABASE_URL ||
        window.SUPABASE_URL ||
        window.__SUPABASE_URL__ ||
        null,
      key:
        cfg.supabaseAnonKey ||
        cfg.supabaseKey ||
        cfg.SUPABASE_ANON_KEY ||
        window.SUPABASE_ANON_KEY ||
        window.__SUPABASE_ANON_KEY__ ||
        null
    };
  }

  function pick(row, keys, fallback = null) {
    for (const k of keys) {
      if (row && row[k] !== undefined && row[k] !== null && row[k] !== "") {
        return row[k];
      }
    }
    return fallback;
  }

  function normalizeRow(row) {
    return {
      orderId: pick(row, ["production_order_id", "order_id"], "—"),
      customer: pick(row, ["customer", "customer_name"], "—"),
      machine: pick(row, [
        "recommended_asset_code",
        "recommended_asset_label",
        "recommended_machine",
        "machine_id"
      ], "—"),
      loadPct: num(pick(row, ["recommended_load_pct", "load_pct"], null)),
      energy: num(pick(row, ["estimated_energy_kwh", "estimated_energy"], null)),
      co2: num(pick(row, ["estimated_co2_kg", "estimated_co2"], null)),
      water: num(pick(row, ["estimated_water_l", "estimated_water"], null)),
      verdict: pick(row, ["capacity_verdict"], "Monitor")
    };
  }

  function verdictClass(v) {
    const s = String(v || "").toLowerCase();
    if (s.includes("ok")) return "ok";
    if (s.includes("alert") || s.includes("over") || s.includes("risk")) return "alert";
    return "monitor";
  }

  function deltaDirection(v) {
    const n = num(v);
    if (n === null || n === 0) return "same";
    return n > 0 ? "up" : "down";
  }

  function deltaClass(v) {
    const dir = deltaDirection(v);
    if (dir === "up") return "delta-up";
    if (dir === "down") return "delta-down";
    return "delta-same";
  }

  function setBadge(textValue) {
    const el = $(BADGE_ID);
    if (el) el.textContent = textValue;
  }

  function renderLoading() {
    const el = $(BODY_ID);
    if (!el) return;
    el.innerHTML = '<div class="zp-pde-loading">Loading machine alternatives…</div>';
  }

  function renderError(message) {
    const el = $(BODY_ID);
    if (!el) return;
    el.innerHTML = `<div class="zp-pde-error">Machine Alternatives failed: ${escapeHtml(message)}</div>`;
    setBadge("Unavailable");
  }

  function renderEmpty() {
    const el = $(BODY_ID);
    if (!el) return;
    el.innerHTML = '<div class="zp-pde-empty">No alternative rows found.</div>';
    setBadge("No Data");
  }

  async function fetchRowsViaRest() {
    const { url, key } = resolveSupabaseConfig();
    if (!url || !key) throw new Error("Supabase config not found on page.");

    const endpoint = `${url.replace(/\/+$/, "")}/rest/v1/v_production_decision_engine?select=*&limit=10`;
    const res = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`REST ${res.status}: ${txt}`);
    }
    return await res.json();
  }

  function chooseRows(rows) {
    const normalized = (rows || []).map(normalizeRow);
    const ua = normalized.filter(r => String(r.customer || "").toLowerCase().includes("under armour"));
    const base = ua.length ? ua : normalized;
    return base.slice(0, 3);
  }

  function calcDelta(baseValue, testValue) {
    const base = num(baseValue);
    const test = num(testValue);
    if (base === null || test === null) {
      return { base, test, delta: null };
    }
    return {
      base,
      test,
      delta: test - base
    };
  }

  function buildComparison(recommended, alternative) {
    return {
      loadPct: calcDelta(recommended.loadPct, alternative.loadPct),
      energy: calcDelta(recommended.energy, alternative.energy),
      water: calcDelta(recommended.water, alternative.water),
      co2: calcDelta(recommended.co2, alternative.co2)
    };
  }

  function computeImpactScore(cmp) {
    function n(v) {
      const x = Number(v);
      return Number.isFinite(x) ? Math.abs(x) : 0;
    }

    const energy = n(cmp.energy.delta);
    const co2 = n(cmp.co2.delta);
    const water = n(cmp.water.delta);
    const load = n(cmp.loadPct.delta);

    const score =
      0.4 * energy +
      0.3 * co2 +
      0.2 * (water / 100) +
      0.1 * load;

    let level = "LOW";
    if (score > 40) level = "HIGH";
    else if (score > 15) level = "MODERATE";

    return {
      score: score.toFixed(1),
      level
    };
  }

  function buildAIRecommendation(recommended, alternative, cmp) {
    const energy = Number(cmp.energy.delta) || 0;
    const co2 = Number(cmp.co2.delta) || 0;
    const water = Number(cmp.water.delta) || 0;

    let text = "";

    if (energy > 0 || co2 > 0 || water > 0) {
      text = `Switching to ${alternative.machine} increases resource impact compared with ${recommended.machine}. `;
      text += `Stay with ${recommended.machine} unless capacity or scheduling constraints require the switch.`;
    } else if (energy < 0 || co2 < 0 || water < 0) {
      text = `Alternative machine ${alternative.machine} may reduce sustainability impact compared with ${recommended.machine}. `;
      text += `This switch looks operationally attractive if capacity fit remains acceptable.`;
    } else {
      text = `The switch from ${recommended.machine} to ${alternative.machine} shows limited measurable impact in the current estimate.`;
    }

    return text;
  }

  function renderCompareMetric(label, metric, unit, digits) {
    const delta = metric.delta;
    return `
      <div class="zp-switch-metric ${deltaClass(delta)}">
        <div class="zp-switch-label">${escapeHtml(label)}</div>
        <div class="zp-switch-values">
          <span class="zp-switch-base">${fmtUnit(metric.base, unit, digits)}</span>
          <span class="zp-switch-arrow">→</span>
          <span class="zp-switch-test">${fmtUnit(metric.test, unit, digits)}</span>
        </div>
        <div class="zp-switch-delta">
          Δ ${delta === null ? "—" : escapeHtml(fmtSigned(delta, digits, unit))}
        </div>
      </div>
    `;
  }

  function renderCompareMetricPct(label, metric, digits) {
    const delta = metric.delta;
    return `
      <div class="zp-switch-metric ${deltaClass(delta)}">
        <div class="zp-switch-label">${escapeHtml(label)}</div>
        <div class="zp-switch-values">
          <span class="zp-switch-base">${fmtPct(metric.base)}</span>
          <span class="zp-switch-arrow">→</span>
          <span class="zp-switch-test">${fmtPct(metric.test)}</span>
        </div>
        <div class="zp-switch-delta">
          Δ ${delta === null ? "—" : escapeHtml(fmtSigned(delta, digits, "%"))}
        </div>
      </div>
    `;
  }

  

  function simulateLoadScenario(base, alt, load){
    const ratio = load / (alt.loadPct || 1)

    return {
      loadPct: load,
      energy: alt.energy * ratio,
      water: alt.water * ratio,
      co2: alt.co2 * ratio
    }
  }

function renderSimulationPanel(recommended, alternative, simulatedLoad = null) {
    const activeLoad = Number.isFinite(Number(simulatedLoad))
      ? Number(simulatedLoad)
      : (num(alternative.loadPct) ?? 75);

    const sim = simulateLoadScenario(recommended, alternative, activeLoad);

    const simulatedAlt = {
      ...alternative,
      loadPct: sim.loadPct,
      energy: sim.energy,
      water: sim.water,
      co2: sim.co2
    };

    const cmp = buildComparison(recommended, simulatedAlt)
const impact = computeImpactScore(cmp);
    const aiText = buildAIRecommendation(recommended, simulatedAlt, cmp);

    return `
      <div class="zp-switch-shell">
        <div class="zp-switch-head">
          <div>
            <div class="zp-switch-title">Machine Alternative Comparison</div>
            <div class="zp-switch-subtitle">
              Recommended <strong>${escapeHtml(text(recommended.machine))}</strong> vs Alternative <strong>${escapeHtml(text(alternative.machine))}</strong>
            </div>
          </div>
          <div class="zp-switch-meta">
            <div class="zp-switch-order">Order: ${escapeHtml(text(recommended.orderId))}</div>
            <div class="zp-switch-customer">Customer: ${escapeHtml(text(recommended.customer))}</div>
          </div>
        </div>

        

        <div class="zp-load-simulator">
          <div class="zp-load-title">Alternative Machine Load Simulation</div>
          <div class="zp-load-row">
            <input id="zpLoadSlider" type="range" min="50" max="110" value="${activeLoad}" step="1"/>
            <div class="zp-load-value">${fmtPct(activeLoad)}</div>
          </div>
        </div>

<div class="zp-switch-grid">
          ${renderCompareMetricPct("Load Delta", cmp.loadPct, 1)}
          ${renderCompareMetric("Energy Delta", cmp.energy, "kWh", 2)}
          ${renderCompareMetric("Water Delta", cmp.water, "L", 0)}
          ${renderCompareMetric("CO₂ Delta", cmp.co2, "kg", 2)}
        </div>

        <div class="zp-impact-shell">
          <div class="zp-impact-card">
            <div class="zp-impact-label">Switch Impact Score</div>
            <div class="zp-impact-value ${impact.level.toLowerCase()}">${impact.level}</div>
            <div class="zp-impact-score">Score ${impact.score}</div>
          </div>

          <div class="zp-ai-card">
            <div class="zp-ai-title">AI Recommendation</div>
            <div class="zp-ai-text">${escapeHtml(aiText)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderRows(rows) {
    const el = $(BODY_ID);
    if (!el) return;

    const recommended = rows[0] || null;
    const alternatives = rows.slice(1);
    const selectedAlt = alternatives[0] || null;

    const optimizerPanel = renderOptimizerPanel(rows);

    const cards = rows.map((r, idx) => {
      
const tag = idx === 0
        ? "Best Option"
        : `Alternative ${idx}`;

      const vcls = verdictClass(r.verdict);
      const selectable = idx > 0 ? "is-clickable" : "is-recommended";
      const selected = selectedAlt && idx > 0 && r.machine === selectedAlt.machine ? "is-selected" : "";

      return `
        <div class="zp-alt-card ${selectable} ${selected}" data-index="${idx}">
          <div class="zp-alt-top">
            <div>
              <div class="zp-alt-machine">${escapeHtml(text(r.machine))}</div>
              <div class="zp-alt-tag">${escapeHtml(tag)}</div>
            </div>
            <div class="zp-pde-verdict ${vcls}">${escapeHtml(String(r.verdict).replaceAll("_", " "))}</div>
          </div>

          <div class="zp-alt-metrics">
            <div class="zp-alt-metric">
              <div class="zp-pde-label">Decision Score</div>
              <div class="zp-alt-value zp-score">${r.decisionScore == null ? "—" : fmtNumber(r.decisionScore, 1)}</div>
            </div>
            <div class="zp-alt-metric">
              <div class="zp-pde-label">Load</div>
              <div class="zp-alt-value">${fmtPct(r.loadPct)}</div>
            </div>
            <div class="zp-alt-metric">
              <div class="zp-pde-label">Energy</div>
              <div class="zp-alt-value">${fmtUnit(r.energy, "kWh", 2)}</div>
            </div>
            <div class="zp-alt-metric">
              <div class="zp-pde-label">CO₂</div>
              <div class="zp-alt-value">${fmtUnit(r.co2, "kg", 2)}</div>
            </div>
          </div>

          ${idx > 0 ? '<div class="zp-alt-click-hint">Click to simulate switch</div>' : ""}
        </div>
      `;
    }).join("");

    const simulation = recommended && selectedAlt
      ? renderSimulationPanel(recommended, selectedAlt, simulatedLoad)
      : "";

    el.innerHTML = `
      ${optimizerPanel}
<div class="zp-alt-grid">${cards}</div>
      ${simulation}
    `;

    el.querySelectorAll(".zp-alt-card.is-clickable").forEach(card => {
      card.addEventListener("click", () => {
        const idx = Number(card.dataset.index);
        if (!Number.isFinite(idx) || idx < 1 || !recommended || !rows[idx]) return;

        const newSelected = rows[idx];

        el.innerHTML = `
          <div class="zp-alt-grid">
            ${rows.map((r, rowIdx) => {
              const tag = rowIdx === 0 ? "Recommended" : `Alternative ${rowIdx}`;
              const vcls = verdictClass(r.verdict);
              const selectable = rowIdx > 0 ? "is-clickable" : "is-recommended";
              const selected = rowIdx > 0 && r.machine === newSelected.machine ? "is-selected" : "";

              return `
                <div class="zp-alt-card ${selectable} ${selected}" data-index="${rowIdx}">
                  <div class="zp-alt-top">
                    <div>
                      <div class="zp-alt-machine">${escapeHtml(text(r.machine))}</div>
                      <div class="zp-alt-tag">${escapeHtml(tag)}</div>
                    </div>
                    <div class="zp-pde-verdict ${vcls}">${escapeHtml(String(r.verdict).replaceAll("_", " "))}</div>
                  </div>

                  <div class="zp-alt-metrics">
            <div class="zp-alt-metric">
              <div class="zp-pde-label">Decision Score</div>
              <div class="zp-alt-value zp-score">${r.decisionScore == null ? "—" : fmtNumber(r.decisionScore, 1)}</div>
            </div>
                    <div class="zp-alt-metric">
                      <div class="zp-pde-label">Load</div>
                      <div class="zp-alt-value">${fmtPct(r.loadPct)}</div>
                    </div>
                    <div class="zp-alt-metric">
                      <div class="zp-pde-label">Energy</div>
                      <div class="zp-alt-value">${fmtUnit(r.energy, "kWh", 2)}</div>
                    </div>
                    <div class="zp-alt-metric">
                      <div class="zp-pde-label">CO₂</div>
                      <div class="zp-alt-value">${fmtUnit(r.co2, "kg", 2)}</div>
                    </div>
                  </div>

                  ${rowIdx > 0 ? '<div class="zp-alt-click-hint">Click to simulate switch</div>' : ""}
                </div>
              `;
            }).join("")}
          </div>
          ${renderSimulationPanel(recommended, newSelected)}
        `;

        renderRows(rows.map((r, rowIdx) => {
          if (rowIdx === 0) return r;
          return r;
        }));
        renderRowsWithSelected(rows, idx);
      });
    });

    const slider = document.getElementById("zpLoadSlider");
    if (slider) {
      slider.addEventListener("input", () => {
        const nextLoad = Number(slider.value);
        renderRowsWithSelected(rows, selectedIndex, nextLoad);
      });
    }

    attachStrategyHandler((originalAlternativeRows && originalAlternativeRows.length) ? originalAlternativeRows : rows);
    setBadge("Live Compare");
  }


  

  function scoreMachineCandidate(r){
    const load = Number(r.loadPct) || 0
    const energy = Number(r.energy) || 0
    const co2 = Number(r.co2) || 0
    const water = Number(r.water) || 0

    const loadPenalty = Math.abs(75 - load)

    const score =
      0.4 * loadPenalty +
      0.3 * energy +
      0.2 * co2 +
      0.1 * (water / 100)

    return Number(score.toFixed(1))
  }

  function rankMachineCandidates(rows){
    return rows
      .map(r => ({
        ...r,
        decisionScore: scoreMachineCandidate(r)
      }))
      .sort((a,b)=>a.decisionScore - b.decisionScore)
  }


  

function renderOptimizerPanel(rows){
  if(!rows || !rows.length) return ""

  const best = rows[0]
  const second = rows[1]

  const energyAdv = second ? ((second.energy - best.energy)/second.energy*100) : 0
  const co2Adv = second ? ((second.co2 - best.co2)/second.co2*100) : 0

  return `
  <div class="zp-optimizer-panel">
    <div class="zp-opt-title">Machine Optimizer</div>
<div class="zp-opt-strategy">
  <label class="zp-opt-label">Optimization Strategy</label>
  <select id="zpStrategySelect" class="zp-opt-select">
    <option value="balanced">Balanced</option>
    <option value="eco">Eco (Lowest CO₂)</option>
    <option value="energy">Energy (Lowest kWh)</option>
    <option value="capacity">Capacity (Best Load Fit)</option>
  </select>
</div>


    <div class="zp-opt-machine">
      Best Machine: <strong>${best.machine}</strong>
    </div>

    <div class="zp-opt-score">
      Decision Score: ${best.decisionScore == null ? "—" : fmtNumber(best.decisionScore, 1)}
    </div>

    <div class="zp-opt-adv">
      Energy Advantage: ${energyAdv.toFixed(1)}%
    </div>

    <div class="zp-opt-adv">
      CO₂ Advantage: ${co2Adv.toFixed(1)}%
    </div>

    <div class="zp-opt-recommend">
      Recommendation: Use ${best.machine} for this order.
    </div>
  </div>
  `
}

function renderRowsWithSelected(rows, selectedIndex, simulatedLoad = null) {
    const el = $(BODY_ID);
    if (!el) return;

    const recommended = rows[0] || null;
    const selectedAlt = rows[selectedIndex] || null;
    const activeLoad = Number.isFinite(Number(simulatedLoad))
      ? Number(simulatedLoad)
      : (selectedAlt && num(selectedAlt.loadPct) !== null ? num(selectedAlt.loadPct) : 75);

    const optimizerPanel = renderOptimizerPanel(rows);

    const cards = rows.map((r, idx) => {
      
const tag = idx === 0
        ? "Best Option"
        : `Alternative ${idx}`;

      const vcls = verdictClass(r.verdict);
      const selectable = idx > 0 ? "is-clickable" : "is-recommended";
      const selected = idx === selectedIndex ? "is-selected" : "";

      return `
        <div class="zp-alt-card ${selectable} ${selected}" data-index="${idx}">
          <div class="zp-alt-top">
            <div>
              <div class="zp-alt-machine">${escapeHtml(text(r.machine))}</div>
              <div class="zp-alt-tag">${escapeHtml(tag)}</div>
            </div>
            <div class="zp-pde-verdict ${vcls}">${escapeHtml(String(r.verdict).replaceAll("_", " "))}</div>
          </div>

          <div class="zp-alt-metrics">
            <div class="zp-alt-metric">
              <div class="zp-pde-label">Decision Score</div>
              <div class="zp-alt-value zp-score">${r.decisionScore == null ? "—" : fmtNumber(r.decisionScore, 1)}</div>
            </div>
            <div class="zp-alt-metric">
              <div class="zp-pde-label">Load</div>
              <div class="zp-alt-value">${fmtPct(r.loadPct)}</div>
            </div>
            <div class="zp-alt-metric">
              <div class="zp-pde-label">Energy</div>
              <div class="zp-alt-value">${fmtUnit(r.energy, "kWh", 2)}</div>
            </div>
            <div class="zp-alt-metric">
              <div class="zp-pde-label">CO₂</div>
              <div class="zp-alt-value">${fmtUnit(r.co2, "kg", 2)}</div>
            </div>
          </div>

          ${idx > 0 ? '<div class="zp-alt-click-hint">Click to simulate switch</div>' : ""}
        </div>
      `;
    }).join("");

    const simulation = recommended && selectedAlt
      ? renderSimulationPanel(recommended, selectedAlt, activeLoad)
      : "";

    el.innerHTML = `
      ${optimizerPanel}
<div class="zp-alt-grid">${cards}</div>
      ${simulation}
    `;

    el.querySelectorAll(".zp-alt-card.is-clickable").forEach(card => {
      card.addEventListener("click", () => {
        const idx = Number(card.dataset.index);
        if (!Number.isFinite(idx) || idx < 1) return;
        renderRowsWithSelected(rows, idx);
      });
    });

    const slider = document.getElementById("zpLoadSlider");
    if (slider) {
      slider.addEventListener("input", () => {
        const nextLoad = Number(slider.value);
        const valueEl = el.querySelector(".zp-load-value");
        if (valueEl) valueEl.textContent = fmtPct(nextLoad);
        renderRowsWithSelected(rows, selectedIndex, nextLoad);
      });
    }

    attachStrategyHandler((originalAlternativeRows && originalAlternativeRows.length) ? originalAlternativeRows : rows);
    setBadge("Live Compare");
  }

  async function init() {
    const panel = $(PANEL_ID);
    if (!panel) return;

    renderLoading();

    try {
      const rows = await fetchRowsViaRest();
      if (!rows || !rows.length) return renderEmpty();

      const chosenRaw = chooseRows(rows);
      const chosen = rankMachineCandidates(chosenRaw);
      if (!chosen.length) return renderEmpty();

      console.log("[PDE ALT] rows =", chosen);
      originalAlternativeRows = Array.isArray(chosen) ? [...chosen] : [];
      const ranked = rankMachinesByStrategy(originalAlternativeRows, currentStrategy);
      if (window.__ZP_ALT_RENDER_ROWS_WITH_SELECTED__) {
      window.__ZP_ALT_RENDER_ROWS_WITH_SELECTED__(ranked, ranked[1] ? 1 : 0);
    }

      attachStrategyHandler(ranked);
    } catch (err) {
      console.error("[PDE ALT] init failed:", err);
      renderError(err && err.message ? err.message : "Unknown error");
    }
  }

  window.__ZP_ALT_RENDER_ROWS_WITH_SELECTED__ = renderRowsWithSelected;
  window.__ZP_ALT_INIT__ = init;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
