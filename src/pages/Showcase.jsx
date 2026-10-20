import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import SEO from '../components/SEO';
import { generateCV } from '../services/pdfGenerator';
import './Showcase.css';

// The five apps, all submitted to Google Play (in review as of Oct 2026). Copy is each app's own store short description.
const APPS = [
  { id: 'urdu', name: 'Urdu Qaida', sub: 'Learn to Read Urdu', blurb: 'Urdu alphabet for kids: hear, trace and read Alif Bay Pay.', tags: ['Offline', 'No ads', 'Ages 5+'], tint: '#2c8c7c' },
  { id: 'soundout', name: 'Sound Out', sub: 'Read English', blurb: 'Phonics with Tilo the capybara. Learn to read English from the first sound.', tags: ['Offline', 'No ads', 'Phonics'], tint: '#2f6f9b' },
  { id: 'cookling', name: 'Cookling', sub: 'Learn to cook', blurb: 'Learn to cook step by step. 19 food types, easy to hard.', tags: ['Offline', 'No ads', 'Halal'], tint: '#5a48d6' },
  { id: 'ektap', name: 'Ek Tap', sub: '12 one-tap games', blurb: '12 offline one-tap games. Hold, release, tap. Kite cutting, chai pouring, kabaddi.', tags: ['Offline', '12 games', 'Godot'], tint: '#e25a4a' },
  { id: 'runner', name: 'Islamabad Runner', sub: 'Endless runner', blurb: 'Dodge containers and rangers on a lockdown day. Ride through Islamabad to D-Chowk.', tags: ['3D', 'Three.js', 'Satire'], tint: '#2a86d8' },
];

const FILMS = [
  { id: 'popup', title: 'The Garden Book', kind: 'Pop-up book film', how: 'three.js, cut paper, code-made score', len: '0:45', feature: true },
  { id: 'runner', title: 'Islamabad Runner', kind: 'Launch trailer', how: 'Hyperframes + real gameplay', len: '0:20' },
  { id: 'nightroof', title: 'Night Roof', kind: 'Anime short', how: 'HTML + GSAP, cel style', len: '0:08' },
  { id: 'synctoon', title: 'Ustani', kind: 'Lip-sync animation', how: 'Synctoon, my 2D lip-sync tool', len: '0:17' },
  { id: 'urdu', title: 'Urdu Qaida', kind: 'App launch video', how: 'Built from the app’s real UI', len: '0:20' },
  { id: 'screencoach', title: 'Screen Coach', kind: 'Product explainer', how: 'Hyperframes', len: '0:21' },
];

const STILL = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Reveals a block once it scrolls into view. Content is visible by default; the class only adds the entrance.
function useReveal() {
  useEffect(() => {
    if (STILL) return undefined;
    const els = document.querySelectorAll('.sc [data-reveal]');
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => { el.classList.add('pre'); io.observe(el); });
    return () => io.disconnect();
  }, []);
}

function Phone({ app, i }) {
  const [shot, setShot] = useState(0);
  useEffect(() => {
    if (STILL) return undefined;
    let id;
    const start = setTimeout(() => { id = setInterval(() => setShot((s) => (s + 1) % 3), 3200); }, i * 640);
    return () => { clearTimeout(start); clearInterval(id); };
  }, [i]);
  return (
    <div className="sc-phone" style={{ '--tint': app.tint }}>
      <div className="sc-phone-screen">
        {[1, 2, 3].map((n) => (
          <img key={n} src={`/apps/${app.id}/s${n}.webp`} alt={n === 1 ? `${app.name} screenshot` : ''} loading="lazy" className={shot === n - 1 ? 'on' : ''} />
        ))}
      </div>
    </div>
  );
}
Phone.propTypes = { app: PropTypes.object.isRequired, i: PropTypes.number.isRequired };

function FilmTile({ f, onOpen }) {
  const v = useRef(null);
  const play = () => { if (!STILL && v.current) { v.current.currentTime = 0; v.current.play().catch(() => {}); } };
  const stop = () => v.current?.pause();
  return (
    <button type="button" className={`sc-film${f.feature ? ' sc-feature' : ''}`} onClick={() => onOpen(f)} onMouseEnter={play} onMouseLeave={stop} onFocus={play} onBlur={stop}>
      <span className="sc-film-media">
        <img src={`/films/${f.id}.webp`} alt="" loading="lazy" />
        <video ref={v} src={`/films/${f.id}.mp4`} muted playsInline loop preload="none" aria-hidden="true" />
        <span className="sc-film-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" /></svg></span>
        <span className="sc-film-len">{f.len}</span>
      </span>
      <span className="sc-film-cap">
        <span className="sc-film-kind">{f.kind}</span>
        <span className="sc-film-title">{f.title}</span>
        <span className="sc-film-how">{f.how}</span>
      </span>
    </button>
  );
}
FilmTile.propTypes = { f: PropTypes.object.isRequired, onOpen: PropTypes.func.isRequired };

export default function Showcase({ portfolioData }) {
  const { personal = {}, social = [], experience = [], problems = [], hunting = [] } = portfolioData;
  const [open, setOpen] = useState(null);
  const dlg = useRef(null);
  useReveal();
  // The old global body colour is light paper; paint the page edge dark while this page is shown.
  useEffect(() => { const r = document.documentElement, prev = r.style.background; r.style.background = '#0d1014'; return () => { r.style.background = prev; }; }, []);
  useEffect(() => { if (open) dlg.current?.showModal(); }, [open]);
  const close = () => { dlg.current?.close(); setOpen(null); };
  const link = (p) => social.find((s) => s.platform.startsWith(p))?.url;
  const wa = social.find((s) => s.platform === 'WhatsApp')?.url;
  const email = personal.email || 'oyekamalkhan@gmail.com';

  return (
    <div className="sc">
      <SEO
        title="Muhammad Kamal · Apps, films and AI agents"
        description="R&D engineer in Islamabad. Five apps in review on Google Play, films made entirely in code, and Kamil, an AI agent that runs real work."
        name="Muhammad Kamal"
        type="website"
      />
      <header className="sc-top">
        <div className="sc-wrap sc-top-in">
          <a href="#top" className="sc-mark">Muhammad Kamal</a>
          <nav aria-label="Sections">
            <a href="#apps">Apps</a><a href="#films">Films</a><a href="#work">Work</a><a href="#contact">Contact</a>
          </nav>
          <Link to="/planet" className="sc-tour">3D tour <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <main id="top">
        <section className="sc-hero sc-wrap">
          <div className="sc-hero-copy">
            <p className="sc-eyebrow"><span className="sc-dot" aria-hidden="true" />R&amp;D engineer · Islamabad · open to AI-automation work</p>
            <h1>I build apps, films and&nbsp;AI&nbsp;agents.</h1>
            <p className="sc-lede">Five apps on their way to Google Play. Films where every frame is drawn by code. And Kamil, the AI agent that runs my busywork across Slack, Notion and GitHub.</p>
            <div className="sc-ctas">
              <a href="#apps" className="sc-btn sc-primary">See the apps</a>
              <button type="button" className="sc-btn sc-ghost" onClick={() => setOpen({ id: 'popup', title: 'The Garden Book', kind: 'Pop-up book film', how: 'three.js, cut paper, code-made score', len: '0:45' })}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg> Watch a film
              </button>
            </div>
          </div>
          <figure className="sc-reel">
            <div className="sc-reel-frame">
              <video src="/films/reel.mp4" poster="/films/reel.webp" autoPlay={!STILL} muted loop playsInline aria-label="Showreel of films and apps made by Muhammad Kamal" />
            </div>
            <figcaption><span>Showreel</span><span>0:14 · every frame made in code</span></figcaption>
          </figure>
        </section>

        <section className="sc-facts sc-wrap" aria-label="In numbers" data-reveal>
          <div><b>5</b><span>apps in review on Google Play</span></div>
          <div><b>6</b><span>films made in code</span></div>
          <div><b>{problems.length || 6}</b><span>open-source tools shipped</span></div>
          <div><b>10,000+</b><span>daily users on the backends I owned</span></div>
        </section>

        <section id="apps" className="sc-block sc-wrap" aria-labelledby="h-apps">
          <div className="sc-block-head" data-reveal>
            <p className="sc-kicker">01 · Apps</p>
            <h2 id="h-apps">Five apps for the phones people here actually own.</h2>
            <p className="sc-pill-row"><span className="sc-pill"><span className="sc-dot sc-amber" aria-hidden="true" />In review on Google Play</span></p>
            <p className="sc-block-note">Small downloads, cheap phones, patchy internet. The learning apps run fully offline with no ads.</p>
          </div>
          <ul className="sc-apps">
            {APPS.map((a, i) => (
              <li key={a.id} className="sc-app" style={{ '--tint': a.tint }} data-reveal>
                <Phone app={a} i={i} />
                <div className="sc-app-meta">
                  <img src={`/apps/${a.id}/icon.webp`} alt="" width="48" height="48" className="sc-app-icon" />
                  <div>
                    <h3>{a.name}</h3>
                    <p className="sc-app-sub">{a.sub}</p>
                  </div>
                </div>
                <p className="sc-app-blurb">{a.blurb}</p>
                <p className="sc-app-tags">{a.tags.map((t) => <span key={t}>{t}</span>)}</p>
              </li>
            ))}
          </ul>
          <p className="sc-swipe" aria-hidden="true">Swipe to see all five →</p>
        </section>

        <section id="films" className="sc-block sc-wrap" aria-labelledby="h-films">
          <div className="sc-block-head" data-reveal>
            <p className="sc-kicker">02 · Films</p>
            <h2 id="h-films">Films with no camera and no stock footage.</h2>
            <p className="sc-block-note">Each one is a program: a page that draws frame <i>t</i>, rendered in a headless browser, scored and mixed in code. Hover to preview, click to watch with sound.</p>
          </div>
          <div className="sc-films" data-reveal>
            {FILMS.map((f) => <FilmTile key={f.id} f={f} onOpen={setOpen} />)}
          </div>
        </section>

        <section id="work" className="sc-block sc-wrap" aria-labelledby="h-work">
          <div className="sc-block-head" data-reveal>
            <p className="sc-kicker">03 · Shipped</p>
            <h2 id="h-work">Problems I crossed out.</h2>
          </div>
          <ul className="sc-probs">
            {problems.map((p) => (
              <li key={p.name} data-reveal>
                <a href={p.live || p.repo} target="_blank" rel="noreferrer" className="sc-prob">
                  <span className="sc-prob-problem"><s>{p.problem}</s></span>
                  <span className="sc-prob-name">{p.name}<span aria-hidden="true">{'\u00a0'}↗</span></span>
                  <span className="sc-prob-fix">{p.fix}</span>
                  <span className="sc-prob-proof">{p.proof}</span>
                </a>
              </li>
            ))}
          </ul>
          {hunting.length > 0 && (
            <p className="sc-hunting" data-reveal>Hunting now: {hunting.map((h, i) => <span key={h.text}>{i > 0 && ' · '}<a href={h.repo} target="_blank" rel="noreferrer">{h.text}</a></span>)}</p>
          )}
        </section>

        <section className="sc-block sc-wrap sc-exp" aria-labelledby="h-exp">
          <div className="sc-block-head" data-reveal>
            <p className="sc-kicker">04 · Experience</p>
            <h2 id="h-exp">Five years of backend before R&amp;D.</h2>
            <p className="sc-block-note">Django on AWS for 10,000+ daily users, payments at Paymob, and the incident tooling that cut recovery time by 60%.</p>
          </div>
          <ol className="sc-jobs" data-reveal>
            {experience.map((j) => (
              <li key={j.company + j.startDate}>
                <span className="sc-job-when">{j.startDate} – {j.endDate}</span>
                <span className="sc-job-what"><b>{j.company}</b> {j.position}</span>
              </li>
            ))}
          </ol>
        </section>

        <section id="contact" className="sc-contact sc-wrap" aria-labelledby="h-contact" data-reveal>
          <p className="sc-kicker">05 · Contact</p>
          <h2 id="h-contact">Got a problem worth hunting?</h2>
          <p className="sc-lede">I take on AI-automation and agent projects: Claude-powered agents that run real operations.</p>
          <div className="sc-ctas">
            {wa && <a className="sc-btn sc-primary" href={wa} target="_blank" rel="noreferrer">Message on WhatsApp</a>}
            <a className="sc-btn sc-ghost" href={`mailto:${email}`}>{email}</a>
            <button type="button" className="sc-btn sc-ghost" onClick={() => generateCV(portfolioData)}>Download CV</button>
          </div>
          <p className="sc-socials">
            {[['GitHub', link('GitHub')], ['LinkedIn', link('LinkedIn')], ['YouTube', link('YouTube')], ['Instagram', link('Instagram')], ['X', link('X')]].filter(([, u]) => u).map(([n, u]) => <a key={n} href={u} target="_blank" rel="noreferrer">{n}</a>)}
          </p>
        </section>
      </main>

      <footer className="sc-foot sc-wrap">
        <span>© {new Date().getFullYear()} Muhammad Kamal</span>
        <span><Link to="/planet">Kamal’s Planet, a 3D tour</Link> · <Link to="/classic">Classic page</Link> · <Link to="/blog">Writing</Link></span>
      </footer>

      <dialog ref={dlg} className="sc-viewer" onClose={() => setOpen(null)} onClick={(e) => e.target === dlg.current && close()} aria-label={open ? open.title : 'Film'}>
        {open && (
          <div className="sc-viewer-in">
            <video src={`/films/${open.id}.mp4`} poster={`/films/${open.id}.webp`} controls autoPlay playsInline />
            <div className="sc-viewer-cap"><span><b>{open.title}</b> · {open.kind}</span><button type="button" onClick={close} className="sc-btn sc-ghost sc-small">Close</button></div>
          </div>
        )}
      </dialog>
    </div>
  );
}
Showcase.propTypes = { portfolioData: PropTypes.object.isRequired };
