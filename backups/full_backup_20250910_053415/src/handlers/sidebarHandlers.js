export function handleSidebarClick(e, app) {
  const toggleSidebar = () =>
    app.setState({ sidebarCollapsed: !app.state.sidebarCollapsed });

  if (
    e.target.closest("#desktop-sidebar-toggle") ||
    e.target.closest("#mobile-sidebar-toggle")
  ) {
    toggleSidebar();
  }
  if (e.target.closest("#sidebar-backdrop")) {
    app.setState({ sidebarCollapsed: true });
  }
  if (e.target.closest("#open-new-character-modal")) {
    app.openNewCharacterModal();
  }
  if (e.target.closest("#open-create-group-chat-modal")) {
    app.setState({ showCreateGroupChatModal: true });
  }
  if (e.target.closest("#open-create-open-chat-modal")) {
    app.setState({ showCreateOpenChatModal: true });
  }

  // Handle group chat item click
  const groupChatItem = e.target.closest(".group-chat-item");
  if (groupChatItem) {
    const chatId = groupChatItem.dataset.chatId;
    if (chatId) {
      app.setState({ selectedChatId: chatId });
    }
  }

  // Handle open chat item click
  const openChatItem = e.target.closest(".open-chat-item");
  if (openChatItem) {
    const chatId = openChatItem.dataset.chatId;
    if (chatId) {
      app.setState({ selectedChatId: chatId });
    }
  }

  // Handle edit group chat button click
  const editGroupChatBtn = e.target.closest(".edit-group-chat-btn");
  if (editGroupChatBtn) {
    e.stopPropagation();
    const groupId = editGroupChatBtn.dataset.groupId;
    app.editGroupChat(groupId);
  }

  // Handle delete group chat button click
  const deleteGroupChatBtn = e.target.closest(".delete-group-chat-btn");
  if (deleteGroupChatBtn) {
    e.stopPropagation();
    const groupId = deleteGroupChatBtn.dataset.groupId;
    app.handleDeleteGroupChat(groupId);
  }

  // Handle delete open chat button click
  const deleteOpenChatBtn = e.target.closest(".delete-open-chat-btn");
  if (deleteOpenChatBtn) {
    e.stopPropagation();
    const openId = deleteOpenChatBtn.dataset.openId;
    app.handleDeleteOpenChat(openId);
  }

  // Handle edit character button click
  const editBtn = e.target.closest(".edit-character-btn");
  if (editBtn) {
    e.stopPropagation();
    const characterId = parseInt(editBtn.dataset.id);
    app.editCharacter(characterId);
  }

  // Handle delete character button click
  const deleteBtn = e.target.closest(".delete-character-btn");
  if (deleteBtn) {
    e.stopPropagation();
    const characterId = parseInt(deleteBtn.dataset.id);
    app.deleteCharacter(characterId);
  }

  // Handle rename chat room button click
  const renameChatRoomBtn = e.target.closest(".rename-chat-room-btn");
  if (renameChatRoomBtn) {
    e.stopPropagation();
    const chatRoomId = renameChatRoomBtn.dataset.chatRoomId;
    app.startEditingChatRoom(chatRoomId);
  }

  // Handle delete chat room button click
  const deleteChatRoomBtn = e.target.closest(".delete-chat-room-btn");
  if (deleteChatRoomBtn) {
    e.stopPropagation();
    const chatRoomId = deleteChatRoomBtn.dataset.chatRoomId;
    app.deleteChatRoom(chatRoomId);
  }

  // Handle confirm rename button click
  const confirmRenameBtn = e.target.closest(".confirm-rename-btn");
  if (confirmRenameBtn) {
    e.stopPropagation();
    const chatRoomId = confirmRenameBtn.dataset.chatRoomId;
    const chatRoomItem = confirmRenameBtn.closest(".chat-room-item");
    const input = chatRoomItem.querySelector('input[type="text"]');
    app.saveChatRoomName(chatRoomId, input.value);
  }
}

export function handleSidebarInput(e, app) {
  if (e.target.id === "search-input") {
    app.setState({ searchQuery: e.target.value });
  }
}
