import { get } from "svelte/store";
import { openChats } from "../stores/chat";
import {
    characters,
    characterStateStore,
    initializeCharacterState,
    updateCharacterState,
} from "../stores/character";
import { addSystemMessage } from "./chatService";
import { t } from "$root/i18n";

/**
 * 캐릭터를 OpenChat에 참여시킵니다.
 */
export function characterJoinOpenChat(
    chatId: string,
    characterId: string
): void {
    const character = get(characters).find((c) => c.id === characterId);
    if (!character) return;

    openChats.update((chats) => {
        const chat = chats[chatId];
        if (chat && !chat.currentParticipants.includes(characterId)) {
            chat.currentParticipants.push(characterId);
            chat.participantHistory.push({ characterId, joinedAt: Date.now() });
        }
        return chats;
    });

    initializeCharacterState(characterId, character.personality);
    updateCharacterState(characterId, {
        currentRooms: [
            ...(get(characterStateStore)[characterId]?.currentRooms || []),
            chatId,
        ],
    });

    addSystemMessage(
        chatId,
        get(t)("openChat.joined", { name: character.name })
    );
}

/**
 * 캐릭터를 OpenChat에서 퇴장시킵니다.
 */
export function characterLeaveOpenChat(
    chatId: string,
    characterId: string,
    reason: string = "tired"
): void {
    const character = get(characters).find((c) => c.id === characterId);
    if (!character) return;

    openChats.update((chats) => {
        const chat = chats[chatId];
        if (chat) {
            chat.currentParticipants = chat.currentParticipants.filter(
                (id) => id !== characterId
            );
        }
        return chats;
    });

    const currentState = get(characterStateStore)[characterId];
    if (currentState) {
        updateCharacterState(characterId, {
            currentRooms: currentState.currentRooms.filter(
                (id) => id !== chatId
            ),
        });
    }

    addSystemMessage(chatId, get(t)("openChat.left", { name: character.name }));
}

/**
 * OpenChat방에 초기 참여자를 설정합니다. (레거시 triggerInitialOpenChatJoins 대체)
 */
export function initializeOpenChat(chatId: string): void {
    const availableCharacters = get(characters);
    const joinCount = Math.floor(Math.random() * 3) + 2; // 2-4 characters
    const shuffled = [...availableCharacters].sort(() => Math.random() - 0.5);
    const initialJoiners = shuffled.slice(
        0,
        Math.min(joinCount, availableCharacters.length)
    );

    for (const character of initialJoiners) {
        setTimeout(() => {
            characterJoinOpenChat(chatId, character.id);
        }, Math.random() * 5000); // Join after 0-5 seconds
    }
}

/**
 * OpenChat 참여자 상태를 주기적으로 업데이트합니다. (레거시 updateParticipantStates 대체)
 */
export function updateParticipantStates(chatId: string): void {
    const chat = get(openChats)[chatId];
    if (!chat) return;

    const currentParticipants = chat.currentParticipants;

    for (const participantId of currentParticipants) {
        const character = get(characters).find((c) => c.id === participantId);
        if (!character) continue;

        let state = get(characterStateStore)[participantId];
        if (!state) {
            initializeCharacterState(participantId, character.personality);
            state = get(characterStateStore)[participantId];
        }

        const { mood, socialBattery, energy, personality } = state;

        let leaveChance = 0.1; // Base 10%
        if (socialBattery < 0.3) leaveChance += 0.3;
        if (mood < 0.3) leaveChance += 0.2;
        if (energy < 0.4) leaveChance += 0.15;
        leaveChance += (1 - (personality?.extroversion || 0.5)) * 0.2;

        if (Math.random() < Math.min(0.8, leaveChance)) {
            characterLeaveOpenChat(chatId, participantId, "tired");
        }
    }

    // Possibility of a new participant joining
    const updatedChat = get(openChats)[chatId];
    const shouldAddNewParticipant =
        Math.random() < 0.3 && updatedChat.currentParticipants.length < 6;

    if (shouldAddNewParticipant) {
        const availableCharacters = get(characters).filter(
            (c) => !updatedChat.currentParticipants.includes(c.id) && c.id
        );
        if (availableCharacters.length > 0) {
            const newParticipant =
                availableCharacters[
                    Math.floor(Math.random() * availableCharacters.length)
                ];
            characterJoinOpenChat(chatId, newParticipant.id);
        }
    }
}
