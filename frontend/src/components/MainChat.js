import { t } from "../i18n.js";
import { formatBytes } from "../storage.js";
import { findMessageGroup, formatDateSeparator } from "../utils.js";
import { renderAvatar } from "./Avatar.js";
import {
  renderLandingPage,
  setupLandingPageEventListeners,
} from "./LandingPage.js";

function getGroupChatParticipants(app, groupChatId) {
  const groupChat = app.state.groupChats[groupChatId];
  if (!groupChat) return [];

  return groupChat.participantIds
    .map((id) => app.state.characters.find((char) => char.id === id))
    .filter(Boolean);
}

function renderInputArea(app) {
  const { showInputOptions, isWaitingForResponse, imageToSend, stickerToSend } =
    app.state;
  const hasImage = !!imageToSend;

  let imagePreviewHtml = "";
  if (hasImage) {
    imagePreviewHtml = `
            <div class="p-2 border-b border-gray-700 mb-2">
                <div class="relative w-20 h-20">
                    <img src="${
                      imageToSend.dataUrl
                    }" class="w-full h-full object-cover rounded-lg">
                    <button id="cancel-image-preview" class="absolute -top-2 -right-2 p-1 bg-gray-900 rounded-full text-white hover:bg-red-500 transition-colors">
                        <i data-lucide="x" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                </div>
            </div>
        `;
  }

  let stickerPreviewHtml = "";
  if (stickerToSend) {
    stickerPreviewHtml = `
      <div class="mb-2 p-2 bg-gray-700 rounded-lg flex items-center gap-2 text-sm text-gray-300">
          <img src="${stickerToSend.data}" alt="${
            stickerToSend.stickerName
          }" class="w-6 h-6 rounded object-cover">
          <span>${t("mainChat.stickerLabel")}${stickerToSend.stickerName}</span>
          <button id="remove-sticker-to-send-btn" class="ml-auto text-gray-400 hover:text-white">
              <i data-lucide="x" class="w-3 h-3"></i>
          </button>
      </div>
    `;
  }

  return `
        <div class="input-area-container experimental relative">
            ${imagePreviewHtml}
            ${stickerPreviewHtml}
            ${
              showInputOptions
                ? `
                <div class="absolute bottom-full left-0 mb-2 w-48 rounded-xl shadow-lg p-2 animate-fadeIn floating-panel">
                    <button id="open-image-upload" class="w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-lg hover:bg-gray-600">
                        <i data-lucide="image" class="w-4 h-4"></i> ${t(
                          "mainChat.uploadPhoto",
                        )}
                    </button>
                </div>
            `
                : ""
            }
            <div class="flex items-center gap-3">
                ${
                  !hasImage
                    ? `
                <button id="open-input-options-btn" class="flex-shrink-0 bg-gray-700 hover:bg-gray-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 h-[44px] w-[44px] flex items-center justify-center" ${
                  isWaitingForResponse ? "disabled" : ""
                }> 
                   <i data-lucide="plus" class="w-5 h-5 pointer-events-none"></i>
                </button>
                `
                    : ""
                }
                <textarea id="new-message-input" placeholder="${
                  hasImage
                    ? t("mainChat.addCaption")
                    : stickerToSend
                      ? t("mainChat.stickerMessagePlaceholder")
                      : t("mainChat.messagePlaceholder")
                }" class="relative flex-1 self-center pl-5 pr-5 py-3 bg-gray-700 text-white rounded-full border border-transparent focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-200 text-sm placeholder-gray-500 resize-none" rows="1" style="min-height: 44px; max-height: 120px;" ${
                  isWaitingForResponse ? "disabled" : ""
                }>${app.state.currentMessage || ""}</textarea>
                <button id="sticker-btn"
                    class="flex-shrink-0 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-all duration-200 w-[44px] h-[44px] flex items-center justify-center"
                    ${isWaitingForResponse ? "disabled" : ""}>
                    <i data-lucide="smile" class="w-5 h-5 pointer-events-none"></i>
                </button>
                <button id="send-message-btn"
                    class="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 w-[44px] h-[44px] flex items-center justify-center"
                    ${isWaitingForResponse ? "disabled" : ""}>
                    <i data-lucide="send" class="w-5 h-5"></i>
                </button>
            </div>
            ${app.state.showUserStickerPanel ? renderUserStickerPanel(app) : ""}
        </div>
    `;
}

function renderUserStickerPanel(app) {
  const userStickers = app.state.userStickers || [];
  const currentSize = app.calculateUserStickerSize();

  return `
        <div class="absolute bottom-full right-0 z-20 mb-2 w-80 rounded-xl shadow-lg border border-gray-700 animate-fadeIn floating-panel">
            <div class="p-3 border-b border-gray-700 flex items-center justify-between">
                <h3 class="text-sm font-medium text-white">${t(
                  "mainChat.personaStickers",
                )}</h3>
                <div class="flex gap-2">
                    <button id="add-user-sticker-btn" class="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded" title="${t(
                      "mainChat.addSticker",
                    )}">
                        <i data-lucide="plus" class="w-3 h-3"></i>
                    </button>
                    <button id="close-sticker-panel-btn" class="p-1 bg-gray-600 hover:bg-gray-500 text-white rounded" title="${t(
                      "common.close",
                    )}">
                        <i data-lucide="x" class="w-3 h-3 pointer-events-none"></i>
                    </button>
                </div>
            </div>
            <div class="p-3">
                <div class="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span>${t("mainChat.stickerSupport")}</span>
                    <span>${t("mainChat.stickerCount").replace(
                      "{{count}}",
                      userStickers.length,
                    )}</span>
                </div>
                <div class="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>${t("mainChat.totalSize").replace(
                      "{{size}}",
                      formatBytes(currentSize),
                    )}</span>
                </div>
                ${
                  userStickers.length === 0
                    ? `
                    <div class="text-center text-gray-400 py-8">
                        <i data-lucide="smile" class="w-8 h-8 mx-auto mb-2"></i>
                        <p class="text-sm">${t("mainChat.addStickerPrompt")}</p>
                        <button id="trigger-add-sticker-btn" class="mt-2 text-xs text-blue-400 hover:text-blue-300">${t(
                          "mainChat.addStickerButton",
                        )}</button>
                    </div>
                `
                    : `
                    <div class="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                        ${userStickers
                          .map((sticker) => {
                            const isVideo =
                              sticker.type &&
                              (sticker.type.startsWith("video/") ||
                                sticker.type === "video/mp4" ||
                                sticker.type === "video/webm");
                            const isAudio =
                              sticker.type && sticker.type.startsWith("audio/");

                            let content = "";
                            if (isAudio) {
                              content = `<div class="w-full h-full flex items-center justify-center bg-gray-600"><i data-lucide="music" class="w-6 h-6 text-gray-300"></i></div>`;
                            } else if (isVideo) {
                              content = `<video class="w-full h-full object-cover" muted><source src="${sticker.data}" type="${sticker.type}"></video>`;
                            } else {
                              content = `<img src="${sticker.data}" alt="${sticker.name}" class="w-full h-full object-cover">`;
                            }

                            return `
                            <div class="relative group">
                                <button data-sticker-send='${JSON.stringify({
                                  name: sticker.name,
                                  data: sticker.data,
                                  type: sticker.type || "image/png",
                                })}'
                                    class="user-sticker-send-btn w-full aspect-square bg-gray-700 rounded-lg overflow-hidden hover:bg-gray-600 transition-colors">
                                    ${content}
                                </button>
                                <div class="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button data-sticker-edit="${sticker.id}"
                                        class="sticker-edit-btn w-5 h-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center text-xs" title="${t(
                                          "characterModal.editStickerName",
                                        )}">
                                        <i data-lucide="edit-3" class="w-2 h-2"></i>
                                    </button>
                                    <button data-sticker-delete="${sticker.id}"
                                        class="sticker-delete-btn w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs" title="${t(
                                          "characterModal.deleteSticker",
                                        )}">
                                        <i data-lucide="x" class="w-3 h-3"></i>
                                    </button>
                                </div>
                                <div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate rounded-b-lg">
                                    ${sticker.name}
                                </div>
                            </div>
                            `;
                          })
                          .join("")}
                    </div>
                `
                }
            </div>
            <input type="file" accept="image/*,video/*,audio/*" id="user-sticker-input" class="hidden" multiple />
        </div>
    `;
}

function renderMessages(app) {
  const messages = app.state.messages[app.state.selectedChatId] || [];
  let html = "";
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const prevMsg = messages[i - 1];

    const showDateSeparator = (() => {
      if (!prevMsg) return true;
      const prevDate = new Date(prevMsg.id);
      const currentDate = new Date(msg.id);
      return (
        prevDate.getFullYear() !== currentDate.getFullYear() ||
        prevDate.getMonth() !== currentDate.getMonth() ||
        prevDate.getDate() !== currentDate.getDate()
      );
    })();

    if (showDateSeparator) {
      html += `<div class="flex justify-center my-4"><div class="flex items-center text-xs text-gray-300 bg-gray-800/80 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-md"><i data-lucide="calendar" class="w-3 h-3.5 mr-2 text-gray-400"></i>${formatDateSeparator(
        new Date(msg.id),
      )}</div></div>`;
    }

    const groupInfo = findMessageGroup(messages, i);
    const isLastInGroup = i === groupInfo.endIndex;

    if (app.state.editingMessageId === groupInfo.lastMessageId) {
      let editContentHtml = "";
      if (msg.type === "image") {
        // 이미지 URL 가져오기 - imageUrl이 있으면 사용, 없으면 imageId로 캐릭터 미디어에서 찾기
        let imageUrl = msg.imageUrl;
        if (!imageUrl && msg.imageId) {
          const selectedChatRoom = app.getCurrentChatRoom();
          const character = selectedChatRoom ? app.state.characters.find(c => c.id === selectedChatRoom.characterId) : null;
          const imageData = character?.media?.find(m => m.id === msg.imageId);
          imageUrl = imageData?.dataUrl || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        }
        
        editContentHtml = `
                        <img src="${imageUrl}" class="image-open-btn max-w-xs max-h-80 rounded-lg object-cover mb-2 cursor-pointer" data-image-url="${imageUrl}">
                        <textarea data-id="${groupInfo.lastMessageId}" class="edit-message-textarea w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500/50 text-sm" rows="2" placeholder="이미지에 설명을 추가하세요...">${msg.content || ''}</textarea>
                    `;
      } else {
        const combinedContent = messages
          .slice(groupInfo.startIndex, groupInfo.endIndex + 1)
          .map((m) => m.content)
          .join("\n");
        editContentHtml = `<textarea data-id="${groupInfo.lastMessageId}" class="edit-message-textarea w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500/50 text-sm" rows="3">${combinedContent}</textarea>`;
      }

      html += `
                    <div class="flex flex-col ${
                      msg.isMe ? "items-end" : "items-start"
                    }">
                        ${editContentHtml}
                        <div class="flex items-center space-x-2 mt-2">
                            <button data-id="${
                              groupInfo.lastMessageId
                            }" class="cancel-edit-btn text-xs text-gray-400 hover:text-white">${t(
                              "common.cancel",
                            )}</button>
                            <button data-id="${
                              groupInfo.lastMessageId
                            }" class="save-edit-btn text-xs text-blue-400 hover:text-blue-300">${t(
                              "common.save",
                            )}</button>
                        </div>
                    </div>
                `;
      i = groupInfo.endIndex;
      continue;
    }

    // 단톡방/오픈톡방에서는 characterId로 캐릭터 정보 가져오기
    const selectedChat = msg.characterId
      ? app.state.characters.find((c) => c.id === msg.characterId)
      : app.state.characters.find((c) => c.id === app.state.selectedChatId);
    const showSenderInfo = !msg.isMe && i === groupInfo.startIndex;

    const hasAnimated = app.animatedMessageIds.has(msg.id);
    const needsAnimation = !hasAnimated;
    if (needsAnimation) {
      app.animatedMessageIds.add(msg.id);
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.isMe);
    const showUnread =
      msg.isMe &&
      lastUserMessage &&
      msg.id === lastUserMessage.id &&
      app.state.isWaitingForResponse &&
      !app.state.typingCharacterId;

    let messageBodyHtml = "";
    if (msg.type === "sticker") {
      let stickerData = msg.stickerData;

      if (!stickerData) {
        const selectedChatRoom = app.getCurrentChatRoom();
        const character = selectedChatRoom
          ? app.state.characters.find(
              (c) => c.id === selectedChatRoom.characterId,
            )
          : null;
        stickerData = character?.stickers?.find((s) => {
          if (s.id === Number(msg.stickerId)) return true;
          if (s.name === msg.stickerId) return true;
          const baseFileName = s.name.replace(/\.[^/.]+$/, "");
          const searchFileName = String(msg.stickerId).replace(/\.[^/.]+$/, "");
          if (baseFileName === searchFileName) return true;
          return false;
        });
      }

      if (stickerData) {
        const isVideo =
          stickerData.type &&
          (stickerData.type.startsWith("video/") ||
            stickerData.type === "video/mp4" ||
            stickerData.type === "video/webm");
        const isAudio =
          stickerData.type && stickerData.type.startsWith("audio/");

        let stickerHtml = "";
        if (isAudio) {
          const audioSrc = stickerData.data || stickerData.dataUrl;
          const stickerName =
            stickerData.stickerName ||
            stickerData.name ||
            t("mainChat.audioSticker");
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
          const sizeClass = isExpanded ? "max-w-6xl" : "max-w-xs";
          const heightStyle = isExpanded
            ? "max-height: 1080px;"
            : "max-height: 240px;";
          stickerHtml = `
                        <div class="sticker-toggle-btn inline-block cursor-pointer transition-all duration-300" data-message-id="${msg.id}">
                            <video class="${sizeClass} rounded-2xl" style="${heightStyle}" controls muted loop autoplay>
                                <source src="${videoSrc}" type="${stickerData.type}">
                            </video>
                        </div>
                    `;
        } else {
          const imgSrc = stickerData.data || stickerData.dataUrl;
          const stickerName =
            stickerData.stickerName ||
            stickerData.name ||
            t("mainChat.sticker");
          const isExpanded = app.state.expandedStickers.has(msg.id);
          const sizeClass = isExpanded ? "max-w-6xl" : "max-w-xs";
          const heightStyle = isExpanded
            ? "max-height: 1080px;"
            : "max-height: 240px;";
          stickerHtml = `<div class="sticker-toggle-btn inline-block cursor-pointer transition-all duration-300" data-message-id="${msg.id}"><img src="${imgSrc}" alt="${stickerName}" class="${sizeClass} rounded-2xl object-contain" style="${heightStyle}"></div>`;
        }

        const hasTextMessage =
          (msg.hasText && msg.content && msg.content.trim()) ||
          (msg.stickerData &&
            msg.stickerData.hasText &&
            msg.stickerData.textContent &&
            msg.stickerData.textContent.trim()) ||
          (msg.content &&
            msg.content.trim() &&
            !msg.content.includes("[스티커:"));

        if (hasTextMessage) {
          let textContent = "";
          if (msg.stickerData && msg.stickerData.textContent) {
            textContent = msg.stickerData.textContent;
          } else if (msg.content && !msg.content.includes("[스티커:")) {
            textContent = msg.content;
          }

          if (textContent.trim()) {
            const textHtml = `<div class="px-4 py-2 rounded-2xl text-sm md:text-base leading-relaxed ${msg.isMe ? "text-white" : "text-gray-100"} mb-2 ${msg.isMe ? "message-bubble-me" : "message-bubble-them"}"><div class="break-words">${textContent}</div></div>`;
            messageBodyHtml = `<div class="flex flex-col ${
              msg.isMe ? "items-end" : "items-start"
            }">${textHtml}${stickerHtml}</div>`;
          } else {
            messageBodyHtml = stickerHtml;
          }
        } else {
          messageBodyHtml = stickerHtml;
        }
      } else {
        messageBodyHtml = `<div class="px-4 py-2 rounded-2xl text-sm md:text-base leading-relaxed bg-gray-700 text-gray-400 italic">${t(
          "mainChat.deletedSticker",
        )}${msg.stickerName || msg.content}]</div>`;
      }
    } else if (msg.type === "image") {
      const selectedChatRoom = app.getCurrentChatRoom();
      const character = selectedChatRoom
        ? app.state.characters.find(
            (c) => c.id === selectedChatRoom.characterId,
          )
        : null;
      const imageData = character?.media?.find((m) => m.id === msg.imageId);
      const imageUrl = imageData
        ? imageData.dataUrl
        : "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; // Transparent pixel

      const isExpanded = app.state.expandedStickers.has(msg.id);
      const sizeClass = isExpanded ? "max-w-6xl" : "max-w-xs";
      const heightStyle = isExpanded
        ? "max-height: 1080px;"
        : "max-height: 320px;";
      const imageTag = `<div class="sticker-toggle-btn inline-block cursor-pointer transition-all duration-300" data-message-id="${msg.id}"><img src="${imageUrl}" class="${sizeClass} rounded-lg object-cover" style="${heightStyle}"></div>`;
      const captionTag = msg.content
        ? `<div class="mt-2 px-4 py-2 rounded-2xl text-sm md:text-base leading-relaxed inline-block ${msg.isMe ? "text-white" : "text-gray-100"} ${msg.isMe ? "message-bubble-me" : "message-bubble-them"}"><div class="break-words">${msg.content}</div></div>`
        : "";
      messageBodyHtml = `<div class="flex flex-col ${
        msg.isMe ? "items-end" : "items-start"
      }">${imageTag}${captionTag}</div>`;
    } else {
      messageBodyHtml = `<div class="px-4 py-2 rounded-2xl text-sm md:text-base leading-relaxed ${msg.isMe ? "text-white" : "text-gray-100"} ${msg.isMe ? "message-bubble-me" : "message-bubble-them"}"><div class="break-words">${msg.content}</div></div>`;
    }

    let actionButtonsHtml = "";
    if (isLastInGroup) {
      const canEdit =
        msg.isMe &&
        (msg.type === "text" || msg.type === "image" || msg.type === "sticker");
      const isLastMessageOverall = i === messages.length - 1;
      const canReroll =
        !msg.isMe &&
        (msg.type === "text" || msg.type === "image" || msg.type === "sticker") &&
        isLastMessageOverall &&
        !app.state.isWaitingForResponse;
      const canGenerateExtra = canReroll; // SNS와 NAI 버튼도 같은 조건 사용
      actionButtonsHtml = `
                <div class="flex items-center gap-2 mt-1.5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                  msg.isMe ? "justify-end" : ""
                }">
                    ${
                      canEdit
                        ? `<button data-id="${msg.id}" class="edit-msg-btn text-gray-500 hover:text-white"><i data-lucide="edit-3" class="w-3 h-3 pointer-events-none"></i></button>`
                        : ""
                    }
                    <button data-id="${
                      msg.id
                    }" class="delete-msg-btn text-gray-500 hover:text-white"><i data-lucide="trash-2" class="w-3 h-3 pointer-events-none"></i></button>
                    ${
                      canReroll
                        ? `<button data-id="${msg.id}" class="reroll-msg-btn text-gray-500 hover:text-white" title="${t('mainChat.regenerateMessage')}"><i data-lucide="refresh-cw" class="w-3 h-3 pointer-events-none"></i></button>`
                        : ""
                    }
                    ${
                      canGenerateExtra
                        ? `<button data-id="${msg.id}" class="generate-sns-btn text-gray-500 hover:text-white" title="${t('mainChat.generateSNS')}"><i data-lucide="newspaper" class="w-3 h-3 pointer-events-none"></i></button>`
                        : ""
                    }
                    ${
                      canGenerateExtra
                        ? `<button data-id="${msg.id}" class="generate-nai-btn text-gray-500 hover:text-white" title="${t('mainChat.generateNAI')}"><i data-lucide="image" class="w-3 h-3 pointer-events-none"></i></button>`
                        : ""
                    }
                </div>
                `;
    }

    html += `
                <div class="group flex w-full items-start gap-3  ${msg.isMe ? "flex-row-reverse" : ""}">
                    ${
                      !msg.isMe
                        ? `<div class="shrink-0 w-10 h-10 mt-1">${
                            showSenderInfo
                              ? renderAvatar(selectedChat, "sm")
                              : ""
                          }</div>`
                        : ""
                    }
                    <div class="flex flex-col ${msg.isMe ? "max-w-[85%] sm:max-w-[75%]" : "max-w-[70%] sm:max-w-[75%]"} ${
                      msg.isMe ? "items-end" : "items-start"
                    }">
                        ${
                          showSenderInfo
                            ? `<p class="text-sm text-gray-400 mb-1">${msg.sender}</p>`
                            : ""
                        }
                        <div class="flex items-end gap-2 ${
                          msg.isMe ? "flex-row-reverse" : ""
                        }">
                            ${
                              showUnread
                                ? `<span class="text-xs text-yellow-400 self-end mb-0.5">1</span>`
                                : ""
                            }
                            <div class="message-content-wrapper">
                                ${messageBodyHtml}
                            </div>
                            ${
                              isLastInGroup
                                ? `<p class="text-xs text-gray-500 shrink-0 self-end">${msg.time}</p>`
                                : ""
                            }
                        </div>
                        ${actionButtonsHtml}
                    </div>
                </div>
            `;
  }

  if (app.state.typingCharacterId === app.state.selectedChatId) {
    const selectedChat = app.state.characters.find(
      (c) => c.id === app.state.selectedChatId,
    );
    const typingIndicatorId = `typing-${Date.now()}`;
    if (!app.animatedMessageIds.has(typingIndicatorId)) {
      html += `
                    <div id="${typingIndicatorId}" class="flex items-start gap-3 animate-slideUp">
                        <div class="shrink-0 w-10 h-10 mt-1">${renderAvatar(
                          selectedChat,
                          "sm",
                        )}</div>
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

export { renderUserStickerPanel, renderInputArea };

export function renderMainChat(app) {
  const mainChat = document.getElementById("main-chat");
  const selectedChatRoom = app.getCurrentChatRoom();
  const selectedChat = selectedChatRoom
    ? app.state.characters.find((c) => c.id === selectedChatRoom.characterId)
    : null;

  // 단톡방 확인
  const selectedGroupChat =
    app.state.selectedChatId &&
    typeof app.state.selectedChatId === "string" &&
    app.state.selectedChatId.startsWith("group_")
      ? app.state.groupChats[app.state.selectedChatId]
      : null;

  // 오픈톡방 확인
  const selectedOpenChat =
    app.state.selectedChatId &&
    typeof app.state.selectedChatId === "string" &&
    app.state.selectedChatId.startsWith("open_")
      ? app.state.openChats[app.state.selectedChatId]
      : null;

  if (selectedOpenChat) {
    // 오픈톡방 렌더링
    const currentParticipants = selectedOpenChat.currentParticipants || [];
    const participantNames = currentParticipants
      .map((id) => {
        const character = app.state.characters.find((c) => c.id === id);
        return character ? character.name : "";
      })
      .filter(Boolean);

    mainChat.innerHTML = `
            <header class="px-4 py-4 bg-gray-900/80 border-b border-gray-800 glass-effect flex items-center justify-between z-10">
                <div class="flex items-center space-x-3 md:space-x-4">
                    <button id="mobile-sidebar-toggle" class="p-3 -ml-2 rounded-full hover:bg-gray-700 md:hidden">
                        <i data-lucide="menu" class="h-6 w-6 text-gray-300"></i>
                    </button>
                    <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                        <i data-lucide="globe" class="w-7 h-7 text-white"></i>
                    </div>
                    <div>
                        <h2 class="font-semibold text-white text-lg leading-tight">${
                          selectedOpenChat.name
                        }</h2>
                        <p class="text-sm text-gray-400 flex items-center">
                            <i data-lucide="globe" class="w-4 h-4 mr-1.5"></i>
                            ${t("mainChat.participantsConnected").replace(
                              "{{count}}",
                              currentParticipants.length,
                            )}${
                              participantNames.length > 0
                                ? ` (${participantNames.join(", ")})`
                                : ""
                            }
                        </p>
                    </div>
                </div>
                <div class="flex items-center space-x-1 md:space-x-2">
                    <button id="open-chat-sns-btn" class="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors" title="${t('sns.openSNSList')}">
                        <i data-lucide="user" class="w-4 h-4 text-gray-300 pointer-events-none"></i>
                    </button>
                    <button class="p-2 rounded-full bg-gray-800 hover:bg-gray-700"><i data-lucide="phone" class="w-4 h-4 text-gray-300"></i></button>
                    <button class="p-2 rounded-full bg-gray-800 hover:bg-gray-700"><i data-lucide="video" class="w-4 h-4 text-gray-300"></i></button>
                    <button class="chat-debug-logs-btn p-2 rounded-full bg-gray-800 hover:bg-gray-700" title="${t(
                      "mainChat.debugLogButtonTitle",
                    )}"><i data-lucide="bar-chart-3" class="w-4 h-4 text-gray-300 pointer-events-none"></i></button>
                </div>
            </header>
            <div id="messages-container" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                ${renderMessages(app)}
                <div id="messages-end-ref"></div>
            </div>
            <div id="input-area-wrapper" class="px-4 pb-4 glass-effect experimental-input-parent">
                ${renderInputArea(app)}
            </div>
        `;
  } else if (selectedGroupChat) {
    // 단톡방 렌더링
    const participants = getGroupChatParticipants(app, selectedGroupChat.id);
    const participantNames = participants.map((char) => char.name).join(", ");

    mainChat.innerHTML = `
            <header class="px-4 py-4 bg-gray-900/80 border-b border-gray-800 glass-effect flex items-center justify-between z-10">
                <div class="flex items-center space-x-3 md:space-x-4">
                    <button id="mobile-sidebar-toggle" class="p-3 -ml-2 rounded-full hover:bg-gray-700 md:hidden">
                        <i data-lucide="menu" class="h-6 w-6 text-gray-300"></i>
                    </button>
                    <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <i data-lucide="users" class="w-7 h-7 text-white"></i>
                    </div>
                    <div>
                        <h2 class="font-semibold text-white text-lg leading-tight">${
                          selectedGroupChat.name
                        }</h2>
                        <p class="text-sm text-gray-400 flex items-center">
                            <i data-lucide="users" class="w-4 h-4 mr-1.5"></i>
                            ${t("mainChat.participantsJoined").replace(
                              "{{count}}",
                              participants.length,
                            )}${
                              participantNames ? ` (${participantNames})` : ""
                            }
                        </p>
                    </div>
                </div>
                <div class="flex items-center space-x-1 md:space-x-2">
                    <button id="group-chat-sns-btn" class="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors" title="${t('sns.openSNSList')}">
                        <i data-lucide="user" class="w-4 h-4 text-gray-300 pointer-events-none"></i>
                    </button>
                    <button class="p-2 rounded-full bg-gray-800 hover:bg-gray-700"><i data-lucide="phone" class="w-4 h-4 text-gray-300"></i></button>
                    <button class="p-2 rounded-full bg-gray-800 hover:bg-gray-700"><i data-lucide="video" class="w-4 h-4 text-gray-300"></i></button>
                    <button class="chat-debug-logs-btn p-2 rounded-full bg-gray-800 hover:bg-gray-700" title="${t(
                      "mainChat.debugLogButtonTitle",
                    )}"><i data-lucide="bar-chart-3" class="w-4 h-4 text-gray-300 pointer-events-none"></i></button>
                </div>
            </header>
            <div id="messages-container" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                ${renderMessages(app)}
                <div id="messages-end-ref"></div>
            </div>
            <div id="input-area-wrapper" class="px-4 pb-4 glass-effect experimental-input-parent">
                ${renderInputArea(app)}
            </div>
        `;
  } else if (selectedChatRoom && selectedChat) {
    mainChat.innerHTML = `
            <header class="px-4 py-4 bg-gray-900/80 border-b border-gray-800 glass-effect flex items-center justify-between z-10">
                <div class="flex items-center space-x-3 md:space-x-4">
                    <button id="back-to-char-list" class="p-3 -ml-2 rounded-full hover:bg-gray-700 md:hidden">
                        <i data-lucide="arrow-left" class="h-6 w-6 text-gray-300"></i>
                    </button>
                    ${renderAvatar(selectedChat, "sm")}
                    <div>
                        <h2 class="font-semibold text-white text-lg leading-tight">${
                          selectedChat.name
                        }</h2>
                        <p class="text-sm text-gray-400 flex items-center"><i data-lucide="message-circle" class="w-4 h-4 mr-1.5"></i>${
                          selectedChatRoom.name
                        }</p>
                    </div>
                </div>
                <div class="flex items-center space-x-1 md:space-x-2">
                    <button id="individual-chat-sns-btn" class="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors" title="${t('sns.viewSNS', { name: selectedChat.name })}">
                        <i data-lucide="user" class="w-4 h-4 text-gray-300 pointer-events-none"></i>
                    </button>
                    <button class="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"><i data-lucide="phone" class="w-4 h-4 text-gray-300"></i></button>
                    <button class="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"><i data-lucide="video" class="w-4 h-4 text-gray-300"></i></button>
                    <button class="chat-debug-logs-btn p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors" title="${t(
                      "mainChat.debugLogButtonTitle",
                    )}"><i data-lucide="bar-chart-3" class="w-4 h-4 text-gray-300 pointer-events-none"></i></button>
                </div>
            </header>
            <div id="messages-container" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                ${renderMessages(app)}
                <div id="messages-end-ref"></div>
            </div>
            <div id="input-area-wrapper" class="px-4 pb-4 glass-effect experimental-input-parent">
                ${renderInputArea(app)}
            </div>
        `;
  } else {
    mainChat.innerHTML = renderLandingPage();
  }
}

/**
 * Setup event listeners for MainChat component
 * 관심사 분리 원칙에 따라 이벤트 핸들링을 별도 함수로 분리
 */
export function setupMainChatEventListeners() {
  setupLandingPageEventListeners();

  const backBtn = document.getElementById("back-to-char-list");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.personaApp.setState({ selectedChatId: null });
    });
  }

  // Remove sticker to send button
  const removeStickerBtn = document.getElementById(
    "remove-sticker-to-send-btn",
  );
  if (removeStickerBtn) {
    removeStickerBtn.addEventListener("click", () => {
      window.personaApp.setState({ stickerToSend: null });
    });
  }

  // Send message button
  const sendBtn = document.getElementById("send-message-btn");
  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      window.personaApp.handleSendMessageWithSticker();
    });
  }

  // Trigger add sticker button
  const triggerAddStickerBtn = document.getElementById(
    "trigger-add-sticker-btn",
  );
  if (triggerAddStickerBtn) {
    triggerAddStickerBtn.addEventListener("click", () => {
      document.getElementById("add-user-sticker-btn").click();
    });
  }

  // User sticker send buttons (dynamically generated)
  document.addEventListener("click", (event) => {
    if (event.target.closest(".user-sticker-send-btn")) {
      const btn = event.target.closest(".user-sticker-send-btn");
      const stickerData = JSON.parse(btn.dataset.stickerSend);
      window.personaApp.sendUserSticker(
        stickerData.name,
        stickerData.data,
        stickerData.type,
      );
    }
  });

  // Sticker edit buttons (dynamically generated)
  document.addEventListener("click", (event) => {
    if (event.target.closest(".sticker-edit-btn")) {
      event.stopPropagation();
      const btn = event.target.closest(".sticker-edit-btn");
      const stickerId = btn.dataset.stickerEdit;
      window.personaApp.editUserStickerName(parseInt(stickerId));
    }
  });

  // Sticker delete buttons (dynamically generated)
  document.addEventListener("click", (event) => {
    if (event.target.closest(".sticker-delete-btn")) {
      event.stopPropagation();
      const btn = event.target.closest(".sticker-delete-btn");
      const stickerId = btn.dataset.stickerDelete;
      window.personaApp.deleteUserSticker(parseInt(stickerId));
    }
  });

  // Image open buttons (dynamically generated)
  document.addEventListener("click", (event) => {
    if (event.target.closest(".image-open-btn")) {
      const img = event.target.closest(".image-open-btn");
      const imageUrl = img.dataset.imageUrl;
      window.open(imageUrl);
    }
  });

  // 스티커 토글 기능은 mainChatHandlers.js에서 처리됨

  // Chat debug logs buttons (multiple instances)
  document.addEventListener("click", (event) => {
    if (event.target.closest(".chat-debug-logs-btn")) {
      window.personaApp.setState({ showDebugLogsModal: true });
    }
  });
}
