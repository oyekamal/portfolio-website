---
title: Portfolio Website Architecture
tags:
  - architecture
  - portfolio-website
---

# Portfolio Website Architecture

## Stack
- **Frontend Framework**: React + Vite
- **Styling**: TailwindCSS
- **Data Source**: JSON (portfolio.json, blogs.json in portfolio-data repo)
- **Build Tool**: Vite
- **Deployment**: Static hosting (AWS S3 + CloudFront or similar)

## Key Components
- **Portfolio Showcase** — Projects, skills, experience display
- **Blog System** — Blog listing, post detail views
- **Contact Page** — Contact form integration
- **Resume** — Downloadable CV
- **Navigation** — Responsive header and footer

## Data Flow
1. Build process fetches portfolio.json and blogs.json from portfolio-data repo
2. JSON data passed to React components as props
3. Components render portfolio, blog posts, skills
4. Static output generated for deployment

## Directory Structure
- `src/components/` — React components
- `src/pages/` — Page components
- `public/` — Static assets
- `.env` — Environment configuration

## Deployment
- Built files output to `dist/`
- Deployed to static hosting (S3 + CloudFront)
- Data updates via portfolio-data repository

See [[project]] for more details.
