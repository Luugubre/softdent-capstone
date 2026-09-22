// src/types/clinical.ts

// Tipos de estados que puede tener una cara del diente
export type SurfaceStatus = "SANO" | "CARIES" | "RESTAURACION" | "SELLANTE" | "FRACTURA";

// Las 5 caras de un diente (Vestibular, Palatina/Lingual, Mesial, Distal, Oclusal)
export interface ToothSurfaces {
  vestibular: SurfaceStatus;
  palatine: SurfaceStatus;
  mesial: SurfaceStatus;
  distal: SurfaceStatus;
  oclusal: SurfaceStatus;
}

// Estados que afectan al diente completo (no a una cara específica)
export type ToothCondition = "SANO" | "AUSENTE" | "EXTRACCION_INDICADA" | "IMPLANTE" | "ENDODONCIA";

// Representación de un diente individual
export interface Tooth {
  id: number; // Ej: 11, 12, 13 (Nomenclatura FDI)
  condition: ToothCondition;
  surfaces: ToothSurfaces;
  notes?: string; // Observaciones del dentista
}

// El objeto JSON completo que se guardará en PostgreSQL
export interface OdontogramData {
  adultTeeth: Tooth[];   // Dientes permanentes
  childTeeth: Tooth[];   // Dientes temporales
  lastUpdated: string;   // Fecha de la última modificación
}