export type CollectorStatus =
  | "NEW"
  | "ACCEPTED"
  | "REACHED"
  | "COLLECTING"
  | "COLLECTED"
  | "DELIVERING"
  | "DELIVERED"
  | "COMPLETED";

export type SampleItem = { name: string; type: string; collected: boolean; sampleId?: string; appointmentTestId?: string };

export type CollectorBooking = {
  id: string;
  offerId?: string;
  homeCollectionId?: string;
  labId?: string;
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
  reportStatus?: string;
  reportUrl?: string;
};

