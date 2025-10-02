

/**
 * It is used in vite.config.ts to set environment variables
 * @param {Record<string, string|undefined>} env loadEnv(mode, process.cwd(), '')
 * @returns {Record<string, string>} An object containing environment variables
 */
export default function getEnvVar(env) {
    const GITHUB_REPO_URL = env.REPOSITORY_URL// Netlify build
        || "https://github.com/" + (env.GITHUB_REPOSITORY || "concertypin/ArisuTalk");

    let versionChannel = 'local';
    let versionName = 'secret';
    let versionUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // You know this

    if (env.GITHUB_ACTIONS) {
        const ref = env.GITHUB_REF || ""
        const sha = env.GITHUB_SHA || '';

        if (ref.startsWith('refs/tags/v')) {
            const tag = ref.replace('refs/tags/', '');
            versionChannel = 'prod';
            versionName = tag.substring(1); // 'v' prefix elimination
            versionUrl = `${GITHUB_REPO_URL}/tree/${tag}`;
        }
        else if (ref.startsWith('refs/tags/dev')) {
            const tag = ref.replace('refs/tags/', '');
            versionChannel = 'dev';
            versionName = tag.substring(3); // 'dev' prefix elimination
            versionUrl = `${GITHUB_REPO_URL}/tree/${tag}`;
        }
        else if (ref === 'refs/heads/main') {
            versionChannel = 'spark';
            versionName = sha.substring(0, 7); // 7-character short SHA
            versionUrl = `${GITHUB_REPO_URL}/commit/${sha}`;
        }
    }

    else if (env.NETLIFY) {
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