(function () {
  const PANEL_ID = "zpProductionDecisionEngine";
  const BODY_ID = "zpPdeBody";
  const TITLE_BADGE_ID = "zpPdeBadge";

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

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
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
      orderId: pick(row, ["production_order_id", "order_id", "order_no", "order_code"], "—"),
      customer: pick(row, ["customer", "customer_name", "brand", "brand_name"], "—"),
      recommendedMachine: pick(row, [
        "recommended_asset_code",
        "recommended_asset_label",
        "recommended_machine",
        "machine_id",
        "machine_name",
        "recommended_machine_id"
      ], "—"),
      machineCapacity: num(pick(row, [
        "recommended_capacity_kg",
        "machine_capacity",
        "machine_capacity_kg",
        "capacity_kg"
      ], null)),
      loadPct: num(pick(row, [
        "recommended_load_pct",
        "load_pct",
        "load_percent",
        "load_percentage",
        "machine_load_pct",
        "utilization_pct"
      ], null)),
      capacityVerdict: pick(row, ["capacity_verdict", "capacity_status", "fit_verdict"], null),
      estimatedWaterL: num(pick(row, [
        "estimated_water_l",
        "estimated_water",
        "estimated_water_liters"
      ], null)),
      estimatedEnergy: num(pick(row, [
        "estimated_energy_kwh",
        "estimated_energy",
        "energy_est_kwh"
      ], null)),
      estimatedCo2: num(pick(row, [
        "estimated_co2_kg",
        "estimated_co2",
        "co2_est_kg"
      ], null)),
      decisionNote: pick(row, [
        "decision_note",
        "short_decision_note",
        "recommendation_note",
        "note"
      ], "No decision note available."),
      raw: row
    };
  }

  function verdictClass(v, loadPct) {
    const s = String(v || "").toLowerCase();
    if (s.includes("ok")) return "ok";
    if (s.includes("alert") || s.includes("over") || s.includes("exceed") || s.includes("risk")) return "alert";
    if (s.includes("monitor") || s.includes("near")) return "monitor";

    const lp = num(loadPct);
    if (lp === null) return "monitor";
    if (lp < 85) return "ok";
    if (lp < 100) return "monitor";
    return "alert";
  }

  function verdictText(v, loadPct) {
    if (v && String(v).trim()) return String(v).replaceAll("_", " ");
    const lp = num(loadPct);
    if (lp === null) return "Monitor";
    if (lp < 85) return "Within Capacity";
    if (lp < 100) return "Near Limit";
    return "Over Capacity";
  }

  function setBadge(textValue) {
    const el = $(TITLE_BADGE_ID);
    if (el) el.textContent = textValue;
  }

  function renderLoading() {
    const el = $(BODY_ID);
    if (!el) return;
    el.innerHTML = '<div class="zp-pde-loading">Loading Production Decision Engine…</div>';
  }

  function renderError(message) {
    const el = $(BODY_ID);
    if (!el) return;
    el.innerHTML = `<div class="zp-pde-error">Production Decision Engine failed: ${escapeHtml(message)}</div>`;
    setBadge("Unavailable");
  }

  function renderEmpty() {
    const el = $(BODY_ID);
    if (!el) return;
    el.innerHTML = '<div class="zp-pde-empty">No rows found in <strong>v_production_decision_engine</strong>.</div>';
    setBadge("No Data");
  }

  

function renderRow(view) {
    const el = $(BODY_ID);
    if (!el) return;

    const verdict = verdictText(view.capacityVerdict, view.loadPct);
    const verdictCls = verdictClass(view.capacityVerdict, view.loadPct);
    const loadWidth = clamp(num(view.loadPct) || 0, 0, 100);

    el.innerHTML = `
      <div class="zp-pde-grid">
        <div class="zp-pde-card">
          <div class="zp-pde-topline">
            <div>
              <div class="zp-pde-order">${escapeHtml(text(view.orderId))}</div>
              <div class="zp-pde-customer">Customer: <strong>${escapeHtml(text(view.customer))}</strong></div>
            </div>
            <div class="zp-pde-machine">
              <div class="zp-pde-machine-label">Recommended Machine</div>
              <div class="zp-pde-machine-value">${escapeHtml(text(view.recommendedMachine))}</div>
            </div>
          </div>

          <div class="zp-pde-stats">
            <div class="zp-pde-stat">
              <div class="zp-pde-label">Machine Capacity</div>
              <div class="zp-pde-value">${view.machineCapacity === null ? "—" : fmtUnit(view.machineCapacity, "kg", 0)}</div>
            </div>
            <div class="zp-pde-stat">
              <div class="zp-pde-label">Estimated Water</div>
              <div class="zp-pde-value">${view.estimatedWaterL === null ? "—" : fmtUnit(view.estimatedWaterL, "L", 0)}</div>
            </div>
            <div class="zp-pde-stat">
              <div class="zp-pde-label">Estimated Energy</div>
              <div class="zp-pde-value">${view.estimatedEnergy === null ? "—" : fmtUnit(view.estimatedEnergy, "kWh", 2)}</div>
            </div>
          </div>

          <div class="zp-pde-note">
            ${escapeHtml(text(view.decisionNote))}
          </div>
        </div>

        <div class="zp-pde-side">
          <div class="zp-pde-load-card">
            <div class="zp-pde-load-row">
              <div>
                <div class="zp-pde-label">Load</div>
                <div class="zp-pde-load-big">${fmtPct(view.loadPct)}</div>
              </div>
              <div class="zp-pde-verdict ${verdictCls}">${escapeHtml(verdict)}</div>
            </div>

            <div class="zp-pde-bar" aria-label="Machine Load Percentage">
              <span style="width:${loadWidth}%"></span>
            </div>
          </div>

          <div class="zp-pde-mini-grid">
            <div class="zp-pde-mini">
              <div class="zp-pde-label">Capacity Verdict</div>
              <div class="zp-pde-value">${escapeHtml(verdict)}</div>
            </div>
            <div class="zp-pde-mini">
              <div class="zp-pde-label">Estimated CO₂</div>
              <div class="zp-pde-value">${view.estimatedCo2 === null ? "—" : fmtUnit(view.estimatedCo2, "kg", 2)}</div>
            </div>
          </div>
        </div>

      </div>
    `;

    setBadge("Live View");
  }

  async function fetchRowsViaRest() {
    const { url, key } = resolveSupabaseConfig();
    if (!url || !key) {
      throw new Error("Supabase config not found on page.");
    }

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

  function chooseRow(rows) {
    if (!Array.isArray(rows) || !rows.length) return null;

    const normalized = rows.map(normalizeRow);
    const ua = normalized.find(r => String(r.customer || "").toLowerCase().includes("under armour"));
    return ua || normalized[0];
  }

  async function init() {
    const panel = $(PANEL_ID);
    if (!panel) return;

    renderLoading();

    try {
      const rows = await fetchRowsViaRest();
      if (!rows || !rows.length) return renderEmpty();

      const selected = chooseRow(rows);
      if (!selected) return renderEmpty();

      console.log("[PDE] selected row =", selected);
      renderRow(selected);
    } catch (err) {
      console.error("[PDE] init failed:", err);
      renderError(err && err.message ? err.message : "Unknown error");
    }
  }

  window.__ZP_PDE_INIT__ = init;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
