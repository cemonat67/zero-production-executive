(function () {
  "use strict";

  const REPORT_TYPES = {
    executive_summary: {
      key: "executive_summary",
      title: "Executive Summary",
      subtitle: "Board-level snapshot of production, sustainability and financial signals.",
      filename: "zero-production-executive-summary.pdf"
    },
    financial_impact: {
      key: "financial_impact",
      title: "Financial Impact Report",
      subtitle: "Cost exposure, savings potential and operational finance view.",
      filename: "zero-production-financial-impact-report.pdf"
    },
    sustainability_compliance: {
      key: "sustainability_compliance",
      title: "Sustainability Compliance Report",
      subtitle: "Compliance posture, sustainability KPI signals and audit-ready summary.",
      filename: "zero-production-sustainability-compliance-report.pdf"
    },
    production_efficiency: {
      key: "production_efficiency",
      title: "Production Efficiency Report",
      subtitle: "Machine utilization, process stability and throughput efficiency overview.",
      filename: "zero-production-production-efficiency-report.pdf"
    }
  };

  const DEMO_DATA = {
    facility: "Ekoten Demo Facility",
    generatedAt: new Date(),
    kpis: {
      productionVolume: "42.8 t/day",
      energyUse: "18.4 MWh/day",
      waterUse: "312 m³/day",
      co2Impact: "9.6 tCO₂e/day",
      costExposure: "€14,800/month",
      projectedSavings: "€4,200/month",
      complianceScore: "92/100",
      oee: "84.7%"
    },
    highlights: [
      "Energy intensity remains within expected executive threshold band.",
      "Water and CO₂ signals indicate stable sustainability performance in current scenario.",
      "Machine allocation quality supports a balanced cost-versus-capacity decision pattern.",
      "The current production mix is suitable for board-level demo storytelling."
    ],
    risks: [
      "Carbon cost exposure may increase under tighter buyer compliance expectations.",
      "Water-intensive batches may reduce efficiency if machine switch discipline weakens.",
      "Manual reporting flow can slow executive response time in real operations."
    ],
    actions: [
      "Prioritize digital executive reporting for weekly board review.",
      "Track machine alternative decisions with cost and CO₂ trade-off visibility.",
      "Use one-click PDF reporting for sales demo, CFO meeting and compliance narrative."
    ]
  };

  const state = {
    activeType: REPORT_TYPES.executive_summary.key,
    modal: null
  };

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(date) {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }).format(date);
    } catch (err) {
      return String(date);
    }
  }

  function ensureStyles() {
    if (document.getElementById("zp-report-generator-styles")) return;

    const style = document.createElement("style");
    style.id = "zp-report-generator-styles";
    style.textContent = `
      .zp-report-modal-overlay{
        position:fixed;
        inset:0;
        background:rgba(3,8,20,.72);
        backdrop-filter:blur(6px);
        display:none;
        align-items:center;
        justify-content:center;
        z-index:9999;
        padding:24px;
      }
      .zp-report-modal-overlay.is-open{ display:flex; }
      .zp-report-modal{
        width:min(980px, 96vw);
        max-height:92vh;
        overflow:auto;
        border:1px solid rgba(255,255,255,.08);
        border-radius:22px;
        background:linear-gradient(180deg, rgba(10,16,29,.98), rgba(6,10,18,.98));
        box-shadow:0 30px 80px rgba(0,0,0,.45);
        color:#eaf1ff;
      }
      .zp-report-modal-header{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:18px;
        padding:24px 24px 16px;
        border-bottom:1px solid rgba(255,255,255,.07);
      }
      .zp-report-modal-title{
        font-size:22px;
        font-weight:500;
        letter-spacing:.2px;
      }
      .zp-report-modal-subtitle{
        margin-top:6px;
        color:rgba(234,241,255,.72);
        font-size:14px;
        line-height:1.5;
      }
      .zp-report-close{
        appearance:none;
        border:1px solid rgba(255,255,255,.1);
        background:rgba(255,255,255,.04);
        color:#fff;
        border-radius:12px;
        padding:10px 14px;
        cursor:pointer;
      }
      .zp-report-modal-body{
        padding:22px 24px 26px;
      }
      .zp-report-type-grid{
        display:grid;
        grid-template-columns:repeat(2, minmax(0,1fr));
        gap:14px;
      }
      .zp-report-type-card{
        border:1px solid rgba(255,255,255,.08);
        border-radius:18px;
        background:rgba(255,255,255,.03);
        padding:16px;
        cursor:pointer;
        transition:.18s ease;
      }
      .zp-report-type-card:hover{
        transform:translateY(-1px);
        border-color:rgba(249,186,0,.35);
        background:rgba(249,186,0,.06);
      }
      .zp-report-type-card.is-active{
        border-color:rgba(249,186,0,.7);
        box-shadow:0 0 0 1px rgba(249,186,0,.22) inset;
        background:linear-gradient(180deg, rgba(249,186,0,.11), rgba(255,255,255,.03));
      }
      .zp-report-type-title{
        font-size:16px;
        font-weight:500;
        color:#fff;
      }
      .zp-report-type-text{
        margin-top:8px;
        color:rgba(234,241,255,.7);
        font-size:13px;
        line-height:1.5;
      }
      .zp-report-actions{
        display:flex;
        flex-wrap:wrap;
        gap:12px;
        margin-top:20px;
      }
      .zp-report-btn{
        appearance:none;
        border:none;
        border-radius:14px;
        padding:12px 16px;
        cursor:pointer;
        font-weight:500;
        letter-spacing:.2px;
      }
      .zp-report-btn-primary{
        background:#f9ba00;
        color:#0d1117;
      }
      .zp-report-btn-secondary{
        background:rgba(255,255,255,.08);
        color:#fff;
        border:1px solid rgba(255,255,255,.08);
      }
      .zp-report-preview{
        margin-top:22px;
        border:1px solid rgba(255,255,255,.08);
        border-radius:20px;
        background:rgba(255,255,255,.025);
        overflow:hidden;
      }
      .zp-report-preview-head{
        padding:18px 20px;
        border-bottom:1px solid rgba(255,255,255,.06);
        background:rgba(255,255,255,.03);
      }
      .zp-report-preview-kicker{
        color:#f9ba00;
        font-size:12px;
        font-weight:500;
        text-transform:uppercase;
        letter-spacing:.12em;
      }
      .zp-report-preview-title{
        margin-top:8px;
        font-size:22px;
letter-spacing:0.02em;
        font-weight:500;
      }
      .zp-report-preview-meta{
        margin-top:8px;
        color:rgba(234,241,255,.68);
        font-size:13px;
      }
      .zp-report-brand-row{
        display:flex;
        align-items:center;
        justify-content:flex-start;
        gap:10px;
        margin-bottom:8px;
      }
      .zp-report-brand-logo{
        width:42px;
        height:42px;
        display:block;
        flex:0 0 36px;
        border-radius:2px;
        background:#02154e;
      }
      .zp-report-brand-mark{
        font-size:20px;
        font-weight:500;
        letter-spacing:.01em;
        line-height:1;
      }
      .zp-brand-zero{
        color:#02154e;
      }
      .zp-brand-at{
        color:#f9ba00;
      }
      .zp-brand-prod{
        color:#02154e;
      }
      .zp-report-preview-body{
        padding:20px;
      }
      .zp-report-kpi-grid{
        display:grid;
        grid-template-columns:repeat(2, minmax(0,1fr));
        gap:12px;
        margin-bottom:18px;
      }
      .zp-report-kpi{
        border:1px solid rgba(255,255,255,.07);
        border-radius:16px;
        padding:14px;
        background:rgba(255,255,255,.03);
      }
      .zp-report-kpi-label{
        color:rgba(234,241,255,.65);
        font-size:12px;
        text-transform:uppercase;
        letter-spacing:.08em;
      }
      .zp-report-kpi-value{
        margin-top:8px;
        color:#fff;
        font-size:22px;
        font-weight:500;
      }
      .zp-report-section{
        margin-top:18px;
      }
      .zp-report-section-title{
        font-size:15px;
        font-weight:500;
        margin-bottom:10px;
      }
      .zp-report-list{
        margin:0;
        padding-left:18px;
        color:rgba(234,241,255,.82);
        line-height:1.65;
      }
      .zp-report-footer{
        margin-top:18px;
        padding-top:14px;
        border-top:1px solid rgba(255,255,255,.07);
        color:rgba(234,241,255,.58);
        font-size:12px;
      }
      .zp-report-hidden-print{
        position:fixed;
        left:0;
        top:0;
        width:794px;
        background:#0d1320;
        color:#f3f7ff;
        z-index:0;
        opacity:0.01;
        pointer-events:none;
        transform:none;
        overflow:visible;
      }
      .zp-report-print-light{
        background:#ffffff;
        color:#111827;
      }
      .zp-report-print-light .zp-report-preview{
        background:#ffffff;
        color:#111827;
        border:1px solid #d1d5db;
        box-shadow:none;
      }
      .zp-report-print-light .zp-report-preview-head{
        background:#ffffff;
        border-bottom:1px solid #d1d5db;
      }
      .zp-report-print-light .zp-report-preview-kicker{
        color:#b8860b;
      }
      .zp-report-print-light .zp-report-preview-title{
        color:#111827;
      }
      .zp-report-print-light .zp-report-preview-meta{
        color:#4b5563;
      }
      .zp-report-print-light .zp-report-brand-logo{
        opacity:1;
      }
      .zp-report-print-light .zp-brand-zero{
        color:#02154e;
      }
      .zp-report-print-light .zp-brand-at{
        color:#f9ba00;
      }
      .zp-report-print-light .zp-brand-prod{
        color:#02154e;
      }
      .zp-report-print-light .zp-report-kpi{
        background:#ffffff;
        border:1px solid #d1d5db;
        box-shadow:none;
      }
      .zp-report-print-light .zp-report-kpi-label{
        color:#6b7280;
      }
      .zp-report-print-light .zp-report-kpi-value{
        color:#111827;
      }
      .zp-report-print-light .zp-report-section-title{
        color:#111827;
      }
      .zp-report-print-light .zp-report-list{
        color:#1f2937;
      }
      .zp-report-print-light .zp-report-footer{
        color:#6b7280;
        border-top:1px solid #d1d5db;
      }
      @media (max-width: 760px){
        .zp-report-type-grid,
        .zp-report-kpi-grid{
          grid-template-columns:1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function buildModal() {
    if (state.modal) return state.modal;

    ensureStyles();

    const overlay = document.createElement("div");
    overlay.className = "zp-report-modal-overlay";
    overlay.id = "zp-report-generator-modal";
    overlay.innerHTML = `
      <div class="zp-report-modal" role="dialog" aria-modal="true" aria-labelledby="zp-report-generator-title">
        <div class="zp-report-modal-header">
          <div>
            <div id="zp-report-generator-title" class="zp-report-modal-title">Executive Report Generator</div>
            <div class="zp-report-modal-subtitle">
              Select a board-ready report type and generate a demo-safe PDF without API dependency.
            </div>
          </div>
          <button class="zp-report-close" type="button" data-zp-report-close>Close</button>
        </div>
        <div class="zp-report-modal-body">
          <div class="zp-report-type-grid" data-zp-report-type-grid></div>

          <div class="zp-report-actions">
            <button class="zp-report-btn zp-report-btn-primary" type="button" data-zp-report-generate>
              Download PDF
            </button>
            <button class="zp-report-btn zp-report-btn-secondary" type="button" data-zp-report-close>
              Cancel
            </button>
          </div>

          <div class="zp-report-preview" data-zp-report-preview></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener("click", function (evt) {
      if (evt.target === overlay || evt.target.hasAttribute("data-zp-report-close")) {
        closeModal();
      }
    });

    const typeGrid = qs("[data-zp-report-type-grid]", overlay);
    typeGrid.innerHTML = Object.values(REPORT_TYPES).map(function (report) {
      return `
        <button
          type="button"
          class="zp-report-type-card ${report.key === state.activeType ? "is-active" : ""}"
          data-zp-report-type="${esc(report.key)}"
        >
          <div class="zp-report-type-title">${esc(report.title)}</div>
          <div class="zp-report-type-text">${esc(report.subtitle)}</div>
        </button>
      `;
    }).join("");

    typeGrid.addEventListener("click", function (evt) {
      const card = evt.target.closest("[data-zp-report-type]");
      if (!card) return;
      state.activeType = card.getAttribute("data-zp-report-type");
      refreshSelection();
      renderPreview();
    });

    const generateBtn = qs("[data-zp-report-generate]", overlay);
    generateBtn.addEventListener("click", function () {
      generatePdf(state.activeType);
    });

    state.modal = overlay;
    renderPreview();
    return overlay;
  }

  function refreshSelection() {
    if (!state.modal) return;
    qsa("[data-zp-report-type]", state.modal).forEach(function (node) {
      node.classList.toggle("is-active", node.getAttribute("data-zp-report-type") === state.activeType);
    });
  }

  function buildPreviewHtml(reportKey) {
    const report = REPORT_TYPES[reportKey] || REPORT_TYPES.executive_summary;
    const data = DEMO_DATA;

    const sections = {
      executive_summary: `
        <div class="zp-report-section">
          <div class="zp-report-section-title">Executive Highlights</div>
          <ul class="zp-report-list">
            ${data.highlights.map(function (item) { return `<li>${esc(item)}</li>`; }).join("")}
          </ul>
        </div>
      `,
      financial_impact: `
        <div class="zp-report-section">
          <div class="zp-report-section-title">Financial Focus</div>
          <ul class="zp-report-list">
            <li>Estimated monthly exposure: ${esc(data.kpis.costExposure)}</li>
            <li>Projected monthly optimization upside: ${esc(data.kpis.projectedSavings)}</li>
            <li>Machine and resource decisions can be translated into CFO-ready storylines.</li>
          </ul>
        </div>
      `,
      sustainability_compliance: `
        <div class="zp-report-section">
          <div class="zp-report-section-title">Compliance Focus</div>
          <ul class="zp-report-list">
            <li>Current compliance score: ${esc(data.kpis.complianceScore)}</li>
            <li>CO₂, energy and water indicators are aligned for executive reporting.</li>
            <li>Audit-friendly summary format supports customer and board discussions.</li>
          </ul>
        </div>
      `,
      production_efficiency: `
        <div class="zp-report-section">
          <div class="zp-report-section-title">Efficiency Focus</div>
          <ul class="zp-report-list">
            <li>Current OEE signal: ${esc(data.kpis.oee)}</li>
            <li>Production volume and resource balance support demo-ready efficiency narrative.</li>
            <li>Machine-switch decisions can be shown next to utilization logic.</li>
          </ul>
        </div>
      `
    };

    return `
      <div class="zp-report-preview-head">
        <div class="zp-report-brand-row">
          
<img class="zp-report-brand-logo" src="assets/img/plogo.png" alt="Zero@Production Logo">

          <div class="zp-report-brand-mark" id="zpReportBrandMark">
            <span class="zp-brand-zero">Zero</span><span class="zp-brand-at">@</span><span class="zp-brand-prod">Production</span>
          </div>
        </div>
        <div class="zp-report-preview-title">${esc(report.title)}</div>
        <div class="zp-report-preview-meta">
          Facility: ${esc(data.facility)} · Generated: ${esc(formatDate(data.generatedAt))}
        </div>
      </div>

      <div class="zp-report-preview-body">
        <div class="zp-report-kpi-grid">
          <div class="zp-report-kpi">
            <div class="zp-report-kpi-label">Production Volume</div>
            <div class="zp-report-kpi-value">${esc(data.kpis.productionVolume)}</div>
          </div>
          <div class="zp-report-kpi">
            <div class="zp-report-kpi-label">Energy Use</div>
            <div class="zp-report-kpi-value">${esc(data.kpis.energyUse)}</div>
          </div>
          <div class="zp-report-kpi">
            <div class="zp-report-kpi-label">Water Use</div>
            <div class="zp-report-kpi-value">${esc(data.kpis.waterUse)}</div>
          </div>
          <div class="zp-report-kpi">
            <div class="zp-report-kpi-label">CO₂ Impact</div>
            <div class="zp-report-kpi-value">${esc(data.kpis.co2Impact)}</div>
          </div>
          <div class="zp-report-kpi">
            <div class="zp-report-kpi-label">Cost Exposure</div>
            <div class="zp-report-kpi-value">${esc(data.kpis.costExposure)}</div>
          </div>
          <div class="zp-report-kpi">
            <div class="zp-report-kpi-label">Projected Savings</div>
            <div class="zp-report-kpi-value">${esc(data.kpis.projectedSavings)}</div>
          </div>
        </div>

        ${sections[reportKey] || sections.executive_summary}

        <div class="zp-report-section">
          <div class="zp-report-section-title">Key Risks</div>
          <ul class="zp-report-list">
            ${data.risks.map(function (item) { return `<li>${esc(item)}</li>`; }).join("")}
          </ul>
        </div>

        <div class="zp-report-section">
          <div class="zp-report-section-title">Recommended Actions</div>
          <ul class="zp-report-list">
            ${data.actions.map(function (item) { return `<li>${esc(item)}</li>`; }).join("")}
          </ul>
        </div>

        <div class="zp-report-footer">
          Demo-safe executive report generated locally from Zero@Production Executive Dashboard.
        </div>
      </div>
    `;
  }

  function renderPreview() {
    if (!state.modal) return;
    const preview = qs("[data-zp-report-preview]", state.modal);
    preview.innerHTML = buildPreviewHtml(state.activeType);
  }

  function openModal(defaultType) {
    buildModal();
    if (defaultType && REPORT_TYPES[defaultType]) {
      state.activeType = defaultType;
      refreshSelection();
      renderPreview();
    }
    state.modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!state.modal) return;
    state.modal.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function buildPdfNode(reportKey) {
    const wrapper = document.createElement("div");
    wrapper.className = "zp-report-hidden-print zp-report-print-light";
    wrapper.innerHTML = `
      <div class="zp-report-preview">
        ${buildPreviewHtml(reportKey)}
      </div>
    `;
    document.body.appendChild(wrapper);
    return wrapper;
  }
  async function generatePdf(reportKey) {
    const report = REPORT_TYPES[reportKey] || REPORT_TYPES.executive_summary;
    const wrapper = buildPdfNode(report.key);
    const node = wrapper.querySelector(".zp-report-preview");

    try {
      await new Promise(r => setTimeout(r, 300));

      const canvas = await window.html2canvas(node, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794
      });

      const imgData = canvas.toDataURL("image/png");

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = 210;
      const pageHeight = (canvas.height * pageWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
      pdf.save(report.filename);
    } catch (err) {
      console.error("Report PDF generation failed:", err);
      window.alert("PDF generation failed. Check console.");
    } finally {
      wrapper.remove();
    }
  }

  function init() {
    buildModal();

    const launcher = document.getElementById("btnExecutiveReportGenerator");
    if (launcher && !launcher.dataset.zpReportBound) {
      launcher.addEventListener("click", function () {
        openModal("executive_summary");
      });
      launcher.dataset.zpReportBound = "1";
    }
  }

  window.ZPExecutiveReportGenerator = {
    init: init,
    open: openModal,
    close: closeModal,
    generatePdf: generatePdf
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
