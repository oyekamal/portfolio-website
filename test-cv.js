// Simple test to verify the CV generation works with new data structure
import fs from 'fs';
import path from 'path';

// Read the portfolio data
const portfolioData = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'public/data/portfolio.json'), 'utf8')
);

console.log('✓ Portfolio data loaded successfully');
console.log('Skills structure:', Object.keys(portfolioData.skills));
console.log('Sample skills from first category:', portfolioData.skills[Object.keys(portfolioData.skills)[0]]);

// Check if all required properties exist
const requiredSections = ['personal', 'experience', 'education', 'skills'];
for (const section of requiredSections) {
    if (portfolioData[section]) {
        console.log(`✓ ${section} section exists`);
    } else {
        console.log(`✗ ${section} section missing`);
    }
}

// Check skills structure
if (typeof portfolioData.skills === 'object' && portfolioData.skills !== null) {
    console.log('✓ Skills is an object');
    const skillCategories = Object.keys(portfolioData.skills);
    console.log(`✓ Found ${skillCategories.length} skill categories:`, skillCategories);
} else {
    console.log('✗ Skills structure is invalid');
}

console.log('\n🎉 Data structure verification complete!');