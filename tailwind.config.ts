import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: { extend: { colors: { gold: '#d4af37', dark: '#0a0a0f', card: '#0d1117', 'card-border': '#1e293b' } } },
  plugins: [],
}
export default config
