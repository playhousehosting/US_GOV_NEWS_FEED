hub
# US Government News Feed

A modern web application that aggregates and displays news and documents from various U.S. government sources.

## Features

### Data Sources
- RSS Feeds from GovInfo.gov
  - Presidential Communications
  - Public and Private Laws
  - Public Laws
  - Federal Regulations
  - Budget Documents (with PREMIS metadata)
- Federal Register
  - Executive Orders
  - Public Inspection Documents

### Interface
- Real-time search
- Category filtering
- Type-based filtering
- Chronological sorting
- Mobile responsive
- Document metadata display

## Tech Stack
- Vue 3 + TypeScript
- Pinia for state management
- Serverless functions
- XML metadata parsing

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment
Create `.env`:
```
VITE_API_URL=your_api_url_here
```

## License
MIT
