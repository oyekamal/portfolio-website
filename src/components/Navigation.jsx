import React from 'react';
import { generateCV } from '../services/pdfGenerator';

const Navigation = ({ portfolioData }) => {
    const handleDownloadCV = () => {
        if (portfolioData) {
            generateCV(portfolioData);
        }
    };

    return (
        <nav className="nav" id="nav">
            <div className="nav-container">
                <div className="nav-logo">Portfolio</div>
                <ul className="nav-menu">
                    <li><a href="#home" className="nav-link">Home</a></li>
                    <li><a href="#about" className="nav-link">About</a></li>
                    <li><a href="#experience" className="nav-link">Experience</a></li>
                    <li><a href="#projects" className="nav-link">Projects</a></li>
                    <li><a href="#skills" className="nav-link">Skills</a></li>
                    <li><a href="#education" className="nav-link">Education</a></li>
                    <li><a href="#contact" className="nav-link">Contact</a></li>
                </ul>
                <button className="btn btn-primary" onClick={handleDownloadCV}>
                    <span className="btn-icon">📄</span>
                    Download CV
                </button>
            </div>
        </nav>
    );
};

export default Navigation;
