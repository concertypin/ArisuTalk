# index.js 충돌 분석 및 커스텀 기능 정리

## 백업 파일 정보
- **백업 파일**: `index.js.backup`
- **원본 위치**: `frontend/src/index.js`

## 주요 커스텀 기능들 (복구 필요)

### 1. SNS 시스템 관련 상태들
```javascript
// state에 추가된 SNS 관련 상태들
snsModals: {
  character: null,
  tab: 'posts',
  isOpen: false
}
```

### 2. 최면 제어 시스템
```javascript
// 최면 제어를 위한 hypnosis 상태 관리
// 캐릭터별 최면 설정 및 호감도 강제 조정 기능
```

### 3. 호감도 기반 캐릭터 상태 시스템
```javascript
// characterState 시스템 (기존 mood/energy 대체)
characterState: {
  affection: 0.3,
  intimacy: 0.1,
  trust: 0.2,
  romantic_interest: 0.0,
  reason: ""
}
```

### 4. 추가된 메서드들 (복구 필요)
- `handleGenerateSNSPost(messageId)` - SNS 포스트 생성
- `handleGenerateNAISticker(messageId)` - NAI 스티커 생성  
- `handleAddToSNSMemory(messageId)` - SNS 메모리 추가
- `toggleStickerSize(messageId)` - 스티커 크기 토글
- `toggleUserStickerPanel()` - 사용자 스티커 패널 토글
- `handleSendMessageWithSticker()` - 스티커와 함께 메시지 발송

### 5. 상태 관리 변경사항
- **expandedCharacterId**: upstream에서는 `expandedCharacterIds` (Set)로 변경
- **현재 코드**: `expandedCharacterId` (단수) 사용
- **충돌 지점**: 상태 관리 방식 불일치

### 6. 저장소 시스템 확장
```javascript
// 추가된 저장 키들
- personaChat_snsModals_v16
- personaChat_characterStates_v16
- personaChat_expandedCharacterId_v16 (vs expandedCharacterIds)
```

## upstream/main과의 주요 차이점
1. **이벤트 위임 패턴**: upstream은 이벤트 위임 사용, 현재는 직접 핸들러
2. **모바일 UI 시스템**: 새로운 페이지 전환 시스템
3. **상태 관리**: Set 기반 복수 선택에서 단일 선택으로 차이
4. **모달 구조**: 새로운 모달 시스템 도입

## 복구 전략
1. upstream/main 기반 구조 수용
2. 커스텀 기능들을 새 구조에 맞게 적용
3. 이벤트 위임 패턴 적용
4. 상태 관리 방식 통일 필요