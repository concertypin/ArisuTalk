
import { language } from '../language.js';
import { renderAvatar } from './Avatar.js';

function renderCharacterItem(app, char) {
    const chatRooms = app.state.chatRooms[char.id] || [];
    const isExpanded = app.state.expandedCharacterId === Number(char.id);
    
    let lastMessage = null;
    let totalUnreadCount = 0;
    
    chatRooms.forEach(chatRoom => {
        const messages = app.state.messages[chatRoom.id] || [];
        const chatRoomLastMessage = messages.slice(-1)[0];
        if (chatRoomLastMessage && (!lastMessage || chatRoomLastMessage.id > lastMessage.id)) {
            lastMessage = chatRoomLastMessage;
        }
        totalUnreadCount += app.state.unreadCounts[chatRoom.id] || 0;
    });

    let lastMessageContent = language.chat.startNewChat;
    if (lastMessage) {
        if (lastMessage.type === 'image') {
            lastMessageContent = language.chat.imageSent;
        } else {
            lastMessageContent = lastMessage.content;
        }
    }

    return `
        <div class="character-group">
            <div onclick="window.personaApp.toggleCharacterExpansion(${char.id})" class="character-header group p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-200 relative hover:bg-gray-800/50">
                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1 z-10">
                    <button onclick="window.personaApp.createNewChatRoomForCharacter(${char.id}); event.stopPropagation();" class="p-1 bg-gray-700 hover:bg-blue-600 rounded text-gray-300 hover:text-white transition-colors" title="새 채팅방">
                        <i data-lucide="plus" class="w-3 h-3"></i>
                    </button>
                    <button data-id="${char.id}" class="edit-character-btn p-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors" title="수정">
                        <i data-lucide="edit-3" class="w-3 h-3"></i>
                    </button>
                    <button data-id="${char.id}" class="delete-character-btn p-1 bg-gray-700 hover:bg-red-600 rounded text-gray-300 hover:text-white transition-colors" title="삭제">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                    </button>
                </div>
                <div class="flex items-center space-x-3 md:space-x-4">
                    ${renderAvatar(char, 'md')}
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                            <h3 class="font-semibold text-white text-sm truncate">${char.name || 'Unknown Character'}</h3>
                            <div class="flex items-center gap-2">
                                ${totalUnreadCount > 0 ? `<span class="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full leading-none">${totalUnreadCount}</span>` : ''}
                                <span class="text-xs text-gray-500 shrink-0">${lastMessage?.time || ''}</span>
                                <i data-lucide="chevron-${isExpanded ? 'down' : 'right'}" class="w-4 h-4 text-gray-400"></i>
                            </div>
                        </div>
                        <p class="text-xs md:text-sm truncate ${lastMessage?.isError ? 'text-red-400' : 'text-gray-400'}">${lastMessageContent}</p>
                        <p class="text-xs text-gray-500 mt-1">${chatRooms.length}개 채팅방</p>
                    </div>
                </div>
            </div>
            ${isExpanded ? `
                <div class="ml-6 space-y-1 pb-2">
                    ${chatRooms.map(chatRoom => renderChatRoomItem(app, chatRoom)).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

function renderChatRoomItem(app, chatRoom) {
    const messages = app.state.messages[chatRoom.id] || [];
    const lastMessage = messages.slice(-1)[0];
    const isSelected = app.state.selectedChatId === chatRoom.id;
    const isEditing = app.state.editingChatRoomId === chatRoom.id;
    const unreadCount = app.state.unreadCounts[chatRoom.id] || 0;
    
    let lastMessageContent = '채팅을 시작해보세요';
    if (lastMessage) {
        if (lastMessage.type === 'image') {
            lastMessageContent = '이미지를 보냈습니다';
        } else if (lastMessage.type === 'sticker') {
            lastMessageContent = '스티커를 보냈습니다';
        } else {
            lastMessageContent = lastMessage.content;
        }
    }

    const nameElement = isEditing
        ? `<input type="text" 
                 value="${chatRoom.name}" 
                 class="flex-grow bg-gray-600 text-white rounded px-1 py-0 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                 onblur="window.personaApp.cancelEditingChatRoom()" 
                 onclick="event.stopPropagation()" 
                 autofocus>`
        : `<h4 class="text-sm font-medium text-white truncate">${chatRoom.name}</h4>`;

    const actionButtons = isEditing
        ? `<button data-chat-room-id="${chatRoom.id}" class="confirm-rename-btn p-1 bg-green-600 hover:bg-green-700 rounded text-white" title="확인">
               <i data-lucide="check" class="w-3 h-3"></i>
           </button>`
        : `<button data-chat-room-id="${chatRoom.id}" class="rename-chat-room-btn p-1 bg-gray-700 hover:bg-blue-600 rounded text-white" title="이름 바꾸기">
               <i data-lucide="edit-3" class="w-3 h-3"></i>
           </button>
           <button data-chat-room-id="${chatRoom.id}" class="delete-chat-room-btn p-1 bg-red-600 hover:bg-red-700 rounded text-white" title="채팅방 삭제">
               <i data-lucide="trash-2" class="w-3 h-3"></i>
           </button>`;

    const metaElement = isEditing 
        ? '' 
        : `<div class="flex items-center gap-2 shrink-0">
            ${unreadCount > 0 ? `<span class="bg-red-500 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full leading-none">${unreadCount}</span>` : ''}
            <span class="text-xs text-gray-400 shrink-0">${lastMessage?.time || ''}</span>
           </div>`;
    
    return `
        <div class="chat-room-item group p-2 rounded-lg cursor-pointer transition-all duration-200 ${isSelected ? 'bg-blue-600' : 'hover:bg-gray-700'} relative">
            <div onclick="${isEditing ? 'event.stopPropagation()' : `window.personaApp.selectChatRoom('${chatRoom.id}')`}" class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1 gap-2">
                        ${nameElement}
                        ${metaElement}
                    </div>
                    <p class="text-xs text-gray-400 truncate">${lastMessageContent}</p>
                </div>
            </div>
            <div class="absolute top-1 right-1 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200 flex items-center space-x-1">
                ${actionButtons}
            </div>
        </div>
    `;
}

export function renderSidebar(app) {
    const sidebar = document.getElementById('sidebar');
    const sidebarContent = document.getElementById('sidebar-content');
    const backdrop = document.getElementById('sidebar-backdrop');
    const desktopToggle = document.getElementById('desktop-sidebar-toggle');

    if (app.state.sidebarCollapsed) {
        sidebar.classList.add('-translate-x-full', 'md:w-0');
        sidebar.classList.remove('translate-x-0', 'md:w-80');
        backdrop.classList.add('hidden');
        if (desktopToggle) desktopToggle.innerHTML = `<i data-lucide="chevron-right" class="w-5 h-5 text-gray-300"></i>`;
    } else {
        sidebar.classList.remove('-translate-x-full', 'md:w-0');
        sidebar.classList.add('translate-x-0', 'md:w-80');
        backdrop.classList.remove('hidden');
        if (desktopToggle) desktopToggle.innerHTML = `<i data-lucide="chevron-left" class="w-5 h-5 text-gray-300"></i>`;
    }

    const filteredCharacters = app.state.characters.filter(char =>
        char.name.toLowerCase().includes(app.state.searchQuery.toLowerCase())
    );

    sidebarContent.innerHTML = `
        <header class="p-4 md:p-6 border-b border-gray-800">
            <div class="flex items-center justify-between mb-4 md:mb-6">
                <div>
                    <h1 class="text-xl md:text-2xl font-bold text-white mb-1">ArisuTalk</h1>
                    <p class="text-xs md:text-sm text-gray-400">상대를 초대/대화 하세요</p>
                </div>
                <button id="open-settings-modal" class="p-2 md:p-2.5 rounded-full bg-gray-800 hover:bg-gray-700 transition-all duration-200">
                    <i data-lucide="settings" class="w-5 h-5 text-gray-300"></i>
                </button>
            </div>
            <div class="relative">
                <i data-lucide="bot" class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4"></i>
                <input id="search-input" type="text" placeholder="검색하기..." value="${app.state.searchQuery}" class="w-full pl-11 pr-4 py-2 md:py-3 bg-gray-800 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/30 focus:bg-gray-750 transition-all duration-200 text-sm placeholder-gray-500" />
            </div>
        </header>
        <div class="flex-1 overflow-y-auto">
            <div class="p-4">
                <button id="open-new-character-modal" class="w-full flex items-center justify-center py-3 md:py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg text-sm">
                    <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                    초대하기
                </button>
            </div>
            <div class="space-y-1 px-3 pb-4">
                ${filteredCharacters.map(char => renderCharacterItem(app, char)).join('')}
            </div>
        </div>
    `;
}
