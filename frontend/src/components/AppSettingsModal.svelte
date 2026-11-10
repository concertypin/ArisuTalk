<script lang="ts" module>
    import { Logger } from "@common/logger/Logger";

    import { settings } from "@/lib/stores/settings.svelte";

    import GearIcon from "phosphor-svelte/lib/GearIcon";
    import CpuIcon from "phosphor-svelte/lib/CpuIcon";
    import ChatCircleTextIcon from "phosphor-svelte/lib/ChatCircleTextIcon";
    import SlidersHorizontalIcon from "phosphor-svelte/lib/SlidersHorizontalIcon";
    import InfoIcon from "phosphor-svelte/lib/InfoIcon";

    // Subpage components
    import GeneralSettings from "./settingSubpage/GeneralSettings.svelte";
    import LLMSettings from "./settingSubpage/LLMSettings.svelte";
    import PromptSettings from "./settingSubpage/PromptSettings.svelte";
    import AdvancedSettings from "./settingSubpage/AdvancedSettings.svelte";
    import AboutPage from "./settingSubpage/AboutPage.svelte";

    import { preload } from "@/components/dialog/settingsPreload";
    import SettingsDialog from "@/components/dialog/SettingsDialog.svelte";

    import { getAppContext } from "@/context";

    const preloaded = preload([
        {
            icon: GearIcon,
            label: "General",
            contents: {
                type: "static",
                component: GeneralSettings,
            },
        },
        {
            icon: CpuIcon,
            label: "LLM Configuration",
            contents: {
                type: "static",
                component: LLMSettings,
            },
        },
        {
            icon: ChatCircleTextIcon,
            label: "Prompt",
            contents: {
                type: "static",
                component: PromptSettings,
            },
        },
        {
            icon: SlidersHorizontalIcon,
            label: "Advanced",
            contents: {
                type: "static",
                component: AdvancedSettings,
            },
        },
        {
            icon: InfoIcon,
            label: "About",
            contents: {
                type: "static",
                component: AboutPage,
            },
        },
    ]);
</script>

<script lang="ts">
    let activeId = $state(preloaded.tabList[0]?.id ?? "");

    let appContext = getAppContext();

    function closeAppSettings() {
        appContext.appSettingsOpen = false;
    }

    function onOpen() {
        Logger.structured("modal.open", {
            location: window.location.pathname,
            modalName: "AppSettingsModal",
        });
    }

    function onClose() {
        void settings.save();

        closeAppSettings();

        Logger.structured("modal.close", {
            location: window.location.pathname,
            modalName: "AppSettingsModal",
        });
    }

    function onTabChange(id: string) {
        activeId = id;
    }

    const settingsModalContext = () => {};
</script>

<SettingsDialog
    title="App"
    {preloaded}
    {onOpen}
    {onClose}
    {activeId}
    {onTabChange}
    {settingsModalContext}
/>
