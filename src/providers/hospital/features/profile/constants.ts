// Fixed option lists for the hospital profile form — mirror the backend enums
// (hospitalservice model/enums) and docs/UI-Form.md. Send the enum value, show the label.

export const OWNERSHIP_TYPES = [["PRIVATE", "Private"], ["TRUST", "Trust"]] as const;

export const HOSPITAL_TYPES = [
  ["CLINIC", "Clinic"],
  ["NURSING_HOME", "Nursing Home"],
  ["HOSPITAL", "Hospital"],
  ["SUPER_SPECIALITY", "Super Speciality"],
  ["MEDICAL_COLLEGE", "Medical College"],
] as const;

export const AMBULANCE_TYPES = [["NORMAL", "Normal"], ["BLS", "BLS"], ["VENTILATOR", "Ventilator"]] as const;

// Tamil Nadu's 38 districts — exact spelling matters (district reports match on it).
export const DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode",
  "Kallakurichi", "Kancheepuram", "Kanniyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
  "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem",
  "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur",
  "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar",
];

export const BUSINESS_TYPES = [
  ["private_limited", "Private Ltd"], ["public_limited", "Public Ltd"], ["llp", "LLP"], ["partnership", "Partnership"],
  ["proprietorship", "Proprietorship"], ["trust", "Trust"], ["society", "Society"], ["ngo", "NGO"],
  ["individual", "Individual"], ["educational_institutes", "Educational"], ["not_yet_registered", "Not yet registered"],
] as const;

export const labelOf = (list: readonly (readonly [string, string])[], v?: string | null) =>
  list.find(([k]) => k === v)?.[1] ?? (v ? v.replace(/_/g, " ") : "—");
