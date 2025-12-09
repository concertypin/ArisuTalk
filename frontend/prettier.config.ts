import { type Config } from "prettier";

const config: Config = {
    trailingComma: "es5",
    plugins: [
        "prettier-plugin-svelte",
        "@trivago/prettier-plugin-sort-imports",
    ],
    importOrder: [
        "<THIRD_PARTY_MODULES>",
        // absolute paths
        "^\$.*",
        // relative paths
        "^[./]",
    ],
    tabWidth: 4,

    importOrderSeparation: true,
    importOrderSortSpecifiers: true,
};

export default config;
