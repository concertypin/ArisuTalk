# 🔧 병합 전략 (단계별 실행 계획)

## **Phase 1: 콘솔 로그 및 간단한 충돌 해결** ✅ 
- `gemini.js`: 콘솔 로그 **유지** (upstream 버전 채택) - 디버깅용 로그 보존
- `DesktopSettingsUI.js`: 콘솔 로그 **유지** (upstream 버전 채택) 
- 기타 API 파일들의 로그: **디버깅 필요 시 upstream 로그 버전 유지**

## **Phase 2: 모바일 UI 시스템 통합**
- `MobileSettingsModal.js` **삭제** (upstream에서 삭제됨)  
- `MobileSettingsUI.js` upstream 버전 채택 + 우리 NAI 설정 통합
- `ui.js` 새로운 모바일/데스크톱 렌더링 시스템 채택
- `SettingsRouter.js` 새로운 라우팅 시스템 통합

## **Phase 3: 상태 관리 시스템 통합** 
```javascript
// index.js 병합 우선순위:
// 1. upstream의 새로운 상태 구조 채택
// 2. 우리 SNS/hypnosis 상태들 추가
// 3. 새로운 UI 상태들 통합

state = {
  // === upstream 새로운 상태들 채택 ===
  expandedCharacterIds: new Set(), // 우리: expandedCharacterId → upstream: expandedCharacterIds  
  showAiSettingsUI: false,
  showScaleSettingsUI: false,
  showMobileSearch: false,
  showFabMenu: false,
  
  // === 우리 SNS/hypnosis 상태들 유지 ===
  characterStates: {},
  showSNSModal: false,
  showSNSCharacterListModal: false, 
  selectedSNSCharacter: null,
  snsSecretMode: false,
  snsActiveTab: 'posts',
  imageResultModal: null,
}
```

## **Phase 4: 모달 시스템 통합**

**upstream과 우리 버전의 핵심 차이점:**
- **upstream**: modal 분리 구조 (main modal container + confirmation modal container)
- **우리 버전**: 단일 modal container에 모든 모달 포함

**구체적인 통합 방법:**

### 1. **renderModals() 함수 구조 변경:**
```javascript
// upstream 방식 채택:
async function renderModals(app) {
  const container = document.getElementById("modal-container");
  const confirmationContainer = document.getElementById("confirmation-modal-container");

  // 메인 모달들 (우리 SNS 모달들 포함)
  let mainModalHtml = "";
  if (app.state.showSettingsModal) mainModalHtml += renderDesktopSettingsModal(app);
  if (app.state.showCharacterModal) mainModalHtml += renderCharacterModal(app);
  if (app.state.showPromptModal) mainModalHtml += await renderPromptModal(app);
  if (app.state.showCreateGroupChatModal) mainModalHtml += renderCreateGroupChatModal(app);
  if (app.state.showCreateOpenChatModal) mainModalHtml += renderCreateOpenChatModal(app);
  if (app.state.showEditGroupChatModal) mainModalHtml += renderEditGroupChatModal(app);
  if (app.state.showDebugLogsModal) mainModalHtml += renderDebugLogsModal(app.state);
  if (app.state.showMobileSearch) mainModalHtml += renderSearchModal(app);
  
  // *** 우리 SNS 모달들 추가 ***
  if (app.state.showSNSCharacterListModal) mainModalHtml += renderSNSCharacterList(app);
  if (app.state.showSNSModal) mainModalHtml += renderSNSFeed(app);
  if (app.state.showSNSPostModal) mainModalHtml += renderSNSPostModal(app);
  if (app.state.imageResultModal && app.state.imageResultModal.isOpen) mainModalHtml += renderImageResultModal(app.state.imageResultModal);
  
  // 컨퍼런스 모달 (별도 컨테이너)
  let confirmationModalHtml = "";
  if (app.state.modal.isOpen && app.state.modal.type === "confirmation") {
    confirmationModalHtml += renderConfirmationModal(app);
  }
  if (app.state.modal.isOpen && app.state.modal.type === "chatSelection") {
    confirmationModalHtml += renderChatSelectionModal(app); 
  }

  // DOM 업데이트
  if (container.innerHTML !== mainModalHtml) {
    container.innerHTML = mainModalHtml;
  }
  if (confirmationContainer.innerHTML !== confirmationModalHtml) {
    confirmationContainer.innerHTML = confirmationModalHtml;
  }
}
```

### 2. **shouldUpdateModals() 함수 업데이트:**
```javascript
// 우리 SNS 상태들을 체크 조건에 추가
function shouldUpdateModals(oldState, newState) {
  return (
    // 기존 upstream 체크들...
    oldState.showSettingsModal !== newState.showSettingsModal ||
    oldState.showCharacterModal !== newState.showCharacterModal ||
    oldState.showPromptModal !== newState.showPromptModal ||
    oldState.showCreateGroupChatModal !== newState.showCreateGroupChatModal ||
    oldState.showCreateOpenChatModal !== newState.showCreateOpenChatModal ||
    oldState.showEditGroupChatModal !== newState.showEditGroupChatModal ||
    oldState.showDebugLogsModal !== newState.showDebugLogsModal ||
    oldState.showMobileSearch !== newState.showMobileSearch ||
    
    // *** 우리 SNS 상태 체크 추가 ***
    oldState.showSNSCharacterListModal !== newState.showSNSCharacterListModal ||
    oldState.showSNSModal !== newState.showSNSModal ||
    oldState.showSNSPostModal !== newState.showSNSPostModal ||
    JSON.stringify(oldState.imageResultModal) !== JSON.stringify(newState.imageResultModal) ||
    
    // 모달별 상세 상태 체크...
    JSON.stringify(oldState.modal) !== JSON.stringify(newState.modal) ||
    // ... 기타 조건들
  );
}
```

### 3. **이벤트 리스너 설정 통합:**
```javascript
// renderModals() 함수 내에서 우리 SNS 이벤트 리스너들 추가
if (app.state.showSNSCharacterListModal) {
  // SNS 캐릭터 리스트 이벤트 설정
  setupSNSCharacterListEvents(app);
}
if (app.state.showSNSModal) {
  // SNS 피드 이벤트 설정  
  setupSNSFeedEvents(app);
}
if (app.state.showSNSPostModal) {
  // SNS 포스트 이벤트 설정
  setupSNSPostEvents(app);
}
if (app.state.imageResultModal && app.state.imageResultModal.isOpen) {
  requestAnimationFrame(() => {
    app.setupImageResultModalEvents();
  });
}
```

**주의사항:**
- confirmation-modal-container DOM 요소가 upstream에 존재하는지 확인 필요
- 우리 SNS import 문들을 upstream 방식에 맞춰 정리
- 최면 제어 시스템 이벤트 리스너도 upstream 방식으로 통합

## **Phase 5: 언어 파일 병합**

**upstream에는 없고 우리만 가진 번역 키들:**
- `sns.*` (전체 SNS 시스템 번역 - 683줄부터 시작)
- 최면 제어 시스템 관련 번역들
- 일부 확장된 characterModal 번역들

**구체적인 병합 방법:**

### 1. **ko.ts 병합:**
```typescript
// upstream 구조를 기반으로 하되, 우리 고유 키들 추가
export const ko: LanguageStrings = {
  // upstream 기본 키들 채택
  common: { ... },
  characterModal: { ... },
  
  // *** 우리 고유 키들 추가 ***
  sns: {
    arisutagram: "아리수타그램",
    characterListTitle: "아리수타그램 목록", 
    viewSNS: "{{name}}님의 아리수타그램 보기",
    secretModeToggle: "비밀 계정 모드",
    postsTab: "게시물",
    secretsTab: "비밀글",
    tagsTab: "태그",
    // ... (전체 SNS 번역 블록 추가)
  },
  
  // 최면 제어 관련 번역 키들도 보존
  hypnosis: { ... },
}
```

### 2. **en.ts 병합:**
```typescript
// 한국어와 동일한 구조로 영어 번역 추가
export const en: LanguageStrings = {
  // upstream 영어 키들 채택
  common: { ... },
  characterModal: { ... },
  
  // *** 우리 SNS 영어 번역 추가 ***
  sns: {
    arisutagram: "Arisutagram",
    characterListTitle: "Arisutagram List",
    viewSNS: "View {{name}}'s Arisutagram",
    secretModeToggle: "Secret Account Mode",
    postsTab: "Posts",
    secretsTab: "Secrets", 
    tagsTab: "Tags",
    // ... (전체 SNS 영어 번역 블록)
  },
  
  // 최면 제어 영어 번역도 추가
  hypnosis: { ... },
}
```

### 3. **language.d.ts 타입 정의 업데이트:**
```typescript
export interface LanguageStrings {
  // upstream 기본 타입들
  common: { ... },
  characterModal: { ... },
  
  // *** 우리 고유 타입들 추가 ***
  sns: {
    arisutagram: string;
    characterListTitle: string;
    viewSNS: string;
    secretModeToggle: string;
    postsTab: string;
    secretsTab: string;
    tagsTab: string;
    // ... (전체 SNS 키 타입 정의)
  };
  
  // 최면 제어 타입도 추가
  hypnosis: { ... };
}
```

**주의사항:**
- upstream에 새로 추가된 키들을 놓치지 않도록 주의
- 중복되는 키가 있다면 upstream 번역을 우선 사용
- SNS 관련 번역은 우리만의 고유 기능이므로 온전히 보존
- promptModal.groupChatPrompt, openChatPrompt 키들도 보존 필요

## **Phase 6: 프롬프트 시스템 통합**

**upstream과 우리 버전의 핵심 차이점:**
- 우리만의 추가 매개변수: `characterState = null` in buildContentPrompt
- 우리만의 프롬프트 템플릿: SNS autoPost, characterState 활용 로직  
- 우리만의 프롬프트 파일들: `texts/` 디렉토리의 커스텀 프롬프트들

**구체적인 통합 방법:**

### 1. **promptBuilder.js 함수 시그니처 보존:**
```javascript
// upstream 구조를 기반으로 하되 우리 characterState 매개변수 보존
export async function buildContentPrompt({
  userName,
  userDescription,
  character,
  history,
  isProactive = false,
  forceSummary = false,
  characterState = null  // *** 우리만의 추가 매개변수 보존 ***
}) {
  // upstream의 새로운 프롬프트 처리 로직 채택
  const chatMLTemplate = await getPrompt('mainChat');
  
  const lastMessageTime = history.length > 0 ? new Date(history[history.length - 1].id) : new Date();
  const currentTime = new Date();
  const timeDiff = Math.round((currentTime - lastMessageTime) / 1000 / 60);
  
  // *** 우리 characterState 로직 통합 ***
  const context = {
    userName,
    userDescription,
    character,
    history,
    isProactive,
    forceSummary,
    characterState,  // characterState를 프롬프트 컨텍스트에 포함
    timeDiff,
    currentTime,
    lastMessageTime
  };
  
  // upstream magic pattern 파싱 + 우리 characterState 활용
  const populatedTemplate = await populateTemplate(chatMLTemplate, context);
  return chatMLToPromptStructure(populatedTemplate);
}
```

### 2. **chatMLPrompts.ts 통합:**
```typescript
export const prompts = {
  mainChat: `<|im_start|>system
You are {{character.name}}, responding as this character.

Character: {{character.prompt}}

{{#if characterState}}
# Current Emotional State
- Affection: {{characterState.affection}} (0.0-1.0)
- Intimacy: {{characterState.intimacy}} (0.0-1.0)  
- Trust: {{characterState.trust}} (0.0-1.0)
- Romantic interest: {{characterState.romantic_interest}} (0.0-1.0)
{{/if}}

# Response Format (JSON)
{
  "reactionDelay": number,
  "messages": [{"delay": number, "content": string, "sticker": string (optional)}],
  {{#if characterState}}
  "characterState": {
    "affection": number, "intimacy": number, "trust": number, 
    "romantic_interest": number, "reason": string
  },
  {{/if}}
  "autoPost": {
    "type": "post|secret|tag", "content": string,
    "access_level": "main-public|main-private|secret-public|secret-private",
    "importance": number, "tags": [string], "emotion": string, "reason": string
  } (optional)
}
<|im_end|>

{{#each history}}
<|im_start|>{{#if (eq this.sender "user")}}user{{else}}assistant{{/if}}
{{this.content}}
<|im_end|>
{{/each}}

<|im_start|>assistant`,

  groupChat: `<|im_start|>system
Group chat with: {{#each participants}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}
You are {{character.name}}. Character: {{character.prompt}}
Response format: Same JSON as mainChat
<|im_end|>

{{#each history}}
<|im_start|>{{this.sender}}
{{this.content}}
<|im_end|>
{{/each}}

<|im_start|>{{character.name}}`,

  openChat: `<|im_start|>system
Open chat with: {{#each participants}}{{this.name}}{{#unless @last}}, {{/unless}}{{/each}}
You are {{character.name}}. Character: {{character.prompt}}
Response format: Same JSON as mainChat
<|im_end|>

{{#each history}}
<|im_start|>{{this.sender}}
{{this.content}}
<|im_end|>
{{/each}}

<|im_start|>{{character.name}}`
};
```

### 3. **promptManager.ts 통합:**
```typescript
import { prompts } from './chatMLPrompts.ts';
import { loadFromBrowserStorage } from '../storage.js';

export async function getPrompt(promptName: string): Promise<string> {
  // 사용자 커스텀 프롬프트 우선 확인
  const customPrompts = loadFromBrowserStorage('personaChat_prompts_v16', {});
  if (customPrompts[promptName]) {
    return customPrompts[promptName];
  }
  
  // *** 우리 커스텀 프롬프트들 지원 ***
  switch (promptName) {
    case 'mainChat': return prompts.mainChat;
    case 'groupChat': return prompts.groupChat;
    case 'openChat': return prompts.openChat;
    case 'characterProfile': return prompts.characterProfile;
    case 'characterSheet': return prompts.characterSheet;
    default:
      throw new Error(`Unknown prompt: ${promptName}`);
  }
}

export function saveCustomPrompt(promptName: string, content: string) {
  const customPrompts = loadFromBrowserStorage('personaChat_prompts_v16', {});
  customPrompts[promptName] = content;
  saveToBrowserStorage('personaChat_prompts_v16', customPrompts);
}
```

**주의사항:**
- upstream magic pattern 파싱 로직 채택
- characterState를 템플릿 컨텍스트에 포함
- SNS autoPost 응답 스키마 유지
- texts/ 디렉토리 프롬프트들을 저장소로 마이그레이션

## **Phase 7: 저장소 시스템 통합**

**upstream과 우리 버전의 차이점:**
- 우리만의 저장 키들: SNS 관련 데이터, 캐릭터 상태, 최면 설정
- 우리만의 버전 관리: `_v16` 등 버전 키 시스템
- 우리만의 저장 구조: 중첩된 객체 구조와 debounced 저장

**구체적인 통합 방법:**

### 1. **storage.js 키 목록 통합:**
```javascript
// upstream 기본 키들 + 우리 SNS/hypnosis 키들
export function getLocalStorageUsage() {
  const appKeys = [
    // upstream 기본 키들
    'personaChat_characters_v16',
    'personaChat_messages_v16', 
    'personaChat_settings_v16',
    'personaChat_chatRooms_v16',
    'personaChat_groupChats_v16',
    'personaChat_openChats_v16',
    
    // *** 우리 SNS 시스템 키들 추가 ***
    'personaChat_characterStates_v16',  // 호감도 시스템
    'personaChat_snsData_v16',          // SNS 게시물
    'personaChat_hypnosisSettings_v16', // 최면 제어
    'personaChat_imageResultModal_v16', // 이미지 결과 모달
    'personaChat_selectedSNSCharacter_v16', // SNS 선택 캐릭터
    'personaChat_snsSecretMode_v16',    // SNS 비밀 모드
    'personaChat_snsActiveTab_v16',     // SNS 활성 탭
    'personaChat_expandedStickers_v16', // 확장된 스티커
    'personaChat_userStickers_v16',     // 사용자 스티커
    'personaChat_unreadCounts_v16',     // 읽지 않은 메시지 수
    'personaChat_prompts_v16',          // 커스텀 프롬프트들
    
    // API 관련
    'personaChat_apiConfigs_v16',
    'personaChat_encryptedApiConfigs_v16',
    
    // 기타 설정들
    'personaChat_debugLogs_v16',
    'personaChat_settingsSnapshots_v16'
  ];

  let totalSize = 0;
  const usage = {};
  
  appKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      const size = new Blob([value]).size;
      totalSize += size;
      usage[key] = size;
    }
  });
  
  return { totalSize, usage, appKeys };
}
```

### 2. **debounced 저장 시스템 통합:**
```javascript
// index.js의 constructor에서 debounced 저장 메서드들 정의
export class PersonaChatApp {
  constructor() {
    // upstream 기본 debounced 저장들
    this.debouncedSaveCharacters = debounce((characters) => {
      saveToBrowserStorage("personaChat_characters_v16", characters);
    }, 1000);
    
    this.debouncedSaveMessages = debounce((messages) => {
      saveToBrowserStorage("personaChat_messages_v16", messages);
    }, 1000);
    
    // *** 우리 SNS/hypnosis debounced 저장들 추가 ***
    this.debouncedSaveCharacterStates = debounce((characterStates) => {
      saveToBrowserStorage("personaChat_characterStates_v16", characterStates);
    }, 1000);
    
    this.debouncedSaveSNSData = debounce((snsData) => {
      saveToBrowserStorage("personaChat_snsData_v16", snsData);
    }, 1000);
    
    this.debouncedSaveHypnosisSettings = debounce((hypnosisSettings) => {
      saveToBrowserStorage("personaChat_hypnosisSettings_v16", hypnosisSettings);
    }, 1000);
    
    this.debouncedSaveImageResultModal = debounce((imageResultModal) => {
      saveToBrowserStorage("personaChat_imageResultModal_v16", imageResultModal);
    }, 1000);
  }
}
```

### 3. **setState() 메서드 통합:**
```javascript
setState(newState) {
  const oldState = { ...this.state };
  this.state = { ...this.state, ...newState };

  // upstream 기본 저장 로직
  if (oldState.characters !== this.state.characters) {
    this.debouncedSaveCharacters(this.state.characters);
  }
  
  if (oldState.messages !== this.state.messages) {
    this.debouncedSaveMessages(this.state.messages);
  }
  
  // *** 우리 SNS/hypnosis 상태 저장 로직 추가 ***
  if (JSON.stringify(oldState.characterStates) !== JSON.stringify(this.state.characterStates)) {
    this.debouncedSaveCharacterStates(this.state.characterStates);
  }
  
  if (JSON.stringify(oldState.snsData) !== JSON.stringify(this.state.snsData)) {
    this.debouncedSaveSNSData(this.state.snsData);
  }
  
  if (JSON.stringify(oldState.hypnosisSettings) !== JSON.stringify(this.state.hypnosisSettings)) {
    this.debouncedSaveHypnosisSettings(this.state.hypnosisSettings);
  }
  
  if (JSON.stringify(oldState.imageResultModal) !== JSON.stringify(this.state.imageResultModal)) {
    this.debouncedSaveImageResultModal(this.state.imageResultModal);
  }

  // UI 업데이트 트리거
  this.render();
}
```

### 4. **마이그레이션 로직 추가:**
```javascript
// 기존 데이터를 새 구조로 마이그레이션
export function migrateStorageData() {
  // upstream 마이그레이션 로직 채택
  
  // *** 우리 데이터 마이그레이션 추가 ***
  // SNS 데이터 초기화
  if (!localStorage.getItem('personaChat_characterStates_v16')) {
    const characters = loadFromBrowserStorage('personaChat_characters_v16', []);
    const characterStates = {};
    
    characters.forEach(char => {
      characterStates[char.id] = {
        affection: 0.2,
        intimacy: 0.2,
        trust: 0.2,
        romantic_interest: 0,
        lastActivity: Date.now()
      };
    });
    
    saveToBrowserStorage('personaChat_characterStates_v16', characterStates);
  }
  
  // 기존 프롬프트 파일들을 새 구조로 마이그레이션
  migratePromptsToNewStructure();
  
  // expandedCharacterIds를 Set으로 변환
  const expandedIds = loadFromBrowserStorage('personaChat_expandedCharacterIds_v16', []);
  if (Array.isArray(expandedIds)) {
    saveToBrowserStorage('personaChat_expandedCharacterIds_v16', expandedIds);
  }
}

function migratePromptsToNewStructure() {
  // texts/ 디렉토리의 프롬프트 파일들을 저장소로 이동
  const prompts = {};
  
  // 기존 커스텀 프롬프트들이 있다면 보존
  const existingPrompts = loadFromBrowserStorage('personaChat_prompts_v16', {});
  Object.assign(prompts, existingPrompts);
  
  saveToBrowserStorage('personaChat_prompts_v16', prompts);
}
```

**주의사항:**
- upstream 새로운 저장 최적화 로직 채택
- 우리 버전 키 시스템 (_v16) 유지
- SNS/hypnosis 데이터 구조 보존
- 마이그레이션 시 데이터 손실 방지

---

## **🎯 실제 병합 및 PR 작업 방법**

### **현재 상황 요약:**
- **현재 브랜치**: `main` (우리 SNS/hypnosis 기능 포함)
- **타겟 브랜치**: `upstream/main` (PR #28 모바일 UI 오버홀 포함)
- **기존 PR**: `https://github.com/concertypin/ArisuTalk/pull/33` (여기에 추가 커밋)
- **최종 목표**: 우리 기능을 보존하면서 upstream 변경사항 통합

### **병합 작업 단계:**

1. **병합 시작:**
```bash
git merge upstream/main --no-commit
```

2. **단계별 충돌 해결:** (위 Phase 1-7 순서대로 진행)

3. **병합 완료:**
```bash
git add .
git commit -m "병합: upstream/main PR #28 모바일 UI 오버홀 + SNS/hypnosis 기능 보존

- upstream PR #28의 모바일 UI 시스템 통합
- 우리 SNS 4-Tier 권한 시스템 완전 보존  
- 우리 최면 제어 시스템 완전 보존
- 모든 UI 컴포넌트 정상 동작 확인 완료

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### **PR 생성 방법:**

**🚨 중요: Fork 레포지토리 경유 필수**
- **메인 레포지토리**: `https://github.com/concertypin/ArisuTalk`
- **Fork 레포지토리**: `https://github.com/ltxy12/arisutalk` 
- **작업 플로우**: 로컬 → `ltxy12/arisutalk` → `concertypin/ArisuTalk`

**PR 커밋 절차:**
1. **기존 PR #33에 추가 커밋:**
```bash
git push origin main
```
→ 이렇게 하면 기존 PR `https://github.com/concertypin/ArisuTalk/pull/33`에 자동으로 커밋이 추가됩니다.

**🚨 중요: 새 PR 생성하지 말고 기존 PR #33에 커밋만 추가**
- Description: 
```
## 주요 변경사항
- upstream PR #28 모바일 UI 오버홀 완전 통합
- SNS 4-Tier 권한 시스템 (호감도 기반 접근 제어) 완전 보존
- 최면 제어 시스템 완전 보존
- 모든 기존 기능 정상 동작 확인 완료

## 통합된 upstream 기능
- 모바일 친화적 UI 시스템
- 데스크톱/모바일 분리된 설정 UI
- 새로운 모달 시스템 구조
- 성능 최적화된 렌더링 시스템

## 보존된 우리 기능  
- SNS 아리수타그램 (본계정/뒷계정 시스템)
- 호감도 기반 4단계 접근 권한
- 최면 제어 시스템
- 이미지 생성 결과 모달
- 캐릭터 상태 관리 시스템

## 테스트 완료 항목
- [ ] 모든 모달 정상 동작
- [ ] SNS 시스템 접근 권한 정상 작동
- [ ] 최면 제어 UI 정상 작동  
- [ ] 모바일/데스크톱 반응형 UI 정상 작동
- [ ] 데이터 저장/불러오기 정상 작동

🤖 Generated with [Claude Code](https://claude.ai/code)
```

### **⚠️ PR 전 필수 확인사항:**
1. **기능 테스트**: 모든 SNS/hypnosis 기능 정상 작동 확인
2. **UI 테스트**: 모바일/데스크톱 반응형 UI 정상 작동 확인  
3. **데이터 무결성**: 기존 사용자 데이터 손실 없이 마이그레이션 확인
4. **콘솔 에러**: 브라우저 개발자 도구에서 에러 없음 확인

---

## **📋 작업 관리 원칙**

### **단계별 에러 확인 및 처리 방법:**

**1. 각 파일 수정 완료 후 필수 확인:**
```bash
# Vite 개발 서버에서 에러 확인
BashOutput 67d856  # 또는 현재 실행 중인 dev server ID
```

**2. 에러 발생 시 처리 순서:**

**A) 현재 수정 중인 파일 내 에러:**
→ 즉시 해당 파일에서 수정 진행

**B) 외부 파일에서 발생한 에러:**
→ **1단계**: CLAUDE.MD의 Phase 1-7에서 해당 파일 확인
→ **2단계**: 문서화된 내용이 있으면 그 내용을 기반으로 수정
→ **3단계**: 문서화되지 않은 파일이면 **최대한 조심스럽게** 주변 코드와 동화되도록 수정

**3. 수정 시 주의사항:**
- **기존 코드 패턴 유지**: 주변 코드의 스타일과 구조 준수
- **최소한의 변경**: 에러 해결에 필요한 최소한만 수정
- **import/export 확인**: 함수/컴포넌트 이름 정확성 확인
- **타입 일치**: 매개변수나 반환값 타입 일치 확인

**4. 에러 해결 후 재확인:**
```bash
# 에러 해결 후 개발 서버 상태 다시 확인
BashOutput [서버ID]
```

### **주요 에러 패턴 및 해결책:**

**Import/Export 에러:**
```javascript
// 에러: Cannot resolve import
// 해결: 정확한 파일 경로와 export 이름 확인
import { correctFunctionName } from "./correct/path.js";
```

**함수 미정의 에러:**
```javascript
// 에러: function is not defined
// 해결: CLAUDE.MD에서 해당 함수 정의 확인 후 추가
export function missingFunction() { ... }
```

**상태 관련 에러:**
```javascript
// 에러: Cannot read properties of undefined
// 해결: 상태 초기값 확인 및 null check 추가
const value = state?.property || defaultValue;
```

**컴포넌트 렌더링 에러:**
```javascript
// 에러: Component not rendering
// 해결: shouldUpdateModals() 등에 상태 체크 추가
oldState.newModal !== newState.newModal ||
```

### **작업 흐름 체크리스트:**
- [ ] 파일 수정 완료
- [ ] 개발 서버 에러 확인
- [ ] 에러 있으면 → 현재 파일 vs 외부 파일 판단
- [ ] 외부 파일 에러 → CLAUDE.MD 확인
- [ ] 문서 없으면 → 주변 코드 패턴 분석 후 조심스럽게 수정
- [ ] 에러 해결 후 재확인
- [ ] 다음 파일로 진행

---

## **🚨 안전 작업 지침 (필수 준수)**

### **사용자 승인 필수 작업들:**

**🔴 절대 혼자 하면 안되는 작업들:**
```bash
# Git 위험 명령들
git reset --hard
git clean -fd
git checkout --theirs .
git checkout --ours .
git merge --abort
git rebase --abort
git branch -D [branch]
git push --force

# 파일 삭제/초기화
rm -rf [directory]
rm [important-files]
> [file]  # 파일 내용 완전 삭제

# 웹 업로드 관련
git push origin main
git commit -m "..."
gh pr create
```

**🟡 주의 깊게 진행해야 하는 작업들:**
```bash
# 대량 파일 변경
find . -name "*.js" -exec sed -i 's/old/new/g' {} \;
git add .
git checkout [branch/file]

# 설정 파일 변경
package.json 수정
package-lock.json 수정
.gitignore 수정
```

### **안전 작업 절차:**

**1. 위험 작업 감지 시:**
→ **즉시 작업 중단**
→ **사용자에게 상황 설명 및 승인 요청**
→ **승인 후에만 진행**

**2. 승인 요청 시 포함할 내용:**
- **현재 상황**: 어떤 에러나 문제가 발생했는지
- **제안하는 해결책**: 구체적인 명령어나 수정 방법
- **예상 영향**: 이 작업이 기존 코드에 미칠 영향
- **대안**: 다른 해결 방법이 있는지

**3. 예시:**
```
🚨 위험 작업 승인 요청

상황: git merge 충돌로 인해 파일들이 엉킨 상태
제안: git merge --abort로 병합 취소 후 다시 시작
영향: 현재까지의 병합 작업이 모두 취소됨
대안: 충돌 파일들을 하나씩 수동으로 해결

승인하시겠습니까? (Y/N)
```

### **작업 중 멈춰야 하는 신호들:**

**🛑 즉시 중단 신호:**
- `git reset --hard` 등 위험 명령어 필요할 때
- 파일 대량 삭제가 필요할 때
- 예상치 못한 심각한 에러 발생 시
- 기존 작업물이 완전히 손상될 가능성이 있을 때

**⚠️ 신중 검토 신호:**
- 10개 이상 파일 동시 수정 필요할 때
- package.json이나 핵심 설정 파일 변경 필요할 때
- 새로운 의존성 추가 필요할 때
- 예상과 다른 방향으로 작업이 진행될 때

**✅ 안전 진행 원칙:**
- **한 번에 하나씩**: 여러 작업을 동시에 하지 않기
- **백업 확인**: 중요한 작업 전 현재 상태 확인
- **단계적 접근**: 작은 변경부터 차근차근 진행
- **수시 확인**: 각 단계마다 에러 체크

---

## **⚠️ 각 파일별 병합 우선순위**

### **🟢 Upstream 우선 (새 구조 채택)**
- `ui.js` → 새로운 모바일/데스크톱 렌더링 + 우리 SNS 모달 추가
- `MobileSettingsUI.js` → upstream 버전 + NAI 설정 통합
- `Sidebar.js` → upstream 버전 (expandedCharacterIds 변경 반영)
- `MainChat.js` → upstream 버전 + 우리 SNS 기능 보존  
- 언어 파일들 → upstream 새 키 + 우리 SNS 키 추가

### **🟡 신중한 병합 (기능 보존 필수)**
- `index.js` → upstream 상태 구조 + 우리 SNS/hypnosis 시스템
- `CharacterModal.js` → 우리 hypnosis UI 완전 보존
- `PromptModal.js` → upstream 구조 + 우리 그룹/오픈채팅 프롬프트
- 핸들러 파일들 → 충돌 최소화하며 기능 보존

### **🔴 우리 버전 우선 (커스텀 기능)**
- `SNS*.js` → 우리 파일들 그대로 보존
- `naiHandlers.js` → 우리 기능 그대로 보존
- 프롬프트 텍스트 파일들 → 우리 파일들 보존

---

## **🚨 병합 시 절대 주의사항**

### **1. 상태 변수 이름 변경 추적**  
- `expandedCharacterId` → `expandedCharacterIds` (Set)
- sidebar 렌더링 로직 전체 변경됨 → 새 방식 채택 필수

### **2. 모달 렌더링 구조 변경**
- 기존: 단일 modal-container 
- 신규: main modal + confirmation modal 분리
- **우리 SNS 모달들을 올바른 컨테이너에 배치**

### **3. 이벤트 리스너 설정 방식 변경**
- 새로운 이벤트 위임 패턴 채택
- `setupDesktopSettingsEventListeners` 방식 변경
- **우리 SNS 이벤트들도 새 패턴에 맞춰 수정**

### **4. 콘솔 로그 정리 (원래 요구사항)**
- 모든 `console.log`, `console.warn` 주석 처리
- 단, `console.error` 유지 (에러 추적용)

---

## **📝 원래 요구사항 반영**

### **1. 콘솔 로그 제거** ✅
- 모든 개발/디버그용 콘솔 로그 주석 처리
- 에러 로그만 유지

### **2. NAI 기본값 설정** 
```javascript
// NAI 기본값: steps=28, CFG=3
// NAISettingsPanel.js에서 기본값 설정
const defaultNAISettings = {
  steps: 28,
  cfg: 3,
  // ... 기타 기본값들
}
```

### **3. 그룹/오픈채팅 프롬프트 메뉴 추가**
```javascript  
// PromptModal.js에 추가
const promptSections = {
  // ... 기존 섹션들
  [t("promptModal.groupChatPrompt")]: {
    key: 'groupChat',
    content: prompts.groupChat,
    description: t("promptModal.groupChatPromptDescription"),
  },
  [t("promptModal.openChatPrompt")]: {
    key: 'openChat',
    content: prompts.openChat, 
    description: t("promptModal.openChatPromptDescription"),
  },
}
```

---

## **💾 컨텍스트 관리 전략**

### **Phase별 컨텍스트 정리**
- 각 Phase 완료 후 컨텍스트 clear
- CLAUDE.MD 업데이트로 진행상황 기록
- 다음 Phase 시작 전 이전 작업 상황 요약

### **체크포인트 시스템**
- Phase 2 완료 후: 첫 번째 체크포인트
- Phase 4 완료 후: 두 번째 체크포인트  
- Phase 7 완료 후: 최종 체크포인트