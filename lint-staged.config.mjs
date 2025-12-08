const pnpmFrontend = `pnpm --filter ./frontend `;
const pnpmBackend = `pnpm --filter ./backend `;
const biomeCheck = "run check";
/**
 * @type {import("lint-staged").Configuration}
 */
export default {
    "frontend/src/**/*.{js,md,svelte,ts}": pnpmFrontend + biomeCheck,
    "backend/src/**/*.{ts,js,md}": pnpmBackend + biomeCheck,
};
