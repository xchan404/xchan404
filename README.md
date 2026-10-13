# anime-gh-profile

Vanilla JS + Vite. No backend. Data: GitHub public REST API (unauthenticated).

## Run
    npm install
    npm run dev        # http://localhost:5173

## Build
    npm run build      # static files in dist/
    npm run preview

Set the username in `src/config.js`. Deploy `dist/` to GitHub Pages, Netlify, or Cloudflare Pages.

## Limits
- Unauthenticated API: 60 requests/hour per IP. Responses are cached in sessionStorage for 30 minutes.
- Contribution calendar is not in the REST API (see roadmap, phase 2).
