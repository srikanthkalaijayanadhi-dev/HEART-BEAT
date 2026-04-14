/**
 * HEARTBEAT OTT - Ultra-Fast Ad Management & Anti-Adblock System
 * 
 * Performance Optimized: Uses Preconnect and Instant Injection.
 * Protection: Detects active Adblockers and prompts user.
 */

const hbAds = {
    // Config: Ad Keys and IDs
    config: {
        popunder: '458c9f092462724a78a8ae9c2bf80302',
        socialBar: '60cb5f0889c1e330ca1d61468cf24463',
        native: 'bffbb4961dd36eb378059f650898208d',
        banners: {
            mobile: { key: '9a8b5463af7198d7e1f85ae9b5e3ed3a', width: 320, height: 50 },
            tablet: { key: 'ac336691245996987dbc9eb1a404b79d', width: 468, height: 60 },
            desktop: { key: '30d89e8d807838eeec0944f8365d8026', width: 728, height: 90 },
            square: { key: '3ecdc2ee3b3151296381c656599fc3c2', width: 300, height: 250 },
            sidebar: { key: '8d5e717f7c596ae98176c049e3085163', width: 160, height: 600 }
        }
    },

    init: function() {
        console.log('[HEARTBEAT] Ad Network Tuning: Turbo Mode Engaged.');
        
        // 1. Fire global ads (Now handled directly in HTML for max speed)
        
        // 2. Start Adblock Detection
        this.detectAdblock();
        
        // 3. Render placements
        this.renderAllPlacements();
        
        // Handle window resize for responsive placements
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.renderAllPlacements(), 500);
        });
    },

    loadGlobalAds: function() {
        // Popunder - High Priority
        this.appendScript(`https://pl29146922.profitablecpmratenetwork.com/45/8c/9f/${this.config.popunder}.js`, false, true);
        
        // Social Bar - Low Priority (Append to Body)
        this.appendScript(`https://pl29146924.profitablecpmratenetwork.com/60/cb/5f/${this.config.socialBar}.js`, true, true);
    },

    detectAdblock: function() {
        // Method 1: Check if a dummy ad div is hidden
        const detector = document.createElement('div');
        detector.className = 'ad-placement adunit adsbox pub_300x250 pub_728x90 text-ad text_ad text_ads text-ads text_ad_container';
        detector.style.cssText = 'position: absolute; top: -999px; left: -999px; width: 1px; height: 1px;';
        document.body.appendChild(detector);

        window.setTimeout(() => {
            const isBlocked = window.getComputedStyle(detector).display === 'none' || 
                              detector.offsetHeight === 0 || 
                              window.getComputedStyle(detector).visibility === 'hidden';
            
            if (isBlocked) {
                console.warn('[HEARTBEAT] Adblock detected. Restricting features.');
                document.getElementById('adblock-notice')?.classList.remove('hidden');
            }
            detector.remove();
        }, 800);
    },

    renderAllPlacements: function() {
        const placements = document.querySelectorAll('.ad-placement:not(.adblock-notice)');
        placements.forEach(el => {
            const type = el.dataset.adType || 'banner';
            this.renderAd(el, type);
        });
    },

    renderAd: function(container, type) {
        if (!container || container.classList.contains('rendered')) return;
        
        const width = window.innerWidth;
        container.classList.add('rendered');

        if (type === 'native') {
            this.renderNative(container);
        } else if (type === 'square') {
            this.renderBanner(container, this.config.banners.square);
        } else if (type === 'sidebar') {
            this.renderBanner(container, this.config.banners.sidebar);
        } else {
            // Default Banner - Responsive
            if (width < 480) {
                this.renderBanner(container, this.config.banners.mobile);
            } else if (width < 992) {
                this.renderBanner(container, this.config.banners.tablet);
            } else {
                this.renderBanner(container, this.config.banners.desktop);
            }
        }
    },

    renderNative: function(container) {
        this.appendScript(`https://pl29146923.profitablecpmratenetwork.com/${this.config.native}/invoke.js`, false, true);
        const adDiv = document.createElement('div');
        adDiv.id = `container-${this.config.native}`;
        container.appendChild(adDiv);
    },

    renderBanner: function(container, config) {
        // Local atOptions for this specific injection
        const optionsScript = document.createElement('script');
        optionsScript.innerHTML = `
            var atOptions = {
                'key': '${config.key}',
                'format': 'iframe',
                'height': ${config.height},
                'width': ${config.width},
                'params': {}
            };
        `;
        container.appendChild(optionsScript);

        const invokeScript = document.createElement('script');
        invokeScript.src = `https://www.highperformanceformat.com/${config.key}/invoke.js`;
        invokeScript.async = true;
        container.appendChild(invokeScript);
    },

    appendScript: function(src, atEnd = false, async = true) {
        const script = document.createElement('script');
        script.src = src;
        script.async = async;
        if (atEnd) document.body.appendChild(script);
        else document.head.appendChild(script);
    }
};

// Start Ads Immediately
hbAds.init();
