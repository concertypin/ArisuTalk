//@ts-check

/**
 * It is used in vite.config.ts to set environment variables.
 * @param ctx Vite config context, includes mode. It is passed from defineConfig parameter.
 * @param  env loadEnv(mode, process.cwd(), '')
 * @returns An object containing environment variables
 */
export default function getEnvVar(
    ctx: import("vite").ConfigEnv,
    env: Record<string, string | undefined>,
): Record<string, string> {
    const isLocal =
        ctx.mode !== "production" && !env.GITHUB_ACTIONS && !env.NETLIFY;

    const baseRepo = "concertypin/ArisuTalk";

    const GITHUB_REPO_URL =
        env.REPOSITORY_URL || // Netlify build
        "https://github.com/" + (env.GITHUB_REPOSITORY || baseRepo);

    // It is local build by default and be overridden by CI/CD env vars.
    let versionChannel = "local";
    let versionName = "secret"; // Because it is local
    let versionUrl = isLocal
        ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // You know this
        : GITHUB_REPO_URL; // It might be another one's production build, so I endure dQw4.

    if (env.GITHUB_ACTIONS) {
        const ref = env.GITHUB_REF || "";
        const sha = env.GITHUB_SHA || "";

        if (ref.startsWith("refs/tags/v")) {
            const tag = ref.replace("refs/tags/", "");
            versionChannel = "prod";
            versionName = tag.substring(1); // 'v' prefix elimination
            versionUrl = `${GITHUB_REPO_URL}/tree/${tag}`;
        } else if (ref.startsWith("refs/tags/dev")) {
            const tag = ref.replace("refs/tags/", "");
            versionChannel = "dev";
            versionName = tag.substring(3); // 'dev' prefix elimination
            versionUrl = `${GITHUB_REPO_URL}/tree/${tag}`;
        } else if (ref === "refs/heads/main") {
            versionChannel = "spark";
            versionName = sha.substring(0, 7); // 7-character short SHA
            versionUrl = `${GITHUB_REPO_URL}/commit/${sha}`;
        }
    } else if (env.NETLIFY) {
        // Netlify build for PR previews
        versionChannel = "PR";
        versionName = env.COMMIT_REF?.substring(0, 7) || "unknown";
        versionUrl = `${GITHUB_REPO_URL}/commit/${env.COMMIT_REF}`;
    }

    return {
        VITE_VERSION_CHANNEL: versionChannel,
        VITE_VERSION_NAME: versionName,
        VITE_VERSION_URL: versionUrl,
    };
}
