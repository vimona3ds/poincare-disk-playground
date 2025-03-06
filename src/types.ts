type GenericPoint = {
    x: number;
    y: number;
}

type GenericScalar = {
    value: number;
}

type ScreenPoint = GenericPoint & { type: 'Screen' };
type NormalizedPoint = GenericPoint & { type: 'Normalized' };
type HyperbolicPoint = GenericPoint & { type: 'Hyperbolic' };
type Point = ScreenPoint | NormalizedPoint | HyperbolicPoint;

type ScreenScalar = GenericScalar & { type: 'Screen' };
type NormalizedScalar = GenericScalar & { type: 'Normalized' };
type HyperbolicScalar = GenericScalar & { type: 'Hyperbolic' };
type Scalar = ScreenScalar | NormalizedScalar | HyperbolicScalar;

type Line<P extends Point> = {
    start: P;
    end: P;
}

type HyperbolicLine = Line<HyperbolicPoint>;

type Arc<P extends Point, S extends Scalar> = {
    center: P;
    radius: S;
    startAngle: number;
    endAngle: number;
}

type NormalizedArc = Arc<NormalizedPoint, NormalizedScalar>;
