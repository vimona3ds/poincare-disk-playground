type GenericPoint = {
    x: number;
    y: number;
}

type ScreenPoint = GenericPoint & { type: 'Screen' };
type NormalizedPoint = GenericPoint & { type: 'Normalized' };
type HyperbolicPoint = GenericPoint & { type: 'Hyperbolic' };
type Point = ScreenPoint | NormalizedPoint | HyperbolicPoint;

type Line<P extends Point> = {
    start: P;
    end: P;
}

type HyperbolicLine = Line<HyperbolicPoint>;

type Arc<P extends Point> = {
    center: P;
    radius: number;
    startAngle: number;
    endAngle: number;
    isStraight: boolean;
}

type NormalizedArc = Arc<NormalizedPoint>;
