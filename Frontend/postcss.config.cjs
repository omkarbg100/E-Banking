module.exports = {
  // Use array form to load PostCSS plugins
  plugins: [
    // Use the Tailwind v4 PostCSS adapter
    require('@tailwindcss/postcss'),
    require('autoprefixer'),
  ],
}
