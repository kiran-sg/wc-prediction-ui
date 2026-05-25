# World Cup 2026 Prediction App - Frontend

Angular SPA for the World Cup prediction contest. Mobile-first, responsive design.

## Tech Stack

- Angular 21, TypeScript 5.9
- Angular Material 21
- Standalone components, lazy-loaded routes
- SCSS

## Quick Start

```bash
npm install
ng serve
```

App runs on `http://localhost:4200`

## Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | LoginComponent | User ID authentication |
| `/home` | HomeComponent | Match list (open/locked status) |
| `/predict/:matchId` | PredictComponent | Prediction form (5 categories) |
| `/leaderboard` | LeaderboardComponent | Ranked points table |
| `/admin` | AdminComponent | Enter match results (admin only) |

## Prediction Form Fields

1. **Match Result** — Radio: Team A Win / Draw / Team B Win
2. **Exact Score** — Two number inputs (goals)
3. **First Goalscorer** — Dropdown (players + "No Goal")
4. **Winning Goalscorer** — Dropdown (players + "No Winning Goal (Draw)")
5. **Player of the Match** — Dropdown (all players from both teams)

## Mobile Optimizations

- Viewport locked (`maximum-scale=1, user-scalable=no`)
- `-webkit-overflow-scrolling: touch` for smooth scrolling
- `touch-action: manipulation` on interactive elements
- Sticky navbar
- Cards with press feedback (`transform: scale(0.98)`)
- Bottom padding for thumb-friendly scrolling
- No horizontal overflow

## Security

- Auth guard on all routes (redirects to `/login`)
- Session stored in `sessionStorage` (cleared on tab close)
- XSRF token configured for API calls
- No sensitive data in localStorage
- Input validation (maxlength, min/max on number fields)

## Project Structure

```
src/app/
├── components/
│   ├── login/          # Login page
│   ├── home/           # Match list
│   ├── predict/        # Prediction form
│   ├── leaderboard/    # Points ranking
│   ├── admin/          # Result entry (admin)
│   └── navbar/         # Top navigation
├── services/
│   ├── auth.service.ts # Login/logout, user state
│   └── api.service.ts  # All HTTP calls
├── guards/
│   └── auth.guard.ts   # Route protection
├── models/
│   └── models.ts       # TypeScript interfaces
├── app.config.ts       # Providers
└── app.routes.ts       # Lazy-loaded routes
```

## Environment

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

## Build & Deploy

```bash
# Production build
ng build

# Output in dist/wc-prediction-ui/
# Deploy to any static hosting (Nginx, S3, Firebase Hosting, etc.)
```

## Docker

```bash
docker build -t wc-prediction-ui .
docker run -p 80:80 wc-prediction-ui
```

Uses Nginx to serve the built app and proxy API requests.
