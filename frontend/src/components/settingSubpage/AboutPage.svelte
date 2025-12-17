<div class="space-y-6 text-center pt-10">
    <div class="avatar placeholder">
        <div class="bg-neutral text-neutral-content rounded-full w-24">
            <span class="text-3xl"><img src="icon_192.png" alt="ArisuTalk logo" /></span>
        </div>
    </div>
    <h3 class="text-2xl font-bold">ArisuTalk</h3>
    <p class="text-base-content/70">
        Version {import.meta.env.VITE_VERSION_CHANNEL} on channel {import.meta.env
            .VITE_VERSION_NAME}
    </p>
    <p class="text-base-content/70">Made with 💖 by concertypin</p>
    <!-- Hardcoded for now -->

    <div class="flex justify-center gap-4 pt-4">
        <a href={import.meta.env.VITE_VERSION_URL} target="_blank" class="btn btn-outline gap-2">
            GitHub
        </a>
        <a
            href="https://github.com/concertypin/ArisuTalk/issues/new"
            target="_blank"
            class="btn btn-outline gap-2"
        >
            Report Issue
        </a>
    </div>
</div>
