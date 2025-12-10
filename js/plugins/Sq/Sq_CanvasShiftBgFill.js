/*:
 * @target MZ
 * @plugindesc [系统+界面] 竖屏J2ME专用 - 强制布局/全屏修复/边框美化 (二合一终极版)
 * @author 神枪手 & Gemini Fix
 *
 * @help
 * ============================================================================
 * 📱 混合功能说明 (Hybrid Features)
 * ============================================================================
 * 这个插件完美合并了“手机端强制布局”和“动态边框修正”两个功能。
 * * 1. 布局模式 (Anchor)：
 * 你可以再次选择让游戏画面【顶部对齐】、【垂直居中】或【底部对齐】。
 * 这对于竖屏游戏非常重要，推荐使用 Top (顶部对齐) 并配合 OffsetY。
 * * 2. 边框修正 (Border Calibration)：
 * 保留了新版的四向独立修正。如果全屏后发现边框没对齐，
 * 调整下方的 AdjustLeft/Right/Top/Bottom 参数即可。
 *
 * ============================================================================
 * 参数设置
 * ============================================================================
 *
 * @param --- Layout ---
 * @text [布局与屏幕]
 *
 * @param AnchorMode
 * @parent --- Layout ---
 * @text 画布停靠位置
 * @type select
 * @option 顶部对齐 (Top) - 推荐
 * @value top
 * @option 垂直居中 (Center)
 * @value center
 * @option 底部对齐 (Bottom)
 * @value bottom
 * @desc 手机端推荐 Top。
 * @default top
 *
 * @param OffsetY
 * @parent --- Layout ---
 * @text 顶部偏移 (像素)
 * @type number
 * @min 0
 * @max 200
 * @desc 仅在 Top 模式下有效。用于避开手机摄像头的遮挡。
 * @default 0
 *
 * @param --- Border ---
 * @text [边框设置]
 *
 * @param EnableBorder
 * @parent --- Border ---
 * @text 启用边框
 * @type boolean
 * @default true
 *
 * @param BorderWidth
 * @parent --- Border ---
 * @text 边框粗细
 * @desc 视觉厚度(px)。建议 20-24。
 * @type number
 * @min 0
 * @default 22
 *
 * @param WindowSkinFile
 * @parent --- Border ---
 * @text 窗口皮肤
 * @type file
 * @dir img/system/
 * @default Window
 *
 * @param --- Background ---
 * @text [背景设置]
 *
 * @param EnableBackground
 * @parent --- Background ---
 * @text 启用背景
 * @type boolean
 * @default true
 *
 * @param BackgroundImage
 * @parent --- Background ---
 * @text 背景图片
 * @desc img/pictures/ 下的文件名。
 * @type file
 * @dir img/pictures/
 *
 * @param BackgroundColor
 * @parent --- Background ---
 * @text 背景颜色
 * @default #111111
 * * @param --- Calibration ---
 * @text [边框四向微调]
 * @desc 如果边框和画面有缝隙，调整这里。
 *
 * @param AdjustLeft
 * @parent --- Calibration ---
 * @text 修正：左边框
 * @desc 正数向右移，负数向左移。
 * @type number
 * @min -50
 * @max 50
 * @default 0
 *
 * @param AdjustRight
 * @parent --- Calibration ---
 * @text 修正：右边框
 * @desc 正数向右移，负数向左移。
 * @type number
 * @min -50
 * @max 50
 * @default 0
 *
 * @param AdjustTop
 * @parent --- Calibration ---
 * @text 修正：上边框
 * @desc 正数向下移，负数向上移。
 * @type number
 * @min -50
 * @max 50
 * @default 0
 *
 * @param AdjustBottom
 * @parent --- Calibration ---
 * @text 修正：下边框
 * @desc 正数向下移，负数向上移。
 * @type number
 * @min -50
 * @max 50
 * @default 0
 */

(() => {
    'use strict';

    const pluginName = "Sq_CanvasShiftBgFill"; // 保持一致的文件名以便读取参数
    const params = PluginManager.parameters(pluginName);

    // --- 核心分辨率设定 (J2ME竖屏比例) ---
    const FIXED_W = 480;
    const FIXED_H = 854;

    // --- 参数读取 ---
    const Config = {
        anchor: params['AnchorMode'] || 'top',
        offsetY: Number(params['OffsetY'] || 0),
        
        enableBorder: params['EnableBorder'] === 'true',
        borderWidth: Number(params['BorderWidth'] || 22),
        skinFileName: params['WindowSkinFile'] || "Window",
        
        enableBg: params['EnableBackground'] === 'true',
        bgImage: params['BackgroundImage'] || '',
        bgColor: params['BackgroundColor'] || '#111111',

        adjL: Number(params['AdjustLeft'] || 0),
        adjR: Number(params['AdjustRight'] || 0),
        adjT: Number(params['AdjustTop'] || 0),
        adjB: Number(params['AdjustBottom'] || 0)
    };

    //=============================================================================
    // 模块 1: Viewport 修复 (解决手机刘海屏黑边)
    //=============================================================================
    const ViewportFixer = {
        init() {
            let meta = document.querySelector('meta[name="viewport"]');
            if (!meta) {
                meta = document.createElement('meta');
                meta.name = 'viewport';
                document.head.appendChild(meta);
            }
            let content = meta.content || "width=device-width, user-scalable=no";
            if (!content.includes('viewport-fit=cover')) {
                meta.content = `${content}, viewport-fit=cover`;
            }
        }
    };

    //=============================================================================
    // 模块 2: CSS 注入 (强制全屏容器)
    //=============================================================================
    const CSSInjector = {
        init() {
            if (document.getElementById('force-mobile-layout-css')) return;
            const style = document.createElement('style');
            style.type = 'text/css';
            style.id = 'force-mobile-layout-css';
            style.innerHTML = `
                html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    background-color: #000;
                    overflow: hidden !important;
                    -webkit-user-select: none;
                    -webkit-tap-highlight-color: transparent;
                }
                canvas#gameCanvas {
                    position: absolute !important;
                    display: block !important;
                    margin: 0 !important;
                    z-index: 10;
                    image-rendering: -webkit-optimize-contrast;
                    /* 初始设为透明，避免闪烁 */
                    background-color: transparent !important; 
                }
            `;
            document.head.appendChild(style);
        }
    };

    //=============================================================================
    // 模块 3: 布局引擎 (计算画布位置 Anchor)
    //=============================================================================
    const LayoutEngine = {
        update(canvas) {
            const sw = window.innerWidth;
            const sh = window.innerHeight;

            // 计算缩放比，保持 FIXED_W / FIXED_H 比例
            const scale = Math.min(sw / FIXED_W, sh / FIXED_H);
            
            const realW = Math.floor(FIXED_W * scale);
            const realH = Math.floor(FIXED_H * scale);
            const left = Math.floor((sw - realW) / 2);

            let top = 0;
            if (Config.anchor === 'center') {
                top = Math.floor((sh - realH) / 2);
            } else if (Config.anchor === 'bottom') {
                top = sh - realH;
            } else {
                // Top
                top = Config.offsetY;
            }

            // 应用样式
            canvas.style.width = `${realW}px`;
            canvas.style.height = `${realH}px`;
            canvas.style.left = `${left}px`;
            canvas.style.top = `${top}px`; 
            
            // 更新 RPG Maker 内部缩放变量
            Graphics._scale = scale;
        },

        // 获取当前画布的实际位置信息，供边框使用
        getRect() {
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) return { left:0, top:0, width:0, height:0 };
            return canvas.getBoundingClientRect();
        }
    };

    //=============================================================================
    // 模块 4: 背景与边框管理器 (Border & Background)
    //=============================================================================
    class DecorationManager {
        constructor() {
            this._bgDiv = null;
            this._borderDiv = null;
            this._skinBitmap = null;
            this._borderDataUrl = null;
            this._isReady = false;
        }

        init() {
            this.setupBackground();
            if (Config.enableBorder) {
                this.loadWindowSkin();
            } else {
                this._isReady = true; // 无需边框则直接视为就绪
            }
        }

        setupBackground() {
            if (!Config.enableBg) return;
            if (document.getElementById('Sq_GameBackground')) return;

            this._bgDiv = document.createElement('div');
            this._bgDiv.id = 'Sq_GameBackground';
            const s = this._bgDiv.style;
            s.position = 'fixed';
            s.top = '0'; left: '0';
            s.width = '100vw'; s.height = '100vh';
            s.zIndex = '0'; // 在 Canvas(10) 之下
            s.backgroundColor = Config.bgColor;
            s.pointerEvents = 'none';

            if (Config.bgImage) {
                const url = `img/pictures/${Config.bgImage}`;
                const src = url.includes('.') ? url : url + '.png';
                s.backgroundImage = `url('${src}')`;
                s.backgroundPosition = 'center';
                s.backgroundRepeat = 'no-repeat';
                s.backgroundSize = 'cover';
            }
            document.body.appendChild(this._bgDiv);
        }

        loadWindowSkin() {
            this._skinBitmap = ImageManager.loadSystem(Config.skinFileName);
            this._skinBitmap.addLoadListener(this.processWindowSkin.bind(this));
        }

        processWindowSkin() {
            const frameW = 96; const frameH = 96;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = frameW; tempCanvas.height = frameH;
            const ctx = tempCanvas.getContext('2d');
            const image = this._skinBitmap.image;
            if (!image) return;

            // 提取 Window.png 的边框部分 (通常在右侧 96,0)
            ctx.drawImage(image, 96, 0, frameW, frameH, 0, 0, frameW, frameH);
            // 挖空中间
            ctx.clearRect(24, 24, 48, 48);

            this._borderDataUrl = tempCanvas.toDataURL();
            this.createBorderElement();
        }

        createBorderElement() {
            if (document.getElementById('Sq_GameBorder')) return;
            this._borderDiv = document.createElement('div');
            this._borderDiv.id = 'Sq_GameBorder';
            
            const s = this._borderDiv.style;
            s.position = 'fixed';
            s.pointerEvents = 'none'; // 点击穿透
            s.zIndex = '20'; // 在 Canvas(10) 之上
            s.borderStyle = 'solid';
            s.borderWidth = `${Config.borderWidth}px`;
            s.borderImageSource = `url(${this._borderDataUrl})`;
            s.borderImageSlice = '24 fill'; 
            s.borderImageRepeat = 'stretch';
            s.boxSizing = 'border-box'; 

            document.body.appendChild(this._borderDiv);
            this._isReady = true;
            this.syncBorder();
        }

        syncBorder() {
            // 将边框吸附到 Canvas 上
            if (!this._borderDiv) return;
            
            const rect = LayoutEngine.getRect();
            const s = this._borderDiv.style;
            const bw = Config.borderWidth;

            // --- 四向独立修正算法 ---
            
            // 计算 Left / Top
            const finalLeft = rect.left - bw + Config.adjL;
            const finalTop = rect.top - bw + Config.adjT;

            // 计算 Width / Height
            // 逻辑：理想宽度(包含边框) - 左修正 + 右修正
            const idealWidth = rect.width + (bw * 2);
            const idealHeight = rect.height + (bw * 2);

            const finalWidth = idealWidth - Config.adjL + Config.adjR;
            const finalHeight = idealHeight - Config.adjT + Config.adjB;

            s.width = `${Math.max(0, finalWidth)}px`;
            s.height = `${Math.max(0, finalHeight)}px`;
            s.left = `${finalLeft}px`;
            s.top = `${finalTop}px`;
        }
    }

    const decorationManager = new DecorationManager();

    //=============================================================================
    // 模块 5: 系统挂钩 (Main Hooks)
    //=============================================================================
    
    const _SceneManager_run = SceneManager.run;
    SceneManager.run = function(sceneClass) {
        _SceneManager_run.call(this, sceneClass);
        ViewportFixer.init();
        CSSInjector.init();
        decorationManager.init();
    };

    const _Graphics_updateCanvas = Graphics._updateCanvas;
    Graphics._updateCanvas = function() {
        _Graphics_updateCanvas.call(this);
        if (this._canvas) {
            // 1. 先强制移动 Canvas
            LayoutEngine.update(this._canvas);
            // 2. 再让边框跟随 Canvas
            decorationManager.syncBorder();
        }
    };
    
    const _Graphics_onWindowResize = Graphics._onWindowResize;
    Graphics._onWindowResize = function() {
        _Graphics_onWindowResize.call(this);
        this._updateCanvas();
    };

    //=============================================================================
    // 模块 6: 触控修正 (Touch Input Fix)
    // 必须保留，因为我们在手动移动 Canvas，默认的点击坐标会不准。
    //=============================================================================
    TouchInput._convertToGamePos = function(clientX, clientY) {
        const canvas = Graphics._canvas;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scale = Graphics._scale || 1;
        this._realX = Math.floor((clientX - rect.left) / scale);
        this._realY = Math.floor((clientY - rect.top) / scale);
    };

    // 覆盖 MZ 的触摸事件处理，确保使用修正后的坐标
    const _TouchInput_onTouchStart = TouchInput._onTouchStart;
    TouchInput._onTouchStart = function(event) {
        _TouchInput_onTouchStart.call(this, event);
        const t = event.changedTouches ? event.changedTouches[0] : event;
        if (t) this._convertToGamePos(t.clientX, t.clientY);
        this._x = this._realX;
        this._y = this._realY;
    };

    const _TouchInput_onTouchMove = TouchInput._onTouchMove;
    TouchInput._onTouchMove = function(event) {
        _TouchInput_onTouchMove.call(this, event);
        const t = event.changedTouches ? event.changedTouches[0] : event;
        if (t) this._convertToGamePos(t.clientX, t.clientY);
        this._x = this._realX;
        this._y = this._realY;
    };

    const _TouchInput_onMouseMove = TouchInput._onMouseMove;
    TouchInput._onMouseMove = function(event) {
        _TouchInput_onMouseMove.call(this, event);
        this._convertToGamePos(event.clientX, event.clientY);
        this._x = this._realX;
        this._y = this._realY;
    };

})();