
import { t } from '../i18n.js';
import { PersonaChatApp } from '../index.js';

/**
 * @param {PersonaChatApp} app
 * @returns {string}
 */
export function renderConfirmationModal(app) {
    const { title, message, onConfirm } = app.state.modal;
    return `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div class="bg-gray-800 rounded-2xl p-6 w-full max-w-sm mx-4 text-center">
                <div class="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="alert-triangle" class="w-6 h-6 ${onConfirm ? 'text-red-400' : 'text-blue-400'}"></i>
                </div>
                <h3 class="text-lg font-semibold text-white mb-2">${title}</h3>
                <p class="text-sm text-gray-300 mb-6 whitespace-pre-wrap">${message}</p>
                <div class="flex justify-stretch space-x-3">
                    <button id="modal-cancel" class="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                        ${onConfirm ? t('confirm.cancel') : t('confirm.confirm')}
                    </button>
                    ${onConfirm ? `<button id="modal-confirm" class="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">${t('common.confirm')}</button>` : ''}
                </div>
            </div>
        </div>
    `;
}
