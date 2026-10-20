import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import './ViewSwitch.css';

// One switch on every version of the site: the showcase home, the 3D planet tour, the plain classic page.
const VIEWS = [
  { to: '/', label: 'Home', icon: '✦' },
  { to: '/planet', label: 'Planet', icon: '🪐' },
  { to: '/classic', label: 'Classic', icon: '📄' },
];

export default function ViewSwitch({ inline = false }) {
  const path = useLocation().pathname;
  return (
    <nav className={`view-switch${inline ? ' inline' : ''}`} aria-label="Choose a view">
      {VIEWS.map((v) => {
        const on = path === v.to;
        return (
          <Link key={v.to} to={v.to} className={on ? 'on' : ''} aria-current={on ? 'page' : undefined}>
            <span aria-hidden="true">{v.icon}</span> {v.label}
          </Link>
        );
      })}
    </nav>
  );
}
ViewSwitch.propTypes = { inline: PropTypes.bool };
