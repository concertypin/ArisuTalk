
import { t } from '../i18n.js';


export function renderSnapshotList(app) {
    return `
        ${app.state.settingsSnapshots.map(snapshot => `
            <div class="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg">
                <span class="text-sm text-gray-300">${new Date(snapshot.timestamp).toLocaleString('ko-KR')}</span>
                <div class="flex items-center gap-2">
                    <button data-timestamp="${snapshot.timestamp}" class="restore-snapshot-btn p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors" title="${t('settings.restore')}"><i data-lucide="history" class="w-4 h-4"></i></button>
                    <button data-timestamp="${snapshot.timestamp}" class="delete-snapshot-btn p-1.5 bg-red-600 hover:bg-red-700 rounded text-white transition-colors" title="${t('settings.delete')}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>
        `).join('')}
        ${app.state.settingsSnapshots.length === 0 ? `<p class="text-sm text-gray-500 text-center py-2">${t('settings.noSnapshots')}</p>` : ''}
    `;
}

export function renderSettingsModal(app) {
    const { settings } = app.state;
    return `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-gray-800 rounded-2xl w-full max-w-md mx-4 flex flex-col" style="max-height: 90vh;">
                <div class="flex items-center justify-between p-6 border-b border-gray-700 shrink-0">
                    <h3 class="text-lg font-semibold text-white">${t('settings.title')}</h3>
                    <button id="close-settings-modal" class="p-1 hover:bg-gray-700 rounded-full"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div class="p-6 space-y-2 overflow-y-auto" id="settings-modal-content">
                    <details data-section="ai" class="group border-b border-gray-700 pb-2" ${app.state.openSettingsSections.includes('ai') ? 'open' : ''}>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">${t('settings.aiSettings')}</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div>
                                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2"><i data-lucide="key" class="w-4 h-4 mr-2"></i>${t('settings.apiKey')}</label>
                                    <input id="settings-api-key" type="password" placeholder="${t('settings.apiKeyPlaceholder')}" value="${settings.apiKey}" class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm" />
                                </div>
                                <div>
                                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2"><i data-lucide="bot" class="w-4 h-4 mr-2"></i>${t('settings.aiModel')}</label>
                                    <div class="flex space-x-2">
                                        <button onclick="window.personaApp.handleModelSelect('gemini-2.5-flash')" class="flex-1 py-2 px-4 rounded-lg transition-colors text-sm ${settings.model === 'gemini-2.5-flash' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}">Flash 2.5</button>
                                        <button onclick="window.personaApp.handleModelSelect('gemini-2.5-pro')" class="flex-1 py-2 px-4 rounded-lg transition-colors text-sm ${settings.model === 'gemini-2.5-pro' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}">Pro 2.5</button>
                                    </div>
                                </div>
                                <div>
                                    <button id="open-prompt-modal" class="w-full mt-2 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                        <i data-lucide="file-pen-line" class="w-4 h-4"></i> ${t('promptModal.title')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="scale" class="group border-b border-gray-700 pb-2" ${app.state.openSettingsSections.includes('scale') ? 'open' : ''}>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">${t('settings.scale')}</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div>
                                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2"><i data-lucide="type" class="w-4 h-4 mr-2"></i>${t('settings.uiSize')}</label>
                                    <input id="settings-font-scale" type="range" min="0.8" max="1.4" step="0.1" value="${settings.fontScale}" class="w-full">
                                    <div class="flex justify-between text-xs text-gray-400 mt-1"><span>${t('settings.small')}</span><span>${t('settings.large')}</span></div>
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="persona" class="group border-b border-gray-700 pb-2" ${app.state.openSettingsSections.includes('persona') ? 'open' : ''}>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">${t('settings.yourPersona')}</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div>
                                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2"><i data-lucide="user" class="w-4 h-4 mr-2"></i>${t('settings.yourName')}</label>
                                    <input id="settings-user-name" type="text" placeholder="${t('settings.yourNamePlaceholder')}" value="${settings.userName}" class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm" />
                                </div>
                                <div>
                                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2"><i data-lucide="brain-circuit" class="w-4 h-4 mr-2"></i>${t('settings.yourDescription')}</label>
                                    <textarea id="settings-user-desc" placeholder="${t('settings.yourDescriptionPlaceholder')}" class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm" rows="3">${settings.userDescription}</textarea>
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="proactive" class="group border-b border-gray-700 pb-2" ${app.state.openSettingsSections.includes('proactive') ? 'open' : ''}>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">${t('settings.proactiveSettings')}</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div class="py-2">
                                    <label class="flex items-center justify-between text-sm font-medium text-gray-300 cursor-pointer">
                                        <span class="flex items-center"><i data-lucide="message-square-plus" class="w-4 h-4 mr-2"></i>${t('settings.proactiveChat')}</span>
                                        <div class="relative inline-block w-10 align-middle select-none">
                                            <input type="checkbox" name="toggle" id="settings-proactive-toggle" ${settings.proactiveChatEnabled ? 'checked' : ''} class="absolute opacity-0 w-0 h-0 peer"/>
                                            <label for="settings-proactive-toggle" class="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-blue-600"></label>
                                            <span class="absolute left-0.5 top-0.5 block w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                        </div>
                                    </label>
                                </div>
                                <div class="py-2 border-t border-gray-700 mt-2 pt-2">
                                    <label class="flex items-center justify-between text-sm font-medium text-gray-300 cursor-pointer">
                                        <span class="flex items-center"><i data-lucide="shuffle" class="w-4 h-4 mr-2"></i>${t('settings.randomFirstMessage')}</span>
                                        <div class="relative inline-block w-10 align-middle select-none">
                                            <input type="checkbox" name="toggle" id="settings-random-first-message-toggle" ${settings.randomFirstMessageEnabled ? 'checked' : ''} class="absolute opacity-0 w-0 h-0 peer"/>
                                            <label for="settings-random-first-message-toggle" class="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-blue-600"></label>
                                            <span class="absolute left-0.5 top-0.5 block w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                        </div>
                                    </label>
                                    <div id="random-chat-options" class="mt-4 space-y-4" style="display: ${settings.randomFirstMessageEnabled ? 'block' : 'none'}">
                                        <div>
                                            <label class="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                                                <span>${t('settings.characterCount')}</span>
                                                <span id="random-character-count-label" class="text-blue-400 font-semibold">${settings.randomCharacterCount}명</span>
                                            </label>
                                            <input id="settings-random-character-count" type="range" min="1" max="5" step="1" value="${settings.randomCharacterCount}" class="w-full">
                                        </div>
                                        <div>
                                            <label class="text-sm font-medium text-gray-300 mb-2 block">${t('settings.messageFrequency')}</label>
                                            <div class="flex items-center gap-2">
                                                <input id="settings-random-frequency-min" type="number" min="1" class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm" placeholder="${t('settings.min')}" value="${settings.randomMessageFrequencyMin}">
                                                <span class="text-gray-400">-</span>
                                                <input id="settings-random-frequency-max" type="number" min="1" class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm" placeholder="${t('settings.max')}" value="${settings.randomMessageFrequencyMax}">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="snapshots" class="group border-b border-gray-700 pb-2" ${app.state.openSettingsSections.includes('snapshots') ? 'open' : ''}>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">${t('settings.snapshots')}</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div class="py-2">
                                    <label class="flex items-center justify-between text-sm font-medium text-gray-300 cursor-pointer">
                                        <span class="flex items-center"><i data-lucide="camera" class="w-4 h-4 mr-2"></i>${t('settings.enableSnapshots')}</span>
                                        <div class="relative inline-block w-10 align-middle select-none">
                                            <input type="checkbox" name="toggle" id="settings-snapshots-toggle" ${settings.snapshotsEnabled ? 'checked' : ''} class="absolute opacity-0 w-0 h-0 peer"/>
                                            <label for="settings-snapshots-toggle" class="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-blue-600"></label>
                                            <span class="absolute left-0.5 top-0.5 block w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                        </div>
                                    </label>
                                </div>
                                <div id="snapshots-list" class="space-y-2" style="display: ${settings.snapshotsEnabled ? 'block' : 'none'}">
                                    ${renderSnapshotList(app)}
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="language" class="group border-b border-gray-700 pb-2" ${app.state.openSettingsSections.includes('language') ? 'open' : ''}>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">${t('settings.language')}</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div>
                                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2"><i data-lucide="globe" class="w-4 h-4 mr-2"></i>${t('settings.language')}</label>
                                    <div class="flex space-x-2">
                                        <button onclick="window.personaApp.handleLanguageSelect('en')" class="flex-1 py-2 px-4 rounded-lg transition-colors text-sm ${settings.language === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}">English</button>
                                        <button onclick="window.personaApp.handleLanguageSelect('ko')" class="flex-1 py-2 px-4 rounded-lg transition-colors text-sm ${settings.language === 'ko' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}">한국어</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="data" class="group" ${app.state.openSettingsSections.includes('data') ? 'open' : ''}>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">${t('settings.dataManagement')}</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-2">
                                <button id="backup-data-btn" class="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                    <i data-lucide="download" class="w-4 h-4"></i> ${t('settings.backup')}
                                </button>
                                <button id="restore-data-btn" class="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                    <i data-lucide="upload" class="w-4 h-4"></i> ${t('settings.restoreData')}
                                </button>
                            </div>
                        </div>
                    </details>
                </div>
                <div class="p-6 mt-auto border-t border-gray-700 shrink-0 flex justify-end space-x-3">
                    <button id="close-settings-modal" class="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">${t('common.cancel')}</button>
                    <button id="save-settings" class="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">${t('common.done')}</button>
                </div>
            </div>
        </div>
    `;
}
