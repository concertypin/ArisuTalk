<script lang="ts">
    import CharacterSidebar from "./CharacterSidebar.svelte";
    import CharacterForm from "./CharacterForm.svelte";

    interface Props {
        children?: import("svelte").Snippet;
    }

    let { children }: Props = $props();

    // Ideally this state should probably be in the store or a higher level component
    // to persist selection across navigations if needed.
    // For now, local state here or in the store.
    // Let's assume the URL tracks the character, but for "Basic" implementation,
    // I might just track it here.
    // However, the requested plan kept "Character Manager" separate.
    // But the feedback said "discord's server-chat system", which implies
    // selecting a character changes the view.

    // I'll add a selectedCharacterId state to the store or manage it here.
    // Making it local state for now as a layout.
    // But wait, if I select a character, the "children" (Main Content) should update.

    let selectedCharacterId = $state<string | null>(null);
    let dialog = $state<HTMLDialogElement>();

    function handleSelect(id: string) {
        selectedCharacterId = id;
        // Navigate or update context?
        // If we are using slot/snippet, the parent (Home.svelte) controls the content.
        // So I should probably expose the selection to the parent via binding or callback?
        // But `Home.svelte` will use this layout.

        // Actually, looking at the goal: "Character Management".
        // Maybe I should add `selectedCharacterId` to `characterStore`?
        // That seems globally relevant.
        //todo
        throw new Error("Not implemented yet");
    }

    function handleAdd() {
        // Trigger Add Modal
        // We'll need a way to open the modal.
        // Maybe export a function or use a store for UI state.
        // I'll emit an event or use a callback prop if possible, strict props in Svelte 5.
        // But `CharacterLayout` wraps the app.
        // Let's dispatch a custom event or expect a prop.
        // Simplest: bind selectedCharacterId.
        //todo
        throw new Error("Not implemented yet");
    }
</script>

<div class="flex h-screen w-full overflow-hidden bg-base-100">
    <!-- Sidebar -->
    <nav class="flex-none z-20">
        <CharacterSidebar
            {selectedCharacterId}
            onSelect={handleSelect}
            onAdd={() => dialog?.showModal()}
        />
        <!-- Note: accessing DOM directly for modal is basic HTML dialog usage -->
    </nav>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 bg-base-200 relative">
        {#if selectedCharacterId}
            <!-- Pass context to children? -->
            <!-- In Svelte 5, we can use context API setContext. -->
            <!-- But here we just render children. Home.svelte will likely decide what to show based on store/selection. -->
            {@render children?.()}
        {:else}
            <div class="flex items-center justify-center h-full text-base-content/30">
                Select a character to start chatting
            </div>
        {/if}
    </main>

    <dialog bind:this={dialog} id="character_form_modal" class="modal">
        <div class="modal-box p-0">
            <CharacterForm onSave={() => dialog?.close()} onCancel={() => dialog?.close()} />
        </div>
        <form method="dialog" class="modal-backdrop">
            <button>close</button>
        </form>
    </dialog>
</div>
