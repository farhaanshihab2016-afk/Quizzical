import React from 'react';

interface HostPortraitProps {
  src: string;
  name: string;
  title?: string;
  size?: 'sm' | 'lg';
  mood?: 'correct' | 'wrong' | null;
}

export const HostPortrait: React.FC<HostPortraitProps> = ({
  src,
  name,
  title,
  size = 'lg',
  mood = null,
}) => {
  const ringColor =
    mood === 'correct' ? 'ring-teal' : mood === 'wrong' ? 'ring-tomato' : 'ring-gold/70';

  return (
    <figure className={`relative ${size === 'lg' ? 'w-full max-w-sm' : 'w-44'} mx-auto`}>
      <div className="marquee rounded-[28px]">
        <div
          className={`overflow-hidden rounded-[22px] ring-4 ${ringColor} transition-[box-shadow] duration-300 bg-oxblood shadow-2xl`}
        >
          <img
            src={src}
            alt={`Portrait of ${name}, your host`}
            width={size === 'lg' ? 640 : 320}
            height={size === 'lg' ? 640 : 320}
            className={`aspect-square w-full object-cover transition-transform duration-300 ${
              mood === 'wrong' ? 'shake' : ''
            } ${mood === 'correct' ? 'pop' : ''}`}
          />
        </div>
      </div>

      <figcaption className="relative -mt-6 mx-auto w-fit -rotate-2 rounded-lg bg-gold px-4 py-1.5 text-center text-ink shadow-[0_6px_0_var(--color-oxblood)]">
        <span className="block font-display text-xl leading-tight">{name}</span>
        {title && (
          <span className="block font-mono text-[10px] uppercase tracking-[0.2em] opacity-80">
            {title}
          </span>
        )}
      </figcaption>
    </figure>
  );
};
