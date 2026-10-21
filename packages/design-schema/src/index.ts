import { CARD_FAMILIES, type CardFamilyId, type CardSide } from '@okard/shared';
export type { CardSide } from '@okard/shared';
import { isIsoCountryCode, normalizeLocale } from '@okard/country-data';

/** Canonical dimensions are millimetres; never CSS pixels. */
export interface CardSize { widthMm: number; heightMm: number; bleedMm: number }
export interface Box { xMm: number; yMm: number; widthMm: number; heightMm: number }
export interface SceneBase extends Box {
  id: string;
  opacity: number;
  rotationDeg: number;
  visible: boolean;
  locked: boolean;
}
export interface RectangleNode extends SceneBase {
  kind: 'rectangle';
  fill: string;
  stroke?: string;
  strokeWidthMm?: number;
  cornerRadiusMm?: number;
}
export interface TextNode extends SceneBase {
  kind: 'text';
  text: string;
  fill: string;
  fontFamily: 'Georgia' | 'Arial' | 'system-ui';
  fontSizeMm: number;
  fontWeight: 400 | 500 | 600 | 700;
  letterSpacingMm: number;
  align: 'start' | 'middle' | 'end';
}
export interface ImageNode extends SceneBase {
  kind: 'image';
  assetId: string;
  fit: 'cover' | 'contain';
  cornerRadiusMm: number;
}
export type SceneNode = RectangleNode | TextNode | ImageNode;
export interface CardArtboard { side: CardSide; nodes: SceneNode[] }
export interface CardDocument {
  schemaVersion: 1;
  id: string;
  title: string;
  family: CardFamilyId;
  countryCode: string | null;
  locale: string;
  size: CardSize;
  revision: number;
  updatedAt: string;
  artboards: { front: CardArtboard; back: CardArtboard };
  /** Declarative preview only. Real issuer verification requires separate authorization. */
  state: 'design';
}
export type EditCommand =
  | { kind: 'replace-text'; side: CardSide; nodeId: string; text: string }
  | { kind: 'set-opacity'; side: CardSide; nodeId: string; opacity: number }
  | { kind: 'set-image'; side: CardSide; nodeId: string; assetId: string }
  | { kind: 'move'; side: CardSide; nodeId: string; xMm: number; yMm: number }
  | { kind: 'resize'; side: CardSide; nodeId: string; widthMm: number; heightMm: number }
  | { kind: 'rotate'; side: CardSide; nodeId: string; rotationDeg: number }
  | { kind: 'set-color'; side: CardSide; nodeId: string; color: string }
  | { kind: 'set-locked'; side: CardSide; nodeId: string; locked: boolean }
  | { kind: 'reorder'; side: CardSide; nodeId: string; direction: 'up' | 'down' }
  | { kind: 'duplicate'; side: CardSide; nodeId: string; newNodeId: string }
  | { kind: 'insert'; side: CardSide; node: SceneNode }
  | { kind: 'remove'; side: CardSide; nodeId: string }
  | { kind: 'set-title'; title: string }
  | { kind: 'set-country'; countryCode: string | null }
  | { kind: 'set-locale'; locale: string };
export interface SchemaResult {
  valid: boolean;
  errors: string[];
}

const limits = {
  nodesPerSide: 300,
  textLength: 2000,
  titleLength: 120,
  idLength: 90,
} as const;
const colorPattern = /^#[\da-fA-F]{6}(?:[\da-fA-F]{2})?$/;
const safeId = /^[a-zA-Z][a-zA-Z\d:_-]{0,89}$/;
const cardFamilyIds = new Set<string>(CARD_FAMILIES.map((f) => f.id));
const validFonts = new Set(['Georgia', 'Arial', 'system-ui']);
const validWeight = new Set([400, 500, 600, 700]);
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (n: unknown, min: number, max: number) =>
  typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
const goodId = (v: unknown) => typeof v === 'string' && safeId.test(v);
const goodColor = (v: unknown) => typeof v === 'string' && colorPattern.test(v);
const propertySet = (v: object, keys: readonly string[]) =>
  Object.keys(v).every((key) => keys.includes(key));
const boxProps = ['id', 'kind', 'xMm', 'yMm', 'widthMm', 'heightMm',
  'opacity', 'rotationDeg', 'visible', 'locked'];
const nodeSpecific = {
  rectangle: ['fill', 'stroke', 'strokeWidthMm', 'cornerRadiusMm'],
  text: ['text', 'fill', 'fontFamily', 'fontSizeMm', 'fontWeight', 'letterSpacingMm', 'align'],
  image: ['assetId', 'fit', 'cornerRadiusMm'],
} as const;

function validateNode(raw: unknown, idx: number, side: CardSide, ids: Set<string>, errors: string[]) {
  const path = `artboards.${side}.nodes[${idx}]`;
  if (!isRecord(raw)) { errors.push(path + ': must be a layer object'); return; }
  if (!goodId(raw.id)) errors.push(path + ': invalid layer identifier');
  else if (ids.has(raw.id as string)) errors.push(path + ': duplicated layer identifier');
  else ids.add(raw.id as string);
  const kind = raw.kind;
  if (kind !== 'rectangle' && kind !== 'text' && kind !== 'image') {
    errors.push(path + ': unknown layer type'); return;
  }
  if (!propertySet(raw, [...boxProps, ...nodeSpecific[kind]])) errors.push(path + ': unknown fields');
  if (!finite(raw.xMm, -100, 1000) || !finite(raw.yMm, -100, 1000) ||
      !finite(raw.widthMm, 0.01, 1000) || !finite(raw.heightMm, 0.01, 1000)) {
    errors.push(path + ': coordinates must be finite millimetres within bounds');
  }
  if (!finite(raw.opacity, 0, 1) || !finite(raw.rotationDeg, -360, 360)) {
    errors.push(path + ': invalid opacity or rotation');
  }
  if (typeof raw.visible !== 'boolean' || typeof raw.locked !== 'boolean') {
    errors.push(path + ': invalid visibility or locking');
  }
  if (kind === 'rectangle') {
    if (!goodColor(raw.fill)) errors.push(path + ': invalid fill');
    if (raw.stroke !== undefined && !goodColor(raw.stroke)) errors.push(path + ': invalid stroke');
    if (raw.strokeWidthMm !== undefined && !finite(raw.strokeWidthMm, 0, 50)) errors.push(path + ': invalid stroke width');
    if (raw.cornerRadiusMm !== undefined && !finite(raw.cornerRadiusMm, 0, 100)) errors.push(path + ': invalid corner radius');
  } else if (kind === 'text') {
    if (typeof raw.text !== 'string' || raw.text.length > limits.textLength ||
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(raw.text)) {
      errors.push(path + ': invalid text');
    }
    if (!goodColor(raw.fill) || !validFonts.has(String(raw.fontFamily)) ||
        !validWeight.has(Number(raw.fontWeight)) || !finite(raw.fontSizeMm, 0.25, 200) ||
        !finite(raw.letterSpacingMm, -5, 20) ||
        !['start', 'middle', 'end'].includes(String(raw.align))) {
      errors.push(path + ': invalid typography');
    }
  } else {
    if (!goodId(raw.assetId) || !['cover', 'contain'].includes(String(raw.fit)) ||
        !finite(raw.cornerRadiusMm, 0, 100)) errors.push(path + ': invalid image reference');
  }
}

/** Validation is independent of Svelte, databases and any visual editor. */
export function validateCardDocument(raw: unknown): SchemaResult {
  const errors: string[] = [];
  if (!isRecord(raw)) return { valid: false, errors: ['document must be an object'] };
  if (raw.schemaVersion !== 1) errors.push('unsupported schema version (migration required)');
  if (!propertySet(raw, ['schemaVersion', 'id', 'title', 'family', 'countryCode', 'locale',
      'size', 'revision', 'updatedAt', 'artboards', 'state'])) errors.push('unknown document fields');
  if (!goodId(raw.id)) errors.push('invalid project identifier');
  if (typeof raw.title !== 'string' || !raw.title.trim() || raw.title.length > limits.titleLength) {
    errors.push('invalid project title');
  }
  if (!cardFamilyIds.has(String(raw.family))) errors.push('invalid card family');
  if (!(raw.countryCode === null || isIsoCountryCode(raw.countryCode))) errors.push('invalid ISO country code');
  if (typeof raw.locale !== 'string' || !raw.locale ||
      normalizeLocale(raw.locale, '') !== raw.locale) {
    errors.push('invalid canonical BCP 47 locale');
  }
  if (typeof raw.revision !== 'number' || !Number.isSafeInteger(raw.revision) || raw.revision < 0) errors.push('invalid revision');
  if (typeof raw.updatedAt !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(raw.updatedAt) ||
      Number.isNaN(Date.parse(raw.updatedAt))) errors.push('invalid updated date');
  if (raw.state !== 'design') errors.push('unknown document state');
  const size = raw.size;
  if (!isRecord(size) || !propertySet(size, ['widthMm', 'heightMm', 'bleedMm']) ||
      !finite(size.widthMm, 20, 500) || !finite(size.heightMm, 20, 500) ||
      !finite(size.bleedMm, 0, 15)) errors.push('invalid card physical dimensions');
  const artboards = raw.artboards;
  if (!isRecord(artboards) || !propertySet(artboards, ['front', 'back'])) {
    errors.push('artboards.front and artboards.back required');
  } else {
    for (const side of ['front', 'back'] as const) {
      const board = artboards[side];
      if (!isRecord(board) || board.side !== side || !Array.isArray(board.nodes)) {
        errors.push('invalid ' + side + ' artboard'); continue;
      }
      if (!propertySet(board, ['side', 'nodes'])) errors.push(side + ': unknown artboard fields');
      if (board.nodes.length > limits.nodesPerSide) errors.push(side + ': too many layers');
      const ids = new Set<string>();
      board.nodes.slice(0, limits.nodesPerSide + 1).forEach((n, i) => validateNode(n, i, side, ids, errors));
    }
  }
  return { valid: errors.length === 0, errors };
}
export class CardSchemaError extends Error {
  constructor(readonly errors: readonly string[]) {
    super('Invalid card design document: ' + errors.join('; '));
    this.name = 'CardSchemaError';
  }
}
export function assertCardDocument(raw: unknown): asserts raw is CardDocument {
  const result = validateCardDocument(raw);
  if (!result.valid) throw new CardSchemaError(result.errors);
}
/** Portable revisioned JSON. No photo binaries or upload tokens are stored here. */
export function serializeCardDocument(doc: CardDocument): string {
  assertCardDocument(doc);
  return JSON.stringify(doc);
}
export function parseCardDocument(input: string): CardDocument {
  let raw: unknown;
  try { raw = JSON.parse(input) as unknown; } catch { throw new CardSchemaError(['invalid JSON']); }
  assertCardDocument(raw);
  return raw;
}
export function createEmptyCardDocument(options: {
  id: string; title: string; family: CardFamilyId;
  locale?: string; countryCode?: string | null; now?: string;
}): CardDocument {
  const document: CardDocument = {
    schemaVersion: 1,
    id: options.id,
    title: options.title,
    family: options.family,
    locale: normalizeLocale(options.locale ?? 'en'),
    countryCode: options.countryCode ?? null,
    updatedAt: options.now ?? new Date().toISOString(),
    revision: 0,
    size: { widthMm: 85.6, heightMm: 53.98, bleedMm: 3 },
    artboards: { front: { side: 'front', nodes: [] }, back: { side: 'back', nodes: [] } },
    state: 'design',
  };
  assertCardDocument(document);
  return document;
}
/** One atomic copy-on-write command, suitable for history, undo and server optimistic concurrency. */
export function applyCardCommand(doc: CardDocument, command: EditCommand, now?: string): CardDocument {
  assertCardDocument(doc);
  // Svelte 5 $state exposes proxies: structuredClone(proxy) throws DataCloneError.
  // The schema is intentionally JSON-only, so round-trip is safe after validation.
  const next = JSON.parse(JSON.stringify(doc)) as CardDocument;
  if (command.kind === 'set-title') {
    next.title = command.title;
  } else if (command.kind === 'set-country') {
    next.countryCode = command.countryCode;
  } else if (command.kind === 'set-locale') {
    next.locale = command.locale;
  } else {
    const artboard = next.artboards[command.side];
    if (!artboard) throw new CardSchemaError(['unknown card side']);
    if (command.kind === 'insert') {
      if (artboard.nodes.some((n) => n.id === command.node.id)) throw new CardSchemaError(['duplicate node id']);
      artboard.nodes.push(JSON.parse(JSON.stringify(command.node)) as SceneNode);
    } else {
      const nodeIndex = artboard.nodes.findIndex((n) => n.id === command.nodeId);
      if (nodeIndex < 0) throw new CardSchemaError(['unknown layer id']);
      const node = artboard.nodes[nodeIndex]!;
      if (node.locked && command.kind !== 'set-locked') {
        throw new CardSchemaError(['layer is locked']);
      }
      if (command.kind === 'set-locked') node.locked = command.locked;
      if (command.kind === 'remove') artboard.nodes.splice(nodeIndex, 1);
      if (command.kind === 'move') { node.xMm = command.xMm; node.yMm = command.yMm; }
      if (command.kind === 'resize') {
        node.widthMm = command.widthMm;
        node.heightMm = command.heightMm;
      }
      if (command.kind === 'rotate') node.rotationDeg = command.rotationDeg;
      if (command.kind === 'set-color') {
        if (node.kind === 'image') throw new CardSchemaError(['image has no fill color']);
        node.fill = command.color;
      }
      if (command.kind === 'duplicate') {
        if (artboard.nodes.some((n) => n.id === command.newNodeId)) {
          throw new CardSchemaError(['duplicate node id']);
        }
        const copy = JSON.parse(JSON.stringify(node)) as SceneNode;
        copy.id = command.newNodeId;
        copy.xMm += 1.5;
        copy.yMm += 1.5;
        artboard.nodes.splice(nodeIndex + 1, 0, copy);
      }
      if (command.kind === 'reorder') {
        const target = nodeIndex + (command.direction === 'up' ? 1 : -1);
        if (target >= 0 && target < artboard.nodes.length) {
          const item = artboard.nodes.splice(nodeIndex, 1)[0]!;
          artboard.nodes.splice(target, 0, item);
        }
      }
      if (command.kind === 'set-opacity') node.opacity = command.opacity;
      if (command.kind === 'set-image') {
        if (node.kind !== 'image') throw new CardSchemaError(['target must be an image layer']);
        node.assetId = command.assetId;
      }
      if (command.kind === 'replace-text') {
        if (node.kind !== 'text') throw new CardSchemaError(['target must be a text layer']);
        node.text = command.text;
      }
    }
  }
  next.revision += 1;
  next.updatedAt = now ?? new Date().toISOString();
  assertCardDocument(next);
  return next;
}

export type HamadEdition = 'royal' | 'future' | 'imperial';
const palettes: Record<HamadEdition, { background: string; accent: string; ink: string; muted: string }> = {
  royal: { background: '#111217', accent: '#d7b67b', ink: '#f4ecd9', muted: '#bdb2a4' },
  future: { background: '#0b1829', accent: '#82cde5', ink: '#f4f7fc', muted: '#b2c5d2' },
  imperial: { background: '#efe8d7', accent: '#8a6839', ink: '#1e2838', muted: '#5c6471' },
};
const id = (name: string): SceneBase => ({
  id: name, xMm: 0, yMm: 0, widthMm: 1, heightMm: 1,
  rotationDeg: 0, opacity: 1, visible: true, locked: false,
});
const rect = (name: string, x: number, y: number, w: number, h: number, fill: string,
  radius = 0, opacity = 1): RectangleNode => ({
  ...id(name), kind: 'rectangle', xMm: x, yMm: y, widthMm: w, heightMm: h,
  fill, cornerRadiusMm: radius, opacity,
});
const txt = (name: string, text: string, x: number, y: number, w: number,
  size: number, fill: string, fontFamily: TextNode['fontFamily'] = 'Arial',
  weight: TextNode['fontWeight'] = 400, spacing = 0): TextNode => ({
  ...id(name), kind: 'text', text, xMm: x, yMm: y, widthMm: w, heightMm: size * 1.35,
  fill, fontFamily, fontSizeMm: size, fontWeight: weight, letterSpacingMm: spacing, align: 'start',
});
const img = (name: string, x: number, y: number, w: number, h: number,
  opacity = 1): ImageNode => ({
  ...id(name), kind: 'image', xMm: x, yMm: y, widthMm: w, heightMm: h,
  assetId: 'portrait', fit: 'cover', cornerRadiusMm: 1.2, opacity,
});
/** Original private-brand visual template; NO issuer credential or legal identity claim. */
export function createHamadCardDocument(
  edition: HamadEdition, displayName = 'HAMAD',
  now = new Date().toISOString(),
): CardDocument {
  const palette = palettes[edition];
  if (!palette) throw new CardSchemaError(['unknown HAMAD edition']);
  const doc = createEmptyCardDocument({
    id: 'hamad-' + edition, title: 'HAMAD ' + edition + ' design',
    family: 'private-brand', now,
  });
  const title = edition === 'royal' ? 'ROYAL SIGNATURE' :
    edition === 'future' ? 'FUTURE IDENTITY' : 'IMPERIAL EDITION';
  doc.artboards.front.nodes = [
    rect('surface', 0, 0, 85.6, 53.98, palette.background),
    rect('inner-frame', 1.1, 1.1, 83.4, 51.8, palette.accent, 2.8, 0.09),
    img('secondary-portrait', 36, 5, 47, 43, 0.12),
    rect('portrait-placeholder', 4.1, 15.5, 31, 33.3, palette.accent, 1.3, 0.12),
    img('main-portrait', 4.1, 15.5, 31, 33.3),
    txt('brand-title', 'HAMAD', 5, 4.9, 44, 7.2, palette.accent, 'Georgia', 600, 0.6),
    txt('card-type', 'IDENTITY CARD', 5.3, 12.2, 40, 2.35, palette.ink, 'Arial', 600, 0.7),
    txt('name-label', 'CARDHOLDER', 39.5, 22, 40, 2.2, palette.muted, 'Arial', 600, 0.3),
    txt('display-name', displayName.toUpperCase(), 39.2, 26, 44, 5.7, palette.ink, 'Georgia', 600),
    txt('edition-label', 'EDITION', 39.5, 34.5, 40, 2.2, palette.muted, 'Arial', 600, 0.3),
    txt('edition-value', title, 39.5, 38.2, 44, 3.2, palette.accent, 'Arial', 600, 0.26),
    rect('footer-surface', 0, 49.8, 85.6, 4.18, palette.background, 0, 0.94),
    txt('disclaimer', 'PRIVATE BRAND DESIGN · NOT GOVERNMENT ID', 4.1, 51.1, 78, 1.82, palette.muted, 'Arial', 400, 0.12),
  ];
  doc.artboards.back.nodes = [
    rect('back-surface', 0, 0, 85.6, 53.98, palette.background),
    rect('back-ornament', 3.2, 3.2, 79.2, 47.5, palette.accent, 2.5, 0.08),
    img('back-secondary-portrait', 48, 5, 37, 42, 0.12),
    txt('back-brand-title', 'HAMAD', 5, 5.3, 75, 5.2, palette.accent, 'Georgia', 600, 0.6),
    txt('back-label', 'PRIVATE BRAND SIGNATURE', 5, 12.4, 72, 2.2, palette.muted, 'Arial', 600, 0.46),
    txt('back-monogram', 'H', 6, 18.1, 25, 20, palette.accent, 'Georgia', 600),
    txt('back-motto', 'VISION · DISCIPLINE', 28, 24, 52, 3.7, palette.ink, 'Georgia', 400),
    txt('back-motto-two', '· LEGACY', 28, 30, 45, 3.7, palette.accent, 'Georgia', 400),
    txt('back-notice', 'A DESIGN CONCEPT, NOT LEGAL IDENTIFICATION', 5, 41.7, 77, 2.4, palette.ink, 'Arial', 400),
    rect('back-footer-surface', 0, 49.8, 85.6, 4.18, palette.background, 0, 0.94),
    txt('back-disclaimer', 'NOT ISSUED · NO GOVERNMENT OR PAYMENT FUNCTION', 4.1, 51.1, 78, 1.8, palette.muted, 'Arial', 400, 0.12),
  ];
  assertCardDocument(doc);
  return doc;
}
