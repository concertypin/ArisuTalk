import { StickerManager } from "../services/stickerManager.js";
import { renderNAIStats } from "../components/settings/panels/NAISettingsPanel.js";
import { renderStickerProgressModal } from "../components/StickerProgressModal.js";
import { DEFAULT_EMOTIONS } from "../api/novelai.js";
import { t } from "../i18n.js";

/**
 * NAI 스티커 생성 관련 이벤트 핸들러
 */
export function setupNAIHandlers(app) {
  if (!app.stickerManager) {
    app.stickerManager = new StickerManager(app);
  }

  // NAI API 키 보기/숨기기 토글
  document.addEventListener("click", (e) => {
    if (e.target.closest("#toggle-nai-api-key")) {
      e.preventDefault();
      const input = document.getElementById("nai-api-key");
      if (input) {
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        
        const icon = e.target.closest("#toggle-nai-api-key").querySelector("i");
        if (icon) {
          icon.setAttribute("data-lucide", isPassword ? "eye-off" : "eye");
          if (window.lucide) {
            window.lucide.createIcons();
          }
        }
      }
    }
  });

  // NAI 설정 변경 이벤트 처리
  document.addEventListener("input", (e) => {
    const target = e.target;
    
    // 기본 설정
    if (target.id === "nai-api-key") {
      handleNAIApiKeyChange(app, target.value);
    } else if (target.id === "nai-preferred-size") {
      handlePreferredSizeChange(app, target.value);
    } else if (target.id === "nai-min-delay") {
      handleMinDelayChange(app, parseInt(target.value) * 1000);
    } else if (target.id === "nai-max-additional-delay") {
      handleMaxAdditionalDelayChange(app, parseInt(target.value) * 1000);
    }
    // 모델 및 생성 설정
    else if (target.id === "nai-model") {
      handleModelChange(app, target.value);
    } else if (target.id === "nai-steps") {
      handleStepsChange(app, parseInt(target.value));
      updateSliderDisplay("nai-steps-value", target.value);
    } else if (target.id === "nai-scale") {
      handleScaleChange(app, parseFloat(target.value));
      updateSliderDisplay("nai-scale-value", target.value);
    } else if (target.id === "nai-sampler") {
      handleSamplerChange(app, target.value);
    } else if (target.id === "nai-noise-schedule") {
      handleNoiseScheduleChange(app, target.value);
    }
    // 캐릭터 및 이미지 설정
    else if (target.id === "nai-use-character-prompts") {
      handleUseCharacterPromptsToggle(app, target.checked);
    } else if (target.id === "nai-vibe-transfer-enabled") {
      handleVibeTransferToggle(app, target.checked);
    } else if (target.id === "nai-vibe-strength") {
      handleVibeStrengthChange(app, parseFloat(target.value));
      updateSliderDisplay("nai-vibe-strength-value", target.value);
    } else if (target.id === "nai-vibe-info-extracted") {
      handleVibeInfoExtractedChange(app, parseFloat(target.value));
      updateSliderDisplay("nai-vibe-info-value", target.value);
    }
    // 고급 설정
    else if (target.id === "nai-sm") {
      handleSmeaToggle(app, target.checked);
    } else if (target.id === "nai-sm-dyn") {
      handleSmeaDynToggle(app, target.checked);
    } else if (target.id === "nai-cfg-rescale") {
      handleCfgRescaleChange(app, parseFloat(target.value));
      updateSliderDisplay("nai-cfg-rescale-value", target.value);
    } else if (target.id === "nai-uncond-scale") {
      handleUncondScaleChange(app, parseFloat(target.value));
      updateSliderDisplay("nai-uncond-scale-value", target.value);
    } else if (target.id === "nai-dynamic-thresholding") {
      handleDynamicThresholdingToggle(app, target.checked);
    } else if (target.id === "nai-dt-percentile") {
      handleDtPercentileChange(app, parseFloat(target.value));
      updateSliderDisplay("nai-dt-percentile-value", target.value);
    } else if (target.id === "nai-dt-mimic-scale") {
      handleDtMimicScaleChange(app, parseFloat(target.value));
      updateSliderDisplay("nai-dt-mimic-scale-value", target.value);
    } else if (target.id === "nai-legacy") {
      handleLegacyToggle(app, target.checked);
    } else if (target.id === "nai-add-original-image") {
      handleAddOriginalImageToggle(app, target.checked);
    }
    // 커스텀 프롬프트
    else if (target.id === "nai-custom-positive") {
      handleCustomPositivePromptChange(app, target.value);
    } else if (target.id === "nai-custom-negative") {
      handleCustomNegativePromptChange(app, target.value);
    }
  });

  // 파일 업로드 이벤트
  document.addEventListener("change", (e) => {
    if (e.target.id === "nai-vibe-image-upload") {
      handleVibeImageUpload(app, e.target.files[0]);
    }
  });

  // 배치 생성 버튼 이벤트
  document.addEventListener("click", (e) => {
    if (e.target.closest("#generate-current-character-stickers") || e.target.closest("#generate-character-stickers")) {
      e.preventDefault();
      handleGenerateCurrentCharacterStickers(app);
    } else if (e.target.closest("#generate-all-characters-stickers")) {
      e.preventDefault();
      handleGenerateAllCharactersStickers(app);
    }
    // NAI 일괄 생성 목록 편집 이벤트
    else if (e.target.closest("#edit-nai-generation-list")) {
      e.preventDefault();
      handleShowNaiGenerationListEditor(app);
    } else if (e.target.closest("#add-nai-item-btn")) {
      e.preventDefault();
      handleAddItemToList(app);
    } else if (e.target.closest("#save-nai-generation-list")) {
      e.preventDefault();
      handleSaveNaiGenerationList(app);
    } else if (e.target.closest("#cancel-edit-nai-generation-list")) {
      e.preventDefault();
      handleCancelEditNaiGenerationList(app);
    } else if (e.target.closest("#reset-nai-generation-list")) {
      e.preventDefault();
      handleResetNaiGenerationList(app);
    } else if (e.target.closest(".remove-generation-item-btn")) {
      e.preventDefault();
      const naiItem = e.target.closest(".remove-generation-item-btn").dataset.naiItem;
      handleRemoveItemFromList(app, naiItem);
    }
  });

  // 설정 패널이 열릴 때 통계 업데이트
  document.addEventListener("click", (e) => {
    if (e.target.closest("#nav-nai")) {
      setTimeout(() => {
        updateNAIStats(app);
      }, 100);
    }
  });
}

/**
 * NAI API 키 변경 처리
 */
function handleNAIApiKeyChange(app, apiKey) {
  const naiSettings = app.state.settings.naiSettings || {};
  naiSettings.apiKey = apiKey.trim();
  
  app.setState({
    settings: {
      ...app.state.settings,
      naiSettings
    }
  });

  // 스티커 매니저 재초기화
  if (app.stickerManager) {
    app.stickerManager.initializeNAI();
  }
}


/**
 * 선호 크기 변경 처리
 */
function handlePreferredSizeChange(app, size) {
  const naiSettings = { ...(app.state.settings.naiSettings || {}) };
  naiSettings.preferredSize = size;
  
  // console.log('[NAI] 이미지 크기 변경:', size);
  // console.log('[NAI] 변경 후 naiSettings:', naiSettings);
  
  app.setState({
    settings: {
      ...app.state.settings,
      naiSettings
    }
  });
}

/**
 * 최소 대기 시간 변경 처리
 */
function handleMinDelayChange(app, delay) {
  const naiSettings = { ...(app.state.settings.naiSettings || {}) };
  naiSettings.minDelay = Math.max(5000, delay); // 최소 5초
  
  app.setState({
    settings: {
      ...app.state.settings,
      naiSettings
    }
  });
}

/**
 * 최대 추가 대기 시간 변경 처리
 */
function handleMaxAdditionalDelayChange(app, delay) {
  const naiSettings = { ...(app.state.settings.naiSettings || {}) };
  naiSettings.maxAdditionalDelay = Math.max(0, delay);
  
  app.setState({
    settings: {
      ...app.state.settings,
      naiSettings
    }
  });
}

/**
 * 진행 상황 모달 표시
 */
function showStickerProgressModal(app, progressState) {
  const modalHtml = renderStickerProgressModal(progressState);
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // 모달 이벤트 리스너 설정
  setupProgressModalEvents(app, progressState);
}

/**
 * 진행 상황 모달 업데이트
 */
function updateStickerProgressModal(app, progressState) {
  const existingModal = document.getElementById('sticker-progress-modal');
  if (existingModal) {
    const modalHtml = renderStickerProgressModal(progressState);
    existingModal.outerHTML = modalHtml;
    setupProgressModalEvents(app, progressState);
  }
}

/**
 * 진행 상황 모달 이벤트 설정
 */
function setupProgressModalEvents(app, progressState) {
  // 모달 닫기
  const closeButtons = document.querySelectorAll('#close-sticker-progress');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = document.getElementById('sticker-progress-modal');
      if (modal) modal.remove();
    });
  });

  // 재시도 버튼
  const retryButton = document.getElementById('retry-sticker-generation');
  if (retryButton) {
    retryButton.addEventListener('click', () => {
      // 재시도 로직 구현 (나중에 추가)
      // console.log('재시도 기능은 추후 구현됩니다.');
    });
  }

  // 취소 버튼
  const cancelButton = document.getElementById('cancel-sticker-generation');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      // console.log('[NAI] 스티커 생성 취소 요청');
      if (app.stickerManager && app.stickerManager.naiClient) {
        const cancelled = app.stickerManager.naiClient.cancelGeneration();
        if (cancelled) {
          // 모달 닫기
          const modal = document.getElementById('sticker-progress-modal');
          if (modal) modal.remove();
          
          // 알림 표시 (선택사항)
          // console.log('[NAI] 스티커 생성이 취소되었습니다');
        }
      }
    });
  }
}

/**
 * 현재 캐릭터의 스티커 생성
 */
async function handleGenerateCurrentCharacterStickers(app) {
  // 캐릭터 모달에서 호출되는 경우 editingCharacter 사용, 아니면 currentCharacter 사용
  const character = app.state.editingCharacter || app.state.currentCharacter;
  if (!character) {
    alert(t('naiHandlers.pleaseSelectCharacter'), "warning");
    return;
  }

  const button = document.getElementById("generate-current-character-stickers") || document.getElementById("generate-character-stickers");
  if (!button) return;

  // 커스텀 생성 목록 사용
  const generationList = app.state.settings.naiGenerationList || DEFAULT_EMOTIONS;
  
  // 진행 상황 모달 상태 초기화
  const progressState = {
    isVisible: true,
    character: character,
    emotions: generationList,
    currentIndex: 0,
    totalCount: generationList.length,
    currentEmotion: null,
    status: 'preparing',
    error: null,
    generatedStickers: [],
    failedEmotions: []
  };

  // 진행 상황 모달 표시
  showStickerProgressModal(app, progressState);

  try {
    // UI 상태 변경
    button.disabled = true;
    button.innerHTML = `
      <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>
      ${t('naiHandlers.generating')}
    `;
    if (window.lucide) window.lucide.createIcons();

    // 스티커 생성 (커스텀 목록 사용)
    const result = await app.stickerManager.generateBasicStickerSet(character, {
      emotions: generationList,
      onProgress: (progress) => {
        // 진행 상황 모달 업데이트
        progressState.currentIndex = progress.current || 0;
        progressState.currentEmotion = progress.emotion;
        progressState.status = progress.status;
        progressState.error = progress.error;

        if (progress.status === "completed" && progress.sticker) {
          progressState.generatedStickers.push(progress.sticker);
        } else if (progress.status === "error") {
          progressState.failedEmotions.push(progress.emotion);
        }

        // 모달 업데이트
        updateStickerProgressModal(app, progressState);
      }
    });

    // 최종 상태 업데이트
    progressState.status = result.failed.length === 0 ? 'completed' : 'error';
    progressState.currentIndex = progressState.totalCount;
    updateStickerProgressModal(app, progressState);

    // 결과 처리
    if (result.generated.length > 0) {
      alert(
        t('naiHandlers.stickersGenerated', { name: character.name, count: result.generated.length }),
        "success"
      );
    } else if (result.generated.length === 0 && result.failed.length === 0) {
      alert(result.message || t('naiHandlers.allStickersExist'), "info");
    }

    if (result.failed.length > 0) {
      alert(
        t('naiHandlers.stickerGenerationFailed', { count: result.failed.length }),
        "warning"
      );
    }

    // 통계 업데이트
    updateNAIStats(app);

    // 캐릭터 모달이 열려있다면 UI 업데이트 트리거
    if (app.state.showCharacterModal) {
      app.setState({}); // 빈 객체로 UI 리렌더링 트리거
    }

  } catch (error) {
    console.error("[NAI] 스티커 생성 실패:", error);
    
    // 에러 상태로 모달 업데이트
    progressState.status = 'error';
    progressState.error = error.message;
    updateStickerProgressModal(app, progressState);
    
    alert(t('naiHandlers.stickerGenerationError', { error: error.message }), "error");
  } finally {
    // UI 복원 - 어떤 버튼인지에 따라 다른 텍스트 사용
    button.disabled = false;
    if (button.id === "generate-character-stickers") {
      button.innerHTML = `
        <i data-lucide="image" class="w-4 h-4"></i>
${t('naiHandlers.emotionListGeneration')}
      `;
    } else {
      button.innerHTML = `
        <i data-lucide="user" class="w-4 h-4"></i>
        현재 캐릭터
      `;
    }
    if (window.lucide) window.lucide.createIcons();
  }
}

/**
 * 모든 캐릭터의 스티커 생성
 */
async function handleGenerateAllCharactersStickers(app) {
  const characters = app.state.characters;
  if (!characters || characters.length === 0) {
    alert("캐릭터가 없습니다.", "warning");
    return;
  }

  const button = document.getElementById("generate-all-characters-stickers");
  if (!button) return;

  // 커스텀 생성 목록 사용
  const generationList = app.state.settings.naiGenerationList || DEFAULT_EMOTIONS;

  // 확인 대화상자
  const confirmed = confirm(
    t('naiHandlers.emotionListBatchConfirm', { count: characters.length })
  );
  if (!confirmed) return;

  try {
    // UI 상태 변경
    button.disabled = true;
    button.innerHTML = `
      <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>
      전체 생성 중...
    `;
    if (window.lucide) window.lucide.createIcons();

    let totalGenerated = 0;
    let totalFailed = 0;

    // 스티커 생성 (커스텀 목록 사용)
    const result = await app.stickerManager.generateStickersForAllCharacters({
      emotions: generationList,
      onProgress: (progress) => {
        if (progress.type === "character") {
          alert(
            `${progress.character} 처리 중... (${progress.current}/${progress.total})`,
            "info"
          );
        } else if (progress.type === "sticker") {
          if (progress.status === "generating") {
            alert(
              `${progress.character}: ${progress.emotion} 스티커 생성 중...`,
              "info"
            );
          } else if (progress.status === "completed") {
            totalGenerated++;
          } else if (progress.status === "error") {
            totalFailed++;
          }
        }
      }
    });

    // 결과 처리
    const summary = result.summary;
    let message = `배치 생성 완료!\n`;
    message += `• 처리된 캐릭터: ${summary.totalCharacters}개\n`;
    message += `• 성공: ${summary.successCount}개\n`;
    message += `• 실패: ${summary.failCount}개`;

    if (totalGenerated > 0) {
      message += `\n• 생성된 스티커: ${totalGenerated}개`;
    }

    alert(message, summary.failCount === 0 ? "success" : "warning");

    // 통계 업데이트
    updateNAIStats(app);

  } catch (error) {
    console.error("[NAI] 배치 생성 실패:", error);
    alert(`배치 생성에 실패했습니다: ${error.message}`, "error");
  } finally {
    // UI 복원
    button.disabled = false;
    button.innerHTML = `
      <i data-lucide="users" class="w-4 h-4"></i>
      모든 캐릭터
    `;
    if (window.lucide) window.lucide.createIcons();
  }
}

/**
 * NAI 통계 정보 업데이트
 */
function updateNAIStats(app) {
  const statsContainer = document.getElementById("nai-stats-content");
  if (statsContainer) {
    statsContainer.innerHTML = renderNAIStats(app);
  }
}

/**
 * 슬라이더 값 표시 업데이트
 */
function updateSliderDisplay(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
}

/**
 * NAI 설정 업데이트 헬퍼 함수
 */
function updateNAISettings(app, updates) {
  const naiSettings = { ...app.state.settings.naiSettings, ...updates };
  
  app.setState({
    settings: {
      ...app.state.settings,
      naiSettings
    }
  });

  // 스티커 매니저 재초기화
  if (app.stickerManager) {
    app.stickerManager.initializeNAI();
  }
}

// === 모델 및 생성 설정 핸들러 ===

function handleModelChange(app, model) {
  updateNAISettings(app, { model });
}

function handleStepsChange(app, steps) {
  updateNAISettings(app, { steps: Math.max(1, Math.min(50, steps)) });
}

function handleScaleChange(app, scale) {
  updateNAISettings(app, { scale: Math.max(1, Math.min(30, scale)) });
}

function handleSamplerChange(app, sampler) {
  updateNAISettings(app, { sampler });
}

function handleNoiseScheduleChange(app, noiseSchedule) {
  updateNAISettings(app, { noise_schedule: noiseSchedule });
}

// === 캐릭터 및 이미지 설정 핸들러 ===

function handleUseCharacterPromptsToggle(app, enabled) {
  updateNAISettings(app, { useCharacterPrompts: enabled });
}

function handleVibeTransferToggle(app, enabled) {
  updateNAISettings(app, { vibeTransferEnabled: enabled });
  
  // UI 다시 렌더링 (조건부 섹션 표시/숨김)
  setTimeout(() => {
    if (app.state.showSettingsModal) {
      app.renderSettingsModal();
    }
  }, 100);
}

function handleVibeStrengthChange(app, strength) {
  updateNAISettings(app, { vibeTransferStrength: Math.max(0, Math.min(1, strength)) });
}

function handleVibeInfoExtractedChange(app, infoExtracted) {
  updateNAISettings(app, { vibeTransferInformationExtracted: Math.max(0, Math.min(1, infoExtracted)) });
}

async function handleVibeImageUpload(app, file) {
  if (!file) return;
  
  // 파일 크기 체크 (2MB 제한)
  if (file.size > 2 * 1024 * 1024) {
    alert("이미지 크기는 2MB 이하여야 합니다.", "error");
    return;
  }

  // 이미지를 Base64로 변환
  try {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1]; // data:image/... 부분 제거
      updateNAISettings(app, { vibeTransferImage: base64 });
      alert("Vibe Transfer 이미지가 업로드되었습니다.", "success");
    };
    reader.readAsDataURL(file);
  } catch (error) {
    alert("이미지 업로드에 실패했습니다.", "error");
    console.error("[NAI] Vibe 이미지 업로드 실패:", error);
  }
}

// === 고급 설정 핸들러 ===

function handleSmeaToggle(app, enabled) {
  updateNAISettings(app, { sm: enabled });
  // SMEA와 SMEA DYN은 상호 배타적
  if (enabled) {
    updateNAISettings(app, { sm_dyn: false });
    const smeaDynCheckbox = document.getElementById('nai-sm-dyn');
    if (smeaDynCheckbox) smeaDynCheckbox.checked = false;
  }
}

function handleSmeaDynToggle(app, enabled) {
  updateNAISettings(app, { sm_dyn: enabled });
  // SMEA와 SMEA DYN은 상호 배타적
  if (enabled) {
    updateNAISettings(app, { sm: false });
    const smeaCheckbox = document.getElementById('nai-sm');
    if (smeaCheckbox) smeaCheckbox.checked = false;
  }
}

function handleCfgRescaleChange(app, cfgRescale) {
  updateNAISettings(app, { cfg_rescale: Math.max(0, Math.min(1, cfgRescale)) });
}

function handleUncondScaleChange(app, uncondScale) {
  updateNAISettings(app, { uncond_scale: Math.max(0, Math.min(2, uncondScale)) });
}

function handleDynamicThresholdingToggle(app, enabled) {
  updateNAISettings(app, { dynamic_thresholding: enabled });
  
  // UI 다시 렌더링 (조건부 섹션 표시/숨김)
  setTimeout(() => {
    if (app.state.showSettingsModal) {
      app.renderSettingsModal();
    }
  }, 100);
}

function handleDtPercentileChange(app, percentile) {
  updateNAISettings(app, { 
    dynamic_thresholding_percentile: Math.max(0.9, Math.min(1, percentile)) 
  });
}

function handleDtMimicScaleChange(app, mimicScale) {
  updateNAISettings(app, { 
    dynamic_thresholding_mimic_scale: Math.max(1, Math.min(20, mimicScale)) 
  });
}

function handleLegacyToggle(app, enabled) {
  updateNAISettings(app, { legacy: enabled });
}

function handleAddOriginalImageToggle(app, enabled) {
  updateNAISettings(app, { add_original_image: enabled });
}

// === 커스텀 프롬프트 핸들러 ===

function handleCustomPositivePromptChange(app, prompt) {
  updateNAISettings(app, { customPositivePrompt: prompt });
}

function handleCustomNegativePromptChange(app, prompt) {
  updateNAISettings(app, { customNegativePrompt: prompt });
}

/**
 * 대화 중 자동 스티커 생성 (메인 채팅에서 호출)
 */
export async function handleAutoStickerGeneration(app, character, messageContent) {
  // NAI 자동 생성이 비활성화되어 있으면 리턴
  const naiSettings = app.state.settings.naiSettings;
  if (!naiSettings || !naiSettings.autoGenerate) {
    return;
  }

  // 스티커 매니저가 없으면 생성
  if (!app.stickerManager) {
    app.stickerManager = new StickerManager(app);
  }

  // 감정 분석 및 자동 생성
  try {
    const emotion = app.stickerManager.analyzeEmotion(messageContent);
    if (emotion && app.stickerManager.shouldGenerateSticker(character, emotion)) {
      // console.log(`[NAI] ${character.name}의 ${emotion} 스티커 자동 생성 시작...`);
      
      // 백그라운드에서 생성 (UI 블로킹하지 않음)
      app.stickerManager.autoGenerateSticker(character, emotion)
        .then((sticker) => {
          if (sticker) {
            alert(
              `${character.name}의 ${emotion} 스티커가 자동 생성되었습니다!`,
              "success"
            );
            
            // 캐릭터 모달이 열려있다면 UI 업데이트 트리거
            if (app.state.showCharacterModal && app.state.currentCharacter?.id === character.id) {
              app.setState({}); // 빈 객체로 UI 리렌더링 트리거
            }
          }
        })
        .catch((error) => {
          console.error(`[NAI] 자동 스티커 생성 실패:`, error);
        });
    }
  } catch (error) {
    console.error("[NAI] 감정 분석 실패:", error);
  }
}

// ===== NAI 일괄 생성 목록 편집 관련 핸들러 =====

/**
 * NAI 일괄 생성 목록 편집기 표시
 */
function handleShowNaiGenerationListEditor(app) {
  const displayDiv = document.getElementById("nai-generation-list-display");
  const editorDiv = document.getElementById("nai-generation-list-editor");
  
  if (!displayDiv || !editorDiv) return;

  // 현재 목록을 임시 저장
  const currentList = app.state.settings.naiGenerationList || DEFAULT_EMOTIONS.slice();
  app.tempNaiGenerationList = [...currentList];
  
  // UI 전환
  displayDiv.style.display = "none";
  editorDiv.classList.remove("hidden");
  
  // 편집 가능한 목록 렌더링
  renderEditableNaiGenerationList(app);
  
  // 입력 필드 포커스
  const input = document.getElementById("new-nai-item-input");
  if (input) input.focus();
}

/**
 * 편집 가능한 NAI 일괄 생성 목록 렌더링
 */
function renderEditableNaiGenerationList(app) {
  const listContainer = document.getElementById("nai-editable-list");
  if (!listContainer) return;

  // tempNaiGenerationList 초기화 (방어 코드)
  if (!app.tempNaiGenerationList) {
    app.tempNaiGenerationList = app.state.settings.naiGenerationList || DEFAULT_EMOTIONS.slice();
  }

  const currentList = app.tempNaiGenerationList;

  listContainer.innerHTML = currentList.map((naiItem, index) => {
    // 기존 문자열 형태와 새로운 객체 형태 모두 지원
    let displayText, itemKey;

    if (typeof naiItem === 'object') {
      // 새로운 3필드 구조
      displayText = `${naiItem.title} (${naiItem.emotion}${naiItem.action ? ', ' + naiItem.action : ''})`;
      itemKey = naiItem.title;
    } else {
      // 기존 문자열 구조 (하위 호환성)
      const itemLabels = {
        happy: "😊 기쁨",
        sad: "😢 슬픔",
        surprised: "😮 놀람",
        angry: "😠 분노",
        love: "💕 사랑",
        embarrassed: "😳 부끄러움",
        confused: "😕 혼란",
        sleepy: "😴 졸림",
        excited: "🤩 흥분",
        neutral: "😐 무표정"
      };
      displayText = itemLabels[naiItem] || naiItem;
      itemKey = naiItem;
    }

    return `
      <div class="flex items-center justify-between bg-gray-600/30 rounded-lg px-3 py-2">
        <div class="flex-1">
          <span class="text-sm text-gray-300">${displayText}</span>
          ${typeof naiItem === 'object' && naiItem.action ?
            `<div class="text-xs text-gray-400 mt-1">${naiItem.action}</div>` :
            ''
          }
        </div>
        <button
          class="remove-generation-item-btn p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
          data-nai-item="${itemKey}"
          data-index="${index}"
          title="${t('naiHandlers.removeNaiGenerationItem')}"
        >
          <i data-lucide="x" class="w-3 h-3 pointer-events-none"></i>
        </button>
      </div>
    `;
  }).join("");

  // 아이콘 초기화
  if (window.lucide) window.lucide.createIcons();
}

/**
 * 새 감정 추가
 */
function handleAddItemToList(app) {
  // 3개 필드에서 값 가져오기
  const titleInput = document.getElementById("new-nai-item-title");
  const emotionInput = document.getElementById("new-nai-item-emotion");
  const actionInput = document.getElementById("new-nai-item-action");

  if (!titleInput || !emotionInput || !actionInput) return;

  const title = titleInput.value.trim();
  const emotion = emotionInput.value.trim();
  const action = actionInput.value.trim();

  // 필수 필드 검증
  if (!title || !emotion) {
    app.showNotification(t('naiHandlers.naiGenerationItemRequired'), "warning");
    return;
  }

  // tempNaiGenerationList 초기화 (방어 코드)
  if (!app.tempNaiGenerationList) {
    app.tempNaiGenerationList = app.state.settings.naiGenerationList || DEFAULT_EMOTIONS.slice();
  }

  // 새로운 항목 객체 생성
  const newItem = {
    title: title,
    emotion: emotion,
    action: action || "" // 행동은 선택사항
  };

  // 중복 체크 (제목 기준)
  const existingItem = app.tempNaiGenerationList.find(item =>
    typeof item === 'object' ? item.title === title : item === title
  );

  if (existingItem) {
    app.showNotification(t('naiHandlers.naiGenerationItemAlreadyExists', { naiGenerationItem: title }), "warning");
    return;
  }

  // 목록에 추가
  app.tempNaiGenerationList.push(newItem);

  // UI 업데이트
  renderEditableNaiGenerationList(app);

  // 입력 필드 클리어
  titleInput.value = "";
  emotionInput.value = "";
  actionInput.value = "";
  titleInput.focus();

  // 성공 메시지
  app.showNotification(t('naiHandlers.naiGenerationItemAdded', { naiGenerationItem: title }));
}

/**
 * 감정 제거
 */
function handleRemoveItemFromList(app, naiItem) {
  // tempNaiGenerationList 초기화 (방어 코드)
  if (!app.tempNaiGenerationList) {
    app.tempNaiGenerationList = app.state.settings.naiGenerationList || DEFAULT_EMOTIONS.slice();
  }
  
  const index = app.tempNaiGenerationList.indexOf(naiItem);
  if (index !== -1) {
    app.tempNaiGenerationList.splice(index, 1);
    renderEditableNaiGenerationList(app);
    alert(t('naiHandlers.naiGenerationItemRemoved', { naiGenerationItem: naiItem }), "info");
  }
}

/**
 * 목록 저장
 */
function handleSaveNaiGenerationList(app) {
  // tempNaiGenerationList 초기화 (방어 코드)
  if (!app.tempNaiGenerationList) {
    app.tempNaiGenerationList = app.state.settings.naiGenerationList || DEFAULT_EMOTIONS.slice();
  }
  
  if (app.tempNaiGenerationList.length === 0) {
    alert(t('naiHandlers.naiGenerationListEmpty'), "warning");
    return;
  }
  
  // 설정에 저장
  app.handleNaiGenerationListChange(app.tempNaiGenerationList);
  
  // 편집 모드 종료
  handleCancelEditNaiGenerationList(app, false);
  
  // UI 업데이트
  setTimeout(() => {
    if (app.state.showSettingsModal && typeof app.renderSettingsModal === 'function') {
      app.renderSettingsModal();
    }
    // 모바일 설정 UI 업데이트
    if (app.state.showSettingsUI) {
      app.setState({}); // UI 강제 업데이트
    }
  }, 100);
  
  const count = app.tempNaiGenerationList ? app.tempNaiGenerationList.length : 0;
  alert(t('naiHandlers.naiGenerationListSaved', { count }), "success");
  
  // 임시 목록 정리
  delete app.tempNaiGenerationList;
}

/**
 * 편집 취소
 */
function handleCancelEditNaiGenerationList(app, showMessage = true) {
  const displayDiv = document.getElementById("nai-generation-list-display");
  const editorDiv = document.getElementById("nai-generation-list-editor");
  
  if (!displayDiv || !editorDiv) return;
  
  // UI 전환
  displayDiv.style.display = "";
  editorDiv.classList.add("hidden");
  
  // 임시 목록 정리
  delete app.tempNaiGenerationList;
  
  if (showMessage) {
    alert(t('naiHandlers.editCancelled'), "info");
  }
}

/**
 * 기본값으로 리셋
 */
function handleResetNaiGenerationList(app) {
  const confirmed = confirm(t('naiHandlers.resetToDefaultConfirm'));
  if (!confirmed) return;
  
  // 기본값으로 리셋
  app.tempNaiGenerationList = DEFAULT_EMOTIONS.slice();
  
  // UI 업데이트
  renderEditableNaiGenerationList(app);
  
  alert(t('naiHandlers.listResetToDefault'), "info");
}

/**
 * Enter 키 처리 (새 NAI 항목 추가)
 */
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.id === "new-nai-item-input") {
    e.preventDefault();
    const app = window.app; // 전역 app 객체 접근
    if (app) {
      handleAddItemToList(app);
    }
  }
});