# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Vercel Deployment

This project is configured for deployment on Vercel with the existing `package.json` build script and `vercel.json` settings.

Steps:

1. Push this repository to GitHub (or another supported Git provider).
2. Log in to Vercel and import the repository.
3. If Vercel does not auto-detect the project, use:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy the project.

Security notes:

- Do not commit secrets or API keys to the repository.
- Store any required environment variables only via Vercel Project Settings > Environment Variables.
- This app is a static frontend, so no server-side secrets are needed for deployment.
