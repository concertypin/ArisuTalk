import {
    ChatProvider,
    type CommonChatSettings,
    type ProviderSettings,
    type IChatProviderFactory,
} from "@/lib/interfaces/IChatProvider";
import { type BaseMessage } from "@langchain/core/messages";
import { FakeListChatModel } from "@langchain/core/utils/testing";

type MockSettings = CommonChatSettings & ProviderSettings["MOCK"];

export class MockChatProvider extends ChatProvider<"MOCK"> {
    id = "MOCK";
    name = "Mock Provider";
    description = "Mock provider for testing";

    private model: FakeListChatModel;
    private aborted = false;

    private constructor(settings: MockSettings) {
        super();
        this.model = new FakeListChatModel({
            responses: settings.responses || [
                "Hello!",
                "This is a mock response.",
                "How can I help you?",
            ],
            sleep: settings.mockDelay || 100,
        });
    }

    static factory: IChatProviderFactory<"MOCK"> = {
        connect: async (settings: MockSettings) => {
            return new MockChatProvider(settings);
        },
    };

    async disconnect(): Promise<void> {
        // No-op for mock
    }

    async generate(messages: BaseMessage[], _settings?: Partial<MockSettings>): Promise<string> {
        // In a real implementation, we might create a new model instance if settings are provided
        // For mock, we just use the existing one or ignore settings
        const response = await this.model.invoke(messages);
        return response.content as string;
    }

    async *stream(
        messages: BaseMessage[],
        _settings?: Partial<MockSettings>
    ): AsyncGenerator<string, void, unknown> {
        this.aborted = false;
        const stream = await this.model.stream(messages);

        for await (const chunk of stream) {
            if (this.aborted) {
                break;
            }
            yield chunk.content as string;
        }
    }

    abort(): void {
        this.aborted = true;
    }

    isReady(): boolean {
        return true;
    }
}
