import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const tsFiles = ["src/**/*.{ts,tsx}"];

export default [
  {
    ignores: [
      "dist",
      "coverage",
      "node_modules",
      "pnpm-debug.log*",
      "eslint.config.js",
      "vite.config.js",
      "src/types/tmi.js/**",
      "src/libs/tmi.js/**",
    ],
  },
  {
    files: tsFiles,
    languageOptions: {
      ecmaVersion: 2021,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.app.json", "./tsconfig.node.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    ...js.configs.recommended,
    files: tsFiles,
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: tsFiles,
  })),
  {
    ...react.configs.flat.recommended,
    files: tsFiles,
  },
  {
    ...react.configs.flat["jsx-runtime"],
    files: tsFiles,
  },
  {
    files: tsFiles,
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
