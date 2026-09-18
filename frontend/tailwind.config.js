/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 12px 35px rgba(20, 74, 118, 0.10)",
        lift: "0 20px 48px rgba(20, 74, 118, 0.14)"
      },
      colors: {
        ink: "#18324A",
        mist: "#F4F9FC",
        medblue: "#1666A8",
        teal: "#087E8B"
      }
    }
  },
  plugins: []
};
