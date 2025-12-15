import React from 'react';

const Education = ({ education, certifications }) => {
    if (!education || education.length === 0) return null;

    return (
        <section className="section" id="education">
            <div className="container">
                <h2 className="section-title">Education & Certifications</h2>

                <div className="education-grid">
                    {education.map((edu, index) => (
                        <div key={index} className="education-card">
                            <h3 className="education-degree">{edu.degree}</h3>
                            <p className="education-institution">{edu.institution}</p>
                            <p className="education-meta">
                                {edu.location} • {edu.startDate} - {edu.endDate}
                            </p>
                            {edu.details && (
                                <p className="education-details">{edu.details}</p>
                            )}
                        </div>
                    ))}
                </div>

                {certifications && certifications.length > 0 && (
                    <div className="certifications">
                        <h3 className="certifications-title">Certifications</h3>
                        <div className="certifications-list">
                            {certifications.map((cert, index) => (
                                <div key={index} className="certification-item">
                                    {cert}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Education;
