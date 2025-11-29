/*:
 * @target MZ
 * @plugindesc [界面] 自定义战斗窗口皮肤 & 战斗日志净化
 * @author 神枪手 (Optimized by Gemini)
 * @version 1.3
 * 
 * @param battleWindowSkin
 * @text 战斗窗口皮肤名称
 * @desc 自定义战斗相关窗口使用的皮肤文件名（需放在img/system/文件夹）
 * @default Battlewindow
 * @type string
 * 
 * @param battleLogOpacity
 * @text 战斗日志透明度
 * @desc 战斗日志窗口的透明度（0-255，0为完全透明）
 * @default 0
 * @type number
 * @min 0
 * @max 255
 * 
 * @param logClearDelay
 * @text 日志自动清空延迟(毫秒)
 * @desc 战斗动作结束后，日志保持显示的时间（单位：毫秒，1000=1秒）
 * @default 1000
 * @type number
 * @min 0
 * @max 5000
 * 
 * @help
 * ============================================================================
 * 功能说明
 * ============================================================================
 * 1. 窗口皮肤自定义：
 * 自动将战斗中的命令窗口、状态窗口、日志窗口、帮助窗口等替换为指定皮肤。
 * 
 * 2. 战斗日志样式优化：
 * - 日志窗口默认隐藏，有内容时自动显示
 * - 文字居中显示，强制单行显示
 * - 固定于屏幕底部，宽度与屏幕一致
 * - 可通过参数设置窗口透明度
 * - 可通过参数控制日志自动清空的延迟时间
 * 
 * 3. MP日志智能过滤：
 * - 自动屏蔽“自动回蓝”（如攻击回蓝/受击回蓝）的提示文本，防止刷屏
 * - 保留正常操作（物品/技能）导致的MP回复提示
 * - 需配合战斗机制插件：回蓝前设置 target._ignoreMpLog = true 即可触发过滤
 * 
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 1. 皮肤设置：
 * 将自定义皮肤图片（PNG格式）放入项目的 img/system/ 文件夹，
 * 在“战斗窗口皮肤名称”参数中填写文件名（无需加.png后缀）。
 * 
 * 2. 日志控制：
 * 通过“日志自动清空延迟”参数调整日志显示时长（0-5000毫秒），
 * 通过“战斗日志透明度”参数设置窗口背景透明度。
 * 
 * 3. 回蓝日志过滤：
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
    const logClearDelay = Number(parameters['logClearDelay'] || 1000); // 新增日志延迟参数

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
        this.loadWindowskin(); // 加载自定义皮肤
    };

    // 核心：根据内容动态切换可见性
    Window_BattleLog.prototype.updateVisibilityByContent = function() {
        const hasContent = this._lines.length > 0;
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

    // 战斗动作结束后延迟清空日志（使用新增参数控制延迟时间）
    const _Scene_Battle_endAction = Scene_Battle.prototype.endAction;
    Scene_Battle.prototype.endAction = function(subject) {
        _Scene_Battle_endAction.call(this, subject);
        const logWindow = this._logWindow;
        if (logWindow) {
            setTimeout(() => {
                logWindow.clear();
            }, logClearDelay); // 使用插件参数中的延迟时间
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