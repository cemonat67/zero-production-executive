(function(){
  function applyEnvironmentalExecutiveEmphasis(){
    if(!window.FactoryOS || !window.FactoryOS.state) return;

    var sustainability = window.FactoryOS.state.sustainability || {};
    var flags = sustainability.environmental_flags || {};

    var ceoSubtext = document.getElementById("ceoSubtext");
    var ceoBadge = document.getElementById("ceoBadge");
    var cfoSubtext = document.getElementById("cfoSubtext");
    var cfoBadge = document.getElementById("cfoBadge");
    var ctoSubtext = document.getElementById("ctoSubtext");
    var ctoBadge = document.getElementById("ctoBadge");

    if (ceoSubtext) {
      ceoSubtext.textContent = flags.waste_pressure
        ? "Wastewater & compliance pressure visible"
        : "Sustainability posture";
    }
    if (ceoBadge) {
      ceoBadge.textContent = flags.waste_pressure ? "PRESSURE" : "MONITOR";
      ceoBadge.className = flags.waste_pressure ? "badge monitor" : "badge ok";
    }

    if (cfoSubtext) {
      cfoSubtext.textContent = flags.carbon_hotspot
        ? "Carbon exposure now affects margin attention"
        : "Financial exposure";
    }
    if (cfoBadge) {
      cfoBadge.textContent = flags.carbon_hotspot ? "CO2 HOTSPOT" : "€ / Year";
      cfoBadge.className = flags.carbon_hotspot ? "badge critical" : "badge";
    }

    if (ctoSubtext) {
      ctoSubtext.textContent = flags.scope3_visible
        ? "System resilience + Scope 3 visibility"
        : "System resilience";
    }
    if (ctoBadge) {
      ctoBadge.textContent = flags.scope3_visible ? "SCOPE 3" : "CRITICAL";
      ctoBadge.className = flags.scope3_visible ? "badge action" : "badge critical";
    }
  }

  window.applyEnvironmentalExecutiveEmphasis = applyEnvironmentalExecutiveEmphasis;

  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(applyEnvironmentalExecutiveEmphasis, 50);
    setTimeout(applyEnvironmentalExecutiveEmphasis, 500);
    setTimeout(applyEnvironmentalExecutiveEmphasis, 1500);
  });

  setInterval(applyEnvironmentalExecutiveEmphasis, 2000);
})();