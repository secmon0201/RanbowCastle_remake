/*:
 * @target MZ
 * @plugindesc [界面] 自定义战斗窗口皮肤 & 战斗日志净化 (v1.4.1 Fix)
 * @author 神枪手 (Optimized by Gemini)
 * @version 1.4.1
 * * @param battleWindowSkin
 * @text 战斗窗口皮肤名称
 * @desc 自定义战斗相关窗口使用的皮肤文件名（需放在img/system/文件夹）
 * @default Battlewindow
 * @type string
 * * @param battleLogOpacity
 * @text 战斗日志透明度
 * @desc 战斗日志窗口的透明度（0-255，0为完全透明）
 * @default 0
 * @type number
 * @min 0
 * @max 255
 * * @param logClearDelay
 * @text 日志自动清空延迟(毫秒)
 * @desc 战斗动作结束后，日志保持显示的时间（单位：毫秒，1000=1秒）
 * @default 1000
 * @type number
 * @min 0
 * @max 5000
 * * @help
 * ============================================================================
 * 版本更新说明 (v1.4.1)
 * ============================================================================
 * - 修复了日志窗口调整层级时发生的 "addChild of null" 崩溃错误。
 *
 * ============================================================================
 * 功能说明
 * ============================================================================
 * 1. 窗口皮肤自定义：
 * 自动将战斗中的命令窗口、状态窗口、日志窗口、帮助窗口等替换为指定皮肤。
 * * 2. 战斗日志样式优化：
 * - 日志窗口默认隐藏，有内容时自动显示并置顶（最上层）
 * - 无内容时自动隐藏并恢复原始图层层级
 * - 文字居中显示，强制单行显示
 * - 固定于屏幕底部，宽度与屏幕一致
 * - 可通过参数设置窗口透明度
 * - 可通过参数控制日志自动清空的延迟时间
 * * 3. MP日志智能过滤：
 * - 自动屏蔽“自动回蓝”（如攻击回蓝/受击回蓝）的提示文本，防止刷屏
 * - 保留正常操作（物品/技能）导致的MP回复提示
 * - 需配合战斗机制插件：回蓝前设置 target._ignoreMpLog = true 即可触发过滤
 * * ============================================================================
 * 使用方法
 * ============================================================================
 * 1. 皮肤设置：
 * 将自定义皮肤图片（PNG格式）放入项目的 img/system/ 文件夹，
 * 在“战斗窗口皮肤名称”参数中填写文件名（无需加.png后缀）。
 * * 2. 日志控制：
 * 通过“日志自动清空延迟”参数调整日志显示时长（0-5000毫秒），
 * 通过“战斗日志透明度”参数设置窗口背景透明度。
 * * 3. 回蓝日志过滤：
 * 若需屏蔽自动回蓝提示，确保战斗机制插件在触发回蓝前执行：
 * target._ignoreMpLog = true;
 */

(function() {
    // ========================================================================
    // 1. 获取插件参数
    // ========================================================================
    const parameters = PluginManager.parameters('Sq_BattleWindow'); 
    const battleWindowSkin = String(parameters['battleWindowSkin'] || 'Battlewindow');
    const battleLogOpacity = Number(parameters['battleLogOpacity'] || 0);
    const logClearDelay = Number(parameters['logClearDelay'] || 1000); 

    // ========================================================================
    // 2. 加载自定义窗口皮肤 (Load Window Skins)
    // ========================================================================
    
    // 自定义战斗队伍命令窗口皮肤
    Window_PartyCommand.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem(battleWindowSkin);
    };

    // 自定义战斗状态窗口皮肤
    Window_BattleStatus.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem(battleWindowSkin);
    };

    // 自定义战斗角色命令窗口皮肤
    Window_ActorCommand.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem(battleWindowSkin);
    };

    // 自定义战斗日志窗口皮肤
    Window_BattleLog.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem(battleWindowSkin);
    };
    
    // 自定义帮助窗口皮肤
    Window_Help.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem(battleWindowSkin);
    };
    
    // 自定义菜单命令窗口皮肤
    Window_MenuCommand.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem(battleWindowSkin);
    };
    
    // 自定义菜单角色选择窗口
    Window_MenuActor.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem(battleWindowSkin);
    };

    // ========================================================================
    // 3. 战斗日志窗口核心逻辑 (Battle Log Logic)
    // ========================================================================

    const _Window_BattleLog_initialize = Window_BattleLog.prototype.initialize;
    Window_BattleLog.prototype.initialize = function(rect) {
        _Window_BattleLog_initialize.call(this, rect);
        this.opacity = 0; // 初始透明度
        this.visible = false; // 初始隐藏（无内容时不显示）
        this._lines = []; 
        this._originalLayerIndex = null; // 用于存储原始层级索引
        this.loadWindowskin(); // 加载自定义皮肤
    };

    // 核心：根据内容动态切换可见性及层级
    Window_BattleLog.prototype.updateVisibilityByContent = function() {
        const hasContent = this._lines.length > 0;
        
        // --- Fix: 使用局部变量缓存 parent，防止 removeChild 后 this.parent 丢失 ---
        const parent = this.parent; 

        if (parent) {
            // 第一次运行时，记录原始层级位置
            if (this._originalLayerIndex === null) {
                this._originalLayerIndex = parent.children.indexOf(this);
            }

            if (hasContent) {
                // 有内容：移至最顶层
                // 检查是否已经在最顶层，避免重复操作
                if (parent.children.indexOf(this) !== parent.children.length - 1) {
                    parent.removeChild(this); // 此时 this.parent 变为 null
                    parent.addChild(this);    // 使用缓存的 parent 变量重新添加
                }
            } else {
                // 无内容：恢复到原始层级
                const currentIndex = parent.children.indexOf(this);
                // 只有当位置不对，且原始索引有效时才移动
                if (currentIndex !== this._originalLayerIndex && this._originalLayerIndex > -1) {
                    parent.removeChild(this);
                    // 确保不会超出数组范围
                    const targetIndex = Math.min(this._originalLayerIndex, parent.children.length);
                    parent.addChildAt(this, targetIndex);
                }
            }
        }
        // -----------------------------

        this.visible = hasContent; 
        this.opacity = hasContent ? battleLogOpacity : 0; 
    };

    // 添加文本时：更新显隐
    const _Window_BattleLog_addText = Window_BattleLog.prototype.addText;
    Window_BattleLog.prototype.addText = function(text) {
        _Window_BattleLog_addText.call(this, text);
        // 保持单行显示
        while (this._lines.length > this.maxLines()) {
            this._lines.shift(); 
        }
        this.updateVisibilityByContent();
        this.refresh();
    };

    // 清空日志时：触发隐藏
    const _Window_BattleLog_clear = Window_BattleLog.prototype.clear;
    Window_BattleLog.prototype.clear = function() {
        _Window_BattleLog_clear.call(this);
        this.updateVisibilityByContent();
    };

    // 回滚日志行时：触发显隐
    const _Window_BattleLog_popBaseLine = Window_BattleLog.prototype.popBaseLine;
    Window_BattleLog.prototype.popBaseLine = function() {
        _Window_BattleLog_popBaseLine.call(this);
        this.updateVisibilityByContent();
        this.refresh();
    };

    // 强制单行显示
    Window_BattleLog.prototype.maxLines = function() {
        return 1;
    };

    // 窗口位置与尺寸 (底部 + 全宽)
    Scene_Battle.prototype.logWindowRect = function() {
        const wx = 0;
        const ww = Graphics.boxWidth;
        const wh = this.calcWindowHeight(1, false); 
        const wy = Graphics.boxHeight - wh; 
        return new Rectangle(wx, wy, ww, wh);
    };

    // 文本居中绘制
    Window_BattleLog.prototype.drawLineText = function(index) {
        const contentWidth = this.contentsWidth();
        const lineHeight = this.lineHeight();
        const text = this._lines[index];

        const textWidth = this.textSizeEx(text).width;
        const yPos = index * lineHeight;
        this.contents.clearRect(0, yPos, contentWidth, lineHeight);
        const startX = (contentWidth - textWidth) / 2;
        this.drawTextEx(text, startX, yPos);
    };

    // 战斗动作结束后延迟清空日志
    const _Scene_Battle_endAction = Scene_Battle.prototype.endAction;
    Scene_Battle.prototype.endAction = function(subject) {
        _Scene_Battle_endAction.call(this, subject);
        const logWindow = this._logWindow;
        if (logWindow) {
            setTimeout(() => {
                // 安全检查：确保窗口未被销毁
                if (logWindow && !logWindow.destroyed) {
                    logWindow.clear();
                }
            }, logClearDelay); 
        }
    };

    // ========================================================================
    // 4. MP日志过滤逻辑 (MP Log Filtering)
    // ========================================================================
    
    const _Window_BattleLog_displayMpDamage = Window_BattleLog.prototype.displayMpDamage;
    Window_BattleLog.prototype.displayMpDamage = function(target) {
        if (target._ignoreMpLog) {
            target._ignoreMpLog = false;
            if (target.result().mpDamage < 0) {
                return;
            }
        } else {
            target._ignoreMpLog = false;
        }
        _Window_BattleLog_displayMpDamage.call(this, target);
    };

})();