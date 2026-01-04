<!--
  @component LogLevelSelector
  A dropdown component to select the application's active log level.
-->
<script lang="ts">
    import { Logger, LOG_LEVELS, type LogLevel } from "@common/logger/Logger";

    let currentLevel = $state<LogLevel>(Logger.getLevel());

    function handleLevelChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        const level = select.value as LogLevel;
        currentLevel = level;
        Logger.setLevel(level);
    }

    const levels = Object.keys(LOG_LEVELS) as LogLevel[];
</script>

<div class="form-control w-full max-w-xs">
    <label class="label" for="log-level-select">
        <span class="label-text">Log Level</span>
    </label>
    <select
        id="log-level-select"
        class="select select-bordered"
        value={currentLevel}
        onchange={handleLevelChange}
    >
        {#each levels as level}
            <option value={level}>{level}</option>
        {/each}
    </select>
    <label class="label">
        <span class="label-text-alt text-base-content/60">
            Higher levels show more detailed logs in the console.
        </span>
    </label>
</div>
