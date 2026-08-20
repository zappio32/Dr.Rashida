import { Prisma, AppointmentStatus, PaymentStatus, NotificationChannel } from '@prisma/client';
import { prisma } from './prisma';
import { getAvailableSlots } from './availability';

export async function createAppointment(input: { patientId: string; serviceId: string; consultationType: string; localDate: string; localTime: string; concern?: string; notes?: string; }) {
  const doctor = await prisma.doctorProfile.findFirst({ include: { user: true } });
  if (!doctor) throw new Error('DOCTOR_NOT_CONFIGURED');
  const slots = await getAvailableSlots(input.localDate, input.serviceId);
  if (!slots.includes(input.localTime)) throw new Error('SLOT_UNAVAILABLE');
  const service = await prisma.service.findUniqueOrThrow({ where: { id: input.serviceId } });
  const startsAt = new Date(`${input.localDate}T${input.localTime}:00.000+05:30`);
  const endsAt = new Date(startsAt.getTime() + service.durationMin * 60000);
  const bookingId = `DRA-${input.localDate.replaceAll('-', '')}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
  try {
    return await prisma.$transaction(async tx => {
      const appointment = await tx.appointment.create({ data: { bookingId, doctorId: doctor.userId, patientId: input.patientId, serviceId: service.id, consultationType: input.consultationType, localDate: input.localDate, localTime: input.localTime, startsAt, endsAt, timezone: doctor.timezone, concern: input.concern, notes: input.notes, status: AppointmentStatus.CONFIRMED, paymentStatus: process.env.PAYMENT_REQUIRED === 'true' ? PaymentStatus.PENDING : PaymentStatus.NOT_REQUIRED, statusHistory: { create: { toStatus: AppointmentStatus.CONFIRMED, changedById: input.patientId } } }, include: { service: true } });
      if (appointment.paymentStatus !== PaymentStatus.NOT_REQUIRED) await tx.payment.create({ data: { appointmentId: appointment.id, amount: service.fee, status: PaymentStatus.PENDING, provider: process.env.PAYMENT_PROVIDER || 'configured-provider' } });
      const body = `New appointment booked\nPatient booking: ${appointment.bookingId}\nDate: ${input.localDate}\nTime: ${input.localTime}\nService: ${service.name}`;
      await tx.notification.createMany({ data: [{ userId: doctor.userId, appointmentId: appointment.id, channel: NotificationChannel.IN_APP, subject: 'New appointment booked', body }, { userId: input.patientId, appointmentId: appointment.id, channel: NotificationChannel.EMAIL, subject: 'Appointment confirmation', body }] });
      for (const hours of [24, 2]) { const runAt = new Date(startsAt.getTime() - hours * 3600000); if (runAt > new Date()) await tx.reminderJob.create({ data: { appointmentId: appointment.id, channel: NotificationChannel.EMAIL, runAt } }); }
      await tx.auditLog.create({ data: { userId: input.patientId, action: 'APPOINTMENT_CREATED', entity: 'Appointment', entityId: appointment.id } });
      return appointment;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new Error('SLOT_UNAVAILABLE');
    throw error;
  }
}
