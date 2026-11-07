export type ParkingZone = {
  id: string;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  totalSpaces: number;
  hourlyPrice: number;
};

export type ModelPrediction = {
  zoneId: string;
  occupancyPercent: number;
  occupancyLow?: number;
  occupancyHigh?: number;
};

export const SCORE_WEIGHTS = { availability: 0.55, distance: 0.3, price: 0.15 } as const;
export const KORAMANGALA_CENTER = { latitude: 12.9352, longitude: 77.6245 };

const round = (value: number, digits = 1) => Number(value.toFixed(digits));

export function distanceInKilometers(latitude: number, longitude: number, origin = KORAMANGALA_CENTER) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const latitudeDifference = toRadians(latitude - origin.latitude);
  const longitudeDifference = toRadians(longitude - origin.longitude);
  const a = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(toRadians(origin.latitude)) * Math.cos(toRadians(latitude)) * Math.sin(longitudeDifference / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function statusFor(availability: number) {
  if (availability >= 60) return "high";
  if (availability >= 30) return "medium";
  return "low";
}

/** Dynamic price: discount when a lot is mostly empty, surge when it is nearly full. */
export function suggestedPrice(hourlyPrice: number, availability: number) {
  const multiplier = availability > 70 ? 0.85 : availability >= 40 ? 1 : 1.2;
  return Math.round(hourlyPrice * multiplier);
}

export function rankParkingZones(zones: ParkingZone[], predictions: ModelPrediction[]) {
  if (zones.length === 0) return [];
  const predictionByZone = new Map(predictions.map((prediction) => [prediction.zoneId, prediction]));
  const distances = zones.map((zone) => distanceInKilometers(zone.latitude, zone.longitude));
  const maximumDistance = Math.max(...distances, 0.1);

  const enriched = zones.map((zone, index) => {
    // A zone the model could not score is treated as full so it is never recommended.
    const prediction = predictionByZone.get(zone.id);
    const occupancyPercent = prediction?.occupancyPercent ?? 100;
    const availabilityPercent = round(100 - occupancyPercent);
    return {
      ...zone,
      occupancyPercent,
      availabilityPercent,
      availabilityLow: round(100 - (prediction?.occupancyHigh ?? occupancyPercent)),
      availabilityHigh: round(100 - (prediction?.occupancyLow ?? occupancyPercent)),
      distanceKm: round(distances[index], 2),
      estimatedFreeSpaces: Math.round((zone.totalSpaces * availabilityPercent) / 100),
      status: statusFor(availabilityPercent),
      suggestedHourlyPrice: suggestedPrice(zone.hourlyPrice, availabilityPercent),
      distanceScore: 1 - distances[index] / maximumDistance,
    };
  });

  // Score on the price the driver will actually pay, not the list price.
  const prices = enriched.map((zone) => zone.suggestedHourlyPrice);
  const minimumPrice = Math.min(...prices);
  const maximumPrice = Math.max(...prices);

  return enriched
    .map(({ distanceScore, ...zone }) => {
      const priceScore = maximumPrice === minimumPrice ? 1 : 1 - (zone.suggestedHourlyPrice - minimumPrice) / (maximumPrice - minimumPrice);
      const recommendationScore = round(
        (zone.availabilityPercent / 100) * SCORE_WEIGHTS.availability
          + distanceScore * SCORE_WEIGHTS.distance
          + priceScore * SCORE_WEIGHTS.price,
        3,
      );
      return { ...zone, recommendationScore };
    })
    .sort((first, second) => second.recommendationScore - first.recommendationScore || second.estimatedFreeSpaces - first.estimatedFreeSpaces);
}

export type RankedZone = ReturnType<typeof rankParkingZones>[number];

export function recommendationExplanation(recommended: RankedZone) {
  const reasons = [
    `${recommended.availabilityPercent}% predicted availability (~${recommended.estimatedFreeSpaces} of ${recommended.totalSpaces} spaces free)`,
  ];
  if (recommended.distanceKm < 0.7) reasons.push(`only ${recommended.distanceKm} km from the area centre`);
  if (recommended.suggestedHourlyPrice <= 40) reasons.push(`a low ₹${recommended.suggestedHourlyPrice}/hr rate`);
  return `Recommended for its ${reasons.join(", ")}.`;
}
