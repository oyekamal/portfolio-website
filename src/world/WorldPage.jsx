import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import SEO from '../components/SEO';
import ViewSwitch from '../components/ViewSwitch';
import Scene from './Scene';
import { STOPS, byId } from './stops';
import { getBlogsData } from '../services/dataService';
import { generateCV } from '../services/pdfGenerator';
import './world.css';

const STILL = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useCompact() {
  const [c, setC] = useState(() => window.innerWidth < 820);
  useEffect(() => { const f = () => setC(window.innerWidth < 820); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  return c;
}

function useGithubRepos() {
  const [repos, setRepos] = useState([]);
  useEffect(() => {
    fetch('https://api.github.com/users/oyekamal/repos?sort=pushed&per_page=40')
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => setRepos(list.filter((r) => !r.fork && r.description && r.name !== 'oyekamal').slice(0, 12)))
      .catch(() => {});
  }, []);
  return repos;
}

/* ---------- what each place shows ---------- */

function Workshop({ data, repos, pick }) {
  const [open, setOpen] = useState(pick);
  const p = open && data.problems.find((x) => x.name === open);
  return (
    <>
      <h2>Problems he crossed out</h2>
      {p ? (
        <div className="w-detail">
          <button type="button" className="w-back" onClick={() => setOpen(null)}>← All projects</button>
          <p className="w-problem"><em>problem</em> <s>{p.problem}</s></p>
          <h3>{p.name}</h3>
          <img className="w-thumb" src={`https://opengraph.githubassets.com/1/${p.repo.replace('https://github.com/', '')}`} alt={`${p.name} on GitHub`} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <p>{p.fix}</p>
          <p className="w-proof">{p.proof}</p>
          <div className="w-actions">
            <a className="w-btn" href={p.repo} target="_blank" rel="noreferrer">Open on GitHub ↗</a>
            {p.live && <a className="w-btn ghost" href={p.live} target="_blank" rel="noreferrer">Try it live ↗</a>}
          </div>
        </div>
      ) : (
        <ul className="w-list">
          {data.problems.map((x) => (
            <li key={x.name}><button type="button" onClick={() => setOpen(x.name)}>
              <img className="w-mini" src={`https://opengraph.githubassets.com/1/${x.repo.replace('https://github.com/', '')}`} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
              <span className="w-name">{x.name}</span><span className="w-sub">{x.problem}</span><span className="w-proof">{x.proof}</span>
            </button></li>
          ))}
        </ul>
      )}
      {!p && repos.length > 0 && (
        <>
          <h4>More on the workbench <span>(live from GitHub)</span></h4>
          <ul className="w-repos">
            {repos.map((r) => (
              <li key={r.id}><a href={r.html_url} target="_blank" rel="noreferrer"><b>{r.name}</b>{r.stargazers_count > 0 && <i>★{r.stargazers_count}</i>}<span>{r.description}</span></a></li>
            ))}
          </ul>
          <a className="w-more" href="https://github.com/oyekamal" target="_blank" rel="noreferrer">Everything on GitHub ↗</a>
        </>
      )}
    </>
  );
}
Workshop.propTypes = { data: PropTypes.object.isRequired, repos: PropTypes.array.isRequired, pick: PropTypes.string };

function Office({ data }) {
  const yr = (s) => s?.match(/\d{4}/)?.[0];
  return (
    <>
      <h2>Where he worked</h2>
      <ol className="w-jobs">
        {data.experience.map((j) => (
          <li key={j.company + j.position}>
            <span className="w-when">{yr(j.startDate)}–{j.endDate === 'Present' ? 'now' : yr(j.endDate)}</span>
            <details><summary><b>{j.position}</b> <span className="w-at">{j.company}</span></summary><p>{j.responsibilities?.[0]}</p></details>
          </li>
        ))}
      </ol>
      <div className="w-facts">
        <div><b>10,000+</b><span>daily users on his Django services</span></div>
        <div><b>40%</b><span>lower API latency</span></div>
        <div><b>60%</b><span>faster incident recovery</span></div>
      </div>
    </>
  );
}
Office.propTypes = { data: PropTypes.object.isRequired };

function Tower({ data, blogs }) {
  const yt = data.youtube?.channels || [];
  const social = data.social || [];
  return (
    <>
      <h2>His channels</h2>
      <ul className="w-channels">
        {yt.map((c) => <li key={c.handle}><a href={c.url} target="_blank" rel="noreferrer"><b>▶ {c.name}</b><span>{c.description}</span></a></li>)}
      </ul>
      <ul className="w-socials">
        {social.filter((s) => ['LinkedIn', 'Instagram', 'X (Twitter)', 'GitHub'].includes(s.platform)).map((s) => (
          <li key={s.platform}><a href={s.url} target="_blank" rel="noreferrer">{s.platform.replace(' (Twitter)', '')} ↗</a></li>
        ))}
      </ul>
      {blogs.length > 0 && (
        <>
          <h4>Latest posts</h4>
          <ul className="w-posts">{blogs.slice(0, 4).map((b) => <li key={b.slug}><Link to={`/blog/${b.slug}`}>{b.title} →</Link></li>)}</ul>
        </>
      )}
    </>
  );
}
Tower.propTypes = { data: PropTypes.object.isRequired, blogs: PropTypes.array.isRequired };

function Greenhouse({ data }) {
  return (
    <>
      <h2>Still growing</h2>
      <p className="w-lede">Problems he&apos;s working on right now. They aren&apos;t solved yet.</p>
      <ul className="w-channels">
        {(data.hunting || []).map((h) => <li key={h.text}><a href={h.repo} target="_blank" rel="noreferrer"><b>🌱 {h.text}</b><span>{h.repo.replace('https://github.com/', '')}</span></a></li>)}
      </ul>
      <p className="w-lede">Got a problem that keeps tripping you up? That&apos;s exactly what he hunts.</p>
    </>
  );
}
Greenhouse.propTypes = { data: PropTypes.object.isRequired };

function Post({ data }) {
  const p = data.personal || {};
  const wa = (data.social || []).find((s) => s.platform === 'WhatsApp');
  return (
    <>
      <h2>Let&apos;s connect</h2>
      <p className="w-lede">Open to AI-automation projects and R&amp;D problems worth solving.</p>
      <div className="w-actions col">
        <a className="w-btn" href={`mailto:${p.email}`}>✉ {p.email}</a>
        {wa && <a className="w-btn ghost" href={wa.url} target="_blank" rel="noreferrer">WhatsApp ↗</a>}
        <button type="button" className="w-btn ghost" onClick={() => generateCV(data)}>Download CV ↓</button>
      </div>
      <h4>Or find him here</h4>
      <ul className="w-socials">
        {(data.social || []).filter((x) => ['GitHub', 'LinkedIn', 'X (Twitter)', 'Instagram', 'YouTube'].includes(x.platform)).map((x) => (
          <li key={x.platform}><a href={x.url} target="_blank" rel="noreferrer">{x.platform.replace(' (Twitter)', '')} ↗</a></li>
        ))}
      </ul>
    </>
  );
}
Post.propTypes = { data: PropTypes.object.isRequired };

/* ---------- page ---------- */

export default function WorldPage({ portfolioData: data }) {
  const [phase, setPhase] = useState('landing');  // landing | diving | planet
  const [stop, setStop] = useState(null);
  const [pick, setPick] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const repos = useGithubRepos();
  const compact = useCompact();
  const p = data.personal || {};

  useEffect(() => { getBlogsData().then((d) => setBlogs(d.blogs || [])).catch(() => {}); }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && phase === 'planet') setStop(null); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  const visit = (id) => {
    if (phase === 'landing') {
      setPhase('diving');
      setTimeout(() => { setPhase('planet'); setStop(id); }, STILL ? 0 : 1100);
    } else setStop(id);
  };

  const here = stop && byId[stop];
  const say = phase === 'landing'
    ? "Oh! A visitor! I'm Kamil, Kamal's AI agent. Where can I take you?"
    : here ? here.hello : 'Pick a place, or spin the planet. I know where everything is!';

  return (
    <div className={`world phase-${phase}${here ? ' has-stop' : ''}`}>
      <SEO
        title="Muhammad Kamal · R&D Engineer, Problem Hunter"
        description={p.tagline}
        name="Muhammad Kamal"
        keywords="Muhammad Kamal, oykamal, oyekamal, R&D Engineer, AI agents, Claude Code, Python, Django, AWS, Islamabad"
      />
      <div className="w-sky" aria-hidden="true">
        <div className="w-sun" />
        <div className="w-hills">
          <svg viewBox="0 0 1440 300" preserveAspectRatio="none"><path d="M0 170 C160 110 300 150 420 120 C560 85 700 160 860 130 C1010 100 1150 60 1300 110 C1370 132 1410 120 1440 112 L1440 300 L0 300Z" fill="#b37fb0" opacity=".55" /></svg>
          <svg viewBox="0 0 1440 300" preserveAspectRatio="none"><path d="M0 220 C140 190 260 230 400 205 C560 176 660 240 820 214 C980 188 1120 160 1260 196 C1340 216 1400 210 1440 202 L1440 300 L0 300Z" fill="#8a6aa8" opacity=".65" /></svg>
        </div>
      </div>

      <div className="w-canvas" aria-hidden="true">
        <Canvas shadows camera={{ position: compact ? [0, 14, 52] : [-11, 3, 50], fov: 35 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
          <Suspense fallback={null}>
            <Scene phase={phase} stop={stop} onStop={visit} data={data} compact={compact} />
          </Suspense>
        </Canvas>
      </div>

      {phase === 'diving' && (
        <div className="w-dive" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => <i key={i} style={{ '--a': `${i * 40}deg`, '--d': `${(i % 3) * 60}ms` }} />)}
        </div>
      )}

      <ViewSwitch />
      <header className="w-top">
        <button type="button" className="w-home" onClick={() => { setPhase('landing'); setStop(null); }}>Muhammad Kamal</button>
      </header>

      {phase === 'landing' && (
        <section className="w-landing">
          <p className="w-eyebrow">Islamabad · Tinkering R&amp;D at Taleemabad</p>
          <h1>{p.name}</h1>
          <p className="w-role">{p.title}</p>
          <p className="w-tag">{p.tagline}</p>
          <p className="w-stack">{(p.stack || []).join(' · ')}</p>
          <button type="button" className="w-cta" onClick={() => visit('workshop')}>Take the tour with Kamil <span aria-hidden="true">→</span></button>
          <ul className="w-flagship" aria-label="Flagship projects">
            {(data.problems || []).slice(0, 3).map((x) => (
              <li key={x.name}><button type="button" onClick={() => { setPick(x.name); visit('workshop'); }}>
                <b>{x.name}</b><span>{x.proof}</span>
              </button></li>
            ))}
          </ul>
          <p className="w-proofline">{(data.problems || []).length} problems shipped · 10,000+ daily users served · 5 years of backend</p>
        </section>
      )}

      {/* Kamil talks; the choices are always his question's answers */}
      <div className="w-guide" role="region" aria-label="Kamil, your guide">
        <p className="w-say" key={say} aria-live="polite"><b>Kamil</b>{say}</p>
        <nav className="w-chips" aria-label="Places">
          {STOPS.map((s) => (
            <button key={s.id} type="button" className={stop === s.id ? 'on' : ''} onClick={() => visit(s.id)}>
              <span aria-hidden="true">{s.icon}</span>{phase === 'landing' ? s.chip : s.name}
            </button>
          ))}
        </nav>
      </div>

      {here && phase === 'planet' && (
        <aside className="w-panel" key={stop} aria-label={here.name}>
          <button type="button" className="w-close" onClick={() => setStop(null)} aria-label="Close">×</button>
          <p className="w-place"><span aria-hidden="true">{here.icon}</span> {here.name}</p>
          {stop === 'workshop' && <Workshop data={data} repos={repos} pick={pick} />}
          {stop === 'office' && <Office data={data} />}
          {stop === 'tower' && <Tower data={data} blogs={blogs} />}
          {stop === 'greenhouse' && <Greenhouse data={data} />}
          {stop === 'post' && <Post data={data} />}
          <button type="button" className="w-next" onClick={() => visit(here.next)}>
            Next: {byId[here.next].icon} {byId[here.next].name} →
          </button>
        </aside>
      )}
    </div>
  );
}

WorldPage.propTypes = { portfolioData: PropTypes.object.isRequired };
