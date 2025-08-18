export const language = {
    modal: {
        noSpaceError: {
            title: "저장 공간 부족",
            message: "브라우저의 저장 공간이 가득 찼습니다. 오래된 대화를 삭제하거나 데이터를 백업 후 초기화해주세요."
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
    },
    chat: {
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
    confirm: {
        cancel: "취소",
        confirm: "확인"
    }
};