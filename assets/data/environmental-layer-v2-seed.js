/* =========================================================
   Zero@Production
   Environmental Layer v2 Seed
   Mock entities for environmental intelligence foundation
========================================================= */

(function(){

  const seed = {
    version: "0.2.0",
    generated_at: new Date().toISOString(),

    waste_generation: [
      {
        id: "wg_001",
        source_area: "Dyehouse",
        waste_stream: "sludge",
        quantity_kg: 480,
        unit: "kg",
        period: "daily",
        plant: "Ekoten Demo Plant"
      },
      {
        id: "wg_002",
        source_area: "Finishing",
        waste_stream: "chemical_container",
        quantity_kg: 65,
        unit: "kg",
        period: "daily",
        plant: "Ekoten Demo Plant"
      },
      {
        id: "wg_003",
        source_area: "Knitting",
        waste_stream: "fabric_scrap",
        quantity_kg: 210,
        unit: "kg",
        period: "daily",
        plant: "Ekoten Demo Plant"
      }
    ],

    waste_classification: [
      {
        waste_stream: "sludge",
        classification_code: "WASTE_NON_HAZ",
        hazard_class: "non_hazardous",
        reporting_group: "process_waste"
      },
      {
        waste_stream: "chemical_container",
        classification_code: "WASTE_HAZ",
        hazard_class: "hazardous",
        reporting_group: "packaging_waste"
      },
      {
        waste_stream: "fabric_scrap",
        classification_code: "WASTE_RECOVERABLE",
        hazard_class: "non_hazardous",
        reporting_group: "production_loss"
      }
    ],

    waste_treatment: [
      {
        treatment_id: "wt_001",
        waste_stream: "sludge",
        treatment_method: "landfill",
        destination_type: "external_vendor",
        recovery_flag: false
      },
      {
        treatment_id: "wt_002",
        waste_stream: "chemical_container",
        treatment_method: "hazardous_incineration",
        destination_type: "licensed_disposal",
        recovery_flag: false
      },
      {
        treatment_id: "wt_003",
        waste_stream: "fabric_scrap",
        treatment_method: "recycling",
        destination_type: "recycler",
        recovery_flag: true
      }
    ],

    fuel_consumption: [
      {
        id: "fc_001",
        source_type: "natural_gas",
        source_group: "fuel",
        consumption_value: 1250,
        consumption_unit: "sm3",
        usage_purpose: "steam_generation",
        plant: "Ekoten Demo Plant",
        period: "daily"
      },
      {
        id: "fc_002",
        source_type: "biomass",
        source_group: "fuel",
        consumption_value: 900,
        consumption_unit: "kg",
        usage_purpose: "steam_generation",
        plant: "Ekoten Demo Plant",
        period: "daily"
      },
      {
        id: "fc_003",
        source_type: "natural_gas",
        source_group: "fuel",
        consumption_value: 310,
        consumption_unit: "sm3",
        usage_purpose: "self_generated_electricity",
        plant: "Ekoten Demo Plant",
        period: "daily"
      }
    ],

    energy_generation: [
      {
        id: "eg_001",
        output_type: "steam",
        output_value: 18,
        output_unit: "ton",
        generation_method: "boiler",
        primary_input_type: "mixed_fuel",
        accounting_rule: "informational_only",
        plant: "Ekoten Demo Plant",
        period: "daily"
      },
      {
        id: "eg_002",
        output_type: "self_generated_electricity",
        output_value: 4200,
        output_unit: "kwh",
        generation_method: "cogeneration",
        primary_input_type: "natural_gas",
        accounting_rule: "fuel_drives_scope1",
        plant: "Ekoten Demo Plant",
        period: "daily"
      }
    ],

    electricity_sources: [
      {
        id: "es_001",
        source_type: "purchased_electricity",
        electricity_kwh: 12800,
        supplier_type: "grid",
        accounting_rule: "scope2",
        plant: "Ekoten Demo Plant",
        period: "daily"
      },
      {
        id: "es_002",
        source_type: "self_generated_electricity",
        electricity_kwh: 4200,
        supplier_type: "cogeneration",
        accounting_rule: "scope1_via_fuel_input",
        linked_generation_id: "eg_002",
        plant: "Ekoten Demo Plant",
        period: "daily"
      }
    ],

    scope_mapping: [
      {
        entity_type: "fuel_consumption",
        reference_key: "natural_gas",
        scope: "scope1",
        factor_ref: "natural_gas_combustion"
      },
      {
        entity_type: "fuel_consumption",
        reference_key: "biomass",
        scope: "scope1",
        factor_ref: "biomass_combustion"
      },
      {
        entity_type: "electricity_sources",
        reference_key: "purchased_electricity",
        scope: "scope2",
        factor_ref: "purchased_electricity_grid"
      },
      {
        entity_type: "waste_treatment",
        reference_key: "landfill",
        scope: "scope3",
        factor_ref: "landfill"
      },
      {
        entity_type: "waste_treatment",
        reference_key: "hazardous_incineration",
        scope: "scope3",
        factor_ref: "hazardous_incineration"
      },
      {
        entity_type: "waste_treatment",
        reference_key: "recycling",
        scope: "scope3",
        factor_ref: "recycling"
      },
      {
        entity_type: "waste_transport",
        reference_key: "road_transport",
        scope: "scope3",
        factor_ref: "road_transport"
      }
    ],

    waste_transport: [
      {
        id: "wtp_001",
        waste_stream: "sludge",
        transport_mode: "road_transport",
        destination_type: "external_vendor",
        transport_distance_km: 42,
        factor_basis: "kg_co2e_per_ton_km"
      },
      {
        id: "wtp_002",
        waste_stream: "chemical_container",
        transport_mode: "road_transport",
        destination_type: "licensed_disposal",
        transport_distance_km: 118,
        factor_basis: "kg_co2e_per_ton_km"
      },
      {
        id: "wtp_003",
        waste_stream: "fabric_scrap",
        transport_mode: "road_transport",
        destination_type: "recycler",
        transport_distance_km: 27,
        factor_basis: "kg_co2e_per_ton_km"
      }
    ],

    intensity_signals: [
      {
        signal_key: "waste_kg_per_ton_output",
        unit: "kg_per_ton",
        mock_value: 18.4
      },
      {
        signal_key: "co2e_per_ton_output",
        unit: "kg_co2e_per_ton",
        mock_value: 146.8
      },
      {
        signal_key: "sludge_kg_per_m3_wastewater",
        unit: "kg_per_m3",
        mock_value: 3.2
      },
      {
        signal_key: "energy_kwh_per_ton_output",
        unit: "kwh_per_ton",
        mock_value: 684
      }
    ],

    emission_factors: [
      {
        factor_id: "ef_001",
        entity_type: "waste_treatment",
        reference_key: "landfill",
        factor_unit: "kg_co2e_per_kg",
        factor_value: 0.45
      },
      {
        factor_id: "ef_002",
        entity_type: "waste_treatment",
        reference_key: "hazardous_incineration",
        factor_unit: "kg_co2e_per_kg",
        factor_value: 1.85
      },
      {
        factor_id: "ef_003",
        entity_type: "waste_treatment",
        reference_key: "recycling",
        factor_unit: "kg_co2e_per_kg",
        factor_value: 0.12
      },
      {
        factor_id: "ef_004",
        entity_type: "fuel_consumption",
        reference_key: "natural_gas_combustion",
        factor_unit: "kg_co2e_per_sm3",
        factor_value: 2.10
      },
      {
        factor_id: "ef_005",
        entity_type: "fuel_consumption",
        reference_key: "biomass_combustion",
        factor_unit: "kg_co2e_per_kg",
        factor_value: 0.18
      },
      {
        factor_id: "ef_006",
        entity_type: "electricity_sources",
        reference_key: "purchased_electricity_grid",
        factor_unit: "kg_co2e_per_kwh",
        factor_value: 0.42
      },
      {
        factor_id: "ef_007",
        entity_type: "waste_transport",
        reference_key: "road_transport",
        factor_unit: "kg_co2e_per_ton_km",
        factor_value: 0.09
      }
    ]
  };

  window.EnvironmentalLayerV2Seed = seed;

})();
