/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Nunito", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        // Mapeamento nativo da paleta "Enfere Vivo" nas escalas do Design System
        slate: {
          50: "#F4F8F9",   // Fundo Claro Enfere Vivo
          100: "#EAF1F5",
          200: "#DCE5EC",  // Linha Clara Enfere Vivo
          300: "#C4D1DC",  // Base 3D Clara Enfere Vivo
          400: "#9FB3C6",  // Texto Secundário Escuro Enfere Vivo
          500: "#52667A",  // Texto Secundário Claro Enfere Vivo
          600: "#435668",
          700: "#27394B",  // Linha Escura Enfere Vivo
          800: "#27394B",  // Linha Escura Enfere Vivo
          900: "#16222E",  // Superfície Escura Enfere Vivo
          950: "#0E1720",  // Fundo Escuro Enfere Vivo
        },
        teal: {
          50: "#E8FBF8",
          100: "#C5F6EF",
          200: "#8EECE0",
          300: "#54DFCF",
          400: "#2AD3C1",  // Aqua Escuro Enfere Vivo
          500: "#1FC7B6",  // Aqua Claro Enfere Vivo
          600: "#17A99A",  // Base Aqua Escuro Enfere Vivo
          700: "#12A596",  // Base Aqua Claro Enfere Vivo
          800: "#0D7A6F",
          900: "#06302E",  // Rótulo sobre Aqua Enfere Vivo
          950: "#042220",
        },
        emerald: {
          50: "#E8FBF8",
          100: "#C5F6EF",
          200: "#8EECE0",
          300: "#3DD68C",  // Verde Escuro Enfere Vivo
          400: "#2AD3C1",  // Aqua Escuro Enfere Vivo
          500: "#1FC7B6",  // Aqua Claro Enfere Vivo
          600: "#1F9D63",  // Verde Claro Enfere Vivo
          700: "#12A596",  // Base Aqua Claro Enfere Vivo
          800: "#0D7A6F",
          900: "#06302E",
          950: "#042220",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

