# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Faillink is a Belgian bankruptcy monitoring system with a full-stack architecture:
- **Client**: Vue 3 + Vite frontend with TailwindCSS
- **Server**: Node.js Express backend with MongoDB
- **Purpose**: Scrapes Belgian Monitor bankruptcy data, processes enterprise details, and provides analysis

## Development Commands

### Client (Vue 3 Frontend)
```bash
cd client
npm install
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Server (Node.js Backend)
```bash
cd server
npm install
npm start            # Start with nodemon (development)
node server.js       # Direct start (production)
```

## Architecture

### Backend Structure
- **server.js**: Main entry point with Express setup, MongoDB connection, and API routes
- **routes/enterprise.js**: Enterprise-specific API endpoints
- **model/**: Mongoose schemas for BankruptcyBatch, BilanFiling, EnterpriseDetail
- **helpers/**: Utility modules for CBSO API, PDF processing, image analysis, and data extraction
- **dailyScraper.js**: Automated scraping functionality

### Frontend Structure
- **src/router/index.js**: Vue Router configuration with nested routes
- **src/views/**: Main application views (Dashboard, Profile, EnterpriseDetail, etc.)
- **src/components/**: Reusable Vue components (Sidebar, HelloWorld)
- **src/App.vue**: Root component
- Uses TailwindCSS for styling and FontAwesome for icons

### Key Data Models
- **BankruptcyBatch**: Stores scraped bankruptcy data with pagination info
- **EnterpriseDetail**: Enterprise information and financial details
- **BilanFiling**: Financial statement filings with OCR/analysis results

### Core Functionality
1. **Web Scraping**: Extracts BCE/KBO numbers from Belgian Monitor bankruptcy listings
2. **CBSO Integration**: Fetches enterprise data from Belgian company database
3. **PDF Processing**: OCR and AI analysis of financial documents using OpenAI
4. **Image Processing**: PDF to PNG conversion with Cloudinary integration

## Environment Configuration

### Server .env Requirements
```env
MONGO_URI=mongodb://user:pass@host:port/database
DEBUG_SCRAPER=1        # Optional: Enable detailed logging
PORT=3000              # Optional: HTTP server port
```

### Key External Services
- MongoDB for data storage
- OpenAI API for document analysis
- Cloudinary for image processing
- CBSO (Belgian company database) API

## API Endpoints

### Scraping
- `GET /scrape?date=YYYY-MM-DD` - Scrape single date
- `GET /scrape?from=YYYY-MM-DD&to=YYYY-MM-DD` - Scrape date range

### Enterprise Routes
- Located in `routes/enterprise.js` with comprehensive CRUD operations
- Handles enterprise details, financial data, and document processing

## Data Processing Pipeline

1. **Scraping**: Downloads bankruptcy listings from Belgian Monitor
2. **Extraction**: Uses regex to extract BCE/KBO numbers
3. **Enrichment**: Fetches company details from CBSO API
4. **Analysis**: Processes financial documents with OCR and AI
5. **Storage**: Saves structured data to MongoDB

## Technology Stack

### Frontend
- Vue 3 with Composition API (`<script setup>`)
- Vue Router for navigation
- TailwindCSS for styling
- Vite for build tooling

### Backend
- Node.js with ES modules
- Express.js framework
- MongoDB with Mongoose ODM
- Axios for HTTP requests
- Cheerio for HTML parsing
- Day.js for date handling
- PDF processing with pdf-lib and Tesseract.js
- Image processing with Sharp and Canvas