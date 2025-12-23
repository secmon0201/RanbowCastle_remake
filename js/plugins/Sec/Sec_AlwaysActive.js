/*:
 * @target MZ
 * @plugindesc [系统] 真·后台运行 (修复最小化/遮挡暂停问题) v2.0
 * @author AI Architect (Edited by Secmon)
 * @orderAfter Sec_AutoBattleAI
 *
 * @help
 * ============================================================================
 * Sec_AlwaysActive.js v2.0
 * ============================================================================
 *
 * 【核心修复】
 * v1.0 版本只解决了“失去焦点”的问题，但未解决“最小化”导致的内核休眠。
 * v2.0 增加了“心脏起搏器”机制：
 * 当窗口被完全遮挡或最小化时，浏览器内核会停止 requestAnimationFrame。
 * 本插件会自动切换到 setInterval 模式强行驱动游戏逻辑更新。
 *
 * 【注意事项】
 * 1. 后台运行时，为了防止崩溃和节省资源，会跳过画面渲染(Render)，
 * 只运行游戏逻辑(Update)。当你切回来时，画面会瞬间同步到最新状态。
 * 2. 如果觉得后台运行依然卡顿（被锁在1帧/秒），请修改 package.json（见下文）。
 *
 * ============================================================================
 * * @param DisableAudioPause
 * @text 后台保持音效
 * @desc 是否在失去焦点时保持 SE/BGS (音效/环境音) 继续播放？
 * @type boolean
 * @default true
 * * * @param BackgroundFPS
 * @text 后台逻辑帧率
 * @desc 窗口最小化/遮挡时的运行速度。60为全速，降低此数值可减少挂机时的CPU占用。
 * @type number
 * @default 60
 * */

(() => {
    'use strict';

    const pluginName = "Sec_AlwaysActive";
    const parameters = PluginManager.parameters(pluginName);
    const disableAudioPause = (parameters['DisableAudioPause'] === "true");
    const bgFPS = Number(parameters['BackgroundFPS'] || 60);
    const bgInterval = 1000 / bgFPS;

    // ======================================================================
    // 1. 逻辑激活：欺骗引擎，让它以为游戏永远是"激活"的
    // ======================================================================
    SceneManager.isGameActive = function() {
        return true;
    };

    // ======================================================================
    // 2. 输入保护：防止因失去焦点导致的 Input 状态清除
    // ======================================================================
    const _Input_onWindowBlur = Input._onWindowBlur;
    Input._onWindowBlur = function() {
        // 不清除输入状态，防止挂机脚本按键中断
        // _Input_onWindowBlur.call(this); 
    };

    // ======================================================================
    // 3. 核心修复：心脏起搏器 (Bypass requestAnimationFrame throttling)
    // ======================================================================
    
    // 覆盖 Graphics._onTick，这是游戏每一帧的入口
    const _Graphics_onTick = Graphics._onTick;
    
    // 我们需要一个变量来存储定时器ID
    let _backgroundTimer = null;

    // 启动备用循环的函数
    const startBackgroundLoop = () => {
        if (_backgroundTimer) clearInterval(_backgroundTimer);
        _backgroundTimer = setInterval(() => {
            // 如果窗口不可见（最小化/被遮挡），手动驱动逻辑
            if (!isWindowVisible()) {
                // 仅更新逻辑，不渲染画面 (SceneManager.updateMain)
                // 这里的 deltaTime 模拟正常帧数
                try {
                    SceneManager.update(bgInterval / 1000); 
                } catch (e) {
                    // 防止后台报错导致游戏崩溃
                    console.error("后台运行出错:", e);
                }
            }
        }, bgInterval);
    };

    // 辅助函数：判断窗口是否可见
    const isWindowVisible = () => {
        return document.visibilityState === 'visible';
    };

    // 劫持游戏循环启动
    const _Graphics_startGameLoop = Graphics.startGameLoop;
    Graphics.startGameLoop = function() {
        _Graphics_startGameLoop.call(this);
        // 启动我们的备用心脏
        startBackgroundLoop();
    };

    // 劫持游戏循环停止
    const _Graphics_stopGameLoop = Graphics.stopGameLoop;
    Graphics.stopGameLoop = function() {
        _Graphics_stopGameLoop.call(this);
        if (_backgroundTimer) {
            clearInterval(_backgroundTimer);
            _backgroundTimer = null;
        }
    };

    // ======================================================================
    // 4. 音频：防止失去焦点时静音 (SE/BGS)
    // ======================================================================
    if (disableAudioPause) {
        if (typeof WebAudio !== 'undefined') {
            WebAudio._onVisibilityChange = function() {
                // 彻底屏蔽"可见性改变"对音频的影响
            };
        }
        AudioManager.checkVisibility = function() {
            return true;
        };
    }

})();