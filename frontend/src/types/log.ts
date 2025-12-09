export interface LogEntry {
	id?: number;
	timestamp?: string;
	type: string;
	characterName?: string;
	chatId?: string | null;
	chatType?: string;
	data?: Record<string, any>;
	level?: string;
	message?: string;
	[key: string]: any;
}
