import raceHandler from "./api/race";
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';
import {loadEnv} from 'vite';

export default defineConfig(({mode})=>{
  const local=loadEnv(mode,process.cwd(),'');
  for(const key of ['RACE_KV_REST_API_URL','RACE_KV_REST_API_TOKEN','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','KV_REST_API_URL','KV_REST_API_TOKEN']){
    if(local[key]&&!process.env[key])process.env[key]=local[key];
  }
  return {
  plugins: [react(), tailwindcss(), {name:"local-race-api",configureServer(server){server.middlewares.use("/api/race",raceHandler);},configurePreviewServer(server){server.middlewares.use("/api/race",raceHandler);}}],
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
