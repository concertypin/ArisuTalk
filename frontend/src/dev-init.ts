// frontend/src/dev-init.ts

import {
  initializeDebugUtility,
  clearAllBrowserData,
} from "./lib/utils/debug-utils.ts";
import {
  dumpLocalStorageToJson,
  dumpIndexedDBToJson,
} from "./lib/utils/dev-tools.ts";
import { isResetOnRefreshEnabled } from "./lib/stores/debugSettings.ts";
import { isDevModeActive } from "./lib/stores/ui";
import { get } from "svelte/store";

console.log("🔧 dev-init.ts 실행 시작");
console.log("import.meta.env.DEV:", import.meta.env.DEV);
console.log("isResetOnRefreshEnabled 값:", get(isResetOnRefreshEnabled));
console.log(
  "현재 localStorage 'debug-reset-on-refresh':",
  localStorage.getItem("debug-reset-on-refresh")
);

if (import.meta.env.DEV && get(isResetOnRefreshEnabled)) {
  console.log("🚨 디버그 모드 활성화 - 모든 브라우저 데이터 클리어 실행");
  await clearAllBrowserData();
} else {
  console.log("✅ 일반 모드 - 데이터 클리어 스킵");
}

// 개발 서버에서는 항상 디버그 모드 활성화
// DevModeIndicator와 ResetAtRefresh가 표시되는 조건과 동일하게 설정

// URL 기반 개발 서버 감지 (캐시 문제 대응)
const isDevelopmentServer = () => {
  // 1. Vite 개발 환경 변수 확인 (가장 신뢰성 높음)
  if (import.meta.env.DEV) {
    return true;
  }
  
  // 2. localStorage에 저장된 개발 서버 상태 확인 (캐시 문제 대응)
  const storedDevState = localStorage.getItem('is-development-server');
  if (storedDevState === 'true') {
    console.log("📦 localStorage에서 개발 서버 상태 감지됨");
    return true;
  }
  
  // 3. URL 기반 개발 서버 감지 (localhost, 127.0.0.1, 특정 개발 포트)
  const { hostname, port } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  const isDevPort = port === '5173' || port === '3000' || port === '8080' || port === '5174'; // 일반적인 개발 서버 포트
  
  // 4. 개발 도메인 패턴 확인 (예: *.local, *.test, *.dev)
  const isDevDomain = /\.(local|test|dev|localhost)$/.test(hostname);
  
  return isLocalhost || isDevPort || isDevDomain;
};

if (isDevelopmentServer()) {
  isDevModeActive.set(true);
  console.log("✅ 개발 서버 감지 - 디버그 모드 강제 활성화");
  console.log(`📍 호스트: ${window.location.hostname}, 포트: ${window.location.port}`);
  
  // 디버그 모드 데이터 시스템도 동일한 조건으로 설정
  console.log("📊 디버그 모드 데이터 시스템 활성화됨");
  console.log("🔧 DevModeIndicator 표시 조건: 개발 서버 감지");
  console.log("🔄 ResetAtRefresh 표시 조건: 개발 서버 감지");
  
  // 캐시 문제 해결을 위해 localStorage에 개발 모드 상태 명시적으로 저장
  localStorage.setItem('is-development-server', 'true');
  console.log("💾 개발 서버 상태 localStorage에 저장됨");
} else {
  // 프로덕션 환경에서는 false로 설정
  isDevModeActive.set(false);
  console.log("🌐 프로덕션 서버 - 디버그 모드 비활성화");
  
  // 프로덕션 환경에서는 개발 모드 상태 제거
  localStorage.removeItem('is-development-server');
}

initializeDebugUtility();

// 개발 서버에서 서비스 워커 unregister (PWA 캐싱 문제 해결)
if (isDevelopmentServer()) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for (let registration of registrations) {
        console.log("🗑️ 서비스 워커 unregister:", registration.scope);
        registration.unregister();
      }
    }).catch(function(error) {
      console.log("⚠️ 서비스 워커 unregister 실패:", error);
    });
    
    // 기존 서비스 워커도 제거
    navigator.serviceWorker.getRegistration().then(function(registration) {
      if (registration) {
        console.log("🗑️ 활성 서비스 워커 unregister:", registration.scope);
        return registration.unregister();
      }
    }).then(function(success) {
      if (success) {
        console.log("✅ 서비스 워커 성공적으로 제거됨");
      }
    }).catch(function(error) {
      console.log("⚠️ 서비스 워커 제거 중 오류:", error);
    });
  }
}

// Expose dev tools globally for easy access in console
if (import.meta.env.DEV) {
  // @ts-ignore: 전역 변수 추가
  (window as any).__dev__ = {
    dumpLocalStorage: dumpLocalStorageToJson,
    dumpIndexedDB: dumpIndexedDBToJson,
    // 개발용 유틸리티 함수 추가
    clearServiceWorker: function() {
      if ('serviceWorker' in navigator) {
        return navigator.serviceWorker.getRegistrations().then(function(registrations) {
          const promises: Promise<boolean>[] = [];
          for (let registration of registrations) {
            console.log("🗑️ 서비스 워커 unregister:", registration.scope);
            promises.push(registration.unregister());
          }
          return Promise.all(promises);
        });
      }
      return Promise.resolve();
    },
    forceDevMode: function() {
      isDevModeActive.set(true);
      localStorage.setItem('is-development-server', 'true');
      console.log("🔧 개발 모드 강제 활성화됨");
    }
  };
  console.log(
    "Dev tools (__dev__.dumpLocalStorage(), __dev__.dumpIndexedDB(), __dev__.clearServiceWorker(), __dev__.forceDevMode()) are available in the console."
  );
}

console.log("🔧 dev-init.ts 실행 완료");
