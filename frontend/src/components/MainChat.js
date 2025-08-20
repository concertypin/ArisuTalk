
import { t } from '../i18n.js';
import { PersonaChatApp } from '../index.js';

import { formatBytes } from '../storage.js';
import { findMessageGroup, formatDateSeparator } from '../utils.js';
import { renderAvatar } from './Avatar.js';

/**
 * @param {PersonaChatApp} app
 * @returns {string}
 */
function renderInputArea(app) {
    const { showInputOptions, isWaitingForResponse, imageToSend } = app.state;
    const hasImage = !!imageToSend;

    let imagePreviewHtml = '';
    if (hasImage) {
        imagePreviewHtml = `
            <div class="p-2 border-b border-gray-700 mb-2">
                <div class="relative w-20 h-20">
                    <img src="${imageToSend.dataUrl}" class="w-full h-full object-cover rounded-lg">
                    <button id="cancel-image-preview" class="absolute -top-2 -right-2 p-1 bg-gray-900 rounded-full text-white hover:bg-red-500 transition-colors">
                        <i data-lucide="x" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                </div>
            </div>
        `;
    }

    return `
        <div class="input-area-container relative">
            ${imagePreviewHtml}
            ${showInputOptions ? `
                <div class="absolute bottom-full left-0 mb-2 w-48 bg-gray-700 rounded-xl shadow-lg p-2 animate-fadeIn">
                    <button id="open-image-upload" class="w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-600">
                        <i data-lucide="image" class="w-4 h-4"></i> ${t('mainChat.uploadPhoto')}
                    </button>
                </div>
            ` : ''}
            <div class="flex items-end space-x-3">
                ${!hasImage ? `
                <button id="open-input-options-btn" class="p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 h-[48px]" ${isWaitingForResponse ? 'disabled' : ''}>
                   <i data-lucide="plus" class="w-5 h-5"></i>
                </button>
                ` : ''}
                <div class="flex-1 relative">
                    ${app.state.stickerToSend ? `
                        <div class="mb-2 p-2 bg-gray-700 rounded-lg flex items-center gap-2 text-sm text-gray-300">
                            <img src="${app.state.stickerToSend.data}" alt="${app.state.stickerToSend.stickerName}" class="w-6 h-6 rounded object-cover">
                            <span>${t('mainChat.stickerLabel')}${app.state.stickerToSend.stickerName}</span>
                            <button onclick="window.personaApp.setState({stickerToSend: null})" class="ml-auto text-gray-400 hover:text-white">
                                <i data-lucide="x" class="w-3 h-3"></i>
                            </button>
                        </div>
                    ` : ''}
                    <textarea id="new-message-input" placeholder="${hasImage ? t('mainChat.addCaption') : app.state.stickerToSend ? t('mainChat.stickerMessagePlaceholder') : t('mainChat.messagePlaceholder')}" class="w-full pl-4 pr-20 py-3 bg-gray-800 text-white rounded-2xl border border-gray-700 resize-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-200 text-sm placeholder-gray-500" rows="1" style="min-height: 48px; max-height: 120px;" ${isWaitingForResponse ? 'disabled' : ''}></textarea>
                    <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <button id="sticker-btn" 
                            onclick="window.personaApp.toggleUserStickerPanel()" 
                            class="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all duration-200"
                            ${isWaitingForResponse ? 'disabled' : ''}>
                            <i data-lucide="smile" class="w-4 h-4"></i>
                        </button>
                        <button id="send-message-btn" 
                            onclick="window.personaApp.handleSendMessageWithSticker()" 
                            class="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            ${isWaitingForResponse ? 'disabled' : ''}>
                            <i data-lucide="send" class="w-4 h-4"></i>
                        </button>
                    </div>
                    ${app.state.showUserStickerPanel ? renderUserStickerPanel(app) : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * @param {PersonaChatApp} app
 * @returns {string}
 */
function renderUserStickerPanel(app) {
    const userStickers = app.state.userStickers || [];
    const currentSize = app.calculateUserStickerSize();

    return `
        <div class="absolute bottom-full left-0 mb-2 w-80 bg-gray-800 rounded-xl shadow-lg border border-gray-700 animate-fadeIn">
            <div class="p-3 border-b border-gray-700 flex items-center justify-between">
                <h3 class="text-sm font-medium text-white">${t('mainChat.personaStickers')}</h3>
                <div class="flex gap-2">
                    <button id="add-user-sticker-btn" class="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded" title="${t('mainChat.addSticker')}">
                        <i data-lucide="plus" class="w-3 h-3"></i>
                    </button>
                    <button onclick="window.personaApp.toggleUserStickerPanel()" class="p-1 bg-gray-600 hover:bg-gray-500 text-white rounded" title="${t('common.close')}">
                        <i data-lucide="x" class="w-3 h-3"></i>
                    </button>
                </div>
            </div>
            <div class="p-3">
                <div class="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span>${t('characterModal.stickerSupport')}</span>
                    <span>${t('characterModal.stickerCount', { count: userStickers.length })}</span>
                </div>
                <div class="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>${t('characterModal.totalSize')}${formatBytes(currentSize)}</span>
                </div>
                ${userStickers.length === 0 ? `
                    <div class="text-center text-gray-400 py-8">
                        <i data-lucide="smile" class="w-8 h-8 mx-auto mb-2"></i>
                        <p class="text-sm">${t('mainChat.addStickerPrompt')}</p>
                        <button onclick="document.getElementById('add-user-sticker-btn').click()" class="mt-2 text-xs text-blue-400 hover:text-blue-300">${t('mainChat.addStickerButton')}</button>
                    </div>
                ` : `
                    <div class="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                        ${userStickers.map(sticker => {
        const isVideo = sticker.type && (sticker.type.startsWith('video/') || sticker.type === 'video/mp4' || sticker.type === 'video/webm');
        const isAudio = sticker.type && sticker.type.startsWith('audio/');

        let content = '';
        if (isAudio) {
            content = `<div class="w-full h-full flex items-center justify-center bg-gray-600"><i data-lucide="music" class="w-6 h-6 text-gray-300"></i></div>`;
        } else if (isVideo) {
            content = `<video class="w-full h-full object-cover" muted><source src="${sticker.data}" type="${sticker.type}"></video>`;
        } else {
            content = `<img src="${sticker.data}" alt="${sticker.name}" class="w-full h-full object-cover">`;
        }

        return `
                            <div class="relative group">
                                <button onclick="window.personaApp.sendUserSticker('${sticker.name}', '${sticker.data}', '${sticker.type || 'image/png'}')" 
                                    class="w-full aspect-square bg-gray-700 rounded-lg overflow-hidden hover:bg-gray-600 transition-colors">
                                    ${content}
                                </button>
                                <div class="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button onclick="window.personaApp.editUserStickerName(${sticker.id}); event.stopPropagation();" 
                                        class="w-5 h-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center text-xs" title="${t('characterModal.editStickerName')}">
                                        <i data-lucide="edit-3" class="w-2 h-2"></i>
                                    </button>
                                    <button onclick="window.personaApp.deleteUserSticker(${sticker.id}); event.stopPropagation();" 
                                        class="w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs" title="${t('characterModal.deleteSticker')}">
                                        <i data-lucide="x" class="w-3 h-3"></i>
                                    </button>
                                </div>
                                <div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate rounded-b-lg">
                                    ${sticker.name}
                                </div>
                            </div>
                            `;
    }).join('')}
                    </div>
                `}
            </div>
            <input type="file" accept="image/*,video/*,audio/*" id="user-sticker-input" class="hidden" multiple />
        </div>
    `;
}

/**
 * @param {PersonaChatApp} app
 * @returns {string}
 */
function renderMessages(app) {
    const messages = app.state.messages[app.state.selectedChatId || -1 /*Make it undefined*/] || [];
    let html = '';
    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const prevMsg = messages[i - 1];

        const showDateSeparator = (() => {
            if (!prevMsg) return true;
            const prevDate = new Date(prevMsg.id);
            const currentDate = new Date(msg.id);
            return prevDate.getFullYear() !== currentDate.getFullYear() ||
                prevDate.getMonth() !== currentDate.getMonth() ||
                prevDate.getDate() !== currentDate.getDate();
        })();

        if (showDateSeparator) {
            html += `<div class="flex justify-center my-4"><div class="flex items-center text-xs text-gray-300 bg-gray-800/80 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-md"><i data-lucide="calendar" class="w-3 h-3.5 mr-2 text-gray-400"></i>${formatDateSeparator(new Date(msg.id))}</div></div>`;
        }

        const groupInfo = findMessageGroup(messages, i);
        const isLastInGroup = i === groupInfo.endIndex;

        if (app.state.editingMessageId === groupInfo.lastMessageId) {
            let editContentHtml = '';
            if (msg.type === 'image') {
                editContentHtml = `
                        <img src="${msg.imageUrl}" class="max-w-xs max-h-80 rounded-lg object-cover mb-2 cursor-pointer" onclick="window.open('${msg.imageUrl}')">
                        <textarea data-id="${groupInfo.lastMessageId}" class="edit-message-textarea w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500/50 text-sm" rows="2">${msg.content}</textarea>
                    `;
            } else {
                const combinedContent = messages.slice(groupInfo.startIndex, groupInfo.endIndex + 1).map(m => m.content).join('\n');
                editContentHtml = `<textarea data-id="${groupInfo.lastMessageId}" class="edit-message-textarea w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500/50 text-sm" rows="3">${combinedContent}</textarea>`;
            }

            html += `
                    <div class="flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}">
                        ${editContentHtml}
                        <div class="flex items-center space-x-2 mt-2">
                            <button data-id="${groupInfo.lastMessageId}" class="cancel-edit-btn text-xs text-gray-400 hover:text-white">${t('common.cancel')}</button>
                            <button data-id="${groupInfo.lastMessageId}" class="save-edit-btn text-xs text-blue-400 hover:text-blue-300">${t('common.save')}</button>
                        </div>
                    </div>
                `;
            i = groupInfo.endIndex;
            continue;
        }

        const selectedChat = app.state.characters.find(c => c.id === app.state.selectedChatId);
        const showSenderInfo = !msg.isMe && i === groupInfo.startIndex;

        const hasAnimated = app.animatedMessageIds.has(msg.id);
        const needsAnimation = !hasAnimated;
        if (needsAnimation) {
            app.animatedMessageIds.add(msg.id);
        }

        const lastUserMessage = [...messages].reverse().find(m => m.isMe);
        const showUnread = msg.isMe && lastUserMessage && msg.id === lastUserMessage.id && app.state.isWaitingForResponse && !app.state.typingCharacterId;

        let messageBodyHtml = '';
        if (msg.type === 'sticker') {
            let stickerData = msg.stickerData;

            if (!stickerData) {
                const selectedChatRoom = app.getCurrentChatRoom();
                const character = selectedChatRoom ? app.state.characters.find(c => c.id === selectedChatRoom.characterId) : null;
                stickerData = character?.stickers?.find(s => {
                    if (s.id === Number(msg.stickerId)) return true;
                    if (s.name === msg.stickerId) return true;
                    const baseFileName = s.name.replace(/\.[^/.]+$/, "");
                    const searchFileName = String(msg.stickerId).replace(/\.[^/.]+$/, "");
                    if (baseFileName === searchFileName) return true;
                    return false;
                });
            }

            if (stickerData) {
                const isVideo = stickerData.type && (stickerData.type.startsWith('video/') || stickerData.type === 'video/mp4' || stickerData.type === 'video/webm');
                const isAudio = stickerData.type && stickerData.type.startsWith('audio/');

                let stickerHtml = '';
                if (isAudio) {
                    const audioSrc = stickerData.data || stickerData.dataUrl;
                    const stickerName = stickerData.stickerName || stickerData.name || t('mainChat.audio');
                    stickerHtml = `
                        <div class="bg-gray-700 p-3 rounded-2xl max-w-xs">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                                    <i data-lucide="music" class="w-6 h-6 text-gray-300"></i>
                                </div>
                                <div>
                                    <div class="text-sm text-white font-medium">${stickerName}</div>
                                    <audio controls class="mt-1 h-8">
                                        <source src="${audioSrc}" type="${stickerData.type}">
                                    </audio>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (isVideo) {
                    const videoSrc = stickerData.data || stickerData.dataUrl;
                    const isExpanded = app.state.expandedStickers.has(msg.id);
                    const sizeClass = isExpanded ? 'max-w-4xl' : 'max-w-xs';
                    const heightStyle = isExpanded ? 'max-height: 720px;' : 'max-height: 240px;';
                    stickerHtml = `
                        <div class="inline-block cursor-pointer transition-all duration-300" onclick="window.personaApp.toggleStickerSize(${msg.id})">
                            <video class="${sizeClass} rounded-2xl" style="${heightStyle}" controls muted loop autoplay>
                                <source src="${videoSrc}" type="${stickerData.type}">
                            </video>
                        </div>
                    `;
                } else {
                    const imgSrc = stickerData.data || stickerData.dataUrl;
                    const stickerName = stickerData.stickerName || stickerData.name || t('mainChat.sticker');
                    const isExpanded = app.state.expandedStickers.has(msg.id);
                    const sizeClass = isExpanded ? 'max-w-4xl' : 'max-w-xs';
                    const heightStyle = isExpanded ? 'max-height: 720px;' : 'max-height: 240px;';
                    stickerHtml = `<div class="inline-block cursor-pointer transition-all duration-300" onclick="window.personaApp.toggleStickerSize(${msg.id})"><img src="${imgSrc}" alt="${stickerName}" class="${sizeClass} rounded-2xl object-contain" style="${heightStyle}"></div>`;
                }

                const hasTextMessage = (msg.hasText && msg.content && msg.content.trim()) ||
                    (msg.stickerData && msg.stickerData.hasText && msg.stickerData.textContent && msg.stickerData.textContent.trim()) ||
                    (msg.content && msg.content.trim() && !msg.content.includes('[스티커:'));

                if (hasTextMessage) {
                    let textContent = '';
                    if (msg.stickerData && msg.stickerData.textContent) {
                        textContent = msg.stickerData.textContent;
                    } else if (msg.content && !msg.content.includes('[스티커:')) {
                        textContent = msg.content;
                    }

                    if (textContent.trim()) {
                        const textHtml = `<div class="px-4 py-2 rounded-2xl text-sm md:text-base leading-relaxed ${msg.isMe ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'} mb-2"><div class="break-words">${textContent}</div></div>`;
                        messageBodyHtml = `<div class="flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}">${textHtml}${stickerHtml}</div>`;
                    } else {
                        messageBodyHtml = stickerHtml;
                    }
                } else {
                    messageBodyHtml = stickerHtml;
                }
            } else {
                messageBodyHtml = `<div class="px-4 py-2 rounded-2xl text-sm md:text-base leading-relaxed bg-gray-700 text-gray-400 italic">${t('mainChat.deletedSticker')}${msg.stickerName || msg.content}]</div>`;
            }
        } else if (msg.type === 'image') {
            const selectedChatRoom = app.getCurrentChatRoom();
            const character = selectedChatRoom ? app.state.characters.find(c => c.id === selectedChatRoom.characterId) : null;
            const imageData = character?.media?.find(m => m.id === msg.imageId);
            const imageUrl = imageData ? imageData.dataUrl : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // Transparent pixel

            const isExpanded = app.state.expandedStickers.has(msg.id);
            const sizeClass = isExpanded ? 'max-w-4xl' : 'max-w-xs';
            const heightStyle = isExpanded ? 'max-height: 720px;' : 'max-height: 320px;';
            const imageTag = `<div class="inline-block cursor-pointer transition-all duration-300" onclick="window.personaApp.toggleStickerSize(${msg.id})"><img src="${imageUrl}" class="${sizeClass} rounded-lg object-cover" style="${heightStyle}"></div>`;
            const captionTag = msg.content ? `<div class="mt-2 px-4 py-2 rounded-2xl text-sm md:text-base leading-relaxed inline-block ${msg.isMe ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}"><div class="break-words">${msg.content}</div></div>` : '';
            messageBodyHtml = `<div class="flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}">${imageTag}${captionTag}</div>`;
        } else {
            messageBodyHtml = `<div class="px-4 py-2 rounded-2xl text-sm md:text-base leading-relaxed ${msg.isMe ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}"><div class="break-words">${msg.content}</div></div>`;
        }

        let actionButtonsHtml = '';
        if (isLastInGroup) {
            const canEdit = msg.isMe && (msg.type === 'text' || (msg.type === 'image' && msg.content));
            const isLastMessageOverall = i === messages.length - 1;
            const canReroll = !msg.isMe && (msg.type === 'text' || msg.type === 'image') && isLastMessageOverall && !app.state.isWaitingForResponse;
            actionButtonsHtml = `
                <div class="flex items-center gap-2 mt-1.5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${msg.isMe ? 'justify-end' : ''}">
                    ${canEdit ? `<button data-id="${msg.id}" class="edit-msg-btn text-gray-500 hover:text-white"><i data-lucide="edit-3" class="w-3 h-3 pointer-events-none"></i></button>` : ''}
                    <button data-id="${msg.id}" class="delete-msg-btn text-gray-500 hover:text-white"><i data-lucide="trash-2" class="w-3 h-3 pointer-events-none"></i></button>
                    ${canReroll ? `<button data-id="${msg.id}" class="reroll-msg-btn text-gray-500 hover:text-white"><i data-lucide="refresh-cw" class="w-3 h-3 pointer-events-none"></i></button>` : ''}
                </div>
                `;
        }

        html += `
                <div class="group flex w-full items-start gap-3 ${needsAnimation ? 'animate-slideUp' : ''} ${msg.isMe ? 'flex-row-reverse' : ''}">
                    ${!msg.isMe ? `<div class="shrink-0 w-10 h-10 mt-1">${showSenderInfo ? renderAvatar(selectedChat, 'sm') : ''}</div>` : ''}
                    <div class="flex flex-col max-w-[85%] sm:max-w-[75%] ${msg.isMe ? 'items-end' : 'items-start'}">
                        ${showSenderInfo ? `<p class="text-sm text-gray-400 mb-1">${msg.sender}</p>` : ''}
                        <div class="flex items-end gap-2 ${msg.isMe ? 'flex-row-reverse' : ''}">
                            ${showUnread ? `<span class="text-xs text-yellow-400 self-end mb-0.5">1</span>` : ''}
                            <div class="message-content-wrapper">
                                ${messageBodyHtml}
                            </div>
                            ${isLastInGroup ? `<p class="text-xs text-gray-500 shrink-0 self-end">${msg.time}</p>` : ''}
                        </div>
                        ${actionButtonsHtml}
                    </div>
                </div>
            `;
    }

    if (app.state.typingCharacterId === app.state.selectedChatId) {
        const selectedChat = app.state.characters.find(c => c.id === app.state.selectedChatId);
        const typingIndicatorId = `typing-${Date.now()}`;
        if (!app.animatedMessageIds.has(typingIndicatorId)) {
            html += `
                    <div id="${typingIndicatorId}" class="flex items-start gap-3 animate-slideUp">
                        <div class="shrink-0 w-10 h-10 mt-1">${renderAvatar(selectedChat, 'sm')}</div>
                        <div class="px-4 py-3 rounded-2xl bg-gray-700">
                            <div class="flex items-center space-x-1">
                                <span class="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0s"></span>
                                <span class="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0.2s"></span>
                                <span class="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0.4s"></span>
                            </div>
                        </div>
                    </div>
                `;
            app.animatedMessageIds.add(typingIndicatorId);
        }
    }

    return html;
}

/**
 * @param {PersonaChatApp} app
 * @returns {void}
 */
export function renderMainChat(app) {
    /**
     * @type {HTMLElement}
     */
    // @ts-ignore
    const mainChat = document.getElementById('main-chat');
    const selectedChatRoom = app.getCurrentChatRoom();
    const selectedChat = selectedChatRoom ? app.state.characters.find(c => c.id === selectedChatRoom.characterId) : null;

    if (selectedChatRoom && selectedChat) {
        mainChat.innerHTML = `
            <header class="p-4 bg-gray-900/80 border-b border-gray-800 glass-effect flex items-center justify-between z-10">
                <div class="flex items-center space-x-2 md:space-x-4">
                    <button id="mobile-sidebar-toggle" class="p-2 -ml-2 rounded-full hover:bg-gray-700 md:hidden">
                        <i data-lucide="menu" class="h-5 w-5 text-gray-300"></i>
                    </button>
                    ${renderAvatar(selectedChat, 'sm')}
                    <div>
                        <h2 class="font-semibold text-white text-base md:text-lg">${selectedChat.name}</h2>
                        <p class="text-xs md:text-sm text-gray-400 flex items-center"><i data-lucide="message-circle" class="w-3 h-3 mr-1.5"></i>${selectedChatRoom.name}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-1 md:space-x-2">
                    <button class="p-2 rounded-full bg-gray-800 hover:bg-gray-700"><i data-lucide="phone" class="w-4 h-4 text-gray-300"></i></button>
                    <button class="p-2 rounded-full bg-gray-800 hover:bg-gray-700"><i data-lucide="video" class="w-4 h-4 text-gray-300"></i></button>
                    <button class="p-2 rounded-full bg-gray-800 hover:bg-gray-700"><i data-lucide="more-horizontal" class="w-4 h-4 text-gray-300"></i></button>
                </div>
            </header>
            <div id="messages-container" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                ${renderMessages(app)}
                <div id="messages-end-ref"></div>
            </div>
            <div class="p-4 bg-gray-900 border-t border-gray-800">
                ${renderInputArea(app)}
            </div>
        `;
    } else {
        mainChat.innerHTML = `
            <div class="flex-1 flex items-center justify-center text-center p-4">
                <button id="mobile-sidebar-toggle" class="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-700 md:hidden">
                    <i data-lucide="menu" class="h-5 w-5 text-gray-300"></i>
                </button>
                <div>
                    <div class="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6"><i data-lucide="bot" class="w-10 h-10 text-white"></i></div>
                    <h3 class="text-xl md:text-2xl font-semibold text-white mb-3">${t('mainChat.selectCharacter')}</h3>
                    <p class="text-sm md:text-base text-gray-400 leading-relaxed">${t('mainChat.selectCharacterPrompt')}</p>
                </div>
            </div>
        `;
    }
}
