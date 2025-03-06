import { HyperbolicPoint, NormalizedPoint, ScreenPoint, HyperbolicLine, NormalizedArc } from '../types';

export class PoincareDiskGeometry {
    private canvasWidth: number;
    private canvasHeight: number;

    constructor(canvasWidth: number, canvasHeight: number) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    public updateCanvasDimensions(width: number, height: number): void {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }

    // https://en.wikipedia.org/wiki/Coordinate_systems_for_the_hyperbolic_plane
    public getNormalizedPointFromHyperbolicPoint(point: HyperbolicPoint): NormalizedPoint {
        const [xb, yb] = [Math.tanh(point.x), Math.tanh(point.y)];
        const [xp, yp] = [
            xb / (1 + Math.sqrt(1 - (xb ** 2) - (yb ** 2))),
            yb / (1 + Math.sqrt(1 - (xb ** 2) - (yb ** 2)))
        ]

        return {
            type: 'Normalized',
            x: xp,
            y: yp
        }
    }

    public getHyperbolicPointFromNormalizedPoint(point: NormalizedPoint): HyperbolicPoint | undefined {
        const [xp, yp] = [point.x, point.y];
        const rp = Math.sqrt(xp ** 2 + yp ** 2);

        if (rp === 0) {
            return undefined;
        }

        const rb = 2 * rp / (1 + rp ** 2);
        const [xb, yb] = [
            xp / rp * rb,
            yp / rp * rb
        ]

        return {
            type: 'Hyperbolic',
            x: Math.atanh(xb),
            y: Math.atanh(yb)
        }
    }

    // https://en.wikipedia.org/wiki/Poincar%C3%A9_disk_model
    public getNormalizedArcFromHyperbolicLine(line: HyperbolicLine): NormalizedArc {
        const { x: u1, y: u2 } = this.getNormalizedPointFromHyperbolicPoint(line.start);
        const { x: v1, y: v2 } = this.getNormalizedPointFromHyperbolicPoint(line.end);

        const d = u1 * v2 - u2 * v1;

        // Special case for diametric points (straight lines through center)
        if (Math.abs(d) < 1e-10) {
            // Line is straight through center
            return {
                center: { type: 'Normalized', x: 0, y: 0 },
                radius: Infinity, // Straight line through center
                startAngle: Math.atan2(u2, u1),
                endAngle: Math.atan2(v2, v1),
                isStraight: true
            };
        }

        const uSq = u1 ** 2 + u2 ** 2;
        const vSq = v1 ** 2 + v2 ** 2;

        const a = (u2 * (v1 ** 2 + v2 ** 2 + 1) - v2 * (u1 ** 2 + u2 ** 2 + 1)) / d;
        const b = (v1 * (u1 ** 2 + u2 ** 2 + 1) - u1 * (v1 ** 2 + v2 ** 2 + 1)) / d;

        const center: NormalizedPoint = {
            type: 'Normalized',
            x: -a / 2,
            y: -b / 2
        };

        const radius = Math.sqrt((a / 2) ** 2 + (b / 2) ** 2 - 1);

        // Calculate start/end angles explicitly
        let angleStart = Math.atan2(u2 - center.y, u1 - center.x);
        let angleEnd = Math.atan2(v2 - center.y, v1 - center.x);

        // Ensure correct short arc direction
        if (angleEnd < angleStart) angleEnd += 2 * Math.PI;
        if (angleEnd - angleStart > Math.PI) [angleStart, angleEnd] = [angleEnd, angleStart];

        return {
            center,
            radius,
            startAngle: angleStart,
            endAngle: angleEnd,
            isStraight: false
        };
    }

    public getNormalizedPointFromScreenPoint(point: ScreenPoint, canvas: HTMLCanvasElement): NormalizedPoint | undefined {
        const rect = canvas.getBoundingClientRect();

        // Check if point is within canvas boundaries
        if (point.x < rect.left || point.x > rect.right || point.y < rect.top || point.y > rect.bottom) {
            return undefined;
        }

        // Calculate normalized coordinates [-1, 1]
        // Canvas center is (0,0) in normalized coordinates
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Scale factor based on the smaller dimension to ensure -1 to 1 range
        const scaleFactor = Math.min(rect.width, rect.height) / 2;

        // Calculate normalized coordinates
        const nx = (point.x - centerX) / scaleFactor;
        const ny = -(point.y - centerY) / scaleFactor; // Negated to make y-down negative

        // Additional check to ensure coordinates are within the unit disk
        if (nx * nx + ny * ny > 1) {
            return undefined;
        }

        return {
            type: 'Normalized',
            x: nx,
            y: ny
        };
    }
}

export default PoincareDiskGeometry; 