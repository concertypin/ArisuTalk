# ArisuTalk Phase 3 — 구현 보고서

> 프로젝트: ArisuTalk (Project Kei)
> 기간: 2026-06-30
> 브랜치: `local/merge-pr121` → `kei` (PR #121 병합), `local/phase3-chat-mgmt` (Phase 3)

---

## 1. PR #121 — UI Redesign 병합

### 개요
`kei-dev/redesign` 브랜치를 `kei`에 병합. 4,781줄 추가, 675줄 삭제, 159개 파일 변경.

### 충돌 해결 (61개 파일)
- **설정/CI 파일** (`.github/workflows/ci.yml`, `.vscode/*`, `frontend/AGENTS.md`, `eslint.config.ts`, `tsconfig.base.json`, `vite.config.ts`, `package.json`, `pnpm-lock.yaml`)
  - → `kei` 최신 버전 유지 (keilint, oxlint 등 최신 설정 반영)
- **Svelte 컴포넌트** (`App.svelte`, `ChatArea.svelte`, `SettingsModal.svelte`, `CharacterSidebar.svelte`, `CharacterLayout.svelte` 외 20여개)
  - → `redesign` 버전 채택 (UI 리디자인이 PR의 목적)
- **신규 파일 (add/add 충돌)**
  - `CharacterSettingsModal.svelte`, `CharacterBasicSettings.svelte`, `CharacterHooksSettings.svelte`, `CharacterLorebookSettings.svelte`, `CharacterMetadataSettings.svelte`, `CharacterPromptSettings.svelte`, `CharacterAssetsSettings.svelte`
  - `SNSFeedCard.svelte`, `SNSProfile.svelte`
  - → `redesign` 버전 채택
- **테스트 파일** → `redesign` 버전 채택 (새 컴포넌트 테스트)

### 리뷰 피드백 반영
- `phosphor-svelte` deprecated 아이콘 이름 일괄 수정 (`Gear`→`GearIcon`, `Trash`→`TrashIcon`, `X`→`XIcon` 등 24개 파일, 84개 경고 해결)
- `workerClient.ts` `disabled` getter 버그 수정 (Proxy가 항상 `false` 반환 → 클로저 변수로 실제 상태 추적)
- 스냅샷 태그 고려: `read`/`edit` 명령어 사용 시 태그 일치 확인
- 누락된 `aria-label` 추가 (`ChatList` 삭제 버튼, `CharacterForm` 파일 입력)
- `strictObject` 유틸리티에 Symbol 속성 지원 추가 (Vitest deep-equal 호환)
- `apiClient.ts` 스텁 모듈 생성 (기존 테스트 대응)
- `SvelteMap`/`SvelteDate` 도입 (Svelte 5 reactivity 규칙 준수)

---

## 2. Phase 3: Chat Management (Advanced)

### 2.1 다중 채팅방 타입

**데이터 모델 확장** (`frontend/src/lib/interfaces/IChatStorageAdapter.ts`)
```typescript
export type ChatType = "direct" | "group" | "open";

export type LocalChat = Chat & {
    chatType?: ChatType;           // "direct" 기본값
    participantIds?: string[];     // 그룹챗 참가자
    creatorId?: string;            // 생성자
    branchRootId?: string;         // 브랜치 루트
    affection?: AffectionState[];   // 호감도 상태
};
```

**저장소 확장** (`IDBChatAdapter.ts`)
- `createChat()`: `chatType`, `participantIds` 옵셔널 파라미터 추가
- `getChatsByCharacter()`: `participantIds` 배열도 검색
- `getChatsByParticipant()`: 신규 메서드
- `updateChat()`: 신규 메서드 — 채팅 메타데이터 업데이트

**ChatStore 확장** (`chatStore.svelte.ts`)
- `createGroupChat(characterIds, name?)`: 여러 캐릭터로 그룹챗 생성
- `createOpenChat(characterId, title?)`: AI 관리 오픈챗 생성
- `addParticipant(chatId, characterId)` / `removeParticipant(chatId, characterId)`
- `branchChat(fromMessageId)`: 메시지에서 브랜치 채팅 생성
- `getBranches(chatId)`: 브랜치 목록 조회
- `updateAffection(characterId, value)` / `getAffection(characterId)`

### 2.2 Group Chat UI

**GroupChatManager.svelte** (신규)
- 캐릭터 선택 그리드 (체크박스)
- 참가자 아바타 목록
- 최소 2명 선택 시 생성 가능

**ChatList.svelte** (수정)
- 채팅 타입별 아이콘: `ChatTeardropTextIcon`(direct) / `UsersIcon`(group) / `GlobeIcon`(open)
- 그룹챗 참가자 수 배지
- Direct Chats / Group Chats 섹션 분리

### 2.3 Chat Branching

**BranchViewer.svelte** (신규)
- 메시지 트리 시각화
- 브랜치 탐색 및 이동
- 선택 메시지에서 브랜치 생성
- 깊이(depth) 기반 들여쓰기
- `countDepth()` 함수로 브랜치 깊이 계산

### 2.4 Affection/Hypnosis System

```typescript
export type AffectionState = {
    characterId: string;
    value: number;           // 0-100 또는 -100-100
    lastUpdated: number;     // Unix timestamp
    notes?: string;
};
```

---

## 3. Phase 3: Visuals

### 3.1 스티커 시스템
> [!NOTE]
> NovelAI 대신, generated나 inline 등의 중립적인 네이밍
**데이터 모델** (`frontend/src/lib/types/sticker.ts`)
```typescript
export type Sticker = {
    id: string;
    name: string;
    emoji?: string;
    imageUrl?: string;
    source: "emoji" | "upload" | "novelai";
    data?: string;           // base64 이미지 데이터
};

export type StickerPack = {
    id: string;
    name: string;
    description: string;
    stickers: Sticker[];
    createdAt: Date;
    updatedAt: Date;
};
```

**저장소** (`IDBStickerAdapter.ts`)
- Dexie 기반 IndexedDB 저장
- DB 테이블: `stickers`
- `StickerPack` 단위 CRUD + 개별 스티커 추가/제거

**StickerPicker.svelte** (신규)
- 탭 0: 이모지 선택기 (200+ 이모지, 5개 카테고리)
- 탭 1+: 스티커 팩별 탭
- 검색 기능 (이름/이모지 검색)
- `onSelect: (sticker: Sticker & { packId?: string }) => void`

**StickerPackManager.svelte** (신규)
- 팩 목록 사이드바
- 팩 생성/수정/삭제
- 이모지를 스티커로 임포트
- 커스텀 이미지 업로드 (FileReader → base64)
- 스티커 순서 변경

**ChatArea 연동**
- 입력창 옆 스티커 버튼 (`StickerIcon`)
- 선택한 이모지 → 입력창에 추가
- 선택한 스티커 → `[스티커이름]` 텍스트로 표시

### 3.2 NovelAI 이미지 생성

**NovelAIService.ts** (신규)
- `generateImage(prompt, settings)`: NovelAI REST API 호출
- `NovelAISettings`: { apiKey, model, width, height, scale, steps }
- 반환: `Promise<Blob>`

**NovelAIGenerator.svelte** (신규)
- 프롬프트 입력 (textarea)
- 설정 패널: API 키, 모델 선택, 해상도(width/height), scale, steps 슬라이더
- 생성 버튼 + 로딩 스피너
- 이미지 미리보기
- "스티커 팩에 저장" 버튼

**novelaiStore.svelte.ts** (신규)
- `$state`: config, isGenerating, generatedImage, previewUrl, error
- reactive `previewUrl` (Blob → Object URL 자동 변환)

---

## 4. Phase 3: Advanced Prompting

### 4.1 캐릭터 메모리 시스템

> [!NOTE]
> 메모리 시스템을 1급 시민으로 다루는 대신 플러그인으로 분리해서 커스텀 가능하게(지금 있는 건 퍼스트파티 플러그인으로 취급)

**데이터 모델** (`frontend/src/lib/types/memory.ts`)
```typescript
export type MemoryEntry = {
    id: string;
    characterId: string;
    content: string;
    type: "fact" | "conversation" | "summary";
    timestamp: number;
    importance: number;      // 0.0 ~ 1.0
    lastAccessed: number;
};
```

**저장소** (`IDBMemoryAdapter.ts`)
- Dexie 기반 IndexedDB
- 테이블: `memories` (`characterId` 인덱싱)

**MemoryManager.svelte** (신규)
- 캐릭터별 메모리 조회/편집
- 수동 사실(Fact) 추가
- 최근 대화 메모리 표시
- 중요도 기반 정렬

### 4.2 Magic Pattern 시스템

**magicPatternParser.ts** (완전 재구현)
- 기존: QuickJS 통합 안 된 플레이스홀더 (입력값 그대로 반환)
- 변경: Scripting Worker(`getScriptingWorker()`) 사용한 실제 실행

**패턴 형식**: `{| javascript code |}`

**구현 방식**:
```typescript
// 패턴 추출 → Worker 실행 → 결과 치환
const PATTERN_REGEX = /\{\|[\s\S]*?\|\}/g;
const worker = await getScriptingWorker();
const result = await worker.evaluateJavaScript(code, {
    character, persona, chat: (a, b) => messages
});
```

**제공 컨텍스트**:
- `character.name`, `character.description`
- `persona.name`
- `chat(a, b)`: 메시지 히스토리 조회 (a=시작 인덱스, b=끝 인덱스)

**테스트 검증**: `"Hello {| return character.name |}!"` → `"Hello Test Character!"`

### 4.3 프롬프트 템플릿 관리

**데이터 모델** (`frontend/src/lib/types/promptTemplate.ts`)
```typescript
export type PromptTemplate = {
    id: string;
    name: string;
    description: string;
    prompts: {
        system: string;
        generation: string;
        lore?: string;
    };
    createdAt: number;
    updatedAt: number;
};
```

**PromptTemplateManager.svelte** (신규)
- 템플릿 목록 (localStorage 기반)
- 생성/편집/삭제
- 프롬프트 미리보기
- "Load Template" 버튼 → 캐릭터 설정에 적용

**연동**
- `CharacterPromptSettings.svelte` — Load Template 버튼 추가
- `PromptSettings.svelte` — 글로벌 프롬프트 템플릿 적용

---

## 5. Phase 3: Settings Expansion

### 5.1 Grok (xAI) Provider

**추가된 파일**: `frontend/src/lib/providers/chat/GrokChatProvider.ts`

**변경사항**:
- `IDataModel.ts`: `LLMProviderSchema`에 `"Grok"` 추가, `GrokLLMConfigSchema` 추가
- `chatStore.svelte.ts`: `applyConfig()`에 Grok 케이스 추가, `setProvider()`에 GROK 케이스 추가
- `GenerationParameters.svelte`: provider select에 `<option value="Grok">` 추가

**GrokChatProvider**
- `@langchain/openai` 기반 (xAI API는 OpenAI 호환)
- 기본 모델: `grok-3-mini`
- 기본 URL: `https://api.x.ai/v1`

### 5.2 기존 설정 UI 현황
- `LLMGenerationParametersSchema`: temperature, topP, topK, frequencyPenalty, presencePenalty, maxInputTokens, maxOutputTokens, thinkingLevel
- 지원 provider: OpenAI, OpenAI-compatible, Anthropic, Gemini, OpenRouter, Grok, Mock
- 각 provider별 config 스키마 (`OpenAILLMConfigSchema`, `GeminiLLMConfigSchema` 등)

---

## 6. Phase 3: Subservices

### 6.1 Clerk 인증 (Optional Auth)

**auth.ts** (신규)
- publishable key 환경변수에서 로드
- ClerkProvider를 통한 인증 상태 관리

**AuthGate.svelte** (신규)
- 선택적 인증 — 핵심 기능은 로그인 없이 작동
- Clerk 로드 실패 시 조용히 children만 렌더링
- 브라우저 테스트 환경에서도 정상 작동

### 6.2 Phonebook Community & Backend API

Phonebook은 캐릭터 공유 플랫폼(character sharing)이다. 데이터 동기화(sync) 기능이 아니며,
사용자가 캐릭터 카드를 업로드/검색/다운로드할 수 있는 커뮤니티 기능이다.

**phonebookStore.svelte.ts** (신규)
- `connect()`, `disconnect()`: Phonebook 백엔드 연결 관리
- `publishCharacter(character)`: 캐릭터를 Phonebook에 업로드
- `fetchFeatured()`: 추천 캐릭터 목록 조회
- `search(query)`: 캐릭터 검색
- `importCharacter(entryId)`: Phonebook에서 캐릭터 다운로드 후 로컬에 추가

**PhonebookPanel.svelte** (신규)
- 연결 상태 뱃지
- Connect/Disconnect 버튼
- 캐릭터 선택 → Publish to Phonebook
- 검색 바 → 결과 목록 → Import 버튼

**API Client** (`client.ts` — 스텁에서 실제 구현으로 교체)
- `request<T>(method, path, options?)`: 저수준 요청 헬퍼
- `get`, `post`, `patch`, `del`: HTTP 메서드 숏핸드
- `getRaw`, `uploadBlob`: 파일 다운로드/업로드
- `setTokenProvider()`: Clerk JWT 주입
- `ApiResponse<T>` discriminated union: `{ ok: true, data } | { ok: false, error }`

### 6.3 Backend API 연동

`frontend/src/lib/services/subservice.ts` (신규)
- `checkHealth()`: GET / — 백엔드 연결 확인
- `getUserProfile()` / `updateUserProfile()`: 사용자 프로필 (placeholder)
## 7. 검증

| 검증 항목                    | 결과                                        |
| ---------------------------- | ------------------------------------------- |
| ESLint (`oxlint` + `eslint`) | 0 에러, 0 경고                              |
| **Unit Tests**               | **53개 파일, 501개 테스트 통과**            |
| **Browser Tests**            | **29개 파일, 154개 테스트 통과**            |
| **전체**                     | **82개 파일, 650+ 테스트, 0 실패**          |
| Prettier 포매팅              | 전체 코드베이스 정상                        |
| Dev Server                   | `localhost:5173` 정상 기동                  |
| 브라우저 자동 오픈           | `vite.config.ts` → `open: false`로 비활성화 |

### 서브에이전트 리뷰 결과
- 발견된 P1 이슈 1건: `activeConfigId` 필드 미선언 → `$state(null)`로 수정
- P2 이슈 5건: 아이콘 명명 규칙, 누락된 `{@each}` 키, async 오류 처리 누락 → 전부 수정
- P3 이슈 2건: 누락된 JSDoc — 우선순위 낮음

---

## 8. 파일 목록

### 생성된 파일 (~30개)
```
frontend/src/
├── lib/
│   ├── types/
│   │   ├── sticker.ts              # Sticker, StickerPack
│   │   ├── memory.ts               # MemoryEntry
│   │   └── promptTemplate.ts       # PromptTemplate
│   ├── interfaces/
│   │   ├── IStickerStorageAdapter.ts
│   │   ├── IMemoryStorageAdapter.ts
│   │   └── IPromptTemplateStorageAdapter.ts
│   ├── adapters/storage/
│   │   ├── sticker/IDBStickerAdapter.ts
│   │   ├── memory/IDBMemoryAdapter.ts
│   │   └── promptTemplate/LocalStoragePromptTemplateAdapter.ts
│   ├── services/
│   │   ├── auth.ts                 # Clerk 인증 서비스
│   │   ├── subservice.ts           # 백엔드 API 서비스
│   │   └── NovelAIService.ts       # NovelAI API
│   ├── api/client.ts               # API 클라이언트 (재작성)
│   └── providers/chat/GrokChatProvider.ts
├── features/
│   ├── sticker/
│   │   ├── stores/stickerStore.svelte.ts
│   │   └── components/{StickerPicker,StickerPackManager}.svelte
│   ├── novelai/
│   │   ├── stores/novelaiStore.svelte.ts
│   │   └── components/NovelAIGenerator.svelte
│   ├── memory/
│   │   ├── stores/memoryStore.svelte.ts
│   │   └── components/MemoryManager.svelte
│   ├── promptTemplate/
│   │   ├── stores/promptTemplateStore.svelte.ts
│   │   └── components/PromptTemplateManager.svelte
│   ├── auth/
│   │   └── components/AuthGate.svelte
│   ├── cloud/
│   │   ├── stores/cloudStore.svelte.ts
│   │   └── components/CloudSettings.svelte
│   └── chat/
│       ├── components/{GroupChatManager,BranchViewer}.svelte
│       └── stores/chatStore.svelte.ts (확장)
└── components/
    └── ChatArea.svelte (스티커 연동)
```

### 수정된 파일 (~15개)
```
frontend/src/
├── lib/
│   ├── types/IDataModel.ts (Grok provider 추가)
│   ├── interfaces/IChatStorageAdapter.ts (ChatType, AffectionState 등)
│   ├── interfaces/index.ts (새 인터페이스 익스포트)
│   ├── adapters/storage/chat/IDBChatAdapter.ts (확장)
│   ├── adapters/storage/IndexedDBHelper.ts (새 테이블 등록)
│   └── parsers/magicPatternParser.ts (실제 구현으로 교체)
├── features/
│   ├── chat/stores/chatStore.svelte.ts (그룹챗, 브랜치, Affection)
│   ├── chat/components/ChatList.svelte (타입별 아이콘/필터)
│   └── character/components/CharacterSettingsModal.svelte (Magic Pattern 탭)
├── components/ChatArea.svelte (스티커 버튼)
├── App.svelte (AuthGate 통합)
└── vite-env.d.ts (환경변수 타입 확장)
```
