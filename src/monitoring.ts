import Stats from 'stats.js';

let stats: Stats;
const HIDE_STATS_CLASS = 'hide';
globalThis.monitorFPS = () => {
  if (stats) {
    // Stats have already been created, unhide them
    stats.dom.classList.toggle(HIDE_STATS_CLASS);
  } else {
    stats = new Stats();
    // Add fps stats
    function monitorFPS() {
      stats.end();
      stats.begin();
      requestAnimationFrame(monitorFPS);
    }
    stats.begin();
    monitorFPS();

    // Add ms tracker for runPredictions function
    globalThis.runPredictionsPanel = stats.addPanel(
      new Stats.Panel('runPredictions', '#ff8', '#221'),
    );
    // Add latency stats
    globalThis.latencyPanel = stats.addPanel(
      new Stats.Panel('latency', '#ff8', '#221'),
    );
    stats.dom.classList.add('doob-stats');
    document.body?.appendChild(stats.dom);
    // Show the latency panel
    stats.showPanel(0);
  }

}
globalThis.monitorFPS();