# Storybook builds and optional publishing

Storybook uses the webpack 5 framework with an explicit Babel transform for JavaScript,
JSX, and TypeScript. It shares the application components, styles, and public assets.
Use Node 24 (`nvm use`) and install the committed dependencies with `npm ci`.

```bash
npm run storybook
npm run storybook:build
npx serve storybook-static -l 6006
```

The production output is `storybook-static/`, which stays ignored by Git. The
`.github/workflows/storybook.yml` workflow builds it on every pull request and push to
`master`. That mandatory build has read-only permissions, requires no secrets, and does
not upload or deploy anything.

## Optional Chromatic upload

Publishing is an explicit local action. Create a Chromatic project linked to this
repository, then provide its project token through your shell's secret manager as
`CHROMATIC_PROJECT_TOKEN`. Do not commit that value or place it in public frontend
configuration. Once the production build has passed and you intend to upload it, run:

```bash
npm run chromatic
```

`chromatic.config.json` sets the build directory and build command. The token identifies
the project; a project ID placeholder is not required. Review visual changes in Chromatic
before accepting them as a baseline. The GitHub workflows do not run this command.

`netlify.toml` remains available for a separately configured hosting project and specifies
Node 24. Any external hosting or automatic deployment must be configured deliberately in
that service; no deployment tokens are used by repository CI.
