import React, { useState, useEffect } from 'react';

interface HostSpeechProps {
  speaker: string;
  text?: string | null;
  loading?: boolean;
}

export const HostSpeech: React.FC<HostSpeechProps> = ({ speaker, text, loading = false }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    if (!text || loading) return;

    let index = 0;
    const interval = setInterval(() => {
      index += 2;
      setDisplayedText(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [text, loading]);

  return (
    <div className="relative rounded-3xl rounded-tl-md border-2 border-cream/15 bg-cream px-6 py-5 text-ink shadow-[0_10px_0_rgb(0_0_0/0.35)]">
      <span className="absolute -top-3 left-5 rounded-full bg-oxblood px-3.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-butter shadow-md">
        {speaker}
      </span>

      {loading || !text ? (
        <div className="space-y-2.5 pt-2" aria-label={`${speaker} is thinking`}>
          <div className="h-4 w-11/12 rounded bg-ink/10 animate-pulse" />
          <div className="h-4 w-8/12 rounded bg-ink/10 animate-pulse" />
        </div>
      ) : (
        <p className="text-lg leading-snug font-medium min-h-[3.25rem] text-ink" aria-live="polite">
          {displayedText}
          {displayedText.length < text.length && (
            <span className="ml-1 inline-block h-5 w-2 translate-y-1 bg-oxblood animate-pulse" />
          )}
        </p>
      )}
    </div>
  );
};
