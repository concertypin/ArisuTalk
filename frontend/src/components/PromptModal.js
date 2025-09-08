import { t } from "../i18n.js";
import { getAllPrompts, saveAllPrompts, resetAllPrompts } from '../prompts/promptManager.ts';

export async function renderPromptModal(app) {
  const prompts = await getAllPrompts();

  const promptSections = {
    [t("promptModal.mainChatPrompt")]: {
      key: 'mainChat',
      content: prompts.mainChat,
      description: t("promptModal.mainChatPromptDescription"),
    },
    [t("promptModal.characterSheetGenerationPrompt")]: {
      key: 'characterSheet',
      content: prompts.characterSheet,
      description: t("promptModal.characterSheetGenerationPromptDescription"),
    },
    [t("promptModal.randomFirstMessagePrompt")]: {
      key: 'profileCreation',
      content: prompts.profileCreation,
      description: t("promptModal.randomFirstMessagePromptDescription"),
    },
    [t("promptModal.snsForcePrompt")]: {
      key: 'snsForce',
      content: prompts.snsForce,
      description: t("promptModal.snsForcePromptDescription"),
    },
    [t("promptModal.naiStickerPrompt")]: {
      key: 'naiSticker',
      content: prompts.naiSticker,
      description: t("promptModal.naiStickerPromptDescription"),
    },
  };

  return `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="prompt-modal-root">
        <div class="bg-gray-800 rounded-2xl w-full max-w-4xl mx-4 flex flex-col" style="max-height: 90vh;">
            <div class="flex items-center justify-between p-6 border-b border-gray-700 shrink-0">
                <h3 class="text-lg font-semibold text-white">${t("promptModal.title")}</h3>
                <button id="close-prompt-modal" class="p-1 hover:bg-gray-700 rounded-full"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>
            <div class="p-6 space-y-6 overflow-y-auto">
                ${Object.entries(promptSections).map(([title, data]) => `
                    <div class="bg-gray-900/50 rounded-lg p-4">
                        <div class="flex items-center gap-2">
                            <h4 class="text-base font-semibold text-blue-300">${title}</h4>
                            <div class="relative group">
                                <i data-lucide="help-circle" class="w-4 h-4 text-gray-400 cursor-pointer"></i>
                                <div class="absolute bottom-full mb-2 w-96 bg-gray-900 text-white text-xs rounded-lg p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                    <h5 class="font-bold mb-2">Magic Patterns</h5>
                                    <p>Magic Patterns are special patterns that can be used in the prompt to access character properties and current chatting log.</p>
                                    <p>Patterns start with <code>{|</code> and ends with <code>|}</code>. Inner text is command. Multi-line is supported.</p>
                                    <p>All patterns are interpreted, executed on sandboxed JavaScript engine, which means you can use any valid JavaScript syntax as long as it doesn't access outside of the sandbox.</p>
                                    <p>After you write the pattern, you MUST use <code>return</code> statement to make the pattern return something! If you don't, it will return empty string.</p>
                                    <p>There are no escape mechanism, and all <code>{|</code> and <code>|}</code> patterns will be treated as magic patterns.</p>
                                    <p>All properties are read-only, and you can't modify them.</p>
                                    <h6 class="font-bold mt-2 mb-1">Magic Patterns Context</h6>
                                    <ul class="list-disc list-inside">
                                        <li><code>console.log</code>: Logs a message to the console.</li>
                                        <li><code>character</code>: The character object.</li>
                                        <li><code>char</code>: Alias for <code>character.name</code>.</li>
                                        <li><code>persona</code>: The user's persona object.</li>
                                        <li><code>user</code>: Alias for <code>persona.name</code>.</li>
                                        <li><code>chat(a, b)</code>: Function to access current chatting log from <code>a</code>-th to <code>b</code>-th.</li>
                                        <li><code>sessionStorage</code>: Same as <code>window.sessionStorage</code>.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <p class="text-xs text-gray-400 mb-4">${data.description}</p>
                        <textarea id="prompt-${data.key}" class="w-full h-80 p-3 bg-gray-700 text-white rounded-lg text-sm font-mono">${data.content}</textarea>
                    </div>
                `).join('')}
            </div>
            <div class="p-6 mt-auto border-t border-gray-700 shrink-0 flex flex-wrap justify-end gap-3">
                <button id="backup-prompts-btn" class="py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm flex items-center gap-2">
                    <i data-lucide="download" class="w-4 h-4"></i> ${t("promptModal.backupPrompts")}
                </button>
                <button id="restore-prompts-btn" class="py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm flex items-center gap-2">
                    <i data-lucide="upload" class="w-4 h-4"></i> ${t("promptModal.restorePrompts")}
                </button>
                <button id="reset-prompts-btn" class="py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm flex items-center gap-2">
                    <i data-lucide="refresh-cw" class="w-4 h-4"></i> ${t("promptModal.resetAllPrompts")}
                </button>
                <div class="flex-grow"></div>
                <button id="close-prompt-modal-secondary" class="py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">${t("common.cancel")}</button>
                <button id="save-prompts-btn" class="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">${t("common.save")}</button>
            </div>
        </div>
    </div>
  `;
}

export function setupPromptModalEventListeners(app) {
  const modal = document.getElementById('prompt-modal-root');
  if (!modal) return;

  modal.addEventListener('click', (e) => {
    if (e.target.id === 'close-prompt-modal' || e.target.id === 'close-prompt-modal-secondary' || e.target === modal) {
      app.setState({ showPromptModal: false });
    }
  });

  document.getElementById('save-prompts-btn').addEventListener('click', async () => {
    const newPrompts = {
      mainChat: document.getElementById('prompt-mainChat').value,
      characterSheet: document.getElementById('prompt-characterSheet').value,
      profileCreation: document.getElementById('prompt-profileCreation').value,
    };
    await saveAllPrompts(newPrompts);
    app.setState({ showPromptModal: false });
    // Optionally, show a success notification
  });

  document.getElementById('reset-prompts-btn').addEventListener('click', async () => {
    if (confirm(t("promptModal.resetAllPromptsConfirmation"))) {
      await resetAllPrompts();
      const newModalContent = await renderPromptModal(app);
      modal.innerHTML = newModalContent;
      setupPromptModalEventListeners(app);
    }
  });

  document.getElementById('backup-prompts-btn').addEventListener('click', async () => {
    const prompts = await getAllPrompts();
    const blob = new Blob([JSON.stringify(prompts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arisutalk-prompts-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('restore-prompts-btn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const newPrompts = JSON.parse(event.target.result);
            await saveAllPrompts(newPrompts);
            const newModalContent = await renderPromptModal(app);
            modal.innerHTML = newModalContent;
            setupPromptModalEventListeners(app);
          } catch (error) {
            alert(t("promptModal.restoreFailed"));
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  });
}
