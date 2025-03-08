import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";


/** @type {import('eslint').Linter.Config[]} */
export default [
  // Base configs
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  
  // Your overrides
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: { 
      globals: {
        ...globals.browser,
        process: "readonly" // Correctly add process as a global variable
      }
    },
    plugins: {
      react: pluginReact
    },
    settings: {
      react: {
        version: "detect" // Automatically detect React version
        // Or specify a version: "18.2.0"
      }
    },
    rules: {
      "react/prop-types": "off", // This will now properly override the rule
      "react/react-in-jsx-scope": "off" // Turn off the requirement to import React
    }
  }
];
