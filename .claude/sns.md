# SNS 4-Tier Permission System 기능 요약

## 🎯 핵심 기능 개요
ArisuTalk의 SNS 시스템은 호감도 기반의 4단계 권한 체계로 구성되어 있습니다.

## 📁 주요 파일들
- `frontend/src/components/SNSCharacterList.js` - SNS 캐릭터 목록 모달
- `frontend/src/components/SNSFeed.js` - Instagram 스타일 SNS 피드
- `frontend/src/handlers/snsHandlers.js` - SNS 관련 이벤트 처리
- `frontend/src/api/gemini.js` - 호감도 시스템 API 연동
- `frontend/src/api/prompts.js` - 호감도 프롬프트 추가
- `frontend/src/api/promptBuilder.js` - characterState 파라미터 추가

## 🔗 연동 포인트들
### MainChat.js
- 개별 채팅: `individual-chat-sns-btn` → `openSNSFeed(characterId)`
- 그룹 채팅: `group-chat-sns-list-btn` → `openSNSCharacterList('group')`
- 오픈 채팅: `open-chat-sns-list-btn` → `openSNSCharacterList('open')`

### CharacterModal.js
- 캐릭터 편집 시 SNS 버튼: `character-sns-btn` → `openSNSFeed(characterId)`
- **최면 제어 시스템** 추가 (핵심 기능):
  ```html
  <details class="group border-t border-gray-700 pt-2">
      <summary>🌀 최면 제어 (호감도 강제 조절)</summary>
      <div class="content-inner pt-4 space-y-4">
          <!-- 최면 모드 활성화 토글 -->
          <input type="checkbox" id="hypnosis-enabled">
          
          <!-- 호감도 슬라이더들 -->
          <input type="range" id="hypnosis-affection" min="0" max="1" step="0.01">
          <input type="range" id="hypnosis-intimacy" min="0" max="1" step="0.01">
          <input type="range" id="hypnosis-trust" min="0" max="1" step="0.01">
          <input type="range" id="hypnosis-romantic" min="0" max="1" step="0.01">
          
          <!-- 권한 체크박스들 -->
          <input type="checkbox" id="hypnosis-force-love"> <!-- 사랑 단계 강제 해금 -->
          <input type="checkbox" id="hypnosis-sns-access"> <!-- SNS 전체 접근 권한 -->
          <input type="checkbox" id="hypnosis-secret-account"> <!-- 뒷계정 접근 권한 -->
      </div>
  </details>
  ```

## 📊 호감도 시스템 (핵심)
### 4가지 호감도 지표
1. **💙 기본 호감도 (Affection)** - 전반적인 호감
2. **💕 친밀도 (Intimacy)** - 감정적 친밀감  
3. **💚 신뢰도 (Trust)** - 신뢰와 의존도
4. **💖 로맨틱 관심도 (Romantic Interest)** - 로맨틱한 관심

### API 응답 구조 변경
```javascript
// gemini.js에서 응답 스키마 변경
"affectionChanges": {
    "type": "OBJECT",
    "properties": {
        "affection": { "type": "NUMBER" },
        "intimacy": { "type": "NUMBER" },
        "trust": { "type": "NUMBER" },
        "romantic_interest": { "type": "NUMBER" },
        "reason": { "type": "STRING" }
    }
}
```

### 프롬프트 시스템 추가
```javascript
// prompts.js에 추가된 호감도 시스템 프롬프트
Current affection levels with ${userName}:
- 💙 기본 호감도: ${Math.floor((characterState?.affection || 0.3) * 100)}%
- 💕 친밀도: ${Math.floor((characterState?.intimacy || 0.1) * 100)}%
- 💚 신뢰도: ${Math.floor((characterState?.trust || 0.2) * 100)}%
- 💖 로맨틱 관심도: ${Math.floor((characterState?.romantic_interest || 0.0) * 100)}%
```

## 🏗️ SNS UI 구조
### SNSCharacterList.js
- 캐릭터 목록 모달
- 타입별 필터링: 'all', 'group', 'open'
- 각 캐릭터의 통계 정보 표시

### SNSFeed.js  
- Instagram 스타일 UI
- 헤더: 프로필 + 계정 전환 버튼
- 통계: 게시물/팔로워/팔로잉 수
- 탭바: posts/private/tagged
- **4단계 권한 시스템**:
  1. 공개 게시물 (기본)
  2. 비공개 게시물 (70% 호감도 필요)
  3. 뒷계정 공개 (고호감도 필요)
  4. 뒷계정 비공개 (최고 호감도 필요)

## 🎮 핵심 함수들 (추정)
```javascript
// index.js에 추가되어야 할 함수들
app.openSNSCharacterList(type)  // 'group', 'open', 'all'
app.openSNSFeed(characterId)
app.closeSNSFeed()
app.checkSNSAccess(character, accessLevel)  // 권한 체크
app.handleHypnosisToggle(enabled)
app.handleHypnosisSlider(type, value)
app.updateHypnosisStatus()
```

## 🔧 이벤트 핸들러들
### modalHandlers.js 추가 항목
```javascript
// 최면 제어 관련
if (e.target.closest('#hypnosis-enabled')) {
    app.handleHypnosisToggle(e.target.checked);
}
if (e.target.closest('#hypnosis-force-love')) {
    app.handleHypnosisForceLoveToggle(e.target.checked);
}
// 호감도 슬라이더들
'hypnosis-affection': (app, value) => { app.handleHypnosisSlider('affection', parseFloat(value)); },
'hypnosis-intimacy': (app, value) => { app.handleHypnosisSlider('intimacy', parseFloat(value)); },
// ... 등등
```

### snsHandlers.js
- SNS 모달 닫기, 캐릭터 선택
- 뒤로가기, 계정 전환  
- 탭 전환, 좋아요/댓글/공유/북마크

## 🏢 데이터 구조 변경
### defaults.js
```javascript
// 캐릭터 기본 구조에 최면 시스템 추가
hypnosis: {
    enabled: false,
    affection: null,
    intimacy: null, 
    trust: null,
    romantic_interest: null,
    force_love_unlock: false,
    sns_full_access: false,
    secret_account_access: false
}
```

## ⚠️ 중요한 복구 포인트들
1. **최면 제어 UI** - 호감도 강제 조절의 핵심 기능
2. **4단계 권한 체크 로직** - SNS 접근 제한
3. **API 응답 구조 변경** - affectionChanges 객체
4. **프롬프트 시스템** - 호감도 상태 전달
5. **각 채팅 화면의 SNS 버튼들** - 진입점들
6. **뒷계정 시스템** - 비밀 콘텐츠 접근

이 정보를 바탕으로 SNS 시스템을 완전히 복원할 수 있어야 합니다.