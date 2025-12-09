<script lang="ts">
import { t } from "$root/i18n";
import { AlertTriangle } from "lucide-svelte";
import type { HypnosisSettings } from "$types/character";

export let hypnosis: HypnosisSettings = {};
</script>

<details class="group border-t border-gray-700/50 pt-4">
    <summary class="flex items-center justify-between cursor-pointer list-none">
        <h4 class="text-sm font-medium text-red-400">
            {t("hypnosis.hypnosisControl")}
        </h4>
        <slot name="chevron" />
    </summary>
    <div class="pt-4 space-y-4">
        <div
            class="bg-red-900/20 border border-red-700/30 rounded-lg p-3 text-xs text-red-300"
        >
            <div class="flex items-center space-x-2 mb-2">
                <AlertTriangle class="w-4 h-4" />
                <span class="font-medium">{t("hypnosis.dangerousFeature")}</span
                >
            </div>
            <p>{t("hypnosis.settingsWarning")}</p>
        </div>

        <div class="flex items-center justify-between">
            <label
                for="hypnosis-enabled"
                class="text-sm font-medium text-gray-300"
                >{t("hypnosis.enabled")}</label
            >
            <input
                id="hypnosis-enabled"
                type="checkbox"
                bind:checked={hypnosis.enabled}
                class="bg-gray-700 border-gray-600 text-red-600 focus:ring-red-500 rounded"
            />
        </div>

        <div
            class:opacity-50={!hypnosis.enabled}
            class:pointer-events-none={!hypnosis.enabled}
            class="space-y-4"
        >
            <div
                class="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg"
            >
                <div class="flex flex-col">
                    <label
                        for="sns-edit-access"
                        class="text-sm font-medium text-gray-300"
                        >SNS 내용 편집 권한</label
                    >
                    <p class="text-xs text-gray-400">
                        SNS 글 수정/삭제 기능 활성화
                    </p>
                </div>
                <input
                    id="sns-edit-access"
                    type="checkbox"
                    bind:checked={hypnosis.sns_edit_access}
                    class="accent-red-500 w-5 h-5"
                />
            </div>

            <div
                class="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg"
            >
                <div class="flex flex-col">
                    <label
                        for="affection-override"
                        class="text-sm font-medium text-gray-300"
                        >호감도 조작 활성화</label
                    >
                    <p class="text-xs text-gray-400">
                        호감도 수치를 강제로 조작합니다
                    </p>
                </div>
                <input
                    id="affection-override"
                    type="checkbox"
                    bind:checked={hypnosis.affection_override}
                    class="accent-red-500 w-5 h-5"
                />
            </div>

            <div
                class:opacity-50={!hypnosis.affection_override}
                class:pointer-events-none={!hypnosis.affection_override}
                class="space-y-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
            >
                <div>
                    <label
                        for="affection-control"
                        class="block text-sm font-medium text-gray-300 mb-2"
                        >{t("hypnosis.affectionControl")}</label
                    >
                    <input
                        id="affection-control"
                        type="range"
                        bind:value={hypnosis.affection}
                        min="0"
                        max="1"
                        step="0.01"
                        class="w-full accent-red-500"
                    />
                    <div
                        class="flex justify-between text-xs text-gray-400 mt-1"
                    >
                        <span>0%</span>
                        <span
                            >{Math.round(
                                (hypnosis.affection || 0) * 100
                            )}%</span
                        >
                        <span>100%</span>
                    </div>
                </div>
                <div>
                    <label
                        for="intimacy-control"
                        class="block text-sm font-medium text-gray-300 mb-2"
                        >{t("hypnosis.intimacyControl")}</label
                    >
                    <input
                        id="intimacy-control"
                        type="range"
                        bind:value={hypnosis.intimacy}
                        min="0"
                        max="1"
                        step="0.01"
                        class="w-full accent-red-500"
                    />
                    <div
                        class="flex justify-between text-xs text-gray-400 mt-1"
                    >
                        <span>0%</span>
                        <span
                            >{Math.round((hypnosis.intimacy || 0) * 100)}%</span
                        >
                        <span>100%</span>
                    </div>
                </div>
                <div>
                    <label
                        for="trust-control"
                        class="block text-sm font-medium text-gray-300 mb-2"
                        >{t("hypnosis.trustControl")}</label
                    >
                    <input
                        id="trust-control"
                        type="range"
                        bind:value={hypnosis.trust}
                        min="0"
                        max="1"
                        step="0.01"
                        class="w-full accent-red-500"
                    />
                    <div
                        class="flex justify-between text-xs text-gray-400 mt-1"
                    >
                        <span>0%</span>
                        <span>{Math.round((hypnosis.trust || 0) * 100)}%</span>
                        <span>100%</span>
                    </div>
                </div>
                <div>
                    <label
                        for="romance-control"
                        class="block text-sm font-medium text-gray-300 mb-2"
                        >{t("hypnosis.romanceControl")}</label
                    >
                    <input
                        id="romance-control"
                        type="range"
                        bind:value={hypnosis.romantic_interest}
                        min="0"
                        max="1"
                        step="0.01"
                        class="w-full accent-red-500"
                    />
                    <div
                        class="flex justify-between text-xs text-gray-400 mt-1"
                    >
                        <span>0%</span>
                        <span
                            >{Math.round(
                                (hypnosis.romantic_interest || 0) * 100
                            )}%</span
                        >
                        <span>100%</span>
                    </div>
                </div>
            </div>

            <div class="border-t border-gray-700 pt-4 space-y-3">
                <div class="flex items-center justify-between">
                    <label
                        for="force-love-unlock"
                        class="text-sm font-medium text-gray-300"
                        >{t("hypnosis.forceLoveUnlock")}</label
                    >
                    <input
                        id="force-love-unlock"
                        type="checkbox"
                        bind:checked={hypnosis.force_love_unlock}
                        class="bg-gray-700 border-gray-600 text-red-600 focus:ring-red-500 rounded"
                    />
                </div>
                <div class="flex items-center justify-between">
                    <label
                        for="sns-full-access"
                        class="text-sm font-medium text-gray-300"
                        >{t("hypnosis.snsFullAccess")}</label
                    >
                    <input
                        id="sns-full-access"
                        type="checkbox"
                        bind:checked={hypnosis.sns_full_access}
                        class="bg-gray-700 border-gray-600 text-red-600 focus:ring-red-500 rounded"
                    />
                </div>
                <div class="flex items-center justify-between">
                    <label
                        for="secret-account-access"
                        class="text-sm font-medium text-gray-300"
                        >{t("hypnosis.secretAccountAccess")}</label
                    >
                    <input
                        id="secret-account-access"
                        type="checkbox"
                        bind:checked={hypnosis.secret_account_access}
                        class="bg-gray-700 border-gray-600 text-red-600 focus:ring-red-500 rounded"
                    />
                </div>
            </div>
        </div>
    </div>
</details>
