/*:
 * @target MZ
 * @plugindesc [战斗] TPB行动时间轴 & 实时推拉预览 & 动态排序 (v4.1 交互修复版)
 * @author Secmon
 * @base Sec_CustomDrawBattleStatus
 * @orderAfter Sec_CustomDrawBattleStatus
 *
 * @help
 * ============================================================================
 * Sec_BattleTimeline.js (v4.1 交互修复版)
 * ============================================================================
 * * 【更新日志 v4.1】
 * 1. [修复] 修复了“玩家正在选技能时被推条”导致的 'setSkill of undefined' 崩溃。
 * 原理：在剥夺角色行动权的同时，强制刷新场景窗口状态，立即使窗口失效。
 *
 * ============================================================================
 * * @param ---Settings---
 * @text === 基础设置 ===
 * @default
 *
 * @param TimelineX
 * @text 时间轴 X 坐标
 * @parent ---Settings---
 * @desc 时间轴窗口的 X 坐标。
 * @type number
 * @min -9999
 * @default 128
 *
 * @param TimelineY
 * @text 时间轴 Y 坐标
 * @parent ---Settings---
 * @desc 时间轴 Y 坐标。
 * @type number
 * @min -1
 * @default 195
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
 * @default 2
 *
 * @param SelectionSinkY
 * @text 选中下沉距离
 * @parent ---Settings---
 * @desc 当选中目标时，时间轴图标下沉的像素值。
 * @type number
 * @default 12
 *
 * @param MaxPrediction
 * @text 预测深度
 * @parent ---Settings---
 * @desc 向未来预测多少个回合的行动顺序。
 * @type number
 * @default 20
 *
 * @param TimeResolution
 * @text 时间分辨率 (倍率)
 * @parent ---Settings---
 * @desc 核心参数！将默认的时间单位放大多少倍。建议 10~60。
 * @type number
 * @default 10
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
 *
 * @param TimeFontSize
 * @text 时间数字大小
 * @parent ---Appearance---
 * @desc 图标右下角剩余时间数字的字号。
 * @type number
 * @default 12
 * * @param PullArrowColor
 * @text 拉条箭头颜色
 * @parent ---Appearance---
 * @desc 目标向左移动（行动提前）时的箭头颜色。
 * @type string
 * @default #FFCA5F
 * * @param PushArrowColor
 * @text 推条箭头颜色
 * @parent ---Appearance---
 * @desc 目标向右移动（行动延后）时的箭头颜色。
 * @type string
 * @default #00FF00
 */

(() => {
    'use strict';

    const pluginName = "Sec_BattleTimeline";
    const parameters = PluginManager.parameters(pluginName);
    
    // 更新默认参数
    const Conf = {
        x: Number(parameters['TimelineX'] || 128),
        y: Number(parameters['TimelineY'] === undefined ? 195 : parameters['TimelineY']),
        width: Number(parameters['TimelineWidth'] || 0),
        firstSize: Number(parameters['FirstIconSize'] || 36),
        stdSize: Number(parameters['IconSize'] || 24),
        spacing: Number(parameters['IconSpacing'] || 2),
        sinkY: Number(parameters['SelectionSinkY'] || 12),
        maxPred: Number(parameters['MaxPrediction'] || 20),
        timeRes: Number(parameters['TimeResolution'] || 10), 
        showBg: parameters['ShowBackgroundBox'] === 'true',
        borderColor: parameters['BoxBorderColor'] || "#490C23",
        enemyScale: Number(parameters['EnemyScale'] || 0.8),
        timeFontSize: Number(parameters['TimeFontSize'] || 12),
        pullColor: parameters['PullArrowColor'] || "#FFCA5F",
        pushColor: parameters['PushArrowColor'] || "#00FF00",
        animSpeed: 0.15 
    };

    function getAutoY() {
        const SecStatusParams = PluginManager.parameters('Sec_CustomDrawBattleStatus');
        if (SecStatusParams && Object.keys(SecStatusParams).length > 0) {
            const winY = Number(SecStatusParams['WindowY'] || 450);
            const faceScale = Number(SecStatusParams['FaceScale'] || 1.0);
            const estFaceSize = Math.floor((ImageManager.faceWidth || 144) * faceScale);
            return winY + 10 + estFaceSize + 10; 
        }
        return 200; 
    }

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
    
    BattleManager._predictedTimeline = [];

    BattleManager.getTpbResolution = function() {
        return Conf.timeRes;
    };

    // ========================================================================
    //  修复版 v4.1：推条逻辑 (强制状态回退 + 窗口刷新)
    // ========================================================================
    BattleManager.applyTpbTickShift = function(target, ticks) {
        if (!target) return;
        const speed = target.tpbSpeed();
        if (speed === 0) return;
        
        // 计算推拉幅度
        const refTime = this.isActiveTpb() ? 240 : 60;
        const acceleration = speed / refTime;
        const deltaCharge = -(ticks * acceleration / Conf.timeRes);
        
        // 应用数值变化 (限制在 0~1 之间)
        target._tpbChargeTime = Math.max(0, Math.min(1, target._tpbChargeTime + deltaCharge));

        // 【核心修复逻辑】
        if (target._tpbChargeTime < 1.0) {
            if (target.isTpbCharged() || target.isTpbReady()) {
                // 1. 强制重置状态为充能中
                target._tpbState = "charging";
                // 2. 确保回合结束标志被清除
                target._tpbTurnEnd = false; 

                // 3. 特殊处理：如果被推条的是“当前正在选菜单的玩家角色”
                if (target === this._currentActor) {
                    this.cancelActorInput();
                    this._inputting = false;
                    this._currentActor = null;

                    // [Fix v4.1] 立即刷新场景窗口状态
                    // 这会强制调用 updateInputWindowVisibility -> closeCommandWindows
                    // 从而让 Window_BattleSkill 等窗口立即 deactivate，防止 processTouch 继续响应导致崩溃
                    if (SceneManager._scene instanceof Scene_Battle) {
                        SceneManager._scene.updateInputWindowVisibility();
                    }
                }
            }
        }
    };

    BattleManager.getPreviewTpbShift = function(battler) {
        if (!this.isInputting()) return 0;
        const action = this.inputtingAction();
        if (!action || !action.item()) return 0;

        const note = action.item().note;
        let shift = 0;

        const pushMatch = note.match(/<推条[:：]\s*(\d+)/);
        if (pushMatch) shift += parseInt(pushMatch[1]);

        const pullMatch = note.match(/<拉条[:：]\s*(\d+)/);
        if (pullMatch) shift -= parseInt(pullMatch[1]);

        if (shift === 0) return 0;

        const scene = SceneManager._scene;
        if (!(scene instanceof Scene_Battle)) return 0;

        let isSelected = false;
        
        if (scene._enemyWindow && scene._enemyWindow.active) {
            if (action.isForAll()) {
                if (battler.isEnemy()) isSelected = true;
            } else {
                if (scene._enemyWindow.enemy() === battler) isSelected = true;
            }
        }
        else if (scene._actorWindow && scene._actorWindow.active) {
            if (action.isForAll()) {
                if (battler.isActor()) isSelected = true;
            } else {
                const index = scene._actorWindow.index();
                if (index >= 0 && $gameParty.battleMembers()[index] === battler) isSelected = true;
            }
        }

        return isSelected ? shift : 0;
    };

    BattleManager.tpbTicksToReady = function(battler) {
        if (battler.isTpbReady() || battler.isTpbCharged() || battler._tpbState === 'acting') {
            return 0; 
        }
        
        let needed = 0;
        const speed = battler.tpbSpeed();
        if (speed === 0) return 99999; 

        const refTime = this.isActiveTpb() ? 240 : 60;
        const acceleration = speed / refTime;

        if (battler._tpbState === 'casting') {
            needed = (battler.tpbRequiredCastTime() - battler._tpbCastTime) / acceleration;
        } else {
            needed = (1.0 - battler._tpbChargeTime) / acceleration;
        }
        
        return Math.max(0, needed) * Conf.timeRes;
    };

    BattleManager.tpbTicksFullCycle = function(battler) {
        const speed = battler.tpbSpeed();
        if (speed === 0) return 99999;
        const refTime = this.isActiveTpb() ? 240 : 60;
        const acceleration = speed / refTime;
        return (1.0 / acceleration) * Conf.timeRes;
    };

    BattleManager.updateTimelinePrediction = function() {
        if (!this.isTpb()) return;

        const allBattlers = this.allBattleMembers().filter(b => b.isAlive() && b.isAppeared());
        
        let simState = [];
        
        allBattlers.forEach(b => {
            const baseTicks = this.tpbTicksToReady(b);
            const shift = this.getPreviewTpbShift(b);
            const fullCycle = this.tpbTicksFullCycle(b);

            simState.push({
                battler: b,
                ticksNeeded: Math.max(0, baseTicks + shift),
                fullCycle: fullCycle,
                type: (shift !== 0) ? 'preview' : 'normal'
            });

            if (shift !== 0) {
                simState.push({
                    battler: b,
                    ticksNeeded: Math.max(0, baseTicks),
                    fullCycle: 9999999, 
                    type: 'origin'
                });
            }
        });

        const prediction = [];
        let predictionCount = 0;
        let simTimeAccumulator = 0;

        const readyBattlers = simState.filter(s => s.ticksNeeded <= 0.1);
        readyBattlers.sort((a, b) => {
            if (Math.abs(a.ticksNeeded - b.ticksNeeded) < 0.1) {
                return a.battler.index() - b.battler.index();
            }
            return a.ticksNeeded - b.ticksNeeded;
        });

        readyBattlers.forEach(s => {
            if (predictionCount < Conf.maxPred) {
                prediction.push({ 
                    battler: s.battler, 
                    isReady: true, 
                    ticks: 0,
                    type: s.type 
                });
                predictionCount++;
                s.ticksNeeded += s.fullCycle; 
            }
        });

        while (predictionCount < Conf.maxPred) {
            const validSims = simState.filter(s => s.ticksNeeded < 9000000);
            if (validSims.length === 0) break;

            validSims.sort((a, b) => a.ticksNeeded - b.ticksNeeded);
            const winner = validSims[0];
            
            const elapsed = winner.ticksNeeded;
            simTimeAccumulator += elapsed;

            simState.forEach(s => {
                if (s.ticksNeeded < 9000000) {
                    s.ticksNeeded -= elapsed;
                }
            });

            prediction.push({ 
                battler: winner.battler, 
                isReady: false, 
                ticks: Math.round(simTimeAccumulator),
                type: winner.type
            });
            predictionCount++;

            if (winner.type !== 'origin') {
                winner.ticksNeeded = winner.fullCycle;
            } else {
                winner.ticksNeeded = 9999999; 
            }
        }

        this._predictedTimeline = prediction;
    };

    const _BattleManager_update = BattleManager.update;
    BattleManager.update = function(timeActive) {
        _BattleManager_update.call(this, timeActive);
        if (this.isTpb()) {
            this.updateTimelinePrediction();
        }
    };

    // ========================================================================
    //  UI 组件
    // ========================================================================
    
    class VisualItem {
        constructor(battler, x, y, size) {
            this.battler = battler;
            this.x = x;
            this.y = y;
            this.size = size;
            this.opacity = 0; 
            
            this.targetX = x;
            this.targetY = y;
            this.targetSize = size;
            this.targetOpacity = 255;
            
            this.isGhost = false; 
            this.ghostTimer = 0;
            this.isReady = false; 
            this.matched = false;
            this.ticks = 0;
            this.previewType = 'normal'; 
            
            this._pulsePhase = 0; // 呼吸相位
            this._flashTimer = 0; // 闪光计时
        }

        update() {
            const spd = Conf.animSpeed;
            this.x += (this.targetX - this.x) * spd;
            this.y += (this.targetY - this.y) * spd;
            this.size += (this.targetSize - this.size) * spd;
            this.opacity += (this.targetOpacity - this.opacity) * spd;
            
            if (this.isGhost) {
                this.ghostTimer--;
            }

            this._pulsePhase = (this._pulsePhase + 0.1) % (Math.PI * 2);
            if (this._flashTimer > 0) this._flashTimer--;
        }

        triggerFlash() {
            this._flashTimer = 15; 
        }
    }

    class Window_BattleTimeline extends Window_Base {
        constructor(rect) {
            super(rect);
            this.padding = 0; 
            this.createContents();
            this.setBackgroundType(2); 
            this._visualItems = []; 
        }

        getCurrentSelection() {
            const scene = SceneManager._scene;
            if (!(scene instanceof Scene_Battle)) return [];
            
            const action = BattleManager.inputtingAction();
            const isForAll = (action && action.item()) ? action.isForAll() : false;

            if (scene._enemyWindow && scene._enemyWindow.active) {
                if (isForAll) return $gameTroop.aliveMembers();
                const enemy = scene._enemyWindow.enemy();
                return enemy ? [enemy] : [];
            }
            
            if (scene._actorWindow && scene._actorWindow.active) {
                if (isForAll) return $gameParty.battleMembers();
                const index = scene._actorWindow.index();
                if (index >= 0) return [$gameParty.battleMembers()[index]];
            }
            
            return [];
        }

        onBattlerDeath(battler) {
            for (let i = this._visualItems.length - 1; i >= 0; i--) {
                const item = this._visualItems[i];
                if (item.battler === battler && !item.isGhost) {
                    item.isGhost = true;
                    item.ghostTimer = 60; 
                }
            }
        }

        update() {
            super.update();
            this.updateLayoutTargets();
            this.updateTweens();
            this.draw();
        }

        updateLayoutTargets() {
            const predList = BattleManager._predictedTimeline || [];
            const selections = this.getCurrentSelection();

            this._visualItems.forEach(i => { if(!i.isGhost) i.matched = false; });

            const itemsByBattler = new Map();
            for (const item of this._visualItems) {
                if (item.isGhost) continue;
                if (!itemsByBattler.has(item.battler)) {
                    itemsByBattler.set(item.battler, []);
                }
                itemsByBattler.get(item.battler).push(item);
            }
            itemsByBattler.forEach(list => list.sort((a, b) => a.x - b.x));

            const ghosts = this._visualItems.filter(i => i.isGhost);
            ghosts.sort((a, b) => a.x - b.x);
            
            const liveItems = [];
            
            let maxVisualX = 0;
            this._visualItems.forEach(i => maxVisualX = Math.max(maxVisualX, i.x));
            const spawnX = (maxVisualX > 0 ? maxVisualX : 0) + Conf.stdSize + Conf.spacing;

            for (const pred of predList) {
                const battlerItems = itemsByBattler.get(pred.battler);
                let item = null;

                if (battlerItems && battlerItems.length > 0) {
                    const candidate = battlerItems[0];
                    const predType = pred.type || 'normal';
                    const justActed = (candidate.isReady && !pred.isReady && predType === 'normal');
                    
                    if (battlerItems.length > 1 && justActed) {
                        battlerItems.shift(); 
                        battlerItems.push(candidate);
                        item = battlerItems.shift();
                    } else {
                        item = battlerItems.shift();
                    }
                }

                if (!item) {
                    item = new VisualItem(pred.battler, spawnX + 50, 4, Conf.stdSize);
                    this._visualItems.push(item);
                }

                item.matched = true;
                
                if (!item.isReady && pred.isReady) {
                    item.triggerFlash();
                }
                item.isReady = pred.isReady; 
                
                item.ticks = pred.ticks; 
                item.previewType = pred.type; 
                liveItems.push(item);
            }

            let currentX = 4;
            let slotIndex = 0;
            let liveIndex = 0;
            let ghostIndex = 0;
            
            while (liveIndex < liveItems.length || ghostIndex < ghosts.length) {
                if (slotIndex >= Conf.maxPred + ghosts.length) break;

                const isFirst = (slotIndex === 0);
                const slotSize = isFirst ? Conf.firstSize : Conf.stdSize;
                
                let takenByGhost = null;
                if (ghostIndex < ghosts.length) {
                    const ghost = ghosts[ghostIndex];
                    if (ghost.x < currentX + (slotSize / 2)) {
                        takenByGhost = ghost;
                        ghostIndex++;
                    }
                }
                
                let item = null;
                if (takenByGhost) {
                    item = takenByGhost;
                    item.targetX = currentX;
                    item.targetSize = slotSize;
                } else if (liveIndex < liveItems.length) {
                    item = liveItems[liveIndex];
                    liveIndex++;
                    item.targetX = currentX;
                    item.targetSize = slotSize;
                } else {
                    break;
                }
                
                const isSelected = selections.includes(item.battler);
                const shouldSink = isSelected && !isFirst; 
                
                item.targetY = 4 + (shouldSink ? Conf.sinkY : 0);
                
                if (item.isGhost) {
                    item.targetOpacity = (item.ghostTimer > 30) ? 255 : 0; 
                } else {
                    item.targetOpacity = 255; 
                }
                
                currentX += slotSize + Conf.spacing;
                slotIndex++;
            }
            
            this._visualItems.forEach(item => {
                if (!item.isGhost && !item.matched) item.targetOpacity = 0; 
            });
            
            for (let i = this._visualItems.length - 1; i >= 0; i--) {
                const item = this._visualItems[i];
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
            
            this.drawArrows();

            for (const item of this._visualItems) {
                if (item.opacity <= 1) continue;
                
                const isGhostFlash = (item.isGhost && item.ghostTimer > 30);
                const isFirstVisual = (Math.abs(item.x - 4) < 10); 

                this.drawTimelineItem(item, isGhostFlash, isFirstVisual);
            }
        }

        drawArrows() {
            const groups = new Map();
            this._visualItems.forEach(item => {
                if (item.previewType === 'origin' || item.previewType === 'preview') {
                    if (!groups.has(item.battler)) groups.set(item.battler, []);
                    groups.get(item.battler).push(item);
                }
            });

            const ctx = this.contents.context;
            ctx.save();
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.8;

            groups.forEach(items => {
                const origin = items.find(i => i.previewType === 'origin');
                const preview = items.find(i => i.previewType === 'preview');

                if (origin && preview && Math.abs(origin.x - preview.x) > 10) {
                    const startX = origin.x + origin.size / 2;
                    const endX = preview.x + preview.size / 2;
                    const isPull = endX < startX;
                    const color = isPull ? Conf.pullColor : Conf.pushColor;

                    ctx.strokeStyle = color;
                    ctx.fillStyle = color;

                    const y = origin.y + origin.size / 2 + (origin.size * 2 / 3);
                    const padding = origin.size / 2 + 4; 
                    const dir = endX > startX ? 1 : -1;
                    
                    const lineStart = startX + (dir * padding);
                    const lineEnd = endX - (dir * padding);

                    if ((dir === 1 && lineStart < lineEnd) || (dir === -1 && lineStart > lineEnd)) {
                        ctx.beginPath();
                        ctx.moveTo(lineStart, y);
                        ctx.lineTo(lineEnd, y);
                        ctx.stroke();

                        const arrowSize = 6;
                        ctx.beginPath();
                        ctx.moveTo(lineEnd, y);
                        ctx.lineTo(lineEnd - (dir * arrowSize), y - arrowSize);
                        ctx.lineTo(lineEnd - (dir * arrowSize), y + arrowSize);
                        ctx.fill();
                    }
                }
            });

            ctx.restore();
        }

        drawTimelineItem(item, isGhostFlash, isFirstVisual) {
            let x = Math.floor(item.x);
            let y = Math.floor(item.y);
            let size = Math.floor(item.size);
            const opacity = item.opacity;
            
            if (isFirstVisual && !item.isGhost && item.matched) {
                const pulseScale = 1.0 + Math.sin(item._pulsePhase) * 0.05; 
                const oldSize = size;
                size = Math.floor(size * pulseScale);
                x -= (size - oldSize) / 2;
                y -= (size - oldSize) / 2;
            }

            const ctx = this.contents.context;
            ctx.save();
            ctx.globalAlpha = opacity / 255;

            if (Conf.showBg) {
                ctx.save();
                ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                ctx.fillRect(x, y, size, size);
                ctx.restore();
            }

            if (item.battler.isActor()) {
                this.drawActorIcon(item.battler, x, y, size);
            } else {
                this.drawEnemyIcon(item.battler, x, y, size);
            }

            if (isGhostFlash) {
                ctx.save();
                ctx.globalCompositeOperation = 'source-over';
                const flashAlpha = 0.6 + Math.sin(Date.now() / 30) * 0.4;
                ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
                ctx.fillRect(x, y, size, size);
                ctx.restore();
            } else if (item._flashTimer > 0) {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                const alpha = item._flashTimer / 15; 
                ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
                ctx.fillRect(x, y, size, size);
                ctx.restore();
            } else if (item.previewType === 'preview') {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = `rgba(100, 255, 100, 0.3)`; 
                ctx.fillRect(x, y, size, size);
                ctx.restore();
            } else if (item.previewType === 'origin') {
                ctx.save();
                ctx.fillStyle = `rgba(0, 0, 0, 0.4)`;
                ctx.fillRect(x, y, size, size);
                ctx.restore();
            }

            ctx.save();
            ctx.lineWidth = 1; 
            
            let color = Conf.borderColor; 
            if (isFirstVisual) {
                color = "#FFCA5F"; 
                ctx.lineWidth = 2; 
            } else if (item.previewType === 'preview') {
                color = "#00FF00"; 
            }

            ctx.strokeStyle = color;
            const offset = ctx.lineWidth / 2;
            ctx.strokeRect(x + offset, y + offset, size - ctx.lineWidth, size - ctx.lineWidth); 
            ctx.restore();

            if (typeof item.ticks === 'number' && item.ticks > 0) {
                this.drawTimeLabel(item.ticks, x, y, size);
            }

            ctx.restore(); 
        }

        drawTimeLabel(ticks, x, y, size) {
            this.contents.fontSize = Conf.timeFontSize; 
            this.contents.fontBold = true;
            this.contents.outlineWidth = 3;
            this.contents.outlineColor = 'rgba(0, 0, 0, 0.8)'; 

            const text = String(ticks);
            const textWidth = this.textWidth(text);
            
            const dx = x + size - textWidth - 2;
            const dy = y + size - this.contents.fontSize - 4; 

            this.changeTextColor(ColorManager.normalColor());
            this.drawText(text, dx, dy, textWidth + 5, 'left');
            
            this.resetFontSettings(); 
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
        const h = maxIconH + Conf.sinkY + 30; 
        
        const x = Conf.x;
        const y = Conf.y === -1 ? getAutoY() : Conf.y;

        const rect = new Rectangle(x, y, w, h);
        this._timelineWindow = new Window_BattleTimeline(rect);
        BattleManager._timelineWindow = this._timelineWindow;
        this.addWindow(this._timelineWindow);
    };

})();