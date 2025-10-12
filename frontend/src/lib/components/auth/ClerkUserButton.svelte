<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { auth, initializeAuth, type AuthState } from "../../stores/auth";

    let container: HTMLDivElement | null = null;
    let unsubscribe: (() => void) | null = null;
    let mountedClerk: AuthState["clerk"] = null;

    /**
     * Clean up the mounted Clerk user button component, if present.
     */
    const unmountButton = (): void => {
        if (container && mountedClerk) {
            mountedClerk.unmountUserButton(container);
            container.innerHTML = "";
            mountedClerk = null;
        }
    };

    onMount(async () => {
        try {
            await initializeAuth();
        } catch (error) {
            console.error("Failed to initialize Clerk", error);
        }

        unsubscribe = auth.subscribe((state) => {
            if (!container) {
                return;
            }

            if (state.status === "ready" && state.isSignedIn && state.clerk) {
                if (mountedClerk && mountedClerk !== state.clerk) {
                    unmountButton();
                }

                if (!mountedClerk) {
                    state.clerk.mountUserButton(container, {
                        appearance: {
                            elements: {
                                userButtonOuterIdentifier: "text-gray-300",
                            },
                        },
                    });
                    mountedClerk = state.clerk;
                }
            } else {
                unmountButton();
            }
        });
    });

    onDestroy(() => {
        unsubscribe?.();
        unmountButton();
    });
</script>

<div class="flex items-center" bind:this={container} aria-live="polite"></div>

<style>
    div :global(button) {
        outline: none;
    }
</style>
