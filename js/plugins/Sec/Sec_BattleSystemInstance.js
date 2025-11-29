/*:
 * @target MZ
 * @plugindesc [重构版v2.1] 战斗系统实例插件 - 职业被动与技能主动分离
 * @author Secmon (Refactored by Gemini)
 * @version 2.1.0
 * * @help
 * ============================================================================
 * ★ 新旧功能迁移与对照指南 ★
 * ============================================================================
 * 本插件将原有的分散功能整合为“职业被动”和“技能主动”两大模块。
 * 请按照下表修改数据库中的备注配置。
 * * ----------------------------------------------------------------------------
 * 1. 普攻特效 (原功能1：普攻回蓝)
 * ----------------------------------------------------------------------------
 * [旧版机制]：底层写死，所有角色普攻强制回10点MP。无法修改。
 * [新版机制]：【职业被动】。在数据库【职业】备注栏填写标签。
 * [迁移写法]：
 * <战斗触发:Attack, a.gainMp(10)>
 * [扩展用法]：
 * <战斗触发:Attack, a.gainTp(5)>      // 普攻获得5点TP
 * <战斗触发:Attack, a.gainHp(a.atk)>  // 普攻吸血(回复等同攻击力的血量)
 * * ----------------------------------------------------------------------------
 * 2. 受击特效 (原功能2：受击回蓝)
 * ----------------------------------------------------------------------------
 * [旧版机制]：底层写死，所有角色受击强制回5点MP。无法修改。
 * [新版机制]：【职业被动】。在数据库【职业】备注栏填写标签。
 * [迁移写法]：
 * <战斗触发:Hit, a.gainMp(5)>
 * [扩展用法]：
 * <战斗触发:Hit, v[1]+=1>             // 受击时让1号变量+1
 * <战斗触发:Hit, a.gainTp(10)>        // 受击获得10点TP(怒气模式)
 * * ----------------------------------------------------------------------------
 * 3. 状态交互 (原功能3：状态伤害 & 原功能7：Buff治疗)
 * ----------------------------------------------------------------------------
 * [旧版机制]：伤害和治疗分开写，标签不同。
 * 伤害：<状态伤害:5, a.atk*2, true>
 * 治疗：<Buff治疗:30, a.mat*2, true, all>
 * [新版机制]：【技能主动】。统一为一个标签，正数为伤，负数为奶。
 * [标签格式]：<状态交互: 状态ID, 公式, 是否移除, 目标范围>
 * 范围可选：Target(当前目标), Self(使用者自身), AllAllies(全体队友)
 * [迁移写法]：
 * 原伤害：<状态交互:5, a.atk*2, true, Target>
 * 原治疗：<状态交互:30, -(a.mat*2), true, AllAllies>  (注意公式前的负号)
 * * ----------------------------------------------------------------------------
 * 4. 力场共鸣 (原功能5：持续伤害/扩散 & 原功能6：终结伤害/聚合)
 * ----------------------------------------------------------------------------
 * [旧版机制]：扩散伤害和根据数量终结分开写。
 * 扩散：<持续伤害:20, a.mat*2>
 * 终结：<终结伤害:21, a.atk*n, true>
 * [新版机制]：【技能主动】。统一为一个标签，通过模式区分。
 * [标签格式]：<力场共鸣: 状态ID, 模式, 公式, 是否移除>
 * 模式可选：Spread(扩散/炸全场), Gather(聚合/打单体)
 * [迁移写法]：
 * 原扩散：<力场共鸣:20, Spread, a.mat*2, false>
 * 原终结：<力场共鸣:21, Gather, a.atk*n, true>
 * * ----------------------------------------------------------------------------
 * 5. 其他高级功能 (完全兼容旧版，无需修改)
 * ----------------------------------------------------------------------------
 * 以下功能标签保持原样，直接写在【技能】备注中：
 * - 功能4：<状态循环:ID1, ID2, ID3...>
 * - 功能8：<累计反击:状态ID, 属性类型, 属性值, 反击公式>
 * - 功能9：<伤害转移:状态ID, 比例...>
 * - 功能10：<弹射伤害:初始公式, 弹射公式, 次数...>
 * * ============================================================================
 * ★ 参数变量说明 ★
 * ============================================================================
 * 在所有公式中，您可以使用以下变量：
 * a   : 动作使用者 (在受击触发中指代受击者自己)
 * b   : 动作目标   (在受击触发中指代攻击来源)
 * v   : 游戏变量数组 (例如 v[1] 代表变量1)
 * s   : 游戏开关数组 (例如 s[1] 代表开关1)
 * dmg : 本次行动造成的实际伤害值 (仅在触发器中可用)
 * n   : 场上拥有指定状态的人数 (仅在力场共鸣Gather模式可用)
 */

(() => {
    const pluginName = "BattleSystemInstance";

    // ======================================================================
    // 全局数据存储
    // ======================================================================
    // 存储每个角色的累计受到伤害值 (用于功能8:累计反击)
    const _Sec_AccumulatedDamage = new Map();
    // 存储伤害转移的标记信息 (用于功能9:伤害转移)
    const _Sec_TransferMarker = new Map();


    // ======================================================================
    // 核心逻辑挂钩：Game_Action.prototype.executeDamage
    // 作用：在伤害结算时切入，处理所有主动和被动效果
    // ======================================================================
    const _Game_Action_executeDamage = Game_Action.prototype.executeDamage;
    Game_Action.prototype.executeDamage = function(target, value) {
        
        // 1. 执行原版伤害计算逻辑，先让伤害生效
        _Game_Action_executeDamage.call(this, target, value);

        // 获取上下文信息
        const subject = this.subject();     // 动作使用者
        const item = this.item();           // 使用的技能/物品对象
        const actualDamage = target.result().hpDamage; // 获取实际造成的HP伤害

        // ==================================================================
        // 【模块 A】 职业被动机制 (Class Passives)
        // 规则：仅扫描 Actor 所属 Class 的备注。不扫描状态、装备。
        // ==================================================================
        
        // --- A1. 普攻特效 (对应原功能1) ---
        // 触发条件：
        // 1. 使用者是角色 (Actor)
        // 2. 当前动作是【普通攻击】 (isAttack)
        if (subject && subject.isActor() && this.isAttack()) {
            const classData = subject.currentClass(); // 获取职业数据对象
            
            // 检查职业备注是否存在
            if (classData && classData.note) {
                // 正则匹配：<战斗触发:Attack, 公式>
                const matches = classData.note.matchAll(/<战斗触发:Attack,([^>]+)>/gi);
                
                for (const match of matches) {
                    const formula = match[1].trim();
                    try {
                        // 准备公式变量
                        const a = subject; // a 代表攻击者(自己)
                        const b = target;  // b 代表挨打的人
                        const v = $gameVariables._data;
                        const s = $gameSwitches._data;
                        const dmg = actualDamage;
                        
                        // 细节优化：如果公式包含回蓝(gainMp)，临时屏蔽日志以防刷屏
                        if (formula.includes('gainMp')) subject._ignoreMpLog = true;
                        
                        // 执行公式
                        eval(formula);
                        
                        // 恢复日志显示
                        subject._ignoreMpLog = false;
                    } catch (e) {
                        console.error(`[Sec] 职业被动(Attack)执行错误: 职业ID=${classData.id}`, e);
                    }
                }
            }
        }

        // --- A2. 受击特效 (对应原功能2) ---
        // 触发条件：
        // 1. 目标是角色 (Actor)
        // 2. 确实受到了攻击判定 (命中 OR 产生了伤害)
        if (target && target.isActor()) {
            const result = target.result();
            // 只要命中了(isHit) 或者 确实扣血了(damage > 0)
            if (result.isHit() || actualDamage > 0) {
                const classData = target.currentClass(); // 获取受击者的职业
                
                if (classData && classData.note) {
                    // 正则匹配：<战斗触发:Hit, 公式>
                    const matches = classData.note.matchAll(/<战斗触发:Hit,([^>]+)>/gi);
                    
                    for (const match of matches) {
                        const formula = match[1].trim();
                        try {
                            // 准备公式变量
                            const a = target;  // 【注意】在受击触发中，a 代表受击者(自己)
                            const b = subject; // b 代表攻击来源
                            const v = $gameVariables._data;
                            const s = $gameSwitches._data;
                            const dmg = actualDamage;

                            // 细节优化：屏蔽回蓝日志
                            if (formula.includes('gainMp')) target._ignoreMpLog = true;
                            
                            eval(formula);
                            
                            target._ignoreMpLog = false;
                        } catch (e) {
                            console.error(`[Sec] 职业被动(Hit)执行错误: 职业ID=${classData.id}`, e);
                        }
                    }
                }
            }
        }

        // 如果没有物品数据(极少情况)，后续不再执行
        if (!item) return;


        // ==================================================================
        // 【模块 B】 技能主动机制 (Skill Actives)
        // 规则：仅扫描当前使用的 Skill/Item 的备注。
        // ==================================================================
        const note = item.note;
        
        // --- B1. 状态交互 (对应原功能3, 7) ---
        // 格式：<状态交互: 状态ID, 公式, 是否移除, 范围>
        // 逻辑：扫描指定范围的目标，如果带有状态ID，则执行公式。公式>0扣血，公式<0加血。
        const stateInteractMatches = note.matchAll(/<状态交互:(\d+),([^,]+),([^,]+),([^>]+)>/g);
        
        for (const match of stateInteractMatches) {
            const stateId = parseInt(match[1]);
            const formula = match[2].trim();
            const removeState = match[3].trim().toLowerCase() === 'true';
            const range = match[4].trim().toLowerCase();

            // 确定作用范围
            let targets = [];
            if (range === 'target') {
                targets = [target]; // 仅当前技能目标
            } else if (range === 'allallies') {
                targets = $gameParty.members(); // 全体队友
            } else if (range === 'self') {
                targets = [subject]; // 使用者自己
            }

            // 遍历范围内的每个单位
            targets.forEach(t => {
                if (t.isAlive() && t.isStateAffected(stateId)) {
                    try {
                        const a = subject;
                        const b = t; // b 总是指向当前被检查的单位
                        const v = $gameVariables._data;
                        
                        // 计算数值
                        const val = Math.floor(eval(formula));

                        if (val > 0) { 
                            // 正数：造成伤害
                            t.gainHp(-val);
                            if (t.result().hpAffected) t.startDamagePopup();
                        } else if (val < 0) { 
                            // 负数：造成治疗 (gainHp传入正数)
                            t.gainHp(-val);
                            if (t.result().hpAffected) t.startDamagePopup();
                        }

                        // 处理状态移除
                        if (removeState) {
                            t.removeState(stateId);
                        }
                    } catch (e) { 
                        console.error(`[Sec] 状态交互计算错误: 状态ID=${stateId}`, e); 
                    }
                }
            });
        }

// --- B2. 力场共鸣 (对应原功能5, 6) ---
        // 格式：<力场共鸣: 状态ID, 模式, 公式, 是否移除>
        // 模式：Spread(扩散), Gather(聚合)
        const fieldResMatches = note.matchAll(/<力场共鸣:(\d+),([^,]+),([^,]+),([^>]+)>/g);
        
        for (const match of fieldResMatches) {
            const stateId = parseInt(match[1]);
            const mode = match[2].trim().toLowerCase();
            const formula = match[3].trim();
            const removeState = match[4].trim().toLowerCase() === 'true';

            // 扫描全场（队友+敌人）所有存活且带有该状态的单位
            const allBattlers = $gameParty.members().concat($gameTroop.members());
            const affectedMembers = allBattlers.filter(m => m.isAlive() && m.isStateAffected(stateId));

            if (mode === 'spread') {
                // [Spread模式]：引爆场上所有带状态的人
                // 延迟执行，让当前攻击动画先播完
                setTimeout(() => {
                    affectedMembers.forEach(m => {
                        try {
                            const a = subject;
                            const b = m; // b 是当前被引爆的单位
                            const v = $gameVariables._data;
                            
                            const val = Math.floor(eval(formula));
                            if (val > 0) {
                                m.gainHp(-val);
                                
                                // 【优化】显示伤害跳字
                                if (m.result().hpAffected) m.startDamagePopup();
                                
                                // 【优化】触发受击表现 (闪白 + 音效)
                                m.performDamage(); 

                                // 如果被炸死了，触发死亡效果
                                if (m.isDead()) m.performCollapse();
                            }
                        } catch(e) {
                            console.error(`[Sec] 力场共鸣(Spread)错误`, e);
                        }
                    });
                    
                    // 统一移除状态
                    if (removeState) {
                        affectedMembers.forEach(m => m.removeState(stateId));
                    }
                }, 200); // 200ms 延迟

            } else if (mode === 'gather') {
                // [Gather模式]：根据场上带状态的人数(n)，集火当前目标
                const n = affectedMembers.length; // 核心变量 n
                
                if (n > 0) {
                    try {
                        const a = subject;
                        const b = target; // b 是当前技能目标
                        const v = $gameVariables._data;
                        
                        const val = Math.floor(eval(formula));
                        if (val > 0) {
                            target.gainHp(-val);
                            
                            // 【优化】显示伤害跳字
                            if (target.result().hpAffected) target.startDamagePopup();
                            
                            // 【优化】触发受击表现 (闪白 + 音效)
                            target.performDamage();
                        }
                        
                        // 移除全场所有人的该状态
                        if (removeState) {
                            affectedMembers.forEach(m => m.removeState(stateId));
                        }
                    } catch(e) {
                        console.error(`[Sec] 力场共鸣(Gather)错误`, e);
                    }
                }
            }
        }


        // ==================================================================
        // 【模块 C】 保留的高级机制 (Legacy Features)
        // 规则：保持原版逻辑，写在技能备注中。
        // ==================================================================
        
        // --- C1. 状态循环 (原功能4) ---
        // 逻辑：如果有状态1就换成2，有2换成3...
        const stateCycleMatch = note.match(/<状态循环:([^>]+)>/);
        if (stateCycleMatch) {
            const stateIds = stateCycleMatch[1].split(',').map(id => parseInt(id.trim()));
            if (stateIds.length >= 2) {
                // 查找当前拥有的状态索引
                let currentIndex = stateIds.findIndex(id => target.isStateAffected(id));
                
                if (currentIndex === -1) {
                    // 一个都没有，加第一个
                    target.addState(stateIds[0]);
                } else if (currentIndex < stateIds.length - 1) {
                    // 有中间的，移除当前，加下一个
                    target.removeState(stateIds[currentIndex]);
                    target.addState(stateIds[currentIndex + 1]);
                }
                // 如果是最后一个，什么都不做(保持原逻辑)
            }
        }

        // --- C2. 复杂流程处理 (反击/转移/弹射) ---
        // 这些功能包含复杂的多段伤害或属性修改，封装在独立函数处理
        // 增加标记防止单次Action内多次重复执行
        if (!this._specialEffectsProcessed) {
            this._specialEffectsProcessed = true;
            
            // 重置反击属性提升标记
            if (subject) subject._counterAttackBuffApplied = false;
            
            // 执行处理函数
            processComplexFeatures.call(this, subject, target, note);
        }
    };


    /**
     * 处理复杂的遗留功能 (功能8, 9, 10)
     * @param {Game_Battler} user - 使用者
     * @param {Game_Battler} target - 目标
     * @param {string} note - 技能备注
     */
    function processComplexFeatures(user, target, note) {
        
        // ==================================================================
        // 功能 8：累计反击 (Accumulated Counter)
        // ==================================================================
        const counterMatch = note.match(/<累计反击:(\d+),([^,]+),([^,]+),([^>]+)>/);
        if (counterMatch) {
            const stateId = parseInt(counterMatch[1]);
            const statType = counterMatch[2].trim().toLowerCase(); // def, atk, etc.
            const statValue = counterMatch[3].trim();
            const counterFormula = counterMatch[4].trim();

            if (user.isStateAffected(stateId)) {
                // 【阶段2：释放反击】
                try {
                    const actorId = user.isActor() ? user.actorId() : -user.enemyId();
                    const accumulatedDamage = _Sec_AccumulatedDamage.get(actorId) || 0;
                    
                    // 变量准备
                    const a = user;
                    const b = target;
                    const d = accumulatedDamage; // 核心变量 d
                    const v = $gameVariables._data;
                    
                    const damage = Math.floor(eval(counterFormula));
                    
                    if (damage > 0) {
                        // 判断是全体还是单体
                        if (this.isForAll()) {
                            const targets = this.targetsForOpponents();
                            targets.forEach(t => {
                                t.gainHp(-damage);
                                if (t.result().hpAffected) t.startDamagePopup();
                                if (t.isDead() && BattleManager._logWindow) BattleManager._logWindow.push('performCollapse', t);
                            });
                        } else {
                            target.gainHp(-damage);
                            if (target.result().hpAffected) target.startDamagePopup();
                            if (target.isDead() && BattleManager._logWindow) BattleManager._logWindow.push('performCollapse', target);
                        }
                    }
                    
                    // 释放后清理状态和数据
                    user.removeState(stateId);
                    user._counterAttackBuffApplied = false;
                    _Sec_AccumulatedDamage.set(actorId, 0);
                    
                } catch(e) { console.error("[Sec] 累计反击释放错误", e); }
            } else {
                // 【阶段1：开启蓄力】
                 if (!user._counterAttackBuffApplied) {
                    user.addState(stateId);
                    user._counterAttackBuffApplied = true;
                    
                    // 初始化累计伤害池
                    const actorId = user.isActor() ? user.actorId() : -user.enemyId();
                    _Sec_AccumulatedDamage.set(actorId, 0);
                    
                    // 应用临时的属性提升
                    try {
                        const a = user;
                        const v = $gameVariables._data;
                        const value = Math.floor(eval(statValue));
                        
                        // 映射属性ID
                        const paramMap = { 'def':3, 'mdef':5, 'atk':2, 'mat':4, 'agi':6, 'luk':7 };
                        
                        if(paramMap[statType]) {
                            user._paramPlus[paramMap[statType]] += value;
                        } else if(statType === 'hp') {
                            user.gainHp(value);
                        }
                        user.refresh();
                    } catch(e){ console.error("[Sec] 累计反击属性提升错误", e); }
                }
            }
        }

        // ==================================================================
        // 功能 9：伤害转移 (Damage Transfer)
        // ==================================================================
        const dtMatch = note.match(/<伤害转移:(\d+),([\d\.]+)(?:,([^,>]+)(?:,([^>]+))?)?>/);
        if (dtMatch) {
             const stateId = parseInt(dtMatch[1]);
             const rate = parseFloat(dtMatch[2]);
             
             // 如果已有状态 -> 关闭转移
             if (user.isStateAffected(stateId)) {
                 user.removeState(stateId);
                 // 清除全队的标记
                 $gameParty.members().forEach(m => _Sec_TransferMarker.delete(m.actorId()));
             } else {
                 // 如果没有状态 -> 开启转移
                 user.addState(stateId);
                 const userId = user.isActor() ? user.actorId() : -user.enemyId();
                 
                 // 给全队打上标记：受伤时找userId分摊
                 $gameParty.members().forEach(m => {
                     _Sec_TransferMarker.set(m.actorId(), {
                         markerId: userId,
                         transferRate: rate,
                         transferFormula: dtMatch[3],
                         recoverFormula: dtMatch[4]
                     });
                 });
             }
        }

        // ==================================================================
        // 功能 10：弹射伤害 (Ricochet Damage)
        // ==================================================================
        const ricochetMatch = note.match(/<弹射伤害:([^,]+),([^,]+),(\d+),(\d+),([^,]+),([^>]+)>/);
        if (ricochetMatch) {
            const initFormula = ricochetMatch[1];
            const ricochetFormula = ricochetMatch[2];
            const maxBounces = parseInt(ricochetMatch[3]);
            const damageCapM = parseInt(ricochetMatch[4]);
            let allowRepeat = ricochetMatch[5].trim().toLowerCase() === 'true';
            const mode = ricochetMatch[6].trim().toLowerCase(); // order 或 random
            
            // 随机模式强制允许重复
            if (mode === 'random') allowRepeat = true;

            try {
                // 1. 造成初始伤害
                const a = user, b = target, v = $gameVariables._data;
                const initDmg = Math.floor(eval(initFormula));
                if(initDmg > 0) {
                    target.gainHp(-initDmg);
                    if (target.result().hpAffected) target.startDamagePopup();
                    target.performDamage();
                }

                // 2. 构建弹射池
                const allEnemies = $gameTroop.members().filter(e => !e.isDead());
                let bouncePool = [];
                
                if (mode === 'random') {
                    bouncePool = allEnemies; 
                } else {
                    // order模式：排除初始目标，按索引排序
                    bouncePool = allEnemies.filter(e => e !== target);
                    bouncePool.sort((a, b) => a.index() - b.index());
                }

                // 3. 构建弹射目标队列
                let targetsSequence = [];
                if (bouncePool.length > 0) {
                     if (mode === 'random') {
                        for (let i = 0; i < maxBounces; i++) {
                            // 随机抽取
                            targetsSequence.push(bouncePool[Math.floor(Math.random() * bouncePool.length)]);
                        }
                    } else {
                        if (allowRepeat) {
                            // 循环取值
                            for (let i = 0; i < maxBounces; i++) targetsSequence.push(bouncePool[i % bouncePool.length]);
                        } else {
                            // 取前N个
                            targetsSequence = bouncePool.slice(0, Math.min(maxBounces, bouncePool.length));
                        }
                    }
                }

                // 4. 计算延迟逻辑 (人越多延迟越短，最低30ms)
                let stepDelay = 150;
                if (targetsSequence.length > 3) {
                    stepDelay = Math.max(30, 150 - (targetsSequence.length - 3) * 20);
                }

                // 5. 执行延迟弹射
                targetsSequence.forEach((enemy, index) => {
                     const realN = index + 1;
                     const delay = realN * stepDelay;
                     // 伤害公式中的 n 受 m 限制
                     const n = (damageCapM > 0) ? Math.min(realN, damageCapM) : realN;
                     
                     setTimeout(() => {
                         if (enemy.isDead()) return;
                         let damage = 0;
                         try {
                             const a = user, b = enemy, v = $gameVariables._data;
                             // 这里的 n 使用闭包中的值
                             damage = Math.floor(eval(ricochetFormula));
                         } catch (e) { console.error("[Sec] 弹射公式错误", e); }
                         
                         if (damage > 0) {
                             const originalHp = enemy.hp;
                             enemy.gainHp(-damage);
                             
                             // 特殊处理：只显示数字，不显示战斗日志文本
                             enemy._ignoreDamageLog = true;
                             
                             // 构造临时result显示弹窗
                             const originalResult = enemy._result;
                             enemy._result = { hpDamage: damage, missed: false, evaded: false, hpAffected: true };
                             enemy.startDamagePopup();
                             enemy.performDamage();
                             enemy._result = originalResult;
                             
                             // 死亡判定
                             if (enemy.isDead() && originalHp > 0) {
                                 if (BattleManager._logWindow) BattleManager._logWindow.push('performCollapse', enemy);
                             }
                         }
                     }, delay);
                });
            } catch(e) { console.error("[Sec] 弹射主逻辑错误", e); }
        }
    }

    // ======================================================================
    // 挂钩：Game_Action.prototype.apply
    // 作用：处理【受击后】的被动逻辑（累计反击积攒、伤害转移结算）
    // ======================================================================
    const _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.call(this, target);
        
        const result = target.result();
        // 判定条件：必须命中 且 造成了伤害
        if (result.isHit() && result.hpDamage > 0) {
            const damageValue = result.hpDamage;
            
            // 仅针对我方角色处理被动逻辑
            if (target.isActor()) {
                const actorId = target.actorId();
                
                // --- 逻辑 A：累计反击的数据积攒 (功能8) ---
                const accumulated = _Sec_AccumulatedDamage.get(actorId) || 0;
                _Sec_AccumulatedDamage.set(actorId, accumulated + damageValue);

                // --- 逻辑 B：伤害转移的结算 (功能9) ---
                const transferInfo = _Sec_TransferMarker.get(actorId);
                
                // 如果当前受击者身上有转移标记
                if (transferInfo) {
                    const markerActor = $gameActors.actor(transferInfo.markerId);
                    
                    // 确保承担伤害的人(守护者)还活着
                    if (markerActor && !markerActor.isDead()) {
                        let transferDamage = 0, recoverAmount = 0;
                        try {
                            const d = damageValue;
                            const r = transferInfo.transferRate / 100;
                            const mhp = markerActor.mhp, def = markerActor.def, mdef = markerActor.mdf;
                            
                            // 计算转移伤害 (守护者受到的伤害)
                            if (transferInfo.transferFormula) {
                                transferDamage = Math.floor(eval(transferInfo.transferFormula));
                            } else {
                                // 默认公式
                                transferDamage = Math.floor(d * r * (1 + mhp/1000) * (1 - Math.min(0.5, def/1000) - Math.min(0.3, mdef/1000)));
                            }
                            transferDamage = Math.max(1, transferDamage);

                            // 计算恢复量 (受击者回血量)
                            if (transferInfo.recoverFormula) {
                                recoverAmount = Math.floor(eval(transferInfo.recoverFormula));
                            } else {
                                // 默认公式
                                recoverAmount = Math.floor(d * r * (1 + mhp/2000));
                            }
                            recoverAmount = Math.max(0, recoverAmount);
                        } catch(e) { console.error("[Sec] 伤害转移公式错误", e); }

                        // 延迟300ms给受击者回血（视觉效果：先扣血再回上来）
                        if (!target.isDead()) {
                            setTimeout(() => {
                                target.gainHp(recoverAmount);
                                // 临时构造result显示绿色回血字样
                                const tempRes = target._result;
                                target._result = { hpDamage: -recoverAmount, hpAffected: true, missed: false, evaded: false };
                                target.startDamagePopup();
                                target._result = tempRes;
                            }, 300);
                        }

                        // 守护者立即扣血
                        markerActor.gainHp(-transferDamage);
                        markerActor._ignoreDamageLog = true; // 不显示文本日志
                        markerActor.result().hpDamage = transferDamage;
                        markerActor.result().hpAffected = true;
                        markerActor.startDamagePopup();
                        markerActor.performDamage();
                        
                        // 如果守护者死了，移除全队标记
                        if (markerActor.isDead()) {
                             $gameParty.members().forEach(m => _Sec_TransferMarker.delete(m.actorId()));
                             markerActor.performCollapse();
                        }
                    }
                }
            }
        }
    };

    // ======================================================================
    // 挂钩：BattleManager.startAction
    // 作用：每回合行动开始前，清理临时的日志忽略标记
    // ======================================================================
    const _BattleManager_startAction = BattleManager.startAction;
    BattleManager.startAction = function() {
        const all = $gameParty.members().concat($gameTroop.members());
        all.forEach(b => {
            b._ignoreMpLog = undefined;
            b._ignoreDamageLog = undefined;
        });
        _BattleManager_startAction.call(this);
    };

})();