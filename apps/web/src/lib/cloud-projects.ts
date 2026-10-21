import { parseCardDocument, type CardDocument } from '@okard/design-schema';
import type { LocalProject } from '@okard/project-library';
import { getAccessToken } from './auth.js';

export interface RemoteProject {
  id:string;
  name:string;
  sourceTemplate:string;
  design:CardDocument;
  version:number;
  createdAt:string;
  updatedAt:string;
}
export interface RemoteProjectListItem extends Omit<RemoteProject,'design'> {}
export interface RemoteProjectList {items:RemoteProjectListItem[];total:number}

export class RemoteProjectError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);this.name='RemoteProjectError';
  }
}

export type AccessTokenProvider = () => Promise<string>;
type FetchFn = typeof fetch;
function isObject(value:unknown):value is Record<string,unknown> {
  return !!value && typeof value==='object' && !Array.isArray(value);
}
function remoteProject(value:unknown):RemoteProject {
  if(!isObject(value) || typeof value.id!=='string' ||
    typeof value.name!=='string'||typeof value.sourceTemplate!=='string' ||
    typeof value.version!=='number'||!Number.isSafeInteger(value.version) ||
    typeof value.createdAt!=='string'||typeof value.updatedAt!=='string') {
    throw new RemoteProjectError(502,'MALFORMED_RESPONSE','The project service returned invalid data.');
  }
  let design:CardDocument;
  try {design=parseCardDocument(JSON.stringify(value.design));}
  catch {throw new RemoteProjectError(502,'MALFORMED_RESPONSE','A project returned an invalid design.');}
  return {
    id:value.id,name:value.name,sourceTemplate:value.sourceTemplate,
    version:value.version,createdAt:value.createdAt,
    updatedAt:value.updatedAt,design,
  };
}

/**
 * Same-origin client only. It does not persist access tokens, scenes, or image
 * binaries. A token provider must return a valid OIDC-issued access token.
 */
export function createCloudProjectClient(
  accessToken:AccessTokenProvider = getAccessToken,
  fetcher:FetchFn = fetch,
) {
  const call=async(path:string, options:{
    method?: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE';
    body?:unknown; version?:number;
  } = {}):Promise<{body:Record<string,unknown>;etag:string|null}>=>{
    const token=await accessToken();
    if(!token || token.length>4800)throw new RemoteProjectError(401,'AUTH_REQUIRED','Please sign in again.');
    const headers:Record<string,string>={
      'Authorization':'Bearer '+token,
      'Accept':'application/json',
    };
    if(options.body!==undefined)headers['Content-Type']='application/json';
    if(options.version!==undefined){
      if(!Number.isSafeInteger(options.version)||options.version<0)
        throw new RemoteProjectError(400,'INVALID_VERSION','Invalid saved project version.');
      headers['If-Match']='"'+options.version+'"';
    }
    let response:Response;
    try {
      response=await fetcher('/api/v1/cloud/projects'+path,{
        method:options.method??'GET',headers,
        ...(options.body!==undefined?{body:JSON.stringify(options.body)}:{}),
        credentials:'same-origin',redirect:'manual',
        signal:AbortSignal.timeout(12_000),
      });
    } catch {
      throw new RemoteProjectError(503,'OFFLINE','Unable to reach cloud projects. Your device designs remain available.');
    }
    if(response.status===204)return {body:{},etag:null};
    let data:unknown=null;
    try {data=await response.json();} catch { /* malformed or empty body */ }
    if(!response.ok){
      const code=isObject(data)&&typeof data.error==='string'?data.error:'CLOUD_ERROR';
      const message=isObject(data)&&typeof data.message==='string'
        ?data.message:'The cloud project request could not be completed.';
      throw new RemoteProjectError(response.status,code,message);
    }
    if(!isObject(data))throw new RemoteProjectError(502,'MALFORMED_RESPONSE','Invalid project service response.');
    return {body:data,etag:response.headers.get('ETag')};
  };
  const validated=(result:Record<string,unknown>):RemoteProject=>remoteProject(result.project);
  return {
    async list(limit=20,offset=0):Promise<RemoteProjectList> {
      if(!Number.isInteger(limit)||limit<1||limit>50||
        !Number.isInteger(offset)||offset<0||offset>10000)
        throw new RemoteProjectError(400,'INVALID_PAGE','Invalid cloud projects page.');
      const {body}=await call('?limit='+limit+'&offset='+offset);
      if(!Array.isArray(body.items)||typeof body.total!=='number')
        throw new RemoteProjectError(502,'MALFORMED_RESPONSE','Invalid project list.');
      // These are safe metadata only — no private design scenes in list payload.
      const items=body.items.map((v)=>{
        if(!isObject(v)||typeof v.id!=='string'||typeof v.name!=='string'||
          typeof v.sourceTemplate!=='string'||typeof v.version!=='number'||
          typeof v.createdAt!=='string'||typeof v.updatedAt!=='string')
          throw new RemoteProjectError(502,'MALFORMED_RESPONSE','Invalid project metadata.');
        return {
          id:v.id,name:v.name,sourceTemplate:v.sourceTemplate,
          version:v.version,createdAt:v.createdAt,updatedAt:v.updatedAt,
        };
      });
      return {items,total:body.total};
    },
    async get(id:string):Promise<RemoteProject> {
      return validated((await call('/'+encodeURIComponent(id))).body);
    },
    async create(project:LocalProject):Promise<RemoteProject> {
      return validated((await call('',{
        method:'POST',
        body:{id:project.id,name:project.name,sourceTemplate:project.sourceTemplate,
          design:project.design},
      })).body);
    },
    async save(id:string,version:number,design:CardDocument):Promise<RemoteProject> {
      return validated((await call('/'+encodeURIComponent(id),{
        method:'PUT',version,body:{design},
      })).body);
    },
    async rename(id:string,version:number,name:string):Promise<RemoteProject> {
      return validated((await call('/'+encodeURIComponent(id),{
        method:'PATCH',version,body:{name},
      })).body);
    },
    async duplicate(id:string,newId:string):Promise<RemoteProject> {
      return validated((await call('/'+encodeURIComponent(id)+'/duplicate',{
        method:'POST',body:{newId},
      })).body);
    },
    async remove(id:string,version:number):Promise<void> {
      await call('/'+encodeURIComponent(id),{method:'DELETE',version});
    },
  };
}
