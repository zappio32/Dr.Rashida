import { PrismaClient, Role, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const accounts = [
  { email: process.env.SEED_ADMIN_EMAIL || 'admin@drrashidaahmad.com', password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345', role: Role.ADMIN, name: 'System Admin' },
  { email: process.env.SEED_DOCTOR_EMAIL || 'doctor@drrashidaahmad.com', password: process.env.SEED_DOCTOR_PASSWORD || 'Doctor@12345', role: Role.DOCTOR, name: 'Dr. Rashida Ahmad' },
  { email: process.env.SEED_PATIENT_EMAIL || 'patient.demo@example.com', password: process.env.SEED_PATIENT_PASSWORD || 'Patient@12345', role: Role.PATIENT, name: 'Demo Patient' }
];
async function main() {
  const users = new Map<string, string>();
  for (const account of accounts) {
    const user = await prisma.user.upsert({ where: { email: account.email }, update: { name: account.name, role: account.role }, create: { email: account.email, name: account.name, role: account.role, passwordHash: await bcrypt.hash(account.password, 12), forcePasswordChange: true } });
    users.set(account.role, user.id);
  }
  const doctor = await prisma.doctorProfile.upsert({ where: { userId: users.get(Role.DOCTOR)! }, update: {}, create: { userId: users.get(Role.DOCTOR)!, displayName: 'Dr. Rashida Ahmad', languages: [], timezone: process.env.CLINIC_TIMEZONE || 'Asia/Kolkata' } });
  await prisma.patientProfile.upsert({ where: { userId: users.get(Role.PATIENT)! }, update: {}, create: { userId: users.get(Role.PATIENT)!, age: 30, gender: 'Other', city: 'Demo City', consentAt: new Date() } });
  const services = [
    ['Online Ayurvedic Consultation', 'Personal guidance from the comfort of home.', 30, 1200],
    ['Ayurvedic Wellness Consultation', 'A considered review of everyday wellness goals.', 45, 1600],
    ['Follow-up Consultation', 'Continue care with a focused follow-up.', 20, 800]
  ] as const;
  for (const [name, description, durationMin, fee] of services) await prisma.service.upsert({ where: { id: name.toLowerCase().replaceAll(' ', '-') }, update: { description, durationMin, fee, active: true }, create: { id: name.toLowerCase().replaceAll(' ', '-'), name, description, durationMin, fee } });
  for (const weekday of [1, 2, 3, 4, 5, 6]) await prisma.availabilityRule.upsert({ where: { doctorId_weekday: { doctorId: doctor.id, weekday } }, update: {}, create: { doctorId: doctor.id, weekday, startTime: '10:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00', slotMinutes: 30 } });
  await prisma.systemSetting.upsert({ where: { key: 'DEMO_MODE' }, update: { value: process.env.DEMO_MODE === 'false' ? false : true }, create: { key: 'DEMO_MODE', value: true } });
  await prisma.systemSetting.upsert({ where: { key: 'PAY_AT_CLINIC' }, update: { value: true }, create: { key: 'PAY_AT_CLINIC', value: true } });
  console.log('Production seed complete. Development passwords are supplied through seed environment variables.');
}
main().catch(error => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
