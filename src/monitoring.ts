import * as Sentry from "@sentry/browser";
import { CaptureConsole as CaptureConsoleIntegration } from "@sentry/integrations";
import { BrowserTracing } from "@sentry/tracing";
import Stats from 'stats.js';

export function setupMonitoring() {

  const release = `spellmasons@${globalThis.SPELLMASONS_PACKAGE_VERSION}`;
  if (!location.href.includes('http://localhost')) {
    console.log('Setup: Monitoring with Sentry', release);
    Sentry.init({
      dsn: "https://4162d0e2c0a34b1aa44744ce94b4b21b@o1186256.ingest.sentry.io/6306205",
      release,
      integrations: [new BrowserTracing(), new CaptureConsoleIntegration(
        {
          // array of methods that should be captured
          // defaults to ['log', 'info', 'warn', 'error', 'debug', 'assert']
          levels: ['error']
        }
      )],

      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 1.0,
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