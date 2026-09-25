const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
export const RULES = freeze({ step: 1 / 60, laneSpeed: 9, baseSpeed: 15, maxSpeed: 29,
  rowGap: 32, viewDistance: 185, fuelDrain: 1.1, hitCost: 32, jumpDuration: .86,
  slideDuration: .86, jumpHeight: 1.65, feverAt: 24, feverDuration: 7 });
export const BIOMES = freeze([
  { id: 'wood', name: 'Emberwood', subtitle: 'Where the last light begins', sky: ['#213f39','#91aa88'], fog: '#abc09b', ground: '#385442', road: ['#91866c','#b0a181'], edge: '#657b50', trees: ['#254c3d','#3e654a','#658159'], accent: '#ffbb69' },
  { id: 'ruins', name: 'The Sunken Sanctum', subtitle: 'Old stones. Unfinished stories.', sky: ['#171e39','#595479'], fog: '#9792ac', ground: '#292b42', road: ['#969385','#b5af96'], edge: '#8b859a', trees: ['#343754','#474263','#605779'], accent: '#b5b3ff' },
  { id: 'dawn', name: 'Golden Reach', subtitle: 'Even the longest night ends', sky: ['#3e354a','#cf9265'], fog: '#e2b88b', ground: '#655345', road: ['#b49a75','#c8b18a'], edge: '#c2a77e', trees: ['#765b43','#9d7244','#c29452'], accent: '#ffe09b' },
]);
export const CLOAKS = freeze([
  { id: 'ember', name: 'Wickwarden', desc: 'A small flame. A long way home.', color: '#aa694a', trim: '#ffd591', price: 0, level: 1 },
  { id: 'moss', name: 'Mosskeeper', desc: 'For those who take the quiet path.', color: '#52947b', trim: '#cbe8a7', price: 150, level: 2 },
  { id: 'moon', name: 'Moonweaver', desc: 'A little piece of the night sky.', color: '#7c7dc1', trim: '#d8d6ff', price: 350, level: 3 },
  { id: 'rose', name: 'Rose of Ash', desc: 'Something beautiful survived.', color: '#c66688', trim: '#ffd7d5', price: 650, level: 4 },
  { id: 'glacier', name: 'Frostwalker', desc: 'Cold hands. A steadfast flame.', color: '#7faeb7', trim: '#dbfaff', price: 1000, level: 5 },
  { id: 'sun', name: 'Dawnbringer', desc: 'You carried the morning here.', color: '#e3b65c', trim: '#fff1c8', price: 1600, level: 7 },
]);
export const UPGRADES = freeze([
  { id: 'wick', name: 'Woven wick', desc: 'Lantern drains 6% slower per level.', prices: [120,300,600] },
  { id: 'oil', name: 'Brighter oil', desc: 'Oil restores 4 more fuel per level.', prices: [100,250,500] },
  { id: 'magnet', name: 'Ember charm', desc: 'Magnet lasts 2 seconds longer per level.', prices: [100,250,500] },
]);
export const MISSIONS = freeze([
  { id:'first', name:'A spark of something', desc:'Complete your first run', stat:'runs', target:1, reward:40 },
  { id:'distance1', name:'Find your feet', desc:'Travel 500 m in total', stat:'distance', target:500, reward:60 },
  { id:'coins1', name:'Pocketful of light', desc:'Gather 50 cinders', stat:'coins', target:50, reward:75 },
  { id:'dodge1', name:'Light on your feet', desc:'Clear 12 obstacles', stat:'dodges', target:12, reward:80 },
  { id:'best1', name:'Beyond the trees', desc:'Reach 600 m in one run', stat:'bestDistance', target:600, reward:100 },
  { id:'fever1', name:'Catch fire', desc:'Trigger Ember Rush 3 times', stat:'fevers', target:3, reward:100 },
  { id:'runs2', name:'The road remembers', desc:'Complete 10 runs', stat:'runs', target:10, reward:150 },
  { id:'coins2', name:'Constellation', desc:'Gather 500 cinders', stat:'coins', target:500, reward:200 },
  { id:'best2', name:'Chase the dawn', desc:'Reach 1,200 m in one run', stat:'bestDistance', target:1200, reward:250 },
  { id:'dodge2', name:'Untouchable rhythm', desc:'Clear 150 obstacles', stat:'dodges', target:150, reward:250 },
  { id:'distance2', name:'A thousand little steps', desc:'Travel 15,000 m in total', stat:'distance', target:15000, reward:400 },
  { id:'best3', name:'Keeper of the flame', desc:'Reach 2,400 m in one run', stat:'bestDistance', target:2400, reward:500 },
]);
