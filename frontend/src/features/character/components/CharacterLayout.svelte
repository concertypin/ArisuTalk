<script lang="ts">
    import CharacterSidebar from "./CharacterSidebar.svelte";
    import CharacterForm from "./CharacterForm.svelte";
    import CharacterSettingsModal from "./CharacterSettingsModal.svelte";
    import ChatList from "@/features/chat/components/ChatList.svelte";
    import PersonaList from "@/features/persona/components/PersonaList.svelte";
    import PersonaForm from "@/features/persona/components/PersonaForm.svelte";
    import type { Persona } from "@/features/persona/schema";
    import { characterStore } from "@/features/character/stores/characterStore.svelte";
    import { uiState } from "@/lib/stores/ui.svelte";
    import type { Character } from "@arisutalk/character-spec/v0/Character";
    import { Logger } from "@common/logger/Logger";

    type Props = {
        children?: import("svelte").Snippet;
    };

    let { children }: Props = $props();

    let selectedCharacterId = $state<string | null>(null);
    let dialog = $state<HTMLDialogElement>();
    let personaDialog = $state<HTMLDialogElement>();

    // Character UI State
    let editingIndex = $state<number | null>(null);
    let editingCharacter = $derived(
        editingIndex !== null ? characterStore.characters[editingIndex] : undefined
    );

    // Persona UI State
    let editingPersona = $state<Persona | undefined>(undefined);
    let isPersonaFormOpen = $state(false);

    function handleSelect(id: string | null) {
        selectedCharacterId = id;
    }

    function handleAdd() {
        editingIndex = null;
        dialog?.showModal();
        Logger.structured("modal.open", {
            location: "characterLayout",
            modalName: "CharacterForm",
        });
    }

    async function handleFormSubmit(char: Character) {
        if (editingIndex !== null) {
            await characterStore.update(editingIndex, char);
        } else {
            await characterStore.add(char);
        }
        dialog?.close();
        Logger.structured("modal.close", {
            location: "characterLayout",
            modalName: "CharacterForm",
        });
    }

    function handlePersona() {
        personaDialog?.showModal();
        isPersonaFormOpen = false;
        editingPersona = undefined;
        Logger.structured("modal.open", {
            location: "characterLayout",
            modalName: "PersonaModal",
        });
    }

    function handleEditPersona(persona: Persona) {
        editingPersona = persona;
        isPersonaFormOpen = true;
    }

    function handleCreatePersona() {
        editingPersona = undefined;
        isPersonaFormOpen = true;
    }

    function handlePersonaSave() {
        isPersonaFormOpen = false;
        editingPersona = undefined;
    }
</script>

<div class="flex h-screen w-full overflow-hidden bg-base-100">
    <!-- Sidebar -->
    <nav class="flex-none z-20 flex h-full">
        <CharacterSidebar
            {selectedCharacterId}
            onSelect={handleSelect}
            onAdd={handleAdd}
            onPersona={handlePersona}
        />
        {#if selectedCharacterId}
            <ChatList characterId={selectedCharacterId} />
        {/if}
    </nav>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 bg-base-100 relative">
        {#if selectedCharacterId}
            {@render children?.()}
        {:else}
            <!-- Welcome / No Character Selected -->
            <div class="flex flex-col items-center justify-center h-full text-center p-8">
                <div class="space-y-4 max-w-md">
                    <h1
                        class="text-4xl font-black tracking-tight flex items-center justify-center cursor-default"
                    >
                        <span
                            class="text-gradient-accent flex items-center leading-none select-none"
                        >
                            ArisuTalk
                        </span>
                    </h1>
                    <p class="text-base-content/60 text-lg">
                        Select a character from the sidebar to start chatting
                    </p>
                    <div class="flex flex-wrap justify-center gap-3 mt-6">
                        <button class="btn btn-primary gap-2" onclick={handleAdd}>
                            <span class="text-lg">+</span> Create Character
                        </button>
                        <button class="btn btn-ghost gap-2" onclick={handlePersona}>
                            Manage Personas
                        </button>
                    </div>
                    <p class="text-sm text-base-content/40 mt-8">
                        {characterStore.characters.length === 0
                            ? "No characters yet. Create your first one!"
                            : `${characterStore.characters.length} character${characterStore.characters.length > 1 ? "s" : ""} available`}
                    </p>
                </div>
            </div>
        {/if}
    </main>

    <!-- Character Modal -->
    <dialog bind:this={dialog} id="character_form_modal" class="modal">
        <div class="modal-box p-0 border border-base-300 shadow-2xl">
            <CharacterForm
                character={editingCharacter}
                onSubmit={handleFormSubmit}
                onSave={() => dialog?.close()}
                onCancel={() => dialog?.close()}
            />
        </div>
        <form method="dialog" class="modal-backdrop">
            <button>close</button>
        </form>
    </dialog>

    <!-- Persona Modal -->
    <dialog bind:this={personaDialog} id="persona_modal" class="modal">
        <div
            class="modal-box w-11/12 max-w-2xl min-h-125 flex flex-col border border-base-300 shadow-2xl"
        >
            <h3 class="font-bold text-lg mb-4">Manage Personas</h3>

            <div class="flex-1 overflow-y-auto">
                {#if isPersonaFormOpen}
                    <PersonaForm
                        persona={editingPersona}
                        onSave={handlePersonaSave}
                        onCancel={() => (isPersonaFormOpen = false)}
                    />
                {:else}
                    <div class="mb-4 flex justify-end">
                        <button class="btn btn-sm btn-primary w-full" onclick={handleCreatePersona}>
                            Create New Persona
                        </button>
                    </div>
                    <PersonaList onEdit={handleEditPersona} />
                {/if}
            </div>

            {#if !isPersonaFormOpen}
                <div class="modal-action">
                    <form method="dialog">
                        <button class="btn">Close</button>
                    </form>
                </div>
            {/if}
        </div>
        <form method="dialog" class="modal-backdrop">
            <button>close</button>
        </form>
    </dialog>

    <!-- Character Settings Modal -->
    {#if uiState.characterSettingsOpen}
        <CharacterSettingsModal />
    {/if}
</div>
