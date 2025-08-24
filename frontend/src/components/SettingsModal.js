
import { t } from '../i18n.js';
import { PROVIDERS, PROVIDER_MODELS, DEFAULT_PROVIDER } from '../constants/providers.js';

function renderCurrentProviderSettings(app) {
    const { settings } = app.state;
    const provider = settings.apiProvider || DEFAULT_PROVIDER;
    const config = settings.apiConfigs?.[provider];
    
    // 레거시 호환성 처리 - 기존 apiKey/model을 gemini config로 마이그레이션
    if (!config && provider === PROVIDERS.GEMINI) {
        const legacyConfig = {
            apiKey: settings.apiKey || '',
            model: settings.model || 'gemini-2.5-flash',
            customModels: []
        };
        return renderProviderConfig(provider, legacyConfig);
    }
    
    if (!config) {
        return renderProviderConfig(provider, {
            apiKey: '',
            model: '',
            customModels: [],
            baseUrl: provider === PROVIDERS.CUSTOM_OPENAI ? '' : undefined
        });
    }
    
    return renderProviderConfig(provider, config);
}

function renderProviderConfig(provider, config) {
    const models = PROVIDER_MODELS[provider] || [];
    const customModels = config.customModels || [];
    
    return `
        <div class="space-y-4">
            <!-- API 키 입력 -->
            <div>
                <label class="flex items-center text-sm font-medium text-gray-300 mb-2">
                    <i data-lucide="key" class="w-4 h-4 mr-2"></i>API 키
                </label>
                <input 
                    type="password" 
                    id="settings-api-key" 
                    value="${config.apiKey || ''}" 
                    placeholder="API 키를 입력하세요" 
                    class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm"
                />
            </div>
            
            ${provider === PROVIDERS.CUSTOM_OPENAI ? `
                <!-- Custom OpenAI Base URL -->
                <div>
                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2">
                        <i data-lucide="link" class="w-4 h-4 mr-2"></i>Base URL
                    </label>
                    <input 
                        type="text" 
                        id="settings-base-url" 
                        value="${config.baseUrl || ''}" 
                        placeholder="https://api.openai.com/v1" 
                        class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm"
                    />
                </div>
            ` : ''}
            
            <!-- Advanced Settings for All Providers -->
                <div class="space-y-4 mt-4 p-4 bg-gray-700/30 rounded-xl">
                    <h4 class="text-sm font-medium text-gray-300 mb-3 flex items-center">
                        <i data-lucide="settings" class="w-4 h-4 mr-2"></i>고급 설정
                    </h4>
                    
                    <!-- Max Tokens -->
                    <div>
                        <label class="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                            <span>최대 토큰 수</span>
                            <span class="text-blue-400 font-mono text-xs" id="max-tokens-value">${config.maxTokens || 4096}</span>
                        </label>
                        <input 
                            type="range" 
                            id="settings-max-tokens" 
                            min="512" 
                            max="8192" 
                            step="256" 
                            value="${config.maxTokens || 4096}" 
                            class="w-full"
                        />
                        <div class="flex justify-between text-xs text-gray-400 mt-1">
                            <span>512</span>
                            <span>8192</span>
                        </div>
                    </div>
                    
                    <!-- Temperature -->
                    <div>
                        <label class="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                            <span>창의성 (Temperature)</span>
                            <span class="text-blue-400 font-mono text-xs" id="temperature-value">${config.temperature !== undefined ? config.temperature : 0.8}</span>
                        </label>
                        <input 
                            type="range" 
                            id="settings-temperature" 
                            min="0" 
                            max="2" 
                            step="0.1" 
                            value="${config.temperature !== undefined ? config.temperature : 0.8}" 
                            class="w-full"
                        />
                        <div class="flex justify-between text-xs text-gray-400 mt-1">
                            <span>보수적 (0.0)</span>
                            <span>창의적 (2.0)</span>
                        </div>
                    </div>
                    
                    <!-- Profile Generation Settings -->
                    <div class="border-t border-gray-600 pt-4 mt-4">
                        <h5 class="text-xs font-medium text-gray-400 mb-3">프로필 생성 설정</h5>
                        
                        <div class="space-y-3">
                            <!-- Profile Max Tokens -->
                            <div>
                                <label class="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                                    <span>프로필 최대 토큰</span>
                                    <span class="text-blue-400 font-mono text-xs" id="profile-max-tokens-value">${config.profileMaxTokens || 1024}</span>
                                </label>
                                <input 
                                    type="range" 
                                    id="settings-profile-max-tokens" 
                                    min="256" 
                                    max="2048" 
                                    step="128" 
                                    value="${config.profileMaxTokens || 1024}" 
                                    class="w-full"
                                />
                                <div class="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>256</span>
                                    <span>2048</span>
                                </div>
                            </div>
                            
                            <!-- Profile Temperature -->
                            <div>
                                <label class="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                                    <span>프로필 창의성</span>
                                    <span class="text-blue-400 font-mono text-xs" id="profile-temperature-value">${config.profileTemperature !== undefined ? config.profileTemperature : 1.2}</span>
                                </label>
                                <input 
                                    type="range" 
                                    id="settings-profile-temperature" 
                                    min="0.5" 
                                    max="2" 
                                    step="0.1" 
                                    value="${config.profileTemperature !== undefined ? config.profileTemperature : 1.2}" 
                                    class="w-full"
                                />
                                <div class="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>일관적 (0.5)</span>
                                    <span>다양함 (2.0)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            
            <!-- 모델 선택 -->
            <div>
                <label class="flex items-center text-sm font-medium text-gray-300 mb-2">
                    <i data-lucide="cpu" class="w-4 h-4 mr-2"></i>모델
                </label>
                
                ${models.length > 0 ? `
                    <div class="grid grid-cols-1 gap-2 mb-3">
                        ${models.map(model => `
                            <button 
                                type="button" 
                                class="model-select-btn px-3 py-2 text-left text-sm rounded-lg transition-colors ${config.model === model ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}" 
                                data-model="${model}"
                            >
                                ${model}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
                
                <!-- 커스텀 모델 입력 -->
                <div class="flex gap-2">
                    <input 
                        type="text" 
                        id="custom-model-input" 
                        placeholder="커스텀 모델명 입력" 
                        class="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm"
                    />
                    <button 
                        type="button" 
                        id="add-custom-model-btn" 
                        class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1"
                    >
                        <i data-lucide="plus" class="w-4 h-4"></i>추가
                    </button>
                </div>
                
                ${customModels.length > 0 ? `
                    <div class="mt-3 space-y-1">
                        <label class="text-xs text-gray-400">커스텀 모델</label>
                        ${customModels.map((model, index) => `
                            <div class="flex items-center gap-2">
                                <button 
                                    type="button" 
                                    class="model-select-btn flex-1 px-3 py-2 text-left text-sm rounded-lg transition-colors ${config.model === model ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}" 
                                    data-model="${model}"
                                >
                                    ${model}
                                </button>
                                <button 
                                    type="button" 
                                    class="remove-custom-model-btn px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm" 
                                    data-index="${index}"
                                >
                                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

export function renderSnapshotList(app) {
    return `
        ${app.state.settingsSnapshots.map(snapshot => `
            <div class="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg">
                <span class="text-sm text-gray-300">${new Date(snapshot.timestamp).toLocaleString('ko-KR')}</span>
                <div class="flex items-center gap-2">
                    <button data-timestamp="${snapshot.timestamp}" class="restore-snapshot-btn p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors" title="복원"><i data-lucide="history" class="w-4 h-4"></i></button>
                    <button data-timestamp="${snapshot.timestamp}" class="delete-snapshot-btn p-1.5 bg-red-600 hover:bg-red-700 rounded text-white transition-colors" title="삭제"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>
        `).join('')}
        ${app.state.settingsSnapshots.length === 0 ? '<p class="text-sm text-gray-500 text-center py-2">저장된 스냅샷이 없습니다.</p>' : ''}
    `;
}

export function renderSettingsModal(app) {
    const { settings } = app.state;
    return `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-gray-800 rounded-2xl w-full max-w-md mx-4 flex flex-col" style="max-height: 90vh;">
                <div class="flex items-center justify-between p-6 border-b border-gray-700 shrink-0">
                    <h3 class="text-lg font-semibold text-white">설정</h3>
                    <button id="close-settings-modal" class="p-1 hover:bg-gray-700 rounded-full"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div class="p-6 space-y-2 overflow-y-auto" id="settings-modal-content">
                    <details data-section="ai" class="group border-b border-gray-700 pb-2" ${app.state.openSettingsSections.includes('ai') ? 'open' : ''}>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">AI 설정</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div>
                                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2"><i data-lucide="globe" class="w-4 h-4 mr-2"></i>AI 제공업체</label>
                                    <select id="settings-api-provider" class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm">
                                        <option value="gemini" ${(settings.apiProvider || 'gemini') === 'gemini' ? 'selected' : ''}>Google Gemini</option>
                                        <option value="claude" ${(settings.apiProvider || 'gemini') === 'claude' ? 'selected' : ''}>Anthropic Claude</option>
                                        <option value="openai" ${(settings.apiProvider || 'gemini') === 'openai' ? 'selected' : ''}>OpenAI ChatGPT</option>
                                        <option value="grok" ${(settings.apiProvider || 'gemini') === 'grok' ? 'selected' : ''}>xAI Grok</option>
                                        <option value="openrouter" ${(settings.apiProvider || 'gemini') === 'openrouter' ? 'selected' : ''}>OpenRouter</option>
                                        <option value="custom_openai" ${(settings.apiProvider || 'gemini') === 'custom_openai' ? 'selected' : ''}>Custom OpenAI</option>
                                    </select>
                                </div>
                                <div class="provider-settings-container">${renderCurrentProviderSettings(app)}</div>
                                
                                
                                <div>
                                    <button id="open-prompt-modal" class="w-full mt-2 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                        <i data-lucide="file-pen-line" class="w-4 h-4"></i> 프롬프트 수정
                                    </button>
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="scale" class="group border-b border-gray-700 pb-2" ${app.state.openSettingsSections.includes('scale') ? 'open' : ''}>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">배율</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div>
                                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2"><i data-lucide="type" class="w-4 h-4 mr-2"></i>UI 크기</label>
                                    <input id="settings-font-scale" type="range" min="0.8" max="1.4" step="0.1" value="${settings.fontScale}" class="w-full">
                                    <div class="flex justify-between text-xs text-gray-400 mt-1"><span>작게</span><span>크게</span></div>
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="persona" class="group border-b border-gray-700 pb-2" ${app.state.openSettingsSections.includes('persona') ? 'open' : ''}>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">당신의 페르소나</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div>
                                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2"><i data-lucide="user" class="w-4 h-4 mr-2"></i>당신을 어떻게 불러야 할까요?</label>
                                    <input id="settings-user-name" type="text" placeholder="이름, 혹은 별명을 적어주세요" value="${settings.userName}" class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm" />
                                </div>
                                <div>
                                    <label class="flex items-center text-sm font-medium text-gray-300 mb-2"><i data-lucide="brain-circuit" class="w-4 h-4 mr-2"></i>당신은 어떤 사람인가요?</label>
                                    <textarea id="settings-user-desc" placeholder="어떤 사람인지 알려주세요" class="w-full px-4 py-3 bg-gray-700 text-white rounded-xl border-0 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-sm" rows="3">${settings.userDescription}</textarea>
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="proactive" class="group border-b border-gray-700 pb-2" ${app.state.openSettingsSections.includes('proactive') ? 'open' : ''}>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">선톡 설정</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div class="py-2">
                                    <label class="flex items-center justify-between text-sm font-medium text-gray-300 cursor-pointer">
                                        <span class="flex items-center"><i data-lucide="message-square-plus" class="w-4 h-4 mr-2"></i>연락처 내 선톡 활성화</span>
                                        <div class="relative inline-block w-10 align-middle select-none">
                                            <input type="checkbox" name="toggle" id="settings-proactive-toggle" ${settings.proactiveChatEnabled ? 'checked' : ''} class="absolute opacity-0 w-0 h-0 peer"/>
                                            <label for="settings-proactive-toggle" class="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-blue-600"></label>
                                            <span class="absolute left-0.5 top-0.5 block w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                        </div>
                                    </label>
                                </div>
                                <div class="py-2 border-t border-gray-700 mt-2 pt-2">
                                    <label class="flex items-center justify-between text-sm font-medium text-gray-300 cursor-pointer">
                                        <span class="flex items-center"><i data-lucide="shuffle" class="w-4 h-4 mr-2"></i>랜덤 선톡 활성화</span>
                                        <div class="relative inline-block w-10 align-middle select-none">
                                            <input type="checkbox" name="toggle" id="settings-random-first-message-toggle" ${settings.randomFirstMessageEnabled ? 'checked' : ''} class="absolute opacity-0 w-0 h-0 peer"/>
                                            <label for="settings-random-first-message-toggle" class="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-blue-600"></label>
                                            <span class="absolute left-0.5 top-0.5 block w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                        </div>
                                    </label>
                                    <div id="random-chat-options" class="mt-4 space-y-4" style="display: ${settings.randomFirstMessageEnabled ? 'block' : 'none'}">
                                        <div>
                                            <label class="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
                                                <span>생성할 인원 수</span>
                                                <span id="random-character-count-label" class="text-blue-400 font-semibold">${settings.randomCharacterCount}명</span>
                                            </label>
                                            <input id="settings-random-character-count" type="range" min="1" max="5" step="1" value="${settings.randomCharacterCount}" class="w-full">
                                        </div>
                                        <div>
                                            <label class="text-sm font-medium text-gray-300 mb-2 block">선톡 시간 간격 (분 단위)</label>
                                            <div class="flex items-center gap-2">
                                                <input id="settings-random-frequency-min" type="number" min="1" class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm" placeholder="최소" value="${settings.randomMessageFrequencyMin}">
                                                <span class="text-gray-400">-</span>
                                                <input id="settings-random-frequency-max" type="number" min="1" class="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-blue-500/50 text-sm" placeholder="최대" value="${settings.randomMessageFrequencyMax}">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="snapshots" class="group border-b border-gray-700 pb-2" ${app.state.openSettingsSections.includes('snapshots') ? 'open' : ''}>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">설정 스냅샷</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div class="py-2">
                                    <label class="flex items-center justify-between text-sm font-medium text-gray-300 cursor-pointer">
                                        <span class="flex items-center"><i data-lucide="camera" class="w-4 h-4 mr-2"></i>스냅샷 활성화</span>
                                        <div class="relative inline-block w-10 align-middle select-none">
                                            <input type="checkbox" name="toggle" id="settings-snapshots-toggle" ${settings.snapshotsEnabled ? 'checked' : ''} class="absolute opacity-0 w-0 h-0 peer"/>
                                            <label for="settings-snapshots-toggle" class="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-blue-600"></label>
                                            <span class="absolute left-0.5 top-0.5 block w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                        </div>
                                    </label>
                                </div>
                                <div id="snapshots-list" class="space-y-2" style="display: ${settings.snapshotsEnabled ? 'block' : 'none'}">
                                    ${renderSnapshotList(app)}
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="debug" class="group border-b border-gray-700 pb-2" ${app.state.openSettingsSections.includes('debug') ? 'open' : ''}>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">디버그 로그</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-4">
                                <div class="py-2">
                                    <label class="flex items-center justify-between text-sm font-medium text-gray-300 cursor-pointer">
                                        <span class="flex items-center"><i data-lucide="activity" class="w-4 h-4 mr-2"></i>디버그 로그 활성화</span>
                                        <div class="relative inline-block w-10 align-middle select-none">
                                            <input type="checkbox" name="toggle" id="settings-enable-debug-logs" ${app.state.enableDebugLogs ? 'checked' : ''} onchange="window.personaApp.setState({ enableDebugLogs: this.checked, settings: { ...window.personaApp.state.settings, enableDebugLogs: this.checked } })" class="absolute opacity-0 w-0 h-0 peer"/>
                                            <label for="settings-enable-debug-logs" class="block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer peer-checked:bg-blue-600"></label>
                                            <span class="absolute left-0.5 top-0.5 block w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                        </div>
                                    </label>
                                    <p class="text-xs text-gray-500 mt-2">AI 응답 과정의 상세 로그를 수집합니다. 성능에 영향을 줄 수 있습니다.</p>
                                </div>
                                <div class="py-2 border-t border-gray-700 mt-2 pt-2 space-y-2">
                                    <div class="flex items-center justify-between text-sm text-gray-400">
                                        <span>현재 로그 개수</span>
                                        <span class="font-mono">${app.state.debugLogs ? app.state.debugLogs.length : 0}/1000</span>
                                    </div>
                                    <div class="flex gap-2">
                                        <button id="view-debug-logs" class="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                            <i data-lucide="bar-chart-3" class="w-4 h-4 pointer-events-none"></i>로그 보기
                                        </button>
                                        <button id="clear-debug-logs-btn" class="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                            <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>로그 삭제
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </details>
                    <details data-section="data" class="group" ${app.state.openSettingsSections.includes('data') ? 'open' : ''}>
                        <summary class="flex items-center justify-between cursor-pointer list-none py-2">
                            <span class="text-base font-medium text-gray-200">데이터 관리</span>
                            <i data-lucide="chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180"></i>
                        </summary>
                        <div class="content-wrapper">
                            <div class="content-inner pt-4 space-y-3">
                                <!-- 백업 및 복원 -->
                                <div class="space-y-2">
                                    <button id="backup-data-btn" class="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                        <i data-lucide="download" class="w-4 h-4"></i> 백업하기
                                    </button>
                                    <button id="restore-data-btn" class="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                        <i data-lucide="upload" class="w-4 h-4"></i> 불러오기
                                    </button>
                                </div>
                                
                                <!-- 구분선 -->
                                <div class="border-t border-gray-600"></div>
                                
                                <!-- 데이터 초기화 -->
                                <div class="space-y-2">
                                    <div class="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                                        <div class="flex items-start gap-2">
                                            <i data-lucide="alert-triangle" class="w-4 h-4 text-red-400 mt-0.5 shrink-0"></i>
                                            <div class="text-xs text-gray-300">
                                                <p class="font-medium text-red-400 mb-1">주의사항</p>
                                                <p>모든 데이터가 삭제됩니다: 캐릭터, 채팅 기록, 설정, API 키</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button id="reset-all-data-btn" class="w-full py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i> 모든 데이터 초기화
                                    </button>
                                </div>
                            </div>
                        </div>
                    </details>
                </div>
                <div class="p-6 mt-auto border-t border-gray-700 shrink-0 flex justify-end space-x-3">
                    <button id="close-settings-modal" class="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">취소</button>
                    <button id="save-settings" class="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">완료</button>
                </div>
            </div>
        </div>
    `;
}


/**
 * Setup event listeners for Settings Modal
 * 관심사 분리 원칙에 따라 이벤트 핸들링을 별도 함수로 분리
 */
export function setupSettingsModalEventListeners() {
    // View debug logs button
    const viewDebugLogsBtn = document.getElementById('view-debug-logs');
    if (viewDebugLogsBtn) {
        viewDebugLogsBtn.addEventListener('click', () => {
            window.personaApp.setState({ showSettingsModal: false, showDebugLogsModal: true });
        });
    }

    // Clear debug logs button in settings
    const clearDebugLogsBtnSettings = document.getElementById('clear-debug-logs-btn');
    if (clearDebugLogsBtnSettings) {
        clearDebugLogsBtnSettings.addEventListener('click', () => {
            console.log('로그 삭제 버튼 클릭됨');
            window.personaApp.clearDebugLogs();
        });
    }

    // Custom OpenAI advanced settings event listeners
    setupCustomOpenAIEventListeners();

    // Data management event listeners
    setupDataManagementEventListeners();
}

function setupCustomOpenAIEventListeners() {
    // Max Tokens slider
    const maxTokensSlider = document.getElementById('settings-max-tokens');
    const maxTokensValue = document.getElementById('max-tokens-value');
    if (maxTokensSlider && maxTokensValue) {
        maxTokensSlider.addEventListener('input', (e) => {
            maxTokensValue.textContent = e.target.value;
        });
    }

    // Temperature slider
    const temperatureSlider = document.getElementById('settings-temperature');
    const temperatureValue = document.getElementById('temperature-value');
    if (temperatureSlider && temperatureValue) {
        temperatureSlider.addEventListener('input', (e) => {
            temperatureValue.textContent = parseFloat(e.target.value).toFixed(1);
        });
    }

    // Profile Max Tokens slider
    const profileMaxTokensSlider = document.getElementById('settings-profile-max-tokens');
    const profileMaxTokensValue = document.getElementById('profile-max-tokens-value');
    if (profileMaxTokensSlider && profileMaxTokensValue) {
        profileMaxTokensSlider.addEventListener('input', (e) => {
            profileMaxTokensValue.textContent = e.target.value;
        });
    }

    // Profile Temperature slider
    const profileTemperatureSlider = document.getElementById('settings-profile-temperature');
    const profileTemperatureValue = document.getElementById('profile-temperature-value');
    if (profileTemperatureSlider && profileTemperatureValue) {
        profileTemperatureSlider.addEventListener('input', (e) => {
            profileTemperatureValue.textContent = parseFloat(e.target.value).toFixed(1);
        });
    }
}


function setupDataManagementEventListeners() {
    // Reset all data button
    const resetAllDataBtn = document.getElementById('reset-all-data-btn');
    if (resetAllDataBtn) {
        resetAllDataBtn.addEventListener('click', async () => {
            const confirmed = confirm(
                '모든 데이터를 초기화하시겠습니까?\\n\\n' +
                '⚠️ 다음 데이터가 모두 삭제됩니다:\\n' +
                '• 모든 캐릭터 정보\\n' +
                '• 모든 채팅 기록\\n' +
                '• 사용자 설정 (API 키 포함)\\n' +
                '• 스티커 데이터\\n' +
                '• 디버그 로그\\n\\n' +
                '이 작업은 되돌릴 수 없습니다!'
            );
            
            if (confirmed) {
                const doubleConfirmed = confirm(
                    '정말로 모든 데이터를 삭제하시겠습니까?\\n\\n' +
                    '백업을 하지 않았다면 모든 데이터를 잃게 됩니다.\\n\\n' +
                    '마지막 확인: 모든 데이터를 삭제하시겠습니까?'
                );
                
                if (doubleConfirmed) {
                    try {
                        await window.personaApp.resetAllData();
                        alert('모든 데이터가 초기화되었습니다. 페이지를 새로고침합니다.');
                        location.reload();
                    } catch (error) {
                        alert('데이터 초기화에 실패했습니다: ' + error.message);
                    }
                }
            }
        });
    }
}
