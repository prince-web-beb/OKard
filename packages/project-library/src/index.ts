import {
  assertCardDocument, type CardDocument,
} from '@okard/design-schema';
import { findCatalogDocument, getTemplate, HAMAD_SHOWCASE } from '@okard/templates';

export type ProjectErrorCode =
  | 'NOT_FOUND' | 'CONFLICT' | 'LIMIT_REACHED' | 'INVALID_PROJECT'
  | 'STORAGE_UNAVAILABLE' | 'STORAGE_ERROR';
export class ProjectLibraryError extends Error {
  constructor(
    public readonly code: ProjectErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ProjectLibraryError';
  }
}
export interface LocalProject {
  readonly version: 1;
  /** UUID for this specific copy, distinct from template ID and scene document ID. */
  readonly id: string;
  readonly name: string;
  /** Built-in catalog ID. Never an issuer authorization or approved credential. */
  readonly sourceTemplate: string;
  readonly design: CardDocument;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Local compare-and-swap counter, incremented on every successful mutation. */
  readonly etag: number;
}
export interface ProjectListItem {
  id: string;
  name: string;
  sourceTemplate: string;
  family: CardDocument['family'];
  updatedAt: string;
  etag: number;
}
export interface ProjectRepository {
  list(): Promise<ProjectListItem[]>;
  get(id: string): Promise<LocalProject | null>;
  create(record: LocalProject): Promise<LocalProject>;
  saveDesign(id: string, design: CardDocument, expectedEtag: number): Promise<LocalProject>;
  rename(id: string, name: string, expectedEtag: number): Promise<LocalProject>;
  duplicate(id: string, newId?: string): Promise<LocalProject>;
  remove(id: string): Promise<void>;
}
export const MAX_PROJECTS = 200;
export const MAX_SCENE_BYTES = 500 * 1024;
export const MAX_PROJECT_NAME_LENGTH = 90;
const UUID_RE = /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
function newId(): string {
  if (!globalThis.crypto?.randomUUID) {
    throw new ProjectLibraryError('STORAGE_UNAVAILABLE', 'Secure project IDs are unavailable.');
  }
  return crypto.randomUUID();
}
function normalizeName(name: string): string {
  const cleaned = name.trim();
  if (!cleaned || cleaned.length > MAX_PROJECT_NAME_LENGTH || /[\u0000-\u001f]/.test(cleaned)) {
    throw new ProjectLibraryError('INVALID_PROJECT', 'Project name must contain 1–90 printable characters.');
  }
  return cleaned;
}
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
function validateDesign(design: unknown): CardDocument {
  try {
    assertCardDocument(design);
  } catch {
    throw new ProjectLibraryError('INVALID_PROJECT', 'Project has invalid card design data.');
  }
  const typed = design as CardDocument;
  const size = new TextEncoder().encode(JSON.stringify(typed)).byteLength;
  if (size > MAX_SCENE_BYTES) {
    throw new ProjectLibraryError('INVALID_PROJECT', 'Project exceeds the 500 KB design document limit.');
  }
  return typed;
}
function templateMatch(sourceTemplate: string, design: CardDocument): boolean {
  const manifest = getTemplate(sourceTemplate);
  if (manifest) return design.id === 'template-' + manifest.id && design.family === manifest.family;
  return HAMAD_SHOWCASE.some((item) => item.id === sourceTemplate &&
    item.id === design.id && design.family === 'private-brand');
}
function validateRecord(raw: LocalProject): LocalProject {
  if (raw?.version !== 1 || !UUID_RE.test(raw.id) ||
      !Number.isSafeInteger(raw.etag) || raw.etag < 0 ||
      typeof raw.createdAt !== 'string' || !Number.isFinite(Date.parse(raw.createdAt)) ||
      typeof raw.updatedAt !== 'string' || !Number.isFinite(Date.parse(raw.updatedAt))) {
    throw new ProjectLibraryError('INVALID_PROJECT', 'Invalid project identity, version or timestamps.');
  }
  normalizeName(raw.name);
  const design = validateDesign(raw.design);
  if (typeof raw.sourceTemplate !== 'string' || !templateMatch(raw.sourceTemplate, design)) {
    throw new ProjectLibraryError('INVALID_PROJECT', 'Project source template and scene are inconsistent.');
  }
  return raw;
}
function localView(record: LocalProject): ProjectListItem {
  return {
    id: record.id, name: record.name, sourceTemplate: record.sourceTemplate,
    family: record.design.family, updatedAt: record.updatedAt, etag: record.etag,
  };
}
function listViews(records: LocalProject[]): ProjectListItem[] {
  return records.map(localView).sort((a,b) =>
    b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
}
function editRecord(
  old: LocalProject, expected: number, change: { name?: string; design?: CardDocument },
): LocalProject {
  validateRecord(old);
  if (!Number.isSafeInteger(expected) || expected !== old.etag) {
    throw new ProjectLibraryError('CONFLICT',
      'This project was changed elsewhere. Reopen it before saving your edits.');
  }
  const design = change.design ? validateDesign(change.design) : old.design;
  const revised: LocalProject = {
    ...old,
    name: change.name === undefined ? old.name : normalizeName(change.name),
    design: clone(design),
    updatedAt: new Date().toISOString(),
    etag: old.etag + 1,
  };
  return validateRecord(revised);
}
function copyRecord(record: LocalProject, id: string): LocalProject {
  validateRecord(record);
  return validateRecord({
    ...clone(record),
    id,
    name: normalizeName((record.name.slice(0, MAX_PROJECT_NAME_LENGTH - 7) + ' (Copy)')),
    etag: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
export function createLocalProject(
  sourceTemplate: string, name?: string, options: { id?: string; now?: string } = {},
): LocalProject {
  const design = findCatalogDocument(sourceTemplate);
  if (!design) throw new ProjectLibraryError('INVALID_PROJECT', 'Choose an available OKard design.');
  const timestamp = options.now ?? new Date().toISOString();
  return validateRecord({
    version: 1,
    id: options.id ?? newId(),
    name: normalizeName(name ?? design.title),
    sourceTemplate,
    design,
    createdAt: timestamp,
    updatedAt: timestamp,
    etag: 0,
  });
}

/**
 * In-memory adapter for tests and browsers with disabled persistent storage.
 * Explicitly nonpersistent; do not misrepresent it as successful device saving.
 */
export function createMemoryProjectRepository(): ProjectRepository {
  const map = new Map<string, LocalProject>();
  return {
    async list() { return listViews([...map.values()]); },
    async get(id) { const item = map.get(id); return item ? clone(validateRecord(item)) : null; },
    async create(record) {
      validateRecord(record);
      if (map.has(record.id)) throw new ProjectLibraryError('CONFLICT', 'Project already exists.');
      if (map.size >= MAX_PROJECTS) throw new ProjectLibraryError('LIMIT_REACHED','Local project limit reached.');
      const next = clone(record); map.set(next.id, next); return clone(next);
    },
    async saveDesign(id, design, expectedEtag) {
      const old = map.get(id);
      if (!old) throw new ProjectLibraryError('NOT_FOUND', 'Project not found.');
      const next = editRecord(old, expectedEtag, { design });
      map.set(id,next); return clone(next);
    },
    async rename(id, name, expectedEtag) {
      const old = map.get(id);
      if (!old) throw new ProjectLibraryError('NOT_FOUND', 'Project not found.');
      const next = editRecord(old, expectedEtag, { name });
      map.set(id,next); return clone(next);
    },
    async duplicate(id, newProjectId = newId()) {
      const old = map.get(id);
      if (!old) throw new ProjectLibraryError('NOT_FOUND', 'Project not found.');
      if (map.has(newProjectId)) throw new ProjectLibraryError('CONFLICT', 'Project already exists.');
      if (map.size >= MAX_PROJECTS) throw new ProjectLibraryError('LIMIT_REACHED','Local project limit reached.');
      const next = copyRecord(old,newProjectId);
      map.set(next.id,next); return clone(next);
    },
    async remove(id) {
      if (!map.delete(id)) throw new ProjectLibraryError('NOT_FOUND', 'Project not found.');
    },
  };
}

const DB_NAME = 'okard-projects';
const DB_VERSION = 1;
const STORE = 'projects';

/**
 * Native IndexedDB v1. No third-party dependencies or external network calls.
 * Every write is atomic inside one IDB transaction (including etag checks).
 */
export function createBrowserProjectRepository(): ProjectRepository {
  if (typeof indexedDB === 'undefined') {
    throw new ProjectLibraryError('STORAGE_UNAVAILABLE', 'Device project storage is not supported.');
  }
  const open = (): Promise<IDBDatabase> => new Promise((resolve,reject) => {
    let request: IDBOpenDBRequest;
    try { request = indexedDB.open(DB_NAME, DB_VERSION); }
    catch { reject(new ProjectLibraryError('STORAGE_UNAVAILABLE',
      'The browser denied access to local projects.')); return; }
    request.onupgradeneeded = () => {
      const db=request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store=db.createObjectStore(STORE,{keyPath:'id'});
        store.createIndex('updatedAt','updatedAt');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new ProjectLibraryError('STORAGE_UNAVAILABLE',
      'Unable to open your browser project library.'));
    request.onblocked = () => reject(new ProjectLibraryError('STORAGE_UNAVAILABLE',
      'Another browser tab is blocking the project database upgrade.'));
  });

  const run = async <T>(
    mode: IDBTransactionMode,
    schedule: (store: IDBObjectStore, result: (value: T) => void,
      fail: (error: ProjectLibraryError) => void) => void,
  ): Promise<T> => {
    const db=await open();
    return new Promise<T>((resolve,reject) => {
      let tx: IDBTransaction;
      try { tx=db.transaction(STORE,mode); }
      catch { db.close(); reject(new ProjectLibraryError('STORAGE_ERROR',
        'The project database could not start a transaction.')); return; }
      let value: T;
      let customError: ProjectLibraryError | null = null;
      const complete = (result: T) => { value=result; };
      const fail = (error: ProjectLibraryError) => {
        customError=error;
        try { tx.abort(); } catch { /* already aborted */ }
      };
      tx.oncomplete=() => { db.close(); resolve(clone(value)); };
      tx.onerror=() => { /* onabort handles error */ };
      tx.onabort=() => {
        db.close();
        reject(customError ?? new ProjectLibraryError('STORAGE_ERROR',
          'The project database could not complete this operation.'));
      };
      try { schedule(tx.objectStore(STORE),complete,fail); }
      catch(error) {
        fail(error instanceof ProjectLibraryError ? error :
          new ProjectLibraryError('STORAGE_ERROR', 'Project storage transaction failed.'));
      }
    });
  };

  const readOne = (store: IDBObjectStore,id: string,
    success: (record: LocalProject | null) => void): void => {
    const request=store.get(id);
    request.onsuccess=() => success(request.result as LocalProject | null ?? null);
  };

  return {
    async list() {
      return run('readonly',(store,done,fail)=>{
        const request=store.getAll();
        request.onsuccess=()=>{
          try {done(listViews((request.result as LocalProject[]).map(validateRecord)));}
          catch {fail(new ProjectLibraryError('STORAGE_ERROR','Saved project data was invalid.'));}
        };
      });
    },
    async get(id) {
      return run('readonly',(store,done,fail)=>{
        readOne(store,id,(value)=>{
          try {done(value ? validateRecord(value) : null);}
          catch {fail(new ProjectLibraryError('STORAGE_ERROR','Saved project data was invalid.'));}
        });
      });
    },
    async create(record) {
      validateRecord(record);
      return run('readwrite',(store,done,fail)=>{
        const count=store.count();
        count.onsuccess=()=>{
          if(count.result>=MAX_PROJECTS){
            fail(new ProjectLibraryError('LIMIT_REACHED','Local project limit reached.'));return;
          }
          const lookup=store.get(record.id);
          lookup.onsuccess=()=>{
            if(lookup.result){
              fail(new ProjectLibraryError('CONFLICT','Project already exists.'));return;
            }
            store.add(clone(record));
            done(record);
          };
        };
      });
    },
    async saveDesign(id,design,expectedEtag) {
      validateDesign(design);
      return run('readwrite',(store,done,fail)=>{
        readOne(store,id,(old)=>{
          if(!old){fail(new ProjectLibraryError('NOT_FOUND','Project not found.'));return;}
          try {
            const next=editRecord(old,expectedEtag,{design});
            store.put(next);done(next);
          } catch(error){fail(error as ProjectLibraryError);}
        });
      });
    },
    async rename(id,name,expectedEtag) {
      normalizeName(name);
      return run('readwrite',(store,done,fail)=>{
        readOne(store,id,(old)=>{
          if(!old){fail(new ProjectLibraryError('NOT_FOUND','Project not found.'));return;}
          try {
            const next=editRecord(old,expectedEtag,{name});
            store.put(next);done(next);
          }catch(error){fail(error as ProjectLibraryError);}
        });
      });
    },
    async duplicate(id,newProjectId = newId()) {
      return run('readwrite',(store,done,fail)=>{
        const count=store.count();
        count.onsuccess=()=>{
          if(count.result>=MAX_PROJECTS){
            fail(new ProjectLibraryError('LIMIT_REACHED','Local project limit reached.'));return;
          }
          readOne(store,id,(old)=>{
            if(!old){fail(new ProjectLibraryError('NOT_FOUND','Project not found.'));return;}
            const existing=store.get(newProjectId);
            existing.onsuccess=()=>{
              if(existing.result){
                fail(new ProjectLibraryError('CONFLICT','Project already exists.'));return;
              }
              try {
                const next=copyRecord(old,newProjectId);
                store.add(next);done(next);
              } catch(error){fail(error as ProjectLibraryError);}
            };
          });
        };
      });
    },
    async remove(id) {
      return run('readwrite',(store,done,fail)=>{
        readOne(store,id,(old)=>{
          if(!old){fail(new ProjectLibraryError('NOT_FOUND','Project not found.'));return;}
          store.delete(id);
          done(undefined);
        });
      });
    },
  };
}
