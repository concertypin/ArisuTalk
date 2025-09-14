import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

type OriginalMessageContent = {
    role: "user" | "model",
    parts: { text: string }[]
};
type OriginalMessageType = {
    systemPrompt: string;
    contents: OriginalMessageContent[];
}

/**
 * Converts inner prompt structure to Langchain messages
 */
export function toLangchainPrompt(original: OriginalMessageType): BaseMessage[] {
    const systemMessage = new SystemMessage(original.systemPrompt);
    const contents = original.contents.map(c =>
        c.role === "user" ?
            new HumanMessage(c.parts.map(p => p.text).join("")) :
            new AIMessage(c.parts.map(p => p.text).join("")));
    return [systemMessage, ...contents];
}
export function toLangchainPromptMulti(original: OriginalMessageType[]): BaseMessage[][] {
    return original.map(o => toLangchainPrompt(o));
}