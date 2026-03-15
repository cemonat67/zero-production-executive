(function(){
  if (!window.FactoryOS) return;

  const activeSignals = new Set();
  const signalMeta = new Map();
  const previousSnapshot = {
    energy_kwh: null,
    water_m3: null,
    load_pct: null
  };

  const THRESHOLDS = {
    energy_kwh: 1500,
    water_m3: 40,
    load_pct: 85
  };

  const COOLDOWN_MS = 60000;

  function now(){
    return Date.now();
  }

  function readNumber(v){
    return Number.isFinite(Number(v)) ? Number(v) : null;
  }

  function inCooldown(type){
    const meta = signalMeta.get(type);
    if (!meta || !meta.lastTriggeredAt) return false;
    return (now() - meta.lastTriggeredAt) < COOLDOWN_MS;
  }

  function markTriggered(type){
    const meta = signalMeta.get(type) || {};
    meta.lastTriggeredAt = now();
    signalMeta.set(type, meta);
    activeSignals.add(type);
  }

  function clearSignal(type){
    if (!activeSignals.has(type)) return;

    activeSignals.delete(type);

    const latest = [...(FactoryOS.state.signals || [])]
      .reverse()
      .find(sig => sig && sig.type === type);

    if (latest && typeof FactoryOS.pushResolvedSignal === "function") {
      FactoryOS.pushResolvedSignal({
        type: latest.type,
        level: latest.level,
        severity: latest.severity || "medium",
        message: latest.message || "Signal resolved",
        source_signal_id: latest.id || null
      });
    }
  }

  function emitSignal(type, level, message, severity){
    if (inCooldown(type)) {
      return;
    }
    markTriggered(type);
    FactoryOS.pushSignal({
      type,
      level,
      severity: severity || "medium",
      message,
      ts: new Date().toISOString()
    });
  }

  function checkEnergy(s){
    const energy = readNumber(s?.utilities?.energy_kwh);
    const prev = previousSnapshot.energy_kwh;
    previousSnapshot.energy_kwh = energy;

    if (energy == null) return;

    const risingFast = prev != null && energy > prev * 1.15;
    const overLimit = energy > THRESHOLDS.energy_kwh;

    if (overLimit || risingFast){
      emitSignal(
        "energy_spike",
        "CFO",
        overLimit
          ? "Energy consumption above expected range"
          : "Energy consumption rising unusually fast",
        overLimit ? "high" : "medium"
      );
    } else {
      clearSignal("energy_spike");
    }
  }

  function checkWater(s){
    const water = readNumber(s?.utilities?.water_m3);
    const prev = previousSnapshot.water_m3;
    previousSnapshot.water_m3 = water;

    if (water == null) return;

    const risingFast = prev != null && water > prev * 1.12;
    const overLimit = water > THRESHOLDS.water_m3;

    if (overLimit || risingFast){
      emitSignal(
        "water_usage_high",
        "CEO",
        overLimit
          ? "Water consumption anomaly detected"
          : "Water consumption trend worsening",
        overLimit ? "high" : "medium"
      );
    } else {
      clearSignal("water_usage_high");
    }
  }

  function checkLoad(s){
    const load = readNumber(s?.production?.load_pct);
    const prev = previousSnapshot.load_pct;
    previousSnapshot.load_pct = load;

    if (load == null) return;

    const risingFast = prev != null && load > prev + 8;
    const overLimit = load > THRESHOLDS.load_pct;

    if (overLimit || risingFast){
      emitSignal(
        "machine_overload",
        "CTO",
        overLimit
          ? "Machine load critical"
          : "Machine load increasing abnormally",
        overLimit ? "critical" : "high"
      );
    } else {
      clearSignal("machine_overload");
    }
  }

  function evaluateSignals(){
    const s = FactoryOS.state;
    if (!s) return;

    checkEnergy(s);
    checkWater(s);
    checkLoad(s);

  }

  setTimeout(evaluateSignals, 2000);
  setInterval(evaluateSignals, 4000);

  function applyPersonaSignal(cardSel, badgeSel, sig, normalText){
    const card = document.querySelector(cardSel);
    const badge = document.querySelector(badgeSel);

    if (badge) {
      badge.textContent = sig ? String(sig.severity || "medium").toUpperCase() : normalText;
      badge.classList.remove("ok", "monitor", "critical");
      if (!sig) {
        badge.classList.add("ok");
      } else if (sig.severity === "critical") {
        badge.classList.add("critical");
      } else {
        badge.classList.add("monitor");
      }
    }

    if (card) {
      card.style.boxShadow = sig
        ? (sig.severity === "critical"
            ? "0 0 0 2px rgba(255,82,82,0.75)"
            : "0 0 0 2px rgba(249,186,0,0.65)")
        : "";
      card.setAttribute("data-signal-type", sig?.type || "none");
      card.setAttribute("data-signal-severity", sig?.severity || "normal");
    }
  }

  setInterval(() => {
    if (!window.FactoryOS) return;

    const signals = FactoryOS.state.signals || [];
    const latestByType = new Map();

    signals.forEach(sig => {
      if (sig && sig.type) latestByType.set(sig.type, sig);
    });

    applyPersonaSignal("#execCardCFO", "#cfoBadge", latestByType.get("energy_spike"), "OK");
    applyPersonaSignal("#execCardCEO", "#ceoBadge", latestByType.get("water_usage_high"), "OK");
    applyPersonaSignal("#execCardCTO", "#ctoBadge", latestByType.get("machine_overload"), "OK");

    if (typeof window.applyEnvironmentalExecutiveEmphasis === "function") {
      window.applyEnvironmentalExecutiveEmphasis();
    }
  }, 2000);

})();
