// ==UserScript==
// @name         YouTube Tools
// @namespace    https://github.com/RynAgain/Youtube_Tampermonkey
// @version      1.1.0
// @description  A modular toolkit for YouTube with transcript copying, video/audio downloads, and more
// @author       RynAgain
// @match        https://www.youtube.com/*
// @match        https://youtube.com/*
// @connect      api.cobalt.tools
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// @updateURL    https://github.com/RynAgain/Youtube_Tampermonkey/raw/main/YouTubeTools.user.js
// @downloadURL  https://github.com/RynAgain/Youtube_Tampermonkey/raw/main/YouTubeTools.user.js
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    
    const CONFIG = {
        version: '1.1.0',
        storagePrefix: 'yt-tools-',
        panelId: 'yt-tools-panel',
        toggleId: 'yt-tools-toggle',
        debug: true, // Enable debug logging
        // Update system configuration
        githubVersionUrl: 'https://raw.githubusercontent.com/RynAgain/Youtube_Tampermonkey/main/YouTubeTools.user.js',
        versionCheckInterval: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    };

    // =========================================================================
    // SVG ICON CREATORS (Lucide Icons - ISC License)
    // Creates SVG elements programmatically to avoid TrustedHTML issues
    // =========================================================================
    
    const SVG_NS = 'http://www.w3.org/2000/svg';
    
    function createSvgElement(tag, attrs = {}) {
        const el = document.createElementNS(SVG_NS, tag);
        Object.entries(attrs).forEach(([key, value]) => {
            el.setAttribute(key, value);
        });
        return el;
    }
    
    function createBaseSvg(size = 20) {
        return createSvgElement('svg', {
            'xmlns': SVG_NS,
            'width': String(size),
            'height': String(size),
            'viewBox': '0 0 24 24',
            'fill': 'none',
            'stroke': 'currentColor',
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round'
        });
    }
    
    const IconCreators = {
        // Main panel icon - wrench/tool
        tool(size = 20) {
            const svg = createBaseSvg(size);
            const path = createSvgElement('path', {
                'd': 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'
            });
            svg.appendChild(path);
            return svg;
        },
        
        // Transcript/document icon
        transcript(size = 20) {
            const svg = createBaseSvg(size);
            svg.appendChild(createSvgElement('path', { 'd': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }));
            svg.appendChild(createSvgElement('polyline', { 'points': '14 2 14 8 20 8' }));
            svg.appendChild(createSvgElement('line', { 'x1': '16', 'y1': '13', 'x2': '8', 'y2': '13' }));
            svg.appendChild(createSvgElement('line', { 'x1': '16', 'y1': '17', 'x2': '8', 'y2': '17' }));
            svg.appendChild(createSvgElement('line', { 'x1': '10', 'y1': '9', 'x2': '8', 'y2': '9' }));
            return svg;
        },
        
        // Copy icon
        copy(size = 16) {
            const svg = createBaseSvg(size);
            svg.appendChild(createSvgElement('rect', { 'x': '9', 'y': '9', 'width': '13', 'height': '13', 'rx': '2', 'ry': '2' }));
            svg.appendChild(createSvgElement('path', { 'd': 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }));
            return svg;
        },
        
        // Check icon (success)
        check(size = 16) {
            const svg = createBaseSvg(size);
            svg.appendChild(createSvgElement('polyline', { 'points': '20 6 9 17 4 12' }));
            return svg;
        },
        
        // X icon (close)
        close(size = 16) {
            const svg = createBaseSvg(size);
            svg.appendChild(createSvgElement('line', { 'x1': '18', 'y1': '6', 'x2': '6', 'y2': '18' }));
            svg.appendChild(createSvgElement('line', { 'x1': '6', 'y1': '6', 'x2': '18', 'y2': '18' }));
            return svg;
        },
        
        // Loading spinner
        loader(size = 16) {
            const svg = createBaseSvg(size);
            svg.classList.add('tm-spin');
            svg.appendChild(createSvgElement('line', { 'x1': '12', 'y1': '2', 'x2': '12', 'y2': '6' }));
            svg.appendChild(createSvgElement('line', { 'x1': '12', 'y1': '18', 'x2': '12', 'y2': '22' }));
            svg.appendChild(createSvgElement('line', { 'x1': '4.93', 'y1': '4.93', 'x2': '7.76', 'y2': '7.76' }));
            svg.appendChild(createSvgElement('line', { 'x1': '16.24', 'y1': '16.24', 'x2': '19.07', 'y2': '19.07' }));
            svg.appendChild(createSvgElement('line', { 'x1': '2', 'y1': '12', 'x2': '6', 'y2': '12' }));
            svg.appendChild(createSvgElement('line', { 'x1': '18', 'y1': '12', 'x2': '22', 'y2': '12' }));
            svg.appendChild(createSvgElement('line', { 'x1': '4.93', 'y1': '19.07', 'x2': '7.76', 'y2': '16.24' }));
            svg.appendChild(createSvgElement('line', { 'x1': '16.24', 'y1': '7.76', 'x2': '19.07', 'y2': '4.93' }));
            return svg;
        },
        
        // Warning icon
        warning(size = 16) {
            const svg = createBaseSvg(size);
            svg.appendChild(createSvgElement('path', { 'd': 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }));
            svg.appendChild(createSvgElement('line', { 'x1': '12', 'y1': '9', 'x2': '12', 'y2': '13' }));
            svg.appendChild(createSvgElement('line', { 'x1': '12', 'y1': '17', 'x2': '12.01', 'y2': '17' }));
            return svg;
        },
        
        // Download icon
        download(size = 16) {
            const svg = createBaseSvg(size);
            svg.appendChild(createSvgElement('path', { 'd': 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }));
            svg.appendChild(createSvgElement('polyline', { 'points': '7 10 12 15 17 10' }));
            svg.appendChild(createSvgElement('line', { 'x1': '12', 'y1': '15', 'x2': '12', 'y2': '3' }));
            return svg;
        },
        
        // Music/audio icon
        music(size = 16) {
            const svg = createBaseSvg(size);
            svg.appendChild(createSvgElement('path', { 'd': 'M9 18V5l12-2v13' }));
            svg.appendChild(createSvgElement('circle', { 'cx': '6', 'cy': '18', 'r': '3' }));
            svg.appendChild(createSvgElement('circle', { 'cx': '18', 'cy': '16', 'r': '3' }));
            return svg;
        },
        
        // Video icon
        video(size = 16) {
            const svg = createBaseSvg(size);
            svg.appendChild(createSvgElement('rect', { 'x': '2', 'y': '2', 'width': '20', 'height': '20', 'rx': '2.18', 'ry': '2.18' }));
            svg.appendChild(createSvgElement('line', { 'x1': '7', 'y1': '2', 'x2': '7', 'y2': '22' }));
            svg.appendChild(createSvgElement('line', { 'x1': '17', 'y1': '2', 'x2': '17', 'y2': '22' }));
            svg.appendChild(createSvgElement('line', { 'x1': '2', 'y1': '12', 'x2': '22', 'y2': '12' }));
            svg.appendChild(createSvgElement('line', { 'x1': '2', 'y1': '7', 'x2': '7', 'y2': '7' }));
            svg.appendChild(createSvgElement('line', { 'x1': '2', 'y1': '17', 'x2': '7', 'y2': '17' }));
            svg.appendChild(createSvgElement('line', { 'x1': '17', 'y1': '17', 'x2': '22', 'y2': '17' }));
            svg.appendChild(createSvgElement('line', { 'x1': '17', 'y1': '7', 'x2': '22', 'y2': '7' }));
            return svg;
        },
        
        // External link icon
        externalLink(size = 16) {
            const svg = createBaseSvg(size);
            svg.appendChild(createSvgElement('path', { 'd': 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }));
            svg.appendChild(createSvgElement('polyline', { 'points': '15 3 21 3 21 9' }));
            svg.appendChild(createSvgElement('line', { 'x1': '10', 'y1': '14', 'x2': '21', 'y2': '3' }));
            return svg;
        }
    };

    // =========================================================================
    // STYLES
    // =========================================================================
    
    const STYLES = `
        /* CSS Variables following Anti-AI Style Guide */
        .yt-tools-root {
            --tm-bg-primary: #0f0f0f;
            --tm-bg-secondary: #1a1a1a;
            --tm-bg-tertiary: #242424;
            --tm-bg-elevated: #2d2d2d;
            --tm-text-primary: #f1f1f1;
            --tm-text-secondary: #aaaaaa;
            --tm-text-disabled: #717171;
            --tm-border-subtle: #303030;
            --tm-border-default: #3f3f3f;
            --tm-border-strong: #525252;
            --tm-accent-primary: #3ea6ff;
            --tm-accent-hover: #65b8ff;
            --tm-accent-success: #2e7d32;
            --tm-accent-warning: #f9a825;
            --tm-accent-error: #d32f2f;
            --tm-space-1: 4px;
            --tm-space-2: 8px;
            --tm-space-3: 12px;
            --tm-space-4: 16px;
            --tm-radius-sm: 4px;
            --tm-radius-md: 8px;
            --tm-transition-fast: 100ms ease;
            --tm-transition-normal: 150ms ease;
            --tm-transition-slow: 250ms ease-out;
        }

        /* Floating Toggle Button */
        .yt-tools-toggle {
            position: fixed;
            z-index: 2147483647;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #1a1a1a;
            border: 2px solid #3ea6ff;
            border-radius: 8px;
            cursor: grab;
            transition: background 100ms ease,
                        border-color 100ms ease,
                        box-shadow 100ms ease,
                        transform 100ms ease;
            color: #3ea6ff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(62, 166, 255, 0.3);
        }

        .yt-tools-toggle:hover {
            background: var(--tm-bg-tertiary);
            border-color: var(--tm-border-default);
            color: var(--tm-text-primary);
        }

        .yt-tools-toggle:active {
            cursor: grabbing;
        }

        .yt-tools-toggle.expanded {
            border-color: var(--tm-accent-primary);
        }

        /* Floating Panel */
        .yt-tools-panel {
            position: fixed;
            z-index: 9998;
            width: 320px;
            max-height: 80vh;
            background: var(--tm-bg-secondary);
            border: 1px solid var(--tm-border-subtle);
            border-radius: var(--tm-radius-md);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            font-family: 'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 14px;
            color: var(--tm-text-primary);
            overflow: hidden;
            opacity: 0;
            transform: scale(0.95);
            pointer-events: none;
            transition: opacity var(--tm-transition-normal), 
                        transform var(--tm-transition-normal);
        }

        .yt-tools-panel.visible {
            opacity: 1;
            transform: scale(1);
            pointer-events: auto;
        }

        /* Panel Header */
        .yt-tools-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--tm-space-3) var(--tm-space-4);
            border-bottom: 1px solid var(--tm-border-subtle);
            background: var(--tm-bg-primary);
        }

        .yt-tools-header-title {
            display: flex;
            align-items: center;
            gap: var(--tm-space-2);
            font-weight: 500;
            font-size: 14px;
        }

        .yt-tools-header-close {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            background: transparent;
            border: none;
            border-radius: var(--tm-radius-sm);
            color: var(--tm-text-secondary);
            cursor: pointer;
            transition: background var(--tm-transition-fast), 
                        color var(--tm-transition-fast);
        }

        .yt-tools-header-close:hover {
            background: var(--tm-bg-tertiary);
            color: var(--tm-text-primary);
        }

        /* Panel Content */
        .yt-tools-content {
            padding: var(--tm-space-3);
            max-height: calc(80vh - 52px);
            overflow-y: auto;
        }

        .yt-tools-content::-webkit-scrollbar {
            width: 8px;
        }

        .yt-tools-content::-webkit-scrollbar-track {
            background: transparent;
        }

        .yt-tools-content::-webkit-scrollbar-thumb {
            background: var(--tm-border-default);
            border-radius: 4px;
        }

        .yt-tools-content::-webkit-scrollbar-thumb:hover {
            background: var(--tm-border-strong);
        }

        /* Feature Section */
        .yt-tools-section {
            margin-bottom: var(--tm-space-3);
        }

        .yt-tools-section:last-child {
            margin-bottom: 0;
        }

        .yt-tools-section-header {
            display: flex;
            align-items: center;
            gap: var(--tm-space-2);
            padding: var(--tm-space-2) 0;
            color: var(--tm-text-secondary);
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Buttons */
        .yt-tools-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--tm-space-2);
            width: 100%;
            padding: var(--tm-space-2) var(--tm-space-3);
            background: var(--tm-bg-tertiary);
            border: 1px solid var(--tm-border-subtle);
            border-radius: var(--tm-radius-sm);
            color: var(--tm-text-primary);
            font-size: 14px;
            font-weight: 400;
            cursor: pointer;
            transition: background var(--tm-transition-fast), 
                        border-color var(--tm-transition-fast);
        }

        .yt-tools-btn:hover {
            background: var(--tm-bg-elevated);
            border-color: var(--tm-border-default);
        }

        .yt-tools-btn:active {
            background: var(--tm-bg-tertiary);
        }

        .yt-tools-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .yt-tools-btn-primary {
            background: var(--tm-accent-primary);
            border-color: var(--tm-accent-primary);
            color: var(--tm-bg-primary);
            font-weight: 500;
        }

        .yt-tools-btn-primary:hover {
            background: var(--tm-accent-hover);
            border-color: var(--tm-accent-hover);
        }

        .yt-tools-btn-success {
            background: var(--tm-accent-success);
            border-color: var(--tm-accent-success);
            color: var(--tm-text-primary);
        }

        .yt-tools-btn-error {
            background: var(--tm-accent-error);
            border-color: var(--tm-accent-error);
            color: var(--tm-text-primary);
        }

        /* Status Messages */
        .yt-tools-status {
            display: flex;
            align-items: center;
            gap: var(--tm-space-2);
            padding: var(--tm-space-2) var(--tm-space-3);
            border-radius: var(--tm-radius-sm);
            font-size: 12px;
            margin-top: var(--tm-space-2);
        }

        .yt-tools-status-success {
            background: rgba(46, 125, 50, 0.15);
            color: #4caf50;
        }

        .yt-tools-status-error {
            background: rgba(211, 47, 47, 0.15);
            color: #ef5350;
        }

        .yt-tools-status-warning {
            background: rgba(249, 168, 37, 0.15);
            color: var(--tm-accent-warning);
        }

        /* Spinner Animation */
        @keyframes tm-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .tm-spin {
            animation: tm-spin 1s linear infinite;
        }

        /* Focus Styles */
        .yt-tools-root *:focus-visible {
            outline: 2px solid var(--tm-accent-primary);
            outline-offset: 2px;
        }

        /* Video Info */
        .yt-tools-video-info {
            padding: var(--tm-space-2) var(--tm-space-3);
            background: var(--tm-bg-primary);
            border-radius: var(--tm-radius-sm);
            margin-bottom: var(--tm-space-3);
        }

        .yt-tools-video-title {
            font-size: 12px;
            color: var(--tm-text-secondary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Divider */
        .yt-tools-divider {
            height: 1px;
            background: var(--tm-border-subtle);
            margin: var(--tm-space-3) 0;
        }
    `;

    // =========================================================================
    // UTILITY FUNCTIONS
    // =========================================================================
    
    const Utils = {
        log(message, ...args) {
            if (CONFIG.debug) {
                console.log(`[YouTube Tools] ${message}`, ...args);
            }
        },

        error(message, ...args) {
            console.error(`[YouTube Tools] ${message}`, ...args);
        },

        getVideoId() {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('v');
        },

        getVideoTitle() {
            const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string, h1.ytd-watch-metadata yt-formatted-string');
            return titleElement ? titleElement.textContent.trim() : 'Unknown Video';
        },

        isVideoPage() {
            return window.location.pathname === '/watch' && this.getVideoId();
        },

        async waitForElement(selector, timeout = 10000) {
            return new Promise((resolve, reject) => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    return;
                }

                const observer = new MutationObserver((mutations, obs) => {
                    const el = document.querySelector(selector);
                    if (el) {
                        obs.disconnect();
                        resolve(el);
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`Element ${selector} not found within ${timeout}ms`));
                }, timeout);
            });
        },

        createElement(tag, attributes = {}, children = []) {
            const element = document.createElement(tag);
            
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'textContent') {
                    element.textContent = value;
                } else if (key.startsWith('on') && typeof value === 'function') {
                    element.addEventListener(key.slice(2).toLowerCase(), value);
                } else if (key === 'style' && typeof value === 'object') {
                    Object.assign(element.style, value);
                } else {
                    element.setAttribute(key, value);
                }
            });

            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof Node) {
                    element.appendChild(child);
                }
            });

            return element;
        }
    };

    // =========================================================================
    // STORAGE MANAGER
    // =========================================================================
    
    const Storage = {
        get(key, defaultValue = null) {
            try {
                return GM_getValue(CONFIG.storagePrefix + key, defaultValue);
            } catch (e) {
                Utils.error('Storage get error:', e);
                return defaultValue;
            }
        },

        set(key, value) {
            try {
                GM_setValue(CONFIG.storagePrefix + key, value);
            } catch (e) {
                Utils.error('Storage set error:', e);
            }
        }
    };

    // =========================================================================
    // TRANSCRIPT FEATURE
    // =========================================================================
    
    const TranscriptFeature = {
        name: 'Transcript',
        iconCreator: IconCreators.transcript,

        async getTranscript() {
            const videoId = Utils.getVideoId();
            if (!videoId) {
                throw new Error('No video ID found');
            }

            // Try to get transcript from YouTube's player response
            const transcript = await this.fetchTranscriptFromPage();
            if (transcript) {
                return transcript;
            }

            throw new Error('Transcript not available for this video');
        },

        async fetchTranscriptFromPage() {
            // Method 1: Try to scrape from transcript panel (works with auto-generated transcripts)
            // This is the most reliable method for all transcript types
            const scrapedTranscript = await this.scrapeTranscriptPanel();
            if (scrapedTranscript && scrapedTranscript.trim().length > 0) {
                Utils.log('Got transcript from panel scraping');
                return scrapedTranscript;
            }

            // Method 2: Try to get from ytInitialPlayerResponse (caption URL)
            if (window.ytInitialPlayerResponse) {
                const captions = window.ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
                if (captions && captions.length > 0) {
                    // Prefer English, fallback to first available
                    const englishTrack = captions.find(t => t.languageCode === 'en' || t.languageCode?.startsWith('en'));
                    const track = englishTrack || captions[0];
                    
                    if (track?.baseUrl) {
                        try {
                            const transcript = await this.fetchTranscriptFromUrl(track.baseUrl);
                            if (transcript && transcript.trim().length > 0) {
                                Utils.log('Got transcript from caption URL');
                                return transcript;
                            }
                        } catch (e) {
                            Utils.log('Failed to fetch from caption URL:', e);
                        }
                    }
                }
            }

            // Method 3: Try to extract caption URL from page scripts
            const scripts = document.querySelectorAll('script');
            for (const script of scripts) {
                const content = script.textContent;
                if (content && content.includes('captionTracks')) {
                    const match = content.match(/"captionTracks":\s*(\[.*?\])/);
                    if (match) {
                        try {
                            const tracks = JSON.parse(match[1]);
                            if (tracks.length > 0) {
                                const englishTrack = tracks.find(t => t.languageCode === 'en' || t.languageCode?.startsWith('en'));
                                const track = englishTrack || tracks[0];
                                if (track?.baseUrl) {
                                    const transcript = await this.fetchTranscriptFromUrl(track.baseUrl);
                                    if (transcript && transcript.trim().length > 0) {
                                        Utils.log('Got transcript from script-extracted URL');
                                        return transcript;
                                    }
                                }
                            }
                        } catch (e) {
                            Utils.log('Failed to parse caption tracks:', e);
                        }
                    }
                }
            }

            return null;
        },

        async fetchTranscriptFromUrl(url) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    onload: (response) => {
                        if (response.status === 200) {
                            const transcript = this.parseTranscriptXml(response.responseText);
                            resolve(transcript);
                        } else {
                            reject(new Error(`Failed to fetch transcript: ${response.status}`));
                        }
                    },
                    onerror: (error) => {
                        reject(new Error('Network error fetching transcript'));
                    }
                });
            });
        },

        parseTranscriptXml(xmlText) {
            // Parse XML using regex to avoid TrustedTypes issues with DOMParser
            const lines = [];
            const textRegex = /<text[^>]*>([^<]*)<\/text>/g;
            let match;
            
            while ((match = textRegex.exec(xmlText)) !== null) {
                let text = match[1]
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&apos;/g, "'")
                    .replace(/&#(\d+);/g, (m, code) => String.fromCharCode(parseInt(code, 10)))
                    .replace(/\n/g, ' ')
                    .trim();
                
                if (text) {
                    lines.push(text);
                }
            }

            return lines.join('\n');
        },

        async scrapeTranscriptPanel() {
            // Check if transcript panel is already open
            let transcriptPanel = document.querySelector(
                'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'
            );
            
            // If panel exists and has content, return it immediately
            if (transcriptPanel && transcriptPanel.innerText.trim().length > 50) {
                Utils.log('Transcript panel already open, scraping...');
                return transcriptPanel.innerText;
            }
            
            // Try to click the "Show transcript" button
            const showTranscriptButton = document.querySelector(
                '#primary-button > ytd-button-renderer > yt-button-shape > button, ' +
                'button[aria-label="Show transcript"], ' +
                'ytd-button-renderer:has(yt-formatted-string) button'
            );
            
            if (showTranscriptButton) {
                Utils.log('Found Show transcript button, clicking...');
                showTranscriptButton.click();
                
                // Wait a fixed time for panel to load
                await new Promise(r => setTimeout(r, 2000));
                
                // Check again for the panel
                transcriptPanel = document.querySelector(
                    'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'
                );
                
                if (transcriptPanel && transcriptPanel.innerText.trim().length > 50) {
                    Utils.log('Transcript panel loaded after click');
                    return transcriptPanel.innerText;
                }
            }
            
            // Final fallback: just check if panel exists now
            transcriptPanel = document.querySelector(
                'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'
            );
            
            if (transcriptPanel && transcriptPanel.innerText.trim() !== '') {
                return transcriptPanel.innerText;
            }
            
            return null;
        },

        async copyToClipboard(text) {
            try {
                GM_setClipboard(text, 'text');
                return true;
            } catch (e) {
                // Fallback to navigator.clipboard
                try {
                    await navigator.clipboard.writeText(text);
                    return true;
                } catch (e2) {
                    Utils.error('Clipboard error:', e2);
                    return false;
                }
            }
        },

        render(container) {
            const section = Utils.createElement('div', { className: 'yt-tools-section' });
            
            const header = Utils.createElement('div', {
                className: 'yt-tools-section-header'
            });
            header.appendChild(IconCreators.transcript());
            const headerText = document.createElement('span');
            headerText.textContent = 'Transcript';
            header.appendChild(headerText);
            
            const copyBtn = Utils.createElement('button', {
                className: 'yt-tools-btn',
                onClick: async () => {
                    await this.handleCopyClick(copyBtn, statusContainer);
                }
            });
            copyBtn.appendChild(IconCreators.copy());
            const btnText = document.createElement('span');
            btnText.textContent = 'Copy Transcript';
            copyBtn.appendChild(btnText);

            const statusContainer = Utils.createElement('div', { className: 'yt-tools-status-container' });

            section.appendChild(header);
            section.appendChild(copyBtn);
            section.appendChild(statusContainer);
            container.appendChild(section);
        },

        async handleCopyClick(button, statusContainer) {
            // Save original button content
            const originalChildren = Array.from(button.childNodes).map(n => n.cloneNode(true));
            
            // Update button to loading state
            button.textContent = '';
            button.appendChild(IconCreators.loader());
            const loadingText = document.createElement('span');
            loadingText.textContent = 'Fetching...';
            button.appendChild(loadingText);
            button.disabled = true;
            
            // Clear status container
            while (statusContainer.firstChild) {
                statusContainer.removeChild(statusContainer.firstChild);
            }

            try {
                const transcript = await this.getTranscript();
                
                if (!transcript || transcript.trim().length === 0) {
                    throw new Error('Transcript is empty');
                }

                const success = await this.copyToClipboard(transcript);
                
                if (success) {
                    button.textContent = '';
                    button.appendChild(IconCreators.check());
                    const successText = document.createElement('span');
                    successText.textContent = 'Copied';
                    button.appendChild(successText);
                    button.classList.add('yt-tools-btn-success');
                    
                    const lineCount = transcript.split('\n').length;
                    const statusDiv = Utils.createElement('div', { className: 'yt-tools-status yt-tools-status-success' });
                    statusDiv.appendChild(IconCreators.check());
                    const statusText = document.createElement('span');
                    statusText.textContent = `Copied ${lineCount} lines to clipboard`;
                    statusDiv.appendChild(statusText);
                    statusContainer.appendChild(statusDiv);
                } else {
                    throw new Error('Failed to copy to clipboard');
                }
            } catch (error) {
                Utils.error('Transcript copy error:', error);
                button.textContent = '';
                button.appendChild(IconCreators.warning());
                const failText = document.createElement('span');
                failText.textContent = 'Failed';
                button.appendChild(failText);
                button.classList.add('yt-tools-btn-error');
                
                const statusDiv = Utils.createElement('div', { className: 'yt-tools-status yt-tools-status-error' });
                statusDiv.appendChild(IconCreators.warning());
                const statusText = document.createElement('span');
                statusText.textContent = error.message;
                statusDiv.appendChild(statusText);
                statusContainer.appendChild(statusDiv);
            }

            // Reset button after delay
            setTimeout(() => {
                button.textContent = '';
                originalChildren.forEach(child => button.appendChild(child));
                button.disabled = false;
                button.classList.remove('yt-tools-btn-success', 'yt-tools-btn-error');
            }, 3000);
        }
    };

    // =========================================================================
    // DOWNLOAD FEATURE (Cobalt API)
    // =========================================================================
    
    const DownloadFeature = {
        name: 'Download',
        iconCreator: IconCreators.download,
        
        // Cobalt web interface - no API auth required
        // The web interface handles everything client-side
        cobaltWebUrl: 'https://cobalt.tools',
        
        // Video quality options (for future API use)
        qualities: {
            'MAX': 'max',
            '2160p': '2160',
            '1440p': '1440',
            '1080p': '1080',
            '720p': '720',
            '480p': '480',
            '360p': '360',
            '240p': '240',
            '144p': '144'
        },
        
        // Open Cobalt web interface with the video URL pre-filled
        openCobaltWeb(videoUrl, audioOnly = false) {
            // Cobalt web interface accepts URL as hash parameter
            // Format: https://cobalt.tools/#url=ENCODED_URL
            const encodedUrl = encodeURIComponent(videoUrl);
            const cobaltUrl = `${this.cobaltWebUrl}/#url=${encodedUrl}`;
            
            Utils.log('Opening Cobalt web interface:', cobaltUrl);
            window.open(cobaltUrl, '_blank');
        },
        
        // Copy video URL to clipboard for manual paste into Cobalt
        async copyUrlForCobalt(videoUrl) {
            try {
                GM_setClipboard(videoUrl, 'text');
                return true;
            } catch (e) {
                try {
                    await navigator.clipboard.writeText(videoUrl);
                    return true;
                } catch (e2) {
                    Utils.error('Clipboard error:', e2);
                    return false;
                }
            }
        },
        
        handleOpenCobalt(button, statusContainer) {
            // Get clean video URL (remove playlist params, etc.)
            const videoUrl = window.location.href.split('&list')[0].split('&t=')[0];
            
            // Save original button content
            const originalChildren = Array.from(button.childNodes).map(n => n.cloneNode(true));
            
            // Update button state
            button.textContent = '';
            button.appendChild(IconCreators.check());
            const successText = document.createElement('span');
            successText.textContent = 'Opening...';
            button.appendChild(successText);
            button.classList.add('yt-tools-btn-success');
            
            // Clear status container
            while (statusContainer.firstChild) {
                statusContainer.removeChild(statusContainer.firstChild);
            }
            
            // Open Cobalt web interface
            this.openCobaltWeb(videoUrl);
            
            // Show status
            const statusDiv = Utils.createElement('div', { className: 'yt-tools-status yt-tools-status-success' });
            statusDiv.appendChild(IconCreators.externalLink());
            const statusText = document.createElement('span');
            statusText.textContent = 'Cobalt opened - select quality there';
            statusDiv.appendChild(statusText);
            statusContainer.appendChild(statusDiv);
            
            // Reset button after delay
            setTimeout(() => {
                button.textContent = '';
                originalChildren.forEach(child => button.appendChild(child));
                button.classList.remove('yt-tools-btn-success');
            }, 2000);
        },
        
        async handleCopyUrl(button, statusContainer) {
            // Get clean video URL
            const videoUrl = window.location.href.split('&list')[0].split('&t=')[0];
            
            // Save original button content
            const originalChildren = Array.from(button.childNodes).map(n => n.cloneNode(true));
            
            // Clear status container
            while (statusContainer.firstChild) {
                statusContainer.removeChild(statusContainer.firstChild);
            }
            
            const success = await this.copyUrlForCobalt(videoUrl);
            
            if (success) {
                button.textContent = '';
                button.appendChild(IconCreators.check());
                const successText = document.createElement('span');
                successText.textContent = 'Copied';
                button.appendChild(successText);
                button.classList.add('yt-tools-btn-success');
                
                const statusDiv = Utils.createElement('div', { className: 'yt-tools-status yt-tools-status-success' });
                statusDiv.appendChild(IconCreators.check());
                const statusText = document.createElement('span');
                statusText.textContent = 'URL copied - paste into cobalt.tools';
                statusDiv.appendChild(statusText);
                statusContainer.appendChild(statusDiv);
            } else {
                button.textContent = '';
                button.appendChild(IconCreators.warning());
                const failText = document.createElement('span');
                failText.textContent = 'Failed';
                button.appendChild(failText);
                button.classList.add('yt-tools-btn-error');
            }
            
            // Reset button after delay
            setTimeout(() => {
                button.textContent = '';
                originalChildren.forEach(child => button.appendChild(child));
                button.classList.remove('yt-tools-btn-success', 'yt-tools-btn-error');
            }, 2000);
        },
        
        render(container) {
            const section = Utils.createElement('div', { className: 'yt-tools-section' });
            
            // Section header
            const header = Utils.createElement('div', {
                className: 'yt-tools-section-header'
            });
            header.appendChild(IconCreators.download());
            const headerText = document.createElement('span');
            headerText.textContent = 'Download';
            header.appendChild(headerText);
            section.appendChild(header);
            
            // Status container (shared by all buttons)
            const statusContainer = Utils.createElement('div', { className: 'yt-tools-status-container' });
            
            // Open Cobalt button (primary action)
            const cobaltBtn = Utils.createElement('button', {
                className: 'yt-tools-btn yt-tools-btn-primary',
                style: { marginBottom: '8px' },
                onClick: () => {
                    this.handleOpenCobalt(cobaltBtn, statusContainer);
                }
            });
            cobaltBtn.appendChild(IconCreators.externalLink());
            const cobaltBtnText = document.createElement('span');
            cobaltBtnText.textContent = 'Open in Cobalt';
            cobaltBtn.appendChild(cobaltBtnText);
            section.appendChild(cobaltBtn);
            
            // Copy URL button (secondary action)
            const copyBtn = Utils.createElement('button', {
                className: 'yt-tools-btn',
                onClick: async () => {
                    await this.handleCopyUrl(copyBtn, statusContainer);
                }
            });
            copyBtn.appendChild(IconCreators.copy());
            const copyBtnText = document.createElement('span');
            copyBtnText.textContent = 'Copy URL for Cobalt';
            copyBtn.appendChild(copyBtnText);
            section.appendChild(copyBtn);
            
            // Add status container at the end
            section.appendChild(statusContainer);
            
            container.appendChild(section);
        }
    };

    // =========================================================================
    // FEATURE REGISTRY
    // =========================================================================
    
    const Features = {
        registered: [],

        register(feature) {
            this.registered.push(feature);
            Utils.log(`Registered feature: ${feature.name}`);
        },

        getAll() {
            return this.registered;
        }
    };

    // Register features
    Features.register(TranscriptFeature);
    Features.register(DownloadFeature);

    // =========================================================================
    // PANEL UI
    // =========================================================================
    
    const PanelUI = {
        toggle: null,
        panel: null,
        isExpanded: false,
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        position: { x: 16, y: 200 },
        edge: 'left', // 'left' or 'right'

        init() {
            this.injectStyles();
            this.loadPosition();
            this.createToggle();
            this.createPanel();
            this.setupDragging();
            this.setupPageChangeListener();
            Utils.log('Panel UI initialized');
        },

        injectStyles() {
            const styleEl = document.createElement('style');
            styleEl.id = 'yt-tools-styles';
            styleEl.textContent = STYLES;
            document.head.appendChild(styleEl);
        },

        loadPosition() {
            const saved = Storage.get('panelPosition');
            if (saved) {
                this.position = saved.position || this.position;
                this.edge = saved.edge || this.edge;
            }
        },

        savePosition() {
            Storage.set('panelPosition', {
                position: this.position,
                edge: this.edge
            });
        },

        createToggle() {
            this.toggle = Utils.createElement('div', {
                id: CONFIG.toggleId,
                className: 'yt-tools-root yt-tools-toggle',
                title: 'YouTube Tools',
                onClick: (e) => {
                    if (!this.isDragging) {
                        this.togglePanel();
                    }
                }
            });
            
            // Add SVG icon using IconCreators
            this.toggle.appendChild(IconCreators.tool());

            this.updateTogglePosition();
            document.body.appendChild(this.toggle);
        },

        createPanel() {
            this.panel = Utils.createElement('div', {
                id: CONFIG.panelId,
                className: 'yt-tools-root yt-tools-panel'
            });

            // Header
            const header = Utils.createElement('div', { className: 'yt-tools-header' });
            
            const headerTitle = Utils.createElement('div', {
                className: 'yt-tools-header-title'
            });
            headerTitle.appendChild(IconCreators.tool());
            const titleText = document.createElement('span');
            titleText.textContent = 'YouTube Tools';
            headerTitle.appendChild(titleText);

            const closeBtn = Utils.createElement('button', {
                className: 'yt-tools-header-close',
                title: 'Close',
                onClick: () => this.hidePanel()
            });
            closeBtn.appendChild(IconCreators.close());

            header.appendChild(headerTitle);
            header.appendChild(closeBtn);

            // Content
            const content = Utils.createElement('div', { className: 'yt-tools-content' });

            // Video info (shown when on video page)
            if (Utils.isVideoPage()) {
                const videoInfo = Utils.createElement('div', { className: 'yt-tools-video-info' });
                const videoTitle = Utils.createElement('div', {
                    className: 'yt-tools-video-title',
                    textContent: Utils.getVideoTitle(),
                    title: Utils.getVideoTitle()
                });
                videoInfo.appendChild(videoTitle);
                content.appendChild(videoInfo);
            }

            // Render all registered features
            Features.getAll().forEach(feature => {
                if (typeof feature.render === 'function') {
                    feature.render(content);
                }
            });

            this.panel.appendChild(header);
            this.panel.appendChild(content);
            
            this.updatePanelPosition();
            document.body.appendChild(this.panel);
        },

        updateTogglePosition() {
            if (!this.toggle) return;
            
            if (this.edge === 'left') {
                this.toggle.style.left = `${this.position.x}px`;
                this.toggle.style.right = 'auto';
            } else {
                this.toggle.style.right = `${this.position.x}px`;
                this.toggle.style.left = 'auto';
            }
            this.toggle.style.top = `${this.position.y}px`;
        },

        updatePanelPosition() {
            if (!this.panel || !this.toggle) return;

            const toggleRect = this.toggle.getBoundingClientRect();
            const panelWidth = 320;
            const padding = 8;

            if (this.edge === 'left') {
                this.panel.style.left = `${toggleRect.right + padding}px`;
                this.panel.style.right = 'auto';
            } else {
                this.panel.style.right = `${window.innerWidth - toggleRect.left + padding}px`;
                this.panel.style.left = 'auto';
            }

            // Position vertically, ensuring panel stays in viewport
            let top = toggleRect.top;
            const panelHeight = this.panel.offsetHeight || 400;
            
            if (top + panelHeight > window.innerHeight - 20) {
                top = window.innerHeight - panelHeight - 20;
            }
            if (top < 20) {
                top = 20;
            }

            this.panel.style.top = `${top}px`;
        },

        setupDragging() {
            let startX, startY, startPosX, startPosY;
            let hasMoved = false;

            const onMouseDown = (e) => {
                if (e.button !== 0) return; // Only left click
                
                this.isDragging = true;
                hasMoved = false;
                startX = e.clientX;
                startY = e.clientY;
                startPosX = this.position.x;
                startPosY = this.position.y;
                
                this.toggle.style.cursor = 'grabbing';
                e.preventDefault();
            };

            const onMouseMove = (e) => {
                if (!this.isDragging) return;

                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
                    hasMoved = true;
                }

                // Calculate new position
                let newY = startPosY + deltaY;
                
                // Constrain to viewport
                newY = Math.max(20, Math.min(window.innerHeight - 60, newY));
                this.position.y = newY;

                // Determine edge based on horizontal position
                const centerX = e.clientX;
                if (centerX < window.innerWidth / 2) {
                    this.edge = 'left';
                    this.position.x = Math.max(8, Math.min(100, startPosX + deltaX));
                } else {
                    this.edge = 'right';
                    this.position.x = Math.max(8, Math.min(100, window.innerWidth - startPosX - 40 - deltaX));
                }

                this.updateTogglePosition();
                this.updatePanelPosition();
            };

            const onMouseUp = () => {
                if (!this.isDragging) return;
                
                this.isDragging = false;
                this.toggle.style.cursor = 'grab';
                
                if (hasMoved) {
                    this.savePosition();
                    // Prevent click event from firing
                    setTimeout(() => {
                        this.isDragging = false;
                    }, 10);
                }
            };

            this.toggle.addEventListener('mousedown', onMouseDown);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        },

        togglePanel() {
            if (this.isExpanded) {
                this.hidePanel();
            } else {
                this.showPanel();
            }
        },

        showPanel() {
            if (!this.panel) return;
            
            // Refresh content if on video page
            if (Utils.isVideoPage()) {
                this.refreshPanelContent();
            }

            this.updatePanelPosition();
            this.panel.classList.add('visible');
            this.toggle.classList.add('expanded');
            this.isExpanded = true;
        },

        hidePanel() {
            if (!this.panel) return;
            
            this.panel.classList.remove('visible');
            this.toggle.classList.remove('expanded');
            this.isExpanded = false;
        },

        refreshPanelContent() {
            const content = this.panel.querySelector('.yt-tools-content');
            if (!content) return;

            // Clear content safely without innerHTML
            while (content.firstChild) {
                content.removeChild(content.firstChild);
            }

            // Video info
            if (Utils.isVideoPage()) {
                const videoInfo = Utils.createElement('div', { className: 'yt-tools-video-info' });
                const videoTitle = Utils.createElement('div', {
                    className: 'yt-tools-video-title',
                    textContent: Utils.getVideoTitle(),
                    title: Utils.getVideoTitle()
                });
                videoInfo.appendChild(videoTitle);
                content.appendChild(videoInfo);
            }

            // Render features
            Features.getAll().forEach(feature => {
                if (typeof feature.render === 'function') {
                    feature.render(content);
                }
            });
        },

        setupPageChangeListener() {
            // YouTube uses SPA navigation, so we need to detect URL changes
            let lastUrl = location.href;
            
            const observer = new MutationObserver(() => {
                if (location.href !== lastUrl) {
                    lastUrl = location.href;
                    Utils.log('Page changed:', lastUrl);
                    
                    // Refresh panel content on navigation
                    if (this.isExpanded) {
                        setTimeout(() => this.refreshPanelContent(), 500);
                    }
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },

        destroy() {
            if (this.toggle) {
                this.toggle.remove();
                this.toggle = null;
            }
            if (this.panel) {
                this.panel.remove();
                this.panel = null;
            }
            const styles = document.getElementById('yt-tools-styles');
            if (styles) {
                styles.remove();
            }
        }
    };

    // =========================================================================
    // UPDATE SYSTEM
    // =========================================================================
    
    const UpdateSystem = {
        versionCheckInterval: null,
        
        init() {
            Utils.log('Starting automatic version checking...');
            
            // Check after 5 seconds on startup (don't show "no update" message)
            setTimeout(() => {
                this.checkForUpdates(false);
            }, 5000);
            
            // Set up periodic checking
            this.versionCheckInterval = setInterval(() => {
                this.checkForUpdates(false);
            }, CONFIG.versionCheckInterval);
            
            Utils.log('Version checking initialized');
        },
        
        async checkForUpdates(showNoUpdateMessage = false) {
            try {
                const lastCheck = Storage.get('lastVersionCheck', 0);
                const now = Date.now();
                
                // Skip if checked recently (unless manual check)
                if (!showNoUpdateMessage && (now - lastCheck) < CONFIG.versionCheckInterval) {
                    Utils.log('Skipping version check - checked recently');
                    return;
                }
                
                Utils.log('Checking for updates...');
                
                const latestVersion = await this.fetchLatestVersion();
                Storage.set('lastVersionCheck', now);
                
                if (!latestVersion) {
                    if (showNoUpdateMessage) {
                        this.showMessage('Could not fetch version information', 'error');
                    }
                    return;
                }
                
                const skippedVersion = Storage.get('skippedVersion', null);
                
                if (this.isNewerVersion(latestVersion, CONFIG.version)) {
                    // Check if user skipped this version
                    if (skippedVersion === latestVersion && !showNoUpdateMessage) {
                        Utils.log(`Version ${latestVersion} was skipped by user`);
                        return;
                    }
                    
                    this.showUpdateNotification(latestVersion);
                } else if (showNoUpdateMessage) {
                    this.showMessage(`You're running the latest version (${CONFIG.version})`, 'success');
                }
                
            } catch (error) {
                Utils.error('Update check failed:', error);
                if (showNoUpdateMessage) {
                    this.showMessage(`Failed to check for updates: ${error.message}`, 'error');
                }
            }
        },
        
        fetchLatestVersion() {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: CONFIG.githubVersionUrl + '?t=' + Date.now(), // Cache bust
                    headers: {
                        'Cache-Control': 'no-cache'
                    },
                    onload: (response) => {
                        if (response.status === 200) {
                            // Extract version from @version tag
                            const versionMatch = response.responseText.match(/@version\s+([^\s]+)/);
                            if (versionMatch) {
                                resolve(versionMatch[1].trim());
                            } else {
                                resolve(null);
                            }
                        } else {
                            reject(new Error(`HTTP ${response.status}`));
                        }
                    },
                    onerror: (error) => {
                        reject(new Error('Network error'));
                    }
                });
            });
        },
        
        isNewerVersion(latest, current) {
            const latestParts = latest.split('.').map(part => parseInt(part, 10) || 0);
            const currentParts = current.split('.').map(part => parseInt(part, 10) || 0);
            
            const maxLength = Math.max(latestParts.length, currentParts.length);
            while (latestParts.length < maxLength) latestParts.push(0);
            while (currentParts.length < maxLength) currentParts.push(0);
            
            for (let i = 0; i < maxLength; i++) {
                if (latestParts[i] > currentParts[i]) return true;
                if (latestParts[i] < currentParts[i]) return false;
            }
            
            return false;
        },
        
        showUpdateNotification(latestVersion) {
            // Create modal overlay
            const overlay = Utils.createElement('div', {
                className: 'yt-tools-root',
                style: {
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'rgba(0, 0, 0, 0.7)',
                    zIndex: '2147483647',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }
            });
            
            // Create modal
            const modal = Utils.createElement('div', {
                style: {
                    background: 'var(--tm-bg-secondary)',
                    border: '1px solid var(--tm-border-subtle)',
                    borderRadius: 'var(--tm-radius-md)',
                    padding: '24px',
                    maxWidth: '400px',
                    width: '90%',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
                }
            });
            
            // Header
            const header = Utils.createElement('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                }
            });
            header.appendChild(IconCreators.download(24));
            const title = Utils.createElement('h2', {
                textContent: 'Update Available',
                style: {
                    margin: '0',
                    fontSize: '18px',
                    fontWeight: '500',
                    color: 'var(--tm-text-primary)'
                }
            });
            header.appendChild(title);
            modal.appendChild(header);
            
            // Version info
            const versionInfo = Utils.createElement('div', {
                style: {
                    background: 'var(--tm-bg-primary)',
                    borderRadius: 'var(--tm-radius-sm)',
                    padding: '12px',
                    marginBottom: '16px'
                }
            });
            
            const currentLine = Utils.createElement('div', {
                style: { marginBottom: '8px', color: 'var(--tm-text-secondary)', fontSize: '14px' }
            });
            currentLine.appendChild(document.createTextNode('Current: '));
            const currentSpan = Utils.createElement('span', {
                textContent: CONFIG.version,
                style: { color: 'var(--tm-text-primary)' }
            });
            currentLine.appendChild(currentSpan);
            versionInfo.appendChild(currentLine);
            
            const latestLine = Utils.createElement('div', {
                style: { color: 'var(--tm-text-secondary)', fontSize: '14px' }
            });
            latestLine.appendChild(document.createTextNode('Latest: '));
            const latestSpan = Utils.createElement('span', {
                textContent: latestVersion,
                style: { color: 'var(--tm-accent-primary)', fontWeight: '500' }
            });
            latestLine.appendChild(latestSpan);
            versionInfo.appendChild(latestLine);
            
            modal.appendChild(versionInfo);
            
            // Buttons
            const buttonContainer = Utils.createElement('div', {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }
            });
            
            // Update button
            const updateBtn = Utils.createElement('button', {
                className: 'yt-tools-btn yt-tools-btn-primary',
                onClick: () => {
                    window.open(CONFIG.githubVersionUrl, '_blank');
                    overlay.remove();
                }
            });
            updateBtn.appendChild(IconCreators.externalLink());
            const updateText = document.createElement('span');
            updateText.textContent = 'Update Now';
            updateBtn.appendChild(updateText);
            buttonContainer.appendChild(updateBtn);
            
            // Remind later button
            const remindBtn = Utils.createElement('button', {
                className: 'yt-tools-btn',
                onClick: () => {
                    Storage.set('lastVersionCheck', 0); // Reset to check again soon
                    overlay.remove();
                }
            });
            const remindText = document.createElement('span');
            remindText.textContent = 'Remind Me Later';
            remindBtn.appendChild(remindText);
            buttonContainer.appendChild(remindBtn);
            
            // Skip version button
            const skipBtn = Utils.createElement('button', {
                className: 'yt-tools-btn',
                style: { opacity: '0.7' },
                onClick: () => {
                    Storage.set('skippedVersion', latestVersion);
                    overlay.remove();
                }
            });
            const skipText = document.createElement('span');
            skipText.textContent = 'Skip This Version';
            skipBtn.appendChild(skipText);
            buttonContainer.appendChild(skipBtn);
            
            modal.appendChild(buttonContainer);
            overlay.appendChild(modal);
            
            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });
            
            document.body.appendChild(overlay);
        },
        
        showMessage(message, type = 'info') {
            // Simple toast notification
            const toast = Utils.createElement('div', {
                className: 'yt-tools-root',
                style: {
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: type === 'success' ? 'var(--tm-accent-success)' :
                               type === 'error' ? 'var(--tm-accent-error)' : 'var(--tm-bg-elevated)',
                    color: 'var(--tm-text-primary)',
                    padding: '12px 24px',
                    borderRadius: 'var(--tm-radius-md)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    zIndex: '2147483647',
                    fontSize: '14px'
                },
                textContent: message
            });
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    };

    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    
    function init() {
        // Always log to confirm script is running
        console.log('%c[YouTube Tools] Script loaded v' + CONFIG.version, 'color: #3ea6ff; font-weight: bold; font-size: 14px;');
        
        // Prevent duplicate initialization
        if (document.getElementById(CONFIG.toggleId)) {
            console.log('[YouTube Tools] Already initialized, skipping');
            return;
        }

        console.log('[YouTube Tools] Initializing...');
        
        // Wait for body to be ready
        if (document.body) {
            PanelUI.init();
            UpdateSystem.init();
            console.log('[YouTube Tools] UI initialized - look for blue wrench icon on left side of screen');
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                PanelUI.init();
                UpdateSystem.init();
                console.log('[YouTube Tools] UI initialized (after DOMContentLoaded) - look for blue wrench icon on left side of screen');
            });
        }
    }

    // Start initialization
    init();

    // Export for testing
    try {
        module.exports = {
            CONFIG,
            Utils,
            Storage,
            Features,
            TranscriptFeature,
            PanelUI
        };
    } catch (e) {
        // Browser environment
    }

})();