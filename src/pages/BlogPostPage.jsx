import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getBlogBySlug, getBlogsData } from '../services/dataService';
import './BlogPostPage.css';

function BlogPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getBlogBySlug(slug),
      getBlogsData()
    ])
      .then(([foundPost, data]) => {
        if (foundPost) {
          setPost(foundPost);
          
          // Get related posts (same category, exclude current)
          const related = data.blogs
            .filter(blog => blog.category === foundPost.category && blog.slug !== slug)
            .slice(0, 3);
          setRelatedPosts(related);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading blog post:', error);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    // Scroll to top when post changes
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="blog-post-page loading">
        <div className="container">
          <div className="loader"></div>
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="blog-post-page not-found">
        <div className="container">
          <h1>404 - Article Not Found</h1>
          <p>The article you're looking for doesn't exist.</p>
          <Link to="/blog" className="back-btn">← Back to Blog</Link>
        </div>
      </div>
    );
  }

  const publishDate = new Date(post.publishDate);
  const formattedDate = publishDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.description,
    "image": post.seo.ogImage || post.image,
    "datePublished": post.publishDate,
    "dateModified": post.lastModified,
    "author": {
      "@type": "Person",
      "name": post.author,
      "url": "https://oykamal.netlify.app"
    },
    "publisher": {
      "@type": "Person",
      "name": "Muhammad Kamal",
      "url": "https://oykamal.netlify.app"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": post.seo.canonicalUrl
    },
    "keywords": post.seo.keywords.join(', '),
    "articleSection": post.category,
    "wordCount": typeof post.content === 'string' ? post.content.split(' ').length : 
                 (post.content.introduction?.split(' ').length || 0) + 
                 (post.content.sections?.reduce((acc, s) => acc + s.content.split(' ').length, 0) || 0) +
                 (post.content.conclusion?.split(' ').length || 0)
  };

  return (
    <>
      <Helmet>
        <title>{post.seo.metaTitle}</title>
        <meta name="description" content={post.seo.metaDescription} />
        <meta name="keywords" content={post.seo.keywords.join(', ')} />
        <link rel="canonical" href={post.seo.canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.seo.metaTitle} />
        <meta property="og:description" content={post.seo.metaDescription} />
        <meta property="og:image" content={post.seo.ogImage} />
        <meta property="og:url" content={post.seo.canonicalUrl} />
        <meta property="article:published_time" content={post.publishDate} />
        <meta property="article:modified_time" content={post.lastModified} />
        <meta property="article:author" content={post.author} />
        <meta property="article:section" content={post.category} />
        {post.tags.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.seo.metaTitle} />
        <meta name="twitter:description" content={post.seo.metaDescription} />
        <meta name="twitter:image" content={post.seo.ogImage} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <article className="blog-post-page" itemScope itemType="https://schema.org/BlogPosting">
        <div className="container">
          {/* Breadcrumb Navigation */}
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="separator">/</span>
            <Link to="/blog">Blog</Link>
            <span className="separator">/</span>
            <span className="current">{post.category}</span>
          </nav>

          {/* Article Header */}
          <header className="article-header">
            <div className="article-meta-top">
              <span className="category">{post.category}</span>
              <span className="read-time">{post.readTime}</span>
            </div>
            
            <h1 itemProp="headline">{post.title}</h1>
            
            <div className="article-info">
              <div className="author-info">
                <div className="author-avatar">
                  <img 
                    src="https://ui-avatars.com/api/?name=Muhammad+Kamal&size=80&background=60a5fa&color=ffffff" 
                    alt={post.author}
                  />
                </div>
                <div className="author-details">
                  <span className="author-name" itemProp="author">{post.author}</span>
                  <div className="date-info">
                    <time dateTime={post.publishDate} itemProp="datePublished">
                      Published on {formattedDate}
                    </time>
                    {post.publishDate !== post.lastModified && (
                      <time dateTime={post.lastModified} itemProp="dateModified">
                        • Updated {new Date(post.lastModified).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </time>
                    )}
                  </div>
                </div>
              </div>

              <div className="share-buttons">
                <button 
                  onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(post.seo.canonicalUrl)}`, '_blank')}
                  className="share-btn twitter"
                  aria-label="Share on Twitter"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button 
                  onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(post.seo.canonicalUrl)}`, '_blank')}
                  className="share-btn linkedin"
                  aria-label="Share on LinkedIn"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(post.seo.canonicalUrl);
                    alert('Link copied to clipboard!');
                  }}
                  className="share-btn copy"
                  aria-label="Copy link"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="article-tags">
              {post.tags.map((tag, index) => (
                <span key={index} className="tag" itemProp="keywords">#{tag}</span>
              ))}
            </div>
          </header>

          {/* Featured Image */}
          <div className="featured-image">
            <img src={post.image} alt={post.title} itemProp="image" />
          </div>

          {/* Article Content */}
          <div className="article-content" itemProp="articleBody">
            <div className="excerpt-highlight">
              <p>{post.excerpt}</p>
            </div>

            {/* Main Content */}
            <div className="content-body">
              {typeof post.content === 'string' ? (
                <p className="introduction">{post.content}</p>
              ) : (
                <>
                  {/* Introduction */}
                  {post.content.introduction && (
                    <p className="introduction">{post.content.introduction}</p>
                  )}

                  {/* Content Sections */}
                  {post.content.sections && post.content.sections.map((section, index) => (
                    <div key={index} className="content-section">
                      <h2>{section.heading}</h2>
                      <p>{section.content}</p>
                    </div>
                  ))}

                  {/* Key Takeaways */}
                  {post.content.keyTakeaways && post.content.keyTakeaways.length > 0 && (
                    <div className="key-takeaways">
                      <h2>Key Takeaways</h2>
                      <ul>
                        {post.content.keyTakeaways.map((takeaway, index) => (
                          <li key={index}>{takeaway}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Conclusion */}
                  {post.content.conclusion && (
                    <div className="conclusion">
                      <h2>Conclusion</h2>
                      <p>{post.content.conclusion}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Article Footer */}
            <div className="article-footer">
              <div className="article-cta">
                <h3>Found this helpful?</h3>
                <p>Share it with others who might benefit from this knowledge!</p>
                <div className="share-buttons-footer">
                  <button 
                    onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(post.seo.canonicalUrl)}`, '_blank')}
                    className="share-btn twitter"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Share on Twitter
                  </button>
                  <button 
                    onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(post.seo.canonicalUrl)}`, '_blank')}
                    className="share-btn linkedin"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    Share on LinkedIn
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <aside className="related-posts">
              <h2>Related Articles</h2>
              <div className="related-grid">
                {relatedPosts.map(related => (
                  <Link 
                    key={related.id} 
                    to={`/blog/${related.slug}`}
                    className="related-card"
                  >
                    <div className="related-image">
                      <img src={related.image} alt={related.title} loading="lazy" />
                    </div>
                    <div className="related-content">
                      <span className="category">{related.category}</span>
                      <h3>{related.title}</h3>
                      <p>{related.excerpt}</p>
                      <span className="read-more">Read More →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </aside>
          )}

          {/* Newsletter CTA */}
          <div className="newsletter-cta">
            <h3>📬 Get More Content Like This</h3>
            <p>Subscribe to receive the latest articles on backend engineering and tech insights.</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" required />
              <button type="submit">Subscribe</button>
            </form>
            <p className="privacy-note">No spam. Unsubscribe anytime.</p>
          </div>

          {/* Back to Blog */}
          <div className="back-to-blog">
            <Link to="/blog" className="back-btn">
              ← Back to All Articles
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}

export default BlogPostPage;
