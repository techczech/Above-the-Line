module.exports = {
        darkMode: 'class',
        theme: {
          extend: {
            fontFamily: {
              sans: ['Inter', 'sans-serif'],
              serif: ['Cardo', 'serif'],
            },
            animation: {
              'fade-in-out': 'fadeInOut 3s ease-in-out',
            },
            keyframes: {
              fadeInOut: {
                '0%, 100%': { opacity: 0 },
                '10%, 90%': { opacity: 1 },
              }
            }
          }
        }
      ,
content: ['./index.html', './App.tsx', './components/**/*.{ts,tsx}'], plugins: [require('@tailwindcss/typography')] };
