import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import SEO from '../components/SEO';
import KamilFace from '../components/KamilFace';
import { getBlogsData } from '../services/dataService';
import { generateCV } from '../services/pdfGenerator';
import './Home.css';

const SECTIONS = [
  { id: 'about', label: 'About', mood: 'idle' },
  { id: 'shipped', label: 'Shipped', mood: 'curious' },
  { id: 'experience', label: 'Experience', mood: 'focus' },
  { id: 'writing', label: 'Writing', mood: 'reading' },
  { id: 'contact', label: 'Contact', mood: 'happy' },
];

const FEELING = {
  greeting: 'saying hi', idle: 'watching the page', curious: 'curious', cheeky: 'feeling cheeky',
  proud: 'a bit proud', thinking: 'thinking hard', happy: 'happy', focus: 'focused', wink: 'winking',
  sleepy: 'dozing off. move the mouse', reading: 'reading',
};

const SOCIAL = { GitHub: 'GitHub', LinkedIn: 'LinkedIn', 'X (Twitter)': 'X', YouTube: 'YouTube', Instagram: 'Instagram' };

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

function ProblemCard({ p, onMood }) {
  const ref = useRef(null);
  const struck = useInView(ref, STRIKE_OPTS);
  return (
    <article ref={ref} className={`card${struck ? ' is-struck' : ''}`}
      onMouseEnter={() => onMood(p.mood)} onMouseLeave={() => onMood(null)}>
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
ProblemCard.propTypes = { p: PropTypes.object.isRequired, onMood: PropTypes.func.isRequired };

export default function Home({ portfolioData }) {
  const { personal = {}, social = [], experience = [], problems = [], hunting = [], youtube } = portfolioData;
  const [section, setSection] = useState('about');
  const [hover, setHover] = useState(null);
  const [mood, setMoodRaw] = useState('greeting');
  const [blogs, setBlogs] = useState([]);
  const idle = useRef(null);

  useEffect(() => { getBlogsData().then((d) => setBlogs(d.blogs || [])).catch(() => {}); }, []);

  // Greet once, then follow the section in view; hovering a card overrides.
  useEffect(() => { const t = setTimeout(() => setMoodRaw(null), 2600); return () => clearTimeout(t); }, []);
  const shown = hover || mood || SECTIONS.find((s) => s.id === section)?.mood || 'idle';

  // Doze after 25s of no input.
  useEffect(() => {
    const wake = () => {
      clearTimeout(idle.current);
      setMoodRaw((m) => (m === 'sleepy' ? null : m));
      idle.current = setTimeout(() => setMoodRaw('sleepy'), 25000);
    };
    wake();
    const evs = ['mousemove', 'keydown', 'scroll', 'touchstart'];
    evs.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    return () => { clearTimeout(idle.current); evs.forEach((e) => window.removeEventListener(e, wake)); };
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setSection(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  // Kamil's face leans toward the cursor, so he looks at whatever you're looking at.
  const screen = useRef(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const look = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = screen.current; if (!el) return;
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
        el.style.setProperty('--lx', Math.max(-1, Math.min(1, dx * 2)).toFixed(3));
        el.style.setProperty('--ly', Math.max(-1, Math.min(1, dy * 2)).toFixed(3));
      });
    };
    window.addEventListener('pointermove', look, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointermove', look); };
  }, []);

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

      <div className="pf-grid">
        <header className="pf-side">
          <div className="side-top">
            <h1 className="name">{personal.name}</h1>
            <p className="role">{personal.title}</p>
            <p className="tagline">{personal.tagline}</p>
            <p className="stack">Python · Django · AWS · AI agents <span className="open"><span className="live-dot" aria-hidden="true" />Open to AI-automation projects</span></p>

            <figure className="kamil" ref={screen}>
              <div className="kamil-face-wrap"><KamilFace mood={shown} /></div>
              <figcaption className="kamil-status">
                <span className="live-dot" aria-hidden="true" />
                <span>kamil<span className="dim"> · my AI agent</span></span>
                <span className="kamil-feel" aria-live="polite">{FEELING[shown] || shown}</span>
              </figcaption>
            </figure>

            <nav className="side-nav" aria-label="Sections">
              {SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`} className={section === s.id ? 'active' : ''}>
                  <span className="tick" aria-hidden="true" />{s.label}
                  {s.id === 'shipped' && <sup>{problems.length}</sup>}
                </a>
              ))}
            </nav>
          </div>

          <ul className="socials">
            <li><button type="button" className="cv" onClick={() => generateCV(portfolioData)}>Download CV ↓</button></li>
            {social.filter((s) => SOCIAL[s.platform]).map((s) => (
              <li key={s.platform}><a href={s.url} target="_blank" rel="noreferrer" aria-label={s.platform}>{SOCIAL[s.platform]}</a></li>
            ))}
          </ul>
        </header>

        <nav className="mbar" aria-label="Sections">
          <span className="mbar-name">Muhammad Kamal</span>
          <div className="mbar-links">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className={section === s.id ? 'active' : ''}>{s.label}</a>
            ))}
          </div>
        </nav>

        <main className="pf-main">
          <section id="about" aria-label="About">
            <p className="lede">{personal.bio}</p>
            <dl className="facts">
              <div><dt>10,000+</dt><dd>daily users on the Django services I owned at Taleemabad</dd></div>
              <div><dt>40%</dt><dd>lower critical API latency at Taleemabad (Postgres + Redis)</dd></div>
              <div><dt>60%</dt><dd>faster incident recovery after I built the Prometheus + Grafana stack</dd></div>
            </dl>
          </section>

          <section id="shipped" aria-labelledby="h-shipped">
            <h2 id="h-shipped" className="eyebrow">Problems I crossed out</h2>
            <div className="cards">
              {problems.map((p) => <ProblemCard key={p.name} p={p} onMood={setHover} />)}
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
                <li key={j.company + j.position} className="job">
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
            <a className="mail" href={`mailto:${email}`} onMouseEnter={() => setHover('wink')} onMouseLeave={() => setHover(null)}>{email}</a>
          </section>

          <footer className="pf-foot">Built by Kamal in Islamabad. Kamil watched.</footer>
        </main>
      </div>
    </div>
  );
}

Home.propTypes = { portfolioData: PropTypes.object.isRequired };
