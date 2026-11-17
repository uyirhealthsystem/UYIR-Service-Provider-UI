/**
 * Which emergencies a doctor may handle, based on their specialty.
 *
 * Specialty codes come from the hospital service's /specialties list (e.g. "CAR001"); the letters before the
 * digits are the category ("CAR" = Heart & Vascular). Emergency codes come from /emergency-conditions:
 *
 *   EMG001 Chest Pain / Sweating / Palpitation   EMG009 Severe Bleeding / Trauma
 *   EMG002 Stroke / Paralysis / Sudden Weakness  EMG010 Fall / Fracture
 *   EMG003 Fits / Seizures / Fainting            EMG011 Abdominal Pain
 *   EMG004 Unconscious / Unresponsive            EMG012 Road Traffic Accident
 *   EMG005 Breathing Problem                     EMG013 Allergy / Anaphylaxis
 *   EMG006 Pregnancy Related Emergency           EMG014 Poison Intake
 *   EMG007 Child Emergency                       EMG015 Snake Bite / Animal Bite
 *   EMG008 Burns / Electric Shock                EMG016 Other Emergency
 *
 * A specialty code listed in BY_SPECIALTY wins over its category in BY_CATEGORY. A specialty with no entry
 * handles no emergencies. "ALL" = every emergency.
 *
 * TODO(product/medical review): this mapping is a first draft. Please have it checked and adjust here.
 */
const ALL = "ALL" as const;

const BY_CATEGORY: Record<string, readonly string[] | typeof ALL> = {
  EMC: ALL,                                                                       // Emergency & Critical Care
  GEN: ["EMG001", "EMG003", "EMG004", "EMG005", "EMG011", "EMG013", "EMG014", "EMG015", "EMG016"], // General Medicine
  GYN: ["EMG006"],                                                                // Women's Health
  PED: ["EMG007"],                                                                // Child Health
  CAR: ["EMG001"],                                                                // Heart & Vascular
  NEU: ["EMG002", "EMG003", "EMG004"],                                            // Brain & Nervous System
  ORT: ["EMG010", "EMG012"],                                                      // Bone & Joint
  GAS: ["EMG011"],                                                                // Digestive System
  NEP: ["EMG011"],                                                                // Kidney & Urinary
  PUL: ["EMG005"],                                                                // Lung & Respiratory
  SUR: ["EMG009", "EMG011", "EMG012"],                                            // Surgery
};

const BY_SPECIALTY: Record<string, readonly string[] | typeof ALL> = {
  PUL003: ["EMG004", "EMG005", "EMG013", "EMG014"],                               // Critical Care Medicine
  ORT006: ["EMG009", "EMG010", "EMG012"],                                         // Trauma Specialist
  SUR004: ["EMG008", "EMG009", "EMG010", "EMG012"],                               // Trauma Surgery
  PED005: ["EMG007", "EMG011"],                                                   // Pediatric Surgery
  ANA001: ["EMG004", "EMG005"],                                                   // Anaesthesiology
  ANA003: ["EMG004", "EMG005", "EMG013"],                                         // Critical Care Anaesthesia
};

/** Emergency codes a doctor with this specialty code may handle; null means all of them. */
export function allowedEmergencies(specialtyCode: string | undefined | null): readonly string[] | null {
  if (!specialtyCode) return [];
  const rule = BY_SPECIALTY[specialtyCode] ?? BY_CATEGORY[specialtyCode.replace(/\d+$/, "")] ?? [];
  return rule === ALL ? null : rule;
}
