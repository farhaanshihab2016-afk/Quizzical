import { PresetHost, PlayerProfile, LeaderboardEntry, HostSelection, ActiveHost } from '../types';
import { saveFirestoreLeaderboardEntry, fetchFirestoreLeaderboard } from '../lib/firebase';

export const PRESET_HOSTS: PresetHost[] = [
  {
    id: 'velvet',
    name: 'Velvet Montgomery',
    title: 'The Crooner',
    tagline: 'Smooth as a saxophone solo, twice as smug.',
    persona:
      'A silky 1970s prime-time game show host. Relentlessly charming, calls the player "sweetheart" or "champ", name-drops imaginary celebrity friends, speaks like a lounge singer, milks every moment for dramatic tension and applause breaks.',
    image: '/img/host-velvet.png',
  },
  {
    id: 'quillsby',
    name: 'Prof. Ambrose Quillsby',
    title: 'The Pedant',
    tagline: 'Has corrected your grammar before you answered.',
    persona:
      'A pompous, elderly Oxford professor who cannot believe he is hosting a quiz show. Verbose, fond of Latin phrases and footnotes, mildly disappointed by everything, secretly delighted when the player is right. Corrects trivial details.',
    image: '/img/host-quillsby.png',
  },
  {
    id: 'barnacle',
    name: 'Capt. Marigold Barnacle',
    title: 'The Buccaneer',
    tagline: 'Wrong answers walk the plank.',
    persona:
      'A boisterous pirate captain running a trivia game aboard her ship. Nautical slang, threats of the plank, talks about her parrot Reginald and buried treasure, rewards right answers with doubloons, roars with laughter.',
    image: '/img/host-barnacle.png',
  },
  {
    id: 'unit7',
    name: 'UNIT-7',
    title: 'The Machine',
    tagline: 'Calculating your odds. They are not good.',
    persona:
      'A deadpan, sarcastic quiz-hosting robot. Speaks in dry clipped sentences, cites made-up probabilities, pretends to be unimpressed by humans, occasionally glitches into accidental sincerity. Never uses exclamation marks.',
    image: '/img/host-unit7.png',
  },
  {
    id: 'dot',
    name: 'Nana Dot',
    title: 'The Sweetheart',
    tagline: 'Loves you dearly. Will still win.',
    persona:
      'A warm, doting grandmother hosting quiz night. Calls the player "pumpkin" or "dear", offers imaginary cookies, tells tangential stories about her late husband Harold, but has a fiercely competitive streak and gentle passive-aggressive digs.',
    image: '/img/host-dot.png',
  },
];

export const MYSTERY_HOST_IMAGE = '/img/host-mystery.png';

export function resolveActiveHost(selection: HostSelection): ActiveHost {
  if (selection.kind === 'custom') {
    return {
      name: selection.name.trim() || 'The Mystery Host',
      title: 'Your Creation',
      persona: selection.persona,
      image: MYSTERY_HOST_IMAGE,
    };
  }
  const preset = PRESET_HOSTS.find((h) => h.id === selection.id) || PRESET_HOSTS[0];
  return {
    id: preset.id,
    name: preset.name,
    title: preset.title,
    persona: preset.persona,
    image: preset.image,
  };
}

export const CATEGORIES = [
  'General Knowledge',
  'Science & Nature',
  'History',
  'Geography',
  'Film & TV',
  'Music',
  'Sports',
  'Food & Drink',
  'Art & Literature',
  'Technology',
];

export const CUSTOM_SPARKS = [
  'A hard-boiled noir detective who treats every question like a murder case.',
  'An over-caffeinated sports commentator calling every answer like a photo finish.',
  'A melodramatic Shakespearean actor who speaks in grand soliloquies.',
  'A bored teenager whose mom forced them to host. Very "whatever".',
  'A 1980s aerobics fitness instructor shouting trivia between jumping jacks.',
];

const PROFILE_KEY = 'quizzical_profile';
const LEADERBOARD_KEY = 'quizzical_leaderboard';

export function getPlayerProfile(): PlayerProfile {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error loading profile:', e);
  }
  return {
    heroName: 'Trivia Star',
    highScore: 0,
    totalGames: 0,
    bestStreak: 0,
  };
}

export function savePlayerProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving profile:', e);
  }
}

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', heroName: 'Quizmaster Flash', hostName: 'Velvet Montgomery', category: 'Film & TV', score: 1450, correct: 5, rounds: 5, date: '2026-09-28' },
  { id: '2', heroName: 'Athena', hostName: 'Prof. Ambrose Quillsby', category: 'History', score: 1320, correct: 5, rounds: 5, date: '2026-09-29' },
  { id: '3', heroName: 'Blackbeard', hostName: 'Capt. Marigold Barnacle', category: 'Geography', score: 1100, correct: 4, rounds: 5, date: '2026-09-30' },
  { id: '4', heroName: 'CyberNova', hostName: 'UNIT-7', category: 'Technology', score: 980, correct: 4, rounds: 5, date: '2026-09-30' },
  { id: '5', heroName: 'BiscuitKing', hostName: 'Nana Dot', category: 'Food & Drink', score: 850, correct: 3, rounds: 5, date: '2026-09-29' },
];

export function getLocalLeaderboard(): LeaderboardEntry[] {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    if (data) {
      return JSON.parse(data).sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score);
    }
  } catch (e) {
    console.error('Error loading leaderboard:', e);
  }
  saveLocalLeaderboard(DEFAULT_LEADERBOARD);
  return DEFAULT_LEADERBOARD;
}

export function saveLocalLeaderboard(entries: LeaderboardEntry[]): void {
  try {
    const sorted = [...entries].sort((a, b) => b.score - a.score).slice(0, 50);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(sorted));
  } catch (e) {
    console.error('Error saving local leaderboard:', e);
  }
}

export async function recordGameShow(
  heroName: string,
  hostName: string,
  category: string,
  score: number,
  correct: number,
  rounds: number,
  streak: number
): Promise<LeaderboardEntry[]> {
  const profile = getPlayerProfile();
  const newProfile: PlayerProfile = {
    heroName,
    highScore: Math.max(profile.highScore, score),
    totalGames: profile.totalGames + 1,
    bestStreak: Math.max(profile.bestStreak, streak),
  };
  savePlayerProfile(newProfile);

  const newEntry: LeaderboardEntry = {
    id: Date.now().toString(),
    heroName,
    hostName,
    category,
    score,
    correct,
    rounds,
    date: new Date().toISOString().split('T')[0],
  };

  const local = getLocalLeaderboard();
  const updated = [newEntry, ...local].sort((a, b) => b.score - a.score).slice(0, 50);
  saveLocalLeaderboard(updated);

  // Sync to Firestore
  try {
    await saveFirestoreLeaderboardEntry(newEntry);
  } catch (err) {
    console.warn('Firestore sync note:', err);
  }

  return updated;
}

export function calculatePoints(secondsLeft: number, streak: number, difficulty: 'easy' | 'medium' | 'hard'): number {
  const base = { easy: 100, medium: 150, hard: 200 }[difficulty];
  const timeBonus = secondsLeft * 4;
  const streakBonus = Math.max(0, streak - 1) * 25;
  return base + timeBonus + streakBonus;
}
