export type StorageQuota<T extends number | string> = { canSave: boolean; current?: T; total?: T };
export abstract class StorageBackend {
    abstract load(key: string, defaultValue: any | null): Promise<any>;
    abstract save(key: string, value: any): Promise<void>;
    abstract checkQuotaNumeric(newData?: string, existingKey?: string): Promise<StorageQuota<number>>;
    abstract getUsage(): Promise<number>;
    appKeys = [
        "personaChat_settings_v16",
        "personaChat_characters_v16",
        "personaChat_messages_v16",
        "personaChat_unreadCounts_v16",
        "personaChat_chatRooms_v16",
        "personaChat_groupChats_v16",
        "personaChat_openChats_v16",
        "personaChat_characterStates_v16",
        "personaChat_userStickers_v16",
    ];
    async checkQuota(newData: string = "", existingKey: string = ""): Promise<StorageQuota<string>> {
        const result = await this.checkQuotaNumeric(newData, existingKey);
        if (result.current !== undefined && result.total !== undefined) {
            return {
                canSave: result.canSave,
                current: this.formatBytes(result.current),
                total: this.formatBytes(result.total),
            };
        } else {
            return { canSave: result.canSave };
        }
    }
    formatBytes(bytes: number): string {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

}