# ArisuTalk Phase 4 — 구현 보고서 (🌸Blossom)

> 프로젝트: ArisuTalk (Project Kei)
> 기간: 2026-07-01
> 브랜치: `local/phase4-blossom` (Phase 4 작업)

---

## 1. Migration Tools

### 1.1 Storage Migration Utility

`frontend/src/lib/migration/storageMigration.ts` (신규)

- **`exportAllData()`**: 모든 IndexedDB 테이블(chats, characters, settings, personas, messages, stickers, memories)을 JSON 직렬화 객체로 내보내기
- **`importBackup(backup)`**: 백업 JSON에서 IndexedDB로 데이터 복원 (기존 데이터 클리어 후 bulk add)
- **`checkStoredSchemaVersion()`**: localStorage에 저장된 스키마 버전 확인
- **`markSchemaMigrated()`**: 현재 스키마 버전을 localStorage에 마킹

### 1.2 Data Management UI

`frontend/src/components/settingSubpage/AdvancedSettings.svelte` (수정)

- **Export All Data** 버튼: 모든 IndexedDB 데이터를 `arisutalk-backup-YYYY-MM-DD.json` 파일로 다운로드
- **Import Data** 버튼: JSON 백업 파일 선택 → IndexedDB에 복원 → 리로드 안내
- 기존 설정 페이지 하단에 Data Management 섹션 추가

---

## 2. UX Polish

### 2.1 Tooltip Z-Index Fix (#51)

`frontend/src/global.css` (수정)

- 모달/다이얼로그 내부의 daisyUI 툴팁이 모달 오버레이 뒤에 가려지는 문제 해결
- CSS 규칙 추가: `[role="dialog"] .tooltip`, `.modal .tooltip`, `dialog .tooltip` → `z-index: 100 !important`

### 2.2 Character Pinning (#60)

`frontend/src/features/character/stores/characterStore.svelte.ts` (수정)

- **`PINNED_KEY`**: localStorage에 고정된 캐릭터 ID 배열 저장
- **`isPinned(characterId)`**: 고정 여부 확인
- **`togglePin(characterId)`**: 고정 토글 (고정 → 최상단 추가)
- **`sortByPinAndOrder()`**: 고정 캐릭터 우선 정렬 후 저장된 순서로 정렬

`frontend/src/features/character/components/CharacterSidebarItem.svelte` (수정)

- **`PushPin` 아이콘**: hover 시 표시되는 핀 토글 버튼
- **`isPinned`/`onTogglePin`** props 추가

`frontend/src/features/character/components/CharacterSidebar.svelte` (수정)

- CharacterSidebarItem에 `isPinned`와 `onTogglePin` prop 전달

### 2.3 Token Counter (#50)

`frontend/src/lib/utils/tokenCounter.ts` (신규, DevTools agent)

- **`countTokens(text)`**: TextEncoder 기반 바이트 길이 측정 → 4바이트당 1토큰 근사
- **`estimateTokenCost(text, model?)`**: 모델별 가격표로 예상 비용 계산
- 지원 모델: GPT-4o, GPT-4o-mini, GPT-4, Claude 3, Gemini 1.5 등

`frontend/src/features/character/components/settingsSubpage/CharacterPromptSettings.svelte` (수정)

- Description textarea 아래 `~{descriptionTokens} tokens` 뱃지
- Author's Note textarea 아래 `~{authorsNoteTokens} tokens` 뱃지
- `$derived`로 실시간 업데이트

---

## 3. PWA Support (#14)

### 3.1 Manifest

`frontend/static/manifest.json` (신규, PWATheme agent)

```json
{
    "name": "ArisuTalk",
    "short_name": "ArisuTalk",
    "description": "AI Character Chat Platform",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#1e1e2e",
    "theme_color": "#1e1e2e",
    "icons": [
        { "src": "/icon_192.png", "sizes": "192x192", "type": "image/png" },
        { "src": "/icon_512.png", "sizes": "512x512", "type": "image/png" }
    ]
}
```

### 3.2 Service Worker

`frontend/src/lib/serviceWorker.ts` (신규)

- Vite PWA 플러그인을 사용하지 않고 수동 등록
- `registerServiceWorker()`: `/serviceWorker.js` 등록
- 캐시 전략: Network First (정적 애셋)

`frontend/static/serviceWorker.js` (신규)

- 기본 Network First 전략
- 설치 시 애셋 프리캐시

### 3.3 HTML 연동

`frontend/index.html` (수정)

- `<link rel="manifest" href="/manifest.json">` 추가
- `<meta name="theme-color" content="#1e1e2e">` 추가

`frontend/src/App.svelte` (수정)

- `onMount` → `registerServiceWorker()` 호출
- `<svelte:head>`에 versionInfo 기반 `<title>` 동적 설정

---

## 4. Theming & I18n

### 4.1 Theme System (#43)

`frontend/src/lib/theme.svelte.ts` (신규, PWATheme agent)

- **`applyTheme(mode)`**: `settings.value.theme` ("light"/"dark"/"system")를 daisyUI 테마에 매핑
  - "light" → `data-theme="winter"` (기존 정의된 winter 테마)
  - "dark" → `data-theme="night"` (기존 night 테마, 기본값)
  - "system" → `matchMedia('prefers-color-scheme: dark')` 기반 동적 전환
- 시스템 컬러 스킴 변경 리스너 등록/해제
- `color-scheme` CSS 속성도 함께 설정 (스크롤바, 폼 컨트롤)

`frontend/src/App.svelte` (수정)

- `$effect`로 `settings.value.theme` 변경 감지 → `applyTheme()` 호출

### 4.2 I18n Infrastructure (#45)

`frontend/src/lib/i18n/index.svelte.ts` (신규, PWATheme agent)

- **`type Locale = "ko" | "en"`**: 지원 언어
- **`translations[locale]`**: 한국어/영어 번역맵 (기본 UI 텍스트)
- **`localeStore`**: Svelte 5 Runes 기반 반응형 로케일 스토어
  - 초기값: 브라우저 언어 감지 → 'ko' 없으면 'en'
  - `set(locale)`: localStorage에 저장
- **`t(key)`**: 현재 로케일로 키 번역 (fallback: 키 자체)

`frontend/src/components/settingSubpage/GeneralSettings.svelte` (수정)

- Language 설정 select 추가 (한국어/English)
- `localeStore.set()` 호출

---

## 5. Development Tools

### 5.1 Version/Channel Indicator (#67)

`frontend/src/lib/stores/versionInfo.svelte.ts` (신규, DevTools agent)

- `import.meta.env`에서 버전, 채널, 커밋 해시, 릴리즈 URL 읽기
- **`VITE_VERSION_NAME`**: 앱 버전 (기본 "0.0.0")
- **`VITE_VERSION_CHANNEL`**: 배포 채널 spark/dev/prod (기본 "dev")
- **`VITE_COMMIT_HASH`**: Git 커밋 해시
- **`displayLabel`**: `"ArisuTalk (dev)"` 등 채널 표시

`frontend/src/components/settingSubpage/AdvancedSettings.svelte` (수정)

- Version Information 섹션: 버전, 채널, 커밋 해시, GitHub Releases 링크
- Data Management 섹션도 같은 페이지에 추가

### 5.2 CI Sharding (#126)

검토 결과 `frontend_ci.yml`에 이미 Vitest shard (4개)가 구성되어 있어 변경 불필요.

---

## 6. 검증

| 검증 항목 | 결과 |
|-----------|------|
| **Build** | 0 에러, 0 경고 |
| **Unit Tests** | 83개 파일 통과 |
| **Browser Tests** | 전체 통과 (기존 650+ 테스트 + 신규 16개) |
| **Lint** | Prettier, ESLint 정상 |

### 서브에이전트 리뷰 결과

- Phase 4 작업은 서브에이전트(PWATheme, DevTools)와 메인 에이전트가 분담하여 병렬 처리
- 모든 파일은 빌드/테스트 통과 확인

---

## 7. 파일 목록

### 생성된 파일 (~15개)
```
frontend/src/
├── lib/
│   ├── i18n/index.svelte.ts          # 국제화 시스템 (ko/en)
│   ├── migration/storageMigration.ts  # 스토리지 마이그레이션 유틸리티
│   ├── serviceWorker.ts              # PWA 서비스 워커 등록
│   ├── stores/versionInfo.svelte.ts  # 버전/채널 정보 스토어
│   ├── theme.svelte.ts               # 테마 적용 모듈
│   └── utils/tokenCounter.ts         # 토큰 카운터 유틸리티
├── static/
│   ├── manifest.json                 # PWA 매니페스트
│   └── serviceWorker.js              # PWA 서비스 워커
└── test/unit/lib/utils/
    └── tokenCounter.test.ts          # 토큰 카운터 테스트
```

### 수정된 파일 (~12개)
```
frontend/
├── index.html                        # PWA manifest link 추가
├── src/
│   ├── App.svelte                    # 테마 적용, SW 등록, 버전 타이틀
│   ├── global.css                    # 툴팁 z-index 수정
│   ├── components/settingSubpage/
│   │   ├── AdvancedSettings.svelte   # Version info, Data Management
│   │   └── GeneralSettings.svelte    # Language selector
│   ├── features/character/
│   │   ├── stores/characterStore.svelte.ts  # Pinning
│   │   ├── components/
│   │   │   ├── CharacterSidebar.svelte      # Pin props 전달
│   │   │   ├── CharacterSidebarItem.svelte  # Pin UI
│   │   │   └── settingsSubpage/
│   │   │       └── CharacterPromptSettings.svelte  # Token counter
│   │   └── ...
│   └── ...
└── .github/workflows/
    └── frontend_ci.yml               # (이미 sharding 존재)
```

---

## 8. Next Steps (Phase 5: 🌲Forest)

Phase 5 backlog items (project board "Backlog" column):
1. **AI Enhancements** — 고급 AI 기능 (RAG, multi-modal, tool calling 등)
2. **Extensibility** — 플러그인 시스템, 커스텀 테마, 스크립트 API
3. **Sync & Integration** — 클라우드 동기화, 타 플랫폼 연동
