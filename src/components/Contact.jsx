import React from 'react';
import { generateCV } from '../services/pdfGenerator';

const Contact = ({ personal, portfolioData }) => {
    if (!personal) return null;

    const handleDownloadCV = () => {
        if (portfolioData) {
            generateCV(portfolioData);
        }
    };

    return (
        <section className="section section-dark" id="contact">
            <div className="container">
                <h2 className="section-title">Get In Touch</h2>
                <div className="contact-content">
                    <p className="contact-text">
                        Feel free to reach out for collaborations or just a friendly chat!
                    </p>

                    <div className="contact-info">
                        <div className="contact-item">
                            <span className="contact-item-icon">📧</span>
                            <span className="contact-item-text">{personal.email}</span>
                        </div>
                        <div className="contact-item">
                            <span className="contact-item-icon">📱</span>
                            <span className="contact-item-text">{personal.phone}</span>
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
