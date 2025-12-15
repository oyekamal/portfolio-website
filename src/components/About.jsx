import React from 'react';

const About = ({ bio }) => {
    if (!bio) return null;

    return (
        <section className="section" id="about">
            <div className="container">
                <h2 className="section-title">About Me</h2>
                <div className="about-content">
                    <p className="about-text">{bio}</p>
                </div>
            </div>
        </section>
    );
};

export default About;
