<script lang="ts">
  import { CARD_FAMILIES, type CardFamilyId, type CardSide } from '@okard/shared';
  import { CARD_TEMPLATES, HAMAD_SHOWCASE, listTemplates,
    createTemplateDocument, type TemplateManifest } from '@okard/templates';
  import { createHamadCardDocument, type CardDocument } from '@okard/design-schema';
  import { renderCardSvg } from '@okard/render-engine';

  const categoryFilters = [
    { id: 'all' as const, title: 'All designs' },
    ...CARD_FAMILIES.map((f) => ({ id: f.id, title: f.title })),
  ];
  let query = $state('');
  let family = $state<CardFamilyId | 'all'>('all');
  let previews = $state<Record<string, CardSide>>({});
  const filtered = $derived(listTemplates({ family, search: query }));
  const count = $derived(filtered.length);

  // The renderer receives only generated, validated scene documents — no user markup.
  const renderPreview = (template: TemplateManifest): string =>
    renderCardSvg(createTemplateDocument(template.id),
      previews[template.id] ?? 'front');
  function toggleSide(id: string) {
    previews[id] = previews[id] === 'back' ? 'front' : 'back';
  }
</script>

<svelte:head>
  <title>Card Template Gallery — OKard Creator</title>
  <meta name="description"
    content="Explore eighteen original, editable front-and-back private-brand card families, crafted for mobile and desktop." />
</svelte:head>

<div class="catalog-shell">
  <header class="lab-header">
    <a class="brand" href="/" aria-label="OKard Creator home">
      <span class="brand-glyph">O<span class="brand-glyph-notch"></span></span>
      <span>Kard<span class="brand-caps"> CREATOR</span></span>
    </a>
    <nav class="catalog-header-links" aria-label="Design navigation">
      <a href="/countries">Worldwide</a>
      <a href="/lab">Design studio</a>
      <a href="/projects">My Projects</a>
      <a href="/account">Account</a>
    </nav>
    <a class="lab-back" href="/">← Home</a>
  </header>
  <main class="catalog-main">
    <section class="catalog-hero">
      <span class="eyebrow"><span class="eyebrow-dot"></span> THE OKARD DESIGN ATELIER</span>
      <h1>Every story deserves<br /><em>its own design.</em></h1>
      <p>Start with an original, fully editable card design. Select any concept, study its real front and back, then customize the same vector layers in OKard Studio. Every card here is a design preview, not a live credential.</p>
      <div class="catalog-metrics"><span><strong>18</strong> card families</span><span><strong>2</strong> editable sides</span><span><strong>1</strong> shared studio</span></div>
    </section>

    <section class="catalog-collection" aria-labelledby="template-collection-title">
      <div class="catalog-heading">
        <div><span class="eyebrow">THE COLLECTION</span><h2 id="template-collection-title">Find your expression.</h2></div>
        <span class="catalog-results" role="status">{count} template{count === 1 ? '' : 's'}</span>
      </div>
      <div class="catalog-filters">
        <label class="catalog-search-label" for="templateSearch">Find a template
          <input id="templateSearch" type="search" placeholder="Portrait, loyalty, event, artist…"
            autocomplete="off" bind:value={query} />
        </label>
        <label class="catalog-select-label" for="templateFamily">Card category
          <select id="templateFamily" bind:value={family}>
            {#each categoryFilters as choice (choice.id)}
              <option value={choice.id}>{choice.title}</option>
            {/each}
          </select>
        </label>
      </div>
      <div class="catalog-family-pills" role="group" aria-label="Quick template category filters">
        {#each categoryFilters.slice(0, 9) as choice (choice.id)}
          <button class:active={family === choice.id} type="button"
            aria-pressed={family === choice.id} onclick={() => (family = choice.id)}>{choice.title}</button>
        {/each}
      </div>
      <div class="catalog-grid">
        {#each filtered as template (template.id)}
          <article class="catalog-card">
            <div class="catalog-card-preview">
              <div class="catalog-card-preview-inner">
                {@html renderPreview(template)}
              </div>
              <span class="catalog-card-status">DESIGN STUDY</span>
            </div>
            <div class="catalog-card-controls">
              <span>{previews[template.id] === 'back' ? 'BACK' : 'FRONT'} / TWO-SIDED</span>
              <button type="button" onclick={() => toggleSide(template.id)}
                aria-label={`View ${previews[template.id] === 'back' ? 'front' : 'back'} of ${template.name}`}>
                ↻ Flip card
              </button>
            </div>
            <div class="catalog-card-details">
              <span class="catalog-tag">{template.category} · {template.family}</span>
              <h3>{template.name}</h3>
              <p>{template.descriptor}</p>
              {#if template.issuerRequired}<span class="catalog-issuer-note">Authorized issuer required for use</span>{:else}<span class="catalog-issuer-note">Personal design · non-credential</span>{/if}
              <a class="catalog-edit" href={`/lab?template=${template.id}`}>
                Customize design <span aria-hidden="true">↗</span>
              </a>
            </div>
          </article>
        {:else}
          <div class="catalog-empty">
            <h3>No matching templates</h3>
            <p>Try another search or explore all card families.</p>
            <button type="button" onclick={() => { query = ''; family = 'all'; }}>Show all designs</button>
          </div>
        {/each}
      </div>
    </section>

    <section class="catalog-showcase" aria-labelledby="signature-collection-title">
      <div class="catalog-showcase-heading">
        <span class="eyebrow">THE ORIGINAL INSPIRATION</span>
        <h2 id="signature-collection-title">HAMAD <em>Signature Editions.</em></h2>
        <p>Three dedicated original private-brand concepts, each retaining its own editable front and back. They remain separate from the general-purpose family templates.</p>
      </div>
      <div class="catalog-showcase-grid">
        {#each HAMAD_SHOWCASE as show (show.id)}
          {@const card = createHamadCardDocument(show.edition)}
          <article class="catalog-showcase-card">
            <div>{@html renderCardSvg(card, previews[show.id] ?? 'front')}</div>
            <h3>{show.name}</h3>
            <div class="catalog-showcase-actions">
              <button type="button" onclick={() => toggleSide(show.id)}>↻ Flip</button>
              <a href={`/lab?template=${show.id}`}>Edit this edition ↗</a>
            </div>
          </article>
        {/each}
      </div>
    </section>
    <section class="catalog-disclaimer">
      <strong>Original designs, honest representation.</strong>
      <p>These are customizable graphic concepts. They do not grant identity, immigration, employment, educational, event-entry, payment or access rights. Issuer-controlled programs require real authorization and separate working verification before any card can be issued.</p>
    </section>
  </main>
</div>
