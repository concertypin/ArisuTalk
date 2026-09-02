<script module>
    import { uiState } from "@/lib/stores/ui.svelte";
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

    import { createContext } from "svelte";

    import { preload } from "@/component/dialog/SettingsDialog.svelte";
    import SettingsDialog from "@/component/dialog/SettingsDialog.svelte";

    export type TProps<T> = {
        context: () => T;
    };

    const preloaded = preload([
        {
            icon: GearIcon,
            label: "General",
            contents: {
                type: "component",
                component: GeneralSettings,
            },
        },
        {
            icon: CpuIcon,
            label: "LLM Configuration",
            contents: {
                type: "component",
                component: LLMSettings,
            },
        },
        {
            icon: ChatCircleTextIcon,
            label: "Prompt",
            contents: {
                type: "component",
                component: PromptSettings,
            },
        },
        {
            icon: SlidersHorizontalIcon,
            label: "Advanced",
            contents: {
                type: "component",
                component: AdvancedSettings,
            },
        },
        {
            icon: InfoIcon,
            label: "About",
            contents: {
                type: "component",
                component: AboutPage,
            },
        },
    ]);
</script>

<script lang="ts">
    let activeTab = $state(preloaded.tabList[0]?.id ?? "");

    function onOpen() {
        Logger.structured("modal.open", {
            location: window.location.pathname,
            modalName: "GeneralSettingsModal",
        });
    }

    function onClose() {
        void settings.save();

        uiState.closeSettingsModal();

        Logger.structured("modal.close", {
            location: "characterSettings",
            modalName: "GeneralSettingsModal",
        });
    }

    function onTabChange(id: string) {
        activeTab = id;
    }

    const [getContext, setContext] = createContext<{}>();

    setContext({});

    const settingsModalContext = () => getContext();
</script>

<SettingsDialog
    title="General"
    {preloaded}
    {onOpen}
    {onClose}
    {activeTab}
    {onTabChange}
    {settingsModalContext}
/>
