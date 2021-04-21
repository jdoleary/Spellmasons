<script lang="ts">
  import PieClient from 'pie-client';
  import * as Cards from '../cards';
  import * as Units from '../units';
  import { setupPixi } from '../PixiUtils';
  // import * as UI from '../ui/UserInterface';
  // import { makeGame } from '../wsPieHandler';
  import { connect } from '../wsPieSetup';
  // const wsUri = 'ws://localhost:8000';
  // const wsUri = 'ws://192.168.0.21:8000';
  // Locally hosted, externally accessed
  // const wsUri = 'ws://68.48.199.138:7337';
  let wsUri = 'wss://websocket-pie-6ggew.ondigitalocean.app';
  let checkingWsUri = false;
  // Try to initially connect to server with default wsUri
  handleChangeWSURI();
  let app = 'spellmason';
  let name = '';
  let wsConnected = false;
  const version = import.meta.env.SNOWPACK_PUBLIC_PACKAGE_VERSION;
  const loadingPromise = Promise.all([
    Cards.registerCards(),
    Units.registerUnits(),
  ])
    .then((listOfListOfImages) => {
      return listOfListOfImages.reduce((acc, list) => {
        acc = acc.concat(list);
        return acc;
      }, []);
    })
    .then(setupPixi);
  function handleHost() {
    loadingPromise.then(() => {
      // Connect to PieServer
      connect(window.pie, { app, version, name });
      // makeGame(clients);
      // UI.setup();
    });
  }
  function handleJoin() {
    loadingPromise.then(() => {
      // Connect to PieServer
      connect(window.pie, { app, version, name });
    });
  }
  function handleChangeWSURI() {
    checkingWsUri = true;
    const storedClientId = sessionStorage.getItem('pie-clientId');
    try {
      window.pie = new PieClient({
        env: import.meta.env.MODE,
        wsUri: wsUri + (storedClientId ? `?clientId=${storedClientId}` : ''),
        useStats: true,
      });
      window.pie.onConnectInfo = (o) => {
        checkingWsUri = false;
        wsConnected = o.connected;
      };
    } catch (e) {
      console.error(e);
    }
  }
</script>

<input
  bind:value={wsUri}
  on:blur={handleChangeWSURI}
  placeholder="Enter the URL of the server"
/>
<div id="wspie-connection-status">
  {#if checkingWsUri}
    <div>Checking Server Connection...</div>
  {:else if wsConnected}
    <div style="color:green;">Connected</div>
  {:else}
    <div style="color:red;">Disconnected</div>
  {/if}
</div>
<input
  bind:value={name}
  placeholder="Enter a room name for your friends to join!"
/>
<p>{name}</p>
<p>{app}-{version}</p>

<button on:click|once={handleHost}> Host Game </button>
<button on:click|once={handleJoin}> Join Game </button>

<style>
  #wspie-connection-status {
    font-size: medium;
  }
</style>
