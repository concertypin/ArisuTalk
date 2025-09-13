// SNS 클릭 핸들러들 - modalHandlers.js에서 사용하도록 내보냄
export function handleSNSClick(e, app) {
  // Open SNS from Character Modal
  if (e.target.closest('#character-sns-btn')) {
    const { editingCharacter } = app.state;
    if (editingCharacter && editingCharacter.id) {
      // 먼저 Character Modal을 닫고, 그 다음 SNS를 열기
      Promise.all([
        app.setStateBatch({ showCharacterModal: false, editingCharacter: null }),
        app.openSNSFeed(editingCharacter.id)
      ]).catch(console.error);
    }
    return true;
  }

  // Close SNS Character List
  if (e.target.closest('#close-sns-character-list')) {
    app.setStateBatch({ showSNSCharacterListModal: false });
    return true;
  }

  // Open SNS from character list
  if (e.target.closest('.character-list-item[data-action="open-sns"]')) {
    const characterId = parseInt(e.target.closest('.character-list-item').dataset.characterId);
    // 병렬 실행으로 성능 최적화
    Promise.all([
      app.openSNSFeed(characterId),
      app.setStateBatch({ showSNSCharacterListModal: false })
    ]).catch(console.error);
    return true;
  }

  // Close SNS Feed
  if (e.target.closest('#close-sns-feed')) {
    app.setStateBatch({ showSNSModal: false });
    return true;
  }

  // Back to main account from secret account access denied
  if (e.target.closest('#back-to-main-account')) {
    if (app.toggleSNSSecretMode) {
      app.toggleSNSSecretMode(false); // false to go back to main mode
    }
    return true;
  }

  // Toggle secret mode
  if (e.target.closest('#toggle-secret-mode')) {
    if (app.toggleSNSSecretMode) {
      app.toggleSNSSecretMode();
    } else {
    }
    return true;
  }

  // SNS Tab switching
  if (e.target.closest('.sns-tab')) {
    const tab = e.target.closest('.sns-tab').dataset.tab;
    if (tab) {
      app.setState({ snsActiveTab: tab });
    }
    return true;
  }

  // SNS button from MainChat individual chat header
  if (e.target.closest('#individual-chat-sns-btn')) {
    // 개별 채팅에서는 selectedChatId가 직접 characterId
    if (typeof app.state.selectedChatId === 'number') {
      app.openSNSFeed(app.state.selectedChatId);
    } else {
      // 문자열 형태의 경우, 채팅방 정보에서 characterId 추출
      const chatRoom = app.getCurrentChatRoom();
      if (chatRoom && chatRoom.characterId) {
        app.openSNSFeed(chatRoom.characterId);
      }
    }
    return true;
  }

  // SNS button from MainChat group chat header
  if (e.target.closest('#group-chat-sns-btn')) {
    app.openSNSCharacterList('group');
    return true;
  }

  // SNS button from MainChat open chat header
  if (e.target.closest('#open-chat-sns-btn')) {
    app.openSNSCharacterList('open');
    return true;
  }

  // SNS button from CharacterModal
  if (e.target.closest('#character-sns-btn')) {
    e.preventDefault();
    e.stopPropagation();
    const characterId = app.state.editingCharacter?.id;
    if (characterId) {
      // 병렬 실행으로 성능 최적화
      Promise.all([
        app.openSNSFeed(characterId),
        app.setStateBatch({ showCharacterModal: false })
      ]).catch(console.error);
    }
    return true;
  }

  // Mobile SNS buttons
  if (e.target.closest('.mobile-character-sns-btn')) {
    e.preventDefault();
    e.stopPropagation();
    const button = e.target.closest('.mobile-character-sns-btn');
    const characterId = parseInt(button.dataset.characterId);
    if (characterId) {
      Promise.all([
        app.openSNSFeed(characterId),
        app.setStateBatch({ currentMobilePage: 'chat' }) // SNS에서 채팅 페이지로 이동
      ]).catch(console.error);
    }
    return true;
  }

  // Mobile Character Edit buttons  
  if (e.target.closest('.mobile-character-edit-btn')) {
    e.preventDefault();
    e.stopPropagation();
    const button = e.target.closest('.mobile-character-edit-btn');
    const characterId = parseInt(button.dataset.characterId);
    if (characterId) {
      const character = app.state.characters.find(char => char.id === characterId);
      if (character) {
        Promise.all([
          app.setStateBatch({ 
            editingCharacter: { ...character },
            showCharacterModal: true,
            currentMobilePage: 'chat' // 캐릭터 모달에서 채팅 페이지로 이동
          })
        ]).catch(console.error);
      }
    }
    return true;
  }

  // Close SNS Post Modal
  if (e.target.closest('#close-sns-post-modal')) {
    app.setStateBatch({ 
      showSNSPostModal: false, 
      editingSNSPost: null 
    }).catch(console.error);
    return true;
  }

  // Cancel SNS Post
  if (e.target.closest('#cancel-sns-post')) {
    app.setStateBatch({ 
      showSNSPostModal: false, 
      editingSNSPost: null 
    }).catch(console.error);
    return true;
  }

  // Save SNS Post
  if (e.target.closest('#save-sns-post')) {
    const content = document.getElementById('sns-post-content')?.value?.trim();
    if (content && app.saveSNSPost) {
      Promise.resolve(app.saveSNSPost()).catch(console.error);
    }
    return true;
  }

  // Select post sticker button
  if (e.target.closest('#select-post-sticker')) {
    const panel = document.getElementById('sticker-selection-panel');
    if (panel) {
      panel.classList.toggle('hidden');
    }
    return true;
  }

  // Remove post sticker
  if (e.target.closest('#remove-post-sticker')) {
    if (app.state.editingSNSPost) {
      app.setStateBatch({
        editingSNSPost: { ...app.state.editingSNSPost, stickerId: null }
      }).catch(console.error);
    }
    return true;
  }

  // Select sticker option
  if (e.target.closest('.sticker-option')) {
    const stickerId = e.target.closest('.sticker-option').dataset.stickerId;
    if (stickerId && app.state.editingSNSPost) {
      app.setStateBatch({
        editingSNSPost: { ...app.state.editingSNSPost, stickerId }
      }).catch(console.error);
      const panel = document.getElementById('sticker-selection-panel');
      if (panel) panel.classList.add('hidden');
    }
    return true;
  }

  // Add post tag
  if (e.target.closest('#add-post-tag')) {
    const input = document.getElementById('sns-post-tag-input');
    const tagInput = input?.value?.trim();
    if (tagInput && app.state.editingSNSPost) {
      const currentTags = app.state.editingSNSPost.tags || [];
      
      // 콤마로 구분된 태그들 처리
      const newTags = tagInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && !currentTags.includes(tag))
        .slice(0, 10 - currentTags.length); // 최대 10개 제한
      
      if (newTags.length > 0) {
        app.setStateBatch({
          editingSNSPost: { 
            ...app.state.editingSNSPost, 
            tags: [...currentTags, ...newTags] 
          }
        }).catch(console.error);
        if (input) input.value = '';
      }
    }
    return true;
  }

  // Remove tag
  if (e.target.closest('.remove-tag')) {
    const tag = e.target.closest('.remove-tag').dataset.tag;
    if (tag && app.state.editingSNSPost) {
      const currentTags = app.state.editingSNSPost.tags || [];
      app.setStateBatch({
        editingSNSPost: { 
          ...app.state.editingSNSPost, 
          tags: currentTags.filter(t => t !== tag) 
        }
      }).catch(console.error);
    }
    return true;
  }

  // Create SNS Post button
  if (e.target.closest('.create-sns-post')) {
    const button = e.target.closest('.create-sns-post');
    const characterId = button.dataset.characterId;
    const isSecretMode = button.dataset.secretMode === 'true';
    
    if (characterId && app.createSNSPost) {
      Promise.resolve(app.createSNSPost(characterId, isSecretMode)).catch(console.error);
    }
    return true;
  }

  // Edit SNS Post button
  if (e.target.closest('.edit-sns-post')) {
    const button = e.target.closest('.edit-sns-post');
    const characterId = button.dataset.characterId;
    const postId = button.dataset.postId;
    
    if (characterId && postId && app.editSNSPost) {
      Promise.resolve(app.editSNSPost(characterId, postId)).catch(console.error);
    }
    return true;
  }

  // Delete SNS Post button
  if (e.target.closest('.delete-sns-post')) {
    const button = e.target.closest('.delete-sns-post');
    const characterId = button.dataset.characterId;
    const postId = button.dataset.postId;
    
    if (characterId && postId && app.deleteSNSPost) {
      // 확인 모달 표시
      app.showConfirmModal(
        "SNS 포스트 삭제",
        "이 SNS 포스트를 삭제하시겠습니까?",
        () => {
          app.deleteSNSPost(characterId, postId);
        }
      );
    }
    return true;
  }

  return false;
}

// SNS 입력 핸들러들
export function handleSNSInput(e, app) {
  // SNS 캐릭터 검색
  if (e.target.id === 'sns-character-search') {
    app.setStateBatch({ snsCharacterSearchTerm: e.target.value });
    return true;
  }

  // SNS 포스트 내용
  if (e.target.id === 'sns-post-content') {
    // 단순히 텍스트 입력이므로 상태 업데이트 불필요
    return true;
  }

  // SNS 포스트 태그 입력
  if (e.target.id === 'sns-post-tag-input') {
    // 단순히 텍스트 입력이므로 상태 업데이트 불필요
    return true;
  }

  // 포스트 중요도 슬라이더
  if (e.target.id === 'post-importance' || e.target.id === 'sns-post-importance') {
    const value = e.target.value;
    const display = document.getElementById('importance-value');
    if (display) display.textContent = value;
    if (app.state.editingSNSPost) {
      app.setStateBatch({
        editingSNSPost: { ...app.state.editingSNSPost, importance: parseInt(value) }
      }).catch(console.error);
    }
    return true;
  }

  // 포스트 접근 권한
  if (e.target.id === 'post-access-level' || e.target.id === 'sns-post-access-level') {
    if (app.state.editingSNSPost) {
      app.setStateBatch({
        editingSNSPost: { ...app.state.editingSNSPost, accessLevel: e.target.value }
      }).catch(console.error);
    }
    return true;
  }

  // SNS 관련 요소가 아니면 false 반환
  return false;
}

// SNS 키보드 이벤트 핸들러
export function handleSNSKeypress(e, app) {
  // SNS 포스트 태그 입력에서 Enter 키 처리
  if (e.target.id === 'sns-post-tag-input' && e.key === 'Enter') {
    e.preventDefault();
    
    const input = e.target;
    const tagInput = input?.value?.trim();
    if (tagInput && app.state.editingSNSPost) {
      const currentTags = app.state.editingSNSPost.tags || [];
      
      // 콤마로 구분된 태그들 처리
      const newTags = tagInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && !currentTags.includes(tag))
        .slice(0, 10 - currentTags.length); // 최대 10개 제한
      
      if (newTags.length > 0) {
        app.setStateBatch({
          editingSNSPost: { 
            ...app.state.editingSNSPost, 
            tags: [...currentTags, ...newTags] 
          }
        }).catch(console.error);
        input.value = '';
      }
    }
    return true;
  }
  
  return false;
}

// setupSNSHandlers 함수는 더 이상 사용하지 않으므로 제거됨
// 모든 SNS 핸들링은 modalHandlers.js에서 처리됨

// SNS-related methods to be added to the main app
export const snsMethods = {
  // Get character state (affection levels)
  getCharacterState(characterId) {
    return this.state.characterStates[characterId] || {
      affection: 0.2,
      intimacy: 0.2, 
      trust: 0.2,
      romantic_interest: 0
    };
  },

  // Set character state
  setCharacterState(characterId, state) {
    this.setState({
      characterStates: {
        ...this.state.characterStates,
        [characterId]: { ...state }
      }
    });
  },

  // Update character affection levels
  updateCharacterAffection(characterId, changes) {
    const currentState = this.getCharacterState(characterId);
    const newState = { ...currentState };
    
    // Apply changes with bounds checking (0-1 range)
    Object.keys(changes).forEach(key => {
      if (newState.hasOwnProperty(key)) {
        if (key === 'romantic_interest') {
          // 사랑수치는 다른 수치들이 50% 이상에 도달한 후에만 증가 가능
          const minRequiredLevel = 0.5; // 50%
          if (currentState.affection >= minRequiredLevel && 
              currentState.intimacy >= minRequiredLevel && 
              currentState.trust >= minRequiredLevel) {
            newState[key] = Math.max(0, Math.min(1, currentState[key] + changes[key]));
          }
          // 조건을 만족하지 않으면 romantic_interest 변경사항은 무시됨
        } else {
          newState[key] = Math.max(0, Math.min(1, currentState[key] + changes[key]));
        }
      }
    });
    
    this.setCharacterState(characterId, newState);
  },

  // SNS access check is now handled in index.js as app.checkSNSAccess()
  // This method was removed to avoid duplication and confusion

  // Open SNS feed for specific character
  openSNSFeed(characterId) {
    const character = this.state.characters.find(char => char.id === characterId);
    if (!character) return Promise.resolve();
    
    // 백업의 원래 상태 구조 사용
    return this.setStateBatch({
      showSNSModal: true,
      selectedSNSCharacter: characterId,
      snsActiveTab: 'posts'
    });
  },

  // Open SNS character list
  openSNSCharacterList(type) {
    // 백업의 원래 상태 구조 사용
    return this.setStateBatch({
      showSNSCharacterListModal: true,
      snsCharacterListType: type,
      snsCharacterSearchTerm: ''
    });
  },


  // Create SNS Post
  createSNSPost(characterId, isSecretMode = false) {
    const character = this.state.characters.find(char => char.id === parseInt(characterId));
    if (!character) return Promise.resolve();
    
    // 포스트 작성 모달 열기
    return this.setStateBatch({
      showSNSPostModal: true,
      editingSNSPost: {
        characterId: parseInt(characterId),
        isSecret: isSecretMode,
        content: '',
        isNew: true,
        accessLevel: isSecretMode ? 'secret-public' : 'main-public', // 기본 접근 레벨 설정
        tags: [],
        importance: 5
      }
    });
  },

  // Edit SNS Post
  editSNSPost(characterId, postId) {
    const character = this.state.characters.find(char => char.id === parseInt(characterId));
    if (!character || !character.snsPosts) return Promise.resolve();
    
    const post = character.snsPosts.find(p => p.id === postId);
    if (!post) return Promise.resolve();
    
    return this.setStateBatch({
      showSNSPostModal: true,
      editingSNSPost: {
        ...post,
        characterId: parseInt(characterId),
        isNew: false
      }
    });
  },

  // Delete SNS Post
  deleteSNSPost(characterId, postId) {
    const character = this.state.characters.find(char => char.id === parseInt(characterId));
    if (!character || !character.snsPosts) return Promise.resolve();
    
    const updatedCharacters = this.state.characters.map(char => {
      if (char.id === parseInt(characterId)) {
        return {
          ...char,
          snsPosts: (char.snsPosts || []).filter(post => post.id !== postId)
        };
      }
      return char;
    });
    
    // 상태 업데이트 및 UI 강제 새로고침
    this.setState({ characters: updatedCharacters });
    
    // SNS 모달이 열려있다면 모달 내용 즉시 새로고침
    if (this.state.selectedSNSCharacter) {
      // 약간의 지연 후 UI 강제 업데이트
      requestAnimationFrame(() => {
        // 모달 내용 재렌더링 트리거를 위한 더미 상태 변경
        this.setState({ 
          snsRefreshTrigger: Date.now() 
        });
      });
    }
    
    return Promise.resolve();
  },

  // Save SNS Post
  saveSNSPost() {
    const editingPost = this.state.editingSNSPost;
    const content = document.getElementById('sns-post-content')?.value?.trim();
    
    if (!editingPost || !content) return Promise.resolve();

    const updatedCharacters = this.state.characters.map(char => {
      if (char.id === editingPost.characterId) {
        const snsPosts = char.snsPosts || [];
        
        if (editingPost.isNew) {
          // 새 포스트 추가
          const newPost = {
            id: `post_${Date.now()}`,
            content: content,
            timestamp: new Date().toISOString(),
            type: editingPost.isSecret ? 'secret' : 'post',
            access_level: editingPost.accessLevel || (editingPost.isSecret ? 'secret-public' : 'main-public'),
            tags: editingPost.tags || [],
            stickerId: editingPost.stickerId || null,
            memory_importance: editingPost.importance || 5,
            likes: 0,
            comments: []
          };
          
          return {
            ...char,
            snsPosts: [...snsPosts, newPost]
          };
        } else {
          // 기존 포스트 수정
          return {
            ...char,
            snsPosts: snsPosts.map(post => 
              post.id === editingPost.id 
                ? { 
                    ...post, 
                    content: content,
                    access_level: editingPost.accessLevel || post.access_level,
                    tags: editingPost.tags || post.tags || [],
                    stickerId: editingPost.stickerId,
                    memory_importance: editingPost.importance || post.memory_importance || 5
                  }
                : post
            )
          };
        }
      }
      return char;
    });

    // 포스트 저장 후 모달 닫기
    return this.setStateBatch({ 
      characters: updatedCharacters,
      showSNSPostModal: false,
      editingSNSPost: null
    });
  }
};