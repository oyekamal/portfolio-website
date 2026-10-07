// The five places on Kamal's planet. lat/lon put each landmark on the sphere.
export const STOPS = [
  {
    id: 'workshop', name: 'Workshop', icon: '🔧', lat: 38, lon: 10,
    chip: 'What he built',
    hello: "Wanna see what he built? This is where he fixes things!",
    next: 'office',
  },
  {
    id: 'office', name: 'Office tower', icon: '🏢', lat: 8, lon: 82,
    chip: 'Where he worked',
    hello: 'His work history! Every floor is a job. Five years of backend before me!',
    next: 'tower',
  },
  {
    id: 'tower', name: 'Broadcast tower', icon: '📡', lat: -22, lon: 160,
    chip: 'His channels',
    hello: 'He talks a lot too! Videos, posts, the works. Pick a channel!',
    next: 'greenhouse',
  },
  {
    id: 'greenhouse', name: 'Greenhouse', icon: '🌱', lat: 20, lon: -78,
    chip: 'What he’s working on',
    hello: "These problems are still growing. Got one? Let's solve it!",
    next: 'post',
  },
  {
    id: 'post', name: 'Post office', icon: '📮', lat: -34, lon: -148,
    chip: 'Hire him',
    hello: "Let's connect! I'll deliver the message myself.",
    next: 'workshop',
  },
];

export const byId = Object.fromEntries(STOPS.map((s) => [s.id, s]));
