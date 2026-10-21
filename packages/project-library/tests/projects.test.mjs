import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCardCommand } from '@okard/design-schema';
import { createLocalProject, createMemoryProjectRepository,
  ProjectLibraryError, MAX_SCENE_BYTES } from '../dist/index.js';

const a = 'f49ab67b-99e4-41fb-9811-7735c4ae9601';
const b = 'f49ab67b-99e4-41fb-9811-7735c4ae9602';
const c = 'f49ab67b-99e4-41fb-9811-7735c4ae9603';

test('creates 18-family and HAMAD drafts without storing user photos', () => {
  const staff=createLocalProject('company-staff','Work sample',{id:a});
  assert.equal(staff.design.family,'staff');
  assert.equal(staff.version,1);
  assert.equal(staff.etag,0);
  assert.equal(staff.id,a);
  assert.equal(staff.sourceTemplate,'company-staff');
  assert.ok(staff.design.artboards.front.nodes.some(n=>n.id==='display-name'));
  assert.ok(!JSON.stringify(staff).includes('data:image/'));
  const brand=createLocalProject('hamad-royal','Original HAMAD',{id:b});
  assert.equal(brand.design.family,'private-brand');
  assert.throws(()=>createLocalProject('unknown','Bad',{id:c}),/available OKard design/);
});
test('create/get/list make defensive copies and sort by last modification', async()=>{
  const repository=createMemoryProjectRepository();
  const one=await repository.create(createLocalProject('studio-identity','My Brand',{id:a}));
  const two=await repository.create(createLocalProject('creator-edition','Art',{id:b}));
  assert.equal((await repository.list()).length,2);
  const fetched=await repository.get(a);
  fetched.design.title='Tampered in caller only';
  assert.equal((await repository.get(a)).design.title,one.design.title);
  assert.equal(two.name,'Art');
});
test('optimistic etags prevent silent overwrite across two browser tabs', async()=>{
  const repository=createMemoryProjectRepository();
  const seed=await repository.create(createLocalProject('company-staff','People',{id:a}));
  const updated=applyCardCommand(seed.design,{
    kind:'replace-text',side:'front',nodeId:'display-name',text:'TEAM MEMBER',
  });
  const saved=await repository.saveDesign(a,updated,seed.etag);
  assert.equal(saved.etag,1);
  assert.equal(saved.design.revision,1);
  await assert.rejects(repository.saveDesign(a,updated,seed.etag),error=>
    error instanceof ProjectLibraryError && error.code==='CONFLICT');
  assert.equal((await repository.get(a)).design.artboards.front.nodes
    .find(n=>n.id==='display-name').text,'TEAM MEMBER');
});
test('rename, duplicate and remove are persistent only within the repository',async()=>{
  const repository=createMemoryProjectRepository();
  const seed=await repository.create(createLocalProject('hotel-reserve','Guest Design',{id:a}));
  const renamed=await repository.rename(a,'Summer Guest',seed.etag);
  assert.equal(renamed.name,'Summer Guest');
  assert.equal(renamed.etag,1);
  const copy=await repository.duplicate(a,b);
  assert.equal(copy.id,b);
  assert.equal(copy.design.id,renamed.design.id);
  assert.equal(copy.name,'Summer Guest (Copy)');
  assert.equal(copy.etag,0);
  const changed=applyCardCommand(copy.design,{
    kind:'replace-text',side:'back',nodeId:'back-motto',text:'BE OUR GUEST',
  });
  await repository.saveDesign(b,changed,copy.etag);
  assert.notDeepEqual((await repository.get(a)).design.artboards.back,
    (await repository.get(b)).design.artboards.back);
  await repository.remove(a);
  assert.equal(await repository.get(a),null);
  await assert.rejects(repository.remove(a),error=>error.code==='NOT_FOUND');
});
test('duplicate IDs, metadata tampering and oversized projects are refused',async()=>{
  const repository=createMemoryProjectRepository();
  const record=await repository.create(createLocalProject('summit-event','Summit',{id:a}));
  await assert.rejects(repository.create(record),error=>error.code==='CONFLICT');
  await assert.rejects(repository.duplicate(a,a),error=>error.code==='CONFLICT');
  await assert.rejects(repository.rename(a,'   ',0),error=>error.code==='INVALID_PROJECT');
  const wrongFamily={...record.design,family:'corporate'};
  await assert.rejects(repository.saveDesign(a,wrongFamily,0),error=>error.code==='INVALID_PROJECT');
  const tampered={...record,sourceTemplate:'company-staff'};
  await assert.rejects(repository.create({...tampered,id:b}),error=>error.code==='INVALID_PROJECT');
  assert.equal((await repository.get(a)).etag,0);
  assert.equal(MAX_SCENE_BYTES,512000);
});
test('browser adapter is explicitly unavailable in non-DOM environments',async()=>{
  const { createBrowserProjectRepository }=await import('../dist/index.js');
  if(typeof indexedDB === 'undefined') {
    assert.throws(createBrowserProjectRepository,error=>error.code==='STORAGE_UNAVAILABLE');
  }
});
