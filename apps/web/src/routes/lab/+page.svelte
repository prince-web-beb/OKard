<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { CardSide } from '@okard/shared';

  const editions = [
    { id: 'royal', label: 'Royal Signature', base: '#0d1014', end: '#29241c', accent: '#d9b878', ink: '#f6ebd4', hint: '#ada38f' },
    { id: 'future', label: 'Future Identity', base: '#091322', end: '#1c2a40', accent: '#8dd8ef', ink: '#e9f5fb', hint: '#9daebf' },
    { id: 'imperial', label: 'Imperial Edition', base: '#f1eadd', end: '#bcb4a9', accent: '#856335', ink: '#1c2332', hint: '#565968' },
  ] as const;

  type EditionId = (typeof editions)[number]['id'];
  let editionId = $state<EditionId>('royal');
  let side = $state<CardSide>('front');
  let displayName = $state('HAMAD');
  let portraitUrl = $state<string | null>(null);
  let uploadError = $state('');
  let edition = $derived(editions.find((item) => item.id === editionId) ?? editions[0]);

  function handlePhoto(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      uploadError = 'Choose a JPEG, PNG or WebP portrait smaller than 8 MB.';
      return;
    }
    if (portraitUrl) URL.revokeObjectURL(portraitUrl);
    portraitUrl = URL.createObjectURL(file);
    uploadError = '';
  }

  function removePhoto() {
    if (portraitUrl) URL.revokeObjectURL(portraitUrl);
    portraitUrl = null;
  }
  onDestroy(removePhoto);
</script>

<svelte:head>
  <title>Design Lab — OKard Creator</title>
  <meta name="description" content="Explore original code-rendered front-and-back private brand card concepts. Your portrait stays in your browser." />
</svelte:head>

<div class="lab-shell">
  <header class="lab-header">
    <a class="brand" href="/" aria-label="Back to OKard home">
      <span class="brand-glyph">O<span class="brand-glyph-notch"></span></span><span>Kard<span class="brand-caps"> CREATOR</span></span>
    </a>
    <span class="lab-header-status"><span class="eyebrow-dot"></span> DESIGN LAB · LOCAL PREVIEW</span>
    <a class="lab-back" href="/">← Home</a>
  </header>

  <main class="lab-main">
    <div class="lab-heading">
      <span class="eyebrow">CODE-RENDERED CARD STUDY</span>
      <h1>The form of <em>identity.</em></h1>
      <p>Explore three original HAMAD brand directions. All artwork below is rendered from SVG and editable values in the browser. This is a design preview, not an issued credential or the finished production editor.</p>
    </div>

    <div class="studio-layout">
      <section class="preview-zone" aria-label="Live preview">
        <div class="preview-head"><span>LIVE DESIGN STUDY</span><span>85.60 × 53.98 mm · ASPECT RATIO</span></div>
        <div class="svg-preview-wrap">
          <svg class="identity-artboard" viewBox="0 0 856 540" role="img" aria-label={side === 'front' ? 'Front of HAMAD private brand identity card preview' : 'Back of HAMAD private brand identity card preview'} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <clipPath id="roundCard"><rect x="3" y="3" width="850" height="534" rx="33" /></clipPath>
              <clipPath id="portraitClip"><rect x="44" y="159" width="301" height="309" rx="12" /></clipPath>
              <linearGradient id="cardSurface" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color={edition.base} /><stop offset="100%" stop-color={edition.end} /></linearGradient>
              <linearGradient id="metallic" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color={edition.accent} stop-opacity=".35" /><stop offset="43%" stop-color={edition.accent} /><stop offset="74%" stop-color={edition.ink} /><stop offset="100%" stop-color={edition.accent} stop-opacity=".4" /></linearGradient>
              <pattern id="luxuryLines" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(24)"><path d="M2 0 V36 M11 0 V36" stroke={edition.accent} stroke-width=".45" opacity=".15" /></pattern>
            </defs>
            <g clip-path="url(#roundCard)">
              <rect width="856" height="540" fill="url(#cardSurface)" />
              <rect width="856" height="540" fill="url(#luxuryLines)" />
              <path d="M-50 430 C185 225, 430 700, 920 160" stroke={edition.accent} stroke-width="35" fill="none" opacity=".055" />
              <path d="M-50 435 C185 230, 430 705, 920 165" stroke={edition.accent} stroke-width="1.5" fill="none" opacity=".45" />
              <rect x="17" y="17" width="822" height="506" rx="24" fill="none" stroke={edition.accent} stroke-opacity=".6" stroke-width="1.2" />
              {#if side === 'front'}
                <text x="46" y="75" fill={edition.accent} font-size="36" letter-spacing="7" font-family="Georgia, serif">HAMAD</text>
                <text x="47" y="108" fill={edition.ink} font-size="13" letter-spacing="5">IDENTITY CARD</text>
                <path d="M46 127 H810" stroke={edition.accent} opacity=".65" />
                {#if portraitUrl}
                  <image href={portraitUrl} x="355" y="80" width="440" height="440" opacity=".14" preserveAspectRatio="xMidYMid slice" />
                  <g clip-path="url(#portraitClip)"><image href={portraitUrl} x="44" y="159" width="301" height="309" preserveAspectRatio="xMidYMid slice" /></g>
                {:else}
                  <rect x="44" y="159" width="301" height="309" rx="12" fill={edition.accent} opacity=".12" />
                  <circle cx="195" cy="273" r="55" fill="none" stroke={edition.accent} opacity=".48" stroke-width="2" />
                  <path d="M99 416 C107 353, 283 353, 291 416" fill="none" stroke={edition.accent} stroke-width="2" opacity=".48" />
                  <text x="195" y="450" text-anchor="middle" fill={edition.hint} font-size="13" letter-spacing="2">YOUR PHOTO HERE</text>
                {/if}
                <rect x="44" y="159" width="301" height="309" rx="12" fill="none" stroke={edition.accent} stroke-width="2" />
                <path d="M390 179 H794" stroke={edition.accent} opacity=".5" />
                <text x="390" y="222" fill={edition.hint} font-size="14" letter-spacing="3">CARDHOLDER</text>
                <text x="390" y="276" fill={edition.ink} font-size="39" font-family="Georgia, serif" letter-spacing="2" textLength={Math.min(395,Math.max(0,displayName.length * 26))} lengthAdjust="spacingAndGlyphs">{displayName.toUpperCase()}</text>
                <path d="M390 302 H794" stroke={edition.accent} opacity=".42" />
                <text x="390" y="348" fill={edition.hint} font-size="13" letter-spacing="2">EDITION</text>
                <text x="390" y="380" fill={edition.accent} font-size="20" letter-spacing="2">{edition.label.toUpperCase()}</text>
                <text x="390" y="446" fill={edition.ink} opacity=".9" font-size="14" letter-spacing="2">DESIGN STUDY · NOT ISSUED</text>
              {:else}
                {#if portraitUrl}
                  <image href={portraitUrl} x="530" y="-25" width="360" height="570" opacity=".14" preserveAspectRatio="xMidYMid slice" />
                {/if}
                <text x="52" y="94" fill={edition.accent} font-size="24" letter-spacing="6">HAMAD / SIGNATURE</text>
                <path d="M52 116 H804" stroke={edition.accent} opacity=".75" />
                <text x="52" y="251" fill="url(#metallic)" opacity=".84" font-family="Georgia, serif" font-size="143" letter-spacing="-12">H</text>
                <text x="230" y="220" fill={edition.ink} font-size="29" font-family="Georgia, serif" letter-spacing="3">VISION · DISCIPLINE</text>
                <text x="230" y="267" fill={edition.accent} font-size="29" font-family="Georgia, serif" letter-spacing="3">· LEGACY</text>
                <path d="M52 339 H804" stroke={edition.accent} opacity=".45" />
                <text x="52" y="386" fill={edition.ink} font-size="18" letter-spacing="2">A PRIVATE BRAND DESIGN BY HAMAD</text>
                <text x="52" y="423" fill={edition.hint} font-size="15">Not government-issued. Not valid as legal identification.</text>
                <text x="52" y="453" fill={edition.hint} font-size="15">No official issuer or verification service is represented.</text>
              {/if}
              <rect x="0" y="494" width="856" height="46" fill={edition.base} opacity=".94" />
              <path d="M0 494 H856" stroke={edition.accent} opacity=".6" />
              <text x="45" y="522" fill={edition.hint} font-size="12" letter-spacing="2">OKARD CREATOR · PRIVATE BRAND PREVIEW</text>
              <text x="808" y="522" text-anchor="end" fill={edition.accent} font-size="12" letter-spacing="2">{side === 'front' ? '01 / 02' : '02 / 02'}</text>
            </g>
          </svg>
        </div>
        <div class="preview-switch" role="group" aria-label="Card side">
          <button type="button" class:active={side === 'front'} aria-pressed={side === 'front'} onclick={() => (side = 'front')}>Front side</button>
          <button type="button" class:active={side === 'back'} aria-pressed={side === 'back'} onclick={() => (side = 'back')}>Back side</button>
        </div>
        <p class="privacy-note">Your uploaded portrait stays in this browser session. This preview does not save or upload it to a server.</p>
      </section>

      <aside class="studio-panel" aria-label="Customize design study">
        <div class="panel-heading"><span class="panel-topline">01 / YOUR ARTWORK</span><h2>Shape the signature.</h2><p>Test the visual direction before we build the production editor.</p></div>
        <div class="panel-group"><label for="displayName">Display name</label><input id="displayName" type="text" maxlength="22" autocomplete="off" spellcheck="false" bind:value={displayName} placeholder="HAMAD" /></div>
        <div class="panel-group">
          <label for="portrait">Portrait photo</label>
          <input id="portrait" type="file" accept="image/jpeg,image/png,image/webp" onchange={handlePhoto} aria-describedby="portraitHint" />
          <span class="input-hint" id="portraitHint">Local preview only · no face edits · max 8 MB</span>
          {#if uploadError}<p class="field-error" role="alert">{uploadError}</p>{/if}
          {#if portraitUrl}<button class="text-action" type="button" onclick={removePhoto}>Remove uploaded photo</button>{/if}
        </div>
        <fieldset class="edition-list">
          <legend>Choose an edition</legend>
          {#each editions as option (option.id)}
            <button class:chosen={editionId === option.id} type="button" aria-pressed={editionId === option.id} onclick={() => (editionId = option.id)}>
              <span class="edition-color" style:background={option.base} style:border-color={option.accent}></span>
              <span>{option.label}</span>
              <span class="edition-check" aria-hidden="true">{editionId === option.id ? '✓' : '↗'}</span>
            </button>
          {/each}
        </fieldset>
        <div class="panel-disclaimer"><strong>Design stage</strong><p>Save, export, print and card issuance are not available in this prototype. Those functions will only appear once they work end to end.</p></div>
      </aside>
    </div>
  </main>
</div>
