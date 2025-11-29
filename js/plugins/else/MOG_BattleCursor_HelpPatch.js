//=============================================================================
// MOG_BattleCursor_HelpPatch.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 【MOG扩展补丁】选目标时保留顶部说明窗口
 * @author 豆包编程助手 & Gemini
 * @help
 * =============================================================================
 * ♦ 说明 ♦
 * 这个插件必须放在 MOG_BattleCursor (优化版) 的下方。
 *
 * 功能：
 * 当 MOG 插件隐藏了技能/物品列表时，此插件会强制保留顶部的
 * “帮助窗口”（显示技能/物品描述的那个横条），
 * 让玩家在选择敌人/队友时依然能看到技能说明。
 * =============================================================================
 */

(() => {
    
    //==============================
    // ♦ ALIAS ♦ onSelectAction
    //==============================
    // 当开始选择目标时
    const _mog_patch_scene_battle_onSelectAction = Scene_Battle.prototype.onSelectAction;
    Scene_Battle.prototype.onSelectAction = function() {
        // 1. 执行原有的逻辑（MOG插件会在这里隐藏技能/物品/指令窗口）
        _mog_patch_scene_battle_onSelectAction.call(this);

        // 2. 【核心逻辑】强制显示帮助窗口
        if (this._helpWindow) {
            this._helpWindow.show();
            this._helpWindow.visible = true;
            
            // 确保帮助窗口的不透明度正常（防止被其他插件误修改）
            this._helpWindow.opacity = 255; 
        }
    };

    //==============================
    // ♦ ALIAS ♦ onEnemyCancel
    //==============================
    // 当取消选择敌人时
    const _mog_patch_scene_battle_onEnemyCancel = Scene_Battle.prototype.onEnemyCancel;
    Scene_Battle.prototype.onEnemyCancel = function() {
        _mog_patch_scene_battle_onEnemyCancel.call(this);
        
        // 确保帮助窗口状态同步（通常 MOG 主插件恢复技能窗口时会自动关联，这里是双重保险）
        if (this._helpWindow) {
            this._helpWindow.show();
        }
    };

    //==============================
    // ♦ ALIAS ♦ onActorCancel
    //==============================
    // 当取消选择队友时
    const _mog_patch_scene_battle_onActorCancel = Scene_Battle.prototype.onActorCancel;
    Scene_Battle.prototype.onActorCancel = function() {
        _mog_patch_scene_battle_onActorCancel.call(this);
        
        if (this._helpWindow) {
            this._helpWindow.show();
        }
    };

})();