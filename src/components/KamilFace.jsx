import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

// Kamil's animated face (AGT-KAMIL-001 from github.com/oyekamal/agent-face).
// One lottie instance; swapping `mood` loads that state's JSON from /kamil/.
const cache = {};
// The pack's top-level shape layer is the tile background + bezel; the page draws its own screen.
const load = (mood) => (cache[mood] ??= fetch(`/kamil/${mood}.json`).then((r) => r.json())
  .then((d) => ({ ...d, layers: d.layers.filter((l) => l.ty !== 4) })));

export default function KamilFace({ mood }) {
  const box = useRef(null);
  const anim = useRef(null);

  useEffect(() => {
    let alive = true;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    Promise.all([import('lottie-web/build/player/lottie_light'), load(mood)]).then(([{ default: lottie }, data]) => {
      if (!alive || !box.current) return;
      anim.current?.destroy();
      anim.current = lottie.loadAnimation({
        container: box.current, renderer: 'svg', loop: true, autoplay: !still, animationData: data,
      });
      if (still) anim.current.goToAndStop(Math.floor(data.op / 2), true);
    }).catch(() => {}); // ponytail: face is decorative; a failed fetch just leaves the tile blank
    return () => { alive = false; };
  }, [mood]);

  useEffect(() => () => anim.current?.destroy(), []);

  return <div ref={box} className="kamil-face" aria-hidden="true" />;
}

KamilFace.propTypes = { mood: PropTypes.string.isRequired };
