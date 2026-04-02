// ─── Types ────────────────────────────────────────────────────────────────────

export type ClinicianProfile = {
  id: string;
  name: string;
  firstName: string;
  specialty: string;
  clinic: string;
  email: string;
  phone: string;
  license: string;
  initials: string;
};

export type PatientRow = {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  dob: string;
  age: number;
  condition: string;
  lastVisit: string;
  status: 'active' | 'stable' | 'review' | 'new';
  nextAppointment: string | null;
};

export type AppointmentRow = {
  id: string;
  patientId: string;
  patientName: string;
  patientInitials: string;
  date: string;
  dateLabel: string;
  time: string;
  duration: string;
  type: string;
  location: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  notes: string;
};

export type PatientNote = {
  id: string;
  patientId: string;
  date: string;
  author: string;
  content: string;
};

export type PatientVital = {
  patientId: string;
  label: string;
  value: string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  recordedAt: string;
};

// ─── Mock Clinician Profile ───────────────────────────────────────────────────

export const MOCK_CLINICIAN_PROFILE: ClinicianProfile = {
  id: 'clin-001',
  name: 'Dr. Jordan Seymour',
  firstName: 'Jordan',
  specialty: 'Internal Medicine',
  clinic: 'Island Echoes Health – Main Campus',
  email: 'j.seymour@islandechoeshealth.com',
  phone: '+1 (808) 555-0142',
  license: 'HI-MD-2019-04471',
  initials: 'JS',
};

// ─── Mock Patients ────────────────────────────────────────────────────────────

export const MOCK_PATIENTS: PatientRow[] = [
  {
    id: 'pat-001',
    name: 'Maile Kahananui',
    firstName: 'Maile',
    initials: 'MK',
    dob: 'Sep 14, 1968',
    age: 57,
    condition: 'Hypertension',
    lastVisit: 'Mar 28',
    status: 'review',
    nextAppointment: 'Apr 1 – 10:00 AM',
  },
  {
    id: 'pat-002',
    name: 'David Lum',
    firstName: 'David',
    initials: 'DL',
    dob: 'Feb 3, 1955',
    age: 71,
    condition: 'Diabetes Type 2',
    lastVisit: 'Mar 25',
    status: 'active',
    nextAppointment: 'Apr 3 – 9:30 AM',
  },
  {
    id: 'pat-003',
    name: 'Sofia Reyes',
    firstName: 'Sofia',
    initials: 'SR',
    dob: 'Jul 22, 1990',
    age: 35,
    condition: 'Asthma',
    lastVisit: 'Mar 20',
    status: 'stable',
    nextAppointment: 'Apr 7 – 2:00 PM',
  },
  {
    id: 'pat-004',
    name: 'James Nakamura',
    firstName: 'James',
    initials: 'JN',
    dob: 'Nov 9, 1978',
    age: 47,
    condition: 'Hyperlipidemia',
    lastVisit: 'Mar 15',
    status: 'stable',
    nextAppointment: null,
  },
  {
    id: 'pat-005',
    name: 'Lena Ferreira',
    firstName: 'Lena',
    initials: 'LF',
    dob: 'Apr 1, 2000',
    age: 26,
    condition: 'Anxiety Disorder',
    lastVisit: 'Apr 1',
    status: 'new',
    nextAppointment: 'Apr 1 – 11:30 AM',
  },
  {
    id: 'pat-006',
    name: 'Robert Tanaka',
    firstName: 'Robert',
    initials: 'RT',
    dob: 'Mar 17, 1962',
    age: 64,
    condition: 'COPD',
    lastVisit: 'Mar 29',
    status: 'review',
    nextAppointment: 'Apr 2 – 3:00 PM',
  },
  {
    id: 'pat-007',
    name: 'Priya Menon',
    firstName: 'Priya',
    initials: 'PM',
    dob: 'Aug 30, 1985',
    age: 40,
    condition: 'Hypothyroidism',
    lastVisit: 'Mar 10',
    status: 'active',
    nextAppointment: 'Apr 4 – 1:00 PM',
  },
  {
    id: 'pat-008',
    name: 'Kai Holbrook',
    firstName: 'Kai',
    initials: 'KH',
    dob: 'Dec 5, 1995',
    age: 30,
    condition: 'Migraine',
    lastVisit: 'Mar 22',
    status: 'active',
    nextAppointment: 'Apr 6 – 10:30 AM',
  },
];

// ─── Mock Appointments ────────────────────────────────────────────────────────

export const MOCK_APPOINTMENTS: AppointmentRow[] = [
  {
    id: 'appt-001',
    patientId: 'pat-001',
    patientName: 'Maile Kahananui',
    patientInitials: 'MK',
    date: '2026-04-01',
    dateLabel: 'Today',
    time: '10:00 AM',
    duration: '30 min',
    type: 'Follow-up',
    location: 'Room 4',
    status: 'confirmed',
    notes: 'Review recent BP readings. Patient reported dizziness last week. Adjust lisinopril dosage if warranted.',
  },
  {
    id: 'appt-002',
    patientId: 'pat-005',
    patientName: 'Lena Ferreira',
    patientInitials: 'LF',
    date: '2026-04-01',
    dateLabel: 'Today',
    time: '11:30 AM',
    duration: '45 min',
    type: 'Initial Consult',
    location: 'Room 2',
    status: 'confirmed',
    notes: 'New patient referral from Dr. Ching. Presenting with generalized anxiety. Review history and discuss treatment options.',
  },
  {
    id: 'appt-003',
    patientId: 'pat-006',
    patientName: 'Robert Tanaka',
    patientInitials: 'RT',
    date: '2026-04-01',
    dateLabel: 'Today',
    time: '2:00 PM',
    duration: '30 min',
    type: 'Lab Review',
    location: 'Telehealth',
    status: 'pending',
    notes: 'Discuss spirometry results from last week. Patient may need referral to pulmonology.',
  },
  {
    id: 'appt-004',
    patientId: 'pat-002',
    patientName: 'David Lum',
    patientInitials: 'DL',
    date: '2026-04-02',
    dateLabel: 'Tomorrow',
    time: '9:00 AM',
    duration: '30 min',
    type: 'Follow-up',
    location: 'Room 1',
    status: 'confirmed',
    notes: 'HbA1c follow-up. Check foot exam and retinal screening referral status.',
  },
  {
    id: 'appt-005',
    patientId: 'pat-006',
    patientName: 'Robert Tanaka',
    patientInitials: 'RT',
    date: '2026-04-02',
    dateLabel: 'Tomorrow',
    time: '3:00 PM',
    duration: '45 min',
    type: 'Follow-up',
    location: 'Room 3',
    status: 'confirmed',
    notes: 'Post-lab follow-up for COPD management. Assess current inhaler technique.',
  },
  {
    id: 'appt-006',
    patientId: 'pat-007',
    patientName: 'Priya Menon',
    patientInitials: 'PM',
    date: '2026-04-03',
    dateLabel: 'Apr 3',
    time: '9:30 AM',
    duration: '30 min',
    type: 'Follow-up',
    location: 'Telehealth',
    status: 'confirmed',
    notes: 'Thyroid function test review. Discuss fatigue symptoms.',
  },
  {
    id: 'appt-007',
    patientId: 'pat-002',
    patientName: 'David Lum',
    patientInitials: 'DL',
    date: '2026-04-03',
    dateLabel: 'Apr 3',
    time: '10:30 AM',
    duration: '30 min',
    type: 'Medication Review',
    location: 'Room 4',
    status: 'pending',
    notes: 'Review metformin tolerance. Patient reported GI discomfort.',
  },
  {
    id: 'appt-008',
    patientId: 'pat-004',
    patientName: 'James Nakamura',
    patientInitials: 'JN',
    date: '2026-04-04',
    dateLabel: 'Apr 4',
    time: '11:00 AM',
    duration: '30 min',
    type: 'Annual Physical',
    location: 'Room 2',
    status: 'confirmed',
    notes: 'Annual wellness exam. Lipid panel ordered.',
  },
  {
    id: 'appt-009',
    patientId: 'pat-007',
    patientName: 'Priya Menon',
    patientInitials: 'PM',
    date: '2026-04-04',
    dateLabel: 'Apr 4',
    time: '1:00 PM',
    duration: '30 min',
    type: 'Follow-up',
    location: 'Room 1',
    status: 'confirmed',
    notes: 'In-person follow-up. Check levothyroxine dose efficacy.',
  },
  {
    id: 'appt-010',
    patientId: 'pat-001',
    patientName: 'Maile Kahananui',
    patientInitials: 'MK',
    date: '2026-04-05',
    dateLabel: 'Apr 5',
    time: '9:00 AM',
    duration: '15 min',
    type: 'Blood Pressure Check',
    location: 'Room 4',
    status: 'confirmed',
    notes: 'Quick BP recheck after dosage adjustment.',
  },
  {
    id: 'appt-011',
    patientId: 'pat-008',
    patientName: 'Kai Holbrook',
    patientInitials: 'KH',
    date: '2026-04-06',
    dateLabel: 'Apr 6',
    time: '10:30 AM',
    duration: '30 min',
    type: 'Follow-up',
    location: 'Telehealth',
    status: 'pending',
    notes: 'Migraine frequency log review. Assess triptan efficacy.',
  },
  {
    id: 'appt-012',
    patientId: 'pat-003',
    patientName: 'Sofia Reyes',
    patientInitials: 'SR',
    date: '2026-04-07',
    dateLabel: 'Apr 7',
    time: '2:00 PM',
    duration: '30 min',
    type: 'Asthma Review',
    location: 'Room 3',
    status: 'confirmed',
    notes: 'Peak flow review. Discuss controller vs. rescue inhaler use.',
  },
];

// ─── Mock Patient Notes ───────────────────────────────────────────────────────

export const MOCK_PATIENT_NOTES: PatientNote[] = [
  {
    id: 'note-001',
    patientId: 'pat-001',
    date: 'Mar 28, 2026',
    author: 'Dr. Jordan Seymour',
    content: 'Patient presents with persistent BP readings above 150/95 over the past two weeks. Currently on lisinopril 10mg daily. Ordered 24-hour ambulatory blood pressure monitoring. Will consider dose increase at next visit.',
  },
  {
    id: 'note-002',
    patientId: 'pat-001',
    date: 'Feb 14, 2026',
    author: 'Dr. Jordan Seymour',
    content: 'Routine follow-up. BP stable at 138/88. No new complaints. Continue current regimen. Reminded patient of low-sodium dietary recommendations.',
  },
  {
    id: 'note-003',
    patientId: 'pat-002',
    date: 'Mar 25, 2026',
    author: 'Dr. Jordan Seymour',
    content: 'HbA1c returned at 7.8%. Slight increase from 7.4% three months ago. Reviewed diet diary. Patient reports difficulty with carb counting. Referred to diabetes educator. Continue metformin 1000mg BID.',
  },
  {
    id: 'note-004',
    patientId: 'pat-002',
    date: 'Dec 18, 2025',
    author: 'Dr. Jordan Seymour',
    content: 'Quarterly diabetes review. HbA1c 7.4%, improved from 7.9%. Good response to lifestyle changes. Foot exam normal. Continue current plan.',
  },
  {
    id: 'note-005',
    patientId: 'pat-003',
    date: 'Mar 20, 2026',
    author: 'Dr. Jordan Seymour',
    content: 'Asthma well-controlled on fluticasone/salmeterol. Peak flow 88% predicted. No nocturnal symptoms reported. Continue current inhaler technique review at next visit.',
  },
  {
    id: 'note-006',
    patientId: 'pat-004',
    date: 'Mar 15, 2026',
    author: 'Dr. Jordan Seymour',
    content: 'Lipid panel results reviewed. LDL at 142 mg/dL, up from 128. Patient has been less active due to work schedule. Reinforced dietary changes. Starting rosuvastatin 10mg nightly.',
  },
  {
    id: 'note-007',
    patientId: 'pat-005',
    date: 'Apr 1, 2026',
    author: 'Dr. Jordan Seymour',
    content: 'Initial consult for generalized anxiety disorder. Patient reports 6+ months of persistent worry, difficulty concentrating, and sleep disruption. PHQ-9 score 11, GAD-7 score 14. Discussed CBT and SSRI options. Starting sertraline 25mg. Referred to therapy.',
  },
  {
    id: 'note-008',
    patientId: 'pat-006',
    date: 'Mar 29, 2026',
    author: 'Dr. Jordan Seymour',
    content: 'Spirometry shows FEV1/FVC ratio of 0.62, consistent with moderate COPD. Patient still smoking 5 cigarettes/day. Counseled on cessation. Initiating tiotropium bromide. Referral placed for pulmonology.',
  },
  {
    id: 'note-009',
    patientId: 'pat-007',
    date: 'Mar 10, 2026',
    author: 'Dr. Jordan Seymour',
    content: 'TSH at 4.8 mU/L. Slightly above optimal range. Patient reports ongoing fatigue and cold intolerance. Increasing levothyroxine from 75mcg to 88mcg. Recheck TSH in 6 weeks.',
  },
  {
    id: 'note-010',
    patientId: 'pat-008',
    date: 'Mar 22, 2026',
    author: 'Dr. Jordan Seymour',
    content: 'Migraine frequency has increased to 3-4/month. Rizatriptan working for acute episodes. Discussed preventive therapy. Starting propranolol 40mg BID. Headache diary requested.',
  },
];

// ─── Mock Patient Vitals ──────────────────────────────────────────────────────

export const MOCK_PATIENT_VITALS: PatientVital[] = [
  // pat-001 Maile Kahananui
  { patientId: 'pat-001', label: 'Blood Pressure', value: '152/94', unit: 'mmHg', trend: 'up', recordedAt: 'Mar 28' },
  { patientId: 'pat-001', label: 'Heart Rate', value: '78', unit: 'bpm', trend: 'stable', recordedAt: 'Mar 28' },
  { patientId: 'pat-001', label: 'Weight', value: '74.2', unit: 'kg', trend: 'stable', recordedAt: 'Mar 28' },
  { patientId: 'pat-001', label: 'O2 Saturation', value: '98', unit: '%', trend: 'stable', recordedAt: 'Mar 28' },
  // pat-002 David Lum
  { patientId: 'pat-002', label: 'Blood Pressure', value: '128/80', unit: 'mmHg', trend: 'down', recordedAt: 'Mar 25' },
  { patientId: 'pat-002', label: 'Heart Rate', value: '72', unit: 'bpm', trend: 'stable', recordedAt: 'Mar 25' },
  { patientId: 'pat-002', label: 'Weight', value: '88.5', unit: 'kg', trend: 'down', recordedAt: 'Mar 25' },
  { patientId: 'pat-002', label: 'O2 Saturation', value: '97', unit: '%', trend: 'stable', recordedAt: 'Mar 25' },
  // pat-003 Sofia Reyes
  { patientId: 'pat-003', label: 'Blood Pressure', value: '118/74', unit: 'mmHg', trend: 'stable', recordedAt: 'Mar 20' },
  { patientId: 'pat-003', label: 'Heart Rate', value: '68', unit: 'bpm', trend: 'stable', recordedAt: 'Mar 20' },
  { patientId: 'pat-003', label: 'Weight', value: '61.0', unit: 'kg', trend: 'stable', recordedAt: 'Mar 20' },
  { patientId: 'pat-003', label: 'O2 Saturation', value: '99', unit: '%', trend: 'up', recordedAt: 'Mar 20' },
  // pat-004 James Nakamura
  { patientId: 'pat-004', label: 'Blood Pressure', value: '132/86', unit: 'mmHg', trend: 'stable', recordedAt: 'Mar 15' },
  { patientId: 'pat-004', label: 'Heart Rate', value: '76', unit: 'bpm', trend: 'stable', recordedAt: 'Mar 15' },
  { patientId: 'pat-004', label: 'Weight', value: '82.1', unit: 'kg', trend: 'up', recordedAt: 'Mar 15' },
  { patientId: 'pat-004', label: 'O2 Saturation', value: '98', unit: '%', trend: 'stable', recordedAt: 'Mar 15' },
  // pat-005 Lena Ferreira
  { patientId: 'pat-005', label: 'Blood Pressure', value: '116/72', unit: 'mmHg', trend: 'stable', recordedAt: 'Apr 1' },
  { patientId: 'pat-005', label: 'Heart Rate', value: '88', unit: 'bpm', trend: 'up', recordedAt: 'Apr 1' },
  { patientId: 'pat-005', label: 'Weight', value: '56.8', unit: 'kg', trend: 'stable', recordedAt: 'Apr 1' },
  { patientId: 'pat-005', label: 'O2 Saturation', value: '99', unit: '%', trend: 'stable', recordedAt: 'Apr 1' },
  // pat-006 Robert Tanaka
  { patientId: 'pat-006', label: 'Blood Pressure', value: '138/88', unit: 'mmHg', trend: 'stable', recordedAt: 'Mar 29' },
  { patientId: 'pat-006', label: 'Heart Rate', value: '82', unit: 'bpm', trend: 'up', recordedAt: 'Mar 29' },
  { patientId: 'pat-006', label: 'Weight', value: '91.3', unit: 'kg', trend: 'stable', recordedAt: 'Mar 29' },
  { patientId: 'pat-006', label: 'O2 Saturation', value: '93', unit: '%', trend: 'down', recordedAt: 'Mar 29' },
  // pat-007 Priya Menon
  { patientId: 'pat-007', label: 'Blood Pressure', value: '120/78', unit: 'mmHg', trend: 'stable', recordedAt: 'Mar 10' },
  { patientId: 'pat-007', label: 'Heart Rate', value: '64', unit: 'bpm', trend: 'stable', recordedAt: 'Mar 10' },
  { patientId: 'pat-007', label: 'Weight', value: '63.4', unit: 'kg', trend: 'stable', recordedAt: 'Mar 10' },
  { patientId: 'pat-007', label: 'O2 Saturation', value: '98', unit: '%', trend: 'stable', recordedAt: 'Mar 10' },
  // pat-008 Kai Holbrook
  { patientId: 'pat-008', label: 'Blood Pressure', value: '124/80', unit: 'mmHg', trend: 'stable', recordedAt: 'Mar 22' },
  { patientId: 'pat-008', label: 'Heart Rate', value: '70', unit: 'bpm', trend: 'stable', recordedAt: 'Mar 22' },
  { patientId: 'pat-008', label: 'Weight', value: '70.0', unit: 'kg', trend: 'stable', recordedAt: 'Mar 22' },
  { patientId: 'pat-008', label: 'O2 Saturation', value: '99', unit: '%', trend: 'stable', recordedAt: 'Mar 22' },
];
