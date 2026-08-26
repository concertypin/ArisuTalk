<script lang="ts">
    import GenerationParameters from "@/components/settingSubpage/LLMSetting/GenerationParameters.svelte";
    import type { LLMConfig } from "@/lib/types/IDataModel";

    interface Props {
        config: LLMConfig;
        id: number;
    }
    let { config = $bindable(), id }: Props = $props();

    // Mirror production: `LLMSettings.svelte` passes `settings.value.llmConfigs[i]`,
    // which is a `$state` deep proxy. Wrap the test's plain object in a $state
    // proxy so the component sees the same reactive shape it does in the real app.
    // Mutations from the child are mirrored back onto the original `config`
    // object so tests can assert against it.
    let reactiveConfig = $state(structuredClone($state.snapshot(config)));

    $effect(() => {
        Object.assign(config, $state.snapshot(reactiveConfig));
    });
</script>

<GenerationParameters bind:config={reactiveConfig} {id} />
