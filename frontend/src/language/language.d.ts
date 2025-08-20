// We used d.ts for defining types.
// We can use JSDoc, but d.ts is easier.

export type Language = {
    common: {
        cancel: string,
        save: string,
        confirm: string,
        close: string,
        delete: string,
        edit: string,
        done: string,
    },
    characterModal: {
        memoryPlaceholder: string,
        noStickers: string,
        editStickerName: string,
        deleteSticker: string,
        addContact: string,
        editContact: string,
        profileImage: string,
        importContact: string,
        shareContact: string,
        nameLabel: string,
        namePlaceholder: string,
        promptLabel: string,
        promptPlaceholder: string,
        proactiveToggle: string,
        advancedSettings: string,
        sticker: string,
        addSticker: string,
        deselect: string,
        selectMode: string,
        selectAll: string,
        deleteSelected: string,
        stickerSupport: string,
        stickerCount: string,
        totalStorage: string,
        totalSize: string,
        memory: string,
        addMemory: string,
        responseSpeed: string,
    },
    confirm: {
        cancel: string,
        confirm: string,
    },
    mainChat: {
        uploadPhoto: string,
        addCaption: string,
        stickerMessagePlaceholder: string,
        messagePlaceholder: string,
        stickerLabel: string,
        personaStickers: string,
        addSticker: string,
        addStickerPrompt: string,
        addStickerButton: string,
        deletedSticker: string,
        audio: string,
        sticker: string,
        selectCharacter: string,
        selectCharacterPrompt: string,
    },
    promptModal: {
        title: string,
        mainChatPrompt: string,
        systemRules: string,
        roleAndObjective: string,
        memoryGeneration: string,
        characterActing: string,
        messageWriting: string,
        language: string,
        additionalInstructions: string,
        stickerUsage: string,
        resetToDefault: string,
        randomFirstMessagePrompt: string,
        profileCreationRules: string,
        backupPrompts: string,
        restorePrompts: string,
    },
    settings: {
        restore: string,
        delete: string,
        noSnapshots: string,
        title: string,
        aiSettings: string,
        apiKey: string,
        apiKeyPlaceholder: string,
        aiModel: string,
        scale: string,
        uiSize: string,
        small: string,
        large: string,
        yourPersona: string,
        yourName: string,
        yourNamePlaceholder: string,
        yourDescription: string,
        yourDescriptionPlaceholder: string,
        proactiveSettings: string,
        proactiveChat: string,
        randomFirstMessage: string,
        characterCount: string,
        characterCountUnit: string,
        messageFrequency: string,
        min: string,
        max: string,
        snapshots: string,
        enableSnapshots: string,
        dataManagement: string,
        backup: string,
        restoreData: string,
        language: string,
        languageEnglish: string,
        languageKorean: string,
    },
    sidebar: {
        startNewChat: string,
        imageSent: string,
        newChatRoom: string,
        unknownCharacter: string,
        chatRoomCount: string,
        startChatting: string,
        stickerSent: string,
        rename: string,
        deleteChatRoom: string,
        title: string,
        description: string,
        searchPlaceholder: string,
        invite: string,
    },
    defaultCharacter: {
        name: string
    },
    modal: {
        noSpaceError: {
            title: string,
            message: string
        },
        saveFailed: {
            title: string,
            message: string
        },
        localStorageSaveError: {
            title: string,
            message: string
        },
        promptSaveComplete: {
            title: string,
            message: string
        },
        characterNameDescriptionNotFulfilled: {
            title: string,
            message: string
        },
        characterDeleteConfirm: {
            title: string,
            message: string
        },
        imageFileSizeExceeded: {
            title: string,
            message: string
        },
        imageProcessingError: {
            title: string,
            message: string
        },
        apiKeyRequired: {
            title: string,
            message: string
        },
        messageGroupDeleteConfirm: {
            title: string,
            message: string
        },
        messageEmptyError: {
            title: string,
            message: string
        },
        imageTooSmallOrCharacterInfoTooLong: {
            title: string,
            message: string
        },
        characterCardNoNameError: {
            title: string,
            message: string
        },
        characterCardNoAvatarImageError: {
            title: string,
            message: string
        },
        avatarImageLoadError: {
            title: string,
            message: string
        },
        avatarLoadSuccess: {
            title: string,
            message: string
        },
        characterCardNoAvatarImageInfo: {
            title: string,
            message: string
        },
        backupComplete: {
            title: string,
            message: string
        },
        backupFailed: {
            title: string,
            message: string
        },
        restoreFailed: {
            title: string,
            message: string
        },
        restoreConfirm: {
            title: string,
            message: string
        },
        restoreComplete: {
            title: string,
            message: string
        },
        promptBackupComplete: {
            title: string,
            message: string
        },
        promptBackupFailed: {
            title: string,
            message: string
        },
        promptRestoreConfirm: {
            title: string,
            message: string
        },
        promptRestoreFailed: {
            title: string,
            message: string
        },
        promptRestoreComplete: {
            title: string,
            message: string
        },
        cancelChanges: {
            title: string,
            message: string
        },
        loadFailed: {
            title: string
        },
        deleteChatRoom: {
            title: string,
            message: string
        },
        editStickerName: {
            title: string
        },
        unsupportedFileType: {
            message: string
        },
        fileTooLarge: {
            title: string,
            message2: string
        },
        fileProcessingError: {
            title: string,
            message: string
        },
        stickerProcessingError: {
            title: string,
            message: string
        },
        cannotGenerateRandomCharacter: {
            message: string
        },
        failedToGenerateProfile: {
            message: string
        },
        invalidProfileName: {
            message: string
        },
        invalidProfilePrompt: {
            message: string
        },
        failedToGetFirstMessage: {
            message: string
        },
        invalidFirstMessage: {
            message: string
        },
        failedToGenerateRandomCharacter: {
            message: string
        }
    },
    chat: {
        defaultChatName: string,
        newChat: string,
        randomChatName: string,
        startNewChat: string,
        imageSent: string,
        messageGenerationError: string,
    },
    characterModalSlider: {
        responseTime: {
            description: string,
            low: string,
            high: string
        },
        thinkingTime: {
            description: string,
            low: string,
            high: string
        },
        reactivity: {
            description: string,
            low: string,
            high: string
        },
        tone: {
            description: string,
            low: string,
            high: string
        }
    },
};