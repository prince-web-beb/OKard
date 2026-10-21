<script lang="ts">
  import {
    getCountryReference, listCountryReferences, createLocalePreview,
    ISO_COUNTRY_COUNT, type CountryReference,
  } from '@okard/country-data';

  const localeChoices = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'ar', name: 'العربية' },
    { code: 'es', name: 'Español' },
    { code: 'pt', name: 'Português' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ja', name: '日本語' },
    { code: 'hi', name: 'हिन्दी' },
  ] as const;

  let search = $state('');
  let language = $state<string>('en');
  let selectedCode = $state<string>('AE');
  let references = $derived(listCountryReferences(language, { search }));
  let selected = $derived<CountryReference | null>(getCountryReference(selectedCode, language));
  let preview = $derived(createLocalePreview(language));

  const featured = ['AE', 'BE', 'NG', 'FR', 'US', 'IN', 'JP', 'ZA'];
</script>

<svelte:head>
  <title>Worldwide Country References — OKard Creator</title>
  <meta name="description" content="Explore 249 ISO country and territory references, local language names, typographic direction and date previews for original private-brand card designs." />
</svelte:head>

<div class="global-shell">
  <header class="lab-header">
    <a class="brand" href="/" aria-label="OKard home">
      <span class="brand-glyph">O<span class="brand-glyph-notch"></span></span>
      <span>Kard<span class="brand-caps"> CREATOR</span></span>
    </a>
    <span class="lab-header-status"><span class="eyebrow-dot"></span> WORLDWIDE REFERENCE ATLAS</span>
    <a class="lab-back" href="/">← Home</a>
  </header>

  <main class="global-main">
    <div class="global-intro">
      <span class="eyebrow">DESIGN WITHOUT BORDERS</span>
      <h1>One studio. <em>Everywhere.</em></h1>
      <p>Explore {ISO_COUNTRY_COUNT} ISO country and territory references for typography, names and localized presentation. OKard uses these references to help people design original private cards—not to reproduce government documents or certify nationality.</p>
      <div class="global-highlights" aria-label="Reference coverage">
        <div><strong>{ISO_COUNTRY_COUNT}</strong><span>ISO REFERENCES</span></div>
        <div><strong>8</strong><span>LOCALE PREVIEWS</span></div>
        <div><strong>2</strong><span>TEXT DIRECTIONS</span></div>
      </div>
    </div>

    <div class="global-workspace">
      <section class="global-library" aria-labelledby="global-list-heading">
        <div class="global-library-heading">
          <div><span class="eyebrow">COUNTRY & TERRITORY INDEX</span>
            <h2 id="global-list-heading">Find a reference.</h2></div>
          <span class="global-count" role="status">{references.length} found</span>
        </div>
        <div class="global-filters">
          <div>
            <label for="referenceSearch">Search by country name or ISO code</label>
            <input id="referenceSearch" type="search" placeholder="Search Nigeria, Belgique, AE…"
              autocomplete="off" bind:value={search} />
          </div>
          <div>
            <label for="countryDisplayLocale">Display language</label>
            <select id="countryDisplayLocale" bind:value={language}>
              {#each localeChoices as locale (locale.code)}
                <option value={locale.code}>{locale.name}</option>
              {/each}
            </select>
          </div>
        </div>
        <div class="global-reference-grid">
          {#each references as country (country.code)}
            <button type="button" class:active={country.code === selectedCode}
              aria-pressed={country.code === selectedCode}
              onclick={() => (selectedCode = country.code)}>
              <span class="global-flag" aria-hidden="true">{country.flagEmoji}</span>
              <span class="global-name"><strong>{country.name}</strong>
                <small>{country.englishName !== country.name ? country.englishName : 'ISO 3166-1 reference'}</small></span>
              <span class="global-code">{country.code}</span>
            </button>
          {:else}
            <div class="global-no-results">
              No matching countries found. Try a different name or ISO code.
              <button type="button" onclick={() => (search = '')}>Clear search</button>
            </div>
          {/each}
        </div>
      </section>

      <aside class="global-preview" aria-labelledby="global-preview-heading">
        <div class="global-preview-top">
          <span class="eyebrow">REFERENCE PREVIEW</span>
          <span class="global-preview-code">{selected?.code}</span>
        </div>
        {#if selected}
          <div class="global-preview-flag" aria-hidden="true">{selected.flagEmoji}</div>
          <h2 id="global-preview-heading">{selected.name}</h2>
          <p class="global-preview-english">{selected.englishName}</p>
          <div class="global-preview-line"></div>
          <div class="global-preview-metric"><span>LANGUAGE</span><strong>{language.toUpperCase()}</strong></div>
          <div class="global-preview-metric"><span>READING DIRECTION</span><strong>{preview.direction.toUpperCase()}</strong></div>
          <div class="global-preview-metric"><span>EXAMPLE DATE</span><strong dir={preview.direction}>{preview.sampleDate}</strong></div>
          <div class="global-preview-metric"><span>EXAMPLE NUMBER</span><strong dir={preview.direction}>{preview.sampleNumber}</strong></div>
          <p class="global-preview-note">Reference metadata only. This does not establish nationality, residency, legal identification or issuer authorization.</p>
          <a class="btn-gold global-create" href={`/lab?country=${selected.code}&locale=${language}`}>
            Continue to card design <span aria-hidden="true">↗</span>
          </a>
        {/if}
        <div class="global-featured">
          <span>COMMON REFERENCES</span>
          <div>
            {#each featured as code}
              {@const item = getCountryReference(code, language)}
              {#if item}
                <button type="button" onclick={() => (selectedCode = code)}
                  aria-label={`Choose ${item.englishName}`}>{item.flagEmoji}</button>
              {/if}
            {/each}
          </div>
        </div>
      </aside>
    </div>
  </main>
</div>
