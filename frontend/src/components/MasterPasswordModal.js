/**
 * Master Password Modal Component
 * 암호화된 API 키 저장소를 위한 마스터 비밀번호 입력/설정 모달
 */

import { validatePassword } from "../utils/crypto.js";
import { t } from "../i18n.js";

export function renderMasterPasswordModal(app) {
  const { state } = app;
  const { showSetupEncryptionModal } = state;

  if (!showSetupEncryptionModal) {
    return "";
  }

  return renderSetupEncryptionModal(app);
}

function renderSetupEncryptionModal(app) {
  return `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-gray-800 rounded-lg w-full max-w-lg">
                <!-- Header -->
                <div class="p-6 border-b border-gray-600">
                    <h2 class="text-xl font-bold text-white flex items-center gap-2">
                        <i data-lucide="shield-check" class="w-5 h-5"></i>
                        API 키 암호화 설정
                    </h2>
                    <p class="text-gray-400 text-sm mt-1">
                        API 키를 안전하게 보호하기 위해 암호화를 설정하세요.
                    </p>
                </div>
                
                <!-- Content -->
                <div class="p-6">
                    <div class="space-y-4">
                        <!-- 암호화 설명 -->
                        <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                            <div class="flex items-start gap-3">
                                <i data-lucide="info" class="w-5 h-5 text-blue-400 mt-0.5"></i>
                                <div class="text-sm text-gray-300">
                                    <p class="font-medium text-blue-400 mb-1">암호화가 필요한 이유</p>
                                    <ul class="space-y-1 text-xs">
                                        <li>• 브라우저에서 API 키가 평문으로 노출되지 않습니다</li>
                                        <li>• 악성 확장프로그램으로부터 API 키를 보호합니다</li>
                                        <li>• XSS 공격으로부터 API 키를 안전하게 보호합니다</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 비밀번호 입력 -->
                        <div>
                            <label class="flex items-center text-sm font-medium text-gray-300 mb-2">
                                <i data-lucide="key" class="w-4 h-4 mr-2"></i>마스터 비밀번호
                            </label>
                            <input 
                                type="password" 
                                id="setup-master-password" 
                                placeholder="${t(
                                  "security.masterPasswordPlaceholder",
                                )}" 
                                class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm"
                                autocomplete="new-password"
                            />
                            <div id="password-strength" class="mt-2 text-xs"></div>
                        </div>
                        
                        <!-- 비밀번호 확인 -->
                        <div>
                            <label class="flex items-center text-sm font-medium text-gray-300 mb-2">
                                <i data-lucide="check" class="w-4 h-4 mr-2"></i>비밀번호 확인
                            </label>
                            <input 
                                type="password" 
                                id="setup-master-password-confirm" 
                                placeholder="${t(
                                  "security.confirmPasswordPlaceholder",
                                )}" 
                                class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm"
                                autocomplete="new-password"
                            />
                        </div>
                        
                        <!-- 힌트 (선택사항) -->
                        <div>
                            <label class="flex items-center text-sm font-medium text-gray-300 mb-2">
                                <i data-lucide="help-circle" class="w-4 h-4 mr-2"></i>비밀번호 힌트 (선택사항)
                            </label>
                            <input 
                                type="text" 
                                id="setup-password-hint" 
                                placeholder="${t(
                                  "security.passwordHintPlaceholder",
                                )}" 
                                class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm"
                                maxlength="100"
                            />
                            <p class="text-xs text-gray-500 mt-1">힌트는 암호화되지 않으므로 비밀번호 자체를 포함하지 마세요.</p>
                        </div>
                        
                        <!-- 자동 생성 옵션 -->
                        <div class="pt-2 border-t border-gray-600">
                            <button 
                                id="generate-master-password"
                                class="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                            >
                                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                                안전한 비밀번호 자동 생성
                            </button>
                        </div>
                        
                        <div id="setup-error-message" class="hidden text-red-400 text-sm"></div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="p-6 border-t border-gray-600 flex justify-between">
                    <button 
                        id="skip-encryption-btn"
                        class="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                    >
                        나중에 설정
                    </button>
                    <div class="flex gap-2">
                        <button 
                            id="setup-encryption-btn"
                            class="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            암호화 설정
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Setup event listeners for Master Password Modal
 */
export function setupMasterPasswordModalEventListeners(app) {
  // Setup encryption
  const setupBtn = document.getElementById("setup-encryption-btn");
  if (setupBtn) {
    setupBtn.addEventListener("click", async () => {
      const password = document.getElementById("setup-master-password").value;
      const confirmPassword = document.getElementById(
        "setup-master-password-confirm",
      ).value;
      const hint = document.getElementById("setup-password-hint").value;
      const errorDiv = document.getElementById("setup-error-message");

      // Validation
      if (!password) {
        showError(errorDiv, "마스터 비밀번호를 입력하세요.");
        return;
      }

      const validation = validatePassword(password);
      if (!validation.isValid) {
        showError(errorDiv, validation.message);
        return;
      }

      if (password !== confirmPassword) {
        showError(errorDiv, "비밀번호가 일치하지 않습니다.");
        return;
      }

      try {
        await app.setupEncryption(password, hint);
        app.setState({ showSetupEncryptionModal: false });
        alert("API 키 암호화가 활성화되었습니다!");
      } catch (error) {
        showError(errorDiv, error.message);
      }
    });
  }

  // Generate master password
  const generateBtn = document.getElementById("generate-master-password");
  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      const { generateMasterPassword } = require("../utils/crypto.js");
      const password = generateMasterPassword();

      document.getElementById("setup-master-password").value = password;
      document.getElementById("setup-master-password-confirm").value = password;

      // Show generated password temporarily
      alert(
        `생성된 마스터 비밀번호:\\n\\n${password}\\n\\n이 비밀번호를 안전한 곳에 저장하세요!`,
      );
    });
  }

  // Skip encryption
  const skipBtn = document.getElementById("skip-encryption-btn");
  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      app.setState({ showSetupEncryptionModal: false });
    });
  }

  // Password strength indicator
  const passwordInput = document.getElementById("setup-master-password");
  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      const password = passwordInput.value;
      const strengthDiv = document.getElementById("password-strength");

      if (password) {
        const validation = validatePassword(password);
        const colors = [
          "text-red-400",
          "text-yellow-400",
          "text-blue-400",
          "text-green-400",
        ];
        const strengthText = ["매우 약함", "약함", "보통", "강함"];

        strengthDiv.className = `mt-2 text-xs ${
          colors[Math.min(validation.strength, 3)]
        }`;
        strengthDiv.textContent = `비밀번호 강도: ${
          strengthText[Math.min(validation.strength, 3)]
        } - ${validation.message}`;
      } else {
        strengthDiv.textContent = "";
      }
    });
  }
}

function showError(errorDiv, message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove("hidden");
  setTimeout(() => {
    errorDiv.classList.add("hidden");
  }, 5000);
}
