import { Hono } from 'hono';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { assertCardDocument, type CardDocument } from '@okard/design-schema';
import { getTemplate, HAMAD_SHOWCASE } from '@okard/templates';

export interface CloudPrincipal { issuer: string; subject: string }
export interface CloudProject {
  id: string;
  name: string;
  sourceTemplate: string;
  design: CardDocument;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface CloudProjectList {
  items: Array<Omit<CloudProject, 'design'>>;
  total: number;
}
export type ProjectWriteResult =
  | { status: 'ok'; project: CloudProject }
  | { status: 'missing' | 'conflict' | 'limit' };
export interface CloudProjectStore {
  list(principal: CloudPrincipal, limit: number, offset: number): Promise<CloudProjectList>;
  get(principal: CloudPrincipal, id: string): Promise<CloudProject | null>;
  create(principal: CloudPrincipal, project: Pick<CloudProject, 'id' | 'name' | 'sourceTemplate' | 'design'>): Promise<ProjectWriteResult>;
  save(principal: CloudPrincipal, id: string, version: number, design: CardDocument): Promise<ProjectWriteResult>;
  rename(principal: CloudPrincipal, id: string, version: number, name: string): Promise<ProjectWriteResult>;
  duplicate(principal: CloudPrincipal, id: string, newId: string): Promise<ProjectWriteResult>;
  remove(principal: CloudPrincipal, id: string, version: number): Promise<'ok' | 'missing' | 'conflict'>;
}
export interface CloudProjectServices {
  store: CloudProjectStore;
  verifyToken: (token: string) => Promise<CloudPrincipal>;
}
export class CloudInputError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: 400 | 413 | 415 = 400) {
    super(message); this.name='CloudInputError';
  }
}
const UUID = /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const MAX_BODY = 512_000;
function checkId(input: string): boolean { return UUID.test(input); }
function parseTitle(input: unknown): string {
  if (typeof input !== 'string' || !input.trim() || input.trim().length > 90 ||
      /[\u0000-\u001f]/.test(input)) {
    throw new CloudInputError('INVALID_NAME','Project name must be 1–90 printable characters.');
  }
  return input.trim();
}
function validateDesign(value: unknown, source: string): CardDocument {
  const doc = value as CardDocument;
  try { assertCardDocument(doc); }
  catch { throw new CloudInputError('INVALID_SCENE','The card document did not pass schema validation.'); }
  const metadata = getTemplate(source);
  const hamad = HAMAD_SHOWCASE.some((item)=>item.id===source && doc.id===item.id && doc.family==='private-brand');
  if (!(metadata && doc.id==='template-'+metadata.id && doc.family===metadata.family) && !hamad) {
    throw new CloudInputError('MISMATCHED_TEMPLATE','The card document does not match its registered template.');
  }
  // Image binaries are not stored in design records: require separately authorized storage.
  for(const side of [doc.artboards.front,doc.artboards.back]) {
    for(const node of side.nodes) {
      if(node.kind==='image' && node.assetId!=='portrait') {
        throw new CloudInputError('UNSUPPORTED_ASSET',
          'Image uploads are not enabled for cloud projects yet.');
      }
    }
  }
  return doc;
}
async function readJson(request: Request): Promise<Record<string,unknown>> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new CloudInputError('JSON_REQUIRED','Send an application/json request.',415);
  }
  const length = Number(request.headers.get('content-length') ?? '0');
  if (!Number.isFinite(length) || length > MAX_BODY) {
    throw new CloudInputError('TOO_LARGE','The maximum project payload is 500 KB.',413);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new CloudInputError('INVALID_JSON','An object is required.');
  let bytes=0;
  const chunks: Uint8Array[]=[];
  try {
    while(true){
      const result=await reader.read();
      if(result.done) break;
      bytes+=result.value.byteLength;
      if(bytes>MAX_BODY) {
        await reader.cancel();
        throw new CloudInputError('TOO_LARGE','The maximum project payload is 500 KB.',413);
      }
      chunks.push(result.value);
    }
  } finally { reader.releaseLock(); }
  const joined=new Uint8Array(bytes);
  let pos=0;
  for(const chunk of chunks){joined.set(chunk,pos);pos+=chunk.length;}
  let parsed: unknown;
  try {parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(joined));}
  catch{throw new CloudInputError('INVALID_JSON','The request body must contain a valid JSON object.');}
  if(!parsed || Array.isArray(parsed) || typeof parsed!=='object') {
    throw new CloudInputError('INVALID_JSON','A JSON object is required.');
  }
  return parsed as Record<string,unknown>;
}
function expectedVersion(value: string | undefined): number | null {
  const match=/^"(0|[1-9]\d{0,9})"$/.exec(value??'');
  if(!match) return null;
  const version=Number(match[1]);
  return Number.isSafeInteger(version)?version:null;
}
function writtenStatus(result: ProjectWriteResult): number {
  if(result.status==='missing') return 404;
  if(result.status==='conflict') return 409;
  if(result.status==='limit') return 409;
  return 200;
}
function errorBody(code: string, message: string) {return {error: code, message};}

/** Fail closed unless OIDC is explicitly provisioned. Only asymmetric signed JWTs accepted. */
export function createOIDCVerifier(config: {
  issuer: string; audience: string; jwksUrl: string;
}): (token: string) => Promise<CloudPrincipal> {
  if (!config.issuer || !config.audience || !config.jwksUrl) {
    throw new Error('Cloud OIDC config is incomplete.');
  }
  const issuer = new URL(config.issuer);
  const jwks = new URL(config.jwksUrl);
  if (issuer.protocol!=='https:' || jwks.protocol!=='https:' ||
      issuer.username || issuer.password || issuer.search || issuer.hash ||
      jwks.username || jwks.password || jwks.hash ||
      !issuer.hostname || !jwks.hostname || !config.audience.trim()) {
    throw new Error('Cloud OIDC must use explicit HTTPS issuer, JWKS URL and audience.');
  }
  // JWKS endpoint is server-provisioned and never supplied through a request.
  const remote=createRemoteJWKSet(jwks, {timeoutDuration:5_000,cooldownDuration:30_000});
  return async(token)=>{
    const {payload}=await jwtVerify(token,remote,{
      issuer:config.issuer, audience:config.audience,
      algorithms:['RS256','ES256'], clockTolerance:5, requiredClaims:['sub','exp','iat'],
      maxTokenAge:3_600,
    });
    if(typeof payload.sub!=='string' || !payload.sub || payload.sub.length>200) {
      throw new Error('A valid OIDC subject is required.');
    }
    return {issuer:config.issuer,subject:payload.sub};
  };
}

/**
 * Injected store and verifier allow isolated auth tests. Production passes ONLY
 * the actual OIDC verifier + owner-filtered SQL store; no demo token backdoor.
 */
export function createCloudProjectRoutes(services: CloudProjectServices) {
  const api = new Hono<{ Variables: { principal: CloudPrincipal } }>();
  api.use('*',async(c,next)=>{
    c.header('Cache-Control','no-store');
    c.header('Vary','Authorization');
    const header=c.req.header('authorization')??'';
    const match=/^Bearer ([A-Za-z0-9_.\-~+/=]+)$/.exec(header);
    if(!match || header.length>5000) {
      return c.json(errorBody('AUTH_REQUIRED','Sign in to manage cloud projects.'),401);
    }
    try {
      const principal=await services.verifyToken(match[1]!);
      if(!principal.issuer || !principal.subject ||
          principal.subject.length>200 || principal.issuer.length>500) throw new Error('Bad subject');
      c.set('principal',principal);
    } catch {
      return c.json(errorBody('INVALID_TOKEN','Sign in again to continue.'),401);
    }
    await next();
  });
  api.get('/',async(c)=>{
    const limit=Number(c.req.query('limit')??'20');
    const offset=Number(c.req.query('offset')??'0');
    if(!Number.isInteger(limit)||limit<1||limit>50||
       !Number.isInteger(offset)||offset<0||offset>10000)
      return c.json(errorBody('INVALID_PAGE','Use limit 1–50 and offset 0–10000.'),400);
    return c.json(await services.store.list(c.get('principal'),limit,offset));
  });
  api.get('/:id',async(c)=>{
    const id=c.req.param('id');
    if(!checkId(id))return c.json(errorBody('INVALID_ID','Invalid project identifier.'),400);
    const row=await services.store.get(c.get('principal'),id);
    if(!row)return c.json(errorBody('NOT_FOUND','Project not found.'),404);
    c.header('ETag',`"${row.version}"`);
    return c.json({project:row});
  });
  api.post('/',async(c)=>{
    const body=await readJson(c.req.raw);
    if(typeof body.id!=='string'||!checkId(body.id))
      return c.json(errorBody('INVALID_ID','A valid new project UUID is required.'),400);
    if(typeof body.sourceTemplate!=='string')
      return c.json(errorBody('UNKNOWN_TEMPLATE','Choose a registered design.'),400);
    const name=parseTitle(body.name);
    const design=validateDesign(body.design,body.sourceTemplate);
    const result=await services.store.create(c.get('principal'),{
      id:body.id,name,design,sourceTemplate:body.sourceTemplate,
    });
    if(result.status!=='ok')
      return c.json(errorBody(result.status.toUpperCase(),
        'The project could not be created.'),writtenStatus(result) as 404|409);
    c.header('ETag',`"${result.project.version}"`);
    return c.json({project:result.project},201);
  });
  api.put('/:id',async(c)=>{
    const id=c.req.param('id');
    if(!checkId(id))return c.json(errorBody('INVALID_ID','Invalid project identifier.'),400);
    const version=expectedVersion(c.req.header('if-match'));
    if(version===null)return c.json(errorBody('PRECONDITION_REQUIRED','An exact If-Match version is required.'),428);
    const body=await readJson(c.req.raw);
    const current=await services.store.get(c.get('principal'),id);
    if(!current)return c.json(errorBody('NOT_FOUND','Project not found.'),404);
    const design=validateDesign(body.design,current.sourceTemplate);
    const result=await services.store.save(c.get('principal'),id,version,design);
    if(result.status!=='ok')return c.json(errorBody(result.status.toUpperCase(),
      'Project changed on another device or was removed.'),writtenStatus(result) as 404|409);
    c.header('ETag',`"${result.project.version}"`);
    return c.json({project:result.project});
  });
  api.patch('/:id',async(c)=>{
    const id=c.req.param('id');
    if(!checkId(id))return c.json(errorBody('INVALID_ID','Invalid project identifier.'),400);
    const version=expectedVersion(c.req.header('if-match'));
    if(version===null)return c.json(errorBody('PRECONDITION_REQUIRED','An exact If-Match version is required.'),428);
    const body=await readJson(c.req.raw);
    const result=await services.store.rename(c.get('principal'),id,version,parseTitle(body.name));
    if(result.status!=='ok')return c.json(errorBody(result.status.toUpperCase(),
      'Project changed on another device or was removed.'),writtenStatus(result) as 404|409);
    c.header('ETag',`"${result.project.version}"`);
    return c.json({project:result.project});
  });
  api.post('/:id/duplicate',async(c)=>{
    const id=c.req.param('id');
    if(!checkId(id))return c.json(errorBody('INVALID_ID','Invalid project identifier.'),400);
    const body=await readJson(c.req.raw);
    if(typeof body.newId!=='string'||!checkId(body.newId))
      return c.json(errorBody('INVALID_ID','A valid new project UUID is required.'),400);
    const result=await services.store.duplicate(c.get('principal'),id,body.newId);
    if(result.status!=='ok')return c.json(errorBody(result.status.toUpperCase(),
      'Project was not found or cannot be copied.'),writtenStatus(result) as 404|409);
    c.header('ETag',`"${result.project.version}"`);
    return c.json({project:result.project},201);
  });
  api.delete('/:id',async(c)=>{
    const id=c.req.param('id');
    if(!checkId(id))return c.json(errorBody('INVALID_ID','Invalid project identifier.'),400);
    const version=expectedVersion(c.req.header('if-match'));
    if(version===null)return c.json(errorBody('PRECONDITION_REQUIRED','An exact If-Match version is required.'),428);
    const outcome=await services.store.remove(c.get('principal'),id,version);
    if(outcome!=='ok')return c.json(errorBody(outcome.toUpperCase(),
      'Project changed on another device or was removed.'),outcome==='missing'?404:409);
    return c.body(null,204);
  });
  api.onError((error,c)=>{
    if(error instanceof CloudInputError)
      return c.json(errorBody(error.code,error.message),error.status);
    console.error('OKard cloud project API error',error instanceof Error?error.name:'Unknown');
    return c.json(errorBody('SERVICE_ERROR','Cloud project storage is unavailable.'),503);
  });
  return api;
}
