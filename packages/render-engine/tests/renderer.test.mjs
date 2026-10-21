import test from 'node:test';
import assert from 'node:assert/strict';
import { createHamadCardDocument, applyCardCommand } from '@okard/design-schema';
import { renderCardSvg, preflightCardDocument, escapeXml } from '../dist/index.js';

test('rendering creates a physical-size SVG with front and back independently', () => {
  const doc = createHamadCardDocument('royal');
  const front = renderCardSvg(doc,'front');
  const back = renderCardSvg(doc,'back');
  assert.match(front, /width="85.6mm"/);
  assert.match(front, /height="53.98mm"/);
  assert.match(front, /HAMAD/);
  assert.match(front, /IDENTITY CARD/);
  assert.match(back, /VISION/);
  assert.match(back, /NOT ISSUED/);
  assert.notEqual(front,back);
  assert.equal(front,renderCardSvg(doc,'front'));
});
test('XML and HTML are escaped in user-editable text and attributes', () => {
  let doc = createHamadCardDocument('royal');
  doc = applyCardCommand(doc, {kind:'replace-text',side:'front',nodeId:'display-name',
    text:'<script onload="alert(1)">&</script>'});
  const svg = renderCardSvg(doc,'front');
  assert.equal(svg.includes('<script'),false);
  assert.match(svg, /&lt;script/);
  assert.match(svg, /&amp;/);
  assert.equal(escapeXml('A" & B'), 'A&quot; &amp; B');
});
test('rejects arbitrary external image sources, JavaScript URLs and active SVG uploads', () => {
  const doc = createHamadCardDocument('royal');
  const unsafe = ['https://example.com/photo.png','javascript:alert(1)',
    'data:image/svg+xml;base64,PHN2Zz4='];
  for (const src of unsafe) {
    const svg = renderCardSvg(doc,'front',{resolveAsset:()=>src});
    assert.equal(svg.includes('<image'),false);
  }
});
test('embedded raster data is accepted and portable in exported SVG', () => {
  const doc = createHamadCardDocument('royal');
  const svg = renderCardSvg(doc,'front',{
    resolveAsset:()=> 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB',
  });
  assert.equal((svg.match(/<image/g)??[]).length,2);
  assert.match(svg, /data:image\/png;base64,/);
});
test('preflight warns on missing portraits and text that may overflow', () => {
  const doc = createHamadCardDocument('imperial', 'SUPER LONG SUPER LONG SUPER LONG');
  const problems = preflightCardDocument(doc);
  assert.ok(problems.some(issue=>issue.code==='MISSING_IMAGE'));
  assert.ok(problems.some(issue=>issue.code==='TEXT_OVERFLOW'));
});
test('blob URLs can be used only in browser preview, not portable exported SVG', () => {
  const doc = createHamadCardDocument('royal');
  const src = 'blob:https://okard.example/00000000-0000-0000-0000-000000000000';
  assert.equal(renderCardSvg(doc,'front',{resolveAsset:()=>src}).includes('<image'),false);
  assert.equal(renderCardSvg(doc,'front',{resolveAsset:()=>src,allowBlobPreview:true}).includes('<image'),true);
  assert.ok(preflightCardDocument(doc,{resolveAsset:()=>src}).some(i=>i.code==='UNEMBEDDED_IMAGE'));
});


test('interactive SVG provides selectable hit targets and a visible non-exported selection outline', () => {
  const doc = createHamadCardDocument('royal');
  const interactive = renderCardSvg(doc, 'front', {
    interactive: true,
    selectedLayerId: 'display-name',
  });
  assert.match(interactive, /data-okard-layer="display-name"/);
  assert.match(interactive, /stroke="#42dfbd"/);
  const exported = renderCardSvg(doc, 'front');
  assert.doesNotMatch(exported, /data-okard-layer=/);
  assert.doesNotMatch(exported, /stroke="#42dfbd"/);
});
