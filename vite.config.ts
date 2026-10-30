import adminHandler from './api/admin';
import journeyHandler from './api/journey';
import raceHandler from "./api/race";
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';
import {loadEnv, type Plugin} from 'vite';
import { PAGES, sitemap, withMeta } from './src/site/meta';
import { LOOK, LOOKS } from './src/site/look';

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
    // The home's first screen in the look it wears (src/site/look.ts): the faces its headline is lettered in, and its
    // page chunk with that chunk's stylesheet. Handed to the route script in index.html, which preloads them on the
    // home page only (the faces on Dervo's page too), so they come down alongside the app instead of after it: without
    // this the name started dropping in a fallback face and jumped when the real one landed. /work, /next and the rest
    // get this file too and don't use them.
    const look = LOOKS[LOOK];
    const font = (re: RegExp) => Object.keys(bundle).find(f => re.test(f));
    const fonts = look.fonts.map(font).filter(Boolean).map(f => JSON.stringify(`/${f}`));
    const home = Object.values(bundle).find(c => c.type === 'chunk' && c.facadeModuleId?.endsWith(look.home));
    if (!home || home.type !== 'chunk') throw new Error(`site-pages: no chunk for ${look.home}`);
    const chunks = [home.fileName, ...home.imports].map(f => JSON.stringify(`/${f}`));
    for (const hole of ['[/* home-fonts */]', '[/* home-chunks */]', "/* home-paper */'#f6f3ec'"]) {
      if (!html.includes(hole)) throw new Error(`site-pages: no ${hole} in index.html`);
    }
    for (const page of PAGES) {
      const source = withMeta(html, page).replace('[/* home-fonts */]', `[${fonts.join(', ')}]`)
        .replace('[/* home-chunks */]', `[${chunks.join(', ')}]`).replace("/* home-paper */'#f6f3ec'", JSON.stringify(look.paper));
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
