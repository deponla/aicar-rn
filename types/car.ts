export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  vin?: string;
}

export interface AnalysisResult {
  id: string;
  imageUrl?: string;
  description: string;
  urgency: 'critical' | 'warning' | 'info';
  title: string;
  recommendation: string;
  createdAt: string;
  car?: Car;
}

export enum UrgencyLevel {
  CRITICAL = 'critical',   // Kırmızı - Hemen Dur
  WARNING = 'warning',     // Sarı - Servise Git
  INFO = 'info',           // Yeşil/Mavi - Bilgi
}
