# Setup

1. Create a public repo named exactly like your username (`xchan404/xchan404`) and push these files to `main`.
2. Repo Settings > Actions > General > Workflow permissions: choose "Read and write".
3. Actions tab > "Update profile" > Run workflow. It writes `assets/*.svg` and `README.md`, then repeats daily.
4. Contribution graph: if it shows "unavailable", add a repo secret named `PROFILE_TOKEN` (a token with `read:user`) and re-run.

Local run (optional): `GH_USER=xchan404 GH_TOKEN=... node scripts/generate.mjs` (Node 20+).

Edit the text in `README.template.md` and the tagline/limits at the top of `scripts/generate.mjs`.
To use the anime look in light mode too, delete the `<source>` line inside each `<picture>` block.
