import React, { useState } from 'react';
import { GameSettings, HostSelection } from '../types';
import { PRESET_HOSTS, MYSTERY_HOST_IMAGE, CATEGORIES, CUSTOM_SPARKS } from '../utils/storage';
import { sfx } from '../utils/quizzicalSound';
import { Clapperboard, Sparkles, WandSparkles } from 'lucide-react';

interface SetupViewProps {
  onStart: (settings: GameSettings) => void;
  initial?: GameSettings | null;
}

export const SetupView: React.FC<SetupViewProps> = ({ onStart, initial }) => {
  const [selectedHostId, setSelectedHostId] = useState<string>(
    initial?.host.kind === 'custom' ? 'custom' : initial?.host.id || PRESET_HOSTS[0].id
  );
  const [customName, setCustomName] = useState<string>(
    initial?.host.kind === 'custom' ? initial.host.name : ''
  );
  const [customPersona, setCustomPersona] = useState<string>(
    initial?.host.kind === 'custom' ? initial.host.persona : ''
  );

  const [category, setCategory] = useState<string>(initial?.category || CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState<string>(
    initial && !CATEGORIES.includes(initial.category) ? initial.category : ''
  );

  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    initial?.difficulty || 'medium'
  );
  const [rounds, setRounds] = useState<number>(initial?.rounds || 5);

  const isCustom = selectedHostId === 'custom';
  const isCustomValid = !isCustom || customPersona.trim().length >= 3;
  const activeCategory = customCategory.trim() || category;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCustomValid) return;
    sfx.click();

    const hostSelection: HostSelection = isCustom
      ? {
          kind: 'custom',
          name: customName.trim() || 'The Mystery Host',
          persona: customPersona.trim(),
        }
      : {
          kind: 'preset',
          id: selectedHostId,
        };

    onStart({
      host: hostSelection,
      category: activeCategory,
      difficulty,
      rounds,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      {/* 1. Pick your host */}
      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-3xl text-butter">1. Pick your host</h2>
          <span className="hidden font-mono text-xs uppercase tracking-[0.2em] text-cream/50 sm:block">
            They write every line live
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          {PRESET_HOSTS.map((host, idx) => {
            const isSelected = selectedHostId === host.id;
            return (
              <button
                key={host.id}
                type="button"
                onClick={() => {
                  sfx.click();
                  setSelectedHostId(host.id);
                }}
                aria-pressed={isSelected}
                style={{ animationDelay: `${idx * 60}ms` }}
                className={`rise group relative overflow-hidden rounded-3xl text-left transition-all duration-200 focus-visible:outline-none cursor-pointer ${
                  isSelected
                    ? '-translate-y-1 ring-4 ring-gold shadow-[0_14px_0_var(--color-oxblood)]'
                    : 'ring-1 ring-cream/15 hover:-translate-y-0.5 hover:ring-gold/50 focus-visible:ring-gold'
                }`}
              >
                <img
                  src={host.image}
                  alt={`Portrait of ${host.name}`}
                  width={420}
                  height={420}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/85 to-transparent p-4 pt-16">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold font-bold">
                    {host.title}
                  </span>
                  <span className="block font-display text-lg leading-tight text-cream">
                    {host.name}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-cream/70 line-clamp-2">
                    {host.tagline}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Invent a Host card */}
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setSelectedHostId('custom');
            }}
            aria-pressed={isCustom}
            style={{ animationDelay: `${PRESET_HOSTS.length * 60}ms` }}
            className={`rise group relative overflow-hidden rounded-3xl text-left transition-all duration-200 cursor-pointer ${
              isCustom
                ? '-translate-y-1 ring-4 ring-gold shadow-[0_14px_0_var(--color-oxblood)]'
                : 'ring-1 ring-dashed ring-cream/20 hover:-translate-y-0.5 hover:ring-gold/50'
            }`}
          >
            <img
              src={MYSTERY_HOST_IMAGE}
              alt="Mystery host placeholder"
              width={420}
              height={420}
              loading="lazy"
              className="aspect-[4/5] w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/85 to-transparent p-4 pt-16">
              <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-gold font-bold">
                <WandSparkles className="h-3 w-3" aria-hidden="true" />
                Your creation
              </span>
              <span className="block font-display text-lg leading-tight text-cream">
                Invent a host
              </span>
              <span className="mt-1 block text-xs leading-snug text-cream/70">
                Describe any personality you like.
              </span>
            </div>
          </button>
        </div>

        {/* Custom Host Form Panel */}
        {isCustom && (
          <div className="pop mt-6 grid gap-4 rounded-3xl border border-gold/30 bg-ink/60 p-6 md:grid-cols-[1fr_2fr] backdrop-blur-sm">
            <label className="block">
              <span className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-cream/60">
                Stage name
              </span>
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                maxLength={60}
                placeholder="Detective Sal Ferro"
                className="w-full rounded-xl border border-cream/15 bg-wine/60 px-4 py-3 text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none transition-colors"
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-xs uppercase tracking-[0.2em] text-cream/60">
                Personality <span className="text-cream/40">({customPersona.length}/500)</span>
              </span>
              <textarea
                value={customPersona}
                onChange={(e) => setCustomPersona(e.target.value)}
                maxLength={500}
                rows={3}
                required
                placeholder="Who are they? How do they talk? What do they love, hate, or keep bringing up?"
                className="w-full resize-none rounded-xl border border-cream/15 bg-wine/60 px-4 py-3 text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none transition-colors"
              />
            </label>

            <div className="md:col-span-2">
              <span className="mb-2 flex items-center gap-1.5 text-xs text-cream/60">
                <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                Need a spark?
              </span>
              <div className="flex flex-wrap gap-2">
                {CUSTOM_SPARKS.map((spark) => (
                  <button
                    key={spark}
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setCustomPersona(spark);
                    }}
                    className="rounded-full border border-cream/15 px-3 py-1.5 text-left text-xs text-cream/80 hover:border-gold hover:text-cream transition-colors cursor-pointer bg-wine/20"
                  >
                    {spark}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. Set tonight's program */}
      <section>
        <h2 className="font-display text-3xl text-butter">2. Set tonight's program</h2>

        <fieldset className="mt-6">
          <legend className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-cream/60">
            Category
          </legend>
          <div className="flex flex-wrap gap-2 items-center">
            {CATEGORIES.map((cat) => {
              const isSelected = !customCategory.trim() && category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setCategory(cat);
                    setCustomCategory('');
                  }}
                  aria-pressed={isSelected}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-cream text-ink font-bold shadow-md'
                      : 'bg-cream/[0.07] text-cream/80 hover:bg-cream/15'
                  }`}
                >
                  {cat}
                </button>
              );
            })}

            <input
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              maxLength={80}
              placeholder="…or type any topic"
              aria-label="Custom topic"
              className={`min-w-48 flex-1 rounded-full border px-4 py-2 text-sm text-cream placeholder:text-cream/40 focus:outline-none transition-colors ${
                customCategory.trim()
                  ? 'border-gold bg-gold/15 text-gold font-medium'
                  : 'border-cream/15 bg-transparent focus:border-gold'
              }`}
            />
          </div>
        </fieldset>

        <div className="mt-6 flex flex-wrap gap-8">
          {/* Difficulty */}
          <fieldset>
            <legend className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-cream/60">
              Difficulty
            </legend>
            <div className="inline-flex rounded-full bg-ink/70 p-1 ring-1 ring-cream/10">
              {(['easy', 'medium', 'hard'] as const).map((lvl) => {
                const isSelected = difficulty === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setDifficulty(lvl);
                    }}
                    aria-pressed={isSelected}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors cursor-pointer ${
                      isSelected ? 'bg-gold text-ink font-bold' : 'text-cream/75 hover:text-cream'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Rounds */}
          <fieldset>
            <legend className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-cream/60">
              Questions
            </legend>
            <div className="inline-flex rounded-full bg-ink/70 p-1 ring-1 ring-cream/10">
              {[5, 10, 15].map((cnt) => {
                const isSelected = rounds === cnt;
                return (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setRounds(cnt);
                    }}
                    aria-pressed={isSelected}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${
                      isSelected ? 'bg-gold text-ink font-bold' : 'text-cream/75 hover:text-cream'
                    }`}
                  >
                    {cnt}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      </section>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={!isCustomValid}
          className="group inline-flex items-center gap-3 rounded-full bg-gold px-8 py-4 font-display text-2xl text-ink shadow-[0_8px_0_var(--color-oxblood)] transition-transform hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_3px_0_var(--color-oxblood)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <Clapperboard
            className="h-6 w-6 transition-transform group-hover:-rotate-12"
            aria-hidden="true"
          />
          Roll the tape
        </button>

        {!isCustomValid && (
          <p className="mt-3 text-sm text-tomato">Give your host a personality first.</p>
        )}
      </div>
    </form>
  );
};
