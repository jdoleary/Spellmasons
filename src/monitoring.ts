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

  // Print aggressive due date for game! (goal, deadline)
  console.log(
    `${Math.round(
      // @ts-ignore
      (new Date('2021-05-12') - new Date()) / 1000 / 60 / 60 / 24,
    )} days until due date!`,
  );
  console.log(
    `${Math.round(
      // @ts-ignore
      (new Date('2021-04-21') - new Date()) / 1000 / 60 / 60 / 24,
    )} days until Gameplay core is due!`,
  );
}
