import { prisma } from './prisma';

function minutes(value: string) { const [hours, mins] = value.split(':').map(Number); return hours * 60 + mins; }
function clock(value: number) { return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`; }
export async function getAvailableSlots(localDate: string, serviceId: string) {
  const doctor = await prisma.doctorProfile.findFirst();
  if (!doctor) return [];
  const date = new Date(`${localDate}T00:00:00.000Z`);
  const holiday = await prisma.holiday.findFirst({ where: { doctorId: doctor.id, date } });
  if (holiday) return [];
  const weekday = new Date(`${localDate}T12:00:00.000Z`).getUTCDay();
  const rule = await prisma.availabilityRule.findUnique({ where: { doctorId_weekday: { doctorId: doctor.id, weekday } } });
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!rule || !service || !rule.active) return [];
  const blocked = await prisma.blockedSlot.findMany({ where: { doctorId: doctor.id, date } });
  const booked = await prisma.appointment.findMany({ where: { doctorId: doctor.userId, localDate, status: { notIn: ['CANCELLED', 'NO_SHOW'] } }, select: { localTime: true } });
  const blockedTimes = new Set(blocked.map(item => item.time));
  const bookedTimes = new Set(booked.map(item => item.localTime));
  const result: string[] = [];
  for (let cursor = minutes(rule.startTime); cursor + service.durationMin <= minutes(rule.endTime); cursor += rule.slotMinutes) {
    const time = clock(cursor);
    const inBreak = rule.breakStart && rule.breakEnd && cursor < minutes(rule.breakEnd) && cursor + service.durationMin > minutes(rule.breakStart);
    if (!inBreak && !blockedTimes.has(time) && !bookedTimes.has(time)) result.push(time);
  }
  return result;
}
