import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const zones = [
  ["kora-001", "Forum Mall Parking", 12.9352, 77.6245, 220, 50],
  ["kora-002", "80 Feet Road Curbside", 12.9359, 77.6278, 90, 35],
  ["kora-003", "Sony World Junction", 12.934, 77.6305, 110, 40],
  ["kora-004", "Koramangala 5th Block", 12.9348, 77.6198, 160, 45],
  ["kora-005", "Raheja Arcade Parking", 12.935, 77.6156, 130, 55],
  ["kora-006", "Jyoti Nivas College", 12.9323, 77.6206, 100, 30],
  ["kora-007", "NGV Market Parking", 12.9288, 77.623, 140, 38],
  ["kora-008", "BTM Connector Curbside", 12.9308, 77.6272, 75, 28]
] as const;

function occupancy(zone: number, day: number, hour: number, event: boolean, weather: string) {
  const weekday = day % 7 < 5;
  const commute = weekday && [9, 10, 18, 19].includes(hour) ? 27 : 0;
  const lunch = weekday && [13, 14].includes(hour) ? 12 : 0;
  const weekend = !weekday && hour >= 17 && hour <= 21 ? 18 : 0;
  const variation = ((day * 11 + hour * 3 + zone * 5) % 11) - 5;
  return Math.max(12, Math.min(96, 28 + (zone * 7) % 23 + commute + lunch + weekend + (event ? 22 : 0) + (weather === "rainy" ? 7 : 0) + variation));
}

async function main() {
  await prisma.historicalOccupancy.deleteMany();
  await prisma.parkingZone.deleteMany();
  for (const [id, name, latitude, longitude, totalSpaces, hourlyPrice] of zones) {
    await prisma.parkingZone.create({ data: { id, name, latitude, longitude, totalSpaces, hourlyPrice, area: "Koramangala" } });
  }
  const history: { parkingZoneId: string; recordedAt: Date; weather: string; hasEvent: boolean; occupancyPercent: number }[] = [];
  const start = new Date("2026-06-01T00:00:00.000Z");
  for (let day = 0; day < 84; day += 1) for (let hour = 7; hour <= 22; hour += 1) {
    const weather = day % 9 === 0 ? "rainy" : day % 6 === 0 && hour > 11 ? "cloudy" : "clear";
    const hasEvent = day % 12 === 4 && hour >= 17;
    const recordedAt = new Date(start.getTime() + (day * 24 + hour) * 3_600_000);
    zones.forEach(([parkingZoneId], index) => history.push({ parkingZoneId, recordedAt, weather, hasEvent, occupancyPercent: occupancy(index, day, hour, hasEvent, weather) }));
  }
  await prisma.historicalOccupancy.createMany({ data: history });
  console.log(`Seeded ${zones.length} zones and ${history.length} historical records.`);
}
main().finally(() => prisma.$disconnect());
