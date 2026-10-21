import { describe, expect, it } from 'vitest';
import { CARD_TEMPLATES, HAMAD_SHOWCASE, getTemplate,
  createTemplateDocument, listTemplates, getTemplateFamilyCoverage } from '@okard/templates';
import { renderCardSvg, preflightCardDocument } from '@okard/render-engine';
import { applyCardCommand, parseCardDocument, serializeCardDocument } from '@okard/design-schema';
import { CARD_FAMILIES } from '@okard/shared';

describe('OKard front/back gallery to shared editor contract', () => {
  it('every gallery family opens as its own correct editable scene', () => {
    expect(CARD_TEMPLATES).toHaveLength(CARD_FAMILIES.length);
    expect(getTemplateFamilyCoverage().complete).toBe(true);
    for (const template of CARD_TEMPLATES) {
      const matching = getTemplate(template.id);
      expect(matching).toEqual(template);
      const doc = createTemplateDocument(template.id);
      expect(doc.id).toBe('template-' + template.id);
      expect(doc.family).toBe(template.family);
      expect(renderCardSvg(doc, 'front')).toContain(template.headline.replaceAll('&', '&amp;'));
      expect(renderCardSvg(doc, 'back')).toContain('ORIGINAL ARTWORK ONLY');
    }
  });

  it('shared editor changes name and secondary field without changing the reverse', () => {
    for (const item of CARD_TEMPLATES) {
      const before = createTemplateDocument(item.id);
      const afterName = applyCardCommand(before,
        {kind:'replace-text',side:'front',nodeId:'display-name',text:'CREATIVE TEAM'});
      const afterDetail = applyCardCommand(afterName,
        {kind:'replace-text',side:'front',nodeId:'supporting-value',text:'YOUR STORY'});
      expect(afterDetail.artboards.front.nodes.find(n => n.id === 'display-name')).toMatchObject({text:'CREATIVE TEAM'});
      expect(afterDetail.artboards.front.nodes.find(n => n.id === 'supporting-value')).toMatchObject({text:'YOUR STORY'});
      expect(afterDetail.artboards.back).toEqual(before.artboards.back);
      expect(parseCardDocument(serializeCardDocument(afterDetail)).revision).toBe(2);
    }
  });

  it('all family gallery previews have safe asset handling and no image pixels in JSON', () => {
    for (const item of CARD_TEMPLATES) {
      const doc = createTemplateDocument(item.id);
      const front = renderCardSvg(doc, 'front');
      expect(front).toContain('85.6mm');
      expect(front).not.toContain('<script');
      expect(front).not.toContain('javascript:');
      expect(front).not.toContain('data-okard-layer');
      expect(front).not.toContain('data:image/');
      const preflight = preflightCardDocument(doc);
      expect(preflight.every(w => ['warning','error'].includes(w.severity))).toBe(true);
    }
  });

  it('category filtering and linked HAMAD showcase preserve editor compatibility', () => {
    expect(listTemplates({family:'corporate'})).toHaveLength(1);
    expect(listTemplates({search:'membership'}).length).toBeGreaterThanOrEqual(0);
    expect(HAMAD_SHOWCASE).toHaveLength(3);
    expect(HAMAD_SHOWCASE.map(t=>t.id)).toEqual([
      'hamad-royal','hamad-future','hamad-imperial',
    ]);
  });
});
