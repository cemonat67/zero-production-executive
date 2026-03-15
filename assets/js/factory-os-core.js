/* =========================================================
   Zero@Production
   Factory OS Core
   Shared Data Model for Dashboards / Alerts / Reports
========================================================= */

(function(){

  if(window.FactoryOS){
    return;
  }

  const FactoryOS = {

    version: "0.1",

    state: {

      plant: {
        name: "Ekoten Demo Plant",
        location: "Izmir"
      },

      production: {
        batch_id: null,
        machine: null,
        load_pct: null
      },

      utilities: {
        energy_kwh: 0,
        water_m3: 0,
        steam_kg: 0
      },

      sustainability: {
        co2_kg: 0,
        wastewater_risk: "OK",
        environmental_summary: null,
        environmental_flags: {
          carbon_hotspot: false,
          waste_pressure: false,
          scope3_visible: false
        }
      },

      finance: {
        energy_cost: 0,
        carbon_cost: 0
      },

      risks: [],

      signals: [],
      resolvedSignals: []
    },

    get(path){

      const parts = path.split(".");
      let obj = this.state;

      for(const p of parts){
        if(!obj[p]) return null;
        obj = obj[p];
      }

      return obj;
    },

    set(path,value){

      const parts = path.split(".");
      let obj = this.state;

      while(parts.length>1){
        const p = parts.shift();
        if(!obj[p]) obj[p] = {};
        obj = obj[p];
      }

      obj[parts[0]] = value;

    },

    buildEnvironmentalFlags(snapshot){

      const env = snapshot || {};

      return {
        carbon_hotspot: Number(env.total_co2e_kg || 0) >= 9000,
        waste_pressure: Number(env.total_waste_kg || 0) >= 700,
        scope3_visible: Number(env.total_scope3_co2e_kg || 0) > 0
      };

    },

    refreshEnvironmentalSummary(){

      const envLayer = window.EnvironmentalLayer;

      if(!envLayer || typeof envLayer.getEnvironmentalSnapshot !== "function"){
        return null;
      }

      const snapshot = envLayer.getEnvironmentalSnapshot();
      const flags = this.buildEnvironmentalFlags(snapshot);

      this.state.sustainability.environmental_summary = {
        total_scope1_co2e_kg: Number(snapshot.total_scope1_co2e_kg || 0),
        total_scope2_co2e_kg: Number(snapshot.total_scope2_co2e_kg || 0),
        total_scope3_co2e_kg: Number(snapshot.total_scope3_co2e_kg || 0),
        total_co2e_kg: Number(snapshot.total_co2e_kg || 0),
        total_waste_kg: Number(snapshot.total_waste_kg || 0)
      };

      this.state.sustainability.environmental_flags = flags;
      this.state.sustainability.co2_kg = Number(snapshot.total_co2e_kg || 0);

      return {
        summary: this.state.sustainability.environmental_summary,
        flags
      };

    },

    pushSignal(signal){

      const item = {
        id: `sig_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        ts: new Date().toISOString(),
        ...signal
      };

      this.state.signals.push(item);

      if (this.state.signals.length > 20) {
        this.state.signals = this.state.signals.slice(-20);
      }

    },

    pushRisk(risk){

      this.state.risks.push(risk);

    },

    pushResolvedSignal(signal){

      const item = {
        id: `rsig_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        resolved_at: new Date().toISOString(),
        ...signal
      };

      this.state.resolvedSignals.push(item);

      if (this.state.resolvedSignals.length > 20) {
        this.state.resolvedSignals = this.state.resolvedSignals.slice(-20);
      }

    }

  };

  window.FactoryOS = FactoryOS;
  window.FactoryOS.refreshEnvironmentalSummary();

})();
