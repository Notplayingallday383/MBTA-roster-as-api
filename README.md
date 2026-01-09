# MBTA-roster-as-api

Converts the plain HTML page of the MBTA Roster hosted on transithistory.org to a REST API you can use in your apps.

## Features

- **Automatic Caching**: Prevents excessive requests to the source website
- **Multiple Transit Modes**: Support for all MBTA rapid transit lines, and commuter rail
- **JSON API**: Clean, structured JSON responses
- **Easy to Use**: Simple REST endpoints for each transit line

## API Endpoints

### Root
- `GET /` - Returns API status and available endpoints

### Transit Lines
- `GET /api/bl` - Blue Line fleet data
- `GET /api/ol` - Orange Line fleet data
- `GET /api/rl` - Red Line fleet data
- `GET /api/gl` - Green Line fleet data (includes Mattapan-Ashmont line)
- `GET /api/cr` - Commuter Rail fleet data
- `GET /api/all` - Combined data for all transit modes

## Response Format examples

### Commuter Rail (`/api/ol`)
```json
{
  "source": "http://roster.transithistory.org/",
  "active": {
    "total": 144,
    "series": {
      "#14": 144
    }
  },
  "outOfService": {
    "total": 8,
    "series": {
      "#14": 8
    }
  }
}
```

### Green Line (`/api/gl`)
```json
{
  "source": "http://roster.transithistory.org/",
  "active": {
    "total": 184,
    "types": {
      "Type 7": 84,
      "Type 8": 76,
      "Type 9": 24
    }
  },
  "outOfService": {
    "total": 37,
    "types": {
      "Type 7": 19,
      "Type 8": 18
    }
  },
  "mattapan": {
    "total": 10,
    "pccCars": 10,
    "inService": 7,
    "outOfService": 3
  }
}
```

### Commuter Rail (`/api/cr`)
```json
{
  "source": "http://roster.transithistory.org/",
  "coaches": {
    "active": 505,
    "onOrder": 80
  }
}
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

## Usage

### Development
```bash
npx tsx serve.ts
```

### Production
```bash
pnpm run build
node dist/serve.js
```

The server will start on `http://localhost:3000` by default. You can change the port by setting the `PORT` environment variable.

## Environment Variables

- `PORT` - Server port (default: 3000)

## Data Source

Data is sourced from [NETransit MBTA Vehicle Inventory](http://roster.transithistory.org/) maintained by Jonathan Belcher.

## License

Apache-2.0

