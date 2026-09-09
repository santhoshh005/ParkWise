type ParkingZone = { id: string; name: string; latitude: number; longitude: number; totalSpaces: number; hourlyPrice: number };
type ModelPrediction = { zoneId: string; occupancyPercent: number };

const KORAMANGALA_CENTER = { latitude: 12.9352, longitude: 77.6245 };

function distanceInKilometers(latitude: number, longitude: number) {
  const toRadians = (value: number) => value * Math.PI / 180;
  const earthRadius = 6371;
  const latitudeDifference = toRadians(latitude - KORAMANGALA_CENTER.latitude);
  const longitudeDifference = toRadians(longitude - KORAMANGALA_CENTER.longitude);
  const a = Math.sin(latitudeDifference / 2) ** 2 + Math.cos(toRadians(KORAMANGALA_CENTER.latitude)) * Math.cos(toRadians(latitude)) * Math.sin(longitudeDifference / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function statusFor(availability: number) {
  if (availability >= 60) return "high";
  if (availability >= 30) return "medium";
  return "low";
}

function suggestedPrice(hourlyPrice: number, availability: number) {
  const multiplier = availability > 70 ? 0.85 : availability >= 40 ? 1 : 1.2;
  return Math.round(hourlyPrice * multiplier);
}

export function rankParkingZones(zones: ParkingZone[], predictions: ModelPrediction[]) {
  const predictionByZone = new Map(predictions.map((prediction) => [prediction.zoneId, prediction]));
  const distances = zones.map((zone) => distanceInKilometers(zone.latitude, zone.longitude));
  const maximumDistance = Math.max(...distances, 0.1);
  const prices = zones.map((zone) => zone.hourlyPrice);
  const minimumPrice = Math.min(...prices);
  const maximumPrice = Math.max(...prices);

  return zones.map((zone, index) => {
    const occupancyPercent = predictionByZone.get(zone.id)?.occupancyPercent ?? 100;
    const availabilityPercent = Number((100 - occupancyPercent).toFixed(1));
    const distanceKm = Number(distances[index].toFixed(2));
    const availabilityScore = availabilityPercent / 100;
    const distanceScore = 1 - distances[index] / maximumDistance;
    const priceScore = maximumPrice === minimumPrice ? 1 : 1 - (zone.hourlyPrice - minimumPrice) / (maximumPrice - minimumPrice);
    const recommendationScore = Number((availabilityScore * 0.55 + distanceScore * 0.30 + priceScore * 0.15).toFixed(3));
    return {
      ...zone, occupancyPercent, availabilityPercent, distanceKm,
      estimatedFreeSpaces: Math.round(zone.totalSpaces * availabilityPercent / 100),
      status: statusFor(availabilityPercent), suggestedHourlyPrice: suggestedPrice(zone.hourlyPrice, availabilityPercent), recommendationScore,
    };
  }).sort((first, second) => second.recommendationScore - first.recommendationScore);
}

export function recommendationExplanation(recommended: { availabilityPercent: number; distanceKm: number; hourlyPrice: number }) {
  const reasons = [`${recommended.availabilityPercent}% predicted availability`];
  if (recommended.distanceKm < 0.7) reasons.push("close to the area centre");
  if (recommended.hourlyPrice <= 40) reasons.push("a lower hourly cost");
  return `Recommended for its ${reasons.join(", ")}.`;
}
