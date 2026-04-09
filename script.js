/**
 * HEARTBEAT Core Logic
 * Handles dynamic content rendering, persistence, and cinematic redirection.
 */

// Default Content Library (Empty for user-driven experience)
const DEFAULT_CONTENT = [];

class StreamVault {
    constructor() {
        this.content = [];
        this.editMode = false;
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.loadContent();
        this.setupEventListeners();
        this.renderAll();
    }

    // Load content from defaults and localStorage
    loadContent() {
        const stored = JSON.parse(localStorage.getItem('streamvault_content') || '[]');
        this.content = [...DEFAULT_CONTENT, ...stored];
    }

    // Save or Update content
    saveContent(newItem) {
        let stored = JSON.parse(localStorage.getItem('streamvault_content') || '[]');
        
        if (this.editMode && this.currentEditId) {
            // Update mode
            const index = stored.findIndex(item => item.id === this.currentEditId);
            if (index !== -1) {
                stored[index] = { ...newItem, id: this.currentEditId };
            }
            this.exitEditMode();
        } else {
            // Create mode
            if (newItem.featured) {
                stored = stored.map(item => ({ ...item, featured: false }));
            }
            stored.push(newItem);
        }
        
        localStorage.setItem('streamvault_content', JSON.stringify(stored));
        this.loadContent();
        this.renderAll();
    }

    // Delete content
    deleteContent(id) {
        let stored = JSON.parse(localStorage.getItem('streamvault_content') || '[]');
        stored = stored.filter(item => item.id !== id);
        localStorage.setItem('streamvault_content', JSON.stringify(stored));
        this.loadContent();
        this.renderAll();
    }

    // Duplicate content
    duplicateItem(id) {
        const item = this.content.find(i => i.id === id);
        if (!item) return;

        const newItem = {
            ...item,
            id: 'user-' + Date.now(),
            title: item.title + ' (Copy)',
            featured: false
        };

        let stored = JSON.parse(localStorage.getItem('streamvault_content') || '[]');
        stored.push(newItem);
        localStorage.setItem('streamvault_content', JSON.stringify(stored));
        this.loadContent();
        this.renderAdminList();
        this.renderAll();
        alert('Content Duplicated!');
    }

    // Rendering Logic
    renderAll() {
        const container = document.getElementById('content-container');
        if (!container) return; // Not on home page

        container.innerHTML = '';
        const categories = [...new Set(this.content.map(item => item.category))];
        
        categories.forEach(cat => {
            const row = document.createElement('section');
            row.className = 'content-row';
            const items = this.content.filter(item => item.category === cat);
            if (items.length === 0) return;
            
            row.innerHTML = `
                <div class="row-header">
                    <h2 class="row-title">${cat}</h2>
                </div>
                <div class="row-cards">
                    ${items.map(item => `
                        <article class="card" data-id="${item.id}">
                            <img class="card-thumb" src="${item.thumbPortrait}" alt="${item.title}" loading="lazy">
                            <div class="card-overlay">
                                <span class="play-icon">▶</span>
                            </div>
                            <div class="card-info">
                                <h3 class="card-title">${item.title}</h3>
                                <div class="card-meta">
                                    <span>HD</span>
                                    <span>${new Date(item.publishDate).getFullYear()}</span>
                                </div>
                            </div>
                        </article>
                    `).join('')}
                </div>
            `;
            container.appendChild(row);
        });

        // Update Hero (Featured)
        this.updateHero();
    }

    updateHero() {
        const featured = this.content.find(item => item.featured) || (this.content.length > 0 ? this.content[this.content.length - 1] : null);
        const hero = document.getElementById('hero-banner');
        if (hero) {
            if (featured) {
                const title = document.getElementById('featured-title');
                const desc = document.getElementById('featured-desc');
                hero.style.backgroundImage = `url('${featured.thumbLandscape}')`;
                hero.style.display = 'flex';
                if (title) title.textContent = featured.title;
                if (desc) desc.textContent = featured.desc;
                hero.onclick = () => this.navigateToWatch(featured.id);
            } else {
                hero.style.display = 'none';
            }
        }
    }

    // UI Interaction Setup
    setupEventListeners() {
        // Navbar scroll
        window.addEventListener('scroll', () => {
            const nav = document.getElementById('navbar');
            if (nav) {
                window.scrollY > 50 ? nav.classList.add('scrolled') : nav.classList.remove('scrolled');
            }
        });

        // Home page card clicks
        const container = document.getElementById('content-container');
        if (container) {
            container.addEventListener('click', (e) => {
                const card = e.target.closest('.card');
                if (card) this.navigateToWatch(card.dataset.id);
            });
        }

        // Recommendations clicks
        const recContainer = document.getElementById('recommendations-container');
        if (recContainer) {
            recContainer.addEventListener('click', (e) => {
                const card = e.target.closest('.card');
                if (card) this.navigateToWatch(card.dataset.id);
            });
        }

        // Admin Form
        const adminForm = document.getElementById('admin-form');
        if (adminForm) {
            adminForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Collect episodes if series
                const episodes = [];
                if (document.getElementById('contentType').value === 'Series') {
                    const rows = document.querySelectorAll('.episode-row');
                    rows.forEach(row => {
                        const title = row.querySelector('.ep-title-input').value;
                        const link = row.querySelector('.ep-link-input').value;
                        if (title && link) episodes.push({ title, link });
                    });
                }

                const newItem = {
                    id: this.currentEditId || 'user-' + Date.now(),
                    title: document.getElementById('title').value,
                    type: document.getElementById('contentType').value,
                    thumbPortrait: document.getElementById('thumbPortrait').value,
                    thumbLandscape: document.getElementById('thumbLandscape').value,
                    category: document.getElementById('category').value,
                    desc: document.getElementById('content').value,
                    publishDate: document.getElementById('publishDate').value || new Date().toISOString().split('T')[0],
                    featured: document.getElementById('is-featured').checked,
                    videoLink: document.getElementById('videoLink').value,
                    episodes: episodes
                };
                this.saveContent(newItem);
                adminForm.reset();
                document.getElementById('publishDate').valueAsDate = new Date();
                this.exitEditMode(); // Ensure UI resets
                this.renderAdminList();
                alert(this.editMode ? 'Content Updated!' : 'Content Published!');
            });

            document.getElementById('cancel-edit-btn').addEventListener('click', () => this.exitEditMode());
            this.renderAdminList();
        }
    }

    navigateToWatch(id) {
        window.location.href = `watch.html?id=${id}`;
    }

    // Admin List Rendering
    renderAdminList() {
        const listContainer = document.getElementById('admin-content-list');
        if (!listContainer) return;

        const stored = JSON.parse(localStorage.getItem('streamvault_content') || '[]');
        if (stored.length === 0) {
            listContainer.innerHTML = '<p class="loading-status">No content added yet.</p>';
            return;
        }

        listContainer.innerHTML = stored.map(item => `
            <div class="list-item">
                <img src="${item.thumbPortrait}" alt="${item.title}">
                <div class="list-item-info">
                    <h4>${item.title} ${item.featured ? '🌟' : ''}</h4>
                    <p>${item.type || 'Movie'} • ${item.category} • ${item.publishDate}</p>
                </div>
                <div class="list-actions">
                    <button class="duplicate-btn" onclick="app.duplicateItem('${item.id}')">Duplicate</button>
                    <button class="edit-btn" onclick="app.enterEditMode('${item.id}')">Edit</button>
                    <button class="delete-btn" onclick="app.deleteItem('${item.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    // Edit Mode Logic
    enterEditMode(id) {
        const item = this.content.find(i => i.id === id);
        if (!item) return;

        this.editMode = true;
        this.currentEditId = id;

        // Populate fields
        document.getElementById('title').value = item.title;
        document.getElementById('contentType').value = item.type || 'Movie';
        document.getElementById('thumbPortrait').value = item.thumbPortrait;
        document.getElementById('thumbLandscape').value = item.thumbLandscape;
        document.getElementById('category').value = item.category;
        document.getElementById('content').value = item.desc;
        document.getElementById('publishDate').value = item.publishDate;
        document.getElementById('is-featured').checked = item.featured;
        document.getElementById('videoLink').value = item.videoLink || '';

        // Handle Episodes
        const container = document.getElementById('episodes-container');
        container.innerHTML = '';
        if (item.episodes && item.episodes.length > 0) {
            item.episodes.forEach(ep => this.addEpisodeRow(ep));
        }

        this.toggleStreamTypeFields();

        // UI Updates
        document.getElementById('edit-mode-tag').style.display = 'inline-block';
        document.getElementById('submit-btn').innerHTML = '💾 Save Changes';
        document.getElementById('cancel-edit-btn').style.display = 'block';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    exitEditMode() {
        this.editMode = false;
        this.currentEditId = null;
        const form = document.getElementById('admin-form');
        if (form) {
            form.reset();
            document.getElementById('episodes-container').innerHTML = '';
            this.toggleStreamTypeFields();
        }
        
        document.getElementById('edit-mode-tag').style.display = 'none';
        document.getElementById('submit-btn').innerHTML = '🚀 Publish to Website';
        document.getElementById('cancel-edit-btn').style.display = 'none';
        document.getElementById('publishDate').valueAsDate = new Date();
    }

    deleteItem(id) {
        if (confirm('Delete this content?')) {
            this.deleteContent(id);
            this.renderAdminList();
        }
    }

    // Helper Methods for UI
    toggleStreamTypeFields() {
        const type = document.getElementById('contentType').value;
        const movieFields = document.getElementById('movie-fields');
        const seriesFields = document.getElementById('series-fields');
        
        if (type === 'Movie') {
            movieFields.style.display = 'block';
            seriesFields.style.display = 'none';
        } else {
            movieFields.style.display = 'none';
            seriesFields.style.display = 'block';
        }
    }

    addEpisodeRow(data = { title: '', link: '' }) {
        const container = document.getElementById('episodes-container');
        const row = document.createElement('div');
        row.className = 'episode-row';
        row.innerHTML = `
            <input type="text" placeholder="Ep Title (e.g. S1 E1)" value="${data.title}" class="ep-title-input" required>
            <input type="url" placeholder="Stream URL" value="${data.link}" class="ep-link-input" required>
            <button type="button" class="remove-ep-btn" onclick="this.parentElement.remove()">×</button>
        `;
        container.appendChild(row);
    }
}

class Auth {
    constructor() {
        this.adminEmail = 'heartbeatsseason3@gmail.com';
        this.adminPass = 'Tamilpriyan';
        this.sessionKey = 'heartbeat_auth_session';
    }

    login(email, password) {
        if (email === this.adminEmail && password === this.adminPass) {
            const token = btoa(email + Date.now()); // Simple mock token
            localStorage.setItem(this.sessionKey, token);
            return true;
        }
        return false;
    }

    logout() {
        localStorage.removeItem(this.sessionKey);
        window.location.href = 'index.html';
    }

    isLoggedIn() {
        return localStorage.getItem(this.sessionKey) !== null;
    }

    checkAuthRedirect() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
        }
    }
}

window.auth = new Auth();

document.addEventListener('DOMContentLoaded', () => {
    window.app = new StreamVault();
});
