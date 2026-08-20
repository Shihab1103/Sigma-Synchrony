# Signmaging — Document Counter

A static, no-build web app for generating client documents. `index.html` is a
small "counter" hub that opens either tool in-place:

| Tool | File | What it's for |
|---|---|---|
| **GING** · Quotation Builder | `quotation.html` | Priced line items, discounts, amount-in-words, print-ready quotation sheet |
| **HURI** · চালান মেকার (Chalan Maker) | `chalan.html` | Weight-based items, discount, Bengali amount-in-words, one-page চালান |

Everything is self-contained HTML/CSS/JS (fonts are pulled from Google Fonts
at runtime) — there is no build step and no server-side code, so it can be
hosted from any static file host.

## File structure

```
.
├── index.html                  # entry point — the tool picker/hub
├── quotation.html               # GING quotation builder
├── chalan.html                  # HURI chalan maker
├── manifest.webmanifest         # PWA manifest (installable, app icon)
├── favicon.ico
├── icons/
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-512-maskable.png
├── 404.html                     # redirects unknown paths back to index.html
├── robots.txt
└── .nojekyll                    # tells GitHub Pages to skip Jekyll processing
```

The app icon set above is generated from the Signmaging Σ mark, used across
the favicon, the home-screen/PWA icon, and the browser tab icon.

## Deploying to GitHub Pages

1. Create a new GitHub repository (public, or private on a plan that
   supports Pages) and push the contents of this folder to its root —
   don't nest it inside a subfolder:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: Signmaging document hub"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Pick the `main` branch and the `/ (root)` folder, then **Save**.
5. GitHub will publish the site at
   `https://<your-username>.github.io/<your-repo>/` within a minute or two.

No further configuration is needed — the app has no server dependency, no
API keys, and no environment variables.

## Local preview

Because the hub page loads the two tools in an `<iframe>`, opening
`index.html` directly via `file://` will work in most browsers, but if your
browser blocks local iframe navigation, serve the folder over HTTP instead:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Notes

- `index.html`, `quotation.html`, and `chalan.html` were consolidated from
  the original working files (previously `index-9.html`, `Signmaging_final.html`,
  and the standalone `index.html`) so their filenames match the routing the
  hub's JavaScript already expects (`quotation.html` / `chalan.html`).
- All three pages now share the same favicon/icon `<link>` tags; only
  `index.html` links the web manifest, since it's the installable entry point.
