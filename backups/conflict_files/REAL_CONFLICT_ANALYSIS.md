# 실제 충돌 지점 분석 보고서

## 🔍 충돌 원인 상세 분석

### **1. 핵심 충돌: expandedCharacterIds vs expandedCharacterId**

**upstream/main (PR #28)**:
```javascript
// Set 기반 복수 선택
expandedCharacterIds: new Set(),

// Set 기반 토글 로직
toggleCharacterExpansion(characterId) {
  const newExpandedIds = new Set(this.state.expandedCharacterIds);
  if (newExpandedIds.has(numericCharacterId)) {
    newExpandedIds.delete(numericCharacterId);
  } else {
    newExpandedIds.add(numericCharacterId);
  }
  this.setState({ expandedCharacterIds: newExpandedIds });
}
```

**우리 브랜치**:
```javascript
// 단일 선택
expandedCharacterId: null,

// 단일 토글 로직
toggleCharacterExpansion(characterId) {
  const newExpandedId = this.state.expandedCharacterId === numericCharacterId ? null : numericCharacterId;
  this.setState({ expandedCharacterId: newExpandedId });
}
```

**충돌 원인**: 완전히 다른 상태 관리 방식 (Set vs null/number)

---

### **2. import 경로 변경 충돌**

**upstream/main**:
```javascript
import { renderSnapshotList } from "./components/MobileSettingsUI.js";
import { renderProviderConfig } from "./components/MobileSettingsUI.js";
```

**우리 브랜치**:
```javascript
// MobileSettingsUI.js가 아닌 MobileSettingsModal.js에서 import
import { renderProviderConfig, setupAdvancedSettingsEventListeners } from "./components/MobileSettingsModal.js";
```

**충돌 원인**: PR #28에서 모바일 설정 구조 변경 (Modal → UI)

---

### **3. 상태 필드 추가/삭제 충돌**

**upstream/main에서 추가된 필드들**:
```javascript
showSettingsUI: false,
createGroupChatName: "",
createGroupChatScrollTop: 0,
showMobileSearch: false,
showFabMenu: false,
currentMessage: "",
```

**우리 브랜치에서 추가한 필드들**:
```javascript
stickerManager: null,
snsModals: { character: null, tab: 'posts', isOpen: false },
characterStates: {},  // 호감도 시스템
// + 다양한 SNS/NAI 관련 상태들
```

**충돌 원인**: 양쪽에서 서로 다른 기능을 위해 상태 필드 추가

---

### **4. 이벤트 핸들러 구조 변경**

**upstream/main**:
```javascript
// 이벤트 위임 패턴 도입
// MobileSettingsUI.js에서 클린한 이벤트 처리
```

**우리 브랜치**:
```javascript
// 직접 핸들러 바인딩
// modalHandlers.js에서 handleModalChange, handleModalInput 함수
import { handleModalChange, handleModalInput } from "../handlers/modalHandlers.js";
```

**충돌 원인**: PR #28에서 이벤트 처리 방식 개선, 우리는 기존 방식 유지

---

### **5. UI 렌더링 함수 변경**

**upstream/main**:
```javascript
// adjustMessageContainerPadding 함수 제거
import { render } from "./ui.js";
```

**우리 브랜치**:
```javascript
// 여전히 adjustMessageContainerPadding 사용
import { render, adjustMessageContainerPadding } from "./ui.js";
```

**충돌 원인**: UI 최적화 과정에서 일부 함수 제거/변경

---

### **6. 새로운 컴포넌트/서비스 추가 충돌**

**우리 브랜치 전용 추가사항들**:
```javascript
// 새로운 import들
import { setupNAIHandlers, handleAutoStickerGeneration } from "./handlers/naiHandlers.js";
import { snsMethods, handleSNSInput } from "./handlers/snsHandlers.js";
import { StickerManager } from "./services/stickerManager.js";
import { renderNAISettingsPanel } from "./settings/panels/NAISettingsPanel.js";
```

**충돌 원인**: upstream에 없는 완전히 새로운 기능들

---

## 📊 충돌 발생 파일별 정리

| 파일명 | 충돌 유형 | 주요 충돌 내용 |
|--------|-----------|----------------|
| `index.js` | 상태관리, import 경로 | expandedCharacterIds 차이, MobileSettingsModal vs UI |
| `DesktopSettingsUI.js` | import, 이벤트핸들러 | modalHandlers import 충돌, NAI 패널 추가 |
| `ui.js` | 함수 삭제, 상태 참조 | adjustMessageContainerPadding 제거, expandedCharacterIds 참조 |
| `components/MainChat.js` | 컴포넌트 구조 | 스티커 시스템, SNS 기능 추가 vs upstream 구조 변경 |
| `handlers/modalHandlers.js` | 이벤트 처리 | upstream 이벤트 위임 vs 우리 직접 핸들러 |

## 🎯 복구 전략

### Phase 1: 핵심 상태 시스템 통합
1. **expandedCharacterIds Set 방식 채택** (upstream 우선)
2. **우리 커스텀 상태들은 추가로 보존** (snsModals, characterStates 등)

### Phase 2: import 경로 정리
1. **upstream 경로 구조 채택**
2. **우리 커스텀 컴포넌트들은 새 구조에 맞게 위치 조정**

### Phase 3: 이벤트 시스템 통합
1. **upstream 이벤트 위임 패턴 채택**
2. **우리 커스텀 이벤트들은 위임 구조에 맞게 재구성**

### Phase 4: UI 시스템 통합
1. **upstream UI 최적화 수용**
2. **우리 SNS/NAI UI는 새 구조에 맞게 적용**

## 🚨 주의사항

1. **절대 삭제 금지**: SNS, NAI, 최면 시스템 관련 모든 코드
2. **우선순위**: upstream 구조 > 우리 커스텀 기능 구조
3. **통합 원칙**: 기존 기능 보존 + 새 구조 채택
4. **테스트 필수**: 각 단계마다 기능 동작 확인 필요