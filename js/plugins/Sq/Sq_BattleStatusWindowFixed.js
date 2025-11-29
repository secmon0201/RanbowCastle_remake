/*:
 * @target MZ
 * @plugindesc 战斗状态窗口固定位置插件 v1.0.0
 * @author 神枪手
 * @url 
 * 
 * @help 该插件将战斗状态窗口固定在指定位置，不会因任何操作移动。
 * 
 * @param fixedX
 * @text 固定X坐标
 * @desc 状态窗口固定的X坐标位置
 * @type number
 * @default 0
 * 
 * @param fixedY
 * @text 固定Y坐标
 * @desc 状态窗口固定的Y坐标位置
 * @default 0
 * 
 * @param fixedWidth
 * @text 固定宽度
 * @desc 状态窗口的固定宽度（留空则使用默认宽度）
 * @type number
 * @default 480
 * 
 * @param fixedHeight
 * @text 固定高度
 * @desc 状态窗口的固定高度（留空则使用默认高度）
 * @type number
 * @default 
 */

(() => {
    // 获取插件参数
    const pluginName = "Sq_BattleStatusWindowFixed";
    const parameters = PluginManager.parameters(pluginName);
    
    // 解析参数
    const fixedX = parseInt(parameters.fixedX) || 0;
    const fixedY = parseInt(parameters.fixedY) || 100;
    const fixedWidth = parameters.fixedWidth ? parseInt(parameters.fixedWidth) : null;
    const fixedHeight = parameters.fixedHeight ? parseInt(parameters.fixedHeight) : null;

    // 1. 固定状态窗口的位置和尺寸
    const _Scene_Battle_statusWindowRect = Scene_Battle.prototype.statusWindowRect;
    Scene_Battle.prototype.statusWindowRect = function() {
        // 如果设置了固定尺寸则使用，否则使用默认尺寸
        const ww = fixedWidth || _Scene_Battle_statusWindowRect.call(this).width;
        const wh = fixedHeight || _Scene_Battle_statusWindowRect.call(this).height;
        return new Rectangle(fixedX, fixedY, ww, wh);
    };

    // 2. 创建窗口后强制设置位置（防止其他插件干扰）
    const _Scene_Battle_createStatusWindow = Scene_Battle.prototype.createStatusWindow;
    Scene_Battle.prototype.createStatusWindow = function() {
        _Scene_Battle_createStatusWindow.call(this);
        if (this._statusWindow) {
            // 强制固定位置
            this._statusWindow.x = fixedX;
            this._statusWindow.y = fixedY;
            // 锁定窗口位置，防止被修改
            this._statusWindow._isFixedPosition = true;
        }
    };

    // 3. 重写窗口的移动方法，确保位置不变
    const _Window_Base_setX = Window_Base.prototype.setX;
    Window_Base.prototype.setX = function(x) {
        if (!this._isFixedPosition) {
            _Window_Base_setX.call(this, x);
        }
    };

    const _Window_Base_setY = Window_Base.prototype.setY;
    Window_Base.prototype.setY = function(y) {
        if (!this._isFixedPosition) {
            _Window_Base_setY.call(this, y);
        }
    };

    // 4. 确保攻击指令选择时窗口保持可见和位置不变
    const _Scene_Battle_commandAttack = Scene_Battle.prototype.commandAttack;
    Scene_Battle.prototype.commandAttack = function() {
        _Scene_Battle_commandAttack.call(this);
        if (this._statusWindow) {
            this._statusWindow.visible = true;
            // 重置位置以防万一
            this._statusWindow.x = fixedX;
            this._statusWindow.y = fixedY;
        }
    };

    // 5. 移除所有可能的位置更新逻辑
    const _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        _Scene_Battle_update.call(this);
        // 确保窗口始终在固定位置
        if (this._statusWindow) {
            if (this._statusWindow.x !== fixedX) this._statusWindow.x = fixedX;
            if (this._statusWindow.y !== fixedY) this._statusWindow.y = fixedY;
        }
    };
    
})();