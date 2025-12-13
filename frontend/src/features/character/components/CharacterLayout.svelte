<script lang="ts">
    import CharacterSidebar from "./CharacterSidebar.svelte";
    import CharacterForm from "./CharacterForm.svelte";
    import PersonaList from "../../persona/components/PersonaList.svelte";
    import PersonaForm from "../../persona/components/PersonaForm.svelte";
    import type { Persona } from "../../persona/schema";

    interface Props {
        children?: import("svelte").Snippet;
    }

    let { children }: Props = $props();

    let selectedCharacterId = $state<string | null>(null);
    let dialog = $state<HTMLDialogElement>();
    let personaDialog = $state<HTMLDialogElement>();

    // Persona UI State
    let editingPersona = $state<Persona | undefined>(undefined);
    let isPersonaFormOpen = $state(false);

    function handleSelect(id: string) {
        selectedCharacterId = id;
    }

    function handleAdd() {
        dialog?.showModal();
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
    <nav class="flex-none z-20">
        <CharacterSidebar
            {selectedCharacterId}
            onSelect={handleSelect}
            onAdd={handleAdd}
            onPersona={handlePersona}
        />
    </nav>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 bg-base-200 relative">
        {#if selectedCharacterId}
            {@render children?.()}
        {:else}
            <div class="flex items-center justify-center h-full text-base-content/30">
                Select a character to start chatting
            </div>
        {/if}
    </main>

    <!-- Character Modal -->
    <dialog bind:this={dialog} id="character_form_modal" class="modal">
        <div class="modal-box p-0 border border-base-300 shadow-2xl">
            <CharacterForm onSave={() => dialog?.close()} onCancel={() => dialog?.close()} />
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
