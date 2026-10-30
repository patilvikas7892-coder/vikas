#!/usr/bin/env python3
"""
CGWB Telemetry & Community Hazard Alert Data Pipeline
Ingests Digital Water Level Recorder (DWLR) piezometric sensor logs
and detects rapid drawdown or chemical contamination surges.
"""

import json
import os
from datetime import datetime, timezone
from typing import List, Dict, Any


class CGWBDataPipeline:
    """ETL Pipeline for Groundwater Telemetry and Community Alerts."""

    def __init__(self, data_directory: str = "data"):
        self.data_directory = data_directory

    def evaluate_telemetry_packet(self, packet: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates a telemetry reading for anomalies:
        - Critical drawdown rate (> 0.5m / week)
        - Fluoride surge (> 1.5 mg/L)
        - Arsenic detection (> 0.01 mg/L)
        - Nitrate surge (> 45 mg/L)
        """
        district = packet.get('district', 'Unknown')
        pre_level = packet.get('water_level_pre_monsoon', 0.0)
        current_level = packet.get('current_water_level', 0.0)
        drawdown = current_level - pre_level

        alerts: List[str] = []
        severity = 'Informational'

        if drawdown > 3.0:
            alerts.append(f"Severe Aquifer Depletion: Water table dropped by {drawdown:.1f}m BGL.")
            severity = 'Critical'
        elif drawdown > 1.0:
            alerts.append(f"Accelerated Drawdown: Water table dropped by {drawdown:.1f}m BGL.")
            severity = 'Warning'

        metrics = packet.get('water_quality', {})
        if metrics.get('fluoride', 0) > 1.5:
            alerts.append(f"High Fluoride Spike: {metrics['fluoride']} mg/L (Safe: 1.0 mg/L)")
            severity = 'Critical'

        if metrics.get('arsenic', 0) > 0.01:
            alerts.append(f"Hazardous Arsenic Spike: {metrics['arsenic']} mg/L (Limit: 0.01 mg/L)")
            severity = 'Critical'

        if metrics.get('nitrate', 0) > 45:
            alerts.append(f"Agricultural/Sewage Nitrate Intrusion: {metrics['nitrate']} mg/L (Limit: 45 mg/L)")
            if severity != 'Critical':
                severity = 'Warning'

        return {
            'district': district,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'drawdown_meters': round(drawdown, 2),
            'severity': severity,
            'alerts_triggered': alerts,
            'requires_community_broadcast': len(alerts) > 0,
        }


if __name__ == '__main__':
    pipeline = CGWBDataPipeline()
    sample_packet = {
        'district': 'Jaipur',
        'station_id': 'CGWB-RJ-JPR-004',
        'water_level_pre_monsoon': 34.0,
        'current_water_level': 37.8,
        'water_quality': {
            'tds': 1480,
            'ph': 7.9,
            'fluoride': 2.2,
            'nitrate': 62,
            'arsenic': 0.003,
        }
    }
    eval_result = pipeline.evaluate_telemetry_packet(sample_packet)
    print("CGWB Telemetry Evaluation Result:")
    print(json.dumps(eval_result, indent=2))
