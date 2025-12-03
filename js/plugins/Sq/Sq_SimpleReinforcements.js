/*:
 * @target MZ
 * @plugindesc [v2.2] 敌群后备增援系统 - 让战斗如潮水般涌来
 * @author Gemini AI
 *
 * @help
 * ============================================================================
 * ⚔️ Simple Reinforcements (敌群后备增援系统) v2.2
 * ============================================================================
 *
 * 这是一个不仅能增加战斗难度，更能增加战斗“趣味性”和“策略性”的系统。
 * 它允许你为敌群设置“后备兵力”。当场上的敌人倒下时，后备兵会立即
 * 填补空缺，直到所有后备兵力耗尽，战斗才会真正胜利。
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
 * 插件会在战斗开始时自动读取这些设置。
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
 *
 * 1. SetReserve (设置/修改后备数量)
 * 强制将后备兵数量修改为指定数值。
 * > 用法：Boss进入二阶段，大喊“卫兵！”，设为 10。
 * > 用法：击杀召唤师，将数量设为 0，停止无限刷新。
 *
 * 2. AddReserve (增加后备数量)
 * 在当前基础上增加兵力。
 * > 用法：每隔3回合，增加 2 个援兵。
 *
 * 3. SetReserveIds (设置增援敌人ID池)
 * 更改后续增援的怪物种类。
 * > 用法：战斗初期刷小怪，后期 SetReserveIds 变成强力怪。
 *
 * 4. SetAppearAnimation (设置出场动画)
 * 设置增援出现时播放的动画ID。
 * > 建议：使用“传送门”、“烟雾”或“魔法阵”动画效果最佳。
 *
 * ----------------------------------------------------------------------------
 * 💡 创意战斗设计示例 (大师锦囊)
 * ----------------------------------------------------------------------------
 *
 * 【场景 A：无限亡灵海】
 * - 设置：<ReserveCount: 99> (模拟无限)
 * - 机制：只要 Boss (死灵法师) 活着，小怪就杀不完。
 * - 事件：在 Boss 的死亡事件页中，使用插件指令 [SetReserve: 0]。
 * - 体验：迫使玩家无视小怪，集火 Boss。
 *
 * 【场景 B：史莱姆分裂】
 * - 设置：普通战斗。
 * - 事件：当“巨大史莱姆”HP为 0 时，运行公共事件。
 * - 公共事件内容：
 * 1. 插件指令 [SetReserveIds: 小史莱姆ID, 小史莱姆ID]
 * 2. 插件指令 [AddReserve: 2]
 * - 体验：大怪死后瞬间变成两个小怪，视觉效果极佳。
 *
 * 【场景 C：生存守卫战】
 * - 设置：<ReserveCount: 20>
 * - 机制：玩家不需要移动，只需要在这一场战斗中活下来并杀光所有敌人。
 * - 体验：配合 BGM 变奏，营造“背水一战”的史诗感。
 *
 * ============================================================================
 * 更新日志:
 * v2.2 - 移除调试信息，代码纯净优化，修复 TextManager 调用问题。
 * v2.1 - 修复战斗日志显示问题。
 * v1.0 - 基础功能完成。
 * ============================================================================
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
        const list = this.troop().pages[0].list;
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

                // 2. 执行复活
                enemy.transform(newId);
                enemy.recoverAll();
                enemy.appear();
                
                // 3. 播放动画
                if (this._reserveAnimId > 0) {
                    $gameTemp.requestAnimation([enemy], this._reserveAnimId);
                }

                // 4. 战斗日志文本 (静默模式，如果出错不报错也不显示)
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

})();