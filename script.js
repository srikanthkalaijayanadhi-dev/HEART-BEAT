/**
 * HEARTBEAT Core Logic - Supabase Edition
 * Handles dynamic content rendering, persistence, and cinematic redirection.
 */

class StreamVault {
    constructor() {
        this.content = [];
        this.editMode = false;
        this.currentEditId = null;
        this.init();
    }

    async init() {
        // Show loading state immediately
        const container = document.getElementById('content-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align:center; padding: 4rem 2rem; color: #aaa;">
                    <div style="font-size:2rem; margin-bottom:1rem;">⏳</div>
                    <p>Loading content...</p>
                </div>`;
        }
        await this.loadContent();
        this.setupEventListeners();
        this.renderAll();
    }

    // Load content from Supabase
    async loadContent() {
        console.log('[HEARTBEAT] Fetching content from Supabase...');
        const { data, error } = await supabase
            .from('content')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[HEARTBEAT] Error loading content:', error.message);
            // Show error on home page
            const container = document.getElementById('content-container');
            if (container) {
                container.innerHTML = `
                    <div style="text-align:center; padding: 4rem 2rem; color:#e57373;">
                        <div style="font-size:2rem; margin-bottom:1rem;">⚠️</div>
                        <p><strong>Could not load content.</strong></p>
                        <p style="font-size:0.85rem; color:#aaa; margin-top:0.5rem;">${error.message}</p>
                    </div>`;
            }
            return;
        }

        console.log('[HEARTBEAT] Loaded', data.length, 'items from Supabase.');

        // Map snake_case from DB back to camelCase for JS
        this.content = data.map(item => ({
            id: item.id,
            title: item.title,
            type: item.type,
            thumbPortrait: item.thumb_portrait,
            thumbLandscape: item.thumb_landscape,
            category: item.category,
            desc: item.description,
            publishDate: item.publish_date,
            featured: item.featured,
            videoLink: item.video_link,
            episodes: item.episodes || []
        }));

        this.renderAll();
        if (document.getElementById('admin-content-list')) {
            this.renderAdminList();
        }
    }

    // Save or Update content
    async saveContent(newItem) {
        const dbItem = {
            title: newItem.title,
            type: newItem.type,
            thumb_portrait: newItem.thumbPortrait,
            thumb_landscape: newItem.thumbLandscape,
            category: newItem.category,
            description: newItem.desc,
            publish_date: newItem.publishDate,
            featured: newItem.featured,
            video_link: newItem.videoLink,
            episodes: newItem.episodes
        };

        if (this.editMode && this.currentEditId) {
            // Update mode
            const { error } = await supabase
                .from('content')
                .update(dbItem)
                .eq('id', this.currentEditId);
            
            if (error) {
                alert('Error updating: ' + error.message);
                return;
            }
            this.exitEditMode();
        } else {
            // Create mode
            // If featured, we might want to unfeature others (optional, Supabase can do this with a trigger or manual call)
            if (newItem.featured) {
                await supabase.from('content').update({ featured: false }).neq('id', '00000000-0000-0000-0000-000000000000');
            }

            const { error } = await supabase
                .from('content')
                .insert([dbItem]);

            if (error) {
                alert('Error publishing: ' + error.message);
                return;
            }
        }
        
        await this.loadContent();
        alert(this.editMode ? 'Content Updated!' : 'Content Published!');
    }

    // Delete content
    async deleteContent(id) {
        const { error } = await supabase
            .from('content')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error deleting: ' + error.message);
            return;
        }
        await this.loadContent();
    }

    // Duplicate content
    async duplicateItem(id) {
        const item = this.content.find(i => i.id === id);
        if (!item) return;

        const newItem = {
            ...item,
            title: item.title + ' (Copy)',
            featured: false
        };
        delete newItem.id; // Let DB generate new UUID

        await this.saveContent(newItem);
    }

    // Rendering Logic
    renderAll() {
        const container = document.getElementById('content-container');
        if (!container) return; // Not on home page

        container.innerHTML = '';

        if (this.content.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding: 5rem 2rem; color:#aaa;">
                    <div style="font-size:3rem; margin-bottom:1rem;">🎬</div>
                    <h2 style="color:#fff; margin-bottom:0.5rem;">No Content Yet</h2>
                    <p>Go to the <a href="admin.html" style="color:#e50914;">Admin Panel</a> to publish your first movie or series.</p>
                </div>`;
            this.updateHero();
            return;
        }

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
                                    <span>${item.publishDate ? new Date(item.publishDate).getFullYear() : ''}</span>
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
        const featured = this.content.find(item => item.featured) || (this.content.length > 0 ? this.content[0] : null);
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
            adminForm.addEventListener('submit', async (e) => {
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
                
                await this.saveContent(newItem);
                adminForm.reset();
                document.getElementById('publishDate').valueAsDate = new Date();
                this.exitEditMode(); 
            });

            document.getElementById('cancel-edit-btn').addEventListener('click', () => this.exitEditMode());
        }
    }

    navigateToWatch(id) {
        window.location.href = `watch.html?id=${id}`;
    }

    // Admin List Rendering
    renderAdminList() {
        const listContainer = document.getElementById('admin-content-list');
        if (!listContainer) return;

        if (this.content.length === 0) {
            listContainer.innerHTML = '<p class="loading-status">No content added yet.</p>';
            return;
        }

        listContainer.innerHTML = this.content.map(item => `
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
        document.getElementById('edit-mode-tag').classList.remove('hidden-initial');
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
        
        document.getElementById('edit-mode-tag').classList.add('hidden-initial');
        document.getElementById('submit-btn').innerHTML = '🚀 Publish to Website';
        document.getElementById('cancel-edit-btn').style.display = 'none';
        document.getElementById('publishDate').valueAsDate = new Date();
    }

    async deleteItem(id) {
        if (confirm('Delete this content?')) {
            await this.deleteContent(id);
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
        this.session = null;
        this.ready = this.init();
    }

    async init() {
        const { data: { session } } = await supabase.auth.getSession();
        this.session = session;

        // Listen for changes
        supabase.auth.onAuthStateChange((_event, session) => {
            this.session = session;
        });

        return this.session;
    }

    async login(email, password) {
        if (!supabase) {
            return { success: false, message: 'Supabase client not initialized. Check console for details.' };
        }
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Login error:', error.message);
            return { success: false, message: error.message };
        }

        this.session = data.session;
        return { success: true, message: 'OK' };
    }

    async logout() {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    }

    isLoggedIn() {
        return this.session !== null;
    }
}

window.auth = new Auth();

document.addEventListener('DOMContentLoaded', () => {
    window.app = new StreamVault();
});

