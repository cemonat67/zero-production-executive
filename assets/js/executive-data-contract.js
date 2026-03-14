(function () {
  const DEFAULTS = {
    summary: {},
    signals: [],
    anomalies: [],
    recommended_actions: [],
    optimization_decision: {},
    facility_twin: {},
    financial_view: {},
    selected_order: {},
    recommended_machine: {},
    candidate_machines: [],
    decision_summary: {},
    risk_signals: []
  };

  function num(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function arr(v) {
    return Array.isArray(v) ? v : [];
  }

  function obj(v) {
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  }

  function pickFinancialView(payload, decision) {
    return obj(
      payload.financial_view ||
      decision.financial_view ||
      payload.executive_financial_view ||
      {}
    );
  }

  function pickSelectedOrder(payload, decision, twin) {
    return obj(
      payload.selected_order ||
      decision.selected_order ||
      twin.selected_order ||
      {}
    );
  }

  function pickRecommendedMachine(payload, decision) {
    return obj(
      decision.recommended_machine ||
      payload.recommended_machine ||
      {}
    );
  }

  function pickCandidateMachines(payload, decision, twin) {
    return arr(
      decision.candidate_machines ||
      payload.candidate_machines ||
      twin.candidate_machines ||
      twin.machines ||
      []
    );
  }

  function buildDecisionSummary(decision, recommendedMachine) {
    return {
      strategy: decision.strategy || "balanced",
      score: num(decision.score, null),
      capacity_compatible:
        decision.capacity_compatible ??
        recommendedMachine.capacity_compatible ??
        null,
      decision_note:
        decision.decision_note ||
        recommendedMachine.decision_note ||
        "",
      confidence_score: num(
        decision.confidence_score ?? recommendedMachine.confidence_score,
        null
      ),
      confidence_band:
        decision.confidence_band ||
        recommendedMachine.confidence_band ||
        "",
      confidence_reason:
        decision.confidence_reason ||
        recommendedMachine.confidence_reason ||
        ""
    };
  }

  function normalizeMachine(machine) {
    const m = obj(machine);
    return {
      machine: m.machine || m.name || m.asset_id || "-",
      score: num(m.score, null),
      rank: num(m.rank, null),
      load_pct: num(m.load_pct, null),
      capacity_kg: num(m.capacity_kg, null),
      available_capacity_kg: num(m.available_capacity_kg, null),
      energy_kwh: num(m.energy_kwh, null),
      water_m3: num(m.water_m3, null),
      co2_kg: num(m.co2_kg, null),
      delta_energy_kwh: num(m.delta_energy_kwh, null),
      delta_water_m3: num(m.delta_water_m3, null),
      delta_co2_kg: num(m.delta_co2_kg, null),
      decision_note: m.decision_note || "",
      capacity_compatible: m.capacity_compatible ?? null
    };
  }

  function normalizeBrainPayload(payload) {
    payload = obj(payload);

    const summary = obj(payload.summary);
    const signals = arr(payload.signals);
    const anomalies = arr(payload.anomalies);
    const recommended_actions = arr(payload.recommended_actions);
    const optimization_decision = obj(payload.optimization_decision);
    const facility_twin = obj(payload.facility_twin);

    const selected_order = pickSelectedOrder(payload, optimization_decision, facility_twin);
    const recommended_machine = normalizeMachine(
      pickRecommendedMachine(payload, optimization_decision)
    );
    const candidate_machines = pickCandidateMachines(
      payload,
      optimization_decision,
      facility_twin
    ).map(normalizeMachine);

    const decision_summary = buildDecisionSummary(
      optimization_decision,
      recommended_machine
    );

    const financial_view = pickFinancialView(payload, optimization_decision);

    return {
      ...DEFAULTS,
      status: payload.status || "OK",
      mode: payload.mode || "live",
      recommendation: payload.recommended_action || payload.recommendation || summary.short_text || "",
      reasons: signals.map(s => s.message || s.code),
      lastUpdated: payload.last_updated || payload.updated_at || new Date().toISOString(),
      summary,
      signals,
      anomalies,
      recommended_actions,
      optimization_decision,
      facility_twin,
      financial_view,
      selected_order,
      recommended_machine,
      candidate_machines,
      decision_summary,
      risk_signals: signals
    };
  }

  window.ZeroExecutiveDataContract = {
    normalizeBrainPayload
  };
})();
