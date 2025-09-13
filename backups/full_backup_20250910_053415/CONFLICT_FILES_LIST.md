# 충돌 파일 목록 및 백업 계획

## 충돌이 발생한 파일들 (UU 상태였던 파일들)

### 핵심 시스템 파일들
1. `frontend/src/index.js` - 메인 애플리케이션 클래스
2. `frontend/src/ui.js` - UI 렌더링 시스템
3. `frontend/src/storage.js` - 저장소 시스템

### 컴포넌트 파일들
4. `frontend/src/components/DesktopSettingsUI.js` - 데스크톱 설정 UI
5. `frontend/src/components/MainChat.js` - 메인 채팅 컴포넌트

### 핸들러 파일들
6. `frontend/src/handlers/mainChatHandlers.js` - 메인 채팅 이벤트 핸들러
7. `frontend/src/handlers/modalHandlers.js` - 모달 이벤트 핸들러

### 언어 파일들
8. `frontend/src/language/en.ts` - 영어 언어 파일
9. `frontend/src/language/ko.ts` - 한국어 언어 파일
10. `frontend/src/language/language.d.ts` - 언어 타입 정의

### 프롬프트 시스템 파일들
11. `frontend/src/prompts/builder/promptBuilder.js` - 프롬프트 빌더
12. `frontend/src/prompts/chatMLPrompts.ts` - ChatML 프롬프트
13. `frontend/src/prompts/promptManager.ts` - 프롬프트 매니저

## 백업 전략

각 파일에 대해 다음을 생성:
1. `파일명.backup` - 현재 상태의 백업 파일
2. `파일명_conflicts.md` - 충돌 위치 및 내용 정리 문서

## 백업 완료 후 작업
1. 깨끗한 upstream/main 브랜치 체크아웃
2. 백업 파일들을 이용한 커스텀 기능 단계적 복구