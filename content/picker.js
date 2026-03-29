/* ──────────────────────────────────────────────
   Content Script: Element Picker
   Injects an inspector overlay that highlights
   elements on hover and generates CSS selectors
   on click.
   ────────────────────────────────────────────── */

(() => {
  // Prevent double-injection
  if (window.__tourBuilderPickerActive !== undefined) {
    // If already loaded, just listen for messages
    return;
  }
  window.__tourBuilderPickerActive = false;

  const HIGHLIGHT_COLOR = 'rgba(99, 102, 241, 0.35)';
  const HIGHLIGHT_BORDER = '2px solid #6366f1';
  const TOOLTIP_BG = '#1e1b4b';
  const TOOLTIP_COLOR = '#e0e7ff';

  let overlay = null;
  let tooltip = null;
  let currentTarget = null;

  // ── Selector Generation ─────────────────────

  function generateSelector(el) {
    if (!el || el === document.body || el === document.documentElement) {
      return 'body';
    }

    // 1. ID (if unique and stable-looking)
    if (el.id && !isLikelyDynamicId(el.id)) {
      return `#${CSS.escape(el.id)}`;
    }

    // 2. data-tour, data-test, data-testid, data-cy attributes
    const dataAttrs = ['data-tour', 'data-tour-id', 'data-test', 'data-testid', 'data-cy', 'data-id'];
    for (const attr of dataAttrs) {
      const val = el.getAttribute(attr);
      if (val) {
        return `[${attr}="${CSS.escape(val)}"]`;
      }
    }

    // 3. Unique aria-label
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) {
      const selector = `[aria-label="${CSS.escape(ariaLabel)}"]`;
      if (document.querySelectorAll(selector).length === 1) {
        return selector;
      }
    }

    // 4. Tag + unique classes
    const stableClasses = getStableClasses(el);
    if (stableClasses.length > 0) {
      const classSelector = el.tagName.toLowerCase() + '.' + stableClasses.join('.');
      if (document.querySelectorAll(classSelector).length === 1) {
        return classSelector;
      }
    }

    // 5. Build a path from closest identifiable ancestor
    return buildPathSelector(el);
  }

  function isLikelyDynamicId(id) {
    // IDs that look auto-generated (long hex, UUIDs, etc.)
    if (/^[a-f0-9]{8,}$/i.test(id)) return true;
    if (/^[a-f0-9-]{36}$/i.test(id)) return true; // UUID
    if (/^:r[0-9a-z]+:$/.test(id)) return true; // React IDs
    if (/^[a-z]+-[a-f0-9]{4,}$/i.test(id)) return true;
    return false;
  }

  function getStableClasses(el) {
    const classes = Array.from(el.classList);
    return classes.filter((cls) => {
      // Filter out dynamic-looking classes
      if (/^[a-z]{1,3}-[a-zA-Z0-9_-]{6,}$/.test(cls)) return false; // CSS modules
      if (/^css-[a-z0-9]+$/.test(cls)) return false; // emotion
      if (/^sc-[a-zA-Z]+$/.test(cls)) return false; // styled-components
      if (/^_[a-zA-Z0-9]{5,}$/.test(cls)) return false; // webpack/vite hashed
      return true;
    }).map(cls => CSS.escape(cls));
  }

  function buildPathSelector(el) {
    const parts = [];
    let current = el;

    while (current && current !== document.body && current !== document.documentElement) {
      let part = current.tagName.toLowerCase();

      // Try to use ID for an ancestor
      if (current.id && !isLikelyDynamicId(current.id)) {
        parts.unshift(`#${CSS.escape(current.id)}`);
        break;
      }

      // Use nth-child for disambiguation
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (c) => c.tagName === current.tagName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          part += `:nth-of-type(${index})`;
        }
      }

      // Add stable classes for specificity
      const stableClasses = getStableClasses(current);
      if (stableClasses.length > 0) {
        part += '.' + stableClasses.slice(0, 2).join('.');
      }

      parts.unshift(part);
      current = current.parentElement;

      // Limit depth
      if (parts.length >= 5) break;
    }

    // If no ID was found, prepend body
    if (parts.length > 0 && !parts[0].startsWith('#')) {
      // Keep as is – relative selector
    }

    const selector = parts.join(' > ');

    // Validate
    try {
      if (document.querySelectorAll(selector).length === 1) {
        return selector;
      }
    } catch (e) {
      // Invalid selector
    }

    // Fallback: use a more detailed path
    return buildDetailedPath(el);
  }

  function buildDetailedPath(el) {
    const parts = [];
    let current = el;

    while (current && current !== document.body) {
      const parent = current.parentElement;
      if (!parent) break;

      const index = Array.from(parent.children).indexOf(current) + 1;
      parts.unshift(`${current.tagName.toLowerCase()}:nth-child(${index})`);
      current = parent;

      if (parts.length >= 8) break;
    }

    return parts.join(' > ');
  }

  // ── Element Info Extraction ─────────────────

  function getElementInfo(el) {
    const rect = el.getBoundingClientRect();
    const computed = window.getComputedStyle(el);

    return {
      selector: generateSelector(el),
      tagName: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: Array.from(el.classList),
      text: (el.textContent || '').trim().substring(0, 100),
      ariaLabel: el.getAttribute('aria-label'),
      rect: {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      attributes: getRelevantAttributes(el),
    };
  }

  function getRelevantAttributes(el) {
    const attrs = {};
    const interesting = ['role', 'type', 'name', 'href', 'src', 'alt', 'placeholder', 'title'];
    for (const attr of interesting) {
      const val = el.getAttribute(attr);
      if (val) attrs[attr] = val.substring(0, 100);
    }
    return attrs;
  }

  // ── Overlay & Tooltip ───────────────────────

  function createOverlay() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.id = '__tour-builder-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      z-index: 2147483646; cursor: crosshair;
      background: transparent; pointer-events: auto;
    `;

    tooltip = document.createElement('div');
    tooltip.id = '__tour-builder-tooltip';
    tooltip.style.cssText = `
      position: fixed; z-index: 2147483647; padding: 8px 14px;
      background: ${TOOLTIP_BG}; color: ${TOOLTIP_COLOR};
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      font-size: 12px; line-height: 1.4;
      border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      pointer-events: none; display: none; max-width: 350px;
      border: 1px solid rgba(99, 102, 241, 0.3);
      backdrop-filter: blur(8px);
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(tooltip);

    overlay.addEventListener('mousemove', onMouseMove);
    overlay.addEventListener('click', onClick);
    overlay.addEventListener('contextmenu', onRightClick);
    document.addEventListener('keydown', onKeyDown);
  }

  function removeOverlay() {
    if (overlay) {
      overlay.removeEventListener('mousemove', onMouseMove);
      overlay.removeEventListener('click', onClick);
      overlay.removeEventListener('contextmenu', onRightClick);
      document.removeEventListener('keydown', onKeyDown);
      overlay.remove();
      overlay = null;
    }
    if (tooltip) {
      tooltip.remove();
      tooltip = null;
    }
    clearHighlight();
  }

  let highlightBox = null;

  function highlightElement(el) {
    clearHighlight();
    if (!el) return;

    const rect = el.getBoundingClientRect();
    highlightBox = document.createElement('div');
    highlightBox.id = '__tour-builder-highlight';
    highlightBox.style.cssText = `
      position: fixed;
      top: ${rect.top - 2}px; left: ${rect.left - 2}px;
      width: ${rect.width + 4}px; height: ${rect.height + 4}px;
      border: ${HIGHLIGHT_BORDER};
      background: ${HIGHLIGHT_COLOR};
      z-index: 2147483645;
      pointer-events: none;
      border-radius: 4px;
      transition: all 0.1s ease;
    `;
    document.body.appendChild(highlightBox);
  }

  function clearHighlight() {
    if (highlightBox) {
      highlightBox.remove();
      highlightBox = null;
    }
  }

  function showTooltip(el, x, y) {
    if (!tooltip) return;

    const info = getElementInfo(el);
    tooltip.innerHTML = `
      <div style="font-weight:600;color:#a5b4fc;margin-bottom:2px;">&lt;${info.tagName}&gt;</div>
      <div style="font-family:monospace;color:#c7d2fe;font-size:11px;word-break:break-all;">${escapeHtml(info.selector)}</div>
      ${info.text ? `<div style="color:#94a3b8;margin-top:3px;font-size:11px;">\"${escapeHtml(info.text.substring(0, 50))}${info.text.length > 50 ? '…' : ''}\"</div>` : ''}
      <div style="color:#64748b;margin-top:4px;font-size:10px;">Klick = auswählen · ESC = abbrechen</div>
    `;

    tooltip.style.display = 'block';

    // Position tooltip
    const tooltipRect = tooltip.getBoundingClientRect();
    let tooltipX = x + 16;
    let tooltipY = y + 16;

    if (tooltipX + tooltipRect.width > window.innerWidth - 10) {
      tooltipX = x - tooltipRect.width - 10;
    }
    if (tooltipY + tooltipRect.height > window.innerHeight - 10) {
      tooltipY = y - tooltipRect.height - 10;
    }

    tooltip.style.left = tooltipX + 'px';
    tooltip.style.top = tooltipY + 'px';
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Event Handlers ──────────────────────────

  function onMouseMove(e) {
    // Temporarily hide overlay to get element underneath
    overlay.style.pointerEvents = 'none';
    const el = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.pointerEvents = 'auto';

    if (!el || el === overlay || el === tooltip || el === highlightBox ||
        el.id === '__tour-builder-overlay' ||
        el.id === '__tour-builder-tooltip' ||
        el.id === '__tour-builder-highlight') {
      return;
    }

    if (el !== currentTarget) {
      currentTarget = el;
      highlightElement(el);
      showTooltip(el, e.clientX, e.clientY);
    } else {
      // Update tooltip position
      if (tooltip) {
        const tooltipRect = tooltip.getBoundingClientRect();
        let tooltipX = e.clientX + 16;
        let tooltipY = e.clientY + 16;
        if (tooltipX + tooltipRect.width > window.innerWidth - 10) tooltipX = e.clientX - tooltipRect.width - 10;
        if (tooltipY + tooltipRect.height > window.innerHeight - 10) tooltipY = e.clientY - tooltipRect.height - 10;
        tooltip.style.left = tooltipX + 'px';
        tooltip.style.top = tooltipY + 'px';
      }
    }
  }

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!currentTarget) return;

    const info = getElementInfo(currentTarget);

    // Send to background/side panel
    chrome.runtime.sendMessage({
      type: 'ELEMENT_PICKED',
      payload: info,
    });

    // Stop picker
    stopPicker();
  }

  function onRightClick(e) {
    e.preventDefault();
    stopPicker();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      stopPicker();
    }
  }

  function startPicker() {
    window.__tourBuilderPickerActive = true;
    createOverlay();
  }

  function stopPicker() {
    window.__tourBuilderPickerActive = false;
    removeOverlay();
    currentTarget = null;
  }

  // ── Static Highlight (for hovering steps in side panel) ──

  let staticHighlight = null;

  function showStaticHighlight(selector) {
    clearStaticHighlight();
    try {
      const el = document.querySelector(selector);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      staticHighlight = document.createElement('div');
      staticHighlight.id = '__tour-builder-static-highlight';
      staticHighlight.style.cssText = `
        position: fixed;
        top: ${rect.top - 3}px; left: ${rect.left - 3}px;
        width: ${rect.width + 6}px; height: ${rect.height + 6}px;
        border: 2px dashed #6366f1;
        background: rgba(99, 102, 241, 0.15);
        z-index: 2147483640;
        pointer-events: none;
        border-radius: 4px;
        transition: all 0.2s ease;
      `;
      document.body.appendChild(staticHighlight);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) { /* invalid selector */ }
  }

  function clearStaticHighlight() {
    if (staticHighlight) {
      staticHighlight.remove();
      staticHighlight = null;
    }
  }

  // ── Message Listener ────────────────────────

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'START_PICKER':
        startPicker();
        break;
      case 'STOP_PICKER':
        stopPicker();
        break;
      case 'HIGHLIGHT_ELEMENT':
        showStaticHighlight(message.selector);
        break;
      case 'CLEAR_HIGHLIGHT':
        clearStaticHighlight();
        break;
    }
  });
})();
