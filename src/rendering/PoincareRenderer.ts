import { HyperbolicPoint, NormalizedPoint, ScreenPoint, NormalizedArc, Mode } from '../types';
import PoincareDiskGeometry from '../geometry/PoincareDiskGeometry';
import PoincareGraph from '../components/PoincareGraph';

export class PoincareRenderer {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private geometry: PoincareDiskGeometry;
    private graph: PoincareGraph;

    constructor(
        canvas: HTMLCanvasElement,
        context: CanvasRenderingContext2D,
        geometry: PoincareDiskGeometry,
        graph: PoincareGraph
    ) {
        this.canvas = canvas;
        this.context = context;
        this.geometry = geometry;
        this.graph = graph;
        this.setupCoordinateSystem();
    }

    public setupCoordinateSystem(): void {
        // Reset transformations
        this.context.setTransform(1, 0, 0, 1, 0, 0);

        // Move origin to center
        this.context.translate(this.canvas.width / 2, this.canvas.height / 2);

        // Scale to convert from [-1,1] coordinates to pixels
        const scale = Math.min(this.canvas.width, this.canvas.height) / 2;
        this.context.scale(scale, -scale); // Negative y to make downward negative
    }

    public draw(
        mode: Mode,
        editingPoints: HyperbolicPoint[],
        hoveredPoint: HyperbolicPoint | undefined,
        firstSelectedPoint: HyperbolicPoint | undefined,
        currentMousePosition: ScreenPoint | undefined,
        translatingPoints: HyperbolicPoint[] = [],
        originalNormalizedMousePoint: NormalizedPoint | undefined
    ): void {
        // Clear the canvas first
        this.context.save();
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.restore();

        // Draw the disk
        this.context.beginPath();
        this.context.arc(0, 0, 1, 0, Math.PI * 2);
        this.context.fillStyle = '#efefef';
        this.context.fill();
        this.context.closePath();

        // Draw the temporary line from firstSelectedPoint to cursor in Add mode
        if (mode === "Add" && firstSelectedPoint && currentMousePosition) {
            const normalizedMousePoint = this.geometry.getNormalizedPointFromScreenPoint(currentMousePosition, this.canvas);
            if (normalizedMousePoint) {
                const firstPointNormalized = this.geometry.getNormalizedPointFromHyperbolicPoint(firstSelectedPoint);

                this.context.beginPath();
                this.context.moveTo(firstPointNormalized.x, firstPointNormalized.y);
                this.context.lineTo(normalizedMousePoint.x, normalizedMousePoint.y);
                this.context.strokeStyle = '#00ffff';
                this.context.lineWidth = 0.01;
                this.context.stroke();
                this.context.closePath();
            }
        }

        // Draw the original points
        this.graph.points.forEach(point => {
            // Skip drawing original points that are being translated
            if (mode === "Translate" && editingPoints.includes(point)) {
                return;
            }

            const normalizedPoint = this.geometry.getNormalizedPointFromHyperbolicPoint(point);

            this.context.beginPath();

            // Default point radius
            let pointRadius = 0.01;

            // If point is hovered, increase radius by factor of 2
            if (point === hoveredPoint) {
                pointRadius *= 2;
            }

            // Set color based on mode and selection state
            if (editingPoints.includes(point)) {
                if (mode === "Add" || point === firstSelectedPoint) {
                    this.context.fillStyle = '#00ffff'; // Cyan color for Add mode
                } else {
                    this.context.fillStyle = 'red';
                }
            } else if (point === hoveredPoint) {
                if (mode === "Add") {
                    this.context.fillStyle = '#00ffff'; // Cyan color for Add mode
                } else {
                    this.context.fillStyle = '#666666';
                }
            } else if (point === firstSelectedPoint) {
                this.context.fillStyle = '#00ffff'; // Cyan color for firstSelectedPoint
            } else {
                this.context.fillStyle = 'black';
            }

            this.context.arc(normalizedPoint.x, normalizedPoint.y, pointRadius, 0, Math.PI * 2);
            this.context.fill();
            this.context.closePath();
        });

        // Draw translating points in Translate mode
        if (mode === "Translate" && translatingPoints.length > 0 && originalNormalizedMousePoint && currentMousePosition) {
            const currentNormalizedPoint = this.geometry.getNormalizedPointFromScreenPoint(currentMousePosition, this.canvas);

            if (currentNormalizedPoint) {
                // Calculate the normalized offset
                const normalizedOffset = {
                    x: currentNormalizedPoint.x - originalNormalizedMousePoint.x,
                    y: currentNormalizedPoint.y - originalNormalizedMousePoint.y
                };

                // Draw each translating point
                translatingPoints.forEach((point, index) => {
                    // Apply the normalized offset to the hyperbolic point
                    // This is intentionally adding a normalized offset to a hyperbolic point's coordinates
                    // as requested - it's just for visual preview
                    const offsetPoint: HyperbolicPoint = {
                        type: 'Hyperbolic',
                        x: point.x + normalizedOffset.x, // Intentionally adding normalized offset to hyperbolic coordinate
                        y: point.y + normalizedOffset.y  // Intentionally adding normalized offset to hyperbolic coordinate
                    };

                    const normalizedPoint = this.geometry.getNormalizedPointFromHyperbolicPoint(offsetPoint);

                    this.context.beginPath();
                    this.context.arc(normalizedPoint.x, normalizedPoint.y, 0.01, 0, Math.PI * 2);
                    this.context.fillStyle = 'green';
                    this.context.fill();
                    this.context.closePath();
                });

                // Draw lines connecting the translating points
                // Find all lines that connect points in the translating set
                for (const line of this.graph.lines) {
                    const startIndex = editingPoints.indexOf(line.start);
                    const endIndex = editingPoints.indexOf(line.end);

                    if (startIndex !== -1 && endIndex !== -1 &&
                        startIndex < translatingPoints.length &&
                        endIndex < translatingPoints.length) {

                        // Apply offset to the start and end points
                        const offsetStart: HyperbolicPoint = {
                            type: 'Hyperbolic',
                            x: translatingPoints[startIndex].x + normalizedOffset.x,
                            y: translatingPoints[startIndex].y + normalizedOffset.y
                        };

                        const offsetEnd: HyperbolicPoint = {
                            type: 'Hyperbolic',
                            x: translatingPoints[endIndex].x + normalizedOffset.x,
                            y: translatingPoints[endIndex].y + normalizedOffset.y
                        };

                        // Create a temporary line
                        const tempLine = {
                            start: offsetStart,
                            end: offsetEnd
                        };

                        // Draw the line
                        const arc = this.geometry.getNormalizedArcFromHyperbolicLine(tempLine);

                        this.context.beginPath();

                        if (arc.isStraight) {
                            const [nstart, nend] = [
                                this.geometry.getNormalizedPointFromHyperbolicPoint(offsetStart),
                                this.geometry.getNormalizedPointFromHyperbolicPoint(offsetEnd),
                            ]
                            this.context.moveTo(nstart.x, nstart.y);
                            this.context.lineTo(nend.x, nend.y);
                        } else {
                            this.context.arc(arc.center.x, arc.center.y, arc.radius, arc.startAngle, arc.endAngle);
                        }

                        this.context.strokeStyle = 'green';
                        this.context.lineWidth = 0.01;
                        this.context.stroke();
                    }
                }
            }
        }

        // Draw lines
        this.graph.lines.forEach(line => {
            // Skip drawing lines that connect translated points
            if (mode === "Translate" && editingPoints.includes(line.start) && editingPoints.includes(line.end)) {
                return;
            }

            const arc = this.geometry.getNormalizedArcFromHyperbolicLine(line);

            this.context.beginPath();

            if (arc.isStraight) {
                const [nstart, nend] = [
                    this.geometry.getNormalizedPointFromHyperbolicPoint(line.start),
                    this.geometry.getNormalizedPointFromHyperbolicPoint(line.end),
                ]
                this.context.moveTo(nstart.x, nstart.y);
                this.context.lineTo(nend.x, nend.y);
            } else {
                this.context.arc(arc.center.x, arc.center.y, arc.radius, arc.startAngle, arc.endAngle);
            }

            // Determine line color based on selection state of endpoints
            if (editingPoints.includes(line.start) && editingPoints.includes(line.end)) {
                this.context.strokeStyle = 'red';
            } else {
                this.context.strokeStyle = 'black';
            }

            this.context.lineWidth = 0.01;
            this.context.stroke();
        });
    }
}

export default PoincareRenderer; 