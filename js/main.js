/**
 * HOLY SCRIPTURE — main.js
 * CEP panel logic for Adobe After Effects.
 * Phases 1–4 + AE Context Bar.
 */

(function () {
    'use strict';

    // ============================================================
    // CONSTANTS
    // ============================================================
    var STORAGE_SLOTS   = 'hs_slots';
    var STORAGE_LIBRARY = 'hs_library';
    var STORAGE_HISTORY = 'hs_history';
    var MAX_HISTORY     = 100;
    var CONTEXT_INTERVAL = 2000; // ms

    // ============================================================
    // STATE
    // ============================================================
    var state = {
        activeTab: 'editor',
        slots: [],
        library: { categories: [], scripts: [] },
        history: [],
        pendingSaveCode: null   // code queued for the save modal
    };

    // ============================================================
    // CEP INTERFACE
    // ============================================================
    var cs = null;
    var isInCEP = (typeof CSInterface !== 'undefined');

    if (isInCEP) {
        cs = new CSInterface();
        // Theme the panel to match AE's UI colour
        var skinInfo = cs.getHostEnvironment().appSkinInfo;
        if (skinInfo) {
            document.body.style.fontSize = skinInfo.baseFontSize + 'px';
        }
    }

    // ============================================================
    // CODEMIRROR EDITOR
    // ============================================================
    var editor = null;

    function initEditor() {
        var container = document.getElementById('editor-container');
        var fallback  = document.getElementById('editor-fallback');

        if (typeof CodeMirror === 'undefined') {
            // CDN failed — show plain textarea fallback
            fallback.style.display = 'block';
            console.warn('Holy Scripture: CodeMirror not loaded, using fallback textarea.');
            return;
        }

        editor = CodeMirror(container, {
            value: '',
            mode: 'javascript',
            theme: 'holyscripture',
            lineNumbers: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            styleActiveLine: true,
            indentUnit: 4,
            tabSize: 4,
            indentWithTabs: false,
            lineWrapping: false,
            autofocus: true,
            extraKeys: {
                'Tab': function(cm) {
                    if (cm.somethingSelected()) {
                        cm.indentSelection('add');
                    } else {
                        cm.replaceSelection('    ', 'end');
                    }
                },
                'Ctrl-Enter': function() { runEditorScript(); },
                'Cmd-Enter':  function() { runEditorScript(); },
                'Ctrl-/':     'toggleComment',
                'Cmd-/':      'toggleComment'
            }
        });

        // Remove the fallback since CM is mounted
        fallback.remove();
    }

    function getEditorCode() {
        if (editor) return editor.getValue();
        var fb = document.getElementById('editor-fallback');
        return fb ? fb.value : '';
    }

    function setEditorCode(code) {
        if (editor) {
            editor.setValue(code || '');
            editor.clearHistory();
        } else {
            var fb = document.getElementById('editor-fallback');
            if (fb) fb.value = code || '';
        }
    }

    // ============================================================
    // TABS
    // ============================================================
    function initTabs() {
        document.querySelectorAll('.tab-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                switchTab(this.dataset.tab);
            });
        });
    }

    function switchTab(name) {
        state.activeTab = name;
        document.querySelectorAll('.tab-btn').forEach(function(b) {
            b.classList.toggle('active', b.dataset.tab === name);
        });
        document.querySelectorAll('.tab-panel').forEach(function(p) {
            p.classList.toggle('active', p.id === 'tab-' + name);
        });
        if (name === 'editor' && editor) {
            setTimeout(function() { editor.refresh(); }, 10);
        }
    }

    // ============================================================
    // RUN SCRIPT (shared by editor & slots)
    // ============================================================
    function runScript(code, sourceName) {
        sourceName = sourceName || 'EDITOR';
        var trimmed = (code || '').trim();

        if (!trimmed) {
            logConsole('info', '> NO CODE TO RUN');
            return;
        }

        logConsole('run', '> CASTING: ' + sourceName + '...');

        var start = Date.now();

        if (!isInCEP) {
            // Dev/browser mode: simulate the call
            logConsole('info', '> [DEV MODE] CEP not available — script not sent to AE');
            addToHistory(sourceName, trimmed, false, { message: 'CEP not available in dev mode' });
            return;
        }

        cs.evalScript(
            'HS_runScript(' + JSON.stringify(trimmed) + ')',
            function(result) {
                var duration = Date.now() - start;

                if (!result || result === 'EvalScript error.') {
                    var errMsg = 'Internal evalScript error — check AE scripting preferences.';
                    logConsole('error', '> ✗ ' + errMsg);
                    addToHistory(sourceName, trimmed, false, { message: errMsg });
                    return;
                }

                var data;
                try {
                    data = JSON.parse(result);
                } catch(e) {
                    logConsole('error', '> ✗ Could not parse response: ' + result);
                    addToHistory(sourceName, trimmed, false, { message: 'Parse error: ' + result });
                    return;
                }

                // Show any log() calls from user script
                if (data.logs && data.logs.length > 0) {
                    data.logs.forEach(function(msg) {
                        logConsole('log', '  LOG: ' + msg);
                    });
                }

                if (data.success) {
                    logConsole('success', '> ✓ OK  [' + duration + 'ms]');
                    if (data.output) {
                        logConsole('output', '  → ' + data.output);
                    }
                    flickerBtn(document.getElementById('btn-run'));
                    addToHistory(sourceName, trimmed, true, null);
                } else {
                    var e = data.error || {};
                    logConsole('error', '> ✗ ' + (e.name || 'Error') + ': ' + (e.message || '?'));
                    if (e.line && e.line !== 'N/A') {
                        logConsole('error', '  Line: ' + e.line);
                    }
                    addToHistory(sourceName, trimmed, false, e);
                }
            }
        );
    }

    function runEditorScript() {
        runScript(getEditorCode(), 'EDITOR');
    }

    // ============================================================
    // CONSOLE
    // ============================================================
    function logConsole(type, message) {
        var output = document.getElementById('console-output');
        if (!output) return;

        var line = document.createElement('span');
        line.className = 'console-line console-' + type;
        line.textContent = message;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;

        // Cap console lines at 200
        var lines = output.querySelectorAll('.console-line');
        if (lines.length > 200) {
            lines[0].remove();
        }
    }

    function clearConsole() {
        var output = document.getElementById('console-output');
        if (output) {
            output.innerHTML = '<span class="console-line console-ready">&gt; READY_</span>';
        }
    }

    // ============================================================
    // FLICKER ANIMATION
    // ============================================================
    function flickerBtn(btn) {
        if (!btn) return;
        btn.classList.remove('btn-activated');
        void btn.offsetWidth; // reflow
        btn.classList.add('btn-activated');
        btn.addEventListener('animationend', function() {
            btn.classList.remove('btn-activated');
        }, { once: true });
    }

    // ============================================================
    // SAVE MODAL
    // ============================================================
    function openSaveModal(code) {
        state.pendingSaveCode = code;
        document.getElementById('modal-name').value = '';
        document.getElementById('modal-new-category').value = '';
        rebuildCategorySelect();
        document.getElementById('modal-overlay').classList.add('open');
        setTimeout(function() {
            document.getElementById('modal-name').focus();
        }, 50);
    }

    function closeSaveModal() {
        document.getElementById('modal-overlay').classList.remove('open');
        state.pendingSaveCode = null;
    }

    function rebuildCategorySelect() {
        var sel = document.getElementById('modal-category');
        sel.innerHTML = '<option value="">— UNCATEGORISED —</option>';
        state.library.categories.forEach(function(cat) {
            var opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name.toUpperCase();
            sel.appendChild(opt);
        });
    }

    function confirmSave() {
        var name = document.getElementById('modal-name').value.trim();
        var newCat = document.getElementById('modal-new-category').value.trim();
        var catId  = document.getElementById('modal-category').value;

        if (!name) {
            document.getElementById('modal-name').focus();
            return;
        }

        // Create new category if provided
        if (newCat) {
            var cat = { id: 'cat_' + Date.now(), name: newCat.toUpperCase() };
            state.library.categories.push(cat);
            catId = cat.id;
        }

        var script = {
            id: 'script_' + Date.now(),
            name: name.toUpperCase(),
            code: state.pendingSaveCode || '',
            category: catId || '',
            pinned: false,
            created: Date.now()
        };

        state.library.scripts.push(script);
        saveLibrary();
        renderLibrary();
        closeSaveModal();
        logConsole('success', '> ✓ SAVED: ' + script.name);
    }

    // ============================================================
    // QUICK SLOTS
    // ============================================================
    function initSlots() {
        var stored = localStorage.getItem(STORAGE_SLOTS);
        if (stored) {
            try { state.slots = JSON.parse(stored); } catch(e) { state.slots = []; }
        }
        if (state.slots.length === 0) {
            state.slots = [
                makeSlot('SLOT 01'),
                makeSlot('SLOT 02')
            ];
        }
        renderSlots();
    }

    function makeSlot(name) {
        return {
            id: 'slot_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            name: name || 'SLOT',
            code: '',
            expanded: true
        };
    }

    function addSlot() {
        var n = state.slots.length + 1;
        var padded = n < 10 ? '0' + n : String(n);
        state.slots.push(makeSlot('SLOT ' + padded));
        saveSlots();
        renderSlots();
        // Scroll to bottom of list
        var list = document.getElementById('slots-list');
        if (list) list.scrollTop = list.scrollHeight;
    }

    function removeSlot(id) {
        state.slots = state.slots.filter(function(s) { return s.id !== id; });
        saveSlots();
        renderSlots();
    }

    function toggleSlotExpand(id) {
        var slot = getSlot(id);
        if (slot) { slot.expanded = !slot.expanded; saveSlots(); }
        var codeArea = document.querySelector('[data-slot-code="' + id + '"]');
        if (codeArea) codeArea.classList.toggle('expanded', slot ? slot.expanded : false);
        var toggle = document.querySelector('[data-slot-toggle="' + id + '"]');
        if (toggle) toggle.textContent = (slot && slot.expanded) ? '▲' : '▼';
    }

    function getSlot(id) {
        return state.slots.find(function(s) { return s.id === id; }) || null;
    }

    function renderSlots() {
        var list  = document.getElementById('slots-list');
        var empty = document.getElementById('slots-empty');
        if (!list) return;

        list.innerHTML = '';

        if (state.slots.length === 0) {
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';

        state.slots.forEach(function(slot, i) {
            var item = document.createElement('div');
            item.className = 'slot-item';
            item.dataset.slotId = slot.id;

            var padded = (i + 1) < 10 ? '0' + (i + 1) : String(i + 1);

            item.innerHTML = [
                '<div class="slot-header">',
                    '<span class="slot-index">' + padded + '</span>',
                    '<input class="slot-name-input" type="text" value="' + escHtml(slot.name) + '" ',
                        'data-slot-name="' + slot.id + '" placeholder="NAME" spellcheck="false" autocomplete="off">',
                    '<button class="slot-toggle" data-slot-toggle="' + slot.id + '">' + (slot.expanded ? '▲' : '▼') + '</button>',
                    '<button class="btn-icon del-icon" data-slot-del="' + slot.id + '" title="Remove slot">✕</button>',
                '</div>',
                '<div class="slot-code-area ' + (slot.expanded ? 'expanded' : '') + '" data-slot-code="' + slot.id + '">',
                    '<textarea class="slot-textarea" data-slot-textarea="' + slot.id + '"',
                        ' spellcheck="false" placeholder="// Script code...">' + escHtml(slot.code) + '</textarea>',
                    '<div class="slot-footer">',
                        '<button class="btn-primary" data-slot-run="' + slot.id + '">▶ RUN</button>',
                        '<button class="btn-secondary" data-slot-load="' + slot.id + '" title="Load into editor">EDIT</button>',
                        '<button class="btn-ghost" data-slot-save="' + slot.id + '" title="Save to library">SAVE</button>',
                    '</div>',
                '</div>'
            ].join('');

            list.appendChild(item);
        });

        // Bind events on newly rendered elements
        bindSlotEvents();
    }

    function bindSlotEvents() {
        var list = document.getElementById('slots-list');
        if (!list) return;

        // Name inputs
        list.querySelectorAll('[data-slot-name]').forEach(function(inp) {
            inp.addEventListener('change', function() {
                var slot = getSlot(this.dataset.slotName);
                if (slot) { slot.name = this.value; saveSlots(); }
            });
        });

        // Textareas
        list.querySelectorAll('[data-slot-textarea]').forEach(function(ta) {
            ta.addEventListener('input', function() {
                var slot = getSlot(this.dataset.slotTextarea);
                if (slot) { slot.code = this.value; saveSlots(); }
            });
            // Allow Tab in textarea
            ta.addEventListener('keydown', function(e) {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    var start = this.selectionStart;
                    var end   = this.selectionEnd;
                    this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
                    this.selectionStart = this.selectionEnd = start + 4;
                    var slot = getSlot(this.dataset.slotTextarea);
                    if (slot) { slot.code = this.value; saveSlots(); }
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    var slot = getSlot(this.dataset.slotTextarea);
                    if (slot) runScript(slot.code, slot.name);
                }
            });
        });

        // Toggle collapse
        list.querySelectorAll('[data-slot-toggle]').forEach(function(btn) {
            btn.addEventListener('click', function() { toggleSlotExpand(this.dataset.slotToggle); });
        });

        // Delete
        list.querySelectorAll('[data-slot-del]').forEach(function(btn) {
            btn.addEventListener('click', function() { removeSlot(this.dataset.slotDel); });
        });

        // Run
        list.querySelectorAll('[data-slot-run]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var slot = getSlot(this.dataset.slotRun);
                if (slot) {
                    runScript(slot.code, slot.name);
                    flickerBtn(this);
                }
            });
        });

        // Load into editor
        list.querySelectorAll('[data-slot-load]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var slot = getSlot(this.dataset.slotLoad);
                if (slot) {
                    setEditorCode(slot.code);
                    switchTab('editor');
                }
            });
        });

        // Save to library
        list.querySelectorAll('[data-slot-save]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var slot = getSlot(this.dataset.slotSave);
                if (slot) openSaveModal(slot.code);
            });
        });
    }

    function saveSlots() {
        localStorage.setItem(STORAGE_SLOTS, JSON.stringify(state.slots));
    }

    // ============================================================
    // LIBRARY
    // ============================================================
    function initLibrary() {
        var stored = localStorage.getItem(STORAGE_LIBRARY);
        if (stored) {
            try { state.library = JSON.parse(stored); } catch(e) {}
        }
        if (!state.library.categories) state.library.categories = [];
        if (!state.library.scripts)    state.library.scripts    = [];
        renderLibrary();

        // Search input
        var search = document.getElementById('library-search');
        if (search) {
            search.addEventListener('input', function() {
                renderLibrary(this.value.trim());
            });
        }
    }

    function saveLibrary() {
        localStorage.setItem(STORAGE_LIBRARY, JSON.stringify(state.library));
    }

    function deleteScript(id) {
        state.library.scripts = state.library.scripts.filter(function(s) { return s.id !== id; });
        saveLibrary();
        renderLibrary();
    }

    function renderLibrary(query) {
        var list  = document.getElementById('library-list');
        var empty = document.getElementById('library-empty');
        if (!list) return;

        list.innerHTML = '';
        query = (query || '').toUpperCase();

        var filtered = state.library.scripts.filter(function(s) {
            if (!query) return true;
            return s.name.indexOf(query) !== -1;
        });

        // Sort: pinned first, then by created desc
        filtered.sort(function(a, b) {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned)  return 1;
            return b.created - a.created;
        });

        if (filtered.length === 0) {
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';

        filtered.forEach(function(script) {
            var preview = (script.code || '').replace(/\s+/g, ' ').trim().slice(0, 60);
            var item = document.createElement('div');
            item.className = 'library-item';

            item.innerHTML = [
                '<div class="lib-item-info">',
                    '<div class="lib-item-name">' + (script.pinned ? '◈ ' : '') + escHtml(script.name) + '</div>',
                    '<div class="lib-item-preview">' + escHtml(preview) + '…</div>',
                '</div>',
                '<div class="lib-item-actions">',
                    '<button class="btn-icon run-icon" data-lib-run="' + script.id + '" title="Run">▶</button>',
                    '<button class="btn-icon" data-lib-load="' + script.id + '" title="Load into editor">↩</button>',
                    '<button class="btn-icon del-icon" data-lib-del="' + script.id + '" title="Delete">✕</button>',
                '</div>'
            ].join('');

            list.appendChild(item);
        });

        // Bind events
        list.querySelectorAll('[data-lib-run]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var s = state.library.scripts.find(function(x) { return x.id === btn.dataset.libRun; });
                if (s) { runScript(s.code, s.name); flickerBtn(btn); }
            });
        });
        list.querySelectorAll('[data-lib-load]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var s = state.library.scripts.find(function(x) { return x.id === btn.dataset.libLoad; });
                if (s) { setEditorCode(s.code); switchTab('editor'); }
            });
        });
        list.querySelectorAll('[data-lib-del]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                if (confirm('Delete "' + btn.closest('.library-item').querySelector('.lib-item-name').textContent + '"?')) {
                    deleteScript(btn.dataset.libDel);
                }
            });
        });
    }

    // ============================================================
    // HISTORY
    // ============================================================
    function initHistory() {
        var stored = localStorage.getItem(STORAGE_HISTORY);
        if (stored) {
            try { state.history = JSON.parse(stored); } catch(e) { state.history = []; }
        }
        renderHistory();
    }

    function addToHistory(name, code, success, error) {
        var entry = {
            id: 'run_' + Date.now(),
            name: (name || 'UNNAMED').toUpperCase(),
            code: code,
            success: success,
            error: error || null,
            ts: Date.now()
        };
        state.history.unshift(entry);
        if (state.history.length > MAX_HISTORY) {
            state.history = state.history.slice(0, MAX_HISTORY);
        }
        localStorage.setItem(STORAGE_HISTORY, JSON.stringify(state.history));
        renderHistory();

        // Badge the LOG tab if not active
        if (state.activeTab !== 'history') {
            var histBtn = document.querySelector('[data-tab="history"]');
            if (histBtn && !success) {
                histBtn.style.color = 'var(--hp-danger)';
                setTimeout(function() {
                    histBtn.style.color = '';
                }, 1500);
            }
        }
    }

    function renderHistory() {
        var list  = document.getElementById('history-list');
        var empty = document.getElementById('history-empty');
        if (!list) return;

        list.innerHTML = '';

        if (state.history.length === 0) {
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';

        state.history.forEach(function(entry) {
            var d = new Date(entry.ts);
            var ts = pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());

            var item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = [
                '<span class="hist-status ' + (entry.success ? 'ok' : 'fail') + '">' + (entry.success ? '✓' : '✗') + '</span>',
                '<div class="hist-info">',
                    '<div class="hist-name">' + escHtml(entry.name) + '</div>',
                    '<div class="hist-time">' + ts + (entry.error ? ' — ' + escHtml(entry.error.message || '') : '') + '</div>',
                '</div>',
                '<div class="hist-actions">',
                    '<button class="btn-icon run-icon" data-hist-rerun="' + entry.id + '" title="Re-run">▶</button>',
                    '<button class="btn-icon" data-hist-load="' + entry.id + '" title="Load into editor">↩</button>',
                '</div>'
            ].join('');

            list.appendChild(item);
        });

        list.querySelectorAll('[data-hist-rerun]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var e = state.history.find(function(x) { return x.id === btn.dataset.histRerun; });
                if (e) { runScript(e.code, e.name); flickerBtn(btn); }
            });
        });
        list.querySelectorAll('[data-hist-load]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var e = state.history.find(function(x) { return x.id === btn.dataset.histLoad; });
                if (e) { setEditorCode(e.code); switchTab('editor'); }
            });
        });
    }

    function clearHistory() {
        state.history = [];
        localStorage.removeItem(STORAGE_HISTORY);
        renderHistory();
    }

    // ============================================================
    // AE CONTEXT BAR
    // ============================================================
    function initContextBar() {
        if (!isInCEP) {
            // Show demo data in dev mode
            updateContextDisplay({
                hasComp: true,
                compName: 'DEV_MODE',
                fps: '24',
                selectedLayers: 0,
                timecode: '00:00:00:00'
            });
            return;
        }
        updateContext();
        setInterval(updateContext, CONTEXT_INTERVAL);
    }

    function updateContext() {
        if (!cs) return;
        cs.evalScript('HS_getContext()', function(result) {
            if (!result || result === 'EvalScript error.') return;
            try {
                var ctx = JSON.parse(result);
                updateContextDisplay(ctx);
            } catch(e) {}
        });
    }

    function updateContextDisplay(ctx) {
        var dot      = document.getElementById('ctx-dot');
        var compName = document.getElementById('ctx-comp-name');
        var fpsCell  = document.getElementById('ctx-fps-cell');
        var layCell  = document.getElementById('ctx-layers-cell');
        var tcCell   = document.getElementById('ctx-timecode-cell');

        if (ctx.hasComp) {
            if (dot)      { dot.classList.add('live'); }
            if (compName) { compName.textContent = (ctx.compName || '').toUpperCase(); }
            if (fpsCell)  { fpsCell.textContent  = ctx.fps + 'FPS'; }
            if (layCell)  { layCell.textContent  = ctx.selectedLayers + ' LYR'; }
            if (tcCell)   { tcCell.textContent   = ctx.timecode; }
            var comp = document.getElementById('ctx-comp');
            if (comp) comp.classList.add('has-comp');
        } else {
            if (dot)      { dot.classList.remove('live'); }
            if (compName) { compName.textContent = 'NO COMP'; }
            if (fpsCell)  { fpsCell.textContent  = '–'; }
            if (layCell)  { layCell.textContent  = '0 LYR'; }
            if (tcCell)   { tcCell.textContent   = '00:00:00:00'; }
            var comp = document.getElementById('ctx-comp');
            if (comp) comp.classList.remove('has-comp');
        }
    }

    // ============================================================
    // EVENT LISTENERS (static elements)
    // ============================================================
    function initEventListeners() {
        // Run editor script
        var btnRun = document.getElementById('btn-run');
        if (btnRun) {
            btnRun.addEventListener('click', function() {
                runEditorScript();
                flickerBtn(this);
            });
        }

        // Save to library (open modal)
        var btnSave = document.getElementById('btn-save');
        if (btnSave) {
            btnSave.addEventListener('click', function() {
                openSaveModal(getEditorCode());
            });
        }

        // Clear console
        var btnClearConsole = document.getElementById('btn-clear-console');
        if (btnClearConsole) {
            btnClearConsole.addEventListener('click', clearConsole);
        }

        // Add slot
        var btnAddSlot = document.getElementById('btn-add-slot');
        if (btnAddSlot) {
            btnAddSlot.addEventListener('click', addSlot);
        }

        // Clear history
        var btnClearHistory = document.getElementById('btn-clear-history');
        if (btnClearHistory) {
            btnClearHistory.addEventListener('click', function() {
                if (confirm('Clear all run history?')) clearHistory();
            });
        }

        // Import .jsx (placeholder — CEP file dialog)
        var btnImport = document.getElementById('btn-import-jsx');
        if (btnImport) {
            btnImport.addEventListener('click', importJsx);
        }

        // Modal events
        var btnModalConfirm = document.getElementById('btn-modal-confirm');
        var btnModalCancel  = document.getElementById('btn-modal-cancel');
        var btnModalClose   = document.getElementById('btn-modal-close');
        if (btnModalConfirm) btnModalConfirm.addEventListener('click', confirmSave);
        if (btnModalCancel)  btnModalCancel.addEventListener('click', closeSaveModal);
        if (btnModalClose)   btnModalClose.addEventListener('click', closeSaveModal);

        // Close modal on overlay click
        var overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) closeSaveModal();
            });
        }

        // Enter key in modal name input
        var modalName = document.getElementById('modal-name');
        if (modalName) {
            modalName.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') confirmSave();
            });
        }

        // Keyboard shortcuts (global)
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + Enter in editor tab = run
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                if (state.activeTab === 'editor') runEditorScript();
            }
            // Escape = close modal
            if (e.key === 'Escape') closeSaveModal();
        });
    }

    // ============================================================
    // IMPORT .JSX
    // ============================================================
    function importJsx() {
        if (!isInCEP || !cs) {
            logConsole('info', '> [DEV MODE] File import not available outside CEP');
            return;
        }

        // CEP file open dialog
        var result = cs.openFileDialog('Select ExtendScript File', 'ExtendScript:*.jsx;*.js', false);

        if (!result || result.length === 0) return;

        var filePath = result[0];

        // Read the file using window.cep.fs
        if (window.cep && window.cep.fs) {
            var fileResult = window.cep.fs.readFile(filePath, window.cep.encoding.UTF8);
            if (fileResult.err === 0) {
                var fileName = filePath.split(/[\\/]/).pop().replace(/\.jsx?$/i, '');
                setEditorCode(fileResult.data);
                switchTab('editor');
                logConsole('info', '> LOADED: ' + fileName);
            } else {
                logConsole('error', '> ✗ Could not read file (error ' + fileResult.err + ')');
            }
        } else {
            logConsole('error', '> ✗ window.cep.fs not available');
        }
    }

    // ============================================================
    // UTILITIES
    // ============================================================
    function escHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function pad2(n) {
        return n < 10 ? '0' + n : String(n);
    }

    // ============================================================
    // INIT
    // ============================================================
    function init() {
        initEditor();
        initTabs();
        initEventListeners();
        initSlots();
        initLibrary();
        initHistory();
        initContextBar();

        // Force CM layout after panel is shown
        if (editor) {
            setTimeout(function() { editor.refresh(); }, 100);
        }

        // CEP panel resize handler
        if (isInCEP && cs) {
            cs.addEventListener('com.adobe.csxs.events.ThemeColorChanged', function() {
                // Could update theme here in future
            });
        }

        console.log('[Holy Scripture] Initialised. CEP:', isInCEP);
    }

    document.addEventListener('DOMContentLoaded', init);

})();
