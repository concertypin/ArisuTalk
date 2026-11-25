<script lang="ts" module>
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

    const preloaded = preload([
        {
            icon: GearIcon,
            label: "General",
            type: "static",
            component: GeneralSettings,
        },
        {
            icon: CpuIcon,
            label: "LLM Configuration",
            type: "static",
            component: LLMSettings,
        },
        {
            icon: ChatCircleTextIcon,
            label: "Prompt",
            type: "static",
            component: PromptSettings,
        },
        {
            icon: SlidersHorizontalIcon,
            label: "Advanced",
            type: "static",
            component: AdvancedSettings,
        },
        {
            icon: InfoIcon,
            label: "About",
            type: "static",
            component: AboutPage,
        },
    ]);
</script>

<script lang="ts">
    import { Logger } from "@common/logger/Logger";

    import { settings } from "@/lib/stores/settings.svelte";
    import SettingsDialog from "@/components/dialog/SettingsDialog.svelte";
    import { getAppContext } from "@/context";

    let activeId = $state(preloaded.tabList[0]?.id ?? "");

    let appContext = getAppContext();

    /** Debounce before a change of the settings is persisted. */
    const AUTOSAVE_DELAY_MS = 300;
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;

    function cancelAutosave() {
        if (saveTimeout) {
            clearTimeout(saveTimeout);
            saveTimeout = null;
        }
    }

    /** Autosave: persist the settings shortly after any change, so the footer's claim holds. */
    let isFirstRun = true;
    $effect(() => {
        // Reading the whole tree subscribes the effect to every nested setting.
        $state.snapshot(settings.value);

        // The first run only subscribes; nothing changed yet.
        if (isFirstRun) {
            isFirstRun = false;
            return;
        }

        cancelAutosave();
        saveTimeout = setTimeout(() => {
            saveTimeout = null;
            void settings.save();
        }, AUTOSAVE_DELAY_MS);
    });

    // Do not lose a pending change if the modal is torn down without going through `onClose`.
    $effect(() => () => {
        if (saveTimeout) {
            cancelAutosave();
            void settings.save();
        }
    });

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
        cancelAutosave();
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
