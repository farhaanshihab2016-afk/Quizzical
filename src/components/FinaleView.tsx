import React, { useEffect, useState } from 'react';
import { ActiveHost, GameSettings } from '../types';
import { HostPortrait } from './HostPortrait';
import { HostSpeech } from './HostSpeech';
import { sfx } from '../utils/quizzicalSound';
import confetti from 'canvas-confetti';
import { Trophy, Flame, Award, RotateCcw, SlidersHorizontal, Check } from 'lucide-react';

interface FinaleViewProps {
  settings: GameSettings;
  activeHost: ActiveHost;
  score: number;
  correctCount: number;
  bestStreak: number;
  signoff: string | null;
  heroName: string;
  onSaveHeroName: (name: string) => void;
  onPlayAgain: () => void;
  onNewShow: () => void;
}

export const FinaleView: React.FC<FinaleViewProps> = ({
  settings,
  activeHost,
  score,
  correctCount,
  bestStreak,
  signoff,
  heroName,
  onSaveHeroName,
  onPlayAgain,
  onNewShow,
}) => {
  const [nameInput, setNameInput] = useState(heroName);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    sfx.fanfare();
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e5a930', '#f6d88a', '#5b1a22', '#2e8a7c'],
      });
    } catch {
      // safe fallback
    }
  }, []);

  const percentage = Math.round((correctCount / settings.rounds) * 100);

  const getRankTitle = () => {
    if (percentage === 100) return 'Perfection! Standing Ovation!';
    if (percentage >= 80) return 'Trivia Virtuoso!';
    if (percentage >= 60) return 'Sharp Mind!';
    if (percentage >= 40) return 'Valiant Challenger!';
    return 'Audience Favorite!';
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    sfx.click();
    onSaveHeroName(nameInput.trim());
    setSaved(true);
  };

  return (
    <div className="space-y-10">
      <div className="text-center">
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-gold font-bold">
          That's Our Broadcast!
        </span>
        <h2 className="font-display text-4xl sm:text-5xl text-butter mt-1">The Grand Finale</h2>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_1.4fr] items-start">
        {/* Host Portrait */}
        <div>
          <HostPortrait
            src={activeHost.image}
            name={activeHost.name}
            title={activeHost.title}
            mood="correct"
          />
        </div>

        {/* Finale Content */}
        <div className="space-y-6">
          {/* Host Signoff Speech */}
          <HostSpeech
            speaker={activeHost.name}
            loading={!signoff}
            text={signoff || 'Signing off tonight with high spirits and immense gratitude!'}
          />

          {/* Performance Scorecard */}
          <div className="rounded-3xl border border-gold/30 bg-ink/75 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-cream/15 pb-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-cream/60">
                  Performance Evaluation
                </span>
                <h3 className="font-display text-2xl text-gold mt-0.5">{getRankTitle()}</h3>
              </div>
              <div className="rounded-full bg-gold/20 p-2.5 text-gold">
                <Trophy className="h-7 w-7" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-2xl bg-wine/50 p-3.5 border border-cream/10">
                <span className="font-mono text-[10px] uppercase tracking-widest text-cream/50 block">
                  Final Score
                </span>
                <span className="font-display text-2xl text-butter block mt-1">{score}</span>
              </div>

              <div className="rounded-2xl bg-wine/50 p-3.5 border border-cream/10">
                <span className="font-mono text-[10px] uppercase tracking-widest text-cream/50 block">
                  Correct
                </span>
                <span className="font-display text-2xl text-butter block mt-1">
                  {correctCount}/{settings.rounds}
                </span>
              </div>

              <div className="rounded-2xl bg-wine/50 p-3.5 border border-cream/10">
                <span className="font-mono text-[10px] uppercase tracking-widest text-cream/50 block">
                  Best Streak
                </span>
                <span className="font-display text-2xl text-butter block mt-1 flex items-center justify-center gap-1">
                  <Flame className="h-5 w-5 text-orange-400 inline" />
                  {bestStreak}
                </span>
              </div>
            </div>

            {/* Name / Leaderboard Submission */}
            <form onSubmit={handleSaveName} className="flex flex-col sm:flex-row gap-2 pt-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setSaved(false);
                }}
                maxLength={30}
                placeholder="Enter stage name for leaderboard"
                className="flex-1 rounded-xl border border-cream/20 bg-wine/60 px-4 py-2.5 text-sm text-cream placeholder:text-cream/40 focus:border-gold focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-2.5 font-display text-sm text-ink hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
              >
                {saved ? <Check className="h-4 w-4" /> : <Award className="h-4 w-4" />}
                {saved ? 'Saved!' : 'Save Record'}
              </button>
            </form>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => {
                sfx.click();
                onPlayAgain();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 font-display text-xl text-ink shadow-[0_6px_0_var(--color-oxblood)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_var(--color-oxblood)] transition-transform cursor-pointer"
            >
              <RotateCcw className="h-5 w-5" />
              Replay this show
            </button>

            <button
              onClick={() => {
                sfx.click();
                onNewShow();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-6 py-3.5 font-display text-lg text-cream hover:bg-cream/10 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Change host or program
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
