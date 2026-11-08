import { WIDGET_STYLES } from './styles.js';

(function () {
  'use strict';

  // Prevent multiple initializations of core runtime
  if (window.__UniversalSizeWidgetInitialized) {
    return;
  }
  window.__UniversalSizeWidgetInitialized = true;

  // Global Widget State
  const state = {
    portalUrl: 'http://localhost:5173',
    bridgePath: '/bridge',
    apiUrl: 'http://localhost:8888/.netlify/functions/match-size',
    measurements: null,
    hasReceivedMessage: false,
    bridgeFrame: null,
    activeElements: new Map(),
    modalElement: null
  };

  /**
   * Inject CSS styles into document head
   */
  function injectStyles() {
    if (document.getElementById('us-widget-styles')) return;
    const styleTag = document.createElement('style');
    styleTag.id = 'us-widget-styles';
    styleTag.textContent = WIDGET_STYLES;
    document.head.appendChild(styleTag);
  }

  /**
   * Read configuration from current script tag or global config object
   */
  function loadConfiguration() {
    const currentScript = document.currentScript || document.querySelector('script[src*="size-widget"]');
    if (currentScript) {
      if (currentScript.dataset.portalUrl) state.portalUrl = currentScript.dataset.portalUrl;
      if (currentScript.dataset.bridgePath) state.bridgePath = currentScript.dataset.bridgePath;
      if (currentScript.dataset.apiUrl) state.apiUrl = currentScript.dataset.apiUrl;
    }
    if (window.UniversalSizeWidgetConfig) {
      Object.assign(state, window.UniversalSizeWidgetConfig);
    }
  }

  /**
   * Phase 4, Step 2: Inject invisible <iframe> pointing to Consumer Portal /bridge route
   */
  function injectBridgeIframe() {
    let iframe = document.getElementById('universal-size-bridge-frame');
    if (iframe) {
      state.bridgeFrame = iframe;
      return;
    }

    iframe = document.createElement('iframe');
    iframe.id = 'universal-size-bridge-frame';
    iframe.title = 'Universal Size Profile Storage Bridge';
    iframe.src = `${state.portalUrl.replace(/\/$/, '')}${state.bridgePath}`;
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.setAttribute('aria-hidden', 'true');

    // Trigger handshake as soon as iframe loads
    iframe.onload = function () {
      console.log('[UniversalSizeWidget] Bridge iframe loaded. Requesting size profile...');
      requestProfileHandshake();
    };

    document.body.appendChild(iframe);
    state.bridgeFrame = iframe;

    // Retry handshake intervals to guarantee delivery across browsers
    let retries = 0;
    const handshakeTimer = setInterval(() => {
      if (state.hasReceivedMessage || retries > 6) {
        clearInterval(handshakeTimer);
        return;
      }
      requestProfileHandshake();
      retries++;
    }, 400);
  }

  /**
   * Send postMessage to the bridge iframe requesting measurements
   */
  function requestProfileHandshake() {
    if (state.bridgeFrame && state.bridgeFrame.contentWindow) {
      state.bridgeFrame.contentWindow.postMessage(
        { type: 'GET_SIZE_PROFILE', source: 'universal-size-widget' },
        '*'
      );
    }
  }

  /**
   * Phase 4, Step 3: Event listener for postMessage from the bridge iframe
   */
  function setupMessageListener() {
    window.addEventListener('message', function (event) {
      if (!event.data) return;

      // Handle profile payload from bridge
      if (event.data.type === 'SIZE_PROFILE_METRICS') {
        state.hasReceivedMessage = true;
        const measurements = event.data.data;
        console.log('[UniversalSizeWidget] Received profile metrics from bridge:', measurements);
        state.measurements = measurements;

        // Process all target elements with new measurements
        processAllTargetElements();
      }
    });
  }

  /**
   * Phase 4, Step 4 & 5: Pass measurements to Netlify function and render recommendation
   */
  async function fetchSizeRecommendation(productId, brand, category, userMeasurements) {
    try {
      const response = await fetch(state.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: productId,
          brand: brand,
          product_category: category || 'tops',
          user_measurements: userMeasurements
        })
      });

      if (!response.ok) {
        throw new Error(`API error HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('[UniversalSizeWidget] Failed to fetch size from Netlify function:', err);
      return null;
    }
  }

  /**
   * Process a single widget container element
   */
  async function processElement(el) {
    const productId = el.getAttribute('data-product-id') || 'zara-slim-shirt-101';
    const brand = el.getAttribute('data-brand') || '';
    const category = el.getAttribute('data-category') || 'tops';

    // If user has no measurements saved yet in localStorage
    if (!state.measurements || !state.measurements.chest) {
      renderEmptyState(el, productId);
      return;
    }

    // Render loading state while calculating
    renderLoadingState(el);

    // Call Netlify function match-size
    const result = await fetchSizeRecommendation(productId, brand, category, state.measurements);

    if (result && result.recommended_size) {
      renderRecommendationCard(el, result, productId);
      trySyncPartnerSizeSelector(result.recommended_size);
    } else {
      renderErrorState(el);
    }
  }

  /**
   * Attempt to sync partner's native size selector (select or buttons)
   */
  function trySyncPartnerSizeSelector(recommendedSize) {
    // Try standard select elements
    const select = document.querySelector('select[name*="size" i], select#size, .size-select');
    if (select) {
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value.trim().toUpperCase() === recommendedSize.toUpperCase() ||
            select.options[i].text.trim().toUpperCase().startsWith(recommendedSize.toUpperCase())) {
          select.selectedIndex = i;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    }

    // Try size buttons
    const buttons = document.querySelectorAll('button[data-size], .size-btn, input[name="size"]');
    buttons.forEach(btn => {
      const val = btn.getAttribute('data-size') || btn.value || btn.innerText;
      if (val && val.trim().toUpperCase() === recommendedSize.toUpperCase()) {
        btn.classList.add('us-selected-recommendation');
        if (btn.tagName === 'INPUT' && btn.type === 'radio') {
          btn.checked = true;
          btn.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
  }

  /**
   * Render loading state in partner DOM
   */
  function renderLoadingState(container) {
    container.innerHTML = `
      <div class="us-widget-root">
        <div class="us-widget-card" style="display:flex;align-items:center;gap:10px;color:#64748b;font-size:13px;">
          <span class="us-loading-spinner"></span>
          <span>Matching your size profile with garment measurements...</span>
        </div>
      </div>
    `;
  }

  /**
   * Render empty state (when user hasn't created a profile yet)
   */
  function renderEmptyState(container, productId) {
    container.innerHTML = `
      <div class="us-widget-root">
        <button type="button" class="us-empty-state-btn" data-action="open-portal">
          <svg style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2;" viewBox="0 0 24 24">
            <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/>
            <line x1="14.5" y1="5.5" x2="18.5" y2="9.5"/>
          </svg>
          <span>Find your guaranteed size with <strong>Universal Size Profile</strong></span>
        </button>
      </div>
    `;

    const btn = container.querySelector('[data-action="open-portal"]');
    if (btn) {
      btn.onclick = () => openPortalModal();
    }
  }

  /**
   * Render recommendation card in partner DOM
   */
  function renderRecommendationCard(container, data, productId) {
    const detailsId = `us-details-${Math.random().toString(36).substr(2, 9)}`;

    let metricsRows = '';
    if (data.best_match_breakdown) {
      for (const [key, m] of Object.entries(data.best_match_breakdown)) {
        const statusClass = m.status === 'ideal' ? 'us-status-ideal' : (m.status === 'tight' ? 'us-status-tight' : 'us-status-loose');
        const statusLabel = m.status === 'ideal' ? '✓ Ideal Fit' : (m.status === 'tight' ? 'Snug' : 'Roomy');
        metricsRows += `
          <tr>
            <td style="text-transform:capitalize;font-weight:600;">${key}</td>
            <td>${m.user_value} cm</td>
            <td>${m.size_min} - ${m.size_max} cm</td>
            <td class="${statusClass}">${statusLabel}</td>
          </tr>
        `;
      }
    }

    container.innerHTML = `
      <div class="us-widget-root">
        <div class="us-widget-card">
          <div class="us-widget-header">
            <div class="us-badge-container">
              <div class="us-badge-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
                </svg>
              </div>
              <div class="us-title-group">
                <div class="us-tagline">Universal Size Match &bull; ${data.brand ? data.brand.name : 'Verified'}</div>
                <div class="us-recommendation-text">
                  Your Size: <span class="us-size-pill">${data.recommended_size}</span>
                  <span class="us-confidence-pill">${data.confidence_score}% Match</span>
                </div>
              </div>
            </div>
            <button type="button" class="us-action-btn" data-action="toggle-details" aria-expanded="false">
              <span>Why ${data.recommended_size}?</span>
              <svg style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2.5;" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

          <div id="${detailsId}" class="us-details-toggle" style="display:none;">
            <div class="us-fit-note">${data.fit_summary}</div>
            ${metricsRows ? `
              <table class="us-metrics-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Your Body</th>
                    <th>Size ${data.recommended_size} Range</th>
                    <th>Fit Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  ${metricsRows}
                </tbody>
              </table>
            ` : ''}
            <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#64748b;">
              <span>Zero-DB client privacy</span>
              <button type="button" data-action="edit-metrics" style="background:none;border:none;color:#4f46e5;font-weight:600;cursor:pointer;padding:0;text-decoration:underline;">
                Edit measurements
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Hook up details toggle
    const toggleBtn = container.querySelector('[data-action="toggle-details"]');
    const detailsBox = container.querySelector(`#${detailsId}`);
    if (toggleBtn && detailsBox) {
      toggleBtn.onclick = () => {
        const isHidden = detailsBox.style.display === 'none';
        detailsBox.style.display = isHidden ? 'block' : 'none';
        toggleBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
      };
    }

    // Hook up edit metrics button
    const editBtn = container.querySelector('[data-action="edit-metrics"]');
    if (editBtn) {
      editBtn.onclick = () => openPortalModal();
    }
  }

  /**
   * Render error state
   */
  function renderErrorState(container) {
    container.innerHTML = `
      <div class="us-widget-root">
        <div class="us-widget-card" style="color:#ef4444;font-size:12px;">
          Unable to calculate size recommendation at this time.
        </div>
      </div>
    `;
  }

  /**
   * Interactive modal to input measurements if user hasn't created a profile yet
   */
  function openPortalModal() {
    if (state.modalElement) {
      state.modalElement.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'us-modal-overlay';
    modal.innerHTML = `
      <div class="us-modal-dialog">
        <div class="us-modal-header">
          <h4>Universal Size Profile — Setup</h4>
          <button type="button" class="us-modal-close" aria-label="Close">&times;</button>
        </div>
        <iframe class="us-modal-iframe" src="${state.portalUrl}"></iframe>
      </div>
    `;

    const closeBtn = modal.querySelector('.us-modal-close');
    closeBtn.onclick = () => modal.remove();

    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };

    document.body.appendChild(modal);
    state.modalElement = modal;
  }

  /**
   * Find and process all target elements in partner DOM
   */
  function processAllTargetElements() {
    const selector = '[data-size-widget], [data-product-id]';
    const elements = document.querySelectorAll(selector);

    elements.forEach(el => {
      // If it's a product card or form with data-product-id, find or create mount container
      let targetContainer = el.hasAttribute('data-size-widget') ? el : el.querySelector('[data-size-widget]');
      if (!targetContainer && el.hasAttribute('data-product-id')) {
        // If element is the product container itself, append widget container
        targetContainer = el.querySelector('.universal-size-widget-mount');
        if (!targetContainer) {
          targetContainer = document.createElement('div');
          targetContainer.className = 'universal-size-widget-mount';
          targetContainer.setAttribute('data-product-id', el.getAttribute('data-product-id'));
          el.appendChild(targetContainer);
        }
      }

      if (targetContainer) {
        processElement(targetContainer);
      }
    });
  }

  /**
   * Initialization sequence
   */
  function init(customOptions = {}) {
    Object.assign(state, customOptions);
    injectStyles();
    loadConfiguration();
    setupMessageListener();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        injectBridgeIframe();
        processAllTargetElements();
      });
    } else {
      injectBridgeIframe();
      processAllTargetElements();
    }
  }

  // Public API exposed on window object
  window.UniversalSizeWidget = {
    init,
    refresh: () => {
      requestProfileHandshake();
      processAllTargetElements();
    },
    getState: () => ({ ...state })
  };

  // Auto initialize
  init();
})();
