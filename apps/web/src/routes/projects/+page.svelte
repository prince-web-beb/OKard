<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { CARD_TEMPLATES, HAMAD_SHOWCASE } from '@okard/templates';
  import { renderCardSvg } from '@okard/render-engine';
  import {
    createBrowserProjectRepository, createLocalProject,
    type ProjectRepository, type LocalProject,
  } from '@okard/project-library';

  const options = [
    ...CARD_TEMPLATES.map((t) => ({ id:t.id, label:t.name, family:t.family })),
    ...HAMAD_SHOWCASE.map((t) => ({
      id:t.id, label:t.name, family:'private-brand',
    })),
  ];
  let repository: ProjectRepository | null = null;
  let loaded = $state(false);
  let busy = $state(false);
  let error = $state('');
  let status = $state('');
  let projects = $state<LocalProject[]>([]);
  let totalCount = $state(0);
  let matchedCount = $state(0);
  let loadSequence = 0;
  let selectedTemplate = $state('studio-identity');
  let projectName = $state('');
  let search = $state('');
  let visibleLimit = $state(12);
  let editingId = $state<string | null>(null);
  let editingName = $state('');
  let deletingId = $state<string | null>(null);
  let previewBack = $state<Record<string, boolean>>({});
  const shown = $derived(projects);

  const friendlyError = (reason: unknown): string =>
    reason instanceof Error ? reason.message : 'Local project storage could not complete the request.';

  async function refresh() {
    if (!repository) return;
    const sequence = ++loadSequence;
    const list = await repository.list();
    const query = search.trim().toLocaleLowerCase();
    const matching = list.filter((item) => !query ||
      item.name.toLocaleLowerCase().includes(query) ||
      item.family.toLocaleLowerCase().includes(query));
    // Only fetch the visible saved scenes; full metadata can be searched efficiently.
    const visible = matching.slice(0, visibleLimit);
    const details = await Promise.all(visible.map((item) => repository!.get(item.id)));
    if (sequence !== loadSequence) return;
    totalCount = list.length;
    matchedCount = matching.length;
    projects = details.filter((item): item is LocalProject => item !== null);
  }
  onMount(() => {
    try {
      repository = createBrowserProjectRepository();
      void refresh().catch((reason) => { error = friendlyError(reason); })
        .finally(() => { loaded = true; });
    } catch (reason) {
      error = friendlyError(reason);
      loaded = true;
    }
  });
  async function createProject() {
    if (!repository || busy) return;
    busy = true; error = ''; status = '';
    try {
      const row = createLocalProject(selectedTemplate, projectName.trim() || undefined);
      await repository.create(row);
      await goto('/lab?project=' + encodeURIComponent(row.id));
    } catch (reason) {
      error = friendlyError(reason);
    } finally { busy = false; }
  }
  async function renameProject(project: LocalProject) {
    if (!repository || busy) return;
    busy = true; error = ''; status = '';
    try {
      await repository.rename(project.id, editingName, project.etag);
      editingId = null;
      await refresh();
      status = 'Project renamed on this device.';
    } catch (reason) { error = friendlyError(reason); }
    finally { busy = false; }
  }
  async function duplicateProject(project: LocalProject) {
    if (!repository || busy) return;
    busy = true; error = ''; status = '';
    try {
      await repository.duplicate(project.id);
      await refresh();
      status = 'A separate copy of this design was created on this device.';
    } catch (reason) { error = friendlyError(reason); }
    finally { busy = false; }
  }
  async function deleteProject(project: LocalProject) {
    if (!repository || busy) return;
    busy = true; error = ''; status = '';
    try {
      await repository.remove(project.id);
      deletingId = null;
      await refresh();
      status = 'Project deleted from this device.';
    } catch (reason) { error = friendlyError(reason); }
    finally { busy = false; }
  }
  async function showMore() {
    if (busy) return;
    busy = true;
    try {
      visibleLimit += 12;
      await refresh();
    } catch (reason) { error = friendlyError(reason); }
    finally { busy = false; }
  }
</script>

<svelte:head>
  <title>My Projects — OKard Creator</title>
  <meta name="description" content="Create and manage private, locally stored card design projects on this device." />
</svelte:head>

<div class="projects-shell">
  <header class="lab-header">
    <a class="brand" href="/" aria-label="OKard Creator home">
      <span class="brand-glyph">O<span class="brand-glyph-notch"></span></span>
      <span>Kard<span class="brand-caps"> CREATOR</span></span>
    </a>
    <nav class="projects-header-nav" aria-label="Projects navigation">
      <a href="/templates">Templates</a>
      <a href="/countries">Worldwide</a>
    </nav>
    <a class="lab-back" href="/">← Home</a>
  </header>
  <main class="projects-main">
    <div class="projects-intro">
      <span class="eyebrow">YOUR CREATIVE SPACE / LOCAL PREVIEW</span>
      <h1>Every idea, <em>kept.</em></h1>
      <p>Create as many as 200 editable design projects on this device. Reopen any of them, make a duplicate, or continue whenever you return to this browser.</p>
      <div class="projects-privacy" role="note">
        <strong>Local storage, not cloud sync.</strong>
        Designs remain in this browser's IndexedDB. Uploaded portraits are never stored in the project library. Clearing site data or changing devices may erase your projects. For backup, export editable JSON from the studio.
      </div>
    </div>

    <div class="projects-layout">
      <section class="projects-create" aria-labelledby="project-create-heading">
        <span class="panel-topline">01 / NEW CREATION</span>
        <h2 id="project-create-heading">Begin something original.</h2>
        <form onsubmit={(e) => { e.preventDefault(); void createProject(); }}>
          <label for="projectType">Card design</label>
          <select id="projectType" bind:value={selectedTemplate}>
            {#each options as option (option.id)}
              <option value={option.id}>{option.label} — {option.family}</option>
            {/each}
          </select>
          <label for="projectName">Project name</label>
          <input id="projectName" type="text" maxlength="90"
            placeholder="e.g. My signature card" autocomplete="off" bind:value={projectName} />
          <button type="submit" disabled={busy || !repository}>
            {busy ? 'Preparing project…' : 'Create & open studio ↗'}
          </button>
        </form>
        <p>New projects start from a real editable, dual-sided scene—not a flattened image.</p>
      </section>

      <section class="projects-library" aria-labelledby="saved-projects-heading">
        <div class="projects-library-heading">
          <div>
            <span class="panel-topline">02 / DEVICE LIBRARY</span>
            <h2 id="saved-projects-heading">Saved creations.</h2>
          </div>
          <span class="projects-count">{matchedCount} found · {totalCount} saved</span>
        </div>
        <label class="projects-search" for="projectFilter">Find a saved project
          <input id="projectFilter" type="search" autocomplete="off"
            placeholder="Search project or card family" value={search}
            oninput={(event) => {
              search = event.currentTarget.value;
              visibleLimit = 12;
              void refresh().catch((reason) => { error = friendlyError(reason); });
            }} />
        </label>
        {#if error}
          <p role="alert" class="projects-feedback projects-error">{error}</p>
        {/if}
        {#if status}
          <p role="status" class="projects-feedback projects-success">{status}</p>
        {/if}
        {#if !loaded}
          <p class="projects-empty">Opening your device library…</p>
        {:else if projects.length === 0}
          <div class="projects-empty">
            <h3>{totalCount === 0 ? 'No projects yet.' : 'No matches found.'}</h3>
            <p>Your first card is one click away. Choose a design on the left, or explore the full gallery.</p>
            <a href="/templates">Browse template gallery ↗</a>
          </div>
        {:else}
          <div class="projects-grid">
            {#each shown as project (project.id)}
              <article class="project-card">
                <div class="project-card-preview">
                  {@html renderCardSvg(project.design, previewBack[project.id] ? 'back' : 'front',
                    { idNamespace: 'project-' + project.id })}
                </div>
                <div class="project-card-toolbar">
                  <span>{previewBack[project.id] ? 'BACK SIDE' : 'FRONT SIDE'}</span>
                  <button type="button"
                    onclick={() => (previewBack[project.id] = !previewBack[project.id])}>
                    ↻ Flip
                  </button>
                </div>
                <div class="project-card-content">
                  <span class="catalog-tag">{project.design.family}</span>
                  <h3>{project.name}</h3>
                  <p>Edited {new Date(project.updatedAt).toLocaleDateString()} · Local draft</p>
                  <a class="catalog-edit" href={`/lab?project=${encodeURIComponent(project.id)}`}>
                    Continue editing <span aria-hidden="true">↗</span>
                  </a>
                  <div class="project-card-options">
                    <button type="button" disabled={busy}
                      onclick={() => { editingId = project.id; editingName = project.name; deletingId = null; }}>
                      Rename
                    </button>
                    <button type="button" disabled={busy} onclick={() => void duplicateProject(project)}>Duplicate</button>
                    <button type="button" disabled={busy}
                      onclick={() => { deletingId = project.id; editingId = null; }}>Delete</button>
                  </div>
                  {#if editingId === project.id}
                    <form class="project-inline-form" onsubmit={(e) => { e.preventDefault(); void renameProject(project); }}>
                      <label for={`rename-${project.id}`}>New project name</label>
                      <input id={`rename-${project.id}`} type="text" maxlength="90"
                        bind:value={editingName} required />
                      <div>
                        <button type="submit" disabled={busy}>Save name</button>
                        <button type="button" onclick={() => (editingId = null)}>Cancel</button>
                      </div>
                    </form>
                  {/if}
                  {#if deletingId === project.id}
                    <div class="project-delete-confirm" role="group" aria-label="Confirm project deletion">
                      <p>Delete “{project.name}” from this browser? This cannot be undone.</p>
                      <div>
                        <button type="button" disabled={busy} onclick={() => void deleteProject(project)}>Delete project</button>
                        <button type="button" onclick={() => (deletingId = null)}>Keep project</button>
                      </div>
                    </div>
                  {/if}
                </div>
              </article>
            {/each}
          </div>
          {#if matchedCount > visibleLimit}
            <button class="projects-load-more" disabled={busy} type="button"
              onclick={() => void showMore()}>Load more projects ↓</button>
          {/if}
        {/if}
      </section>
    </div>
  </main>
</div>
