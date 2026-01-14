<!--
  @component WelcomePage
  Landing page with welcome message and quick actions.
-->
<script lang="ts">
    import { MessageCircle, Users, Settings, Sparkles } from "@lucide/svelte";
    import { uiState } from "@/lib/stores/ui.svelte";

    type Props = {
        /** Callback when user wants to start chatting */
        onStartChat?: () => void;
    };

    let { onStartChat }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center h-full w-full bg-base-100 p-8">
    <!-- Hero Section -->
    <div class="text-center space-y-4 mb-12">
        <div class="flex items-center justify-center gap-2 mb-4">
            <Sparkles class="w-8 h-8 text-accent animate-pulse" />
            <h1 class="text-4xl font-bold tracking-tight">
                <span class="text-gradient-accent">ArisuTalk</span>
            </h1>
        </div>
        <p class="text-base-content/60 text-lg max-w-md">
            Create and chat with AI characters. Your conversations, your stories.
        </p>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full">
        <button
            class="glass-card p-6 hover-lift flex flex-col items-center gap-3 cursor-pointer group"
            onclick={onStartChat}
        >
            <div class="p-3 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                <MessageCircle class="w-6 h-6 text-primary" />
            </div>
            <div class="text-center">
                <h3 class="font-semibold">Start Chatting</h3>
                <p class="text-sm text-base-content/50">Select a character and begin</p>
            </div>
        </button>

        <button
            class="glass-card p-6 hover-lift flex flex-col items-center gap-3 cursor-pointer group"
            onclick={() => uiState.openSettingsModal()}
        >
            <div
                class="p-3 rounded-full bg-secondary/20 group-hover:bg-secondary/30 transition-colors"
            >
                <Settings class="w-6 h-6 text-secondary" />
            </div>
            <div class="text-center">
                <h3 class="font-semibold">Settings</h3>
                <p class="text-sm text-base-content/50">Configure models & prompts</p>
            </div>
        </button>
    </div>

    <!-- Footer hint -->
    <p class="mt-12 text-sm text-base-content/40">Click "Start Chatting" to see your characters</p>
</div>
