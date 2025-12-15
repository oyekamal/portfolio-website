import React from 'react';

const Experience = ({ experience }) => {
    if (!experience || experience.length === 0) return null;

    return (
        <section className="section section-dark" id="experience">
            <div className="container">
                <h2 className="section-title">Professional Experience</h2>
                <div className="timeline">
                    {experience.map((exp, index) => (
                        <div key={index} className="timeline-item">
                            <div className="timeline-content">
                                <div className="timeline-header">
                                    <h3 className="timeline-company">{exp.company}</h3>
                                    <p className="timeline-position">{exp.position}</p>
                                    <p className="timeline-meta">
                                        {exp.location} • {exp.startDate} - {exp.endDate}
                                    </p>
                                </div>
                                <ul className="timeline-responsibilities">
                                    {exp.responsibilities.map((resp, idx) => (
                                        <li key={idx}>{resp}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Experience;
