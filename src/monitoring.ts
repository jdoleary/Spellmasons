import Stats from 'stats.js';
export function setupMonitoring() {
  const stats = new Stats();
  // Add fps stats
  function monitorFPS() {
    stats.end();
    stats.begin();
    requestAnimationFrame(monitorFPS);
  }
  stats.begin();
  monitorFPS();

  // Add latency stats
  stats.showPanel(3);
  window.latencyPanel = stats.addPanel(
    new Stats.Panel('latency', '#ff8', '#221'),
  );
  stats.dom.classList.add('doob-stats');
  document.body.appendChild(stats.dom);
}
