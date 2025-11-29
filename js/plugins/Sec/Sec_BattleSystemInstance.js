/*:
 * @target MZ
 * @plugindesc 战斗系统实例插件 - 提供多种战斗增强功能
 * @author Secmon
 * @version 1.0.4
 * @help
 * ===== 战斗系统实例插件功能说明 =====
 * * 本插件提供了10个主要功能，用于增强RPG Maker MZ的战斗系统：
 * * ===== 功能1：攻击回蓝 =====
 * 描述：我方角色进行普通攻击时恢复10点MP
 * 特性：回蓝过程会自动标记"忽略日志"，避免过多战斗日志信息
 * * ===== 功能2：受击回蓝 =====
 * 描述：我方角色受到敌人攻击时恢复5点MP
 * 特性：回蓝过程会自动标记"忽略日志"，避免过多战斗日志信息
 * * ===== 功能3：状态伤害 =====
 * 描述：检查目标是否拥有指定buff，如果有则对当前目标造成计算公式的伤害，结算后可选择是否移除buff
 * * 备注格式：
 * <状态伤害:状态ID,计算公式,是否移除状态>
 * * 参数说明：
 * - 状态ID：要检查的状态编号（数字）
 * - 计算公式：伤害计算公式（字符串），可使用变量：
 * a - 使用者（攻击者）
 * b - 目标（被攻击者）
 * v - 游戏变量（如v[1]表示变量1）
 * s - 开关（如s[1]表示开关1）
 * - 是否移除状态：true/false，可选择是否在造成伤害后移除目标身上的状态
 * * 工作原理：
 * 1. 检查目标是否拥有指定状态
 * 2. 如果拥有，则根据计算公式造成额外伤害
 * 3. 根据参数决定是否移除该状态
 * * 使用案例：
 * <状态伤害:5,a.atk * 2,true> - 如果目标有状态5，造成攻击力2倍的伤害并移除状态5
 * <状态伤害:10,100,false> - 如果目标有状态10，造成100点固定伤害但不移除状态10
 * <状态伤害:15,a.mat * 1.5 + v[1],true> - 如果目标有状态15，造成(魔法力×1.5+变量1)的伤害并移除状态15
 * * ===== 功能4：状态循环 =====
 * 描述：实现buff的递进替换系统，允许当前目标身上的buff按照指定顺序进行循环
 * * 备注格式：
 * <状态循环:状态ID1,状态ID2,状态ID3,...>
 * * 参数说明：
 * - 状态ID列表：按顺序排列的状态编号，用逗号分隔
 * - 至少需要2个状态ID
 * * 工作原理：
 * - 如果目标没有任何指定的状态，则添加第一个状态
 * - 如果目标拥有状态ID1，则替换为状态ID2
 * - 如果目标拥有状态ID2，则替换为状态ID3
 * - 以此类推，最后一个状态不会自动替换
 * * 使用案例：
 * <状态循环:11,12,13> - 状态循环：没有状态时加状态11，有11时改为12，有12时改为13
 * <状态循环:21,22> - 简单两状态循环：没有状态时加状态21，有21时改为22
 * <状态循环:30,31,32,33,34> - 复杂五状态循环系统
 * * ===== 功能5：持续伤害 =====
 * 描述：给目标添加buff，并对拥有该buff的所有敌人造成计算公式的伤害
 * * 备注格式：
 * <持续伤害:状态ID,计算公式>
 * * 参数说明：
 * - 状态ID：要施加的持续伤害状态编号
 * - 计算公式：支持a、b、v、s变量的字符串
 * - 注意：当使用带有此标签的技能时，所有拥有该状态的敌人都会受到计算公式的伤害
 * * 工作原理：
 * 1. 使用技能时，先给目标添加指定状态
 * 2. 然后遍历所有敌人，对拥有该状态的敌人造成计算公式的伤害
 * 3. 伤害计算基于使用技能时的施法者和每个拥有状态的敌人
 * * 使用案例：
 * <持续伤害:20,a.mat * 2> - 当使用此技能时，给目标添加状态20，所有拥有状态20的敌人受到魔法力2倍的伤害
 * <持续伤害:25,50 + a.level * 10> - 给目标添加状态25，所有拥有状态25的敌人受到(50+使用者等级×10)的伤害
 * <持续伤害:30,v[10]> - 给目标添加状态30，所有拥有状态30的敌人受到变量10数值的伤害
 * * ===== 功能6：终结伤害 =====
 * 描述：根据场上拥有指定buff的敌人的数量，对当前目标造成计算公式的伤害，结算后可选择是否消除该buff
 * * 备注格式：
 * <终结伤害:状态ID,计算公式,是否移除状态>
 * * 参数说明：
 * - 状态ID：要检测的状态编号
 * - 计算公式：支持a、b、v、s、n变量的字符串，其中n表示场上拥有该状态的敌人数量
 * - 是否移除状态：true或false，可选择是否移除所有敌人身上的该状态
 * * 工作原理：
 * 1. 使用技能时，统计场上所有拥有指定状态的敌人数量
 * 2. 如果数量大于0，则对当前目标造成基于该数量的计算公式伤害
 * 3. 根据参数决定是否移除所有敌人身上的该状态
 * * 使用案例：
 * <终结伤害:21,a.atk * n,true> - 根据场上拥有状态21的敌人数量，对当前目标造成攻击力×数量的伤害，并移除所有敌人身上的状态21
 * <终结伤害:22,50 * n,false> - 根据场上拥有状态22的敌人数量，对当前目标造成50×数量的伤害，但不移除状态22
 * <终结伤害:23,a.mat * n * 1.5,true> - 根据场上拥有状态23的敌人数量，对当前目标造成(魔法力×数量×1.5)的伤害，并移除所有敌人身上的状态23
 * * ===== 功能7：Buff治疗 =====
 * 描述：检查所有己方角色或指定目标是否存在指定buff，如果存在，则恢复所有己方角色或指定目标计算公式的血量，可选择是否消除该buff
 * * 备注格式：
 * <Buff治疗:状态ID,计算公式,是否移除状态,目标选择>
 * * 参数说明：
 * - 状态ID：要检查的buff状态编号（数字）
 * - 计算公式：治疗量计算公式（字符串），可使用变量：
 * a - 使用者（施法者）
 * b - 目标（被治疗者）
 * v - 游戏变量（如v[1]表示变量1）
 * s - 开关（如s[1]表示开关1）
 * - 是否移除状态：true/false，是否在治疗后移除目标身上的状态
 * - 目标选择：all/target，all表示治疗所有拥有该状态的己方角色，target表示仅治疗技能目标
 * * 工作原理：
 * 1. 根据目标选择参数确定治疗范围
 * 2. 检查范围内每个己方角色是否拥有指定状态
 * 3. 对拥有该状态的角色，根据计算公式恢复HP
 * 4. 根据参数决定是否移除该状态
 * * 使用案例：
 * <Buff治疗:30,a.mat * 2,true,all> - 对所有拥有状态30的己方角色恢复魔法力2倍的HP，并移除状态30
 * <Buff治疗:31,100,false,target> - 仅对技能目标中拥有状态31的角色恢复100点HP，但不移除状态31
 * <Buff治疗:32,a.mat * 1.5 + v[1],true,all> - 对所有拥有状态32的己方角色恢复(魔法力×1.5+变量1)的HP，并移除状态32
 * * ===== 功能8：累计反击 =====
 * 描述：基于累计伤害的反击系统，角色可以累积受到的伤害并在特定条件下释放强力反击
 * * 备注格式：
 * <累计反击:状态ID,属性提升类型,属性提升值,反击公式>
 * * 参数说明：
 * - 状态ID：用于标记累计反击状态的buff编号
 * - 属性提升类型：def/mdef/hp/atk/mat/agi/luk，表示提升的属性类型
 * - 属性提升值：数值或公式，表示属性提升的量值
 * - 反击公式：基于累计伤害的反击伤害计算公式，可使用变量：
 * a - 使用者（施法者）
 * b - 目标（被攻击者）
 * d - 累计伤害值
 * v - 游戏变量（如v[1]表示变量1）
 * s - 开关（如s[1]表示开关1）
 * * 工作原理：
 * 1. 首次使用技能时，如果角色没有指定状态，则添加该状态并开始累计伤害
 * 2. 状态存在期间，角色属性得到提升，受到的伤害会被累计
 * 3. 再次使用技能时，如果角色已有该状态，则释放累计伤害的反击并移除状态
 * 4. 每个角色的累计伤害值独立计算，互不影响
 * 5. 反击伤害会根据技能类型（单体/全体）对目标造成伤害
 * 6. 反击时会触发目标的死亡动画（如果造成死亡）
 * * 使用案例：
 * <累计反击:40,def,50,d * 1.5> - 状态40，防御+50，反击伤害为累计伤害×1.5
 * <累计反击:41,hp,1000,d + a.atk * 2> - 状态41，恢复1000点HP，反击伤害为累计伤害+攻击力×2
 * <累计反击:42,mdef,25,d * (1 + v[1] * 0.1)> - 状态42，魔法防御+25，反击伤害为累计伤害×(1+变量1×0.1)
 * * ===== 功能9：伤害转移 =====
 * 描述：队友A给自己上一个buff作为标记，此时所有队友受伤时都会把n%的伤害转移给队友A，队友A会受到转移的伤害并显示伤害弹窗和日志，当队友A死亡时转移效果失效
 * * 备注格式：
 * <伤害转移:状态ID,转移比例,转移伤害公式,恢复血量公式>
 * <伤害转移:状态ID,转移比例> - 简写形式，使用默认公式
 * * 参数说明：
 * - 状态ID：用于标记伤害转移的buff编号
 * - 转移比例：百分比数值，表示转移伤害的比例（例如：30表示30%）
 * - 转移伤害公式：自定义转移伤害计算的公式（可选）
 * 转移伤害公式可用变量：
 * d - 原始伤害值
 * r - 转移比例（0.3表示30%）
 * mhp - 标记角色最大生命值
 * def - 标记角色防御力
 * mdef - 标记角色魔法防御力
 * - 恢复血量公式：自定义队友恢复血量计算的公式（可选）
 * 恢复血量公式可用变量：
 * d - 原始伤害值
 * r - 转移比例（0.3表示30%）
 * mhp - 标记角色最大生命值
 * def - 标记角色防御力
 * mdef - 标记角色魔法防御力
 * * 工作原理：
 * 1. 队友A使用带有此标签的技能给自己添加状态，成为"标记角色"
 * 2. 状态存在期间，所有队友（包括队友A自己）受到攻击时，会将伤害转移给队友A
 * 3. 转移伤害计算：根据自定义公式计算，默认为考虑原始伤害、转移比例、标记角色最大生命值和防御属性
 * 4. 队友恢复血量计算：根据自定义公式计算，默认为考虑原始伤害、转移比例、标记角色最大生命值和防御属性
 * 5. 队友恢复血量会延迟300毫秒显示，确保攻击伤害显示完成后再显示回血
 * 6. 队友A会受到转移的伤害，并显示伤害弹窗和战斗日志，触发受伤动画
 * 7. 当队友A的血量低于0时，会触发原版死亡机制，同时清除所有队友的伤害转移标记，转移效果失效
 * 8. 再次使用同一技能时，如果队友A已有该状态，则移除状态并清除伤害转移信息，同时显示"xx角色放弃守护"的消息
 * 9. 每个角色的累计转移伤害值独立计算，与功能8的累计伤害不冲突
 * * 使用案例：
 * <伤害转移:50,30> - 状态50，使用默认公式，将队友受到的伤害的30%转移给使用者，恢复基于标记角色属性
 * <伤害转移:51,50,d*r*(1+mhp/2000),d*r*(1+mhp/3000)> - 状态51，自定义公式，转移时最大生命值加成，恢复时加成降低
 * <伤害转移:52,25,d*r*(1-def/500)*(1-mdef/500),d*r*(1+def/500+mdef/500)> - 状态52，转移时有防御减免，恢复时防御属性提供加成
 * * ===== 功能10：弹射伤害 =====
 * 描述：对指定目标造成初始公式伤害，然后根据规则弹射其他敌人造成带有递增系数n的弹射公式伤害。
 * * 备注格式：
 * <弹射伤害:初始公式,弹射公式,弹射次数,是否允许重复,弹射模式>
 * * 参数说明：
 * - 初始公式：对初始目标造成的伤害公式（字符串），变量同上。
 * - 弹射公式：对弹射目标造成的伤害公式（字符串），可使用变量 n 表示第几次弹射（从1开始）。
 * - 弹射次数：最大弹射次数（整数）。
 * - 是否允许重复：true/false。
 * - 弹射模式：order（固定顺序） / random（随机）。
 * * 弹射规则：
 * - 随机模式：每次弹射从所有存活敌人（包含初始目标）中随机选取。强制允许重复。
 * - 固定模式：
 * - 目标池排除初始目标。
 * - 按顺序遍历敌人进行弹射。
 * - 如果允许重复：遍历完最后一个敌人后会回到第一个继续，直到次数耗尽。
 * - 如果不允许重复：遍历完所有敌人或次数耗尽时停止。
 * * 延迟规则：
 * - 3人及以下：单次间隔固定150ms。
 * - 超过3人：每多1人，单次间隔减少20ms。
 * - 设有最小值保护（30ms），防止人数过多导致延迟异常。
 * * 使用案例：
 * <弹射伤害:a.atk * 2, a.atk * (1 - 0.1 * n), 3, false, order>
 * - 对目标造成2倍攻击力伤害。
 * - 按顺序弹射3个其他敌人。
 * - 弹射间隔为150ms。
 * * ===== 组合使用案例 =====
 * * 复合技能示例：
 * <状态伤害:5,a.atk * 2,true>
 * <状态循环:11,12,13>
 * <持续伤害:20,a.mat * 2>
 * <终结伤害:21,a.atk * n,true>
 * <Buff治疗:30,a.mat * 2,true,all>
 * <累计反击:40,def,50,d * 1.5>
 * <伤害转移:50,30>
 * <弹射伤害:a.atk * 1.5, a.atk * (1 - 0.1 * n), 4, false, order>
 * * 这个技能会包含上述所有效果。
 * * ===== 注意事项 =====
 * * 1. 所有功能都通过技能备注中的特定标签实现
 * 2. 多个功能可以同时应用于同一个技能
 * 3. 计算公式支持基本数学运算和变量引用
 * 4. 状态ID必须在数据库中已定义
 * 5. 功能8和功能9的累计伤害值是独立计算的，互不冲突
 * 6. 伤害转移功能中，标记角色死亡会自动清除转移效果
 * 7. 所有伤害计算都会触发相应的战斗日志和动画效果
 * 8. 所有功能都支持对状态窗口的实时刷新，确保状态变化及时显示
 * 9. 所有功能都有错误处理机制，避免计算错误导致游戏崩溃
 * 10. 插件使用了全局变量来存储累计伤害和转移伤害信息，确保数据持久化
 * 11. 插件会在战斗开始前重置所有处理标记，确保每次战斗的独立性
 * * ===== 技术实现细节 =====
 * * 1. 插件使用了原型链扩展的方式修改了以下方法：
 * - Game_Action.prototype.executeDamage：处理伤害执行和各种技能效果
 * - Game_Action.prototype.apply：处理动作应用和受击效果
 * - BattleManager.startAction：重置战斗状态标记
 * * 2. 插件使用了以下全局变量：
 * - _Sec_BattleSystemInstance_AccumulatedDamage：存储累计伤害值
 * - _Sec_BattleSystemInstance_AccumulatedTransferDamage：存储累计转移伤害值
 * - _Sec_BattleSystemInstance_DamageTransferMarker：存储伤害转移标记
 * * 3. 插件使用了以下临时标记：
 * - _ignoreMpLog：忽略MP变化日志
 * - _ignoreDamageLog：忽略伤害日志
 * - _counterAttackBuffApplied：标记属性提升是否已应用
 * - _specialEffectsProcessed：标记特殊效果是否已处理
 * * ===== 更新日志 =====
 * * 版本 1.0.4：
 * - 调整弹射伤害延迟算法：3人及以下固定150ms，超过3人每人减少20ms
 * * 版本 1.0.3：
 * - 优化了弹射伤害功能：增加受伤动作特效，优化死亡判定
 * * 版本 1.0.2：
 * - 将功能10"连锁伤害"升级为"弹射伤害"，支持更灵活的弹射规则
 * * 版本 1.0.1：
 * - 修复了伤害转移功能中的显示问题
 * - 优化了MP恢复时的日志显示
 * - 增强了状态变化的窗口刷新机制
 * - 修复了累计反击功能中的目标处理逻辑
 * * 版本 1.0.0：
 * - 初始版本发布
 * - 实现了9个核心功能
 * - 支持多种技能效果组合
 * - 提供了详细的使用文档
 */

(() => {
    const pluginName = "BattleSystemInstance";

    // 初始化全局变量，用于存储每个角色的累计伤害值
    const _Sec_BattleSystemInstance_AccumulatedDamage = new Map();
    
    // 初始化全局变量，用于存储每个角色的累计转移伤害值
    const _Sec_BattleSystemInstance_AccumulatedTransferDamage = new Map();
    
    // 初始化全局变量，用于存储每个角色的伤害转移标记（标记由哪个角色提供的伤害转移）
    const _Sec_BattleSystemInstance_DamageTransferMarker = new Map();

    // 1. 我方角色使用普通攻击时恢复MP
    const _Game_Action_executeDamage = Game_Action.prototype.executeDamage;
    Game_Action.prototype.executeDamage = function(target, value) {
        // 记录动作执行前的状态
        const isActor = this.subject().isActor();
        const isAttack = this.isAttack();
        
        // 执行原始伤害计算
        _Game_Action_executeDamage.call(this, target, value);
        
        // 功能1：如果是我方角色使用普通攻击，恢复10点MP
        if (isActor && isAttack) {
            const subject = this.subject();
            if (subject) {
                // 【修改点A】在回蓝前，标记“忽略日志”
                subject._ignoreMpLog = true; 
                subject.gainMp(10);
            }
        }
        
        // 功能3：技能备注功能 - 检查目标状态并造成额外伤害
        if (this.isSkill()) {
            // 获取技能的备注
            const item = this.item();
            const note = item.note;
            
            // 功能3：检查备注中是否包含状态伤害标签（支持多个标签）
            const stateDamageMatches = note.matchAll(/<状态伤害:(\d+),([^,>]+)(?:,([^>]*))?>/g);
            
            for (const match of stateDamageMatches) {
                const stateId = parseInt(match[1]);
                const formula = match[2].trim();
                const removeState = match[3] ? match[3].trim().toLowerCase() === 'true' : false;
                
                // 检查目标是否带有指定状态
                if (target.isStateAffected(stateId)) {
                    try {
                        // 设置公式变量
                        const a = this.subject();
                        const b = target;
                        const v = $gameVariables._data;
                        const s = $gameSwitches._data;
                        
                        // 计算伤害值
                        const damage = Math.floor(eval(formula));
                        
                        // 确保伤害值为正数
                        if (damage > 0) {
                            // 造成伤害
                            target.gainHp(-damage);
                            
                            // 显示伤害弹窗
                            if (target.result().hpAffected) {
                                target.startDamagePopup();
                            }
                            
                            // 如果需要移除状态
                            if (removeState) {
                                target.removeState(stateId);
                            }
                            
                            // 刷新状态窗口
                            if (BattleManager._statusWindow) {
                                BattleManager._statusWindow.refresh();
                            }
                        }
                    } catch (e) {
                        console.error("状态伤害计算错误:", e);
                    }
                }
            }
            
            // 功能4：检查备注中是否包含状态循环标签
            const stateCycleMatch = note.match(/<状态循环:([^>]+)>/);
            
            if (stateCycleMatch) {
                // 解析状态ID列表
                const stateIds = stateCycleMatch[1].split(',').map(id => parseInt(id.trim()));
                
                // 确保至少有2个状态
                if (stateIds.length >= 2) {
                    // 查找目标当前拥有的状态
                    let currentStateIndex = -1;
                    for (let i = 0; i < stateIds.length; i++) {
                        if (target.isStateAffected(stateIds[i])) {
                            currentStateIndex = i;
                            break;
                        }
                    }
                    
                    // 根据当前状态决定下一步操作
                    if (currentStateIndex === -1) {
                        // 没有任何状态，添加第一个状态
                        target.addState(stateIds[0]);
                    } else if (currentStateIndex < stateIds.length - 1) {
                        // 有当前状态，但不是最后一个状态，移除当前状态，添加下一个状态
                        target.removeState(stateIds[currentStateIndex]);
                        target.addState(stateIds[currentStateIndex + 1]);
                    }
                    
                    // 刷新状态窗口
                    if (BattleManager._statusWindow) {
                        BattleManager._statusWindow.refresh();
                    }
                }
            }
            
            // 功能5：检查备注中是否包含持续伤害标签
            const dotMatch = note.match(/<持续伤害:(\d+),([^>]+)>/);
            
            if (dotMatch) {
                const stateId = parseInt(dotMatch[1]);
                const formula = dotMatch[2].trim();
                
                // 先给目标添加状态
                target.addState(stateId);
                
                // 获取所有敌人
                const enemies = $gameTroop.members();
                
                // 保存当前上下文信息，用于延迟执行
                const user = this.subject();
                const gameVariables = $gameVariables._data;
                const gameSwitches = $gameSwitches._data;
                const statusWindow = BattleManager._statusWindow;
                
                // 使用setTimeout延迟执行对其他敌人的伤害，让当前敌人的伤害显示完成
                setTimeout(() => {
                    // 对所有拥有该状态的敌人造成伤害
                    for (const enemy of enemies) {
                        if (enemy.isStateAffected(stateId)) {
                            try {
                                // 设置公式变量
                                const a = user;
                                const b = enemy;
                                const v = gameVariables;
                                const s = gameSwitches;
                                
                                // 计算伤害值
                                const damage = Math.floor(eval(formula));
                                
                                // 确保伤害值为正数
                                if (damage > 0) {
                                    // 保存原始HP
                                    const originalHp = enemy.hp;
                                    
                                    // 造成伤害
                                    enemy.gainHp(-damage);
                                    
                                    // 显示伤害弹窗
                                    if (enemy.result().hpAffected) {
                                        enemy.startDamagePopup();
                                    }
                                    
                                    // 检查敌人是否因本次伤害死亡，如果死亡则触发死亡后续事件
                                    if (enemy.isDead() && originalHp > 0) {
                                        // 触发死亡动画
                                        if (BattleManager._logWindow) {
                                            BattleManager._logWindow.push('performCollapse', enemy);
                                        }
                                        // 刷新状态窗口
                                        if (statusWindow) {
                                            statusWindow.refresh();
                                        }
                                    }
                                }
                            } catch (e) {
                                console.error("持续伤害计算错误:", e);
                            }
                        }
                    }
                    
                    // 刷新状态窗口
                    if (statusWindow) {
                        statusWindow.refresh();
                    }
                }, 200); // 200ms延迟
            }
            
            // 功能6：检查备注中是否包含终结伤害标签
            const groupMatch = note.match(/<终结伤害:(\d+),([^,]+),([^>]+)>/);
            
            if (groupMatch) {
                const stateId = parseInt(groupMatch[1]);
                const formula = groupMatch[2].trim();
                const removeState = groupMatch[3].trim() === 'true';
                
                // 获取所有敌人
                const enemies = $gameTroop.members();
                
                // 统计拥有该状态的敌人数量
                let count = 0;
                for (const enemy of enemies) {
                    if (enemy.isStateAffected(stateId)) {
                        count++;
                    }
                }
                
                // 如果有敌人拥有该状态，则对当前目标造成伤害
                if (count > 0) {
                    try {
                        // 设置公式变量
                        const a = this.subject();
                        const b = target;
                        const v = $gameVariables._data;
                        const s = $gameSwitches._data;
                        const n = count;
                        
                        // 计算伤害值
                        const damage = Math.floor(eval(formula));
                        
                        // 确保伤害值为正数
                        if (damage > 0) {
                            // 造成伤害
                            target.gainHp(-damage);
                            
                            // 显示伤害弹窗
                            if (target.result().hpAffected) {
                                target.startDamagePopup();
                            }
                        }
                        
                        // 如果选择移除状态，则移除所有敌人身上的该状态
                        if (removeState) {
                            for (const enemy of enemies) {
                                if (enemy.isStateAffected(stateId)) {
                                    enemy.removeState(stateId);
                                }
                            }
                            
                            // 刷新状态窗口以显示状态变化
                            if (BattleManager._statusWindow) {
                                BattleManager._statusWindow.refresh();
                            }
                        }
                    } catch (e) {
                        console.error("终结伤害计算错误:", e);
                    }
                }
            }
            
            // 功能7：检查备注中是否包含Buff治疗标签
            const buffHealMatch = note.match(/<Buff治疗:(\d+),([^,]+),([^,]+),([^>]+)>/);
            
            if (buffHealMatch) {
                const stateId = parseInt(buffHealMatch[1]);
                const formula = buffHealMatch[2].trim();
                const removeState = buffHealMatch[3].trim() === 'true';
                const targetSelection = buffHealMatch[4].trim().toLowerCase(); // all 或 target
                
                // 确定治疗目标
                let targets = [];
                if (targetSelection === 'all') {
                    // 治疗所有拥有该状态的己方角色
                    targets = $gameParty.members();
                } else if (targetSelection === 'target') {
                    // 仅治疗技能目标
                    targets = [target];
                }
                
                // 对每个目标进行治疗
                for (const actor of targets) {
                    if (actor.isStateAffected(stateId)) {
                        try {
                            // 设置公式变量
                            const a = this.subject();
                            const b = actor;
                            const v = $gameVariables._data;
                            const s = $gameSwitches._data;
                            
                            // 计算治疗量
                            const healAmount = Math.floor(eval(formula));
                            
                            // 确保治疗量为正数
                            if (healAmount > 0) {
                                // 恢复HP
                                actor.gainHp(healAmount);
                                
                                // 显示治疗弹窗
                                if (actor.result().hpAffected) {
                                    actor.startDamagePopup();
                                }
                            }
                            
                            // 如果选择移除状态，则移除该角色身上的状态
                            if (removeState) {
                                actor.removeState(stateId);
                            }
                        } catch (e) {
                            console.error("Buff治疗计算错误:", e);
                        }
                    }
                }
                
                // 刷新状态窗口以显示状态变化
                if (BattleManager._statusWindow) {
                    BattleManager._statusWindow.refresh();
                }
            }
            
            // 只对第一个目标执行累计反击和伤害转移逻辑
            if (!this._specialEffectsProcessed) {
                // 标记已处理，避免重复处理
                this._specialEffectsProcessed = true;
                
                // 重置使用者的属性提升标记，确保每次技能执行时都能正确处理
                const user = this.subject();
                if (user) {
                    user._counterAttackBuffApplied = false;
                }
                
                // 功能8：检查备注中是否包含累计反击标签
                const counterAttackMatch = note.match(/<累计反击:(\d+),([^,]+),([^,]+),([^>]+)>/);
                
                if (counterAttackMatch) {
                    const stateId = parseInt(counterAttackMatch[1]);
                    const statType = counterAttackMatch[2].trim().toLowerCase();
                    const statValue = counterAttackMatch[3].trim();
                    const counterFormula = counterAttackMatch[4].trim();
                    
                    // 获取使用者
                    const user = this.subject();
                    
                    // 检查使用者是否已有该状态
                    if (user.isStateAffected(stateId)) {
                        // 已有状态，执行反击
                        try {
                            // 获取累计伤害值
                            const actorId = user.isActor() ? user.actorId() : -user.enemyId();
                            const accumulatedDamage = _Sec_BattleSystemInstance_AccumulatedDamage.get(actorId) || 0;
                            
                            // 设置公式变量
                            const a = user;
                            const b = target;
                            const d = accumulatedDamage;
                            const v = $gameVariables._data;
                            const s = $gameSwitches._data;
                            
                            // 计算反击伤害
                            const damage = Math.floor(eval(counterFormula));
                            
                            // 确保伤害值为正数
                            if (damage > 0) {
                                // 对每个目标造成伤害
                                if (this.isForAll()) {
                                    // 如果是全体技能，对所有敌人造成伤害
                                    const targets = this.targetsForOpponents();
                                    for (const t of targets) {
                                        t.gainHp(-damage);
                                        if (t.result().hpAffected) {
                                            t.startDamagePopup();
                                        }
                                        
                                        // 检查敌人是否死亡，如果死亡则触发死亡动画
                                        if (t.isDead()) {
                                            if (BattleManager._logWindow) {
                                                BattleManager._logWindow.push('performCollapse', t);
                                            }
                                        }
                                    }
                                } else {
                                    // 如果是单体技能，只对当前目标造成伤害
                                    target.gainHp(-damage);
                                    if (target.result().hpAffected) {
                                        target.startDamagePopup();
                                    }
                                    
                                    // 检查敌人是否死亡，如果死亡则触发死亡动画
                                    if (target.isDead()) {
                                        if (BattleManager._logWindow) {
                                            BattleManager._logWindow.push('performCollapse', target);
                                        }
                                    }
                                }
                            }
                            
                            // 移除状态
                            user.removeState(stateId);
                            
                            // 重置标记，允许下次再次触发属性提升
                            user._counterAttackBuffApplied = false;
                            
                            // 重置累计伤害
                            _Sec_BattleSystemInstance_AccumulatedDamage.set(actorId, 0);
                            
                            // 刷新状态窗口
                            if (BattleManager._statusWindow) {
                                BattleManager._statusWindow.refresh();
                            }
                        } catch (e) {
                            console.error("累计反击计算错误:", e);
                        }
                    } else {
                        // 没有状态，添加状态并开始累计伤害
                        // 添加标记，确保属性提升只触发一次
                        if (!user._counterAttackBuffApplied) {
                            user.addState(stateId);
                            user._counterAttackBuffApplied = true;
                            
                            // 重置累计伤害
                            const actorId = user.isActor() ? user.actorId() : -user.enemyId();
                            _Sec_BattleSystemInstance_AccumulatedDamage.set(actorId, 0);
                            
                            // 应用属性提升
                            try {
                                // 设置公式变量
                                const a = user;
                                const v = $gameVariables._data;
                                const s = $gameSwitches._data;
                                
                                // 计算属性提升值
                                const value = Math.floor(eval(statValue));
                                
                                // 根据属性类型应用提升
                                if (statType === 'def') {
                                    user._paramPlus[3] += value; // 防御力参数索引为3
                                } else if (statType === 'mdef') {
                                    user._paramPlus[5] += value; // 魔法防御力参数索引为5
                                } else if (statType === 'hp') {
                                    // 恢复HP值
                                    user.gainHp(value);
                                } else if (statType === 'atk') {
                                    user._paramPlus[2] += value; // 攻击力参数索引为2
                                } else if (statType === 'mat') {
                                    user._paramPlus[4] += value; // 魔法攻击力参数索引为4
                                } else if (statType === 'agi') {
                                    user._paramPlus[6] += value; // 敏捷参数索引为6
                                } else if (statType === 'luk') {
                                    user._paramPlus[7] += value; // 幸运参数索引为7
                                }
                                
                                // 刷新角色参数
                                user.refresh();
                                
                                // 刷新状态窗口
                                if (BattleManager._statusWindow) {
                                    BattleManager._statusWindow.refresh();
                                }
                            } catch (e) {
                                console.error("属性提升计算错误:", e);
                            }
                        }
                    }
                }
                
                // 功能9：检查备注中是否包含伤害转移标签
                // 支持格式：<伤害转移:状态ID,转移比例,转移伤害公式,恢复血量公式> 或 <伤害转移:状态ID,转移比例>
                const damageTransferMatch = note.match(/<伤害转移:(\d+),([\d\.]+)(?:,([^,>]+)(?:,([^>]+))?)?>/);
                
                if (damageTransferMatch) {
                    const stateId = parseInt(damageTransferMatch[1]);
                    const transferRate = parseFloat(damageTransferMatch[2].trim());
                    const transferFormula = damageTransferMatch[3] ? damageTransferMatch[3].trim() : null;
                    const recoverFormula = damageTransferMatch[4] ? damageTransferMatch[4].trim() : null;
                    
                    // 获取使用者
                    const user = this.subject();
                    
                    // 检查使用者是否已有该状态
                    if (user.isStateAffected(stateId)) {
                        // 已有状态，移除状态并清除伤害转移信息
                        user.removeState(stateId);
                        
                        // 清除所有队友的伤害转移标记
                        const actors = $gameParty.members();
                        for (const actor of actors) {
                            const actorId = actor.actorId();
                            _Sec_BattleSystemInstance_DamageTransferMarker.delete(actorId);
                        }
                        
                        // 刷新状态窗口
                        if (BattleManager._statusWindow) {
                            BattleManager._statusWindow.refresh();
                        }
                    } else {
                        // 没有状态，添加状态并设置伤害转移信息
                        user.addState(stateId);
                        
                        // 获取使用者的ID
                        const userId = user.isActor() ? user.actorId() : -user.enemyId();
                        
                        // 给所有队友设置伤害转移标记
                        const actors = $gameParty.members();
                        for (const actor of actors) {
                            const actorId = actor.actorId();
                            _Sec_BattleSystemInstance_DamageTransferMarker.set(actorId, {
                                markerId: userId,     // 标记由哪个角色提供的伤害转移
                                transferRate: transferRate,  // 转移比例
                                transferFormula: transferFormula, // 自定义转移伤害公式
                                recoverFormula: recoverFormula   // 自定义恢复血量公式
                            });
                        }
                        
                        // 刷新状态窗口
                        if (BattleManager._statusWindow) {
                            BattleManager._statusWindow.refresh();
                        }
                    }
                }
                
                // 功能10：弹射伤害 (原连锁伤害升级版)
                // 格式：<弹射伤害:初始公式,弹射公式,弹射次数,是否允许重复,弹射模式>
                // 弹射模式：order(固定顺序) / random(随机)
                const ricochetMatch = note.match(/<弹射伤害:([^,]+),([^,]+),(\d+),([^,]+),([^>]+)>/);
                
                if (ricochetMatch) {
                    const initFormula = ricochetMatch[1].trim();
                    const ricochetFormula = ricochetMatch[2].trim();
                    const maxBounces = parseInt(ricochetMatch[3]);
                    let allowRepeat = ricochetMatch[4].trim().toLowerCase() === 'true';
                    const mode = ricochetMatch[5].trim().toLowerCase(); // 'order' or 'random'
                    
                    // 随机模式强制允许重复
                    if (mode === 'random') {
                        allowRepeat = true;
                    }

                    const user = this.subject();

                    try {
                        // 1. 造成初始伤害
                        // 设置公式变量
                        const a = user;
                        const b = target;
                        const v = $gameVariables._data;
                        const s = $gameSwitches._data;
                        
                        const initDamage = Math.floor(eval(initFormula));
                        
                        if (initDamage > 0) {
                            // 对初始目标造成伤害
                            target.gainHp(-initDamage);
                            
                            // 显示伤害弹窗
                            if (target.result().hpAffected) {
                                target.startDamagePopup();
                            }
                            
                            // 初始目标受伤动作特效
                            target.performDamage();
                            
                            // 检查目标是否死亡
                            if (target.isDead()) {
                                if (BattleManager._logWindow) {
                                    BattleManager._logWindow.push('performCollapse', target);
                                }
                            }
                            
                            // 2. 准备弹射池 (Pool)
                            // 获取所有存活敌人
                            const allEnemies = $gameTroop.members().filter(e => !e.isDead());
                            let bouncePool = [];

                            if (mode === 'random') {
                                // 随机模式：包含目标敌人
                                bouncePool = allEnemies; 
                            } else {
                                // 固定顺序：排除目标敌人
                                bouncePool = allEnemies.filter(e => e !== target);
                                // 按索引排序，确保顺序固定
                                bouncePool.sort((a, b) => a.index() - b.index());
                            }

                            // 3. 计算弹射序列
                            let targetsSequence = [];
                            
                            if (bouncePool.length > 0) {
                                 if (mode === 'random') {
                                    // 随机模式：随机抽取 maxBounces 次
                                    for (let i = 0; i < maxBounces; i++) {
                                        const randIndex = Math.floor(Math.random() * bouncePool.length);
                                        targetsSequence.push(bouncePool[randIndex]);
                                    }
                                } else {
                                    // 固定顺序模式
                                    if (allowRepeat) {
                                        // 允许重复：循环遍历
                                        for (let i = 0; i < maxBounces; i++) {
                                            targetsSequence.push(bouncePool[i % bouncePool.length]);
                                        }
                                    } else {
                                        // 不允许重复：取前N个
                                        const count = Math.min(maxBounces, bouncePool.length);
                                        targetsSequence = bouncePool.slice(0, count);
                                    }
                                }
                            }

                            // 4. 执行弹射
                            // 使用保存的上下文变量，确保延迟执行时变量正确
                            const gameVariables = $gameVariables._data;
                            const gameSwitches = $gameSwitches._data;

                            // 计算动态延迟间隔
                            // 规则：3人及以下时单次延迟150ms。
                            // 超过3人时，每多1人延迟减少20ms。
                            const count = targetsSequence.length;
                            let stepDelay = 150;
                            
                            if (count > 3) {
                                stepDelay = 150 - (count - 3) * 20;
                            }
                            
                            // 设置一个最小值保护（例如30ms），防止人数过多导致延迟为负数或过快看不清
                            stepDelay = Math.max(30, stepDelay);

                            targetsSequence.forEach((enemy, index) => {
                                 const n = index + 1; // 次第数 (从1开始)
                                 const delay = n * stepDelay; // 动态延迟时间

                                 setTimeout(() => {
                                     // 再次检查敌人是否存活
                                     if (enemy.isDead()) return;

                                     // 计算弹射伤害
                                     let damage = 0;
                                     try {
                                         // 重新绑定变量，b 变为当前的弹射目标
                                         const a = user;
                                         const b = enemy;
                                         const v = gameVariables;
                                         const s = gameSwitches;
                                         // n 已经在闭包中可用

                                         damage = Math.floor(eval(ricochetFormula));
                                     } catch (e) {
                                         console.error("弹射伤害公式错误:", e);
                                     }

                                     if (damage > 0) {
                                         // 保存原始HP
                                         const originalHp = enemy.hp;

                                         // 造成伤害
                                         enemy.gainHp(-damage);
                                         
                                         // 设置伤害显示标记（仅显示数字）
                                         enemy._ignoreDamageLog = true;
                                         
                                         // 临时构造 result 对象以显示弹窗
                                         const originalResult = enemy._result;
                                         enemy._result = {};
                                         enemy._result.hpDamage = damage;
                                         enemy._result.missed = false;
                                         enemy._result.evaded = false;
                                         enemy._result.hpAffected = true;
                                         
                                         // 显示伤害弹窗
                                         enemy.startDamagePopup();
                                         
                                         // 【新增】触发受伤动作特效
                                         enemy.performDamage();
                                         
                                         // 恢复原始 result
                                         enemy._result = originalResult;
                                         
                                         // 检查死亡
                                         if (enemy.isDead() && originalHp > 0) {
                                             if (BattleManager._logWindow) {
                                                 BattleManager._logWindow.push('performCollapse', enemy);
                                             }
                                             if (BattleManager._statusWindow) {
                                                 BattleManager._statusWindow.refresh();
                                             }
                                         }
                                     }
                                 }, delay);
                            });
                        }
                    } catch (e) {
                        console.error("弹射伤害初始化错误:", e);
                    }
                }
            }
        }
    };

    // 2. 我方角色被攻击时恢复MP
    const _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        // 记录伤害前的状态
        const isActor = target.isActor();
        const isAttack = this.isAttack();
        
        // 执行原始动作
        _Game_Action_apply.call(this, target);
        
        // 检查是否是我方角色受到了伤害动作
        if (isActor) {
            // 获取实际伤害值
            const damageValue = target.result().hpDamage;

            // 【修改点B】在回蓝前，标记“忽略日志”
            target._ignoreMpLog = true;

            // 恢复5点MP
            target.gainMp(5);

            // 功能8：累计伤害 - 如果角色有累计反击状态，累计受到的伤害
            const actorId = target.actorId();
            const accumulatedDamage = _Sec_BattleSystemInstance_AccumulatedDamage.get(actorId) || 0;
            
            // 只累计实际伤害（正数）
            if (damageValue > 0) {
                _Sec_BattleSystemInstance_AccumulatedDamage.set(actorId, accumulatedDamage + damageValue);
            }
            
            // 功能9：伤害转移机制
            if (damageValue > 0) {
                // 检查当前角色是否有伤害转移标记
                const transferMarker = _Sec_BattleSystemInstance_DamageTransferMarker.get(actorId);
                
                if (transferMarker) {
                    // 获取标记角色ID和转移比例
                    const markerId = transferMarker.markerId;
                    const transferRate = transferMarker.transferRate;
                    
                    // 获取标记角色
                    const markerActor = $gameActors.actor(markerId);
                    
                    // 确保标记角色存在
                    if (markerActor) {
                          // 获取标记角色的属性
                          const markerMaxHp = markerActor.mhp;
                          const markerDefense = markerActor.def;
                          const markerMdef = markerActor.mdf;
                          const transferFormula = transferMarker.transferFormula;
                          const recoverFormula = transferMarker.recoverFormula;
                          
                          // 计算转移的伤害值
                          let transferDamage;
                          if (transferFormula) {
                              // 使用自定义公式计算转移伤害
                              try {
                                  // 提供公式中可用的变量
                                  const d = damageValue; // 原始伤害值
                                  const r = transferRate / 100; // 转移比例（0.3表示30%）
                                  const mhp = markerMaxHp; // 标记角色最大生命值
                                  const def = markerDefense; // 标记角色防御力
                                  const mdef = markerMdef; // 标记角色魔法防御力
                                  
                                  // 执行自定义公式
                                  transferDamage = Math.floor(eval(transferFormula));
                              } catch (e) {
                                      console.error("自定义转移伤害公式执行错误:", e, "使用默认公式");
                                  // 使用默认公式作为备选
                                  const defenseFactor = Math.min(0.5, markerDefense / 1000);
                                  const mdefFactor = Math.min(0.3, markerMdef / 1000);
                                  const baseTransfer = damageValue * transferRate / 100;
                                  const hpBonus = 1 + (markerMaxHp / 1000);
                                  const defenseReduction = 1 - defenseFactor - mdefFactor;
                                  transferDamage = Math.floor(baseTransfer * hpBonus * defenseReduction);
                              }
                          } else {
                              // 使用默认公式计算转移伤害
                              const defenseFactor = Math.min(0.5, markerDefense / 1000); // 防御力系数，最多减少50%
                              const mdefFactor = Math.min(0.3, markerMdef / 1000); // 魔法防御力系数，最多减少30%
                              const baseTransfer = damageValue * transferRate / 100;
                              const hpBonus = 1 + (markerMaxHp / 1000);
                              const defenseReduction = 1 - defenseFactor - mdefFactor;
                              transferDamage = Math.floor(baseTransfer * hpBonus * defenseReduction);
                          }
                          
                          // 确保转移伤害为正数，并且至少为1
                          const finalTransferDamage = Math.max(1, transferDamage);
                          
                          // 计算恢复血量
                          let recoverAmount;
                          
                          if (recoverFormula) {
                              // 使用自定义公式计算恢复血量
                              try {
                                  // 提供公式中可用的变量
                                  const d = damageValue; // 原始伤害值
                                  const r = transferRate / 100; // 转移比例（0.3表示30%）
                                  const mhp = markerMaxHp; // 标记角色最大生命值
                                  const def = markerDefense; // 标记角色防御力
                                  const mdef = markerMdef; // 标记角色魔法防御力
                                  
                                  // 执行自定义公式
                                  recoverAmount = Math.floor(eval(recoverFormula));
                                  // 确保恢复血量不为负数
                                  recoverAmount = Math.max(0, recoverAmount);
                              } catch (e) {
                                  console.error("自定义恢复血量公式执行错误:", e, "使用默认公式");
                                  // 使用默认公式作为备选（基于原始伤害和转移比例）
                                  const recoverHpBonus = 1 + (markerMaxHp / 2000);
                                  const recoverDefBonus = 1 + (markerDefense / 1000);
                                  const recoverMdefBonus = 1 + (markerMdef / 1000);
                                  recoverAmount = Math.floor(damageValue * (transferRate / 100) * recoverHpBonus * recoverDefBonus * recoverMdefBonus);
                              }
                          } else {
                              // 使用默认公式计算恢复血量（基于原始伤害和转移比例）
                              const recoverHpBonus = 1 + (markerMaxHp / 2000);
                              const recoverDefBonus = 1 + (markerDefense / 1000);
                              const recoverMdefBonus = 1 + (markerMdef / 1000);
                              recoverAmount = Math.floor(damageValue * (transferRate / 100) * recoverHpBonus * recoverDefBonus * recoverMdefBonus);
                          }
                        
                        // 1. 先正常结算伤害（已在上面完成）
                        
                        // 保存需要恢复血量的数据，延迟到攻击结束后执行
                         if (!target.isDead()) {
                             // 存储需要恢复的血量和目标信息
                             const recoverData = {
                                 target: target,
                                 amount: recoverAmount
                             };
                               
                            // 使用setTimeout延迟执行回血，确保在攻击结束后显示
                            setTimeout(() => {
                                // 应用血量恢复
                                recoverData.target.gainHp(recoverData.amount);
                                    
                                // 保存原始result对象
                                const originalResult = recoverData.target._result;
                                
                                // 创建一个临时result对象来显示回血
                                recoverData.target._result = {};
                                recoverData.target._result.hpDamage = -recoverData.amount; // 负的伤害表示回血
                                recoverData.target._result.missed = false;
                                recoverData.target._result.evaded = false;
                                recoverData.target._result.hpAffected = true;
                                recoverData.target._result.mpDamage = 0; // 确保不显示MP变化
                                recoverData.target._result.mpAffected = false;
                                
                                // 触发回血显示
                                recoverData.target.startDamagePopup();
                                
                                // 恢复原始result对象
                                recoverData.target._result = originalResult;
                            }, 300); // 300毫秒的延迟，让攻击伤害显示完成后再显示回血
                        }
                        
                        // 3. 对标记角色造成伤害
                        markerActor.gainHp(-finalTransferDamage);
                        
                        // 设置标记角色的伤害显示
                        markerActor.result().clear();
                        markerActor.result().hpDamage = finalTransferDamage;
                        markerActor.result().hpAffected = true;
                        
                        // 显示伤害弹窗
                        target.startDamagePopup();
                        markerActor.startDamagePopup();
                        
                        // 触发标记角色的受伤动画
                        markerActor.performDamage();
                        
                        // 标记角色承受伤害时只显示数字，不显示文本
                        markerActor._ignoreDamageLog = true;
                        
                        // 检查标记角色是否死亡
                        if (markerActor.isDead()) {
                            // 标记角色死亡，清除所有队友的伤害转移标记
                            const actors = $gameParty.members();
                            for (const actor of actors) {
                                const actorId = actor.actorId();
                                _Sec_BattleSystemInstance_DamageTransferMarker.delete(actorId);
                            }
                            
                            // 触发死亡事件
                            markerActor.performCollapse();
                        }
                        
                        // 更新标记角色的累计转移伤害
                        const accumulatedTransferDamage = _Sec_BattleSystemInstance_AccumulatedTransferDamage.get(markerId) || 0;
                        _Sec_BattleSystemInstance_AccumulatedTransferDamage.set(markerId, accumulatedTransferDamage + finalTransferDamage);
                    }
                }
            }
        }
    }
    
    
    // 重置处理标记的代码
    const _BattleManager_startAction = BattleManager.startAction;
    BattleManager.startAction = function() {
        const subject = this._subject;
        const action = subject.currentAction();
        
        // 重置所有角色的处理标记
        const allBattlers = $gameParty.members().concat($gameTroop.members());
        for (const battler of allBattlers) {
            battler._ignoreMpLog = undefined;
            battler._ignoreDamageLog = undefined; // 重置伤害日志忽略标记
        }
        
        // 调用原始方法
        _BattleManager_startAction.call(this);
    };
})();