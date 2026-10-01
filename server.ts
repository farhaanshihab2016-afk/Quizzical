import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();

function getPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    return parseInt(process.argv[portArgIndex + 1], 10);
  }
  if (process.env.NODE_ENV === 'development' && process.argv.includes('server.ts')) {
    return 3000;
  }
  if (process.env.PORT) {
    return parseInt(process.env.PORT, 10);
  }
  return 3000;
}

const port = getPort();

app.use(express.json());

// Initialize Google Gen AI
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI() : null;

interface HostInfo {
  kind: 'preset' | 'custom';
  id?: string;
  name?: string;
  persona?: string;
}

const PRESET_HOSTS: Record<string, { name: string; persona: string }> = {
  velvet: {
    name: 'Velvet Montgomery',
    persona: 'A silky 1970s prime-time game show host. Relentlessly charming, calls the player "sweetheart" or "champ", name-drops imaginary celebrity friends, speaks like a lounge singer, milks every moment for dramatic tension and applause breaks.',
  },
  quillsby: {
    name: 'Prof. Ambrose Quillsby',
    persona: 'A pompous, elderly Oxford professor who cannot believe he is hosting a quiz show. Verbose, fond of Latin phrases and footnotes, mildly disappointed by everything, secretly delighted when the player is right. Corrects trivial details.',
  },
  barnacle: {
    name: 'Capt. Marigold Barnacle',
    persona: 'A boisterous pirate captain running a trivia game aboard her ship. Nautical slang, threats of the plank, talks about her parrot Reginald and buried treasure, rewards right answers with doubloons, roars with laughter.',
  },
  unit7: {
    name: 'UNIT-7',
    persona: 'A deadpan, sarcastic quiz-hosting robot. Speaks in dry clipped sentences, cites made-up probabilities, pretends to be unimpressed by humans, occasionally glitches into accidental sincerity. Never uses exclamation marks.',
  },
  dot: {
    name: 'Nana Dot',
    persona: 'A warm, doting grandmother hosting quiz night. Calls the player "pumpkin" or "dear", offers imaginary cookies, tells tangential stories about her late husband Harold, but has a fiercely competitive streak and gentle passive-aggressive digs.',
  },
};

function resolveHost(host: HostInfo): { name: string; persona: string } {
  if (host.kind === 'custom') {
    return {
      name: host.name?.trim() || 'The Mystery Host',
      persona: host.persona || 'A witty, enigmatic quiz host.',
    };
  }
  const preset = PRESET_HOSTS[host.id || 'velvet'] || PRESET_HOSTS.velvet;
  return preset;
}

// Built-in backup trivia generator for instant resilience
function getBackupRound(category: string, questionNumber: number, hostName: string) {
  const bank = [
    {
      question: "Which planetary body in our solar system has winds exceeding 1,200 mph (2,000 km/h)?",
      options: ["Mars", "Jupiter", "Neptune", "Venus"],
      answerIndex: 2,
      intro: `Let us test your mettle on question number ${questionNumber}. Gaze toward the heavens!`,
      onCorrect: `Splendid! You hit the bullseye. Neptune's howling storms have nothing on your intellect!`,
      onWrong: `Alas, incorrect! Neptune holds the record for supersonic methane tempests.`,
      hint: "It is the eighth and farthest known planet from the Sun, named after the Roman god of the sea.",
      fact: "Neptune's winds are the fastest in the Solar System, powered by internal thermal heat rather than solar radiation.",
    },
    {
      question: "What was the first commercial product ever scanned with a Universal Product Code (UPC) barcode in 1974?",
      options: ["Campbell's Tomato Soup", "Wrigley's Juicy Fruit Gum", "Coca-Cola Classic 6-pack", "Wonder Bread"],
      answerIndex: 1,
      intro: `Here is a curious item from modern history for round ${questionNumber}!`,
      onCorrect: `Spot on! A sweet victory right out of the checkout lane!`,
      onWrong: `Not quite! It was a simple pack of Wrigley's chewing gum in Troy, Ohio.`,
      hint: "It comes in a yellow foil pack with a distinctively sweet, fruity mint aroma.",
      fact: "The pack of Wrigley's gum scanned on June 26, 1974, is now preserved in the Smithsonian Institution.",
    },
    {
      question: "Which mythical creature's blood was said in Greek mythology to be poisonous to anyone who touched it, except its slayer Heracles?",
      options: ["The Hydra", "The Minotaur", "The Chimera", "The Pegasus"],
      answerIndex: 0,
      intro: `Brace yourself, contestant! An ancient riddle awaits your command.`,
      onCorrect: `Brilliant! You severed the serpent's heads with absolute precision!`,
      onWrong: `Down into the swamp! The Lernaean Hydra was the venomous beast in question.`,
      hint: "Cut off one head, and two more would sprout in its place.",
      fact: "Heracles later dipped his arrows into the Hydra's venomous blood, creating the deadly arrows used in his subsequent labors.",
    },
    {
      question: "Which element has the highest melting point of all known metals at 3,422 °C (6,192 °F)?",
      options: ["Titanium", "Tungsten", "Platinum", "Osmium"],
      answerIndex: 1,
      intro: `Things are heating up on stage! Let's see if your mind can withstand the crucible.`,
      onCorrect: `Electrifying! You lit up that question like an incandescent filament!`,
      onWrong: `Burnt to a crisp! Tungsten (wolfram) holds the supreme thermal crown.`,
      hint: "Its chemical symbol is W, derived from the German name Wolfram.",
      fact: "Tungsten's extreme melting point made it the gold standard for lightbulb filaments for over a century.",
    },
    {
      question: "In the 1928 silent film 'Steamboat Willie', what is Mickey Mouse seen doing in the famous opening seconds?",
      options: ["Fishing off the stern", "Whistling while steering a steamboat", "Eating a block of cheese", "Playing a trombone"],
      answerIndex: 1,
      intro: `Step right into the spotlight! Let's roll some classic nostalgia for round ${questionNumber}.`,
      onCorrect: `Cue the overture! You whistled that tune with flawless panache!`,
      onWrong: `Missed the cue! Mickey was merrily whistling 'Steamboat Bill' at the wheel.`,
      hint: "Tap your foot and pucker up—it's one of animation's most iconic audio-visual rhythms.",
      fact: "'Steamboat Willie' was one of the very first cartoons with synchronized sound, voice, and musical score.",
    },
  ];

  const round = bank[(questionNumber - 1) % bank.length];
  return {
    ...round,
    intro: `${hostName}: ${round.intro}`,
  };
}

// POST /api/round
app.post('/api/round', async (req: Request, res: Response) => {
  const { host, category, difficulty, rounds, questionNumber, score, streak, asked, lastResult } = req.body;
  const resolvedHost = resolveHost(host || {});

  if (!ai) {
    const backup = getBackupRound(category || 'General Knowledge', questionNumber || 1, resolvedHost.name);
    return res.json(backup);
  }

  try {
    const prompt = `You are generating a trivia round for "Quizzical", an interactive trivia show hosted by an AI with a strong personality.
Host: "${resolvedHost.name}"
Host Persona: "${resolvedHost.persona}"

Topic/Category: "${category || 'General Knowledge'}"
Difficulty: "${difficulty || 'medium'}"
Round: Question ${questionNumber || 1} of ${rounds || 5}
Current Player Score: ${score || 0}, Current Streak: ${streak || 0}
Already Asked Questions (DO NOT REPEAT ANY): ${JSON.stringify(asked || [])}
${lastResult ? `Previous Question Result: Player was ${lastResult.correct ? 'CORRECT' : lastResult.timedOut ? 'TIMED OUT' : 'WRONG'}. Previous Question: "${lastResult.question}". Correct Answer was: "${lastResult.answer}".` : ''}

Requirements:
1. Produce an original, factually verified trivia question in the requested category and difficulty.
2. Provide exactly 4 plausible multiple-choice options.
3. Set answerIndex (0, 1, 2, or 3) indicating the single correct option.
4. "intro": The host's spoken introduction to THIS question, speaking directly to the player in their distinctive persona, voice, idioms, and attitude. If previous question result exists, acknowledge or react to it briefly.
5. "onCorrect": What the host says if the player picks the right answer. Must be completely in-character.
6. "onWrong": What the host says if the player picks the wrong answer or times out. Must be completely in-character.
7. "hint": A witty, helpful clue provided by the host without immediately giving away the answer.
8. "fact": A 1-2 sentence fascinating trivia fact explaining the truth behind the answer.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "answerIndex": 0,
  "intro": "string",
  "onCorrect": "string",
  "onWrong": "string",
  "hint": "string",
  "fact": "string"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);

    if (
      parsed.question &&
      Array.isArray(parsed.options) &&
      parsed.options.length === 4 &&
      typeof parsed.answerIndex === 'number'
    ) {
      return res.json(parsed);
    }

    throw new Error('Invalid JSON format from model');
  } catch (err) {
    console.warn('Gemini round generation fallback:', err);
    const backup = getBackupRound(category || 'General Knowledge', questionNumber || 1, resolvedHost.name);
    return res.json(backup);
  }
});

// POST /api/finale
app.post('/api/finale', async (req: Request, res: Response) => {
  const { host, score, correct, bestStreak, rounds, category, difficulty } = req.body;
  const resolvedHost = resolveHost(host || {});

  if (!ai) {
    return res.json({
      signoff: `${resolvedHost.name}: That's a wrap on tonight's broadcast! You racked up ${score || 0} points with a streak of ${bestStreak || 0}. Take a bow, superstar!`,
    });
  }

  try {
    const prompt = `You are ${resolvedHost.name}.
Persona: ${resolvedHost.persona}

The game show "Quizzical" has just concluded!
Contestant Results:
- Category: ${category || 'General Knowledge'}
- Difficulty: ${difficulty || 'medium'}
- Final Score: ${score || 0} points
- Questions Answered Correctly: ${correct || 0} / ${rounds || 5}
- Best Streak: ${bestStreak || 0}

Write your final theatrical sign-off monologue (3 to 5 sentences).
Address the contestant directly, stay 100% in your persona, mention their performance, celebrate or playfully roast them, and close out the broadcast with flair.

Respond ONLY with a valid JSON object:
{
  "signoff": "string"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);

    if (parsed.signoff) {
      return res.json(parsed);
    }
    throw new Error('Missing signoff');
  } catch (err) {
    console.warn('Gemini finale generation fallback:', err);
    return res.json({
      signoff: `And that, my dear friends, brings our marvelous broadcast to a close! With ${score || 0} points on the board, you gave us quite a show. Until next time, keep your curiosity sharp!`,
    });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(503).send('Application build in progress, please reload in a moment.');
      }
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Quizzical server running on http://0.0.0.0:${port}`);
  });
}

startServer();
