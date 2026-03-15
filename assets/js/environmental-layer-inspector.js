(function(){
  function num(value){
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function setText(id, value){
    const el = document.getElementById(id);
    if(el) el.textContent = value;
  }

  function formatNumber(value){
    const n = num(value);
    const hasDecimal = Math.abs(n % 1) > 0.000001;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: hasDecimal ? 2 : 0,
      maximumFractionDigits: hasDecimal ? 2 : 0
    }).format(n);
  }

  function getArrayLength(obj, key){
    return Array.isArray(obj && obj[key]) ? obj[key].length : 0;
  }

  function resolveSnapshot(layer){
    if(!layer) return null;
    if(typeof layer.getEnvironmentalSnapshot === "function") return layer.getEnvironmentalSnapshot();
    if(typeof layer.getSnapshot === "function") return layer.getSnapshot();
    if(typeof layer.snapshot === "function") return layer.snapshot();
    if(layer.snapshot && typeof layer.snapshot === "object") return layer.snapshot;
    return null;
  }

  function renderEnvironmentalInspector(){
    const layer = window.EnvironmentalLayer;
    const card = document.getElementById("environmentalLayerInspectorCard");
    if(!card) return;
    if(!layer){
      console.warn("[env-inspector] window.EnvironmentalLayer not found");
      return;
    }

    const snapshot = resolveSnapshot(layer);
    if(!snapshot){
      console.warn("[env-inspector] snapshot not available");
      return;
    }

    setText("envScope1Value", formatNumber(snapshot.total_scope1_co2e_kg));
    setText("envScope2Value", formatNumber(snapshot.total_scope2_co2e_kg));
    setText("envScope3Value", formatNumber(snapshot.total_scope3_co2e_kg));
    setText("envTotalCo2eValue", formatNumber(snapshot.total_co2e_kg));
    setText("envTotalWasteValue", formatNumber(snapshot.total_waste_kg));

    const source = layer.state || layer.data || {};
    setText("envFuelRecordCount", String(
      snapshot.fuel_record_count != null ? snapshot.fuel_record_count : getArrayLength(source, "fuel_consumption")
    ));
    setText("envElectricityRecordCount", String(
      snapshot.electricity_record_count != null ? snapshot.electricity_record_count : getArrayLength(source, "electricity_sources")
    ));
    setText("envWasteStreamCount", String(
      snapshot.waste_stream_count != null ? snapshot.waste_stream_count : getArrayLength(source, "waste_generation")
    ));

    console.log("[env-inspector] rendered", snapshot);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", renderEnvironmentalInspector);
  } else {
    renderEnvironmentalInspector();
  }

  window.renderEnvironmentalInspector = renderEnvironmentalInspector;
})();
