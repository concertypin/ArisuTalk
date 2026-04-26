import { spawn } from "child_process";

const COLOR = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    cyan: "\x1b[38;5;51m",
    red: "\x1b[38;5;196m",
    green: "\x1b[38;5;46m",
    gray: "\x1b[38;5;244m",
} as const;

interface Config {
    name: string;
    file: string;
}

const successPattern = "svelte-check found 0 errors and 0 warnings";
const CONFIGS: Config[] = [
    { name: "APP", file: "tsconfig.app.json" },
    { name: "WORK", file: "tsconfig.worker.json" },
    { name: "TEST", file: "tsconfig.test.json" },
];

const isCI = !!process.env.CI;
const isSequential = process.argv.includes("--sequential");
const isClean = process.argv.includes("--clean");
const localOnly = ["--incremental", "--tsgo"];

if (isClean && !isSequential) {
    console.error(
        `${COLOR.red}Error: --clean option requires --sequential to be effective. Please run with both --clean and --sequential.${COLOR.reset}`
    );
    process.exit(1);
}

async function runCheck({ name, file }: Config): Promise<{ name: string; code: number | null }> {
    const cleaner = async () => {
        if (!isClean) return;
        const { rm } = await import("fs/promises");
        await rm(`.svelte-check/`, { recursive: true, force: true });
        await rm(`node_modules/.cache`, { recursive: true, force: true });
    };
    await cleaner();

    const runner = new Promise<{ name: string; code: number | null }>((resolve) => {
        const args = [
            "exec",
            "svelte-check",
            "--fail-on-warnings",
            ...(isCI ? [] : localOnly),
            "--tsconfig",
            file,
        ];
        const proc = spawn("pnpm", args, {
            shell: true,
            env: {
                ...process.env,
                FORCE_COLOR: "1",
                COLORTERM: "truecolor",
                TERM: "xterm-256color",
            },
        });

        let output = "";

        proc.stdout?.on("data", (data: Buffer) => {
            output += data.toString();
        });

        proc.stderr?.on("data", (data: Buffer) => {
            output += data.toString();
        });

        proc.on("close", (code) => {
            const success = code === 0 && output.includes(successPattern);
            const status = success
                ? `${COLOR.green}✓${COLOR.reset}`
                : `${COLOR.red}✗${COLOR.reset}`;
            console.log(
                `${status} ${COLOR.bold}[${name}]${COLOR.reset} ${COLOR.gray}(${code})${COLOR.reset}`
            );
            if (output.trim()) console.log(output.trim());
            resolve({ name, code });
        });
    });
    return runner;
}

async function runSequential(configs: Config[]): Promise<{ name: string; code: number | null }[]> {
    const results: { name: string; code: number | null }[] = [];
    for (const config of configs) {
        const result = await runCheck(config);
        results.push(result);
        if (result.code !== 0) {
            console.log(`${COLOR.gray}Stopping due to failure in ${config.name}${COLOR.reset}`);
            break;
        }
    }
    return results;
}

async function main() {
    try {
        // Initial build
        console.log(`${COLOR.gray}Starting initial build...${COLOR.reset}`);
        await new Promise<void>((resolve, reject) => {
            const proc = spawn("pnpm", ["exec", "tsgo", "-b"], { shell: true, stdio: "inherit" });
            proc.on("close", (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Initial build failed with code ${code}`));
                }
            });
        });
        const results = isSequential
            ? await runSequential(CONFIGS)
            : await Promise.all(CONFIGS.map(runCheck));
        const failed = results.filter((r) => r.code !== 0);

        console.log();
        if (failed.length > 0) {
            console.error(
                `${COLOR.red}✗ Failed: ${failed.map((f) => f.name).join(", ")}${COLOR.reset}`
            );
            process.exit(1);
        } else {
            console.log(`${COLOR.green}✓ All checks passed${COLOR.reset}`);
        }
    } catch (err) {
        console.error(`${COLOR.red}Error:`, err, COLOR.reset);
        process.exit(1);
    }
}

await main();
