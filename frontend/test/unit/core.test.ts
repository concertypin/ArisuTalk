import { describe, it, expect } from "vitest";
import { Chat, Character, Message, Settings } from "@/lib/types/IDataModel";
import { ChatProvider } from "@/lib/interfaces/IChatProvider";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";

describe("Data Models", () => {
    it("should generate valid IDs for new instances", () => {
        const msg = new Message({ role: "user", content: "Hello" });
        expect(msg.id).toBeDefined();
        expect(typeof msg.id).toBe("string");
        expect(msg.timestamp).toBeDefined();
    });

    it("should correctly structure a Chat", () => {
        const char = new Character({
            name: "Arisu",
            description: "A cute AI",
            persona: "Be helpful",
        });
        const chat = new Chat({ characterId: char.id, title: "New Chat" });
        expect(chat.id).toBeDefined();
        expect(chat.characterId).toBe(char.id);
        expect(chat.messages).toHaveLength(0);

        chat.addMessage(new Message({ role: "user", content: "Hi" }));
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
        private constructor(_settings: {}) {
            super();
        }

        // Static factory method
        static async connect(settings: {}): Promise<MockProvider> {
            // Simulate async initialization if needed
            return new MockProvider(settings);
        }

        async disconnect() {}

        async generate(_messages: BaseMessage[], _settings?: {}) {
            // In a real provider, we would merge _settings with this.settings
            return "Mock response";
        }

        async *stream(_messages: BaseMessage[], _settings?: {}) {
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
