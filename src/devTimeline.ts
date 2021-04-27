const timeline: { date: string; description: string }[] = [
  {
    date: '2021-09-01',
    description: 'Funds running out, execute plan C',
  },
  {
    date: '2021-04-28',
    description: 'Get WebRTC working',
  },
  {
    date: '2021-05-05',
    description: 'Trailer due / Website live',
  },
];
for (let { date, description } of timeline) {
  console.log(
    `${Math.round(
      // @ts-ignore
      (new Date(date) - new Date()) / 1000 / 60 / 60 / 24,
    )}: ${description}`,
  );
}

export {};
