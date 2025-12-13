<script lang="ts">
    import CharacterSidebar from "./CharacterSidebar.svelte";
    import CharacterForm from "./CharacterForm.svelte";
    import CharacterList from "./CharacterList.svelte";
    import ChatList from "../../chat/components/ChatList.svelte";
    import PersonaList from "../../persona/components/PersonaList.svelte";
    import PersonaForm from "../../persona/components/PersonaForm.svelte";
    import type { Persona } from "../../persona/schema";
    import { characterStore } from "../stores/characterStore.svelte";
    import type { Character } from "@arisutalk/character-spec/v0/Character";

    interface Props {
        children?: import("svelte").Snippet;
    }

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

    function handleSelect(id: string) {
        selectedCharacterId = id;
    }

    function handleAdd() {
        editingIndex = null;
        dialog?.showModal();
    }

    function handleEdit(index: number) {
        editingIndex = index;
        dialog?.showModal();
    }

    async function handleFormSubmit(char: Character) {
        if (editingIndex !== null) {
            await characterStore.update(editingIndex, char);
        } else {
            await characterStore.add(char);
        }
        dialog?.close();
    }

    function handlePersona() {
        personaDialog?.showModal();
        isPersonaFormOpen = false;
        editingPersona = undefined;
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
    <main class="flex-1 flex flex-col min-w-0 bg-base-200 relative">
        {#if selectedCharacterId}
            {@render children?.()}
        {:else}
            <div class="h-full overflow-y-auto w-full">
                <div class="container mx-auto p-6 md:p-8 max-w-7xl">
                    <div class="mb-8">
                        <h1 class="text-3xl font-bold mb-2">My Characters</h1>
                        <p class="text-base-content/60">
                            Manage your AI characters, import cards, or create new ones.
                        </p>
                    </div>
                    <CharacterList onEdit={handleEdit} />
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
            class="modal-box w-11/12 max-w-2xl min-h-[500px] flex flex-col border border-base-300 shadow-2xl"
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
</div>
