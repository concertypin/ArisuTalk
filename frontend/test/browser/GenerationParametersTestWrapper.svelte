<script lang="ts">
    import GenerationParameters from "@/components/settingSubpage/LLMSetting/GenerationParameters.svelte";
    import type { LLMConfig } from "@/lib/types/IDataModel";

    interface Props {
        config: LLMConfig;
        id: number;
    }
    let { config = $bindable(), id }: Props = $props();
</script>

<GenerationParameters bind:config={config} {id} />
