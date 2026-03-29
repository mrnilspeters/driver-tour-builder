/* ═════════════════════════════════════════════════
   Tour Builder — Internationalization (i18n)
   Supports: de (German), en (English)
   ═════════════════════════════════════════════════ */

const I18N = {
  de: {
    // Header
    headerSubtitle: 'driver.js Visueller Editor',

    // Tour name
    tourNameLabel: 'Tour-Name',
    tourNamePlaceholder: 'Meine Produkt-Tour',
    tourNameDefault: 'Meine Tour',

    // Action bar
    pickElement: 'Element wählen',
    pickElementActive: 'Auswahl aktiv…',
    preview: 'Vorschau',
    pickElementTitle: 'Element auf der Seite auswählen',
    previewTitle: 'Vorschau starten',
    addStepTitle: 'Leeren Step hinzufügen',

    // Steps
    stepsTitle: 'Steps',
    noSteps: 'Keine Steps vorhanden',
    noStepsHint: 'Klicke auf „Element wählen" um einen Step hinzuzufügen',
    noElement: '(kein Element)',

    // Global settings
    globalSettings: 'Globale Einstellungen',
    animation: 'Animation',
    smoothScroll: 'Smooth Scroll',
    allowClose: 'Schließen erlauben',
    keyboardNav: 'Tastatur-Navigation',
    showProgress: 'Fortschritt anzeigen',
    overlayOpacity: 'Overlay-Deckkraft',
    overlayColor: 'Overlay-Farbe',
    stagePadding: 'Stage-Padding',
    stageRadius: 'Stage-Radius',
    popoverOffset: 'Popover-Offset',
    nextBtnLabel: '„Weiter"-Button',
    prevBtnLabel: '„Zurück"-Button',
    doneBtnLabel: '„Fertig"-Button',
    progressTemplate: 'Fortschritts-Template',

    // Default button texts (for the tour itself)
    nextBtnDefault: 'Weiter',
    prevBtnDefault: 'Zurück',
    doneBtnDefault: 'Fertig',

    // Export / Import
    exportImport: 'Export / Import',
    exportJson: 'JSON exportieren',
    exportCode: 'Code exportieren',
    copyClipboard: 'In Zwischenablage kopieren',
    importJson: 'JSON importieren',

    // Modal
    editStep: 'Step bearbeiten',
    createStep: 'Neuen Step erstellen',
    editStepN: 'Step {n} bearbeiten',
    cssSelector: 'CSS-Selektor',
    repickTitle: 'Element neu auswählen',
    title: 'Titel',
    titlePlaceholder: 'Willkommen!',
    description: 'Beschreibung',
    descriptionPlaceholder: 'Erkläre diesen Bereich...',
    htmlSupported: 'HTML wird unterstützt',
    position: 'Position',
    alignment: 'Ausrichtung',
    auto: 'Auto',
    top: 'Oben',
    right: 'Rechts',
    bottom: 'Unten',
    left: 'Links',
    start: 'Start',
    center: 'Mitte',
    end: 'Ende',
    visibleButtons: 'Sichtbare Buttons',
    next: 'Weiter',
    previous: 'Zurück',
    close: 'Schließen',
    disableInteraction: 'Interaktion deaktivieren',
    customCssClass: 'Custom CSS-Klasse',
    cancel: 'Abbrechen',
    save: 'Speichern',

    // Step card actions
    editAction: 'Bearbeiten',
    duplicateAction: 'Duplizieren',
    deleteAction: 'Löschen',

    // Toasts
    toastStepAdded: 'Step {n} hinzugefügt',
    toastStepUpdated: 'Step aktualisiert',
    toastStepDuplicated: 'Step dupliziert',
    toastStepDeleted: 'Step gelöscht',
    toastStepMoved: 'Step verschoben',
    toastNoSteps: 'Keine Steps für Vorschau vorhanden',
    toastNoTab: 'Kein aktiver Tab gefunden',
    toastPreviewStarted: 'Vorschau gestartet',
    toastJsonExported: 'JSON exportiert',
    toastCodeExported: 'Code exportiert',
    toastCopied: 'In Zwischenablage kopiert',
    toastCopyFailed: 'Kopieren fehlgeschlagen',
    toastImported: '{n} Steps importiert',
    toastInvalidJson: 'Ungültiges JSON-Format',
    toastParseError: 'JSON-Parse-Fehler: {msg}',
    toastNeedInput: 'Bitte mindestens Selektor oder Titel angeben',
    toastSaved: 'Gespeichert',
    toastSaveFailed: 'Speichern fehlgeschlagen',

    // Picker
    pickerFound: '✓ {tag} gefunden',
    pickerClickHint: 'Klick = auswählen · ESC = abbrechen',

    // Language
    language: 'Sprache',
  },

  en: {
    headerSubtitle: 'driver.js Visual Editor',

    tourNameLabel: 'Tour Name',
    tourNamePlaceholder: 'My Product Tour',
    tourNameDefault: 'My Tour',

    pickElement: 'Pick Element',
    pickElementActive: 'Picking…',
    preview: 'Preview',
    pickElementTitle: 'Select an element on the page',
    previewTitle: 'Start preview',
    addStepTitle: 'Add empty step',

    stepsTitle: 'Steps',
    noSteps: 'No steps yet',
    noStepsHint: 'Click "Pick Element" to add a step',
    noElement: '(no element)',

    globalSettings: 'Global Settings',
    animation: 'Animation',
    smoothScroll: 'Smooth Scroll',
    allowClose: 'Allow Close',
    keyboardNav: 'Keyboard Navigation',
    showProgress: 'Show Progress',
    overlayOpacity: 'Overlay Opacity',
    overlayColor: 'Overlay Color',
    stagePadding: 'Stage Padding',
    stageRadius: 'Stage Radius',
    popoverOffset: 'Popover Offset',
    nextBtnLabel: '"Next" Button',
    prevBtnLabel: '"Previous" Button',
    doneBtnLabel: '"Done" Button',
    progressTemplate: 'Progress Template',

    nextBtnDefault: 'Next',
    prevBtnDefault: 'Previous',
    doneBtnDefault: 'Done',

    exportImport: 'Export / Import',
    exportJson: 'Export JSON',
    exportCode: 'Export Code',
    copyClipboard: 'Copy to Clipboard',
    importJson: 'Import JSON',

    editStep: 'Edit Step',
    createStep: 'Create New Step',
    editStepN: 'Edit Step {n}',
    cssSelector: 'CSS Selector',
    repickTitle: 'Re-pick element',
    title: 'Title',
    titlePlaceholder: 'Welcome!',
    description: 'Description',
    descriptionPlaceholder: 'Explain this area...',
    htmlSupported: 'HTML is supported',
    position: 'Position',
    alignment: 'Alignment',
    auto: 'Auto',
    top: 'Top',
    right: 'Right',
    bottom: 'Bottom',
    left: 'Left',
    start: 'Start',
    center: 'Center',
    end: 'End',
    visibleButtons: 'Visible Buttons',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    disableInteraction: 'Disable Interaction',
    customCssClass: 'Custom CSS Class',
    cancel: 'Cancel',
    save: 'Save',

    editAction: 'Edit',
    duplicateAction: 'Duplicate',
    deleteAction: 'Delete',

    toastStepAdded: 'Step {n} added',
    toastStepUpdated: 'Step updated',
    toastStepDuplicated: 'Step duplicated',
    toastStepDeleted: 'Step deleted',
    toastStepMoved: 'Step moved',
    toastNoSteps: 'No steps available for preview',
    toastNoTab: 'No active tab found',
    toastPreviewStarted: 'Preview started',
    toastJsonExported: 'JSON exported',
    toastCodeExported: 'Code exported',
    toastCopied: 'Copied to clipboard',
    toastCopyFailed: 'Copy failed',
    toastImported: '{n} steps imported',
    toastInvalidJson: 'Invalid JSON format',
    toastParseError: 'JSON parse error: {msg}',
    toastNeedInput: 'Please provide at least a selector or title',
    toastSaved: 'Saved',
    toastSaveFailed: 'Save failed',

    pickerFound: '✓ {tag} found',
    pickerClickHint: 'Click = select · ESC = cancel',

    language: 'Language',
  },
};

// ── i18n API ─────────────────────────────────

let _currentLang = 'de';

/**
 * Get a translated string with optional interpolation.
 * Usage: t('toastStepAdded', { n: 3 }) → "Step 3 hinzugefügt"
 */
function t(key, vars = {}) {
  const dict = I18N[_currentLang] || I18N.de;
  let str = dict[key] || I18N.de[key] || key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(`{${k}}`, v);
  }
  return str;
}

/** Get current language */
function getLang() {
  return _currentLang;
}

/** Set language and update DOM */
function setLang(lang) {
  if (!I18N[lang]) return;
  _currentLang = lang;
  document.documentElement.lang = lang;
  applyTranslations();
  // Persist
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ _tourBuilderLang: lang });
  }
}

/** Load persisted language or detect from browser */
async function initLang() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    const result = await chrome.storage.local.get('_tourBuilderLang');
    if (result._tourBuilderLang && I18N[result._tourBuilderLang]) {
      _currentLang = result._tourBuilderLang;
    } else {
      // Detect browser language
      const browserLang = navigator.language?.substring(0, 2);
      _currentLang = I18N[browserLang] ? browserLang : 'de';
    }
  }
  document.documentElement.lang = _currentLang;
}

/** Apply translations to all elements with data-i18n attribute */
function applyTranslations() {
  // Translate text content / placeholders / values
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const target = el.getAttribute('data-i18n-target') || 'textContent';
    const val = t(key);
    if (target === 'textContent') {
      el.textContent = val;
    } else if (target === 'placeholder') {
      el.placeholder = val;
    } else if (target === 'title') {
      el.title = val;
    } else if (target === 'value') {
      el.value = val;
    } else if (target === 'innerHTML') {
      el.innerHTML = val;
    }
  });

  // Translate title attributes (tooltips)
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    el.title = t(key);
  });

  // Update language selector display
  const langSelect = document.getElementById('lang-select');
  if (langSelect) langSelect.value = _currentLang;
}
