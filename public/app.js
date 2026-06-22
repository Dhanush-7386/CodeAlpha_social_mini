/* ──────────────────────────────────────────────
   SocialMini — Frontend App
   Vanilla JS, fetch() API, no frameworks
   ────────────────────────────────────────────── */

const API = '/api';

/* ─── App State ──────────────────────────────── */
const state = {
  currentUser: null,    // { _id, username, bio, followers, following }
  allUsers: [],
  posts: [],
  activeCommentPostId: null,
};

/* ─── DOM Refs ───────────────────────────────── */
const $ = id => document.getElementById(id);

const dom = {
  // Profile
  noUserPanel:          $('noUserPanel'),
  activeUserPanel:      $('activeUserPanel'),
  profileAvatar:        $('profileAvatar'),
  profileUsername:      $('profileUsername'),
  profileBio:           $('profileBio'),
  statPosts:            $('statPosts'),
  statFollowers:        $('statFollowers'),
  statFollowing:        $('statFollowing'),
  loginSelect:          $('loginSelect'),
  loginBtn:             $('loginBtn'),
  logoutBtn:            $('logoutBtn'),
  openCreateProfileBtn: $('openCreateProfileBtn'),
  navProfileBtn:        $('navProfileBtn'),
  navNewPostBtn:        $('navNewPostBtn'),
  peopleList:           $('peopleList'),
  // Feed
  feedPosts:            $('feedPosts'),
  feedLoading:          $('feedLoading'),
  refreshFeed:          $('refreshFeed'),
  // Create Profile Modal
  createProfileModal:   $('createProfileModal'),
  closeCreateProfile:   $('closeCreateProfileModal'),
  newUsername:          $('newUsername'),
  newEmail:             $('newEmail'),
  newBio:               $('newBio'),
  createProfileError:   $('createProfileError'),
  submitCreateProfile:  $('submitCreateProfile'),
  // New Post Modal
  newPostModal:         $('newPostModal'),
  closeNewPost:         $('closeNewPostModal'),
  postContent:          $('postContent'),
  postCharCount:        $('postCharCount'),
  postAuthorHint:       $('postAuthorHint'),
  newPostError:         $('newPostError'),
  submitNewPost:        $('submitNewPost'),
  // Comments Modal
  commentsModal:        $('commentsModal'),
  closeComments:        $('closeCommentsModal'),
  commentsList:         $('commentsList'),
  commentText:          $('commentText'),
  submitComment:        $('submitComment'),
  commentError:         $('commentError'),
  // Toast
  toast:                $('toast'),
};

/* ─── Utilities ──────────────────────────────── */

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

function avatar(username) {
  return (username || '?').charAt(0).toUpperCase();
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const s = Math.floor(diff / 1000);
  if (s < 60)  return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

let toastTimer;
function showToast(msg, type = '') {
  clearTimeout(toastTimer);
  dom.toast.textContent = msg;
  dom.toast.className = `toast${type ? ' ' + type : ''}`;
  dom.toast.classList.remove('hidden');
  toastTimer = setTimeout(() => dom.toast.classList.add('hidden'), 2800);
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}
function hideError(el) { el.classList.add('hidden'); }

function openModal(el)  { el.classList.remove('hidden'); }
function closeModal(el) { el.classList.add('hidden'); }

/* ─── Auth / Profile ──────────────────────────── */

function setActiveUser(user) {
  state.currentUser = user;

  dom.noUserPanel.classList.add('hidden');
  dom.activeUserPanel.classList.remove('hidden');

  dom.profileAvatar.textContent  = avatar(user.username);
  dom.profileUsername.textContent = `@${user.username}`;
  dom.profileBio.textContent      = user.bio || '';
  dom.statFollowers.textContent   = user.followers?.length ?? 0;
  dom.statFollowing.textContent   = user.following?.length ?? 0;

  localStorage.setItem('sm_userId', user._id);
  refreshPostCount();
  renderPeopleList();
}

function logout() {
  state.currentUser = null;
  localStorage.removeItem('sm_userId');
  dom.activeUserPanel.classList.add('hidden');
  dom.noUserPanel.classList.remove('hidden');
  renderPeopleList();
}

async function refreshPostCount() {
  if (!state.currentUser) return;
  const count = state.posts.filter(p => p.author?._id === state.currentUser._id).length;
  dom.statPosts.textContent = count;
}

/* ─── Users ──────────────────────────────────── */

async function loadUsers() {
  const data = await apiFetch('/users');
  state.allUsers = data.data;
  populateLoginSelect();
  renderPeopleList();
}

function populateLoginSelect() {
  const sel = dom.loginSelect;
  // preserve current selection
  const prev = sel.value;
  sel.innerHTML = '<option value="">— Select user —</option>';
  state.allUsers.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u._id;
    opt.textContent = `@${u.username}`;
    sel.appendChild(opt);
  });
  if (prev) sel.value = prev;
}

function renderPeopleList() {
  const ul = dom.peopleList;
  ul.innerHTML = '';

  if (!state.allUsers.length) {
    ul.innerHTML = '<li style="color:var(--text-muted);font-size:.83rem;padding:8px">No users yet.</li>';
    return;
  }

  state.allUsers.forEach(u => {
    const li = document.createElement('li');
    li.className = 'people-item';

    const isMe = state.currentUser?._id === u._id;
    const isFollowing = state.currentUser?.following?.some(
      f => (f._id || f) === u._id
    );

    li.innerHTML = `
      <div class="people-avatar">${avatar(u.username)}</div>
      <div class="people-info">
        <div class="people-name">@${u.username}</div>
        <div class="people-followers">${u.followers?.length ?? 0} followers</div>
      </div>
      ${!isMe ? `<button class="follow-btn${isFollowing ? ' following' : ''}" data-id="${u._id}">
        ${isFollowing ? '✓ Following' : 'Follow'}
      </button>` : '<span style="font-size:.75rem;color:var(--amber)">You</span>'}
    `;
    ul.appendChild(li);
  });
}

async function handleFollow(targetId) {
  if (!state.currentUser) {
    showToast('Log in first to follow users.', 'error'); return;
  }
  const data = await apiFetch(`/users/${targetId}/follow`, {
    method: 'POST',
    body: JSON.stringify({ followerId: state.currentUser._id }),
  });
  // Refresh local user state
  const updatedMe = await apiFetch(`/users/${state.currentUser._id}`);
  const updatedTarget = await apiFetch(`/users/${targetId}`);

  state.currentUser = updatedMe.data;
  state.allUsers = state.allUsers.map(u => {
    if (u._id === targetId)                return updatedTarget.data;
    if (u._id === state.currentUser._id)   return updatedMe.data;
    return u;
  });

  dom.statFollowing.textContent = state.currentUser.following?.length ?? 0;
  showToast(data.following ? `You're now following @${updatedTarget.data.username}` : 'Unfollowed.', 'success');
  renderPeopleList();
}

/* ─── Posts / Feed ───────────────────────────── */

async function loadFeed() {
  dom.feedLoading.classList.remove('hidden');
  dom.feedPosts.innerHTML = '';
  const data = await apiFetch('/posts');
  state.posts = data.data;
  dom.feedLoading.classList.add('hidden');
  renderFeed();
  refreshPostCount();
}

function renderFeed() {
  const container = dom.feedPosts;
  container.innerHTML = '';

  if (!state.posts.length) {
    container.innerHTML = `
      <div class="empty-feed">
        <span class="empty-feed__icon">✦</span>
        <p>No posts yet. Be the first to share something.</p>
      </div>`;
    return;
  }

  state.posts.forEach((post, i) => {
    const card = buildPostCard(post, i);
    container.appendChild(card);
  });
}

function buildPostCard(post, delay = 0) {
  const author = post.author || {};
  const myId   = state.currentUser?._id;
  const liked  = myId && post.likes?.includes(myId);

  const card = document.createElement('article');
  card.className = 'post-card';
  card.style.animationDelay = `${delay * 40}ms`;
  card.dataset.postId = post._id;

  card.innerHTML = `
    <div class="post-header">
      <div class="post-avatar">${avatar(author.username)}</div>
      <div class="post-meta">
        <div class="post-author">@${author.username || 'Unknown'}</div>
        <div class="post-time">${timeAgo(post.createdAt)}</div>
      </div>
    </div>
    <p class="post-content">${escapeHtml(post.content)}</p>
    <div class="post-actions">
      <button class="action-btn like-btn${liked ? ' liked' : ''}" data-post-id="${post._id}">
        <span class="action-btn__icon">${liked ? '♥' : '♡'}</span>
        <span class="like-count">${post.likes?.length ?? 0}</span>
      </button>
      <button class="action-btn comment-btn" data-post-id="${post._id}">
        <span class="action-btn__icon">💬</span>
        <span>${post.commentCount ?? 0}</span>
      </button>
    </div>
  `;

  return card;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function handleLike(postId, btn) {
  if (!state.currentUser) {
    showToast('Log in to like posts.', 'error'); return;
  }

  btn.disabled = true;
  try {
    const data = await apiFetch(`/posts/${postId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId: state.currentUser._id }),
    });

    const icon  = btn.querySelector('.action-btn__icon');
    const count = btn.querySelector('.like-count');

    btn.classList.toggle('liked', data.liked);
    icon.textContent  = data.liked ? '♥' : '♡';
    count.textContent = data.likesCount;

    // Sync local state
    const post = state.posts.find(p => p._id === postId);
    if (post) {
      if (data.liked) post.likes.push(state.currentUser._id);
      else post.likes = post.likes.filter(id => id !== state.currentUser._id);
    }
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

/* ─── Comments ───────────────────────────────── */

async function openComments(postId) {
  state.activeCommentPostId = postId;
  dom.commentText.value = '';
  hideError(dom.commentError);
  openModal(dom.commentsModal);
  await loadComments(postId);
}

async function loadComments(postId) {
  dom.commentsList.innerHTML = '<div class="no-comments">Loading…</div>';
  const data = await apiFetch(`/comments/${postId}`);
  renderComments(data.data);
}

function renderComments(comments) {
  const container = dom.commentsList;
  container.innerHTML = '';

  if (!comments.length) {
    container.innerHTML = '<div class="no-comments">No comments yet. Start the conversation!</div>';
    return;
  }

  comments.forEach(c => {
    const div = document.createElement('div');
    div.className = 'comment-item';
    div.innerHTML = `
      <div class="comment-avatar">${avatar(c.author?.username)}</div>
      <div class="comment-body">
        <div class="comment-author">@${c.author?.username || 'Unknown'}</div>
        <div class="comment-text">${escapeHtml(c.text)}</div>
        <div class="comment-time">${timeAgo(c.createdAt)}</div>
      </div>
    `;
    container.appendChild(div);
  });

  container.scrollTop = container.scrollHeight;
}

async function handleAddComment() {
  if (!state.currentUser) {
    showToast('Log in to comment.', 'error'); return;
  }

  const text = dom.commentText.value.trim();
  if (!text) { showError(dom.commentError, 'Comment cannot be empty.'); return; }
  hideError(dom.commentError);

  dom.submitComment.disabled = true;
  try {
    await apiFetch('/comments', {
      method: 'POST',
      body: JSON.stringify({
        postId:   state.activeCommentPostId,
        authorId: state.currentUser._id,
        text,
      }),
    });

    dom.commentText.value = '';
    await loadComments(state.activeCommentPostId);

    // Update commentCount in local state & DOM
    const post = state.posts.find(p => p._id === state.activeCommentPostId);
    if (post) {
      post.commentCount = (post.commentCount || 0) + 1;
      const card = document.querySelector(`[data-post-id="${state.activeCommentPostId}"] .comment-btn span:last-child`);
      if (card) card.textContent = post.commentCount;
    }
  } catch (e) {
    showError(dom.commentError, e.message);
  } finally {
    dom.submitComment.disabled = false;
  }
}

/* ─── Create Profile ─────────────────────────── */

async function handleCreateProfile() {
  const username = dom.newUsername.value.trim();
  const email    = dom.newEmail.value.trim();
  const bio      = dom.newBio.value.trim();

  if (!username || !email) {
    showError(dom.createProfileError, 'Username and email are required.'); return;
  }
  hideError(dom.createProfileError);
  dom.submitCreateProfile.disabled = true;

  try {
    const data = await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify({ username, email, bio }),
    });

    state.allUsers.unshift(data.data);
    populateLoginSelect();
    setActiveUser(data.data);

    dom.newUsername.value = '';
    dom.newEmail.value    = '';
    dom.newBio.value      = '';
    closeModal(dom.createProfileModal);
    showToast(`Welcome, @${username}! 🎉`, 'success');
  } catch (e) {
    showError(dom.createProfileError, e.message);
  } finally {
    dom.submitCreateProfile.disabled = false;
  }
}

/* ─── New Post ───────────────────────────────── */

function openNewPostModal() {
  if (!state.currentUser) {
    showToast('Create or select a profile first.', 'error'); return;
  }
  dom.postContent.value  = '';
  dom.postCharCount.textContent = '0';
  dom.postAuthorHint.textContent = `Posting as @${state.currentUser.username}`;
  hideError(dom.newPostError);
  openModal(dom.newPostModal);
}

async function handleNewPost() {
  const content = dom.postContent.value.trim();
  if (!content) { showError(dom.newPostError, 'Post content cannot be empty.'); return; }
  hideError(dom.newPostError);
  dom.submitNewPost.disabled = true;

  try {
    const data = await apiFetch('/posts', {
      method: 'POST',
      body: JSON.stringify({ authorId: state.currentUser._id, content }),
    });

    state.posts.unshift(data.data);
    dom.feedPosts.prepend(buildPostCard(data.data, 0));
    const emptyFeed = dom.feedPosts.querySelector('.empty-feed');
    if (emptyFeed) emptyFeed.remove();

    closeModal(dom.newPostModal);
    dom.postContent.value = '';
    refreshPostCount();
    showToast('Post published! ✦', 'success');
  } catch (e) {
    showError(dom.newPostError, e.message);
  } finally {
    dom.submitNewPost.disabled = false;
  }
}

/* ─── Event Wiring ───────────────────────────── */

// Nav
dom.navNewPostBtn.addEventListener('click', openNewPostModal);
dom.navProfileBtn.addEventListener('click', () => {
  dom.sidebar.scrollIntoView({ behavior: 'smooth' });
});

// Profile
dom.openCreateProfileBtn.addEventListener('click', () => {
  hideError(dom.createProfileError);
  openModal(dom.createProfileModal);
});
dom.closeCreateProfile.addEventListener('click', () => closeModal(dom.createProfileModal));
dom.submitCreateProfile.addEventListener('click', handleCreateProfile);

dom.loginBtn.addEventListener('click', async () => {
  const id = dom.loginSelect.value;
  if (!id) { showToast('Select a user first.', 'error'); return; }
  const data = await apiFetch(`/users/${id}`);
  setActiveUser(data.data);
  showToast(`Welcome back, @${data.data.username}!`, 'success');
});

dom.logoutBtn.addEventListener('click', logout);

// New Post
dom.navNewPostBtn.addEventListener('click', openNewPostModal);
dom.closeNewPost.addEventListener('click', () => closeModal(dom.newPostModal));
dom.submitNewPost.addEventListener('click', handleNewPost);
dom.postContent.addEventListener('input', () => {
  dom.postCharCount.textContent = dom.postContent.value.length;
});

// Comments
dom.closeComments.addEventListener('click', () => closeModal(dom.commentsModal));
dom.submitComment.addEventListener('click', handleAddComment);
dom.commentText.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); }
});

// Feed: delegation for like & comment buttons
dom.feedPosts.addEventListener('click', e => {
  const likeBtn = e.target.closest('.like-btn');
  if (likeBtn) { handleLike(likeBtn.dataset.postId, likeBtn); return; }

  const commentBtn = e.target.closest('.comment-btn');
  if (commentBtn) { openComments(commentBtn.dataset.postId); return; }
});

// People list: delegation for follow buttons
dom.peopleList.addEventListener('click', e => {
  const btn = e.target.closest('.follow-btn');
  if (btn) handleFollow(btn.dataset.id);
});

// Feed refresh
dom.refreshFeed.addEventListener('click', loadFeed);

// Modal: close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay);
  });
});

/* ─── Init ───────────────────────────────────── */

async function init() {
  try {
    await loadUsers();
    await loadFeed();

    // Restore last session
    const savedId = localStorage.getItem('sm_userId');
    if (savedId) {
      const user = state.allUsers.find(u => u._id === savedId);
      if (user) setActiveUser(user);
    }
  } catch (err) {
    showToast('Could not connect to server. Is it running?', 'error');
    console.error(err);
  }
}

init();
