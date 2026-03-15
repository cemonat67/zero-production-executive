/* =========================================================
   Zero@Production
   Environmental Layer Core
   Environmental Layer v2 foundation
========================================================= */

(function(){

  if (window.EnvironmentalLayer) {
    return;
  }

  const seed = window.EnvironmentalLayerV2Seed || {};

  function cloneRows(rows){
    return Array.isArray(rows) ? [...rows] : [];
  }

  function round(value){
    return Number(Number(value || 0).toFixed(2));
  }

  const EnvironmentalLayer = {
    version: "0.2.0",

    state: {
      waste_generation: cloneRows(seed.waste_generation),
      waste_classification: cloneRows(seed.waste_classification),
      waste_treatment: cloneRows(seed.waste_treatment),
      fuel_consumption: cloneRows(seed.fuel_consumption),
      energy_generation: cloneRows(seed.energy_generation),
      electricity_sources: cloneRows(seed.electricity_sources),
      scope_mapping: cloneRows(seed.scope_mapping),
      waste_transport: cloneRows(seed.waste_transport),
      intensity_signals: cloneRows(seed.intensity_signals),
      emission_factors: cloneRows(seed.emission_factors)
    },

    getAll(entityName){
      const rows = this.state[entityName];
      return Array.isArray(rows) ? rows : [];
    },

    getById(entityName, id){
      const rows = this.getAll(entityName);
      return rows.find(item => item && item.id === id) || null;
    },

    findOne(entityName, predicate){
      const rows = this.getAll(entityName);
      if (typeof predicate !== "function") return null;
      return rows.find(predicate) || null;
    },

    add(entityName, record){
      if (!this.state[entityName]) {
        this.state[entityName] = [];
      }
      this.state[entityName].push(record);
      return record;
    },

    getWasteClassification(wasteStream){
      return this.findOne("waste_classification", item => item && item.waste_stream === wasteStream);
    },

    getWasteTreatment(wasteStream){
      return this.findOne("waste_treatment", item => item && item.waste_stream === wasteStream);
    },

    getWasteTransport(wasteStream){
      return this.findOne("waste_transport", item => item && item.waste_stream === wasteStream);
    },

    getScopeMapping(entityType, referenceKey){
      return this.findOne(
        "scope_mapping",
        item => item && item.entity_type === entityType && item.reference_key === referenceKey
      );
    },

    getEmissionFactor(referenceKey){
      return this.findOne(
        "emission_factors",
        item => item && item.reference_key === referenceKey
      );
    },

    calculateWasteEmission(wasteGenerationRecord){
      if (!wasteGenerationRecord) return null;

      const treatment = this.getWasteTreatment(wasteGenerationRecord.waste_stream);
      if (!treatment) return null;

      const scopeMap = this.getScopeMapping("waste_treatment", treatment.treatment_method);
      const factorRef = scopeMap ? scopeMap.factor_ref : treatment.treatment_method;
      const factor = this.getEmissionFactor(factorRef);
      if (!factor) return null;

      const quantity = Number(wasteGenerationRecord.quantity_kg || 0);
      const factorValue = Number(factor.factor_value || 0);

      return {
        source_type: "waste_treatment",
        scope: scopeMap ? scopeMap.scope : "scope3",
        waste_stream: wasteGenerationRecord.waste_stream,
        treatment_method: treatment.treatment_method,
        quantity_kg: quantity,
        factor_unit: factor.factor_unit,
        factor_value: factorValue,
        total_co2e_kg: round(quantity * factorValue)
      };
    },

    calculateWasteTransportEmission(wasteGenerationRecord){
      if (!wasteGenerationRecord) return null;

      const transport = this.getWasteTransport(wasteGenerationRecord.waste_stream);
      if (!transport) return null;

      const scopeMap = this.getScopeMapping("waste_transport", transport.transport_mode);
      const factorRef = scopeMap ? scopeMap.factor_ref : transport.transport_mode;
      const factor = this.getEmissionFactor(factorRef);
      if (!factor) return null;

      const quantityTon = Number(wasteGenerationRecord.quantity_kg || 0) / 1000;
      const distanceKm = Number(transport.transport_distance_km || 0);
      const factorValue = Number(factor.factor_value || 0);

      return {
        source_type: "waste_transport",
        scope: scopeMap ? scopeMap.scope : "scope3",
        waste_stream: wasteGenerationRecord.waste_stream,
        transport_mode: transport.transport_mode,
        quantity_ton: round(quantityTon),
        transport_distance_km: distanceKm,
        factor_unit: factor.factor_unit,
        factor_value: factorValue,
        total_co2e_kg: round(quantityTon * distanceKm * factorValue)
      };
    },

    calculateFuelEmission(fuelRecord){
      if (!fuelRecord) return null;

      const scopeMap = this.getScopeMapping("fuel_consumption", fuelRecord.source_type);
      if (!scopeMap) return null;

      const factor = this.getEmissionFactor(scopeMap.factor_ref);
      if (!factor) return null;

      const consumptionValue = Number(fuelRecord.consumption_value || 0);
      const factorValue = Number(factor.factor_value || 0);

      return {
        source_type: fuelRecord.source_type,
        source_group: fuelRecord.source_group,
        usage_purpose: fuelRecord.usage_purpose,
        scope: scopeMap.scope,
        consumption_value: consumptionValue,
        consumption_unit: fuelRecord.consumption_unit,
        factor_unit: factor.factor_unit,
        factor_value: factorValue,
        total_co2e_kg: round(consumptionValue * factorValue)
      };
    },

    calculateElectricityEmission(electricityRecord){
      if (!electricityRecord) return null;

      if (electricityRecord.source_type === "self_generated_electricity") {
        return {
          source_type: electricityRecord.source_type,
          scope: "excluded",
          electricity_kwh: Number(electricityRecord.electricity_kwh || 0),
          total_co2e_kg: 0,
          accounting_note: "Excluded to prevent double counting; fuel input already drives Scope 1."
        };
      }

      const scopeMap = this.getScopeMapping("electricity_sources", electricityRecord.source_type);
      if (!scopeMap) return null;

      const factor = this.getEmissionFactor(scopeMap.factor_ref);
      if (!factor) return null;

      const electricityKwh = Number(electricityRecord.electricity_kwh || 0);
      const factorValue = Number(factor.factor_value || 0);

      return {
        source_type: electricityRecord.source_type,
        scope: scopeMap.scope,
        electricity_kwh: electricityKwh,
        factor_unit: factor.factor_unit,
        factor_value: factorValue,
        total_co2e_kg: round(electricityKwh * factorValue)
      };
    },

    getEnvironmentalSnapshot(){
      const wasteGeneration = this.getAll("waste_generation");
      const fuelConsumption = this.getAll("fuel_consumption");
      const electricitySources = this.getAll("electricity_sources");
      const energyGeneration = this.getAll("energy_generation");

      const wasteTreatmentEmissions = wasteGeneration
        .map(item => this.calculateWasteEmission(item))
        .filter(Boolean);

      const wasteTransportEmissions = wasteGeneration
        .map(item => this.calculateWasteTransportEmission(item))
        .filter(Boolean);

      const fuelEmissions = fuelConsumption
        .map(item => this.calculateFuelEmission(item))
        .filter(Boolean);

      const electricityEmissions = electricitySources
        .map(item => this.calculateElectricityEmission(item))
        .filter(Boolean);

      const allEmissions = []
        .concat(wasteTreatmentEmissions, wasteTransportEmissions, fuelEmissions, electricityEmissions);

      const totalScope1 = allEmissions
        .filter(item => item.scope === "scope1")
        .reduce((sum, item) => sum + Number(item.total_co2e_kg || 0), 0);

      const totalScope2 = allEmissions
        .filter(item => item.scope === "scope2")
        .reduce((sum, item) => sum + Number(item.total_co2e_kg || 0), 0);

      const totalScope3 = allEmissions
        .filter(item => item.scope === "scope3")
        .reduce((sum, item) => sum + Number(item.total_co2e_kg || 0), 0);

      const totalWasteKg = wasteGeneration.reduce(
        (sum, item) => sum + Number(item.quantity_kg || 0),
        0
      );

      return {
        total_waste_kg: round(totalWasteKg),
        total_scope1_co2e_kg: round(totalScope1),
        total_scope2_co2e_kg: round(totalScope2),
        total_scope3_co2e_kg: round(totalScope3),
        total_co2e_kg: round(totalScope1 + totalScope2 + totalScope3),
        waste_stream_count: wasteGeneration.length,
        fuel_record_count: fuelConsumption.length,
        electricity_record_count: electricitySources.length,
        energy_generation_record_count: energyGeneration.length,
        emission_record_count: allEmissions.length,
        double_counting_policy: {
          steam: "excluded_from_direct_emission_totals",
          self_generated_electricity: "excluded_from_direct_emission_totals",
          rule: "fuel_input_is_primary_for_scope1"
        }
      };
    }
  };

  window.EnvironmentalLayer = EnvironmentalLayer;

})();
