/*:
 * @target MZ
 * @plugindesc [剧情] 新手强制引导系统 (修复版 v1.1) - 允许取消/退出
 * @author 神枪手
 * @help
 * ============================================================================
 * 插件功能说明 (v1.1 修复版)
 * ============================================================================
 * 本插件用于在剧情中（如新手教学）强制引导玩家操作 UI。
 * * 【核心特性】
 * 1. 锁定光标：当引导开启时，玩家的光标被死死锁在指定的选项上（上下左右无效）。
 * 2. 视觉指引：目标选项上会显示一个浮动的黄色箭头。
 * 3. 允许退出：玩家依然可以按 ESC / 取消键退出当前菜单（为了配合事件流逻辑）。
 * 4. 战斗限制：可以强制玩家只能使用特定技能攻击特定敌人。
 *
 * ============================================================================
 * 脚本调用 / 插件命令示例 (直接复制到事件指令)
 * ============================================================================
 * * ----------------------------------------------------------
 * 1. 【设置UI指引】 (Set Guide)
 * ----------------------------------------------------------
 * 作用：锁住某个窗口的某个选项，让玩家只能点它。
 * * [插件命令方式]
 * 插件名: Sec_TutorialSystem
 * 命令名: setGuide
 * 参数:
 * windowName: Window_MenuCommand  (主菜单)
 * index:      4                   (第5个选项，例如“天赋”)
 *
 * [脚本调用方式] (高级用户用)
 * PluginManager.callCommand(this, "Sec_TutorialSystem", "setGuide", {
 * windowName: "Window_MenuCommand",
 * index: 4
 * });
 *
 * [常用窗口名速查]
 * - Window_MenuCommand  : 主菜单 (物品/技能/装备...)
 * - Window_ItemCategory : 物品分类 (道具/武器/防具...)
 * - Window_ItemList     : 物品列表
 * - Window_SkillType    : 技能类型 (魔法/必杀...)
 * - Window_SkillList    : 技能列表 (战斗外)
 * - Window_TalentList   : 天赋插件的技能列表
 * - Window_ActorCommand : 战斗指令 (攻击/技能/防御...)
 * - Window_BattleSkill  : 战斗技能列表
 * - Window_BattleEnemy  : 战斗敌人选择
 * * ----------------------------------------------------------
 * 2. 【清除指引】 (Clear Guide)
 * ----------------------------------------------------------
 * 作用：解除所有锁定，隐藏箭头，恢复自由控制。
 * * [插件命令方式]
 * 插件名: Sec_TutorialSystem
 * 命令名: clearGuide
 * (无参数)
 * * [脚本调用方式]
 * PluginManager.callCommand(this, "Sec_TutorialSystem", "clearGuide", {});
 *
 * ----------------------------------------------------------
 * 3. 【战斗强制限制】 (Battle Force)
 * ----------------------------------------------------------
 * 作用：在战斗中，让玩家只能选特定技能、只能打特定敌人。
 * * [插件命令方式]
 * 插件名: Sec_TutorialSystem
 * 命令名: battleForce
 * 参数:
 * skillId:     10   (只能用 ID为10 的技能，填0不限制)
 * targetIndex: 0    (只能打第1个敌人，填-1不限制)
 * * [脚本调用方式]
 * PluginManager.callCommand(this, "Sec_TutorialSystem", "battleForce", {
 * skillId: 10,
 * targetIndex: 0
 * });
 *
 * ============================================================================
 * * @command setGuide
 * @text 设置UI指引
 * @desc 锁定光标到指定窗口的指定选项，并显示箭头。
 *
 * @arg windowName
 * @text 窗口类名
 * @desc 填入代码中的类名，如 Window_MenuCommand
 * @type string
 * @default Window_MenuCommand
 * * @arg index
 * @text 选项索引
 * @desc 目标选项的位置 (从0开始数，0是第一个)
 * @type number
 * @default 0
 *
 * @command clearGuide
 * @text 清除指引
 * @desc 解除所有锁定和限制，恢复自由控制。
 *
 * @command battleForce
 * @text 战斗强制限制
 * @desc 限制战斗中只能选这个技能和目标
 * * @arg skillId
 * @text 技能ID
 * @desc 只能使用此技能 (0=不限制)
 * @type skill
 * @default 0
 * * @arg targetIndex
 * @text 目标索引
 * @desc 只能攻击此敌人 (0是第一个，-1=不限制)
 * @type number
 * @default -1
 */

(() => {
    const pluginName = "Sq_TutorialSystem";
    
    // 全局状态
    let _tutorialActive = false;
    let _targetWindowName = "";
    let _targetIndex = -1;
    
    let _battleForceSkillId = 0;
    let _battleForceTargetIndex = -1;

    // 注册插件命令
    PluginManager.registerCommand(pluginName, "setGuide", args => {
        _tutorialActive = true;
        _targetWindowName = args.windowName;
        _targetIndex = Number(args.index);
        
        // 尝试立即聚焦并刷新
        const scene = SceneManager._scene;
        if (scene && scene._windowLayer) {
            // 深度搜索窗口 (有些窗口可能在子层级)
            const findWindow = (children) => {
                for (const child of children) {
                    if (child.constructor.name === _targetWindowName) return child;
                    if (child.children && child.children.length > 0) {
                        const found = findWindow(child.children);
                        if (found) return found;
                    }
                }
                return null;
            };
            
            const win = findWindow(scene._windowLayer.children);
            if (win && win.visible) {
                win.select(_targetIndex);
                // win.activate(); // 不强制激活，以免打断原有逻辑
            }
        }
    });

    PluginManager.registerCommand(pluginName, "clearGuide", args => {
        _tutorialActive = false;
        _targetWindowName = "";
        _targetIndex = -1;
        _battleForceSkillId = 0;
        _battleForceTargetIndex = -1;
    });

    PluginManager.registerCommand(pluginName, "battleForce", args => {
        _battleForceSkillId = Number(args.skillId);
        _battleForceTargetIndex = Number(args.targetIndex);
    });

    // ======================================================================
    // 核心逻辑：拦截 Window_Selectable
    // ======================================================================

    // 1. 锁定光标移动 (仅针对目标窗口)
    const _Window_Selectable_processCursorMove = Window_Selectable.prototype.processCursorMove;
    Window_Selectable.prototype.processCursorMove = function() {
        // 只有当当前激活的窗口 是 我们的目标窗口时，才锁定
        if (_tutorialActive && this.constructor.name === _targetWindowName) {
            // 强制锁定在目标索引
            if (this.index() !== _targetIndex) {
                this.select(_targetIndex);
            }
            // 不执行原版的移动逻辑（上下左右无效）
            return; 
        }
        _Window_Selectable_processCursorMove.call(this);
    };

    // 2. 锁定鼠标/触摸点击 (仅针对目标窗口)
    const _Window_Selectable_processTouch = Window_Selectable.prototype.processTouch;
    Window_Selectable.prototype.processTouch = function() {
        if (_tutorialActive && this.constructor.name === _targetWindowName) {
            const hitIndex = this.hitTest(TouchInput.x, TouchInput.y);
            // 如果点到了别的选项，直接忽略
            if (hitIndex >= 0 && hitIndex !== _targetIndex) {
                return; 
            }
        }
        _Window_Selectable_processTouch.call(this);
    };

    // 【重要修改】删除了对 processCancel 的拦截
    // 现在玩家可以自由按 ESC 返回或关闭菜单。
    // 只有当光标在目标窗口内时，才会被锁定位置。

    // 3. 视觉指引 (绘制箭头)
    const _Window_Selectable_refreshCursor = Window_Selectable.prototype.refreshCursor;
    Window_Selectable.prototype.refreshCursor = function() {
        _Window_Selectable_refreshCursor.call(this);
        // 强制刷新一下场景里的箭头
        if (SceneManager._scene && SceneManager._scene.updateTutorialGuide) {
            SceneManager._scene.updateTutorialGuide();
        }
    };

    // ======================================================================
    // 战斗逻辑拦截
    // ======================================================================
    
    // 拦截技能选择
    const _Window_BattleSkill_isEnabled = Window_BattleSkill.prototype.isEnabled;
    Window_BattleSkill.prototype.isEnabled = function(item) {
        if (_battleForceSkillId > 0) {
            return item && item.id === _battleForceSkillId;
        }
        return _Window_BattleSkill_isEnabled.call(this, item);
    };

    // 拦截敌人选择
    const _Scene_Battle_onEnemyOk = Scene_Battle.prototype.onEnemyOk;
    Scene_Battle.prototype.onEnemyOk = function() {
        if (_battleForceTargetIndex >= 0) {
            const selection = this._enemyWindow.enemyIndex();
            if (selection !== _battleForceTargetIndex) {
                SoundManager.playBuzzer();
                return;
            }
        }
        _Scene_Battle_onEnemyOk.call(this);
    };

    // ======================================================================
    // 视觉辅助：绘制箭头
    // ======================================================================
    const _Scene_Base_update = Scene_Base.prototype.update;
    Scene_Base.prototype.update = function() {
        _Scene_Base_update.call(this);
        this.updateTutorialGuide();
    };

    Scene_Base.prototype.updateTutorialGuide = function() {
        if (!this._tutorialSprite) {
            this._tutorialSprite = new Sprite();
            this._tutorialSprite.bitmap = new Bitmap(48, 48);
            // 画箭头
            const ctx = this._tutorialSprite.bitmap.context;
            ctx.fillStyle = '#ffff00'; // 黄色
            ctx.strokeStyle = '#000000'; // 黑色描边
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(38, 0);
            ctx.lineTo(24, 40);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            this.addChild(this._tutorialSprite);
            this._tutorialSprite.z = 999; // 尝试置顶
        }

        // 如果引导没开，或者找不到目标窗口，就隐藏
        if (!_tutorialActive) {
            this._tutorialSprite.visible = false;
            return;
        }

        // 寻找目标窗口
        const scene = SceneManager._scene;
        let win = null;
        
        if (scene && scene._windowLayer) {
             // 深度搜索窗口
             const findWindow = (children) => {
                for (const child of children) {
                    if (child.constructor.name === _targetWindowName) return child;
                    if (child.children && child.children.length > 0) {
                        const found = findWindow(child.children);
                        if (found) return found;
                    }
                }
                return null;
            };
            win = findWindow(scene._windowLayer.children);
        }
        
        if (win && win.visible && win.active) {
            const rect = win.itemRect(_targetIndex);
            // 计算绝对坐标
            const globalX = win.x + rect.x + rect.width / 2 - 24;
            const globalY = win.y + rect.y - 48 + Math.sin(Date.now() / 150) * 5;

            this._tutorialSprite.x = globalX;
            this._tutorialSprite.y = globalY;
            this._tutorialSprite.visible = true;
            
            // 确保显示在最上层
            if (this.children[this.children.length-1] !== this._tutorialSprite) {
                this.removeChild(this._tutorialSprite);
                this.addChild(this._tutorialSprite);
            }
        } else {
            this._tutorialSprite.visible = false;
        }
    };

})();