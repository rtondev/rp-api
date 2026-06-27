import { BadRequestException } from '@nestjs/common';
import { MAX_PROXIMITY_METERS } from './phone.util';

export function distanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function assertWithinMeters(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  maxMeters = MAX_PROXIMITY_METERS,
): void {
  const distance = distanceInMeters(userLat, userLon, targetLat, targetLon);

  if (distance > maxMeters) {
    throw new BadRequestException(
      `Você precisa estar a no máximo ${maxMeters}m do local para continuar. Distância atual: ~${Math.round(distance)}m.`,
    );
  }
}
