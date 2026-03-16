export type Patient = {
  id: number;
  initials: string;
  name: string;
  plan: string;
  age: string;
  since: string;
  price: string;
  visits: number;
  upcoming: number;
  metrics: number;
  avatarClass: 'green' | 'yellow';
};

export type Appointment = {
  id: number;
  day: string;
  month: string;
  year: string;
  title: string;
  clinic: string;
  location: string;
  time: string;
  type: string;
  status: 'Scheduled' | 'Completed';
  patientId: number;
  clinician: string;
};

export const patients: Patient[] = [
  {
    id: 1,
    initials: 'MT',
    name: 'Maria Thompson',
    plan: 'Diabetes Care Plan',
    age: '42',
    since: 'Jan 2024',
    price: '$75',
    visits: 8,
    upcoming: 2,
    metrics: 12,
    avatarClass: 'green',
  },
  {
    id: 2,
    initials: 'JR',
    name: 'James Reynolds',
    plan: 'Cardiac Care Plan',
    age: '58',
    since: 'Mar 2024',
    price: '$90',
    visits: 5,
    upcoming: 1,
    metrics: 9,
    avatarClass: 'yellow',
  },
];

export const appointments: Appointment[] = [
  {
    id: 1,
    day: '18',
    month: 'Apr',
    year: '2025',
    title: 'Follow-up Consultation',
    clinic: 'Portmore Health Centre',
    location: '14 Main Street, Portmore',
    time: '10:30 AM',
    type: 'Follow-up visit',
    status: 'Scheduled',
    patientId: 1,
    clinician: 'Dr. Brown',
  },
  {
    id: 2,
    day: '22',
    month: 'Apr',
    year: '2025',
    title: 'Cardiac Review',
    clinic: 'Kingston Med Centre',
    location: '5 Harbour St, Kingston',
    time: '2:00 PM',
    type: 'Routine checkup',
    status: 'Scheduled',
    patientId: 2,
    clinician: 'Dr. Lewis',
  },
  {
    id: 3,
    day: '02',
    month: 'Mar',
    year: '2025',
    title: 'Initial Assessment',
    clinic: 'Portmore Health Centre',
    location: '14 Main Street, Portmore',
    time: '9:00 AM',
    type: 'Initial assessment',
    status: 'Completed',
    patientId: 1,
    clinician: 'Dr. Brown',
  },
];

