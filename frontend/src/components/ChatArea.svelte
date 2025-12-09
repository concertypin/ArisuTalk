<!--
  @component ChatArea
  Main chat content area placeholder.
-->
<script lang="ts">
    // Props can be added as features are implemented
</script>

<main id="main-chat" class="chat-area">
    <header class="chat-header">
        <h2 class="chat-title">Welcome to ArisuTalk</h2>
    </header>

    <section class="chat-messages">
        <p class="placeholder-text">Select a character to start chatting</p>
    </section>

    <footer class="chat-input-area">
        <div class="input-container">
            <input type="text" class="message-input" placeholder="Type a message..." disabled />
            <button class="send-button" disabled>Send</button>
        </div>
    </footer>
</main>

<style>
    .chat-area {
        display: flex;
        flex-direction: column;
        flex: 1;
        height: 100%;
        background-color: var(--color-bg-primary);
    }

    .chat-header {
        display: flex;
        align-items: center;
        padding: var(--spacing-md);
        border-bottom: 1px solid var(--color-border);
        background-color: var(--color-bg-secondary);
    }

    .chat-title {
        font-size: var(--font-size-lg);
        font-weight: 500;
    }

    .chat-messages {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow-y: auto;
        padding: var(--spacing-lg);
    }

    .placeholder-text {
        color: var(--color-text-muted);
        font-size: var(--font-size-base);
    }

    .chat-input-area {
        padding: var(--spacing-md);
        border-top: 1px solid var(--color-border);
        background-color: var(--color-bg-secondary);
    }

    .input-container {
        display: flex;
        gap: var(--spacing-sm);
    }

    .message-input {
        flex: 1;
        padding: var(--spacing-sm) var(--spacing-md);
        background-color: var(--color-bg-tertiary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        color: var(--color-text-primary);
        font-size: var(--font-size-base);
    }

    .message-input:focus {
        outline: none;
        border-color: var(--color-accent);
    }

    .message-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .send-button {
        padding: var(--spacing-sm) var(--spacing-lg);
        background-color: var(--color-accent);
        border-radius: var(--radius-md);
        font-weight: 500;
        transition: background-color var(--transition-fast);
    }

    .send-button:hover:not(:disabled) {
        background-color: var(--color-accent-hover);
    }

    .send-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
