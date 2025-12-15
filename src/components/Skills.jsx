import React from 'react';

const Skills = ({ skills }) => {
    if (!skills) return null;

    return (
        <section className="section section-dark" id="skills">
            <div className="container">
                <h2 className="section-title">Skills & Technologies</h2>
                <div className="skills-container">
                    {skills.technical && skills.technical.length > 0 && (
                        <div className="skills-category">
                            <h3 className="skills-category-title">Technical Skills</h3>
                            <div className="skills-grid">
                                {skills.technical.map((skill, index) => (
                                    <span key={index} className="skill-tag">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {skills.soft && skills.soft.length > 0 && (
                        <div className="skills-category">
                            <h3 className="skills-category-title">Soft Skills</h3>
                            <div className="skills-grid">
                                {skills.soft.map((skill, index) => (
                                    <span key={index} className="skill-tag">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Skills;
