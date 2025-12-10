//@ts-check
const pnpmExecFrontend = `pnpm --filter ./frontend `;
const pnpmExecBackend = `pnpm --filter ./backend `;
const prettierWrite = "exec prettier --write ";
const prettierCache =
  " --cache --cache-location ./node_modules/.cache/prettier ";
/**
 * @type {import("lint-staged").Configuration}
 */
export default {
  "frontend/src/**/*.{js,json,md}":
    pnpmExecFrontend + prettierWrite + prettierCache,
  "frontend/src/**/*.ts": pnpmExecFrontend + prettierWrite + prettierCache,
  "frontend/src/**/*.svelte":
    pnpmExecFrontend +
    prettierWrite +
    "--plugin prettier-plugin-svelte" +
    prettierCache,
  "backend/src/**/*.{js,json,md,ts}":
    pnpmExecBackend + prettierWrite + prettierCache,
};
