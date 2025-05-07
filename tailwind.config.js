/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}', // Для Next.js App Router
    './pages/**/*.{js,ts,jsx,tsx}', // Для Next.js Pages Router
    './components/**/*.{js,ts,jsx,tsx}', // Компоненты фронтенда
    './src/**/*.{js,ts,jsx,tsx}', // Если у тебя есть кастомные файлы в src
    './payload/**/*.{js,ts,jsx,tsx}', // Для админки Payload, если Tailwind нужен там
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
