# 🎯 우리 브랜치의 보존해야 할 커스텀 기능

## **📍 UI 위치 및 모양 정보 (중요!!!)**

### **1. 캐릭터 모달의 최면 제어 UI**
```javascript
// 위치: CharacterModal.js - 캐릭터 편집 모달 하단
// 접근: 캐릭터 편집 버튼 → CharacterModal → 하단 "최면 제어" 섹션

// UI 구조:
<div class="mt-6 p-4 bg-gray-700 rounded-lg">
  <h4>🔮 최면 제어</h4>
  
  // 최면 활성화 체크박스
  <input id="hypnosis-enabled" type="checkbox" />
  
  // 호감도 슬라이더들 (4개)
  <div class="hypnosis-slider-group">
    <label>호감도 (Affection)</label>
    <input id="hypnosis-affection" type="range" min="0" max="100" />
    <span id="hypnosis-affection-value">50%</span>
  </div>
  // intimacy, trust, romantic_interest도 동일 구조
  
  // 추가 최면 옵션들
  <input id="hypnosis-force-love" type="checkbox" /> 사랑수치 강제 해제
  <input id="hypnosis-sns-access" type="checkbox" /> SNS 전체 접근 권한
  <input id="hypnosis-secret-account" type="checkbox" /> 비밀계정 접근
  <input id="hypnosis-sns-edit" type="checkbox" /> SNS 편집 권한
</div>
```

### **2. SNS 캐릭터 목록 모달**
```javascript
// 위치: 메인 UI 상단 버튼으로 접근
// 버튼 위치: 설정 버튼 옆 또는 별도 SNS 버튼
// 모달 크기: 전체 화면 모달 (z-index: 60)

// UI 구조:
<div class="fixed inset-0 bg-black/60 z-60">
  <div class="bg-gray-800 rounded-xl max-w-4xl mx-auto mt-8">
    <header>
      <h2>📱 SNS - 캐릭터 선택</h2>
      <input placeholder="캐릭터 검색..." />
    </header>
    
    // 캐릭터 그리드 (3-4열)
    <div class="grid grid-cols-3 md:grid-cols-4 gap-4">
      {characters.map(char => 
        <div class="character-card cursor-pointer hover:bg-gray-700">
          <img src={char.avatar} class="w-16 h-16 rounded-full" />
          <span class="character-name">{char.name}</span>
        </div>
      )}
    </div>
  </div>
</div>
```

### **3. SNS 피드 모달**
```javascript
// 위치: SNS 캐릭터 선택 후 열리는 메인 SNS 화면
// 모달 크기: 전체 화면 모달 (z-index: 60)

// UI 구조:
<div class="fixed inset-0 bg-black/60 z-60">
  <div class="bg-gray-800 rounded-xl max-w-5xl mx-auto mt-4 h-[90vh]">
    
    // 헤더: 캐릭터 정보 + 계정 전환
    <header class="flex items-center justify-between p-4 border-b border-gray-700">
      <div class="flex items-center gap-3">
        <img src={character.avatar} class="w-12 h-12 rounded-full" />
        <div>
          <h2>{character.name}</h2>
          <span class="text-sm text-gray-400">@{character.name.toLowerCase()}</span>
        </div>
      </div>
      
      // 본계정/뒷계정 전환 토글 (중요!)
      <div class="flex items-center gap-2">
        <span class={secretMode ? "text-red-400" : "text-gray-400"}>
          {secretMode ? "🔞 뒷계정" : "😊 본계정"}
        </span>
        <input type="checkbox" class="toggle-secret-mode" />
      </div>
    </header>
    
    // 탭 네비게이션
    <nav class="flex border-b border-gray-700">
      <button class={`tab ${activeTab === 'posts' ? 'active' : ''}`}>게시물</button>
      <button class={`tab ${activeTab === 'secrets' ? 'active' : ''}`}>비밀글</button>
      <button class={`tab ${activeTab === 'tags' ? 'active' : ''}`}>태그</button>
    </nav>
    
    // SNS 포스트 피드 (Instagram 스타일)
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      {snsPosts.map(post => 
        <article class="bg-gray-700 rounded-lg p-4">
          <header class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <img src={character.avatar} class="w-8 h-8 rounded-full" />
              <span class="font-semibold">{character.name}</span>
              <span class="text-xs text-gray-400">{post.timestamp}</span>
            </div>
            
            // 편집/삭제 버튼 (최면 권한 있을 때만 표시)
            {canEdit && (
              <div class="flex gap-1">
                <button class="edit-sns-post-btn p-1 hover:bg-gray-600 rounded">
                  <i data-lucide="edit" class="w-4 h-4"></i>
                </button>
                <button class="delete-sns-post-btn p-1 hover:bg-red-600 rounded">
                  <i data-lucide="trash" class="w-4 h-4"></i>
                </button>
              </div>
            )}
          </header>
          
          <div class="sns-post-content">
            <p class="text-gray-300">{post.content}</p>
          </div>
          
          // 태그들
          <div class="flex flex-wrap gap-1 mt-2">
            {post.tags?.map(tag => 
              <span class="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                #{tag}
              </span>
            )}
          </div>
          
          // 접근 레벨 표시 (색상으로 구분)
          <div class={`access-indicator ${post.access_level}`}>
            {accessLevelLabels[post.access_level]}
          </div>
        </article>
      )}
    </div>
  </div>
</div>
```

### **4. SNS 포스트 작성 모달**
```javascript
// 위치: SNS 피드에서 "글 작성" 버튼 클릭 시
// 조건: 최면 권한(sns_edit_access)이 있을 때만 표시
// 모달 크기: 중간 크기 모달 (z-index: 70, 다른 모달 위에 표시)

// UI 구조:
<div class="fixed inset-0 bg-black/70 flex items-center justify-center z-70">
  <div class="bg-gray-800 rounded-xl w-full max-w-md mx-4 p-6">
    <header class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">
        {isSecretMode ? "🔞 비밀글 작성" : "📝 게시물 작성"}
      </h3>
      <button class="close-modal-btn">×</button>
    </header>
    
    // 글 작성 영역
    <div class="space-y-4">
      <textarea 
        placeholder="무슨 생각을 하고 있나요?"
        class="w-full h-32 bg-gray-700 rounded-lg p-3 resize-none"
        maxLength="500"
      ></textarea>
      
      // 스티커 선택 (옵션)
      <select class="sticker-select bg-gray-700 rounded">
        <option value="">스티커 없음</option>
        {character.stickers.map(sticker => 
          <option value={sticker.id}>{sticker.name}</option>
        )}
      </select>
      
      // 접근 레벨 선택
      <select class="access-level-select bg-gray-700 rounded">
        <option value="main-public">본계정 공개</option>
        <option value="main-private">본계정 비공개</option>
        <option value="secret-public">뒷계정 공개</option>
        <option value="secret-private">뒷계정 비밀</option>
      </select>
      
      // 태그 입력
      <input 
        type="text" 
        placeholder="#태그1 #태그2 (최대 10개)"
        class="w-full bg-gray-700 rounded p-2"
      />
      
      // 액션 버튼들
      <div class="flex gap-2">
        <button class="cancel-btn flex-1 bg-gray-600 hover:bg-gray-500 rounded py-2">
          취소
        </button>
        <button class="post-btn flex-1 bg-blue-600 hover:bg-blue-700 rounded py-2">
          게시
        </button>
      </div>
    </div>
  </div>
</div>
```

### **5. 이미지 결과 모달**
```javascript
// 위치: NAI 스티커 생성 완료 후 결과 표시
// 모달 크기: 전체 화면 모달 (z-index: 9999, 최상위)

// UI 구조:
<div class="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]">
  <div class="bg-gray-800 rounded-xl max-w-2xl mx-4 p-6">
    <header class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">🎨 생성된 스티커</h3>
      <button class="close-modal-btn">×</button>
    </header>
    
    // 생성된 이미지 표시
    <div class="text-center">
      <img 
        src={imageUrl} 
        alt="Generated sticker"
        class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
      />
    </div>
    
    // 프롬프트 정보 (선택적 표시)
    <div class="mt-4 p-3 bg-gray-700 rounded text-sm">
      <strong>사용된 프롬프트:</strong>
      <p class="text-gray-300 mt-1">{promptText}</p>
    </div>
    
    // 액션 버튼들
    <div class="flex gap-2 mt-4">
      <button class="download-btn flex-1 bg-green-600 hover:bg-green-700 rounded py-2">
        다운로드
      </button>
      <button class="save-as-sticker-btn flex-1 bg-blue-600 hover:bg-blue-700 rounded py-2">
        스티커로 저장
      </button>
      <button class="close-btn flex-1 bg-gray-600 hover:bg-gray-500 rounded py-2">
        닫기
      </button>
    </div>
  </div>
</div>
```

### **6. NAI 설정 패널 (데스크톱 설정 내)**
```javascript
// 위치: 데스크톱 설정 → NAI 탭
// 접근: 설정 버튼 → 좌측 네비게이션의 "🧪 NAI 스티커 생성" 탭

// UI 구조 (DesktopSettingsUI.js 내의 NAI 패널):
<div class="nai-settings-panel">
  <div class="setting-group">
    <h4>NovelAI API 설정</h4>
    <input 
      type="password" 
      placeholder="NAI API 키 입력"
      class="w-full bg-gray-700 rounded p-2"
    />
  </div>
  
  <div class="setting-group">
    <h4>기본 생성 설정</h4>
    <div class="flex gap-4">
      <div>
        <label>Steps</label>
        <input type="number" value="28" min="1" max="50" /> // 기본값 28
      </div>
      <div>
        <label>CFG Scale</label>
        <input type="number" value="3" min="1" max="20" step="0.1" /> // 기본값 3
      </div>
    </div>
  </div>
  
  <div class="setting-group">
    <h4>자동 생성 옵션</h4>
    <label class="flex items-center gap-2">
      <input type="checkbox" />
      <span>SNS 포스트 작성 시 자동으로 감정 스티커 생성</span>
    </label>
  </div>
  
  // 배치 생성 버튼
  <button class="generate-all-stickers-btn w-full bg-purple-600 hover:bg-purple-700 rounded py-2 mt-4">
    🎨 모든 캐릭터의 기본 감정 스티커 생성
  </button>
</div>
```

### **7. 프롬프트 모달의 추가 섹션**
```javascript
// 위치: PromptModal.js - 기존 프롬프트 편집 모달에 추가
// 접근: 설정 → 프롬프트 편집

// 추가되는 섹션들:
const additionalSections = {
  "단톡방 프롬프트": {
    key: 'groupChat',
    content: prompts.groupChat,
    description: "단톡방에서 AI 캐릭터들이 대화할 때 사용되는 프롬프트",
  },
  "오픈톡방 프롬프트": {
    key: 'openChat', 
    content: prompts.openChat,
    description: "오픈톡방에서 AI 캐릭터들이 대화할 때 사용되는 프롬프트",
  }
}

// UI에서는 기존 탭들과 동일한 스타일로 추가:
<div class="prompt-section">
  <button class={`tab ${activeSection === 'groupChat' ? 'active' : ''}`}>
    단톡방 프롬프트
  </button>
  <button class={`tab ${activeSection === 'openChat' ? 'active' : ''}`}>
    오픈톡방 프롬프트  
  </button>
</div>
```

---

## **🎨 UI 테마 및 스타일 정보**

### **색상 시스템**
```css
/* 본계정 테마 (기본) */
.main-account-theme {
  --primary-color: #3B82F6; /* blue-500 */
  --bg-color: #374151; /* gray-700 */
  --text-primary: #F9FAFB; /* gray-50 */
  --text-secondary: #9CA3AF; /* gray-400 */
}

/* 뒷계정 테마 (비밀 모드) */
.secret-account-theme {
  --primary-color: #EF4444; /* red-500 */  
  --bg-color: #451A1A; /* red-900/20 mixed */
  --text-primary: #FEE2E2; /* red-50 */
  --text-secondary: #FCA5A5; /* red-300 */
  --accent-color: #DC2626; /* red-600 */
}

/* 접근 레벨별 인디케이터 색상 */
.access-main-public { border-left: 4px solid #10B981; } /* green-500 */
.access-main-private { border-left: 4px solid #F59E0B; } /* amber-500 */
.access-secret-public { border-left: 4px solid #EF4444; } /* red-500 */
.access-secret-private { border-left: 4px solid #7C2D12; } /* red-900 */
```

### **애니메이션 및 전환 효과**
```css
/* 모달 페이드인 효과 */
.modal-enter {
  opacity: 0;
  transform: scale(0.95);
}
.modal-enter-active {
  opacity: 1;
  transform: scale(1);
  transition: all 200ms ease-out;
}

/* 계정 전환 애니메이션 */
.theme-transition {
  transition: background-color 300ms ease-in-out, 
              color 300ms ease-in-out,
              border-color 300ms ease-in-out;
}

/* 호감도 슬라이더 색상 변화 */
.hypnosis-slider::-webkit-slider-thumb {
  background: linear-gradient(45deg, #8B5CF6, #EC4899);
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
}
```

## **🔗 SNS 기능 접근 버튼 위치 정보**

### **1. SNS 접근 버튼**
```javascript
// 현재 위치: 정확한 위치 확인 필요 (아마도 헤더나 사이드바)
// 버튼 모양: 📱 또는 "SNS" 텍스트 버튼
// 클릭 동작: showSNSCharacterListModal = true

// 예상 위치 (확인 필요):
// Option 1: 헤더의 설정 버튼 옆
<div class="header-buttons">
  <button id="open-settings-modal">⚙️ 설정</button>
  <button id="open-sns-modal">📱 SNS</button> // 이 버튼 추가
</div>

// Option 2: 사이드바 하단
<div class="sidebar-footer">
  <button id="open-sns-button">📱 캐릭터 SNS 보기</button>
</div>
```

### **2. 최면 제어 접근 경로**
```javascript
// 접근 경로: 캐릭터 편집 버튼 클릭 → CharacterModal 열림 → 하단 스크롤
// 버튼 위치: 각 캐릭터 카드의 edit-character-btn
// 모달 내 위치: 기본 정보 입력 필드들 아래, 하단 부근

// 캐릭터 편집 버튼 (이미 존재):
<button data-id="{char.id}" class="edit-character-btn">
  <i data-lucide="edit-3" class="w-3 h-3"></i>
</button>

// CharacterModal 내부 구조 (기존 + 추가):
<div class="character-modal">
  <!-- 기존: 이름, 프롬프트, 아바타 등 -->
  
  <!-- 🆕 추가: 최면 제어 섹션 (하단) -->
  <div class="hypnosis-control-section mt-6 p-4 bg-gray-700 rounded-lg">
    <h4>🔮 최면 제어</h4>
    <!-- 최면 UI들... -->
  </div>
</div>
```

### **3. NAI 설정 접근 경로**
```javascript
// 접근 경로: 설정 버튼 → 데스크톱 설정 모달 → 좌측 NAI 탭 클릭
// 현재 탭 목록에 추가되어야 하는 항목:

// DesktopSettingsUI.js의 navItems에 추가:
const navItems = [
  // ... 기존 탭들 (api, appearance, character, data, advanced)
  {
    id: "nai",
    icon: "image", 
    label: "🧪 NAI 스티커 생성",
    description: "NovelAI 기반 스티커 자동 생성 설정",
  },
]
```

### **4. 프롬프트 편집 추가 항목**
```javascript
// 접근 경로: 설정 → 프롬프트 편집 → 탭에서 새로운 섹션들 확인
// 기존 탭들: "기본 채팅", "캐릭터 생성" 등
// 추가 탭들: "단톡방 프롬프트", "오픈톡방 프롬프트"
```

---

## **🎯 이벤트 핸들러 연결 정보 (중요!)**

### **SNS 관련 이벤트 핸들러**
```javascript
// snsHandlers.js에 정의된 핸들러들:
// 1. SNS 모달 열기/닫기
// 2. 캐릭터 선택
// 3. 계정 전환 (본계정 ↔ 뒷계정)
// 4. 탭 전환 (게시물/비밀글/태그)
// 5. 포스트 편집/삭제 (최면 권한 확인)
// 6. 포스트 작성

// 연결되어야 할 이벤트들:
document.addEventListener('click', (e) => {
  // SNS 버튼 클릭
  if (e.target.closest('#open-sns-button')) {
    window.personaApp.setState({ showSNSCharacterListModal: true });
  }
  
  // 캐릭터 선택
  if (e.target.closest('.sns-character-card')) {
    const characterId = e.target.dataset.characterId;
    window.personaApp.selectSNSCharacter(characterId);
  }
  
  // 계정 전환 토글
  if (e.target.closest('.toggle-secret-mode')) {
    window.personaApp.toggleSNSSecretMode();
  }
  
  // ... 기타 SNS 관련 이벤트들
});
```

### **최면 제어 이벤트 핸들러**
```javascript
// modalHandlers.js 또는 별도 핸들러에서:
// 1. 최면 활성화/비활성화 토글
// 2. 호감도 슬라이더 변경
// 3. 최면 옵션 체크박스 변경

// 이미 구현된 핸들러들 (ui.js에서):
const setupHypnosisSlider = (type) => {
  const slider = document.getElementById(`hypnosis-${type}`);
  const valueDisplay = document.getElementById(`hypnosis-${type}-value`);
  
  if (slider && valueDisplay) {
    slider.addEventListener('input', (e) => {
      const value = e.target.value;
      valueDisplay.textContent = `${value}%`;
      
      if (app.updateHypnosisValue) {
        app.updateHypnosisValue(characterId, type, parseInt(value));
      }
    });
  }
};
```

### **NAI 설정 이벤트 핸들러**
```javascript
// naiHandlers.js에 정의된 핸들러들:
// 1. API 키 입력
// 2. 생성 설정 변경 (steps, CFG)
// 3. 자동 생성 옵션 토글
// 4. 배치 생성 버튼 클릭
// 5. 스티커 생성 진행률 표시
// 6. 생성 완료 후 ImageResultModal 표시

// setupNAIHandlers(app) 함수가 이미 존재하며,
// ui.js에서 설정 모달 렌더링 시 자동 호출됨
```

---

## **🚨 병합 시 특별 주의사항 (UI 통합)**

### **1. 모달 z-index 계층 관리**
```javascript
// 현재 z-index 사용 현황:
// - 기본 모달: z-50
// - SNS 모달들: z-60  
// - SNS 포스트 작성: z-70
// - 이미지 결과 모달: z-[9999]

// upstream/main의 새로운 모달 구조와 충돌하지 않도록 
// z-index 값들을 재조정해야 할 수 있음
```

### **2. 상태 변수 이름 통합**
```javascript
// 우리 브랜치 → upstream 통합 시 변경사항:
// expandedCharacterId → expandedCharacterIds (Set)
// 
// 영향받는 UI 요소들:
// - Sidebar.js의 캐릭터 확장/축소 로직
// - 최면 제어 UI에서 캐릭터 상태 참조
// - SNS에서 캐릭터 정보 표시
```

### **3. 모바일 vs 데스크톱 UI 분기**
```javascript
// upstream/main의 새로운 모바일 UI 시스템에서
// 우리 SNS 모달들이 올바르게 표시되는지 확인:

// 모바일에서는 전체 화면으로 표시
if (isMobile) {
  // SNS 모달들을 모바일 전용 컨테이너에 렌더링
  // 새로운 page-transition-container 시스템 활용
}

// 데스크톱에서는 오버레이 모달로 표시  
else {
  // 기존 modal-container에 렌더링
}
```

---

## **커스텀 기능 시스템**

### **1. SNS 시스템**
```javascript
// 상태 변수들
showSNSModal: false,
showSNSCharacterListModal: false, 
selectedSNSCharacter: null,
snsSecretMode: false,
snsActiveTab: 'posts',

// 컴포넌트들
SNSCharacterList.js
SNSFeed.js  
SNSPostModal.js
ImageResultModal.js

// 핸들러들
snsHandlers.js
```

### **2. 최면(Hypnosis) 제어 시스템**
```javascript
// CharacterModal.js의 hypnosis UI
character.hypnosis = {
  enabled: boolean,
  affection: number,
  intimacy: number, 
  trust: number,
  romantic_interest: number,
  force_love_unlock: boolean,
  sns_edit_access: boolean,
  // ... 기타 설정들
}

// index.js의 hypnosis 함수들
updateHypnosisDisplayValues()
updateHypnosisValue()
checkSNSAccess()
```

### **3. 호감도 시스템 (characterStates)**
```javascript
characterStates: {
  [characterId]: {
    affection: 0.2,
    intimacy: 0.2,
    trust: 0.2, 
    romantic_interest: 0,
    reason: "변화 이유",
    lastActivity: timestamp
  }
}
```

### **4. SNS 메모리 시스템 (snsPosts)**
```javascript
character.snsPosts = [{
  id: "uuid",
  type: "post|secret|tag",
  content: "내용",
  access_level: "main-public|main-private|secret-public|secret-private",
  tags: ["태그1", "태그2"],
  timestamp: "ISO date",
  // ... 기타 메타데이터
}]
```

### **5. NAI 스티커 자동 생성**
```javascript
character.naiSettings = {
  vibeImage: "base64_data",
  autoGenerate: true,
  generatedEmotions: ["happy", "sad"],
  // ... NAI 관련 설정들  
}

// 관련 파일들
naiHandlers.js
NAISettingsPanel.js
```

### **6. 커스텀 프롬프트 텍스트**
```
snsForcePrompt.txt
groupChatMLPrompt.txt  
openChatMLPrompt.txt
mainChatMLPrompt.txt
```