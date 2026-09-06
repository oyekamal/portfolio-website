import React from 'react';
import { generateCV } from '../services/pdfGenerator';

const Contact = ({ personal, portfolioData }) => {
    if (!personal) return null;

    const handleDownloadCV = () => {
        if (portfolioData) {
            generateCV(portfolioData);
        }
    };

    // ponytail: number falls back to phone digits so old JSON without `whatsapp` still works
    const waNumber = personal.whatsapp || (personal.phone || '').replace(/\D/g, '');
    const waText = encodeURIComponent(
        personal.whatsappMessage || 'Hi Kamal, I want to talk about AI automation / agentic workflows.'
    );
    const waUrl = `https://wa.me/${waNumber}?text=${waText}`;
    const instagram = 'https://instagram.com/kamalkecoding';

    return (
        <section className="section section-dark" id="contact" aria-labelledby="contact-title">
            <div className="container">
                <h2 id="contact-title" className="section-title">Work With Me on AI Automation</h2>
                <div className="contact-content">
                    <p className="contact-text">
                        I build agentic workflows that run real operations: Claude-powered agents wired into
                        Slack, Notion, GitHub, WhatsApp and your backend. If you or your company want to
                        automate a process, ship an AI agent, or just talk through an idea, message me
                        directly on WhatsApp or Instagram. I reply personally.
                    </p>

                    <div className="contact-cta">
                        <a href={waUrl} className="btn btn-primary btn-large" target="_blank" rel="noopener noreferrer">
                            <span className="btn-icon">💬</span>
                            Message me on WhatsApp
                        </a>
                        <a href={instagram} className="btn btn-secondary btn-large" target="_blank" rel="noopener noreferrer">
                            <span className="btn-icon">📸</span>
                            Instagram @kamalkecoding
                        </a>
                    </div>

                    <div className="contact-info">
                        <div className="contact-item">
                            <span className="contact-item-icon">📧</span>
                            <a href={`mailto:${personal.email}`} className="contact-item-text">{personal.email}</a>
                        </div>
                        <div className="contact-item">
                            <span className="contact-item-icon">📱</span>
                            <a href={`tel:${personal.phone}`} className="contact-item-text">{personal.phone}</a>
                        </div>
                        <div className="contact-item">
                            <span className="contact-item-icon">📍</span>
                            <span className="contact-item-text">{personal.location}</span>
                        </div>
                    </div>

                    <button className="btn btn-primary btn-large" onClick={handleDownloadCV}>
                        <span className="btn-icon">📄</span>
                        Download My CV
                    </button>
                </div>
            </div>
        </section>
    );
};

export default Contact;
