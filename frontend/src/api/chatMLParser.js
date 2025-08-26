/**
 * ChatML (Chat Markup Language) Parser for ArisuTalk
 * 
 * This module parses ChatML format prompts and converts them to the internal prompt structure
 * used by different API providers.
 * 
 * ChatML Format:
 * <|im_start|>system
 * You are a helpful assistant.
 * <|im_end|>
 * <|im_start|>user
 * Hello!
 * <|im_end|>
 * <|im_start|>assistant
 * Hello! How can I help you today?
 * <|im_end|>
 */

/**
 * Parses ChatML format text into message objects
 * @param {string} chatMLText - The ChatML formatted text
 * @returns {Array<{role: string, content: string}>} Array of parsed messages
 */
export function parseChatML(chatMLText) {
  if (!chatMLText || typeof chatMLText !== 'string') {
    return [];
  }

  const messages = [];
  const lines = chatMLText.split('\n');
  let currentMessage = null;
  let contentLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('<|im_start|>')) {
      // Start of a new message
      if (currentMessage) {
        // Save previous message
        messages.push({
          role: currentMessage.role,
          content: contentLines.join('\n').trim()
        });
        contentLines = [];
      }
      
      const role = line.replace('<|im_start|>', '').trim();
      currentMessage = { role };
    } else if (line === '<|im_end|>') {
      // End of current message
      if (currentMessage) {
        messages.push({
          role: currentMessage.role,
          content: contentLines.join('\n').trim()
        });
        currentMessage = null;
        contentLines = [];
      }
    } else if (currentMessage) {
      // Content line
      contentLines.push(lines[i]); // Don't trim to preserve formatting
    }
  }

  // Handle case where last message doesn't have <|im_end|>
  if (currentMessage && contentLines.length > 0) {
    messages.push({
      role: currentMessage.role,
      content: contentLines.join('\n').trim()
    });
  }

  return messages;
}

/**
 * Converts ChatML messages to the internal prompt structure
 * @param {Array<{role: string, content: string}>} messages - Parsed ChatML messages
 * @param {Object} character - Character object
 * @param {string} userName - User name
 * @param {string} userDescription - User description
 * @returns {{systemPrompt: string, contents: Array<Object>}} Internal prompt structure
 */
export function chatMLToPromptStructure(messages, character, userName = '', userDescription = '') {
  let systemPrompt = '';
  const contents = [];

  for (const message of messages) {
    const { role, content } = message;

    if (role === 'system') {
      // System messages become the system prompt
      if (systemPrompt) {
        systemPrompt += '\n\n' + content;
      } else {
        systemPrompt = content;
      }
    } else if (role === 'user' || role === 'assistant') {
      // Convert to internal format based on API provider
      // For Gemini: role becomes "user" or "model"
      // For OpenAI: role stays "user" or "assistant"
      const internalRole = role === 'assistant' ? 'model' : 'user';
      
      contents.push({
        role: internalRole,
        parts: [{ text: content }]
      });
    }
  }

  // If no system prompt was found in ChatML, create a basic one
  if (!systemPrompt && character) {
    systemPrompt = `You are ${character.name}. Act according to your character description:\n\n${character.prompt || ''}`;
  }

  return { systemPrompt, contents };
}

/**
 * Converts internal prompt structure back to ChatML format
 * @param {string} systemPrompt - System prompt
 * @param {Array<Object>} contents - Internal contents array
 * @returns {string} ChatML formatted text
 */
export function promptStructureToChatML(systemPrompt, contents) {
  let chatML = '';

  // Add system message if present
  if (systemPrompt) {
    chatML += '<|im_start|>system\n' + systemPrompt + '\n<|im_end|>\n';
  }

  // Add conversation contents
  for (const content of contents) {
    const role = content.role === 'model' ? 'assistant' : content.role;
    const text = content.parts?.[0]?.text || content.content || '';
    
    if (text) {
      chatML += '<|im_start|>' + role + '\n' + text + '\n<|im_end|>\n';
    }
  }

  return chatML.trim();
}

/**
 * Validates if a string is valid ChatML format
 * @param {string} text - Text to validate
 * @returns {boolean} True if valid ChatML format
 */
export function isValidChatML(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // Basic validation: must contain at least one im_start and im_end pair
  const hasStart = text.includes('<|im_start|>');
  const hasEnd = text.includes('<|im_end|>');
  
  if (!hasStart || !hasEnd) {
    return false;
  }

  // Count start and end tags - they should match
  const startCount = (text.match(/<\|im_start\|>/g) || []).length;
  const endCount = (text.match(/<\|im_end\|>/g) || []).length;
  
  return startCount === endCount && startCount > 0;
}

/**
 * Creates a default ChatML template for users to start with
 * @param {Object} character - Character object (optional)
 * @returns {string} Default ChatML template
 */
export function getDefaultChatMLTemplate(character = null) {
  const characterName = character?.name || 'Assistant';
  const characterPrompt = character?.prompt || 'You are a helpful AI assistant.';
  
  return `<|im_start|>system
${characterPrompt}

You should respond naturally and stay in character. All responses should be in Korean unless specifically requested otherwise.
<|im_end|>
<|im_start|>user
안녕하세요!
<|im_end|>
<|im_start|>assistant
안녕하세요! 만나서 반갑습니다. 어떤 도움이 필요하신가요?
<|im_end|>`;
}