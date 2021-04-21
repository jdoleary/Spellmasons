<script>
  import Menu from './Menu.svelte';
  import { onMount } from 'svelte';
  let count = 0;
  onMount(() => {
    const interval = setInterval(() => count++, 1000);
    return () => {
      clearInterval(interval);
    };
  });
</script>

<div class="App">
  <Menu />
  <header class="App-header">
    <p>Edit <code>src/App.svelte</code> and save to reload.</p>
    <p>Page has been open for <code>{count}</code> seconds.</p>
    <p>
      <a
        class="App-link"
        href="https://svelte.dev"
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn Svelte
      </a>
    </p>
  </header>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
  }
  .App {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #f9f6f6;
  }
  .App p {
    margin: 0.4rem;
  }
  .App-header {
    color: #333;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: calc(10px + 2vmin);
  }
  /* .App-logo {
    height: 36vmin;
    pointer-events: none;
    margin-bottom: 3rem;
    animation: App-logo-pulse infinite 1.6s ease-in-out alternate;
  }
  @keyframes App-logo-pulse {
    from {
      transform: scale(1);
    }
    to {
      transform: scale(1.06);
    }
  } */
</style>
