package org.jaljeevan.telemetry;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Enterprise IoT Telemetry Processor for Jal Jeevan Mission Groundwater Monitoring.
 * Decodes Digital Water Level Recorder (DWLR) piezometer streams and generates
 * location-based threshold triggers.
 */
public class GroundwaterSensorTelemetry {

    private final String stationId;
    private final String district;
    private final String state;
    private final double latitude;
    private final double longitude;
    private final double depthBelowGroundLevelMeters;
    private final double waterTemperatureCelsius;
    private final double electricalConductivityMicroSiemens;
    private final Instant recordedAt;

    public GroundwaterSensorTelemetry(
            String stationId,
            String district,
            String state,
            double latitude,
            double longitude,
            double depthBelowGroundLevelMeters,
            double waterTemperatureCelsius,
            double electricalConductivityMicroSiemens) {
        this.stationId = stationId;
        this.district = district;
        this.state = state;
        this.latitude = latitude;
        this.longitude = longitude;
        this.depthBelowGroundLevelMeters = depthBelowGroundLevelMeters;
        this.waterTemperatureCelsius = waterTemperatureCelsius;
        this.electricalConductivityMicroSiemens = electricalConductivityMicroSiemens;
        this.recordedAt = Instant.now();
    }

    /**
     * Estimates Total Dissolved Solids (TDS) in ppm from Electrical Conductivity (EC).
     * Standard hydrogeological conversion ratio is approx 0.64.
     */
    public double getEstimatedTdsPpm() {
        return Math.round(this.electricalConductivityMicroSiemens * 0.64);
    }

    /**
     * Checks if current water level breaches seasonal overdraft thresholds.
     */
    public List<String> evaluateAquiferSafety(double baselineSafeDepthMeters) {
        List<String> warnings = new ArrayList<>();
        double drawdown = this.depthBelowGroundLevelMeters - baselineSafeDepthMeters;

        if (drawdown > 5.0) {
            warnings.add(String.format("CRITICAL OVERDRAFT: Water table is %.1f meters below sustainable baseline.", drawdown));
        } else if (drawdown > 2.0) {
            warnings.add(String.format("MODERATE STRESS: Water table has depleted by %.1f meters.", drawdown));
        }

        if (this.getEstimatedTdsPpm() > 2000.0) {
            warnings.add(String.format("SALINITY INTRUSION: Estimated TDS %.0f ppm exceeds BIS permissible limit.", this.getEstimatedTdsPpm()));
        }

        return warnings;
    }

    public String getStationId() { return stationId; }
    public String getDistrict() { return district; }
    public String getState() { return state; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public double getDepthBelowGroundLevelMeters() { return depthBelowGroundLevelMeters; }
    public double getWaterTemperatureCelsius() { return waterTemperatureCelsius; }
    public double getElectricalConductivityMicroSiemens() { return electricalConductivityMicroSiemens; }
    public Instant getRecordedAt() { return recordedAt; }

    @Override
    public String toString() {
        return String.format(
            "GroundwaterSensorTelemetry{station='%s', district='%s', depth=%.2fm, TDS=%.0fppm, time=%s}",
            stationId, district, depthBelowGroundLevelMeters, getEstimatedTdsPpm(), recordedAt
        );
    }
}
