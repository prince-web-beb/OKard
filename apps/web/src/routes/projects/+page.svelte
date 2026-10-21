<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { CARD_TEMPLATES, HAMAD_SHOWCASE } from '@okard/templates';
  import { renderCardSvg } from '@okard/render-engine';
  import { browserAuthConfigured, currentUser } from '$lib/auth';
  import { createCloudProjectClient, RemoteProjectError,
    type RemoteProject, type RemoteProjectListItem } from '$lib/cloud-projects';
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
  let repository = $state.raw<ProjectRepository | null>(null);
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
  let signInReady = $state(false);
  let signedIn = $state(false);
  let cloudBusy = $state(false);
  let cloudError = $state('');
  let cloudNotice = $state('');
  let cloudItems = $state<RemoteProjectListItem[]>([]);
  let cloudTotal = $state(0);
  let cloudConflict = $state<{project:LocalProject;remote:RemoteProject}|null>(null);

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
    signInReady = browserAuthConfigured();
    if(signInReady) {
      void currentUser().then((user)=>{signedIn=Boolean(user);})
        .catch(()=>{signedIn=false;});
    }
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

  const cloud = () => createCloudProjectClient();
  async function loadCloudProjects(reset = false) {
    if (!signedIn || cloudBusy) return;
    cloudBusy = true;cloudError = '';cloudNotice = '';
    try {
      const offset = reset ? 0 : cloudItems.length;
      const data = await cloud().list(20, offset);
      cloudItems = reset ? data.items : [...cloudItems, ...data.items];
      cloudTotal = data.total;
      if (reset && data.total === 0) cloudNotice = 'No cloud projects yet. Choose a device design to back up.';
    } catch (cause) {
      cloudError = friendlyError(cause);
    } finally { cloudBusy = false; }
  }
  async function backUpProject(project:LocalProject) {
    if (!signedIn || cloudBusy || !repository) return;
    cloudBusy = true;cloudError = '';cloudNotice = '';cloudConflict = null;
    try {
      // Fetch the complete current version rather than trusting an old page list.
      let existing:RemoteProject|null = null;
      try {existing = await cloud().get(project.id);}
      catch (cause) {
        if (!(cause instanceof RemoteProjectError && cause.status === 404)) throw cause;
      }
      if (existing) {
        if (JSON.stringify(existing.design) !== JSON.stringify(project.design) ||
            existing.name !== project.name) {
          cloudConflict = {project, remote:existing};
          cloudNotice = 'A cloud copy already exists. Review the conflict below; no changes were uploaded.';
        } else {
          cloudNotice = 'This project already matches its cloud backup.';
        }
      } else {
        await cloud().create(project);
        cloudNotice = 'Design backed up securely. Personal portrait images were not uploaded.';
        // The server may not yet be enabled; a true success appears only after 201.
      }
    } catch (cause) {cloudError = friendlyError(cause);}
    finally {cloudBusy = false;}
  }
  async function overwriteCloudCopy() {
    const conflict = cloudConflict;
    if (!conflict || !signedIn || cloudBusy) return;
    cloudBusy = true;cloudError = '';cloudNotice = '';
    try {
      let saved = await cloud().save(
        conflict.project.id,conflict.remote.version,conflict.project.design);
      if (saved.name !== conflict.project.name) {
        saved = await cloud().rename(saved.id,saved.version,conflict.project.name);
      }
      cloudNotice = 'Cloud copy updated after your explicit confirmation.';
      cloudConflict = null;
    } catch (cause) {
      cloudError = friendlyError(cause) +
        ' The cloud copy was not automatically replaced; refresh it before retrying.';
    } finally { cloudBusy = false; }
  }
  async function downloadCloudProject(item:RemoteProjectListItem) {
    if (!repository || !signedIn || cloudBusy) return;
    cloudBusy = true;cloudError = '';cloudNotice = '';
    try {
      const remote = await cloud().get(item.id);
      const existing = await repository.get(remote.id);
      // If the same UUID exists locally, always create another local copy.
      // Never silently overwrite unsaved local designs.
      const seed = createLocalProject(remote.sourceTemplate, remote.name,
        existing ? {} : {id:remote.id});
      const copy = {...seed, design:remote.design};
      await repository.create(copy);
      await refresh();
      cloudNotice = existing
        ? 'Saved as a new device copy so your existing design was not overwritten.'
        : 'Cloud design downloaded into this device library.';
    } catch (cause) {cloudError = friendlyError(cause);}
    finally {cloudBusy = false;}
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
      <a href="/account">Account</a>
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
                  {#if signedIn}
                    <button class="projects-cloud-backup" type="button" disabled={cloudBusy}
                      onclick={() => void backUpProject(project)}>
                      ↑ Back up this design to cloud
                    </button>
                  {/if}
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
    <section class="projects-cloud-section" aria-labelledby="cloud-area-heading">
      <div class="projects-cloud-section-heading">
        <div>
          <span class="eyebrow">YOUR CLOUD WORKSPACE / OPT-IN</span>
          <h2 id="cloud-area-heading">Made to travel <em>with you.</em></h2>
          <p>Cloud copies are never created automatically. Only the text and artwork layers of a design are synchronized after your permission; uploaded portraits remain local until a separate secure asset service exists.</p>
        </div>
        <a href="/account" class="projects-cloud-account">Account & sign-in ↗</a>
      </div>
      {#if !signInReady}
        <div class="projects-cloud-empty">
          <h3>Cloud sync is not configured.</h3>
          <p>You can use every local editing and export feature without an account. Cloud connectivity requires an identity provider and secured database provisioned by OKard.</p>
        </div>
      {:else if !signedIn}
        <div class="projects-cloud-empty">
          <h3>Sign in to view your cloud projects.</h3>
          <p>Your existing device projects will remain private and will not upload when you sign in.</p>
          <a href="/account">Go to secure sign-in ↗</a>
        </div>
      {:else}
        <div class="projects-cloud-toolbar">
          <p>Signed-in cloud workspace · manual backup and restore</p>
          <button type="button" disabled={cloudBusy} onclick={() => void loadCloudProjects(true)}>
            {cloudBusy ? 'Connecting…' : '↻ Refresh cloud projects'}
          </button>
        </div>
        {#if cloudError}
          <p class="projects-feedback projects-error" role="alert">{cloudError}</p>
        {/if}
        {#if cloudNotice}
          <p class="projects-feedback projects-success" role="status">{cloudNotice}</p>
        {/if}
        {#if cloudConflict}
          <div class="projects-cloud-conflict" role="group" aria-label="Resolve conflicting cloud project">
            <h3>Two different versions of “{cloudConflict.project.name}”</h3>
            <p>OKard found a different version already saved to the cloud. Your device design is unchanged. Overwriting the cloud copy is permanent, and the server will refuse if its revision has changed since this comparison.</p>
            <div>
              <button type="button" disabled={cloudBusy} onclick={() => void overwriteCloudCopy()}>
                I understand · Replace cloud version
              </button>
              <button type="button" onclick={() => (cloudConflict = null)}>
                Keep both as they are
              </button>
            </div>
          </div>
        {/if}
        <div class="projects-cloud-list">
          <div class="projects-cloud-list-head">
            <span>{cloudItems.length} loaded · {cloudTotal} in cloud</span>
            <span>Private to your signed-in account</span>
          </div>
          {#each cloudItems as item (item.id)}
            <article class="projects-cloud-item">
              <div>
                <strong>{item.name}</strong>
                <span>Updated {new Date(item.updatedAt).toLocaleDateString()} · Revision {item.version}</span>
              </div>
              <button type="button" disabled={cloudBusy}
                onclick={() => void downloadCloudProject(item)}>
                ↓ Save to this device
              </button>
            </article>
          {/each}
          {#if cloudItems.length > 0 && cloudItems.length < cloudTotal}
            <button type="button" class="projects-load-more" disabled={cloudBusy}
              onclick={() => void loadCloudProjects()}>Load more cloud projects ↓</button>
          {/if}
        </div>
      {/if}
    </section>
  </main>
</div>
