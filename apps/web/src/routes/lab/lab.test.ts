import { describe, expect, it } from 'vitest';
import { createHamadCardDocument, applyCardCommand, serializeCardDocument,
  parseCardDocument } from '@okard/design-schema';
import { renderCardSvg } from '@okard/render-engine';

/** Integration contract used by the Svelte /lab route; no browser/node secrets. */
describe('OKard design lab integration', () => {
  it('renders front and back from different scenes for every edition', () => {
    for (const edition of ['royal', 'future', 'imperial'] as const) {
      const doc = createHamadCardDocument(edition, 'HAMAD');
      const front = renderCardSvg(doc, 'front');
      const back = renderCardSvg(doc, 'back');
      expect(front).toContain('IDENTITY CARD');
      expect(back).toContain('PRIVATE BRAND SIGNATURE');
      expect(front).not.toEqual(back);
    }
  });
  it('changes and reopens editable scene layers from JSON', () => {
    const doc = createHamadCardDocument('royal');
    const next = applyCardCommand(doc, {
      kind: 'replace-text', side: 'front', nodeId: 'display-name', text: 'NEW STUDIO',
    });
    const restored = parseCardDocument(serializeCardDocument(next));
    expect(renderCardSvg(restored, 'front')).toContain('NEW STUDIO');
    expect(restored.revision).toBe(doc.revision + 1);
    expect(doc.artboards.front.nodes.find((n) => n.id === 'display-name')).toMatchObject({
      text: 'HAMAD',
    });
  });
  it('escapes untrusted display-name text while preserving the card dimensions', () => {
    const doc = applyCardCommand(createHamadCardDocument('future'), {
      kind: 'replace-text', side: 'front', nodeId: 'display-name',
      text: '<iframe src="javascript:alert(1)">',
    });
    const svg = renderCardSvg(doc, 'front');
    expect(svg).not.toContain('<iframe');
    expect(svg).toContain('&lt;iframe');
    expect(svg).toContain('85.6mm');
  });
});
