/* ═════════════════════════════════════════════════
   Tour Builder — Side Panel Logic
   Manages steps, communicates with content scripts,
   handles export/import, i18n integration.
   ═════════════════════════════════════════════════ */

(() => {
  // ── State ─────────────────────────────────────

  let steps = [];
  let pickerActive = false;
  let editingStepIndex = -1;    // -1 = adding new, >= 0 = editing
  let pickingForEdit = false;   // Are we picking from within the edit modal?

  // ── DOM References ────────────────────────────

  const $stepsList = document.getElementById('steps-list');
  const $emptyState = document.getElementById('empty-state');
  const $stepCount = document.getElementById('step-count');
  const $tourName = document.getElementById('tour-name');

  // Buttons
  const $btnPick = document.getElementById('btn-pick');
  const $btnPreview = document.getElementById('btn-preview');
  const $btnAddStep = document.getElementById('btn-add-step');
  const $btnExportJson = document.getElementById('btn-export-json');
  const $btnExportCode = document.getElementById('btn-export-code');
  const $btnCopyJson = document.getElementById('btn-copy-json');
  const $btnImportJson = document.getElementById('btn-import-json');
  const $fileImport = document.getElementById('file-import');

  // Global settings
  const $toggleGlobalSettings = document.getElementById('toggle-global-settings');
  const $globalSettingsContent = document.getElementById('global-settings-content');

  // Language selector
  const $langSelect = document.getElementById('lang-select');

  // Modal
  const $stepModal = document.getElementById('step-modal');
  const $modalTitle = document.getElementById('modal-title');
  const $modalClose = document.getElementById('modal-close');
  const $modalCancel = document.getElementById('modal-cancel');
  const $modalSave = document.getElementById('modal-save');
  const $editStepIndex = document.getElementById('edit-step-index');
  const $editSelector = document.getElementById('edit-selector');
  const $editSelectorStatus = document.getElementById('edit-selector-status');
  const $editTitle = document.getElementById('edit-title');
  const $editDescription = document.getElementById('edit-description');
  const $editSide = document.getElementById('edit-side');
  const $editAlign = document.getElementById('edit-align');
  const $editBtnNext = document.getElementById('edit-btn-next');
  const $editBtnPrev = document.getElementById('edit-btn-prev');
  const $editBtnClose = document.getElementById('edit-btn-close');
  const $editDisableInteraction = document.getElementById('edit-disable-interaction');
  const $editCustomClass = document.getElementById('edit-custom-class');
  const $editPickElement = document.getElementById('edit-pick-element');

  // Toast
  const $toast = document.getElementById('toast');
  const $toastMessage = document.getElementById('toast-message');

  // Overlay opacity display
  const $overlayOpacity = document.getElementById('cfg-overlay-opacity');
  const $overlayOpacityVal = document.getElementById('cfg-overlay-opacity-val');

  // Overlay color syncing
  const $overlayColor = document.getElementById('cfg-overlay-color');
  const $overlayColorText = document.getElementById('cfg-overlay-color-text');

  // ── Helpers ───────────────────────────────────

  async function getActiveTabId() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id;
  }

  function showToast(message, type = '') {
    $toast.className = 'toast' + (type ? ` toast--${type}` : '');
    $toastMessage.textContent = message;
    $toast.style.display = 'block';
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      $toast.style.display = 'none';
    }, 2500);
  }

  function createStepDefault(selector = '', info = null) {
    return {
      element: selector,
      popover: {
        title: info?.text ? info.text.substring(0, 40) : '',
        description: '',
        side: '',
        align: '',
        showButtons: ['next', 'previous', 'close'],
        popoverClass: '',
      },
      disableActiveInteraction: false,
      _meta: {
        tagName: info?.tagName || '',
        elText: info?.text || '',
      },
    };
  }

  // ── Render Steps ──────────────────────────────

  function renderSteps() {
    $stepCount.textContent = steps.length;

    if (steps.length === 0) {
      $emptyState.style.display = '';
      $stepsList.querySelectorAll('.step-card').forEach((el) => el.remove());
      return;
    }

    $emptyState.style.display = 'none';
    $stepsList.querySelectorAll('.step-card').forEach((el) => el.remove());

    steps.forEach((step, index) => {
      const card = document.createElement('div');
      card.className = 'step-card';
      card.dataset.index = index;
      card.draggable = true;

      const title = step.popover?.title || `Step ${index + 1}`;
      const selector = step.element || t('noElement');
      const side = step.popover?.side || 'auto';

      card.innerHTML = `
        <div class="step-card__number">${index + 1}</div>
        <div class="step-card__body">
          <div class="step-card__title">${escapeHtml(title)}</div>
          <div class="step-card__selector" title="${escapeHtml(selector)}">${escapeHtml(selector)}</div>
          <div class="step-card__meta">
            <span class="step-card__tag">${side}</span>
            ${step._meta?.tagName ? `<span class="step-card__tag">&lt;${step._meta.tagName}&gt;</span>` : ''}
          </div>
        </div>
        <div class="step-card__actions">
          <button class="btn-icon step-edit" title="${t('editAction')}" data-index="${index}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon step-duplicate" title="${t('duplicateAction')}" data-index="${index}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
          <button class="btn-icon step-delete" title="${t('deleteAction')}" data-index="${index}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      `;

      // Hover → highlight element on page
      card.querySelector('.step-card__body').addEventListener('mouseenter', async () => {
        if (step.element) {
          const tabId = await getActiveTabId();
          if (tabId) {
            await chrome.scripting.executeScript({
              target: { tabId },
              files: ['content/picker.js'],
            }).catch(() => {});
            chrome.runtime.sendMessage({
              type: 'HIGHLIGHT_ELEMENT',
              payload: { tabId, selector: step.element },
            });
          }
        }
      });
      card.querySelector('.step-card__body').addEventListener('mouseleave', async () => {
        const tabId = await getActiveTabId();
        if (tabId) {
          chrome.runtime.sendMessage({
            type: 'CLEAR_HIGHLIGHT',
            payload: { tabId },
          });
        }
      });

      // Drag events
      card.addEventListener('dragstart', onDragStart);
      card.addEventListener('dragend', onDragEnd);
      card.addEventListener('dragover', onDragOver);
      card.addEventListener('drop', onDrop);
      card.addEventListener('dragleave', onDragLeave);

      $stepsList.appendChild(card);
    });

    // Wire up action buttons
    $stepsList.querySelectorAll('.step-edit').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(parseInt(btn.dataset.index));
      });
    });
    $stepsList.querySelectorAll('.step-duplicate').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        duplicateStep(parseInt(btn.dataset.index));
      });
    });
    $stepsList.querySelectorAll('.step-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteStep(parseInt(btn.dataset.index));
      });
    });

    autoSave();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Drag & Drop ───────────────────────────────

  let draggedIndex = null;

  function onDragStart(e) {
    draggedIndex = parseInt(e.currentTarget.dataset.index);
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    draggedIndex = null;
    $stepsList.querySelectorAll('.step-card').forEach((c) => c.classList.remove('drag-over'));
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
  }

  function onDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }

  function onDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(e.currentTarget.dataset.index);
    e.currentTarget.classList.remove('drag-over');

    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const [moved] = steps.splice(draggedIndex, 1);
    steps.splice(targetIndex, 0, moved);

    renderSteps();
    showToast(t('toastStepMoved'), 'success');
  }

  // ── Step Operations ───────────────────────────

  function addStep(stepData) {
    steps.push(stepData);
    renderSteps();
    showToast(t('toastStepAdded', { n: steps.length }), 'success');
  }

  function duplicateStep(index) {
    const clone = JSON.parse(JSON.stringify(steps[index]));
    clone.popover.title = (clone.popover.title || '') + ' (Copy)';
    steps.splice(index + 1, 0, clone);
    renderSteps();
    showToast(t('toastStepDuplicated'), 'success');
  }

  function deleteStep(index) {
    steps.splice(index, 1);
    renderSteps();
    showToast(t('toastStepDeleted'));
  }

  // ── Edit Modal ────────────────────────────────

  function openEditModal(index) {
    editingStepIndex = index;
    const step = index >= 0 ? steps[index] : createStepDefault();

    $modalTitle.textContent = index >= 0
      ? t('editStepN', { n: index + 1 })
      : t('createStep');
    $editStepIndex.value = index;
    $editSelector.value = step.element || '';
    $editTitle.value = step.popover?.title || '';
    $editDescription.value = step.popover?.description || '';
    $editSide.value = step.popover?.side || '';
    $editAlign.value = step.popover?.align || '';
    $editCustomClass.value = step.popover?.popoverClass || '';
    $editDisableInteraction.checked = step.disableActiveInteraction || false;

    const showButtons = step.popover?.showButtons || ['next', 'previous', 'close'];
    $editBtnNext.checked = showButtons.includes('next');
    $editBtnPrev.checked = showButtons.includes('previous');
    $editBtnClose.checked = showButtons.includes('close');

    $editSelectorStatus.textContent = '';
    $editSelectorStatus.className = 'input-hint';

    $stepModal.style.display = '';
  }

  function closeEditModal() {
    $stepModal.style.display = 'none';
    editingStepIndex = -1;
    pickingForEdit = false;
  }

  function saveFromModal() {
    const selector = $editSelector.value.trim();
    const title = $editTitle.value.trim();
    const description = $editDescription.value.trim();

    if (!selector && !title && !description) {
      showToast(t('toastNeedInput'), 'error');
      return;
    }

    const showButtons = [];
    if ($editBtnNext.checked) showButtons.push('next');
    if ($editBtnPrev.checked) showButtons.push('previous');
    if ($editBtnClose.checked) showButtons.push('close');

    const stepData = {
      element: selector,
      popover: {
        title: title,
        description: description,
        side: $editSide.value || undefined,
        align: $editAlign.value || undefined,
        showButtons: showButtons,
        popoverClass: $editCustomClass.value.trim() || undefined,
      },
      disableActiveInteraction: $editDisableInteraction.checked || undefined,
      _meta: editingStepIndex >= 0 ? steps[editingStepIndex]._meta : {},
    };

    Object.keys(stepData.popover).forEach((key) => {
      if (stepData.popover[key] === undefined) delete stepData.popover[key];
    });
    if (!stepData.disableActiveInteraction) delete stepData.disableActiveInteraction;

    if (editingStepIndex >= 0) {
      steps[editingStepIndex] = stepData;
      showToast(t('toastStepUpdated'), 'success');
    } else {
      steps.push(stepData);
      showToast(t('toastStepAdded', { n: steps.length }), 'success');
    }

    closeEditModal();
    renderSteps();
  }

  // ── Element Picker ────────────────────────────

  async function startPicker(forEdit = false) {
    pickingForEdit = forEdit;
    const tabId = await getActiveTabId();
    if (!tabId) {
      showToast(t('toastNoTab'), 'error');
      return;
    }

    pickerActive = true;
    document.body.classList.add('picker-active');
    $btnPick.querySelector('span').textContent = t('pickElementActive');

    chrome.runtime.sendMessage({
      type: 'START_PICKER',
      payload: { tabId },
    });
  }

  async function stopPicker() {
    const tabId = await getActiveTabId();
    if (tabId) {
      chrome.runtime.sendMessage({
        type: 'STOP_PICKER',
        payload: { tabId },
      });
    }
    pickerActive = false;
    pickingForEdit = false;
    document.body.classList.remove('picker-active');
    $btnPick.querySelector('span').textContent = t('pickElement');
  }

  // ── Live Preview ──────────────────────────────

  async function startPreview() {
    if (steps.length === 0) {
      showToast(t('toastNoSteps'), 'error');
      return;
    }

    const tabId = await getActiveTabId();
    if (!tabId) {
      showToast(t('toastNoTab'), 'error');
      return;
    }

    const tourConfig = buildTourConfig();

    chrome.runtime.sendMessage({
      type: 'START_PREVIEW',
      payload: { tabId, tourConfig },
    });

    showToast(t('toastPreviewStarted'), 'success');
  }

  // ── Build Tour Config ─────────────────────────

  function buildTourConfig() {
    const config = {
      animate: document.getElementById('cfg-animate').checked,
      smoothScroll: document.getElementById('cfg-smooth-scroll').checked,
      allowClose: document.getElementById('cfg-allow-close').checked,
      allowKeyboardControl: document.getElementById('cfg-keyboard').checked,
      showProgress: document.getElementById('cfg-show-progress').checked,
      overlayOpacity: parseFloat(document.getElementById('cfg-overlay-opacity').value),
      overlayColor: document.getElementById('cfg-overlay-color').value,
      stagePadding: parseInt(document.getElementById('cfg-stage-padding').value) || 10,
      stageRadius: parseInt(document.getElementById('cfg-stage-radius').value) || 5,
      popoverOffset: parseInt(document.getElementById('cfg-popover-offset').value) || 10,
      nextBtnText: document.getElementById('cfg-next-text').value || t('nextBtnDefault'),
      prevBtnText: document.getElementById('cfg-prev-text').value || t('prevBtnDefault'),
      doneBtnText: document.getElementById('cfg-done-text').value || t('doneBtnDefault'),
      progressText: document.getElementById('cfg-progress-text').value || '{{current}} / {{total}}',
      steps: steps.map((step) => {
        const s = {
          element: step.element || undefined,
          popover: {},
        };
        if (step.popover?.title) s.popover.title = step.popover.title;
        if (step.popover?.description) s.popover.description = step.popover.description;
        if (step.popover?.side) s.popover.side = step.popover.side;
        if (step.popover?.align) s.popover.align = step.popover.align;
        if (step.popover?.showButtons) s.popover.showButtons = step.popover.showButtons;
        if (step.popover?.popoverClass) s.popover.popoverClass = step.popover.popoverClass;
        if (step.disableActiveInteraction) s.disableActiveInteraction = true;
        return s;
      }),
    };

    // Remove defaults to keep export clean
    if (config.animate === true) delete config.animate;
    if (config.overlayColor === '#000000') delete config.overlayColor;
    if (config.overlayOpacity === 0.7) delete config.overlayOpacity;
    if (config.stagePadding === 10) delete config.stagePadding;
    if (config.stageRadius === 5) delete config.stageRadius;
    if (config.popoverOffset === 10) delete config.popoverOffset;
    if (config.allowKeyboardControl === true) delete config.allowKeyboardControl;

    return config;
  }

  // ── Export Functions (with Save Dialog) ───────

  async function saveWithDialog(content, suggestedName, mimeType, extensions) {
    // Try File System Access API (shows native save dialog)
    if (typeof showSaveFilePicker === 'function') {
      try {
        const ext = extensions[0]; // e.g. '.json'
        const handle = await showSaveFilePicker({
          suggestedName: suggestedName,
          types: [{
            description: ext.toUpperCase().slice(1) + ' File',
            accept: { [mimeType]: extensions },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        return true;
      } catch (e) {
        if (e.name === 'AbortError') return false; // User cancelled
        console.warn('[Tour Builder] showSaveFilePicker failed, falling back:', e);
      }
    }

    // Fallback: traditional download
    const blob = new Blob([content], { type: mimeType });
    downloadBlob(blob, suggestedName);
    return true;
  }

  async function exportJson() {
    const config = buildTourConfig();
    const content = JSON.stringify(config, null, 2);
    const filename = `${sanitizeFilename($tourName.value || 'tour')}.json`;
    const saved = await saveWithDialog(content, filename, 'application/json', ['.json']);
    if (saved) showToast(t('toastJsonExported'), 'success');
  }

  async function exportCode() {
    const config = buildTourConfig();
    const code = `import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const tourConfig = ${JSON.stringify(config, null, 2)};

const driverObj = driver(tourConfig);

// ${getLang() === 'de' ? 'Tour starten' : 'Start tour'}
driverObj.drive();
`;
    const filename = `${sanitizeFilename($tourName.value || 'tour')}.js`;
    const saved = await saveWithDialog(code, filename, 'text/javascript', ['.js']);
    if (saved) showToast(t('toastCodeExported'), 'success');
  }

  async function copyJsonToClipboard() {
    const config = buildTourConfig();
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      showToast(t('toastCopied'), 'success');
    } catch {
      showToast(t('toastCopyFailed'), 'error');
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_').toLowerCase();
  }

  // ── Import ────────────────────────────────────

  function importJson(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);

        if (config.steps && Array.isArray(config.steps)) {
          steps = config.steps.map((step) => ({
            element: step.element || '',
            popover: {
              title: step.popover?.title || '',
              description: step.popover?.description || '',
              side: step.popover?.side || '',
              align: step.popover?.align || '',
              showButtons: step.popover?.showButtons || ['next', 'previous', 'close'],
              popoverClass: step.popover?.popoverClass || '',
            },
            disableActiveInteraction: step.disableActiveInteraction || false,
            _meta: {},
          }));

          // Restore global settings
          if (config.animate !== undefined) document.getElementById('cfg-animate').checked = config.animate;
          if (config.smoothScroll !== undefined) document.getElementById('cfg-smooth-scroll').checked = config.smoothScroll;
          if (config.allowClose !== undefined) document.getElementById('cfg-allow-close').checked = config.allowClose;
          if (config.allowKeyboardControl !== undefined) document.getElementById('cfg-keyboard').checked = config.allowKeyboardControl;
          if (config.showProgress !== undefined) document.getElementById('cfg-show-progress').checked = config.showProgress;
          if (config.overlayOpacity !== undefined) {
            document.getElementById('cfg-overlay-opacity').value = config.overlayOpacity;
            $overlayOpacityVal.textContent = config.overlayOpacity;
          }
          if (config.overlayColor) {
            document.getElementById('cfg-overlay-color').value = config.overlayColor;
            document.getElementById('cfg-overlay-color-text').value = config.overlayColor;
          }
          if (config.stagePadding !== undefined) document.getElementById('cfg-stage-padding').value = config.stagePadding;
          if (config.stageRadius !== undefined) document.getElementById('cfg-stage-radius').value = config.stageRadius;
          if (config.popoverOffset !== undefined) document.getElementById('cfg-popover-offset').value = config.popoverOffset;
          if (config.nextBtnText) document.getElementById('cfg-next-text').value = config.nextBtnText;
          if (config.prevBtnText) document.getElementById('cfg-prev-text').value = config.prevBtnText;
          if (config.doneBtnText) document.getElementById('cfg-done-text').value = config.doneBtnText;
          if (config.progressText) document.getElementById('cfg-progress-text').value = config.progressText;

          renderSteps();
          showToast(t('toastImported', { n: steps.length }), 'success');
        } else {
          showToast(t('toastInvalidJson'), 'error');
        }
      } catch (err) {
        showToast(t('toastParseError', { msg: err.message }), 'error');
      }
    };
    reader.readAsText(file);
  }

  // ── Auto-Save ─────────────────────────────────

  function autoSave() {
    const tourData = {
      name: $tourName.value,
      steps: steps,
      globalConfig: {
        animate: document.getElementById('cfg-animate').checked,
        smoothScroll: document.getElementById('cfg-smooth-scroll').checked,
        allowClose: document.getElementById('cfg-allow-close').checked,
        keyboard: document.getElementById('cfg-keyboard').checked,
        showProgress: document.getElementById('cfg-show-progress').checked,
        overlayOpacity: document.getElementById('cfg-overlay-opacity').value,
        overlayColor: document.getElementById('cfg-overlay-color').value,
        stagePadding: document.getElementById('cfg-stage-padding').value,
        stageRadius: document.getElementById('cfg-stage-radius').value,
        popoverOffset: document.getElementById('cfg-popover-offset').value,
        nextBtnText: document.getElementById('cfg-next-text').value,
        prevBtnText: document.getElementById('cfg-prev-text').value,
        doneBtnText: document.getElementById('cfg-done-text').value,
        progressText: document.getElementById('cfg-progress-text').value,
      },
      updatedAt: new Date().toISOString(),
    };
    chrome.storage.local.set({ _currentTour: tourData });
  }

  function autoLoad() {
    chrome.storage.local.get('_currentTour', (result) => {
      const tour = result._currentTour;
      if (!tour) return;

      $tourName.value = tour.name || t('tourNameDefault');
      steps = tour.steps || [];

      if (tour.globalConfig) {
        const gc = tour.globalConfig;
        document.getElementById('cfg-animate').checked = gc.animate !== false;
        document.getElementById('cfg-smooth-scroll').checked = gc.smoothScroll || false;
        document.getElementById('cfg-allow-close').checked = gc.allowClose !== false;
        document.getElementById('cfg-keyboard').checked = gc.keyboard !== false;
        document.getElementById('cfg-show-progress').checked = gc.showProgress || false;
        if (gc.overlayOpacity) {
          document.getElementById('cfg-overlay-opacity').value = gc.overlayOpacity;
          $overlayOpacityVal.textContent = gc.overlayOpacity;
        }
        if (gc.overlayColor) {
          document.getElementById('cfg-overlay-color').value = gc.overlayColor;
          $overlayColorText.value = gc.overlayColor;
        }
        if (gc.stagePadding) document.getElementById('cfg-stage-padding').value = gc.stagePadding;
        if (gc.stageRadius) document.getElementById('cfg-stage-radius').value = gc.stageRadius;
        if (gc.popoverOffset) document.getElementById('cfg-popover-offset').value = gc.popoverOffset;
        if (gc.nextBtnText) document.getElementById('cfg-next-text').value = gc.nextBtnText;
        if (gc.prevBtnText) document.getElementById('cfg-prev-text').value = gc.prevBtnText;
        if (gc.doneBtnText) document.getElementById('cfg-done-text').value = gc.doneBtnText;
        if (gc.progressText) document.getElementById('cfg-progress-text').value = gc.progressText;
      }

      renderSteps();
    });
  }

  // ── Event Listeners ───────────────────────────

  // Language selector
  $langSelect.addEventListener('change', () => {
    setLang($langSelect.value);
    renderSteps(); // Re-render cards with new language
  });

  // Pick element
  $btnPick.addEventListener('click', () => {
    if (pickerActive) {
      stopPicker();
    } else {
      startPicker(false);
    }
  });

  // Add empty step
  $btnAddStep.addEventListener('click', () => {
    openEditModal(-1);
  });

  // Preview
  $btnPreview.addEventListener('click', startPreview);

  // Export/Import
  $btnExportJson.addEventListener('click', exportJson);
  $btnExportCode.addEventListener('click', exportCode);
  $btnCopyJson.addEventListener('click', copyJsonToClipboard);
  $btnImportJson.addEventListener('click', () => $fileImport.click());
  $fileImport.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      importJson(e.target.files[0]);
      e.target.value = '';
    }
  });

  // Global settings toggle
  $toggleGlobalSettings.addEventListener('click', () => {
    const isVisible = $globalSettingsContent.style.display !== 'none';
    $globalSettingsContent.style.display = isVisible ? 'none' : '';
    const titleEl = $toggleGlobalSettings.querySelector('.section__title');
    titleEl.classList.toggle('expanded', !isVisible);
  });

  // Overlay opacity slider
  $overlayOpacity.addEventListener('input', () => {
    $overlayOpacityVal.textContent = $overlayOpacity.value;
    autoSave();
  });

  // Overlay color sync
  $overlayColor.addEventListener('input', () => {
    $overlayColorText.value = $overlayColor.value;
    autoSave();
  });
  $overlayColorText.addEventListener('change', () => {
    $overlayColor.value = $overlayColorText.value;
    autoSave();
  });

  // Tour name auto-save
  $tourName.addEventListener('change', autoSave);

  // Modal
  $modalClose.addEventListener('click', closeEditModal);
  $modalCancel.addEventListener('click', closeEditModal);
  $modalSave.addEventListener('click', saveFromModal);

  // Pick element from within modal
  $editPickElement.addEventListener('click', () => {
    startPicker(true);
  });

  // Close modal on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $stepModal.style.display !== 'none') {
      closeEditModal();
    }
  });

  // Close modal on overlay click
  $stepModal.addEventListener('click', (e) => {
    if (e.target === $stepModal) closeEditModal();
  });

  // ── Message Listener (from content script via background) ──

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'ELEMENT_PICKED_RESULT') {
      const info = message.payload;

      if (pickingForEdit) {
        $editSelector.value = info.selector;
        $editSelectorStatus.textContent = t('pickerFound', { tag: info.tagName });
        $editSelectorStatus.className = 'input-hint input-hint--success';

        if (!$editTitle.value && info.text) {
          $editTitle.value = info.text.substring(0, 40);
        }

        pickingForEdit = false;
      } else {
        openEditModal(-1);
        $editSelector.value = info.selector;
        $editTitle.value = info.text ? info.text.substring(0, 40) : '';
        $editSelectorStatus.textContent = t('pickerFound', { tag: info.tagName });
        $editSelectorStatus.className = 'input-hint input-hint--success';
      }

      pickerActive = false;
      document.body.classList.remove('picker-active');
      $btnPick.querySelector('span').textContent = t('pickElement');
    }
  });

  // ── Auto-save on any settings change ──────────

  document.querySelectorAll('#global-settings-content input, #global-settings-content select').forEach((el) => {
    el.addEventListener('change', autoSave);
  });

  // ── Initialize ────────────────────────────────

  async function init() {
    await initLang();
    applyTranslations();
    $langSelect.value = getLang();
    autoLoad();
  }

  init();
})();
