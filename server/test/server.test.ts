import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rankParkingZones, recommendationExplanation, statusFor, suggestedPrice, type ParkingZone } from "../src/services/recommendation.js";
import { isValidDate, parsePredictionRequest } from "../src/validation.js";

const zone = (id: string, latitude: number, longitude: number, hourlyPrice = 40, totalSpaces = 100): ParkingZone => ({
  id, name: id, area: "Koramangala", latitude, longitude, totalSpaces, hourlyPrice,
});

describe("validation", () => {
  it("accepts a well-formed request", () => {
    const result = parsePredictionRequest({ date: "2026-11-09", time: "18:30", weather: "rainy", hasEvent: true });
    assert.equal(result.ok, true);
  });

  it("rejects impossible dates and times", () => {
    assert.equal(isValidDate("2026-02-30"), false);
    assert.equal(isValidDate("2026-13-01"), false);
    assert.equal(isValidDate("2028-02-29"), true);
    for (const time of ["24:00", "12:60", "9:00", "12:00:00"]) {
      assert.equal(parsePredictionRequest({ date: "2026-11-09", time, weather: "clear", hasEvent: false }).ok, false, time);
    }
  });

  it("rejects bad weather, non-boolean events and non-object bodies", () => {
    assert.equal(parsePredictionRequest({ date: "2026-11-09", time: "10:00", weather: "snow", hasEvent: false }).ok, false);
    assert.equal(parsePredictionRequest({ date: "2026-11-09", time: "10:00", weather: "clear", hasEvent: "yes" }).ok, false);
    assert.equal(parsePredictionRequest(null).ok, false);
    assert.equal(parsePredictionRequest("x").ok, false);
  });
});

describe("recommendation", () => {
  it("maps availability to status and dynamic price", () => {
    assert.equal(statusFor(60), "high");
    assert.equal(statusFor(30), "medium");
    assert.equal(statusFor(29.9), "low");
    assert.equal(suggestedPrice(40, 80), 34);
    assert.equal(suggestedPrice(40, 50), 40);
    assert.equal(suggestedPrice(40, 20), 48);
  });

  it("ranks the emptier zone first when location and price are equal", () => {
    const zones = [zone("a", 12.9352, 77.6245), zone("b", 12.9352, 77.6245)];
    const ranked = rankParkingZones(zones, [
      { zoneId: "a", occupancyPercent: 80, occupancyLow: 72, occupancyHigh: 88 },
      { zoneId: "b", occupancyPercent: 20, occupancyLow: 12, occupancyHigh: 28 },
    ]);
    assert.deepEqual(ranked.map((z) => z.id), ["b", "a"]);
    assert.equal(ranked[0].availabilityPercent, 80);
    assert.equal(ranked[0].availabilityLow, 72);
    assert.equal(ranked[0].availabilityHigh, 88);
    assert.equal(ranked[0].estimatedFreeSpaces, 80);
  });

  it("treats zones without a prediction as full and handles empty input", () => {
    const ranked = rankParkingZones([zone("a", 12.9352, 77.6245), zone("b", 12.93, 77.62)], [{ zoneId: "b", occupancyPercent: 50 }]);
    assert.equal(ranked.find((z) => z.id === "a")?.availabilityPercent, 0);
    assert.equal(ranked[0].id, "b");
    assert.deepEqual(rankParkingZones([], []), []);
  });

  it("scores price using the surge-adjusted rate", () => {
    // Same availability and location; the cheaper list price should win.
    const zones = [zone("pricey", 12.9352, 77.6245, 60), zone("cheap", 12.9352, 77.6245, 30)];
    const ranked = rankParkingZones(zones, [
      { zoneId: "pricey", occupancyPercent: 50 },
      { zoneId: "cheap", occupancyPercent: 50 },
    ]);
    assert.equal(ranked[0].id, "cheap");
    assert.match(recommendationExplanation(ranked[0]), /50% predicted availability/);
  });
});
