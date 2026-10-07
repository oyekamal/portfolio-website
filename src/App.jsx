import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navigation from './components/Navigation';
import Home from './pages/Home';
const WorldPage = lazy(() => import('./world/WorldPage'));
import YouTubePage from './pages/YouTubePage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import { getPortfolioData } from './services/dataService';
import './App.css';

// The redesigned home page draws its own chrome; other pages keep the old nav + footer.
function Chrome({ portfolioData, children }) {
  const home = ['/', '/classic'].includes(useLocation().pathname);
  return (
    <>
      {!home && <Navigation portfolioData={portfolioData} />}
      {children}
      {!home && (
        <footer className="footer">
          <div className="container">
            <p>© {new Date().getFullYear()} {portfolioData.personal?.name}</p>
          </div>
        </footer>
      )}
    </>
  );
}

function App() {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch portfolio data from GitHub (with local fallback)
    getPortfolioData()
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
    <HelmetProvider>
      <Router>
        <div className="App">
          <Chrome portfolioData={portfolioData}>
          <Routes>
            <Route path="/" element={<Suspense fallback={<div className="world-loading" />}><WorldPage portfolioData={portfolioData} /></Suspense>} />
            <Route path="/classic" element={<Home portfolioData={portfolioData} />} />
            <Route path="/youtube" element={<YouTubePage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
          </Routes>
          </Chrome>
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;
