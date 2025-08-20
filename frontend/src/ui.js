import { renderSidebar } from './components/Sidebar.js';
import { renderMainChat } from './components/MainChat.js';
import { renderSettingsModal, renderSnapshotList } from './components/SettingsModal.js';
import { renderCharacterModal } from './components/CharacterModal.js';
import { renderPromptModal } from './components/PromptModal.js';
import { renderConfirmationModal } from './components/ConfirmationModal.js';

function renderModals(app) {
    const container = document.getElementById('modal-container');
    let html = '';
    if (app.state.showSettingsModal) html += renderSettingsModal(app);
    if (app.state.showCharacterModal) html += renderCharacterModal(app);
    if (app.state.showPromptModal) html += renderPromptModal(app);
    if (app.state.modal.isOpen) html += renderConfirmationModal(app);
    container.innerHTML = html;
}

function updateSnapshotList(app) {
    const container = document.getElementById('snapshots-list');
    if (container) {
        container.innerHTML = renderSnapshotList(app);
        lucide.createIcons();
    }
}

// --- MAIN RENDER ORCHESTRATOR ---

export function render(app) {
    const oldState = app.oldState || {};
    const newState = app.state;
    const isFirstRender = !app.oldState;

    // Conditionally render the sidebar to minimize DOM updates
    if (isFirstRender || shouldUpdateSidebar(oldState, newState)) {
        renderSidebar(app);
    }

    // Conditionally render the main chat to minimize DOM updates
    if (isFirstRender || shouldUpdateMainChat(oldState, newState)) {
        renderMainChat(app);
    }

    // Conditionally render modals to minimize DOM updates
    if (isFirstRender || shouldUpdateModals(oldState, newState)) {
        const settingsContent = document.getElementById('settings-modal-content');
        const scrollPosition = settingsContent ? settingsContent.scrollTop : 0;

        renderModals(app);

        const newSettingsContent = document.getElementById('settings-modal-content');
        if (newSettingsContent) {
            newSettingsContent.scrollTop = scrollPosition;
        }
    }

    lucide.createIcons();
    app.scrollToBottom();
}

// --- RENDER HELPER FUNCTIONS ---

function shouldUpdateSidebar(oldState, newState) {
    // This function checks if any state related to the sidebar has changed
    return (
        oldState.sidebarCollapsed !== newState.sidebarCollapsed ||
        oldState.searchQuery !== newState.searchQuery ||
        oldState.expandedCharacterId !== newState.expandedCharacterId ||
        oldState.editingChatRoomId !== newState.editingChatRoomId ||
        JSON.stringify(oldState.characters) !== JSON.stringify(newState.characters) ||
        oldState.selectedChatId !== newState.selectedChatId ||
        JSON.stringify(oldState.unreadCounts) !== JSON.stringify(newState.unreadCounts) ||
        JSON.stringify(oldState.messages) !== JSON.stringify(newState.messages) ||
        JSON.stringify(oldState.chatRooms) !== JSON.stringify(newState.chatRooms) ||
        oldState.settings.language !== newState.settings.language
    );
}

function shouldUpdateMainChat(oldState, newState) {
    // This function checks if any state related to the main chat has changed
    return (
        oldState.selectedChatId !== newState.selectedChatId ||
        oldState.editingMessageId !== newState.editingMessageId ||
        JSON.stringify(oldState.messages) !== JSON.stringify(newState.messages) ||
        oldState.typingCharacterId !== newState.typingCharacterId ||
        oldState.isWaitingForResponse !== newState.isWaitingForResponse ||
        oldState.showInputOptions !== newState.showInputOptions ||
        oldState.imageToSend !== newState.imageToSend ||
        oldState.showUserStickerPanel !== newState.showUserStickerPanel ||
        JSON.stringify(oldState.userStickers) !== JSON.stringify(newState.userStickers) ||
        JSON.stringify([...oldState.expandedStickers]) !== JSON.stringify([...newState.expandedStickers]) ||
        oldState.settings.language !== newState.settings.language
    );
}

function shouldUpdateModals(oldState, newState) {
    // This function checks if any state related to modals has changed

    // If the settings modal is open, we don't re-render it just for settings changes.
    // This prevents the modal from resetting while the user is typing in input fields.
    return (
        oldState.showSettingsModal !== newState.showSettingsModal ||
        oldState.showCharacterModal !== newState.showCharacterModal ||
        oldState.showPromptModal !== newState.showPromptModal ||
        JSON.stringify(oldState.modal) !== JSON.stringify(newState.modal) ||
        (newState.showCharacterModal && JSON.stringify(oldState.editingCharacter) !== JSON.stringify(newState.editingCharacter)) ||
        (newState.showPromptModal && JSON.stringify(oldState.settings.prompts) !== JSON.stringify(newState.settings.prompts)) ||
        // Add checks for changes within settings modal when it's open
        (newState.showSettingsModal && (
            JSON.stringify(oldState.settingsSnapshots) !== JSON.stringify(newState.settingsSnapshots) ||
            oldState.settings.model !== newState.settings.model ||
            oldState.settings.language !== newState.settings.language ||
            JSON.stringify(oldState.openSettingsSections) !== JSON.stringify(newState.openSettingsSections)
        ))
    );
}