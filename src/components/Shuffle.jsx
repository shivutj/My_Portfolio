import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Shuffle.css';

gsap.registerPlugin(ScrollTrigger);

// Lightweight shuffle effect that doesn't rely on gsap/SplitText (paid)
const Shuffle = ({
  text,
  className = '',
  style = {},
  shuffleDirection = 'right',
  duration = 0.35,
  maxDelay = 0,
  ease = 'power3.out',
  threshold = 0.1,
  rootMargin = '-100px',
  tag = 'p',
  textAlign = 'center',
  onShuffleComplete,
  shuffleTimes = 1,
  animationMode = 'evenodd',
  loop = false,
  loopDelay = 0,
  stagger = 0.03,
  scrambleCharset = '',
  colorFrom,
  colorTo,
  triggerOnce = true,
  respectReducedMotion = true,
  triggerOnHover = true
}) => {
  const hostRef = useRef(null);
  const [ready, setReady] = useState(false);
  const stripsRef = useRef([]);
  const tlRef = useRef(null);
  const playingRef = useRef(false);

  const teardown = () => {
    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
    }
    if (hostRef.current) {
      // restore original text
      hostRef.current.innerHTML = '';
      hostRef.current.textContent = text || '';
    }
    stripsRef.current = [];
    playingRef.current = false;
  };

  const build = () => {
    teardown();
    const host = hostRef.current;
    if (!host || !text) return;

    // Create wrappers for each character
    host.textContent = '';
    const frag = document.createDocumentFragment();
    const rolls = Math.max(1, Math.floor(shuffleTimes));

    const mkCharStrip = ch => {
      const wrap = document.createElement('span');
      wrap.className = 'shuffle-char-wrapper';
      const inner = document.createElement('span');
      inner.className = 'shuffle-char-strip';

      // Original
      const orig = document.createElement('span');
      orig.className = 'shuffle-char';
      orig.textContent = ch;
      inner.appendChild(orig.cloneNode(true));

      for (let k = 0; k < rolls; k++) {
        const mid = document.createElement('span');
        mid.className = 'shuffle-char';
        mid.textContent = scrambleCharset
          ? scrambleCharset.charAt(Math.floor(Math.random() * scrambleCharset.length))
          : ch;
        inner.appendChild(mid);
      }
      // Real at end
      const real = document.createElement('span');
      real.className = 'shuffle-char';
      real.textContent = ch;
      inner.appendChild(real);

      // Layout assist: compute width using temporary element
      const probe = document.createElement('span');
      probe.className = 'shuffle-char';
      probe.textContent = ch || ' ';
      wrap.appendChild(probe);
      host.appendChild(wrap); // attach to measure
      const w = probe.getBoundingClientRect().width;
      wrap.removeChild(probe);

      Object.assign(wrap.style, { display: 'inline-block', overflow: 'hidden', width: w + 'px', verticalAlign: 'baseline' });
      Object.assign(inner.style, { display: 'inline-block', whiteSpace: 'nowrap', willChange: 'transform' });

      wrap.appendChild(inner);
      return { wrap, inner, width: w };
    };

    // Build for each character (preserve spaces)
    (text.split('')).forEach(ch => {
      if (ch === ' ') {
        const space = document.createElement('span');
        space.textContent = ' ';
        frag.appendChild(space);
        return;
      }
      const { wrap, inner, width } = mkCharStrip(ch);
      // Set initial positions per direction
      const steps = rolls + 1;
      let startX = 0;
      let finalX = -steps * width; // slide left by default
      if (shuffleDirection === 'right') {
        // move last child (real) to first so it slides in from left to right
        const real = inner.lastElementChild;
        if (real) inner.insertBefore(real, inner.firstChild);
        startX = -steps * width;
        finalX = 0;
      }
      gsap.set(inner, { x: startX, force3D: true });
      inner.setAttribute('data-start-x', String(startX));
      inner.setAttribute('data-final-x', String(finalX));
      stripsRef.current.push(inner);
      frag.appendChild(wrap);
    });

    host.appendChild(frag);
  };

  const play = () => {
    const strips = stripsRef.current;
    if (!strips.length) return;
    playingRef.current = true;

    const tl = gsap.timeline({
      smoothChildTiming: true,
      repeat: loop ? -1 : 0,
      repeatDelay: loop ? loopDelay : 0,
      onComplete: () => {
        playingRef.current = false;
        if (!loop) onShuffleComplete?.();
      }
    });

    const addTween = (targets, at) => {
      tl.to(
        targets,
        {
          x: (i, t) => parseFloat(t.getAttribute('data-final-x') || '0'),
          duration,
          ease,
          force3D: true,
          stagger: animationMode === 'evenodd' ? stagger : 0
        },
        at
      );
      if (colorFrom && colorTo) tl.to(targets, { color: colorTo, duration, ease }, at);
    };

    if (animationMode === 'evenodd') {
      const odd = strips.filter((_, i) => i % 2 === 1);
      const even = strips.filter((_, i) => i % 2 === 0);
      const oddTotal = duration + Math.max(0, odd.length - 1) * stagger;
      const evenStart = odd.length ? oddTotal * 0.7 : 0;
      if (odd.length) addTween(odd, 0);
      if (even.length) addTween(even, evenStart);
    } else {
      strips.forEach(strip => {
        const d = Math.random() * maxDelay;
        tl.to(strip, { x: parseFloat(strip.getAttribute('data-final-x') || '0'), duration, ease, force3D: true }, d);
        if (colorFrom && colorTo) tl.fromTo(strip, { color: colorFrom }, { color: colorTo, duration, ease }, d);
      });
    }

    tlRef.current = tl;
  };

  useEffect(() => {
    if (respectReducedMotion && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    build();
    const startPct = (1 - threshold) * 100;
    const mm = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin || '');
    const mv = mm ? parseFloat(mm[1]) : 0;
    const mu = mm ? mm[2] || 'px' : 'px';
    const sign = mv === 0 ? '' : mv < 0 ? `-=${Math.abs(mv)}${mu}` : `+=${mv}${mu}`;
    const start = `top ${startPct}%${sign}`;

    const st = ScrollTrigger.create({
      trigger: hostRef.current,
      start,
      once: triggerOnce,
      onEnter: () => {
        play();
        setReady(true);
      }
    });

    const host = hostRef.current;
    const over = e => {
      if (!triggerOnHover || playingRef.current) return;
      build();
      play();
    };
    host?.addEventListener('mouseenter', over);

    return () => {
      st.kill();
      host?.removeEventListener('mouseenter', over);
      teardown();
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, duration, ease, threshold, rootMargin, shuffleDirection, shuffleTimes, animationMode, loop, loopDelay, stagger, scrambleCharset, colorFrom, colorTo, triggerOnce, respectReducedMotion, triggerOnHover, maxDelay]);

  const Tag = tag || 'p';
  const classes = `shuffle-parent ${ready ? 'is-ready' : ''} ${className}`;
  const s = { textAlign, ...style };
  return <Tag ref={hostRef} className={classes} style={s} />;
};

export default Shuffle;


