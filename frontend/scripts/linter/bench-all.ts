import { spawnSync } from "child_process";
import { performance } from "perf_hooks";

const CASES = [
    {
        name: "Hybrid (Oxlint + ESLint) w/ Cache",
        command: "pnpm run lint:oxlint && pnpm run lint:eslint",
    },
    {
        name: "Hybrid (Oxlint + ESLint) w/o Cache",
        command: "pnpm run lint:oxlint && pnpm run lint:eslint --no-cache",
    },
    {
        name: "Oxlint",
        command: "pnpm run lint:oxlint",
    },
    { name: "ESLint (Svelte Only) w/ Cache", command: "pnpm run lint:eslint" },
    { name: "ESLint (Svelte Only) w/o Cache", command: "pnpm run lint:eslint --no-cache" },
];

function runBenchCommand(command: string): number {
    const start = performance.now();
    try {
        const res = spawnSync(command, {
            stdio: "ignore",
            shell: true,
            cwd: process.cwd(),
        });
        const end = performance.now();
        if (res.error) throw new Error(`Failed to start command: ${res.error.message}`);
        return (end - start) / 1000;
    } catch (err) {
        if (err instanceof Error) throw new Error(`[Execution Error] ${err.message}`);
        throw err;
    }
}

function calculateStats(data: number[]): { mean: number; stdev: number } {
    const n = data.length;
    if (n === 0) return { mean: 0, stdev: 0 };
    const mean = data.reduce((a, b) => a + b, 0) / n;
    if (n < 2 || mean === 0) return { mean, stdev: 0 };
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
    const stdev = Math.sqrt(variance);
    return { mean, stdev };
}

function getCleanedStats(data: number[]): { mean: number; stdev: number } {
    if (data.length < 4) return calculateStats(data);
    const sortedData = [...data].sort((a, b) => a - b);
    const n = sortedData.length;
    const q1 = sortedData[Math.floor(n / 4)];
    const q3 = sortedData[Math.floor((3 * n) / 4)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const filteredData = sortedData.filter((x) => x >= lowerBound && x <= upperBound);
    return calculateStats(filteredData.length >= 2 ? filteredData : data);
}

async function runBenchmarkForCase(caseInfo: { name: string; command: string }) {
    console.log(`\n🚀 Testing: ${caseInfo.name}`);
    console.log(`   Command: ${caseInfo.command}`);

    const durations: number[] = [];
    const targetCv = 0.03;
    const minRuns = 5;
    const maxRuns = 15;

    console.log("   ⚡ Warming up (2 runs)...");
    for (let i = 0; i < 2; i++) runBenchCommand(caseInfo.command);

    for (let i = 1; i <= maxRuns; i++) {
        let elapsed = runBenchCommand(caseInfo.command);
        durations.push(elapsed);
        const { mean, stdev } = getCleanedStats(durations);
        const cv = mean > 0 ? stdev / mean : 0;

        process.stdout.write(
            `      [${i.toString().padStart(2, "0")}] ` +
                `Last: ${elapsed.toFixed(3)}s | Mean: ${mean.toFixed(3)}s | CV: ${(cv * 100).toFixed(1)}%\r`
        );

        if (i >= minRuns && cv <= targetCv) break;
    }
    process.stdout.write("\n");
    return getCleanedStats(durations);
}

async function main() {
    const results = [];
    for (const c of CASES) {
        const stats = await runBenchmarkForCase(c);
        results.push({ ...c, ...stats });
    }

    console.log("\n" + "=".repeat(70));
    console.log("📊 Linter Performance Benchmark Results (Hybrid Setup)");
    console.log("=".repeat(70));
    console.log(`${"Case".padEnd(45)} | ${"Mean (s)".padStart(10)} | ${"Stdev".padStart(8)}`);
    console.log("-".repeat(70));
    results.forEach((r) => {
        console.log(
            `${r.name.padEnd(45)} | ${r.mean.toFixed(3).padStart(10)} | ${r.stdev.toFixed(3).padStart(8)}`
        );
    });
    console.log("=".repeat(70));
}

main().catch(console.error);
