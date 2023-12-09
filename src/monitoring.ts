import * as Sentry from "@sentry/browser";
import Stats from 'stats.js';

export function setupMonitoring() {
  const release = `spellmasons@${globalThis.SPELLMASONS_PACKAGE_VERSION}`;
  if (!location.href.includes('http://localhost')) {
    console.log('Setup: Monitoring with Sentry', release);
    Sentry.init({
      dsn: "https://3e73188cf44c491da09fb834f36f55f5@o4504650001874944.ingest.sentry.io/4504650002923520",
      release,
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 0.1,
    });
    Sentry.setTag("SpellmasonsRunner", "Browser");
  } else {
    console.log('Setup: Monitoring with Sentry disabled due to localhost')
  }
}

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
    stats.showPanel(3);
  }

}