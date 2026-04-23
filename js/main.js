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
    var STORAGE_AGENT_LIBRARY = 'hs_agent_library';
    var STORAGE_HISTORY = 'hs_history';
    var STORAGE_MACROS  = 'hs_macros';
    var MAX_HISTORY     = 100;
    var CONTEXT_INTERVAL = 2000; // ms

    // ============================================================
    // STATE
    // ============================================================
    var state = {
        activeTab: 'editor',
        slots: [],
        library: { categories: [], scripts: [] },
        agentLibrary: { scripts: [] },
        libraryMode: 'user',
        history: [],
        params: [],             // script parameter rows for the editor
        macros: [],             // saved macros
        macroChain: [],         // current working macro chain steps
        pendingSaveCode: null,  // code queued for the save modal
        activeScript: null,     // { id, name } of the library entry currently in the editor, or null
        isDirty: false          // true if the editor has unsaved changes since last load/save
    };

    // shortcut recording state
    var recordingSlotId = null;

    // slot drag-reorder state
    var slotDragSrcId  = null;
    var slotDropInfo = null;     // active drop target descriptor

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

    function reloadHostScript(callback) {
        if (!isInCEP || !cs) {
            if (callback) callback();
            return;
        }

        try {
            var extPath = cs.getSystemPath(SystemPath.EXTENSION);
            var jsxPath = extPath.replace(/\\/g, "/") + "/jsx/hostscript.jsx";
            cs.evalScript('$.evalFile("' + jsxPath + '")', function(result) {
                if (result && result !== 'EvalScript error.') {
                    console.log('[Holy Scripture] hostscript.jsx reloaded');
                } else {
                    console.warn('[Holy Scripture] hostscript.jsx reload returned:', result);
                }
                if (callback) callback();
            });
        } catch (e) {
            console.warn('[Holy Scripture] hostscript.jsx reload error:', e);
            if (callback) callback();
        }
    }

    // ============================================================
    // STORAGE ABSTRACTION
    // Drop-in replacement for localStorage. In CEP, every write
    // also fires an async file write to Holy Storage/Holy_Scripture
    // via ExtendScript. Reads always come from localStorage (sync).
    // On startup, loadFromFilesOnStartup() fires an async read and
    // re-populates state if file data exists.
    // ============================================================
    var storage = {
        getItem: function(key) {
            return localStorage.getItem(key);
        },
        setItem: function(key, val) {
            localStorage.setItem(key, val);
            if (isInCEP && cs) {
                cs.evalScript(
                    'HS_saveData(' + JSON.stringify(key) + ',' + JSON.stringify(val) + ')',
                    function() {}
                );
            }
        },
        removeItem: function(key) {
            localStorage.removeItem(key);
            if (isInCEP && cs) {
                cs.evalScript(
                    'HS_saveData(' + JSON.stringify(key) + ',null)',
                    function() {}
                );
            }
        }
    };

    // ============================================================
    // ACCENT COLOR
    // ============================================================
    var DEFAULT_ACCENT = '#ff2c72';

    function hexToRgb_accent(hex) {
        var clean = hex.replace('#', '');
        var bigint = parseInt(clean, 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    }

    function setAccentColor(hex) {
        var rgb = hexToRgb_accent(hex);
        var r1 = rgb.r / 255, g1 = rgb.g / 255, b1 = rgb.b / 255;
        var max = Math.max(r1, g1, b1), min = Math.min(r1, g1, b1);
        var h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r1)      h = (g1 - b1) / d + (g1 < b1 ? 6 : 0);
            else if (max === g1) h = (b1 - r1) / d + 2;
            else                 h = (r1 - g1) / d + 4;
            h /= 6;
        }
        var root = document.documentElement;
        root.style.setProperty('--accent', hex);
        root.style.setProperty('--ACCENT-H', Math.round(h * 360));
        root.style.setProperty('--ACCENT-S', Math.round(s * 100) + '%');
        root.style.setProperty('--ACCENT-L', Math.round(l * 100) + '%');
        root.style.setProperty('--ACCENT-RGB', rgb.r + ', ' + rgb.g + ', ' + rgb.b);
    }

    function initAccentColor() {
        var saved = localStorage.getItem('hs_themeColor');
        if (saved && /^#[0-9a-fA-F]{6}$/.test(saved)) {
            setAccentColor(saved);
        }

        if (isInCEP && cs) {
            cs.addEventListener('holy.scripture.color.change', function (e) {
                try {
                    var data = (typeof e.data === 'string') ? JSON.parse(e.data || '{}') : e.data;
                    if (data && typeof data.hex === 'string') {
                        setAccentColor(data.hex);
                        localStorage.setItem('hs_themeColor', data.hex);
                    }
                } catch (err) {
                    console.warn('[Holy Scripture] Failed to apply color event', err);
                }
            });
        }

        var settingsBtn = document.getElementById('btn-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', function () {
                if (isInCEP && cs) {
                    cs.requestOpenExtension('com.holyplastic.holyscripture.settings', '');
                }
            });
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

        // Mark editor dirty on any change
        editor.on('change', function() {
            if (!state.isDirty) {
                state.isDirty = true;
                updateEditorScriptHeader();
            }
        });
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
        state.isDirty = false;
        updateEditorScriptHeader();
    }

    // ============================================================
    // TABS
    // ============================================================
    function initTabs() {
        document.querySelectorAll('.tab-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                // tab-btn-action buttons open dialogs instead of switching tabs
                if (this.classList.contains('tab-btn-action')) return;
                switchTab(this.dataset.tab);
            });
        });

        // Mouse-wheel over the tab bar scrolls between normal tabs only
        var nav = document.getElementById('tab-nav');
        if (nav) {
            nav.addEventListener('wheel', function(e) {
                e.preventDefault();
                var btns = [].slice.call(document.querySelectorAll('.tab-btn:not(.tab-btn-action)'));
                var currentIdx = -1;
                btns.forEach(function(b, i) {
                    if (b.dataset.tab === state.activeTab) currentIdx = i;
                });
                if (currentIdx === -1) return;
                var dir = e.deltaY > 0 ? 1 : -1;
                var nextIdx = (currentIdx + dir + btns.length) % btns.length;
                switchTab(btns[nextIdx].dataset.tab);
            }, { passive: false });
        }
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
        updateAgentLibraryToggle();
    }

    function updateAgentLibraryToggle() {
        var agentLibBtn = document.getElementById('btn-agent-library');
        if (!agentLibBtn) return;

        agentLibBtn.style.display = (state.activeTab === 'library') ? 'inline-block' : 'none';
        if (state.libraryMode === 'agent') {
            agentLibBtn.textContent = 'USER LIB';
            agentLibBtn.title = 'Switch to User Library';
            agentLibBtn.classList.add('is-active');
        } else {
            agentLibBtn.textContent = 'AGENT LIB';
            agentLibBtn.title = 'Switch to Agent Library';
            agentLibBtn.classList.remove('is-active');
        }
    }

    // ============================================================
    // SCRIPT PARAMETERS
    // ============================================================
    function makeParam() {
        return { key: '', type: 'string', value: '' };
    }

    function buildParamPreamble() {
        var lines = [];
        state.params.forEach(function(p) {
            var k = p.key.trim();
            if (!k) return;
            var val;
            if (p.type === 'number')       val = parseFloat(p.value) || 0;
            else if (p.type === 'boolean') val = (p.value === 'true') ? 'true' : 'false';
            else                           val = JSON.stringify(p.value); // string + color
            lines.push('var ' + k + ' = ' + val + ';');
        });
        return lines.join('\n');
    }

    function renderParams() {
        var body = document.getElementById('params-body');
        if (!body) return;
        body.innerHTML = '';

        state.params.forEach(function(p, i) {
            var row = document.createElement('div');
            row.className = 'param-row';

            var valueHtml;
            if (p.type === 'color') {
                valueHtml = '<input type="color" class="param-value-color" data-param-value="' + i + '" value="' + escHtml(p.value || '#ff2c72') + '">';
            } else if (p.type === 'boolean') {
                valueHtml = '<select class="param-value-bool" data-param-value="' + i + '">'
                    + '<option value="true"'  + (p.value === 'true'  ? ' selected' : '') + '>TRUE</option>'
                    + '<option value="false"' + (p.value !== 'true'  ? ' selected' : '') + '>FALSE</option>'
                    + '</select>';
            } else {
                valueHtml = '<input type="text" class="param-value" data-param-value="' + i + '" value="' + escHtml(p.value) + '" placeholder="value" spellcheck="false" autocomplete="off">';
            }

            row.innerHTML = [
                '<input type="text" class="param-key" data-param-key="' + i + '" value="' + escHtml(p.key) + '" placeholder="varName" spellcheck="false" autocomplete="off">',
                '<select class="param-type" data-param-type="' + i + '">',
                    '<option value="string"'  + (p.type === 'string'  ? ' selected' : '') + '>STR</option>',
                    '<option value="number"'  + (p.type === 'number'  ? ' selected' : '') + '>NUM</option>',
                    '<option value="boolean"' + (p.type === 'boolean' ? ' selected' : '') + '>BOOL</option>',
                    '<option value="color"'   + (p.type === 'color'   ? ' selected' : '') + '>CLR</option>',
                '</select>',
                valueHtml,
                '<button class="param-remove" data-param-remove="' + i + '" title="Remove">✕</button>'
            ].join('');

            body.appendChild(row);
        });

        // Bind events
        body.querySelectorAll('[data-param-key]').forEach(function(inp) {
            inp.addEventListener('input', function() {
                state.params[+this.dataset.paramKey].key = this.value;
            });
        });
        body.querySelectorAll('[data-param-type]').forEach(function(sel) {
            sel.addEventListener('change', function() {
                var idx = +this.dataset.paramType;
                state.params[idx].type = this.value;
                // reset value to sensible default on type switch
                if (this.value === 'boolean') state.params[idx].value = 'true';
                else if (this.value === 'color') state.params[idx].value = '#ff2c72';
                else state.params[idx].value = '';
                renderParams();
            });
        });
        body.querySelectorAll('[data-param-value]').forEach(function(inp) {
            inp.addEventListener('change', function() {
                state.params[+this.dataset.paramValue].value = this.value;
            });
            inp.addEventListener('input', function() {
                state.params[+this.dataset.paramValue].value = this.value;
            });
        });
        body.querySelectorAll('[data-param-remove]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                state.params.splice(+this.dataset.paramRemove, 1);
                renderParams();
            });
        });
    }

    function initParams() {
        state.params = [];
        renderParams();

        var btnAdd    = document.getElementById('btn-add-param');
        var btnToggle = document.getElementById('btn-params-toggle');
        var body      = document.getElementById('params-body');

        if (btnAdd) {
            btnAdd.addEventListener('click', function() {
                state.params.push(makeParam());
                if (body && !body.classList.contains('open')) {
                    body.classList.add('open');
                    if (btnToggle) btnToggle.textContent = '▲';
                }
                renderParams();
            });
        }

        if (btnToggle) {
            btnToggle.addEventListener('click', function() {
                if (!body) return;
                var open = body.classList.toggle('open');
                this.textContent = open ? '▲' : '▼';
            });
        }
    }

    // ============================================================
    // RUN SCRIPT (shared by editor, slots, library, macro)
    // ============================================================
    function runScript(code, sourceName, onComplete) {
        sourceName = sourceName || 'EDITOR';
        var trimmed = (code || '').trim();

        if (!trimmed) {
            logConsole('info', '> NO CODE TO RUN');
            if (onComplete) onComplete(false, { message: 'No code' }, null);
            return;
        }

        // Prepend parameter preamble if any params are defined
        var preamble = buildParamPreamble();
        var codeToRun = preamble ? preamble + '\n\n' + trimmed : trimmed;

        logConsole('run', '> CASTING: ' + sourceName + '...');

        var start = Date.now();

        if (!isInCEP) {
            // Dev/browser mode: simulate the call
            logConsole('info', '> [DEV MODE] CEP not available — script not sent to AE');
            addToHistory(sourceName, trimmed, false, { message: 'CEP not available in dev mode' });
            if (onComplete) onComplete(false, { message: 'CEP not available' }, null);
            return;
        }

        cs.evalScript(
            'HS_runScript(' + JSON.stringify(codeToRun) + ')',
            function(result) {
                var duration = Date.now() - start;

                if (!result || result === 'EvalScript error.') {
                    var errMsg = 'Internal evalScript error — check AE scripting preferences.';
                    logConsole('error', '> ✗ ' + errMsg);
                    addToHistory(sourceName, trimmed, false, { message: errMsg });
                    if (onComplete) onComplete(false, { message: errMsg }, null);
                    return;
                }

                var data;
                try {
                    data = JSON.parse(result);
                } catch(e) {
                    logConsole('error', '> ✗ Could not parse response: ' + result);
                    addToHistory(sourceName, trimmed, false, { message: 'Parse error: ' + result });
                    if (onComplete) onComplete(false, { message: 'Parse error' }, null);
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
                    if (onComplete) onComplete(true, null, {
                        success: true,
                        output: data.output || '',
                        logs: data.logs || [],
                        duration: duration,
                        raw: data
                    });
                } else {
                    var e = data.error || {};
                    logConsole('error', '> ✗ ' + (e.name || 'Error') + ': ' + (e.message || '?'));
                    if (e.line && e.line !== 'N/A') {
                        logConsole('error', '  Line: ' + e.line);
                    }
                    addToHistory(sourceName, trimmed, false, e);
                    if (onComplete) onComplete(false, e, {
                        success: false,
                        output: data.output || '',
                        logs: data.logs || [],
                        duration: duration,
                        error: e,
                        raw: data
                    });
                }
            }
        );
    }

    function runEditorScript() {
        runScript(getEditorCode(), 'EDITOR');
    }

    function runAgentLibraryScript(scriptId, scriptName, argsObj, onComplete) {
        var label = scriptName || scriptId || 'AGENT SCRIPT';
        var argsJson = JSON.stringify(argsObj || {});
        var historyCode = '// Agent Library: ' + String(scriptId || '');

        logConsole('run', '> CASTING AGENT SCRIPT: ' + label + '...');

        if (!isInCEP) {
            logConsole('info', '> [DEV MODE] CEP not available - agent script not sent to AE');
            addToHistory(label, historyCode, false, { message: 'CEP not available in dev mode' });
            if (onComplete) onComplete(false, { message: 'CEP not available' }, null);
            return;
        }

        var start = Date.now();
        cs.evalScript(
            'HS_runAgentScript(' + JSON.stringify(scriptId) + ',' + JSON.stringify(argsJson) + ')',
            function(result) {
                var duration = Date.now() - start;

                if (!result || result === 'EvalScript error.') {
                    var errMsg = 'Internal evalScript error - check AE scripting preferences.';
                    logConsole('error', '> X ' + errMsg);
                    addToHistory(label, historyCode, false, { message: errMsg });
                    if (onComplete) onComplete(false, { message: errMsg }, null);
                    return;
                }

                var data;
                try {
                    data = JSON.parse(result);
                } catch (e) {
                    logConsole('error', '> X Could not parse response: ' + result);
                    addToHistory(label, historyCode, false, { message: 'Parse error: ' + result });
                    if (onComplete) onComplete(false, { message: 'Parse error' }, null);
                    return;
                }

                if (data.logs && data.logs.length > 0) {
                    data.logs.forEach(function(msg) {
                        logConsole('log', '  LOG: ' + msg);
                    });
                }

                if (data.success) {
                    logConsole('success', '> OK [' + duration + 'ms]');
                    if (data.output) {
                        logConsole('output', '  -> ' + data.output);
                    }
                    addToHistory(label, historyCode, true, null);
                    if (onComplete) onComplete(true, null, {
                        success: true,
                        output: data.output || '',
                        logs: data.logs || [],
                        duration: duration,
                        raw: data
                    });
                } else {
                    var err = data.error || {};
                    logConsole('error', '> X ' + (err.name || 'Error') + ': ' + (err.message || '?'));
                    if (err.line && err.line !== 'N/A') {
                        logConsole('error', '  Line: ' + err.line);
                    }
                    addToHistory(label, historyCode, false, err);
                    if (onComplete) onComplete(false, err, {
                        success: false,
                        output: data.output || '',
                        logs: data.logs || [],
                        duration: duration,
                        error: err,
                        raw: data
                    });
                }
            }
        );
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
    // SCRIPT IDENTITY & SAVE FLOW
    // Manages the active-script state, the editor header display,
    // the three-choice save menu, quick overwrite, and .jsx export.
    // ============================================================

    function updateEditorScriptHeader() {
        var label   = document.getElementById('editor-script-label');
        var overBtn = document.getElementById('btn-quick-overwrite');
        if (!label) return;

        if (state.activeScript) {
            label.textContent = state.activeScript.name + (state.isDirty ? ' *' : '');
            label.classList.toggle('is-dirty', state.isDirty);
            if (overBtn) overBtn.style.display = state.isDirty ? 'inline-block' : 'none';
        } else {
            label.textContent = 'UNSAVED';
            label.classList.remove('is-dirty');
            if (overBtn) overBtn.style.display = 'none';
        }
    }

    function rebuildScriptDropdown() {
        var sel = document.getElementById('editor-script-dropdown');
        if (!sel) return;
        sel.innerHTML = '<option value="">— SWITCH SCRIPT —</option>';
        state.library.scripts.forEach(function(s) {
            var opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.name;
            if (state.activeScript && state.activeScript.id === s.id) opt.selected = true;
            sel.appendChild(opt);
        });
    }

    function loadLibraryScriptToEditor(scriptId) {
        var s = state.library.scripts.find(function(x) { return x.id === scriptId; });
        if (!s) return;

        function doLoad() {
            setEditorCode(s.code);
            if (s.params && s.params.length > 0) {
                state.params = JSON.parse(JSON.stringify(s.params));
                renderParams();
                var body   = document.getElementById('params-body');
                var toggle = document.getElementById('btn-params-toggle');
                if (body)   body.classList.add('open');
                if (toggle) toggle.textContent = '▲';
            }
            state.activeScript = { id: s.id, name: s.name };
            state.isDirty = false;
            updateEditorScriptHeader();
            rebuildScriptDropdown();
            switchTab('editor');
        }

        if (state.isDirty) {
            openUnsavedModal(doLoad);
        } else {
            doLoad();
        }
    }

    function openUnsavedModal(onContinue) {
        var overlay = document.getElementById('modal-unsaved');
        if (!overlay) { onContinue(); return; }
        overlay.classList.add('open');

        var btnCont   = document.getElementById('btn-unsaved-continue');
        var btnCancel = document.getElementById('btn-unsaved-cancel');

        function cleanup() {
            overlay.classList.remove('open');
            btnCont.removeEventListener('click', handleContinue);
            btnCancel.removeEventListener('click', handleCancel);
        }
        function handleContinue() { cleanup(); onContinue(); }
        function handleCancel()   { cleanup(); }

        if (btnCont)   btnCont.addEventListener('click', handleContinue);
        if (btnCancel) btnCancel.addEventListener('click', handleCancel);
    }

    function openSaveOptionsModal() {
        var overlay  = document.getElementById('modal-save-options');
        var overBtn  = document.getElementById('btn-save-overwrite');
        if (!overlay) return;
        if (overBtn) overBtn.style.display = state.activeScript ? 'block' : 'none';
        overlay.classList.add('open');
    }

    function closeSaveOptionsModal() {
        var overlay = document.getElementById('modal-save-options');
        if (overlay) overlay.classList.remove('open');
    }

    function quickOverwrite() {
        if (!state.activeScript) return;
        var s = state.library.scripts.find(function(x) { return x.id === state.activeScript.id; });
        if (!s) return;
        s.code = getEditorCode();
        s.name = state.activeScript.name; // name unchanged
        saveLibrary();
        renderLibrary();

        // Sync any slots linked to this library entry
        var synced = false;
        state.slots.forEach(function(slot) {
            if (slot.libraryId === s.id) {
                slot.code = s.code;
                slot.name = s.name;
                synced = true;
            }
        });
        if (synced) { saveSlots(); renderSlots(); }

        state.isDirty = false;
        updateEditorScriptHeader();
        closeSaveOptionsModal();
        logConsole('success', '> ✓ OVERWRITTEN: ' + s.name);
    }

    function exportScriptToHolyStorage() {
        if (!isInCEP || !cs) {
            logConsole('info', '> [DEV MODE] Export not available outside CEP');
            closeSaveOptionsModal();
            return;
        }
        var name = (state.activeScript ? state.activeScript.name : 'HOLY_SCRIPT')
                       .replace(/[^A-Z0-9_\- ]/gi, '_')
                       .replace(/\s+/g, '_');
        var code = getEditorCode();
        cs.evalScript(
            'HS_exportScript(' + JSON.stringify(name) + ',' + JSON.stringify(code) + ')',
            function(result) {
                if (result && result !== 'EvalScript error.') {
                    logConsole('success', '> ✓ EXPORTED: ' + name + '.jsx');
                } else {
                    logConsole('error', '> ✗ Export failed');
                }
            }
        );
        closeSaveOptionsModal();
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
            params: JSON.parse(JSON.stringify(state.params)), // snapshot current params
            pinned: false,
            created: Date.now()
        };

        state.library.scripts.push(script);
        saveLibrary();
        renderLibrary();
        closeSaveModal();
        state.activeScript = { id: script.id, name: script.name };
        state.isDirty = false;
        updateEditorScriptHeader();
        rebuildScriptDropdown();
        logConsole('success', '> ✓ SAVED: ' + script.name);
    }

    // ============================================================
    // QUICK SLOTS
    // ============================================================
    function initSlots() {
        var stored = storage.getItem(STORAGE_SLOTS);
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
            expanded: true,
            shortcut: null,   // { key, ctrl, alt, shift }
            size: 'full',     // 'full' = own row | 'half' = shares row with adjacent half slot
            libraryId: null   // id of linked library entry, or null if unlinked
        };
    }

    function formatShortcut(s) {
        if (!s) return '⌨';
        var parts = [];
        if (s.ctrl)  parts.push('CTRL');
        if (s.alt)   parts.push('ALT');
        if (s.shift) parts.push('SHF');
        parts.push(s.key.length === 1 ? s.key.toUpperCase() : s.key);
        return parts.join('+');
    }

    function startShortcutRecording(slotId) {
        recordingSlotId = slotId;
        // Update button appearance
        var btn = document.querySelector('[data-slot-shortcut="' + slotId + '"]');
        if (btn) {
            btn.textContent = 'PRESS KEY…';
            btn.classList.add('recording');
            btn.classList.remove('has-shortcut');
        }
    }

    function cancelShortcutRecording() {
        if (!recordingSlotId) return;
        var slotId = recordingSlotId;
        recordingSlotId = null;
        // Restore button
        var slot = getSlot(slotId);
        var btn = document.querySelector('[data-slot-shortcut="' + slotId + '"]');
        if (btn && slot) {
            btn.textContent = formatShortcut(slot.shortcut);
            btn.classList.remove('recording');
            if (slot.shortcut) btn.classList.add('has-shortcut');
        }
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
            var isHalf = slot.size === 'half';
            item.className = 'slot-item' + (isHalf ? ' slot-half' : '');
            item.dataset.slotId = slot.id;
            item.draggable = true;

            var padded = (i + 1) < 10 ? '0' + (i + 1) : String(i + 1);

            var scLabel = formatShortcut(slot.shortcut);
            var scClass = 'slot-shortcut-btn' + (slot.shortcut ? ' has-shortcut' : '');

            // Build library link dropdown options
            var libOpts = '<option value="">— LINK LIBRARY —</option>';
            state.library.scripts.forEach(function(s) {
                var sel = (slot.libraryId === s.id) ? ' selected' : '';
                libOpts += '<option value="' + escHtml(s.id) + '"' + sel + '>' + escHtml(s.name) + '</option>';
            });
            var isLinked = !!slot.libraryId;
            var linkedBadge = isLinked ? '<span class="slot-linked-badge" title="Linked to library entry — content syncs on overwrite">⇌ LINKED</span>' : '';

            item.innerHTML = [
                '<div class="slot-header">',
                    '<span class="slot-drag-handle" title="Drag to reorder">⠿</span>',
                    '<input class="slot-name-input" type="text" value="' + escHtml(slot.name) + '" ',
                        'data-slot-name="' + slot.id + '" placeholder="NAME" spellcheck="false" autocomplete="off">',
                    linkedBadge,
                    '<select class="slot-lib-link" data-slot-lib-link="' + slot.id + '" title="Link slot to a library entry — content syncs on overwrite">',
                        libOpts,
                    '</select>',
                    '<button class="' + scClass + '" data-slot-shortcut="' + slot.id + '" title="Click to set shortcut">' + escHtml(scLabel) + '</button>',
                    '<button class="slot-toggle" data-slot-toggle="' + slot.id + '">' + (slot.expanded ? '▲' : '▼') + '</button>',
                    '<button class="btn-icon del-icon" data-slot-del="' + slot.id + '" title="Remove slot">✕</button>',
                '</div>',
                '<div class="slot-code-area ' + (slot.expanded ? 'expanded' : '') + '" data-slot-code="' + slot.id + '">',
                    '<textarea class="slot-textarea' + (isLinked ? ' slot-textarea-linked' : '') + '" data-slot-textarea="' + slot.id + '"',
                        (isLinked ? ' readonly title="Content synced from linked library entry — edit via Library tab"' : ''),
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

        // Library link dropdown — set/clear libraryId; sync code+name from library when linking
        list.querySelectorAll('[data-slot-lib-link]').forEach(function(sel) {
            sel.addEventListener('change', function() {
                var slot = getSlot(this.dataset.slotLibLink);
                if (!slot) return;
                var newLibId = this.value || null;
                slot.libraryId = newLibId;
                if (newLibId) {
                    // Pull content from library entry immediately
                    var libScript = state.library.scripts.find(function(s) { return s.id === newLibId; });
                    if (libScript) {
                        slot.code = libScript.code;
                        slot.name = libScript.name;
                    }
                }
                saveSlots();
                renderSlots(); // re-render to show/hide badge
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

        // Shortcut recording
        list.querySelectorAll('[data-slot-shortcut]').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (recordingSlotId === this.dataset.slotShortcut) {
                    cancelShortcutRecording();
                } else {
                    if (recordingSlotId) cancelShortcutRecording();
                    startShortcutRecording(this.dataset.slotShortcut);
                }
            });
        });

        // ── Drag to reorder — gesture-based drop system ──────────────
        var BORDER_THRESH = 10;

        function getSlotEls() {
            return Array.from(list.querySelectorAll('.slot-item'));
        }

        function clearIndicators() {
            var prev = list.querySelector('.slot-drop-preview');
            if (prev) prev.remove();
            var bar = list.querySelector('.slot-border-bar');
            if (bar) bar.remove();
            list.querySelectorAll('.slot-half-temp').forEach(function(el) {
                el.classList.remove('slot-half', 'slot-half-temp');
            });
            slotDropInfo = null;
        }

        function showHalfPreview(side, targetEl) {
            if (!targetEl.classList.contains('slot-half')) {
                targetEl.classList.add('slot-half', 'slot-half-temp');
            }
            var preview = document.createElement('div');
            preview.className = 'slot-drop-preview slot-preview-half';
            if (side === 'left') {
                list.insertBefore(preview, targetEl);
            } else {
                list.insertBefore(preview, targetEl.nextSibling);
            }
            slotDropInfo = { type: 'preview-half', side: side, targetId: targetEl.dataset.slotId };
        }

        function showFullPreview(targetEl) {
            var preview = document.createElement('div');
            preview.className = 'slot-drop-preview';
            list.insertBefore(preview, targetEl);
            slotDropInfo = { type: 'preview-full', targetId: targetEl.dataset.slotId };
        }

        function showRowBorderBelow(item, items) {
            var idx = items.indexOf(item);
            var lastInRow = item;
            if (item.classList.contains('slot-half') &&
                idx + 1 < items.length &&
                items[idx + 1].classList.contains('slot-half') &&
                items[idx + 1].dataset.slotId !== slotDragSrcId) {
                lastInRow = items[idx + 1];
            }
            var bar = document.createElement('div');
            bar.className = 'slot-border-bar slot-border-bar-h';
            list.appendChild(bar);
            var listRect = list.getBoundingClientRect();
            var elRect   = lastInRow.getBoundingClientRect();
            bar.style.top   = (elRect.bottom - listRect.top + list.scrollTop - 1.5) + 'px';
            bar.style.left  = '0';
            bar.style.right = '0';
            slotDropInfo = { type: 'border-row', afterId: lastInRow.dataset.slotId };
        }

        function showColBorder(leftEl, rightEl) {
            var bar = document.createElement('div');
            bar.className = 'slot-border-bar slot-border-bar-v';
            list.appendChild(bar);
            var listRect = list.getBoundingClientRect();
            var x      = leftEl.getBoundingClientRect().right - listRect.left;
            var topY   = leftEl.getBoundingClientRect().top   - listRect.top + list.scrollTop;
            var height = leftEl.getBoundingClientRect().height;
            bar.style.left   = (x - 1.5) + 'px';
            bar.style.top    = topY + 'px';
            bar.style.height = height + 'px';
            slotDropInfo = { type: 'border-col', leftId: leftEl.dataset.slotId, rightId: rightEl.dataset.slotId };
        }

        list.addEventListener('dragstart', function(e) {
            var item = e.target.closest && e.target.closest('.slot-item');
            if (!item) return;
            var tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') {
                e.preventDefault();
                return;
            }
            slotDragSrcId = item.dataset.slotId;
            e.dataTransfer.effectAllowed = 'move';
            // Suppress ghost image so cursor stays invisible
            var ghost = new Image();
            ghost.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            e.dataTransfer.setDragImage(ghost, 0, 0);
            item.classList.add('dragging');
        });

        list.addEventListener('dragover', function(e) {
            if (!slotDragSrcId) return;
            e.preventDefault();                  // must be unconditional — enables drop on preview too
            e.dataTransfer.dropEffect = 'move';
            var item = e.target.closest && e.target.closest('.slot-item:not(.slot-drop-preview)');
            if (!item || item.dataset.slotId === slotDragSrcId) return;

            clearIndicators();

            var rect  = item.getBoundingClientRect();
            var x = e.clientX, y = e.clientY;
            var items = getSlotEls();
            var idx   = items.indexOf(item);
            var isHalf = item.classList.contains('slot-half');

            // ── Top border (not at very top of list) ──────────────────────
            if (idx > 0 && y - rect.top <= BORDER_THRESH) {
                showRowBorderBelow(items[idx - 1], items);
                return;
            }

            // ── Bottom border (not at very bottom of list) ─────────────────
            if (rect.bottom - y <= BORDER_THRESH) {
                var lastInRow = item;
                if (isHalf && idx + 1 < items.length &&
                    items[idx + 1].classList.contains('slot-half') &&
                    items[idx + 1].dataset.slotId !== slotDragSrcId) {
                    lastInRow = items[idx + 1];
                }
                if (items.indexOf(lastInRow) < items.length - 1) {
                    showRowBorderBelow(item, items);
                }
                return;
            }

            // ── Vertical border — right edge of LEFT half slot ─────────────
            if (isHalf && idx + 1 < items.length &&
                items[idx + 1].classList.contains('slot-half') &&
                items[idx + 1].dataset.slotId !== slotDragSrcId &&
                rect.right - x <= BORDER_THRESH) {
                showColBorder(item, items[idx + 1]);
                return;
            }

            // ── Vertical border — left edge of RIGHT half slot ─────────────
            if (isHalf && idx > 0 &&
                items[idx - 1].classList.contains('slot-half') &&
                items[idx - 1].dataset.slotId !== slotDragSrcId &&
                x - rect.left <= BORDER_THRESH) {
                showColBorder(items[idx - 1], item);
                return;
            }

            // ── Preview box (thirds) ───────────────────────────────────────
            var third  = rect.width / 3;
            var localX = x - rect.left;
            if (localX < third) {
                showHalfPreview('left', item);
            } else if (localX > 2 * third) {
                showHalfPreview('right', item);
            } else {
                showFullPreview(item);
            }
        });

        list.addEventListener('dragleave', function(e) {
            if (!list.contains(e.relatedTarget)) {
                clearIndicators();
            }
        });

        list.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (!slotDropInfo || !slotDragSrcId) { clearIndicators(); return; }

            var srcIdx = -1;
            state.slots.forEach(function(s, i) { if (s.id === slotDragSrcId) srcIdx = i; });
            if (srcIdx === -1) { clearIndicators(); return; }

            var moved = state.slots.splice(srcIdx, 1)[0];
            var info  = slotDropInfo;
            clearIndicators();

            if (info.type === 'preview-half') {
                moved.size = 'half';
                var tgtIdx = -1, tgtSlot = null;
                state.slots.forEach(function(s, i) {
                    if (s.id === info.targetId) { tgtSlot = s; tgtIdx = i; }
                });
                if (tgtSlot && tgtSlot.size !== 'half') tgtSlot.size = 'half';
                state.slots.splice(info.side === 'left' ? tgtIdx : tgtIdx + 1, 0, moved);

            } else if (info.type === 'preview-full') {
                moved.size = 'full';
                var tgtIdx = -1;
                state.slots.forEach(function(s, i) { if (s.id === info.targetId) tgtIdx = i; });
                if (tgtIdx !== -1) state.slots.splice(tgtIdx, 0, moved);

            } else if (info.type === 'border-row') {
                moved.size = 'full';
                var afterIdx = -1;
                state.slots.forEach(function(s, i) { if (s.id === info.afterId) afterIdx = i; });
                state.slots.splice(afterIdx !== -1 ? afterIdx + 1 : state.slots.length, 0, moved);

            } else if (info.type === 'border-col') {
                moved.size = 'half';
                var leftIdx = -1;
                state.slots.forEach(function(s, i) { if (s.id === info.leftId) leftIdx = i; });
                var rightSlot = getSlot(info.rightId);
                if (rightSlot) rightSlot.size = 'full';
                if (leftIdx !== -1) state.slots.splice(leftIdx + 1, 0, moved);
            }

            saveSlots();
            renderSlots();
        });

        list.addEventListener('dragend', function() {
            clearIndicators();
            list.querySelectorAll('.slot-item.dragging').forEach(function(el) {
                el.classList.remove('dragging');
            });
            slotDragSrcId = null;
            slotDropInfo  = null;
        });
    }

    function saveSlots() {
        storage.setItem(STORAGE_SLOTS, JSON.stringify(state.slots));
    }

    // ============================================================
    // LIBRARY
    // ============================================================
    function initLibrary() {
        var stored = storage.getItem(STORAGE_LIBRARY);
        if (stored) {
            try { state.library = JSON.parse(stored); } catch(e) {}
        }
        if (!state.library.categories) state.library.categories = [];
        if (!state.library.scripts)    state.library.scripts    = [];
        initAgentLibrary();
        updateLibraryToolbar();
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
        storage.setItem(STORAGE_LIBRARY, JSON.stringify(state.library));
    }

    function initAgentLibrary() {
        var stored = storage.getItem(STORAGE_AGENT_LIBRARY);
        var seed = window.HolyScriptureAgentLibrarySeed;
        var seedVersion = seed && typeof seed.version === 'number' ? seed.version : 1;
        var parsed = null;

        if (!stored && seed && typeof seed.getDefaultLibrary === 'function') {
            storage.setItem(STORAGE_AGENT_LIBRARY, JSON.stringify(seed.getDefaultLibrary()));
            stored = storage.getItem(STORAGE_AGENT_LIBRARY);
        }

        if (stored) {
            try {
                parsed = JSON.parse(stored);
                state.agentLibrary = parsed;
            } catch (e) {}
        }

        if (seed && typeof seed.getDefaultLibrary === 'function') {
            var storedVersion = parsed && typeof parsed.version === 'number' ? parsed.version : 0;
            if (storedVersion < seedVersion) {
                state.agentLibrary = seed.getDefaultLibrary();
                storage.setItem(STORAGE_AGENT_LIBRARY, JSON.stringify(state.agentLibrary));
            }
        }
        if (!state.agentLibrary || typeof state.agentLibrary !== 'object') {
            state.agentLibrary = { scripts: [] };
        }
        if (!state.agentLibrary.scripts) {
            state.agentLibrary.scripts = [];
        }
    }

    function setLibraryMode(mode) {
        state.libraryMode = (mode === 'agent') ? 'agent' : 'user';
        updateAgentLibraryToggle();
        updateLibraryToolbar();

        var search = document.getElementById('library-search');
        renderLibrary(search ? search.value.trim() : '');
    }

    function updateLibraryToolbar() {
        var search = document.getElementById('library-search');
        var importBtn = document.getElementById('btn-import-jsx');
        if (search) {
            search.placeholder = (state.libraryMode === 'agent')
                ? 'SEARCH AGENT SCRIPTS...'
                : 'SEARCH SCRIPTURES...';
        }
        if (importBtn) {
            importBtn.style.display = (state.libraryMode === 'agent') ? 'none' : '';
        }
    }

    function deleteScript(id) {
        state.library.scripts = state.library.scripts.filter(function(s) { return s.id !== id; });
        saveLibrary();
        renderLibrary();
    }

    function renderLibrary(query) {
        if (state.libraryMode === 'agent') {
            renderAgentLibrary(query);
            return;
        }

        renderUserLibrary(query);
    }

    function renderUserLibrary(query) {
        var list  = document.getElementById('library-list');
        var empty = document.getElementById('library-empty');
        if (!list) return;

        list.innerHTML = '';
        query = (query || '').toUpperCase();
        updateLibraryEmptyState('user', false);

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
            updateLibraryEmptyState('user', !!query);
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
                loadLibraryScriptToEditor(btn.dataset.libLoad);
            });
        });
        list.querySelectorAll('[data-lib-del]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                if (confirm('Delete "' + btn.closest('.library-item').querySelector('.lib-item-name').textContent + '"?')) {
                    deleteScript(btn.dataset.libDel);
                }
            });
        });

        rebuildScriptDropdown();
    }

    function renderAgentLibrary(query) {
        var list  = document.getElementById('library-list');
        var empty = document.getElementById('library-empty');
        if (!list) return;

        list.innerHTML = '';
        query = (query || '').toUpperCase();
        updateLibraryEmptyState('agent', false);

        var filtered = state.agentLibrary.scripts.filter(function(script) {
            var haystack = [
                script.id || '',
                script.name || '',
                script.description || '',
                script.category || ''
            ].join(' ').toUpperCase();
            return !query || haystack.indexOf(query) !== -1;
        });

        filtered.sort(function(a, b) {
            return String(a.name || '').localeCompare(String(b.name || ''));
        });

        if (filtered.length === 0) {
            updateLibraryEmptyState('agent', !!query);
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';

        filtered.forEach(function(script) {
            var schema = script.argsSchema || {};
            var schemaKeys = Object.keys(schema);
            var hasArgs = schemaKeys.length > 0;

            // Build inline args rows (one text input per key)
            var argsRowsHtml = '';
            if (hasArgs) {
                argsRowsHtml = '<div class="agent-args-panel" data-agent-args-for="' + escHtml(script.id) + '">';
                schemaKeys.forEach(function(key) {
                    var hint = String(schema[key] || '');
                    // Determine sensible default: use hint if it's a simple scalar, else empty
                    var defVal = (typeof schema[key] === 'string' || typeof schema[key] === 'number' || typeof schema[key] === 'boolean')
                        ? String(schema[key]) : '';
                    // If hint looks like an enum list (contains |), show as select
                    var isEnum = typeof schema[key] === 'string' && schema[key].indexOf('|') !== -1;
                    var inputHtml;
                    if (isEnum) {
                        var opts = schema[key].split('|').map(function(o) { return o.trim(); });
                        inputHtml = '<select class="agent-arg-input" data-arg-key="' + escHtml(key) + '">';
                        opts.forEach(function(opt) {
                            inputHtml += '<option value="' + escHtml(opt) + '">' + escHtml(opt) + '</option>';
                        });
                        inputHtml += '</select>';
                    } else {
                        var inputType = typeof schema[key] === 'boolean' ? 'checkbox' :
                                       typeof schema[key] === 'number'  ? 'number'   : 'text';
                        if (inputType === 'checkbox') {
                            var chk = schema[key] ? ' checked' : '';
                            inputHtml = '<input type="checkbox" class="agent-arg-input agent-arg-checkbox" data-arg-key="' + escHtml(key) + '"' + chk + '>';
                        } else {
                            inputHtml = '<input type="' + inputType + '" class="agent-arg-input" data-arg-key="' + escHtml(key) + '"'
                                + ' value="' + escHtml(defVal) + '" placeholder="' + escHtml(hint) + '"'
                                + ' spellcheck="false" autocomplete="off">';
                        }
                    }
                    argsRowsHtml += '<div class="agent-arg-row">'
                        + '<label class="agent-arg-label">' + escHtml(key) + '</label>'
                        + inputHtml
                        + '</div>';
                });
                argsRowsHtml += '</div>';
            }

            var item = document.createElement('div');
            item.className = 'library-item library-item-agent';
            item.innerHTML = [
                '<div class="lib-item-row">',
                    '<div class="lib-item-info">',
                        '<div class="lib-item-name">' + escHtml(script.name) + '</div>',
                        '<div class="lib-item-preview">' + escHtml(script.description || script.id || '') + '</div>',
                        '<div class="lib-item-meta">ID: ' + escHtml(script.id) + ' | READ ONLY'
                            + (hasArgs ? ' | <span class="agent-args-hint">' + schemaKeys.length + ' ARG' + (schemaKeys.length > 1 ? 'S' : '') + '</span>' : '') + '</div>',
                    '</div>',
                    '<div class="lib-item-actions">',
                        (hasArgs ? '<button class="btn-icon agent-args-toggle" data-agent-args-toggle="' + escHtml(script.id) + '" title="Configure arguments">⚙</button>' : ''),
                        '<button class="btn-icon run-icon" data-agent-run="' + escHtml(script.id) + '" title="Run agent script">▶</button>',
                    '</div>',
                '</div>',
                argsRowsHtml
            ].join('');
            list.appendChild(item);
        });

        // Toggle args panel visibility
        list.querySelectorAll('[data-agent-args-toggle]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = btn.getAttribute('data-agent-args-toggle');
                var panel = list.querySelector('[data-agent-args-for="' + id + '"]');
                if (!panel) return;
                var open = panel.classList.toggle('open');
                btn.classList.toggle('is-active', open);
            });
        });

        list.querySelectorAll('[data-agent-run]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = btn.getAttribute('data-agent-run');
                var script = state.agentLibrary.scripts.find(function(entry) { return entry.id === id; });
                if (!script) return;

                // Collect args from inline panel if present
                var argsObj = {};
                var panel = list.querySelector('[data-agent-args-for="' + id + '"]');
                if (panel) {
                    panel.querySelectorAll('[data-arg-key]').forEach(function(inp) {
                        var key = inp.getAttribute('data-arg-key');
                        if (inp.type === 'checkbox') {
                            argsObj[key] = inp.checked;
                        } else if (inp.type === 'number') {
                            argsObj[key] = parseFloat(inp.value) || 0;
                        } else {
                            argsObj[key] = inp.value;
                        }
                    });
                }

                runAgentLibraryScript(script.id, script.name, argsObj);
                flickerBtn(btn);
            });
        });
    }

    function updateLibraryEmptyState(mode, hasQuery) {
        var title = document.getElementById('library-empty-title');
        var sub = document.getElementById('library-empty-sub');
        if (!title || !sub) return;

        if (mode === 'agent') {
            title.textContent = hasQuery ? 'NO MATCHING AGENT SCRIPTS' : 'NO AGENT SCRIPTS';
            sub.textContent = hasQuery ? 'TRY A DIFFERENT SEARCH' : 'AGENT LIBRARY SEED NOT FOUND';
            return;
        }

        title.textContent = hasQuery ? 'NO MATCHING SCRIPTURES' : 'NO SCRIPTURES SAVED';
        sub.textContent = hasQuery ? 'TRY A DIFFERENT SEARCH' : 'RUN A SCRIPT AND HIT ✚ SAVE';
    }

    // ============================================================
    // HISTORY
    // ============================================================
    function initHistory() {
        var stored = storage.getItem(STORAGE_HISTORY);
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
        storage.setItem(STORAGE_HISTORY, JSON.stringify(state.history));
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
        storage.removeItem(STORAGE_HISTORY);
        renderHistory();
    }

    // ============================================================
    // AE CONTEXT BAR
    // ============================================================
    var contextTimer = null;

    function startContextPolling() {
        if (contextTimer) return;
        updateContext();
        contextTimer = setInterval(updateContext, CONTEXT_INTERVAL);
    }

    function stopContextPolling() {
        if (contextTimer) {
            clearInterval(contextTimer);
            contextTimer = null;
        }
    }

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

        startContextPolling();

        // Pause polling while panel is out of focus — prevents AE cursor flicker
        // from evalScript calls while the user is working in AE
        window.addEventListener('blur',  stopContextPolling);
        window.addEventListener('focus', startContextPolling);
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

        // Save button → three-choice save options modal
        var btnSave = document.getElementById('btn-save');
        if (btnSave) {
            btnSave.addEventListener('click', function() {
                openSaveOptionsModal();
            });
        }

        // Quick overwrite button (editor header)
        var btnQuickOverwrite = document.getElementById('btn-quick-overwrite');
        if (btnQuickOverwrite) {
            btnQuickOverwrite.addEventListener('click', quickOverwrite);
        }

        // Script dropdown → switch active library entry
        var scriptDropdown = document.getElementById('editor-script-dropdown');
        if (scriptDropdown) {
            scriptDropdown.addEventListener('change', function() {
                if (this.value) loadLibraryScriptToEditor(this.value);
                else this.value = ''; // reset to placeholder if blank chosen
            });
        }

        // Editor clear button → clear the editor
        var editorClearBtn = document.getElementById('editor-clear-btn');
        if (editorClearBtn) {
            editorClearBtn.addEventListener('click', function() {
                if (editor) {
                    editor.setValue('');
                } else {
                    var fb = document.getElementById('editor-fallback');
                    if (fb) fb.value = '';
                }
                state.isDirty = false;
                updateEditorScriptHeader();
            });
        }

        // Save options modal buttons
        var btnSaveOverwrite = document.getElementById('btn-save-overwrite');
        var btnSaveAsNew     = document.getElementById('btn-save-as-new');
        var btnSaveExport    = document.getElementById('btn-save-export');
        var btnSaveOptsClose = document.getElementById('btn-save-opts-close');
        if (btnSaveOverwrite) btnSaveOverwrite.addEventListener('click', quickOverwrite);
        if (btnSaveAsNew)     btnSaveAsNew.addEventListener('click', function() {
            closeSaveOptionsModal();
            openSaveModal(getEditorCode());
        });
        if (btnSaveExport)    btnSaveExport.addEventListener('click', exportScriptToHolyStorage);
        if (btnSaveOptsClose) btnSaveOptsClose.addEventListener('click', closeSaveOptionsModal);

        // Close save-options modal on overlay click
        var saveOptsOverlay = document.getElementById('modal-save-options');
        if (saveOptsOverlay) {
            saveOptsOverlay.addEventListener('click', function(e) {
                if (e.target === saveOptsOverlay) closeSaveOptionsModal();
            });
        }

        // Clear console
        var btnClearConsole = document.getElementById('btn-clear-console');
        if (btnClearConsole) {
            btnClearConsole.addEventListener('click', clearConsole);
        }

        // Toggle console collapse
        var btnConsoleToggle = document.getElementById('btn-console-toggle');
        if (btnConsoleToggle) {
            btnConsoleToggle.addEventListener('click', function() {
                var panel = document.getElementById('console-panel');
                if (!panel) return;
                var collapsed = panel.classList.toggle('collapsed');
                this.textContent = collapsed ? '▶' : '▼';
                if (!collapsed && editor) {
                    setTimeout(function() { editor.refresh(); }, 50);
                }
            });
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

        var btnAgentLibrary = document.getElementById('btn-agent-library');
        if (btnAgentLibrary) {
            btnAgentLibrary.addEventListener('click', function() {
                setLibraryMode(state.libraryMode === 'agent' ? 'user' : 'agent');
                flickerBtn(this);
            });
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
            // Shortcut recording mode
            if (recordingSlotId) {
                // Escape cancels recording
                if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelShortcutRecording();
                    return;
                }
                // Backspace/Delete clears the shortcut
                if (e.key === 'Backspace' || e.key === 'Delete') {
                    e.preventDefault();
                    var slotToClear = getSlot(recordingSlotId);
                    if (slotToClear) { slotToClear.shortcut = null; saveSlots(); }
                    cancelShortcutRecording();
                    renderSlots();
                    return;
                }
                // Ignore bare modifier keys
                if (['Control', 'Alt', 'Shift', 'Meta'].indexOf(e.key) !== -1) return;
                // Record the combo
                e.preventDefault();
                var slotToSet = getSlot(recordingSlotId);
                if (slotToSet) {
                    slotToSet.shortcut = { key: e.key, ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey };
                    saveSlots();
                }
                cancelShortcutRecording();
                renderSlots();
                return;
            }

            // Ctrl/Cmd + Enter in editor tab = run
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                if (state.activeTab === 'editor') runEditorScript();
            }
            // Escape = close modals
            if (e.key === 'Escape') {
                closeSaveModal();
                closeSaveOptionsModal();
                closeManageMacrosDialog();
                if (recordingSlotId) cancelShortcutRecording();
            }

            // Slot keyboard shortcuts — check all slots
            state.slots.forEach(function(slot) {
                if (!slot.shortcut) return;
                var s = slot.shortcut;
                if (e.key === s.key && e.ctrlKey === s.ctrl && e.altKey === s.alt && e.shiftKey === s.shift) {
                    e.preventDefault();
                    runScript(slot.code, slot.name);
                    // Flash the slot's run button if visible
                    var runBtn = document.querySelector('[data-slot-run="' + slot.id + '"]');
                    if (runBtn) flickerBtn(runBtn);
                }
            });
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
    // MACRO — EXECUTION LAYER (builder UI removed 2026-04-13)
    // These functions remain intact because Holy Agent depends on them.
    //
    // Execution path: HolyAgent → HS_runMacro(macroId) in hostscript.jsx
    // which resolves and runs macro steps via HS_runScript, entirely
    // independent of this JS layer. executeMacro() is preserved for any
    // future direct-JS callers and is the canonical client-side runner.
    // ============================================================

    function normalizeMacroStep(step, index) {
        step = step || {};

        var normalized = {
            id: step.id || ('step_' + Date.now() + '_' + index),
            scriptId: step.scriptId || '',
            name: step.name || ('STEP ' + (index + 1)),
            code: step.code || '',
            delay: Math.max(0, parseInt(step.delay, 10) || 0)
        };

        if (normalized.scriptId) {
            var liveScript = state.library.scripts.find(function(script) {
                return script.id === normalized.scriptId;
            });
            if (liveScript) {
                normalized.name = liveScript.name || normalized.name;
                normalized.code = liveScript.code || normalized.code;
            }
        }

        return normalized;
    }

    function cloneMacroSteps(steps) {
        return (steps || []).map(function(step, index) {
            return normalizeMacroStep(JSON.parse(JSON.stringify(step || {})), index);
        });
    }

    function getMacroHistoryCode(steps) {
        return '[MACRO: ' + steps.map(function(step) { return step.name; }).join(' -> ') + ']';
    }

    function getMacroConfig(sourceMacro) {
        var macro = sourceMacro || {};
        var name = ((macro.name || 'MACRO') + '').trim().toUpperCase() || 'MACRO';
        var onError = macro.onError || 'abort';
        var steps = cloneMacroSteps(macro.steps || state.macroChain);

        return {
            id: macro.id || null,
            name: name,
            onError: onError === 'continue' ? 'continue' : 'abort',
            steps: steps
        };
    }

    function executeMacro(config, onComplete) {
        var steps = config.steps || [];
        var macroName = config.name || 'MACRO';
        var onError = config.onError === 'continue' ? 'continue' : 'abort';
        var historyCode = getMacroHistoryCode(steps);
        var results = [];
        var index = 0;

        if (steps.length === 0) {
            logConsole('info', '> MACRO: NO STEPS TO CAST');
            if (onComplete) {
                onComplete({
                    macroId: config.id || null,
                    name: macroName,
                    onError: onError,
                    success: false,
                    halted: false,
                    failedStep: null,
                    historyCode: historyCode,
                    steps: []
                });
            }
            return;
        }

        logConsole('run', '> CASTING MACRO: ' + macroName + ' (' + steps.length + ' STEPS)');
        steps.forEach(function(step) { setStepStatus(step.id, null); });

        function finish(summaryError, haltedStep) {
            var failed = results.filter(function(result) { return !result.success; });
            var success = failed.length === 0;
            var summary = {
                macroId: config.id || null,
                name: macroName,
                onError: onError,
                success: success,
                halted: !!haltedStep,
                failedStep: haltedStep ? {
                    index: haltedStep.index,
                    id: haltedStep.id,
                    name: haltedStep.name
                } : null,
                historyCode: historyCode,
                steps: results
            };

            if (success) {
                logConsole('success', '> OK: MACRO COMPLETE (' + steps.length + ' STEPS)');
                addToHistory(macroName, historyCode, true, null);
            } else if (haltedStep) {
                logConsole('error', '> MACRO ABORTED AT STEP ' + (haltedStep.index + 1) + ': ' + haltedStep.name);
                addToHistory(macroName, historyCode, false, summaryError || { message: 'Macro aborted.' });
            } else {
                logConsole('error', '> MACRO COMPLETE WITH ERRORS (' + failed.length + ' FAILED STEP(S))');
                addToHistory(macroName, historyCode, false, {
                    message: 'Macro completed with ' + failed.length + ' failed step(s).'
                });
            }

            if (onComplete) onComplete(summary);
        }

        function runNext() {
            if (index >= steps.length) {
                finish(null, null);
                return;
            }

            var step = steps[index];
            var delay = step.delay || 0;

            setStepStatus(step.id, 'running');

            setTimeout(function() {
                runScript(step.code, 'MACRO/' + step.name, function(ok, err, data) {
                    var result = {
                        index: index,
                        id: step.id,
                        scriptId: step.scriptId || '',
                        name: step.name,
                        delay: delay,
                        success: ok,
                        output: data && data.output ? data.output : '',
                        logs: data && data.logs ? data.logs.slice() : [],
                        duration: data && data.duration ? data.duration : 0,
                        error: ok ? null : (err || (data && data.error) || { message: 'Unknown error' })
                    };

                    results.push(result);
                    setStepStatus(step.id, ok ? 'ok' : 'error');

                    if (!ok && onError === 'abort') {
                        finish(result.error, {
                            index: index,
                            id: step.id,
                            name: step.name
                        });
                        return;
                    }

                    index++;
                    runNext();
                });
            }, delay);
        }

        runNext();
    }

    // setStepStatus: no-ops safely when the macro step UI elements are absent.
    // Called by executeMacro() to reflect per-step run state in the UI.
    // With the builder tab removed there are no .macro-step elements to update,
    // but the function must remain so executeMacro() continues to parse.
    function setStepStatus(stepId, status) {
        var el = document.querySelector('.macro-step[data-step-id="' + stepId + '"]');
        if (!el) return;
        el.classList.remove('step-running', 'step-ok', 'step-error');
        if (status) el.classList.add('step-' + status);
    }

    function castMacro(sourceMacro) {
        executeMacro(getMacroConfig(sourceMacro));
    }

    function deleteMacro(id) {
        state.macros = state.macros.filter(function(m) { return m.id !== id; });
        storage.setItem(STORAGE_MACROS, JSON.stringify(state.macros));
        renderManageMacrosList();
    }

    // ============================================================
    // MANAGE MACROS DIALOG
    // Replaces the old MACRO tab. Users view and run/delete saved
    // macros. New macros are created via Holy Agent ("chain these
    // scripts and save as a macro").
    // ============================================================
    function openManageMacrosDialog() {
        renderManageMacrosList();
        var overlay = document.getElementById('modal-manage-macros');
        if (overlay) overlay.classList.add('open');
    }

    function closeManageMacrosDialog() {
        var overlay = document.getElementById('modal-manage-macros');
        if (overlay) overlay.classList.remove('open');
    }

    function renderManageMacrosList() {
        var list  = document.getElementById('manage-macros-list');
        var empty = document.getElementById('manage-macros-empty');
        if (!list) return;

        list.innerHTML = '';

        if (state.macros.length === 0) {
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';

        state.macros.slice().reverse().forEach(function(macro) {
            var item = document.createElement('div');
            item.className = 'saved-macro-item';
            item.innerHTML = [
                '<span class="saved-macro-name">' + escHtml(macro.name) + '</span>',
                '<span class="saved-macro-meta">' + macro.steps.length + ' STEP' + (macro.steps.length !== 1 ? 'S' : '') + '</span>',
                '<div class="saved-macro-actions">',
                    '<button class="btn-icon run-icon" data-macro-cast="' + macro.id + '" title="Run macro">▶</button>',
                    '<button class="btn-icon del-icon" data-macro-del="' + macro.id + '" title="Delete">✕</button>',
                '</div>'
            ].join('');
            list.appendChild(item);
        });

        list.querySelectorAll('[data-macro-cast]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var macro = state.macros.find(function(m) { return m.id === btn.dataset.macroCast; });
                if (!macro) return;
                closeManageMacrosDialog();
                castMacro(macro);
                flickerBtn(btn);
            });
        });

        list.querySelectorAll('[data-macro-del]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var row = btn.closest('.saved-macro-item');
                var name = row ? row.querySelector('.saved-macro-name').textContent : 'this macro';
                if (confirm('Delete macro "' + name + '"?')) {
                    deleteMacro(btn.dataset.macroDel);
                }
            });
        });
    }

    // ============================================================
    // MACRO PRO TIP TOAST
    // One-time hint on panel load when saved macros exist.
    // ============================================================
    function maybeShowMacroProTip() {
        if (state.macros.length === 0) return;
        var dismissed = localStorage.getItem('hs_macro_tip_dismissed');
        if (dismissed) return;

        var toast = document.getElementById('macro-pro-tip');
        if (!toast) return;

        setTimeout(function() {
            toast.classList.add('visible');
        }, 1200);

        var btnClose = document.getElementById('btn-macro-pro-tip-close');
        if (btnClose) {
            btnClose.addEventListener('click', function() {
                toast.classList.remove('visible');
                localStorage.setItem('hs_macro_tip_dismissed', '1');
            });
        }

        // Auto-dismiss after 8 seconds
        setTimeout(function() {
            toast.classList.remove('visible');
        }, 9200);
    }

    function initMacro() {
        var stored = storage.getItem(STORAGE_MACROS);
        if (stored) {
            try { state.macros = JSON.parse(stored); } catch(e) { state.macros = []; }
        }

        state.macros = (state.macros || []).map(function(macro) {
            return {
                id: macro.id || ('macro_' + Date.now()),
                name: macro.name || 'MACRO',
                steps: cloneMacroSteps(macro.steps),
                onError: macro.onError === 'continue' ? 'continue' : 'abort',
                created: macro.created || Date.now()
            };
        });

        // Wire the Manage Macros dialog
        var btnManage = document.getElementById('btn-manage-macros');
        if (btnManage) {
            btnManage.addEventListener('click', openManageMacrosDialog);
        }

        var btnClose = document.getElementById('btn-manage-macros-close');
        if (btnClose) {
            btnClose.addEventListener('click', closeManageMacrosDialog);
        }

        // Close on overlay backdrop click
        var overlay = document.getElementById('modal-manage-macros');
        if (overlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) closeManageMacrosDialog();
            });
        }

        // Escape key closes the dialog (handled in global keydown listener)

        maybeShowMacroProTip();
    }

    // ============================================================
    // DRAG-DROP .JSX IMPORT
    // ============================================================
    function initDragDrop() {
        var body = document.body;

        function hasFile(e) {
            if (!e.dataTransfer) return false;
            var items = e.dataTransfer.items;
            if (items) {
                for (var i = 0; i < items.length; i++) {
                    if (items[i].kind === 'file') return true;
                }
            }
            return e.dataTransfer.types && (
                e.dataTransfer.types.indexOf('Files') !== -1 ||
                e.dataTransfer.types.indexOf('application/x-moz-file') !== -1
            );
        }

        body.addEventListener('dragenter', function(e) {
            if (hasFile(e)) {
                e.preventDefault();
                body.classList.add('drag-active');
            }
        });

        body.addEventListener('dragover', function(e) {
            if (hasFile(e)) { e.preventDefault(); }
        });

        body.addEventListener('dragleave', function(e) {
            // Only deactivate when leaving the window entirely
            if (!e.relatedTarget || e.relatedTarget === document.documentElement || !document.body.contains(e.relatedTarget)) {
                body.classList.remove('drag-active');
            }
        });

        body.addEventListener('drop', function(e) {
            body.classList.remove('drag-active');
            e.preventDefault();

            var files = e.dataTransfer.files;
            if (!files || files.length === 0) return;
            var file = files[0];
            if (!/\.(jsx?|js|txt)$/i.test(file.name)) {
                logConsole('info', '> DROP: not a .jsx / .js / .txt file');
                return;
            }

            var reader = new FileReader();
            reader.onload = function(ev) {
                var code = ev.target.result;
                var baseName = file.name.replace(/\.(jsx?|js|txt)$/i, '').toUpperCase();

                if (state.activeTab === 'library') {
                    // Save to library — open modal pre-filled with filename
                    openSaveModal(code);
                    setTimeout(function() {
                        var inp = document.getElementById('modal-name');
                        if (inp) inp.value = baseName;
                    }, 60);
                } else {
                    // Load into editor
                    setEditorCode(code);
                    switchTab('editor');
                    logConsole('info', '> LOADED: ' + baseName);
                }
            };
            reader.onerror = function() {
                logConsole('error', '> ✗ Could not read dropped file');
            };
            reader.readAsText(file);
        });
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
    function finishInit() {
        initAccentColor();
        initEditor();
        initTabs();
        initEventListeners();
        initParams();
        initSlots();
        initLibrary();
        initHistory();
        initMacro();
        initDragDrop();
        initContextBar();
        updateAgentLibraryToggle();

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

    function init() {
        reloadHostScript(finishInit);
    }

    document.addEventListener('DOMContentLoaded', init);

})();
