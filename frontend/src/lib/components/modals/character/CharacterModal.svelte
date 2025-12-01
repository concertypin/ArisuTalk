<script>
import { onMount, onDestroy } from "svelte";
import { get } from "svelte/store";
import { t } from "$root/i18n";
import {
    characters,
    editingCharacter,
    phonebookImportResult,
} from "../../../stores/character";
import { settings, experimentalTracingOptIn } from "../../../stores/settings";
import {
    isCharacterModalVisible,
    isSNSCharacterListModalVisible,
    isPhonebookModalVisible,
    phonebookAccessState,
} from "../../../stores/ui";
import {
    X,
    Image,
    Upload,
    Download,
    ChevronDown,
    Sparkles,
    MessageSquarePlus,
    Instagram,
} from "lucide-svelte";
import { fade } from "svelte/transition";
import { createEventDispatcher } from "svelte";
import CharacterMemory from "./CharacterMemory.svelte";
import CharacterStickers from "./CharacterStickers.svelte";
import CharacterAISettings from "./CharacterAISettings.svelte";
import CharacterHypnosis from "./CharacterHypnosis.svelte";
import { APIManager } from "../../../api/apiManager";
import { auth } from "../../../stores/auth";
import {
    dataUrlToUint8Array,
    uint8ArrayToDataUrl,
    addPngChunk,
    extractPngChunk,
    compressData,
    decompressData,
} from "../../../utils/png-utils";

const dispatch = createEventDispatcher();

let isNew = false;
let characterData = {};
let avatarInput;
let cardInput;
let isGeneratingPersona = false;
const apiManager = new APIManager();
let phonebookUnsubscribe;
let isCheckingPhonebook = false;

const defaultHypnosis = {
    enabled: false,
    affection: 0.5,
    intimacy: 0.5,
    trust: 0.5,
    romantic_interest: 0,
    force_love_unlock: false,
    sns_full_access: false,
    secret_account_access: false,
    sns_edit_access: false,
    affection_override: false,
};

editingCharacter.subscribe((char) => {
    if (char) {
        isNew = false;
        characterData = JSON.parse(JSON.stringify(char)); // Deep copy
        if (!characterData.memories) characterData.memories = [];
        if (!characterData.stickers) characterData.stickers = [];
        if (!characterData.naiSettings)
            characterData.naiSettings = {
                qualityPrompt: "masterpiece, best quality",
                autoGenerate: false,
            };
        if (!characterData.hypnosis)
            characterData.hypnosis = { ...defaultHypnosis };
    } else {
        isNew = true;
        characterData = {
            name: "",
            prompt: "",
            avatar: null,
            appearance: "",
            proactiveEnabled: true,
            responseTime: 5,
            thinkingTime: 5,
            reactivity: 5,
            tone: 5,
            memories: [],
            stickers: [],
            naiSettings: {
                qualityPrompt: "masterpiece, best quality",
                autoGenerate: false,
            },
            hypnosis: { ...defaultHypnosis },
        }; // Default new character
    }
});

function closeModal() {
    isCharacterModalVisible.set(false);
    editingCharacter.set(null);
}

function saveCharacter() {
    if (isNew) {
        characters.update((chars) => {
            const newChar = { ...characterData, id: `char_${Date.now()}` };
            return [...chars, newChar];
        });
    } else {
        characters.update((chars) => {
            const index = chars.findIndex((c) => c.id === characterData.id);
            if (index !== -1) {
                chars[index] = characterData;
            }
            return chars;
        });
    }
    closeModal();
}

function selectAvatar() {
    avatarInput.click();
}

function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        characterData.avatar = e.target.result;
        // Force reactivity
        characterData = characterData;
    };
    reader.readAsDataURL(file);
}

async function generatePersona() {
    if (!characterData.name.trim()) {
        alert(t("modal.characterNameRequiredMessage"));
        return;
    }

    isGeneratingPersona = true;
    try {
        const provider = $settings.apiProvider;
        const config = $settings.apiConfigs[provider] || {};
        const generatedPrompt = await apiManager.generateCharacterSheet(
            provider,
            config.apiKey,
            config.model,
            {
                characterName: characterData.name,
                systemPrompt: $settings.prompts.characterSheet,
            },
            config.baseUrl,
        );
        characterData.prompt = generatedPrompt;
    } catch (error) {
        console.error("Error generating character prompt:", error);
        alert(`${t("modal.generationFailed.title")}: ${error.message}`);
    } finally {
        isGeneratingPersona = false;
    }
}

function importCard() {
    cardInput.click();
}

async function handleCardChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const imageSrc = e.target.result;
        const image = new Image();
        image.onload = async () => {
            try {
                const pngData = dataUrlToUint8Array(imageSrc);

                let chunkData = extractPngChunk(pngData, "cChr");
                let jsonString;

                if (chunkData) {
                    const decompressedData = await compressData(chunkData);
                    jsonString = new TextDecoder().decode(decompressedData);
                } else {
                    chunkData = extractPngChunk(pngData, "chAr");
                    if (chunkData) {
                        jsonString = new TextDecoder().decode(chunkData);
                    }
                }

                if (jsonString) {
                    const data = JSON.parse(jsonString);
                    if (data.source === "PersonaChatAppCharacterCard") {
                        characterData = {
                            ...characterData,
                            ...data,
                            avatar: imageSrc,
                        };
                        alert(t("modal.avatarLoadSuccess.message"));
                        return;
                    }
                }
            } catch (err) {
                console.error(
                    "Failed to parse character data from image:",
                    err,
                );
            }

            alert(t("modal.characterCardNoAvatarImageInfo.message"));
            characterData.avatar = imageSrc;
            characterData = characterData;
        };
        image.src = imageSrc;
    };
    reader.readAsDataURL(file);
}

async function exportCard() {
    if (!characterData.name) {
        alert(t("modal.characterCardNoNameError.message"));
        return;
    }
    if (!characterData.avatar) {
        alert(t("modal.characterCardNoAvatarImageError.message"));
        return;
    }

    const dataToSave = {
        name: characterData.name,
        prompt: characterData.prompt,
        responseTime: characterData.responseTime,
        thinkingTime: characterData.thinkingTime,
        reactivity: characterData.reactivity,
        tone: characterData.tone,
        source: "PersonaChatAppCharacterCard",
        memories: characterData.memories,
        proactiveEnabled: characterData.proactiveEnabled,
        stickers: characterData.stickers,
    };

    const image = new Image();
    image.crossOrigin = "Anonymous";
    image.onload = async () => {
        try {
            const canvas = document.createElement("canvas");
            canvas.width = 1024;
            canvas.height = 1024;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

            const jsonString = JSON.stringify(dataToSave);
            const dataUrl = canvas.toDataURL("image/png");
            const pngData = dataUrlToUint8Array(dataUrl);
            const characterDataBytes = new TextEncoder().encode(jsonString);
            const compressedData = await compressData(characterDataBytes);
            const newPngData = addPngChunk(pngData, "cChr", compressedData);
            const newDataUrl = uint8ArrayToDataUrl(newPngData);

            const link = document.createElement("a");
            link.href = newDataUrl;
            link.download = `${characterData.name}_card.png`;
            link.click();
        } catch (error) {
            console.error("Character card save failed:", error);
            alert(t("modal.characterCardSaveError.message"));
        }
    };
    image.onerror = () => alert(t("modal.avatarImageLoadError.message"));
    image.src = characterData.avatar;
}

function handleKeydown(event) {
    if (event.key === "Escape") {
        closeModal();
    }
}

onMount(() => {
    window.addEventListener("keydown", handleKeydown);

    phonebookUnsubscribe = phonebookImportResult.subscribe((result) => {
        if (!result) {
            return;
        }

        const imported = result.character;
        const mergedData = {
            ...characterData,
            ...imported,
        };

        if (imported.avatar !== undefined) {
            mergedData.avatar = imported.avatar;
        }

        if (!mergedData.memories) {
            mergedData.memories = [];
        }
        if (!mergedData.stickers) {
            mergedData.stickers = [];
        }
        if (!mergedData.naiSettings) {
            mergedData.naiSettings = {
                qualityPrompt: "masterpiece, best quality",
                autoGenerate: false,
            };
        }
        if (!mergedData.hypnosis) {
            mergedData.hypnosis = { ...defaultHypnosis };
        }

        characterData = mergedData;
        isNew = true;
        phonebookImportResult.set(null);
    });

    // Auto-verify phonebook access when modal mounts so button is only shown when enabled.
    (async () => {
        if (!$experimentalTracingOptIn) {
            phonebookAccessState.set("disabled");
            return;
        }

        if (!$auth.isSignedIn) return;
        const access = get(phonebookAccessState);
        if (access !== "unknown") return;

        isCheckingPhonebook = true;
        try {
            const service = await import(
                "../../../services/phonebookService.ts"
            );
            const allowed = await service.verifyPhonebookAccess($auth.clerk);
            phonebookAccessState.set(allowed ? "enabled" : "disabled");
        } catch (error) {
            console.error("Phonebook auto verification failed", error);
            phonebookAccessState.set("disabled");
        } finally {
            isCheckingPhonebook = false;
        }
    })();
});

onDestroy(() => {
    window.removeEventListener("keydown", handleKeydown);
    phonebookUnsubscribe?.();
});

/**
 * Attempt to open the shared phonebook modal for importing characters.
 * Ensures the feature flag check passes before revealing the modal.
 */
async function openPhonebook() {
    if (!$experimentalTracingOptIn) {
        alert(t("phonebook.experimentalRequired"));
        return;
    }

    if (!$auth.isSignedIn) {
        alert(t("phonebook.signInRequired"));
        return;
    }

    let access = get(phonebookAccessState);
    if (access === "disabled") {
        return;
    }

    let verificationFailed = false;

    if (access === "unknown") {
        isCheckingPhonebook = true;
        try {
            const service = await import(
                "../../../services/phonebookService.ts"
            );
            const allowed = await service.verifyPhonebookAccess($auth.clerk);
            phonebookAccessState.set(allowed ? "enabled" : "disabled");
            verificationFailed = !allowed;
        } catch (error) {
            console.error("Phonebook availability check failed", error);
            phonebookAccessState.set("disabled");
            verificationFailed = true;
        } finally {
            isCheckingPhonebook = false;
        }
        access = get(phonebookAccessState);
    }

    if (access !== "enabled") {
        if (verificationFailed) {
            alert(t("phonebook.checkFailed"));
        }
        return;
    }

    isPhonebookModalVisible.set(true);
}
</script>

{#if $isCharacterModalVisible}
    <div
        transition:fade={{ duration: 200 }}
        id="character-modal-backdrop"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
        <div
            id="character-modal-panel"
            role="dialog"
            aria-modal="true"
            tabindex="0"
            aria-labelledby="character-modal-title"
            class="bg-gray-800 rounded-2xl w-full max-w-md mx-auto my-auto flex flex-col max-h-[90vh]"
            on:click|stopPropagation
            on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                }
            }}
        >
            <div
                class="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0"
            >
                <h3
                    id="character-modal-title"
                    class="text-xl font-semibold text-white"
                >
                    {isNew
                        ? t("characterModal.addContact")
                        : t("characterModal.editContact")}
                </h3>
                <div class="flex items-center gap-2">
                    {#if !isNew}
                        <button
                            on:click={() =>
                                isSNSCharacterListModalVisible.set(true)}
                            class="p-2 md:p-2 hover:bg-gray-700 rounded-full transition-colors z-20"
                            title={t("characterModal.openSNS")}
                        >
                            <Instagram
                                class="w-6 h-6 md:w-5 md:h-5 text-gray-300"
                            />
                        </button>
                    {/if}
                    <button
                        on:click={closeModal}
                        class="p-1 hover:bg-gray-700 rounded-full"
                    >
                        <X class="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div class="p-6 space-y-6 overflow-y-auto">
                <!-- Profile Section -->
                <div class="flex items-center space-x-4">
                    <div
                        class="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden shrink-0"
                    >
                        {#if characterData.avatar}
                            <img
                                src={characterData.avatar}
                                alt="Avatar Preview"
                                class="w-full h-full object-cover"
                            />
                        {:else}
                            <Image class="w-8 h-8 text-gray-400" />
                        {/if}
                    </div>
                    <div class="flex flex-col gap-2">
                        <button
                            on:click={selectAvatar}
                            class="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <Image class="w-4 h-4" />
                            {t("characterModal.profileImage")}
                        </button>
                        <button
                            on:click={importCard}
                            class="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <Upload class="w-4 h-4" />
                            {t("characterModal.importContact")}
                        </button>

                        {#if $auth.isSignedIn && $phonebookAccessState === "enabled"}
                            <button
                                on:click={openPhonebook}
                                class="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                            >
                                <MessageSquarePlus class="w-4 h-4" />
                                {t("characterModal.browsePhonebook")}
                            </button>
                        {/if}

                        <button
                            on:click={exportCard}
                            class="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <Download class="w-4 h-4" />
                            {t("characterModal.shareContact")}
                        </button>
                    </div>
                    <input
                        type="file"
                        accept="image/png,image/jpeg"
                        bind:this={avatarInput}
                        on:change={handleAvatarChange}
                        class="hidden"
                    />
                    <input
                        type="file"
                        accept="image/png"
                        bind:this={cardInput}
                        on:change={handleCardChange}
                        class="hidden"
                    />
                </div>
                <div>
                    <label
                        for="character-name"
                        class="text-sm font-medium text-gray-300 mb-2 block"
                        >{t("characterModal.nameLabel")}</label
                    >
                    <input
                        id="character-name"
                        bind:value={characterData.name}
                        type="text"
                        placeholder={t("characterModal.namePlaceholder")}
                        class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
                    />
                </div>
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <label
                            for="character-prompt"
                            class="text-sm font-medium text-gray-300"
                            >{t("characterModal.promptLabel")}</label
                        >
                        <button
                            on:click={generatePersona}
                            disabled={isGeneratingPersona}
                            class="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {#if isGeneratingPersona}
                                <div
                                    class="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"
                                ></div>
                            {:else}
                                <Sparkles class="w-3 h-3" /> AI {t(
                                    "ui.generate"
                                )}
                            {/if}
                        </button>
                    </div>
                    <textarea
                        id="character-prompt"
                        bind:value={characterData.prompt}
                        placeholder={t("characterModal.promptPlaceholder")}
                        class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
                        rows="6"
                    ></textarea>
                </div>

                <CharacterAISettings
                    bind:appearance={characterData.appearance}
                    bind:naiQualityPrompt={
                        characterData.naiSettings.qualityPrompt
                    }
                    bind:naiAutoGenerate={
                        characterData.naiSettings.autoGenerate
                    }
                />

                <details class="group border-t border-gray-700/50 pt-4">
                    <summary
                        class="flex items-center justify-between cursor-pointer list-none"
                    >
                        <span class="text-base font-medium text-gray-200"
                            >{t("characterModal.advancedSettings")}</span
                        >
                        <ChevronDown
                            class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"
                        />
                    </summary>
                    <div class="pt-6 space-y-6">
                        <div class="border-b border-gray-700/50 pb-6">
                            <label
                                class="flex items-center justify-between text-sm font-medium text-gray-300 cursor-pointer"
                            >
                                <span class="flex items-center"
                                    ><MessageSquarePlus
                                        class="w-4 h-4 mr-2"
                                    />{t(
                                        "characterModal.proactiveToggle"
                                    )}</span
                                >
                                <div
                                    class="relative inline-block w-10 align-middle select-none"
                                >
                                    <input
                                        type="checkbox"
                                        bind:checked={
                                            characterData.proactiveEnabled
                                        }
                                        id="character-proactive-toggle"
                                        class="absolute opacity-0 w-0 h-0 peer"
                                    />
                                    <label
                                        for="character-proactive-toggle"
                                        class="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-blue-600"
                                    ></label>
                                    <span
                                        class="absolute left-0.5 top-0.5 block w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"
                                    ></span>
                                </div>
                            </label>
                        </div>

                        <details class="group pt-2">
                            <summary
                                class="flex items-center justify-between cursor-pointer list-none py-2"
                            >
                                <h4 class="text-sm font-medium text-gray-300">
                                    {t("characterModal.responseSpeed")}
                                </h4>
                                <ChevronDown
                                    class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"
                                />
                            </summary>
                            <div class="pt-4 space-y-4">
                                <div>
                                    <p
                                        class="text-sm font-medium text-gray-300 mb-2"
                                    >
                                        {t(
                                            "characterModalSlider.responseTime.description"
                                        )}
                                    </p>
                                    <input
                                        type="range"
                                        bind:value={characterData.responseTime}
                                        min="1"
                                        max="10"
                                        class="w-full"
                                    />
                                    <div
                                        class="flex justify-between text-xs text-gray-400 mt-1"
                                    >
                                        <span
                                            >{t(
                                                "characterModalSlider.responseTime.low"
                                            )}</span
                                        >
                                        <span
                                            >{t(
                                                "characterModalSlider.responseTime.high"
                                            )}</span
                                        >
                                    </div>
                                </div>
                                <div>
                                    <p
                                        class="text-sm font-medium text-gray-300 mb-2"
                                    >
                                        {t(
                                            "characterModalSlider.thinkingTime.description"
                                        )}
                                    </p>
                                    <input
                                        type="range"
                                        bind:value={characterData.thinkingTime}
                                        min="1"
                                        max="10"
                                        class="w-full"
                                    />
                                    <div
                                        class="flex justify-between text-xs text-gray-400 mt-1"
                                    >
                                        <span
                                            >{t(
                                                "characterModalSlider.thinkingTime.low"
                                            )}</span
                                        >
                                        <span
                                            >{t(
                                                "characterModalSlider.thinkingTime.high"
                                            )}</span
                                        >
                                    </div>
                                </div>
                                <div>
                                    <p
                                        class="text-sm font-medium text-gray-300 mb-2"
                                    >
                                        {t(
                                            "characterModalSlider.reactivity.description"
                                        )}
                                    </p>
                                    <input
                                        type="range"
                                        bind:value={characterData.reactivity}
                                        min="1"
                                        max="10"
                                        class="w-full"
                                    />
                                    <div
                                        class="flex justify-between text-xs text-gray-400 mt-1"
                                    >
                                        <span
                                            >{t(
                                                "characterModalSlider.reactivity.low"
                                            )}</span
                                        >
                                        <span
                                            >{t(
                                                "characterModalSlider.reactivity.high"
                                            )}</span
                                        >
                                    </div>
                                </div>
                                <div>
                                    <p
                                        class="text-sm font-medium text-gray-300 mb-2"
                                    >
                                        {t(
                                            "characterModalSlider.tone.description"
                                        )}
                                    </p>
                                    <input
                                        type="range"
                                        bind:value={characterData.tone}
                                        min="1"
                                        max="10"
                                        class="w-full"
                                    />
                                    <div
                                        class="flex justify-between text-xs text-gray-400 mt-1"
                                    >
                                        <span
                                            >{t(
                                                "characterModalSlider.tone.low"
                                            )}</span
                                        >
                                        <span
                                            >{t(
                                                "characterModalSlider.tone.high"
                                            )}</span
                                        >
                                    </div>
                                </div>
                            </div>
                        </details>

                        <CharacterStickers
                            bind:stickers={characterData.stickers}
                        >
                            <ChevronDown
                                slot="chevron"
                                class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"
                            />
                        </CharacterStickers>

                        <CharacterMemory bind:memories={characterData.memories}>
                            <ChevronDown
                                slot="chevron"
                                class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"
                            />
                        </CharacterMemory>
                    </div>
                </details>

                {#if !isNew}
                    <CharacterHypnosis bind:hypnosis={characterData.hypnosis}>
                        <ChevronDown
                            slot="chevron"
                            class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"
                        />
                    </CharacterHypnosis>
                {/if}
            </div>
            <div
                class="p-6 mt-auto border-t border-gray-700 shrink-0 flex justify-end space-x-3"
            >
                <button
                    on:click={closeModal}
                    class="flex-1 md:flex-none py-2.5 px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >{t("common.cancel")}</button
                >
                <button
                    on:click={saveCharacter}
                    class="flex-1 md:flex-none py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >{t("common.save")}</button
                >
            </div>
        </div>
    </div>
{/if}
