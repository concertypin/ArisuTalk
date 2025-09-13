export function handleMainChatClick(e, app) {
  const messageInput = document.getElementById("new-message-input");
  const currentMessage = messageInput ? messageInput.value : "";

  if (e.target.closest("#open-input-options-btn")) {
    app.setState({
      showInputOptions: !app.state.showInputOptions,
      showUserStickerPanel: false,
      currentMessage,
    });
  } else if (e.target.closest("#sticker-btn")) {
    app.setState({
      showUserStickerPanel: !app.state.showUserStickerPanel,
      showInputOptions: false,
      currentMessage,
    });
  } else if (e.target.closest("#open-image-upload")) {
    document.getElementById("image-upload-input").click();
  } else if (e.target.closest("#cancel-image-preview")) {
    app.setState({ imageToSend: null });
  } else if (e.target.closest(".delete-msg-btn")) {
    const deleteMsgButton = e.target.closest(".delete-msg-btn");
    app.handleDeleteMessage(parseFloat(deleteMsgButton.dataset.id));
  } else if (e.target.closest(".edit-msg-btn")) {
    const editMsgButton = e.target.closest(".edit-msg-btn");
    app.handleEditMessage(parseFloat(editMsgButton.dataset.id));
  } else if (e.target.closest(".reroll-msg-btn")) {
    const rerollMsgButton = e.target.closest(".reroll-msg-btn");
    app.handleRerollMessage(parseFloat(rerollMsgButton.dataset.id));
  } else if (e.target.closest(".save-edit-btn")) {
    const saveEditButton = e.target.closest(".save-edit-btn");
    app.handleSaveEditedMessage(parseFloat(saveEditButton.dataset.id));
  } else if (e.target.closest(".cancel-edit-btn")) {
    app.setState({ editingMessageId: null });
  } else if (e.target.closest("#send-message-btn")) {
    app.handleSendMessageWithSticker();
  } else if (e.target.closest("#close-sticker-panel-btn")) {
    app.setState({ showUserStickerPanel: false });
  }

  // New handlers from ltxy12/main (as separate if statements)
  const generateSNSButton = e.target.closest(".generate-sns-btn");
  if (generateSNSButton) {
    app.handleGenerateSNSPost(parseFloat(generateSNSButton.dataset.id));
  }

  const generateNAIButton = e.target.closest(".generate-nai-btn");
  if (generateNAIButton) {
    app.handleGenerateNAISticker(parseFloat(generateNAIButton.dataset.id));
  }

  const addSNSMemoryButton = e.target.closest(".add-sns-memory-btn");
  if (addSNSMemoryButton) {
    app.handleAddToSNSMemory(parseFloat(addSNSMemoryButton.dataset.id));
  }

  // Sticker click - size toggle
  const stickerToggleBtn = e.target.closest(".sticker-toggle-btn");
  if (stickerToggleBtn) {
    e.preventDefault();
    e.stopPropagation();
    const messageId = parseFloat(stickerToggleBtn.dataset.messageId);
    if (messageId) {
      app.toggleStickerSize(messageId);
    }
  }
}

export function handleMainChatInput(e, app) {
  if (e.target.id === "new-message-input") {
    const message = e.target.value;
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";

    const sendButton = document.getElementById("send-message-btn");
    if (sendButton) {
      const hasText = message.trim() !== "";
      const hasImage = !!app.state.imageToSend;
      sendButton.disabled =
        (!hasText && !hasImage) || app.state.isWaitingForResponse;
    }
  }
}

export function handleMainChatKeypress(e, app) {
  if (e.target.id === "new-message-input" && e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const sendButton = document.getElementById("send-message-btn");
    if (sendButton && !sendButton.disabled) {
      sendButton.click();
    }
  }
  if (
    e.target.classList.contains("edit-message-textarea") &&
    e.key === "Enter" &&
    !e.shiftKey
  ) {
    e.preventDefault();
    app.handleSaveEditedMessage(parseFloat(e.target.dataset.id));
  }
}

export function handleMainChatChange(e, app) {
  if (e.target.id === "image-upload-input") {
    app.handleImageFileSelect(e);
  }
}
