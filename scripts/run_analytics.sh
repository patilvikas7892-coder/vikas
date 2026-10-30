#!/usr/bin/env bash
# Jal-Jeevan Hydrogeology Pipeline Runner
# Executes Python analytical models and Java DWLR telemetry audit

set -e

echo "🌊 Running Jal-Jeevan Groundwater Pipeline..."
python3 python/groundwater_analytics.py

echo "📊 Evaluating Sample CGWB Piezometer Packet..."
python3 python/cgwb_data_pipeline.py

echo "✅ Hydrological analytics completed successfully."
