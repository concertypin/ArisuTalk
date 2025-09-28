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
if (import.meta.env.DEV) {
  isDevModeActive.set(true);
  console.log("✅ 개발 서버 - 디버그 모드 강제 활성화 (import.meta.env.DEV 기준)");
  
  // 디버그 모드 데이터 시스템도 동일한 조건으로 설정
  console.log("📊 디버그 모드 데이터 시스템 활성화됨");
  console.log("🔧 DevModeIndicator 표시 조건: import.meta.env.DEV");
  console.log("🔄 ResetAtRefresh 표시 조건: import.meta.env.DEV");
} else {
  // 프로덕션 환경에서는 false로 설정
  isDevModeActive.set(false);
}

initializeDebugUtility();

// Expose dev tools globally for easy access in console
if (import.meta.env.DEV) {
  // @ts-ignore: 전역 변수 추가
  (window as any).__dev__ = {
    dumpLocalStorage: dumpLocalStorageToJson,
    dumpIndexedDB: dumpIndexedDBToJson,
  };
  console.log(
    "Dev tools (__dev__.dumpLocalStorage(), __dev__.dumpIndexedDB()) are available in the console."
  );
}

console.log("🔧 dev-init.ts 실행 완료");
