/* ──────────────────────────────────────────────
   Content Script: Live Preview
   Injects driver.js into the page and runs a
   tour preview using the configuration from
   the side panel.

   Strategy: Uses chrome.scripting.executeScript
   with world: MAIN to bypass CSP restrictions.
   Falls back to <script> tag injection.
   ────────────────────────────────────────────── */

(() => {
  // Prevent double-injection of listeners
  if (window.__tourBuilderPreviewLoaded) return;
  window.__tourBuilderPreviewLoaded = true;

  // ── Inject driver.js resources into page ────

  function ensureDriverCss() {
    if (!document.querySelector('#__tour-builder-driver-css')) {
      const link = document.createElement('link');
      link.id = '__tour-builder-driver-css';
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL('lib/driver.css');
      document.head.appendChild(link);
    }
  }

  function ensureDriverScript() {
    return new Promise((resolve) => {
      if (document.querySelector('#__tour-builder-driver-js')) {
        // Already injected, give it a moment
        setTimeout(() => resolve(true), 50);
        return;
      }

      const script = document.createElement('script');
      script.id = '__tour-builder-driver-js';
      script.src = chrome.runtime.getURL('lib/driver.js.iife.js');
      script.onload = () => setTimeout(() => resolve(true), 100);
      script.onerror = () => resolve(false);
      (document.head || document.documentElement).appendChild(script);
    });
  }

  // ── Run code in page context ────────────────

  function runInPageContext(code) {
    const script = document.createElement('script');
    script.textContent = code;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  // ── Start Preview ───────────────────────────

  async function startPreview(tourConfig) {
    // 1. Stop any existing preview
    stopPreview();

    // 2. Inject CSS
    ensureDriverCss();

    // 3. Inject driver.js script into page
    const loaded = await ensureDriverScript();
    if (!loaded) {
      console.error('[Tour Builder] Failed to load driver.js');
      return;
    }

    // 4. Build the driver init code as a string
    //    Avoid optional chaining for max compatibility
    const stepsCode = (tourConfig.steps || []).map(function(step) {
      const s = { popover: {} };

      if (step.element) s.element = step.element;

      if (step.popover) {
        if (step.popover.title) s.popover.title = step.popover.title;
        if (step.popover.description) s.popover.description = step.popover.description;
        if (step.popover.side) s.popover.side = step.popover.side;
        if (step.popover.align) s.popover.align = step.popover.align;
        if (step.popover.popoverClass) s.popover.popoverClass = step.popover.popoverClass;
        if (step.popover.showButtons) s.popover.showButtons = step.popover.showButtons;
      }

      if (step.disableActiveInteraction) s.disableActiveInteraction = true;

      return s;
    });

    const driverConfig = {
      animate: tourConfig.animate !== false,
      smoothScroll: tourConfig.smoothScroll || false,
      allowClose: tourConfig.allowClose !== false,
      overlayColor: tourConfig.overlayColor || '#000',
      overlayOpacity: tourConfig.overlayOpacity != null ? tourConfig.overlayOpacity : 0.7,
      stagePadding: tourConfig.stagePadding != null ? tourConfig.stagePadding : 10,
      stageRadius: tourConfig.stageRadius != null ? tourConfig.stageRadius : 5,
      allowKeyboardControl: tourConfig.allowKeyboardControl !== false,
      showProgress: tourConfig.showProgress || false,
      progressText: tourConfig.progressText || '{{current}} / {{total}}',
      nextBtnText: tourConfig.nextBtnText || 'Weiter',
      prevBtnText: tourConfig.prevBtnText || 'Zurück',
      doneBtnText: tourConfig.doneBtnText || 'Fertig',
      popoverOffset: tourConfig.popoverOffset != null ? tourConfig.popoverOffset : 10,
      steps: stepsCode,
    };

    const configStr = JSON.stringify(driverConfig);

    // 5. Execute in page context
    const initCode = `
(function() {
  try {
    if (window.__tourBuilderDriverInstance) {
      try { window.__tourBuilderDriverInstance.destroy(); } catch(e) {}
      window.__tourBuilderDriverInstance = null;
    }

    var driverFn = null;
    if (typeof window.driver !== 'undefined' && window.driver.js && typeof window.driver.js.driver === 'function') {
      driverFn = window.driver.js.driver;
    }

    if (!driverFn) {
      console.error('[Tour Builder] driver function not found. window.driver =', window.driver);
      return;
    }

    var cfg = ${configStr};
    var driverObj = driverFn(cfg);
    window.__tourBuilderDriverInstance = driverObj;
    driverObj.drive();
    console.log('[Tour Builder] Preview started with', cfg.steps.length, 'steps');
  } catch(e) {
    console.error('[Tour Builder] Preview error:', e);
  }
})();`;

    runInPageContext(initCode);
  }

  function stopPreview() {
    runInPageContext(`
      if (window.__tourBuilderDriverInstance) {
        try { window.__tourBuilderDriverInstance.destroy(); } catch(e) {}
        window.__tourBuilderDriverInstance = null;
      }
    `);
  }

  // ── Message Listener ────────────────────────

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'START_PREVIEW':
        startPreview(message.tourConfig);
        break;
      case 'STOP_PREVIEW':
        stopPreview();
        break;
    }
  });
})();
