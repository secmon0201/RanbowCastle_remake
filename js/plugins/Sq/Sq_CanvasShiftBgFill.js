/*:
 * @target MZ
 * @plugindesc [移动端强力版] 480x720 画布强制置顶，解决手机端居中问题，包含CSS注入功能
 * @author ChatGPT & User (Mobile Force Fix)
 *
 * @help
 * ============================================================================
 * 移动端显示问题修复说明
 * ============================================================================
 * 若在手机端使用时发现画面依然居中或顶部存在黑边，请按以下步骤排查：
 * 1. 确保插件参数中的「锚点模式」已选择 "顶部对齐 (Top)"
 * 2. 本版本采用CSS !important语法强制定位，优先级最高
 * 3. 自动清除body元素的margin和padding，避免额外间距影响
 *
 * ============================================================================
 *
 * @param AnchorMode
 * @text 画布停靠位置
 * @type select
 * @option 顶部对齐 (Top) - 手游推荐
 * @value top
 * @option 垂直居中 (Center)
 * @value center
 * @option 底部对齐 (Bottom)
 * @value bottom
 * @desc 手机端请务必选择 Top。
 * @default top
 *
 * @param OffsetY
 * @text 顶部偏移 (避让刘海)
 * @type number
 * @min 0
 * @max 200
 * @desc 仅在顶部对齐时有效。例如 50 可以让画面下移 50 像素避开摄像头。
 * @default 0
 *
 * @param BackgroundImage
 * @text 背景图片
 * @type file
 * @dir img/pictures/
 * @desc 填充黑边的图片。
 * @default
 *
 * @param BackgroundMode
 * @text 图片填充模式
 * @type select
 * @option cover (铺满)
 * @value cover
 * @option contain (完整)
 * @value contain
 * @default cover
 */

(() => {
    'use strict';

    const PLUGIN_NAME = document.currentScript.src.split("/").pop().replace(".js", "");
    const FIXED_W = 480;
    const FIXED_H = 720;
    const params = PluginManager.parameters(PLUGIN_NAME);

    const Config = {
        anchor: params['AnchorMode'] || 'top',
        offsetY: Number(params['OffsetY'] || 0),
        bgImage: params['BackgroundImage'] || '',
        bgMode: params['BackgroundMode'] || 'cover'
    };

    //=============================================================================
    // 1. CSS 强力注入器 (专门解决移动端居中顽疾)
    //=============================================================================
    const CSSInjector = {
        init() {
            const style = document.createElement('style');
            style.type = 'text/css';
            style.id = 'force-mobile-layout-css';
            
            // 计算顶部距离
            const topVal = (Config.anchor === 'top') ? `${Config.offsetY}px` : 'auto';
            
            // 构建强制 CSS
            // body: 禁用 flex 居中，重置边距
            // canvas: 强制 margin:0, 强制 top 位置
            const css = `
                body {
                    margin: 0 !important;
                    padding: 0 !important;
                    display: block !important; /* 禁止 Flex 居中 */
                    overflow: hidden !important;
                    background-color: #000;
                }
                canvas#gameCanvas {
                    margin: 0 !important; /* 禁止 auto 居中 */
                    position: absolute !important;
                    transform-origin: 0 0 !important; /* 防止旋转锚点错误 */
                    ${Config.anchor === 'top' ? `top: ${topVal} !important; bottom: auto !important;` : ''}
                    ${Config.anchor === 'bottom' ? `bottom: 0 !important; top: auto !important;` : ''}
                    /* 如果是 center，交给 JS 计算，不强制 top/bottom */
                }
                #fixed-bg-layer {
                    position: fixed !important;
                    top: 0; left: 0;
                    width: 100vw; height: 100vh;
                    z-index: -1;
                    pointer-events: none;
                }
            `;
            style.innerHTML = css;
            document.head.appendChild(style);
        }
    };

    //=============================================================================
    // 2. 布局计算 (Layout Engine)
    //=============================================================================
    const LayoutEngine = {
        update(canvas) {
            const sw = window.innerWidth;
            const sh = window.innerHeight;

            // 1. 缩放计算：确保 480x720 能够完整放入屏幕
            const scale = Math.min(sw / FIXED_W, sh / FIXED_H);
            const realW = FIXED_W * scale;
            const realH = FIXED_H * scale;

            // 2. X轴永远居中
            const left = (sw - realW) / 2;

            // 3. Y轴 JS 计算 (作为 CSS 的补充，主要处理 Center 模式)
            let top = 0;
            if (Config.anchor === 'center') {
                top = (sh - realH) / 2;
            } else if (Config.anchor === 'bottom') {
                top = sh - realH;
            } else {
                // Top 模式
                top = Config.offsetY;
            }

            // 4. 应用样式 (注意：CSS !important 会覆盖这里的 top，双重保险)
            canvas.style.width = `${realW}px`;
            canvas.style.height = `${realH}px`;
            canvas.style.left = `${left}px`;
            
            // 只有在非 Top 模式或者需要动态计算时，JS 的 top 才起作用
            // 但为了兼容性，我们依然赋值
            canvas.style.top = `${top}px`; 
            
            // 更新系统 Scale，修正点击
            Graphics._scale = scale;
        }
    };

    //=============================================================================
    // 3. 背景管理
    //=============================================================================
    const BGManager = {
        init() {
            if (!Config.bgImage) return;
            const div = document.createElement('div');
            div.id = 'fixed-bg-layer';
            const url = `img/pictures/${Config.bgImage}`;
            const src = url.includes('.') ? url : url + '.png';
            
            Object.assign(div.style, {
                backgroundImage: `url('${src}')`,
                backgroundSize: Config.bgMode,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            });
            
            document.body.appendChild(div);
            // 强制 canvas 透明
            if (Graphics._canvas) Graphics._canvas.style.backgroundColor = 'transparent';
        }
    };

    //=============================================================================
    // 4. 系统挂钩 (Hook)
    //=============================================================================
    
    // 游戏启动时注入 CSS
    const _SceneManager_run = SceneManager.run;
    SceneManager.run = function(sceneClass) {
        _SceneManager_run.call(this, sceneClass);
        CSSInjector.init(); // <--- 关键：注入强制样式
        BGManager.init();
    };

    // 每帧刷新布局
    const _Graphics_updateCanvas = Graphics._updateCanvas;
    Graphics._updateCanvas = function() {
        _Graphics_updateCanvas.call(this);
        if (this._canvas) {
            LayoutEngine.update(this._canvas);
            // 再次确保透明，防止被重置
            this._canvas.style.backgroundColor = 'transparent';
        }
    };
    
    const _Graphics_onWindowResize = Graphics._onWindowResize;
    Graphics._onWindowResize = function() {
        _Graphics_onWindowResize.call(this);
        this._updateCanvas();
    };

    //=============================================================================
    // 5. 触控修正 (Touch Fix)
    //=============================================================================
    TouchInput._convertToGamePos = function(clientX, clientY) {
        const canvas = Graphics._canvas;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scale = Graphics._scale || 1;
        this._realX = Math.floor((clientX - rect.left) / scale);
        this._realY = Math.floor((clientY - rect.top) / scale);
    };

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

    // 兼容鼠标
    const _TouchInput_onMouseMove = TouchInput._onMouseMove;
    TouchInput._onMouseMove = function(event) {
        _TouchInput_onMouseMove.call(this, event);
        this._convertToGamePos(event.clientX, event.clientY);
        this._x = this._realX;
        this._y = this._realY;
    };

})();