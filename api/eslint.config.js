// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      'semi': ['error', 'always'],           // ; obligatoire
      'indent': ['error', 2],                 // Indentation de 2 espaces
      '@typescript-eslint/no-explicit-any': 'off',  // Autorise any (débutant)
    },
  },
  {
    ignores: ["dist", "prisma/generated"]
  },
);