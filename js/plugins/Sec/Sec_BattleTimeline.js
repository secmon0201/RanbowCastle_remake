/*:
 * @target MZ
 * @plugindesc [v2.6] 战斗时间轴 - 幽灵锁死与多目标联动版
 * @author Secmon
 * @base Sec_CustomDrawBattleStatus
 * @orderAfter Sec_CustomDrawBattleStatus
 *
 * @help
 * ============================================================================
 * Sec_BattleTimeline.js
 * ============================================================================
 * 本插件为 TPB (即时制/半即时制) 战斗模式提供一个可视化的行动顺序时间轴。
 *
 * 【核心功能】
 * 1. 实时预测：基于速度(AGI)和充能进度，实时演算未来回合顺序。
 * 2. 丝滑动画：图标移动、缩放、进场、退场均有平滑的插值动画。
 * 3. 死亡反馈：角色死亡时图标原位闪烁 -> 留空 -> 后方补位，无视觉抖动。
 * 4. 目标联动：选择技能目标时，时间轴上对应的单位图标会下沉提示。
 *
 * 【依赖插件】
 * 本插件依赖 Sec_CustomDrawBattleStatus.js 获取脸图位置信息。
 * 请确保本插件在插件列表中位于 Sec_CustomDrawBattleStatus 之下。
 *
 * ============================================================================
 * 更新日志
 * ============================================================================
 * v2.6:
 * - 优化注释规范。
 * - 修复特定情况下读取 scope 报错的问题。
 * - 完善幽灵锁死算法，彻底消除死亡时的排版抖动。
 *
 * ============================================================================
 *
 * @param ---Settings---
 * @text === 基础设置 ===
 * @default
 *
 * @param TimelineX
 * @text 时间轴 X 坐标
 * @parent ---Settings---
 * @desc 时间轴窗口的 X 坐标。
 * @type number
 * @min -9999
 * @default 50
 *
 * @param TimelineY
 * @text 时间轴 Y 坐标
 * @parent ---Settings---
 * @desc 时间轴 Y 坐标。
 * @type number
 * @min -1
 * @default 210
 *
 * @param TimelineWidth
 * @text 时间轴宽度
 * @parent ---Settings---
 * @desc 时间轴的宽度。设为 0 则使用屏幕宽度。
 * @type number
 * @default 0
 *
 * @param FirstIconSize
 * @text 首位图标尺寸
 * @parent ---Settings---
 * @desc 时间轴最左侧（当前行动者）的图标大小。
 * @type number
 * @default 36
 *
 * @param IconSize
 * @text 标准图标尺寸
 * @parent ---Settings---
 * @desc 后续预测图标的正方形边长。
 * @type number
 * @default 24
 *
 * @param IconSpacing
 * @text 图标间距
 * @parent ---Settings---
 * @desc 图标之间的水平间距。
 * @type number
 * @default 0
 *
 * @param SelectionSinkY
 * @text 选中下沉距离
 * @parent ---Settings---
 * @desc 当选中目标时，时间轴图标下沉的像素值。
 * @type number
 * @default 8
 *
 * @param MaxPrediction
 * @text 预测深度
 * @parent ---Settings---
 * @desc 向未来预测多少个回合的行动顺序。
 * @type number
 * @default 17
 *
 * @param ---Appearance---
 * @text === 外观设置 ===
 * @default
 *
 * @param ShowBackgroundBox
 * @text 显示背景黑框
 * @parent ---Appearance---
 * @desc 是否在图标下显示半透明黑底？
 * @type boolean
 * @default true
 *
 * @param BoxBorderColor
 * @text 边框颜色
 * @parent ---Appearance---
 * @desc 普通图标外框的颜色 (CSS格式)。
 * @type string
 * @default #490C23
 *
 * @param EnemyScale
 * @text 敌人图片缩放
 * @parent ---Appearance---
 * @desc 敌人图片在图标框内的缩放比例。
 * @type number
 * @decimals 2
 * @default 0.80
 */

(() => {
    'use strict';

    const pluginName = "Sec_BattleTimeline";
    const parameters = PluginManager.parameters(pluginName);
    
    // ========================================================================
    //  配置参数读取
    // ========================================================================
    const Conf = {
        x: Number(parameters['TimelineX'] || 80),
        y: Number(parameters['TimelineY'] === undefined ? 210 : parameters['TimelineY']),
        width: Number(parameters['TimelineWidth'] || 0),
        firstSize: Number(parameters['FirstIconSize'] || 36),
        stdSize: Number(parameters['IconSize'] || 24),
        spacing: Number(parameters['IconSpacing'] || 0),
        sinkY: Number(parameters['SelectionSinkY'] || 8),
        maxPred: Number(parameters['MaxPrediction'] || 17),
        showBg: parameters['ShowBackgroundBox'] === 'true',
        borderColor: parameters['BoxBorderColor'] || "#490C23",
        enemyScale: Number(parameters['EnemyScale'] || 0.8),
        animSpeed: 0.15 // 动画插值速度 (0.0-1.0)，越小越平滑但延迟越高
    };

    /**
     * 自动计算时间轴 Y 坐标
     * @description 如果 TimelineY 设为 -1，则尝试根据 Sec_CustomDrawBattleStatus 的脸图位置进行定位。
     * @returns {number} 计算出的 Y 坐标
     */
    function getAutoY() {
        const SecStatusParams = PluginManager.parameters('Sec_CustomDrawBattleStatus');
        if (SecStatusParams && Object.keys(SecStatusParams).length > 0) {
            const winY = Number(SecStatusParams['WindowY'] || 450);
            const faceScale = Number(SecStatusParams['FaceScale'] || 1.0);
            const faceOffsetY = Number(SecStatusParams['FaceOffsetY'] || 0);
            // 估算脸图实际高度
            const estFaceSize = Math.floor((ImageManager.faceWidth || 144) * faceScale);
            return winY + faceOffsetY + estFaceSize + 10; 
        }
        return 200; // 默认回退值
    }

    // ========================================================================
    //  Game_Battler 扩展
    // ========================================================================
    
    // 捕获单位死亡事件，通知时间轴播放死亡动画
    const _Game_Battler_performCollapse = Game_Battler.prototype.performCollapse;
    Game_Battler.prototype.performCollapse = function() {
        _Game_Battler_performCollapse.call(this);
        if (BattleManager._timelineWindow) {
            BattleManager._timelineWindow.onBattlerDeath(this);
        }
    };

    // ========================================================================
    //  BattleManager 扩展：预测引擎
    // ========================================================================
    
    // 存储计算好的预测列表 [{battler, isReady}, ...]
    BattleManager._predictedTimeline = [];

    /**
     * 计算单位到达行动点 (TPB=1.0) 所需的时间 Tick 数
     * @param {Game_Battler} battler 目标单位
     * @returns {number} 所需 Ticks
     */
    BattleManager.tpbTicksToReady = function(battler) {
        if (battler.isTpbReady() || battler.isTpbCharged() || battler._tpbState === 'acting') {
            return 0; // 已就绪，时间为0
        }
        
        let needed = 0;
        const speed = battler.tpbSpeed();
        if (speed === 0) return 9999; // 防止除以0

        const refTime = this.isActiveTpb() ? 240 : 60;
        const acceleration = speed / refTime;

        if (battler._tpbState === 'casting') {
            // 吟唱中：计算剩余吟唱时间
            needed = (battler.tpbRequiredCastTime() - battler._tpbCastTime) / acceleration;
        } else {
            // 充能中：计算剩余充能时间
            needed = (1.0 - battler._tpbChargeTime) / acceleration;
        }
        
        return Math.max(0, needed);
    };

    /**
     * 计算单位跑完一整圈 (0% -> 100%) 所需的时间 Tick 数
     * @param {Game_Battler} battler 目标单位
     * @returns {number} 完整周期 Ticks
     */
    BattleManager.tpbTicksFullCycle = function(battler) {
        const speed = battler.tpbSpeed();
        if (speed === 0) return 9999;
        const refTime = this.isActiveTpb() ? 240 : 60;
        const acceleration = speed / refTime;
        return 1.0 / acceleration;
    };

    /**
     * 更新时间轴预测列表
     * @description 使用模拟算法预测未来 N 个回合的行动顺序。
     */
    BattleManager.updateTimelinePrediction = function() {
        if (!this.isTpb()) return;

        // 1. 获取所有存活且可见的单位
        const allBattlers = this.allBattleMembers().filter(b => b.isAlive() && b.isAppeared());
        
        // 2. 初始化模拟状态
        let simState = allBattlers.map(b => ({
            battler: b,
            ticksNeeded: this.tpbTicksToReady(b),
            fullCycle: this.tpbTicksFullCycle(b)
        }));

        const prediction = [];
        let predictionCount = 0;

        // 3. 优先处理已就绪单位 (Ticks <= 0)
        const readyBattlers = simState.filter(s => s.ticksNeeded <= 0.0001);
        // 按索引排序以保证稳定性
        readyBattlers.sort((a, b) => {
            if (Math.abs(a.ticksNeeded - b.ticksNeeded) < 0.0001) {
                return a.battler.index() - b.battler.index();
            }
            return a.ticksNeeded - b.ticksNeeded;
        });

        readyBattlers.forEach(s => {
            if (predictionCount < Conf.maxPred) {
                prediction.push({ battler: s.battler, isReady: true });
                predictionCount++;
                // 模拟行动后，该单位需要跑完一整圈才能再次行动
                s.ticksNeeded += s.fullCycle;
            }
        });

        // 4. 模拟未来回合 (时间轮算法)
        while (predictionCount < Conf.maxPred) {
            // 找出最快到达行动点的单位
            simState.sort((a, b) => a.ticksNeeded - b.ticksNeeded);
            const winner = simState[0];
            
            if (!winner) break; // 防止异常

            // 推进时间
            const elapsed = winner.ticksNeeded;
            simState.forEach(s => s.ticksNeeded -= elapsed);

            // 记录预测结果
            prediction.push({ battler: winner.battler, isReady: false });
            predictionCount++;

            // 重置赢家状态
            winner.ticksNeeded = winner.fullCycle;
        }

        this._predictedTimeline = prediction;
    };

    // 挂钩 Update 循环
    const _BattleManager_update = BattleManager.update;
    BattleManager.update = function(timeActive) {
        _BattleManager_update.call(this, timeActive);
        if (this.isTpb()) {
            this.updateTimelinePrediction();
        }
    };

    // ========================================================================
    //  UI 组件：VisualItem
    // ========================================================================
    
    /**
     * 视觉对象类
     * @description 管理单个图标的动画状态（位置、大小、透明度、幽灵计时）。
     */
    class VisualItem {
        constructor(battler, x, y, size) {
            this.battler = battler;
            // 当前渲染属性
            this.x = x;
            this.y = y;
            this.size = size;
            this.opacity = 0; // 初始透明，产生淡入效果
            
            // 目标属性 (动画终点)
            this.targetX = x;
            this.targetY = y;
            this.targetSize = size;
            this.targetOpacity = 255;
            
            // 状态标记
            this.isGhost = false;   // 是否为死亡幽灵
            this.ghostTimer = 0;    // 幽灵倒计时
            this.isReady = false;   // 是否处于就绪状态
            this.matched = false;   // 本帧是否匹配到了预测数据
        }

        update() {
            // 平滑插值动画 (Lerp)
            const spd = Conf.animSpeed;
            this.x += (this.targetX - this.x) * spd;
            this.y += (this.targetY - this.y) * spd;
            this.size += (this.targetSize - this.size) * spd;
            this.opacity += (this.targetOpacity - this.opacity) * spd;
            
            if (this.isGhost) {
                this.ghostTimer--;
            }
        }
    }

    // ========================================================================
    //  UI 组件：Window_BattleTimeline
    // ========================================================================

    class Window_BattleTimeline extends Window_Base {
        constructor(rect) {
            super(rect);
            this.padding = 0; // 移除内边距，确保绘图区域最大化
            this.createContents(); // 重建画布
            this.setBackgroundType(2); // 背景全透明
            
            this._visualItems = []; // 视觉对象池
        }

        /**
         * 获取当前玩家选中的目标列表
         * @returns {Array<Game_Battler>} 选中的目标数组
         */
        getCurrentSelection() {
            const scene = SceneManager._scene;
            if (!(scene instanceof Scene_Battle)) return [];
            
            const action = BattleManager.inputtingAction();
            // 安全检查：防止 action 或 item 为空导致崩溃
            const isForAll = (action && action.item()) ? action.isForAll() : false;

            // 1. 敌人选择窗口激活
            if (scene._enemyWindow && scene._enemyWindow.active) {
                if (isForAll) {
                    return $gameTroop.aliveMembers();
                } else {
                    const enemy = scene._enemyWindow.enemy();
                    return enemy ? [enemy] : [];
                }
            }
            
            // 2. 角色选择窗口激活
            if (scene._actorWindow && scene._actorWindow.active) {
                if (isForAll) {
                    return $gameParty.battleMembers();
                } else {
                    const index = scene._actorWindow.index();
                    if (index >= 0) {
                        return [$gameParty.battleMembers()[index]];
                    }
                }
            }
            
            return [];
        }

        /**
         * 响应单位死亡事件
         * @param {Game_Battler} battler 死亡的单位
         */
        onBattlerDeath(battler) {
            // 将所有关联该单位的图标转为幽灵
            // 保持当前位置不变，开始倒计时
            for (let i = this._visualItems.length - 1; i >= 0; i--) {
                const item = this._visualItems[i];
                if (item.battler === battler && !item.isGhost) {
                    item.isGhost = true;
                    item.ghostTimer = 60; // 30帧闪烁 + 30帧留空
                }
            }
        }

        update() {
            super.update();
            this.updateLayoutTargets();
            this.updateTweens();
            this.draw();
        }

        /**
         * 核心排版算法：计算每个图标的目标位置
         * @description 使用“幽灵锁死 (Slot Locking)”策略防止抖动。
         */
        updateLayoutTargets() {
            const predList = BattleManager._predictedTimeline || [];
            const selections = this.getCurrentSelection();

            // 1. 重置匹配标记 (仅针对非幽灵)
            this._visualItems.forEach(i => { if(!i.isGhost) i.matched = false; });

            // 2. 整理幽灵列表
            const ghosts = this._visualItems.filter(i => i.isGhost);
            // 幽灵按当前屏幕 X 坐标排序，确保视觉顺序正确
            ghosts.sort((a, b) => a.x - b.x);
            
            // 3. 整理活体列表 (生成或复用 VisualItem)
            const liveItems = [];
            const findItem = (battler) => this._visualItems.find(it => it.battler === battler && !it.isGhost && !it.matched);
            
            // 计算出生点 (屏幕最右侧之外)
            let maxVisualX = 0;
            this._visualItems.forEach(i => maxVisualX = Math.max(maxVisualX, i.x));
            const spawnX = (maxVisualX > 0 ? maxVisualX : 0) + Conf.stdSize + Conf.spacing;

            for (const pred of predList) {
                let item = findItem(pred.battler);
                if (!item) {
                    item = new VisualItem(pred.battler, spawnX, 4, Conf.stdSize);
                    this._visualItems.push(item);
                }
                item.matched = true;
                item.isReady = pred.isReady;
                liveItems.push(item);
            }

            // 4. 混合分配位置 (核心逻辑)
            let currentX = 4;
            let slotIndex = 0; // 当前正在填充第几个显示槽位
            let liveIndex = 0;
            let ghostIndex = 0;
            
            // 循环填充槽位，直到填满预测深度或没有更多项
            while (liveIndex < liveItems.length || ghostIndex < ghosts.length) {
                if (slotIndex >= Conf.maxPred + ghosts.length) break;

                const isFirst = (slotIndex === 0);
                const slotSize = isFirst ? Conf.firstSize : Conf.stdSize;
                
                let takenByGhost = null;
                
                // 检查当前槽位是否被幽灵“锁死”
                if (ghostIndex < ghosts.length) {
                    const ghost = ghosts[ghostIndex];
                    // 判定标准：幽灵的 X 坐标小于当前槽位的中点
                    // 意味着幽灵在这个槽位或更前面，它拥有优先占位权
                    if (ghost.x < currentX + (slotSize / 2)) {
                        takenByGhost = ghost;
                        ghostIndex++;
                    }
                }
                
                let item = null;
                
                if (takenByGhost) {
                    // 槽位被幽灵占据
                    item = takenByGhost;
                    item.targetX = currentX;
                    item.targetSize = slotSize;
                } else if (liveIndex < liveItems.length) {
                    // 槽位空闲，填入预测列表中的下一位
                    item = liveItems[liveIndex];
                    liveIndex++;
                    item.targetX = currentX;
                    item.targetSize = slotSize;
                } else {
                    break;
                }
                
                // --- 计算通用目标属性 ---
                
                // Y轴下沉逻辑
                const isSelected = selections.includes(item.battler);
                // 规则：选中 且 (不是视觉首位 或 是幽灵)
                // 实际上我们希望：如果是首位且是自己行动，通常不下沉。
                // 这里的 shouldSink 逻辑：如果是选中的目标，且该图标不是排在第一位的“当前行动者”，则下沉。
                // 注意：如果幽灵卡在第一位，它也会被判定为 isFirst。
                const shouldSink = isSelected && !isFirst; 
                
                item.targetY = 4 + (shouldSink ? Conf.sinkY : 0);
                
                // 透明度逻辑
                if (item.isGhost) {
                    // 幽灵阶段二(timer<=30)时不可见，但仍占位
                    item.targetOpacity = (item.ghostTimer > 30) ? 255 : 0; 
                } else {
                    item.targetOpacity = 255;
                }
                
                // 移动 X 指针到下一格
                currentX += slotSize + Conf.spacing;
                slotIndex++;
            }
            
            // 5. 清理未分配到的项
            this._visualItems.forEach(item => {
                if (!item.isGhost && !item.matched) {
                    item.targetOpacity = 0; // 淡出
                }
            });
            
            // 物理移除垃圾对象
            for (let i = this._visualItems.length - 1; i >= 0; i--) {
                const item = this._visualItems[i];
                // 移除条件：(幽灵且倒计时结束) 或 (非幽灵且完全透明)
                if ((item.isGhost && item.ghostTimer <= 0) || 
                    (!item.isGhost && !item.matched && item.opacity <= 1)) {
                    this._visualItems.splice(i, 1);
                }
            }
        }

        updateTweens() {
            this._visualItems.forEach(item => item.update());
        }

        draw() {
            if (!this.contents) return;
            this.contents.clear();
            
            // 绘制循环
            for (const item of this._visualItems) {
                if (item.opacity <= 1) continue;
                
                // 闪烁判定：幽灵的前30帧
                const isFlashing = (item.isGhost && item.ghostTimer > 30);
                // 首位判定：根据坐标模糊判断
                const isFirstVisual = (Math.abs(item.x - 4) < 10); 

                this.drawTimelineItem(item, isFlashing, isFirstVisual);
            }
        }

        drawTimelineItem(item, isFlashing, isFirstVisual) {
            const x = Math.floor(item.x);
            const y = Math.floor(item.y);
            const size = Math.floor(item.size);
            const opacity = item.opacity;
            
            const ctx = this.contents.context;
            ctx.save();
            ctx.globalAlpha = opacity / 255;

            // 1. 背景 (半透明黑底)
            if (Conf.showBg) {
                ctx.save();
                ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                ctx.fillRect(x, y, size, size);
                ctx.restore();
            }

            // 2. 图标内容
            if (item.battler.isActor()) {
                this.drawActorIcon(item.battler, x, y, size);
            } else {
                this.drawEnemyIcon(item.battler, x, y, size);
            }

            // 3. 死亡闪烁层 (白色叠加)
            if (isFlashing) {
                ctx.save();
                ctx.globalCompositeOperation = 'source-over';
                const flashAlpha = 0.6 + Math.sin(Date.now() / 30) * 0.4;
                ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
                ctx.fillRect(x, y, size, size);
                ctx.restore();
            }

            // 4. 边框绘制
            ctx.save();
            ctx.lineWidth = 1; 
            
            let color = Conf.borderColor; 
            if (isFirstVisual) {
                color = "#FFCA5F"; // 首位金色
                ctx.lineWidth = 2; // 首位加粗
            } else if (item.isReady) {
                color = "#FFFF00"; // 就绪黄色
            }

            ctx.strokeStyle = color;
            // 像素偏移修正 (+0.5) 保证线条锐利
            const offset = ctx.lineWidth / 2;
            ctx.strokeRect(x + offset, y + offset, size - ctx.lineWidth, size - ctx.lineWidth); 
            ctx.restore();

            ctx.restore(); // 恢复 globalAlpha
        }

        drawActorIcon(actor, x, y, size) {
            const bitmap = ImageManager.loadFace(actor.faceName());
            if (bitmap.isReady()) {
                const pw = ImageManager.faceWidth;
                const ph = ImageManager.faceHeight;
                const sx = (actor.faceIndex() % 4) * pw;
                const sy = Math.floor(actor.faceIndex() / 4) * ph;
                this.contents.blt(bitmap, sx, sy, pw, ph, x, y, size, size);
            }
        }

        drawEnemyIcon(enemy, x, y, size) {
            let bitmap;
            if ($gameSystem.isSideView()) {
                bitmap = ImageManager.loadSvEnemy(enemy.battlerName());
            } else {
                bitmap = ImageManager.loadEnemy(enemy.battlerName());
            }

            if (bitmap.isReady()) {
                const scale = Conf.enemyScale;
                const sw = bitmap.width;
                const sh = bitmap.height;
                let dw, dh;
                if (sw > sh) {
                    dw = size * scale;
                    dh = (sh / sw) * dw;
                } else {
                    dh = size * scale;
                    dw = (sw / sh) * dh;
                }
                const dx = Math.floor(x + (size - dw) / 2);
                const dy = Math.floor(y + (size - dh) / 2);
                this.contents.blt(bitmap, 0, 0, sw, sh, dx, dy, dw, dh);
            }
        }
    }

    // ========================================================================
    //  Scene_Battle 扩展：窗口创建
    // ========================================================================

    const _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);
        if (BattleManager.isTpb()) {
            this.createTimelineWindow();
        }
    };

    Scene_Battle.prototype.createTimelineWindow = function() {
        const w = Conf.width > 0 ? Conf.width : Graphics.boxWidth;
        const maxIconH = Math.max(Conf.firstSize, Conf.stdSize);
        // 计算窗口高度：图标高度 + 下沉距离 + 缓冲
        const h = maxIconH + Conf.sinkY + 30; 
        
        const x = Conf.x;
        const y = Conf.y === -1 ? getAutoY() : Conf.y;

        const rect = new Rectangle(x, y, w, h);
        this._timelineWindow = new Window_BattleTimeline(rect);
        BattleManager._timelineWindow = this._timelineWindow;
        // 添加到场景的最上层
        this.addWindow(this._timelineWindow);
    };

})();