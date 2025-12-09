<script lang="ts">
import { t } from "$root/i18n";
import { onMount } from "svelte";
import { ChevronRight } from "lucide-svelte";
import type { LogEntry } from "$types/log";

export let log: LogEntry;

let promptContent = "";

const getLogTypeColor = (
	type: string,
	data: Record<string, any> | undefined,
) => {
	if (type === "structured") {
		const chatType = data?.metadata?.chatType || "normal";
		switch (chatType) {
			case "group":
				return "text-green-400";
			case "open":
				return "text-purple-400";
			case "nai_generation":
				return "text-pink-400";
			case "sns_generation":
				return "text-pink-400";
			default:
				return "text-blue-400";
		}
	}
	return "text-gray-400";
};

const typeColor = getLogTypeColor(log.type, log.data);
const chatType = log.data?.metadata?.chatType || "normal";
const chatTypeLabel =
	{
		normal: t("debugLogs.normalChatType"),
		group: t("debugLogs.groupChatType"),
		open: t("debugLogs.openChatType"),
		nai_generation: t("debugLogs.naiGeneration"),
		sns_generation: t("debugLogs.snsPostType"),
	}[chatType as string] || t("debugLogs.normalChatType");

function formatTimestamp(timestamp: string | number | undefined) {
	if (!timestamp) return t("debugLogs.invalidDate");
	const date =
		typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);
	if (isNaN(date.getTime())) {
		return t("debugLogs.invalidDate");
	}
	return date.toLocaleString();
}

async function getChatPromptContent(chatType: string) {
	const promptFileMap: Record<string, string> = {
		general: "/src/texts/mainChatMLPrompt.txt",
		normal: "/src/texts/mainChatMLPrompt.txt",
		group: "/src/texts/groupChatMLPrompt.txt",
		open: "/src/texts/openChatMLPrompt.txt",
		nai: "/src/texts/naiStickerPrompt.txt",
		sns: "/src/texts/snsForcePrompt.txt",
		character_generation: "/src/texts/profileCreationChatMLPrompt.txt",
	};
	const promptFile = promptFileMap[chatType] || promptFileMap["general"];
	try {
		const response = await fetch(promptFile);
		if (response.ok) {
			return await response.text();
		}
	} catch (error) {
		console.warn(
			`Failed to load prompt file for chat type: ${chatType}`,
			error,
		);
	}
	return t("debugLogs.promptLoadError", { chatType });
}

onMount(async () => {
	promptContent = await getChatPromptContent(chatType);
});
</script>

<div class="border border-gray-600 rounded-lg bg-gray-750">
    <div class="p-4 border-b border-gray-600">
        <div class="flex justify-between items-start mb-3">
            <div class="flex flex-col">
                <div class="text-lg font-bold text-white mb-1">
                    {log.characterName || t("debugLogs.unknown")}
                    <span
                        class="{typeColor} text-sm font-semibold px-2 py-1 rounded-md bg-gray-700"
                        >[{chatTypeLabel}]</span
                    >
                </div>
                <div class="text-xs text-gray-400">
                    {formatTimestamp(log.timestamp)}
                </div>
            </div>
        </div>
        {#if log.data?.metadata}
            <div class="text-xs text-gray-500">
                {t("debugLogs.chatRoom")}: {log.data.metadata.chatId || "N/A"} |
                {t("debugLogs.api")}: {log.data.metadata.apiProvider || "N/A"} |
                {t("debugLogs.model")}: {log.data.metadata.model || "N/A"}
            </div>
        {/if}
    </div>

    <div class="divide-y divide-gray-600">
        {#if log.data?.personaInput}
            <details class="group">
                <summary
                    class="p-3 cursor-pointer text-sm font-medium text-blue-300 hover:bg-gray-700 group-open:bg-gray-700 flex items-center"
                >
                    <ChevronRight
                        class="w-4 h-4 mr-2 group-open:transform group-open:rotate-90 transition-transform"
                    />
                    Persona Input
                </summary>
                <div class="p-3 bg-gray-800 text-xs">
                    <pre class="text-gray-300 overflow-x-auto">{JSON.stringify(
                            log.data.personaInput,
                            null,
                            2
                        )}</pre>
                </div>
            </details>
        {/if}

        <details class="group">
            <summary
                class="p-3 cursor-pointer text-sm font-medium text-yellow-300 hover:bg-gray-700 group-open:bg-gray-700 flex items-center"
            >
                <ChevronRight
                    class="w-4 h-4 mr-2 group-open:transform group-open:rotate-90 transition-transform"
                />
                Chat Prompt
            </summary>
            <div class="p-3 bg-gray-800 text-xs">
                <pre
                    class="text-gray-300 overflow-x-auto whitespace-pre-wrap">{promptContent ||
                        "Loading..."}</pre>
            </div>
        </details>

        {#if log.data?.outputResponse}
            <details class="group">
                <summary
                    class="p-3 cursor-pointer text-sm font-medium text-green-300 hover:bg-gray-700 group-open:bg-gray-700 flex items-center"
                >
                    <ChevronRight
                        class="w-4 h-4 mr-2 group-open:transform group-open:rotate-90 transition-transform"
                    />
                    Character Response
                </summary>
                <div class="p-3 bg-gray-800 text-xs">
                    <pre class="text-gray-300 overflow-x-auto">{JSON.stringify(
                            log.data.outputResponse,
                            null,
                            2
                        )}</pre>
                </div>
            </details>
        {/if}

        {#if log.data?.parameters}
            <details class="group">
                <summary
                    class="p-3 cursor-pointer text-sm font-medium text-purple-300 hover:bg-gray-700 group-open:bg-gray-700 flex items-center"
                >
                    <ChevronRight
                        class="w-4 h-4 mr-2 group-open:transform group-open:rotate-90 transition-transform"
                    />
                    Parameters
                </summary>
                <div class="p-3 bg-gray-800 text-xs">
                    <pre class="text-gray-300 overflow-x-auto">{JSON.stringify(
                            log.data.parameters,
                            null,
                            2
                        )}</pre>
                </div>
            </details>
        {/if}

        {#if log.data?.metadata}
            <details class="group">
                <summary
                    class="p-3 cursor-pointer text-sm font-medium text-gray-300 hover:bg-gray-700 group-open:bg-gray-700 flex items-center"
                >
                    <ChevronRight
                        class="w-4 h-4 mr-2 group-open:transform group-open:rotate-90 transition-transform"
                    />
                    Metadata
                </summary>
                <div class="p-3 bg-gray-800 text-xs">
                    <pre class="text-gray-300 overflow-x-auto">{JSON.stringify(
                            log.data.metadata,
                            null,
                            2
                        )}</pre>
                </div>
            </details>
        {/if}
    </div>
</div>
