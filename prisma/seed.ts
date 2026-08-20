import { AppointmentStatus, PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const demoAccounts = {
  admin: { email: 'admin@drrashida.com', password: 'Admin@12345', name: 'Dr. Rashida Admin', phone: '+919999999901', role: Role.ADMIN },
  doctor: { email: 'doctor@drrashida.com', password: 'Doctor@12345', name: 'Dr. Rashida', phone: '+919999999902', role: Role.DOCTOR },
  patient: { email: 'patient@drrashida.com', password: 'Patient@12345', name: 'Demo Patient', phone: '+919999999903', role: Role.PATIENT }
} as const;

async function upsertDemoUser(account: (typeof demoAccounts)[keyof typeof demoAccounts]) {
  const passwordHash = await bcrypt.hash(account.password, 12);
  return prisma.user.upsert({
    where: { email: account.email },
    update: { name: account.name, phone: account.phone, role: account.role, isActive: true, passwordHash },
    create: { email: account.email, name: account.name, phone: account.phone, role: account.role, isActive: true, passwordHash }
  });
}

function dateKey(date: Date) { return date.toISOString().slice(0, 10); }
function localDateTime(date: Date, time: string) { return new Date(`${dateKey(date)}T${time}:00.000+05:30`); }

async function findDemoSlot(doctorProfileId: string, doctorUserId: string, serviceId: string) {
  const service = await prisma.service.findUniqueOrThrow({ where: { id: serviceId } });
  for (let offset = 7; offset < 90; offset += 1) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + offset);
    const weekday = date.getUTCDay();
    const rule = await prisma.availabilityRule.findUnique({ where: { doctorId_weekday: { doctorId: doctorProfileId, weekday } } });
    if (!rule || !rule.active) continue;
    const localDate = dateKey(date);
    const holiday = await prisma.holiday.findUnique({ where: { doctorId_date: { doctorId: doctorProfileId, date: new Date(`${localDate}T00:00:00.000Z`) } } });
    if (holiday) continue;
    const existing = await prisma.appointment.findFirst({ where: { doctorId: doctorUserId, localDate, localTime: rule.startTime, status: { notIn: ['CANCELLED', 'NO_SHOW'] } } });
    const blocked = await prisma.blockedSlot.findUnique({ where: { doctorId_date_time: { doctorId: doctorProfileId, date: new Date(`${localDate}T00:00:00.000Z`), time: rule.startTime } } });
    if (!existing && !blocked) return { date, localDate, localTime: rule.startTime, durationMin: service.durationMin };
  }
  throw new Error('Could not find a valid future slot for the demo appointment.');
}

async function main() {
  const admin = await upsertDemoUser(demoAccounts.admin);
  const doctorUser = await upsertDemoUser(demoAccounts.doctor);
  const patientUser = await upsertDemoUser(demoAccounts.patient);

  const doctor = await prisma.doctorProfile.upsert({
    where: { userId: doctorUser.id },
    update: { displayName: 'Dr. Rashida', specialization: 'General Physician', experience: '10 years', timezone: process.env.CLINIC_TIMEZONE || 'Asia/Kolkata' },
    create: { userId: doctorUser.id, displayName: 'Dr. Rashida', specialization: 'General Physician', experience: '10 years', languages: [], timezone: process.env.CLINIC_TIMEZONE || 'Asia/Kolkata' }
  });

  const patient = await prisma.patientProfile.upsert({
    where: { userId: patientUser.id },
    update: { dateOfBirth: new Date('1995-01-15T00:00:00.000Z'), gender: 'Male' },
    create: { userId: patientUser.id, dateOfBirth: new Date('1995-01-15T00:00:00.000Z'), gender: 'Male', consentAt: new Date() }
  });

  for (const weekday of [1, 2, 3, 4, 5]) {
    await prisma.availabilityRule.upsert({
      where: { doctorId_weekday: { doctorId: doctor.id, weekday } },
      update: { startTime: '09:00', endTime: '20:00', breakStart: '13:00', breakEnd: '17:00', slotMinutes: 30, active: true },
      create: { doctorId: doctor.id, weekday, startTime: '09:00', endTime: '20:00', breakStart: '13:00', breakEnd: '17:00', slotMinutes: 30 }
    });
  }

  let service = await prisma.service.findFirst({ where: { active: true } });
  if (!service) service = await prisma.service.create({ data: { id: 'demo-general-consultation', name: 'General Consultation', description: 'Demo general physician consultation', durationMin: 30, fee: 500, active: true } });

  const bookingId = 'DRA-DEMO-APPOINTMENT';
  const existingDemoAppointment = await prisma.appointment.findUnique({ where: { bookingId } });
  const slot = existingDemoAppointment ? { date: existingDemoAppointment.startsAt, localDate: existingDemoAppointment.localDate, localTime: existingDemoAppointment.localTime, durationMin: service.durationMin } : await findDemoSlot(doctor.id, doctorUser.id, service.id);
  const startsAt = localDateTime(slot.date, slot.localTime);
  const endsAt = new Date(startsAt.getTime() + slot.durationMin * 60_000);
  await prisma.appointment.upsert({
    where: { bookingId },
    update: { doctorId: doctorUser.id, patientId: patient.userId, serviceId: service.id, consultationType: 'CLINIC', localDate: slot.localDate, localTime: slot.localTime, startsAt, endsAt, timezone: doctor.timezone, status: AppointmentStatus.CONFIRMED },
    create: { bookingId, doctorId: doctorUser.id, patientId: patient.userId, serviceId: service.id, consultationType: 'CLINIC', localDate: slot.localDate, localTime: slot.localTime, startsAt, endsAt, timezone: doctor.timezone, status: AppointmentStatus.CONFIRMED, statusHistory: { create: { toStatus: AppointmentStatus.CONFIRMED, changedById: admin.id } } }
  });

  await prisma.systemSetting.upsert({ where: { key: 'DEMO_MODE' }, update: { value: true }, create: { key: 'DEMO_MODE', value: true } });
  console.log('Demo accounts created successfully.');
  console.log('');
  console.log('ADMIN');
  console.log('Email: admin@drrashida.com');
  console.log('Password: Admin@12345');
  console.log('');
  console.log('DOCTOR');
  console.log('Email: doctor@drrashida.com');
  console.log('Password: Doctor@12345');
  console.log('');
  console.log('PATIENT');
  console.log('Email: patient@drrashida.com');
  console.log('Password: Patient@12345');
  console.log('');
  console.log('Database: PostgreSQL');
  console.log('Seed status: SUCCESS');
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Seed failed.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
