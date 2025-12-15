# Portfolio Website with Dynamic JSON Data & PDF CV Generation

A modern, fully responsive React portfolio website that dynamically loads all content from a JSON file and generates professional PDF CVs on demand.

![Portfolio Screenshot](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite)
![jsPDF](https://img.shields.io/badge/jsPDF-2.5-blue?style=for-the-badge)

## ✨ Features

- 🎨 **Modern Design** - Dark theme with glassmorphism effects and smooth animations
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile
- 📄 **PDF CV Generation** - Download professional CV with one click (client-side)
- 🔄 **Dynamic Content** - All content loaded from a single JSON file
- ⚡ **Fast Performance** - Built with Vite for lightning-fast development and builds
- 🎯 **Component-Based** - Modular React components for easy customization
- 🌈 **Beautiful Animations** - Hover effects, floating shapes, and gradient accents

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone or navigate to the project directory
cd portfolio-website

# Install dependencies
npm install

# Start development server
npm run dev
```

The site will be available at `http://localhost:5173/`

### Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` folder.

## 📁 Project Structure

```
portfolio-website/
├── public/
│   └── data/
│       └── portfolio.json      # 🎯 Edit this file with your data!
├── src/
│   ├── components/             # React components
│   │   ├── Navigation.jsx
│   │   ├── Hero.jsx
│   │   ├── About.jsx
│   │   ├── Experience.jsx
│   │   ├── Projects.jsx
│   │   ├── Skills.jsx
│   │   ├── Education.jsx
│   │   └── Contact.jsx
│   ├── services/
│   │   └── pdfGenerator.js    # PDF CV generation logic
│   ├── App.jsx                # Main application
│   ├── App.css                # Complete styling
│   └── main.jsx               # Entry point
└── package.json
```

## 📝 Customization Guide

### Step 1: Update Your Data

Edit `public/data/portfolio.json` with your personal information:

```json
{
  "personal": {
    "name": "Your Name",
    "title": "Your Professional Title",
    "email": "your.email@example.com",
    "phone": "+1 (555) 123-4567",
    "location": "Your City, State",
    "bio": "Your professional bio...",
    "image": "URL to your profile image"
  },
  "social": [
    { "platform": "GitHub", "url": "https://github.com/yourusername", "icon": "github" },
    { "platform": "LinkedIn", "url": "https://linkedin.com/in/yourusername", "icon": "linkedin" }
  ],
  "experience": [...],
  "skills": {...},
  "projects": [...],
  "education": [...],
  "certifications": [...]
}
```

### Step 2: Customize Colors (Optional)

Edit CSS variables in `src/App.css`:

```css
:root {
  --primary: #6366f1;      /* Primary color (Indigo) */
  --secondary: #ec4899;    /* Secondary color (Pink) */
  --accent: #14b8a6;       /* Accent color (Teal) */
}
```

### Step 3: Add/Remove Sections (Optional)

Components are modular. Simply comment out sections in `src/App.jsx` you don't need.

## 🎨 Sections Included

1. **Hero** - Name, title, bio, and social links
2. **About** - Professional summary
3. **Experience** - Work history with timeline
4. **Projects** - Featured projects with links
5. **Skills** - Technical and soft skills
6. **Education** - Degrees and certifications
7. **Contact** - Contact information with CV download

## 📄 PDF CV Generation

The CV is generated entirely on the client-side using jsPDF:

- Professional formatting with sections
- Includes all your data from JSON
- Downloads as `[Your_Name]_CV.pdf`
- Click "Download CV" button in navigation or contact section

## 🛠️ Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool
- **jsPDF** - PDF generation
- **jsPDF-AutoTable** - Table formatting for PDF
- **Modern CSS** - Glassmorphism, gradients, animations

## 🌐 Deployment

This is a static site that can be deployed to:

- **Vercel**: `vercel deploy`
- **Netlify**: Drag and drop the `dist` folder
- **GitHub Pages**: Use `gh-pages` branch
- **Any static hosting service**

## 📚 JSON Data Structure

The `portfolio.json` file contains all your portfolio data:

- `personal` - Name, title, contact info, bio, image
- `social` - Social media links
- `experience` - Work history with responsibilities
- `skills` - Technical and soft skills
- `projects` - Featured projects with technologies and links
- `education` - Degrees and institutions
- `certifications` - Professional certifications

See the example file for the complete structure.

## 🎯 Key Features Explained

### How JSON Loading Works

The app fetches `portfolio.json` on mount and populates all sections:

```javascript
fetch('/data/portfolio.json')
  .then(response => response.json())
  .then(data => setPortfolioData(data));
```

### How PDF Generation Works

Click the "Download CV" button to trigger `pdfGenerator.js`:

```javascript
import { generateCV } from './services/pdfGenerator';

// In component
<button onClick={() => generateCV(portfolioData)}>
  Download CV
</button>
```

The PDF includes:
- Header with name and contact
- Professional summary
- Experience with details
- Education and certifications
- Skills sections

## 🤝 Contributing

Feel free to fork this project and customize it for your own use!

## 📄 License

This project is open source and available for personal and commercial use.

## 🙏 Acknowledgments

Built with modern web technologies and best practices for portfolio websites.

---

**Made with ❤️ using React + Vite**
