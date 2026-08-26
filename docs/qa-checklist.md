# QA Checklist — Phase 4 Blossom + System Prompt Integration

> Generated from browser testing, code review, and review-driven fixes on 2026-07-02.
> Each item includes: what to test, how to test, expected result, and regression risk.

---

## 1. System Prompt Injection (Critical)

The core change: `chatStore.sendMessage` now builds a `SystemMessage` from character prompt, persona, and generation prompt, then prepends it to the LLM message chain.

### 1.1 Basic Flow
- [ ] **Create a character** with `prompt.description` filled in (e.g., "You are a samurai. Speak in archaic Japanese.")
- [ ] **Create a persona** with `description` filled in (e.g., "You are a teenage girl. Use casual speech.")
- [ ] **Set generation prompt** in Settings → Prompts (e.g., "You are a helpful assistant.")
- [ ] **Start a chat** with the character, with persona active
- [ ] **Send a message** (e.g., "自己紹介して")
- [ ] **Verify AI response** contains markers from BOTH character prompt AND persona
  - Character: samurai speech style, archaic language
  - Persona: casual teenage speech patterns
- [ ] **Check browser console** for `[SystemPromptBuilder] Assembled N sections` log

### 1.2 Section Toggling
- [ ] Go to **Settings → Prompts → Prompt Sections**
- [ ] **Disable "Character" section** (toggle OFF)
- [ ] Send a message — verify AI does NOT use character persona (no samurai speech)
- [ ] **Re-enable "Character"** — verify character persona returns
- [ ] **Disable "Persona" section** — verify persona markers disappear
- [ ] **Disable "System Prompt"** — verify only character+persona sections remain
- [ ] **Disable all sections** — verify AI responds with default behavior (no special personality)

### 1.3 Section Order
- [ ] In Prompt Sections, **reorder sections** (drag or toggle order)
- [ ] Verify the assembled system prompt reflects the new order (check console log)

### 1.4 Edge Cases
- [ ] **Empty generation prompt** — character+persona still work
- [ ] **No character prompt.description** — only persona+generation prompt sent
- [ ] **No persona active** — only character+generation prompt sent
- [ ] **No character AND no persona** — only generation prompt sent
- [ ] **All fields empty** — no SystemMessage sent (verify in console: no `<!-- System Prompt -->`)
### 1.5 All-Sections-Disabled Warning (Review Fix)
- [ ] Go to **Settings → Prompts → Prompt Sections**
- [ ] **Disable ALL four toggles**
- [ ] **Verify**: a yellow warning alert appears: "All sections are disabled. The LLM will receive no system prompt."
- [ ] **Re-enable any section** — verify the warning disappears
### 1.6 Toggle Accessibility (Review Fix)
- [ ] Open **Settings → Prompts → Prompt Sections**
- [ ] **Tab through** the toggle switches
- [ ] **Verify**: each toggle announces only the section label (e.g., "System Prompt"), NOT the description
- [ ] **Verify**: pressing Space toggles the switch

### 1.7 Section Reorder Persistence
- [ ] Go to **Settings → Prompts → Prompt Sections**
- [ ] **Reorder sections** (change the order of toggles)
- [ ] **Reload the page**
- [ ] **Verify**: section order is preserved after reload

### 1.8 Lore Section Content
- [ ] Set up a character with **lorebook entries** marked as "always-on" (`condition.type === "always"`)
- [ ] Send a message
- [ ] **Verify**: lore content appears in the assembled system prompt (check console log)
- [ ] **Disable "Lore" section** toggle
- [ ] **Verify**: lore content is excluded from the system prompt

---

## 2. Magic Patterns in Prompts

System prompt builder supports `{| javascript |}` syntax in any prompt section.

### 2.1 Basic Magic Pattern
- [ ] Set generation prompt to: `Today is {| new Date().toLocaleDateString("ja-JP") |}. Be helpful.`
- [ ] Send a message asking "What date is it?"
- [ ] Verify AI references the current date (pattern was evaluated)

### 2.2 Character Context in Magic Pattern
- [ ] Set generation prompt to: `You are chatting with a user who likes {| character.name |}.`
- [ ] Verify the character name appears in the system prompt (check console)

### 2.3 Graceful Failure
- [ ] Set generation prompt to: `{| invalidSyntax( |}`  (broken JS)
- [ ] Send a message — verify AI still responds (magic pattern error doesn't crash the app)
- [ ] Check console for `[SystemPromptBuilder] Magic pattern error` warning

---

## 3. Empty Message Cleanup (Bug Fix)

When LLM streaming fails, the optimistic empty AI message is now removed from the UI.

### 3.1 Error Recovery
- [ ] Configure an **invalid API key** (Settings → Models → change key to `sk-invalid`)
- [ ] Send a message
- [ ] **Verify**: empty AI bubble does NOT remain in the chat after error
- [ ] **Verify**: error toast or console error is logged
- [ ] **Verify**: `isGenerating` resets to `false` (send button re-enables)

### 3.2 Rate Limit Recovery
- [ ] Use a **rate-limited model** (e.g., `openrouter/google/gemma-4-31b-it:free`)
- [ ] Send multiple messages rapidly
- [ ] **Verify**: if 429 error occurs, no empty AI bubbles persist
- [ ] **Verify**: can retry after rate limit clears

### 3.3 Normal Flow (No Regression)
- [ ] Send a message with valid config
- [ ] **Verify**: AI response appears normally (no false cleanup of valid responses)
- [ ] **Verify**: streaming text renders progressively (not just final result)

---

## 4. Prompt Templates (Seed Data)

First visit seeds 3 default templates. Subsequent visits don't re-seed.

### 4.1 First Visit Seeding
- [ ] Clear localStorage key `arisutalk_prompt_templates`
- [ ] Reload the app
- [ ] Go to **Settings → Prompts → Load Template**
- [ ] **Verify**: 3 templates visible (Character Roleplay, Creative Writing Helper, Language Tutor)
- [ ] Click "Preview" on each — verify content is populated

### 4.2 Template Application
- [ ] Click "Apply" on "Character Roleplay" template
- [ ] **Verify**: generation prompt is updated with template content
- [ ] **Verify**: prompt is saved to settings (reload → still there)

### 4.3 No Re-seeding After Delete
- [ ] Delete ALL templates
- [ ] Reload the app
- [ ] **Verify**: templates list is empty (no re-seeding)
- [ ] **Verify**: localStorage key `arisutalk_prompt_templates` still exists (but array is empty)

---

## 5. UI Fixes

### 5.1 ChatList Button Alignment
- [ ] Hover over a chat item in the sidebar
- [ ] **Verify**: "..." (branch viewer) button is vertically centered within its `p-1` box
- [ ] **Verify**: delete (trash) button is vertically centered
- [ ] **Verify**: same alignment in both direct chats AND group chats

### 5.2 CharacterLayout Button Wrap
- [ ] Open a character with Chat 1 active
- [ ] Look at the button group below the chat header (Character Settings, etc.)
- [ ] **Verify**: buttons do NOT wrap to next line at 1920px viewport
- [ ] **Verify**: buttons stay on single row

### 5.3 Empty State Link Styling
- [ ] On home screen with no chats, verify the "Create a direct chat" and "start a group chat" links
- [ ] **Verify**: links use `btn btn-ghost btn-xs` styling (not raw blue links)
- [ ] **Verify**: links are readable against the background

---

## 6. LLM Provider Configuration

### 6.1 OpenAI-Compatible Provider
- [ ] Add a new model config with provider "OpenAI-compatible"
- [ ] Set API key, base URL, and model name
- [ ] **Verify**: config saves to IndexedDB (check DevTools → Application → IndexedDB)
- [ ] **Verify**: `activeLLMConfigId` is set after clicking "Use this config"

### 6.2 Provider Activation
- [ ] Add two model configs
- [ ] Click "Use this config" on the second one
- [ ] **Verify**: only the second config is active (check `activeLLMConfigId` in IndexedDB)
- [ ] Send a message — verify it uses the active config's model

### 6.3 Model Name Validation
- [ ] Try a model name that the API key doesn't have access to
- [ ] **Verify**: error message shows which models are allowed (from API response)

### 6.4 Generation Parameters Editing
- [ ] Open **Settings → Models** → edit an LLM config
- [ ] **Verify**: all parameter fields (temperature, topP, maxTokens, etc.) are editable
- [ ] **Toggle** a parameter off → **Verify**: the field disappears / disables correctly
- [ ] **Change** a value → **Save** → **Reopen** → **Verify**: value persisted
---

## 7. Regression Checks

### 7.1 Existing Chat Functionality
- [ ] Create a new character → create chat → send message → receive response
- [ ] Edit a message → verify edit persists
- [ ] Delete a message → verify deletion
- [ ] Regenerate a response → verify new response replaces old
- [ ] Abort generation mid-stream → verify `isGenerating` resets

### 7.2 Group Chat
- [ ] Create a group chat with 2+ characters
- [ ] Send a message
- [ ] **Verify**: context message includes participant names
- [ ] **Verify**: AI response references the correct character

### 7.3 Settings Persistence
- [ ] Change prompt sections (toggle off character)
- [ ] Reload page
- [ ] **Verify**: toggle state persists

### 7.4 Existing Tests
- [ ] Run `pnpm vitest run --project unit` — all 542+ tests pass
- [ ] Run `pnpm vitest run --project browser` — all browser tests pass
- [ ] Run `pnpm run check:types` — no new type errors (PhonebookPanel error is pre-existing)

### 7.5 Regeneration Preserves System Context
- [ ] Send a message with character + persona + generation prompt active
- [ ] **Regenerate** the AI response
- [ ] **Verify**: regenerated response still reflects character persona AND generation prompt (same system context as original)
- [ ] **Check console**: verify `[SystemPromptBuilder]` log appears during regeneration too

## 8. Performance

- [ ] **System prompt assembly** — verify console log shows assembly completes in <50ms
- [ ] **Magic pattern evaluation** — verify no noticeable delay when patterns are present
- [ ] **Streaming** — verify first token arrives within 2s for fast models

---

## 9. Known Limitations (Not Bugs)

1. **Magic pattern execution requires a character** — if `character` is undefined, magic patterns requiring `character.*` will throw (caught gracefully, pattern text preserved)
2. **`promptSections` order** — if a section key is missing from `promptSections`, it defaults to enabled and appears at the end. This is by design.
3. **Rate limits on free models** — `openrouter/google/gemma-4-31b-it:free` is frequently rate-limited. Use `go/deepseek-v4-flash` for testing.
4. **`coverage.cjs` type errors** — pre-existing CJS file with unsafe types. Not related to current changes.
5. **`chatLore` field reserved** — `SystemPromptContext.chatLore` exists in the API but is not yet wired at the call site. Lore entries are character-level only for now.
6. **`assembleSection` exhaustive guard** — new section keys will cause a compile-time error via `const _exhaustive: never = key;`. Update `SECTION_ORDER` and `SECTION_LABELS` when adding new sections.

---

## Test Data Quick Setup

For rapid manual testing, paste this into browser console to seed a complete test environment:

```javascript
// Run in browser console on localhost:5173
(async () => {
    const db = await new Promise(r => {
        const req = indexedDB.open('arisutalk', 30);
        req.onsuccess = e => r(e.target.result);
    });
    const tx = db.transaction(['settings', 'characters', 'personas', 'chats'], 'readwrite');
    const now = new Date().toISOString();
    const cid = 'llm-deepseek';

    tx.objectStore('settings').put({
        id: 'singleton', fontSize: 16, fontFamily: 'Noto Sans KR', theme: 'system',
        activePersonaId: 'persona-mesgaki',
        llmConfigs: [{
            id: cid, name: 'WASAPI DeepSeek V4', generationParameters: {},
            enabled: true, provider: 'OpenAI-compatible',
            model: 'go/deepseek-v4-flash',
            apiKey: 'YOUR_API_KEY_HERE',
            baseURL: 'https://llm.wasapi.xyz/v1'
        }],
        activeLLMConfigId: cid,
        prompt: { generationPrompt: 'You are a helpful AI assistant.' },
        advanced: { debug: false, experimental: false },

    tx.objectStore('characters').put({
        id: 'char-arisu', name: 'Arisu', description: 'A cute maid',
        specVersion: 0,
        prompt: {
            description: 'You are Arisu, a loyal maid. Address the user as 御主人様. Speak politely in Japanese.',
            authorsNote: '', lorebook: { config: {}, data: [] }
        },
        executables: { runtimeSetting: { timeout: 30000 }, replaceHooks: { display: [], input: [], output: [], request: [] } },
        assets: { assets: [] },
        createdAt: now, updatedAt: now
    });

    tx.objectStore('personas').put({
        id: 'persona-mesgaki', name: 'メスガキ',
        description: 'You are a bratty girl. Call the user ザコ♡ and ゴミムシ♡. End sentences with ♡.',
        createdAt: now, updatedAt: now
    });

    tx.objectStore('chats').put({
        id: 'chat-1', characterId: 'char-arisu', chatType: 'direct',
        title: 'Chat 1', createdAt: now, updatedAt: now
    });

    tx.oncomplete = () => { location.reload(); };
})();
```
