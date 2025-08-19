export const en = {
    common: {
        cancel: 'Cancel',
        save: 'Save',
        confirm: 'Confirm',
        close: 'Close',
        delete: 'Delete',
        edit: 'Edit',
        done: 'Done',
    },
    characterModal: {
        memoryPlaceholder: 'Enter something to remember...',
        noStickers: 'No stickers yet.',
        editStickerName: 'Edit Name',
        deleteSticker: 'Delete',
        addContact: 'Add Contact',
        editContact: 'Edit Contact',
        profileImage: 'Profile Image',
        importContact: 'Import Contact',
        shareContact: 'Share Contact',
        nameLabel: 'Name',
        namePlaceholder: 'Enter a name',
        promptLabel: 'Persona',
        promptPlaceholder: 'Describe the character, background, relationships, memories, etc.',
        proactiveToggle: 'Allow Proactive Messages',
        advancedSettings: 'Advanced Settings',
        sticker: 'Stickers',
        addSticker: 'Add<br>Sticker',
        deselect: 'Deselect',
        selectMode: 'Select<br>Mode',
        selectAll: 'Select<br>All',
        deleteSelected: 'Delete<br>(<span id="selected-count">0</span>)',
        stickerSupport: 'Supports jpg, gif, png, bmp, webp, webm, mp4, mp3 (max 30MB each)',
        stickerCount: 'Stickers: {{count}}',
        totalStorage: 'Total storage usage: ',
        totalSize: 'Total size: ',
        memory: 'Memory',
        addMemory: 'Add Memory',
        responseSpeed: 'Message Responsiveness',
    },
    confirm: {
        cancel: 'Cancel',
        confirm: 'Confirm',
    },
    mainChat: {
        uploadPhoto: 'Upload Photo',
        addCaption: 'Add a caption...',
        stickerMessagePlaceholder: 'Message with sticker (optional)...',
        messagePlaceholder: 'Enter a message...',
        stickerLabel: 'Sticker: ',
        personaStickers: 'Persona Stickers',
        addSticker: 'Add Sticker',
        addStickerPrompt: 'Add a sticker',
        addStickerButton: 'Add Sticker',
        deletedSticker: '[Deleted Sticker: ',
        audio: 'Audio',
        sticker: 'Sticker',
        selectCharacter: 'Select a character',
        selectCharacterPrompt: 'Select a character from the sidebar to start messaging<br/>Or invite a new character',
    },
    promptModal: {
        title: 'Edit Prompts',
        mainChatPrompt: 'Main Chat Prompt',
        systemRules: '# System Rules',
        roleAndObjective: '# AI Role and Objective',
        memoryGeneration: '## Memory Generation',
        characterActing: '## Character Acting',
        messageWriting: '## Message Writing Style',
        language: '## Language',
        additionalInstructions: '## Additional Instructions',
        stickerUsage: '## Sticker Usage',
        resetToDefault: 'Reset to Default',
        randomFirstMessagePrompt: 'Random First Message Character Generation Prompt',
        profileCreationRules: '# Profile Creation Rules',
        backupPrompts: 'Backup Prompts',
        restorePrompts: 'Restore Prompts',
    },
    settings: {
        restore: 'Restore',
        delete: 'Delete',
        noSnapshots: 'No saved snapshots.',
        title: 'Settings',
        aiSettings: 'AI Settings',
        apiKey: 'API Key',
        apiKeyPlaceholder: 'Enter your Gemini API key',
        aiModel: 'AI Model',
        scale: 'Scale',
        uiSize: 'UI Size',
        small: 'Small',
        large: 'Large',
        yourPersona: 'Your Persona',
        yourName: 'What should I call you?',
        yourNamePlaceholder: 'Enter your name or nickname',
        yourDescription: 'Who are you?',
        yourDescriptionPlaceholder: 'Tell me about yourself',
        proactiveSettings: 'Proactive Message Settings',
        proactiveChat: 'Enable proactive messages for contacts',
        randomFirstMessage: 'Enable random first messages',
        characterCount: 'Number of characters to create',
        characterCountUnit: ' characters',
        messageFrequency: 'Message frequency (in minutes)',
        min: 'Min',
        max: 'Max',
        snapshots: 'Settings Snapshots',
        enableSnapshots: 'Enable Snapshots',
        dataManagement: 'Data Management',
        backup: 'Backup',
        restoreData: 'Restore',
        language: 'Language',
        languageEnglish: 'English',
        languageKorean: 'Korean',
    },
    sidebar: {
        startNewChat: 'Start a new chat',
        imageSent: 'Image sent',
        newChatRoom: 'New Chat Room',
        unknownCharacter: 'Unknown Character',
        chatRoomCount: ' chat rooms',
        startChatting: 'Start chatting',
        stickerSent: 'Sticker sent',
        rename: 'Rename',
        deleteChatRoom: 'Delete Chat Room',
        title: 'ArisuTalk',
        description: 'Invite/talk to your characters',
        searchPlaceholder: 'Search...',
        invite: 'Invite',
    },
    defaultCharacter: {
        name: 'Han Seoyeon'
    },
    modal: {
        noSpaceError: {
            title: "Not enough space",
            message: "The browser's storage is full. Please delete old conversations or back up and reset your data."
        },
        saveFailed: {
            title: "Save Failed",
            message: "Failed to save data. Please clear your browser cache."
        },
        localStorageSaveError: {
            title: "Save Error",
            message: "An error occurred while saving data."
        },
        promptSaveComplete: {
            title: "Save Complete",
            message: "The prompt has been saved successfully."
        },
        characterNameDescriptionNotFulfilled: {
            title: "Input Error",
            message: "Character name and prompt cannot be empty."
        },
        characterDeleteConfirm: {
            title: "Delete Character",
            message: "Are you sure you want to delete this character? The conversation will also be deleted."
        },
        imageFileSizeExceeded: {
            title: "File Size Exceeded",
            message: "Image file cannot exceed 5MB."
        },
        imageProcessingError: {
            title: "Image Error",
            message: "An error occurred while processing the image."
        },
        apiKeyRequired: {
            title: "API Key Required",
            message: "API key is not set. Please enter your API key in the settings menu."
        },
        messageGroupDeleteConfirm: {
            title: "Delete Message Group",
            message: "Are you sure you want to delete this message group?"
        },
        messageEmptyError: {
            title: "Error",
            message: "Message content cannot be empty."
        },
        imageTooSmallOrCharacterInfoTooLong: {
            title: "Save Error",
            message: "The image is too small or the character information is too long."
        },
        characterCardNoNameError: {
            title: "Save Error",
            message: "A name is required to save the character card."
        },
        characterCardNoAvatarImageError: {
            title: "Save Error",
            message: "A profile picture is required to save the character card."
        },
        avatarImageLoadError: {
            title: "Error",
            message: "Could not load avatar image."
        },
        avatarLoadSuccess: {
            title: "Load Success",
            message: "Character card information loaded successfully."
        },
        characterCardNoAvatarImageInfo: {
            title: "No Information",
            message: "This is a normal image file. Set as profile picture."
        },
        backupComplete: {
            title: "Backup Complete",
            message: "Data has been backed up successfully."
        },
        backupFailed: {
            title: "Backup Failed",
            message: "An error occurred while backing up data."
        },
        restoreFailed: {
            title: "Restore Failed",
            message: "The backup file is invalid or an error occurred while reading it."
        },
        restoreConfirm: {
            title: "Restore Data",
            message: "Restoring from a backup file will overwrite all current data. Do you want to continue?"
        },
        restoreComplete: {
            title: "Restore Complete",
            message: "Data has been restored successfully. The app will now reload."
        },
        promptBackupComplete: {
            title: "Prompt Backup Complete",
            message: "The prompt has been backed up successfully."
        },
        promptBackupFailed: {
            title: "Backup Failed",
            message: "An error occurred while backing up the prompt."
        },
        promptRestoreConfirm: {
            title: "Restore Prompt",
            message: "This will overwrite the current prompt content. You must press the save button to apply the changes. Do you want to continue?"
        },
        promptRestoreFailed: {
            title: "Prompt Restore Failed",
            message: "The prompt backup file is invalid or an error occurred while reading it."
        },
        cancelChanges: {
            title: "Cancel Changes",
            message: "There are unsaved changes. Are you sure you want to cancel?"
        },
        loadFailed: {
            title: "Load Failed"
        },
        deleteChatRoom: {
            title: "Delete Chat Room",
            message: "This chat room and all its messages will be deleted. Do you want to continue?"
        },
        editStickerName: {
            title: "Edit Sticker Name"
        },
        unsupportedFileType: {
            message: " is not a supported file type."
        },
        fileTooLarge: {
            title: "File Size Exceeded",
            message2: " is too large. (Max 30MB)"
        },
        fileProcessingError: {
            title: "File Processing Error",
            message: "An error occurred while processing the file."
        },
        stickerProcessingError: {
            title: "Sticker Processing Error",
            message: "An error occurred while processing "
        },
        cannotGenerateRandomCharacter: {
            message: "Cannot generate random character: User persona is not set."
        },
        failedToGenerateProfile: {
            message: "Failed to generate profile:"
        },
        invalidProfileName: {
            message: "Generated profile has invalid or empty name:"
        },
        invalidProfilePrompt: {
            message: "Generated profile has invalid or empty prompt:"
        },
        failedToGetFirstMessage: {
            message: "Failed to get first message from API:"
        },
        invalidFirstMessage: {
            message: "API did not return valid first messages:"
        },
        failedToGenerateRandomCharacter: {
            message: "Failed to generate and initiate single random character:"
        }
    },
    chat: {
        defaultChatName: "Default Chat",
        newChat: "New Chat",
        randomChatName: "Random Chat",
        startNewChat: "Start a new chat.",
        imageSent: "Image sent.",
        messageGenerationError: "Failed to generate message.",
    },
    characterModalSlider: {
        responseTime: {
            description: "How quickly do they check your messages?",
            low: "Almost instantly",
            high: "You have to call them"
        },
        thinkingTime: {
            description: "How deeply do they think when sending a message?",
            low: "Lost in thought",
            high: "Sends a message and then thinks"
        },
        reactivity: {
            description: "How do they react to the chat?",
            low: "Active JK gal",
            high: "Blunt"
        },
        tone: {
            description: "What kind of tone do they use when chatting with you?",
            low: "Polite and courteous",
            high: "Rude"
        }
    },
};