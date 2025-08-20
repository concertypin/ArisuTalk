import { PersonaChatApp } from "..";

/**
 * @param {MouseEvent} e
 * @param {PersonaChatApp} app
 * @returns {void}
 */
export function handleMainChatClick(e, app) {
    if (e.target.closest('#open-input-options-btn')) {
        app.setState({ showInputOptions: !app.state.showInputOptions });
    }
    if (e.target.closest('#open-image-upload')) {
        document.getElementById('image-upload-input').click();
    }
    if (e.target.closest('#cancel-image-preview')) {
        app.setState({ imageToSend: null });
    }

    const deleteMsgButton = e.target.closest('.delete-msg-btn');
    if (deleteMsgButton) {
        app.handleDeleteMessage(parseFloat(deleteMsgButton.dataset.id));
    }

    const editMsgButton = e.target.closest('.edit-msg-btn');
    if (editMsgButton) {
        app.handleEditMessage(parseFloat(editMsgButton.dataset.id));
    }

    const rerollMsgButton = e.target.closest('.reroll-msg-btn');
    if (rerollMsgButton) {
        app.handleRerollMessage(parseFloat(rerollMsgButton.dataset.id));
    }

    const saveEditButton = e.target.closest('.save-edit-btn');
    if (saveEditButton) {
        app.handleSaveEditedMessage(parseFloat(saveEditButton.dataset.id));
    }

    const cancelEditButton = e.target.closest('.cancel-edit-btn');
    if (cancelEditButton) {
        app.setState({ editingMessageId: null });
    }

    if (e.target.closest('#sticker-btn')) {
        app.toggleUserStickerPanel();
    }

    if (e.target.closest('#send-message-btn')) {
        app.handleSendMessageWithSticker();
    }
}

/**
 * @param {Event} e
 * @param {PersonaChatApp} app
 * @returns {void}
 */
export function handleMainChatInput(e, app) {
    if (e.target.id === 'new-message-input') {
        const message = e.target.value;
        e.target.style.height = 'auto';
        e.target.style.height = (e.target.scrollHeight) + 'px';

        const sendButton = document.getElementById('send-message-btn');
        if (sendButton) {
            const hasText = message.trim() !== '';
            const hasImage = !!app.state.imageToSend;
            sendButton.disabled = (!hasText && !hasImage) || app.state.isWaitingForResponse;
        }
    }
}

/**
 * @param {KeyboardEvent} e
 * @param {PersonaChatApp} app 
 * @returns {void}
 */
export function handleMainChatKeypress(e, app) {
    if (e.target.id === 'new-message-input' && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const sendButton = document.getElementById('send-message-btn');
        if (sendButton && !sendButton.disabled) {
            sendButton.click();
        }
    }
    if (e.target.classList.contains('edit-message-textarea') && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        app.handleSaveEditedMessage(parseFloat(e.target.dataset.id));
    }
}

/**
 * @param {Event} e
 * @param {PersonaChatApp} app
 * @returns {void}
 */
export function handleMainChatChange(e, app) {
    if (e.target.id === 'image-upload-input') {
        app.handleImageFileSelect(e);
    }
}
