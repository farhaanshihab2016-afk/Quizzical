import React from 'react';
import { ActiveHost, GameSettings, RoundData, RevealState } from '../types';
import { HostPortrait } from './HostPortrait';
import { HostSpeech } from './HostSpeech';
import { sfx } from '../utils/quizzicalSound';
import { Timer, ArrowRight, Lightbulb, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface PlayingViewProps {
  settings: GameSettings;
  activeHost: ActiveHost;
  round: RoundData | null;
  questionNumber: number;
  score: number;
  streak: number;
  secondsLeft: number;
  hintsLeft: number;
  hintShown: boolean;
  reveal: RevealState | null;
  loading: boolean;
  error: string | null;
  onAnswer: (choice: number) => void;
  onNext: () => void;
  onTakeHint: () => void;
  onRetry: () => void;
  onQuit: () => void;
}

export const PlayingView: React.FC<PlayingViewProps> = ({
  settings,
  activeHost,
  round,
  questionNumber,
  score,
  streak,
  secondsLeft,
  hintsLeft,
  hintShown,
  reveal,
  loading,
  error,
  onAnswer,
  onNext,
  onTakeHint,
  onRetry,
  onQuit,
}) => {
  const isRevealed = !!reveal;
  const mood = reveal ? (reveal.correct ? 'correct' : 'wrong') : null;

  return (
    <div className="space-y-6">
      {/* Top Game Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cream/15 pb-4 font-mono text-sm">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-cream/10 px-3 py-1 font-semibold text-butter">
            Q{questionNumber} / {settings.rounds}
          </span>
          <span className="hidden sm:inline text-cream/40">|</span>
          <span className="hidden sm:inline text-cream/70 font-sans font-medium">
            {settings.category}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gold">{score} pts</span>
            {streak > 1 && (
              <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs text-butter font-bold">
                🔥 {streak}
              </span>
            )}
          </div>

          {!isRevealed && round && (
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-bold ${
                secondsLeft <= 5
                  ? 'bg-tomato/30 text-tomato animate-pulse'
                  : secondsLeft <= 10
                  ? 'bg-gold/20 text-butter'
                  : 'bg-cream/10 text-cream'
              }`}
            >
              <Timer className="h-4 w-4" />
              <span>{secondsLeft}s</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              sfx.click();
              onQuit();
            }}
            className="text-xs text-cream/50 hover:text-cream underline cursor-pointer transition-colors"
          >
            Quit show
          </button>
        </div>
      </div>

      {/* Main Game Stage Split */}
      <div className="grid gap-8 md:grid-cols-[1fr_1.4fr] items-start">
        {/* Left Column: Host Portrait */}
        <div>
          <HostPortrait
            src={activeHost.image}
            name={activeHost.name}
            title={activeHost.title}
            mood={mood}
          />

          <div className="mt-6 hidden md:block text-center text-xs text-cream/50 font-mono">
            {settings.difficulty.toUpperCase()} DIFFICULTY · {settings.rounds} ROUNDS
          </div>
        </div>

        {/* Right Column: Host Dialogue, Question, Options */}
        <div className="space-y-6">
          {/* Host Speech bubble */}
          <HostSpeech
            speaker={activeHost.name}
            loading={loading || !round}
            text={
              reveal
                ? reveal.correct
                  ? round?.onCorrect
                  : round?.onWrong
                : round?.intro
            }
          />

          {error ? (
            <div className="rounded-2xl border border-tomato/40 bg-wine/50 p-6 text-center">
              <p className="text-tomato font-medium">{error}</p>
              <button
                onClick={() => {
                  sfx.click();
                  onRetry();
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2 font-display text-ink hover:opacity-90 transition-opacity cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                Retry
              </button>
            </div>
          ) : (
            round && (
              <div className="space-y-6">
                {/* The Trivia Question */}
                <h2 className="text-2xl sm:text-3xl font-bold leading-snug text-cream">
                  {round.question}
                </h2>

                {/* 4 Choices */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {round.options.map((option, idx) => {
                    const isCorrect = idx === round.answerIndex;
                    const isSelected = reveal?.choice === idx;

                    let btnStyle =
                      'bg-cream/10 text-cream hover:bg-cream/20 hover:border-gold/40 border border-cream/10';

                    if (isRevealed) {
                      if (isCorrect) {
                        btnStyle =
                          'bg-teal text-cream font-bold border-2 border-emerald-400 shadow-lg';
                      } else if (isSelected) {
                        btnStyle =
                          'bg-tomato text-cream font-bold border-2 border-rose-400 shadow-lg';
                      } else {
                        btnStyle = 'bg-cream/5 text-cream/40 border border-cream/5';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isRevealed}
                        onClick={() => {
                          sfx.click();
                          onAnswer(idx);
                        }}
                        className={`group relative flex items-center justify-between rounded-2xl px-5 py-4 text-left font-semibold transition-all duration-200 cursor-pointer ${btnStyle} ${
                          !isRevealed ? 'hover:-translate-y-0.5 active:translate-y-0' : ''
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/25 font-mono text-xs text-butter">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{option}</span>
                        </span>

                        {isRevealed && isCorrect && (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-200 ml-2" />
                        )}
                        {isRevealed && isSelected && !isCorrect && (
                          <XCircle className="h-5 w-5 shrink-0 text-rose-200 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Hint Bar (before answer) */}
                {!isRevealed && (
                  <div>
                    {hintShown ? (
                      <div className="pop flex items-start gap-2.5 rounded-xl border border-butter/30 bg-wine/60 p-4 text-sm text-butter">
                        <Lightbulb className="h-5 w-5 shrink-0 text-gold mt-0.5" />
                        <p className="italic font-medium">
                          <span className="font-bold uppercase tracking-wider text-xs block text-gold mb-0.5">
                            Host's Hint:
                          </span>
                          "{round.hint}"
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          sfx.hint();
                          onTakeHint();
                        }}
                        disabled={hintsLeft <= 0}
                        className="inline-flex items-center gap-2 text-sm text-cream/70 hover:text-gold underline disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <Lightbulb className="h-4 w-4 text-gold" />
                        Ask for a hint ({hintsLeft} left)
                      </button>
                    )}
                  </div>
                )}

                {/* Post-Answer Reveal Block */}
                {isRevealed && (
                  <div className="pop space-y-4 pt-2">
                    {/* Points Banner */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {reveal.correct ? (
                          <span className="rounded-full bg-teal px-3 py-1 font-mono text-xs font-bold text-cream shadow-sm">
                            +{reveal.points} PTS!
                          </span>
                        ) : (
                          <span className="rounded-full bg-tomato px-3 py-1 font-mono text-xs font-bold text-cream shadow-sm">
                            {reveal.timedOut ? 'TIME UP!' : 'INCORRECT'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Fact Card */}
                    {round.fact && (
                      <div className="rounded-2xl border border-gold/25 bg-wine/50 p-4 text-sm text-cream/90">
                        <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-gold font-bold">
                          The Fascinating Truth
                        </div>
                        <p className="leading-relaxed">{round.fact}</p>
                      </div>
                    )}

                    {/* Next Question CTA */}
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          sfx.click();
                          onNext();
                        }}
                        className="group inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 font-display text-xl text-ink shadow-[0_6px_0_var(--color-oxblood)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_2px_0_var(--color-oxblood)] transition-transform cursor-pointer"
                      >
                        <span>
                          {questionNumber >= settings.rounds ? 'See Final Tally' : 'Next Question'}
                        </span>
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
