<script lang="ts">
    /**
     * @component CharacterMagicSettings
     * Magic Pattern preview and testing panel.
     *
     * Allows testing {| javascript code |} patterns against the current
     * character and persona context without leaving the settings modal.
     */
    import type { Character } from "@arisutalk/character-spec/v0/Character";
    import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
    import { parseMagicPatterns } from "@/lib/parsers/magicPatternParser";
    import Play from "phosphor-svelte/lib/PlayIcon";
    import Warning from "phosphor-svelte/lib/WarningIcon";
    import CharacterSettings from "./CharacterSettings.svelte";

    type Props = {
        character: Character;
    };

    let { character }: Props = $props();

    let testInput = $state("Hello {| return character.name |}!");
    let testOutput = $state("");
    let testError = $state("");
    let isTesting = $state(false);

    const examples = [
        { label: "Character name", code: "{| return character.name |}" },
        { label: "Character description", code: "{| return character.description |}" },
        { label: "Persona name", code: "{| return persona.name |}" },
        { label: "Expression (math)", code: "The answer is {| return 21 + 21 |}." },
    ] as const;

    async function runTest() {
        isTesting = true;
        testError = "";
        testOutput = "";

        try {
            const chat = (_a: number, _b: number): Message[] => [];
            const result = await parseMagicPatterns(testInput, {
                character,
                persona: {
                    name: "User",
                    description: "",
                },
                chat,
            });
            testOutput = result;
        } catch (err) {
            testError = String(err);
            testOutput = "";
        } finally {
            isTesting = false;
        }
    }

    function applyExample(code: string) {
        testInput = code;
    }
</script>

<CharacterSettings subpageName="Magic Patterns">
    <div class="alert bg-base-200/70 border border-base-300/50">
        <Warning size={20} class="shrink-0 text-warning" />
        <div class="text-sm space-y-1">
            <p>
                Magic patterns let you embed JavaScript expressions in prompt text using <code
                    class="kbd kbd-xs">&lcub;| code |&rcub;</code
                > syntax.
            </p>
            <p>
                Available variables: <code class="kbd kbd-xs">character</code>,
                <code class="kbd kbd-xs">persona</code>,
                <code class="kbd kbd-xs">chat(a, b)</code>
            </p>
        </div>
    </div>

    <!-- Examples -->
    <fieldset class="fieldset">
        <legend class="fieldset-legend text-sm font-medium">Quick Examples</legend>
        <div class="flex flex-wrap gap-2">
            {#each examples as example (example.label)}
                <button
                    class="btn btn-outline btn-xs"
                    onclick={() => applyExample(example.code)}
                    aria-label="Apply example: {example.label}"
                >
                    {example.label}
                </button>
            {/each}
        </div>
    </fieldset>

    <!-- Test Editor -->
    <fieldset class="fieldset">
        <legend class="fieldset-legend text-sm font-medium">Test Pattern</legend>
        <textarea
            class="textarea textarea-bordered h-24 w-full font-mono text-sm"
            bind:value={testInput}
            placeholder="Enter text with &#123; magic patterns &#125;..."
        ></textarea>
    </fieldset>

    <!-- Run Button -->
    <div class="flex items-center gap-2">
        <button
            class="btn btn-primary"
            onclick={runTest}
            disabled={isTesting}
            aria-label="Run pattern test"
        >
            {#if isTesting}
                <span class="loading loading-spinner loading-xs" aria-hidden="true"></span>
            {:else}
                <Play size={16} aria-hidden="true" />
            {/if}
            Test Pattern
        </button>
    </div>

    <!-- Output -->
    {#if testError}
        <div class="alert alert-error">
            <Warning size={20} class="shrink-0" />
            <span class="text-sm font-mono">{testError}</span>
        </div>
    {/if}

    {#if testOutput}
        <fieldset class="fieldset">
            <legend class="fieldset-legend text-sm font-medium">Result</legend>
            <div class="p-3 bg-base-200/70 rounded-box border border-base-300/50 text-sm">
                {testOutput}
            </div>
        </fieldset>
    {/if}

    <!-- Documentation -->
    <details class="collapse collapse-arrow bg-base-200/50 rounded-box">
        <summary class="collapse-title text-sm font-medium">Syntax Reference</summary>
        <div class="collapse-content text-sm space-y-2">
            <p>
                Magic patterns are evaluated inside a <strong>QuickJS sandbox</strong> — no network or
                filesystem access is available.
            </p>
            <div class="overflow-x-auto">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Pattern</th>
                            <th>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code class="kbd kbd-xs">&#123; character.name &#125;</code></td>
                            <td>The character's display name</td>
                        </tr>
                        <tr>
                            <td
                                ><code class="kbd kbd-xs">&#123; character.description &#125;</code
                                ></td
                            >
                            <td>The character's description text</td>
                        </tr>
                        <tr>
                            <td><code class="kbd kbd-xs">&#123; persona.name &#125;</code></td>
                            <td>The user/persona name</td>
                        </tr>
                        <tr>
                            <td><code class="kbd kbd-xs">&#123; 42 &#125;</code></td>
                            <td>Literal expression → "42"</td>
                        </tr>
                        <tr>
                            <td
                                ><code class="kbd kbd-xs"
                                    >&#123; return character.name + " says hi" &#125;</code
                                ></td
                            >
                            <td>Statement with return</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </details>
</CharacterSettings>
