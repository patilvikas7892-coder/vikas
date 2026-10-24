export interface WaterQualityMetrics {
  tds: number; // mg/L or ppm (BIS: Desirable 500, Max 2000)
  ph: number; // (BIS: 6.5 - 8.5)
  fluoride: number; // mg/L (BIS: Desirable 1.0, Max 1.5)
  nitrate: number; // mg/L (BIS: Max 45)
  arsenic: number; // mg/L (BIS: Max 0.01)
  hardness: number; // mg/L as CaCO3 (BIS: Desirable 200, Max 600)
  iron: number; // mg/L (BIS: Max 1.0)
  chloride?: number; // mg/L (BIS: Desirable 250, Max 1000)
}

export type CgwbCategory = 'Safe' | 'Semi-Critical' | 'Critical' | 'Over-Exploited' | 'Saline';
export type PotabilityLevel = 'Potable with Basic Filter' | 'Requires RO / Treatment' | 'Hazardous / Non-Potable';
export type RechargePriority = 'Emergency' | 'High' | 'Moderate' | 'Low';

export interface DistrictGroundwaterInfo {
  id: string;
  district: string;
  state: string;
  zone: 'North' | 'South' | 'East' | 'West' | 'Central' | 'North-East';
  stageOfExtraction: number; // Percentage: e.g. 142 means 142% of annual recharge is extracted
  cgwbCategory: CgwbCategory;
  waterLevelPreMonsoon: number; // m BGL (meters Below Ground Level)
  waterLevelPostMonsoon: number; // m BGL
  waterLevelTrend: 'declining' | 'stable' | 'improving';
  annualRainfallMm: number;
  waterQuality: WaterQualityMetrics;
  wqiScore: number; // 0 - 100 (Higher is better/cleaner)
  potabilityStatus: PotabilityLevel;
  primaryAquiferType: string; // e.g. 'Hard Rock (Basalt)', 'Alluvium', 'Crystalline Granite'
  keyContaminants: string[];
  rechargePriority: RechargePriority;
  conservationSchemes: string[];
  recommendedRecharge: string;
  advisoryNote: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  districtContext?: string;
  suggestedActions?: string[];
  isStreaming?: boolean;
}

export interface BisStandardParam {
  name: string;
  unit: string;
  desirableLimit: number;
  permissibleLimit: number;
  healthImpact: string;
  treatmentMethod: string;
}

export type UserRole = 'citizen' | 'technician' | 'officer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  district: string;
  state: string;
  organization?: string;
  phone?: string;
}

export interface WaterFootprintActivities {
  bathing: number; // litres
  flushing: number;
  cookingDrinking: number;
  dishwashing: number;
  laundry: number;
  cleaning: number;
  gardeningCar: number;
  roRejectLoss: number;
}

export interface DailyWaterLog {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. 'Mon', 'Tue'
  householdSize: number;
  activities: WaterFootprintActivities;
  totalLitres: number;
  perCapitaLitres: number;
}

