/*:
 * @target MZ
 * @plugindesc [v2.3 Fix] 敌群后备增援系统 - 修复变身透明Bug版
 * @author Gemini AI (Original Logic) + Fix
 *
 * @help
 * ============================================================================
 * ⚔️ Simple Reinforcements (敌群后备增援系统) v2.3 Fix
 * ============================================================================
 * * 【v2.3 修复说明】
 * 修复了原生MZ引擎的一个渲染逻辑漏洞：当敌人死亡（透明度归零）后立即变身
 * 复活，精灵图会保持透明，直到受击才会显示的问题。
 * 现在增援出现时会立即强制重置可见性。
 *
 * ----------------------------------------------------------------------------
 * 🌟 核心功能
 * ----------------------------------------------------------------------------
 * 1. 无缝衔接：敌人死亡后立即刷新增援，保持战斗快节奏。
 * 2. 随机兵源：可以指定一个“怪物池”，增援的敌人从中随机抽取。
 * 3. 动态控制：支持在战斗中通过事件随时增加援兵或修改兵源。
 * 4. 胜利重写：重写了战斗胜利判定，必须消灭所有后备兵才能获胜。
 *
 * ----------------------------------------------------------------------------
 * 📝 使用方法 1：战斗前配置 (推荐)
 * ----------------------------------------------------------------------------
 * 在数据库 ->【敌群 (Troops)】->【战斗事件页 1】中插入【注释 (Comment)】。
 *
 * <ReserveCount: x>
 * 设置初始后备兵数量为 x。
 * 例如：<ReserveCount: 5>  (表示有5个后备兵)
 *
 * <ReserveIds: id1, id2, ...>
 * 设置后备兵的敌人ID池。增援时会从中随机抽取。
 * 如果不写此标签，增援的敌人将默认和刚刚死去的敌人一模一样。
 * 例如：<ReserveIds: 1, 2, 3> (增援会变成ID为1、2或3的敌人)
 *
 * ----------------------------------------------------------------------------
 * 🎮 使用方法 2：插件指令 (战斗中动态调用)
 * ----------------------------------------------------------------------------
 * 详见插件指令列表。
 *
 * @command SetReserve
 * @text 设置/修改后备数量
 * @desc 直接设置后备敌人的数量（覆盖之前的值）。
 *
 * @arg count
 * @text 数量
 * @type number
 * @min 0
 * @desc 后备兵的数量。设为 0 将停止增援。
 * @default 5
 *
 * @command AddReserve
 * @text 增加后备数量
 * @desc 在现有数量基础上增加兵力（比如Boss呼叫增援）。
 *
 * @arg count
 * @text 增加数量
 * @type number
 * @min 1
 * @desc 增加多少个后备兵。
 * @default 3
 *
 * @command SetReserveIds
 * @text 设置增援敌人ID池
 * @desc 设定补上来的敌人会变成什么怪。不设置则默认和死掉的一样。
 *
 * @arg enemyIds
 * @text 敌人ID列表
 * @type enemy[]
 * @desc 从这些ID中随机抽取。
 *
 * @command SetAppearAnimation
 * @text 设置出场动画
 * @desc 设定增援出现时播放的动画。
 *
 * @arg animationId
 * @text 动画ID
 * @type animation
 * @desc 播放的动画ID。0 为不播放。
 * @default 0
 */

(() => {
    const pluginName = "Sq_SimpleReinforcements";

    // ========================================================================
    // 插件指令注册
    // ========================================================================
    
    PluginManager.registerCommand(pluginName, "SetReserve", args => {
        const count = Number(args.count || 0);
        $gameTroop.setReserveCount(count);
    });

    PluginManager.registerCommand(pluginName, "AddReserve", args => {
        const count = Number(args.count || 0);
        $gameTroop.addReserveCount(count);
    });

    PluginManager.registerCommand(pluginName, "SetReserveIds", args => {
        if (args.enemyIds) {
            const list = JSON.parse(args.enemyIds).map(id => Number(id));
            $gameTroop.setReserveIds(list);
        }
    });

    PluginManager.registerCommand(pluginName, "SetAppearAnimation", args => {
        const animId = Number(args.animationId || 0);
        $gameTroop.setReserveAnimation(animId);
    });

    // ========================================================================
    // Game_Troop 逻辑扩展
    // ========================================================================

    const _Game_Troop_setup = Game_Troop.prototype.setup;
    Game_Troop.prototype.setup = function(troopId) {
        _Game_Troop_setup.call(this, troopId);
        this._reserveCount = 0;
        this._reserveIds = [];
        this._reserveAnimId = 0; 
        this.parseReserveComments();
    };

    Game_Troop.prototype.parseReserveComments = function() {
        // 读取第一页的所有事件指令
        const pages = this.troop().pages;
        if (!pages || pages.length === 0) return;

        const list = pages[0].list;
        for (const command of list) {
            if (command.code === 108 || command.code === 408) {
                const comment = command.parameters[0];
                const countMatch = comment.match(/<ReserveCount:\s*(\d+)>/i);
                if (countMatch) this._reserveCount = parseInt(countMatch[1]);

                const idsMatch = comment.match(/<ReserveIds:\s*([\d,\s]+)>/i);
                if (idsMatch) this._reserveIds = idsMatch[1].split(',').map(n => parseInt(n));
            }
        }
    };

    Game_Troop.prototype.setReserveCount = function(val) {
        this._reserveCount = val;
    };

    Game_Troop.prototype.addReserveCount = function(val) {
        this._reserveCount += val;
    };

    Game_Troop.prototype.setReserveIds = function(list) {
        this._reserveIds = list;
    };

    Game_Troop.prototype.setReserveAnimation = function(id) {
        this._reserveAnimId = id;
    };

    // ========================================================================
    // 核心补员逻辑
    // ========================================================================

    Game_Troop.prototype.checkReinforcements = function() {
        if (this._reserveCount <= 0) return;

        const deadMembers = this.members().filter(enemy => enemy.isDead());
        
        for (const enemy of deadMembers) {
            if (this._reserveCount > 0) {
                this._reserveCount--;
                
                // 1. 确定变成什么
                let newId = enemy.enemyId();
                if (this._reserveIds.length > 0) {
                    const randIndex = Math.floor(Math.random() * this._reserveIds.length);
                    newId = this._reserveIds[randIndex];
                }

                // 2. 执行复活与变身 (逻辑层)
                enemy.transform(newId);
                enemy.recoverAll();
                enemy.appear();
                
                // 3. 播放动画
                if (this._reserveAnimId > 0) {
                    $gameTemp.requestAnimation([enemy], this._reserveAnimId);
                }

                // 4. 战斗日志文本
                if (SceneManager._scene && SceneManager._scene._logWindow) {
                    try {
                        const fmt = TextManager.emerge; 
                        if (fmt) {
                            SceneManager._scene._logWindow.addText(fmt.format(enemy.name()));
                        }
                    } catch (e) {
                        // Suppress error
                    }
                }
            }
        }
    };

    // ========================================================================
    // 胜负判定与循环挂载
    // ========================================================================

    const _Game_Troop_isAllDead = Game_Troop.prototype.isAllDead;
    Game_Troop.prototype.isAllDead = function() {
        if (this._reserveCount > 0) {
            return false;
        }
        return _Game_Troop_isAllDead.call(this);
    };

    const _BattleManager_endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        _BattleManager_endAction.call(this);
        $gameTroop.checkReinforcements();
    };

    // ========================================================================
    // 🛡️ 核心修复补丁：Sprite_Enemy 透明度修正 (v2.3 新增)
    // ========================================================================
    
    // 原理：当敌人 transform 时，Sprite_Enemy 会检测到图片变更并调用 initVisibility。
    // 原版代码只处理了“如果不显示则透明度为0”，漏掉了“如果显示则透明度为255”。
    // 这里我们进行补全，强制重置状态，解决“继承尸体透明度”的 Bug。
    
    const _Sprite_Enemy_initVisibility = Sprite_Enemy.prototype.initVisibility;
    Sprite_Enemy.prototype.initVisibility = function() {
        _Sprite_Enemy_initVisibility.call(this);
        
        if (this._appeared) {
            this.opacity = 255;             // 强制完全不透明
            this.blendMode = 0;             // 强制恢复正常混合模式 (防止尸体变白/发光残留)
            this.setBlendColor([0, 0, 0, 0]); // 清除可能的颜色滤镜
        }
    };

})();