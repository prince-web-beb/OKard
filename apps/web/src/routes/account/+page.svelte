<script lang="ts">
  import { onMount } from 'svelte';
  import { browserAuthConfigured, getBrowserAuthManager, currentUser } from '$lib/auth';

  let configured = $state(false);
  let loading = $state(true);
  let userName = $state('');
  let authenticated = $state(false);
  let pending = $state(false);
  let notice = $state('');
  let error = $state('');

  onMount(() => {
    configured = browserAuthConfigured();
    if(!configured){loading = false;return;}
    void currentUser().then((user)=>{
      authenticated = Boolean(user);
      userName = typeof user?.profile?.name === 'string'
        ? user.profile.name : 'OKard creator';
    }).catch(()=>{error = 'Could not load your sign-in session.';})
      .finally(()=>{loading = false;});
  });
  async function signIn() {
    pending = true;error = '';notice = '';
    try {await getBrowserAuthManager().signinRedirect();}
    catch (cause) {
      error = cause instanceof Error ? cause.message : 'Sign-in could not be started.';
      pending = false;
    }
  }
  async function signOut() {
    pending = true;error = '';notice = '';
    try {
      await getBrowserAuthManager().signoutRedirect();
    } catch {
      // When an identity provider does not support RP-initiated logout, remove
      // the browser session locally; no success claim about provider logout.
      await getBrowserAuthManager().removeUser();
      authenticated = false;userName = '';pending = false;
      notice = 'OKard local browser session ended. Your identity-provider session may remain active.';
    }
  }
</script>

<svelte:head>
  <title>Account & Secure Sign-in — OKard Creator</title>
  <meta name="description" content="Manage your OKard account session using authorized sign-in." />
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="account-shell">
  <header class="lab-header">
    <a class="brand" href="/" aria-label="OKard home">
      <span class="brand-glyph">O<span class="brand-glyph-notch"></span></span>
      <span>Kard<span class="brand-caps"> CREATOR</span></span>
    </a>
    <span class="lab-header-status"><span class="eyebrow-dot"></span> PRIVATE ACCOUNT SPACE</span>
    <a class="lab-back" href="/projects">My Projects ↗</a>
  </header>

  <main class="account-main">
    <div class="account-intro">
      <span class="eyebrow">OKARD / YOUR CREATIVE WORLD</span>
      <h1>Your designs.<br /><em>Your space.</em></h1>
      <p>Personal projects remain on your device today. When secure account integration is provisioned, you can deliberately back up chosen designs across devices.</p>
    </div>
    <section class="account-card" aria-labelledby="account-status-heading">
      <div class="account-card-head">
        <span class="panel-topline">YOUR ACCOUNT</span>
        <span class="account-lock" aria-hidden="true">✦</span>
      </div>
      {#if loading}
        <h2 id="account-status-heading">Checking session…</h2>
        <p>Reading your current browser sign-in state.</p>
      {:else if !configured}
        <h2 id="account-status-heading">Secure sign-in is being prepared.</h2>
        <p>Account authentication has not been configured on this deployment. You can still create, edit and download card designs locally without an account.</p>
        <a class="account-action" href="/projects">Continue with device projects ↗</a>
      {:else if authenticated}
        <h2 id="account-status-heading">Welcome back.</h2>
        <p>You are signed in as <strong>{userName}</strong>. Your project designs stay on this device unless you explicitly choose to send one to your configured cloud account.</p>
        <div class="account-actions">
          <a class="account-action" href="/projects">Manage my projects ↗</a>
          <button type="button" class="account-logout" disabled={pending}
            onclick={() => void signOut()}>{pending ? 'Signing out…' : 'Sign out'}</button>
        </div>
      {:else}
        <h2 id="account-status-heading">One secure account. More possibilities.</h2>
        <p>Continue through the configured identity provider using a standard authorization-code sign-in. OKard never asks for your provider password.</p>
        <button type="button" class="account-action" disabled={pending}
          onclick={() => void signIn()}>{pending ? 'Opening sign-in…' : 'Sign in securely ↗'}</button>
      {/if}
      {#if error}<p class="projects-feedback projects-error" role="alert">{error}</p>{/if}
      {#if notice}<p class="projects-feedback projects-success" role="status">{notice}</p>{/if}
    </section>
    <div class="account-footnote">
      <strong>Protected by design.</strong>
      <p>Identity-provider secrets are not shipped to the browser. Cloud project access requires signed access tokens with the correct issuer and audience. Actual cloud synchronization is unavailable until the project's server configuration, migration and security review are complete.</p>
    </div>
  </main>
</div>
