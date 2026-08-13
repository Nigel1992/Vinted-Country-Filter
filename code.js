// ==UserScript==
// @name         Vinted Country & City Filter (client-side)
// @namespace    https://greasyfork.org/en/users/1550823-nigel1992
// @version      1.4.8
// @description  Adds a country and city indicator to Vinted items and allows client-side visual filtering by including/excluding selected countries. The script uses Vinted’s public item API to retrieve country and city information. It does not perform purchases, send messages, or modify anything on Vinted servers.
// @author       Nigel1992
// @license      MIT
// @match        https://www.vinted.nl/*
// @match        https://www.vinted.be/*
// @match        https://www.vinted.fr/*
// @match        https://www.vinted.it/*
// @match        https://www.vinted.es/*
// @match        https://www.vinted.de/*
// @match        https://www.vinted.se/*
// @match        https://www.vinted.lt/*
// @match        https://www.vinted.pl/*
// @match        https://www.vinted.cz/*
// @match        https://www.vinted.hu/*
// @match        https://www.vinted.sk/*
// @match        https://www.vinted.pt/*
// @match        https://www.vinted.lu/*
// @match        https://www.vinted.ro/*
// @match        https://www.vinted.gr/*
// @match        https://www.vinted.bg/*
// @match        https://www.vinted.si/*
// @match        https://www.vinted.hr/*
// @match        https://www.vinted.ie/*
// @match        https://www.vinted.com/*
// @match        https://www.vinted.at/*
// @match        https://www.vinted.dk/*
// @match        https://www.vinted.fi/*
// @match        https://www.vinted.co.uk/*
// @grant        none
// @run-at       document-end
// ==/UserScript==


(function () {
    function queryAny(selectors) {
        return selectors.some(selector => {
            try {
                return !!document.querySelector(selector);
            } catch (e) {
                return false;
            }
        });
    }

    function isUserLoggedIn() {
        return queryAny([
            'figure.header-avatar',
            '[data-testid="header--user-menu-button"]',
            '[data-testid="header-user-menu-button"]',
            '[data-testid="header--profile-button"]',
            '[data-testid="header-profile-button"]',
            '[data-testid="user-menu-button"]',
            '[data-testid="header--notifications-button"]',
            '[data-testid="header--conversations-button"]',
            'button[aria-label*="profile" i]',
            'button[aria-label*="account" i]'
        ]);
    }

    function isUserLoggedOut() {
        if (isUserLoggedIn()) return false;
        return queryAny([
            '[data-testid="header--login-button"]',
            '[data-testid="header-login-button"]',
            '[data-testid*="sign-in"]',
            '[data-testid*="login"]',
            'a[href*="/login"]',
            'a[href*="/member/general/login"]'
        ]);
    }

    // Skip login check if captcha is being shown (isPausedForCaptcha or captcha warning visible)
    const captchaWarning = document.getElementById('vinted-captcha-warning');
    // Do not show login warning when visiting API endpoints directly (e.g., /api/...)
    if (isUserLoggedOut() && !(window.isPausedForCaptcha || (captchaWarning && captchaWarning.style.display === 'block')) && !window.location.pathname.includes('/api/')) {
        const msg = '⚠️ [Vinted Country & City Filter] You must be logged in to Vinted for this script to work. Please log in and refresh the page.';
        const banner = document.createElement('div');
        banner.textContent = msg;
        banner.style.position = 'fixed';
        banner.style.top = '0';
        banner.style.left = '0';
        banner.style.width = '100vw';
        banner.style.background = '#ffefc1';
        banner.style.color = '#a00';
        banner.style.fontSize = '18px';
        banner.style.textAlign = 'center';
        banner.style.zIndex = '2147483647';
        banner.style.padding = '16px 0';
        banner.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        banner.style.fontFamily = 'inherit';
        banner.style.fontWeight = 'bold';
        banner.style.letterSpacing = '0.5px';
        banner.style.userSelect = 'none';
        // Add margin to body so banner doesn't cover top nav
        document.body.style.marginTop = '56px';
        document.body.appendChild(banner);
        return;
    }

    'use strict';

    /* =========================
       Page Filter - Only run on homepage and catalog pages
    ========================== */

    function isAllowedPage() {
        const path = location.pathname;
        // Allow: homepage ("/"), catalog pages ("/catalog/..."), and search results
        return path === '/' ||
               path.startsWith('/catalog') ||
               path.startsWith('/vetements') ||  // French catalog
               path.startsWith('/kleding') ||    // Dutch catalog
               path.startsWith('/ropa') ||       // Spanish catalog
               path.startsWith('/abbigliamento') || // Italian catalog
               path.startsWith('/kleidung') ||   // German catalog
               path.startsWith('/kläder');       // Swedish catalog
    }

    // Exit early if not on an allowed page
    if (!isAllowedPage()) {
        return;
    }

    /*
    USER INFORMATION (Greasy Fork transparency):

    - This script retrieves country and city information via Vinted’s own API:
      /api/v2/catalog/items/{id}/details
    - Filtering is purely visual (opacity and grayscale) and does not affect
      Vinted search results or server-side filters.
    - The script may temporarily pause if Vinted returns a 403 (captcha)
      or 429 (rate limit). In this case the script retries real item API
      requests and resumes when access is restored.
    - No data is sent to third parties. The script contains no tracking,
      advertising, miners, or other self-gain functionality.
    */

    /* =========================
       Settings & state
    ========================== */

    let includedCountries = JSON.parse(sessionStorage.getItem('vinted_included_countries') || '[]');
    // Normalize any previously saved entries
    includedCountries = includedCountries.map(c => normalizeCountryName(c));
    let isFilterEnabled = sessionStorage.getItem('vinted_filter_enabled') !== 'false'; // Default: enabled
    let isProcessing = false;
    let isPausedForCaptcha = false;
    let captchaPopup = null;
    let captchaCheckInterval = null;
    let captchaProbeItemIds = [];
    let captchaProbeIndex = 0;
    let captchaRetryAttempt = 0;
    let isWaitingForEnglish = false;
    let englishCheckComplete = false;
    let darkMode = sessionStorage.getItem('vinted_dark_mode') === 'true';
    let countrySectionCollapsed = sessionStorage.getItem('vinted_country_collapsed') === 'true';
    let isPaused = false;
    let flaggedSellers = new Set(JSON.parse(localStorage.getItem('vinted_flagged_sellers') || '[]'));
    let hasShownCaptchaAlert = false;
    let activeTab = sessionStorage.getItem('vinted_active_tab') || 'main';

    const processedItems = new Map();
    const queue = [];
    const CACHE_PREFIX = 'vinted_item_';
    const PRESETS_PREFIX = 'vinted_preset_';
    const API_RECOVERY_RETRY_DELAYS = [5000, 15000, 30000, 60000];

    const countryToFlag = {
        'netherlands': '🇳🇱',
        'belgium': '🇧🇪',
        'france': '🇫🇷',
        'germany': '🇩🇪',
        'spain': '🇪🇸',
        'italy': '🇮🇹',
        'portugal': '🇵🇹',
        'poland': '🇵🇱',
        'united kingdom': '🇬🇧',
        'uk': '🇬🇧',
        'sweden': '🇸🇪',
        'denmark': '🇩🇰',
        'finland': '🇫🇮',
        'ireland': '🇮🇪',
        'austria': '🇦🇹',
        'romania': '🇷🇴',
        'greece': '🇬🇷',
        'bulgaria': '🇧🇬',
        'slovenia': '🇸🇮',
        'croatia': '🇭🇷',
        'czech republic': '🇨🇿',
        'hungary': '🇭🇺',
        'slovakia': '🇸🇰',
        'lithuania': '🇱🇹',
        'luxembourg': '🇱🇺'
    };

    // Normalize country names returned by the API to canonical keys used throughout the script
    function normalizeCountryName(name) {
        if (!name) return '';
        const s = String(name).toLowerCase().trim();
        const normalized = s.normalize
            ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            : s;

        if (normalized === 'uk' || normalized === 'gb') return 'united kingdom';

        const countryAliases = {
            'netherlands': ['netherlands', 'nederland', 'nederlanden', 'pays bas', 'pays-bas', 'paises bajos', 'paesi bassi', 'niederlande', 'holanda', 'holandia', 'nizozemsko', 'nizozemska'],
            'belgium': ['belgium', 'belgie', 'belgique', 'belgio', 'belgica', 'belgien'],
            'france': ['france', 'frankrijk', 'frankreich', 'francia', 'francja', 'francie'],
            'germany': ['germany', 'deutschland', 'duitsland', 'allemagne', 'alemania', 'germania', 'niemcy', 'nemecko', 'nemecka'],
            'spain': ['spain', 'espana', 'spanje', 'spanien', 'espagne', 'hiszpania', 'spagna', 'spanelsko'],
            'italy': ['italy', 'italia', 'italie', 'italien', 'wlochy', 'włochy', 'itálie'],
            'portugal': ['portugal', 'portugalia', 'portugalsko'],
            'poland': ['poland', 'polska', 'polen', 'pologne', 'polonia', 'polsko'],
            'united kingdom': ['united kingdom', 'great britain', 'verenigd koninkrijk', 'vereinigtes konigreich', 'royaume uni', 'royaume-uni', 'reino unido', 'regno unito', 'wielka brytania', 'velka britanie'],
            'sweden': ['sweden', 'sverige', 'zweden', 'schweden', 'suede', 'suecia', 'svezia', 'szwecja', 'svedsko'],
            'denmark': ['denmark', 'danmark', 'denemarken', 'danemark', 'dinamarca', 'danimarca', 'dania', 'dansko'],
            'finland': ['finland', 'suomi', 'finlande', 'finlandia', 'finsko'],
            'ireland': ['ireland', 'ierland', 'irland', 'irlande', 'irlanda', 'irlandia', 'irsko'],
            'austria': ['austria', 'osterreich', 'oostenrijk', 'autriche', 'austria', 'rakousko'],
            'romania': ['romania', 'roemenie', 'rumania', 'roumanie', 'rumunsko'],
            'greece': ['greece', 'griekenland', 'griechenland', 'grece', 'grecia', 'grecja', 'recko', 'hellas'],
            'bulgaria': ['bulgaria', 'bulgarije', 'bulgarien', 'bulgarie', 'bulharsko'],
            'slovenia': ['slovenia', 'slovenie', 'slowenien', 'slovenija', 'eslovenia', 'slowenia', 'slovinsko'],
            'croatia': ['croatia', 'kroatie', 'kroatien', 'croatie', 'croazia', 'chorwacja', 'chorvatsko', 'hrvatska'],
            'czech republic': ['czech republic', 'czechia', 'ceska republika', 'tsjechie', 'tsjechie', 'tsechie', 'republique tcheque', 'repubblica ceca', 'republica checa', 'czechy'],
            'hungary': ['hungary', 'magyarorszag', 'hongarije', 'ungarn', 'hongrie', 'hungria', 'wegry', 'węgry', 'madarsko'],
            'slovakia': ['slovakia', 'slovak', 'slovensko', 'slowakije', 'slowakei', 'slovaquie', 'slovacchia', 'eslovaquia'],
            'lithuania': ['lithuania', 'lietuva', 'litouwen', 'litauen', 'lituanie', 'lituania', 'litwa', 'litva'],
            'luxembourg': ['luxembourg', 'luxemburg', 'luxemburgo', 'luksemburg']
        };

        for (const [country, aliases] of Object.entries(countryAliases)) {
            if (aliases.some(alias => normalized.includes(alias))) {
                return country;
            }
        }

        // Fallback: collapse multiple spaces into single space
        return normalized.replace(/\s+/g, ' ');
    }

    /* =========================
       Auto Captcha Solver
    ========================== */

    function openCaptchaPopup() {
        const apiUrl = `https://${location.hostname}/api/v2/catalog/items/1/details`;

        // Close existing popup if any
        if (captchaPopup && !captchaPopup.closed) {
            captchaPopup.close();
        }

        // Open small popup window
        captchaPopup = window.open(
            apiUrl,
            'VintedCaptcha',
            'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Check if popup was blocked
        if (!captchaPopup || captchaPopup.closed || typeof captchaPopup.closed === 'undefined') {
            console.warn('[Vinted Filter] Popup was blocked by browser. Please allow popups for this site and refresh the page.');
            updateStatusMessage('⚠️ Popup blocked! Please allow popups for this site in your browser settings, then refresh the page and try again.');
            alert('Vinted Filter: Popup was blocked! Please allow popups for this site in your browser settings, then refresh the page and try again.');
            return false;
        } else {
            updateStatusMessage('A popup window has been opened to automatically solve the captcha. Please complete the captcha in the popup window. The script will automatically detect when it\'s solved and continue processing. If you do not see a popup, check your browser\'s popup settings.');
        }
        // Start checking if captcha is solved
        startCaptchaCheck('1');
        return true;
    }

    function addUniqueProbeItemId(ids, itemId) {
        const id = String(itemId || '').trim();
        if (/^\d+$/.test(id) && !ids.includes(id)) {
            ids.push(id);
        }
    }

    function collectApiProbeItemIds(primaryItemId = '') {
        const ids = [];
        addUniqueProbeItemId(ids, primaryItemId);

        queue.slice(0, 8).forEach(item => addUniqueProbeItemId(ids, item && item.id));

        const knownIds = Array.from(processedItems.keys()).slice(-8);
        knownIds.forEach(itemId => addUniqueProbeItemId(ids, itemId));

        return ids;
    }

    function clearCaptchaCheckTimer() {
        if (captchaCheckInterval) {
            clearTimeout(captchaCheckInterval);
            captchaCheckInterval = null;
        }
    }

    function startCaptchaCheck(probeItemId = '1', immediate = false) {
        clearCaptchaCheckTimer();

        captchaProbeItemIds = collectApiProbeItemIds(probeItemId);
        if (captchaProbeItemIds.length === 0) {
            addUniqueProbeItemId(captchaProbeItemIds, probeItemId || '1');
        }
        captchaProbeIndex = 0;
        captchaRetryAttempt = 0;

        const scheduleNextCheck = (delay) => {
            clearCaptchaCheckTimer();
            captchaCheckInterval = setTimeout(runCheck, delay);
        };

        const runCheck = async () => {
            try {
                const probeItemIdToCheck = captchaProbeItemIds[captchaProbeIndex % captchaProbeItemIds.length] || '1';
                captchaProbeIndex++;
                const safeProbeItemId = encodeURIComponent(probeItemIdToCheck);

                // Try to fetch the API to see if captcha is solved
                const response = await fetch(
                    `https://${location.hostname}/api/v2/catalog/items/${safeProbeItemId}/details`,
                    {
                        credentials: 'include',
                        headers: { 'Accept': 'application/json, text/plain, */*' }
                    }
                );

                if (!(await isAccessBlockResponse(response))) {
                    console.log('[Vinted Filter] API access restored.');
                    onCaptchaSolved();
                    return;
                }
            } catch (e) {
                console.log('[Vinted Filter] Captcha check error:', e);
            }

            captchaRetryAttempt++;
            const retryDelay = API_RECOVERY_RETRY_DELAYS[Math.min(captchaRetryAttempt, API_RECOVERY_RETRY_DELAYS.length - 1)];
            updateStatusMessage(`⚠️ API access paused. Retrying automatically in ${Math.round(retryDelay / 1000)}s...`);
            scheduleNextCheck(retryDelay);
        };

        const firstDelay = immediate ? 0 : API_RECOVERY_RETRY_DELAYS[0];
        scheduleNextCheck(firstDelay);
    }

    function getResponseHeader(response, name) {
        try {
            if (!response || !response.headers || typeof response.headers.get !== 'function') {
                return '';
            }
            return response.headers.get(name) || '';
        } catch (e) {
            return '';
        }
    }

    async function getResponseText(response) {
        try {
            const readableResponse = response && typeof response.clone === 'function'
                ? response.clone()
                : response;

            if (!readableResponse || typeof readableResponse.text !== 'function') {
                return '';
            }

            return await readableResponse.text();
        } catch (e) {
            return '';
        }
    }

    async function isAccessBlockResponse(response) {
        if (!response || response.status !== 403) {
            return false;
        }

        const cfMitigated = getResponseHeader(response, 'cf-mitigated').toLowerCase();
        if (cfMitigated.includes('challenge')) {
            return true;
        }

        const contentType = getResponseHeader(response, 'content-type').toLowerCase();
        const text = (await getResponseText(response)).toLowerCase();

        if (!text) {
            return false;
        }

        if (contentType.includes('text/html')) {
            return text.includes('challenge-platform') ||
                   text.includes('_cf_chl_opt') ||
                   text.includes('cf-chl') ||
                   text.includes('captcha') ||
                   text.includes('enable javascript and cookies to continue');
        }

        return text.includes('captcha') ||
               text.includes('cloudflare challenge') ||
               text.includes('challenge_required');
    }

    async function isApiAccessBlocked(responseToInspect = null) {
        if (responseToInspect) {
            return isAccessBlockResponse(responseToInspect);
        }

        try {
            const response = await fetch(
                `https://${location.hostname}/api/v2/catalog/items/1/details`,
                {
                    credentials: 'include',
                    headers: { 'Accept': 'application/json, text/plain, */*' }
                }
            );
            return isAccessBlockResponse(response);
        } catch (e) {
            console.warn('[Vinted Filter] API access probe failed:', e);
            return false;
        }
    }

    function markItemUnavailable(item, label = 'Unavailable') {
        item.overlay.textContent = `⚠️ ${label}`;
        item.overlay.style.background = 'linear-gradient(135deg, rgba(117,117,117,0.95) 0%, rgba(97,97,97,0.95) 100%)';
        item.overlay.style.color = 'white';
        item.overlay.style.borderColor = '#757575';
        item.overlay.style.fontSize = '10px';
        item.overlay.style.padding = '5px 9px';
    }

    function onCaptchaSolved() {
        // Stop checking
        clearCaptchaCheckTimer();

        hasShownCaptchaAlert = false;
        captchaProbeItemIds = [];
        captchaProbeIndex = 0;
        captchaRetryAttempt = 0;

        // Close popup - try multiple times to ensure it closes
        if (captchaPopup && !captchaPopup.closed) {
            console.log('[Vinted Filter] Attempting to close captcha popup...');
            try {
                captchaPopup.close();
            } catch (e) {
                console.warn('[Vinted Filter] Error closing popup:', e);
            }

            // Retry closing after a short delay in case it didn't work immediately
            setTimeout(() => {
                if (captchaPopup && !captchaPopup.closed) {
                    console.log('[Vinted Filter] Retrying popup close...');
                    try {
                        captchaPopup.close();
                    } catch (e) {
                        console.warn('[Vinted Filter] Error on retry:', e);
                    }
                }
                captchaPopup = null;
            }, 500);
        } else {
            captchaPopup = null;
        }

        // Resume processing
        isPausedForCaptcha = false;
        const warningEl = document.getElementById('vinted-captcha-warning');
        if (warningEl) {
            warningEl.style.display = 'none';
        }

        updateStatusMessage('✅ Captcha solved! Resuming...');

        // Small delay before resuming
        setTimeout(() => {
            updateStatusMessage('Processing items...');
        }, 1500);
    }

    function retryApiAccessNow() {
        clearCaptchaCheckTimer();

        const probeIds = collectApiProbeItemIds(captchaProbeItemIds[0]);
        const retryProbeItemId = probeIds[0] || captchaProbeItemIds[0] || '1';

        isPausedForCaptcha = false;
        const warningEl = document.getElementById('vinted-captcha-warning');
        if (warningEl) {
            warningEl.style.display = 'none';
        }

        updateStatusMessage('Retrying API access with visible items...');
        startCaptchaCheck(retryProbeItemId, true);
        setTimeout(processQueue, 0);
    }

    /* =========================
       UI Menu - Enhanced GUI
    ========================== */

    function createMenu() {
        // Don't show menu on API pages
        if (location.pathname.startsWith('/api')) return;

        if (document.getElementById('vinted-filter-menu')) return;

        const menu = document.createElement('div');
        menu.id = 'vinted-filter-menu';
        const maxHeight = Math.max(window.innerHeight * 0.5, 300); // 50% of screen height, min 300px
        menu.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 9999999;
            background: linear-gradient(135deg, ${darkMode ? '#1e1e1e 0%, #2d2d2d 100%' : '#ffffff 0%, #f8f9fa 100%'});
            border: 2px solid #007782;
            padding: 20px;
            border-radius: 16px;
            box-shadow: 0 12px 40px rgba(0,119,130,0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            min-width: 280px;
            max-width: 320px;
            max-height: ${maxHeight}px;
            overflow-y: auto;
            transition: all 0.3s ease;
            color: ${darkMode ? '#fff' : '#333'};
        `;

        const hiddenCount = Array.from(processedItems.values()).filter(item => item.country && !includedCountries.includes(item.country) && includedCountries.length > 0).length;

        menu.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 2px solid ${darkMode ? '#444' : '#e0e0e0'};">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 24px;">🌍</span>
                    <strong style="color: #007782; font-size: 18px; font-weight: 600;">Location Filter</strong>
                </div>
                <div style="display: flex; gap: 4px;">
                    <button id="vinted-dark-toggle" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #666; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;" title="Toggle dark mode">${darkMode ? '☀️' : '🌙'}</button>
                    <button id="vinted-pause-toggle" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #666; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;" title="${isPaused ? 'Resume processing' : 'Pause processing'}">${isPaused ? '▶' : '⏸'}</button>
                    <button id="vinted-toggle-menu" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #666; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;" title="Minimize (Alt+V)">−${hiddenCount > 0 ? ` (${hiddenCount})` : ''}</button>
                </div>
            </div>

            <div id="vinted-tab-bar" style="display: flex; gap: 8px; margin-bottom: 12px;">
                <button class="vinted-tab-btn" data-tab="main">Main</button>
                <button class="vinted-tab-btn" data-tab="settings">Settings</button>
            </div>

            <div id="vinted-menu-content">
                <div id="vinted-tab-main" class="vinted-tab-panel" style="display: ${activeTab === 'main' ? 'block' : 'none'};">
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 12px;
                        background: ${darkMode ? '#333' : '#f0f9f9'};
                        border-radius: 10px;
                        margin-bottom: 12px;
                        border: 2px solid #007782;
                    ">
                        <span style="color: ${darkMode ? '#ddd' : '#333'}; font-weight: 500; font-size: 14px;">Filter Active</span>
                        <label style="
                            position: relative;
                            display: inline-block;
                            width: 50px;
                            height: 26px;
                            cursor: pointer;
                        ">
                            <input type="checkbox" id="vinted-filter-toggle" ${isFilterEnabled ? 'checked' : ''} style="
                                opacity: 0;
                                width: 0;
                                height: 0;
                            ">
                            <span id="vinted-toggle-slider" style="
                                position: absolute;
                                cursor: pointer;
                                top: 0;
                                left: 0;
                                right: 0;
                                bottom: 0;
                                background-color: ${isFilterEnabled ? '#007782' : '#ccc'};
                                transition: 0.3s;
                                border-radius: 26px;
                            ">
                                <span style="
                                    position: absolute;
                                    content: '';
                                    height: 20px;
                                    width: 20px;
                                    left: ${isFilterEnabled ? '27px' : '3px'};
                                    bottom: 3px;
                                    background-color: white;
                                    transition: 0.3s;
                                    border-radius: 50%;
                                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                "></span>
                            </span>
                        </label>
                    </div>

                    <div style="background: ${darkMode ? '#333' : '#f5f5f5'}; border-radius: 10px; padding: 12px; margin-bottom: 12px;">
                        <div id="vinted-match-count" style="
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            margin-bottom: 8px;
                        " title="Items not excluded by your country filter (shown at full opacity)">
                            <span style="color: ${darkMode ? '#aaa' : '#666'}; font-size: 13px; font-weight: 500;">✅ Shown Items:</span>
                            <span id="vinted-match-number" style="
                                background: #4caf50;
                                color: white;
                                padding: 4px 12px;
                                border-radius: 12px;
                                font-weight: 600;
                                font-size: 14px;
                                min-width: 40px;
                                text-align: center;
                            ">0</span>
                        </div>
                        <div id="vinted-total-count" style="
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            margin-bottom: 8px;
                        " title="Total number of items on the current page that have been scanned for location data">
                            <span style="color: ${darkMode ? '#aaa' : '#666'}; font-size: 13px; font-weight: 500;">📦 Total on Page:</span>
                            <span id="vinted-total-number" style="
                                background: #2196f3;
                                color: white;
                                padding: 4px 12px;
                                border-radius: 12px;
                                font-weight: 600;
                                font-size: 14px;
                                min-width: 40px;
                                text-align: center;
                            ">0</span>
                        </div>
                        <div id="vinted-queue-count" style="
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                        " title="Items currently waiting to be scanned for location data via the API">
                            <span style="color: ${darkMode ? '#aaa' : '#666'}; font-size: 13px; font-weight: 500;">⏳ In Queue:</span>
                            <span id="vinted-queue-number" style="
                                background: #ff9800;
                                color: white;
                                padding: 4px 12px;
                                border-radius: 12px;
                                font-weight: 600;
                                font-size: 14px;
                                min-width: 40px;
                                text-align: center;
                            ">0</span>
                        </div>
                    </div>

                    <div id="vinted-progress-bar-container" style="
                        background: #e0e0e0;
                        border-radius: 10px;
                        height: 8px;
                        margin-bottom: 12px;
                        overflow: hidden;
                        display: none;
                    ">
                        <div id="vinted-progress-bar" style="
                            background: linear-gradient(90deg, #007782, #00a8b5);
                            height: 100%;
                            width: 0%;
                            transition: width 0.3s ease;
                            border-radius: 10px;
                        "></div>
                    </div>

                    <div id="vinted-language-warning" style="
                        display: none;
                        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
                        border: 2px solid #ffc107;
                        padding: 14px;
                        border-radius: 10px;
                        font-size: 13px;
                        margin-bottom: 12px;
                    ">
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            margin-bottom: 10px;
                            font-weight: 600;
                            color: #856404;
                        ">
                            <span style="font-size: 20px;">⚠️</span>
                            <span>Locale Notice</span>
                        </div>
                        <p style="margin: 0; color: #856404; line-height: 1.5;">
                            Country names are normalized automatically for supported Vinted locales.
                        </p>
                    </div>

                    <div id="vinted-status-message" style="
                        font-size: 12px;
                        color: ${darkMode ? '#aaa' : '#666'};
                        text-align: center;
                        padding: 8px;
                        background: ${darkMode ? '#333' : '#f9f9f9'};
                        border-radius: 8px;
                        margin-bottom: 12px;
                        min-height: 20px;
                    ">Ready to filter items...</div>

                    <div id="vinted-captcha-warning" style="
                        display: none;
                        background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
                        border: 2px solid #f44336;
                        padding: 14px;
                        border-radius: 10px;
                        font-size: 13px;
                        margin-top: 12px;
                    ">
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            margin-bottom: 10px;
                            font-weight: 600;
                            color: #c62828;
                        ">
                            <span style="font-size: 20px;">🔓</span>
                            <span>API Access Paused</span>
                        </div>
                        <p style="margin: 0; color: #555; line-height: 1.5;">
                            Vinted returned a captcha or access block. The script will retry real item requests automatically and resume when access is restored.
                        </p>
                        <button id="vinted-api-retry-now" style="
                            margin-top: 12px;
                            width: 100%;
                            padding: 9px;
                            background: #c62828;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-weight: 600;
                            cursor: pointer;
                            font-size: 12px;
                            transition: background 0.2s;
                        " onmouseover="this.style.background='#ad2020'" onmouseout="this.style.background='#c62828'" title="Retry API access using visible Vinted items">↻ Retry API now</button>
                    </div>

                    <div style="display: flex; gap: 8px; margin-top: 12px;">
                        <button id="vinted-reset-stats" style="
                            flex: 1;
                            padding: 10px;
                            background: #9c27b0;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-weight: 500;
                            cursor: pointer;
                            font-size: 12px;
                            transition: background 0.2s;
                        " onmouseover="this.style.background='#7b1fa2'" onmouseout="this.style.background='#9c27b0'" title="Reset stats counters">📊 Reset Stats</button>
                        <button id="vinted-clear-cache" style="
                            flex: 1;
                            padding: 10px;
                            background: #757575;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-weight: 500;
                            cursor: pointer;
                            font-size: 12px;
                            transition: background 0.2s;
                        " onmouseover="this.style.background='#616161'" onmouseout="this.style.background='#757575'" title="Clear cached item data">
                            🗑️ Clear Cache
                        </button>
                    </div>

                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <a href="https://greasyfork.org/en/scripts/559753-vinted-country-city-filter-client-side/feedback" target="_blank" style="
                            flex: 1;
                            padding: 8px;
                            background: #007782;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-weight: 500;
                            cursor: pointer;
                            font-size: 11px;
                            text-align: center;
                            text-decoration: none;
                            transition: background 0.2s;
                        " onmouseover="this.style.background='#005f6b'" onmouseout="this.style.background='#007782'">
                            💬 Feedback
                        </a>
                        <a href="https://greasyfork.org/en/scripts/559753-vinted-country-city-filter-client-side/feedback" target="_blank" style="
                            flex: 1;
                            padding: 8px;
                            background: #dc3545;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-weight: 500;
                            cursor: pointer;
                            font-size: 11px;
                            text-align: center;
                            text-decoration: none;
                            transition: background 0.2s;
                        " onmouseover="this.style.background='#c82333'" onmouseout="this.style.background='#dc3545'">
                            🐛 Report Issue
                        </a>
                    </div>
                </div>

                <div id="vinted-tab-settings" class="vinted-tab-panel" style="display: ${activeTab === 'settings' ? 'block' : 'none'};">
                    <div id="vinted-presets-section" style="margin-bottom: 16px; padding: 12px; background: ${darkMode ? '#333' : '#f5f5f5'}; border-radius: 10px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <label style="color: ${darkMode ? '#ddd' : '#333'}; font-weight: 500; font-size: 14px;">Presets:</label>
                            <button id="vinted-quick-save-preset" style="
                                padding: 4px 8px;
                                background: #007782;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                font-weight: 500;
                                cursor: pointer;
                                font-size: 11px;
                                transition: background 0.2s;
                            " onmouseover="this.style.background='#005f6b'" onmouseout="this.style.background='#007782'" title="Save current filter as preset">💾 Save</button>
                        </div>
                        <select id="vinted-preset-select" style="
                            width: 100%;
                            padding: 6px;
                            background: ${darkMode ? '#444' : 'white'};
                            color: ${darkMode ? '#fff' : '#000'};
                            border: 1px solid #007782;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 12px;
                            margin-bottom: 6px;
                        ">
                            <option value="">-- Select preset --</option>
                        </select>
                        <div style="display: flex; gap: 6px;">
                            <button id="vinted-load-preset" style="
                                flex: 1;
                                padding: 6px;
                                background: #4caf50;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                font-weight: 500;
                                cursor: pointer;
                                font-size: 11px;
                                transition: background 0.2s;
                            " onmouseover="this.style.background='#388e3c'" onmouseout="this.style.background='#4caf50'" title="Load selected preset">Load</button>
                            <button id="vinted-delete-preset" style="
                                flex: 1;
                                padding: 6px;
                                background: #f44336;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                font-weight: 500;
                                cursor: pointer;
                                font-size: 11px;
                                transition: background 0.2s;
                            " onmouseover="this.style.background='#d32f2f'" onmouseout="this.style.background='#f44336'" title="Delete selected preset">Delete</button>
                        </div>
                        <div style="display: flex; gap: 6px; margin-top: 6px;">
                            <button id="vinted-export-presets" style="
                                flex: 1;
                                padding: 6px;
                                background: #2196f3;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                font-weight: 500;
                                cursor: pointer;
                                font-size: 11px;
                                transition: background 0.2s;
                            " onmouseover="this.style.background='#1976d2'" onmouseout="this.style.background='#2196f3'" title="Export all presets as JSON">📥 Export</button>
                            <button id="vinted-import-presets" style="
                                flex: 1;
                                padding: 6px;
                                background: #ff9800;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                font-weight: 500;
                                cursor: pointer;
                                font-size: 11px;
                                transition: background 0.2s;
                            " onmouseover="this.style.background='#f57c00'" onmouseout="this.style.background='#ff9800'" title="Import presets from JSON">📤 Import</button>
                        </div>
                    </div>

                    <div id="vinted-filter-options" style="${isFilterEnabled ? '' : 'opacity: 0.5; pointer-events: none;'}">
                        <div style="margin-bottom: 16px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                                <label style="display: block; color: ${darkMode ? '#ddd' : '#333'}; font-weight: 500; font-size: 14px;">
                                    Include Countries:
                                </label>
                                <button id="vinted-toggle-countries" style="
                                    background: #007782;
                                    color: white;
                                    border: none;
                                    border-radius: 4px;
                                    padding: 2px 8px;
                                    font-size: 11px;
                                    cursor: pointer;
                                    transition: background 0.2s;
                                " onmouseover="this.style.background='#005f6b'" onmouseout="this.style.background='#007782'" title="${countrySectionCollapsed ? 'Expand' : 'Collapse'}">${countrySectionCollapsed ? '▶' : '▼'}</button>
                            </div>
                            <div id="vinted-country-checkboxes" style="
                                display: ${countrySectionCollapsed ? 'none' : 'grid'};
                                grid-template-columns: 1fr 1fr;
                                gap: 8px;
                                max-height: 200px;
                                overflow-y: auto;
                            ">
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-netherlands" style="margin: 0;">
                                    <span>🇳🇱 Netherlands</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-belgium" style="margin: 0;">
                                    <span>🇧🇪 Belgium</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-france" style="margin: 0;">
                                    <span>🇫🇷 France</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-germany" style="margin: 0;">
                                    <span>🇩🇪 Germany</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-spain" style="margin: 0;">
                                    <span>🇪🇸 Spain</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-italy" style="margin: 0;">
                                    <span>🇮🇹 Italy</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-portugal" style="margin: 0;">
                                    <span>🇵🇹 Portugal</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-poland" style="margin: 0;">
                                    <span>🇵🇱 Poland</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-sweden" style="margin: 0;">
                                    <span>🇸🇪 Sweden</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-denmark" style="margin: 0;">
                                    <span>🇩🇰 Denmark</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-finland" style="margin: 0;">
                                    <span>🇫🇮 Finland</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-united-kingdom" style="margin: 0;">
                                    <span>🇬🇧 United Kingdom</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-ireland" style="margin: 0;">
                                    <span>🇮🇪 Ireland</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-austria" style="margin: 0;">
                                    <span>🇦🇹 Austria</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-romania" style="margin: 0;">
                                    <span>🇷🇴 Romania</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-greece" style="margin: 0;">
                                    <span>🇬🇷 Greece</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-bulgaria" style="margin: 0;">
                                    <span>🇧🇬 Bulgaria</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-slovenia" style="margin: 0;">
                                    <span>🇸🇮 Slovenia</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 6px; cursor: pointer; transition: background 0.2s; color: ${darkMode ? '#ddd' : '#333'};" onmouseover="this.style.background='${darkMode ? '#444' : '#f0f0f0'}'" onmouseout="this.style.background='transparent'">
                                    <input type="checkbox" id="include-croatia" style="margin: 0;">
                                    <span>🇭🇷 Croatia</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="
                    text-align: center;
                    font-size: 10px;
                    color: ${darkMode ? '#555' : '#999'};
                    margin-top: 12px;
                    padding-top: 8px;
                    border-top: 1px solid ${darkMode ? '#444' : '#eee'};
                ">
                    v1.4.14 • Jun 26, 2026
                </div>
            </div>
        `;

        document.body.appendChild(menu);

        // Tab handling
        const tabButtons = Array.from(menu.querySelectorAll('.vinted-tab-btn'));
        const tabPanels = {
            main: menu.querySelector('#vinted-tab-main'),
            settings: menu.querySelector('#vinted-tab-settings')
        };

        function setActiveTab(tab) {
            activeTab = tab;
            sessionStorage.setItem('vinted_active_tab', tab);
            tabButtons.forEach(btn => {
                const isActive = btn.dataset.tab === tab;
                btn.classList.toggle('vinted-tab-active', isActive);
                btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
            Object.entries(tabPanels).forEach(([key, panel]) => {
                if (!panel) return;
                const isActive = key === tab;
                panel.style.display = isActive ? 'block' : 'none';
                panel.classList.toggle('vinted-tab-panel-active', isActive);
                if (isActive) {
                    // restart animation for repeat visits
                    panel.classList.remove('vinted-tab-panel-animate');
                    void panel.offsetWidth;
                    panel.classList.add('vinted-tab-panel-animate');
                } else {
                    panel.classList.remove('vinted-tab-panel-animate');
                }
            });
        }

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
        });
        setActiveTab(activeTab);

        // Dark mode toggle
        document.getElementById('vinted-dark-toggle').addEventListener('click', () => {
            darkMode = !darkMode;
            sessionStorage.setItem('vinted_dark_mode', darkMode);
            // Recreate menu to apply theme
            document.getElementById('vinted-filter-menu').remove();
        });

        // Pause/Resume toggle
        const pauseBtn = document.getElementById('vinted-pause-toggle');
        pauseBtn.addEventListener('click', () => {
            isPaused = !isPaused;
            pauseBtn.textContent = isPaused ? '▶' : '⏸';
            pauseBtn.title = isPaused ? 'Resume processing' : 'Pause processing';
            if (isPaused) {
                updateStatusMessage('⏸ Paused');
            } else {
                updateStatusMessage('▶ Resuming...');
                setTimeout(() => updateStatusMessage('Processing items...'), 800);
                applyFilter();
            }
        });

        // Country section collapse toggle
        document.getElementById('vinted-toggle-countries').addEventListener('click', () => {
            countrySectionCollapsed = !countrySectionCollapsed;
            sessionStorage.setItem('vinted_country_collapsed', countrySectionCollapsed);
            const checkboxes = document.getElementById('vinted-country-checkboxes');
            const btn = document.getElementById('vinted-toggle-countries');
            if (countrySectionCollapsed) {
                checkboxes.style.display = 'none';
                btn.textContent = '▶';
            } else {
                checkboxes.style.display = 'grid';
                btn.textContent = '▼';
            }
        });

        // Preset management functions
        function getPresets() {
            const presetsJson = localStorage.getItem('vinted_presets') || '{}';
            return JSON.parse(presetsJson);
        }

        function savePreset(name, data) {
            const presets = getPresets();
            presets[name] = data;
            localStorage.setItem('vinted_presets', JSON.stringify(presets));
            refreshPresetSelect();
        }

        function deletePreset(name) {
            const presets = getPresets();
            delete presets[name];
            localStorage.setItem('vinted_presets', JSON.stringify(presets));
            refreshPresetSelect();
        }

        function loadPreset(name) {
            const presets = getPresets();
            if (presets[name]) {
                // Normalize any stored values to canonical keys
                includedCountries = (presets[name].countries || []).map(c => normalizeCountryName(c));
                sessionStorage.setItem('vinted_included_countries', JSON.stringify(includedCountries));
                // Update checkboxes
                document.querySelectorAll('#vinted-country-checkboxes input[type="checkbox"]').forEach(cb => {
                    const raw = cb.id.replace('include-', '').replace(/-/g, ' ');
                    const key = normalizeCountryName(raw);
                    cb.checked = includedCountries.includes(key);
                });
                applyFilter();
                updateStatusMessage(`Preset "${name}" loaded!`);
            }
        }

        function refreshPresetSelect() {
            const select = document.getElementById('vinted-preset-select');
            const presets = getPresets();
            select.innerHTML = '<option value="">-- Select preset --</option>';
            Object.keys(presets).forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
            });
        }

        refreshPresetSelect();

        // Quick save preset
        document.getElementById('vinted-quick-save-preset').addEventListener('click', () => {
            const name = prompt('Enter preset name:', '');
            if (name && name.trim()) {
                savePreset(name.trim(), { countries: includedCountries });
                updateStatusMessage(`Preset "${name}" saved!`);
            }
        });

        // Load preset
        document.getElementById('vinted-load-preset').addEventListener('click', () => {
            const select = document.getElementById('vinted-preset-select');
            if (select.value) {
                loadPreset(select.value);
            }
        });

        // Delete preset
        document.getElementById('vinted-delete-preset').addEventListener('click', () => {
            const select = document.getElementById('vinted-preset-select');
            if (select.value && confirm(`Delete preset "${select.value}"?`)) {
                deletePreset(select.value);
                updateStatusMessage('Preset deleted!');
            }
        });

        // Export presets
        document.getElementById('vinted-export-presets').addEventListener('click', () => {
            const presets = getPresets();
            const json = JSON.stringify(presets, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'vinted-presets.json';
            a.click();
            URL.revokeObjectURL(url);
            updateStatusMessage('Presets exported!');
        });

        // Import presets
        document.getElementById('vinted-import-presets').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        try {
                            const imported = JSON.parse(ev.target.result);
                            const presets = getPresets();
                            Object.assign(presets, imported);
                            localStorage.setItem('vinted_presets', JSON.stringify(presets));
                            refreshPresetSelect();
                            updateStatusMessage('Presets imported successfully!');
                        } catch (err) {
                            alert('Invalid JSON file!');
                        }
                    };
                    reader.readAsText(file);
                }
            });
            input.click();
        });

        // Reset stats
        document.getElementById('vinted-reset-stats').addEventListener('click', () => {
            if (confirm('Reset all statistics counters?')) {
                // Stats will reset on next filter apply
                updateStatusMessage('Stats reset!');
            }
        });

        const apiRetryButton = document.getElementById('vinted-api-retry-now');
        if (apiRetryButton) {
            apiRetryButton.addEventListener('click', retryApiAccessNow);
        }

        const countryCheckboxes = document.querySelectorAll('#vinted-country-checkboxes input[type="checkbox"]');
        countryCheckboxes.forEach(checkbox => {
            checkbox.checked = includedCountries.includes(normalizeCountryName(checkbox.id.replace('include-', '').replace(/-/g, ' ')));
            checkbox.addEventListener('change', () => {
                const raw = checkbox.id.replace('include-', '').replace(/-/g, ' ');
                const countryKey = normalizeCountryName(raw);
                if (checkbox.checked) {
                    if (!includedCountries.includes(countryKey)) {
                        includedCountries.push(countryKey);
                    }
                } else {
                    includedCountries = includedCountries.filter(c => c !== countryKey);
                }
                sessionStorage.setItem('vinted_included_countries', JSON.stringify(includedCountries));
                const includedNames = includedCountries.map(c => c.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).join(', ');
                updateStatusMessage(includedCountries.length > 0 ? `Showing only ${includedNames}...` : 'Showing all countries...');
                applyFilter();
            });
        });

        // Filter enable/disable toggle
        const filterToggle = document.getElementById('vinted-filter-toggle');
        filterToggle.addEventListener('change', () => {
            isFilterEnabled = filterToggle.checked;
            sessionStorage.setItem('vinted_filter_enabled', isFilterEnabled);

            const slider = document.getElementById('vinted-toggle-slider');
            const knob = slider.querySelector('span');
            const filterOptions = document.getElementById('vinted-filter-options');

            if (isFilterEnabled) {
                slider.style.backgroundColor = '#007782';
                knob.style.left = '27px';
                filterOptions.style.opacity = '1';
                filterOptions.style.pointerEvents = 'auto';
                updateStatusMessage('Filter enabled. Processing items...');
                applyFilter();
            } else {
                slider.style.backgroundColor = '#ccc';
                knob.style.left = '3px';
                filterOptions.style.opacity = '0.5';
                filterOptions.style.pointerEvents = 'none';
                updateStatusMessage('Filter disabled. Browsing normally.');
                // Reset all items to normal visibility
                resetAllItems();
            }
        });

        // Toggle menu minimize/expand
        let isMinimized = false;
        document.getElementById('vinted-toggle-menu').addEventListener('click', () => {
            isMinimized = !isMinimized;
            const content = document.getElementById('vinted-menu-content');
            const toggleBtn = document.getElementById('vinted-toggle-menu');
            const hiddenCount = Array.from(processedItems.values()).filter(item => item.country && includedCountries.length > 0 && !includedCountries.includes(item.country)).length;
            if (isMinimized) {
                content.style.display = 'none';
                toggleBtn.textContent = `+${hiddenCount > 0 ? ` (${hiddenCount})` : ''}`;
                toggleBtn.title = 'Expand';
                menu.style.minWidth = 'auto';
                menu.style.width = '200px';
            } else {
                content.style.display = 'block';
                toggleBtn.textContent = `−${hiddenCount > 0 ? ` (${hiddenCount})` : ''}`;
                toggleBtn.title = 'Minimize (Alt+V)';
                menu.style.minWidth = '280px';
                menu.style.width = 'auto';
            }
        });

        // Keyboard shortcut: Alt+V to toggle menu
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'v') {
                const toggleBtn = document.getElementById('vinted-toggle-menu');
                if (toggleBtn) toggleBtn.click();
            }
        });

        // Clear cache button
        document.getElementById('vinted-clear-cache').onclick = () => {
            if (confirm('Clear all cached item data? This will re-process all items.')) {
                processedItems.clear();
                queue.length = 0;
                clearItemCache();
                updateStatusMessage('Cache cleared. Rescanning items...');
                updateQueueStatus();
                applyFilter();
            }
        };

        // Make menu draggable
        let isDragging = false;
        let currentX, currentY, initialX, initialY;
        const header = menu.querySelector('div:first-child');

        header.style.cursor = 'move';
        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            if (e.target.id === 'vinted-toggle-menu') return;
            initialX = e.clientX - menu.offsetLeft;
            initialY = e.clientY - menu.offsetTop;
            if (e.target === header || header.contains(e.target)) {
                isDragging = true;
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                menu.style.left = currentX + 'px';
                menu.style.top = currentY + 'px';
                menu.style.right = 'auto';
            }
        }

        function dragEnd() {
            isDragging = false;
        }

        // Handle window resize to adjust menu height responsively
        window.addEventListener('resize', () => {
            const maxHeight = Math.max(window.innerHeight * 0.5, 300);
            menu.style.maxHeight = maxHeight + 'px';
        });
    }

    function updateStatusMessage(message) {
        const statusEl = document.getElementById('vinted-status-message');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }

    // Flagged seller badge handling
    function updateAllItemsForSeller(seller) {
        // Update all items from this seller
        processedItems.forEach(item => {
            if (item.seller === seller) {
                updateSellerFlagBadge(item);
            }
        });
    }

    function updateSellerFlagBadge(item) {
        if (!item?.element || !item?.seller) return;
        let badge = item.element.querySelector('.vinted-flag-badge');
        const isFlagged = flaggedSellers.has(item.seller);
        if (!badge) {
            badge = document.createElement('button');
            badge.className = 'vinted-flag-badge';
            badge.style.cssText = `
                position: absolute;
                top: 36px;
                left: 8px;
                background: ${isFlagged ? 'linear-gradient(135deg, #ffb74d 0%, #ff9800 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.95) 100%)'};
                color: ${isFlagged ? 'white' : '#333'};
                border: 2px solid ${isFlagged ? '#ff9800' : '#007782'};
                padding: 3px 7px;
                font-size: 11px;
                border-radius: 8px;
                cursor: pointer;
                z-index: 12;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            `;
            badge.addEventListener('click', (e) => {
                e.preventDefault();
                const sellerToUpdate = item.seller;
                if (flaggedSellers.has(sellerToUpdate)) {
                    flaggedSellers.delete(sellerToUpdate);
                } else {
                    flaggedSellers.add(sellerToUpdate);
                }
                localStorage.setItem('vinted_flagged_sellers', JSON.stringify(Array.from(flaggedSellers)));
                // Update all items from this seller
                updateAllItemsForSeller(sellerToUpdate);
            });
            item.element.style.position = 'relative';
            item.element.appendChild(badge);
        }
        badge.textContent = isFlagged ? '🚩' : '🏷️';
        badge.title = (isFlagged ? 'Unflag seller ' : 'Flag seller ') + (item.seller || '');
        badge.style.background = isFlagged ? 'linear-gradient(135deg, #ffb74d 0%, #ff9800 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.95) 100%)';
        badge.style.borderColor = isFlagged ? '#ff9800' : '#007782';
        badge.style.color = isFlagged ? 'white' : '#333';
    }

    /* =========================
       Scan items
    ========================== */

    function scanItems() {
        // Don't scan if filter is disabled or paused
        if (!isFilterEnabled || isPausedForCaptcha || isWaitingForEnglish || !englishCheckComplete || isPaused) return;

        const items = document.querySelectorAll(
            '[data-testid^="product-item"], [data-testid*="item"], a[href*="/items/"], [class*="ItemBox"], [class*="item-box"], [class*="feed-grid"] a[href*="/items/"], [class*="ProductCard"], [class*="product-card"]'
        );

        items.forEach(el => {
            const link = el.closest('a[href*="/items/"]') || el.querySelector('a[href*="/items/"]');
            if (!link) return;

            const match = link.href.match(/\/items\/(\d+)/);
            if (!match) return;

            const itemId = match[1];
            if (processedItems.has(itemId)) return;

            const overlay = document.createElement('div');
            overlay.textContent = '⏳ Loading...';
            overlay.style.cssText = `
                position: absolute;
                top: 8px;
                left: 8px;
                background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.95) 100%);
                padding: 6px 10px;
                font-size: 11px;
                font-weight: 500;
                border-radius: 8px;
                border: 2px solid #007782;
                pointer-events: none;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                z-index: 10;
                color: #007782;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                backdrop-filter: blur(4px);
                transition: all 0.3s ease;
            `;

            el.style.position = 'relative';
            el.appendChild(overlay);

            const itemData = {
                id: itemId,
                element: el,
                overlay: overlay,
                country: '',
                seller: ''
            };

            processedItems.set(itemId, itemData);
            // Load cached items instantly without queueing
            const cachedData = getCachedItem(itemId);
            if (cachedData) {
const countryKey = cachedData.country; // normalized
            const displayCountry = cachedData.displayCountry || countryKey;
            const city = cachedData.city;
            const flag = countryToFlag[countryKey] || '🏳️';

            itemData.country = countryKey;
            itemData.seller = cachedData.username || '';
            itemData.overlay.textContent = city
                ? `${flag} ${displayCountry}, ${city}`
                : `${flag} ${displayCountry}`;

                // Enhanced overlay styling after loading
                itemData.overlay.style.background = 'linear-gradient(135deg, rgba(76,175,80,0.95) 0%, rgba(56,142,60,0.95) 100%)';
                itemData.overlay.style.color = 'white';
                itemData.overlay.style.borderColor = '#4caf50';
                itemData.overlay.style.fontSize = '10px';
                itemData.overlay.style.padding = '5px 9px';

                updateSellerFlagBadge(itemData);
                applyFilter();
                updateQueueStatus();
            } else {
                queue.push(itemData);
            }
        });

        updateQueueStatus();
    }

    /* =========================
       Cache functions
    ========================== */

    function getCachedItem(itemId) {
        try {
            const cached = localStorage.getItem(CACHE_PREFIX + itemId);
            return cached ? JSON.parse(cached) : null;
        } catch (e) {
            console.warn('Error reading from cache:', e);
            return null;
        }
    }

    function setCachedItem(itemId, displayCountry, city, username = '') {
        try {
            const normalized = normalizeCountryName(displayCountry);
            const data = { country: normalized, displayCountry: displayCountry, city, username, timestamp: Date.now() };
            localStorage.setItem(CACHE_PREFIX + itemId, JSON.stringify(data));
        } catch (e) {
            console.warn('Error writing to cache:', e);
        }
    }

    function clearItemCache() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(CACHE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            console.warn('Error clearing cache:', e);
        }
    }

    /* =========================
       API processing
    ========================== */

    async function processQueue() {
        // Don't process if filter is disabled or paused
        if (!isFilterEnabled || isProcessing || isPausedForCaptcha || queue.length === 0 || isWaitingForEnglish || !englishCheckComplete || isPaused) return;

        isProcessing = true;
        const item = queue.shift();

        // Check cache first
        const cachedData = getCachedItem(item.id);
        if (cachedData) {
            // Use cached data
            const country = cachedData.country;
            const city = cachedData.city;
            const flag = countryToFlag[country] || '🏳️';

            item.country = country;
            item.seller = cachedData.username || '';
            item.overlay.textContent = city
                ? `${flag} ${country.charAt(0).toUpperCase() + country.slice(1)}, ${city}`
                : `${flag} ${country.charAt(0).toUpperCase() + country.slice(1)}`;

            // Enhanced overlay styling after loading
            item.overlay.style.background = 'linear-gradient(135deg, rgba(76,175,80,0.95) 0%, rgba(56,142,60,0.95) 100%)';
            item.overlay.style.color = 'white';
            item.overlay.style.borderColor = '#4caf50';
            item.overlay.style.fontSize = '10px';
            item.overlay.style.padding = '5px 9px';

            updateSellerFlagBadge(item);
            applyFilter();
            updateQueueStatus();
            setTimeout(() => (isProcessing = false), 100);
            return;
        }

        try {
            const response = await fetch(
                `https://${location.hostname}/api/v2/catalog/items/${item.id}/details`,
                {
                    credentials: 'include',
                    headers: { 'Accept': 'application/json, text/plain, */*' }
                }
            );

            if (response.status === 403) {
                const apiBlocked = await isApiAccessBlocked(response);
                if (!apiBlocked) {
                    console.warn(`[Vinted Filter] Item ${item.id} returned 403 without a captcha/access-block challenge. Skipping item.`);
                    markItemUnavailable(item);
                    updateQueueStatus();
                    setTimeout(() => (isProcessing = false), 100);
                    return;
                }

                isPausedForCaptcha = true;
                queue.unshift(item);
                const warningEl = document.getElementById('vinted-captcha-warning');
                if (warningEl) {
                    warningEl.style.display = 'block';
                }

                console.warn('[Vinted Filter] Captcha or access block detected (403). Pausing without opening a popup automatically.');
                updateStatusMessage('⚠️ API access paused. Retrying real item requests automatically...');
                startCaptchaCheck(item.id);

                isProcessing = false;
                return;
            }

            if (response.status === 429) {
                queue.unshift(item);
                setTimeout(() => (isProcessing = false), 10000);
                return;
            }

            if (response.ok) {
                const data = await response.json();
                const rawCountry = data?.item?.user?.country_title_local || 'Unknown';
                const city = data?.item?.user?.city || '';
                const username = data?.item?.user?.login || data?.item?.user?.username || '';
                const countryKey = normalizeCountryName(rawCountry);
                const flag = countryToFlag[countryKey] || '🏳️';

                item.country = countryKey; // normalized key used for filtering
                item.seller = username;
                item.overlay.textContent = city
                    ? `${flag} ${rawCountry}, ${city}`
                    : `${flag} ${rawCountry}`;

                // Cache the data (store both normalized key and display country)
                setCachedItem(item.id, rawCountry, city, username);

                // Enhanced overlay styling after loading
                item.overlay.style.background = 'linear-gradient(135deg, rgba(76,175,80,0.95) 0%, rgba(56,142,60,0.95) 100%)';
                item.overlay.style.color = 'white';
                item.overlay.style.borderColor = '#4caf50';
                item.overlay.style.fontSize = '10px';
                item.overlay.style.padding = '5px 9px';

                updateSellerFlagBadge(item);
                applyFilter();
                updateQueueStatus();
            }
        } catch (e) {
            console.error('Error fetching item:', item.id, e);
        }

        setTimeout(() => (isProcessing = false), 1000);
    }

    /* =========================
       Filtering & status
    ========================== */

    function applyFilter() {
        // Skip filtering if disabled
        if (!isFilterEnabled) {
            resetAllItems();
            return;
        }

        let matches = 0;
        let total = 0;

        processedItems.forEach(item => {
            if (!item.country) return;
            total++;

            const match = includedCountries.length === 0 || includedCountries.includes(item.country);

            item.element.style.opacity = match ? '1' : '0.1';
            item.element.style.filter = match ? 'none' : 'grayscale(100%)';
            item.element.style.transition = 'opacity 0.3s ease, filter 0.3s ease';

            if (match) matches++;
        });

        // Update match count
        const matchNumberEl = document.getElementById('vinted-match-number');
        if (matchNumberEl) {
            matchNumberEl.textContent = matches;
            // Animate the number change
            matchNumberEl.style.transform = 'scale(1.2)';
            setTimeout(() => {
                matchNumberEl.style.transform = 'scale(1)';
            }, 200);
        }

        // Update total count
        const totalNumberEl = document.getElementById('vinted-total-number');
        if (totalNumberEl) {
            totalNumberEl.textContent = total;
        }

        // Update progress bar
        updateProgressBar();
    }

    function resetAllItems() {
        // Reset all items to normal visibility and remove overlays when filter is disabled
        processedItems.forEach(item => {
            item.element.style.opacity = '1';
            item.element.style.filter = 'none';
            item.element.style.transition = 'opacity 0.3s ease, filter 0.3s ease';

            // Remove the country overlay
            if (item.overlay && item.overlay.parentNode) {
                item.overlay.remove();
            }
        });

        // Clear processed items and queue
        processedItems.clear();
        queue.length = 0;

        // Update counters
        const matchNumberEl = document.getElementById('vinted-match-number');
        const totalNumberEl = document.getElementById('vinted-total-number');
        // Duplicates stat removed in 1.4.1.1
        const queueNumberEl = document.getElementById('vinted-queue-number');
        if (matchNumberEl) matchNumberEl.textContent = '-';
        if (totalNumberEl) totalNumberEl.textContent = '-';
        // No duplicates counter to reset
        if (queueNumberEl) queueNumberEl.textContent = '0';

        // Hide progress bar
        const progressContainer = document.getElementById('vinted-progress-bar-container');
        if (progressContainer) progressContainer.style.display = 'none';
    }

    function updateQueueStatus() {
        const queueNumberEl = document.getElementById('vinted-queue-number');
        if (queueNumberEl) {
            queueNumberEl.textContent = queue.length;
            // Animate if queue is active
            if (queue.length > 0) {
                queueNumberEl.style.animation = 'pulse 1s infinite';
            } else {
                queueNumberEl.style.animation = 'none';
            }
        }

        // Update status message
        if (isPaused) {
            updateStatusMessage('⏸ Paused');
            updateProgressBar();
            return;
        }
        if (queue.length > 0) {
            updateStatusMessage(`Processing ${queue.length} item${queue.length !== 1 ? 's' : ''}...`);
        } else if (processedItems.size > 0) {
            const processedCount = Array.from(processedItems.values()).filter(item => item.country).length;
            updateStatusMessage(`✓ Processed ${processedCount} item${processedCount !== 1 ? 's' : ''}`);
        }

        updateProgressBar();
    }

    function updateProgressBar() {
        const progressContainer = document.getElementById('vinted-progress-bar-container');
        const progressBar = document.getElementById('vinted-progress-bar');

        if (!progressContainer || !progressBar) return;

        const total = processedItems.size;
        const processed = Array.from(processedItems.values()).filter(item => item.country).length;

        if (total > 0) {
            const percentage = (processed / total) * 100;
            progressBar.style.width = percentage + '%';
            progressContainer.style.display = 'block';
        } else {
            progressContainer.style.display = 'none';
        }
    }

    /* =========================
       Language Check
    ========================== */

    function checkLanguage() {
        const warningEl = document.getElementById('vinted-language-warning');
        if (warningEl) {
            warningEl.style.display = 'none';
        }
        if (isWaitingForEnglish) {
            isWaitingForEnglish = false;
            updateStatusMessage('Ready to filter items...');
        }
        englishCheckComplete = true;

        return true;
    }

    // Track navigation changes (SPA navigation)
    let lastUrl = location.href;
    const urlObserver = new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            // Reset locale readiness on navigation if an older warning state was active
            if (isWaitingForEnglish) {
                englishCheckComplete = false;
            }
        }
    });
    urlObserver.observe(document, { subtree: true, childList: true });

    /* =========================
       CSS Animations
    ========================== */

    function injectStyles() {
        if (document.getElementById('vinted-filter-styles')) return;

        const style = document.createElement('style');
        style.id = 'vinted-filter-styles';
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            #vinted-filter-menu {
                animation: slideIn 0.4s ease-out;
            }
            #vinted-country-select:hover {
                transform: translateY(-1px);
            }
            #vinted-country-select:active {
                transform: translateY(0);
            }
            .vinted-tab-btn {
                flex: 1;
                padding: 10px;
                border-radius: 10px;
                border: 2px solid #007782;
                background: rgba(0,120,130,0.08);
                color: #007782;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s, color 0.2s, transform 0.1s;
            }
            .vinted-tab-btn:hover { background: rgba(0,120,130,0.14); }
            .vinted-tab-btn:active { transform: translateY(1px); }
            .vinted-tab-active {
                background: linear-gradient(135deg, #007782, #00a8b5);
                color: white;
                box-shadow: 0 4px 12px rgba(0,119,130,0.35);
            }
            .vinted-tab-panel {
                opacity: 1;
            }
            .vinted-tab-panel-active { animation: vintedTabFade 0.28s ease; }
            .vinted-tab-panel-animate { animation: vintedTabFade 0.28s ease; }
            @keyframes vintedTabFade {
                from {
                    opacity: 0;
                    transform: translateY(6px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    /* =========================
       Timers
    ========================== */

    injectStyles();

    // Initial locale readiness check on load
    function initialLanguageCheck() {
        const isLocaleReady = checkLanguage();
        if (!isLocaleReady) {
            isWaitingForEnglish = true;
            englishCheckComplete = false;
        } else {
            englishCheckComplete = true;
        }
    }

    // Wait a bit for page to load before first check
    setTimeout(initialLanguageCheck, 1000);

    setInterval(createMenu, 1000);
    setInterval(scanItems, 2000);
    setInterval(processQueue, 200);
    setInterval(checkLanguage, 2000); // Keep locale state ready during SPA updates

})();