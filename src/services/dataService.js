/**
 * Data Service for fetching data from GitHub repository
 * This allows updating content without redeploying the website
 */

// GitHub raw content base URL
// Replace with your actual GitHub repo URL
// Format: https://raw.githubusercontent.com/USERNAME/REPO_NAME/BRANCH_NAME/
const GITHUB_RAW_BASE_URL = import.meta.env.VITE_GITHUB_DATA_URL || 
  'https://raw.githubusercontent.com/oyekamal/portfolio-data/main/';

// Fallback to local files if GitHub fetch fails
const LOCAL_FALLBACK = true;

/**
 * Fetches data from GitHub with fallback to local files
 * @param {string} filename - Name of the JSON file to fetch
 * @returns {Promise<Object>} - Parsed JSON data
 */
async function fetchFromGitHub(filename) {
  try {
    const githubUrl = `${GITHUB_RAW_BASE_URL}${filename}`;
    console.log(`Fetching ${filename} from GitHub:`, githubUrl);
    
    const response = await fetch(githubUrl);
    
    if (!response.ok) {
      throw new Error(`GitHub fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✓ Successfully loaded ${filename} from GitHub`);
    return data;
  } catch (error) {
    console.warn(`Failed to fetch ${filename} from GitHub:`, error.message);
    
    if (LOCAL_FALLBACK) {
      console.log(`Attempting to load ${filename} from local fallback...`);
      const localResponse = await fetch(`/data/${filename}`);
      
      if (!localResponse.ok) {
        throw new Error(`Both GitHub and local fetch failed for ${filename}`);
      }
      
      const data = await localResponse.json();
      console.log(`✓ Successfully loaded ${filename} from local fallback`);
      return data;
    }
    
    throw error;
  }
}

/**
 * Get portfolio data
 * @returns {Promise<Object>} - Portfolio data object
 */
export async function getPortfolioData() {
  return fetchFromGitHub('portfolio.json');
}

/**
 * Get blogs data
 * @returns {Promise<Object>} - Blogs data object with blogs array and categories
 */
export async function getBlogsData() {
  return fetchFromGitHub('blogs.json');
}

/**
 * Get a single blog post by slug
 * @param {string} slug - Blog post slug
 * @returns {Promise<Object|null>} - Blog post object or null if not found
 */
export async function getBlogBySlug(slug) {
  const data = await getBlogsData();
  const blog = data.blogs?.find(b => b.slug === slug);
  return blog || null;
}

/**
 * Fetch raw markdown content for a blog post
 * @param {string} contentFile - Relative path like "posts/slug.md"
 * @returns {Promise<string>} - Raw markdown string
 */
export async function fetchMarkdownPost(contentFile) {
  const url = `${GITHUB_RAW_BASE_URL}${contentFile}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch markdown: ${response.status}`);
  return response.text();
}

/**
 * Prefetch all data for better performance
 * @returns {Promise<Object>} - Object containing all data
 */
export async function prefetchAllData() {
  try {
    const [portfolio, blogs] = await Promise.all([
      getPortfolioData(),
      getBlogsData()
    ]);
    
    return { portfolio, blogs };
  } catch (error) {
    console.error('Error prefetching data:', error);
    throw error;
  }
}
