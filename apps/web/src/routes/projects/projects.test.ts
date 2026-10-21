import { describe, expect, it } from 'vitest';
import { applyCardCommand } from '@okard/design-schema';
import { renderCardSvg } from '@okard/render-engine';
import {
  createLocalProject, createMemoryProjectRepository,
  ProjectLibraryError,
} from '@okard/project-library';
import { CARD_TEMPLATES, HAMAD_SHOWCASE } from '@okard/templates';

describe('OKard My Projects ↔ Studio contract', () => {
  it('all catalog designs can become separate locally saved project records', async () => {
    const repository = createMemoryProjectRepository();
    const options = [...CARD_TEMPLATES.map((item) => item.id),
      ...HAMAD_SHOWCASE.map((item) => item.id)];
    for (let i = 0; i < options.length; i++) {
      const template = options[i]!;
      const id = `f49ab67b-99e4-41fb-9811-${String(i).padStart(12,'0')}`;
      const record = createLocalProject(template, undefined, {id});
      const saved = await repository.create(record);
      expect(saved.design.artboards.front.nodes.length).toBeGreaterThan(0);
      expect(saved.design.artboards.back.nodes.length).toBeGreaterThan(0);
      expect(saved.design.state).toBe('design');
    }
    expect((await repository.list()).length).toBe(options.length);
    expect(options).toHaveLength(21);
  });
  it('studio roundtrip survives separate tab edits only with correct local etag', async () => {
    const library=createMemoryProjectRepository();
    const record=await library.create(createLocalProject('studio-identity','Brand', {
      id:'f49ab67b-99e4-41fb-9811-7735c4ae9001',
    }));
    const scene=applyCardCommand(record.design,{
      kind:'replace-text',side:'front',nodeId:'display-name',text:'OKARD PROJECT',
    });
    const saved=await library.saveDesign(record.id,scene,record.etag);
    expect(saved.etag).toBe(1);
    const reopened=await library.get(record.id);
    expect(reopened?.design.artboards.front.nodes.find(n=>n.id==='display-name'))
      .toMatchObject({text:'OKARD PROJECT'});
    await expect(library.saveDesign(record.id,scene,record.etag))
      .rejects.toMatchObject({code:'CONFLICT'});
  });
  it('duplicated projects have distinct SVG clipping namespaces and independent edits', async () => {
    const lib=createMemoryProjectRepository();
    const seed=await lib.create(createLocalProject('family-portrait','Family',{
      id:'f49ab67b-99e4-41fb-9811-7735c4ae9002',
    }));
    const copied=await lib.duplicate(seed.id,'f49ab67b-99e4-41fb-9811-7735c4ae9003');
    const a=renderCardSvg(seed.design,'front',{idNamespace:'project-'+seed.id});
    const b=renderCardSvg(copied.design,'front',{idNamespace:'project-'+copied.id});
    expect(a).not.toBe(b);
    expect(a).toContain('okard-artboard-project-'+seed.id+'-front');
    expect(b).toContain('okard-artboard-project-'+copied.id+'-front');
    expect(a).not.toContain('data-okard-layer=');
  });
  it('unsafe/unsupported data cannot be saved as another family', async()=>{
    const lib=createMemoryProjectRepository();
    const record=await lib.create(createLocalProject('company-staff','Team',{
      id:'f49ab67b-99e4-41fb-9811-7735c4ae9004',
    }));
    await expect(lib.saveDesign(record.id,
      {...record.design, family:'corporate'},record.etag)).rejects.toMatchObject({
        code:'INVALID_PROJECT',
      });
    expect((await lib.get(record.id))?.design.family).toBe('staff');
  });
});
