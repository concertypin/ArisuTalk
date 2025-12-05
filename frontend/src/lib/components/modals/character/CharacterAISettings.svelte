<script>
    import { t } from "$root/i18n";
    import { Sparkles, TestTube, Loader } from "@lucide/svelte";
    import { stickerManager } from "../../../stores/services";
    import { settings } from "../../../stores/settings";
    import ImageResultModal from "../image/ImageResultModal.svelte";

    export let appearance = "";
    export let naiQualityPrompt = "";
    export let naiAutoGenerate = false;

    let isTesting = false;
    let showImageResultModal = false;
    let resultImageUrl = "";
    let resultPromptText = "";

    async function testAppearancePrompt() {
        if (!appearance.trim()) {
            alert("외모 설명을 입력해주세요.");
            return;
        }

        const naiApiKey = $settings.apiConfigs.novelai?.apiKey;
        if (!naiApiKey) {
            alert(
                "NAI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.",
            );
            return;
        }

        isTesting = true;

        try {
            const testCharacter = {
                id: "test",
                name: "테스트",
                appearance: appearance,
                naiSettings: {
                    qualityPrompt: naiQualityPrompt,
                },
            };

            const result = await $stickerManager.naiClient.generateSticker(
                testCharacter,
                "happy",
                {
                    naiSettings: $settings.naiSettings || {},
                },
            );

            if (result && result.dataUrl) {
                resultImageUrl = result.dataUrl;
                resultPromptText = appearance;
                showImageResultModal = true;
            } else {
                throw new Error(result?.error || "이미지 생성 실패");
            }
        } catch (error) {
            console.error("[Test] 외모 프롬프트 테스트 실패:", error);
            alert(`외모 프롬프트 테스트 실패: ${error.message}`);
        } finally {
            isTesting = false;
        }
    }
</script>

<div class="space-y-6">
    <!-- Appearance Description -->
    <div>
        <div class="flex items-center justify-between mb-2">
            <label
                for="appearance-prompt"
                class="text-sm font-medium text-gray-300"
                >외형 설명 (NAI 스티커 생성용)</label
            >
            <div
                class="text-xs text-gray-400 bg-purple-900/20 px-2 py-1 rounded"
            >
                <Sparkles class="w-3 h-3 inline mr-1" />스티커 생성
            </div>
        </div>
        <textarea
            id="appearance-prompt"
            bind:value={appearance}
            placeholder="예: young Korean woman, long black hair, school uniform, bright smile, casual modern clothes..."
            class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-purple-500/50 text-sm"
            rows="3"
        ></textarea>
        <div class="mt-2 flex justify-between items-center">
            <div class="flex items-center gap-2">
                <label for="nai-auto-generate" class="text-xs text-gray-400"
                    >NAI 자동 생성</label
                >
                <label class="relative inline-flex items-center cursor-pointer">
                    <input
                        id="nai-auto-generate"
                        type="checkbox"
                        bind:checked={naiAutoGenerate}
                        class="sr-only peer"
                    />
                    <div
                        class="w-9 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"
                    ></div>
                </label>
            </div>
            <button
                on:click={testAppearancePrompt}
                disabled={isTesting}
                class="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-1 disabled:opacity-50"
            >
                {#if isTesting}
                    <Loader class="w-3 h-3 animate-spin" />
                    테스트 중...
                {:else}
                    <TestTube class="w-3 h-3" />
                    외모 프롬프트 테스트
                {/if}
            </button>
        </div>
    </div>

    <!-- Quality Prompt -->
    <div>
        <div class="flex items-center justify-between mb-2">
            <label
                for="quality-prompt"
                class="text-sm font-medium text-gray-300"
                >품질 향상 프롬프트 (NAI 스티커 품질 개선용)</label
            >
            <div
                class="text-xs text-gray-400 bg-purple-900/20 px-2 py-1 rounded"
            >
                <Sparkles class="w-3 h-3 inline mr-1" />품질 개선
            </div>
        </div>
        <textarea
            id="quality-prompt"
            bind:value={naiQualityPrompt}
            placeholder="masterpiece, best quality, high resolution, detailed..."
            class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-purple-500/50 text-sm"
            rows="2"
        ></textarea>
        <div class="text-xs text-gray-400 mt-1">
            NAI 스티커 생성 시 이미지 품질을 향상시키는 키워드들 (영문 권장)
        </div>
    </div>
</div>

<ImageResultModal
    isOpen={showImageResultModal}
    imageUrl={resultImageUrl}
    promptText={resultPromptText}
    on:close={() => (showImageResultModal = false)}
/>
