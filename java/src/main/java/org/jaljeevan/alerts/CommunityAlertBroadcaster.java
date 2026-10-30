package org.jaljeevan.alerts;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Community Hazard & Contamination Alert Broadcaster for Jal-Jeevan.
 * Routes location-based incident notifications to neighboring citizen endpoints.
 */
public class CommunityAlertBroadcaster {

    public enum AlertSeverity {
        CRITICAL, WARNING, INFORMATIONAL, RESOLVED
    }

    public static class IncidentAlert {
        public final String alertId;
        public final String district;
        public final String locality;
        public final String title;
        public final String description;
        public final AlertSeverity severity;
        public final Instant timestamp;
        public int confirmationCount;

        public IncidentAlert(
                String alertId,
                String district,
                String locality,
                String title,
                String description,
                AlertSeverity severity) {
            this.alertId = alertId;
            this.district = district;
            this.locality = locality;
            this.title = title;
            this.description = description;
            this.severity = severity;
            this.timestamp = Instant.now();
            this.confirmationCount = 1;
        }

        public void confirm() {
            this.confirmationCount++;
        }
    }

    private final List<IncidentAlert> alertStore = new ArrayList<>();

    public IncidentAlert publishAlert(String district, String locality, String title, String description, AlertSeverity severity) {
        String id = "JAL-ALT-" + System.currentTimeMillis();
        IncidentAlert alert = new IncidentAlert(id, district, locality, title, description, severity);
        alertStore.add(alert);
        return alert;
    }

    public List<IncidentAlert> getAlertsForDistrict(String district) {
        List<IncidentAlert> districtAlerts = new ArrayList<>();
        for (IncidentAlert a : alertStore) {
            if (a.district.equalsIgnoreCase(district)) {
                districtAlerts.add(a);
            }
        }
        return districtAlerts;
    }
}
