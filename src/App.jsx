import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import About from './components/About';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Education from './components/Education';
import Contact from './components/Contact';
import './App.css';

function App() {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch portfolio data from JSON file
    fetch('/data/portfolio.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load portfolio data');
        }
        return response.json();
      })
      .then(data => {
        setPortfolioData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading portfolio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h1>Error Loading Portfolio</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!portfolioData) return null;

  return (
    <div className="App">
      <Navigation portfolioData={portfolioData} />
      <Hero
        personal={portfolioData.personal}
        social={portfolioData.social}
      />
      <About bio={portfolioData.personal?.bio} />
      <Experience experience={portfolioData.experience} />
      <Projects projects={portfolioData.projects} />
      <Skills skills={portfolioData.skills} />
      <Education
        education={portfolioData.education}
        certifications={portfolioData.certifications}
      />
      <Contact
        personal={portfolioData.personal}
        portfolioData={portfolioData}
      />

      <footer className="footer">
        <div className="container">
          <p>© 2024 {portfolioData.personal?.name}. Built with ❤️ using React</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
