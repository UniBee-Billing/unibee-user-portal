# Description

Uer portal

# Tools

React, TypeScript, Ant design, Zustand, TailwindCSS, Vite

# Build and deploy

## environment

Define the following env variables in .env file.( .env.local for development, .env.production for production build)

- VITE_API_URL=http://unibee.top/unib
- VITE_STRIPE_PUBLIC_KEY=YOUR_STRIPE_PUBLIC_KEY

## build

```
cd <PROJECT-FOLDER>
yarn add typescript --dev
yarn
yarn dev     // for local development
yarn build   // for production build
```

For dev, open browser to [http://localhost:5173/](http://localhost:5173/)

For production depolyment, the web app files are located under dist/ folder.
