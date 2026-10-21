<script lang="ts">
  import { onDestroy } from 'svelte';
  import { createHamadCardDocument, applyCardCommand, type CardDocument,
    type EditCommand, type HamadEdition } from '@okard/design-schema';
  import { renderCardSvg, preflightCardDocument } from '@okard/render-engine';
  import type { CardSide } from '@okard/shared';

  const editions: { id: HamadEdition; title: string; color: string }[] = [
    { id: 'royal', title: 'Royal Signature', color: '#d7b67b' },
    { id: 'future', title: 'Future Identity', color: '#82cde5' },
    { id: 'imperial', title: 'Imperial Edition', color: '#8a6839' }
  ];
  let edition = $state<HamadEdition>('royal');
  let side = $state<CardSide>('front');
  let card = $state<CardDocument>(createHamadCardDocument('royal'));
  let layerId = $state('display-name');
  let photoFile: File | null = null;
  let photoUrl = $state<string | null>(null);
  let photoName = $state('');
  let uploading = $state(false);
  let notice = $state('');
  let errorText = $state('');
  let undoHistory = $state<CardDocument[]>([]);
  let redoHistory = $state<CardDocument[]>([]);

  const assetUrl = (assetId: string) => assetId === 'portrait' ? photoUrl : null;
  const previewSvg = $derived(renderCardSvg(card, side,
    { resolveAsset: assetUrl, allowBlobPreview: true }));
  const preflight = $derived(preflightCardDocument(card, { resolveAsset: assetUrl }));
  const availableLayers = $derived(card.artboards[side].nodes.filter((node) =>
    !node.id.includes('disclaimer') && node.id !== 'back-notice' &&
    !['surface', 'back-surface', 'inner-frame', 'portrait-placeholder',
      'footer-surface', 'back-footer-surface', 'back-ornament'].includes(node.id)));
  const selectedLayer = $derived(availableLayers.find((node) => node.id === layerId));
  const displayNameLayer = $derived(card.artboards.front.nodes.find((node) =>
    node.id === 'display-name'));
  const displayName = $derived(displayNameLayer?.kind === 'text' ? displayNameLayer.text : '');
  const secondaryLayer = $derived(card.artboards.front.nodes.find((node) =>
    node.id === 'secondary-portrait'));
  const secondaryOpacity = $derived(secondaryLayer?.opacity ?? 0.12);

  function change(command: EditCommand) {
    try {
      const updated = applyCardCommand(card, command);
      undoHistory = [...undoHistory.slice(-39), card];
      redoHistory = [];
      card = updated;
      errorText = '';
      notice = '';
    } catch (error) {
      errorText = error instanceof Error ? error.message : 'This edit could not be applied.';
    }
  }
  function undo() {
    const previous = undoHistory.at(-1);
    if (!previous) return;
    redoHistory = [...redoHistory.slice(-39), card];
    undoHistory = undoHistory.slice(0, -1);
    card = previous;
    notice = 'Edit undone.';
  }
  function redo() {
    const next = redoHistory.at(-1);
    if (!next) return;
    undoHistory = [...undoHistory.slice(-39), card];
    redoHistory = redoHistory.slice(0, -1);
    card = next;
    notice = 'Edit restored.';
  }
  function chooseSide(next: CardSide) {
    side = next;
    layerId = next === 'front' ? 'display-name' : 'back-motto';
  }
  function chooseEdition(next: HamadEdition) {
    if (edition === next) return;
    const carryName = displayName;
    edition = next;
    card = createHamadCardDocument(edition, carryName);
    undoHistory = [];
    redoHistory = [];
    chooseSide('front');
    notice = 'Edition updated. Your portrait remains in this browser.';
    errorText = '';
  }
  function position(axis: 'xMm' | 'yMm', input: string) {
    if (!selectedLayer || input.trim() === '') return;
    const value = Number(input);
    if (!Number.isFinite(value)) return;
    change({ kind: 'move', side, nodeId: selectedLayer.id,
      xMm: axis === 'xMm' ? value : selectedLayer.xMm,
      yMm: axis === 'yMm' ? value : selectedLayer.yMm });
  }
  function replacePhoto(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 8 * 1024 * 1024) {
      errorText = 'Choose a JPEG, PNG or WebP portrait smaller than 8 MB.';
      return;
    }
    const newUrl = URL.createObjectURL(file);
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = newUrl;
    photoFile = file;
    photoName = file.name;
    notice = 'Portrait added to the foreground and faded background, locally.';
    errorText = '';
  }
  function removePhoto() {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = null;
    photoFile = null;
    photoName = '';
    notice = 'Local portrait cleared.';
  }
  onDestroy(() => { if (photoUrl) URL.revokeObjectURL(photoUrl); });

  function downloadBlob(content: string, mediaType: string, name: string) {
    const download = URL.createObjectURL(new Blob([content], { type: mediaType }));
    const anchor = window.document.createElement('a');
    anchor.href = download;
    anchor.download = name;
    window.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(download), 3000);
  }
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not embed the uploaded portrait.'));
      reader.onload = () => {
        if (typeof reader.result === 'string' &&
            /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(reader.result)) {
          resolve(reader.result);
        } else reject(new Error('Uploaded portrait could not be embedded safely.'));
      };
      reader.readAsDataURL(file);
    });
  }
  async function downloadSvg() {
    uploading = true;
    try {
      const embedded = photoFile ? await fileToBase64(photoFile) : null;
      const svg = renderCardSvg(card, side, {
        resolveAsset: (id) => id === 'portrait' ? embedded : null
      });
      downloadBlob(svg, 'image/svg+xml;charset=utf-8',
        'okard-hamad-' + edition + '-' + side + '.svg');
      notice = 'Portable SVG saved. This is design artwork, not a certified print file.';
      errorText = '';
    } catch (error) {
      errorText = error instanceof Error ? error.message : 'SVG export failed.';
    } finally { uploading = false; }
  }
  function downloadScene() {
    // The document contains asset IDs but NEVER embeds the uploaded personal image.
    downloadBlob(JSON.stringify(card, null, 2), 'application/json',
      'okard-' + edition + '-editable-scene.json');
    notice = 'Editable design JSON downloaded. Personal photos are excluded.';
  }
</script>

<svelte:head>
  <title>Design Lab — OKard Creator</title>
  <meta name="description" content="Original, editable, code-rendered front and back card designs with a local private portrait preview." />
</svelte:head>

<div class="lab-shell">
  <header class="lab-header">
    <a class="brand" href="/" aria-label="OKard Creator home">
      <span class="brand-glyph">O<span class="brand-glyph-notch"></span></span>
      <span>Kard<span class="brand-caps"> CREATOR</span></span>
    </a>
    <span class="lab-header-status"><span class="eyebrow-dot"></span> DESIGN LAB · CODE-RENDERED</span>
    <a class="lab-back" href="/">← Home</a>
  </header>
  <main class="lab-main">
    <div class="lab-heading">
      <span class="eyebrow">ORIGINAL DESIGN · REAL VECTOR LAYERS</span>
      <h1>The art of <em>identity.</em></h1>
      <p>Explore original HAMAD private-brand design directions. These are genuine editable front-and-back scene documents, not generated images. The full production editor is still being built.</p>
    </div>
    <div class="studio-layout">
      <section class="preview-zone" aria-label="Live card artboard">
        <div class="preview-head">
          <span>LIVE VECTOR STUDY</span>
          <span>85.60 × 53.98 MM · {side.toUpperCase()} · REV {card.revision}</span>
        </div>
        <div class="svg-preview-wrap">
          <div class="artwork-stage" aria-label={side === 'front' ? 'Card front' : 'Card back'}>
            {@html previewSvg}
          </div>
        </div>
        <div class="preview-switch" role="group" aria-label="Card side">
          <button type="button" class:active={side === 'front'} aria-pressed={side === 'front'}
            onclick={() => chooseSide('front')}>Front</button>
          <button type="button" class:active={side === 'back'} aria-pressed={side === 'back'}
            onclick={() => chooseSide('back')}>Back</button>
        </div>
        <div class="lab-actions" role="group" aria-label="Edit and export controls">
          <button type="button" onclick={undo} disabled={undoHistory.length === 0}>↶ Undo</button>
          <button type="button" onclick={redo} disabled={redoHistory.length === 0}>↷ Redo</button>
          <button class="lab-download" type="button" disabled={uploading}
            onclick={downloadSvg}>{uploading ? 'Preparing…' : '↓ Export ' + side + ' SVG'}</button>
          <button type="button" onclick={downloadScene}>↓ Scene JSON</button>
        </div>
        {#if preflight.length > 0}
          <details class="lab-preflight">
            <summary>{preflight.length} artwork notice{preflight.length === 1 ? '' : 's'} · Review before print</summary>
            <ul>{#each preflight.slice(0, 12) as warning, index (index)}
              <li>{warning.side}: {warning.message}</li>
            {/each}</ul>
          </details>
        {/if}
        <p class="privacy-note">No photo uploads or server saves. Your images stay in this browser session. SVG and design JSON export are available, but issuer verification, billing and professional print certification are not.</p>
      </section>
      <aside class="studio-panel" aria-label="Card editor controls">
        <div class="panel-heading">
          <span class="panel-topline">01 / YOUR ARTWORK</span>
          <h2>Shape the signature.</h2>
          <p>Adjust original layers; changes can be undone or redone. Mobile controls are full-width and touch-friendly.</p>
        </div>
        <div class="panel-group">
          <label for="displayName">Display name</label>
          <input id="displayName" type="text" maxlength="40" spellcheck="false" autocomplete="off"
            value={displayName} oninput={(e) => change({kind: 'replace-text', side: 'front',
              nodeId: 'display-name', text: e.currentTarget.value.toUpperCase()})} />
        </div>
        <div class="panel-group">
          <label for="portrait">Portrait</label>
          <input id="portrait" type="file" accept="image/jpeg,image/png,image/webp"
            onchange={replacePhoto} aria-describedby="portraitHint" />
          <span class="input-hint" id="portraitHint">JPEG, PNG or WebP · max 8 MB · browser-only</span>
          {#if photoUrl}
            <span class="input-hint">Selected: {photoName}</span>
            <button type="button" class="text-action" onclick={removePhoto}>Remove portrait</button>
          {/if}
        </div>
        <div class="panel-group">
          <label for="backgroundOpacity">Faded background portrait · {Math.round(secondaryOpacity * 100)}%</label>
          <input id="backgroundOpacity" type="range" min="0.03" max="0.40" step="0.01"
            value={secondaryOpacity} oninput={(e) => change({kind:'set-opacity', side:'front',
              nodeId:'secondary-portrait', opacity:Number(e.currentTarget.value)})} />
        </div>
        <fieldset class="edition-list">
          <legend>Choose an edition</legend>
          {#each editions as item (item.id)}
            <button class:chosen={edition === item.id} type="button"
              aria-pressed={edition === item.id} onclick={() => chooseEdition(item.id)}>
              <span class="edition-color" style:background={item.color}></span>
              <span>{item.title}</span>
              <span class="edition-check" aria-hidden="true">{edition === item.id ? '✓' : '↗'}</span>
            </button>
          {/each}
        </fieldset>
        <div class="layer-inspector">
          <span class="panel-topline">02 / PRECISE LAYER EDITING</span>
          <label for="layerSelect">Element on the {side}</label>
          <select id="layerSelect" value={layerId}
            onchange={(e) => (layerId = e.currentTarget.value)}>
            {#each availableLayers as node (node.id)}
              <option value={node.id}>{node.id.replaceAll('-', ' ')} ({node.kind})</option>
            {/each}
          </select>
          {#if selectedLayer}
            <div class="coordinate-editor">
              <div><label for="positionX">Horizontal · mm</label>
                <input id="positionX" type="number" step="0.1" min="-100" max="1000"
                  value={selectedLayer.xMm} onchange={(e) => position('xMm', e.currentTarget.value)} />
              </div>
              <div><label for="positionY">Vertical · mm</label>
                <input id="positionY" type="number" step="0.1" min="-100" max="1000"
                  value={selectedLayer.yMm} onchange={(e) => position('yMm', e.currentTarget.value)} />
              </div>
            </div>
            {#if selectedLayer.kind === 'text'}
              <label for="selectedText">Text content</label>
              <input id="selectedText" type="text" maxlength="2000"
                value={selectedLayer.text} oninput={(e) => change({kind:'replace-text',
                  side, nodeId:selectedLayer.id, text:e.currentTarget.value})} />
            {/if}
          {/if}
        </div>
        {#if errorText}<p role="alert" class="field-error lab-feedback">{errorText}</p>{/if}
        {#if notice}<p role="status" class="lab-notice lab-feedback">{notice}</p>{/if}
        <div class="panel-disclaimer"><strong>Original private-brand artwork</strong>
          <p>Not a government ID, payment instrument or proof of legal status. Project persistence and fully validated print/export workflows are separate development tracks.</p>
        </div>
      </aside>
    </div>
  </main>
</div>
