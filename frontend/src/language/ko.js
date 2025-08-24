export const ko = {
    common: {
        cancel: '취소',
        save: '저장',
        confirm: '확인',
        close: '닫기',
        delete: '삭제',
        edit: '수정',
        done: '완료',
    },
    characterModal: {
        memoryPlaceholder: '기억할 내용을 입력하세요...',
        noStickers: '아직 스티커가 없습니다.',
        editStickerName: '이름 변경',
        deleteSticker: '삭제',
        addContact: '연락처 추가',
        editContact: '연락처 수정',
        profileImage: '프로필 이미지',
        importContact: '연락처 불러오기',
        shareContact: '연락처 공유하기',
        nameLabel: '이름',
        namePlaceholder: '이름을 입력하세요',
        promptLabel: '인물 정보',
        promptPlaceholder: '특징, 배경, 관계, 기억 등을 자유롭게 서술해주세요.',
        proactiveToggle: '개별 선톡 허용',
        advancedSettings: '추가 설정',
        sticker: '스티커',
        addSticker: '스티커<br>추가',
        deselect: '선택<br>해제',
        selectMode: '선택<br>모드',
        selectAll: '전체<br>선택',
        deleteSelected: '삭제<br>(<span id="selected-count">0</span>)',
        stickerSupport: 'jpg, gif, png, bmp, webp, webm, mp4, mp3 지원 (개당 최대 30MB)',
        stickerCount: '스티커: {{count}}개',
        totalStorage: '전체 저장 용량: ',
        totalSize: '총 용량: ',
        memory: '메모리',
        addMemory: '메모리 추가',
        responseSpeed: '메시지 응답성',
    },
    characterModalSlider: {
        responseTime: {
            description: '응답 속도',
            low: '빠름',
            high: '느림'
        },
        thinkingTime: {
            description: '사고 시간',
            low: '짧음',
            high: '김'
        },
        reactivity: {
            description: '반응성',
            low: '낮음',
            high: '높음'
        },
        tone: {
            description: '어조',
            low: '차분함',
            high: '활발함'
        }
    },
    modal: {
        promptSaveComplete: {
            title: '완료',
            message: '프롬프트가 저장되었습니다.'
        },
        characterNameDescriptionNotFulfilled: {
            title: '입력 오류',
            message: '이름과 설명을 모두 입력해주세요.'
        },
        characterDeleteConfirm: {
            title: '연락처 삭제',
            message: '정말로 이 연락처를 삭제하시겠습니까?'
        },
        imageFileSizeExceeded: {
            title: '파일 크기 초과',
            message: '이미지 파일 크기가 너무 큽니다. (최대 30MB)'
        },
        imageProcessingError: {
            title: '이미지 처리 오류',
            message: '이미지를 처리하는 중 오류가 발생했습니다.'
        },
        apiKeyRequired: {
            title: 'API 키 필요',
            message: 'AI 응답을 받으려면 API 키를 설정해주세요.'
        },
        messageGroupDeleteConfirm: {
            title: '메시지 삭제',
            message: '이 메시지를 삭제하시겠습니까?'
        },
        messageEmptyError: {
            title: '메시지 오류',
            message: '메시지가 비어있습니다.'
        },
        characterCardNoNameError: {
            title: '이름 오류',
            message: '연락처 이름이 없어서 저장할 수 없습니다.'
        },
        characterCardNoAvatarImageError: {
            title: '오류',
            message: '아바타 이미지가 없어서 연락처를 저장할 수 없습니다.'
        },
        avatarImageLoadError: {
            title: '이미지 로드 오류',
            message: '아바타 이미지를 로드할 수 없습니다.'
        },
        avatarLoadSuccess: {
            title: '성공',
            message: '아바타가 성공적으로 로드되었습니다.'
        },
        characterCardNoAvatarImageInfo: {
            title: '정보',
            message: '아바타 이미지가 없습니다.'
        },
        backupComplete: {
            title: '백업 완료',
            message: '데이터가 성공적으로 백업되었습니다.'
        },
        backupFailed: {
            title: '백업 실패',
            message: '데이터 백업에 실패했습니다.'
        },
        restoreConfirm: {
            title: '데이터 복원',
            message: '기존 데이터를 모두 덮어쓰시겠습니까?'
        },
        restoreComplete: {
            title: '복원 완료',
            message: '데이터가 성공적으로 복원되었습니다.'
        },
        restoreFailed: {
            title: '복원 실패',
            message: '데이터 복원에 실패했습니다.'
        },
        promptBackupComplete: {
            title: '프롬프트 백업 완료',
            message: '프롬프트가 성공적으로 백업되었습니다.'
        },
        promptBackupFailed: {
            title: '프롬프트 백업 실패',
            message: '프롬프트 백업에 실패했습니다.'
        },
        promptRestoreConfirm: {
            title: '프롬프트 복원',
            message: '기존 프롬프트를 덮어쓰시겠습니까?'
        },
        promptRestoreFailed: {
            title: '프롬프트 복원 실패',
            message: '프롬프트 복원에 실패했습니다.'
        }
    },
    chat: {
        messageGenerationError: 'AI 응답 생성 중 오류가 발생했습니다.'
    },
    confirm: {
        cancel: '취소',
        confirm: '확인',
    },
    mainChat: {
        uploadPhoto: '사진 업로드',
        addCaption: '캡션 추가...',
        stickerMessagePlaceholder: '스티커와 함께 보낼 메시지 (선택사항)...',
        messagePlaceholder: '메시지를 입력하세요...',
        stickerLabel: '스티커: ',
        personaStickers: '페르소나 스티커',
        addSticker: '스티커 추가',
        addStickerPrompt: '스티커를 추가해보세요',
        addStickerButton: '스티커 추가하기',
        deletedSticker: '[삭제된 스티커: ',
        audio: '오디오',
        sticker: '스티커',
        selectCharacter: '상대를 선택하세요',
        selectCharacterPrompt: '사이드 바에서 상대를 선택하여 메시지를 보내세요<br/>혹은 새로운 상대를 초대하세요',
    },
    promptModal: {
        title: '프롬프트 수정',
        mainChatPrompt: '메인 채팅 프롬프트',
        systemRules: '# 시스템 규칙 (System Rules)',
        roleAndObjective: '# AI 역할 및 목표 (Role and Objective)',
        memoryGeneration: '## 메모리 생성 (Memory Generation)',
        characterActing: '## 캐릭터 연기 (Character Acting)',
        messageWriting: '## 메시지 작성 스타일 (Message Writing Style)',
        language: '## 언어 (Language)',
        additionalInstructions: '## 추가 지시사항 (Additional Instructions)',
        stickerUsage: '## 스티커 사용법 (Sticker Usage)',
        resetToDefault: '기본값으로 되돌리기',
        randomFirstMessagePrompt: '랜덤 선톡 캐릭터 생성 프롬프트',
        profileCreationRules: '# 캐릭터 생성 규칙 (Profile Creation Rules)',
        backupPrompts: '프롬프트 백업',
        restorePrompts: '프롬프트 불러오기',
    },
    settings: {
        restore: '복원',
        delete: '삭제',
        noSnapshots: '저장된 스냅샷이 없습니다.',
        title: '설정',
        aiSettings: 'AI 설정',
        apiKey: 'API 키',
        apiKeyPlaceholder: 'Gemini API 키를 입력하세요',
        aiModel: 'AI 모델',
        scale: '배율',
        uiSize: 'UI 크기',
        small: '작게',
        large: '크게',
        yourPersona: '당신의 페르소나',
        yourName: '당신을 어떻게 불러야 할까요?',
        yourNamePlaceholder: '이름, 혹은 별명을 적어주세요',
        yourDescription: '당신은 어떤 사람인가요?',
        yourDescriptionPlaceholder: '어떤 사람인지 알려주세요',
        proactiveSettings: '선톡 설정',
        proactiveChat: '연락처 내 선톡 활성화',
        randomFirstMessage: '랜덤 선톡 활성화',
        characterCount: '생성할 인원 수',
        characterCountUnit: '명',
        messageFrequency: '선톡 시간 간격 (분 단위)',
        min: '최소',
        max: '최대',
        snapshots: '설정 스냅샷',
        enableSnapshots: '스냅샷 활성화',
        dataManagement: '데이터 관리',
        backup: '백업하기',
        restoreData: '불러오기',
        language: '언어',
        languageKorean: '한국어',
        languageEnglish: '영어'
    },
    sidebar: {
        startNewChat: '새로운 채팅 시작',
        imageSent: '사진을 보냈습니다',
        newChatRoom: '새 채팅방',
        unknownCharacter: '알 수 없는 상대',
        chatRoomCount: '개의 채팅방',
        startChatting: '채팅을 시작해보세요',
        stickerSent: '스티커를 보냈습니다',
        rename: '이름 바꾸기',
        deleteChatRoom: '채팅방 삭제',
        title: '아리스톡',
        description: '상대를 초대/대화 하세요',
        searchPlaceholder: '검색하기...',
        invite: '초대하기',
    },
    defaultCharacter: {
        name: '한서연'
    },
    modal: {
        noSpaceError: {
            title: "저장 공간 부족",
            message: "브라우저의 저장 공간이 가득 찼습니다. 오래된 대화를 삭제하거나 데이터를 백업 후 초기화해주세요.",
            message2: "저장 공간이 부족합니다."
        },
        saveFailed: {
            title: "저장 실패",
            message: "데이터 저장에 실패했습니다. 브라우저 캐시를 정리해주세요."
        },
        localStorageSaveError: {
            title: "저장 오류",
            message: "데이터를 저장하는 중 오류가 발생했습니다."
        },
        promptSaveComplete: {
            title: "저장 완료",
            message: "프롬프트가 성공적으로 저장되었습니다."
        },
        characterNameDescriptionNotFulfilled: {
            title: "입력 오류",
            message: "캐릭터 이름과 프롬프트는 비워둘 수 없습니다."
        },
        characterDeleteConfirm: {
            title: "캐릭터 삭제",
            message: "정말로 이 캐릭터를 삭제하시겠습니까? 대화 내용도 함께 삭제됩니다."
        },
        imageFileSizeExceeded: {
            title: "파일 크기 초과",
            message: "이미지 파일은 5MB를 초과할 수 없습니다."
        },
        imageProcessingError: {
            title: "이미지 오류",
            message: "이미지를 처리하는 중 오류가 발생했습니다."
        },
        apiKeyRequired: {
            title: "API 키 필요",
            message: "API 키가 설정되지 않았습니다. 설정 메뉴에서 API 키를 입력해주세요."
        },
        messageGroupDeleteConfirm: {
            title: "메시지 그룹 삭제",
            message: "이 메시지 그룹을 삭제하시겠습니까?"
        },
        messageEmptyError: {
            title: "오류",
            message: "메시지 내용은 비워둘 수 없습니다."
        },
        imageTooSmallOrCharacterInfoTooLong: {
            title: "저장 오류",
            message: "이미지가 너무 작거나 캐릭터 정보가 너무 깁니다."
        },
        characterCardNoNameError: {
            title: "저장 오류",
            message: "캐릭터 카드를 저장하려면 이름이 필요합니다."
        },
        characterCardNoAvatarImageError: {
            title: "저장 오류",
            message: "캐릭터 카드를 저장하려면 프로필 사진이 필요합니다."
        },
        avatarImageLoadError: {
            title: "오류",
            message: "아바타 이미지를 불러올 수 없습니다."
        },
        avatarLoadSuccess: {
            title: "불러오기 성공",
            message: "캐릭터 카드 정보를 성공적으로 불러왔습니다."
        },
        characterCardNoAvatarImageInfo: {
            title: "정보 없음",
            message: "일반 이미지 파일입니다. 프로필 사진으로 설정합니다."
        },
        backupComplete: {
            title: "백업 완료",
            message: "데이터가 성공적으로 백업되었습니다."
        },
        backupFailed: {
            title: "백업 실패",
            message: "데이터 백업 중 오류가 발생했습니다."
        },
        restoreFailed: {
            title: "불러오기 실패",
            message: "백업 파일이 유효하지 않거나 읽는 중 오류가 발생했습니다."
        },
        restoreConfirm: {
            title: "데이터 불러오기",
            message: "백업 파일을 불러오면 현재 모든 데이터가 덮어씌워집니다. 계속하시겠습니까?"
        },
        restoreComplete: {
            title: "불러오기 완료",
            message: "데이터를 성공적으로 불러왔습니다. 앱을 새로고침합니다."
        },
        promptBackupComplete: {
            title: "프롬프트 백업 완료",
            message: "프롬프트가 성공적으로 백업되었습니다."
        },
        promptBackupFailed: {
            title: "백업 실패",
            message: "프롬프트 백업 중 오류가 발생했습니다."
        },
        promptRestoreConfirm: {
            title: "프롬프트 불러오기",
            message: "현재 수정 중인 프롬프트 내용을 덮어씌웁니다. 저장 버튼을 눌러야 최종 반영됩니다. 계속하시겠습니까?"
        },
        promptRestoreFailed: {
            title: "프롬프트 불러오기 실패",
            message: "프롬프트 백업 파일이 유효하지 않거나 읽는 중 오류가 발생했습니다."
        },
        promptRestoreComplete: {
            title: "프롬프트 불러오기 완료",
            message: "프롬프트를 성공적으로 불러왔습니다."
        },
        cancelChanges: {
            title: "변경사항 취소",
            message: "저장되지 않은 변경사항이 있습니다. 정말로 취소하시겠습니까?"
        },
        loadFailed: {
            title: "로드 실패"
        },
        deleteChatRoom: {
            title: "채팅방 삭제",
            message: "이 채팅방과 모든 메시지가 삭제됩니다. 계속하시겠습니까?"
        },
        editStickerName: {
            title: "스티커 이름 변경"
        },
        unsupportedFileType: {
            message: "은(는) 지원하지 않는 파일 형식입니다."
        },
        fileTooLarge: {
            title: "파일 크기 초과",
            message2: "은(는) 파일 크기가 너무 큽니다. (최대 30MB)"
        },
        fileProcessingError: {
            title: "파일 처리 오류",
            message: "파일을 처리하는 중 오류가 발생했습니다."
        },
        stickerProcessingError: {
            title: "스티커 처리 오류",
            message: "을(를) 처리하는 중 오류가 발생했습니다."
        },
        cannotGenerateRandomCharacter: {
            message: "랜덤 캐릭터를 생성할 수 없습니다: 사용자 페르소나가 설정되지 않았습니다."
        },
        failedToGenerateProfile: {
            message: "프로필 생성 실패:"
        },
        invalidProfileName: {
            message: "생성된 프로필에 유효하지 않거나 비어 있는 이름이 있습니다:"
        },
        invalidProfilePrompt: {
            message: "생성된 프로필에 유효하지 않거나 비어 있는 프롬프트가 있습니다:"
        },
        failedToGetFirstMessage: {
            message: "API에서 첫 번째 메시지를 가져오지 못했습니다:"
        },
        invalidFirstMessage: {
            message: "API가 유효한 첫 번째 메시지를 반환하지 않았습니다:"
        },
        failedToGenerateRandomCharacter: {
            message: "단일 랜덤 캐릭터를 생성하고 시작하지 못했습니다:"
        }
    },
    chat: {
        defaultChatName: "기본 채팅",
        newChat: "새 채팅",
        randomChatName: "랜덤 채팅",
        startNewChat: "대화를 시작해보세요.",
        imageSent: "사진을 보냈습니다.",
        messageGenerationError: "메시지를 생성하지 못했습니다.",
    },
    characterModalSlider: {
        responseTime: {
            description: "얼마나 빠르게 당신의 메시지를 확인하나요?",
            low: "거의 즉시",
            high: "전화를 걸어야함"
        },
        thinkingTime: {
            description: "메시지를 보낼 때 얼마나 깊게 생각하나요?",
            low: "사색에 잠김",
            high: "메시지를 보내고 생각"
        },
        reactivity: {
            description: "채팅에 어떤 반응을 보이나요?",
            low: "활발한 JK 갸루",
            high: "무뚝뚝함"
        },
        tone: {
            description: "당신과 채팅할 때 어떠한 말투를 보이나요?",
            low: "공손하고 예의바름",
            high: "싸가지 없음"
        }
    },
};