const POSTS_MANIFEST_PATH = "posts/posts.json";
const THEME_STORAGE_KEY = "aster_blog_theme";
const MOBILE_BREAKPOINT = 700;

function formatDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate).trim());
  if (!match) {
    return "Unknown date";
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function getDateSortKey(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate).trim());
  if (!match) {
    return Number.NEGATIVE_INFINITY;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return (year * 10000) + (month * 100) + day;
}

function sanitizeText(text) {
  if (typeof text !== "string") {
    return "";
  }
  return text.trim();
}

function sortPostsDesc(posts) {
  return [...posts].sort((a, b) => {
    return getDateSortKey(b.date) - getDateSortKey(a.date);
  });
}

function sortPinnedPosts(posts) {
  return [...posts].sort((a, b) => {
    const aOrder = Number.isFinite(a.pinOrder) ? a.pinOrder : Number.MAX_SAFE_INTEGER;
    const bOrder = Number.isFinite(b.pinOrder) ? b.pinOrder : Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return getDateSortKey(b.date) - getDateSortKey(a.date);
  });
}

function warnOnDuplicateSlugs(posts) {
  const seen = new Set();
  for (const post of posts) {
    if (!post || typeof post.slug !== "string") {
      continue;
    }
    if (seen.has(post.slug)) {
      console.warn(`Duplicate slug found in posts manifest: ${post.slug}. Using first match.`);
      continue;
    }
    seen.add(post.slug);
  }
}

async function loadPosts() {
  const response = await fetch(POSTS_MANIFEST_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load posts manifest.");
  }

  const raw = await response.json();
  if (!Array.isArray(raw)) {
    throw new Error("Posts manifest must be an array.");
  }

  warnOnDuplicateSlugs(raw);

  const uniquePosts = [];
  const seen = new Set();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const slug = sanitizeText(entry.slug);
    const title = sanitizeText(entry.title);
    const date = sanitizeText(entry.date);
    const summary = sanitizeText(entry.summary);

    if (!slug || !title || !date || !summary) {
      continue;
    }

    if (seen.has(slug)) {
      continue;
    }

    seen.add(slug);
    const parsedPinOrder = Number(entry.pinOrder);
    uniquePosts.push({
      slug,
      title,
      date,
      summary,
      pinned: Boolean(entry.pinned),
      pinOrder: Number.isFinite(parsedPinOrder) ? parsedPinOrder : Number.MAX_SAFE_INTEGER,
      tags: Array.isArray(entry.tags) ? entry.tags.filter((tag) => typeof tag === "string") : [],
      coverImage: typeof entry.coverImage === "string" ? entry.coverImage : "",
      githubAuthor: typeof entry.githubAuthor === "string" ? entry.githubAuthor : ""
    });
  }

  return sortPostsDesc(uniquePosts);
}

function createPostCard(post, index = 0) {
  const card = document.createElement("article");
  card.className = `card card-reveal${post.pinned ? " pinned-card" : ""}`;
  card.style.animationDelay = `${0.14 + index * 0.07}s`;

  const displayTags = post.pinned ? ["pinned", ...post.tags] : post.tags;
  const tagsHtml = displayTags
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join("");

  const avatarHtml = post.githubAuthor ? 
    `<div class="author-info">
      <img src="${getGitHubAvatarUrl(post.githubAuthor)}" alt="${escapeHtml(post.githubAuthor)}'s avatar" class="author-avatar" loading="lazy">
      <a href="https://github.com/${encodeURIComponent(post.githubAuthor)}" target="_blank" rel="noopener" class="author-name">@${escapeHtml(post.githubAuthor)}</a>
    </div>` : "";

  card.innerHTML = `
    <div class="card-top">
      <h3><a href="post.html?${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a></h3>
      <time datetime="${escapeHtml(post.date)}">${formatDate(post.date)}</time>
    </div>
    ${avatarHtml ? `<div class="card-author">${avatarHtml}</div>` : ""}
    <p>${escapeHtml(post.summary)}</p>
    ${tagsHtml ? `<div class="tags">${tagsHtml}</div>` : ""}
  `;

  return card;
}

function renderPostList(posts, container, limit = null) {
  if (!container) {
    return;
  }

  container.innerHTML = "";
  const list = limit ? posts.slice(0, limit) : posts;

  if (!list.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = 'No posts yet. Add markdown files in <code>posts/post/</code> and update <code>posts/posts.json</code>.';
    container.innerHTML = '';
    container.appendChild(emptyState);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const [index, post] of list.entries()) {
    fragment.appendChild(createPostCard(post, index));
  }
  container.appendChild(fragment);
}

function findPostBySlug(posts, slug) {
  return posts.find((post) => post.slug === slug) || null;
}

async function loadMarkdownForPost(slug) {
  const primary = await fetch(`posts/post/${encodeURIComponent(slug)}.md`, { cache: "no-store" });
  if (primary.ok) {
    return primary.text();
  }

  const fallback = await fetch(`posts/${encodeURIComponent(slug)}.md`, { cache: "no-store" });
  if (fallback.ok) {
    return fallback.text();
  }

  throw new Error("Unable to load markdown file.");
}

function escapeHtml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getGitHubAvatarUrl(username) {
  if (!username || typeof username !== "string") {
    return "";
  }
  return `https://github.com/${encodeURIComponent(username)}.png?size=40`;
}

function setErrorState(container, message) {
  if (!container) {
    return;
  }
  container.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function initPetals() {
  const container = document.getElementById("petals");
  if (!container || container.dataset.initialized === "true") {
    return;
  }

  for (let i = 0; i < 18; i += 1) {
    const petal = document.createElement("div");
    petal.className = "petal";
    petal.style.left = `${Math.random() * 100}vw`;
    petal.style.width = `${4 + Math.random() * 5}px`;
    petal.style.height = `${6 + Math.random() * 6}px`;
    petal.style.animationDuration = `${8 + Math.random() * 14}s`;
    petal.style.animationDelay = `${Math.random() * 16}s`;
    petal.style.borderRadius = Math.random() > 0.5 ? "80% 0 80% 0" : "0 80% 0 80%";
    container.appendChild(petal);
  }

  container.dataset.initialized = "true";
}

function initThemeToggle() {
  const themeBtn = document.getElementById("theme-btn");
  if (!themeBtn || themeBtn.dataset.initialized === "true") {
    return;
  }

  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  let savedTheme = null;

  try {
    savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    savedTheme = null;
  }

  const initialTheme = savedTheme === "dark" || savedTheme === "light"
    ? savedTheme
    : (prefersDark ? "dark" : "light");
  let currentTheme = initialTheme;

  function applyTheme(theme, persist = true) {
    const dark = theme === "dark";
    document.documentElement.setAttribute("data-theme", dark ? "" : "light");
    themeBtn.textContent = dark ? "☾" : "☀";
    themeBtn.setAttribute("aria-label", dark ? "Current theme: dark. Switch to light theme" : "Current theme: light. Switch to dark theme");

    if (persist) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch (error) {
        // Ignore localStorage write failures.
      }
    }
  }

  applyTheme(currentTheme, false);

  themeBtn.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(currentTheme, true);
  });

  themeBtn.dataset.initialized = "true";
}

function initMenuToggle() {
  const menuBtn = document.getElementById("menu-btn");
  const nav = document.getElementById("header-nav");
  const themeBtn = document.getElementById("theme-btn");
  if (!menuBtn || !nav || menuBtn.dataset.initialized === "true") {
    return;
  }

  function closeMenu() {
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    nav.classList.add("open");
    menuBtn.setAttribute("aria-expanded", "true");
  }

  function toggleMenu() {
    if (nav.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  menuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu();
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!nav.contains(target) && target !== menuBtn) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  for (const link of nav.querySelectorAll("a")) {
    link.addEventListener("click", () => {
      closeMenu();
    });
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      closeMenu();
    });
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > MOBILE_BREAKPOINT) {
      closeMenu();
    }
  });

  window.addEventListener("scroll", () => {
    closeMenu();
  }, { passive: true });

  closeMenu();
  menuBtn.dataset.initialized = "true";
}

function initChrome() {
  initPetals();
  initThemeToggle();
  initMenuToggle();
}

window.blogData = {
  loadPosts,
  sortPinnedPosts,
  renderPostList,
  findPostBySlug,
  loadMarkdownForPost,
  setErrorState,
  formatDate,
  escapeHtml,
  initChrome
};
