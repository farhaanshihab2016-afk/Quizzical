import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GamePhase,
  GameSettings,
  RoundData,
  RevealState,
  LeaderboardEntry,
  PlayerProfile,
} from './types';
import {
  resolveActiveHost,
  getPlayerProfile,
  getLocalLeaderboard,
  recordGameShow,
  calculatePoints,
} from './utils/storage';
import { sfx } from './utils/quizzicalSound';
import { SetupView } from './components/SetupView';
import { PlayingView } from './components/PlayingView';
import { FinaleView } from './components/FinaleView';
import { LeaderboardModal } from './components/LeaderboardModal';
import { Volume2, VolumeX, Trophy, Sparkles } from 'lucide-react';

const QUESTION_TIMER_SECONDS = 25;

async function postJSON<T>(url: string, data: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || 'The host missed their cue. Try again.');
  }
  return json as T;
}

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(() => getPlayerProfile());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => getLocalLeaderboard());
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Game Flow State
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [settings, setSettings] = useState<GameSettings | null>(null);

  // Live Round State
  const [round, setRound] = useState<RoundData | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [reveal, setReveal] = useState<RevealState | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_TIMER_SECONDS);
  const [hintsLeft, setHintsLeft] = useState(1);
  const [hintShown, setHintShown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signoff, setSignoff] = useState<string | null>(null);

  // Refs for tracking and background prefetching
  const askedQuestionsRef = useRef<string[]>([]);
  const prefetchedNextRoundRef = useRef<Promise<RoundData> | null>(null);
  const retryCallbackRef = useRef<(() => void) | null>(null);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sfx.setEnabled(next);
    if (next) sfx.click();
  };

  const onRoundLoaded = useCallback((data: RoundData) => {
    askedQuestionsRef.current.push(data.question);
    setRound(data);
    setReveal(null);
    setHintShown(false);
    setSecondsLeft(QUESTION_TIMER_SECONDS);
  }, []);

  const fetchRound = useCallback(
    (payload: Record<string, unknown>, prefetchPromise?: Promise<RoundData> | null) => {
      setLoading(true);
      setError(null);

      const run = () => {
        const promise = prefetchPromise ?? postJSON<RoundData>('/api/round', payload);
        prefetchPromise = null;

        promise
          .then(onRoundLoaded)
          .catch((err: Error) => {
            retryCallbackRef.current = run;
            setError(err.message);
          })
          .finally(() => {
            setLoading(false);
          });
      };

      run();
    },
    [onRoundLoaded]
  );

  // Start new game show
  const handleStart = useCallback(
    (newSettings: GameSettings) => {
      askedQuestionsRef.current = [];
      prefetchedNextRoundRef.current = null;
      setSettings(newSettings);
      setPhase('playing');
      setQuestionNumber(1);
      setScore(0);
      setStreak(0);
      setBestStreak(0);
      setCorrectCount(0);
      setHintsLeft(newSettings.rounds >= 10 ? 2 : 1);
      setSignoff(null);
      setRound(null);
      setReveal(null);

      fetchRound({
        ...newSettings,
        questionNumber: 1,
        score: 0,
        streak: 0,
        asked: [],
      });
    },
    [fetchRound]
  );

  // Answer handler
  const handleAnswer = useCallback(
    (choiceIndex: number | null) => {
      if (!round || !settings || reveal) return;

      const isCorrect = choiceIndex === round.answerIndex;
      const isTimedOut = choiceIndex === null;

      if (isCorrect) {
        sfx.correct();
      } else {
        sfx.wrong();
      }

      const nextStreak = isCorrect ? streak + 1 : 0;
      const earnedPoints = isCorrect
        ? calculatePoints(secondsLeft, nextStreak, settings.difficulty)
        : 0;
      const nextScore = score + earnedPoints;

      setReveal({
        choice: choiceIndex,
        correct: isCorrect,
        timedOut: isTimedOut,
        points: earnedPoints,
      });

      setScore(nextScore);
      setStreak(nextStreak);
      setBestStreak((prev) => Math.max(prev, nextStreak));
      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      }

      // Prefetch the NEXT round in background while user reads the reveal/fact!
      if (questionNumber < settings.rounds) {
        const nextPayload = {
          ...settings,
          questionNumber: questionNumber + 1,
          score: nextScore,
          streak: nextStreak,
          asked: askedQuestionsRef.current,
          lastResult: {
            correct: isCorrect,
            timedOut: isTimedOut,
            question: round.question,
            answer: round.options[round.answerIndex],
          },
        };

        const prefetch = postJSON<RoundData>('/api/round', nextPayload);
        prefetch.catch(() => {});
        prefetchedNextRoundRef.current = prefetch;
        retryCallbackRef.current = () => fetchRound(nextPayload);
      }
    },
    [round, settings, reveal, secondsLeft, streak, score, questionNumber, fetchRound]
  );

  // Next question or finish to Finale
  const handleNext = useCallback(() => {
    if (!settings) return;

    if (questionNumber >= settings.rounds) {
      setPhase('finale');
      const activeHost = resolveActiveHost(settings.host);

      // Record in storage and Firestore
      recordGameShow(
        profile.heroName || 'Trivia Star',
        activeHost.name,
        settings.category,
        score,
        correctCount,
        settings.rounds,
        bestStreak
      ).then((updated) => {
        setLeaderboard(updated);
      });

      // Request finale monologue
      postJSON<{ signoff: string }>('/api/finale', {
        ...settings,
        score,
        correct: correctCount,
        bestStreak,
      })
        .then((res) => setSignoff(res.signoff))
        .catch(() => {
          setSignoff(
            `${activeHost.name}: That's our show for tonight, everyone! You gave it your all. Thank you and goodnight!`
          );
        });

      return;
    }

    setQuestionNumber((prev) => prev + 1);
    setRound(null);

    const cached = prefetchedNextRoundRef.current;
    prefetchedNextRoundRef.current = null;

    if (!cached) {
      retryCallbackRef.current?.();
      return;
    }

    setLoading(true);
    setError(null);
    cached
      .then(onRoundLoaded)
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [settings, questionNumber, score, correctCount, bestStreak, profile.heroName, onRoundLoaded]);

  // Lifeline: Hint
  const handleTakeHint = useCallback(() => {
    if (hintsLeft <= 0 || hintShown || reveal) return;
    setHintsLeft((prev) => prev - 1);
    setHintShown(true);
  }, [hintsLeft, hintShown, reveal]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'playing' || !round || reveal) return;

    if (secondsLeft <= 0) {
      handleAnswer(null);
      return;
    }

    if (secondsLeft <= 5) {
      sfx.tick();
    }

    const timer = setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, round, reveal, secondsLeft, handleAnswer]);

  const activeHost = settings ? resolveActiveHost(settings.host) : null;

  return (
    <div className="min-h-screen text-cream selection:bg-gold selection:text-ink">
      <main className="mx-auto max-w-5xl px-5 py-8 sm:py-12">
        {/* Header / Brand Masthead */}
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-cream/10 pb-6">
          <div>
            <h1 className="text-outline font-display text-5xl sm:text-6xl text-gold tracking-tight">
              Quizzical
            </h1>
            <p className="mt-1 text-sm sm:text-base text-cream/70 font-medium">
              A live trivia show hosted by an AI with the personality you choose.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sfx.click();
                setShowLeaderboard(true);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-cream/20 bg-ink/60 px-4 py-2 text-xs font-mono uppercase tracking-wider text-cream hover:border-gold hover:text-gold transition-colors cursor-pointer"
            >
              <Trophy className="h-4 w-4 text-gold" />
              <span>Hall of Fame</span>
            </button>

            <button
              onClick={toggleSound}
              className="rounded-full border border-cream/20 bg-ink/60 p-2 text-cream/80 hover:text-gold hover:border-gold transition-colors cursor-pointer"
              title={soundEnabled ? 'Mute sound' : 'Enable sound'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-cream/40" />}
            </button>
          </div>
        </header>

        {/* Dynamic Screen View */}
        {phase === 'setup' && (
          <SetupView onStart={handleStart} initial={settings} />
        )}

        {phase === 'playing' && settings && activeHost && (
          <PlayingView
            settings={settings}
            activeHost={activeHost}
            round={round}
            questionNumber={questionNumber}
            score={score}
            streak={streak}
            secondsLeft={secondsLeft}
            hintsLeft={hintsLeft}
            hintShown={hintShown}
            reveal={reveal}
            loading={loading}
            error={error}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onTakeHint={handleTakeHint}
            onRetry={() => retryCallbackRef.current?.()}
            onQuit={() => {
              prefetchedNextRoundRef.current = null;
              setPhase('setup');
              setRound(null);
              setError(null);
            }}
          />
        )}

        {phase === 'finale' && settings && activeHost && (
          <FinaleView
            settings={settings}
            activeHost={activeHost}
            score={score}
            correctCount={correctCount}
            bestStreak={bestStreak}
            signoff={signoff}
            heroName={profile.heroName}
            onSaveHeroName={(name) => {
              const updated = { ...profile, heroName: name };
              setProfile(updated);
              recordGameShow(
                name,
                activeHost.name,
                settings.category,
                score,
                correctCount,
                settings.rounds,
                bestStreak
              ).then((lb) => setLeaderboard(lb));
            }}
            onPlayAgain={() => handleStart(settings)}
            onNewShow={() => {
              setPhase('setup');
              setRound(null);
            }}
          />
        )}
      </main>

      {/* Hall of Fame Modal */}
      {showLeaderboard && (
        <LeaderboardModal
          entries={leaderboard}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  );
}
