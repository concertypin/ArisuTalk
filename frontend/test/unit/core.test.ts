import { describe, it, expect, expectTypeOf } from "vitest";
import { Chat, Character, Message } from "@arisutalk/character-spec/v0/Character";
import { Settings } from "@/lib/types/IDataModel";
import { ChatProvider, type ProviderSettings } from "@/lib/interfaces";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";

describe("Data Models", () => {
    it("should generate valid IDs for new instances", () => {
        const msg = {
            role: "user",
            content: {
                type: "string",
                data: "Hello",
            },
            id: "test",
            timestamp: Date.now(),
        } satisfies Message;
        expectTypeOf(msg).toExtend<Message>();
        expect(msg.id).toBeDefined();
        expect(typeof msg.id).toBe("string");
        expect(msg.timestamp).toBeDefined();
    });

    it("should correctly structure a Chat", () => {
        const char: Character = {
            assets: {
                assets: [
                    {
                        url: "https://c.tenor.com/x8v1oNUOmg4AAAAd/tenor.gif",
                        mimeType: "image/gif",
                        name: "neverGonnaGiveYouUp.gif",
                    },
                ],
                inlays: [
                    {
                        url: "https://media.tenor.com/I8ZX_XGKSrAAAAAi/blue-archive-alisu.gif",
                        mimeType: "image/gif",
                        name: "alisuDancing.gif",
                    },
                ],
            },
            name: "Arisu",
            description: "A cute AI",
            specVersion: 0,
            id: "test-1db482ab-aefa-4d96-aa95-3544c8f04b80",
            prompt: {
                description: "Tendou Arisu from Blue Archive.",
                authorsNote: "(OOC: Respond with cute and energetic personality.)",
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
                                {
                                    type: "plain_text_match",
                                    text: "요괴",
                                },
                            ],
                            content: "",
                            name: "Hayase Yuuka",
                            multipleConditionResolveStrategy: "any",
                        },
                    ],
                },
            },
            executables: {
                runtimeSetting: {
                    mem: undefined,
                },
                replaceHooks: {
                    display: [],
                    input: [],
                    output: [],
                    request: [],
                },
            },
            metadata: {
                author: undefined,
                license: "",
                version: undefined,
                distributedOn: undefined,
                additionalInfo: undefined,
            },
        };
        const chat = {
            id: "test",
            characterId: char.id,
            title: "New Chat",
            messages: [] as Message[],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lorebook: [],
        } satisfies Chat;
        expect(chat.id).toBeDefined();
        expect(chat.characterId).toBe(char.id);
        expect(chat.messages).toHaveLength(0);

        chat.messages.push({
            role: "user",
            content: {
                type: "string",
                data: "Hello",
            },
            id: "test",
        });
        expect(chat.messages).toHaveLength(1);
    });

    it("should initialize Settings with default values", () => {
        const settings = new Settings();
        expect(settings).toBeDefined();
    });
});

describe("IChatProvider (Mock)", () => {
    class MockProvider extends ChatProvider<"MOCK"> {
        id = "mock";
        name = "Mock Provider";
        description = "For testing";

        // Private constructor to enforce static connect usage
        private constructor(_settings: ProviderSettings["MOCK"]) {
            super();
        }

        // Static factory method
        static async connect(settings: ProviderSettings["MOCK"]): Promise<MockProvider> {
            // Simulate async initialization if needed
            return new MockProvider(settings);
        }

        async disconnect() {}

        async generate(_messages: BaseMessage[], _settings?: ProviderSettings["MOCK"]) {
            // In a real provider, we would merge _settings with this.settings
            return "Mock response";
        }

        async *stream(_messages: BaseMessage[], _settings?: ProviderSettings["MOCK"]) {
            yield "Mock";
            yield " ";
            yield "stream";
        }
        abort() {}
        isReady() {
            return true;
        }
    }

    it("should implement generate correctly", async () => {
        // Use static connect
        const provider = await MockProvider.connect({});

        const response = await provider.generate([new HumanMessage("Hi")]);
        expect(response).toBe("Mock response");
    });

    it("should implement stream correctly", async () => {
        const provider = await MockProvider.connect({});
        const generator = provider.stream([new HumanMessage("Hi")]);
        let content = "";
        for await (const chunk of generator) {
            content += chunk;
        }
        expect(content).toBe("Mock stream");
    });
});
