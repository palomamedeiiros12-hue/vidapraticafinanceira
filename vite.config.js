import { defineConfig } from 'vite';

export default defineConfig({
  base: '/vidapraticafinanceira/',
  server: {
    port: 5173,
    host: '0.0.0.0'
  },
  preview: {
    port: 4173,
    host: '0.0.0.0'
  },
  build: {
    rollupOptions: {
      input: [
        'index.html',
        'login.html',
        'cadastro.html',
        'dashboard.html',
        'financeiro.html',
        'planejamento.html',
        'perfil.html'
      ]
    }
  }
});
