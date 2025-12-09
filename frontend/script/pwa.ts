import { VitePWA } from "vite-plugin-pwa";

const manifest = {
	name: "ArisuTalk",
	short_name: "ArisuTalk",
	description: "ArisuTalk, chat with your waifu.",
	icons: [
		{
			src: "icon_192.png",
			sizes: "192x192",
			type: "image/png",
		},
		{
			src: "icon_512.png",
			sizes: "512x512",
			type: "image/png",
		},
	],
};
export const vitePWA = VitePWA({
	registerType: "autoUpdate",
	strategies: "injectManifest",

	srcDir: "worker/sw",
	filename: "main.ts",
	injectManifest: {
		globPatterns: ["**/*.{html,ico,png,svg}"],
		globIgnores: ["**/*.{js,css,wasm}", "worker/!(*sw)/**/*"],
	},
	manifest: manifest,
});
export default vitePWA;
