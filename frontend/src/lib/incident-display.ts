import { EventRecord } from "./types";

const Plate_Based_Types= new Set(["hit_and_run", "rash_driving"]);

export interface IncidentDisplay {
    isPlateBased: boolean;
    plateText: string | null;
    confidencePct: number;
    confidenceLabel: string;
}
export function getIncidentDisplay(alert: EventRecord) : IncidentDisplay {
    const isPlateBased= Plate_Based_Types.has(alert.event_type) && !!alert.extra?.plate_text;
    
    const confidencePct = alert.extra?.plate_confidence ??
    (alert.confidence <= 1 ? Math.round(alert.confidence * 100) : Math.round(alert.confidence));

  return {
    isPlateBased,
    plateText: isPlateBased ? alert.extra!.plate_text! : null,
    confidencePct,
    confidenceLabel: isPlateBased ? "OCR Confidence" : "Detection Confidence",
  };
}