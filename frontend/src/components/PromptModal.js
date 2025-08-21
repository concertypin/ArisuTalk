
import { language } from '../language.js';

export function renderPromptModal(app) {
    const { prompts } = app.state.settings;
    const mainPromptSections = {
        '# 시스템 규칙 (System Rules)': { key: 'system_rules', content: prompts.main.system_rules },
        '# AI 역할 및 목표 (Role and Objective)': { key: 'role_and_objective', content: prompts.main.role_and_objective },
        '## 메모리 생성 (Memory Generation)': { key: 'memory_generation', content: prompts.main.memory_generation },
        '## 캐릭터 연기 (Character Acting)': { key: 'character_acting', content: prompts.main.character_acting },
        '## 메시지 작성 스타일 (Message Writing Style)': { key: 'message_writing', content: prompts.main.message_writing },
        '## 언어 (Language)': { key: 'language', content: prompts.main.language },
        '## 추가 지시사항 (Additional Instructions)': { key: 'additional_instructions', content: prompts.main.additional_instructions },
        '## 스티커 사용법 (Sticker Usage)': { key: 'sticker_usage', content: prompts.main.sticker_usage },
        '## 단톡방 컨텍스트 (Group Chat Context)': { key: 'group_chat_context', content: prompts.main.group_chat_context },
        '## 오픈톡방 컨텍스트 (Open Chat Context)': { key: 'open_chat_context', content: prompts.main.open_chat_context },
    };

    return `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-gray-800 rounded-2xl w-full max-w-2xl mx-4 flex flex-col" style="max-height: 90vh;">
                <div class="flex items-center justify-between p-6 border-b border-gray-700 shrink-0">
                    <h3 class="text-lg font-semibold text-white">프롬프트 수정</h3>
                    <button id="close-prompt-modal" class="p-1 hover:bg-gray-700 rounded-full"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div class="p-6 space-y-4 overflow-y-auto">
                    <h4 class="text-base font-semibold text-blue-300 border-b border-blue-300/20 pb-2">메인 채팅 프롬프트</h4>
                    ${Object.entries(mainPromptSections).map(([title, data]) => `
                        <details class="group bg-gray-900/50 rounded-lg">
                            <summary class="flex items-center justify-between cursor-pointer list-none p-4">
                                <span class="text-base font-medium text-gray-200">${title}</span>
                                <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                            </summary>
                            <div class="content-wrapper">
                                <div class="content-inner p-4 border-t border-gray-700">
                                    <div class="flex items-center gap-2 mb-3">
                                        <button onclick="window.personaApp.resetPromptToDefault('main', '${data.key}', '${title}')" class="py-1 px-3 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs flex items-center gap-1">
                                            <i data-lucide="rotate-ccw" class="w-3 h-3"></i> 기본값으로 되돌리기
                                        </button>
                                    </div>
                                    <textarea id="prompt-main-${data.key}" class="w-full h-64 p-3 bg-gray-700 text-white rounded-lg text-sm font-mono">${data.content}</textarea>
                                </div>
                            </div>
                        </details>
                    `).join('')}
                    
                    <h4 class="text-base font-semibold text-blue-300 border-b border-blue-300/20 pb-2 mt-6">랜덤 선톡 캐릭터 생성 프롬프트</h4>
                    <details class="group bg-gray-900/50 rounded-lg">
                        <summary class="flex items-center justify-between cursor-pointer list-none p-4">
                            <span class="text-base font-medium text-gray-200"># 캐릭터 생성 규칙 (Profile Creation Rules)</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner p-4 border-t border-gray-700">
                                <div class="flex items-center gap-2 mb-3">
                                    <button onclick="window.personaApp.resetPromptToDefault('profile_creation', '', '# 캐릭터 생성 규칙 (Profile Creation Rules)')" class="py-1 px-3 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs flex items-center gap-1">
                                        <i data-lucide="rotate-ccw" class="w-3 h-3"></i> 기본값으로 되돌리기
                                    </button>
                                </div>
                                <textarea id="prompt-profile_creation" class="w-full h-64 p-3 bg-gray-700 text-white rounded-lg text-sm font-mono">${prompts.profile_creation}</textarea>
                            </div>
                        </div>
                    </details>
                    
                    <h4 class="text-base font-semibold text-green-300 border-b border-green-300/20 pb-2 mt-6">AI 캐릭터 시트 생성 프롬프트</h4>
                    <details class="group bg-gray-900/50 rounded-lg">
                        <summary class="flex items-center justify-between cursor-pointer list-none p-4">
                            <span class="text-base font-medium text-gray-200"># 캐릭터 시트 생성 규칙 (Character Sheet Generation Rules)</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner p-4 border-t border-gray-700">
                                <div class="flex items-center gap-2 mb-3">
                                    <button onclick="window.personaApp.resetPromptToDefault('character_sheet_generation', '', '# 캐릭터 시트 생성 규칙 (Character Sheet Generation Rules)')" class="py-1 px-3 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs flex items-center gap-1">
                                        <i data-lucide="rotate-ccw" class="w-3 h-3"></i> 기본값으로 되돌리기
                                    </button>
                                </div>
                                <textarea id="prompt-character_sheet_generation" class="w-full h-64 p-3 bg-gray-700 text-white rounded-lg text-sm font-mono">${prompts.character_sheet_generation}</textarea>
                            </div>
                        </div>
                    </details>

                </div>
                <div class="p-6 mt-auto border-t border-gray-700 shrink-0 flex flex-wrap justify-end gap-3">
                    <button id="backup-prompts-btn" class="py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm flex items-center gap-2">
                        <i data-lucide="download" class="w-4 h-4"></i> 프롬프트 백업
                    </button>
                    <button id="restore-prompts-btn" class="py-2 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm flex items-center gap-2">
                        <i data-lucide="upload" class="w-4 h-4"></i> 프롬프트 불러오기
                    </button>
                    <div class="flex-grow"></div>
                    <button id="close-prompt-modal" class="py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">취소</button>
                    <button id="save-prompts" class="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">저장</button>
                </div>
            </div>
        </div>
    `;
}
