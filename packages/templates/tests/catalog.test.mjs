import test from 'node:test';
import assert from 'node:assert/strict';
import { CARD_FAMILIES } from '@okard/shared';
import { validateCardDocument, applyCardCommand, serializeCardDocument,
  parseCardDocument } from '@okard/design-schema';
import { CARD_TEMPLATES, createTemplateDocument, getTemplate,
  listTemplates, getTemplateFamilyCoverage, HAMAD_SHOWCASE,
  findCatalogDocument } from '../dist/index.js';

test('one editable original per 18 registered card families, with unique metadata', () => {
  const families = CARD_FAMILIES.map((family) => family.id);
  assert.equal(families.length, 18);
  assert.equal(CARD_TEMPLATES.length, 18);
  assert.deepEqual(getTemplateFamilyCoverage(), { complete: true, missing: [] });
  assert.deepEqual(new Set(CARD_TEMPLATES.map((t) => t.family)), new Set(families));
  assert.equal(new Set(CARD_TEMPLATES.map((t) => t.id)).size, 18);
  assert.equal(new Set(CARD_TEMPLATES.map((t) => t.composition)).size, 18);
  assert.ok(CARD_TEMPLATES.every((t) => t.designOnly === true));
});
test('every family template produces distinct valid front-and-back vector scenes', () => {
  const fingerprints = new Set();
  for(const spec of CARD_TEMPLATES) {
    const doc = createTemplateDocument(spec.id, { now:'2026-10-21T12:00:00.000Z' });
    const status=validateCardDocument(doc);
    assert.equal(status.valid,true, spec.id+' '+status.errors.join('; '));
    assert.equal(doc.family,spec.family);
    assert.equal(doc.artboards.front.side,'front');
    assert.equal(doc.artboards.back.side,'back');
    assert.ok(doc.artboards.front.nodes.length>=10,spec.id);
    assert.ok(doc.artboards.back.nodes.length>=8,spec.id);
    assert.notDeepEqual(doc.artboards.front.nodes,doc.artboards.back.nodes);
    assert.ok(doc.artboards.front.nodes.some(n=>n.id==='display-name' && n.kind==='text'));
    assert.ok(doc.artboards.back.nodes.some(n=>n.id==='back-motto' && n.kind==='text'));
    assert.ok(doc.artboards.front.nodes.some(n=>n.id==='disclaimer' && n.kind==='text'));
    assert.equal(doc.state,'design');
    assert.ok(spec.issuerRequired === CARD_FAMILIES.find(f=>f.id===spec.family)?.issuerRequired);
    assert.equal(spec.fields[0].nodeId,'display-name');
    const fingerprint=JSON.stringify(doc.artboards.front.nodes
      .filter(n=>!['front-background','front-bar-left'].includes(n.id))
      .map(n=>[n.id,n.kind,n.xMm,n.yMm,n.widthMm,n.heightMm]));
    fingerprints.add(fingerprint);
  }
  assert.equal(fingerprints.size,18,'composition must genuinely differ by family');
});
test('template search and lookup have bounded stable results', () => {
  assert.equal(listTemplates().length,18);
  assert.equal(listTemplates({family:'events'}).length,1);
  assert.equal(listTemplates({search:'hotel'})[0]?.family,'hospitality');
  assert.equal(listTemplates({search:'No matching template'}).length,0);
  assert.equal(listTemplates({limit:2}).length,2);
  assert.equal(getTemplate('not-real'),null);
  assert.throws(()=>createTemplateDocument('not-real'),/Unknown OKard template/);
});
test('each front is editable with reversible, versioned scenes and JSON restoration', () => {
  for (const t of CARD_TEMPLATES) {
    const doc=createTemplateDocument(t.id,{displayName:'BEAUTIFUL BRAND'});
    const edited=applyCardCommand(doc,{
      kind:'replace-text',side:'front',nodeId:'display-name',text:'NEW CAPTION',
    });
    const restored=parseCardDocument(serializeCardDocument(edited));
    assert.equal(restored.artboards.front.nodes.find(n=>n.id==='display-name')?.text,'NEW CAPTION');
    assert.equal(doc.artboards.front.nodes.find(n=>n.id==='display-name')?.text,'BEAUTIFUL BRAND');
    assert.equal(restored.revision,1);
    assert.deepEqual(restored.artboards.back,doc.artboards.back);
  }
});
test('safe category-specific copy, no official claims or fabricated live credentials',()=>{
  for(const t of CARD_TEMPLATES){
    const doc=createTemplateDocument(t.id);
    const joined=JSON.stringify(doc).toLowerCase();
    assert.ok(!joined.includes('government-issued'),t.id);
    assert.ok(!joined.includes('valid for identification'),t.id);
    assert.ok(!joined.includes('data:image/'),t.id);
    assert.ok(!joined.includes('https://'),t.id);
    assert.ok(doc.artboards.front.nodes.some(n=>n.id==='disclaimer'));
  }
});
test('portrait templates use placeholders only, not embedded personal assets',()=>{
  for(const t of CARD_TEMPLATES){
    const doc=createTemplateDocument(t.id);
    const images=doc.artboards.front.nodes.filter(n=>n.kind==='image');
    if(t.portrait!=='none') assert.ok(images.length>=1,t.id);
    assert.ok(images.every(n=>n.assetId==='portrait'));
  }
});
test('HAMAD is retained as 3 distinct private-brand showcase documents',()=>{
  assert.equal(HAMAD_SHOWCASE.length,3);
  for(const item of HAMAD_SHOWCASE){
    const doc=findCatalogDocument(item.id);
    assert.ok(doc);
    assert.equal(doc.family,'private-brand');
    assert.equal(validateCardDocument(doc).valid,true);
  }
});
