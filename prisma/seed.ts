import { PrismaClient } from "@prisma/client";

/**
 * Seeds Koramangala parking zones and simulated hourly occupancy history.
 *
 * The simulation is reproducible (seeded PRNG) but intentionally noisy so that the
 * model's reported accuracy reflects genuine forecasting skill:
 *  - each zone has its own demand profile (mall, curbside, college, market, office);
 *  - weather is drawn per day, events are drawn per day and affect nearby zones most;
 *  - a per-zone daily offset (AR(1)) plus hourly Gaussian noise models real-world variance.
 *
 * Timestamps encode local wall-clock time as UTC (hour 18 = 6 PM in Koramangala),
 * which is how the ML feature pipeline reads them back.
 */

const prisma = new PrismaClient();

type Profile = "mall" | "curbside" | "college" | "market" | "office";
const zones: readonly [string, string, number, number, number, number, Profile][] = [
  ["kora-001", "Forum Mall Parking", 12.9352, 77.6245, 220, 50, "mall"],
  ["kora-002", "80 Feet Road Curbside", 12.9359, 77.6278, 90, 35, "curbside"],
  ["kora-003", "Sony World Junction", 12.934, 77.6305, 110, 40, "office"],
  ["kora-004", "Koramangala 5th Block", 12.9348, 77.6198, 160, 45, "curbside"],
  ["kora-005", "Raheja Arcade Parking", 12.935, 77.6156, 130, 55, "office"],
  ["kora-006", "Jyoti Nivas College", 12.9323, 77.6206, 100, 30, "college"],
  ["kora-007", "NGV Market Parking", 12.9288, 77.623, 140, 38, "market"],
  ["kora-008", "BTM Connector Curbside", 12.9308, 77.6272, 75, 28, "curbside"],
];

const DAYS = 120;
const FIRST_HOUR = 7;
const LAST_HOUR = 22;
const START = Date.UTC(2026, 5, 1); // Monday 1 June 2026
const EVENT_CENTER = { latitude: 12.9352, longitude: 77.6245 };

/** Mulberry32: small, fast, deterministic PRNG. */
function createRandom(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
  const gaussian = () => Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next());
  return { next, gaussian };
}

const bump = (hour: number, peak: number, width: number) => Math.exp(-((hour - peak) ** 2) / (2 * width ** 2));

/** Expected occupancy (%) for a zone profile at a given hour and day type. */
function baseDemand(profile: Profile, hour: number, dayOfWeek: number) {
  const weekend = dayOfWeek >= 5;
  const saturday = dayOfWeek === 5;
  switch (profile) {
    case "mall":
      return weekend
        ? 30 + 55 * bump(hour, 17, 3.5) + (saturday ? 6 : 0)
        : 22 + 25 * bump(hour, 13, 1.5) + 42 * bump(hour, 19.5, 2);
    case "curbside":
      return weekend
        ? 28 + 35 * bump(hour, 19, 3)
        : 30 + 38 * bump(hour, 9.5, 1.3) + 22 * bump(hour, 13.5, 1.2) + 40 * bump(hour, 18.5, 1.5);
    case "office":
      return weekend
        ? 18 + 18 * bump(hour, 16, 4)
        : 20 + 62 * bump(hour, 11.5, 3) + 15 * bump(hour, 18, 1.2);
    case "college":
      return weekend ? 14 + 8 * bump(hour, 12, 4) : 18 + 66 * bump(hour, 11, 2.6);
    case "market":
      return 26 + 36 * bump(hour, 9, 1.6) + 44 * bump(hour, 18.5, 2) + (weekend ? 10 : 0);
  }
}

function distanceKm(latitude: number, longitude: number) {
  const dLat = (latitude - EVENT_CENTER.latitude) * 111;
  const dLon = (longitude - EVENT_CENTER.longitude) * 111 * Math.cos((EVENT_CENTER.latitude * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
}

async function main() {
  const random = createRandom(20260601);
  const history: { parkingZoneId: string; recordedAt: Date; weather: string; hasEvent: boolean; occupancyPercent: number }[] = [];
  const dailyOffset = zones.map(() => 0);

  for (let day = 0; day < DAYS; day += 1) {
    const dayOfWeek = day % 7; // START is a Monday
    const weekend = dayOfWeek >= 5;

    // Monsoon-season weather: one condition per day, with a chance of afternoon rain.
    const roll = random.next();
    const dayWeather = roll < 0.22 ? "rainy" : roll < 0.5 ? "cloudy" : "clear";
    const afternoonRain = dayWeather === "cloudy" && random.next() < 0.3;

    // Events: more likely on weekends; start in the afternoon or evening.
    const hasEventToday = random.next() < (weekend ? 0.3 : 0.12);
    const eventStart = weekend ? 12 + Math.floor(random.next() * 6) : 17 + Math.floor(random.next() * 2);
    const eventEnd = Math.min(LAST_HOUR, eventStart + 3 + Math.floor(random.next() * 3));
    const eventStrength = 16 + random.next() * 14;

    zones.forEach((_, index) => {
      dailyOffset[index] = 0.6 * dailyOffset[index] + random.gaussian() * 3.5;
    });

    for (let hour = FIRST_HOUR; hour <= LAST_HOUR; hour += 1) {
      const weather = afternoonRain && hour >= 14 && hour <= 19 ? "rainy" : dayWeather;
      const hasEvent = hasEventToday && hour >= eventStart && hour <= eventEnd;
      const recordedAt = new Date(START + (day * 24 + hour) * 3_600_000);

      zones.forEach(([parkingZoneId, , latitude, longitude, , , profile], index) => {
        let occupancy = baseDemand(profile, hour, dayOfWeek);
        if (weather === "rainy") occupancy += profile === "curbside" ? -6 : profile === "college" ? 2 : 9;
        if (weather === "cloudy") occupancy += 2;
        if (hasEvent) occupancy += eventStrength * Math.exp(-distanceKm(latitude, longitude) / 0.6);
        occupancy += dailyOffset[index] + random.gaussian() * 4;
        history.push({
          parkingZoneId,
          recordedAt,
          weather,
          hasEvent,
          occupancyPercent: Number(Math.max(3, Math.min(99, occupancy)).toFixed(1)),
        });
      });
    }
  }

  await prisma.$transaction([
    prisma.historicalOccupancy.deleteMany(),
    prisma.parkingZone.deleteMany(),
    prisma.parkingZone.createMany({
      data: zones.map(([id, name, latitude, longitude, totalSpaces, hourlyPrice]) => ({
        id, name, latitude, longitude, totalSpaces, hourlyPrice, area: "Koramangala",
      })),
    }),
    prisma.historicalOccupancy.createMany({ data: history }),
  ]);
  console.log(`Seeded ${zones.length} zones and ${history.length} historical records over ${DAYS} days.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
