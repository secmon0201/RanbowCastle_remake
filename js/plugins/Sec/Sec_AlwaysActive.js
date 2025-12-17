/*:
 * @target MZ
 * @plugindesc [系统] 后台运行/失去焦点不暂停
 * @author AI Architect
 * @orderAfter Sec_AutoBattleAI
 *
 * @help
 * ============================================================================
 * Sec_AlwaysActive.js
 * ============================================================================
 *
 * 【功能说明】
 * 默认情况下，当玩家点击游戏窗口以外的区域（失去焦点）时，
 * RPG Maker 会自动暂停游戏逻辑，只播放 BGM。
 *
 * 这个插件会强制游戏在后台继续运行：
 * 1. 战斗自动进行。
 * 2. 动画继续播放。
 * 3. 并行事件继续执行。
 *
 * 适用于：挂机自动战斗、长时间过场剧情等场景。
 *
 * 【注意】
 * 如果玩家最小化窗口，部分操作系统/浏览器内核可能会为了省电
 * 强制降低帧率（锁1帧），这是系统层面的限制，插件无法完全突破，
 * 但只要窗口是打开状态（即使被挡在后面），游戏都会全速运行。
 *
 * ============================================================================
 * * @param DisableAudioPause
 * @text 后台保持音效
 * @desc 是否在失去焦点时保持 SE/BGS (音效/环境音) 继续播放？
 * (BGM 默认本身就会播放，此项主要控制音效)
 * @type boolean
 * @default true
 * */

(() => {
    'use strict';

    const pluginName = "Sec_AlwaysActive";
    const parameters = PluginManager.parameters(pluginName);
    const disableAudioPause = (parameters['DisableAudioPause'] === "true");

    // ======================================================================
    // 1. 核心：欺骗引擎，让它以为游戏永远是"激活"的
    // ======================================================================
    
    // 覆盖 SceneManager.isGameActive
    // 原逻辑：return this._scene && this._scene.isActive(); (且受 blur 影响)
    // 新逻辑：永远返回 true
    const _SceneManager_isGameActive = SceneManager.isGameActive;
    SceneManager.isGameActive = function() {
        // 强制返回 true，让 updateMain 永不停歇
        return true;
    };

    // ======================================================================
    // 2. 核心：防止因失去焦点导致的 Input 状态清除
    // ======================================================================
    
    // 通常失去焦点时，引擎会清除按键状态。
    // 对于挂机脚本来说，我们不希望输入状态被打断（虽然自动战斗主要靠AI）。
    const _Input_onWindowBlur = Input._onWindowBlur;
    Input._onWindowBlur = function() {
        // 原逻辑会 clear()，这里我们什么都不做，或者仅做最小化处理
        // 为了防止按键卡死（比如按住Shift切出去），我们还是保留清除，
        // 但这不会影响游戏的 Update 循环。
        _Input_onWindowBlur.call(this);
    };

    // ======================================================================
    // 3. 音频：防止失去焦点时静音 (SE/BGS)
    // ======================================================================
    
    if (disableAudioPause) {
        // WebAudio 默认会在页面隐藏时自动暂停。
        // 我们通过覆盖可见性处理函数来阻止这一行为。
        if (typeof WebAudio !== 'undefined') {
            const _WebAudio_onVisibilityChange = WebAudio._onVisibilityChange;
            WebAudio._onVisibilityChange = function() {
                // 彻底屏蔽"可见性改变"对音频的影响
                // 原逻辑会调用 _onHide / _onShow
            };
        }
        
        // 针对 AudioManager 的检测
        const _AudioManager_checkVisibility = AudioManager.checkVisibility;
        AudioManager.checkVisibility = function(active) {
            // 永远告诉音频管理器：我们是可见的
            return true;
        };
    }

})();