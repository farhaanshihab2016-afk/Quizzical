import React from 'react';
import { LeaderboardEntry } from '../types';
import { sfx } from '../utils/quizzicalSound';
import { X, Trophy, Flame, User, Sparkles } from 'lucide-react';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ entries, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl border-2 border-gold/40 bg-ink p-6 sm:p-8 text-cream shadow-2xl">
        <div className="flex items-center justify-between border-b border-cream/15 pb-4">
          <div className="flex items-center gap-2.5">
            <Trophy className="h-6 w-6 text-gold" />
            <h2 className="font-display text-2xl text-butter">The Hall of Fame</h2>
          </div>
          <button
            onClick={() => {
              sfx.click();
              onClose();
            }}
            className="rounded-full p-2 text-cream/60 hover:bg-cream/10 hover:text-cream transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-xs text-cream/60 font-mono">
          Tonight's top contestants and historic broadcast champions.
        </p>

        <div className="mt-6 max-h-96 space-y-3 overflow-y-auto pr-1">
          {entries.length === 0 ? (
            <p className="text-center py-8 text-sm text-cream/50">No champions yet recorded.</p>
          ) : (
            entries.map((entry, idx) => {
              const isTop3 = idx < 3;
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

              return (
                <div
                  key={entry.id || idx}
                  className={`flex items-center justify-between rounded-2xl p-4 transition-all ${
                    isTop3
                      ? 'border border-gold/30 bg-wine/60'
                      : 'border border-cream/10 bg-wine/25'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center font-display text-lg text-gold">{medal}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cream text-base">{entry.heroName}</span>
                      </div>
                      <span className="text-xs text-cream/60 block mt-0.5">
                        vs. {entry.hostName} · {entry.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-display text-xl text-gold block leading-tight">
                      {entry.score}
                    </span>
                    <span className="text-[11px] font-mono text-cream/50">
                      {entry.correct}/{entry.rounds} correct
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              sfx.click();
              onClose();
            }}
            className="rounded-full bg-cream/10 px-6 py-2 text-sm font-semibold text-cream hover:bg-cream/20 transition-colors cursor-pointer"
          >
            Back to show
          </button>
        </div>
      </div>
    </div>
  );
};
