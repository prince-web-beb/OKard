import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createHamadCardDocument, createEmptyCardDocument, validateCardDocument,
  assertCardDocument, serializeCardDocument, parseCardDocument,
  applyCardCommand, CardSchemaError,
} from '../dist/index.js';

test('creates validated front/back Royal, Future and Imperial private-brand templates', () => {
  for (const edition of ['royal', 'future', 'imperial']) {
    const doc = createHamadCardDocument(edition, 'HAMAD');
    assertCardDocument(doc);
    assert.equal(doc.size.widthMm, 85.6);
    assert.equal(doc.size.heightMm, 53.98);
    assert.equal(doc.family, 'private-brand');
    assert.equal(doc.state, 'design');
    assert.ok(doc.artboards.front.nodes.length > 9);
    assert.ok(doc.artboards.back.nodes.length > 7);
    assert.notDeepEqual(doc.artboards.front.nodes, doc.artboards.back.nodes);
    assert.ok(doc.artboards.front.nodes.some(n => n.kind === 'image' && n.opacity < 1));
    assert.ok(doc.artboards.front.nodes.some(n => n.kind === 'image' && n.opacity === 1));
  }
});
test('serialization is stable and preserves diacritics and immutable project side data', () => {
  const input = createHamadCardDocument('imperial', 'MARÍA');
  const json = serializeCardDocument(input);
  const recovered = parseCardDocument(json);
  assert.deepEqual(recovered, input);
  assert.ok(json.includes('MARÍA'));
});
test('copy-on-write move and text changes affect only their target layers and side', () => {
  const original = createHamadCardDocument('royal');
  const modified = applyCardCommand(original, {
    kind: 'replace-text', side: 'front', nodeId: 'display-name', text: 'PRIVATE STUDIO',
  }, '2026-10-21T14:00:00.000Z');
  assert.equal(modified.revision, 1);
  assert.equal(original.revision, 0);
  assert.equal(original.artboards.front.nodes.find(n => n.id === 'display-name').text, 'HAMAD');
  assert.equal(modified.artboards.front.nodes.find(n => n.id === 'display-name').text, 'PRIVATE STUDIO');
  assert.deepEqual(modified.artboards.back, original.artboards.back);
});
test('layer opacity, asset, move, add and remove maintain valid canonical document', () => {
  let doc = createHamadCardDocument('future');
  doc = applyCardCommand(doc, {kind:'set-opacity',side:'front',nodeId:'secondary-portrait',opacity:0.33});
  doc = applyCardCommand(doc, {kind:'set-image',side:'front',nodeId:'main-portrait',assetId:'portrait-one'});
  doc = applyCardCommand(doc, {kind:'move',side:'front',nodeId:'brand-title',xMm:6,yMm:5});
  const node = {id:'accent-block',kind:'rectangle',xMm:12,yMm:16,widthMm:15,heightMm:2,opacity:1,
    rotationDeg:0,visible:true,locked:false,fill:'#ffffff'};
  doc = applyCardCommand(doc, {kind:'insert',side:'back',node});
  assert.equal(doc.artboards.back.nodes.at(-1).id, 'accent-block');
  doc = applyCardCommand(doc, {kind:'remove',side:'back',nodeId:'accent-block'});
  assert.equal(doc.artboards.back.nodes.some(n=>n.id==='accent-block'),false);
  assert.equal(doc.revision,5);
  assertCardDocument(doc);
});
test('invalid input is rejected instead of silently repaired or executed', () => {
  const bad = createHamadCardDocument('royal');
  bad.artboards.front.nodes[0].opacity = NaN;
  assert.equal(validateCardDocument(bad).valid, false);
  assert.throws(() => serializeCardDocument(bad), CardSchemaError);
  assert.throws(() => parseCardDocument('not-json'), CardSchemaError);
  assert.throws(() => createEmptyCardDocument({id:'bad space',title:'x',family:'membership'}), CardSchemaError);
});
test('malformed SVG/color or document metadata cannot enter a scene', () => {
  let doc = createHamadCardDocument('royal');
  assert.throws(() => applyCardCommand(doc, {
    kind:'insert',side:'front',node:{id:'evil',kind:'rectangle',xMm:1,yMm:1,
    widthMm:2,heightMm:2,opacity:1,rotationDeg:0,visible:true,locked:false,
    fill:'url(javascript:alert(1))'}
  }), CardSchemaError);
  assert.throws(() => applyCardCommand(doc, {
    kind:'set-opacity',side:'front',nodeId:'main-portrait',opacity:6
  }), CardSchemaError);
  assert.throws(() => applyCardCommand(doc, {
    kind:'remove',side:'front',nodeId:'unknown'
  }), CardSchemaError);
  assert.equal(doc.revision,0);
});
test('unknown layer kinds, unsupported schema versions and duplicate IDs are blocked', () => {
  const doc = createHamadCardDocument('royal');
  const other = structuredClone(doc);
  other.schemaVersion = 2;
  assert.equal(validateCardDocument(other).valid, false);
  doc.artboards.front.nodes.push(structuredClone(doc.artboards.front.nodes[0]));
  assert.equal(validateCardDocument(doc).valid,false);
});
