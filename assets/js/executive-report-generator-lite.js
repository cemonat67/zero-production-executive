(function () {
  const $ = (id) => document.getElementById(id);

  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m]));
  }

  function readFilters() {
    return {
      dateFrom: $("reportDateFrom")?.value || "",
      dateTo: $("reportDateTo")?.value || "",
      machine: $("reportMachine")?.value || "All Machines",
      process: $("reportProcess")?.value || "All Processes",
      batch: $("reportBatch")?.value || "All Batches",
      kpi: $("reportKpi")?.value || "all"
    };
  }

  function buildMockResult(filters) {
    const machineFactor =
      /Jet 06/i.test(filters.machine) ? 1.08 :
      /Jet 04/i.test(filters.machine) ? 0.96 :
      /Jigger 01/i.test(filters.machine) ? 1.12 :
      /Stenter 01/i.test(filters.machine) ? 1.18 : 1.0;

    const processFactor =
      /Finishing/i.test(filters.process) ? 0.88 :
      /Drying/i.test(filters.process) ? 1.14 :
      /Washing/i.test(filters.process) ? 1.05 : 1.0;

    const energy = Math.round(1860 * machineFactor * processFactor);
    const water = Math.round(142 * processFactor * 10) / 10;
    const co2 = Math.round(12.8 * machineFactor * processFactor * 10) / 10;
    const efficiency = Math.round((87 / machineFactor) * 10) / 10;

    return {
      energy,
      water,
      co2,
      efficiency,
      summary:
        `Executive report generated for ${filters.machine || "All Machines"}, ` +
        `${filters.process || "All Processes"}, batch scope ${filters.batch || "All Batches"}. ` +
        `The current mock view indicates ${energy} kWh energy exposure, ${water} m³ water intensity, ` +
        `${co2} tCO₂ estimated impact and ${efficiency}% efficiency posture for the selected filter set.`
    };
  }

  function renderKpis(data, filters) {
    const selected = filters.kpi;

    const kpis = [
      { key: "energy", label: "Estimated Energy", value: `${data.energy} kWh` },
      { key: "water", label: "Estimated Water", value: `${data.water} m³` },
      { key: "co2", label: "Estimated CO₂", value: `${data.co2} tCO₂` },
      { key: "efficiency", label: "Efficiency", value: `${data.efficiency}%` }
    ].filter(item => selected === "all" ? true : item.key === selected);

    return `
      <div class="zp-report-result">
        ${kpis.map(kpi => `
          <div class="zp-report-kpi">
            <div class="label">${esc(kpi.label)}</div>
            <div class="value">${esc(kpi.value)}</div>
          </div>
        `).join("")}
      </div>
      <div class="zp-report-summary">
        <b>Scope:</b> ${esc(filters.dateFrom || "N/A")} → ${esc(filters.dateTo || "N/A")} |
        <b>Machine:</b> ${esc(filters.machine)} |
        <b>Process:</b> ${esc(filters.process)} |
        <b>Batch:</b> ${esc(filters.batch)}
        <br><br>
        ${esc(data.summary)}
      </div>
    `;
  }

  function generateReport() {
    const output = $("zpReportOutput");
    if (!output) return;
    const filters = readFilters();
    const data = buildMockResult(filters);
    output.innerHTML = renderKpis(data, filters);
  }

  function printReport() {
    generateReport();
    window.print();
  }

  function exportPdf() {
    generateReport();
    window.print();
  }

  function exportExcel() {
    const filters = readFilters();
    const data = buildMockResult(filters);

    const rows = [
      ["Date From", filters.dateFrom],
      ["Date To", filters.dateTo],
      ["Machine", filters.machine],
      ["Process", filters.process],
      ["Batch", filters.batch],
      ["KPI Selection", filters.kpi],
      [],
      ["Metric", "Value"],
      ["Estimated Energy", `${data.energy} kWh`],
      ["Estimated Water", `${data.water} m³`],
      ["Estimated CO2", `${data.co2} tCO2`],
      ["Efficiency", `${data.efficiency}%`]
    ];

    const csv = rows.map(row =>
      row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zero-production-report-lite.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function bind() {
    const gen = $("btnGenerateReport");
    const printBtn = $("btnPrintReport");
    const pdfBtn = $("btnExportPdf");
    const excelBtn = $("btnExportExcel");

    if (gen) gen.addEventListener("click", generateReport);
    if (printBtn) printBtn.addEventListener("click", printReport);
    if (pdfBtn) pdfBtn.addEventListener("click", exportPdf);
    if (excelBtn) excelBtn.addEventListener("click", exportExcel);

    generateReport();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind, { once: true });
  } else {
    bind();
  }
})();
