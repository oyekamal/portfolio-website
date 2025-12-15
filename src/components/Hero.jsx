import React from 'react';

const Hero = ({ personal, social }) => {
    if (!personal) return null;

    const socialIcons = {
        github: '💻',
        linkedin: '💼',
        twitter: '🐦',
        globe: '🌐'
    };

    return (
        <section className="hero" id="home">
            <div className="container">
                <div className="hero-content">
                    <div className="hero-text">
                        <div className="hero-greeting">Hello, I'm</div>
                        <h1 className="hero-name">{personal.name}</h1>
                        <p className="hero-title">{personal.title}</p>
                        <p className="hero-bio">{personal.bio}</p>
                        <div className="hero-actions">
                            <a href="#contact" className="btn btn-primary">Get in Touch</a>
                            <a href="#projects" className="btn btn-secondary">View Projects</a>
                        </div>
                        <div className="social-links">
                            {social?.map((link, index) => (
                                <a
                                    key={index}
                                    href={link.url}
                                    className="social-link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={link.platform}
                                >
                                    {socialIcons[link.icon] || '🔗'}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="hero-image">
                        <div className="image-wrapper">
                            <img src={personal.image} alt={personal.name} />
                            <div className="image-glow"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="hero-bg-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>
        </section>
    );
};

export default Hero;
