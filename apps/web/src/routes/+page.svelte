<script lang="ts">
  let revealBack = $state(false);

  const features = [
    { no: '01', title: 'Front and back, together', description: 'Every composition begins with two sides, one visual language and deliberate craftsmanship.' },
    { no: '02', title: 'Portraits with intention', description: 'Give a photograph center stage, then use the same original softly in the inner background.' },
    { no: '03', title: 'Crafted for every screen', description: 'Touch-first controls, clear mobile navigation and precise desktop layouts, from day one.' },
  ];
  const categories = ['Private Brand', 'Membership', 'Events', 'Corporate', 'Loyalty', 'Collectibles'];
</script>

<svelte:head>
  <title>OKard Creator — Design that belongs to you</title>
</svelte:head>

<div class="site-shell">
  <header class="topbar">
    <a class="brand" href="/" aria-label="OKard Creator home">
      <span class="brand-glyph">O<span class="brand-glyph-notch"></span></span><span>Kard<span class="brand-caps"> CREATOR</span></span>
    </a>
    <nav class="desktop-nav" aria-label="Primary navigation">
      <a href="#vision">The vision</a>
      <a href="#families">Card families</a>
      <a href="/countries">Worldwide</a>
      <a href="/templates">Templates</a>
      <a href="/lab">Design lab</a>
    </nav>
    <a class="topbar-cta" href="/templates">Explore templates <span aria-hidden="true">↗</span></a>
  </header>

  <main>
    <section class="hero" id="vision">
      <div class="hero-backlight" aria-hidden="true"></div>
      <div class="hero-copy">
        <span class="eyebrow"><span class="eyebrow-dot"></span> THE NEW STANDARD IN CARD DESIGN</span>
        <h1>Identity, <em>beautifully</em> designed.</h1>
        <p class="hero-lede">A creative studio for the cards that represent your brand, your people, and your story. Original by design. Remarkable in every detail.</p>
        <div class="hero-actions">
          <a class="btn-gold" href="/templates">Explore designs <span aria-hidden="true">↗</span></a>
          <a class="btn-quiet" href="/countries">Explore worldwide references <span aria-hidden="true">↗</span></a>
        </div>
        <div class="hero-footnote"><span class="footnote-line"></span> PREVIEW RELEASE · DEVELOPMENT IN PROGRESS</div>
      </div>
      <div class="hero-art">
        <div class="art-orbit art-orbit-one" aria-hidden="true"></div>
        <div class="art-orbit art-orbit-two" aria-hidden="true"></div>
        <div class="product-card" role="group" aria-label={revealBack ? 'Back of sample OKard card' : 'Front of sample OKard card'}>
          {#if !revealBack}
            <div class="product-card-grain"></div>
            <div class="product-card-top"><span>OKARD <small>ATELIER</small></span><span class="card-year">EST. 2026</span></div>
            <div class="product-card-monogram" aria-hidden="true">O</div>
            <div class="product-card-center"><span>THE SIGNATURE SERIES</span><strong>Make it yours.</strong></div>
            <div class="product-card-bottom"><span>DESIGN STUDY · NOT ISSUED</span><span>01 / 02</span></div>
          {:else}
            <div class="product-card-grain"></div>
            <div class="product-card-top"><span>OKARD <small>ATELIER</small></span><span class="card-year">REVERSE</span></div>
            <div class="product-card-reverse-mark">OK</div>
            <div class="product-card-center"><span>BUILT TO BE ORIGINAL</span><strong>Every detail matters.</strong></div>
            <div class="product-card-bottom"><span>PRIVATE BRAND CONCEPT</span><span>02 / 02</span></div>
          {/if}
        </div>
        <button class="flip-trigger" type="button" onclick={() => (revealBack = !revealBack)}>
          <span aria-hidden="true">↻</span> View {revealBack ? 'front' : 'back'}
        </button>
      </div>
    </section>

    <section class="platform-strip" aria-label="Design principles">
      <span>ORIGINAL IDENTITIES</span><span class="strip-star">✦</span><span>DUAL-SIDED CRAFT</span><span class="strip-star">✦</span><span>ANDROID FIRST</span><span class="strip-star">✦</span><span>GLOBAL IN SPIRIT</span>
    </section>

    <section class="section-wrap feature-section">
      <div class="section-heading"><span class="eyebrow">A DESIGN PHILOSOPHY</span><h2>Not another template.<br /><em>An atelier.</em></h2><p>Beauty and precision should arrive together. These principles guide the production editor as it is built.</p></div>
      <div class="feature-grid">
        {#each features as feature (feature.no)}
          <article class="feature-tile"><span class="feature-count">{feature.no} / 03</span><span class="feature-glow" aria-hidden="true"></span><h3>{feature.title}</h3><p>{feature.description}</p></article>
        {/each}
      </div>
    </section>

    <section class="section-wrap families-section" id="families">
      <div class="section-heading families-heading"><span class="eyebrow">MORE THAN ONE KIND OF CARD</span><h2>One studio.<br /><em>Infinite expressions.</em></h2><p>Different stories deserve different visual languages. These families are in our development roadmap.</p></div>
      <div class="family-grid">
        {#each categories as category, index}
          <div class="family-tile"><span class="family-number">0{index + 1}</span><strong>{category}</strong><span class="family-arrow" aria-hidden="true">✦</span></div>
        {/each}
      </div>
      <div class="families-action"><a class="btn-gold" href="/templates">Browse the card gallery <span aria-hidden="true">↗</span></a></div>
    </section>
  </main>
  <footer class="site-footer"><span class="brand mini"><span class="brand-glyph">O</span>Kard</span><span>PRIVATE BRAND DESIGN STUDIO</span><span>© {new Date().getFullYear()} OKard. Preview build.</span></footer>
</div>
