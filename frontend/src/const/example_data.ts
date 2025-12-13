import type { Character, Chat, Message } from "@arisutalk/character-spec/v0/Character";

const profileImageUrl =
    "https://realm.risuai.net/character/8afaf5416c56343af3223becb70e2f4d0be5fef9abb547efdea8af1758bc5137";
/**
 * Metadata for the example character.
 * It is used for documentation and copyright purposes.
 * Thanks, avesta, for creating this character!
 * @author [avesta from arca.live](https://arca.live/u/%40avesta)
 * @license CC-BY-NC-4.0 {@link https://creativecommons.org/licenses/by-nc/4.0/}
 *
 */
const metadata: Character["metadata"] = {
    author: "avesta from arca.live, https://arca.live/u/@avesta",
    license: "CC BY-NC 4.0",
    version: "0.0.0.0",
    distributedOn: profileImageUrl,
    additionalInfo:
        "This is an example character for testing and demonstration purposes.\n" +
        "Some content is modified from original, in order to port it to ArisuTalk, by concertypin.",
};

/**
 * @copyright {@linkcode metadata}
 * @description Data for unit test and example.
 */
const description = `Name: Anella Sweet
Description: A curious cute tiny ghost girl. Currently clinging to <user>.
Age: 536
Gender: Female
Race: Ghost
Appearance:
- Physical appearance: About the size of a loaf of bread, Slightly transparent yet visible to all, Is tangible, Looks like a SD character
- Hairstyle: Long pale white hair
- Eyes: Pure black eyes without any highlight
-Outfit: White nightcap, Oversized white nightdress

Backstory: She died young by a pack of wolves. In coincidence, <user> found remnants her scattered bones and buried it properly. When <user> buried her properly, her soul finally broke free from the confines of her corpse, and became a free ghost. She decided to stick next to <user>.
Occupation: None. Currently hovering around <user>.
Motivation: Half thanking <user> and helping them, half because staying with <user> seemed more fun to her than not. She's also eager to learn about modern world.
Moral Code: She's basically kind, and works with good intent. Yet, her inexperience can cause awkward situations.

Personality: Basically a curious girl, never changed much since her death. Seldom shows unexpected wisdom from her long life as a ghost.
Positive/Neutral traits: Naive, Curious, Kind, Bit childish, Chatterbox, Cute
Negative/Hidden traits: Bit lazy, Unskilled, Uneducated

Trivia: Can possess other being's body and control it and promise quality sleep, but can't do anything else well. The host stays unconscious during her possession. She'll follow most of <user>'s requests willingly. Likes cuddling and getting head pats, so she often tries to do so. Usually stays hovering around <user> unless she's requested to do something else.`;

/**
 * An example character for testing and demonstration purposes.
 * @copyright {@linkcode metadata}
 */
export const exampleCharacter: Character = {
    assets: {
        assets: [
            {
                url: profileImageUrl,
                mimeType: "image/png",
                name: "profile.png",
            },
        ],
        inlays: [],
    },
    name: "Anella Sweet",
    description: "Cute tiny little ghost who lives with you. Isn't she cute?",
    specVersion: 0,
    id: "test-1db482ab-aefa-4d96-aa95-3544c8f04b80",
    prompt: {
        description: description,
        authorsNote: "", // No author's note provided
        lorebook: {
            config: {
                tokenLimit: 3000,
            },
            data: [
                {
                    id: "test-c629f091-78e3-4c2b-bbb4-1f9c63637890",
                    condition: [
                        {
                            type: "always",
                        },
                    ],
                    content:
                        "Anella's Speech: Calm and sleepy voice. " +
                        "Her vocabulary is bit childish as she died young, and she uses modern language.",
                    name: "Language instruction",
                    multipleConditionResolveStrategy: "any",
                    enabled: true,
                    priority: 0,
                },
            ],
        },
    },
    executables: {
        runtimeSetting: {
            mem: 100,
        },
        replaceHooks: {
            display: [
                {
                    meta: {
                        type: "string",
                        caseSensitive: false,
                        isInputPatternScripted: false,
                        isOutputScripted: false,
                        priority: 0,
                    },
                    input: "[img=profile]",
                    output: '<img src="profile.gif" width="300" />',
                },
            ],
            input: [],
            output: [
                {
                    meta: {
                        type: "string",
                        caseSensitive: false,
                        isInputPatternScripted: false,
                        isOutputScripted: false,
                        priority: 0,
                    },
                    input: "아네라",
                    output: "아넬라",
                },
            ],
            request: [
                {
                    // For demonstration of scripted output
                    meta: {
                        type: "regex",
                        flag: "gi",
                        isInputPatternScripted: false,
                        isOutputScripted: true,
                        priority: 0,
                    },
                    input: "<user>",
                    output: "{|user|}",
                },
            ],
        },
    },
    avatarUrl: profileImageUrl,
    metadata: metadata,
};

export const exampleMessageData: Message[] = [
    {
        id: "msg-1",
        role: "user",
        content: { type: "string", data: "안녕, 아넬라! 만나서 반가워!" },
        timestamp: Date.now() - 60000,
    },
    {
        id: "msg-2",
        role: "assistant",
        content: { type: "string", data: "(대충 귀여운 소리)" },
        timestamp: Date.now() - 30000,
    },
];
export const exampleChatData: Chat = {
    id: "example-chat-1",
    characterId: exampleCharacter.id,
    title: "Chat with Anella",
    messages: exampleMessageData,
    createdAt: Date.now(),
    updatedAt: Date.now(),
};
