/* ──────────────────────────────────────────────
   Service Worker — Tour Builder Background
   Message routing, storage management, content
   script injection.
   ────────────────────────────────────────────── */

// Open side panel when the extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
});

// Enable side panel on all pages
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// ── Message Routing ────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message;

  switch (type) {
    // Side Panel → Content Script: start element picking
    case 'START_PICKER':
      injectAndSend(payload.tabId, 'START_PICKER');
      break;

    // Side Panel → Content Script: stop element picking
    case 'STOP_PICKER':
      sendToTab(payload.tabId, { type: 'STOP_PICKER' });
      break;

    // Side Panel → Content Script: start preview
    case 'START_PREVIEW':
      injectPreviewAndStart(payload.tabId, payload.tourConfig);
      break;

    // Side Panel → Tab: stop preview
    case 'STOP_PREVIEW':
      stopPreviewOnTab(payload.tabId);
      break;

    // Side Panel → Content Script: highlight a specific element
    case 'HIGHLIGHT_ELEMENT':
      sendToTab(payload.tabId, {
        type: 'HIGHLIGHT_ELEMENT',
        selector: payload.selector,
      });
      break;

    // Side Panel → Content Script: clear highlight
    case 'CLEAR_HIGHLIGHT':
      sendToTab(payload.tabId, { type: 'CLEAR_HIGHLIGHT' });
      break;

    // Content Script → Side Panel: element was picked
    case 'ELEMENT_PICKED':
      // Forward to side panel
      chrome.runtime.sendMessage({
        type: 'ELEMENT_PICKED_RESULT',
        payload: payload,
      });
      break;

    // Storage: save tour
    case 'SAVE_TOUR':
      saveTour(payload.key, payload.tour).then(() => sendResponse({ ok: true }));
      return true; // async response

    // Storage: load tour
    case 'LOAD_TOUR':
      loadTour(payload.key).then((tour) => sendResponse({ tour }));
      return true;

    // Storage: list tours
    case 'LIST_TOURS':
      listTours().then((tours) => sendResponse({ tours }));
      return true;

    // Storage: delete tour
    case 'DELETE_TOUR':
      deleteTour(payload.key).then(() => sendResponse({ ok: true }));
      return true;
  }
});

// ── Content Script Injection ───────────────────

async function injectAndSend(tabId, messageType) {
  try {
    // Inject picker content script
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/picker.js'],
    });
    // Small delay to ensure the script is loaded
    setTimeout(() => {
      sendToTab(tabId, { type: messageType });
    }, 100);
  } catch (err) {
    console.error('Failed to inject picker:', err);
  }
}

async function injectPreviewAndStart(tabId, tourConfig) {
  try {
    console.log('[Tour Builder SW] Injecting preview into tab', tabId);

    // 1. Inject CSS into page
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['lib/driver.css'],
    }).catch(e => console.warn('[Tour Builder SW] CSS injection note:', e.message));

    // 2. Inject driver.js library into MAIN world
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['lib/driver.js.iife.js'],
      world: 'MAIN',
    }).catch(e => console.warn('[Tour Builder SW] Driver.js MAIN injection note:', e.message));

    // 3. Execute the tour directly in MAIN world using function + args
    //    This completely bypasses CSP because chrome.scripting.executeScript
    //    is a privileged Chrome API — no inline scripts are created.
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      args: [tourConfig],
      func: (config) => {
        try {
          // Destroy previous instance
          if (window.__tourBuilderDriverInstance) {
            try { window.__tourBuilderDriverInstance.destroy(); } catch(e) {}
            window.__tourBuilderDriverInstance = null;
          }

          // Find driver function
          var driverFn = null;
          if (typeof window.driver !== 'undefined' &&
              window.driver.js &&
              typeof window.driver.js.driver === 'function') {
            driverFn = window.driver.js.driver;
          }

          if (!driverFn) {
            console.error('[Tour Builder] driver function not found. window.driver =', window.driver);
            return { success: false, error: 'driver function not found' };
          }

          // Build steps without optional chaining
          var steps = (config.steps || []).map(function(step) {
            var s = { popover: {} };
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

          // Create driver instance
          var driverObj = driverFn({
            animate: config.animate !== false,
            smoothScroll: config.smoothScroll || false,
            allowClose: config.allowClose !== false,
            overlayColor: config.overlayColor || '#000',
            overlayOpacity: config.overlayOpacity != null ? config.overlayOpacity : 0.7,
            stagePadding: config.stagePadding != null ? config.stagePadding : 10,
            stageRadius: config.stageRadius != null ? config.stageRadius : 5,
            allowKeyboardControl: config.allowKeyboardControl !== false,
            showProgress: config.showProgress || false,
            progressText: config.progressText || '{{current}} / {{total}}',
            nextBtnText: config.nextBtnText || 'Weiter',
            prevBtnText: config.prevBtnText || 'Zurück',
            doneBtnText: config.doneBtnText || 'Fertig',
            popoverOffset: config.popoverOffset != null ? config.popoverOffset : 10,
            steps: steps,
          });

          window.__tourBuilderDriverInstance = driverObj;
          driverObj.drive();
          console.log('[Tour Builder] Preview started with', steps.length, 'steps');
          return { success: true, stepCount: steps.length };
        } catch(e) {
          console.error('[Tour Builder] Preview error:', e);
          return { success: false, error: e.message };
        }
      },
    });

    console.log('[Tour Builder SW] Preview execution result:', results);
  } catch (err) {
    console.error('[Tour Builder SW] Failed to inject preview:', err);
  }
}

async function stopPreviewOnTab(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: () => {
        if (window.__tourBuilderDriverInstance) {
          try { window.__tourBuilderDriverInstance.destroy(); } catch(e) {}
          window.__tourBuilderDriverInstance = null;
        }
      },
    });
  } catch (e) {
    // Tab might be closed
  }
}

function sendToTab(tabId, message) {
  chrome.tabs.sendMessage(tabId, message).catch((err) => {
    console.warn('[Tour Builder SW] sendToTab failed:', err.message);
  });
}

// ── Storage Management ─────────────────────────

async function saveTour(key, tour) {
  const data = {};
  data[`tour_${key}`] = tour;
  await chrome.storage.local.set(data);
}

async function loadTour(key) {
  const result = await chrome.storage.local.get(`tour_${key}`);
  return result[`tour_${key}`] || null;
}

async function listTours() {
  const all = await chrome.storage.local.get(null);
  const tours = [];
  for (const [key, value] of Object.entries(all)) {
    if (key.startsWith('tour_')) {
      tours.push({
        key: key.replace('tour_', ''),
        name: value.name || key.replace('tour_', ''),
        stepCount: value.steps?.length || 0,
        updatedAt: value.updatedAt || null,
      });
    }
  }
  return tours;
}

async function deleteTour(key) {
  await chrome.storage.local.remove(`tour_${key}`);
}
