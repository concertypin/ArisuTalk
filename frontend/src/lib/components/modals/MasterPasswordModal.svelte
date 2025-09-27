<script>
  import { t } from '../../../i18n.js';
  import { isMasterPasswordModalVisible } from '../../stores/ui';
  import { validatePassword, generateMasterPassword } from '../../utils/crypto.js';
  import { secureStorage } from '../../utils/secureStorage.js';
  import { ShieldCheck, Info, Key, Check, HelpCircle, RefreshCw } from 'lucide-svelte';
  import { fade } from 'svelte/transition';

  let password = '';
  let confirmPassword = '';
  let hint = '';
  let errorMessage = '';
  let passwordStrength = { message: '', strength: 0 };

  function handlePasswordInput() {
      if (password) {
          passwordStrength = validatePassword(password);
      } else {
          passwordStrength = { message: '', strength: 0 };
      }
  }

  async function handleSetupEncryption() {
    errorMessage = '';

    if (!password) {
      errorMessage = t("security.enterMasterPassword");
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      errorMessage = validation.message;
      return;
    }

    if (password !== confirmPassword) {
      errorMessage = t("security.passwordsDoNotMatch");
      return;
    }

    try {
      await secureStorage.setupEncryption(password, hint);
      isMasterPasswordModalVisible.set(false);
      alert(t("security.encryptionEnabledSuccess"));
    } catch (error) {
      errorMessage = error.message;
    }
  }

  function handleGeneratePassword() {
      const newPassword = generateMasterPassword();
      password = newPassword;
      confirmPassword = newPassword;
      handlePasswordInput();
      alert(t("security.generatedPasswordMessage", { password: newPassword }));
  }

  function handleSkip() {
      isMasterPasswordModalVisible.set(false);
  }

  const strengthColors = [
    "text-red-400",
    "text-yellow-400",
    "text-blue-400",
    "text-green-400",
  ];
  const strengthText = [
    t("security.passwordStrength.veryWeak"),
    t("security.passwordStrength.weak"),
    t("security.passwordStrength.medium"),
    t("security.passwordStrength.strong"),
  ];

</script>

{#if $isMasterPasswordModalVisible}
<div transition:fade={{ duration: 200 }} class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" on:click={handleSkip}>
    <div class="bg-gray-800 rounded-lg w-full max-w-lg" on:click|stopPropagation>
        <!-- Header -->
        <div class="p-6 border-b border-gray-600">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck class="w-5 h-5" />
                {t("security.encryptionSetupTitle")}
            </h2>
            <p class="text-gray-400 text-sm mt-1">
                {t("security.encryptionSetupDescription")}
            </p>
        </div>
        
        <!-- Content -->
        <div class="p-6">
            <div class="space-y-4">
                <!-- Info Box -->
                <div class="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <div class="flex items-start gap-3">
                        <Info class="w-5 h-5 text-blue-400 mt-0.5" />
                        <div class="text-sm text-gray-300">
                            <p class="font-medium text-blue-400 mb-1">{t("security.whyEncryptionIsNeeded")}</p>
                            <ul class="space-y-1 text-xs">
                                <li>{t("security.encryptionBenefit1")}</li>
                                <li>{t("security.encryptionBenefit2")}</li>
                                <li>{t("security.encryptionBenefit3")}</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <!-- Password Input -->
                <div>
                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2" for="setup-master-password">
                        <Key class="w-4 h-4 mr-2" />{t("security.masterPasswordLabel")}
                    </label>
                    <input 
                        type="password" 
                        id="setup-master-password" 
                        bind:value={password}
                        on:input={handlePasswordInput}
                        placeholder={t("security.masterPasswordPlaceholder")}
                        class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm"
                        autocomplete="new-password"
                    />
                    {#if passwordStrength.message}
                        <div class="mt-2 text-xs {strengthColors[Math.min(passwordStrength.strength, 3)]}">
                            {t("security.passwordStrength.label")} {strengthText[Math.min(passwordStrength.strength, 3)]} - {passwordStrength.message}
                        </div>
                    {/if}
                </div>
                
                <!-- Confirm Password -->
                <div>
                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2" for="setup-master-password-confirm">
                        <Check class="w-4 h-4 mr-2" />{t("security.confirmPasswordLabel")}
                    </label>
                    <input 
                        type="password" 
                        id="setup-master-password-confirm" 
                        bind:value={confirmPassword}
                        placeholder={t("security.confirmPasswordPlaceholder")}
                        class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm"
                        autocomplete="new-password"
                    />
                </div>
                
                <!-- Hint -->
                <div>
                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2" for="setup-password-hint">
                        <HelpCircle class="w-4 h-4 mr-2" />{t("security.passwordHintLabel")}
                    </label>
                    <input 
                        type="text" 
                        id="setup-password-hint" 
                        bind:value={hint}
                        placeholder={t("security.passwordHintPlaceholder")}
                        class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm"
                        maxlength="100"
                    />
                    <p class="text-xs text-gray-500 mt-1">{t("security.passwordHintWarning")}</p>
                </div>
                
                <!-- Generate Password -->
                <div class="pt-2 border-t border-gray-600">
                    <button 
                        on:click={handleGeneratePassword}
                        class="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                    >
                        <RefreshCw class="w-4 h-4" />
                        {t("security.generateSecurePassword")}
                    </button>
                </div>
                
                {#if errorMessage}
                    <div class="text-red-400 text-sm">{errorMessage}</div>
                {/if}
            </div>
        </div>
        
        <!-- Footer -->
        <div class="p-6 border-t border-gray-600 flex justify-between">
            <button 
                on:click={handleSkip}
                class="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
                {t("common.setupLater")}
            </button>
            <div class="flex gap-2">
                <button 
                    on:click={handleSetupEncryption}
                    class="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    {t("security.setupEncryption")}
                </button>
            </div>
        </div>
    </div>
</div>
{/if}
