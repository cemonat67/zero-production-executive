(function(){
  const page = document.body.dataset.page || "executive";

  const DATA = {
    ceo: {
      title: "CEO Strategic Sustainability Overview",
      subtitle: "Board-level sustainability visibility, risk posture and decision narrative for Ekoten sales demo.",
      eyebrow: "Executive layer",
      kpis: [
        { label: "CO₂ Intensity", value: "1.84 kg/kg", note: "vs baseline 2.06 kg/kg" },
        { label: "Operational Risk", value: "Moderate", note: "2 areas need follow-up" },
        { label: "Decision Readiness", value: "87%", note: "demo-safe confidence" },
        { label: "Improvement Opportunity", value: "€148K", note: "annual potential" }
      ],
      status: [
        { label: "Sustainability trajectory", badge: "Improving", tone: "green" },
        { label: "Compliance pressure", badge: "Monitor", tone: "orange" },
        { label: "Cross-functional readiness", badge: "Aligned", tone: "blue" }
      ],
      metrics: [
        ["CO₂ Trajectory", "-10.7% vs prior reference period"],
        ["Energy Productivity", "+8.4% improvement"],
        ["Water Efficiency", "+6.1% improvement"],
        ["Executive Escalation Level", "Low to Medium"]
      ],
      chart: {
        labels: ["Q1","Q2","Q3","Q4","Q5","Q6"],
        values: [92, 88, 83, 79, 74, 69],
        tone: "green",
        valueSuffix: " index"
      },
      narrative: "Zero@Production presents a clear executive story: the factory is moving toward better sustainability performance while preserving operational continuity. The current signal is not crisis; it is controlled pressure. Carbon intensity is trending downward, resource productivity is improving, and the decision system is now strong enough to support board-level action. The real leadership question is not whether action is needed, but how fast Ekoten wants to turn visible improvement into commercial advantage for customers, audits and future compliance positioning.",
      sideTitle: "Executive decision narrative",
      sideText: "Recommendation: position Zero@Production as a management decision layer, not just a reporting screen. For Ekoten executives, the strongest sales-demo message is that sustainability, production and financial impact are finally speaking the same language."
    },
    cfo: {
      title: "CFO Financial Exposure & Impact View",
      subtitle: "Financial exposure, carbon cost scenarios and wastewater-linked penalty visibility for executive review.",
      eyebrow: "Financial layer",
      kpis: [
        { label: "Estimated Exposure", value: "€214K", note: "annualized demo scenario" },
        { label: "Carbon Scenario", value: "€80/t", note: "mid-case reference" },
        { label: "Wastewater Penalty Risk", value: "Watchlist", note: "2 risk flags" },
        { label: "Savings Potential", value: "€96K", note: "resource optimization" }
      ],
      status: [
        { label: "Carbon pricing sensitivity", badge: "High", tone: "red" },
        { label: "Wastewater exposure", badge: "Monitor", tone: "orange" },
        { label: "Cost optimization visibility", badge: "Good", tone: "green" }
      ],
      metrics: [
        ["Scenario @ €50/t", "€138K equivalent exposure"],
        ["Scenario @ €80/t", "€214K equivalent exposure"],
        ["Scenario @ €120/t", "€301K equivalent exposure"],
        ["Estimated annual savings", "€96K - €148K"]
      ],
      chart: {
        labels: ["€50","€80","€120","Penalty","Energy","Water"],
        values: [46, 72, 100, 58, 63, 41],
        tone: "orange",
        valueSuffix: " risk"
      },
      narrative: "From a CFO lens, the strongest value of Zero@Production is not merely carbon reporting. It is cost visibility under pressure. The platform translates sustainability exposure into financial language: carbon pricing sensitivity, wastewater penalty risk, and operating-cost reduction opportunity. In the Ekoten sales demo, this is the money slide. It shows that delayed action is not neutral. Delay has a price, and disciplined improvement has measurable upside.",
      sideTitle: "Financial action note",
      sideText: "Recommendation: use this page to frame a business case. The platform can support cost avoidance, budget prioritization, and customer-facing reporting with one executive workflow."
    },
    cto: {
      title: "CTO System Health & Production Intelligence",
      subtitle: "System stability, production decision engine readiness and data pipeline confidence in one technical leadership view.",
      eyebrow: "Technology layer",
      kpis: [
        { label: "System Health", value: "98.2%", note: "demo-safe availability" },
        { label: "Decision Engine", value: "Active", note: "machine recommendation live" },
        { label: "Machine Utilization", value: "81%", note: "balanced load view" },
        { label: "Pipeline Confidence", value: "89%", note: "validated feed quality" }
      ],
      status: [
        { label: "API / fallback status", badge: "Demo-safe", tone: "green" },
        { label: "Data freshness", badge: "Near-live", tone: "blue" },
        { label: "Integration pressure", badge: "Contained", tone: "orange" }
      ],
      metrics: [
        ["Production decision engine", "Running with fallback support"],
        ["Machine recommendation coverage", "12 lines / 34 scenarios"],
        ["Data pipeline status", "Validated, mapped, replay-capable"],
        ["Operational issue severity", "No critical blockers"]
      ],
      chart: {
        labels: ["Line A","Line B","Line C","Line D","Line E","Line F"],
        values: [78, 84, 69, 88, 81, 74],
        tone: "blue",
        valueSuffix: "%"
      },
      narrative: "The CTO story is clean: the system is stable enough to demonstrate real operational intelligence without exposing fragile architecture. Zero@Production already connects production logic, machine-level decision support and executive reporting. For the sales demo, the key message is maturity. This is not a conceptual mockup pretending to be a platform. It behaves like an operating layer with clear fallback logic, structured data handling and decision visibility that leadership can trust.",
      sideTitle: "Technical positioning note",
      sideText: "Recommendation: present the stack as pragmatic and extensible. The system already supports demo-safe operation without live dependency, which is exactly what a serious executive demo needs."
    }
  };

  const cfg = DATA[page] || DATA.ceo;

  function renderKpis(items){
    return items.map(item => `
      <div class="kpi">
        <div class="kpi-label">${item.label}</div>
        <div class="kpi-value">${item.value}</div>
        <div class="kpi-note">${item.note}</div>
      </div>
    `).join("");
  }

  function renderStatus(items){
    return items.map(item => `
      <div class="status-pill">
        <strong>${item.label}</strong>
        <span class="badge ${item.tone}">${item.badge}</span>
      </div>
    `).join("");
  }

  function renderMetrics(items){
    return items.map(([label,value]) => `
      <div class="metric-item">
        <div class="label">${label}</div>
        <div class="value">${value}</div>
      </div>
    `).join("");
  }

  function renderBars(chart){
    const max = Math.max(...chart.values, 1);
    const toneClass = chart.tone === "green" ? "green" : chart.tone === "blue" ? "blue" : "";
    return chart.values.map((v, i) => {
      const h = Math.max(14, Math.round((v / max) * 170));
      return `
        <div class="bar-wrap">
          <div class="bar-value">${v}${chart.valueSuffix || ""}</div>
          <div class="bar ${toneClass}" style="height:${h}px"></div>
          <div class="bar-label">${chart.labels[i]}</div>
        </div>
      `;
    }).join("");
  }

  document.getElementById("eyebrow").textContent = cfg.eyebrow;
  document.getElementById("pageTitle").textContent = cfg.title;
  document.getElementById("pageSubtitle").textContent = cfg.subtitle;
  document.getElementById("heroTitle").textContent = cfg.title;
  document.getElementById("heroText").textContent = cfg.narrative;
  document.getElementById("kpiGrid").innerHTML = renderKpis(cfg.kpis);
  document.getElementById("statusRow").innerHTML = renderStatus(cfg.status);
  document.getElementById("metricList").innerHTML = renderMetrics(cfg.metrics);
  document.getElementById("chartBars").innerHTML = renderBars(cfg.chart);
  document.getElementById("sideTitle").textContent = cfg.sideTitle;
  document.getElementById("sideText").textContent = cfg.sideText;
  document.getElementById("decisionNarrative").textContent = cfg.narrative;

  const btnPdf = document.getElementById("btnExportPdf");
  if (btnPdf) {
    btnPdf.addEventListener("click", function(){
      window.print();
    });
  }
})();
