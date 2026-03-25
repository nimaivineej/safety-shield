import { PrismaClient, SafeZone, RiskZone } from '@prisma/client';

const prisma = new PrismaClient();

export class LocationService {
    // Calculate distance between two coordinates (Haversine formula)
    private calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    async getNearbySafeZones(
        latitude: number,
        longitude: number,
        radiusKm: number = 5
    ): Promise<(SafeZone & { distance: number })[]> {
        const allSafeZones = await prisma.safeZone.findMany();

        const nearby = allSafeZones
            .map((zone) => ({
                ...zone,
                distance: this.calculateDistance(latitude, longitude, zone.latitude, zone.longitude),
            }))
            .filter((zone) => zone.distance <= radiusKm * 1000)
            .sort((a, b) => a.distance - b.distance);

        return nearby;
    }

    async getNearbyRiskZones(
        latitude: number,
        longitude: number,
        radiusKm: number = 5
    ): Promise<(RiskZone & { distance: number })[]> {
        const allRiskZones = await prisma.riskZone.findMany();

        const nearby = allRiskZones
            .map((zone) => ({
                ...zone,
                distance: this.calculateDistance(latitude, longitude, zone.latitude, zone.longitude),
            }))
            .filter((zone) => zone.distance <= radiusKm * 1000)
            .sort((a, b) => a.distance - b.distance);

        return nearby;
    }

    async createSafeZone(data: {
        name: string;
        latitude: number;
        longitude: number;
        radius?: number;
        description?: string;
        reportedBy?: string;
    }): Promise<SafeZone> {
        return prisma.safeZone.create({
            data,
        });
    }

    async createRiskZone(data: {
        name: string;
        latitude: number;
        longitude: number;
        radius?: number;
        riskLevel?: string;
        description?: string;
        reportedBy?: string;
    }): Promise<RiskZone> {
        return prisma.riskZone.create({
            data,
        });
    }

    async calculateRouteSafety(
        waypoints: Array<{ latitude: number; longitude: number }>
    ): Promise<{
        safetyScore: number;
        riskZonesNearby: number;
        safeZonesNearby: number;
        warnings: string[];
    }> {
        let totalRiskZones = 0;
        let totalSafeZones = 0;
        const warnings: string[] = [];

        for (const point of waypoints) {
            const riskZones = await this.getNearbyRiskZones(point.latitude, point.longitude, 0.5);
            const safeZones = await this.getNearbySafeZones(point.latitude, point.longitude, 0.5);

            totalRiskZones += riskZones.length;
            totalSafeZones += safeZones.length;

            if (riskZones.length > 0) {
                warnings.push(
                    `Risk zone detected: ${riskZones[0].name} (${Math.round(riskZones[0].distance)}m away)`
                );
            }
        }

        // Calculate safety score (0-100)
        const safetyScore = Math.max(
            0,
            Math.min(100, 100 - totalRiskZones * 20 + totalSafeZones * 10)
        );

        return {
            safetyScore,
            riskZonesNearby: totalRiskZones,
            safeZonesNearby: totalSafeZones,
            warnings,
        };
    }
}
