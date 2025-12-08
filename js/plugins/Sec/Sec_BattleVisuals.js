/*:
 * @target MZ
 * @plugindesc [战斗] 视觉表现力增强包 (v2.8 切入线自定义版)
 * @author Secmon (Visuals)
 * @base Sec_BattleSystemInstance
 * @orderAfter Sec_BattleSystemInstance
 *
 * @help
 * ============================================================================
 * Sec_BattleVisuals.js (v2.8)
 * ============================================================================
 * 本插件接管 Sec_BattleSystemInstance 的视觉表现层。
 *
 * 【自定义功能概览】
 * 1. 射线自定义：弹射和溅射的颜色、粗细、透明度均可独立设置。
 * 2. 协战自定义：
 * - 镜头拉近倍率。
 * - 切入图：位置、缩放、裁剪高度。
 * - 切入线：颜色、粗细、透明度 [v2.8新增]。
 * 3. 识破自定义：红框的透明度、粗细。
 * 4. 斩杀自定义：顿帧时长。
 *
 * ============================================================================
 * @param HitStopDuration
 * @text [通用] 斩杀顿帧强度
 * @desc 触发斩杀/暴击时画面静止的帧数。
 * @type number
 * @default 12
 *
 * @param SynergyZoomLevel
 * @text [协战] 镜头拉近倍率
 * @desc 协战攻击敌人时的画面放大比例。
 * @type number
 * @decimals 2
 * @default 1.30
 *
 * @param CutinScale
 * @text [协战] 切入图缩放
 * @desc 眼部特写切入图片的放大倍率。
 * @type number
 * @decimals 2
 * @default 1.50
 *
 * @param CutinHeight
 * @text [协战] 切入图高度%
 * @desc 裁剪脸图时保留的高度百分比(以中心为基准)。20表示保留中间20%的区域。
 * @type number
 * @min 5
 * @max 100
 * @default 20
 *
 * @param CutinTargetX
 * @text [协战] 切入图目标X
 * @desc 切入动画停止时的X坐标（屏幕左侧为0）。
 * @type number
 * @default 300
 *
 * @param CutinOffsetY
 * @text [协战] 切入图Y偏移
 * @desc 切入图相对于屏幕垂直中心的偏移量。负数向上，正数向下。
 * @type number
 * @min -9999
 * @default -100
 *
 * @param CutinBorderColor
 * @text [协战] 切入线颜色
 * @desc 切入图上下装饰线的颜色 (HEX格式)。
 * @type string
 * @default #FFFFFF
 *
 * @param CutinBorderThickness
 * @text [协战] 切入线粗细
 * @desc 切入图上下装饰线的厚度 (像素)。
 * @type number
 * @min 1
 * @default 2
 *
 * @param CutinBorderAlpha
 * @text [协战] 切入线透明度
 * @desc 切入图上下装饰线的不透明度 (0.0 - 1.0)。
 * @type number
 * @min 0
 * @max 1
 * @decimals 2
 * @default 0.50
 *
 * @param ReactionBorderAlpha
 * @text [识破] 边框不透明度
 * @desc 红框出现时的不透明度 (0-255)。
 * @type number
 * @min 0
 * @max 255
 * @default 180
 *
 * @param ReactionBorderSize
 * @text [识破] 边框宽度
 * @desc 屏幕边缘红框的粗细 (像素)。
 * @type number
 * @min 1
 * @default 20
 *
 * @param ---Ricochet Settings---
 * @text [弹射] 射线设置
 *
 * @param RicochetBeamColor
 * @text 射线颜色
 * @parent ---Ricochet Settings---
 * @desc 弹射/闪电链射线的颜色 (HEX格式)。
 * @type string
 * @default #00FFFF
 *
 * @param RicochetBeamWidth
 * @text 射线粗细
 * @parent ---Ricochet Settings---
 * @desc 射线的线条宽度 (像素)。
 * @type number
 * @default 3
 *
 * @param RicochetBeamAlpha
 * @text 射线不透明度
 * @parent ---Ricochet Settings---
 * @desc 射线的初始不透明度 (0.0 - 1.0)。
 * @type number
 * @min 0
 * @max 1
 * @decimals 2
 * @default 1.00
 *
 * @param ---Splash Settings---
 * @text [溅射] 射线设置
 *
 * @param SplashBeamColor
 * @text 射线颜色
 * @parent ---Splash Settings---
 * @desc 溅射射线的颜色 (HEX格式)。
 * @type string
 * @default #FF8800
 *
 * @param SplashBeamWidth
 * @text 射线粗细
 * @parent ---Splash Settings---
 * @desc 射线的线条宽度 (像素)。
 * @type number
 * @default 4
 *
 * @param SplashBeamAlpha
 * @text 射线不透明度
 * @parent ---Splash Settings---
 * @desc 射线的初始不透明度 (0.0 - 1.0)。
 * @type number
 * @min 0
 * @max 1
 * @decimals 2
 * @default 1.00
 *
 */

(() => {
    'use strict';

    const pluginName = "Sec_BattleVisuals";
    const parameters = PluginManager.parameters(pluginName);
    
    // 参数获取
    const HIT_STOP_DUR = Number(parameters['HitStopDuration'] || 12);
    const ZOOM_LEVEL   = Number(parameters['SynergyZoomLevel'] || 1.3);
    
    // 协战参数
    const CUTIN_SCALE  = Number(parameters['CutinScale'] || 1.5);
    const CUTIN_HEIGHT_PCT = Number(parameters['CutinHeight'] || 20) / 100;
    const CUTIN_TARGET_X = Number(parameters['CutinTargetX'] || 300);
    const CUTIN_OFFSET_Y = Number(parameters['CutinOffsetY'] || -100);
    const CUTIN_BORDER_COLOR = parameters['CutinBorderColor'] || '#FFFFFF';
    const CUTIN_BORDER_THICKNESS = Number(parameters['CutinBorderThickness'] || 2);
    const CUTIN_BORDER_ALPHA = Number(parameters['CutinBorderAlpha'] || 0.5);

    // 识破参数
    const REACTION_ALPHA = Number(parameters['ReactionBorderAlpha'] || 180);
    const REACTION_SIZE  = Number(parameters['ReactionBorderSize'] || 20);

    // 射线参数
    const RICOCHET_COLOR = parameters['RicochetBeamColor'] || '#00FFFF';
    const RICOCHET_WIDTH = Number(parameters['RicochetBeamWidth'] || 3);
    const RICOCHET_ALPHA = Number(parameters['RicochetBeamAlpha'] || 1);

    const SPLASH_COLOR = parameters['SplashBeamColor'] || '#FF8800';
    const SPLASH_WIDTH = Number(parameters['SplashBeamWidth'] || 4);
    const SPLASH_ALPHA = Number(parameters['SplashBeamAlpha'] || 1);

    // ======================================================================
    // 工具库
    // ======================================================================
    const ColorUtil = {
        hexToNum: (hex) => parseInt(hex.replace(/^#/, ''), 16)
    };

    function getBattlerVisualCenter(battler) {
        if (!SceneManager._scene._spriteset) return { x: 0, y: 0 };
        const spriteset = SceneManager._scene._spriteset;
        const sprite = spriteset.findTargetSprite(battler);
        
        if (sprite) {
            const height = sprite.height || 64; 
            return { x: sprite.x, y: sprite.y - height / 2, sprite: sprite };
        }
        
        // 备用坐标
        if (battler.isActor() && $gameSystem.isSideView()) {
            const index = battler.index();
            return { x: 600 + index * 32, y: 280 + index * 48 - 24, sprite: null };
        } else if (battler.isEnemy()) {
            return { x: battler.screenX(), y: battler.screenY() - 24, sprite: null };
        }
        return { x: Graphics.boxWidth / 2, y: Graphics.boxHeight / 2, sprite: null };
    }

    // ======================================================================
    // 视觉管理器 (VisualManager)
    // ======================================================================
    class VisualManager {
        static init() {
            this._hitStopTimer = 0;
            this._ricochetChain = 0;
            this._lastRicochetTime = 0;
            this._zoomTarget = null;
            this._zoomPhase = 0;
            this._filters = [];
            this._invertFilter = new PIXI.filters.ColorMatrixFilter();

            // 射线/连线上下文
            this._splashCenter = null;
            this._ricochetTarget = null;
        }

        static update() {
            if (this._hitStopTimer > 0) {
                this._hitStopTimer--;
                if (this._hitStopTimer <= 0) this.clearHitStopEffects();
            }
            this.updateZoom();
        }

        static isHitStop() {
            return this._hitStopTimer > 0;
        }

        static triggerHitStop(duration, invertColor = false) {
            this._hitStopTimer = duration;
            if (invertColor && SceneManager._scene._spriteset) {
                this._invertFilter.negative(true);
                const stage = SceneManager._scene;
                if (!stage.filters) stage.filters = [];
                if (!stage.filters.includes(this._invertFilter)) {
                    stage.filters = [this._invertFilter];
                }
            }
        }

        static clearHitStopEffects() {
            const stage = SceneManager._scene;
            if (stage.filters) {
                stage.filters = stage.filters.filter(f => f !== this._invertFilter);
            }
        }

        static triggerZoom(target) {
            if (!target) return;
            if (target.isActor()) {
                this.triggerActorCutin(target);
            } else {
                this._zoomTarget = target;
                this._zoomPhase = 1;
            }
        }

        static triggerActorCutin(actor) {
            if (!SceneManager._scene._spriteset) return;
            SceneManager._scene._spriteset.createActorCutin(actor);
        }

        static updateZoom() {
            if (this._zoomPhase === 0) return;
            const screen = $gameScreen;
            const target = this._zoomTarget;
            
            if (!target || (target.isDead() && target.opacity === 0)) {
                this._zoomPhase = 3;
            }

            if (this._zoomPhase === 1) { // In
                const pos = getBattlerVisualCenter(target);
                const curScale = screen.zoomScale();
                const newScale = curScale + (ZOOM_LEVEL - curScale) * 0.2;
                screen.setZoom(pos.x, pos.y, newScale);
                if (Math.abs(newScale - ZOOM_LEVEL) < 0.01) {
                    this._zoomPhase = 2;
                    this._zoomTimer = 20;
                }
            } else if (this._zoomPhase === 2) { // Hold
                this._zoomTimer--;
                if (this._zoomTimer <= 0) this._zoomPhase = 3;
            } else if (this._zoomPhase === 3) { // Out
                const curScale = screen.zoomScale();
                const newScale = curScale + (1.0 - curScale) * 0.2;
                screen.setZoom(screen.zoomX(), screen.zoomY(), newScale);
                if (Math.abs(newScale - 1.0) < 0.01) {
                    screen.clearZoom();
                    this._zoomPhase = 0;
                    this._zoomTarget = null;
                }
            }
        }

        static processRicochetPitch(basePitch) {
            const now = Date.now();
            if (now - this._lastRicochetTime > 800) {
                this._ricochetChain = 0;
                this._ricochetTarget = null; 
            }
            this._ricochetChain++;
            this._lastRicochetTime = now;
            return basePitch + Math.min(100, (this._ricochetChain - 1) * 10);
        }
    }

    // ======================================================================
    // Hook: Scene_Battle
    // ======================================================================
    const _Scene_Battle_initialize = Scene_Battle.prototype.initialize;
    Scene_Battle.prototype.initialize = function() {
        _Scene_Battle_initialize.call(this);
        VisualManager.init();
    };

    const _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        if (VisualManager.isHitStop()) {
            VisualManager.update();
            AudioManager.checkErrors();
            return; 
        }
        VisualManager.update();
        _Scene_Battle_update.call(this);
    };

    // ======================================================================
    // Hook: Game_Action
    // ======================================================================
    const _Game_Action_executeDamage = Game_Action.prototype.executeDamage;
    Game_Action.prototype.executeDamage = function(target, value) {
        VisualManager._splashCenter = target;
        
        if (Date.now() - VisualManager._lastRicochetTime > 800) {
            VisualManager._ricochetTarget = target;
        }

        _Game_Action_executeDamage.call(this, target, value);
        
        VisualManager._splashCenter = null;
    };

    // ======================================================================
    // Hook: Game_Battler
    // ======================================================================
    const _Game_Battler_startCustomPopupConfig = Game_Battler.prototype.startCustomPopupConfig;
    Game_Battler.prototype.startCustomPopupConfig = function(config) {
        if (!config) return;

        const type = this.detectVisualType(config);
        
        // 1. 音效增强
        if (config.se) {
            let pitch = config.se.pitch || 100;
            if (type === 'ricochet') pitch = VisualManager.processRicochetPitch(pitch);
            AudioManager.playSe({ 
                name: config.se.name || config.se, 
                volume: config.se.volume || 90, 
                pitch: pitch, pan: 0 
            });
        }

        // 2. 视觉特效分发
        switch (type) {
            case 'synergy':   
                VisualManager.triggerZoom(this);
                break;
            case 'reaction':  
                this.createVisualEffect('reactionBorder');
                break;
            case 'exec':      
                VisualManager.triggerHitStop(HIT_STOP_DUR, true); 
                $gameScreen.startShake(5, 5, 10);
                break;
            case 'splash':    
                // 溅射射线
                if (VisualManager._splashCenter && VisualManager._splashCenter !== this) {
                    this.createVisualEffect('splashRay', { source: VisualManager._splashCenter });
                }
                break;
            case 'drain':     
                /* 屏蔽 */
                break;
            case 'ghost':     
                this.createVisualEffect('ghost');
                break;
            case 'push':      
                this.createVisualEffect('squash');
                break;
            case 'pull':      
                this.createVisualEffect('ghostTrail');
                break;
            case 'state':     
                this.createVisualEffect('iconShatter', { color: config.color });
                break;
            case 'charge':    
                $gameScreen.startFlash([255, 255, 255, 180], 8);
                break;
            case 'ricochet':
                // 弹射连线
                if (VisualManager._ricochetTarget && VisualManager._ricochetTarget !== this) {
                    this.createVisualEffect('ricochetRay', { source: VisualManager._ricochetTarget });
                }
                VisualManager._ricochetTarget = this;
                break;
        }

        const tempSe = config.se;
        config.se = null; 
        _Game_Battler_startCustomPopupConfig.call(this, config);
        config.se = tempSe;
    };

    Game_Battler.prototype.detectVisualType = function(c) {
        if (c.text === "识破" || c.color === '#FF4444' || c.color === '#FF0000') return 'reaction';
        if (c.text === "协战" || c.style === 'impact') return 'synergy';
        
        if (c.text === "斩杀" || c.style === 'slash') return 'exec';
        if (c.text === "弹射" || c.style === 'jump') return 'ricochet';
        if (c.text === "吸血" || c.style === 'float') return 'drain';
        if (c.text === "溅射" || c.style === 'shake') return 'splash';
        if (c.text === "亡语" || c.color === '#BB00FF') return 'ghost';
        if (c.style === 'contract') return 'gather';
        if (c.text === "迟滞") return 'push';
        if (c.text === "神速") return 'pull';
        if (c.text === "触发") return 'state';
        if (c.style === 'rise') return 'cycle';
        return 'unknown';
    };

    Game_Battler.prototype.createVisualEffect = function(type, args) {
        if (!SceneManager._scene._spriteset) return;
        SceneManager._scene._spriteset.addSecEffect(this, type, args);
    };

    // ======================================================================
    // Spriteset_Battle 扩展：特效渲染工厂
    // ======================================================================
    
    Spriteset_Battle.prototype.addSecEffect = function(target, type, args) {
        if (!this._effectsContainer) return;
        
        switch (type) {
            case 'reactionBorder': this.createReactionBorder(); break;
            case 'ghost':       this.createGhost(target); break;
            case 'squash':      this.createSquash(target); break;
            case 'ghostTrail':  this.createGhostTrail(target); break;
            case 'iconShatter': this.createIconShatter(target, args); break;
            
            // 射线类
            case 'splashRay': 
                if (args && args.source) this.createBeam(args.source, target, 'splash');
                break;
            case 'ricochetRay':
                if (args && args.source) this.createBeam(args.source, target, 'ricochet');
                break;
        }
    };

    // [NEW] 通用射线生成器 (支持参数自定义)
    Spriteset_Battle.prototype.createBeam = function(source, target, style) {
        const p1 = getBattlerVisualCenter(source);
        const p2 = getBattlerVisualCenter(target);
        
        const beam = new Sprite();
        const g = new PIXI.Graphics();
        beam.addChild(g);
        
        let colorStr = '#FFFFFF';
        let width = 3;
        let alpha = 1;
        let duration = 20;

        // 根据样式读取参数
        if (style === 'splash') {
            colorStr = SPLASH_COLOR;
            width = SPLASH_WIDTH;
            alpha = SPLASH_ALPHA;
            duration = 15;
        } else if (style === 'ricochet') {
            colorStr = RICOCHET_COLOR;
            width = RICOCHET_WIDTH;
            alpha = RICOCHET_ALPHA;
            duration = 25;
        }

        const color = ColorUtil.hexToNum(colorStr);

        // 设置初始透明度
        beam.alpha = alpha;

        // 计算偏移
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const offX = (Math.random() - 0.5) * 40;
        const offY = (Math.random() - 0.5) * 40;

        // 主线条
        g.lineStyle(width, color, 1);
        g.moveTo(p1.x, p1.y);
        
        if (style === 'ricochet') {
            g.lineTo(midX + offX, midY + offY); // 弹射带折线
        }
        g.lineTo(p2.x, p2.y);
        
        // 发光层 (更宽，低透明度)
        g.lineStyle(width * 2, color, 0.3);
        g.moveTo(p1.x, p1.y);
        if (style === 'ricochet') g.lineTo(midX + offX, midY + offY);
        g.lineTo(p2.x, p2.y);

        beam.blendMode = PIXI.BLEND_MODES.ADD;
        
        beam.update = function() {
            this.alpha -= (alpha / duration); // 按初始透明度递减
            if (this.alpha <= 0) {
                this.parent.removeChild(this);
                this.destroy();
            }
        };
        
        this._effectsContainer.addChild(beam);
    };

    // 0. 识破红框
    Spriteset_Battle.prototype.createReactionBorder = function() {
        const width = Graphics.width;
        const height = Graphics.height;
        const size = REACTION_SIZE;
        const color = 0xFF0000; 

        const border = new Sprite();
        const g = new PIXI.Graphics();
        g.beginFill(color);
        g.drawRect(0, 0, width, size); 
        g.drawRect(0, height - size, width, size); 
        g.drawRect(0, size, size, height - size * 2); 
        g.drawRect(width - size, size, size, height - size * 2); 
        g.endFill();
        
        border.addChild(g);
        border.opacity = REACTION_ALPHA;
        border.blendMode = PIXI.BLEND_MODES.ADD;
        
        border.update = function() {
            this.opacity -= 10; 
            if (this.opacity <= 0) {
                this.parent.removeChild(this);
                this.destroy();
            }
        };
        this.addChild(border);
    };

    // 1. 亡语幽灵
    Spriteset_Battle.prototype.createGhost = function(target) {
        const mainSprite = this.findTargetSprite(target);
        if (!mainSprite || !mainSprite.bitmap) return;

        const ghost = new Sprite();
        ghost.bitmap = mainSprite.bitmap;
        ghost.anchor.set(0.5, 1.0);
        ghost.x = mainSprite.x;
        ghost.y = mainSprite.y;
        ghost.scale.x = mainSprite.scale.x;
        ghost.scale.y = mainSprite.scale.y;
        
        if (mainSprite._mainSprite) { // SV Actor
             ghost.bitmap = mainSprite._mainSprite.bitmap;
             ghost.setFrame(mainSprite._mainSprite._frame.x, mainSprite._mainSprite._frame.y, mainSprite._mainSprite._frame.width, mainSprite._mainSprite._frame.height);
        } else {
             ghost.setFrame(mainSprite._frame.x, mainSprite._frame.y, mainSprite._frame.width, mainSprite._frame.height);
        }
        
        ghost.blendMode = PIXI.BLEND_MODES.ADD;
        ghost.alpha = 0.8;
        ghost.setColorTone([50, 0, 200, 150]); 

        ghost.update = function() {
            this.y -= 1.5;
            this.alpha -= 0.015;
            this.scale.x *= 1.005;
            this.scale.y *= 1.005;
            if (this.alpha <= 0) {
                this.parent.removeChild(this);
                this.destroy();
            }
        };
        this._effectsContainer.addChild(ghost);
    };

    // 2. 推条重压 (Squash)
    Spriteset_Battle.prototype.createSquash = function(target) {
        const sprite = this.findTargetSprite(target);
        if (!sprite) return;
        
        if (!sprite._secSquashTimer) {
            sprite._origScaleY = sprite.scale.y;
            sprite._secSquashTimer = 0;
            
            const origUpdate = sprite.update;
            sprite.update = function() {
                origUpdate.call(this);
                if (this._secSquashTimer !== undefined) {
                    this._secSquashTimer++;
                    const t = this._secSquashTimer;
                    if (t < 10) {
                        this.scale.y = this._origScaleY * (1.0 - (t/10) * 0.3);
                        this.scale.x = this._origScaleY * (1.0 + (t/10) * 0.1);
                    } else if (t < 20) {
                        const t2 = t - 10;
                        this.scale.y = this._origScaleY * (0.7 + (t2/10) * 0.3);
                        this.scale.x = this._origScaleY * (1.1 - (t2/10) * 0.1);
                    } else {
                        this.scale.y = this._origScaleY;
                        this.scale.x = this._origScaleY;
                        this._secSquashTimer = undefined;
                    }
                }
            };
        }
        sprite._secSquashTimer = 0;
    };

    // 3. 拉条残影 (Ghost Trail)
    Spriteset_Battle.prototype.createGhostTrail = function(target) {
        const sprite = this.findTargetSprite(target);
        if (!sprite || !sprite.bitmap) return;

        for (let i = 1; i <= 3; i++) {
            const trail = new Sprite();
            trail.bitmap = sprite.bitmap;
            trail.anchor.x = sprite.anchor.x;
            trail.anchor.y = sprite.anchor.y;
            trail.x = sprite.x - (i * 20); 
            trail.y = sprite.y;
            trail.scale = sprite.scale;
            trail.opacity = 150 - (i * 40);
            trail.blendMode = PIXI.BLEND_MODES.ADD;
            
            if (sprite._mainSprite) { 
                trail.bitmap = sprite._mainSprite.bitmap;
                const f = sprite._mainSprite._frame;
                trail.setFrame(f.x, f.y, f.width, f.height);
            } else {
                const f = sprite._frame;
                trail.setFrame(f.x, f.y, f.width, f.height);
            }

            trail.update = function() {
                this.x += 2;
                this.opacity -= 10;
                if (this.opacity <= 0) {
                    this.parent.removeChild(this);
                    this.destroy();
                }
            };
            this._effectsContainer.addChild(trail);
        }
    };

    // 4. 状态碎裂 (Icon Shatter)
    Spriteset_Battle.prototype.createIconShatter = function(target, args) {
        const pos = getBattlerVisualCenter(target);
        const color = args && args.color ? ColorUtil.hexToNum(args.color) : 0xFFFFFF;
        
        for (let i = 0; i < 6; i++) {
            const shard = new Sprite();
            const g = new PIXI.Graphics();
            g.beginFill(color);
            g.moveTo(0,0); g.lineTo(8,4); g.lineTo(4,8);
            g.endFill();
            shard.addChild(g);
            
            shard.x = pos.x;
            shard.y = pos.y - 40;
            shard.rotation = Math.random() * 6;
            
            const angle = (Math.PI * 2 / 6) * i;
            shard._vx = Math.cos(angle) * 4;
            shard._vy = Math.sin(angle) * 4;
            
            shard.update = function() {
                this.x += this._vx;
                this.y += this._vy;
                this.rotation += 0.2;
                this.alpha -= 0.05;
                if (this.alpha <= 0) {
                    this.parent.removeChild(this);
                    this.destroy();
                }
            };
            this._effectsContainer.addChild(shard);
        }
    };

    // 5. 【重点】角色眼部特写切入 (Eye Cut-in)
    Spriteset_Battle.prototype.createActorCutin = function(actor) {
        const sprite = new Sprite();
        sprite.bitmap = ImageManager.loadFace(actor.faceName());
        
        const pw = 144;
        const ph = 144;
        const sx = (actor.faceIndex() % 4) * pw;
        const sy = Math.floor(actor.faceIndex() / 4) * ph;
        
        // 计算裁剪区域
        const cropH = ph * CUTIN_HEIGHT_PCT;
        const cropY = sy + (ph - cropH) / 2; // 居中裁剪
        
        sprite.setFrame(sx, cropY, pw, cropH);

        // 初始化
        sprite.anchor.set(0.5);
        sprite.x = 0 - pw; // 左侧屏幕外
        sprite.y = Graphics.boxHeight / 2 + CUTIN_OFFSET_Y; // [Custom Y]
        sprite.scale.set(CUTIN_SCALE); 
        sprite.opacity = 255;
        
        // 装饰线
        const border = new Sprite();
        const g = new PIXI.Graphics();
        const borderColor = ColorUtil.hexToNum(CUTIN_BORDER_COLOR);
        g.beginFill(borderColor, CUTIN_BORDER_ALPHA); // [Custom Alpha]
        g.drawRect(0, 0, pw, CUTIN_BORDER_THICKNESS); // [Custom Thickness]
        g.drawRect(0, cropH, pw, CUTIN_BORDER_THICKNESS); 
        g.endFill();
        border.addChild(g);
        border.anchor.set(0.5); 
        border.x = -pw/2; 
        border.y = -cropH/2;
        sprite.addChild(border);

        // 动画
        sprite._phase = 0; 
        sprite._timer = 0;
        
        sprite.update = function() {
            if (this._phase === 0) { // Slide In
                // [Custom Target X]
                this.x += (CUTIN_TARGET_X - this.x) * 0.25; 
                this.opacity = Math.min(255, this.x * 2);
                if (Math.abs(this.x - CUTIN_TARGET_X) < 5) {
                    this._phase = 1;
                    this._timer = 40; 
                }
            } else if (this._phase === 1) { // Hold & Drift
                this._timer--;
                this.x += 1.0; 
                if (this._timer <= 0) this._phase = 2;
            } else if (this._phase === 2) { // Fly Out
                this.x += 30; // 快速飞出屏幕右侧
                this.opacity -= 10;
                if (this.opacity <= 0) {
                    this.parent.removeChild(this);
                    this.destroy();
                }
            }
        };

        // 放在最上层
        this.addChild(sprite); 
    };

})();