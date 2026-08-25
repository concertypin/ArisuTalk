<script lang="ts" module>
    /** A node in the branch tree visualization. */
    export type BranchNode = {
        id: string;
        content: string;
        role: string;
        timestamp: number;
        branchFromId?: string;
        branchRootId?: string;
        children: BranchNode[];
    };

    /** Count the depth of a node in the tree by tracing parent references. */
    function countDepth(node: BranchNode, allNodes: BranchNode[]): number {
        let depth = 0;
        let current = node;
        while (current.branchFromId) {
            const parent = allNodes.find((n) => n.id === current.branchFromId);
            if (!parent) break;
            depth++;
            current = parent;
        }
        return depth;
    }
</script>

<script lang="ts">
    import { chatStore } from "../stores/chatStore.svelte";
    import { characterStore } from "../../character/stores/characterStore.svelte";
    import GitBranchIcon from "phosphor-svelte/lib/GitBranchIcon";
    import ChatTeardropTextIcon from "phosphor-svelte/lib/ChatTeardropTextIcon";
    import ArrowsClockwiseIcon from "phosphor-svelte/lib/ArrowsClockwiseIcon";
    import type { ChatMessage } from "@/lib/interfaces";
    import { SvelteMap } from "svelte/reactivity";

    type Props = {
        chatId: string;
        onClose: () => void;
    };

    let { chatId, onClose }: Props = $props();

    let activeChat = $derived(chatStore.chats.find((c) => c.id === chatId));
    let activeMessages = $derived(chatStore.activeMessages);
    let allChats = $derived(chatStore.chats);

    /** Messages with branching info, structured as a tree */
    let branchTree = $derived(buildBranchTree(activeMessages));

    /** Find chats that branched from this chat's root */
    let branchChats = $derived(
        allChats.filter(
            (c) => c.branchRootId === chatId || c.branchRootId === activeChat?.branchRootId
        )
    );

    /** Navigate to a different branch chat */
    function handleNavigateBranch(branchChatId: string) {
        void chatStore.setActiveChat(branchChatId);
        onClose();
    }

    /** Create a new branch from a specific message */
    async function handleBranchFromMessage() {
        if (!activeChat) return;
        const newChatId = await chatStore.createChat(
            activeChat.characterId,
            `${activeChat.name} (branch)`,
            activeChat.chatType || "direct",
            activeChat.participantIds
        );
        await chatStore.updateChat(newChatId, {
            branchRootId: activeChat.branchRootId || chatId,
        });
        void chatStore.setActiveChat(newChatId);
        onClose();
    }

    /** Build a tree structure from flat messages with branching info */
    function buildBranchTree(messages: typeof activeMessages): BranchNode[] {
        const nodes: BranchNode[] = [];
        const childrenMap = new SvelteMap<string | null, BranchNode[]>();

        for (const msg of messages) {
            const branchMsg: ChatMessage = Object.assign(msg, {
                branchFromId: undefined,
                branchRootId: undefined,
            });
            const node: BranchNode = {
                id: msg.id,
                content:
                    typeof msg.content.data === "string"
                        ? msg.content.data
                        : JSON.stringify(msg.content.data),
                role: msg.role,
                timestamp: msg.timestamp,
                branchFromId: branchMsg.branchFromId,
                branchRootId: branchMsg.branchRootId,
                children: [],
            };

            const parentId = branchMsg.branchFromId || null;
            if (!childrenMap.has(parentId)) {
                childrenMap.set(parentId, []);
            }
            childrenMap.get(parentId)!.push(node);
            nodes.push(node);
        }

        // Wire up children
        for (const node of nodes) {
            node.children = childrenMap.get(node.id) || [];
        }

        return childrenMap.get(null) || nodes.filter((n) => !n.branchFromId);
    }

    /** Truncate message content for display */
    function truncate(text: string, maxLen: number = 60): string {
        if (text.length <= maxLen) return text;
        return `${text.substring(0, maxLen)}…`;
    }

    /** Format a timestamp for display */
    function formatTime(ts: number): string {
        return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    /** Get character display name */
    function getCharacterName(characterId: string): string {
        const char = characterStore.characters.find((c) => c.id === characterId);
        return char?.name || "Unknown Character";
    }
</script>

<div class="space-y-4">
    <!-- Branch tree visualization -->
    {#if branchTree.length > 0}
        <div class="space-y-1">
            <h4
                class="text-xs font-semibold uppercase tracking-wider text-base-content/50 flex items-center gap-1"
            >
                <GitBranchIcon size={14} />
                Message Tree
            </h4>
            {#each branchTree as node (node.id)}
                {@const depth = countDepth(node, branchTree)}
                <div
                    class="flex items-start gap-2 pl-{Math.min(
                        depth * 4,
                        12
                    )} border-l-2 border-base-300 py-1"
                >
                    <div
                        class="flex items-center gap-2 min-w-0 flex-1"
                        class:opacity-60={node.role === "assistant"}
                    >
                        <span
                            class="badge badge-xs {node.role === 'user'
                                ? 'badge-primary'
                                : 'badge-ghost'} shrink-0"
                        >
                            {node.role === "user" ? "You" : "AI"}
                        </span>
                        <span class="text-xs truncate">{truncate(node.content)}</span>
                        <span class="text-[10px] text-base-content/40 shrink-0"
                            >{formatTime(node.timestamp)}</span
                        >
                    </div>
                    <button
                        class="btn btn-ghost btn-xs btn-square shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onclick={() => void handleBranchFromMessage()}
                        aria-label="Branch from this message"
                        title="Branch from this message"
                    >
                        <GitBranchIcon size={12} />
                    </button>
                </div>

                {#if node.children.length > 0}
                    {#each node.children as child (child.id)}
                        <div
                            class="flex items-start gap-2 ml-{Math.min(
                                (depth + 1) * 4,
                                16
                            )} border-l-2 border-info/30 py-1"
                        >
                            <div class="flex items-center gap-2 min-w-0 flex-1">
                                <span
                                    class="badge badge-xs {child.role === 'user'
                                        ? 'badge-primary'
                                        : 'badge-ghost'} shrink-0"
                                >
                                    {child.role === "user" ? "You" : "AI"}
                                </span>
                                <span class="text-xs truncate">{truncate(child.content)}</span>
                                <span class="text-[10px] text-base-content/40 shrink-0"
                                    >{formatTime(child.timestamp)}</span
                                >
                            </div>
                            {#if child.branchFromId}
                                <span class="badge badge-xs badge-info gap-1 shrink-0">
                                    <GitBranchIcon size={10} />
                                    Branch
                                </span>
                            {/if}
                        </div>
                    {/each}
                {/if}
            {/each}
        </div>
    {:else}
        <div class="text-center p-6 opacity-60">
            <ChatTeardropTextIcon size={32} class="mx-auto mb-2 opacity-40" />
            <p class="text-sm">No messages yet.</p>
        </div>
    {/if}

    <!-- Branch navigation -->
    {#if branchChats.length > 0}
        <div class="border-t border-base-300 pt-3">
            <h4
                class="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-2 flex items-center gap-1"
            >
                <ArrowsClockwiseIcon size={14} />
                Branches ({branchChats.length})
            </h4>
            {#each branchChats as branch (branch.id)}
                <button
                    class="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-base-200 transition-colors text-left {branch.id ===
                    chatId
                        ? 'bg-base-200'
                        : ''}"
                    onclick={() => handleNavigateBranch(branch.id)}
                >
                    <GitBranchIcon size={14} class="text-info shrink-0" />
                    <span class="text-sm truncate flex-1">{branch.name}</span>
                    <span class="text-xs text-base-content/40">
                        {getCharacterName(branch.characterId)}
                    </span>
                </button>
            {/each}
        </div>
    {/if}

    <!-- Branch info -->
    {#if activeChat?.branchRootId}
        <div class="border-t border-base-300 pt-3">
            <p class="text-xs text-base-content/40">
                This chat is a branch. Root ID: {activeChat.branchRootId.substring(0, 8)}…
            </p>
        </div>
    {/if}
</div>
