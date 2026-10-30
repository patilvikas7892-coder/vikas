package org.jaljeevan.quality;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Bureau of Indian Standards (BIS IS 10500:2012) Quality Auditor.
 * Evaluates water potability and treatment mandates.
 */
public class WaterQualityAuditor {

    public static class QualityAuditResult {
        public final int wqiScore;
        public final String status;
        public final String potabilityVerdict;
        public final boolean requiresReverseOsmosis;
        public final List<String> healthHazards;

        public QualityAuditResult(
                int wqiScore,
                String status,
                String potabilityVerdict,
                boolean requiresReverseOsmosis,
                List<String> healthHazards) {
            this.wqiScore = wqiScore;
            this.status = status;
            this.potabilityVerdict = potabilityVerdict;
            this.requiresReverseOsmosis = requiresReverseOsmosis;
            this.healthHazards = healthHazards;
        }
    }

    public static QualityAuditResult audit(
            double tds,
            double ph,
            double fluoride,
            double nitrate,
            double arsenic,
            double hardness,
            double iron) {

        List<String> hazards = new ArrayList<>();
        double penalty = 0.0;

        // Arsenic check (Strict 0.01 mg/L limit)
        if (arsenic > 0.01) {
            penalty += 45.0;
            hazards.add(String.format("Carcinogenic Arsenic detected (%.3f mg/L > 0.01 mg/L ceiling)", arsenic));
        }

        // Fluoride check (Max 1.0 desirable, 1.5 permissible)
        if (fluoride > 1.5) {
            penalty += 35.0;
            hazards.add(String.format("High Fluoride (%.2f mg/L): Risk of crippling skeletal/dental fluorosis", fluoride));
        }

        // Nitrate check (Max 45 mg/L)
        if (nitrate > 45.0) {
            penalty += 25.0;
            hazards.add(String.format("Excessive Nitrate (%.1f mg/L): Blue Baby Syndrome risk in infants", nitrate));
        }

        // TDS check
        if (tds > 2000.0) {
            penalty += 25.0;
            hazards.add(String.format("Saline TDS (%.0f ppm): Gastrointestinal distress & scaling", tds));
        } else if (tds > 1000.0) {
            penalty += 15.0;
        }

        // pH check
        if (ph < 6.5 || ph > 8.5) {
            penalty += 20.0;
            hazards.add(String.format("Out of range pH (%.1f): Corrosive or bitter alkaline taste", ph));
        }

        int score = (int) Math.max(10, Math.min(100, Math.round(100 - penalty)));
        boolean needsRo = tds > 500.0 || fluoride > 1.5 || arsenic > 0.01;

        String status;
        String verdict;

        if (score >= 80) {
            status = "Excellent";
            verdict = "Safe drinking water with basic gravity or carbon filter. Do NOT install RO if TDS < 350.";
        } else if (score >= 60) {
            status = "Good";
            verdict = "Potable with standard UV purification. Balanced mineral composition.";
        } else if (score >= 40) {
            status = "Fair";
            verdict = "Requires RO with remineralization or specific Activated Alumina defluoridation.";
        } else {
            status = "Hazardous";
            verdict = "HAZARDOUS: Do not consume untreated water. Specialized community treatment required.";
        }

        return new QualityAuditResult(score, status, verdict, needsRo, hazards);
    }
}
