# Belgian Monitor Scraper - "Fin" Section

A Node.js microservice that scrapes BCE/KBO numbers from the Belgian Monitor's "Fin" (bankruptcy) section and stores them in MongoDB.

## Features

- **Scrapes** Belgian Monitor's "Fin" section for BCE/KBO numbers
- **Follows pagination** automatically to get all results
- **Stores data** in MongoDB with timestamps
- **REST API** for on-demand scraping
- **Date range support** for bulk operations

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Configuration

Create a `.env` file in the root directory:

```env
MONGO_URI=mongodb://<user>:<pass>@<host>:<port>/<database>

# Optional: Enable detailed logging
DEBUG_SCRAPER=1
```

### 3. Start the Service

```bash
node server.js
```

Expected console output:
```
⇢ MongoDB connected
⇢ Bankruptcy scraper API on http://localhost:3000
```

## API Usage

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /scrape?date=YYYY-MM-DD` | Scrape a single date |
| `GET /scrape?from=YYYY-MM-DD&to=YYYY-MM-DD` | Scrape a date range |
| Add `&debug=1` | Enable verbose logging |

### Examples

```bash
# Scrape single date
curl "http://localhost:3000/scrape?date=2025-07-01"

# Scrape date range with debug
curl "http://localhost:3000/scrape?from=2025-07-01&to=2025-07-03&debug=1"
```

### Response Format

```json
{
  "from": "2025-07-01",
  "to": "2025-07-01",
  "countDistinct": 100,
  "countRaw": 100,
  "pages": [
    {
      "page": 1,
      "count": 100,
      "list": ["0741749847", "0422221119", "..."]
    }
  ]
}
```

## How It Works

1. **HTTP Request**: Client calls `/scrape` with date parameters
2. **Web Scraping**: Service downloads pages from `list.pl`, extracts BCE/KBO numbers using regex
3. **Pagination**: Automatically follows "Next" links until all pages are processed
4. **Data Processing**: 
   - Normalizes numbers with zero-padding (10 digits)
   - Counts distinct vs raw numbers
5. **Storage**: Saves results to MongoDB collection `BankruptcyBatch`
6. **Response**: Returns JSON with all scraped data

## Data Storage

Each scraping operation creates a document in MongoDB with:
- Date range information
- Page-by-page results
- Total counts (distinct and raw)
- Timestamp and source metadata

## Configuration Options

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | Required |
| `DEBUG_SCRAPER` | Enable detailed logging | Optional |
| `PORT` | HTTP server port | 3000 |

## Development Notes

- Built with ES modules (`"type": "module"` in package.json)
- No automatic scheduling - scraping is on-demand only
- Uses regex pattern `\d{3,4}\.\d{3}\.\d{3}` for BCE/KBO extraction
- Handles pagination automatically

## Requirements

- Node.js (ES modules support)
- MongoDB instance
- Network access to Belgian Monitor website

## Error Handling

The service includes error handling for:
- Network connectivity issues
- MongoDB connection problems
- Invalid date parameters
- Scraping failures
