import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

export default {
  plugins: [tailwindcss, autoprefixer],
};
