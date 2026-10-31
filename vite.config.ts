import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const p = (f: string) => fileURLToPath(new URL(f, import.meta.url));

// Two entry points: the public site (/) and the admin dashboard (/admin/).
export default defineConfig({
  build: {
    rollupOptions: { 
      input: { 
        main: p('./index.html'), 
        admin: p('./admin/index.html'),
        google371dfcce29493672: p('google371dfcce29493672.html')

    } },
  },
  
  server:{
    host: '0.0.0.0',
    allowedHosts: ['elude-washbowl-elixir.ngrok-free.dev']
  }
});
