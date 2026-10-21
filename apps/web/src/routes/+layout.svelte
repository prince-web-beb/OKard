<script lang="ts">
  import type { Snippet } from 'svelte';
  import '../app.css';
  let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
  <meta name="description" content="OKard Creator — an original, code-powered studio for exquisite front and back card designs." />
</svelte:head>

{@render children()}
