import * as Sentry from "@sentry/browser";
import { BrowserTracing } from "@sentry/tracing";
// import Stats from 'stats.js';

export function setupMonitoring() {

  console.log('Setup: Monitoring with Sentry');
  Sentry.init({
    dsn: "https://4162d0e2c0a34b1aa44744ce94b4b21b@o1186256.ingest.sentry.io/6306205",
    integrations: [new BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
  // const stats = new Stats();
  // // Add fps stats
  // function monitorFPS() {
  //   stats.end();
  //   stats.begin();
  //   requestAnimationFrame(monitorFPS);
  // }
  // stats.begin();
  // monitorFPS();

  // // Add latency stats
  // stats.showPanel(3);
  // window.latencyPanel = stats.addPanel(
  //   new Stats.Panel('latency', '#ff8', '#221'),
  // );
  // stats.dom.classList.add('doob-stats');
  // document.body.appendChild(stats.dom);
}
