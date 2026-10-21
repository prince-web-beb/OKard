import { describe,expect,it,vi } from 'vitest';
import { createTemplateDocument } from '@okard/templates';
import { createLocalProject } from '@okard/project-library';
import { createCloudProjectClient,RemoteProjectError } from './cloud-projects.js';

const id='e4b4bc89-78b1-4eef-8b1a-0d8e5cd38200';
const sampleProject=()=>{
  const p=createLocalProject('studio-identity','My design',{id});
  return {...p,design:createTemplateDocument('studio-identity')};
};
const remote=(local=sampleProject(),version=0)=>({
  id:local.id,name:local.name,sourceTemplate:local.sourceTemplate,
  design:local.design,version,
  createdAt:'2026-10-21T00:00:00.000Z',
  updatedAt:'2026-10-21T00:00:00.000Z',
});
const token=async()=>'signed.jwt.token';
describe('same-origin cloud project client',()=>{
  it('uses explicit bearer auth and sends a validated scene without photo pixels',async()=>{
    let headers:Headers|undefined,body='';
    const fetcher=vi.fn(async (_input:RequestInfo|URL,init?:RequestInit)=>{
      headers=new Headers(init?.headers);
      body=String(init?.body??'');
      return new Response(JSON.stringify({project:remote()}),{
        status:201,headers:{'content-type':'application/json',etag:'"0"'},
      });
    }) as unknown as typeof fetch;
    const client=createCloudProjectClient(token,fetcher);
    const project=await client.create(sampleProject());
    expect(project.version).toBe(0);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(headers?.get('Authorization')).toBe('Bearer signed.jwt.token');
    expect(headers?.get('Content-Type')).toBe('application/json');
    expect(body).not.toContain('data:image/');
    expect(JSON.parse(body).design.artboards.front.side).toBe('front');
  });
  it('preserves If-Match on revision-controlled writes',async()=>{
    const calls:Array<{url:string;headers:Headers;method:string}>=[];
    const fetcher=vi.fn(async (input:RequestInfo|URL,init?:RequestInit)=>{
      calls.push({url:String(input),headers:new Headers(init?.headers),method:init?.method??'GET'});
      return new Response(JSON.stringify({project:remote(sampleProject(),3)}),{
        status:200,headers:{'content-type':'application/json'},
      });
    }) as unknown as typeof fetch;
    const client=createCloudProjectClient(token,fetcher);
    await client.save(id,2,sampleProject().design);
    await client.rename(id,3,'Another name');
    expect(calls[0]?.headers.get('If-Match')).toBe('"2"');
    expect(calls[1]?.headers.get('If-Match')).toBe('"3"');
    expect(calls[0]?.url).toBe('/api/v1/cloud/projects/'+id);
    expect(calls[0]?.method).toBe('PUT');
  });
  it('rejects stale versions instead of silently retrying an overwrite',async()=>{
    const fetcher=vi.fn(async()=>new Response(JSON.stringify({
      error:'CONFLICT',message:'This project changed in another session.',
    }),{status:409,headers:{'content-type':'application/json'}})) as unknown as typeof fetch;
    const client=createCloudProjectClient(token,fetcher);
    await expect(client.save(id,0,sampleProject().design)).rejects.toMatchObject({
      status:409,code:'CONFLICT',
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('does not attempt network requests without a signed-in token',async()=>{
    const fetcher=vi.fn() as unknown as typeof fetch;
    const client=createCloudProjectClient(async()=>'',fetcher);
    await expect(client.list()).rejects.toBeInstanceOf(RemoteProjectError);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('rejects malformed project bodies rather than opening forged artwork',async()=>{
    const fetcher=vi.fn(async()=>new Response(JSON.stringify({
      project:{...remote(),design:{schemaVersion:999}},
    }),{status:200,headers:{'content-type':'application/json'}})) as unknown as typeof fetch;
    const client=createCloudProjectClient(token,fetcher);
    await expect(client.get(id)).rejects.toMatchObject({code:'MALFORMED_RESPONSE'});
  });
});
