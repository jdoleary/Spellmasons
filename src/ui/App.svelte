<script>
  let count = 0;

  function handleClick() {
    count += 1;
  }
</script>

<div id="game-container">
  <div>
    <button id="btn-end-turn">End Turn</button>
    <button on:click="{handleClick}">
      Clicked {count} {count === 1 ? 'time' : 'times'}
    </button>
  </div>
  <div id="board">
    <div id="board-contents">
      <img
        id="grid-background"
        src="images/grid.png"
        width="512"
        height="512"
      />
    </div>
  </div>
  <div>
    <pre id="log"></pre>
  </div>
</div>
