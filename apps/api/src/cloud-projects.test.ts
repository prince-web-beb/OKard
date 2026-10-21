import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { createTemplateDocument } from '@okard/templates';
import { createCloudProjectRoutes, createOIDCVerifier,
  type CloudProject, type CloudPrincipal, type CloudProjectStore,
  type ProjectWriteResult } from './cloud-projects.js';

const alice:CloudPrincipal={issuer:'https://id.example.test',subject:'user-alice'};
const bob:CloudPrincipal={issuer:'https://id.example.test',subject:'user-bob'};
const otherIssuer:CloudPrincipal={issuer:'https://another-id.example.test',subject:'user-alice'};
const ID='e4b4bc89-78b1-4eef-8b1a-0d8e5cd38200';
const COPY='e4b4bc89-78b1-4eef-8b1a-0d8e5cd38201';

function sample(): Omit<CloudProject,'version'|'createdAt'|'updatedAt'> {
  return {id:ID,name:'Personal brand',sourceTemplate:'studio-identity',
    design:createTemplateDocument('studio-identity')};
}
function fixture() {
  const map=new Map<string,CloudProject>();
  const key=(p:CloudPrincipal,id:string)=>p.issuer+'\n'+p.subject+'\n'+id;
  const ok=(project:CloudProject):ProjectWriteResult=>({status:'ok',project});
  const store:CloudProjectStore={
    async list(p,limit,offset){
      const list=[...map].filter(([k])=>k.startsWith(p.issuer+'\n'+p.subject+'\n'))
        .map(([,v])=>v);
      return {items:list.slice(offset,offset+limit).map(({design,...rest})=>rest),total:list.length};
    },
    async get(p,id){return map.get(key(p,id))??null;},
    async create(p,input) {
      const k=key(p,input.id);if(map.has(k))return {status:'conflict'};
      const project:CloudProject={...input,version:0,
        createdAt:'2026-10-21T12:00:00.000Z',updatedAt:'2026-10-21T12:00:00.000Z'};
      map.set(k,project);return ok(project);
    },
    async save(p,id,version,design){
      const k=key(p,id),project=map.get(k);
      if(!project)return {status:'missing'};
      if(project.version!==version)return {status:'conflict'};
      const updated={...project,design,version:version+1};
      map.set(k,updated);return ok(updated);
    },
    async rename(p,id,version,name){
      const k=key(p,id),project=map.get(k);
      if(!project)return {status:'missing'};
      if(project.version!==version)return {status:'conflict'};
      const updated={...project,name,version:version+1};
      map.set(k,updated);return ok(updated);
    },
    async duplicate(p,id,newId){
      const current=map.get(key(p,id));
      if(!current)return {status:'missing'};
      if(map.has(key(p,newId)))return {status:'conflict'};
      const copied={...current,id:newId,version:0,name:current.name+' (Copy)'};
      map.set(key(p,newId),copied);return ok(copied);
    },
    async remove(p,id,version){
      const k=key(p,id),project=map.get(k);
      if(!project)return 'missing';
      if(project.version!==version)return 'conflict';
      map.delete(k);return 'ok';
    },
  };
  const api=new Hono();
  api.route('/api/v1/cloud/projects',createCloudProjectRoutes({
    store,verifyToken:async(token)=>{
      if(token==='sessionAlice')return alice;
      if(token==='sessionBob')return bob;
      if(token==='otherIssuer')return otherIssuer;
      throw new Error('Unverified token');
    },
  }));
  const request=(method:string,path:string,token?:string,
    body?:unknown,etag?:string)=>api.request('/api/v1/cloud/projects'+path,{
      method,headers:{
        ...(token?{authorization:'Bearer '+token}:{}),
        ...(body!==undefined?{'content-type':'application/json'}:{}),
        ...(etag!==undefined?{'if-match':etag}:{}),
      },
      ...(body!==undefined?{body:JSON.stringify(body)}:{}),
    });
  return {request,map};
}
describe('OIDC-protected cloud project HTTP contract',()=>{
  it('rejects unsigned/anonymous/non-bearer clients and sends private cache controls',async()=>{
    const {request}=fixture();
    const missing=await request('GET','/');
    expect(missing.status).toBe(401);
    expect(missing.headers.get('Cache-Control')).toBe('no-store');
    expect((await missing.json()).error).toBe('AUTH_REQUIRED');
    expect((await request('GET','/','badToken')).status).toBe(401);
  });
  it('isolates owner issuer AND subject across list/read/edit',async()=>{
    const {request}=fixture();
    const record=sample();
    const created=await request('POST','/','sessionAlice',record);
    expect(created.status).toBe(201);
    expect(created.headers.get('ETag')).toBe('"0"');
    expect((await request('GET','/','sessionBob')).status).toBe(200);
    expect((await (await request('GET','/','sessionBob')).json()).total).toBe(0);
    expect((await request('GET','/'+ID,'sessionBob')).status).toBe(404);
    expect((await request('GET','/'+ID,'otherIssuer')).status).toBe(404);
    expect((await request('PATCH','/'+ID,'sessionBob',{name:'Hijack'},'"0"')).status).toBe(404);
    expect((await request('DELETE','/'+ID,'sessionBob',undefined,'"0"')).status).toBe(404);
    expect((await request('GET','/'+ID,'sessionAlice')).status).toBe(200);
  });
  it('enforces If-Match optimistic concurrency for writes and deletion',async()=>{
    const {request}=fixture();
    await request('POST','/','sessionAlice',sample());
    const updated=await request('PUT','/'+ID,'sessionAlice',{
      design:createTemplateDocument('studio-identity'),
    },'"0"');
    expect(updated.status).toBe(200);
    expect(updated.headers.get('ETag')).toBe('"1"');
    expect((await request('PUT','/'+ID,'sessionAlice',{
      design:createTemplateDocument('studio-identity'),
    },'"0"')).status).toBe(409);
    expect((await request('PATCH','/'+ID,'sessionAlice',{name:'New title'})).status).toBe(428);
    expect((await request('PATCH','/'+ID,'sessionAlice',{name:'New title'},'"1"')).status).toBe(200);
    expect((await request('DELETE','/'+ID,'sessionAlice',undefined,'"2"')).status).toBe(204);
    expect((await request('GET','/'+ID,'sessionAlice')).status).toBe(404);
  });
  it('prevents source-template impersonation and rejects unsupported photos',async()=>{
    const {request}=fixture();
    const record=sample();
    const spoof={...record,sourceTemplate:'company-staff'};
    expect((await request('POST','/','sessionAlice',spoof)).status).toBe(400);
    const injected=structuredClone(record);
    injected.design.artboards.front.nodes.push({
      id:'foreign-image',kind:'image',assetId:'https://attacker.test/data',
      xMm:1,yMm:1,widthMm:20,heightMm:20,opacity:1,
      rotationDeg:0,visible:true,locked:false,fit:'cover',cornerRadiusMm:0,
    });
    expect((await request('POST','/','sessionAlice',injected)).status).toBe(400);
    expect((await request('POST','/','sessionAlice',record)).status).toBe(201);
    expect((await request('POST','/','sessionAlice',record)).status).toBe(409);
  });
  it('supports registered independent project duplicates without disclosing scenes in lists',async()=>{
    const {request}=fixture();
    await request('POST','/','sessionAlice',sample());
    const copied=await request('POST','/'+ID+'/duplicate','sessionAlice',{newId:COPY});
    expect(copied.status).toBe(201);
    const response=await request('GET','/','sessionAlice');
    const body=await response.json();
    expect(body.total).toBe(2);
    expect(body.items).toHaveLength(2);
    expect(body.items[0]).not.toHaveProperty('design');
    expect((await request('GET','/'+COPY,'sessionAlice')).status).toBe(200);
    expect((await request('GET','/'+COPY,'sessionBob')).status).toBe(404);
  });
  it('rejects invalid pagination, UUIDs, missing required fields and unsupported content types',async()=>{
    const {request}=fixture();
    expect((await request('GET','/?limit=999','sessionAlice')).status).toBe(400);
    expect((await request('GET','/not-a-uuid','sessionAlice')).status).toBe(400);
    expect((await request('POST','/','sessionAlice',{name:'test'})).status).toBe(400);
    expect((await request('POST','/','sessionAlice',{...sample(),name:'   '})).status).toBe(400);
    expect((await request('PATCH','/'+ID,'sessionAlice',{name:'Changed'})).status).toBe(428);
  });
  it('rejects OIDC config with insecure JWKS or non-HTTPS issuer',()=>{
    expect(()=>createOIDCVerifier({
      issuer:'http://example.com',audience:'okard-web',jwksUrl:'https://example.com/jwks',
    })).toThrow();
    expect(()=>createOIDCVerifier({
      issuer:'https://example.com',audience:'okard-web',jwksUrl:'http://example.com/jwks',
    })).toThrow();
  });
});
