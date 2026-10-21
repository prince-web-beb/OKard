import { assertCardDocument, type CardDocument, type CardSide, type SceneNode } from '@okard/design-schema';

/** All exported art is derived from the validated canonical design scene — never from a screenshot. */
export interface RenderOptions {
  /** Images are resolved by the caller, never fetched implicitly by the renderer. */
  resolveAsset?: (assetId: string) => string | null | undefined;
  /**
   * SVG exports are portable by default, so only inline raster data is permitted.
   * Preview can opt into a browser-owned blob: URL, but exported files cannot.
   */
  allowBlobPreview?: boolean;
}
export interface PreflightIssue {
  severity: 'warning' | 'error';
  code: 'MISSING_IMAGE' | 'UNEMBEDDED_IMAGE' | 'OUTSIDE_ARTBOARD' | 'TEXT_OVERFLOW' | 'LOW_QUALITY';
  side: CardSide;
  layerId: string;
  message: string;
}
export function escapeXml(input: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  };
  return input.replace(/[&<>"']/g, (char) => entities[char] ?? '');
}
const finite = (n: number) => Number.isFinite(n) ? String(Number(n.toFixed(3))) : '0';
const dataImage = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const blobImage = /^blob:https?:\/\/[a-zA-Z0-9._:\-/%]+$/;
function assetHref(assetId: string, options: RenderOptions): string | null {
  const value = options.resolveAsset?.(assetId);
  if (!value) return null;
  // Never allow remote URLs, injected SVG, javascript:, or user-written markup.
  if (dataImage.test(value)) return value;
  if (options.allowBlobPreview && blobImage.test(value)) return value;
  return null;
}
function renderLayer(layer: SceneNode, side: CardSide, options: RenderOptions): string {
  if (!layer.visible) return '';
  const pos = `x="${finite(layer.xMm)}" y="${finite(layer.yMm)}" width="${finite(layer.widthMm)}" height="${finite(layer.heightMm)}"`;
  const centerX = layer.xMm + layer.widthMm / 2;
  const centerY = layer.yMm + layer.heightMm / 2;
  const baseAttrs = `opacity="${finite(layer.opacity)}" transform="rotate(${finite(layer.rotationDeg)} ${finite(centerX)} ${finite(centerY)})"`;
  const clipId = `okard-${side}-${layer.id}`;
  if (layer.kind === 'rectangle') {
    const radius = Math.min(layer.cornerRadiusMm ?? 0, layer.widthMm / 2, layer.heightMm / 2);
    return `<rect ${pos} rx="${finite(radius)}" fill="${layer.fill}" ${layer.stroke ? `stroke="${layer.stroke}"` : ''}
      ${layer.strokeWidthMm ? `stroke-width="${finite(layer.strokeWidthMm)}"` : ''} ${baseAttrs}/>`;
  }
  if (layer.kind === 'image') {
    const href = assetHref(layer.assetId, options);
    if (!href) return '';
    const radius = Math.min(layer.cornerRadiusMm, layer.widthMm / 2, layer.heightMm / 2);
    const aspect = layer.fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet';
    return `<defs><clipPath id="${clipId}"><rect ${pos} rx="${finite(radius)}"/></clipPath></defs>
    <image ${pos} preserveAspectRatio="${aspect}" href="${escapeXml(href)}" clip-path="url(#${clipId})" ${baseAttrs}/>`;
  }
  const font = layer.fontFamily;
  const x = layer.align === 'middle' ? layer.xMm + layer.widthMm / 2 :
    layer.align === 'end' ? layer.xMm + layer.widthMm : layer.xMm;
  const y = layer.yMm + layer.fontSizeMm * 1.03;
  // Text stays semantically selectable, accessible and editable. No foreignObject or HTML.
  return `<defs><clipPath id="${clipId}"><rect ${pos}/></clipPath></defs>
  <text x="${finite(x)}" y="${finite(y)}" fill="${layer.fill}"
    font-family="${font}" font-size="${finite(layer.fontSizeMm)}"
    font-weight="${layer.fontWeight}" letter-spacing="${finite(layer.letterSpacingMm)}"
    text-anchor="${layer.align}" dominant-baseline="alphabetic"
    clip-path="url(#${clipId})" ${baseAttrs}>${escapeXml(layer.text)}</text>`;
}
/**
 * Fully controlled SVG output: no user SVG insertion, no network images, no event
 * handlers. At physical dimensions; a presentation 3D tilt must NEVER enter export.
 */
export function renderCardSvg(doc: CardDocument, side: CardSide, options: RenderOptions = {}): string {
  assertCardDocument(doc);
  if (side !== 'front' && side !== 'back') throw new Error('Invalid card side');
  const w = finite(doc.size.widthMm);
  const h = finite(doc.size.heightMm);
  const nodes = doc.artboards[side].nodes.map(n => renderLayer(n, side, options)).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
    width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}" role="img"
    aria-label="${escapeXml(doc.title + ' ' + side)}">
    <title>${escapeXml(doc.title + ' · ' + side + ' design study')}</title>
    <defs><clipPath id="okard-artboard-clip"><rect width="${w}" height="${h}" rx="3.2"/></clipPath></defs>
    <g clip-path="url(#okard-artboard-clip)">${nodes}</g>
  </svg>`;
}

/**
 * Conservative preflight. Font metrics require a production print pipeline;
 * warnings here are never a claim of print/vendor certification.
 */
export function preflightCardDocument(
  doc: CardDocument, options: RenderOptions = {},
): PreflightIssue[] {
  assertCardDocument(doc);
  const issues: PreflightIssue[] = [];
  for (const side of ['front', 'back'] as const) {
    for (const node of doc.artboards[side].nodes) {
      if (!node.visible) continue;
      if (node.xMm < 0 || node.yMm < 0 ||
          node.xMm + node.widthMm > doc.size.widthMm ||
          node.yMm + node.heightMm > doc.size.heightMm) {
        issues.push({ severity: 'warning', code: 'OUTSIDE_ARTBOARD', side, layerId: node.id,
          message: 'Layer extends beyond the card artboard.' });
      }
      if (node.kind === 'image') {
        const src = options.resolveAsset?.(node.assetId);
        if (!src) {
          issues.push({ severity: 'warning', code: 'MISSING_IMAGE', side, layerId: node.id,
            message: 'An image layer is awaiting an uploaded asset.' });
        } else if (!dataImage.test(src)) {
          issues.push({ severity: 'warning', code: 'UNEMBEDDED_IMAGE', side, layerId: node.id,
            message: 'An image must be embedded as a supported raster data URL before portable SVG export.' });
        }
      }
      if (node.kind === 'text') {
        const estimatedWidth = [...node.text].length *
          (node.fontSizeMm * (node.fontFamily === 'Georgia' ? 0.62 : 0.55) + node.letterSpacingMm);
        if (estimatedWidth > node.widthMm * 1.08) {
          issues.push({ severity: 'warning', code: 'TEXT_OVERFLOW', side, layerId: node.id,
            message: 'Text may not fit: review the actual typography at export size.' });
        }
      }
    }
  }
  return issues;
}
