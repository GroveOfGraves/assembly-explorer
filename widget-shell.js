         
        if (window.d3) {
            const originalStyle = d3.selection.prototype.style;
            d3.selection.prototype.style = function(name, value, priority) {
                if (typeof name === 'object' && name !== null) {
                    for (const key in name) {
                        originalStyle.call(this, key, name[key]);
                    }
                    return this;
                }
                return originalStyle.call(this, name, value, priority);
            };
            
            const originalAttr = d3.selection.prototype.attr;
            d3.selection.prototype.attr = function(name, value) {
                if (typeof name === 'object' && name !== null) {
                    for (const key in name) {
                        originalAttr.call(this, key, name[key]);
                    }
                    return this;
                }
                return originalAttr.call(this, name, value);
            };
        }

         // --- SHELL UPDATE: Scientific Plot Theme ---
        if (window.Plot) {
            const originalPlot = Plot.plot;
            Plot.plot = (options) => {
                if (!options) options = {};
                if (!options.style) options.style = {};
                // 1. COLORS & FONTS
                // Force the chart to match the App Theme
                const sans = getComputedStyle(document.body).getPropertyValue('--ff-sans') || 'sans-serif';
                const mono = 'SF Mono, Roboto Mono, monospace';
                const cText = window.WH.getColor('--on-surface-de-emphasis');
                const cGrid = window.WH.transparent('--outline', 0.5);

                // 2. GLOBAL DEFAULTS (The "Scientific" Look)
                const defaults = {
                    // Background
                    style: {
                        background: "transparent",
                        color: cText,
                        fontFamily: sans,
                        fontSize: "11px",
                        overflow: "visible" // Prevents clipping of large dots
                    },
                    // Layout (Fixed margins fix the "Jumping" indentation issue)
                    marginLeft: 50, 
                    marginRight: 20, 
                    marginBottom: 35,
                    marginTop: 20,
                    
                    // Grid Styling
                    grid: true, // Force grids on by default
                };

                // 3. MERGE DEFAULTS
                // We gently merge defaults if the user hasn't strictly overridden them
                Object.keys(defaults).forEach(k => {
                    if (options[k] === undefined) options[k] = defaults[k];
                });
                
                // Merge Style Props
                Object.assign(options.style, defaults.style);

                // 4. AXIS STYLING (The "Clean" Look)
                // Helper to inject specific axis styles without overwriting model data
                const styleAxis = (axisKey) => {
                    if (!options[axisKey]) options[axisKey] = {};
                    const ax = options[axisKey];
                    
                    // Remove ugly arrows, lighten ticks
                    if (ax.tickSize === undefined) ax.tickSize = 0; // Clean ticks
                    if (ax.tickPadding === undefined) ax.tickPadding = 10; // Breathing room
                    if (ax.grid === undefined) ax.grid = true; // Force grid
                    
                    // If grid is on, style the lines
                    // Plot.js doesn't support easy global grid styling props in config, 
                    // so we rely on CSS or SVG post-process, but we can set label color/font here.
                    // Note: Observable Plot renders grids as strokes with opacity 0.1 by default.
                };
                styleAxis('x');
                styleAxis('y');

                // 5. TOOLTIP STYLING (Dark Mode Safe)
                if (options.marks) {
                    options.marks.forEach(m => {
                        // Auto-style tooltips
                        if (m.ariaLabel === "tip") {
                             if (!m.fill) m.fill = window.WH.getColor('--surface');
                             if (!m.fillOpacity) m.fillOpacity = 0.95;
                             if (!m.stroke) m.stroke = window.WH.getColor('--outline');
                             // Force text color in tooltip to be readable
                             // Plot uses 'color' option for text, or inherited.
                             // We can't easily force text color inside the tip MARK config, 
                             // but the global style.color handles it mostly.
                        }
                    });
                }
                 
                // 6. RENDER
                const root = originalPlot(options);

                // 7. POST-PROCESS STYLING (CSS Injection)
                // This is the secret sauce to fix the "Plain" look.
                // We inject a style block directly into the generated SVG.
                const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
                style.textContent = `
                    /* Fix Indentation / Axis Fonts */
                    text { font-family: ` + mono + ` !important; font-size: 10px !important; }
                    
                    /* Softer Grid Lines */
                    .tick line { stroke: ` + cGrid + ` !important; stroke-dasharray: 2,2; }
                    
                    /* Remove Domain Lines (The box around the chart) */
                    .domain { display: none; }
                    
                    /* Bold Zero Line */
                    [aria-label="rule"] line { stroke: ` + window.WH.getColor('--on-surface-default') + ` !important; stroke-width: 1.5px; stroke-dasharray: none; }
                `;
                root.prepend(style);

                return root;
            };
        }

                // --- GLOBAL VISUALIZATION THEME ---
                
                // 1. D3: Allow .style({ prop: val }) syntax
                if (window.d3) {
                    const originalStyle = d3.selection.prototype.style;
                    d3.selection.prototype.style = function(name, value, priority) {
                        if (typeof name === 'object' && name !== null) {
                            for (const key in name) originalStyle.call(this, key, name[key]);
                            return this;
                        }
                        return originalStyle.call(this, name, value, priority);
                    };
                }

                // 2. PLOT: Enforce Theme, Grid, & Legends
                if (window.Plot) {
                    const originalPlot = Plot.plot;
                    Plot.plot = (options) => {
                        if (!options.style) options.style = {};
                        
                        // A. Base Styles (Transparent BG, System Font)
                        options.style.background = "transparent";
                        options.style.color = "var(--on-surface-default)";
                        options.style.fontFamily = "var(--ff-sans)";
                        
                        // B. Margins (Ensure axes aren't cut off)
                        // Default to enough space for Y-axis ticks and X-axis labels
                        if (options.marginLeft === undefined) options.marginLeft = 50; 
                        if (options.marginBottom === undefined) options.marginBottom = 40;
                        
                        // C. Auto-Grid (Business Standard)
                        // If Y-axis is defined but grid isn't, turn it on.
                        if (options.y && options.y.grid === undefined) options.y.grid = true;

                        // D. Colors & Legend
                        if (!options.color) options.color = {};
                        // Force Palette
                        if (!options.color.range) {
                            options.color.range = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
                        }
                        // FORCE LEGEND if color is mapped (Fixes "Floating Labels" issue)
                        if (options.color.domain && options.color.legend === undefined) {
                            options.color.legend = true;
                        }
                        
                        // E. Tooltips (Contrast Fix)
                        if (options.marks) {
                            options.marks.forEach(m => {
                                if (m.ariaLabel === "tip") {
                                     if (!m.fill) m.fill = "var(--surface)";
                                     if (!m.fillOpacity) m.fillOpacity = 1; 
                                     if (!m.stroke) m.stroke = "var(--outline)";
                                     if (!m.color) m.color = "var(--on-surface-default)";
                                }
                            });
                        }
                        return originalPlot(options);
                    };
                }

        if (!window.WIDGET_INIT_DATA) window.WIDGET_INIT_DATA = null;

        window.addEventListener('message', (e) => {
            if (e.data?.type === 'set-theme') {
                document.documentElement.setAttribute('data-theme', e.data.theme);
                setTimeout(() => window.dispatchEvent(new CustomEvent('themeChanged')), 0);
            }
        });

        window.WH = window.WidgetHelpers = {
            getFontStyles: (name) => {
                const sans = '"Google Sans", sans-serif';
                const mono = 'var(--ff-mono, "Google Code"), "SF Mono", "Roboto Mono", monospace';
                const latex = '"Times New Roman", serif';
                const styles = {
                    headline:   { fontFamily: sans, fontSize: '32px', lineHeight: '40px', fontWeight: '400', letterSpacing: '0px' },
                    title:      { fontFamily: sans, fontSize: '16px', lineHeight: '24px', fontWeight: '500', letterSpacing: '0px' },
                    smallTitle: { fontFamily: sans, fontSize: '14px', lineHeight: '20px', fontWeight: '700', letterSpacing: '0px' },
                    body:       { fontFamily: sans, fontSize: '14px', lineHeight: '20px', fontWeight: '400', letterSpacing: '0px' },
                    label:      { fontFamily: sans, fontSize: '11px', lineHeight: '16px', fontWeight: '500', letterSpacing: '1px', textTransform: 'uppercase' },
                    smallLabel: { fontFamily: sans, fontSize: '11px', lineHeight: '16px', fontWeight: '500', letterSpacing: '0px' },
                    mono:       { fontFamily: mono, fontSize: '14px', lineHeight: '20px', fontWeight: '700', letterSpacing: '0px' },
                    latex:      { fontFamily: latex, fontSize: '16px', lineHeight: '24px', fontWeight: '400', letterSpacing: '0px' },
                };
                return styles[name] || styles.body;
            },
            applyFont: (el, name) => { Object.assign(el.style, window.WH.getFontStyles(name)); return el; },
            lerp: (start, end, t) => start * (1 - t) + end * t,
            clamp: (num, min, max) => Math.min(Math.max(num, min), max),
            map: (value, low1, high1, low2, high2) => low2 + (high2 - low2) * (value - low1) / (high1 - low1),
            random: (min, max) => Math.random() * (max - min) + min,
            /**
             * enableDynamicResizing —
             * Called once after createApp finishes building the App Chrome.
             * Checks whether the widget's content height overflows the viewport.
             * If so, unlocks height constraints and sends a one-shot
             * 'widget-resize' message to the parent window. Does nothing
             * if content fits or exceeds 800px. Never shrinks the widget.
             */
            enableDynamicResizing: function() {
                if (this._dynamicResizingEnabled) return;
                this._dynamicResizingEnabled = true;

                requestAnimationFrame(() => requestAnimationFrame(() => {
                    const sh = document.body.scrollHeight;
                    if (sh <= window.innerHeight || sh > 800) return;

                    document.documentElement.style.height = 'auto';
                    document.body.style.height = 'auto';
                    document.body.style.overflowY = 'visible';
                    const root = document.querySelector('.widget-container');
                    if (root) {
                        root.style.height = 'auto';
                        root.style.overflow = 'visible';
                    }
                    const controlGrid = document.querySelector('.control-grid');
                    if (controlGrid) {
                        controlGrid.style.maxHeight = 'none';
                        controlGrid.style.overflowY = 'visible';
                    }

                    requestAnimationFrame(() => {
                        window.parent.postMessage({ type: 'widget-resize', height: document.body.offsetHeight }, '*');
                    });
                }));
            },
            _calibrateLabelWidth: (container) => {
                const labels = container.querySelectorAll('.xxs-row .xxs-label');
                if (!labels.length) return;

                const font = WH.getFontStyles('body');
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                ctx.font = `${font.fontWeight} ${font.fontSize}/${font.lineHeight} ${font.fontFamily}`;

                const widths = Array.from(labels).map(l => ctx.measureText(l.textContent).width);
                widths.sort((a, b) => a - b);

                const p80Index = Math.floor(widths.length * 0.8);
                const p80Width = widths[Math.min(p80Index, widths.length - 1)];

                const padding = 8;
                const raw = p80Width + padding;
                const clamped = Math.min(160, Math.max(80, raw));
                const aligned = Math.ceil(clamped / 4) * 4;

                container.style.setProperty('--s-40', aligned + 'px');
                container.style.setProperty('--s-30', aligned + 'px');
            },
            _getCssValue: (v) => {
                let key = v.toLowerCase().trim();
                if (!key.startsWith('--')) key = '--' + key;
                try {
                    return getComputedStyle(document.documentElement).getPropertyValue(key).trim();
                } catch(e) { return ''; }
            },
            getCssSize: (v, fallback = 0) => {
                const val = window.WH._getCssValue(v);
                if (!val) return fallback;
                if (val.endsWith('rem')) return parseFloat(val) * 16;
                return parseFloat(val) || fallback;
            },
            _el: (e) => (typeof e === 'string' ? document.getElementById(e.startsWith('#') ? e.slice(1) : e) : e),
            _getViz: (e) => {
                 let el = window.WH._el(e);
                 if (!el && typeof e === 'string') {
                     if (e === 'vizTop') el = document.getElementById('viz-top');
                     if (e === 'vizBottom') el = document.getElementById('viz-bottom');
                 }
                 
                 if (el && el.classList.contains('widget-container')) {
                     return el.querySelector('.viz-container') || el.querySelector('#viz') || el;
                 }
                // Fallback: If ID not found, default to main 'viz'
                if (!el && document.getElementById('viz')) return document.getElementById('viz');
                 return el;
            },

            normalizeData: (data) => {
                // Case 1: User passed a single object instead of array
                if (data && !Array.isArray(data) && typeof data === 'object') {
                    return [data];
                }
                // Case 2: User passed simple array of numbers [10, 20, 5] 
                // Plot expects objects often, or needs explicit x/y mapping.
                // We can auto-map simple arrays to objects: [{x:0, y:10}, {x:1, y:20}]
                if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'number') {
                    return data.map((val, i) => ({ x: i, y: val, val: val }));
                }
                return data;
            },

            showError: (msg) => {
                /* console.error(msg); */
            },

            addBadge: (icon, text, isAuto = false) => {
                return;
            },

            createApp: (config) => {
                // Prevent duplicate calls gracefully
                if (window.WH._appCreated) { 
                    console.warn("WH.createApp called twice. Returning existing instance.");
                    return window.WH._activeAppAPI || {};
                }
                window.WH._appCreated = true;

                let state = {}; 
                const root = document.body;
                root.style.cssText = 'height:100%; display:flex; flex-direction:column; overflow:hidden; background-color:var(--surface-container); margin:0;';
                
                const header = document.createElement('div'); 
                /* UPDATE: Use new .widget-header class */
                header.className = 'widget-header'; 
                
                // --- SHELL UPDATE: Structured Header ---
                
                // 1. TOP ROW (Title + Dashboard)
                const headerTop = document.createElement('div');
                headerTop.className = 'header-top';

                const title = document.createElement('h3');
                title.className = 'widget-title';
                WH._renderLabel(title, config.title || 'Widget');
                WH.applyFont(title, 'title');
                headerTop.appendChild(title);

                const dashboard = document.createElement('div');
                dashboard.id = 'widget-dashboard';
                dashboard.className = 'widget-dashboard';
                headerTop.appendChild(dashboard);

                header.appendChild(headerTop);

                // 2. BOTTOM ROW (Status Message)
                const status = document.createElement('div');
                status.id = 'app-status';
                status.className = 'header-status';
                status.style.display = 'none';
                WH.applyFont(status, 'smallLabel');
                header.appendChild(status); 
                
                root.appendChild(header);

                const viz = document.createElement('div'); viz.id = 'viz'; viz.className = 'widget-ui-part viz-container grow bg-surface-container relative overflow-hidden'; 
                const badges = document.createElement('div'); badges.id = 'viz-badges'; badges.className = 'viz-badges'; viz.appendChild(badges); root.appendChild(viz);
                // CHANGE: Removed 'shrink-0', added 'min-h-0' (implied) to allow flex shrinking
                const controls = document.createElement('div'); controls.id = 'controls-root'; controls.className = 'widget-ui-part p-m bg-surface w-full control-grid';
                // CSS fix for flex-shrinking with internal scroll
                controls.style.flex = '0 1 auto'; 
                root.appendChild(controls);

                const api = {
                    vizId: 'viz',
                    setStatus: (t) => { 
                        const el = document.getElementById('app-status'); 
                        if(el) { 
                            // If empty, use non-breaking space to hold height? 
                            // Or collapse? Collapse is cleaner for "Scientific" look.
                            api._renderLabel(el, t);
                            el.style.display = t ? 'block' : 'none';
                            
                            // Optional: Color coding based on content?
                            // e.g. if (t.includes("Complete")) el.style.color = 'var(--positive)';
                        } 
                    },

                    // NEW: The React-Lite HUD Updater
                    _lastDashJson: '',
                    setHUD: (data) => {
                        // 1. Safety Check
                        if (!Array.isArray(data)) return;

                        // 2. Diffing (Prevent DOM Thrashing at 60fps)
                        // We only touch the DOM if values change.
                        // Fast signature check: join values. 
                        // We include color/label in signature to be safe.
                        const signature = JSON.stringify(data);
                        if (signature === api._lastDashJson) return;
                        api._lastDashJson = signature;

                        // 3. Render
                        const el = document.getElementById('widget-dashboard');
                        if (!el) return;

                        el.innerHTML = '';
                        data.forEach(d => {
                            const colorVar = d.color ? window.WH.getColor(d.color) : 'var(--on-surface-default)';

                            let displayVal = d.value;
                            if (typeof d.value === 'number') {
                                displayVal = Number.isInteger(d.value) ? d.value : d.value.toFixed(2);
                            }

                            const pill = document.createElement('div');
                            pill.className = 'dash-pill';

                            const lbl = document.createElement('span');
                            lbl.className = 'dash-label';
                            lbl.textContent = (d.label || '').toUpperCase();
                            WH.applyFont(lbl, 'label');

                            const val = document.createElement('span');
                            val.className = 'dash-value';
                            val.textContent = displayVal;
                            val.style.color = colorVar;
                            WH.applyFont(val, 'mono');

                            pill.appendChild(lbl);
                            pill.appendChild(val);
                            el.appendChild(pill);
                        });
                    },
                    _dedupe: (key) => { if(key) { const e = controls.querySelector('[data-key="' + key + '"]'); if(e) e.remove(); } },
                    
                    // LATEX PARSER: Handles mixed text "Water ($\text{H}_2\text{O$)"
                    _renderLabel: (el, text) => {
                        if (window.katex && text && text.includes('$')) {
                            try {
                                el.innerHTML = text.replace(/\$(.*?)\$/g, (_, tex) => 
                                    katex.renderToString(tex, { throwOnError: false })
                                );
                                return;
                            } catch(e) {}
                        }
                        el.textContent = text;
                    },

                    // 1. SLIDER (Packed)
                    addSlider: (label, opts) => {
                        api._dedupe(opts.key);
                        const row = document.createElement('div'); 
                        row.className = 'xxs-row standard compact'; // FIXED: Compact packing
                        if (opts.key) row.setAttribute('data-key', opts.key);

                        // DEFENSIVE: Force floats
                        let min = parseFloat(opts.min ?? 0);
                        let max = parseFloat(opts.max ?? 100);
                        let stepVal = opts.step;
                        if (stepVal === undefined || stepVal === null) {
                            // Default logic: 0.1 for small ranges, 1 for large
                            stepVal = (max - min <= 10) ? 0.1 : 1;
                            // HEURISTIC: Force integer steps for "Stages", "Index" if NO explicit step was set
                            if (label && /stage|step|frame|index/i.test(label)) {
                                stepVal = 1;
                                min = Math.floor(min);
                                max = Math.ceil(max);
                            }
                        }
                        let step = parseFloat(stepVal);
                        let val = parseFloat(state[opts.key] ?? opts.value ?? (min + max)/2);
                        if (isNaN(val)) val = min;

                        const wrap = document.createElement('div'); wrap.className = 'xxs-slider-wrap';
                        const range = document.createElement('input'); range.type = 'range'; range.className = 'xxs-slider';
                        range.min = min; range.max = max; range.step = step; range.value = val;
                        wrap.appendChild(range);

                        const num = document.createElement('input'); num.type = 'number'; num.className = 'xxs-val-pill';
                        num.min = min; num.max = max; num.step = step; num.value = val;
                        WH.applyFont(num, 'mono');

                        const id = 'ctrl-' + Math.random().toString(36).substr(2, 5);
                        range.id = id;
                        const lbl = document.createElement('label'); 
                        lbl.className = 'xxs-label'; 
                        api._renderLabel(lbl, label);
                        WH.applyFont(lbl, 'body');
                        lbl.title = label;
                        lbl.htmlFor = id;
                        row.append(lbl, wrap, num); controls.appendChild(row);

                        const update = (v) => {
                            const n = parseFloat(v); range.value = n; num.value = n;
                            range.style.setProperty('--progress', ((n - min) / (max - min)) * 100 + '%');
                            if (opts.key && state[opts.key] !== n) state[opts.key] = n;
                        };
                        range.oninput = (e) => update(e.target.value); num.oninput = (e) => update(e.target.value);
                        update(val);
                        if(opts.key) window.addEventListener('widget-state-update', (e) => { if (e.detail.key === opts.key && e.detail.value != range.value) update(e.detail.value); });
                    },

                    addSelect: (label, options, opts) => {
                        api._dedupe(opts.key);
                        const row = document.createElement('div'); row.className = 'xxs-row compact input';
                        const sel = document.createElement('select'); sel.className = 'xxs-select';
                        
                        // 1. Capture options array safely
                        const safeOpts = (Array.isArray(options) ? options : options.options || []);

                        safeOpts.forEach(o => {
                            const val = typeof o === 'object' ? o.value : o, txt = typeof o === 'object' ? o.label : o;
                            const opt = document.createElement('option'); opt.value = val; opt.textContent = txt; sel.appendChild(opt);
                        });

                        sel.value = state[opts.key] != null ? state[opts.key] : (opts.value != null ? opts.value : sel.options[0]?.value);
                        
                        sel.onchange = (e) => { 
                            // DEFENSIVE: Lookup original value by index to preserve Type (String vs Number)
                            // This prevents "Monthly" -> NaN or "2024" -> 2024 auto-conversion bugs
                            const idx = e.target.selectedIndex;
                            let v;
                            if (idx >= 0 && idx < safeOpts.length) {
                                const o = safeOpts[idx];
                                v = typeof o === 'object' ? o.value : o;
                            } else {
                                v = e.target.value; // Fallback
                            }

                            if (opts.key) state[opts.key] = v; 
                        };
                        const id = 'ctrl-' + Math.random().toString(36).substr(2, 5);
                        sel.id = id;
                        const lbl = document.createElement('label');
                        lbl.className = 'xxs-label';
                        api._renderLabel(lbl, label);
                        WH.applyFont(lbl, 'body');
                        lbl.title = label;
                        lbl.htmlFor = id;
                        row.appendChild(lbl);
                        WH.applyFont(sel, 'body');
                        row.appendChild(sel); 
                        controls.appendChild(row);
                        if(opts.key) window.addEventListener('widget-state-update', (e) => { if (e.detail.key === opts.key) sel.value = e.detail.value; });
                    },

                    addToggle: (label, opts) => {
                        api._dedupe(opts.key);
                        const row = document.createElement('div'); 
                        /* UPDATE: Add 'toggle' class, remove inline styles */
                        row.className = 'xxs-row compact toggle';
                        
                        // 1. Create Switch Container
                        const switchEl = document.createElement('div');
                        switchEl.className = 'xxs-switch';
                        switchEl.setAttribute('role', 'switch');
                        switchEl.setAttribute('tabindex', '0'); // Make keyboard focusable
                        switchEl.innerHTML = '<div class="knob"></div>';
                        
                        // 2. State Logic
                        const isTrue = !!(state[opts.key] != null ? state[opts.key] : (opts.value != null ? opts.value : false));
                        
                        const updateUI = (val) => {
                            if (val) switchEl.classList.add('active');
                            else switchEl.classList.remove('active');
                            switchEl.setAttribute('aria-checked', val);
                        };
                        updateUI(isTrue);

                        // 3. Interaction
                        switchEl.onclick = () => {
                            const newVal = !switchEl.classList.contains('active');
                            updateUI(newVal);
                            if (opts.key) state[opts.key] = newVal;
                        };
                        switchEl.onkeydown = (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                switchEl.click();
                            }
                        };

                        // 4. Assemble
                        const lbl = document.createElement('div');
                        lbl.className = 'xxs-label';
                        api._renderLabel(lbl, label);
                        WH.applyFont(lbl, 'body');
                        lbl.title = label;

                        row.appendChild(lbl);
                        row.appendChild(switchEl);
                        controls.appendChild(row);

                        if(opts.key) window.addEventListener('widget-state-update', (e) => { if (e.detail.key === opts.key) updateUI(!!e.detail.value); });
                    },

                    addInput: (label, value, type, onChange) => {
                        const row = document.createElement('div'); row.className = 'xxs-row compact input';
                        const input = document.createElement('input'); input.type = type; input.value = value;
                        input.className = type === 'color' ? 'xxs-color' : 'xxs-input';
                        input.oninput = (e) => onChange(e.target.value);
                        const id = 'ctrl-' + Math.random().toString(36).substr(2, 5);
                        input.id = id;
                        const lbl = document.createElement('label');
                        lbl.className = 'xxs-label';
                        api._renderLabel(lbl, label);
                        WH.applyFont(lbl, 'body');
                        lbl.title = label;
                        lbl.htmlFor = id;
                        if (type !== 'color') WH.applyFont(input, 'body');
                        row.appendChild(lbl);
                        row.appendChild(input); 
                        controls.appendChild(row);
                    },

                    addSegmentedControl: (label, options, opts) => {
                        api._dedupe(opts.key);
                        const row = document.createElement('div'); 
                        /* UPDATE: Add 'segmented' class for specific width tuning */
                        row.className = 'xxs-row compact input segmented';
                        const group = document.createElement('div'); group.className = 'xxs-btn-group';
                        const optsData = Array.isArray(options) ? options : (options.options || []);
                        const buttons = [];
                        let currentVal = state[opts.key] != null ? state[opts.key] : (typeof optsData[0] === 'object' ? optsData[0].value : optsData[0]);
                        const syncUI = (val) => {
                            buttons.forEach(({btn, v}) => {
                                if (v == val) btn.classList.add('selected'); else btn.classList.remove('selected');
                            });
                        };
                        optsData.forEach(o => {
                            const val = typeof o === 'object' ? o.value : o, txt = typeof o === 'object' ? o.label : o;
                            const btn = document.createElement('button');
                            btn.className = 'xxs-btn'; btn.textContent = txt;
                            btn.onclick = () => { syncUI(val); if (opts.key) state[opts.key] = val; };
                            buttons.push({btn, v: val}); group.appendChild(btn);
                        });
                        syncUI(currentVal);
                        const lblDiv = document.createElement('div');
                        lblDiv.className = 'xxs-label';
                        lblDiv.title = label;
                        api._renderLabel(lblDiv, label);
                        WH.applyFont(lblDiv, 'body');
                        row.appendChild(lblDiv);
                        row.appendChild(group);
                        controls.appendChild(row);
                        if(opts.key) window.addEventListener('widget-state-update', (e) => { if (e.detail.key === opts.key) syncUI(e.detail.value); });
                    },

                    addSection: (title) => {
                        const row = document.createElement('div'); row.className = 'xxs-row header';
                        const div = document.createElement('div'); div.className = 'xxs-section-title'; 
                        api._renderLabel(div, title);
                        WH.applyFont(div, 'label');
                        row.appendChild(div); controls.appendChild(row);
                    },
                    // 7. ACTION BUTTON (Smart Packing)
                    addButton: (label, onClick, variant) => {
                        // 1. Search for any existing button cells to find the last one (Logic: Group all buttons)
                        const buttonCells = controls.querySelectorAll('.xxs-button-cell');
                        let targetRow = buttonCells.length > 0 ? buttonCells[buttonCells.length - 1] : null;

                        if (targetRow && targetRow.children.length < 2) {
                            // Pack into existing cell
                        } else {
                            // Create new cell
                            targetRow = document.createElement('div');
                            // FULL WIDTH: Use 'full' instead of 'compact'
                            targetRow.className = 'xxs-row full xxs-button-cell';
                            targetRow.style.display = 'flex'; // Override grid
                            targetRow.style.gap = '8px';
                            controls.appendChild(targetRow);
                        }

                        const btn = document.createElement('button');
                        const isPrimary = variant === 'primary';
                        btn.className = 'xxs-btn ' + (isPrimary ? 'selected' : ''); 
                        btn.textContent = label;
                        btn.title = label;
                        btn.onclick = onClick;
                        WH.applyFont(btn, 'body');
                        
                        // Layout: Share space equally
                        btn.style.width = '100%';
                        btn.style.flex = '1'; 
                        
                        targetRow.appendChild(btn);
                    },
                    
                    // DEFENSIVE: Polyfill addButtonGroup for hallucinations
                    addButtonGroup: (btns) => {
                        if (Array.isArray(btns)) {
                            btns.forEach(b => {
                                // Map common hallucinations to 'label'
                                const label = b.label || b.text || b.name || b.caption || "Button";
                                const action = b.action || b.onClick || b.callback || (() => {});
                                api.addButton(label, action, b.variant);
                            });
                        }
                    },

                    updateButton: (label, newLabel) => {
                        const btns = Array.from(controls.querySelectorAll('button'));
                        const b = btns.find(x => x.textContent === label);
                        if(b) b.textContent = newLabel;
                    },
                    updateSlider: (label, val) => {
                        const labels = Array.from(controls.querySelectorAll('.xxs-label'));
                        const lbl = labels.find(x => x.textContent === label);
                        if(lbl) {
                            const row = lbl.closest('.xxs-row');
                            const inp = row.querySelector('input[type=range]');
                            if(inp) { inp.value = val; inp.dispatchEvent(new Event('input')); }
                        }
                    },
                    splitViz: (fraction = 0.5) => {
                        const viz = document.getElementById('viz');
                        viz.innerHTML = ''; viz.style.display = 'flex'; viz.style.flexDirection = 'column';
                        let size = typeof fraction === 'number' ? (fraction * 100) + '%' : fraction;
                        const top = document.createElement('div'); top.id = 'viz-top'; top.className = 'relative overflow-hidden'; top.style.height = size; top.style.flexShrink = '0';
                        const bottom = document.createElement('div'); bottom.id = 'viz-bottom'; bottom.className = 'grow relative overflow-hidden border-t bg-surface'; 
                        bottom.style.width = '100%';
                        viz.appendChild(top); viz.appendChild(bottom);
                        const badges = document.createElement('div'); badges.id = 'viz-badges'; badges.className = 'viz-badges'; top.appendChild(badges);
                        return { vizTop: 'viz-top', vizBottom: 'viz-bottom' };
                    }
                };

                if (config.params) {
                   const initialState = {};
                   // UPDATE UI Elements: Filter out buttons/headers from State (Data only)
                   Object.entries(config.params).forEach(([k, v]) => {
                       if (v.type !== 'button' && v.type !== 'header') {
                           initialState[k] = (typeof v === 'object' && v !== null && 'value' in v) ? v.value : v;
                       }
                   });
                   // Defensive: For any variables declared outside the params in config.
                   const reserved = ['title', 'params', 'state'];
                   Object.keys(config).forEach(k => {
                       if (!reserved.includes(k)) {
                           initialState[k] = config[k];
                       }
                   });
                   state = window.WH.createState(initialState);
                   
                   Object.entries(config.params).forEach(([key, conf]) => {
                       const label = conf.label || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();
                       const opts = { key, ...conf };
                       if (conf.type === 'header') api.addSection(label);
                       else if (conf.type === 'segmented') api.addSegmentedControl(label, conf.options, opts);
                       
                       /* UPDATE: Handle raw numbers as inputs if no min/max provided */
                       else if (['color','text','date','number'].includes(conf.type) || (typeof conf.value === 'number' && (conf.min === undefined || conf.max === undefined))) {
                           api.addInput(label, conf.value, conf.type === 'number' ? 'number' : conf.type, (v) => { 
                               if(state) state[key] = (conf.type === 'number' || typeof conf.value === 'number') ? (parseFloat(v) || 0) : v; 
                           });
                       }
                       
                       /* UPDATE: Inline Grid Buttons */
                       else if (conf.type === 'button') {
                           // UPDATE: Buttons are self-labeling. Don't create a side label.
                           // Just pack the button into a row.
                           const row = document.createElement('div'); 
                           row.className = 'xxs-row compact'; // No 'input' grid, just flex/grid
                           // Actually, let's just make it full width or standard button cell?
                           // Let's use the standard button logic but inline.
                           
                           const btn = document.createElement('button');
                           btn.className = 'xxs-btn'; 
                           btn.textContent = label; // Use the provided label as button text
                           btn.title = label;
                           btn.onclick = () => { if (conf.onClick) conf.onClick(state); };
                           
                           // If we want it to align with inputs, we can put an empty label?
                           // No, buttons usually span or sit alone.
                           // Let's just make the button fill the row for now.
                           btn.style.width = '100%';
                           row.appendChild(btn); 
                           controls.appendChild(row);
                       }
                       else if (conf.options) {
                            // SMART UI: Analyze options to pick the best control
                            const optsList = conf.options;
                            const count = optsList.length;
                            // Calculate total text length to ensure it fits on one line
                            const totalChars = optsList.reduce((acc, o) => acc + (typeof o === 'object' ? o.label.length : o.length), 0);
                            
                            // Threshold: 2-3 items, less than 25 chars total -> Segmented Control
                            if (count >= 2 && count <= 3 && totalChars < 20) {
                                api.addSegmentedControl(label, conf.options, opts);
                            } else {
                                api.addSelect(label, conf.options, opts);
                            }
                       }
                       else if (typeof conf.value === 'boolean') api.addToggle(label, opts);
                       else if (typeof conf.value === 'number') api.addSlider(label, opts);
                   });
                }

                WH._calibrateLabelWidth(controls);

                api.state = state; 
                // api.ui will be handled by the proxy getter to return 'this'
                api.then = (cb) => { if (cb) setTimeout(() => cb(api), 0); return api; };
                
                const proxy = new Proxy(api, { 
                    get: (t, p) => {
                        // DEFENSIVE: Return the proxy itself when 'ui' is requested
                        if (p === 'ui') return proxy;
                        if (p in t) return t[p];
                        // Fallback: Silent no-op for hallucinations
                        return (['canvas','ctx','controls'].includes(p) ? null : () => {});
                    }
                });
                window.WH._activeAppAPI = proxy;
                window.WH.enableDynamicResizing();
                return window.WH._activeAppAPI;
            },

            createState: (initialObj) => {
                const listeners = new Set();
                // TRACKING: Keep track of which keys are currently firing events
                const notifyingKeys = new Set();
                
                const proxy = new Proxy(initialObj, {
                    set: (target, prop, value) => {
                        if (target[prop] === value) return true;
                        target[prop] = value;
                        
                        // RECURSION GUARD:
                        // If we are already notifying listeners about this property,
                        // and a listener sets it again (e.g. resets to false),
                        // we update the value but suppress the second event to prevent loops.
                        if (notifyingKeys.has(prop)) {
                            return true;
                        }

                        notifyingKeys.add(prop);
                        try {
                            listeners.forEach(fn => fn(prop, value));
                            
                            // Also dispatch DOM event for global hooks
                            window.dispatchEvent(new CustomEvent('widget-state-update', { 
                                detail: { key: prop, value: value } 
                            }));
                        } finally {
                            notifyingKeys.delete(prop);
                        }
                        return true;
                    }
                });
                proxy._subscribe = (fn) => listeners.add(fn);
                
                window.WH._activeState = proxy;
                return proxy;
            },

            el: (e) => window.WH._el(e),
            setText: (id, t) => { const e = window.WH._el(id); if(e) e.textContent = t; },
            on: (id, ev, fn) => { const e = window.WH._el(id); if(e) e.addEventListener(ev, fn); },
            
            renderMath: (idOrEl, latex) => {
                if(!window.katex) return;
                const el = window.WH._el(idOrEl); 
                if(!el) return;
                try { 
                    katex.render(latex, el, { throwOnError: false }); 
                } catch(e) { 
                    el.textContent = latex; 
                }
            },

            getColor: (v) => {
                if (!v) return 'transparent';
                if (typeof v !== 'string') return 'transparent';
                if (v === 'transparent' || v.startsWith('#') || v.startsWith('rgb') || v.startsWith('hsl')) return v;


                let key = v.toLowerCase().trim();
                if (!key.startsWith('--')) key = '--' + key;


                const TOKENS = {
                    '--bg': '--surface', '--background': '--surface', '--main-bg': '--surface',
                    '--panel': '--surface-container', '--bg-panel': '--surface-container',
                    '--card': '--surface-container', '--card-bg': '--surface-container', 
                    '--modal': '--surface-container-high',

                    '--text': '--on-surface-default', '--foreground': '--on-surface-default', '--fg': '--on-surface-default',
                    '--text-primary': '--on-surface-default', '--header': '--on-surface-default',
                    '--text-secondary': '--on-surface-de-emphasis', '--subheader': '--on-surface-de-emphasis',
                    '--text-muted': '--on-surface-de-emphasis', '--muted': '--on-surface-de-emphasis',
                    
                    '--on-surface-variant': '--on-surface-de-emphasis',
                    '--on-surface-medium': '--on-surface-de-emphasis',

                    '--accent': '--primary', '--brand': '--primary', '--info': '--primary',
                    '--highlight-bg': '--highlight', '--selection': '--highlight',
                    '--primary-bg': '--primary-container', '--bg-primary': '--primary-container',

                    '--border': '--stroke-default', '--divider': '--stroke-default', '--separator': '--stroke-default',
                    '--border-active': '--stroke-emphasis',

                    '--success': '--positive', '--bg-success': '--positive-surface',
                    '--error': '--negative', '--danger': '--negative', '--bg-error': '--negative-surface',
                    '--warning': '--warning',

                    '--grey': '--stroke-emphasis', '--gray': '--stroke-emphasis',
                    '--neutral': '--surface-container-high',

                    '--chart-blue': '--chart-1', '--chart-green': '--chart-2', '--chart-yellow': '--chart-3',
                    '--chart-red': '--chart-4', '--chart-purple': '--chart-5', '--chart-orange': '--chart-6',
                    '--blue': '--chart-1', '--purple': '--chart-5',

                    '--red': '--anno-red', '--green': '--anno-green', '--yellow': '--anno-yellow',
                    '--orange': '--anno-orange', '--cyan': '--anno-cyan', '--pink': '--anno-pink',
                };

                const target = TOKENS[key] || key;

                let c = getComputedStyle(document.documentElement).getPropertyValue(target).trim();

                if (!c) {
                    if (key.includes('text') || key.includes('fg') || key.includes('on-surface')) c = getComputedStyle(document.documentElement).getPropertyValue('--on-surface-default').trim();
                    else if (key.includes('bg') || key.includes('surface')) c = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
                    else if (key.includes('border')) c = getComputedStyle(document.documentElement).getPropertyValue('--stroke-default').trim();
                    else c = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
                }

                return c;
            },
            
            transparent: (c, op) => {
                if (window.d3 && d3.color) {
                    const col = d3.color(window.WH.getColor(c));
                    if(col) { col.opacity = op; return col.toString(); }
                }
                return window.WH.getColor(c);
            },
         
            getFont: (type) => {
                const family = getComputedStyle(document.body).getPropertyValue('--ff-sans') || 'sans-serif';
                switch (type) {
                    case 'header': return '500 16px ' + family;       // UI Titles
                    case 'value':  return '700 32px monospace';       // Big Stats
                    case 'label':  return '500 11px ' + family;       // Axis/Ticks
                    case 'code':   return '400 12px monospace';       // Inline code
                    default:       return '400 13px ' + family;       // Body text
                }
            },

            // Helper to interpolate between CSS variables (e.g., ['--chart-2', '--chart-4'])
            createScale: (tokens) => {
                if (!window.d3) return () => '#000000';
                const colors = tokens.map(t => window.WH.getColor(t));
                const domain = tokens.map((_, i) => i / (tokens.length - 1));
                return d3.scaleLinear().domain(domain).range(colors);
            },

            // LATEX PARSER: Handles mixed text "Water ($\text{H}_2\text{O$)"
            _renderLabel: (el, text) => {
                if (window.katex && text && text.includes('$')) {
                    try {
                        // DEFENSIVE REGEX:
                        // Only render if content contains LaTeX triggers (\, _, ^, {)
                        // This avoids corrupting currency labels like "Range: $10 - $100"
                        el.innerHTML = text.replace(/\$([^\$]*?[\\^_{}][^\$]*?)\$/g, (_, tex) => 
                            katex.renderToString(tex, { throwOnError: false })
                        );
                        return;
                    } catch(e) {}
                }
                el.textContent = text;
            },

            createTextSprite: (text, fontsize = 24) => {
                if (!window.THREE) return null;
                
                const padding = 12;
                const border = 4;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                ctx.font = 'bold ' + fontsize + 'px sans-serif';
                const metrics = ctx.measureText(text);
                const textWidth = metrics.width;
                
                const w = textWidth + (padding * 2);
                const h = fontsize + (padding * 2);
                canvas.width = w;
                canvas.height = h;
                
                ctx.fillStyle = "rgba(20, 20, 20, 0.75)"; // High contrast pill
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(0, 0, w, h, h/2);
                } else {
                    // Fallback for older browsers
                    ctx.rect(0, 0, w, h);
                }
                ctx.fill();
                
                ctx.font = 'bold ' + fontsize + 'px sans-serif';
                ctx.fillStyle = "#ffffff";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(text, w/2, h/2 + 2); // +2 adjustment for visual center

                const texture = new THREE.CanvasTexture(canvas);
                texture.minFilter = THREE.LinearFilter;
                
                const material = new THREE.SpriteMaterial({ 
                    map: texture, 
                    transparent: true,
                    depthTest: false
                });
                
                const sprite = new THREE.Sprite(material);
                
                const scaleFactor = 0.02 * (fontsize / 24); 
                sprite.scale.set(w * scaleFactor, h * scaleFactor, 1);
                
                return sprite;
            },
            
            _createSafeCtx: (realCtx, widthFn, heightFn) => {
                // 1. Retina Scaling Helpers
                let _scalingCanvas = null;
                let _scalingCtx = null;

                // 2. Lazy Clear State
                let _autoClearEnabled = true;
                let _hasCleared = false;

                // 3. Methods that output pixels (triggering a clear)
                const DRAW_METHODS = new Set([
                    'fillRect', 'strokeRect', 'clearRect', 
                    'fill', 'stroke', 
                    'fillText', 'strokeText', 
                    'drawImage', 'putImageData', 'drawTag'
                ]);

                return new Proxy(realCtx, {
                    get(target, prop) {
                        // DEFENSIVE: Smart Context Props
                        if (prop === 'width') return widthFn();
                        if (prop === 'height') return heightFn();
                        if (prop === 'center') return { x: widthFn()/2, y: heightFn()/2 };
                        
                        // INTERNAL CONTROLS
                        if (prop === 'setAutoClear') return (val) => { _autoClearEnabled = !!val; };
                        if (prop === '_resetLazyClear') return () => { _hasCleared = false; };
                        
                        // INTERCEPT: fillText (Auto-Halo + Collision Registration)
                        // Automatically draws a background stroke so text pops off busy diagrams
                        // AND registers the text area as an obstacle for smart labels
                        if (prop === 'fillText') {
                            return (text, x, y, maxWidth) => {
                                // Trigger lazy clear if drawing
                                if (_autoClearEnabled && !_hasCleared) {
                                    target.save();
                                    target.resetTransform();
                                    target.clearRect(0, 0, target.canvas.width, target.canvas.height);
                                    target.restore();
                                    _hasCleared = true;
                                }
                                
                                const currentFill = target.fillStyle;
                                const surfaceColor = window.WH.getColor('--surface');
                                
                                // HEURISTIC: Only draw halo if text contrasts with the background halo.
                                // If text is white and background is white (Light Mode), skip halo.
                                // If text is black and background is white, draw halo (to clear grid lines).
                                // We do a rough string check (assuming canonical hex/var usage).
                                
                                // Resolve vars to compare
                                const c1 = (typeof currentFill === 'string' && currentFill.startsWith('var')) ? window.WH.getColor(currentFill) : currentFill;
                                const c2 = surfaceColor;

                                if (typeof c1 === 'string' && typeof c2 === 'string' && c1.toLowerCase() !== c2.toLowerCase() && c1 !== '#ffffff' && c1 !== 'white') {
                                    target.save();
                                    target.lineJoin = 'round';
                                    target.miterLimit = 2;
                                    target.lineWidth = 2.5; // Thinner halo
                                    target.strokeStyle = surfaceColor; 
                                    target.globalAlpha = 0.8; // Softer
                                    target.strokeText(text, x, y, maxWidth);
                                    target.restore();
                                }

                                target.fillText(text, x, y, maxWidth);
                                
                                // COLLISION SYSTEM: Register this text as an obstacle
                                // We attach this array to the real context in initCanvas
                                if (target._textObstacles) {
                                    const m = target.measureText(text);
                                    const w = m.width + 10; // Add breathing room
                                    const h = 24; // Approx height
                                    
                                    // Normalize coordinates based on alignment
                                    let ox = x;
                                    let oy = y;
                                    if (target.textAlign === 'center') ox -= w/2;
                                    else if (target.textAlign === 'right') ox -= w;
                                    if (target.textBaseline === 'middle') oy -= h/2;
                                    else if (target.textBaseline === 'bottom') oy -= h;
                                    
                                    target._textObstacles.push({x: ox, y: oy, w, h});
                                }
                            };
                        }

                        // TRAP: putImageData (Needs both Lazy Clear AND Retina Scaling)
                        if (prop === 'putImageData') {
                            return (imgData, dx, dy) => {
                                // A. Trigger Lazy Clear
                                if (_autoClearEnabled && !_hasCleared) {
                                    // Clear using raw canvas dims to be safe against transforms
                                    target.save();
                                    target.resetTransform();
                                    target.clearRect(0, 0, target.canvas.width, target.canvas.height);
                                    target.restore();
                                    _hasCleared = true;
                                }

                                // B. Handle Retina Scaling
                                const logicalWidth = widthFn();
                                const isLogicalSize = (Math.abs(imgData.width - logicalWidth) < 1);
                                const dpr = window.devicePixelRatio || 1;
                                
                                if (dpr > 1 && isLogicalSize) {
                                    if (!_scalingCanvas) {
                                        _scalingCanvas = document.createElement('canvas');
                                        _scalingCtx = _scalingCanvas.getContext('2d');
                                    }
                                    if (_scalingCanvas.width !== imgData.width || _scalingCanvas.height !== imgData.height) {
                                        _scalingCanvas.width = imgData.width;
                                        _scalingCanvas.height = imgData.height;
                                    }
                                    _scalingCtx.putImageData(imgData, 0, 0);
                                    // drawImage respects the context transform (unlike putImageData)
                                    target.drawImage(_scalingCanvas, dx, dy);
                                } else {
                                    target.putImageData(imgData, dx, dy);
                                }
                            };
                        }

                        const value = target[prop];
                        if (typeof value === 'function') {
                            return (...args) => {
                                // TRAP: General Drawing Methods
                                if (DRAW_METHODS.has(prop) && _autoClearEnabled && !_hasCleared) {
                                    if (prop !== 'clearRect') {
                                        target.save();
                                        target.resetTransform();
                                        target.clearRect(0, 0, target.canvas.width, target.canvas.height);
                                        target.restore();
                                    }
                                    _hasCleared = true;
                                }

                                // 1. NaN Protection
                                for (let arg of args) {
                                    if (typeof arg === 'number' && !Number.isFinite(arg)) return;
                                }
                                if (prop === 'arc' && args.length > 2 && args[2] < 0) args[2] = Math.abs(args[2]);
                                
                                return value.apply(target, args);
                            };
                        }
                        return value; 
                    },
                    set(target, prop, value) {
                    if (prop === 'font' && typeof value === 'string') {
                            // 1. PARSE: Extract the requested size (e.g. "bold 80px monospace")
                            // We look for the first number followed by 'px'
                            const sizeMatch = value.match(/(\d+(\.\d+)?)px/);
                            let size = 12; // Default
                            let weight = ''; // Default normal
                            
                            if (sizeMatch) {
                                size = parseFloat(sizeMatch[1]);
                            }
                            
                            // Detect bold request
                            if (value.includes('bold') || value.includes('700')) {
                                weight = 'bold ';
                            }

                            // 2. POLICE: Clamp the size to a safe range 
                            if (value.includes('Material Icons') || value.includes('Material Symbols') || value.includes('Google Symbols')) {
                                const safeSize = Math.min(Math.max(size, 10), 48);
                                value = `${weight}${safeSize}px "Google Symbols"`;
                            } else if (value.includes('monospace')) {
                                const safeSize = Math.min(Math.max(size, 10), 20);
                                value = `${weight}${safeSize}px monospace`;
                            } else {
                                const safeSize = Math.min(Math.max(size, 10), 20);
                                const brandFont = getComputedStyle(document.body).getPropertyValue('--ff-sans') || 'sans-serif';
                                value = `${weight}${safeSize}px ${brandFont}`;
                            }
                        }

                        // Pass through to the real context
                        target[prop] = value;
                        return true;
                    }
                });
            },
            
            initCanvas: (ctr, onSetup, options = {}) => {
                let el = window.WH._getViz(ctr); if(!el) return;
                
                // DEFENSIVE: Check if a canvas already exists (e.g. Three.js background)
                let c = el.querySelector('canvas');
                let isOverlay = false;

                // If existing canvas is WebGL (Three.js), we must create a NEW canvas on top for 2D
                if (c && c.getAttribute('data-engine')) {
                    isOverlay = true;
                    c = document.createElement('canvas');
                    c.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;touch-action:none;pointer-events:none;'; // Pass clicks through
                    try { el.appendChild(c); } catch(e) { 
                        setTimeout(() => { try { el.appendChild(c); } catch(e2){} }, 0);
                    }
                } else if (c) {
                    // DEFENSIVE CHANGE: Reuse the existing canvas!
                    // Do NOT remove it. This keeps the 'ctx' reference held by any closures valid.
                    // We just reset style to be sure.
                    c.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;touch-action:none;outline:none';
                } else {
                    // Fresh canvas
                    c = document.createElement('canvas');
                    c.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;touch-action:none;outline:none';
                    try { el.appendChild(c); } catch(e) { 
                        setTimeout(() => { try { el.appendChild(c); } catch(e2){} }, 0);
                    }
                }
                
                const realCtx = c.getContext('2d', { alpha: options.alpha !== false });

                if (!realCtx.roundRect) {
                    realCtx.roundRect = function(x, y, w, h, r) {
                        if (w < 2 * r) r = w / 2;
                        if (h < 2 * r) r = h / 2;
                        this.beginPath();
                        this.moveTo(x + r, y);
                        this.arcTo(x + w, y, x + w, y + h, r);
                        this.arcTo(x + w, y + h, x, y + h, r);
                        this.arcTo(x, y + h, x, y, r);
                        this.arcTo(x, y, x + w, y, r);
                        this.closePath();
                        return this;
                    };
                }

                // HUD LAYER (DOM Overlay)
                let hud = el.querySelector('.viz-hud');
                if (!hud) {
                    hud = document.createElement('div');
                    hud.className = 'viz-hud';
                    // CSS: Overlay on top of canvas, ignore clicks, contain layout
                    hud.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:10;contain:layout style;';
                    el.appendChild(hud);
                }
                
                const labelPool = [];
                let activeLabels = [];
                const labelCache = new Map(); // Smooths movement between frames
                
                // Initialize Obstacle Array on the Context for the Trap to find
                realCtx._textObstacles = [];
                
                // API: Just push data, render later in loop
                // --- SHELL UPDATE: Rigid Badge (drawTag) ---
                // Use for labeling static points (e.g. current value on a bar)
                realCtx.drawTag = (text, x, y, color = '--on-surface-default') => {
                    realCtx.save();
                    const c = window.WH.getColor(color);

                    // 1. Measure First
                    const fs = window.WH.getFontStyles('label');
                    if (fs.textTransform === 'uppercase') text = text.toUpperCase();
                    realCtx.font = fs.fontWeight + ' ' + fs.fontSize + ' ' + fs.fontFamily;
                    const metric = realCtx.measureText(text);
                    const padX = window.WH.getCssSize('--s-3', 12);
                    const w = metric.width + padX * 2;
                    const h = window.WH.getCssSize('--s-6-5', 26);

                    // 2. Clamp Coordinates (Keep inside LogicW/LogicH)
                    const edgePad = window.WH.getCssSize('--s-1', 4);

                    let drawX = x;
                    if (drawX - w/2 < edgePad) drawX = w/2 + edgePad;
                    else if (drawX + w/2 > logicW - edgePad) drawX = logicW - w/2 - edgePad;

                    let drawY = y;
                    if (drawY - h/2 < edgePad) drawY = h/2 + edgePad;
                    else if (drawY + h/2 > logicH - edgePad) drawY = logicH - h/2 - edgePad;

                    realCtx.translate(drawX, drawY);

                    // 3. Draw Background
                    realCtx.fillStyle = window.WH.transparent('--surface', 0.95);
                    realCtx.strokeStyle = c;
                    realCtx.lineWidth = 1.5;

                    realCtx.beginPath();
                    if (realCtx.roundRect) realCtx.roundRect(-w/2, -h/2, w, h, 999);
                    else realCtx.rect(-w/2, -h/2, w, h);
                    realCtx.fill();
                    realCtx.stroke();

                    // 4. Draw Text
                    realCtx.fillStyle = window.WH.getColor('--on-surface-default');
                    realCtx.textAlign = 'center';
                    realCtx.textBaseline = 'middle';
                    realCtx.fillText(text, 0, 1);

                    realCtx.restore();
                };

                // --- SHELL UPDATE: Generic Design Primitives ---

                // --- SHELL FIX: Micro HUD (Stable) ---
                // --- SHELL FIX: Micro HUD (Stable) ---
                // REMOVED: Replaced by ui.setHUD (Cockpit Header)
                // realCtx.drawHUD = ...

                // 2. Standard Vector Arrow
                // Solves: "Bad Trig", "Ugly Triangles", "Inconsistent Lines"
                realCtx.drawArrow = (x, y, dx, dy, color = '--primary') => {
                    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return; // Hide tiny vectors

                    realCtx.save();
                    realCtx.strokeStyle = window.WH.getColor(color);
                    realCtx.fillStyle = window.WH.getColor(color);
                    realCtx.lineWidth = 2;
                    realCtx.lineCap = 'round';
                    realCtx.lineJoin = 'round';

                    const endX = x + dx;
                    const endY = y + dy;
                    const angle = Math.atan2(dy, dx);
                    const headLen = 8; // Standard size

                    // Shaft
                    realCtx.beginPath();
                    realCtx.moveTo(x, y);
                    realCtx.lineTo(endX, endY);
                    realCtx.stroke();

                    // Head
                    realCtx.beginPath();
                    realCtx.moveTo(endX, endY);
                    realCtx.lineTo(endX - headLen * Math.cos(angle - Math.PI / 6), endY - headLen * Math.sin(angle - Math.PI / 6));
                    realCtx.lineTo(endX - headLen * Math.cos(angle + Math.PI / 6), endY - headLen * Math.sin(angle + Math.PI / 6));
                    realCtx.closePath();
                    realCtx.fill();

                    realCtx.restore();
                };
                
                const safeCtx = window.WH._createSafeCtx(realCtx, () => c.width / (window.devicePixelRatio||1), () => c.height / (window.devicePixelRatio||1));

                // DEFENSIVE: Reuse listeners if we are recycling the canvas
                if (!c._listenersAttached) {
                    c._listenersAttached = true;
                    const existingCanvasListeners = new Set();
                    const originalCanvasAddEventListener = c.addEventListener;
                    c.addEventListener = (type, fn, options) => {
                        const key = type + fn.toString();
                        if (existingCanvasListeners.has(key)) return;
                        existingCanvasListeners.add(key);
                        originalCanvasAddEventListener.call(c, type, fn, options);
                    };
                }

                const pointer = { x: -1000, y: -1000, isDown: false, justPressed: false, justReleased: false };
                Object.defineProperties(pointer, {
                    'down': { get: () => pointer.isDown },
                    'up':   { get: () => pointer.justReleased }, 
                    'primary': { get: () => pointer.isDown },
                    // 1. Pixels (Standard)
                    'px': { get: () => pointer.x },
                    'py': { get: () => pointer.y },
                    // 2. Normalized 0 to 1 (Aliases: nx/ny AND uv)
                    'nx': { get: () => window.WH.clamp(pointer.x / (logicW||1), 0, 1) },
                    'ny': { get: () => window.WH.clamp(pointer.y / (logicH||1), 0, 1) },
                    'uv': { get: () => ({ x: window.WH.clamp(pointer.x / (logicW||1), 0, 1), y: window.WH.clamp(pointer.y / (logicH||1), 0, 1) }) },
                    // 3. Normalized -1 to 1 (Raycasting/Shader ready)
                    'ndc': { get: () => ({ x: (pointer.x / (logicW||1)) * 2 - 1, y: -(pointer.y / (logicH||1)) * 2 + 1 }) }
                });

                let logicW=0, logicH=0, offX=0, offY=0, safeH=0;

                const updatePointer = (e, isDownVal) => {
                     const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
                     const clientY = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;
                     if (typeof clientX !== 'number') return;
                     const r = c.getBoundingClientRect();
                     pointer.x = (clientX - r.left) - offX;
                     pointer.y = (clientY - r.top) - offY;
                     if (isDownVal !== undefined) pointer.isDown = isDownVal;
                };
                c.addEventListener('mousedown', (e) => { pointer.justPressed = true; updatePointer(e, true); });
                c.addEventListener('mousemove', (e) => updatePointer(e));
                c.addEventListener('mouseup',   (e) => { pointer.isDown = false; pointer.justReleased = true; });
                c.addEventListener('mouseleave',(e) => { pointer.isDown = false; pointer.x = -1000; pointer.y = -1000; });
                c.addEventListener('touchstart', (e) => { pointer.justPressed = true; updatePointer(e, true); e.preventDefault(); }, {passive:false});
                c.addEventListener('touchmove',  (e) => { updatePointer(e); e.preventDefault(); }, {passive:false});
                c.addEventListener('touchend',   (e) => { pointer.isDown = false; pointer.justReleased = true; e.preventDefault(); }, {passive:false});

                let active=true, loopFn=null, isSetup=false;
                const updateSize = () => {
                     const r = el.getBoundingClientRect();
                     
                     // DEFENSIVE: Zero-Gate. Block execution if layout isn't ready.
                     // This prevents init with 0x0 dimensions (Race Condition #1)
                     if (r.width === 0 && r.height === 0) return;
                     
                     const dpr = window.devicePixelRatio || 1;
                     const W = r.width;
                     const H = r.height;
                     c.width = W * dpr; c.height = H * dpr;
                     
                     if (options.aspectRatio) {
                         if (W / H > options.aspectRatio) { logicH = H; logicW = H * options.aspectRatio; offX = (W - logicW) / 2; offY = 0; }
                         else { logicW = W; logicH = W / options.aspectRatio; offX = 0; offY = (H - logicH) / 2; }
                     } else { logicW = W; logicH = H; offX = 0; offY = 0; }
                     // Add safety margin to prevent content from being cut off
                     const BOTTOM_PAD = 16;
                     safeH = logicH - BOTTOM_PAD;

                     if (!isSetup) {
                         isSetup = true;
                         try { 
                             // DEFENSIVE: Support ({ ctx, width }) in setup
                             if (safeCtx) {
                                 safeCtx.ctx = safeCtx;
                                 safeCtx.width = logicW;
                                 safeCtx.height = safeH;
                                 safeCtx.pointer = pointer;
                             }
                             loopFn = onSetup(safeCtx, logicW, safeH, pointer); 
                         } catch(e) { window.WH.showError(e.message); active=false; }
                     }
                };
                new ResizeObserver(updateSize).observe(el); 

                let lastTime = null;
                const MAX_FRAME_TIME = 100; 
                let consecutivelySlowFrames = 0;
                
                const loop = (t) => {
                    if(!active) return;
                    
                    // RESET LABELS: Clear the queue for this frame
                    activeLabels.length = 0;
                    realCtx._textObstacles.length = 0; // Clear static text obstacles

                    // 1. Detect Badges as Obstacles
                    const badgeContainer = el.querySelector('.viz-badges');
                    if (badgeContainer && badgeContainer.children.length > 0) {
                         const r = c.getBoundingClientRect(); 
                         Array.from(badgeContainer.children).forEach(b => {
                             const br = b.getBoundingClientRect();
                             const bx = (br.left - r.left) - offX;
                             const by = (br.top - r.top) - offY;
                             if (bx < logicW && by < logicH) {
                                 realCtx._textObstacles.push({ x: bx, y: by, w: br.width, h: br.height });
                             }
                         });
                    }

                    const start = performance.now();
                    if (lastTime === null) lastTime = t;
                    const dtMs = Math.min(t - lastTime, 100); 
                    lastTime = t;

                    if (isSetup && typeof loopFn === 'function') {
                        const dpr = window.devicePixelRatio || 1;
                        realCtx.resetTransform();
                        safeCtx._resetLazyClear();
                        
                        realCtx.setTransform(dpr, 0, 0, dpr, offX * dpr, offY * dpr);
                        
                        realCtx.globalAlpha = 1.0;
                        realCtx.lineWidth = 1;
                        realCtx.shadowBlur = 0;
                        realCtx.lineJoin = 'miter';
                        realCtx.lineCap = 'butt';
                        // USE CSS VARIABLE DIRECTLY
                        realCtx.font = '500 13px var(--ff-sans)'; 

                        realCtx.textBaseline = 'middle';
                        realCtx.textAlign = 'left';
                        realCtx.fillStyle = window.WH.getColor('--on-surface-default');
                        realCtx.strokeStyle = window.WH.getColor('--stroke-default');

                        if (options.aspectRatio) { realCtx.beginPath(); realCtx.rect(0, 0, logicW, logicH); realCtx.clip(); }

                        try {
                             const tSec = t / 1000;
                             const dtSec = dtMs / 1000;
                             if (loopFn.length === 1) {
                                 const cx = logicW / 2;
                                 const cy = safeH / 2;
                                 const minDim = Math.min(logicW, safeH);
                                 
                                 loopFn({ 
                                     ctx: safeCtx, 
                                     width: logicW, 
                                     height: safeH, 
                                     cx,
                                     cy,
                                     minDim,
                                     time: tSec, 
                                     dt: dtSec, 
                                     pointer,
                                     state: window.WH._activeState
                                 });
                             }
                             else if (loopFn.length === 2) loopFn(tSec, dtSec);
                             else loopFn(safeCtx, logicW, safeH, tSec, dtSec, pointer);
                        } catch(e) { window.WH.showError(e.message); active=false; }
                        pointer.justPressed = false;
                        pointer.justReleased = false;

                        // Grow pool if needed before collision check
                        for (let i = 0; i < activeLabels.length; i++) {
                            if (!labelPool[i]) {
                                const d = document.createElement('div');
                                d.className = 'viz-tag';
                                WH.applyFont(d, 'smallLabel');
                                hud.appendChild(d);
                                labelPool[i] = d;
                            }
                        }

                        // --- SMART LABEL ENGINE ---
                        const getBounds = (x, y, el) => {
                            const w = el._w || 60; const h = el._h || 24;
                            const isRight = x > logicW / 2;
                            // Approximate the CSS transform placement (24px offset)
                            const finalX = isRight ? x - 24 : x + 24;
                            const finalY = y - 24;
                            const l = isRight ? finalX - w - 8 : finalX + 8;
                            const t = finalY - h;
                            return { l, t, r: l + w, b: t + h, w, h };
                        };

                        for (let i = 0; i < activeLabels.length; i++) {
                            const el = labelPool[i];
                            const label = activeLabels[i];
                            if (el._txt !== label.text || !el._w || el._w === 0) {
                                el.textContent = label.text;
                                el._txt = label.text;
                                // Measure
                                el._w = el.offsetWidth;
                                el._h = el.offsetHeight;
                            }
                            
                            // Mouse Proximity Fade
                            if (pointer.nx >= 0 && pointer.nx <= 1 && pointer.ny >= 0 && pointer.ny <= 1) {
                                const dist = Math.sqrt(Math.pow(label.x - pointer.x, 2) + Math.pow(label.y - pointer.y, 2));
                                const targetOp = dist < 80 ? Math.max(0.15, dist / 80) : 1.0;
                                label.alpha = (label.alpha !== undefined ? label.alpha : 1.0) * 0.9 + targetOp * 0.1;
                            } else {
                                label.alpha = 1.0;
                            }
                        }

                        // REPLACEMENT: Rigid Label Rendering (No Physics, No Lines)
                        // Inside the loop function, replacing the physics solver & render section:
                        for (let i = 0; i < Math.max(activeLabels.length, labelPool.length); i++) {
                            const el = labelPool[i];
                            const d = activeLabels[i];
                            if (i < activeLabels.length && d) {
                                // 1. Text Update
                                if (el._txt !== d.text) { 
                                    el.textContent = d.text; 
                                    el._txt = d.text;
                                }

                                // 2. Color Styling
                                const finalColor = d.color ? window.WH.getColor(d.color) : window.WH.getColor('--on-surface-default');
                                if (el.style.color !== finalColor) el.style.color = finalColor;
                                // Optional: Add a subtle border or background based on color
                                el.style.border = '1px solid ' + finalColor; 

                                // 3. Position (Rigid)
                                // Center the label on the point: x - width/2, y - height
                                // We need to read dimensions. 
                                // Note: Checking offsetWidth every frame causes Reflow (Performance hit).
                                // Optimization: Assume a rough size or cache it.
                                const w = el.offsetWidth || 60;
                                const h = el.offsetHeight || 24;
                                
                                const finalX = d.anchorX - (w / 2);
                                const finalY = d.anchorY - h - 8; // 8px padding above the point

                                el.style.transform = 'translate(' + finalX + 'px, ' + finalY + 'px)';
                                el.style.opacity = 1;
                                el.style.textAlign = 'center';

                                // NOTE: We removed the ctx.lineTo code (Connector lines)
                            } else {
                                // Hide unused labels
                                el.style.opacity = 0;
                            }
                        }
                    }

                    const end = performance.now();
                    if (end - start > MAX_FRAME_TIME) {
                        consecutivelySlowFrames++;
                        if (consecutivelySlowFrames > 5) {
                            active = false;
                            window.WH.showError("Widget stopped: Low performance / Infinite loop detected.");
                            return; 
                        }
                    } else {
                        consecutivelySlowFrames = 0;
                    }

                    requestAnimationFrame(loop);
                };
                requestAnimationFrame(loop);
                return { canvas: c, ctx: safeCtx, stop: () => active=false };
            },

            // B. D3 (Flexible: SVG or DOM)
            initD3: (id, onSetup) => {
                 const el = window.WH._getViz(id); if(!el) return;
                 
                 const proxyUpdate = (...args) => {
                     if (userUpdate) {
                         try { userUpdate(...args); } catch(e) { window.WH.showError(e.message); }
                     } else {
                         pendingArgs = args;
                     }
                 };
                 
                 const selection = d3.select(el);
                 
                 if (!('clientWidth' in selection)) {
                     Object.defineProperty(selection, 'clientWidth', { get: () => el.clientWidth });
                     Object.defineProperty(selection, 'clientHeight', { get: () => el.clientHeight });
                     Object.defineProperty(selection, 'getBoundingClientRect', { value: () => el.getBoundingClientRect() });
                 }
                 
                 let isSetup = false, userUpdate = null, pendingArgs = null;
                 let curW = 0, curH = 0;

                  const render = () => {
                     const r = el.getBoundingClientRect();
                     
                     // DEFENSIVE: Zero-Gate for D3
                     if (r.width === 0 && r.height === 0) return; 
                     
                     const safeW = r.width || 300;
                     const safeH = r.height || 200;
                     
                     curW = safeW; curH = safeH;
                         
                     selection.select('svg')
                        .attr('width', '100%').attr('height', '100%')
                        .attr('viewBox', [0, 0, safeW, safeH]);
                            
                     if (!isSetup) {
                         isSetup = true;
                         try { 
                            // DEFENSIVE: Support ({ selection, width }) signature
                            if (selection && typeof selection === 'object') {
                                selection.selection = selection;
                                selection.width = safeW;
                                selection.height = safeH;
                            }
                             const result = onSetup(selection, safeW, safeH); 
                                 
                                 if (typeof result === 'function') {
                                     userUpdate = result;
                                     try { userUpdate(); } catch(e) { window.WH.showError(e.message); }
                                 } else {
                                     userUpdate = () => {
                                         // Clear and re-run setup with latest dimensions
                                         el.innerHTML = '';
                                         onSetup(selection, curW, curH);
                                     };
                                 }

                                 if (pendingArgs && userUpdate) {
                                     userUpdate(...pendingArgs);
                                     pendingArgs = null;
                                 }
                             } 
                             catch(e) { window.WH.showError(e.message); }
                         } else if (userUpdate) {
                             // DEFENSIVE: Fix for Loss 2. 
                             // If D3 was already setup, we MUST call the user's update function
                             // again on resize so they can re-calculate scales/layout.
                             try { userUpdate(); } catch(e) { window.WH.showError(e.message); }
                         }
                 };
                 new ResizeObserver(() => requestAnimationFrame(render)).observe(el);
                 return proxyUpdate;
            },
            
            // C. PLOT (Stable Sizing)
            initPlot: (id, getOptions) => {
                if (!window.Plot) return;
                const el = window.WH._getViz(id); if (!el) return;
                el.style.position = 'relative'; el.style.overflow = 'hidden'; // Force clipping
                const c = window.WH.getColor;
                
                const render = async () => {
                    if (!el.isConnected) return;
                    const rect = el.getBoundingClientRect();
                    // Plot requires valid dimensions
                    // DEFENSIVE: Zero-Gate
                    if (rect.width === 0 || rect.height === 0) return;
                    
                    const w = Math.floor(rect.width); 
                    const h = Math.floor(rect.height);

                    let result; 
                    try { 
                        result = getOptions(w, h); 
                        if (typeof result === 'function') result = result();
                        
                       // FIX: Handle async config (e.g. fetching data inside plot setup)
                       if (result instanceof Promise) result = await result;
                    } 
                    catch (e) { 
                        return; 
                    }

                    const theme = {
                        style: { background: 'transparent', color: c('--on-surface-default'), fontFamily: c('--ff-sans'), fontSize: '13px', overflow: 'visible' },
                        marginLeft: 50, marginBottom: 40,
                        marginRight: 20, // <--- ADD THIS (Safety margin)
                        color: { range: [c('--chart-1'), c('--chart-2'), c('--chart-3'), c('--chart-4'), c('--chart-5')], unknown: c('--on-surface-de-emphasis') }
                    };

                    let chartNode;
                    try { 
                       // Handle DOM Node (Manual Plot) vs Config Object (Standard)
                       if (result instanceof Element || (result && result.nodeType)) {
                           chartNode = result;
                       } else if (typeof result === 'object' && result !== null) {
                           chartNode = Plot.plot({ ...theme, ...result, width: w, height: h });
                       }

                       if (chartNode) {
                           chartNode.style.display = 'block';
                           chartNode.style.maxWidth = '100%';
                           chartNode.style.maxHeight = '100%';
                           el.replaceChildren(chartNode); 
                       }
                    } catch (e) {
                        return;
                    }
                };
                new ResizeObserver(render).observe(el);
                requestAnimationFrame(render);
                
                // AUTO-SUBSCRIBE to State
                if (window.WH._activeState) {
                    window.WH._activeState._subscribe(() => requestAnimationFrame(render));
                }

                return render;
            },
            
            initThree: (ctr, onSetup) => {
                if (!window.THREE) return;
                window.WH.addBadge('3d_rotation', 'Rotate & Zoom', true);
                const el = window.WH._getViz(ctr); if(!el) return;
                const existing = el.querySelector('canvas'); if (existing) existing.remove();
                const c = document.createElement('canvas');
                c.setAttribute('data-engine', 'three'); // Mark as WebGL layer
                c.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;touch-action:none;outline:none';
                el.appendChild(c);
                
                const p = { x: -1000, y: -1000, ndc: {x:0, y:0}, isDown: false, justPressed: false, justReleased: false };
                
                const smartPointer = {
                    // 1. Pixels (Standard - Fixes Rotation Bug)
                    get x() { return p.x; },
                    get y() { return p.y; },
                    
                    // 2. Normalized 0 to 1 (Aliases for consistency)
                    get nx() { return (p.ndc.x + 1) / 2; },
                    get ny() { return (p.ndc.y + 1) / 2; },
                    get uv() { return { x: (p.ndc.x + 1) / 2, y: (p.ndc.y + 1) / 2 }; },

                    // 3. Normalized -1 to 1 (Raycasting)
                    get ndc() { return p.ndc; }, 

                    get isDown() { return p.isDown; },
                    get justPressed() { return p.justPressed; },
                    get justReleased() { return p.justReleased; }
                };

                const updatePointer = (e) => {
                      const r = c.getBoundingClientRect(); if (r.width <= 0) return;
                      p.x = e.clientX - r.left; p.y = e.clientY - r.top;
                      p.ndc.x = (p.x / r.width) * 2 - 1; p.ndc.y = -(p.y / r.height) * 2 + 1;
                };

                c.addEventListener('pointermove', updatePointer);
                c.addEventListener('pointerdown', (e) => { 
                    p.isDown = true; p.justPressed = true; 
                    updatePointer(e); c.setPointerCapture(e.pointerId); 
                });
                c.addEventListener('pointerup', (e) => { 
                    p.isDown = false; p.justReleased = true; 
                    c.releasePointerCapture(e.pointerId); 
                });
                c.addEventListener('pointercancel', () => p.isDown = false);

                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000); camera.position.set(0,0,40);
                const renderer = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true });
                renderer.setPixelRatio(window.devicePixelRatio);
                const controls = (THREE.OrbitControls) ? new THREE.OrbitControls(camera, c) : { update:()=>{}, target:new THREE.Vector3() };

                // DEFENSIVE: Detect if user manually renders (e.g. for Shaders/Post-Processing)
                // If they do, we suppress the default scene render to prevent clearing their work.
                let hasUserRendered = false;
                const originalRender = renderer.render.bind(renderer);
                renderer.render = (...args) => {
                    hasUserRendered = true;
                    originalRender(...args);
                };

                let onTick = null, onStop = null, isSetup = false, active = true;
                
                const updateSize = () => {
                    const r = el.getBoundingClientRect();
                    if (r.width > 0 && r.height > 0) {
                        camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
                        renderer.setSize(r.width, r.height, false);
                        if (!isSetup) {
                            isSetup = true;
                            try { 
                                const args = [scene, camera, renderer, controls, smartPointer];
                                // DEFENSIVE: Attach props to scene to support ({ scene, camera }) destructuring
                                if (scene && typeof scene === 'object') {
                                    scene.scene = scene;
                                    scene.camera = camera;
                                    scene.renderer = renderer;
                                    scene.controls = controls;
                                    scene.pointer = smartPointer;
                                }
                                const result = onSetup(...args);
                                if (typeof result === 'function') onTick = result;
                                else if (result && typeof result.loop === 'function') { onTick = result.loop; if(result.stop) onStop = result.stop; }
                            } catch(e) { window.WH.showError(e.message); active=false; }
                        }
                    }
                };
                new ResizeObserver(updateSize).observe(el);

                let lastTime = null;
                const loop = (t) => {
                    if(!active) return;
                    if (lastTime === null) lastTime = t;
                    const dt = Math.min(t - lastTime, 50) / 1000; lastTime = t;
                    if(isSetup) {
                        controls.update();
                        
                        // Reset flag before user tick
                        hasUserRendered = false;

                        if(typeof onTick === 'function') {
                            const cvs = renderer.domElement;
                            const dpr = window.devicePixelRatio || 1;
                            try { 
                                onTick({ 
                                    time: t/1000, 
                                    dt, 
                                    pointer: smartPointer, 
                                    state: window.WH._activeState, 
                                    width: cvs.width/dpr, 
                                    height: cvs.height/dpr 
                                }); 
                            } 
                            catch(e) { window.WH.showError(e.message); active=false; }
                        }
                        p.justPressed = false; p.justReleased = false;
                        
                        // Only render default scene if user didn't take control
                        if (!hasUserRendered) {
                            originalRender(scene, camera); // Use bound original to avoid flagging itself
                        }
                    }
                    requestAnimationFrame(loop);
                };
                requestAnimationFrame(loop);
                return { scene, camera, renderer, controls, stop: () => { active = false; if (onStop) onStop(); renderer.dispose(); } };
            },
            
            initPhysics: (ctr, optionsOrUpdate, legacyOnReady) => {
                 if(!window.Matter) return;
                 let onUpdate, onRender, onReady;
                 
                 if (typeof optionsOrUpdate === 'function') {
                     onUpdate = optionsOrUpdate; onReady = legacyOnReady;
                 } else if (optionsOrUpdate) {
                     onUpdate = optionsOrUpdate.onUpdate;
                     onRender = optionsOrUpdate.onRender;
                     onReady = optionsOrUpdate.onReady;
                 }

                 if (onUpdate && onUpdate.length >= 3) {
                     /* console.warn("WH: Auto-fixing physics loop signature"); */
                     onRender = onUpdate;
                     onUpdate = null;
                 }

                 let el = window.WH._getViz(ctr); if(!el) return;
                 const existing = el.querySelector('canvas'); if (existing) existing.remove();
                 
                 const engine = Matter.Engine.create();
                 const render = Matter.Render.create({
                    element: el, engine: engine,
                    options: { width: 100, height: 100, pixelRatio: window.devicePixelRatio, background: 'transparent', wireframes: false }
                 });
                 render.canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;touch-action:none';
                 
                 const mouse = Matter.Mouse.create(render.canvas);
                 const mouseConstraint = Matter.MouseConstraint.create(engine, { mouse: mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
                 Matter.World.add(engine.world, mouseConstraint);
                 render.mouse = mouse;

                 let isInitialized = false;
                 const update = () => {
                    const r = el.getBoundingClientRect();
                    // Physics Safety: Defer init until visible
                    if (r.width > 0 && r.height > 0) {
                         render.options.width = r.width; render.options.height = r.height;
                         render.canvas.width = r.width * window.devicePixelRatio;
                         render.canvas.height = r.height * window.devicePixelRatio;
                         if(!isInitialized && onReady) {
                             isInitialized = true;
                             try { 
                                 // DEFENSIVE: If fn expects 1 arg, pass object. Else pass primitives.
                                 if (onReady.length === 1) {
                                     onReady({ width: r.width, height: r.height, engine, render });
                                 } else {
                                     onReady(r.width, r.height, engine, render); 
                                 }
                             } catch(e) { window.WH.showError(e.message); }
                         }
                    }
                 };
                 new ResizeObserver(update).observe(el); requestAnimationFrame(update);
                 
                 if (onUpdate) {
                    Matter.Events.on(engine, 'beforeUpdate', (event) => {
                        const dt = Math.min(event.source.timing.lastDelta, 100);
                        try { onUpdate(event.source, dt); } 
                        catch(e) { window.WH.showError(e.message); }
                    });
                }
                 if (onRender) {
                    const safePhysicsCtx = window.WH._createSafeCtx(
                        render.context, 
                        () => render.options.width, 
                        () => render.options.height
                    );
                    Matter.Events.on(render, 'afterRender', () => {
                        try {
                            onRender(
                                safePhysicsCtx, 
                                render.options.width, 
                                render.options.height, 
                                engine
                            ); 
                        } catch(e) { window.WH.showError(e.message); }
                    });
                 }
                 Matter.Render.run(render);
                 const runner = Matter.Runner.create();
                 Matter.Runner.run(runner, engine);
                 
                 return { engine, world: engine.world, runner, render, mouseConstraint, stop: () => { 
                    Matter.Render.stop(render); 
                    Matter.Runner.stop(runner);
                    if (engine.world) Matter.World.clear(engine.world);
                    if (engine) Matter.Engine.clear(engine);
                    render.canvas.remove();
                    render.canvas = null;
                    render.context = null;
                    render.textures = {};
                }};
            }
        };


