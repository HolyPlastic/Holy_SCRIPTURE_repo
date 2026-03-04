/**
 * HLMDragDrop — Portable drag-and-drop reordering module for CEP panels
 * ─────────────────────────────────────────────────────────────────────
 * Supports two reordering modes:
 *   • Section reordering — drag a section header to reorder top-level sections
 *   • Row reordering     — drag a specific handle element to reorder rows within a container
 *
 * Built on the HTML5 Drag-and-Drop API (native to CEP/Chromium, no libraries needed).
 * Completely self-contained: injects its own indicator CSS, manages its own state.
 *
 * ── USAGE ────────────────────────────────────────────────────────────
 *
 *   HLMDragDrop.init({
 *       // Required
 *       sectionsContainerId : 'sectionsContainer',
 *       sectionIdAttr       : 'data-section-id',
 *       getOrder            : () => currentConfig.sectionOrder,
 *       onSectionDrop       : (newOrder) => { currentConfig.sectionOrder = newOrder; saveConfig(); },
 *
 *       // Optional — bank/row containers
 *       rowContainers : [
 *           { containerId: 'kfBanksContainer',  type: 'kf'  },
 *           { containerId: 'layBanksContainer', type: 'lay' },
 *       ],
 *       onRowDrop : (type, fromIdx, insertAt) => {
 *           // insertAt is already adjusted for the splice shift — just do:
 *           const arr = type === 'kf' ? config.kfBanks : config.layBanks;
 *           arr.splice(insertAt, 0, arr.splice(fromIdx, 1)[0]);
 *           saveConfig();
 *           renderAll();
 *       },
 *
 *       // Optional — CSS selectors (these are the defaults)
 *       sectionHeaderSelector : '.section-header',   // drag handle for sections
 *       rowSelector           : '.row',               // each draggable row
 *       rowDragHandle         : '.sel-btn',           // element within row that initiates drag
 *
 *       // Optional — CSS class names applied during drag (must exist in your stylesheet)
 *       sectionDraggingClass  : 'section-dragging',
 *       rowDraggingClass      : 'bank-dragging',
 *
 *       // Optional — accent color for the drop indicator line (CSS var or hex)
 *       indicatorColor        : 'var(--accent)',
 *   });
 *
 *   // Call this on boot and whenever a saved order is loaded from config:
 *   HLMDragDrop.applyOrder(['id1', 'id2', 'id3', 'id4']);
 *
 * ── REQUIRED STYLESHEET RULES ────────────────────────────────────────
 *   The module injects its own indicator element CSS.
 *   You still need these rules in your stylesheet for cursor + fade feedback:
 *
 *   .section-header[draggable="true"]        { cursor: grab; }
 *   .section-header[draggable="true"]:active { cursor: grabbing; }
 *   .section-star                            { cursor: pointer; }   /* overrides grab on star */
 *   .section-dragging                        { opacity: 0.4; transition: opacity 0.15s ease-in-out; }
 *   .sel-btn                                 { cursor: grab; }
 *   .sel-btn:active                          { cursor: grabbing; }
 *   .bank-dragging                           { opacity: 0.4; transition: opacity 0.15s ease-in-out; }
 *
 * ─────────────────────────────────────────────────────────────────────
 */

/* global HLMDragDrop */
const HLMDragDrop = (function () {

    // ── Private state ────────────────────────────────────────────────
    let _o  = {};   // options, set by init()
    let _drag = { type: null, rowType: null, fromIdx: null, overIdx: null };
    let _indicator = null;

    // ── CSS injection ────────────────────────────────────────────────
    // Injects the drop-indicator styles once so the module is stylesheet-free.
    function _injectCSS() {
        if (document.getElementById('hlm-dragdrop-style')) return;
        const color = _o.indicatorColor || 'var(--accent, #ff7c44)';
        const style = document.createElement('style');
        style.id = 'hlm-dragdrop-style';
        style.textContent = [
            '.hlm-drop-indicator{',
                'position:fixed;height:2px;pointer-events:none;z-index:9999;display:none;',
                'background:' + color + ';border-radius:1px;',
            '}',
            '.hlm-drop-indicator::before,.hlm-drop-indicator::after{',
                'content:"";position:absolute;top:50%;',
                'width:5px;height:5px;border-radius:50%;transform:translateY(-50%);',
                'background:' + color + ';',
            '}',
            '.hlm-drop-indicator::before{left:-1px;}',
            '.hlm-drop-indicator::after{right:-1px;}',
        ].join('');
        document.head.appendChild(style);
    }

    // ── Drop indicator ───────────────────────────────────────────────
    function _createIndicator() {
        if (_indicator) return;
        const el = document.createElement('div');
        el.className = 'hlm-drop-indicator';
        document.body.appendChild(el);
        _indicator = el;
    }

    function _showIndicator(rect, insertBefore) {
        if (!_indicator) return;
        _indicator.style.display = 'block';
        _indicator.style.top     = (insertBefore ? rect.top - 1 : rect.bottom - 1) + 'px';
        _indicator.style.left    = rect.left  + 'px';
        _indicator.style.width   = rect.width + 'px';
    }

    function _hideIndicator() {
        if (_indicator) _indicator.style.display = 'none';
        _drag.overIdx = null;
    }

    // ── Ghost image ──────────────────────────────────────────────────
    // Clone the element off-screen, hand it to setDragImage, then remove it.
    // The browser captures it as a bitmap immediately so the timeout removal is safe.
    function _ghost(el, offsetX, offsetY, dataTransfer) {
        const g = el.cloneNode(true);
        g.style.cssText = 'position:fixed;top:-9999px;left:-9999px;'
            + 'opacity:0.55;pointer-events:none;overflow:hidden;'
            + 'width:' + el.offsetWidth + 'px;';
        document.body.appendChild(g);
        dataTransfer.setDragImage(g, offsetX, offsetY);
        dataTransfer.effectAllowed = 'move';
        setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, 0);
    }

    // ── Index math ───────────────────────────────────────────────────
    // After splicing fromIdx out, all indices >= fromIdx shift down by 1.
    // This computes the correct insertion index in the post-removal array.
    function _calcInsertAt(fromIdx, targetIdx, insertBefore) {
        const adj = targetIdx > fromIdx ? targetIdx - 1 : targetIdx;
        return insertBefore ? adj : adj + 1;
    }

    // ── Internal DOM reorder ─────────────────────────────────────────
    function _applyOrderToDOM(container, order) {
        const attr = _o.sectionIdAttr;
        order.forEach(function (id) {
            const wrap = container.querySelector('[' + attr + '="' + id + '"]');
            if (wrap) container.appendChild(wrap);
        });
    }

    // ── Section drag ─────────────────────────────────────────────────
    function _initSectionDrag() {
        const container = document.getElementById(_o.sectionsContainerId);
        if (!container) return;

        const wrapSel      = '[' + _o.sectionIdAttr + ']';
        const headerSel    = _o.sectionHeaderSelector || '.section-header';
        const draggingCls  = _o.sectionDraggingClass  || 'section-dragging';

        container.addEventListener('dragstart', function (e) {
            const header = e.target.closest(headerSel);
            if (!header) return;
            const wrap = header.closest(wrapSel);
            if (!wrap) return;

            const order = _o.getOrder();
            _drag.type    = 'section';
            _drag.fromIdx = order.indexOf(wrap.getAttribute(_o.sectionIdAttr));

            _ghost(wrap, Math.round(wrap.offsetWidth / 2), 16, e.dataTransfer);
            wrap.classList.add(draggingCls);
        });

        container.addEventListener('dragover', function (e) {
            if (_drag.type !== 'section') return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const targetWrap = e.target.closest(wrapSel);
            if (!targetWrap) return;

            const order     = _o.getOrder();
            const targetIdx = order.indexOf(targetWrap.getAttribute(_o.sectionIdAttr));
            if (targetIdx === _drag.fromIdx) { _hideIndicator(); return; }

            const rect = targetWrap.getBoundingClientRect();
            _drag.overIdx = targetIdx;
            _showIndicator(rect, e.clientY < rect.top + rect.height / 2);
        });

        container.addEventListener('dragleave', function (e) {
            if (_drag.type !== 'section') return;
            if (!container.contains(e.relatedTarget)) _hideIndicator();
        });

        container.addEventListener('drop', function (e) {
            if (_drag.type !== 'section') return;
            e.preventDefault();
            _hideIndicator();

            const targetWrap = e.target.closest(wrapSel);
            if (!targetWrap) return;

            const order      = _o.getOrder();
            const draggedId  = order[_drag.fromIdx];
            const targetId   = targetWrap.getAttribute(_o.sectionIdAttr);
            if (draggedId === targetId) return;

            const targetIdx    = order.indexOf(targetId);
            const rect         = targetWrap.getBoundingClientRect();
            const insertBefore = e.clientY < rect.top + rect.height / 2;

            const newOrder = order.filter(function (id) { return id !== draggedId; });
            newOrder.splice(_calcInsertAt(_drag.fromIdx, targetIdx, insertBefore), 0, draggedId);

            // Reorder the DOM immediately, then let the consumer persist the new order
            _applyOrderToDOM(container, newOrder);
            if (_o.onSectionDrop) _o.onSectionDrop(newOrder);
        });

        container.addEventListener('dragend', function () {
            container.querySelectorAll('.' + draggingCls)
                .forEach(function (w) { w.classList.remove(draggingCls); });
            _hideIndicator();
            _drag.type    = null;
            _drag.fromIdx = null;
            _drag.overIdx = null;
        });
    }

    // ── Row drag ─────────────────────────────────────────────────────
    function _initRowDrag() {
        (_o.rowContainers || []).forEach(function (cfg) {
            const container  = document.getElementById(cfg.containerId);
            if (!container) return;

            const rowType    = cfg.type;
            const rowSel     = _o.rowSelector    || '.row';
            const handleSel  = _o.rowDragHandle  || '.sel-btn';
            const draggingCls = _o.rowDraggingClass || 'bank-dragging';

            let _pendingRow = null;

            // Gate: only make a row draggable when mousedown lands on the designated handle
            container.addEventListener('mousedown', function (e) {
                if (e.target.closest(handleSel)) {
                    const row = e.target.closest(rowSel);
                    if (row) { row.setAttribute('draggable', 'true'); _pendingRow = row; }
                } else {
                    if (_pendingRow) { _pendingRow.removeAttribute('draggable'); _pendingRow = null; }
                }
            });

            // Remove draggable on mouseup so ordinary clicks continue to work normally
            container.addEventListener('mouseup', function () {
                var row = _pendingRow;
                if (row) {
                    setTimeout(function () { row.removeAttribute('draggable'); }, 50);
                    _pendingRow = null;
                }
            });

            container.addEventListener('dragstart', function (e) {
                const row = e.target.closest(rowSel);
                if (!row || row !== _pendingRow) return;

                const rows    = Array.from(container.querySelectorAll(rowSel));
                const fromIdx = rows.indexOf(row);
                if (fromIdx < 0) return;

                _drag.type    = 'row';
                _drag.rowType = rowType;
                _drag.fromIdx = fromIdx;

                _ghost(row, 12, 12, e.dataTransfer);
                row.classList.add(draggingCls);
            });

            container.addEventListener('dragover', function (e) {
                if (_drag.type !== 'row' || _drag.rowType !== rowType) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                const targetRow = e.target.closest(rowSel);
                if (!targetRow) return;

                const rows      = Array.from(container.querySelectorAll(rowSel));
                const targetIdx = rows.indexOf(targetRow);
                if (targetIdx < 0 || targetIdx === _drag.fromIdx) { _hideIndicator(); return; }

                const rect = targetRow.getBoundingClientRect();
                _drag.overIdx = targetIdx;
                _showIndicator(rect, e.clientY < rect.top + rect.height / 2);
            });

            container.addEventListener('dragleave', function (e) {
                if (_drag.type !== 'row' || _drag.rowType !== rowType) return;
                if (!container.contains(e.relatedTarget)) _hideIndicator();
            });

            container.addEventListener('drop', function (e) {
                if (_drag.type !== 'row' || _drag.rowType !== rowType) return;
                e.preventDefault();
                _hideIndicator();

                const targetRow = e.target.closest(rowSel);
                if (!targetRow) return;

                const rows      = Array.from(container.querySelectorAll(rowSel));
                const targetIdx = rows.indexOf(targetRow);
                if (targetIdx < 0 || targetIdx === _drag.fromIdx) return;

                const rect         = targetRow.getBoundingClientRect();
                const insertBefore = e.clientY < rect.top + rect.height / 2;
                const insertAt     = _calcInsertAt(_drag.fromIdx, targetIdx, insertBefore);

                // Consumer handles array mutation and re-render
                if (_o.onRowDrop) _o.onRowDrop(rowType, _drag.fromIdx, insertAt);
            });

            container.addEventListener('dragend', function (e) {
                const row = e.target && e.target.closest ? e.target.closest(rowSel) : null;
                if (row) { row.classList.remove(draggingCls); row.removeAttribute('draggable'); }
                if (_pendingRow) { _pendingRow.removeAttribute('draggable'); _pendingRow = null; }
                _hideIndicator();
                if (_drag.rowType === rowType) {
                    _drag.type    = null;
                    _drag.rowType = null;
                    _drag.fromIdx = null;
                    _drag.overIdx = null;
                }
            });
        });
    }

    // ── Public API ───────────────────────────────────────────────────
    return {

        /**
         * Initialise the drag system. Safe to call multiple times (re-initialises).
         *
         * @param {object}   opts
         * @param {string}   opts.sectionsContainerId   ID of the element holding all section-wraps
         * @param {string}   opts.sectionIdAttr         Attribute on each wrap identifying it, e.g. 'data-section-id'
         * @param {Function} opts.getOrder              Returns the current order array, e.g. () => config.sectionOrder
         * @param {Function} opts.onSectionDrop         Called with (newOrder[]) after a section is dropped
         * @param {Array}    [opts.rowContainers]       [{containerId, type}] — one per draggable row list
         * @param {Function} [opts.onRowDrop]           Called with (type, fromIdx, insertAt) after a row is dropped
         * @param {string}   [opts.sectionHeaderSelector]  Default: '.section-header'
         * @param {string}   [opts.rowSelector]            Default: '.row'
         * @param {string}   [opts.rowDragHandle]          Default: '.sel-btn'
         * @param {string}   [opts.sectionDraggingClass]   Default: 'section-dragging'
         * @param {string}   [opts.rowDraggingClass]       Default: 'bank-dragging'
         * @param {string}   [opts.indicatorColor]         CSS color for the drop line. Default: var(--accent, #ff7c44)
         */
        init: function (opts) {
            _o = opts;
            _injectCSS();
            _createIndicator();
            _initSectionDrag();
            _initRowDrag();
        },

        /**
         * Apply a section order to the DOM.
         * Call this on boot and whenever a saved order is loaded from config.
         *
         * @param {string[]} order — section IDs in the desired top-to-bottom display order
         */
        applyOrder: function (order) {
            const container = document.getElementById(_o.sectionsContainerId);
            if (!container || !order) return;
            _applyOrderToDOM(container, order);
        },

    };

}());
