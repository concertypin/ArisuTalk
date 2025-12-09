//@ts-check
const pnpmExecFrontend = `pnpm --filter ./frontend exec `;
const pnpmExecBackend = `pnpm --filter ./backend exec `;
const typescriptNodeOptions = `cross-env NODE_OPTIONS=--experimental-strip-types `;
const prettierWrite = "prettier --write --config ./prettier.config.ts ";
/**
 * @type {import("lint-staged").Configuration}
 */
export default {
    "frontend/src/**/*.{js,json,md}": pnpmExecFrontend + prettierWrite,
    "frontend/src/**/*.ts":
        pnpmExecFrontend + typescriptNodeOptions + prettierWrite,
    "frontend/src/**/*.svelte":
        pnpmExecFrontend +
        typescriptNodeOptions +
        prettierWrite +
        "--plugin prettier-plugin-svelte",
    "backend/src/**/*.ts":
        pnpmExecBackend + typescriptNodeOptions + "prettier --write",
    "backend/src/**/*.{js,json,md}": pnpmExecBackend + "prettier --write",
};
