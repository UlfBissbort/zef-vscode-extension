# Dark Component Library IX ◈

**Social & User** — Connect. Express. Belong.

---

## Introduction

Social interfaces thrive on human connection. This collection explores components that foster community—from user profiles to activity feeds. Each element balances personal expression with elegant restraint.

---

## Component Collection

Six social and user-focused components for community interfaces.

---

### 1. User Profile Header

A comprehensive profile header with stats and actions:

```svelte
<script>
  let profile = $state({
    name: "Maya Anderson",
    username: "@mayaand",
    initials: "MA",
    bio: "Product designer by day, indie game dev by night. Building tools that spark joy ✨",
    location: "San Francisco, CA",
    website: "maya.design",
    stats: {
      posts: 847,
      followers: 12400,
      following: 523
    },
    isFollowing: false
  });
  
  function formatNumber(num) {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }
  
  function toggleFollow() {
    profile.isFollowing = !profile.isFollowing;
    profile.stats.followers += profile.isFollowing ? 1 : -1;
  }
</script>

<div class="profile-header">
  <div class="cover-section">
    <div class="cover-gradient"></div>
  </div>
  
  <div class="profile-content">
    <div class="avatar-section">
      <div class="avatar-ring">
        <div class="avatar">{profile.initials}</div>
      </div>
    </div>
    
    <div class="profile-actions">
      <button class="action-btn secondary">
        <span>✉</span>
      </button>
      <button 
        class="action-btn"
        class:following={profile.isFollowing}
        onclick={toggleFollow}
      >
        {profile.isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
    
    <div class="profile-info">
      <h2 class="display-name">{profile.name}</h2>
      <span class="username">{profile.username}</span>
      
      <p class="bio">{profile.bio}</p>
      
      <div class="meta-row">
        <span class="meta-item">
          <span class="meta-icon">◎</span>
          {profile.location}
        </span>
        <span class="meta-item">
          <span class="meta-icon">◇</span>
          <a href="#">{profile.website}</a>
        </span>
      </div>
    </div>
    
    <div class="stats-row">
      <div class="stat">
        <span class="stat-value">{profile.stats.posts}</span>
        <span class="stat-label">Posts</span>
      </div>
      <div class="stat">
        <span class="stat-value">{formatNumber(profile.stats.followers)}</span>
        <span class="stat-label">Followers</span>
      </div>
      <div class="stat">
        <span class="stat-value">{profile.stats.following}</span>
        <span class="stat-label">Following</span>
      </div>
    </div>
  </div>
</div>

<style>
  .profile-header {
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px;
    overflow: hidden;
    max-width: 480px;
  }
  
  .cover-section {
    height: 120px;
    position: relative;
  }
  
  .cover-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
    opacity: 0.6;
  }
  
  .profile-content {
    padding: 0 24px 24px;
    position: relative;
  }
  
  .avatar-section {
    margin-top: -48px;
    margin-bottom: 16px;
  }
  
  .avatar-ring {
    width: 96px;
    height: 96px;
    padding: 4px;
    background: #0c0c0e;
    border-radius: 50%;
    display: inline-block;
  }
  
  .avatar {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    font-weight: 700;
    color: #fff;
  }
  
  .profile-actions {
    position: absolute;
    top: 16px;
    right: 24px;
    display: flex;
    gap: 8px;
  }
  
  .action-btn {
    padding: 8px 20px;
    background: #fff;
    border: none;
    border-radius: 20px;
    color: #000;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .action-btn:hover {
    transform: scale(1.02);
  }
  
  .action-btn.secondary {
    padding: 8px 12px;
    background: rgba(255,255,255,0.1);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.2);
  }
  
  .action-btn.following {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.3);
    color: #fff;
  }
  
  .profile-info {
    margin-bottom: 20px;
  }
  
  .display-name {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 700;
    color: #fff;
  }
  
  .username {
    display: block;
    font-size: 0.9rem;
    color: rgba(255,255,255,0.5);
    margin-bottom: 12px;
  }
  
  .bio {
    margin: 0 0 12px;
    font-size: 0.9rem;
    color: rgba(255,255,255,0.8);
    line-height: 1.5;
  }
  
  .meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.5);
  }
  
  .meta-icon {
    font-size: 0.75rem;
  }
  
  .meta-item a {
    color: #818cf8;
    text-decoration: none;
  }
  
  .meta-item a:hover {
    text-decoration: underline;
  }
  
  .stats-row {
    display: flex;
    gap: 32px;
    padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  
  .stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .stat-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
  }
  
  .stat-label {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.5);
  }
</style>
```

---

### 2. Activity Feed

A timeline of user activities with different event types:

```svelte
<script>
  let activities = $state([
    {
      id: 1,
      type: 'post',
      user: { name: 'Alex Chen', initials: 'AC' },
      action: 'published a new article',
      target: 'Building Scalable Design Systems',
      time: '2 hours ago',
      preview: 'A comprehensive guide to creating design systems that grow with your team...'
    },
    {
      id: 2,
      type: 'like',
      user: { name: 'Jordan Lee', initials: 'JL' },
      action: 'liked your post',
      target: 'Introduction to Svelte 5',
      time: '3 hours ago',
      count: 12
    },
    {
      id: 3,
      type: 'follow',
      user: { name: 'Sam Rivera', initials: 'SR' },
      action: 'started following you',
      time: '5 hours ago'
    },
    {
      id: 4,
      type: 'comment',
      user: { name: 'Taylor Kim', initials: 'TK' },
      action: 'commented on',
      target: 'Dark Mode Best Practices',
      time: '1 day ago',
      comment: 'This is incredibly helpful! Love the attention to contrast ratios.'
    },
    {
      id: 5,
      type: 'mention',
      user: { name: 'Casey Morgan', initials: 'CM' },
      action: 'mentioned you in',
      target: 'Team Discussion',
      time: '2 days ago'
    }
  ]);
  
  function getIcon(type) {
    const icons = {
      post: '✎',
      like: '♡',
      follow: '+',
      comment: '◬',
      mention: '@'
    };
    return icons[type] || '◎';
  }
</script>

<div class="activity-feed">
  <div class="feed-header">
    <h3 class="feed-title">Activity</h3>
    <button class="mark-read">Mark all read</button>
  </div>
  
  <div class="activities">
    {#each activities as activity}
      <div class="activity-item">
        <div class="activity-avatar">
          <div class="avatar">{activity.user.initials}</div>
          <div class="activity-badge" class:post={activity.type === 'post'} class:like={activity.type === 'like'} class:follow={activity.type === 'follow'} class:comment={activity.type === 'comment'} class:mention={activity.type === 'mention'}>
            {getIcon(activity.type)}
          </div>
        </div>
        
        <div class="activity-content">
          <div class="activity-text">
            <span class="user-name">{activity.user.name}</span>
            <span class="action-text">{activity.action}</span>
            {#if activity.target}
              <span class="target-text">{activity.target}</span>
            {/if}
            {#if activity.count}
              <span class="count-badge">+{activity.count - 1} others</span>
            {/if}
          </div>
          
          {#if activity.preview}
            <p class="activity-preview">{activity.preview}</p>
          {/if}
          
          {#if activity.comment}
            <div class="comment-bubble">
              "{activity.comment}"
            </div>
          {/if}
          
          <span class="activity-time">{activity.time}</span>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .activity-feed {
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    max-width: 480px;
    overflow: hidden;
  }
  
  .feed-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  
  .feed-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }
  
  .mark-read {
    background: none;
    border: none;
    color: #818cf8;
    font-size: 0.8rem;
    cursor: pointer;
  }
  
  .mark-read:hover {
    text-decoration: underline;
  }
  
  .activities {
    display: flex;
    flex-direction: column;
  }
  
  .activity-item {
    display: flex;
    gap: 14px;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    transition: background 0.15s ease;
  }
  
  .activity-item:last-child {
    border-bottom: none;
  }
  
  .activity-item:hover {
    background: rgba(255,255,255,0.02);
  }
  
  .activity-avatar {
    position: relative;
    flex-shrink: 0;
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    background: rgba(255,255,255,0.08);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(255,255,255,0.8);
  }
  
  .activity-badge {
    position: absolute;
    bottom: -4px;
    right: -4px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 0.65rem;
    border: 2px solid #0c0c0e;
  }
  
  .activity-badge.post { background: #6366f1; color: #fff; }
  .activity-badge.like { background: #ef4444; color: #fff; }
  .activity-badge.follow { background: #22c55e; color: #fff; }
  .activity-badge.comment { background: #f59e0b; color: #fff; }
  .activity-badge.mention { background: #8b5cf6; color: #fff; }
  
  .activity-content {
    flex: 1;
    min-width: 0;
  }
  
  .activity-text {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.7);
    line-height: 1.4;
  }
  
  .user-name {
    color: #fff;
    font-weight: 600;
  }
  
  .target-text {
    color: #818cf8;
  }
  
  .count-badge {
    display: inline-block;
    padding: 2px 8px;
    background: rgba(255,255,255,0.06);
    border-radius: 10px;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.5);
    margin-left: 4px;
  }
  
  .activity-preview {
    margin: 8px 0 0;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.5);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .comment-bubble {
    margin-top: 8px;
    padding: 10px 14px;
    background: rgba(255,255,255,0.04);
    border-radius: 10px;
    font-size: 0.8rem;
    color: rgba(255,255,255,0.7);
    font-style: italic;
    line-height: 1.4;
  }
  
  .activity-time {
    display: block;
    margin-top: 6px;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.35);
  }
</style>
```

---

### 3. Comment Thread

A nested comment thread with replies and reactions:

```svelte
<script>
  let comments = $state([
    {
      id: 1,
      user: { name: 'Emma Wilson', initials: 'EW' },
      content: 'This is a really well-thought-out approach. Have you considered how this would scale with larger datasets?',
      time: '2 hours ago',
      likes: 8,
      liked: false,
      replies: [
        {
          id: 2,
          user: { name: 'Original Author', initials: 'OA', isAuthor: true },
          content: 'Great question! We\'ve tested with up to 10M records and it handles it well. The key is the lazy loading strategy.',
          time: '1 hour ago',
          likes: 4,
          liked: true
        },
        {
          id: 3,
          user: { name: 'David Park', initials: 'DP' },
          content: 'Would love to see a follow-up post on the lazy loading implementation!',
          time: '45 min ago',
          likes: 2,
          liked: false
        }
      ]
    },
    {
      id: 4,
      user: { name: 'Sophie Chen', initials: 'SC' },
      content: '🙌 Bookmarking this for future reference. Exactly what I needed for my current project.',
      time: '1 hour ago',
      likes: 3,
      liked: false,
      replies: []
    }
  ]);
  
  function toggleLike(commentId, parentId = null) {
    if (parentId) {
      const parent = comments.find(c => c.id === parentId);
      const reply = parent.replies.find(r => r.id === commentId);
      reply.liked = !reply.liked;
      reply.likes += reply.liked ? 1 : -1;
    } else {
      const comment = comments.find(c => c.id === commentId);
      comment.liked = !comment.liked;
      comment.likes += comment.liked ? 1 : -1;
    }
    comments = [...comments];
  }
</script>

<div class="comments-section">
  <div class="comments-header">
    <h3 class="comments-title">Comments</h3>
    <span class="comments-count">{comments.length + comments.reduce((a, c) => a + c.replies.length, 0)}</span>
  </div>
  
  <div class="comment-input-wrapper">
    <div class="input-avatar">Y</div>
    <input type="text" class="comment-input" placeholder="Add a comment..." />
  </div>
  
  <div class="comments-list">
    {#each comments as comment}
      <div class="comment">
        <div class="comment-avatar">{comment.user.initials}</div>
        <div class="comment-body">
          <div class="comment-header">
            <span class="comment-author">{comment.user.name}</span>
            <span class="comment-time">{comment.time}</span>
          </div>
          <p class="comment-content">{comment.content}</p>
          <div class="comment-actions">
            <button 
              class="action-btn"
              class:liked={comment.liked}
              onclick={() => toggleLike(comment.id)}
            >
              <span class="heart">{comment.liked ? '♥' : '♡'}</span>
              <span>{comment.likes}</span>
            </button>
            <button class="action-btn">Reply</button>
          </div>
          
          {#if comment.replies.length > 0}
            <div class="replies">
              {#each comment.replies as reply}
                <div class="comment reply">
                  <div class="comment-avatar" class:author={reply.user.isAuthor}>
                    {reply.user.initials}
                  </div>
                  <div class="comment-body">
                    <div class="comment-header">
                      <span class="comment-author">
                        {reply.user.name}
                        {#if reply.user.isAuthor}
                          <span class="author-badge">Author</span>
                        {/if}
                      </span>
                      <span class="comment-time">{reply.time}</span>
                    </div>
                    <p class="comment-content">{reply.content}</p>
                    <div class="comment-actions">
                      <button 
                        class="action-btn"
                        class:liked={reply.liked}
                        onclick={() => toggleLike(reply.id, comment.id)}
                      >
                        <span class="heart">{reply.liked ? '♥' : '♡'}</span>
                        <span>{reply.likes}</span>
                      </button>
                      <button class="action-btn">Reply</button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .comments-section {
    max-width: 560px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 20px;
  }
  
  .comments-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  
  .comments-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }
  
  .comments-count {
    padding: 2px 10px;
    background: rgba(255,255,255,0.08);
    border-radius: 10px;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.6);
  }
  
  .comment-input-wrapper {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
  }
  
  .input-avatar {
    width: 36px;
    height: 36px;
    background: rgba(99, 102, 241, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
    color: #818cf8;
    flex-shrink: 0;
  }
  
  .comment-input {
    flex: 1;
    padding: 10px 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    color: #fff;
    font-size: 0.85rem;
  }
  
  .comment-input::placeholder {
    color: rgba(255,255,255,0.35);
  }
  
  .comment-input:focus {
    outline: none;
    border-color: #6366f1;
  }
  
  .comments-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .comment {
    display: flex;
    gap: 12px;
  }
  
  .comment-avatar {
    width: 36px;
    height: 36px;
    background: rgba(255,255,255,0.08);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(255,255,255,0.7);
    flex-shrink: 0;
  }
  
  .comment-avatar.author {
    background: rgba(99, 102, 241, 0.2);
    color: #818cf8;
  }
  
  .comment-body {
    flex: 1;
    min-width: 0;
  }
  
  .comment-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }
  
  .comment-author {
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
  }
  
  .author-badge {
    display: inline-block;
    padding: 2px 8px;
    background: rgba(99, 102, 241, 0.15);
    border-radius: 8px;
    font-size: 0.65rem;
    color: #818cf8;
    font-weight: 500;
    margin-left: 4px;
  }
  
  .comment-time {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.35);
  }
  
  .comment-content {
    margin: 0 0 8px;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.8);
    line-height: 1.5;
  }
  
  .comment-actions {
    display: flex;
    gap: 16px;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    padding: 0;
    transition: color 0.15s ease;
  }
  
  .action-btn:hover {
    color: rgba(255,255,255,0.8);
  }
  
  .action-btn.liked {
    color: #ef4444;
  }
  
  .heart {
    font-size: 0.9rem;
  }
  
  .replies {
    margin-top: 16px;
    padding-left: 20px;
    border-left: 2px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .reply .comment-avatar {
    width: 28px;
    height: 28px;
    font-size: 0.7rem;
  }
</style>
```

---

### 4. Follow Suggestions

A list of user suggestions with follow actions:

```svelte
<script>
  let suggestions = $state([
    { 
      id: 1, 
      name: 'Sarah Martinez', 
      initials: 'SM',
      username: '@smartinez',
      bio: 'Frontend Developer at Stripe',
      mutuals: 12,
      following: false
    },
    { 
      id: 2, 
      name: 'James Wright', 
      initials: 'JW',
      username: '@jwright',
      bio: 'Building the future of AI',
      mutuals: 8,
      following: false
    },
    { 
      id: 3, 
      name: 'Lisa Chen', 
      initials: 'LC',
      username: '@lisachen',
      bio: 'Product Designer • Ex-Apple',
      mutuals: 24,
      following: false
    },
    { 
      id: 4, 
      name: 'Mike Johnson', 
      initials: 'MJ',
      username: '@mikej',
      bio: 'TypeScript enthusiast 🚀',
      mutuals: 5,
      following: false
    }
  ]);
  
  function toggleFollow(id) {
    suggestions = suggestions.map(s => 
      s.id === id ? { ...s, following: !s.following } : s
    );
  }
  
  function dismiss(id) {
    suggestions = suggestions.filter(s => s.id !== id);
  }
</script>

<div class="suggestions-card">
  <div class="card-header">
    <h3 class="card-title">Suggested for you</h3>
    <button class="see-all">See all</button>
  </div>
  
  <div class="suggestions-list">
    {#each suggestions as user (user.id)}
      <div class="suggestion-item">
        <div class="user-avatar">{user.initials}</div>
        
        <div class="user-info">
          <span class="user-name">{user.name}</span>
          <span class="user-username">{user.username}</span>
          <span class="user-bio">{user.bio}</span>
          <span class="mutuals">{user.mutuals} mutual connections</span>
        </div>
        
        <div class="item-actions">
          <button 
            class="follow-btn"
            class:following={user.following}
            onclick={() => toggleFollow(user.id)}
          >
            {user.following ? '✓ Following' : 'Follow'}
          </button>
          <button class="dismiss-btn" onclick={() => dismiss(user.id)}>×</button>
        </div>
      </div>
    {/each}
  </div>
  
  {#if suggestions.length === 0}
    <div class="empty-state">
      <span class="empty-icon">◎</span>
      <span>No more suggestions</span>
    </div>
  {/if}
</div>

<style>
  .suggestions-card {
    max-width: 400px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    overflow: hidden;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  
  .card-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #fff;
  }
  
  .see-all {
    background: none;
    border: none;
    color: #818cf8;
    font-size: 0.8rem;
    cursor: pointer;
  }
  
  .see-all:hover {
    text-decoration: underline;
  }
  
  .suggestions-list {
    display: flex;
    flex-direction: column;
  }
  
  .suggestion-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    transition: background 0.15s ease;
  }
  
  .suggestion-item:last-child {
    border-bottom: none;
  }
  
  .suggestion-item:hover {
    background: rgba(255,255,255,0.02);
  }
  
  .user-avatar {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    flex-shrink: 0;
  }
  
  .user-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .user-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
  }
  
  .user-username {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.45);
  }
  
  .user-bio {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.6);
    margin-top: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .mutuals {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.35);
    margin-top: 4px;
  }
  
  .item-actions {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    flex-shrink: 0;
  }
  
  .follow-btn {
    padding: 6px 16px;
    background: #6366f1;
    border: none;
    border-radius: 16px;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .follow-btn:hover {
    background: #4f46e5;
  }
  
  .follow-btn.following {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.8);
  }
  
  .dismiss-btn {
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    border-radius: 50%;
    color: rgba(255,255,255,0.3);
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s ease;
    opacity: 0;
  }
  
  .suggestion-item:hover .dismiss-btn {
    opacity: 1;
  }
  
  .dismiss-btn:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 40px;
    color: rgba(255,255,255,0.4);
    font-size: 0.9rem;
  }
  
  .empty-icon {
    font-size: 2rem;
    opacity: 0.4;
  }
</style>
```

---

### 5. Reaction Picker

An emoji reaction picker with animation:

```svelte
<script>
  let isOpen = $state(false);
  let selectedReactions = $state(['👍']);
  
  const reactions = ['👍', '❤️', '😄', '🎉', '🤔', '😢', '🔥'];
  
  function toggleReaction(emoji) {
    if (selectedReactions.includes(emoji)) {
      selectedReactions = selectedReactions.filter(e => e !== emoji);
    } else {
      selectedReactions = [...selectedReactions, emoji];
    }
  }
  
  function hasReaction(emoji) {
    return selectedReactions.includes(emoji);
  }
</script>

<div class="reaction-demo">
  <div class="post-preview">
    <p class="post-text">Just shipped a major update! 🚀 Thanks to everyone who contributed.</p>
  </div>
  
  <div class="reactions-bar">
    {#if selectedReactions.length > 0}
      <div class="selected-reactions">
        {#each selectedReactions as emoji}
          <button 
            class="reaction-badge"
            onclick={() => toggleReaction(emoji)}
          >
            <span class="emoji">{emoji}</span>
            <span class="count">1</span>
          </button>
        {/each}
      </div>
    {/if}
    
    <div class="add-reaction">
      <button 
        class="add-btn"
        onclick={() => isOpen = !isOpen}
      >
        {isOpen ? '×' : '+'}
      </button>
      
      {#if isOpen}
        <div class="reaction-picker">
          {#each reactions as emoji, i}
            <button 
              class="reaction-option"
              class:selected={hasReaction(emoji)}
              style="animation-delay: {i * 0.03}s"
              onclick={() => toggleReaction(emoji)}
            >
              {emoji}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .reaction-demo {
    max-width: 400px;
    background: #0c0c0e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 20px;
  }
  
  .post-preview {
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    margin-bottom: 16px;
  }
  
  .post-text {
    margin: 0;
    font-size: 0.9rem;
    color: rgba(255,255,255,0.85);
    line-height: 1.5;
  }
  
  .reactions-bar {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .selected-reactions {
    display: flex;
    gap: 8px;
  }
  
  .reaction-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .reaction-badge:hover {
    background: rgba(255,255,255,0.1);
    transform: scale(1.05);
  }
  
  .emoji {
    font-size: 0.95rem;
  }
  
  .count {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.6);
    font-weight: 500;
  }
  
  .add-reaction {
    position: relative;
  }
  
  .add-btn {
    width: 32px;
    height: 32px;
    background: rgba(255,255,255,0.04);
    border: 1px dashed rgba(255,255,255,0.15);
    border-radius: 50%;
    color: rgba(255,255,255,0.4);
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .add-btn:hover {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.7);
  }
  
  .reaction-picker {
    position: absolute;
    bottom: calc(100% + 12px);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 4px;
    padding: 8px 12px;
    background: #1a1a1d;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }
  
  .reaction-picker::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #1a1a1d;
  }
  
  .reaction-option {
    width: 36px;
    height: 36px;
    background: transparent;
    border: none;
    border-radius: 50%;
    font-size: 1.25rem;
    cursor: pointer;
    transition: all 0.15s ease;
    animation: popIn 0.2s ease backwards;
  }
  
  @keyframes popIn {
    from {
      opacity: 0;
      transform: scale(0.5);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .reaction-option:hover {
    background: rgba(255,255,255,0.1);
    transform: scale(1.3);
  }
  
  .reaction-option.selected {
    background: rgba(99, 102, 241, 0.2);
  }
</style>
```

---

### 6. Share Sheet

A social share sheet with copy link functionality:

```svelte
<script>
  let isOpen = $state(true);
  let copied = $state(false);
  
  const shareOptions = [
    { name: 'Twitter', icon: '𝕏', color: '#000' },
    { name: 'Facebook', icon: 'f', color: '#1877f2' },
    { name: 'LinkedIn', icon: 'in', color: '#0a66c2' },
    { name: 'Reddit', icon: '◎', color: '#ff4500' },
    { name: 'Email', icon: '✉', color: '#6366f1' }
  ];
  
  const shareUrl = 'https://example.com/post/123';
  
  async function copyLink() {
    await navigator.clipboard?.writeText(shareUrl);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }
</script>

{#if isOpen}
<div class="share-overlay">
  <div class="share-sheet">
    <div class="sheet-header">
      <h3 class="sheet-title">Share</h3>
      <button class="close-btn" onclick={() => isOpen = false}>×</button>
    </div>
    
    <div class="share-options">
      {#each shareOptions as option}
        <button class="share-option">
          <div class="option-icon" style="background: {option.color}">
            {option.icon}
          </div>
          <span class="option-name">{option.name}</span>
        </button>
      {/each}
    </div>
    
    <div class="copy-section">
      <div class="url-display">
        <span class="url-text">{shareUrl}</span>
      </div>
      <button 
        class="copy-btn"
        class:copied
        onclick={copyLink}
      >
        {copied ? '✓ Copied!' : 'Copy'}
      </button>
    </div>
  </div>
</div>
{/if}

<style>
  .share-overlay {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 24px;
  }
  
  .share-sheet {
    width: 100%;
    max-width: 360px;
    background: #0f0f11;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px 20px 20px 20px;
    padding: 20px;
    animation: slideUp 0.3s ease;
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .sheet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .sheet-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
  }
  
  .close-btn {
    width: 32px;
    height: 32px;
    background: rgba(255,255,255,0.06);
    border: none;
    border-radius: 50%;
    color: rgba(255,255,255,0.6);
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .close-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }
  
  .share-options {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    margin-bottom: 24px;
  }
  
  .share-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px 8px;
    background: transparent;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  
  .share-option:hover {
    background: rgba(255,255,255,0.04);
  }
  
  .option-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
    transition: transform 0.15s ease;
  }
  
  .share-option:hover .option-icon {
    transform: scale(1.1);
  }
  
  .option-name {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.6);
  }
  
  .copy-section {
    display: flex;
    gap: 10px;
    padding: 12px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
  }
  
  .url-display {
    flex: 1;
    min-width: 0;
    padding: 8px 12px;
    background: rgba(255,255,255,0.04);
    border-radius: 8px;
  }
  
  .url-text {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.5);
    font-family: 'SF Mono', monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: block;
  }
  
  .copy-btn {
    padding: 8px 20px;
    background: #6366f1;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }
  
  .copy-btn:hover {
    background: #4f46e5;
  }
  
  .copy-btn.copied {
    background: #22c55e;
  }
</style>
```

---

## Summary

This collection fosters connection through:

1. **Profile Headers** — Rich user display with stats and follow actions
2. **Activity Feeds** — Event-typed timelines with preview content
3. **Comment Threads** — Nested replies with author badges
4. **Follow Suggestions** — User discovery with mutual counts
5. **Reaction Pickers** — Animated emoji selection
6. **Share Sheets** — Platform-aware sharing with copy link

---

*Social design is about belonging. Make every user feel seen.*
