export type GenericPoint = {
    x: number;
    y: number;
}

export type ScreenPoint = GenericPoint & { type: 'Screen' };
export type NormalizedPoint = GenericPoint & { type: 'Normalized' };
export type HyperbolicPoint = GenericPoint & { type: 'Hyperbolic' };
export type Point = ScreenPoint | NormalizedPoint | HyperbolicPoint;

export type Line<P extends Point> = {
    start: P;
    end: P;
}

export type HyperbolicLine = Line<HyperbolicPoint>;

export type Arc<P extends Point> = {
    center: P;
    radius: number;
    startAngle: number;
    endAngle: number;
    isStraight: boolean;
}

export type NormalizedArc = Arc<NormalizedPoint>;

export type Mode = "Select" | "Translate" | "Add";
