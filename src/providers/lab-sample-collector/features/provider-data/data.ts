export type CollectorStatus =
  | "NEW"
  | "ACCEPTED"
  | "REACHED"
  | "COLLECTING"
  | "COLLECTED"
  | "DELIVERING"
  | "DELIVERED"
  | "COMPLETED";

export type SampleItem = { name: string; type: string; collected: boolean };

export type CollectorBooking = {
  id: string;
  patient: string;
  age: number;
  gender: string;
  phone: string;
  date: string;
  time: string;
  address: string;
  distance: string;
  tests: SampleItem[];
  notes: string;
  amount: number;
  otp: string;
  labName: string;
  labAddress: string;
  status: CollectorStatus;
  collectionImage?: string;
  deliveryImage?: string;
  labConfirmed?: boolean;
};

export const collectorBookings: CollectorBooking[] = [
  {
    id: "COL-260912-001",
    patient: "Ravi Kumar",
    age: 42,
    gender: "Male",
    phone: "+91 98765 43210",
    date: "12 Sep 2026",
    time: "10:00 AM - 11:00 AM",
    address: "12, Green Park, Anna Nagar, Chennai - 600040",
    distance: "2.5 km",
    tests: [
      { name: "CBC (Blood)", type: "Blood", collected: false },
      { name: "HbA1c (Blood)", type: "Blood", collected: false },
      { name: "Lipid Profile", type: "Blood", collected: false },
    ],
    notes: "Please call the patient before arriving.",
    amount: 250,
    otp: "123456",
    labName: "City Diagnostics Lab",
    labAddress: "45, XYZ Road, T. Nagar, Chennai - 600017",
    status: "NEW",
  },
  {
    id: "COL-260912-002",
    patient: "Priya Sharma",
    age: 35,
    gender: "Female",
    phone: "+91 87654 32109",
    date: "12 Sep 2026",
    time: "12:00 PM - 01:00 PM",
    address: "8, Lake View Road, Adyar, Chennai - 600020",
    distance: "4.1 km",
    tests: [{ name: "Thyroid Profile (T3, T4, TSH)", type: "Blood", collected: false }],
    notes: "Fasting sample. Carry the required collection tubes.",
    amount: 250,
    otp: "654321",
    labName: "City Diagnostics Lab",
    labAddress: "45, XYZ Road, T. Nagar, Chennai - 600017",
    status: "NEW",
  },
  {
    id: "COL-260912-003",
    patient: "Meena Iyer",
    age: 51,
    gender: "Female",
    phone: "+91 99887 66554",
    date: "Tomorrow",
    time: "04:00 PM - 05:00 PM",
    address: "7, 12th Cross, Indiranagar, Bengaluru - 560038",
    distance: "6.8 km",
    tests: [{ name: "Vitamin D", type: "Blood", collected: false }, { name: "HbA1c", type: "Blood", collected: false }],
    notes: "Routine home collection.",
    amount: 250,
    otp: "792345",
    labName: "City Diagnostics Lab",
    labAddress: "45, XYZ Road, T. Nagar, Chennai - 600017",
    status: "NEW",
  },
];
