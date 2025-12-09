import type { Application } from "../types/app";

/**
 * Group Chat & Open Chat Handlers
 * 단톡방 및 오픈톡방 관련 이벤트 핸들러들
 */

export function handleGroupChatClick(e: MouseEvent, app: Application): void {
    if (!(e.target instanceof Element)) {
        return;
    }

    // 단톡방 생성 모달
    if (e.target.closest("#open-create-group-chat-modal")) {
        app.setState({ showCreateGroupChatModal: true });
        return;
    }
    if (e.target.closest("#close-create-group-chat-modal")) {
        app.setState({ showCreateGroupChatModal: false });
        return;
    }
    if (e.target.closest("#create-group-chat-btn")) {
        app.handleCreateGroupChat();
        return;
    }

    // 오픈톡방 생성 모달
    if (e.target.closest("#open-create-open-chat-modal")) {
        app.setState({ showCreateOpenChatModal: true });
        return;
    }
    if (e.target.closest("#close-create-open-chat-modal")) {
        app.setState({ showCreateOpenChatModal: false });
        return;
    }
    if (e.target.closest("#create-open-chat-btn")) {
        app.handleCreateOpenChat();
        return;
    }

    // 단톡방 수정 모달
    if (e.target.closest("#close-edit-group-chat-modal")) {
        app.setState({ showEditGroupChatModal: false, editingGroupChat: null });
        return;
    }
    if (e.target.closest("#cancel-edit-group-chat")) {
        app.setState({ showEditGroupChatModal: false, editingGroupChat: null });
        return;
    }
    if (e.target.closest("#save-edit-group-chat")) {
        app.handleSaveGroupChatSettings();
        return;
    }

    // 단톡방 편집/삭제 버튼
    const editGroupChatBtn = e.target.closest<HTMLElement>(
        ".edit-group-chat-btn",
    );
    if (editGroupChatBtn) {
        const groupId = editGroupChatBtn.dataset.groupId;
        if (groupId) app.openEditGroupChatModal(groupId);
        return;
    }

    const deleteGroupChatBtn = e.target.closest<HTMLElement>(
        ".delete-group-chat-btn",
    );
    if (deleteGroupChatBtn) {
        const groupId = deleteGroupChatBtn.dataset.groupId;
        if (groupId) app.handleDeleteGroupChat(groupId);
        return;
    }

    // 오픈톡방 삭제 버튼
    const deleteOpenChatBtn = e.target.closest<HTMLElement>(
        ".delete-open-chat-btn",
    );
    if (deleteOpenChatBtn) {
        const openId = deleteOpenChatBtn.dataset.openId;
        if (openId) app.handleDeleteOpenChat(openId);
        return;
    }

    // 단톡방/오픈톡방 선택
    const groupChatItem = e.target.closest<HTMLElement>(".group-chat-item");
    if (groupChatItem) {
        const chatId = groupChatItem.dataset.chatId;
        if (chatId) app.selectChatRoom(chatId);
        return;
    }

    const openChatItem = e.target.closest<HTMLElement>(".open-chat-item");
    if (openChatItem) {
        const chatId = openChatItem.dataset.chatId;
        if (chatId) app.selectChatRoom(chatId);
        return;
    }
}
