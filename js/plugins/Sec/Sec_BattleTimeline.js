/*:
 * @target MZ
 * @plugindesc [v2.4] 战斗时间轴 - 目标修正与颜色定制版
 * @author Secmon
 * @base Sec_CustomDrawBattleStatus
 * @orderAfter Sec_CustomDrawBattleStatus
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
 *
 * @help
 * ============================================================================
 * 更新日志 (v2.4)
 * ============================================================================
 * 1. 【BUG修复】我方角色选择下沉失效修复。
 * - 修正了获取选中队友的逻辑，现在选择队友时图标会正确下沉。
 *
 * 2. 【逻辑优化】自身不下沉。
 * - 当目标是自己时，最左侧的“当前行动图标”保持不动，不会下沉。
 * - 如果该角色在未来还有预测图标，那些未来的图标会下沉。
 *
 * 3. 【外观更新】
 * - 最左侧当前行动者边框颜色：#FFCA5F (金色)。
 * - 其他普通图标边框颜色：#490C23 (深红)。
 * - 默认坐标更新为 X=80, Y=210。
 *
 * ============================================================================
 */

(() => {
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
        showBg: parameters['ShowBackgroundBox'] === 'true',
        borderColor: parameters['BoxBorderColor'] || "#490C23",
        enemyScale: Number(parameters['EnemyScale'] || 0.8),
        animSpeed: 0.15 
    };

    // 自动坐标计算 (备用)
    function getAutoY() {
        const SecStatusParams = PluginManager.parameters('Sec_CustomDrawBattleStatus');
        if (SecStatusParams && Object.keys(SecStatusParams).length > 0) {
            const winY = Number(SecStatusParams['WindowY'] || 450);
            const faceScale = Number(SecStatusParams['FaceScale'] || 1.0);
            const faceOffsetY = Number(SecStatusParams['FaceOffsetY'] || 0);
            const estFaceSize = Math.floor((ImageManager.faceWidth || 144) * faceScale);
            return winY + faceOffsetY + estFaceSize + 10; 
        }
        return 200; 
    }

    // ========================================================================
    //  Game_Battler 扩展
    // ========================================================================
    
    const _Game_Battler_performCollapse = Game_Battler.prototype.performCollapse;
    Game_Battler.prototype.performCollapse = function() {
        _Game_Battler_performCollapse.call(this);
        if (BattleManager._timelineWindow) {
            BattleManager._timelineWindow.onBattlerDeath(this);
        }
    };

    // ========================================================================
    //  BattleManager 预测引擎
    // ========================================================================
    
    BattleManager._predictedTimeline = [];

    BattleManager.tpbTicksToReady = function(battler) {
        if (battler.isTpbReady() || battler.isTpbCharged() || battler._tpbState === 'acting') {
            return 0;
        }
        let needed = 0;
        const speed = battler.tpbSpeed();
        if (speed === 0) return 9999; 
        const refTime = this.isActiveTpb() ? 240 : 60;
        const acceleration = speed / refTime;
        if (battler._tpbState === 'casting') {
            needed = (battler.tpbRequiredCastTime() - battler._tpbCastTime) / acceleration;
        } else {
            needed = (1.0 - battler._tpbChargeTime) / acceleration;
        }
        return Math.max(0, needed);
    };

    BattleManager.tpbTicksFullCycle = function(battler) {
        const speed = battler.tpbSpeed();
        if (speed === 0) return 9999;
        const refTime = this.isActiveTpb() ? 240 : 60;
        const acceleration = speed / refTime;
        return 1.0 / acceleration;
    };

    BattleManager.updateTimelinePrediction = function() {
        if (!this.isTpb()) return;

        const allBattlers = this.allBattleMembers().filter(b => b.isAlive() && b.isAppeared());
        let simState = allBattlers.map(b => ({
            battler: b,
            ticksNeeded: this.tpbTicksToReady(b),
            fullCycle: this.tpbTicksFullCycle(b)
        }));

        const prediction = [];
        let predictionCount = 0;

        const readyBattlers = simState.filter(s => s.ticksNeeded <= 0.0001);
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
                s.ticksNeeded += s.fullCycle;
            }
        });

        while (predictionCount < Conf.maxPred) {
            simState.sort((a, b) => a.ticksNeeded - b.ticksNeeded);
            const winner = simState[0];
            if (!winner) break;
            const elapsed = winner.ticksNeeded;
            simState.forEach(s => s.ticksNeeded -= elapsed);
            prediction.push({ battler: winner.battler, isReady: false });
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
            if (!(scene instanceof Scene_Battle)) return null;
            
            // 1. 检查敌人选择窗口
            if (scene._enemyWindow && scene._enemyWindow.active) {
                return scene._enemyWindow.enemy();
            }
            
            // 2. 检查角色选择窗口 (修复 BUG 的关键)
            // 很多插件或者默认RMMZ不会给 ActorWindow 直接加 actor() 方法
            // 所以我们要通过 index 去 party 获取
            if (scene._actorWindow && scene._actorWindow.active) {
                const index = scene._actorWindow.index();
                if (index >= 0) {
                    return $gameParty.battleMembers()[index];
                }
            }
            
            return null;
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
            const selection = this.getCurrentSelection();

            this._visualItems.forEach(i => { if(!i.isGhost) i.matched = false; });

            const activeItems = [];
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
                activeItems.push(item);
            }

            const ghosts = this._visualItems.filter(i => i.isGhost);
            const finalList = [...activeItems];
            
            ghosts.sort((a, b) => a.x - b.x);
            
            for (const ghost of ghosts) {
                const estimatedIdx = Math.round((ghost.x - 4) / (Conf.stdSize + Conf.spacing));
                let idx = Math.max(0, Math.min(estimatedIdx, finalList.length));
                finalList.splice(idx, 0, ghost);
            }

            let currentX = 4;
            
            for (let i = 0; i < finalList.length; i++) {
                const item = finalList[i];
                const isFirst = (i === 0);
                
                // 1. 尺寸
                const targetSize = isFirst ? Conf.firstSize : Conf.stdSize;
                
                // 2. Y轴下沉计算
                // 逻辑：如果是选中的目标，并且不是最左侧的当前行动者，则下沉
                const isSelected = (selection && item.battler === selection);
                const shouldSink = isSelected && !isFirst; // 【自身行动不下沉逻辑】
                
                const targetY = 4 + (shouldSink ? Conf.sinkY : 0);
                
                // 3. 目标设定
                item.targetX = currentX;
                item.targetY = targetY;
                item.targetSize = targetSize;
                
                if (item.isGhost) {
                    item.targetOpacity = (item.ghostTimer > 30) ? 255 : 0; 
                } else if (item.matched) {
                    item.targetOpacity = 255;
                } else {
                    item.targetOpacity = 0;
                }
                
                currentX += targetSize + Conf.spacing;
            }
            
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
                
                // 判断是否是首位，用于绘制金色边框
                // 这里的判断依据是 size 是否接近 FirstSize
                // 为了准确，我们直接判断 item.x 是否在最左边附近
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

            // 1. 背景
            if (Conf.showBg) {
                ctx.save();
                ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                ctx.fillRect(x, y, size, size);
                ctx.restore();
            }

            // 2. 图标
            if (item.battler.isActor()) {
                this.drawActorIcon(item.battler, x, y, size);
            } else {
                this.drawEnemyIcon(item.battler, x, y, size);
            }

            // 3. 闪烁
            if (isFlashing) {
                ctx.save();
                ctx.globalCompositeOperation = 'source-over';
                const flashAlpha = 0.6 + Math.sin(Date.now() / 30) * 0.4;
                ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
                ctx.fillRect(x, y, size, size);
                ctx.restore();
            }

            // 4. 边框颜色定制
            ctx.save();
            ctx.lineWidth = 1; 
            
            let color = Conf.borderColor; // 默认深红
            
            if (isFirstVisual) {
                color = "#FFCA5F"; // 首位金色
                ctx.lineWidth = 2; // 首位加粗
            } else if (item.isReady) {
                color = "#FFFF00"; // 其他就绪单位黄色高亮 (保留此逻辑以区分 ready 状态)
            }

            ctx.strokeStyle = color;
            const offset = ctx.lineWidth / 2;
            ctx.strokeRect(x + offset, y + offset, size - ctx.lineWidth, size - ctx.lineWidth); 
            ctx.restore();

            ctx.restore();
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
    //  Scene_Battle 扩展
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
        const h = maxIconH + Conf.sinkY + 30; 
        
        const x = Conf.x;
        const y = Conf.y === -1 ? getAutoY() : Conf.y;

        const rect = new Rectangle(x, y, w, h);
        this._timelineWindow = new Window_BattleTimeline(rect);
        BattleManager._timelineWindow = this._timelineWindow;
        this.addWindow(this._timelineWindow);
    };

})();