export interface Application {
	setState(state: Record<string, any>): void;
	handleCreateGroupChat(): void;
	handleCreateOpenChat(): void;
	handleSaveGroupChatSettings(): void;
	openEditGroupChatModal(groupId: string): void;
	handleDeleteGroupChat(groupId: string): void;
	handleDeleteOpenChat(openId: string): void;
	selectChatRoom(chatId: string): void;
	[key: string]: any;
}
