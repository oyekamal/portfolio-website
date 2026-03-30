import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { generateCV } from '../services/pdfGenerator';

const Navigation = ({ portfolioData }) => {
    const location = useLocation();
    const isYouTubePage = location.pathname === '/youtube';
    const isBlogPage = location.pathname.startsWith('/blog');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleDownloadCV = () => {
        if (portfolioData) generateCV(portfolioData);
    };

    const scrollToSection = (sectionId) => {
        if (location.pathname !== '/') {
            window.location.href = `/#${sectionId}`;
        } else {
            document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <nav className={`nav${scrolled ? ' scrolled' : ''}`} id="nav">
            <div className="nav-container">
                <Link to="/" className="nav-logo">
                    {portfolioData?.personal?.brandName || 'portfolio'}
                </Link>
                <ul className="nav-menu">
                    <li><a href="/#home" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>Home</a></li>
                    <li><a href="/#about" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About</a></li>
                    <li><a href="/#experience" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('experience'); }}>Experience</a></li>
                    <li><a href="/#projects" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('projects'); }}>Projects</a></li>
                    <li><a href="/#skills" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('skills'); }}>Skills</a></li>
                    <li><Link to="/blog" className={`nav-link ${isBlogPage ? 'active' : ''}`}>Blog</Link></li>
                    <li><Link to="/youtube" className={`nav-link ${isYouTubePage ? 'active' : ''}`}>YouTube</Link></li>
                    <li><a href="/#contact" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
                </ul>
                <button className="btn" onClick={handleDownloadCV}>
                    Download CV
                </button>
            </div>
        </nav>
    );
};

export default Navigation;
