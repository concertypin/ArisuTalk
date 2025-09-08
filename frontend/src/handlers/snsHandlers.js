// SNS 클릭 핸들러들 - modalHandlers.js에서 사용하도록 내보냄
export function handleSNSClick(e, app) {
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

  // Toggle secret mode
  if (e.target.closest('#toggle-secret-mode')) {
    if (app.toggleSNSSecretMode) {
      app.toggleSNSSecretMode();
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
    const tag = input?.value?.trim();
    if (tag && app.state.editingSNSPost) {
      const currentTags = app.state.editingSNSPost.tags || [];
      if (!currentTags.includes(tag) && currentTags.length < 10) {
        app.setStateBatch({
          editingSNSPost: { 
            ...app.state.editingSNSPost, 
            tags: [...currentTags, tag] 
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
      Promise.resolve(app.deleteSNSPost(characterId, postId)).catch(console.error);
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

  // Check SNS access based on affection levels and hypnosis
  checkSNSAccess(character, accessLevel) {
    let state = this.getCharacterState(character.id);
    const hypnosis = character.hypnosis || {};
    
    // console.log('[SNS접근] 초기 상태:', { characterId: character.id, state, hypnosis, accessLevel });
    
    // 최면이 활성화되고 호감도 조작이 활성화된 경우 최면 값 사용
    if (hypnosis.enabled && hypnosis.affection_override) {
      // console.log('[SNS접근] 최면 모드 활성화 - 최면 값으로 덮어쓰기');
      state = {
        affection: hypnosis.affection !== null ? hypnosis.affection : state.affection,
        intimacy: hypnosis.intimacy !== null ? hypnosis.intimacy : state.intimacy,
        trust: hypnosis.trust !== null ? hypnosis.trust : state.trust,
        romantic_interest: hypnosis.romantic_interest !== null ? hypnosis.romantic_interest : state.romantic_interest
      };
      // console.log('[SNS접근] 최면 적용 후 상태:', state);
    }
    
    // Define access requirements for each level
    const requirements = {
      public: { affection: 0, intimacy: 0, trust: 0, romantic_interest: 0 },
      private: { affection: 0.5, intimacy: 0.5, trust: 0.5, romantic_interest: 0 }, // 본계정 비밀글: 3개 호감도 50% 이상
      secretPublic: { affection: 0.7, intimacy: 0.7, trust: 0.7, romantic_interest: 0.4 }, // 뒷계정: 3개 수치 70%+ 연애수치 40%+ 필요
      secretPrivate: { affection: 0.9, intimacy: 0.9, trust: 0.9, romantic_interest: 0.9 } // 뒷계정 비밀글: 모든 수치 90% 이상
    };
    
    const required = requirements[accessLevel] || requirements.public;
    // console.log('[SNS접근] 필요 조건:', required);
    
    // Check if all requirements are met
    const hasAccess = (
      state.affection >= required.affection &&
      state.intimacy >= required.intimacy &&
      state.trust >= required.trust &&
      state.romantic_interest >= required.romantic_interest
    );
    
    // console.log('[SNS접근] 접근 결과:', {
    //   hasAccess,
    //   comparison: {
    //     affection: `${state.affection} >= ${required.affection} = ${state.affection >= required.affection}`,
    //     intimacy: `${state.intimacy} >= ${required.intimacy} = ${state.intimacy >= required.intimacy}`,
    //     trust: `${state.trust} >= ${required.trust} = ${state.trust >= required.trust}`,
    //     romantic_interest: `${state.romantic_interest} >= ${required.romantic_interest} = ${state.romantic_interest >= required.romantic_interest}`
    //   }
    // });
    
    return hasAccess;
  },

  // Open SNS feed for specific character
  openSNSFeed(characterId) {
    const character = this.state.characters.find(char => char.id === characterId);
    if (!character) return Promise.resolve();
    
    // 고성능 배치 처리 사용
    return this.setStateBatch({
      showSNSModal: true,
      selectedSNSCharacter: characterId,
      snsActiveTab: 'posts'
    });
  },

  // Open SNS character list
  openSNSCharacterList(type) {
    // 고성능 배치 처리 사용
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
        isNew: true
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
    
    return this.setStateBatch({ characters: updatedCharacters });
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