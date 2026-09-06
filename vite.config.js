import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/**
 * Без явного конфига Vite обрабатывает как entry-point только index.html —
 * privacy.html и oferta.html при сборке просто не попали бы в dist/.
 * lab.html сюда намеренно не добавлен: это dev-only песочница вариантов
 * формы хиро-объекта, в продакшен-сборку она не должна попадать.
 */
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        oferta: resolve(__dirname, 'oferta.html'),
      },
    },
  },
});
