#!/usr/bin/env python3
"""
Jal-Jeevan Groundwater Analytics & Hydrogeological Modeling Suite
Compliant with Central Ground Water Board (CGWB) & Bureau of Indian Standards (BIS IS 10500:2012).

This module provides scientific computation for:
- Weighted Arithmetic Water Quality Index (WQI)
- Stage of Groundwater Extraction (SOD) classification
- Aquifer specific yield and recharge volume calculations
- Automated community hazard detection
"""

import math
import json
from typing import Dict, Any, List, Tuple


class WaterQualityIndexCalculator:
    """
    Weighted Arithmetic Water Quality Index (WQI) calculator
    based on Bureau of Indian Standards (BIS IS 10500:2012) drinking water limits.
    """

    # BIS IS 10500:2012 benchmarks and relative weights (wi)
    STANDARDS = {
        'tds': {'si': 500.0, 'permissible': 2000.0, 'weight': 4},
        'ph': {'si': 7.0, 'permissible_min': 6.5, 'permissible_max': 8.5, 'weight': 4},
        'fluoride': {'si': 1.0, 'permissible': 1.5, 'weight': 5},
        'nitrate': {'si': 45.0, 'permissible': 45.0, 'weight': 5},
        'arsenic': {'si': 0.01, 'permissible': 0.01, 'weight': 5},
        'hardness': {'si': 200.0, 'permissible': 600.0, 'weight': 2},
        'iron': {'si': 0.3, 'permissible': 1.0, 'weight': 3},
    }

    @classmethod
    def calculate_wqi(cls, metrics: Dict[str, float]) -> Dict[str, Any]:
        """
        Calculates WQI score (0-100) and potability rating.
        Formula:
            WQI = Sum(Wi * qi) / Sum(Wi)
            Where:
            qi = ((Vi - V0) / (Si - V0)) * 100
        """
        total_weight = 0.0
        weighted_q = 0.0
        penalties = 0.0
        critical_alerts: List[str] = []

        # Arsenic threshold check (Strict zero-relaxation carcinogen)
        arsenic_val = metrics.get('arsenic', 0.0)
        if arsenic_val > 0.01:
            penalties += 40.0
            critical_alerts.append(f"Toxic Arsenic concentration ({arsenic_val:.3f} mg/L > 0.01 mg/L limit)")

        # Fluoride check (Fluorosis hazard)
        fluoride_val = metrics.get('fluoride', 0.0)
        if fluoride_val > 1.5:
            penalties += 30.0
            critical_alerts.append(f"Excessive Fluoride ({fluoride_val:.2f} mg/L > 1.5 mg/L permissible limit)")

        # Nitrate check (Methemoglobinemia risk)
        nitrate_val = metrics.get('nitrate', 0.0)
        if nitrate_val > 45.0:
            penalties += 25.0
            critical_alerts.append(f"High Nitrate contamination ({nitrate_val:.1f} mg/L > 45 mg/L safe ceiling)")

        # TDS check
        tds_val = metrics.get('tds', 0.0)
        if tds_val > 2000.0:
            penalties += 25.0
            critical_alerts.append(f"High Total Dissolved Solids ({tds_val:.0f} ppm > 2,000 ppm permissible limit)")

        # Calculate weighted quality ratings
        for param, specs in cls.STANDARDS.items():
            if param in metrics:
                vi = metrics[param]
                si = specs['si']
                wi = specs['weight']

                total_weight += wi
                if param == 'ph':
                    # Ideal pH is 7.0; departure from 7.0 creates quality rating
                    qi = (abs(vi - 7.0) / (8.5 - 7.0)) * 100.0
                else:
                    qi = (vi / si) * 100.0

                weighted_q += wi * qi

        base_wqi = weighted_q / total_weight if total_weight > 0 else 50.0
        final_score = max(10, min(100, round(100 - (base_wqi * 0.45 + penalties))))

        if final_score >= 80:
            rating = 'Excellent'
            potability = 'Directly Potable with Basic Filtration'
        elif final_score >= 65:
            rating = 'Good'
            potability = 'Potable with Standard UV / Candle Purifier'
        elif final_score >= 45:
            rating = 'Fair'
            potability = 'Requires RO or Specific Defluoridation / Iron Filter'
        elif final_score >= 30:
            rating = 'Poor'
            potability = 'Mandatory Multi-stage RO + Remediation; Unsuitable raw'
        else:
            rating = 'Hazardous'
            potability = 'DANGEROUS: Severe chemical toxicity. Do not consume raw!'

        return {
            'wqi_score': final_score,
            'rating': rating,
            'potability': potability,
            'critical_alerts': critical_alerts,
            'metrics_evaluated': metrics,
        }


class HydrogeologicalAssessment:
    """
    Groundwater aquifer resource assessment and overdraft categorization
    per Central Ground Water Board (CGWB) Dynamic Assessment methodology.
    """

    CATEGORIES = {
        'Safe': 'Extraction <= 70% of annual replenishable resource',
        'Semi-Critical': 'Extraction between 70% and 90%',
        'Critical': 'Extraction between 90% and 100%',
        'Over-Exploited': 'Extraction > 100% (withdrawal exceeds annual replenishment)',
    }

    @staticmethod
    def classify_stage_of_extraction(stage_percentage: float) -> str:
        """Classify stage of extraction into CGWB official category."""
        if stage_percentage > 100.0:
            return 'Over-Exploited'
        elif stage_percentage > 90.0:
            return 'Critical'
        elif stage_percentage > 70.0:
            return 'Semi-Critical'
        else:
            return 'Safe'

    @staticmethod
    def calculate_rwh_potential(
        roof_area_sq_m: float,
        annual_rainfall_mm: float,
        runoff_coefficient: float = 0.85
    ) -> Dict[str, Any]:
        """
        Calculates annual harvestable rainwater volume and carbon offset.
        Formula: Q (litres) = Area (m2) * Rainfall (mm) * Runoff Coefficient
        """
        harvestable_litres = round(roof_area_sq_m * annual_rainfall_mm * runoff_coefficient)
        household_days_offset = round(harvestable_litres / 60.0)  # 60L/day for 4-member family
        tankers_equivalent = round(harvestable_litres / 5000.0)
        co2_saved_kg = round(harvestable_litres * 0.0003, 2)  # Avoided municipal tanker haulage

        return {
            'harvestable_litres': harvestable_litres,
            'household_days_offset': household_days_offset,
            'tankers_equivalent': tankers_equivalent,
            'co2_saved_kg': co2_saved_kg,
            'recommended_pit_volume_m3': max(2.0, round(roof_area_sq_m * 0.02, 1)),
        }


def run_diagnostics_demo():
    """Demonstration run for field testing."""
    print("=" * 65)
    print("🌊 Jal-Jeevan Groundwater Python Analytics Engine")
    print("=" * 65)

    sample_metrics = {
        'tds': 1150.0,
        'ph': 7.6,
        'fluoride': 1.8,
        'nitrate': 58.0,
        'arsenic': 0.002,
        'hardness': 480.0,
        'iron': 0.4,
    }

    print("\n[1] Evaluating Sample Borewell Lab Report:")
    for k, v in sample_metrics.items():
        print(f"    - {k.upper()}: {v}")

    result = WaterQualityIndexCalculator.calculate_wqi(sample_metrics)
    print(f"\n--> Calculated WQI Score: {result['wqi_score']} / 100 ({result['rating']})")
    print(f"--> Potability Verdict : {result['potability']}")
    if result['critical_alerts']:
        print("--> Critical Alerts:")
        for alert in result['critical_alerts']:
            print(f"    * ⚠️ {alert}")

    print("\n[2] Rainwater Recharge Sizing (120 sq.m roof in Bengaluru, 920 mm rainfall):")
    rwh = HydrogeologicalAssessment.calculate_rwh_potential(120.0, 920.0, 0.85)
    print(f"    - Annual Harvest Potential: {rwh['harvestable_litres']:,} Litres")
    print(f"    - Domestic Supply Offset  : {rwh['household_days_offset']} days")
    print(f"    - Water Tankers Saved     : ~{rwh['tankers_equivalent']} tankers")
    print("=" * 65)


if __name__ == '__main__':
    run_diagnostics_demo()
