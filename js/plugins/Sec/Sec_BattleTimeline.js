/*:
 * @target MZ
 * @plugindesc [战斗] TPB行动时间轴 & 实时推拉预览 & 动态排序
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
 * 3. 死亡反馈：角色死亡时图标原位闪烁 -> 留空 -> 后方补位。
 * 4. 时间膨胀：通过分辨率参数放大时间数值，避免数值重复。
 * 5. [v3.0] 推拉预览：选择推条/拉条技能时，时间轴会实时演示图标位置变化。
 *
 * ============================================================================
 * 更新日志
 * ============================================================================
 * v3.0:
 * - 新增：推拉条机制的底层支持与实时预览功能。
 * - 开放：BattleManager.applyTpbTickShift 供技能系统调用。
 * v2.9:
 * - 新增：[时间数字大小] 参数。
 * v2.8:
 * - 新增 [时间分辨率] 参数。
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
 * @default 80
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
 * @default 30
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
 * * @param TimeFontSize
 * @text 时间数字大小
 * @parent ---Appearance---
 * @desc 图标右下角剩余时间数字的字号。
 * @type number
 * @default 12
 */

(() => {
    'use strict';

    const pluginName = "Sec_BattleTimeline";
    const parameters = PluginManager.parameters(pluginName);
    
    const Conf = {
        x: Number(parameters['TimelineX'] || 80),
        y: Number(parameters['TimelineY'] === undefined ? 210 : parameters['TimelineY']),
        width: Number(parameters['TimelineWidth'] || 0),
        firstSize: Number(parameters['FirstIconSize'] || 36),
        stdSize: Number(parameters['IconSize'] || 24),
        spacing: Number(parameters['IconSpacing'] || 0),
        sinkY: Number(parameters['SelectionSinkY'] || 8),
        maxPred: Number(parameters['MaxPrediction'] || 17),
        timeRes: Number(parameters['TimeResolution'] || 10), 
        showBg: parameters['ShowBackgroundBox'] === 'true',
        borderColor: parameters['BoxBorderColor'] || "#490C23",
        enemyScale: Number(parameters['EnemyScale'] || 0.8),
        timeFontSize: Number(parameters['TimeFontSize'] || 12),
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
    //  BattleManager 扩展：预测引擎 (核心修改)
    // ========================================================================
    
    BattleManager._predictedTimeline = [];

    // [v3.0] 开放参数供外部使用
    BattleManager.getTpbResolution = function() {
        return Conf.timeRes;
    };

    // [v3.0] 实际执行推拉条 (改变 TPB Charge)
    // ticks > 0: 推条(Delay), ticks < 0: 拉条(Advance)
    BattleManager.applyTpbTickShift = function(target, ticks) {
        if (!target) return;
        const speed = target.tpbSpeed();
        if (speed === 0) return;
        const refTime = this.isActiveTpb() ? 240 : 60;
        const acceleration = speed / refTime;
        
        // 公式：deltaCharge = -deltaTicks * acc / res
        // 增加 Tick (推条) = 减少 Charge
        // 减少 Tick (拉条) = 增加 Charge
        const deltaCharge = -(ticks * acceleration / Conf.timeRes);
        target._tpbChargeTime = Math.max(0, Math.min(1, target._tpbChargeTime + deltaCharge));
    };

    // [v3.0] 获取当前预览的推拉值
    BattleManager.getPreviewTpbShift = function(battler) {
        // 必须处于输入阶段
        if (!this.isInputting()) return 0;
        const action = this.inputtingAction();
        if (!action || !action.item()) return 0;

        const note = action.item().note;
        let shift = 0;

        // 解析推条 (Delay) -> 增加 ticks
        const pushMatch = note.match(/<推条[:：]\s*(\d+)/);
        if (pushMatch) shift += parseInt(pushMatch[1]);

        // 解析拉条 (Advance) -> 减少 ticks
        const pullMatch = note.match(/<拉条[:：]\s*(\d+)/);
        if (pullMatch) shift -= parseInt(pullMatch[1]);

        if (shift === 0) return 0;

        // 判断 battler 是否被选中
        const scene = SceneManager._scene;
        if (!(scene instanceof Scene_Battle)) return 0;

        let isSelected = false;
        
        // 检查敌人窗口
        if (scene._enemyWindow && scene._enemyWindow.active) {
            if (action.isForAll()) {
                if (battler.isEnemy()) isSelected = true;
            } else {
                if (scene._enemyWindow.enemy() === battler) isSelected = true;
            }
        }
        // 检查队友窗口
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
        
        let simState = allBattlers.map(b => {
            // [v3.0] 在基础时间上叠加预览偏移量
            const baseTicks = this.tpbTicksToReady(b);
            const previewShift = this.getPreviewTpbShift(b);
            // 确保不会变成负数（实际上拉条拉过头就是0，即立即行动）
            const finalTicks = Math.max(0, baseTicks + previewShift);

            return {
                battler: b,
                ticksNeeded: finalTicks,
                fullCycle: this.tpbTicksFullCycle(b)
            };
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
                prediction.push({ battler: s.battler, isReady: true, ticks: 0 });
                predictionCount++;
                s.ticksNeeded += s.fullCycle;
            }
        });

        while (predictionCount < Conf.maxPred) {
            simState.sort((a, b) => a.ticksNeeded - b.ticksNeeded);
            const winner = simState[0];
            
            if (!winner) break; 

            const elapsed = winner.ticksNeeded;
            simTimeAccumulator += elapsed;

            simState.forEach(s => s.ticksNeeded -= elapsed);

            prediction.push({ 
                battler: winner.battler, 
                isReady: false, 
                ticks: Math.round(simTimeAccumulator) 
            });
            predictionCount++;

            winner.ticksNeeded = winner.fullCycle;
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

            const ghosts = this._visualItems.filter(i => i.isGhost);
            ghosts.sort((a, b) => a.x - b.x);
            
            const liveItems = [];
            const findItem = (battler) => this._visualItems.find(it => it.battler === battler && !it.isGhost && !it.matched);
            
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
                item.ticks = pred.ticks; 
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
                if (!item.isGhost && !item.matched) {
                    item.targetOpacity = 0; 
                }
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
            
            for (const item of this._visualItems) {
                if (item.opacity <= 1) continue;
                
                const isFlashing = (item.isGhost && item.ghostTimer > 30);
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

            if (isFlashing) {
                ctx.save();
                ctx.globalCompositeOperation = 'source-over';
                const flashAlpha = 0.6 + Math.sin(Date.now() / 30) * 0.4;
                ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
                ctx.fillRect(x, y, size, size);
                ctx.restore();
            }

            ctx.save();
            ctx.lineWidth = 1; 
            
            let color = Conf.borderColor; 
            if (isFirstVisual) {
                color = "#FFCA5F"; 
                ctx.lineWidth = 2; 
            } else if (item.isReady) {
                color = "#FFFF00"; 
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