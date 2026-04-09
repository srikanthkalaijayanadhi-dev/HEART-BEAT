// Content Data Array
const contentData = [
    {
        id: 1,
        title: "Echoes of Tomorrow",
        thumb: "assets/hero.png",
        category: "Featured",
        desc: "In a world where time is a currency, a mysterious traveler must race against the sunset to save humanity from an eternal night.",
        link: "https://example.com/play/echoes",
        year: 2026,
        rating: "9.8/10"
    },
    {
        id: 2,
        title: "Stellar Journey",
        thumb: "assets/poster1.png",
        category: "Trending Now",
        desc: "An epic sci-fi space adventure where a team of explorers discover a mysterious portal at the edge of the galaxy.",
        link: "https://example.com/play/stellar",
        year: 2025,
        rating: "8.5/10"
    },
    {
        id: 3,
        title: "Neon Pulse",
        thumb: "assets/poster2.png",
        category: "Trending Now",
        desc: "A gritty action thriller set in a futuristic city where high-speed car chases and explosions are part of everyday life.",
        link: "https://example.com/play/neon",
        year: 2026,
        rating: "9.2/10"
    },
    {
        id: 4,
        title: "Sunset Serenade",
        thumb: "assets/poster3.png",
        category: "Latest Uploads",
        desc: "A soulful romantic drama about two strangers meeting during a beautiful sunset on a remote hill and finding a deep connection.",
        link: "https://example.com/play/sunset",
        year: 2025,
        rating: "8.9/10"
    },
    {
        id: 5,
        title: "Galactic Frontier",
        thumb: "assets/poster1.png",
        category: "Popular",
        desc: "Follow the journey of a rogue astronaut as they explore uncharted territories of space and encounter alien life forms.",
        link: "https://example.com/play/galactic",
        year: 2024,
        rating: "7.8/10"
    },
    {
        id: 6,
        title: "Urban Chase",
        thumb: "assets/poster2.png",
        category: "Latest Uploads",
        desc: "A heart-pumping action film about a detective chasing an elusive criminal through the underground streets of a mega-city.",
        link: "https://example.com/play/urban",
        year: 2026,
        rating: "8.1/10"
    },
    {
        id: 7,
        title: "Eternal Horizon",
        thumb: "assets/poster3.png",
        category: "Popular",
        desc: "Explore the mysteries of time and space in this visually stunning philosophical drama about the future of humanity.",
        link: "https://example.com/play/eternal",
        year: 2025,
        rating: "9.5/10"
    },
    {
        id: 8,
        title: "Star Seekers",
        thumb: "assets/poster1.png",
        category: "Trending Now",
        desc: "A group of scientists must find a new home for the human race as Earth's resources are rapidly depleting.",
        link: "https://example.com/play/star",
        year: 2026,
        rating: "8.7/10"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const contentContainer = document.getElementById('content-container');
    const navbar = document.getElementById('navbar');
    const modal = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Group content by category
    const categories = [...new Set(contentData.filter(item => item.category !== "Featured").map(item => item.category))];

    // Render Rows
    categories.forEach(cat => {
        const row = document.createElement('section');
        row.className = 'content-row';
        
        const rowItems = contentData.filter(item => item.category === cat);
        
        row.innerHTML = `
            <div class="row-header">
                <h2 class="row-title">${cat}</h2>
            </div>
            <div class="row-cards">
                ${rowItems.map(item => `
                    <div class="card" data-id="${item.id}">
                        <img class="card-thumb" src="${item.thumb}" alt="${item.title}" loading="lazy">
                        <div class="card-overlay">
                            <span class="play-icon">▶</span>
                        </div>
                        <div class="card-info">
                            <h3 class="card-title">${item.title}</h3>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        contentContainer.appendChild(row);
    });

    // Modal Logic
    const openModal = (id) => {
        const item = contentData.find(i => i.id == id);
        if (!item) return;

        document.getElementById('modal-img').src = item.thumb;
        document.getElementById('modal-title').textContent = item.title;
        document.getElementById('modal-desc').textContent = item.desc;
        document.getElementById('modal-play-link').href = item.link;
        modal.querySelector('.year').textContent = item.year;
        modal.querySelector('.rating').textContent = item.rating;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scroll
    };

    const closeModal = () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scroll
    };

    // Event Delegation for Cards
    contentContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        if (card) {
            const id = card.getAttribute('data-id');
            openModal(id);
        }
    });

    // Hero Play Button
    document.querySelector('.btn-play').addEventListener('click', () => {
        openModal(1); // Open featured content
    });

    // Modal Events
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Close on Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
});
