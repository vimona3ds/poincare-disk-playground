class PoincareDisk {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    public points: HyperbolicPoint[];
    public lines: HyperbolicLine[];
    public editingPoint: HyperbolicPoint | undefined;
    public hoveredPoint: HyperbolicPoint | undefined;

    constructor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.points = [];
        this.lines = [];
        this.context = context;
        this.editingPoint = undefined;
        this.hoveredPoint = undefined;
        this.setupCoordinateSystem();
        this.setupEventListeners();
    }

    private setupCoordinateSystem() {
        // Reset transformations
        this.context.setTransform(1, 0, 0, 1, 0, 0);

        // Move origin to center
        this.context.translate(this.canvas.width / 2, this.canvas.height / 2);

        // Scale to convert from [-1,1] coordinates to pixels
        const scale = Math.min(this.canvas.width, this.canvas.height) / 2;
        this.context.scale(scale, -scale); // Negative y to make downward negative
    }

    // set up event listeners -- when window resizes, update canvas width and height
    private setupEventListeners() {
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.setupCoordinateSystem();
            this.draw();
        });

        // Handle mouse movement for hovering over points
        this.canvas.addEventListener('mousemove', (event) => {
            const screenPoint: ScreenPoint = { type: 'Screen', x: event.clientX, y: event.clientY };
            const normalizedPoint = this.getNormalizedPointFromScreenPoint(screenPoint);

            if (!normalizedPoint) {
                this.hoveredPoint = undefined;
                return;
            }

            // Update the editing point's position if in edit mode
            if (this.editingPoint) {
                const hyperbolicPoint = this.getHyperbolicPointFromNormalizedPoint(normalizedPoint);
                if (hyperbolicPoint) {
                    this.editingPoint.x = hyperbolicPoint.x;
                    this.editingPoint.y = hyperbolicPoint.y;
                }
                return;
            }

            // Otherwise, check if we're hovering over any point
            this.hoveredPoint = this.findPointNear(normalizedPoint);
        });

        // Handle click for selecting/deselecting points
        this.canvas.addEventListener('click', (event) => {
            const screenPoint: ScreenPoint = { type: 'Screen', x: event.clientX, y: event.clientY };
            const normalizedPoint = this.getNormalizedPointFromScreenPoint(screenPoint);

            if (!normalizedPoint) {
                return;
            }

            // If we're already editing a point, stop editing it
            if (this.editingPoint) {
                this.editingPoint = undefined;
                return;
            }

            // Otherwise, try to select a point to edit
            const pointToEdit = this.findPointNear(normalizedPoint);
            if (pointToEdit) {
                this.editingPoint = pointToEdit;
            }
        });

        // Handle double-click to create new points
        this.canvas.addEventListener('dblclick', (event) => {
            // Get screen point from double-click event
            const screenPoint: ScreenPoint = { type: 'Screen', x: event.clientX, y: event.clientY };

            // Convert screen point to normalized point
            const normalizedPoint = this.getNormalizedPointFromScreenPoint(screenPoint);

            if (!normalizedPoint) {
                return; // Click was outside the disk
            }

            // Convert normalized point to hyperbolic point
            const hyperbolicPoint = this.getHyperbolicPointFromNormalizedPoint(normalizedPoint);

            if (hyperbolicPoint) {
                // Add the new point to the points list
                this.points.push(hyperbolicPoint);
                this.draw(); // Redraw to show the new point
            }
        });
    }

    // Helper method to find a point near a given normalized position
    private findPointNear(normalizedPoint: NormalizedPoint): HyperbolicPoint | undefined {
        const DISTANCE_THRESHOLD = 0.03; // Adjust this value as needed

        for (const point of this.points) {
            const pointNormalized = this.getNormalizedPointFromHyperbolicPoint(point);
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

        const a = (u2 * (v1 ** 2 + v2 ** 2 + 1) - v2 * (u1 ** 2 + u2 ** 2 + 1)) / (u1 * v2 - u2 * v1);
        const b = (v1 * (u1 ** 2 + u2 ** 2 + 1) - u1 * (v1 ** 2 + v2 ** 2 + 1)) / (u1 * v2 - u2 * v1);

        const center: NormalizedPoint = {
            type: 'Normalized',
            x: -a / 2,
            y: -b / 2
        }

        const radius: NormalizedScalar = {
            type: 'Normalized',
            value: Math.sqrt((a / 2) ** 2 + (b / 2) ** 2 - 1)
        }

        return {
            center,
            radius,
            startAngle: 0,
            endAngle: Math.PI * 2
        }
    }

    public getNormalizedPointFromScreenPoint(point: ScreenPoint): NormalizedPoint | undefined {
        const rect = this.canvas.getBoundingClientRect();

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

    draw() {
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

        // Draw points
        this.points.forEach(point => {
            const normalizedPoint = this.getNormalizedPointFromHyperbolicPoint(point);

            this.context.beginPath();

            // Default point radius
            let pointRadius = 0.01;

            // If point is hovered, increase radius by factor of 2
            if (point === this.hoveredPoint) {
                pointRadius *= 2;
            }

            // If point is being edited, use a different color
            if (point === this.editingPoint) {
                this.context.fillStyle = 'red';
            } else {
                this.context.fillStyle = 'black';
            }

            this.context.arc(normalizedPoint.x, normalizedPoint.y, pointRadius, 0, Math.PI * 2);
            this.context.fill();
            this.context.closePath();
        });

        // Draw lines
        this.lines.forEach(line => {
            const arc = this.getNormalizedArcFromHyperbolicLine(line);

            this.context.beginPath();
            this.context.arc(arc.center.x, arc.center.y, arc.radius.value, arc.startAngle, arc.endAngle);
            this.context.strokeStyle = 'black';
            this.context.lineWidth = 0.01;
            this.context.stroke();
        });
    }
}

export default PoincareDisk;