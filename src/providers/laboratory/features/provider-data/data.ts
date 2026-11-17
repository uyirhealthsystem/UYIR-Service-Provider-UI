export type AppointmentStatus =
  | "CONFIRMED"
  | "RESCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | string;

export type AppointmentMode = "CENTER" | "HOME" | string;
export type AppointmentType = "LAB" | "SCAN" | string;

export type LabTest = {
  labTestId: string;
  price?: string | number | null;
  turnaroundTime?: number | null;
  status?: string;
  testCatalog?: {
    testCatalogId?: string;
    code?: string;
    name?: string;
    description?: string;
    category?: string | null;
  };
};

export type ScanService = {
  scanServiceId: string;
  price?: string | number | null;
  turnaroundTime?: number | null;
  equipmentRequired?: boolean;
  homeServiceAvailable?: boolean;
  status?: string;
  serviceCatalog?: {
    serviceCatalogId?: string;
    code?: string;
    name?: string;
    description?: string;
    category?: string | null;
  };
};

export type Appointment = {
  appointmentId: string;
  bookingId: string;
  patientId: string;
  labId?: string | null;
  scanCenterId?: string | null;
  appointmentType: AppointmentType;
  appointmentMode: AppointmentMode;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  address?: string | null;
  status: AppointmentStatus;
  patientNotes?: string | null;
  patient?: {
    patientId: string;
    name: string;
    gender?: string;
    age?: number;
    phone?: string;
  } | null;
  lab?: {
    labId: string;
    labUserId?: string;
    name?: string;
    registrationNumber?: string;
    phone?: string;
    email?: string;
    address?: string;
    districtId?: string;
  } | null;
  scanCenter?: {
    scanCenterId: string;
    scanCenterUserId?: string;
    name?: string;
    registrationNumber?: string;
    phone?: string;
    email?: string;
    address?: string;
    districtId?: string;
  } | null;
  tests?: Array<{
    appointmentTestId?: string;
    labTestId?: string;
    price?: string | number | null;
    status?: string;
    labTest?: LabTest;
  }>;
  services?: Array<{
    appointmentServiceId?: string;
    scanServiceId?: string;
    equipmentId?: string;
    price?: string | number | null;
    status?: string;
    scanService?: ScanService;
    equipment?: {
      equipmentId?: string;
      name?: string;
      equipmentType?: string;
      manufacturer?: string;
      modelNumber?: string;
    };
  }>;
  homeCollection?: HomeCollection | null;
  cancellation?: unknown;
  reschedules?: unknown[];
  report?: unknown | null;
  earning?: unknown | null;
};

export type HomeCollection = {
  homeCollectionId: string;
  appointmentId: string;
  address?: string | null;
  specialInstructions?: string | null;
  status?: string;
  assignedAt?: string | null;
  collectedAt?: string | null;
  completedAt?: string | null;
  appointment?: Appointment | null;
  collectorAssignment?: {
    collectorAssignmentId?: string;
    collectorId?: string;
    assignedAt?: string | null;
    status?: string;
    collector?: {
      collectorId?: string;
      name?: string;
      phone?: string;
      status?: string;
    };
  } | null;
  trackingEvents?: Array<{
    status?: string;
    createdAt?: string;
    note?: string;
  }>;
};

export function appointmentMatchesProvider(
  appointment: Appointment,
  labId?: string,
  scanCenterId?: string,
) {
  const appointmentLabId =
    appointment.labId || appointment.lab?.labId || null;

  const appointmentScanCenterId =
    appointment.scanCenterId || appointment.scanCenter?.scanCenterId || null;

  return Boolean(
    (labId && appointmentLabId === labId) ||
      (scanCenterId && appointmentScanCenterId === scanCenterId),
  );
}

export function appointmentValue(appointment: Appointment) {
  const testTotal = (appointment.tests || []).reduce((sum, item) => {
    const value = Number(item.price ?? item.labTest?.price ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const serviceTotal = (appointment.services || []).reduce((sum, item) => {
    const value = Number(item.price ?? item.scanService?.price ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  return testTotal + serviceTotal;
}

export function appointmentServiceNames(appointment: Appointment) {
  const tests = (appointment.tests || [])
    .map((item) => item.labTest?.testCatalog?.name)
    .filter(Boolean) as string[];
  const services = (appointment.services || [])
    .map((item) => item.scanService?.serviceCatalog?.name)
    .filter(Boolean) as string[];
  return [...tests, ...services];
}
