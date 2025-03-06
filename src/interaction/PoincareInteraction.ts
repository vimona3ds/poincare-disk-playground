import { HyperbolicPoint, Mode, NormalizedPoint, ScreenPoint } from '../types';
import PoincareDiskGeometry from '../geometry/PoincareDiskGeometry';
import PoincareGraph from '../components/PoincareGraph';

export class PoincareInteraction {
    private canvas: HTMLCanvasElement;
    private geometry: PoincareDiskGeometry;
    private graph: PoincareGraph;
    private mode: Mode = "Select";
    private shiftKeyPressed: boolean = false;
    private firstSelectedPoint: HyperbolicPoint | undefined;
    private editingPoints: HyperbolicPoint[] = [];
    private hoveredPoint: HyperbolicPoint | undefined;
    private currentMousePosition: ScreenPoint | undefined;
    private translatingPoints: HyperbolicPoint[] = [];
    private originalNormalizedMousePoint: NormalizedPoint | undefined;
    private updateInfoCallback: (info: string) => void;
    private onStateChange: () => void;

    constructor(
        canvas: HTMLCanvasElement,
        geometry: PoincareDiskGeometry,
        graph: PoincareGraph,
        updateInfoCallback: (info: string) => void,
        onStateChange: () => void
    ) {
        this.canvas = canvas;
        this.geometry = geometry;
        this.graph = graph;
        this.updateInfoCallback = updateInfoCallback;
        this.onStateChange = onStateChange;
        this.setupEventListeners();
        this.updateInfoCallback(`Mode: ${this.mode}`);
    }

    public getMode(): Mode {
        return this.mode;
    }

    public getEditingPoints(): HyperbolicPoint[] {
        return this.editingPoints;
    }

    public getHoveredPoint(): HyperbolicPoint | undefined {
        return this.hoveredPoint;
    }

    public getFirstSelectedPoint(): HyperbolicPoint | undefined {
        return this.firstSelectedPoint;
    }

    public getCurrentMousePosition(): ScreenPoint | undefined {
        return this.currentMousePosition;
    }

    public getTranslatingPoints(): HyperbolicPoint[] {
        return this.translatingPoints;
    }

    public getOriginalNormalizedMousePoint(): NormalizedPoint | undefined {
        return this.originalNormalizedMousePoint;
    }

    private setMode(newMode: Mode): void {
        // If we're switching to Translate mode, set up the translating points
        if (newMode === "Translate" && this.mode !== "Translate") {
            // Create a deep copy of the editing points
            this.translatingPoints = this.editingPoints.map(point => ({
                type: 'Hyperbolic',
                x: point.x,
                y: point.y
            }));

            // Store the current mouse position as the reference point
            if (this.currentMousePosition) {
                this.originalNormalizedMousePoint = this.geometry.getNormalizedPointFromScreenPoint(
                    this.currentMousePosition,
                    this.canvas
                );
            }
        } else if (this.mode === "Translate" && newMode !== "Translate") {
            // Leaving translate mode, clear translating points
            this.translatingPoints = [];
            this.originalNormalizedMousePoint = undefined;
        }

        this.mode = newMode;
        this.updateInfoCallback(`Mode: ${this.mode}`);

        // Reset relevant states when changing modes
        if (this.mode !== "Add") {
            this.firstSelectedPoint = undefined;
        }

        this.onStateChange();
    }

    private setupEventListeners(): void {
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.geometry.updateCanvasDimensions(this.canvas.width, this.canvas.height);
            this.onStateChange();
        });

        // Track shift key press/release and handle keyboard shortcuts
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Shift') {
                this.shiftKeyPressed = true;
            } else if (event.key === 'Backspace' || event.key === 'Delete') {
                // If there are selected points, remove them
                if (this.editingPoints.length > 0) {
                    // Remove all selected points and connected lines
                    this.graph.removePoints(this.editingPoints);

                    // Clear the editing state
                    this.editingPoints = [];

                    // Redraw to reflect changes
                    this.onStateChange();
                }
            } else if (event.key.toLowerCase() === 's') {
                this.setMode("Select");
            } else if (event.key.toLowerCase() === 't') {
                this.setMode("Translate");
            } else if (event.key.toLowerCase() === 'a') {
                this.setMode("Add");
            }
        });

        window.addEventListener('keyup', (event) => {
            if (event.key === 'Shift') {
                this.shiftKeyPressed = false;
                if (this.mode === "Add") {
                    this.firstSelectedPoint = undefined;
                }
                this.onStateChange();
            }
        });

        // Handle mouse movement for hovering over points
        this.canvas.addEventListener('mousemove', (event) => {
            const screenPoint: ScreenPoint = { type: 'Screen', x: event.clientX, y: event.clientY };
            // Store current mouse position for drawing temporary line
            this.currentMousePosition = screenPoint;

            const normalizedPoint = this.geometry.getNormalizedPointFromScreenPoint(screenPoint, this.canvas);

            if (!normalizedPoint) {
                this.hoveredPoint = undefined;
                // Only clear editingPoint in the old behavior, not with new modes
                this.onStateChange();
                return;
            }

            // Handle mouse movement for Translate mode
            if (this.mode === "Translate" && this.translatingPoints.length > 0 && this.originalNormalizedMousePoint) {
                this.onStateChange(); // Redraw with updated translating points
                return;
            }

            // Otherwise, check if we're hovering over any point
            this.hoveredPoint = this.graph.findPointNear(normalizedPoint);
            this.onStateChange();
        });

        // Handle click for selecting/deselecting points
        this.canvas.addEventListener('click', (event) => {
            const screenPoint: ScreenPoint = { type: 'Screen', x: event.clientX, y: event.clientY };
            const normalizedPoint = this.geometry.getNormalizedPointFromScreenPoint(screenPoint, this.canvas);

            if (!normalizedPoint) {
                return;
            }

            // In translate mode, a click means apply the translation
            if (this.mode === "Translate" && this.translatingPoints.length > 0 && this.editingPoints.length > 0 && this.originalNormalizedMousePoint) {
                // Calculate the current offset
                const normalizedOffset = {
                    x: normalizedPoint.x - this.originalNormalizedMousePoint.x,
                    y: normalizedPoint.y - this.originalNormalizedMousePoint.y
                };

                // Update the original points with the new positions
                for (let i = 0; i < this.editingPoints.length && i < this.translatingPoints.length; i++) {
                    // Apply the offset to the translating point and then copy to editing point
                    this.editingPoints[i].x = this.translatingPoints[i].x + normalizedOffset.x;
                    this.editingPoints[i].y = this.translatingPoints[i].y + normalizedOffset.y;
                }

                // Switch back to Select mode
                this.setMode("Select");
                this.onStateChange(); // Ensure we redraw with updated positions
                return;
            }

            // Check if a point was clicked
            const clickedPoint = this.graph.findPointNear(normalizedPoint);

            // Handle different modes
            if (this.mode === "Select") {
                // Find if we clicked on a line
                let clickedLineEnd: HyperbolicPoint | undefined;

                for (const line of this.graph.lines) {
                    const arc = this.geometry.getNormalizedArcFromHyperbolicLine(line);
                    const startNormalized = this.geometry.getNormalizedPointFromHyperbolicPoint(line.start);
                    const endNormalized = this.geometry.getNormalizedPointFromHyperbolicPoint(line.end);

                    // Simple distance check for straight lines
                    if (arc.isStraight) {
                        // Simple line-point distance formula
                        const lineLength = Math.sqrt(
                            Math.pow(endNormalized.x - startNormalized.x, 2) +
                            Math.pow(endNormalized.y - startNormalized.y, 2)
                        );

                        if (lineLength === 0) continue;

                        const t = (
                            (normalizedPoint.x - startNormalized.x) * (endNormalized.x - startNormalized.x) +
                            (normalizedPoint.y - startNormalized.y) * (endNormalized.y - startNormalized.y)
                        ) / (lineLength * lineLength);

                        if (t < 0 || t > 1) continue;

                        const projX = startNormalized.x + t * (endNormalized.x - startNormalized.x);
                        const projY = startNormalized.y + t * (endNormalized.y - startNormalized.y);

                        const distance = Math.sqrt(
                            Math.pow(projX - normalizedPoint.x, 2) +
                            Math.pow(projY - normalizedPoint.y, 2)
                        );

                        if (distance < 0.02) {
                            clickedLineEnd = line.end;
                            break;
                        }
                    } else {
                        // For circular arcs (TODO: improve this approximation)
                        // Using the arc's center and radius for a rough approximation
                        const dx = normalizedPoint.x - arc.center.x;
                        const dy = normalizedPoint.y - arc.center.y;
                        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

                        const angle = Math.atan2(dy, dx);
                        let angleInRange = false;

                        // Check if the angle is within the arc's angle range
                        if (arc.startAngle <= arc.endAngle) {
                            angleInRange = angle >= arc.startAngle && angle <= arc.endAngle;
                        } else {
                            angleInRange = angle >= arc.startAngle || angle <= arc.endAngle;
                        }

                        if (angleInRange && Math.abs(distanceFromCenter - arc.radius) < 0.02) {
                            clickedLineEnd = line.end;
                            break;
                        }
                    }
                }

                // Handle selection logic
                if (clickedPoint) {
                    if (this.shiftKeyPressed) {
                        // DFS to find all connected components
                        const connectedPoints = this.graph.findConnectedComponents(clickedPoint);
                        this.editingPoints = [...connectedPoints];
                    } else {
                        // Toggle selection of point
                        const index = this.editingPoints.indexOf(clickedPoint);
                        if (index === -1) {
                            this.editingPoints = [clickedPoint];
                        } else {
                            this.editingPoints = [];
                        }
                    }
                } else if (clickedLineEnd) {
                    // Get the line that was clicked
                    const clickedLine = this.graph.lines.find(line => line.end === clickedLineEnd);
                    if (clickedLine) {
                        if (this.shiftKeyPressed) {
                            // DFS to find all connected components from both endpoints
                            const connectedFromStart = this.graph.findConnectedComponents(clickedLine.start);
                            const connectedFromEnd = this.graph.findConnectedComponents(clickedLine.end);

                            // Combine and deduplicate
                            const allConnected = [...connectedFromStart, ...connectedFromEnd];
                            this.editingPoints = [...new Set(allConnected)];
                        } else {
                            // Select just the two points of the line
                            this.editingPoints = [clickedLine.start, clickedLine.end];
                        }
                    }
                } else {
                    // Click on empty space clears selection
                    this.editingPoints = [];
                }
            } else if (this.mode === "Add") {
                if (clickedPoint) {
                    if (!this.firstSelectedPoint) {
                        // First point selected
                        this.firstSelectedPoint = clickedPoint;
                    } else if (this.firstSelectedPoint !== clickedPoint) {
                        // Second point selected - create a line
                        this.graph.addLine(this.firstSelectedPoint, clickedPoint);

                        // In shift mode, keep the chain going
                        if (this.shiftKeyPressed) {
                            this.firstSelectedPoint = clickedPoint;
                        } else {
                            this.firstSelectedPoint = undefined;
                        }
                    }
                } else {
                    // Clicking on empty space creates a new point
                    const hyperbolicPoint = this.geometry.getHyperbolicPointFromNormalizedPoint(normalizedPoint);
                    if (hyperbolicPoint) {
                        this.graph.addPoint(hyperbolicPoint);

                        // If first point is selected, connect to the new point
                        if (this.firstSelectedPoint) {
                            this.graph.addLine(this.firstSelectedPoint, hyperbolicPoint);

                            if (this.shiftKeyPressed) {
                                this.firstSelectedPoint = hyperbolicPoint;
                            } else {
                                this.firstSelectedPoint = undefined;
                            }
                        }
                    }
                }
            }

            this.onStateChange();
        });

        // Handle double-click to create new points - modify for the new modes
        this.canvas.addEventListener('dblclick', (event) => {
            // Only create points on double-click in Add mode
            if (this.mode !== "Add") return;

            const screenPoint: ScreenPoint = { type: 'Screen', x: event.clientX, y: event.clientY };
            const normalizedPoint = this.geometry.getNormalizedPointFromScreenPoint(screenPoint, this.canvas);

            if (!normalizedPoint) {
                return; // Click was outside the disk
            }

            // Convert normalized point to hyperbolic point
            const hyperbolicPoint = this.geometry.getHyperbolicPointFromNormalizedPoint(normalizedPoint);

            if (hyperbolicPoint) {
                // Add the new point to the points list
                this.graph.addPoint(hyperbolicPoint);
                this.onStateChange(); // Redraw to show the new point
            }
        });
    }
}

export default PoincareInteraction; 