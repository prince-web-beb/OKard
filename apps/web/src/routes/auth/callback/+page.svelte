<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getBrowserAuthManager, browserAuthConfigured } from '$lib/auth';

  let busy = $state(true);
  let error = $state('');

  onMount(()=>{
    if(!browserAuthConfigured()){
      busy=false;error='Secure account integration is not configured on this deployment.';
      return;
    }
    // The library validates redirect state, PKCE code verifier and OIDC claims.
    // Do not parse or trust callback query parameters by hand.
    void getBrowserAuthManager().signinRedirectCallback().then(async()=>{
      await goto('/account',{replaceState:true,invalidateAll:true});
    }).catch((reason)=>{
      busy=false;
      error=reason instanceof Error ? reason.message : 'Sign-in confirmation failed.';
    });
  });
</script>

<svelte:head>
  <title>Confirming Sign-in — OKard Creator</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="auth-callback-main">
  <a class="brand" href="/" aria-label="OKard Creator home">
    <span class="brand-glyph">O<span class="brand-glyph-notch"></span></span>Kard
  </a>
  <section class="account-card" aria-live="polite">
    <span class="panel-topline">SECURE SESSION</span>
    {#if busy}
      <h1>Confirming your sign-in.</h1>
      <p>The identity provider is completing your authorization.</p>
    {:else}
      <h1>Sign-in needs attention.</h1>
      <p role="alert">{error}</p>
      <a class="account-action" href="/account">Return to account ↗</a>
    {/if}
  </section>
</main>
