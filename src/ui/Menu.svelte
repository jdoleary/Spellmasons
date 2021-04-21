<script lang="ts">
  import * as Cards from '../cards';
  import * as Units from '../units';
  import { setupPixi } from '../PixiUtils';
  import * as UI from '../ui/UserInterface';
  import { makeGame } from '../wsPieHandler';
  import { connect } from '../wsPieSetup';
  console.log(import.meta.env.SNOWPACK_PUBLIC_PACKAGE_VERSION);
  // const wsUri = 'ws://localhost:8000';
  // const wsUri = 'ws://192.168.0.21:8000';
  // Locally hosted, externally accessed
  // const wsUri = 'ws://68.48.199.138:7337';
  let wsUri = 'wss://websocket-pie-6ggew.ondigitalocean.app';
  let app = 'spellmason';
  let name = '';
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
      connect({ app, version, name }, wsUri);
      // makeGame(clients);
      // UI.setup();
    });
  }
  function handleJoin() {
    loadingPromise.then(() => {
      // Connect to PieServer
      connect({ app, version, name }, wsUri);
    });
  }
</script>

<input bind:value={wsUri} placeholder="Enter the URL of the server" />
<input
  bind:value={name}
  placeholder="Enter a room name for your friends to join!"
/>
<p>{name}</p>
<p>{app}-{version}</p>

<button on:click|once={handleHost}> Host Game </button>
<button on:click|once={handleJoin}> Join Game </button>
