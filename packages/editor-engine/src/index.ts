/** Pointer coordinates are expressed in physical-card millimetres, not browser pixels. */
export interface ScreenPoint { clientX: number; clientY: number }
export interface MmPoint { xMm: number; yMm: number }
export interface ScreenBounds { left: number; top: number; width: number; height: number }
export interface PhysicalSize { widthMm: number; heightMm: number }
export interface MoveTarget extends MmPoint { widthMm: number; heightMm: number }
export interface PinchTransform { zoom: number; panX: number; panY: number }

const isFiniteNumber = (value: number): boolean => Number.isFinite(value);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const validScreenPoint = (p: ScreenPoint) => isFiniteNumber(p.clientX) && isFiniteNumber(p.clientY);
/** The SVG artboard and its CSS content box share the same aspect ratio. */
export function screenToMillimetres(
  point: ScreenPoint, bounds: ScreenBounds, size: PhysicalSize,
): MmPoint | null {
  if (!validScreenPoint(point) || ![bounds.left, bounds.top, bounds.width, bounds.height,
    size.widthMm, size.heightMm].every(isFiniteNumber) ||
    bounds.width <= 0 || bounds.height <= 0 || size.widthMm <= 0 || size.heightMm <= 0) return null;
  return {
    xMm: (point.clientX - bounds.left) / bounds.width * size.widthMm,
    yMm: (point.clientY - bounds.top) / bounds.height * size.heightMm,
  };
}
export function snapMillimetres(value: number, step = 0.25): number {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0 || step > 100) {
    throw new Error('Snap coordinates and grid step must be valid numbers.');
  }
  return Math.round(value / step) * step;
}
/** Snap while preserving the original offset between touch and selected layer. */
export function movedLayerPosition(
  initial: MoveTarget, down: MmPoint, current: MmPoint,
  size: PhysicalSize, snap = 0.25,
): MmPoint {
  if (![initial.xMm, initial.yMm, initial.widthMm, initial.heightMm,
    down.xMm, down.yMm, current.xMm, current.yMm,
    size.widthMm, size.heightMm].every(isFiniteNumber)) {
    throw new Error('Cannot drag a layer using invalid coordinates.');
  }
  const maxX = Math.max(0, size.widthMm - initial.widthMm);
  const maxY = Math.max(0, size.heightMm - initial.heightMm);
  return {
    xMm: clamp(snapMillimetres(initial.xMm + current.xMm - down.xMm, snap), 0, maxX),
    yMm: clamp(snapMillimetres(initial.yMm + current.yMm - down.yMm, snap), 0, maxY),
  };
}
export function distance(a: ScreenPoint, b: ScreenPoint): number {
  if (!validScreenPoint(a) || !validScreenPoint(b)) throw new Error('Invalid pointer coordinates');
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}
export function center(a: ScreenPoint, b: ScreenPoint): ScreenPoint {
  if (!validScreenPoint(a) || !validScreenPoint(b)) throw new Error('Invalid pointer coordinates');
  return { clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 };
}
export function clampZoom(value: number, min = 0.65, max = 3): number {
  if (!isFiniteNumber(value) || min <= 0 || max < min) throw new Error('Invalid zoom');
  return clamp(value, min, max);
}
/** Pan delta is measured in CSS pixels; prevent accidental huge translations. */
export function nextPinchTransform(
  base: PinchTransform, baseDistance: number, baseCenter: ScreenPoint,
  a: ScreenPoint, b: ScreenPoint, panLimitPx = 500,
): PinchTransform {
  if (![base.zoom, base.panX, base.panY, baseDistance, panLimitPx].every(isFiniteNumber) ||
    baseDistance < 1 || panLimitPx < 0) throw new Error('Invalid pinch start');
  const midpoint = center(a, b);
  return {
    zoom: clampZoom(base.zoom * distance(a, b) / baseDistance),
    panX: clamp(base.panX + midpoint.clientX - baseCenter.clientX, -panLimitPx, panLimitPx),
    panY: clamp(base.panY + midpoint.clientY - baseCenter.clientY, -panLimitPx, panLimitPx),
  };
}
