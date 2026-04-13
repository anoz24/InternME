/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1A1A14',
        'ink-light': '#2E2E20',
        spark: '#F5E642',
        gold: '#C4A000',
        'warm-white': '#FAFAF7',
        cream: '#E8E0C8',
        'warm-gray': '#7A7A6A',
        'mint-bg': '#E8F5F0',
        'mint-text': '#0D9E75',
        'alert-bg': '#FFF8DC',
        'alert-text': '#8A6A00',
        'error-bg': '#FEF0F0',
        'error-text': '#B33A3A',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        logo: '10px',
        card: '16px',
        btn: '8px',
        pill: '20px',
        modal: '20px',
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [],
};
