/**
 * Group Chat Components
 * 단톡방 및 오픈톡방 관련 모든 컴포넌트들
 */

import { t } from '../i18n.js';

// ========== 유틸리티 함수들 ==========

function getGroupChatParticipants(app, groupChatId) {
    const groupChat = app.state.groupChats[groupChatId];
    if (!groupChat) return [];
    
    return groupChat.participantIds.map(id => 
        app.state.characters.find(char => char.id === id)
    ).filter(Boolean);
}

function renderAvatar(character, size = 'md') {
    const sizeClasses = {
        sm: 'w-10 h-10 text-sm',
        md: 'w-12 h-12 text-base',
        lg: 'w-16 h-16 text-lg',
    }[size];

    if (character?.avatar && character.avatar.startsWith('data:image')) {
        return `<img src="${character.avatar}" alt="${character.name}" class="${sizeClasses} rounded-full object-cover">`;
    }
    const initial = character?.name?.[0] || `<i data-lucide="bot"></i>`;
    return `
        <div class="${sizeClasses} bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-medium">
            ${initial}
        </div>
    `;
}

// ========== 단톡방 컴포넌트들 ==========

export function renderCreateGroupChatModal(app) {
    const characters = app.state.characters;
    
    return `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-gray-800 rounded-2xl w-full max-w-md mx-auto my-auto flex flex-col" style="max-height: 90vh;">
                <div class="flex items-center justify-between p-6 border-b border-gray-700 shrink-0">
                    <h3 class="text-xl font-semibold text-white">단톡방 만들기</h3>
                    <button id="close-create-group-chat-modal" class="p-1 hover:bg-gray-700 rounded-full">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="p-6 space-y-6 overflow-y-auto">
                    <div>
                        <label class="text-sm font-medium text-gray-300 mb-2 block">단톡방 이름</label>
                        <input id="group-chat-name" type="text" placeholder="${t('ui.groupChatNamePlaceholder')}" class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 text-sm" />
                    </div>
                    
                    <div>
                        <label class="text-sm font-medium text-gray-300 mb-3 block">참여할 캐릭터 선택</label>
                        <div class="space-y-2 max-h-60 overflow-y-auto">
                            ${characters.map(character => `
                                <label class="flex items-center space-x-3 p-3 hover:bg-gray-700 rounded-lg cursor-pointer group">
                                    <input type="checkbox" class="group-chat-character-checkbox w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500" value="${character.id}">
                                    <div class="flex items-center space-x-3 flex-1">
                                        <div class="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden shrink-0">
                                            ${character.avatar 
                                                ? `<img src="${character.avatar}" alt="${character.name}" class="w-full h-full object-cover">`
                                                : `<i data-lucide="user" class="w-5 h-5 text-gray-400"></i>`
                                            }
                                        </div>
                                        <div>
                                            <h4 class="font-medium text-white">${character.name}</h4>
                                            <p class="text-xs text-gray-400 truncate max-w-48">${character.prompt.split('\\n')[0].replace(/[#*-]/g, '').trim()}</p>
                                        </div>
                                    </div>
                                </label>
                            `).join('')}
                        </div>
                        <p class="text-xs text-gray-500 mt-2">최소 2명 이상의 캐릭터를 선택해야 합니다.</p>
                    </div>
                </div>
                <div class="p-6 mt-auto border-t border-gray-700 shrink-0 flex justify-end space-x-3">
                    <button id="close-create-group-chat-modal" class="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-center">취소</button>
                    <button id="create-group-chat-btn" class="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center">생성</button>
                </div>
            </div>
        </div>
    `;
}

export function renderEditGroupChatModal(app) {
    if (!app.state.editingGroupChat) return '';
    
    const groupChat = app.state.editingGroupChat;
    const participants = getGroupChatParticipants(app, groupChat.id);
    
    return `
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div class="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div class="sticky top-0 bg-gray-800 px-6 py-4 border-b border-gray-700">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-semibold text-white">단톡방 설정</h2>
                        <button id="close-edit-group-chat-modal" class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
                
                <div class="p-6 space-y-6">
                    <!-- 기본 정보 -->
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">단톡방 이름</label>
                        <input type="text" id="edit-group-chat-name" value="${groupChat.name}" 
                               class="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    </div>

                    <!-- 전체 설정 -->
                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold text-white">응답 설정</h3>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">
                                <span>전체 응답 빈도 (</span><span id="response-frequency-label">${Math.round(groupChat.settings.responseFrequency * 100)}</span><span>%)</span>
                            </label>
                            <input type="range" id="edit-response-frequency" min="0" max="100" 
                                   value="${Math.round(groupChat.settings.responseFrequency * 100)}"
                                   class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                                   oninput="document.getElementById('response-frequency-label').textContent = this.value">
                            <p class="text-xs text-gray-400 mt-1">높을수록 캐릭터들이 더 자주 응답합니다</p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">최대 동시 응답 캐릭터 수</label>
                            <select id="edit-max-responding" class="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600">
                                <option value="1" ${groupChat.settings.maxRespondingCharacters === 1 ? 'selected' : ''}>1명</option>
                                <option value="2" ${groupChat.settings.maxRespondingCharacters === 2 ? 'selected' : ''}>2명</option>
                                <option value="3" ${groupChat.settings.maxRespondingCharacters === 3 ? 'selected' : ''}>3명</option>
                                <option value="4" ${groupChat.settings.maxRespondingCharacters === 4 ? 'selected' : ''}>4명</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">
                                <span>응답 간격 (</span><span id="response-delay-label">${Math.round(groupChat.settings.responseDelay / 1000)}</span><span>초)</span>
                            </label>
                            <input type="range" id="edit-response-delay" min="1" max="10" 
                                   value="${Math.round(groupChat.settings.responseDelay / 1000)}"
                                   class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                                   oninput="document.getElementById('response-delay-label').textContent = this.value">
                            <p class="text-xs text-gray-400 mt-1">캐릭터 간 응답 지연 시간</p>
                        </div>
                    </div>

                    <!-- 개별 캐릭터 설정 -->
                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold text-white">개별 캐릭터 설정</h3>
                        <div class="space-y-4">
                            ${participants.map(participant => {
                                if (!participant) return '';
                                return `
                                <div class="bg-gray-700 p-4 rounded-lg">
                                    <div class="flex items-center gap-3 mb-3">
                                        ${renderAvatar(participant, 'sm')}
                                        <h4 class="font-medium text-white">${participant.name}</h4>
                                    </div>
                                    
                                    <div class="space-y-3">
                                        <div class="flex items-center gap-3">
                                            <input type="checkbox" id="active-${participant.id}" 
                                                   class="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                                                   ${groupChat.settings.participantSettings[participant.id]?.isActive !== false ? 'checked' : ''}>
                                            <label for="active-${participant.id}" class="text-sm text-gray-300">응답 활성화</label>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm text-gray-300 mb-1">
                                                <span>개별 응답 확률 (</span><span id="probability-label-${participant.id}">${Math.round((groupChat.settings.participantSettings[participant.id]?.responseProbability || 0.9) * 100)}</span><span>%)</span>
                                            </label>
                                            <input type="range" id="probability-${participant.id}" min="0" max="100" 
                                                   value="${Math.round((groupChat.settings.participantSettings[participant.id]?.responseProbability || 0.9) * 100)}"
                                                   class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                                                   oninput="document.getElementById('probability-label-${participant.id}').textContent = this.value">
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm text-gray-300 mb-1">캐릭터 역할</label>
                                            <select id="role-${participant.id}" class="w-full p-2 bg-gray-600 text-white rounded border border-gray-500 text-sm">
                                                <option value="normal" ${(groupChat.settings.participantSettings[participant.id]?.characterRole || 'normal') === 'normal' ? 'selected' : ''}>일반</option>
                                                <option value="leader" ${(groupChat.settings.participantSettings[participant.id]?.characterRole || 'normal') === 'leader' ? 'selected' : ''}>리더</option>
                                                <option value="quiet" ${(groupChat.settings.participantSettings[participant.id]?.characterRole || 'normal') === 'quiet' ? 'selected' : ''}>조용함</option>
                                                <option value="active" ${(groupChat.settings.participantSettings[participant.id]?.characterRole || 'normal') === 'active' ? 'selected' : ''}>활발함</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- 버튼 -->
                    <div class="flex justify-end gap-3 pt-4 border-t border-gray-700">
                        <button id="cancel-edit-group-chat" class="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-center">
                            취소
                        </button>
                        <button id="save-edit-group-chat" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center">
                            저장
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderGroupChatItem(app, groupChat) {
    const messages = app.state.messages[groupChat.id] || [];
    const unreadCount = app.state.unreadCounts[groupChat.id] || 0;
    const isSelected = app.state.selectedChatId === groupChat.id;
    const participants = getGroupChatParticipants(app, groupChat.id);
    
    let lastMessage = null;
    if (messages.length > 0) {
        lastMessage = messages[messages.length - 1];
    }

    let lastMessageContent = '대화를 시작해보세요';
    if (lastMessage) {
        if (lastMessage.type === 'image') {
            lastMessageContent = '이미지를 보냈습니다';
        } else if (lastMessage.type === 'sticker') {
            lastMessageContent = '스티커를 보냈습니다';
        } else {
            lastMessageContent = lastMessage.content;
        }
    }

    return `
        <div class="relative group cursor-pointer rounded-xl transition-all duration-200 ${isSelected ? 'bg-blue-600/20' : 'hover:bg-gray-800/50'} group-chat-item"
             data-chat-id="${groupChat.id}">
            <div class="absolute top-2 right-2 ${isSelected ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200 flex space-x-1 z-20">
                <button class="edit-group-chat-btn p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors" 
                        data-group-id="${groupChat.id}" title="수정">
                    <i data-lucide="edit-3" class="w-3 h-3 pointer-events-none"></i>
                </button>
                <button class="delete-group-chat-btn p-2 bg-gray-700 hover:bg-red-600 rounded text-gray-300 hover:text-white transition-colors" 
                        data-group-id="${groupChat.id}" title="삭제">
                    <i data-lucide="trash-2" class="w-3 h-3 pointer-events-none"></i>
                </button>
            </div>
            <div class="flex items-center gap-3 p-3">
                <div class="relative">
                    <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <i data-lucide="users" class="w-6 h-6 text-white"></i>
                    </div>
                    ${unreadCount > 0 ? `<div class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">${unreadCount > 99 ? '99+' : unreadCount}</div>` : ''}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                        <h4 class="font-medium text-white truncate">${groupChat.name}</h4>
                        ${lastMessage ? `<span class="text-xs text-gray-500 ml-2">${lastMessage.time}</span>` : ''}
                    </div>
                    <p class="text-sm text-gray-400 truncate">${participants.length}명 참여</p>
                    <p class="text-xs text-gray-500 truncate mt-1">${lastMessageContent}</p>
                </div>
            </div>
        </div>
    `;
}

export function renderGroupChatList(app) {
    const groupChats = Object.values(app.state.groupChats);

    return `
        <div class="mb-4">
            <div class="group flex items-center justify-between px-1 mb-2 relative">
                <div class="flex items-center gap-2">
                    <i data-lucide="users" class="w-4 h-4 text-gray-400"></i>
                    <h3 class="text-sm font-medium text-gray-300">단톡방</h3>
                </div>
                <button id="open-create-group-chat-modal" class="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-gray-700 hover:bg-blue-600 rounded text-gray-300 hover:text-white transition-colors" title="새 단톡방">
                    <i data-lucide="plus" class="w-3 h-3"></i>
                </button>
            </div>
            ${groupChats.length > 0 ? groupChats.map(groupChat => renderGroupChatItem(app, groupChat)).join('') : ''}
        </div>
    `;
}

// ========== 오픈톡방 컴포넌트들 ==========

export function renderCreateOpenChatModal(app) {
    return `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-gray-800 rounded-2xl w-full max-w-md mx-auto my-auto flex flex-col" style="max-height: 90vh;">
                <div class="flex items-center justify-between p-6 border-b border-gray-700 shrink-0">
                    <h3 class="text-xl font-semibold text-white">오픈톡방 만들기</h3>
                    <button id="close-create-open-chat-modal" class="p-1 hover:bg-gray-700 rounded-full">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="p-6 space-y-6 overflow-y-auto">
                    <div>
                        <label class="text-sm font-medium text-gray-300 mb-2 block">오픈톡방 이름</label>
                        <input id="open-chat-name" type="text" placeholder="오픈톡방 이름을 입력하세요" class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 text-sm" />
                    </div>
                    
                    <div class="bg-gray-900/50 rounded-lg p-4">
                        <div class="flex items-start space-x-2 mb-3">
                            <i data-lucide="info" class="w-4 h-4 text-blue-400 mt-0.5 shrink-0"></i>
                            <div>
                                <h4 class="text-sm font-medium text-blue-300 mb-2">오픈톡방이란?</h4>
                                <ul class="text-xs text-gray-400 space-y-1">
                                    <li>• AI가 자동으로 캐릭터들의 입장/퇴장을 관리합니다</li>
                                    <li>• 캐릭터들은 각자의 기분과 상태에 따라 참여합니다</li>
                                    <li>• 자연스러운 대화 흐름이 자동으로 만들어집니다</li>
                                    <li>• 처음에는 랜덤하게 2-4명이 입장합니다</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="border-t border-gray-700 pt-3">
                            <div class="flex items-center space-x-2">
                                <i data-lucide="users" class="w-4 h-4 text-green-400"></i>
                                <span class="text-xs text-green-300">현재 ${app.state.characters.length}명의 캐릭터가 참여 가능합니다</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="p-6 mt-auto border-t border-gray-700 shrink-0 flex justify-end space-x-3">
                    <button id="close-create-open-chat-modal" class="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-center">취소</button>
                    <button id="create-open-chat-btn" class="flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-center">
                        생성
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderOpenChatItem(app, openChat) {
    const messages = app.state.messages[openChat.id] || [];
    const unreadCount = app.state.unreadCounts[openChat.id] || 0;
    const isSelected = app.state.selectedChatId === openChat.id;
    const currentParticipants = openChat.currentParticipants || [];
    
    let lastMessage = null;
    if (messages.length > 0) {
        lastMessage = messages[messages.length - 1];
    }

    let lastMessageContent = '대화를 시작해보세요';
    if (lastMessage) {
        if (lastMessage.isSystem || lastMessage.sender === 'system') {
            lastMessageContent = lastMessage.content;
        } else if (lastMessage.type === 'image') {
            lastMessageContent = '이미지를 보냈습니다';
        } else if (lastMessage.type === 'sticker') {
            lastMessageContent = '스티커를 보냈습니다';
        } else {
            lastMessageContent = lastMessage.content;
        }
    }

    return `
        <div class="relative group cursor-pointer rounded-xl transition-all duration-200 ${isSelected ? 'bg-blue-600/20' : 'hover:bg-gray-800/50'} open-chat-item"
             data-chat-id="${openChat.id}">
            <div class="absolute top-2 right-2 ${isSelected ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200 flex space-x-1 z-20">
                <button class="delete-open-chat-btn p-2 bg-gray-700 hover:bg-red-600 rounded text-gray-300 hover:text-white transition-colors" 
                        data-open-id="${openChat.id}" title="삭제">
                    <i data-lucide="trash-2" class="w-3 h-3 pointer-events-none"></i>
                </button>
            </div>
            <div class="flex items-center gap-3 p-3">
                <div class="relative">
                    <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                        <i data-lucide="globe" class="w-6 h-6 text-white"></i>
                    </div>
                    ${unreadCount > 0 ? `<div class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">${unreadCount > 99 ? '99+' : unreadCount}</div>` : ''}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                        <h4 class="font-medium text-white truncate">${openChat.name}</h4>
                        ${lastMessage ? `<span class="text-xs text-gray-500 ml-2">${lastMessage.time}</span>` : ''}
                    </div>
                    <p class="text-sm text-gray-400 truncate">${currentParticipants.length}명 접속중</p>
                    <p class="text-xs text-gray-500 truncate mt-1">${lastMessageContent}</p>
                </div>
            </div>
        </div>
    `;
}

export function renderOpenChatList(app) {
    const openChats = Object.values(app.state.openChats);

    return `
        <div class="mb-4">
            <div class="group flex items-center justify-between px-1 mb-2 relative">
                <div class="flex items-center gap-2">
                    <i data-lucide="globe" class="w-4 h-4 text-gray-400"></i>
                    <h3 class="text-sm font-medium text-gray-300">오픈톡방</h3>
                </div>
                <button id="open-create-open-chat-modal" class="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-gray-700 hover:bg-green-600 rounded text-gray-300 hover:text-white transition-colors" title="새 오픈톡방">
                    <i data-lucide="plus" class="w-3 h-3"></i>
                </button>
            </div>
            ${openChats.length > 0 ? openChats.map(openChat => renderOpenChatItem(app, openChat)).join('') : ''}
        </div>
    `;
}