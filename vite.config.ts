import adminHandler from './api/admin';
import journeyHandler from './api/journey';
import raceHandler from "./api/race";
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';
import {loadEnv, type Plugin} from 'vite';
import { PAGES, sitemap, withMeta } from './src/site/meta';

/** Writes a copy of index.html for every page of the site with its own title, description, address and picture
 *  (src/site/meta.ts), the not-found page the host serves for unknown addresses, and the sitemap. */
const sitePages = (): Plugin => ({
  name: 'site-pages',
  apply: 'build',
  enforce: 'post',
  generateBundle(_, bundle) {
    const index = bundle['index.html'];
    if (!index || index.type !== 'asset') throw new Error('site-pages: no index.html in the build');
    const html = String(index.source);
    // The home's faces for its first screen (the headline's serif, Alegreya, roman and its italic, and Hanken), handed
    // to the route script in index.html, which preloads them on the home page only: /work, /next and the rest get
    // this file too and don't use them.
    const font = (re: RegExp) => Object.keys(bundle).find(f => re.test(f));
    const fonts = [/alegreya-latin-400-normal-[\w-]+\.woff2$/, /alegreya-latin-400-italic-[\w-]+\.woff2$/,
      /hanken-grotesk-latin-wght-normal-[\w-]+\.woff2$/].map(font).filter(Boolean).map(f => JSON.stringify(`/${f}`));
    if (!html.includes('[/* home-fonts */]')) throw new Error('site-pages: no home-fonts list in index.html');
    for (const page of PAGES) {
      const source = withMeta(html, page).replace('[/* home-fonts */]', `[${fonts.join(', ')}]`);
      if (page.file === 'index.html') index.source = source;
      else this.emitFile({ type: 'asset', fileName: page.file, source });
    }
    this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap() });
  },
});

export default defineConfig(({mode})=>{
  const local=loadEnv(mode,process.cwd(),'');
  for(const key of ['RACE_KV_REST_API_URL','RACE_KV_REST_API_TOKEN','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','KV_REST_API_URL','KV_REST_API_TOKEN']){
    if(local[key]&&!process.env[key])process.env[key]=local[key];
  }
  return {
  plugins: [react(), tailwindcss(), sitePages(), {name:"local-race-api",configureServer(server){server.middlewares.use("/api/race",raceHandler);server.middlewares.use("/api/admin",adminHandler);server.middlewares.use("/api/journey",journeyHandler);},configurePreviewServer(server){server.middlewares.use("/api/race",raceHandler);server.middlewares.use("/api/admin",adminHandler);server.middlewares.use("/api/journey",journeyHandler);}}],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    globals: true,
    css: false,
    passWithNoTests: true,
  },
};
});
