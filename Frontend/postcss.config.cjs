module.exports = {
  // Use array form to load PostCSS plugins
  plugins: [
    // Tailwind v4 PostCSS adapter
    require('@tailwindcss/postcss'),
    require('autoprefixer'),
  ],
}
