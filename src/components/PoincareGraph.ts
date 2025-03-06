import { HyperbolicPoint, HyperbolicLine, NormalizedPoint } from '../types';
import PoincareDiskGeometry from '../geometry/PoincareDiskGeometry';

export class PoincareGraph {
    public points: HyperbolicPoint[] = [];
    public lines: HyperbolicLine[] = [];
    private geometry: PoincareDiskGeometry;

    constructor(geometry: PoincareDiskGeometry) {
        this.geometry = geometry;
    }

    public addPoint(point: HyperbolicPoint): void {
        this.points.push(point);
    }

    public addLine(start: HyperbolicPoint, end: HyperbolicPoint): void {
        this.lines.push({ start, end });
    }

    public removePoint(point: HyperbolicPoint): void {
        this.points = this.points.filter(p => p !== point);
        this.lines = this.lines.filter(line =>
            line.start !== point && line.end !== point
        );
    }

    public removePoints(pointsToRemove: HyperbolicPoint[]): void {
        const pointSet = new Set(pointsToRemove);
        this.points = this.points.filter(p => !pointSet.has(p));
        this.lines = this.lines.filter(line =>
            !pointSet.has(line.start) && !pointSet.has(line.end)
        );
    }

    public findPointNear(normalizedPoint: NormalizedPoint): HyperbolicPoint | undefined {
        const DISTANCE_THRESHOLD = 0.03; // Adjust this value as needed

        for (const point of this.points) {
            const pointNormalized = this.geometry.getNormalizedPointFromHyperbolicPoint(point);
            const distance = Math.sqrt(
                Math.pow(pointNormalized.x - normalizedPoint.x, 2) +
                Math.pow(pointNormalized.y - normalizedPoint.y, 2)
            );

            if (distance < DISTANCE_THRESHOLD) {
                return point;
            }
        }

        return undefined;
    }

    public findConnectedComponents(startPoint: HyperbolicPoint): HyperbolicPoint[] {
        const visited = new Set<HyperbolicPoint>();
        const stack: HyperbolicPoint[] = [startPoint];

        while (stack.length > 0) {
            const current = stack.pop()!;

            if (!visited.has(current)) {
                visited.add(current);

                // Find all lines connected to this point
                this.lines.forEach(line => {
                    if (line.start === current && !visited.has(line.end)) {
                        stack.push(line.end);
                    }
                    if (line.end === current && !visited.has(line.start)) {
                        stack.push(line.start);
                    }
                });
            }
        }

        return Array.from(visited);
    }

    public clear(): void {
        this.points = [];
        this.lines = [];
    }
}

export default PoincareGraph; 