/*:
 * @target MZ
 * @plugindesc [v2.1.1] 现代风虚拟按键核心 - 完美版
 * @author Gemini AI & J2ME
 *
 * @help
 * ============================================================================
 * J2ME Modern Pad Core (v2.1.1 - DOM Version)
 * ============================================================================
 *
 * --- v2.1.1 紧急修复 ---
 * 1. 【强力去UI】：针对手机端汉堡键无法消除的问题，增加了“核弹级”修复。
 * 即使有其他插件（如VisuStella）强行创建了UI按钮，本插件也会在场景
 * 启动时强制检测并移除它们。
 * 2. 【参数容错】：即使未刷新插件参数，默认也会开启隐藏系统UI功能。
 *
 * --- v2.1.0 历史更新 ---
 * 1. 【战斗沉浸】：战斗执行动作时自动隐藏按键。
 *
 * --- 使用方法 ---
 * 请在事件中使用【插件指令】：
 * - HidePad: 隐藏虚拟按键 (用于剧情演出时)
 * - ShowPad: 显示虚拟按键 (剧情结束后恢复)
 *
 * @command HidePad
 * @text 隐藏虚拟按键
 * @desc 强制隐藏虚拟按键（状态会保存到存档）。
 *
 * @command ShowPad
 * @text 显示虚拟按键
 * @desc 恢复显示虚拟按键。
 *
 * @param 基础设置
 * @text --- 基础外观设置 ---
 * * @param DisableDefaultUI
 * @parent 基础设置
 * @text 隐藏系统自带触控UI
 * @desc 是否隐藏MZ自带的汉堡菜单键和右键取消功能？(建议开启)
 * @type boolean
 * @default true
 *
 * @param ButtonColor
 * @parent 基础设置
 * @text 按键主色
 * @default #F0F0F0
 *
 * @param SymbolColor
 * @parent 基础设置
 * @text 图标颜色
 * @default #555555
 *
 * @param DefaultOpacity
 * @parent 基础设置
 * @text 默认透明度
 * @type number
 * @min 0
 * @max 100
 * @default 85
 *
 * @param 默认布局
 * @text --- 默认布局 ---
 *
 * @param DefDpadX
 * @parent 默认布局
 * @text 十字键默认X
 * @default 100
 *
 * @param DefDpadY
 * @parent 默认布局
 * @text 十字键默认Y
 * @default 500
 *
 * @param DefDpadScale
 * @parent 默认布局
 * @text 十字键默认大小
 * @default 1.00
 *
 * @param DefOkX
 * @parent 默认布局
 * @text 确认键默认X
 * @default 300
 *
 * @param DefOkY
 * @parent 默认布局
 * @text 确认键默认Y
 * @default 520
 *
 * @param DefOkScale
 * @parent 默认布局
 * @text 确认键默认大小
 * @default 1.00
 *
 * @param DefEscX
 * @parent 默认布局
 * @text 返回键默认X
 * @default 300
 *
 * @param DefEscY
 * @parent 默认布局
 * @text 返回键默认Y
 * @default 420
 *
 * @param DefEscScale
 * @parent 默认布局
 * @text 返回键默认大小
 * @default 1.00
 */

(() => {
    const pluginName = "J2ME_ModernControls";
    const parameters = PluginManager.parameters(pluginName);

    // --- 参数读取 (v2.1.1 增强容错) ---
    // 如果用户没刷新参数，getParameter获取到的是undefined，这里强制默认视为true
    const rawDisableUI = parameters['DisableDefaultUI'];
    const pDisableDefaultUI = (rawDisableUI === undefined || rawDisableUI === '') ? true : (rawDisableUI === 'true');
    
    const pBtnColor = parameters['ButtonColor'] || '#F0F0F0';
    const pSymColor = parameters['SymbolColor'] || '#555555';
    const pDefOpacity = Number(parameters['DefaultOpacity'] || 85) / 100;

    const pDefDpadX = Number(parameters['DefDpadX'] || 100);
    const pDefDpadY = Number(parameters['DefDpadY'] || 500);
    const pDefDpadScale = Number(parameters['DefDpadScale'] || 1.0);

    const pDefOkX   = Number(parameters['DefOkX'] || 300);
    const pDefOkY   = Number(parameters['DefOkY'] || 520);
    const pDefOkScale = Number(parameters['DefOkScale'] || 1.0);

    const pDefEscX  = Number(parameters['DefEscX'] || 300);
    const pDefEscY  = Number(parameters['DefEscY'] || 420);
    const pDefEscScale = Number(parameters['DefEscScale'] || 1.0);

    // =========================================================================
    // Disable Default UI (v2.1.1 Nuclear Fix)
    // =========================================================================
    if (pDisableDefaultUI) {
        // 1. 拦截创建方法 (第一道防线)
        const _Scene_Map_createMenuButton = Scene_Map.prototype.createMenuButton;
        Scene_Map.prototype.createMenuButton = function() { return; };
        
        const _Scene_Base_createCancelButton = Scene_Base.prototype.createCancelButton;
        Scene_Base.prototype.createCancelButton = function() { return; };

        // 2. 场景启动后强制清理 (第二道防线 - 针对 VisuStella 等插件的强制注入)
        const _Scene_Map_start = Scene_Map.prototype.start;
        Scene_Map.prototype.start = function() {
            _Scene_Map_start.call(this);
            this.forceClearTouchUI();
        };

        const _Scene_Base_start = Scene_Base.prototype.start;
        Scene_Base.prototype.start = function() {
            _Scene_Base_start.call(this);
            // 只有在非 PadConfig 界面才清理，防止误伤（虽然PadConfig没有cancelButton）
            if (!(this instanceof Scene_PadConfig)) {
                if (this.forceClearTouchUI) this.forceClearTouchUI();
            }
        };

        // 定义清理函数
        Scene_Base.prototype.forceClearTouchUI = function() {
            // 清理汉堡键
            if (this._menuButton) {
                this._menuButton.visible = false;
                if (this._menuButton.parent) this._menuButton.parent.removeChild(this._menuButton);
                this._menuButton = null;
            }
            // 清理返回键
            if (this._cancelButton) {
                this._cancelButton.visible = false;
                if (this._cancelButton.parent) this._cancelButton.parent.removeChild(this._cancelButton);
                this._cancelButton = null;
            }
        };
    }

    // =========================================================================
    // Plugin Command Registration
    // =========================================================================
    PluginManager.registerCommand(pluginName, "HidePad", () => {
        if ($gameSystem) $gameSystem.setVPadManualHide(true);
    });

    PluginManager.registerCommand(pluginName, "ShowPad", () => {
        if ($gameSystem) $gameSystem.setVPadManualHide(false);
    });

    // =========================================================================
    // Game_System Extension
    // =========================================================================
    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._vPadManualHide = false;
    };

    Game_System.prototype.setVPadManualHide = function(val) {
        this._vPadManualHide = val;
    };

    Game_System.prototype.isVPadManualHidden = function() {
        return !!this._vPadManualHide;
    };

    // =========================================================================
    // ConfigManager
    // =========================================================================
    const DefaultLayout = {
        dpadX: pDefDpadX, dpadY: pDefDpadY, dpadScale: pDefDpadScale,
        okX: pDefOkX, okY: pDefOkY, okScale: pDefOkScale,
        escX: pDefEscX, escY: pDefEscY, escScale: pDefEscScale,
        opacity: pDefOpacity
    };

    ConfigManager.vPadSettings = null;
    ConfigManager.vPadVisible = true;

    const _ConfigManager_makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        const config = _ConfigManager_makeData.call(this);
        if (this.vPadSettings) config.vPadSettings = this.vPadSettings;
        config.vPadVisible = this.vPadVisible;
        return config;
    };

    const _ConfigManager_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        _ConfigManager_applyData.call(this, config);
        const saved = config.vPadSettings || {};
        this.vPadSettings = { ...DefaultLayout, ...saved };
        this.vPadVisible = (config.vPadVisible !== undefined) ? config.vPadVisible : true;
    };

    const vibrate = () => { if (navigator.vibrate) navigator.vibrate(10); };

    // =========================================================================
    // CSS Styles
    // =========================================================================
    const styleId = 'j2me-vpad-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            #j2me-vpad-layer {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none;
                z-index: 5000;
                user-select: none;
                -webkit-user-select: none;
                -webkit-touch-callout: none;
            }
            .vpad-btn {
                position: absolute;
                pointer-events: auto;
                background-color: ${pBtnColor};
                border: 2px solid rgba(255, 255, 255, 0.6);
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: sans-serif;
                font-weight: bold;
                color: ${pSymColor};
                transition: opacity 0.2s, transform 0.1s;
                touch-action: none;
                -webkit-tap-highlight-color: transparent;
            }
            .vpad-btn.pressed {
                transform: scale(0.92) !important;
                background-color: #ddd;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            .vpad-btn.selected {
                border-color: #2ecc71;
                border-width: 3px;
                box-shadow: 0 0 15px #2ecc71;
            }
            .vpad-circle { border-radius: 50%; }
            .vpad-rect { border-radius: 12px; }
            .icon-circle::after {
                content: ''; width: 50%; height: 50%;
                border-radius: 50%;
                border: 4px solid ${pSymColor};
                box-sizing: border-box;
                display: block;
            }
            .icon-triangle::after {
                content: ''; width: 0; height: 0;
                border-left: 10px solid transparent;
                border-right: 10px solid transparent;
                border-bottom: 16px solid ${pSymColor};
                display: block;
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(style);
    }

    // =========================================================================
    // DOM Button Class
    // =========================================================================
    class DOMButton {
        constructor(id, key, label, shape, baseSize) {
            this.id = id;
            this.key = key;
            this.baseSize = baseSize;
            this.currentScale = 1.0;
            this.isPressed = false;
            
            this.element = document.createElement('div');
            this.element.className = `vpad-btn vpad-${shape}`;
            if (key === 'ok') this.element.classList.add('icon-circle');
            else if (key === 'escape') this.element.classList.add('icon-triangle');
            else this.element.innerText = label;

            this.element.style.fontSize = `${baseSize * 0.4}px`;
            this.element.style.transition = 'opacity 0.2s, transform 0.1s';
            
            this._bindEvents();
        }

        _bindEvents() {
            const handleStart = (e) => {
                if (e.cancelable) e.preventDefault();
                e.stopPropagation();

                if (!ConfigManager.vPadVisible && !DOMPadManager.isEditMode) return;
                
                this.isPressed = true;
                this.element.classList.add('pressed');

                if (e.type === 'touchstart') {
                    window.addEventListener('touchend', handleEnd, { passive: false });
                    window.addEventListener('touchcancel', handleEnd, { passive: false });
                } else {
                    window.addEventListener('mouseup', handleEnd);
                }

                if (!DOMPadManager.isEditMode) {
                    Input._currentState[this.key] = true;
                    vibrate();
                } else {
                    DOMPadManager.notifyDragStart(this, e);
                }
            };

            const handleEnd = (e) => {
                window.removeEventListener('touchend', handleEnd);
                window.removeEventListener('touchcancel', handleEnd);
                window.removeEventListener('mouseup', handleEnd);

                if (this.isPressed) {
                    this.isPressed = false;
                    this.element.classList.remove('pressed');
                    Input._currentState[this.key] = false;
                }
            };

            this.element.addEventListener('touchstart', handleStart, { passive: false });
            this.element.addEventListener('mousedown', handleStart);
        }

        setPosition(x, y, scale) {
            this.currentScale = scale;
            const size = this.baseSize * scale;
            this.element.style.width = `${size}px`;
            this.element.style.height = `${size}px`;
            this.element.style.left = `${x - size/2}px`;
            this.element.style.top = `${y - size/2}px`;
            this.element.style.fontSize = `${size * 0.4}px`;
            if (this.element.classList.contains('vpad-rect')) {
                this.element.style.borderRadius = `${12 * scale}px`;
            }
        }

        setOpacity(val, instant = false) {
            if (instant) {
                this.element.style.transition = 'transform 0.1s'; 
            } else {
                this.element.style.transition = 'opacity 0.2s, transform 0.1s';
            }
            
            this.element.style.opacity = val;
            this.element.style.pointerEvents = val <= 0.05 ? 'none' : 'auto';
        }

        setSelected(bool) {
            if (bool) this.element.classList.add('selected');
            else this.element.classList.remove('selected');
        }
    }

    // =========================================================================
    // DOM Pad Manager
    // =========================================================================
    const DOMPadManager = {
        container: null,
        buttons: [],
        isEditMode: false,
        draggingBtn: null,
        dragOffset: { x:0, y:0 },

        init() {
            if (this.container) return;
            this.container = document.createElement('div');
            this.container.id = 'j2me-vpad-layer';
            document.body.appendChild(this.container);
            this.createButtons();
            this.startLoop();
            
            document.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
            document.addEventListener('mousemove', this.handleMove.bind(this));
            document.addEventListener('touchend', this.handleEnd.bind(this));
            document.addEventListener('mouseup', this.handleEnd.bind(this));
        },

        createButtons() {
            this.buttons = [];
            this.container.innerHTML = '';
            const dpadBase = 65; const okBase = 85; const escBase = 70;

            this.addButton('up', '▲', 'rect', dpadBase);
            this.addButton('down', '▼', 'rect', dpadBase);
            this.addButton('left', '◀', 'rect', dpadBase);
            this.addButton('right', '▶', 'rect', dpadBase);
            this.addButton('ok', '', 'circle', okBase);
            this.addButton('escape', '', 'circle', escBase);
            this.refreshLayout();
        },

        addButton(key, label, shape, size) {
            const btn = new DOMButton(key, key, label, shape, size);
            btn.setOpacity(0, true); 
            this.container.appendChild(btn.element);
            this.buttons.push(btn);
        },

        refreshLayout() {
            const cfg = ConfigManager.vPadSettings;
            const gap = 10;
            const dS = 65 * cfg.dpadScale;
            this.setBtnPos('up', cfg.dpadX, cfg.dpadY - dS - gap, cfg.dpadScale);
            this.setBtnPos('down', cfg.dpadX, cfg.dpadY + dS + gap, cfg.dpadScale);
            this.setBtnPos('left', cfg.dpadX - dS - gap, cfg.dpadY, cfg.dpadScale);
            this.setBtnPos('right', cfg.dpadX + dS + gap, cfg.dpadY, cfg.dpadScale);
            this.setBtnPos('ok', cfg.okX, cfg.okY, cfg.okScale);
            this.setBtnPos('escape', cfg.escX, cfg.escY, cfg.escScale);
        },

        setBtnPos(key, x, y, scale) {
            const btn = this.buttons.find(b => b.key === key);
            if (btn) btn.setPosition(x, y, scale);
        },

        startLoop() {
            const loop = () => {
                this.update();
                requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
        },

        update() {
            if (!this.isEditMode && !ConfigManager.vPadVisible) {
                this.container.style.display = 'none';
                return;
            }
            this.container.style.display = 'block';

            const cfg = ConfigManager.vPadSettings;
            
            if (this.isEditMode) {
                this.buttons.forEach(b => {
                    b.setOpacity(cfg.opacity, false);
                    b.element.style.pointerEvents = 'auto'; 
                });
                return;
            }

            const scene = SceneManager._scene;
            let targetOp = cfg.opacity;
            let forceHide = false;
            let instant = false;

            if ($gameSystem && $gameSystem.isVPadManualHidden()) {
                forceHide = true;
                instant = false; 
            }
            else if (this.shouldUIHide(scene)) {
                forceHide = true;
                instant = false;
            }

            if (forceHide) {
                this.buttons.forEach(b => {
                    if (b.isPressed) {
                        b.isPressed = false;
                        b.element.classList.remove('pressed');
                        Input._currentState[b.key] = false; 
                    }
                });
            }

            const finalOp = forceHide ? 0 : targetOp;
            this.buttons.forEach(b => {
                if (b.isPressed && !forceHide) {
                    b.setOpacity(1.0, false);
                } else {
                    b.setOpacity(finalOp, instant);
                }
            });
        },

        shouldUIHide(scene) {
            if (!scene) return true;
            
            const isMap = (scene instanceof Scene_Map);
            const isBattle = (scene instanceof Scene_Battle);
            const isTitle = (scene instanceof Scene_Title);
            const isMenu = (scene instanceof Scene_MenuBase);
            const isConfig = (scene instanceof Scene_PadConfig);

            if (!isMap && !isBattle && !isTitle && !isMenu) return true;
            if (isConfig || isMenu) return false;

            const mw = scene._messageWindow;
            const cw = mw ? mw._choiceListWindow : null;
            const ni = mw ? mw._numberInputWindow : null;
            const ei = mw ? mw._eventItemWindow : null;

            const isChoiceOpen = cw && cw.visible && cw.openness > 0;
            const isNumOpen = ni && ni.visible && ni.openness > 0;
            const isItemOpen = ei && ei.visible && ei.openness > 0;
            if (isChoiceOpen || isNumOpen || isItemOpen) return false;

            if (isBattle && BattleManager && !BattleManager.isInputting()) {
                return true;
            }

            if ($gameMessage.hasText()) return true;
            const isMessageBusy = $gameMessage.isBusy();
            const isMwVisible = mw && mw.visible && mw.openness > 0;
            
            if (isMessageBusy || isMwVisible) return true;

            return false;
        },

        notifyDragStart(btn, e) {
            if (!this.isEditMode) return;
            this.draggingBtn = btn;
            const touch = e.touches ? e.touches[0] : e;
            const rect = btn.element.getBoundingClientRect();
            this.dragOffset.x = touch.clientX - (rect.left + rect.width/2);
            this.dragOffset.y = touch.clientY - (rect.top + rect.height/2);

            if (SceneManager._scene instanceof Scene_PadConfig) {
                SceneManager._scene.changeSelection(btn.key === 'ok' ? 'ok' : (btn.key === 'escape' ? 'esc' : 'dpad'));
            }
        },

        handleMove(e) {
            if (!this.draggingBtn || !this.isEditMode) return;
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            const newX = touch.clientX - this.dragOffset.x;
            const newY = touch.clientY - this.dragOffset.y;
            const cfg = ConfigManager.vPadSettings;
            const key = this.draggingBtn.key;

            if (key === 'ok') { cfg.okX = newX; cfg.okY = newY; }
            else if (key === 'escape') { cfg.escX = newX; cfg.escY = newY; }
            else { cfg.dpadX = newX; cfg.dpadY = newY; }

            this.refreshLayout();
            if (SceneManager._scene instanceof Scene_PadConfig) {
                SceneManager._scene.updateUIValues();
            }
        },

        handleEnd() { this.draggingBtn = null; },
        
        setSelection(targetKey) {
            this.buttons.forEach(b => {
                const isSelected = (b.key === targetKey) || 
                                   (targetKey === 'dpad' && ['up','down','left','right'].includes(b.key));
                b.setSelected(isSelected);
            });
        }
    };

    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.call(this);
        DOMPadManager.init();
    };

    // =========================================================================
    // Scene_PadConfig
    // =========================================================================
    class Scene_PadConfig extends Scene_MenuBase {
        create() {
            super.create();
            this.createBackground();
            Input.clear(); 
            DOMPadManager.isEditMode = true;
            DOMPadManager.refreshLayout();

            this._uiLayer = new Sprite();
            this.addChild(this._uiLayer);
            this._createTopPanel(Graphics.width);
            this.changeSelection('dpad'); 
        }

        terminate() {
            super.terminate();
            DOMPadManager.isEditMode = false;
            DOMPadManager.setSelection(null);
            Input.clear();
            ConfigManager.save();
        }

        createBackground() {
            this._backgroundSprite = new Sprite();
            this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
            this.addChild(this._backgroundSprite);
            this._backgroundSprite.setColorTone([-50, -50, -50, 0]); 
            const blurFilter = new PIXI.filters.BlurFilter();
            blurFilter.blur = 4;
            this._backgroundSprite.filters = [blurFilter];
        }

        _createTopPanel(w) {
            const h = 280; 
            const panel = new Sprite(new Bitmap(w, h));
            const ctx = panel.bitmap.context;
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, "rgba(0,0,0,0.95)");
            grad.addColorStop(1, "rgba(0,0,0,0.0)"); 
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
            this._uiLayer.addChild(panel);

            const tabY = 10; const tabW = 100; const tabSpacing = 20;
            const startX = (w - (tabW * 3 + tabSpacing * 2)) / 2;
            this._tabBtns = [];
            this._createTabBtn("十字键", 'dpad', startX, tabY, tabW);
            this._createTabBtn("确认", 'ok', startX + tabW + tabSpacing, tabY, tabW);
            this._createTabBtn("返回", 'esc', startX + (tabW + tabSpacing) * 2, tabY, tabW);

            const row2Y = 65;
            this._createSmallBtn("X-", w/2 - 130, row2Y, () => this.nudge(-2, 0));
            this._createSmallBtn("X+", w/2 - 70, row2Y, () => this.nudge(2, 0));
            this._createSmallBtn("Y-", w/2 + 70, row2Y, () => this.nudge(0, -2));
            this._createSmallBtn("Y+", w/2 + 130, row2Y, () => this.nudge(0, 2));
            
            this._coordDisplay = new Sprite(new Bitmap(120, 40));
            this._coordDisplay.x = w/2; this._coordDisplay.y = row2Y; this._coordDisplay.anchor.set(0.5);
            this._uiLayer.addChild(this._coordDisplay);

            const row3Y = 125;
            this._sizeLabel = this._createLabel("大小: 100%", w/4, row3Y - 20);
            this._createCircleBtn("-", w/4 - 70, row3Y + 15, () => this.changeSize(-0.1));
            this._createCircleBtn("+", w/4 + 70, row3Y + 15, () => this.changeSize(0.1));
            this._sizeSliderArea = { x: w/4 - 40, y: row3Y, w: 80, h: 30 };
            this._createBar(this._sizeSliderArea, "#2ecc71", "size");

            this._opLabel = this._createLabel("透明度: 85%", w*0.75, row3Y - 20);
            this._createCircleBtn("-", w*0.75 - 70, row3Y + 15, () => this.changeOpacity(-0.05));
            this._createCircleBtn("+", w*0.75 + 70, row3Y + 15, () => this.changeOpacity(0.05));
            this._opSliderArea = { x: w*0.75 - 40, y: row3Y, w: 80, h: 30 };
            this._createBar(this._opSliderArea, "#3498db", "op");

            const btnY = 205;
            this._createCapsuleBtn("重置默认", "#c0392b", w/2 - 90, btnY, () => this.resetDefault());
            this._createCapsuleBtn("保存退出", "#27ae60", w/2 + 90, btnY, () => this.saveAndExit());
            this.updateUIValues();
        }

        _createLabel(text, x, y) {
            const sprite = new Sprite(new Bitmap(200, 30));
            sprite.x = x; sprite.y = y; sprite.anchor.set(0.5);
            sprite.bitmap.fontSize = 18; sprite.bitmap.textColor = "#ccc";
            sprite.bitmap.drawText(text, 0, 0, 200, 30, 'center');
            this._uiLayer.addChild(sprite); return sprite;
        }
        _createBar(area, color, type) {
            const base = new Sprite(new Bitmap(area.w, 8));
            base.x = area.x; base.y = area.y + 11;
            base.bitmap.context.fillStyle = "#555"; base.bitmap.context.fillRect(0,0,area.w,8);
            this._uiLayer.addChild(base);
            const fill = new Sprite(new Bitmap(area.w, 8));
            fill.x = area.x; fill.y = area.y + 11; fill._color = color; 
            this._uiLayer.addChild(fill);
            if (type === 'size') this._sizeBarFill = fill;
            if (type === 'op') this._opBarFill = fill;
        }
        _createTabBtn(text, targetKey, x, y, w) {
            const h = 40; const btn = new Sprite(new Bitmap(w, h));
            btn.x = x + w/2; btn.y = y + h/2; btn.anchor.set(0.5);
            btn._targetKey = targetKey; this._drawTabBtn(btn, false);
            btn._onClick = () => this.changeSelection(targetKey);
            this._uiLayer.addChild(btn); this._tabBtns.push(btn);
        }
        _drawTabBtn(sprite, isActive) {
            const w = sprite.bitmap.width; const h = sprite.bitmap.height; const ctx = sprite.bitmap.context;
            ctx.clearRect(0,0,w,h);
            ctx.fillStyle = isActive ? "#3498db" : "rgba(80,80,80,0.6)";
            ctx.strokeStyle = isActive ? "#ffffff" : "#aaaaaa";
            const r = 10;
            ctx.beginPath(); ctx.moveTo(r, 0); ctx.arcTo(w, 0, w, h, r); ctx.arcTo(w, h, 0, h, r);
            ctx.arcTo(0, h, 0, 0, r); ctx.arcTo(0, 0, w, 0, r); ctx.closePath();
            ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
            sprite.bitmap.fontSize = 16; sprite.bitmap.textColor = isActive ? "#ffffff" : "#cccccc";
            sprite.bitmap.drawText(sprite._targetKey === 'dpad' ? "十字键" : (sprite._targetKey === 'ok' ? "确认" : "返回"), 0, 0, w, h, 'center');
        }
        _updateTabVisuals() { this._tabBtns.forEach(btn => this._drawTabBtn(btn, btn._targetKey === this._selectedTarget)); }
        
        _createSmallBtn(text, x, y, callback) {
            const w = 50; const h = 35; const btn = new Sprite(new Bitmap(w, h));
            btn.x = x; btn.y = y; btn.anchor.set(0.5); const ctx = btn.bitmap.context;
            ctx.fillStyle = "#444"; this._roundRect(ctx, 0, 0, w, h, 8); ctx.fill(); ctx.strokeStyle = "#777"; ctx.stroke();
            btn.bitmap.fontSize = 18; btn.bitmap.drawText(text, 0, 0, w, h, 'center');
            btn._onClick = callback; this._uiLayer.addChild(btn);
        }
        _createCircleBtn(text, x, y, callback) {
            const btn = new Sprite(new Bitmap(30, 30));
            btn.x = x; btn.y = y; btn.anchor.set(0.5); const ctx = btn.bitmap.context;
            ctx.beginPath(); ctx.arc(15, 15, 13, 0, Math.PI*2); ctx.fillStyle = "#444"; ctx.fill(); ctx.strokeStyle = "#777"; ctx.stroke();
            btn.bitmap.fontSize = 20; btn.bitmap.drawText(text, 0, 0, 30, 30, 'center');
            btn._onClick = callback; this._uiLayer.addChild(btn);
        }
        _createCapsuleBtn(text, color, x, y, callback) {
            const w = 120; const h = 40; const btn = new Sprite(new Bitmap(w, h));
            btn.x = x; btn.y = y; btn.anchor.set(0.5); const ctx = btn.bitmap.context;
            ctx.fillStyle = color; this._roundRect(ctx, 0, 0, w, h, 15); ctx.fill();
            btn.bitmap.fontSize = 18; btn.bitmap.fontBold = true; btn.bitmap.drawText(text, 0, 2, w, h, 'center');
            btn._onClick = callback; this._uiLayer.addChild(btn);
        }
        _roundRect(ctx, x, y, w, h, r) {
            ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
        }

        changeSelection(target) {
            this._selectedTarget = target; 
            DOMPadManager.setSelection(target);
            this.updateUIValues(); 
            this._updateTabVisuals(); 
            vibrate();
        }

        updateUIValues() {
            const cfg = ConfigManager.vPadSettings;
            let cx=0, cy=0, cScale=1;
            if (this._selectedTarget === 'dpad') { cx=cfg.dpadX; cy=cfg.dpadY; cScale=cfg.dpadScale; }
            if (this._selectedTarget === 'ok') { cx=cfg.okX; cy=cfg.okY; cScale=cfg.okScale; }
            if (this._selectedTarget === 'esc') { cx=cfg.escX; cy=cfg.escY; cScale=cfg.escScale; }
            
            this._coordDisplay.bitmap.clear();
            this._coordDisplay.bitmap.fontSize = 16;
            this._coordDisplay.bitmap.drawText(`X:${Math.round(cx)}  Y:${Math.round(cy)}`, 0, 0, 120, 40, 'center');
            
            const op = Math.round(cfg.opacity * 100);
            this._opLabel.bitmap.clear(); this._opLabel.bitmap.drawText(`透明度: ${op}%`, 0, 0, 200, 30, 'center');
            this._opBarFill.bitmap.clear(); this._opBarFill.bitmap.context.fillStyle = this._opBarFill._color;
            this._opBarFill.bitmap.context.fillRect(0, 0, cfg.opacity * this._opSliderArea.w, 8);

            const pct = Math.round(cScale * 100);
            this._sizeLabel.bitmap.clear(); this._sizeLabel.bitmap.drawText(`大小: ${pct}%`, 0, 0, 200, 30, 'center');
            let ratio = (cScale - 0.5) / 1.5; ratio = ratio.clamp(0, 1);
            this._sizeBarFill.bitmap.clear(); this._sizeBarFill.bitmap.context.fillStyle = this._sizeBarFill._color;
            this._sizeBarFill.bitmap.context.fillRect(0, 0, ratio * this._sizeSliderArea.w, 8);
        }

        nudge(dx, dy) {
            const cfg = ConfigManager.vPadSettings; const t = this._selectedTarget;
            if (t === 'dpad') { cfg.dpadX += dx; cfg.dpadY += dy; }
            else if (t === 'ok') { cfg.okX += dx; cfg.okY += dy; }
            else if (t === 'esc') { cfg.escX += dx; cfg.escY += dy; }
            DOMPadManager.refreshLayout(); 
            this.updateUIValues();
        }

        changeOpacity(delta) {
            ConfigManager.vPadSettings.opacity = (ConfigManager.vPadSettings.opacity + delta).clamp(0, 1.0);
            this.updateUIValues(); 
            DOMPadManager.update();
        }

        changeSize(delta) {
            const cfg = ConfigManager.vPadSettings; const t = this._selectedTarget;
            if (t === 'dpad') cfg.dpadScale = (cfg.dpadScale + delta).clamp(0.5, 2.0);
            if (t === 'ok') cfg.okScale = (cfg.okScale + delta).clamp(0.5, 2.0);
            if (t === 'esc') cfg.escScale = (cfg.escScale + delta).clamp(0.5, 2.0);
            
            cfg.dpadScale = Math.round(cfg.dpadScale * 100) / 100;
            cfg.okScale = Math.round(cfg.okScale * 100) / 100;
            cfg.escScale = Math.round(cfg.escScale * 100) / 100;

            this.updateUIValues(); 
            DOMPadManager.refreshLayout();
        }

        resetDefault() {
            ConfigManager.vPadSettings = JSON.parse(JSON.stringify(DefaultLayout));
            this.changeSelection('dpad'); 
            DOMPadManager.refreshLayout();
            vibrate();
        }

        saveAndExit() { 
            ConfigManager.save(); 
            vibrate(); 
            this.popScene(); 
        }

        update() {
            super.update();
            this.processTouch();
        }

        processTouch() {
            const x = TouchInput.x; const y = TouchInput.y;
            if (TouchInput.isTriggered()) {
                for (const child of this._uiLayer.children) {
                    if (child._onClick && x >= child.x - child.width/2 && x <= child.x + child.width/2 && y >= child.y - child.height/2 && y <= child.y + child.height/2) {
                        child.scale.set(0.95, 0.95); child._onClick();
                        setTimeout(() => { if (child && !child._destroyed && child.scale) child.scale.set(1, 1); }, 100); return;
                    }
                }
                if (x >= this._opSliderArea.x && x <= this._opSliderArea.x + this._opSliderArea.w && y >= this._opSliderArea.y && y <= this._opSliderArea.y + this._opSliderArea.h) { this._slidingOpacity = true; this.handleSlider(x, 'op'); return; }
                if (x >= this._sizeSliderArea.x && x <= this._sizeSliderArea.x + this._sizeSliderArea.w && y >= this._sizeSliderArea.y && y <= this._sizeSliderArea.y + this._sizeSliderArea.h) { this._slidingSize = true; this.handleSlider(x, 'size'); return; }
            } else if (TouchInput.isPressed()) {
                if (this._slidingOpacity) { this.handleSlider(x, 'op'); return; }
                if (this._slidingSize) { this.handleSlider(x, 'size'); return; }
            } else if (TouchInput.isReleased()) {
                this._slidingOpacity = false; this._slidingSize = false; 
            }
        }

        handleSlider(x, type) {
            const area = type === 'op' ? this._opSliderArea : this._sizeSliderArea;
            let ratio = (x - area.x) / area.w; ratio = ratio.clamp(0, 1);
            if (type === 'op') {
                ConfigManager.vPadSettings.opacity = Math.round(ratio * 100) / 100;
                DOMPadManager.update();
            } else {
                let scale = 0.5 + ratio * 1.5; scale = Math.round(scale * 100) / 100;
                const cfg = ConfigManager.vPadSettings;
                if (this._selectedTarget === 'dpad') cfg.dpadScale = scale;
                if (this._selectedTarget === 'ok') cfg.okScale = scale;
                if (this._selectedTarget === 'esc') cfg.escScale = scale;
                DOMPadManager.refreshLayout();
            }
            this.updateUIValues();
        }
    }

    const _Window_Options_addGeneralOptions = Window_Options.prototype.addGeneralOptions;
    Window_Options.prototype.addGeneralOptions = function() {
        _Window_Options_addGeneralOptions.call(this);
        this.addCommand('显示虚拟按键', 'vPadVisible'); 
        this.addCommand('虚拟按键设置', 'virtualPadConfig');
    };
    
    const _Window_Options_statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        return this.commandSymbol(index) === 'virtualPadConfig' ? '>>>' : _Window_Options_statusText.call(this, index);
    };

    const _Window_Options_processOk = Window_Options.prototype.processOk;
    Window_Options.prototype.processOk = function() {
        if (this.commandSymbol(this.index()) === 'virtualPadConfig') { 
            this.playOkSound(); 
            SceneManager.push(Scene_PadConfig);
            return; 
        }
        _Window_Options_processOk.call(this);
    };

    const _Scene_Map_processMapTouch = Scene_Map.prototype.processMapTouch;
    Scene_Map.prototype.processMapTouch = function() {
        const isTouchingBtn = Object.values(Input._currentState).some(v => v);
        if (isTouchingBtn) return;
        _Scene_Map_processMapTouch.call(this);
    };

})();