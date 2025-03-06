import { HyperbolicPoint, Mode, NormalizedPoint, ScreenPoint, HyperbolicLine } from './types';
import PoincareDiskGeometry from './geometry/PoincareDiskGeometry';
import PoincareGraph from './components/PoincareGraph';
import PoincareRenderer from './rendering/PoincareRenderer';
import PoincareInteraction from './interaction/PoincareInteraction';

class PoincareDisk {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private geometry: PoincareDiskGeometry;
    private graph: PoincareGraph;
    private renderer: PoincareRenderer;
    private interaction: PoincareInteraction;

    // Maintain public properties for backward compatibility
    public get points(): HyperbolicPoint[] {
        return this.graph.points;
    }

    public set points(value: HyperbolicPoint[]) {
        this.graph.points = value;
    }

    public get lines() {
        return this.graph.lines;
    }

    public set lines(value) {
        this.graph.lines = value;
    }

    public get editingPoint(): HyperbolicPoint | undefined {
        return undefined; // This state is no longer tracked directly
    }

    public get hoveredPoint(): HyperbolicPoint | undefined {
        return this.interaction.getHoveredPoint();
    }

    public get editingPoints(): HyperbolicPoint[] {
        return this.interaction.getEditingPoints();
    }

    constructor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, updateInfoCallback: (info: string) => void) {
        this.canvas = canvas;
        this.context = context;

        // Create component instances
        this.geometry = new PoincareDiskGeometry(canvas.width, canvas.height);
        this.graph = new PoincareGraph(this.geometry);
        this.renderer = new PoincareRenderer(
            canvas,
            context,
            this.geometry,
            this.graph
        );

        // Create the interaction handler with a callback to trigger redraws
        this.interaction = new PoincareInteraction(
            canvas,
            this.geometry,
            this.graph,
            updateInfoCallback,
            () => this.draw()
        );
    }

    // Public methods for coordinate conversion (for backward compatibility)
    public getNormalizedPointFromHyperbolicPoint(point: HyperbolicPoint) {
        return this.geometry.getNormalizedPointFromHyperbolicPoint(point);
    }

    public getHyperbolicPointFromNormalizedPoint(point: NormalizedPoint) {
        return this.geometry.getHyperbolicPointFromNormalizedPoint(point);
    }

    public getNormalizedArcFromHyperbolicLine(line: HyperbolicLine) {
        return this.geometry.getNormalizedArcFromHyperbolicLine(line);
    }

    public getNormalizedPointFromScreenPoint(point: ScreenPoint) {
        return this.geometry.getNormalizedPointFromScreenPoint(point, this.canvas);
    }

    // Draw method now delegates to the renderer
    draw() {
        this.renderer.draw(
            this.interaction.getMode(),
            this.interaction.getEditingPoints(),
            this.interaction.getHoveredPoint(),
            this.interaction.getFirstSelectedPoint(),
            this.interaction.getCurrentMousePosition(),
            this.interaction.getTranslatingPoints(),
            this.interaction.getOriginalNormalizedMousePoint()
        );
    }
}

export default PoincareDisk;