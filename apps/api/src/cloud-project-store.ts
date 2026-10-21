import pg, { type Pool, type PoolClient } from 'pg';
const { Pool: PgPool } = pg;
import type {
  CloudPrincipal, CloudProject, CloudProjectList, CloudProjectStore,
  ProjectWriteResult,
} from './cloud-projects.js';
import { assertCardDocument, type CardDocument } from '@okard/design-schema';

type Row = {
  id: string; name: string; source_template: string; family: string;
  design: CardDocument; version: number;
  created_at: Date | string; updated_at: Date | string;
};
const MAX_PROJECTS = 200;
const MAX_DESIGN_BYTES = 512_000;
const iso = (value: Date | string): string => value instanceof Date
  ? value.toISOString() : new Date(value).toISOString();
function mapRow(row: Row): CloudProject {
  return {
    id:row.id,name:row.name,sourceTemplate:row.source_template,
    design:row.design,version:row.version,
    createdAt:iso(row.created_at),updatedAt:iso(row.updated_at),
  };
}
function classifyMissing(found: CloudProject | null): ProjectWriteResult {
  return found ? {status:'conflict'} : {status:'missing'};
}
function designJson(scene: CardDocument): string {
  assertCardDocument(scene);
  const body=JSON.stringify(scene);
  if(new TextEncoder().encode(body).byteLength > MAX_DESIGN_BYTES) throw new Error('Scene too large');
  return body;
}
async function audit(
  client: PoolClient, owner: CloudPrincipal, projectId: string,
  event: 'create'|'save'|'rename'|'duplicate'|'delete', version: number,
): Promise<void> {
  await client.query(
    `INSERT INTO okard_cloud_project_audit
       (project_id,owner_issuer,owner_subject,event,project_version)
     VALUES ($1,$2,$3,$4,$5)`,
    [projectId,owner.issuer,owner.subject,event,version],
  );
}
async function tx<T>(
  pool:Pool, owner:CloudPrincipal, fn:(client:PoolClient)=>Promise<T>,
):Promise<T> {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    // SET LOCAL is cleared at commit/rollback, so connection reuse does not
    // leak one signed-in user's tenant identity to another request.
    await client.query("SELECT set_config('okard.owner_issuer',$1,true), set_config('okard.owner_subject',$2,true)",
      [owner.issuer,owner.subject]);
    const value=await fn(client);
    await client.query('COMMIT');
    return value;
  } catch(error) {
    try {await client.query('ROLLBACK');} catch { /* preserve original error */ }
    throw error;
  } finally {client.release();}
}
async function acquireOwnerLock(client:PoolClient, owner:CloudPrincipal):Promise<void> {
  // Serialize create/duplicate capacity checks across API instances per owner.
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',
    [owner.issuer,owner.subject]);
}
async function hasCapacity(client:PoolClient, owner:CloudPrincipal):Promise<boolean> {
  const result=await client.query<{count:string}>(
    `SELECT count(*)::text as count FROM okard_cloud_projects
      WHERE owner_issuer=$1 AND owner_subject=$2 AND deleted_at IS NULL`,
    [owner.issuer,owner.subject],
  );
  return Number(result.rows[0]?.count??'0')<MAX_PROJECTS;
}
const SELECT_COLUMNS = `id,name,source_template,family,design,version,created_at,updated_at`;

export function createPostgresProjectStore(pool: Pool): CloudProjectStore {
  const store:CloudProjectStore = {
    async consumeRateLimit(owner,kind) {
      const max = kind === 'read' ? 120 : 30;
      return tx(pool,owner,async(client)=>{
        // UPSERT serializes updates to the same owner-minute row across API
        // instances. A full bucket returns zero rows (HTTP 429 at the router).
        const result=await client.query<{used:number}>(
          `INSERT INTO okard_cloud_rate_limits
             (owner_issuer,owner_subject,window_start,kind,used)
           VALUES ($1,$2,date_trunc('minute',now()),$3,1)
           ON CONFLICT (owner_issuer,owner_subject,window_start,kind)
           DO UPDATE SET used=okard_cloud_rate_limits.used+1
             WHERE okard_cloud_rate_limits.used < $4
           RETURNING used`,
          [owner.issuer,owner.subject,kind,max],
        );
        return result.rows.length>0;
      });
    },
    async list(owner,limit,offset):Promise<CloudProjectList> {
      // The LIST response deliberately does not include any card design data.
      return tx(pool,owner,async(client)=>{
        const rows=await client.query<Omit<Row,'design'>>(
          `SELECT id,name,source_template,family,version,created_at,updated_at
           FROM okard_cloud_projects
           WHERE owner_issuer=$1 AND owner_subject=$2 AND deleted_at IS NULL
           ORDER BY updated_at DESC,id DESC LIMIT $3 OFFSET $4`,
          [owner.issuer,owner.subject,limit,offset],
        );
        const count=await client.query<{count:string}>(
          `SELECT count(*)::text as count FROM okard_cloud_projects
           WHERE owner_issuer=$1 AND owner_subject=$2 AND deleted_at IS NULL`,
          [owner.issuer,owner.subject],
        );
        return {
          items:rows.rows.map((r)=>({
            id:r.id,name:r.name,sourceTemplate:r.source_template,version:r.version,
            createdAt:iso(r.created_at),updatedAt:iso(r.updated_at),
          })),
          total:Number(count.rows[0]?.count??'0'),
        };
      });
    },
    async get(owner,id) {
      return tx(pool,owner,async(client)=>{
        const result=await client.query<Row>(
          `SELECT ${SELECT_COLUMNS} FROM okard_cloud_projects
            WHERE id=$1 AND owner_issuer=$2 AND owner_subject=$3 AND deleted_at IS NULL`,
          [id,owner.issuer,owner.subject],
        );
        return result.rows[0]?mapRow(result.rows[0]):null;
      });
    },
    async create(owner,project) {
      return tx(pool,owner,async(client):Promise<ProjectWriteResult>=>{
        await acquireOwnerLock(client,owner);
        if(!await hasCapacity(client,owner))return {status:'limit'};
        const inserted=await client.query<Row>(
          `INSERT INTO okard_cloud_projects
            (id,owner_issuer,owner_subject,name,source_template,family,design)
           VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
           ON CONFLICT (id) DO NOTHING
           RETURNING ${SELECT_COLUMNS}`,
          [project.id,owner.issuer,owner.subject,project.name,
            project.sourceTemplate,project.design.family,designJson(project.design)],
        );
        if(!inserted.rows[0])return {status:'conflict'};
        await audit(client,owner,project.id,'create',0);
        return {status:'ok',project:mapRow(inserted.rows[0])};
      });
    },
    async save(owner,id,version,scene) {
      const updated=await tx(pool,owner,async(client)=>{
        const result=await client.query<Row>(
          `UPDATE okard_cloud_projects
           SET design=$1::jsonb,version=version+1,updated_at=now()
           WHERE id=$2 AND owner_issuer=$3 AND owner_subject=$4
             AND version=$5 AND deleted_at IS NULL
           RETURNING ${SELECT_COLUMNS}`,
          [designJson(scene),id,owner.issuer,owner.subject,version],
        );
        if(result.rows[0])await audit(client,owner,id,'save',result.rows[0].version);
        return result.rows[0]??null;
      });
      return updated ? {status:'ok',project:mapRow(updated)} :
        classifyMissing(await store.get(owner,id));
    },
    async rename(owner,id,version,name) {
      const updated=await tx(pool,owner,async(client)=>{
        const result=await client.query<Row>(
          `UPDATE okard_cloud_projects
             SET name=$1,version=version+1,updated_at=now()
           WHERE id=$2 AND owner_issuer=$3 AND owner_subject=$4
             AND version=$5 AND deleted_at IS NULL
           RETURNING ${SELECT_COLUMNS}`,
          [name,id,owner.issuer,owner.subject,version],
        );
        if(result.rows[0])await audit(client,owner,id,'rename',result.rows[0].version);
        return result.rows[0]??null;
      });
      return updated ? {status:'ok',project:mapRow(updated)} :
        classifyMissing(await store.get(owner,id));
    },
    async duplicate(owner,id,newId) {
      return tx(pool,owner,async(client):Promise<ProjectWriteResult>=>{
        await acquireOwnerLock(client,owner);
        if(!await hasCapacity(client,owner))return {status:'limit'};
        const source=await client.query<Row>(
          `SELECT ${SELECT_COLUMNS} FROM okard_cloud_projects
           WHERE id=$1 AND owner_issuer=$2 AND owner_subject=$3 AND deleted_at IS NULL`,
          [id,owner.issuer,owner.subject],
        );
        const original=source.rows[0];
        if(!original)return {status:'missing'};
        const name=(original.name.slice(0,83)+' (Copy)').slice(0,90);
        const inserted=await client.query<Row>(
          `INSERT INTO okard_cloud_projects
             (id,owner_issuer,owner_subject,name,source_template,family,design)
           VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
           ON CONFLICT (id) DO NOTHING
           RETURNING ${SELECT_COLUMNS}`,
          [newId,owner.issuer,owner.subject,name,original.source_template,
            original.family,JSON.stringify(original.design)],
        );
        if(!inserted.rows[0])return {status:'conflict'};
        await audit(client,owner,newId,'duplicate',0);
        return {status:'ok',project:mapRow(inserted.rows[0])};
      });
    },
    async remove(owner,id,version) {
      const updated=await tx(pool,owner,async(client)=>{
        const result=await client.query<Row>(
          `UPDATE okard_cloud_projects
           SET deleted_at=now(),version=version+1,updated_at=now()
           WHERE id=$1 AND owner_issuer=$2 AND owner_subject=$3
              AND version=$4 AND deleted_at IS NULL
           RETURNING ${SELECT_COLUMNS}`,
          [id,owner.issuer,owner.subject,version],
        );
        if(result.rows[0])await audit(client,owner,id,'delete',result.rows[0].version);
        return result.rows[0]??null;
      });
      return updated?'ok':(await store.get(owner,id)?'conflict':'missing');
    },
  };
  return store;
}

/**
 * One pool, reused by all requests. Env is server-only. We do not disable
 * certificate verification for remote Postgres connections.
 */
export function createCloudPool(databaseUrl: string, options: {ca?: string} = {}): Pool {
  if(!databaseUrl)throw new Error('DATABASE_URL is required for cloud projects.');
  const address=new URL(databaseUrl);
  if(!['postgres:','postgresql:'].includes(address.protocol)) {
    throw new Error('DATABASE_URL must be PostgreSQL.');
  }
  const local=new Set(['localhost','127.0.0.1','[::1]']).has(address.hostname);
  const sslmode=address.searchParams.get('sslmode');
  // pg's URL sslmode can override explicit SSL options. Never allow a remote
  // connection string to silently disable certificate verification.
  if (!local && sslmode && sslmode !== 'verify-full') {
    throw new Error('Remote PostgreSQL requires verified TLS (sslmode=verify-full).');
  }
  address.searchParams.delete('sslmode');
  const ssl=local?undefined:options.ca
    ? {rejectUnauthorized:true,ca:options.ca}
    : {rejectUnauthorized:true};
  return new PgPool({
    connectionString:address.toString(),
    max:10, idleTimeoutMillis:30_000, connectionTimeoutMillis:5_000,
    ssl,
  });
}
