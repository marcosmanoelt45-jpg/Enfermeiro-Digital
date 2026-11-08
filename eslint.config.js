import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "_backup_*/**",
      ".agents/**",
      ".claude/**",
      ".kilo/**",
      "agent/**",
      "Goti/**",
      "Modelos Personagens/**",
      "src/lib/**/*",
      "src/components/ui/**/*",
    ],
  },
  {
    files: [
      "src/components/**/*.{js,mjs,cjs,jsx}",
      "src/pages/**/*.{js,mjs,cjs,jsx}",
      "src/features/**/*.{js,mjs,cjs,jsx}",
      "src/App.jsx",
    ],
    ...pluginJs.configs.recommended,
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "off",
      "react/jsx-no-undef": "error",
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": [
        "error",
        { ignore: ["cmdk-input-wrapper", "toast-close"] },
      ],
      "react-hooks/rules-of-hooks": "error",
    },
  },
  {
    // Serviços, hooks e API também rodam no navegador. Sem no-undef aqui, um import esquecido
    // (sanitizeTextForLGPD no Goti) quebrou o chat sem o lint avisar.
    files: ["src/services/**/*.js", "src/hooks/**/*.js", "src/api/**/*.js", "supabase/functions/_shared/**/*.js"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaVersion: 2022, sourceType: "module" },
    },
    plugins: { "unused-imports": pluginUnusedImports },
    rules: {
      "no-undef": "error",
      "unused-imports/no-unused-imports": "error",
    },
  },
  {
    // Testes (node:test) e o executor de testes rodam no Node, não no navegador.
    files: ["**/*.test.mjs", "scripts/run-tests.mjs"],
    ...pluginJs.configs.recommended,
    languageOptions: {
      globals: globals.node,
      parserOptions: { ecmaVersion: 2022, sourceType: "module" },
    },
    plugins: { "unused-imports": pluginUnusedImports },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" },
      ],
    },
  },
];
