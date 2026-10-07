import { Link, useLocation } from 'react-router-dom';
import './ViewSwitch.css';

// One switch, same place on both versions: the 3D planet tour or the plain classic page.
export default function ViewSwitch() {
  const classic = useLocation().pathname === '/classic';
  return (
    <nav className="view-switch" aria-label="Choose a view">
      <Link to="/" className={classic ? '' : 'on'} aria-current={classic ? undefined : 'page'}>
        <span aria-hidden="true">🪐</span> Planet
      </Link>
      <Link to="/classic" className={classic ? 'on' : ''} aria-current={classic ? 'page' : undefined}>
        <span aria-hidden="true">📄</span> Classic
      </Link>
    </nav>
  );
}
