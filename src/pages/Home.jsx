import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import SEO from '../components/SEO';
import Slime from '../components/Slime';
import { getBlogsData } from '../services/dataService';
import { generateCV } from '../services/pdfGenerator';
import './Home.css';

const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'experience', label: 'Experience' },
  { id: 'writing', label: 'Writing' },
  { id: 'contact', label: 'Contact' },
];

const SOCIAL = { GitHub: 'GitHub', LinkedIn: 'LinkedIn', 'X (Twitter)': 'X', YouTube: 'YouTube', Instagram: 'Instagram' };

const POKES = [
  'Hey! That tickles.',
  "I'm Kamil. Kamal built me to do his busywork.",
  'Drag me. I bounce.',
  'I read his Slack so he doesn\'t have to.',
  'I only act on plans he approves. Mostly.',
  'Squish noted.',
];

const SECTION_LINE = {
  about: null,
  shipped: 'Hover a project. I\'ll tell you about it.',
  experience: 'Five years of backend before me. I was not consulted.',
  writing: 'He writes these himself. I check the spelling.',
  contact: 'Got a problem? He likes those.',
};

const NAME_SPOT = '.name .word:first-child';
const INTRO = "Hi! I'm Kamil, Kamal's AI agent. He finds problems; I do his busywork.";
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const stamp = () => new Date().toTimeString().slice(0, 8);
const STILL = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useInView(ref, opts) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), opts);
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [ref, opts]);
  return seen;
}
const STRIKE_OPTS = { rootMargin: '0px 0px -30% 0px' };
const REVEAL_OPTS = { rootMargin: '0px 0px -10% 0px' };

// Number that counts up the first time it scrolls into view.
function CountUp({ value }) {
  const ref = useRef(null);
  const seen = useInView(ref, REVEAL_OPTS);
  const [n, setN] = useState(value);
  useEffect(() => {
    if (!seen || STILL) return;
    const target = Number(value.match(/\d[\d,]*/)[0].replace(/,/g, ''));
    let raf; const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - k, 3);
      setN(value.replace(/\d[\d,]*/, Math.round(target * (0.7 + 0.3 * e)).toLocaleString('en-US')));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, value]);
  return <dt ref={ref}>{n}</dt>;
}
CountUp.propTypes = { value: PropTypes.string.isRequired };

function ProblemCard({ p, i, onHover }) {
  const ref = useRef(null);
  const struck = useInView(ref, STRIKE_OPTS);
  const shown = useInView(ref, REVEAL_OPTS);
  const tilt = (e) => {
    if (STILL) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--rx', (((e.clientY - r.top) / r.height - 0.5) * -3).toFixed(2));
    ref.current.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 4).toFixed(2));
  };
  const reset = () => { ref.current.style.setProperty('--rx', 0); ref.current.style.setProperty('--ry', 0); onHover(null); };
  return (
    <article
      ref={ref}
      id={`card-${slug(p.name)}`}
      className={`card${struck ? ' is-struck' : ''}${shown ? ' is-shown' : ''}`}
      style={{ '--i': i % 2 }}
      onMouseEnter={() => onHover(p)} onMouseMove={tilt} onMouseLeave={reset}
      onFocus={() => onHover(p)} onBlur={() => onHover(null)}
    >
      <p className="card-problem"><em>problem</em><span>{p.problem}</span></p>
      <h3 className="card-title">
        <a href={p.repo} target="_blank" rel="noreferrer">{p.name}<span className="arrow" aria-hidden="true">↗</span></a>
      </h3>
      <p className="card-fix">{p.fix}</p>
      <div className="card-meta">
        <span className="proof">{p.proof}</span>
        {p.live && <a className="live" href={p.live} target="_blank" rel="noreferrer">Try it live ↗</a>}
      </div>
    </article>
  );
}
ProblemCard.propTypes = { p: PropTypes.object.isRequired, i: PropTypes.number.isRequired, onHover: PropTypes.func.isRequired };

// Splits the name into letters that spring up on load.
const Letters = ({ text }) => (
  <span className="letters" aria-label={text}>
    {text.split(' ').map((w, wi) => (
      <span key={wi} className="word" aria-hidden="true">
        {[...w].map((c, ci) => <span key={ci} style={{ '--d': `${(wi * 6 + ci) * 18}ms` }}>{c}</span>)}
      </span>
    ))}
  </span>
);
Letters.propTypes = { text: PropTypes.string.isRequired };

export default function Home({ portfolioData }) {
  const { personal = {}, social = [], experience = [], problems = [], hunting = [], youtube } = portfolioData;
  const [section, setSection] = useState('about');
  const [blogs, setBlogs] = useState([]);
  const [focus, setFocus] = useState(null);       // hover / poke: { perch, say, mood }, wins over everything
  const [spot, setSpot] = useState(NAME_SPOT);     // where Kamil sits when nobody is pointing at anything
  // Phones: no intro bubble; there's no room beside the name and it would cover it.
  const [chat, setChat] = useState(() => ({ say: window.innerWidth < 700 ? null : INTRO, mood: 'happy' }));
  const [log, setLog] = useState(() => [{ t: stamp(), m: 'booted. landing on his name' }]);
  const idle = useRef(null);
  const sleeping = useRef(false);
  const pokes = useRef(0);
  const hush = useRef(null);

  const note = useCallback((m) => setLog((l) => (l[0]?.m === m ? l : [{ t: stamp(), m }, ...l].slice(0, 5))), []);
  // Say something, then go quiet. Bubbles never sit over the content for long.
  const speak = useCallback((say, mood = 'idle', ms = 3600) => {
    setChat({ say, mood });
    clearTimeout(hush.current);
    hush.current = setTimeout(() => setChat((c) => (c.say === say ? { say: null, mood: c.mood === 'sleepy' ? 'sleepy' : 'idle' } : c)), ms);
  }, []);

  useEffect(() => { getBlogsData().then((d) => setBlogs(d.blogs || [])).catch(() => {}); }, []);
  useEffect(() => {
    hush.current = setTimeout(() => setChat((c) => (c.say === INTRO ? { say: null, mood: 'idle' } : c)), 4200);
    return () => clearTimeout(hush.current);
  }, []);

  // Doze after 25s of no input.
  useEffect(() => {
    const wake = () => {
      clearTimeout(idle.current);
      if (sleeping.current) { sleeping.current = false; speak("Oh! You're back.", 'wow', 2200); note('woke up'); }
      idle.current = setTimeout(() => {
        sleeping.current = true;
        setChat({ say: 'zz… (move the mouse)', mood: 'sleepy' });
        note('dozing. nobody is scrolling');
      }, 25000);
    };
    wake();
    const evs = ['pointermove', 'keydown', 'scroll', 'touchstart'];
    evs.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    return () => { clearTimeout(idle.current); evs.forEach((e) => window.removeEventListener(e, wake)); };
  }, [note, speak]);

  // Scroll drives where Kamil lives: his name → the card or job mid-screen → the posts → the email.
  const current = useRef('about');
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting || e.target.id === current.current) return;
      const id = e.target.id; current.current = id;
      setSection(id);
      if (window.matchMedia('(hover: none)').matches) setFocus(null);
      const fixed = { about: NAME_SPOT, writing: '.posts', contact: '.mail' }[id];
      if (fixed) setSpot(fixed);
      if (sleeping.current) return;
      note(`reading ${id}`);
      if (SECTION_LINE[id]) speak(SECTION_LINE[id]);
    }), { rootMargin: '-45% 0px -50% 0px' });
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [note, speak]);

  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      setSpot(`#${e.target.id}`);
      const p = problems.find((x) => `card-${slug(x.name)}` === e.target.id);
      if (p) { note(`sitting on ${p.name}`); if (window.matchMedia('(hover: none)').matches && p.kamil) speak(p.kamil, p.kamilMood || 'happy', 3200); }
    }), { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('.card, .job').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [problems, experience, note, speak]);

  const onCard = (p) => {
    if (!p) { setFocus(null); return; }
    setFocus({ perch: `#card-${slug(p.name)}`, say: p.kamil || null, mood: p.kamilMood || 'happy' });
    note(`hopped onto ${p.name}`);
  };

  const onPoke = () => {
    const line = POKES[pokes.current++ % POKES.length];
    setFocus(null);
    speak(line, 'wow', 2600);
    note('got poked');
  };

  const kamil = focus || { perch: spot, ...chat };
  const email = personal.email;
  const years = (y) => y.match(/\d{4}/)?.[0];

  return (
    <div className="pf">
      <SEO
        title="Muhammad Kamal · R&D Engineer, Problem Hunter"
        description={personal.tagline}
        name="Muhammad Kamal"
        keywords="Muhammad Kamal, oykamal, oyekamal, R&D Engineer, AI agents, Claude Code, Python, Django, AWS, Islamabad"
      />
      <a className="skip" href="#about">Skip to content</a>

      <Slime perch={kamil.perch} say={kamil.say} mood={kamil.mood} onPoke={onPoke} />

      <div className="pf-grid">
        <header className="pf-side">
          <div className="side-top">
            <h1 className="name"><Letters text={personal.name || ''} /></h1>
            <p className="role rise" style={{ '--d': '140ms' }}>{personal.title}</p>
            <p className="tagline rise" style={{ '--d': '173ms' }}>{personal.tagline}</p>
            <p className="stack rise" style={{ '--d': '206ms' }}>{(personal.stack || []).join(' · ')} <span className="open"><span className="live-dot" aria-hidden="true" />Open to AI-automation projects</span></p>

            <div className="klog rise" style={{ '--d': '240ms' }} aria-label="What Kamil is doing">
              <div className="klog-head"><span className="live-dot" aria-hidden="true" />kamil.log<span className="dim">the blue slime is my AI agent</span></div>
              <ol aria-live="polite">
                {log.map((l, i) => <li key={l.t + l.m} style={{ opacity: 1 - i * 0.2 }}><time>{l.t}</time>{l.m}</li>)}
              </ol>
            </div>

            <nav className="side-nav rise" style={{ '--d': '273ms' }} aria-label="Sections">
              {SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`} className={section === s.id ? 'active' : ''}>
                  <span className="tick" aria-hidden="true" />{s.label}
                  {s.id === 'shipped' && <sup>{problems.length}</sup>}
                </a>
              ))}
            </nav>
          </div>

          <ul className="socials rise" style={{ '--d': '300ms' }}>
            <li><button type="button" className="cv" onClick={() => generateCV(portfolioData)}>Download CV ↓</button></li>
            {social.filter((s) => SOCIAL[s.platform]).map((s) => (
              <li key={s.platform}><a href={s.url} target="_blank" rel="noreferrer" aria-label={s.platform}>{SOCIAL[s.platform]}</a></li>
            ))}
          </ul>
        </header>

        <nav className="mbar" aria-label="Sections">
          <div className="mbar-links">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className={section === s.id ? 'active' : ''}>{s.label}</a>
            ))}
          </div>
        </nav>

        <main className="pf-main">
          <section id="about" aria-label="About">
            <p className="lede rise" style={{ '--d': '100ms' }}>{personal.bio}</p>
            <dl className="facts rise" style={{ '--d': '166ms' }}>
              <div><CountUp value="10,000+" /><dd>daily users on the Django services I owned at Taleemabad</dd></div>
              <div><CountUp value="40%" /><dd>lower critical API latency at Taleemabad (Postgres + Redis)</dd></div>
              <div><CountUp value="60%" /><dd>faster incident recovery after I built the Prometheus + Grafana stack</dd></div>
            </dl>
          </section>

          <section id="shipped" aria-labelledby="h-shipped">
            <h2 id="h-shipped" className="eyebrow">Problems I crossed out</h2>
            <div className="cards">
              {problems.map((p, i) => <ProblemCard key={p.name} p={p} i={i} onHover={onCard} />)}
            </div>
            {hunting.length > 0 && (
              <div className="hunting">
                <h3 className="eyebrow"><span className="pulse" aria-hidden="true" />Still open</h3>
                <ul>{hunting.map((h) => <li key={h.text}><a href={h.repo} target="_blank" rel="noreferrer">{h.text} ↗</a></li>)}</ul>
              </div>
            )}
          </section>

          <section id="experience" aria-labelledby="h-exp">
            <h2 id="h-exp" className="eyebrow">Experience</h2>
            <ol className="jobs">
              {experience.map((j, i) => (
                <li key={j.company + j.position} id={`job-${i}`} className="job">
                  <span className="when">{years(j.startDate)} — {j.endDate === 'Present' ? 'now' : years(j.endDate)}</span>
                  <div>
                    <h3>{j.position} <span className="at">· {j.company}</span></h3>
                    <ul>{(j.responsibilities || []).slice(0, i < 2 ? 2 : 1).map((r) => <li key={r}>{r}</li>)}</ul>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section id="writing" aria-labelledby="h-writing">
            <h2 id="h-writing" className="eyebrow">Writing & video</h2>
            <ul className="posts">
              {blogs.slice(0, 4).map((b) => (
                <li key={b.slug}><Link to={`/blog/${b.slug}`}><span>{b.title}</span><span className="arrow" aria-hidden="true">→</span></Link></li>
              ))}
              {(youtube?.channels || []).map((c) => (
                <li key={c.handle}><a href={c.url} target="_blank" rel="noreferrer"><span>{c.name} on YouTube <em>{c.handle}</em></span><span className="arrow" aria-hidden="true">↗</span></a></li>
              ))}
            </ul>
            <Link className="more" to="/blog">All posts →</Link>
          </section>

          <section id="contact" aria-labelledby="h-contact">
            <h2 id="h-contact" className="big">Got a problem worth hunting?</h2>
            <a
              className="mail" href={`mailto:${email}`}
              onMouseEnter={() => { setFocus({ perch: '.mail', say: 'Go on. He reads every one.', mood: 'wink' }); note('pointing at the email'); }}
              onMouseLeave={() => setFocus(null)}
            >{email}</a>
          </section>

          <footer className="pf-foot">Built by Kamal in Islamabad. Kamil watched.</footer>
        </main>
      </div>
    </div>
  );
}

Home.propTypes = { portfolioData: PropTypes.object.isRequired };
