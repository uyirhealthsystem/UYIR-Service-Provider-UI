export type HospitalFieldType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "decimal"
  | "phone"
  | "email"
  | "textarea"
  | "list"
  | "staffList"
  | "multiSelect";

export type HospitalField = {
  key: string;
  label: string;
  type: HospitalFieldType;
  required?: boolean;
  options?: string[];
  itemLabel?: string;
  showWhen?: [string, boolean | string | number];
  optionsSource?: "specialties" | "emergencyConditions" | "labFacilities" | "doctorQualifications" | "designations";
  allowOther?: boolean;
  otherKey?: string;
};

export type HospitalSection = {
  title: string;
  fields: HospitalField[];
};

export const hospitalFields: HospitalSection[] = [
  {
    title: "Basic Information",
    fields: [
      { key: "hospitalInsured", label: "Is the hospital insured against damage?", type: "boolean", required: true },
      { key: "hospitalName", label: "Hospital Name", type: "text", required: true },
      { key: "email", label: "Hospital Email", type: "email", required: true },
      { key: "registrationNumber", label: "Registration Number", type: "text", required: true },
      {
        key: "ownershipType",
        label: "Ownership Type",
        type: "select",
        required: true,
        options: ["PRIVATE", "TRUST"],
      },
      {
        key: "hospitalType",
        label: "Hospital Type",
        type: "select",
        required: true,
        options: ["CLINIC", "NURSING_HOME", "HOSPITAL", "SUPER_SPECIALITY", "MEDICAL_COLLEGE"],
      },
    ],
  },
  {
    title: "Address",
    fields: [
      { key: "addressLine", label: "Address Line", type: "text", required: true },
      { key: "city", label: "City", type: "text", required: true },
      { key: "district", label: "District", type: "select", required: true, options: ["Ariyalur","Chengalpattu","Chennai","Coimbatore","Cuddalore","Dharmapuri","Dindigul","Erode","Kallakurichi","Kancheepuram","Kanniyakumari","Karur","Krishnagiri","Madurai","Mayiladuthurai","Nagapattinam","Namakkal","Nilgiris","Perambalur","Pudukkottai","Ramanathapuram","Ranipet","Salem","Sivaganga","Tenkasi","Thanjavur","Theni","Thoothukudi","Tiruchirappalli","Tirunelveli","Tirupathur","Tiruppur","Tiruvallur","Tiruvannamalai","Tiruvarur","Vellore","Viluppuram","Virudhunagar"] },
      { key: "state", label: "State", type: "select", required: true, options: ["Tamil Nadu"] },
      { key: "country", label: "Country", type: "select", required: true, options: ["India"] },
      { key: "pincode", label: "Pincode", type: "number", required: true },
    ],
  },
  {
    title: "Contact Details",
    fields: [
      { key: "phone", label: "Contact Number", type: "phone", required: true },
      { key: "alternatePhone", label: "Alternate Number", type: "phone" },
      { key: "emergencyHotline", label: "Emergency Hotline", type: "phone" },
      { key: "website", label: "Website", type: "text" },
    ],
  },
  {
    title: "Facilities",
    fields: [
      { key: "generalBeds", label: "General Beds", type: "number", required: true },
      { key: "icuBeds", label: "ICU Beds", type: "number", required: true },
      { key: "nicuBeds", label: "NICU Beds", type: "number", required: true },
      {
        key: "specialtyDepartments",
        label: "Specialty Departments",
        type: "multiSelect",
        optionsSource: "specialties",
        required: true,
        itemLabel: "Department",
      },
      { key: "labAvailable", label: "Laboratory Available", type: "boolean", required: true },
      {
        key: "labName",
        label: "Laboratory Name",
        type: "text",
        required: true,
        showWhen: ["labAvailable", true],
      },
      {
        key: "labQualification",
        label: "Laboratory Qualification",
        type: "select",
        options: ["DMLT", "BSc MLT", "BMLT", "MSc MLT", "MD Pathology", "DCP", "PhD Pathology"],
        required: true,
        showWhen: ["labAvailable", true],
      },
      {
        key: "labFacilities",
        label: "Laboratory Facilities",
        type: "multiSelect",
        optionsSource: "labFacilities",
        allowOther: true,
        otherKey: "labFacilitiesOther",
        required: true,
        itemLabel: "Facility",
        showWhen: ["labAvailable", true],
      },
      { key: "scanCentreAvailable", label: "Scan Centre Available", type: "boolean", required: true },
      {
        key: "scanCentreName",
        label: "Scan Centre Name",
        type: "text",
        required: true,
        showWhen: ["scanCentreAvailable", true],
      },
    ],
  },
  {
    title: "Emergency Services",
    fields: [
      { key: "handlesEmergencies", label: "Handles Emergencies", type: "boolean", required: true },
      {
        key: "specialtyEmergencyConditionsHandled",
        label: "Emergency Conditions",
        type: "multiSelect",
        optionsSource: "emergencyConditions",
        required: true,
        itemLabel: "Condition",
        showWhen: ["handlesEmergencies", true],
      },
      { key: "ambulanceAvailable", label: "Ambulance Available", type: "boolean", required: true },
      {
        key: "ambulanceTypes",
        label: "Ambulance Types",
        type: "multiSelect",
        options: ["NORMAL", "BLS", "VENTILATOR"],
        required: true,
        itemLabel: "Ambulance Type",
        showWhen: ["ambulanceAvailable", true],
      },
      {
        key: "ambulance24x7Available",
        label: "Ambulance Available 24x7",
        type: "boolean",
        required: true,
        showWhen: ["ambulanceAvailable", true],
      },
      {
        key: "willingToAttachAmbulanceToUdhs",
        label: "Attach Ambulance to UDHS",
        type: "boolean",
        required: true,
        showWhen: ["ambulanceAvailable", true],
      },
    ],
  },
  {
    title: "Staff Details",
    fields: [
      { key: "nursingStaffCount", label: "Nursing Staff Count", type: "number", required: true },
      { key: "supportiveStaffCount", label: "Supportive Staff Count", type: "number", required: true },
      {
        key: "udhsStaff",
        label: "UDHS Staff",
        type: "staffList",
        required: true,
        itemLabel: "Staff",
      },
    ],
  },
  {
    title: "Operations",
    fields: [
      { key: "pcpndtRegistrationNumber", label: "PCPNDT Registration Number (optional)", type: "text", required: false },
      {
        key: "empanelledInsuranceCompanies",
        label: "Insurance Companies Accepted for Patients",
        type: "multiSelect",
        options: ["CMCHIS (Chief Minister's Comprehensive Health Insurance Scheme)", "PM-JAY (Ayushman Bharat)", "New India Assurance", "United India Insurance", "Oriental Insurance", "National Insurance", "Star Health", "Niva Bupa", "Care Health", "HDFC ERGO", "ICICI Lombard", "Tata AIG", "Aditya Birla Health", "ManipalCigna", "SBI General"],
        required: false,
        allowOther: true,
        otherKey: "empanelledInsuranceCompaniesOther",
        itemLabel: "Insurance Company",
      },
      { key: "dedicatedPharmacyAvailable", label: "Dedicated Pharmacy Available", type: "boolean", required: true },
      { key: "hospitalManagementSoftwareInUse", label: "Management Software in Use", type: "boolean", required: true },
      { key: "usgAvailable", label: "USG Available", type: "boolean", required: true },
      { key: "xrayAvailable", label: "X-Ray Available", type: "boolean", required: true },
      { key: "ctAvailable", label: "CT Available", type: "boolean", required: true },
      { key: "mriAvailable", label: "MRI Available", type: "boolean", required: true },
      { key: "otherScans", label: "Other Scans", type: "multiSelect", options: ["PET-CT", "Mammography", "DEXA", "Echo", "ECG", "TMT", "EEG", "Doppler"], itemLabel: "Scan" },
    ],
  },
  {
    title: "Surgical Network",
    fields: [
      { key: "joinedSurgicalNetwork", label: "Joined Surgical Network", type: "boolean", required: true },
      {
        key: "operationTheatreCount",
        label: "Operation Theatre Count",
        type: "number",
        required: true,
        showWhen: ["joinedSurgicalNetwork", true],
      },
      {
        key: "laserEquipmentAvailable",
        label: "Laser Equipment Available",
        type: "boolean",
        required: true,
        showWhen: ["joinedSurgicalNetwork", true],
      },
      {
        key: "minimallyInvasiveEquipmentAvailable",
        label: "Minimally Invasive Equipment Available",
        type: "boolean",
        required: true,
        showWhen: ["joinedSurgicalNetwork", true],
      },
      {
        key: "postOpRecoveryRoomAvailable",
        label: "Post-op Recovery Room Available",
        type: "boolean",
        required: true,
        showWhen: ["joinedSurgicalNetwork", true],
      },
      {
        key: "endoscopyAvailable",
        label: "Endoscopy Available",
        type: "boolean",
        required: true,
        showWhen: ["joinedSurgicalNetwork", true],
      },
      {
        key: "laparoscopyUnitsAvailable",
        label: "Laparoscopy Units Available",
        type: "boolean",
        required: true,
        showWhen: ["joinedSurgicalNetwork", true],
      },
    ],
  },
  {
    title: "Doctor Details",
    fields: [
      { key: "doctorName", label: "Doctor full name", type: "text", required: true },
      { key: "doctorDob", label: "Date of Birth", type: "text", required: true },
      { key: "doctorSex", label: "Sex", type: "select", required: true, options: ["MALE", "FEMALE", "OTHER"] },
      { key: "tnmcNumber", label: "TNMC registration number", type: "text", required: true },
      { key: "doctorQualifications", label: "Qualifications", type: "multiSelect", optionsSource: "doctorQualifications", required: true, itemLabel: "Qualification" },
      { key: "doctorSpecialties", label: "Doctor specialties", type: "multiSelect", optionsSource: "specialties", required: true, itemLabel: "Specialty" },
      { key: "doctorEmergencyConditions", label: "Emergency conditions handled", type: "multiSelect", optionsSource: "emergencyConditions", itemLabel: "Condition" },
      { key: "doctorExperience", label: "Years of experience", type: "number" },
      { key: "doctorFee", label: "Consultation fee (₹)", type: "number" },
      { key: "doctorAvailability", label: "Availability", type: "select", required: true, options: ["CUSTOM_TIMINGS", "WHATSAPP_BUSINESS_HOURS"] },
      { key: "doctorCustomTimings", label: "Custom timings", type: "text", showWhen: ["doctorAvailability", "CUSTOM_TIMINGS"] },
      { key: "doctorEngagement", label: "Engagement type", type: "select", required: true, options: ["REGULAR", "ON_CALL"] },
      { key: "doctorCategory", label: "Doctor category", type: "select", options: ["PRIMARY", "FREELANCER"] },
      { key: "doctorPhone", label: "Doctor mobile number", type: "phone", required: true },
      { key: "doctorDepartment", label: "Hospital department", type: "select", optionsSource: "specialties" },
    ],
  },
];
