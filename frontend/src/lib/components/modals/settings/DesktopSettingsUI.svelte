<script>
    import { onMount, onDestroy } from 'svelte';
    import { t } from '../../../../i18n.js';
    import { isDesktopSettingsModalVisible } from '../../../stores/ui';
    import { Settings, X, Globe, Palette, User, HardDrive, Cog, Info, Image, Shield } from 'lucide-svelte';
    import { isDevModeActive } from '../../../stores/ui';
    import { fade } from 'svelte/transition';
    import APISettingsPanel from './panels/APISettingsPanel.svelte';
    import AdvancedSettingsPanel from './panels/AdvancedSettingsPanel.svelte';
    import AppearanceSettingsPanel from './panels/AppearanceSettingsPanel.svelte';
    import CharacterDefaultsPanel from './panels/CharacterDefaultsPanel.svelte';
    import DataManagementPanel from './panels/DataManagementPanel.svelte';
    import NAISettingsPanel from './panels/NAISettingsPanel.svelte';
    import DebugSettingsPanel from './panels/DebugSettingsPanel.svelte';

    let activePanel = 'api'; // Default panel

    const navItems = [
        { id: 'api', icon: Globe, label: t("settings.aiSettings"), description: t("settings.apiDescription") },
        { id: 'nai', icon: Image, label: "🧪 NAI 스티커 생성", description: "NovelAI 기반 스티커 자동 생성 설정" },
        { id: 'appearance', icon: Palette, label: t("settings.appearanceSettings"), description: t("settings.appearanceDescription") },
        { id: 'character', icon: User, label: t("settings.characterDefaults"), description: t("settings.characterDescription") },
        { id: 'data', icon: HardDrive, label: t("settings.dataManagement"), description: t("settings.dataDescription") },
        { id: 'advanced', icon: Cog, label: t("settings.advancedSettings"), description: t("settings.advancedDescription") },
    ];

    const debugNavItem = { id: 'debug', icon: Shield, label: 'Debug', description: 'Data status and developer tools' };

    const panelTitles = {
        api: { title: t("settings.aiSettings"), subtitle: t("settings.apiSubtitle") },
        nai: { title: t("settings.naiSettings"), subtitle: "NovelAI 기반 스티커 자동 생성 설정" },
        appearance: { title: t("settings.appearanceSettings"), subtitle: t("settings.appearanceSubtitle") },
        character: { title: t("settings.characterDefaults"), subtitle: t("settings.characterSubtitle") },
        data: { title: t("settings.dataManagement"), subtitle: t("settings.dataSubtitle") },
        advanced: { title: t("settings.advancedSettings"), subtitle: t("settings.advancedSubtitle") },
        debug: { title: 'Debug Settings', subtitle: 'Tools for development and testing' },
    };

    function handleClose() {
        isDesktopSettingsModalVisible.set(false);
    }

    function handleSave() {
        // TODO: Implement save logic
        console.log("Saving settings...");
        handleClose();
    }

    function handleKeydown(event) {
        if (event.key === 'Escape') {
            handleClose();
        }
    }

    onMount(() => {
        window.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });

</script>

{#if $isDesktopSettingsModalVisible}
<div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 w-full h-full" transition:fade={{ duration: 150 }}>
    <div role="dialog" aria-modal="true" tabindex="0" aria-labelledby="settings-modal-title" class="bg-gray-800 rounded-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-700" on:click|stopPropagation on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); } }}>
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-700 shrink-0">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Settings class="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 id="settings-modal-title" class="text-xl font-semibold text-white">{t("settings.title")}</h3>
                    <p class="text-sm text-gray-400">{t("settings.settingsDescription")}</p>
                </div>
            </div>
            <button on:click={handleClose} class="p-2 hover:bg-gray-700 rounded-lg transition-colors group">
                <X class="w-6 h-6 text-gray-400 group-hover:text-white" />
            </button>
        </div>

        <!-- Main Content -->
        <div class="flex flex-1 min-h-0">
            <!-- Sidebar Navigation -->
            <div class="w-80 border-r border-gray-700 flex flex-col">
                <div class="p-4 border-b border-gray-700">
                    <h4 class="text-sm font-medium text-gray-400 uppercase tracking-wider">{t("settings.settingsCategories")}</h4>
                </div>
                <nav class="flex-1 p-4 space-y-2">
                    {#each navItems as item (item.id)}
                        <button
                            class="w-full text-left p-3 rounded-lg transition-all duration-200 flex items-start gap-3 {activePanel === item.id ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400' : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'}"
                            on:click={() => activePanel = item.id}
                        >
                            <div class="flex-shrink-0 w-5 h-5 mt-0.5">
                                <svelte:component this={item.icon} class="w-5 h-5" />
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="font-medium text-sm">{item.label}</div>
                                <div class="text-xs opacity-75 mt-0.5">{item.description}</div>
                            </div>
                        </button>
                    {/each}
                    {#if $isDevModeActive}
                        <div class="border-t border-gray-700 my-2"></div>
                        <button
                            class="w-full text-left p-3 rounded-lg transition-all duration-200 flex items-start gap-3 {activePanel === debugNavItem.id ? 'bg-red-600/20 border border-red-500/30 text-red-400' : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'}"
                            on:click={() => activePanel = debugNavItem.id}
                        >
                            <div class="flex-shrink-0 w-5 h-5 mt-0.5">
                                <svelte:component this={debugNavItem.icon} class="w-5 h-5" />
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="font-medium text-sm">{debugNavItem.label}</div>
                                <div class="text-xs opacity-75 mt-0.5">{debugNavItem.description}</div>
                            </div>
                        </button>
                    {/if}
                </nav>
            </div>

            <!-- Content Area -->
            <div class="flex-1 flex flex-col min-w-0">
                <!-- Content Header -->
                <div class="border-b border-gray-700 px-6 py-4 bg-gray-800/50">
                    <h4 class="text-lg font-semibold text-white">{panelTitles[activePanel].title}</h4>
                    <p class="text-sm text-gray-400 mt-1">{panelTitles[activePanel].subtitle}</p>
                </div>

                <!-- Panel Content -->
                <div class="flex-1 overflow-y-auto p-6">
                    {#if activePanel === 'api'}
                        <APISettingsPanel />
                    {:else if activePanel === 'nai'}
                        <NAISettingsPanel />
                    {:else if activePanel === 'appearance'}
                         <AppearanceSettingsPanel />
                    {:else if activePanel === 'character'}
                         <CharacterDefaultsPanel />
                    {:else if activePanel === 'data'}
                         <DataManagementPanel />
                    {:else if activePanel === 'advanced'}
                         <AdvancedSettingsPanel />
                    {:else if activePanel === 'debug'}
                        <DebugSettingsPanel />
                    {/if}
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-gray-700 p-6 bg-gray-800/50">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-sm text-gray-400">
                    <Info class="w-4 h-4" />
                    <span>{t("settings.autoSaveInfo")}</span>
                </div>
                <div class="flex gap-3">
                    <button on:click={handleClose} class="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                        {t("settings.close")}
                    </button>
                    <button on:click={handleSave} class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        {t("settings.saveAndClose")}
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
{/if}