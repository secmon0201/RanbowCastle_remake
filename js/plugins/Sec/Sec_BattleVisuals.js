/*:
 * @target MZ
 * @plugindesc [战斗] 视觉表现力增强包 (v3.7 分类修复/终极版)
 * @author Secmon (Visuals)
 * @base Sec_BattleSystemInstance
 * @orderAfter Sec_BattleSystemInstance
 *
 * @help
 * ============================================================================
 * Sec_BattleVisuals.js (v3.7)
 * ============================================================================
 * 本插件接管 Sec_BattleSystemInstance 的视觉表现层。
 *
 * 【功能概览】
 * 1. 射线自定义：弹射(青) / 溅射(橙) 的线条。
 * 2. 协战自定义：镜头拉近、眼部切入图。
 * 3. 识破自定义：红/蓝双色边框。
 * 4. 吸血自定义：三阶段粒子动画。
 * 5. 推拉条：角色压扁 / 残影拖尾。
 * 6. 斩杀：顿帧 + 震动。
 *
 * ============================================================================
 * @param ---Synergy Settings---
 * @text [协战] 表现设置
 * @default
 *
 * @param SynergyZoomLevel
 * @parent ---Synergy Settings---
 * @text 镜头拉近倍率
 * @desc 协战攻击敌人时的画面放大比例。
 * @type number
 * @decimals 2
 * @default 1.30
 *
 * @param CutinScale
 * @parent ---Synergy Settings---
 * @text 切入图缩放
 * @desc 眼部特写切入图片的放大倍率。
 * @type number
 * @decimals 2
 * @default 1.50
 *
 * @param CutinHeight
 * @parent ---Synergy Settings---
 * @text 切入图高度%
 * @desc 裁剪脸图时保留的高度百分比(以中心为基准)。20表示保留中间20%的区域。
 * @type number
 * @min 5
 * @max 100
 * @default 20
 *
 * @param CutinBorderColor
 * @parent ---Synergy Settings---
 * @text 切入线颜色
 * @desc 切入图上下装饰线的颜色 (HEX格式)。
 * @type string
 * @default #FFFFFF
 *
 * @param CutinBorderThickness
 * @parent ---Synergy Settings---
 * @text 切入线粗细
 * @desc 切入图上下装饰线的厚度 (像素)。
 * @type number
 * @min 1
 * @default 2
 *
 * @param CutinBorderAlpha
 * @parent ---Synergy Settings---
 * @text 切入线透明度
 * @desc 切入图上下装饰线的不透明度 (0.0 - 1.0)。
 * @type number
 * @min 0
 * @max 1
 * @decimals 2
 * @default 0.50
 *
 * @param CutinTargetX
 * @parent ---Synergy Settings---
 * @text 切入图目标X
 * @desc 切入动画停止时的X坐标（屏幕左侧为0）。
 * @type number
 * @default 300
 *
 * @param CutinOffsetY
 * @parent ---Synergy Settings---
 * @text 切入图Y偏移
 * @desc 切入图相对于屏幕垂直中心的偏移量。负数向上，正数向下。
 * @type number
 * @min -9999
 * @default -100
 *
 * @param ---Reaction Settings---
 * @text [识破] 表现设置
 * @default
 *
 * @param ActorReactionColor
 * @parent ---Reaction Settings---
 * @text 我方识破颜色
 * @desc 我方角色触发识破时的边框颜色 (HEX格式)。
 * @type string
 * @default #0088FF
 *
 * @param EnemyReactionColor
 * @parent ---Reaction Settings---
 * @text 敌方识破颜色
 * @desc 敌人触发识破时的边框颜色 (HEX格式)。
 * @type string
 * @default #FF0000
 *
 * @param ReactionBorderAlpha
 * @parent ---Reaction Settings---
 * @text 边框不透明度
 * @desc 红框出现时的不透明度 (0-255)。
 * @type number
 * @min 0
 * @max 255
 * @default 180
 *
 * @param ReactionBorderSize
 * @parent ---Reaction Settings---
 * @text 边框宽度
 * @desc 屏幕边缘红框的粗细 (像素)。
 * @type number
 * @min 1
 * @default 20
 *
 * @param ---Execute Settings---
 * @text [斩杀] 表现设置
 * @default
 *
 * @param HitStopDuration
 * @parent ---Execute Settings---
 * @text 顿帧强度
 * @desc 触发斩杀/暴击时画面静止的帧数。
 * @type number
 * @default 12
 *
 * @param ---PushPull Settings---
 * @text [推拉] 表现设置
 * @default
 *
 * @param PushSquashLevel
 * @parent ---PushPull Settings---
 * @text 推条-压扁程度
 * @desc 角色被推条时垂直方向的压扁比例 (0.1 - 0.9)。
 * @type number
 * @decimals 2
 * @default 0.30
 *
 * @param PushDuration
 * @parent ---PushPull Settings---
 * @text 推条-动画时长
 * @desc 压扁动画的持续帧数。
 * @type number
 * @default 20
 *
 * @param PullGhostColor
 * @parent ---PushPull Settings---
 * @text 拉条-残影颜色
 * @desc 残影的色调 (HEX格式)。
 * @type string
 * @default #00FFFF
 *
 * @param PullGhostCount
 * @parent ---PushPull Settings---
 * @text 拉条-残影数量
 * @desc 生成的残影总数。
 * @type number
 * @default 3
 *
 * @param PullGhostOpacity
 * @parent ---PushPull Settings---
 * @text 拉条-初始透明度
 * @desc 第一个残影的不透明度 (0-255)。
 * @type number
 * @default 150
 *
 * @param PullGhostDrop
 * @parent ---PushPull Settings---
 * @text 拉条-透明度递减
 * @desc 后续每个残影比前一个减少的透明度。
 * @type number
 * @default 40
 *
 * @param ---Ricochet Settings---
 * @text [弹射] 射线设置
 * @default
 *
 * @param RicochetBeamColor
 * @parent ---Ricochet Settings---
 * @text 射线颜色
 * @desc 弹射/闪电链射线的颜色 (HEX格式)。
 * @type string
 * @default #00FFFF
 *
 * @param RicochetBeamWidth
 * @parent ---Ricochet Settings---
 * @text 射线粗细
 * @desc 射线的线条宽度 (像素)。
 * @type number
 * @default 3
 *
 * @param RicochetBeamAlpha
 * @parent ---Ricochet Settings---
 * @text 射线不透明度
 * @desc 射线的初始不透明度 (0.0 - 1.0)。
 * @type number
 * @min 0
 * @max 1
 * @decimals 2
 * @default 1.00
 *
 * @param ---Splash Settings---
 * @text [溅射] 射线设置
 * @default
 *
 * @param SplashBeamColor
 * @parent ---Splash Settings---
 * @text 射线颜色
 * @desc 溅射射线的颜色 (HEX格式)。
 * @type string
 * @default #FF8800
 *
 * @param SplashBeamWidth
 * @parent ---Splash Settings---
 * @text 射线粗细
 * @desc 射线的线条宽度 (像素)。
 * @type number
 * @default 4
 *
 * @param SplashBeamAlpha
 * @parent ---Splash Settings---
 * @text 射线不透明度
 * @desc 射线的初始不透明度 (0.0 - 1.0)。
 * @type number
 * @min 0
 * @max 1
 * @decimals 2
 * @default 1.00
 *
 * @param ---Drain Settings---
 * @text [吸血] 光球设置
 * @default
 *
 * @param DrainOrbSize
 * @parent ---Drain Settings---
 * @text 光球大小
 * @desc 吸血光球的半径 (像素)。
 * @type number
 * @default 8
 *
 * @param DrainOrbColor
 * @parent ---Drain Settings---
 * @text 光球颜色
 * @desc 吸血光球的颜色 (HEX格式)。
 * @type string
 * @default #FF4444
 *
 * @param DrainOrbAlpha
 * @parent ---Drain Settings---
 * @text 光球透明度
 * @desc 吸血光球的不透明度 (0.0 - 1.0)。
 * @type number
 * @decimals 2
 * @min 0
 * @max 1
 * @default 1.00
 *
 * @param DrainOrbCount
 * @parent ---Drain Settings---
 * @text 光球数量
 * @desc 产生的吸血光球数量。
 * @type number
 * @default 5
 *
 * @param DrainExplodeDur
 * @parent ---Drain Settings---
 * @text [阶段1] 爆发时长
 * @desc 光球炸开的过程持续帧数。
 * @type number
 * @default 20
 *
 * @param DrainHoverDur
 * @parent ---Drain Settings---
 * @text [阶段2] 悬停时长
 * @desc 光球在空中停留的帧数。
 * @type number
 * @default 15
 *
 * @param DrainAbsorbDur
 * @parent ---Drain Settings---
 * @text [阶段3] 吸收时长
 * @desc 光球飞向攻击者的飞行帧数。
 * @type number
 * @default 30
 *
 */

(() => {
    'use strict';

    const pluginName = "Sec_BattleVisuals";
    const parameters = PluginManager.parameters(pluginName);
    
    // ======================================================================
    // 0. 读取基础插件配置 (用于精准识别类型)
    // ======================================================================
    // 我们需要读取 Sec_BattleSystemInstance 的参数来获取用户设定的 Trigger Text
    const baseParams = PluginManager.parameters("Sec_BattleSystemInstance") || {};
    
    const TEXT_PUSH = String(baseParams['PushText'] || "迟滞");
    const TEXT_PULL = String(baseParams['PullText'] || "神速");
    const TEXT_RICOCHET = String(baseParams['RicochetText'] || "弹射");
    const TEXT_SPLASH = String(baseParams['SplashText'] || "溅射");
    const TEXT_SYNERGY = String(baseParams['SynergyText'] || "协战");
    const TEXT_REACTION = String(baseParams['ReactionText'] || "识破");
    const TEXT_EXEC = String(baseParams['ExecText'] || "斩杀");
    const TEXT_DRAIN = String(baseParams['DrainText'] || "吸血");
    const TEXT_GHOST = String(baseParams['DeathRattleText'] || "亡语");
    const TEXT_STATE = String(baseParams['StateText'] || "触发");

    // ======================================================================
    // 参数解析
    // ======================================================================
    
    // [斩杀]
    const HIT_STOP_DUR = Number(parameters['HitStopDuration'] || 12);
    
    // [协战]
    const ZOOM_LEVEL   = Number(parameters['SynergyZoomLevel'] || 1.3);
    const CUTIN_SCALE  = Number(parameters['CutinScale'] || 1.5);
    const CUTIN_HEIGHT_PCT = Number(parameters['CutinHeight'] || 20) / 100;
    const CUTIN_TARGET_X = Number(parameters['CutinTargetX'] || 300);
    const CUTIN_OFFSET_Y = Number(parameters['CutinOffsetY'] || -100);
    const CUTIN_BORDER_COLOR = parameters['CutinBorderColor'] || '#FFFFFF';
    const CUTIN_BORDER_THICKNESS = Number(parameters['CutinBorderThickness'] || 2);
    const CUTIN_BORDER_ALPHA = Number(parameters['CutinBorderAlpha'] || 0.5);

    // [识破]
    const REACTION_ALPHA = Number(parameters['ReactionBorderAlpha'] || 180);
    const REACTION_SIZE  = Number(parameters['ReactionBorderSize'] || 20);
    const ACTOR_REACTION_COLOR = parameters['ActorReactionColor'] || '#0088FF';
    const ENEMY_REACTION_COLOR = parameters['EnemyReactionColor'] || '#FF0000';

    // [推拉]
    const PUSH_SQUASH_LEVEL = Number(parameters['PushSquashLevel'] || 0.3);
    const PUSH_DURATION = Number(parameters['PushDuration'] || 20);
    const PULL_GHOST_COLOR = parameters['PullGhostColor'] || '#00FFFF';
    const PULL_GHOST_COUNT = Number(parameters['PullGhostCount'] || 3);
    const PULL_GHOST_OPACITY = Number(parameters['PullGhostOpacity'] || 150);
    const PULL_GHOST_DROP = Number(parameters['PullGhostDrop'] || 40);

    // [射线]
    const RICOCHET_COLOR = parameters['RicochetBeamColor'] || '#00FFFF';
    const RICOCHET_WIDTH = Number(parameters['RicochetBeamWidth'] || 3);
    const RICOCHET_ALPHA = Number(parameters['RicochetBeamAlpha'] || 1);

    const SPLASH_COLOR = parameters['SplashBeamColor'] || '#FF8800';
    const SPLASH_WIDTH = Number(parameters['SplashBeamWidth'] || 4);
    const SPLASH_ALPHA = Number(parameters['SplashBeamAlpha'] || 1);

    // [吸血]
    const DRAIN_SIZE = Number(parameters['DrainOrbSize'] || 8);
    const DRAIN_COLOR = parameters['DrainOrbColor'] || '#FF4444';
    const DRAIN_ALPHA = Number(parameters['DrainOrbAlpha'] || 1);
    const DRAIN_COUNT = Number(parameters['DrainOrbCount'] || 5);
    const DRAIN_EXPLODE_DUR = Number(parameters['DrainExplodeDur'] || 20);
    const DRAIN_HOVER_DUR = Number(parameters['DrainHoverDur'] || 15);
    const DRAIN_ABSORB_DUR = Number(parameters['DrainAbsorbDur'] || 30);

    // ======================================================================
    // 工具库
    // ======================================================================
    const ColorUtil = {
        hexToNum: (hex) => parseInt(hex.replace(/^#/, ''), 16),
        hexToTone: (hex) => {
            const n = parseInt(hex.replace(/^#/, ''), 16);
            const r = (n >> 16) & 255;
            const g = (n >> 8) & 255;
            const b = n & 255;
            return [r, g, b, 0];
        }
    };

    function getBattlerVisualCenter(battler) {
        if (!SceneManager._scene._spriteset) return { x: 0, y: 0 };
        const spriteset = SceneManager._scene._spriteset;
        const sprite = spriteset.findTargetSprite(battler);
        
        if (sprite) {
            const height = sprite.height || 64; 
            return { x: sprite.x, y: sprite.y - height / 2, sprite: sprite };
        }
        
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
            this._drainVictim = null; 
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
        VisualManager._drainVictim = target; 
        
        if (Date.now() - VisualManager._lastRicochetTime > 800) {
            VisualManager._ricochetTarget = target;
        }

        _Game_Action_executeDamage.call(this, target, value);
        
        VisualManager._splashCenter = null;
        VisualManager._drainVictim = null;
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
                if (this.isActor()) {
                    this.createVisualEffect('reactionBorder', { color: ACTOR_REACTION_COLOR });
                } else {
                    this.createVisualEffect('reactionBorder', { color: ENEMY_REACTION_COLOR });
                }
                break;
            case 'exec':      
                VisualManager.triggerHitStop(HIT_STOP_DUR, true); 
                $gameScreen.startShake(5, 5, 10);
                break;
            case 'splash':    
                if (VisualManager._splashCenter && VisualManager._splashCenter !== this) {
                    this.createVisualEffect('splashRay', { source: VisualManager._splashCenter });
                }
                break;
            case 'drain':
                if (VisualManager._drainVictim) {
                    this.createVisualEffect('drainOrb', { source: VisualManager._drainVictim });
                }
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
        if (c.text === TEXT_REACTION) return 'reaction';
        if (c.text === TEXT_SYNERGY) return 'synergy';
        if (c.text === TEXT_EXEC) return 'exec';
        if (c.text === TEXT_DRAIN) return 'drain';
        if (c.text === TEXT_GHOST) return 'ghost';
        if (c.text === TEXT_STATE) return 'state';
        
        if (c.text === TEXT_PUSH) return 'push';
        if (c.text === TEXT_PULL) return 'pull';
        if (c.text === TEXT_SPLASH) return 'splash';
        if (c.text === TEXT_RICOCHET) return 'ricochet';

        // 兜底检测 (颜色/样式)
        if (c.color === '#FF4444' || c.color === '#FF0000') return 'reaction';
        if (c.style === 'impact') return 'synergy';
        if (c.style === 'slash') return 'exec';
        
        if (c.style === 'jump') return 'ricochet'; 
        if (c.style === 'shake') return 'splash';  
        if (c.style === 'float') return 'drain';
        if (c.style === 'contract') return 'gather';
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
            case 'reactionBorder': this.createReactionBorder(args); break;
            case 'ghost':       this.createGhost(target); break;
            case 'squash':      this.createSquash(target); break;
            case 'ghostTrail':  this.createGhostTrail(target); break;
            case 'iconShatter': this.createIconShatter(target, args); break;
            
            case 'splashRay': 
                if (args && args.source) this.createBeam(args.source, target, 'splash');
                break;
            case 'ricochetRay':
                if (args && args.source) this.createBeam(args.source, target, 'ricochet');
                break;
            case 'drainOrb':
                if (args && args.source) this.createDrainOrbs(args.source, target);
                break;
        }
    };

    // [射线生成器]
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
        beam.alpha = alpha;

        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const offX = (Math.random() - 0.5) * 40;
        const offY = (Math.random() - 0.5) * 40;

        g.lineStyle(width, color, 1);
        g.moveTo(p1.x, p1.y);
        
        if (style === 'ricochet') {
            g.lineTo(midX + offX, midY + offY); 
        }
        g.lineTo(p2.x, p2.y);
        
        g.lineStyle(width * 2, color, 0.3);
        g.moveTo(p1.x, p1.y);
        if (style === 'ricochet') g.lineTo(midX + offX, midY + offY);
        g.lineTo(p2.x, p2.y);

        beam.blendMode = PIXI.BLEND_MODES.ADD;
        
        beam.update = function() {
            this.alpha -= (alpha / duration);
            if (this.alpha <= 0) {
                this.parent.removeChild(this);
                this.destroy();
            }
        };
        
        this._effectsContainer.addChild(beam);
    };

    // 0. 识破红框 (接受参数)
    Spriteset_Battle.prototype.createReactionBorder = function(args) {
        const width = Graphics.width;
        const height = Graphics.height;
        const size = REACTION_SIZE;
        const colorStr = (args && args.color) ? args.color : '#FF0000';
        const color = ColorUtil.hexToNum(colorStr);

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

    // 2. 推条重压 (修复版)
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
                    const dur = PUSH_DURATION;
                    const half = dur / 2;
                    const level = PUSH_SQUASH_LEVEL;

                    if (t <= half) {
                        const rate = t / half;
                        this.scale.y = this._origScaleY * (1.0 - rate * level); 
                        this.scale.x = this._origScaleY * (1.0 + rate * (level * 0.3)); 
                    } else if (t <= dur) {
                        const rate = (t - half) / half;
                        this.scale.y = this._origScaleY * ((1.0 - level) + rate * level);
                        this.scale.x = this._origScaleY * ((1.0 + level * 0.3) - rate * (level * 0.3));
                    } else {
                        this.scale.x = this._origScaleY; 
                        this.scale.y = this._origScaleY;
                        this._secSquashTimer = undefined;
                    }
                }
            };
        }
        sprite._secSquashTimer = 0;
    };

    // 3. 拉条残影 (修复版)
    Spriteset_Battle.prototype.createGhostTrail = function(target) {
        const sprite = this.findTargetSprite(target);
        if (!sprite || !sprite.bitmap) return;

        let bitmap = sprite.bitmap;
        let frame = sprite._frame;
        let anchor = sprite.anchor;
        let scale = { x: sprite.scale.x, y: sprite.scale.y };
        
        if (sprite._mainSprite && sprite._mainSprite.bitmap) {
            bitmap = sprite._mainSprite.bitmap;
            frame = sprite._mainSprite._frame;
            anchor = sprite._mainSprite.anchor;
        }

        const count = PULL_GHOST_COUNT;
        const color = ColorUtil.hexToTone(PULL_GHOST_COLOR);
        const startOp = PULL_GHOST_OPACITY;

        for (let i = 1; i <= count; i++) {
            const trail = new Sprite();
            trail.bitmap = bitmap;
            trail.setFrame(frame.x, frame.y, frame.width, frame.height);
            trail.anchor.x = anchor.x;
            trail.anchor.y = anchor.y;
            trail.x = sprite.x;
            trail.y = sprite.y;
            trail.scale.x = scale.x;
            trail.scale.y = scale.y;
            trail.blendMode = PIXI.BLEND_MODES.ADD;
            trail.opacity = Math.max(0, startOp - (i * PULL_GHOST_DROP));
            trail.setColorTone(color);

            const driftDir = scale.x > 0 ? -1 : 1; 
            
            trail._delay = i * 4;
            trail.update = function() {
                if (this._delay > 0) {
                    this._delay--;
                    this.visible = false;
                    return;
                }
                this.visible = true;
                this.x += driftDir * 2; 
                this.opacity -= 10;
                if (this.opacity <= 0) {
                    this.parent.removeChild(this);
                    this.destroy();
                }
            };
            this._effectsContainer.addChild(trail);
        }
    };

    // 4. 状态碎裂
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

    // 5. 角色切入
    Spriteset_Battle.prototype.createActorCutin = function(actor) {
        const sprite = new Sprite();
        sprite.bitmap = ImageManager.loadFace(actor.faceName());
        
        const pw = 144;
        const ph = 144;
        const sx = (actor.faceIndex() % 4) * pw;
        const sy = Math.floor(actor.faceIndex() / 4) * ph;
        
        const cropH = ph * CUTIN_HEIGHT_PCT;
        const cropY = sy + (ph - cropH) / 2; 
        
        sprite.setFrame(sx, cropY, pw, cropH);

        sprite.anchor.set(0.5);
        sprite.x = 0 - pw; 
        sprite.y = Graphics.boxHeight / 2 + CUTIN_OFFSET_Y; 
        sprite.scale.set(CUTIN_SCALE); 
        sprite.opacity = 255;
        
        const border = new Sprite();
        const g = new PIXI.Graphics();
        const borderColor = ColorUtil.hexToNum(CUTIN_BORDER_COLOR);
        g.beginFill(borderColor, CUTIN_BORDER_ALPHA); 
        g.drawRect(0, 0, pw, CUTIN_BORDER_THICKNESS); 
        g.drawRect(0, cropH, pw, CUTIN_BORDER_THICKNESS); 
        g.endFill();
        border.addChild(g);
        border.anchor.set(0.5); 
        border.x = -pw/2; 
        border.y = -cropH/2;
        sprite.addChild(border);

        sprite._phase = 0; 
        sprite._timer = 0;
        
        sprite.update = function() {
            if (this._phase === 0) { 
                this.x += (CUTIN_TARGET_X - this.x) * 0.25; 
                this.opacity = Math.min(255, this.x * 2);
                if (Math.abs(this.x - CUTIN_TARGET_X) < 5) {
                    this._phase = 1;
                    this._timer = 40; 
                }
            } else if (this._phase === 1) { 
                this._timer--;
                this.x += 1.0; 
                if (this._timer <= 0) this._phase = 2;
            } else if (this._phase === 2) { 
                this.x += 30; 
                this.opacity -= 10;
                if (this.opacity <= 0) {
                    this.parent.removeChild(this);
                    this.destroy();
                }
            }
        };

        this.addChild(sprite); 
    };

    // 6. 吸血光球 (三阶段：爆发 -> 悬停 -> 吸收)
    Spriteset_Battle.prototype.createDrainOrbs = function(source, target) {
        const p1 = getBattlerVisualCenter(source); 
        const p3 = getBattlerVisualCenter(target); 
        
        const color = ColorUtil.hexToNum(DRAIN_COLOR);
        const count = DRAIN_COUNT;

        for (let i = 0; i < count; i++) {
            const orb = new Sprite();
            const g = new PIXI.Graphics();
            g.beginFill(color);
            g.drawCircle(0, 0, DRAIN_SIZE);
            g.endFill();
            orb.addChild(g);
            
            orb.x = p1.x;
            orb.y = p1.y;
            
            const angle = Math.random() * Math.PI * 2;
            const dist = 60 + Math.random() * 60;
            orb._p2x = p1.x + Math.cos(angle) * dist;
            orb._p2y = p1.y + Math.sin(angle) * dist;
            
            orb._targetX = p3.x;
            orb._targetY = p3.y;
            
            orb.alpha = DRAIN_ALPHA;
            orb.blendMode = PIXI.BLEND_MODES.ADD;
            
            orb._phase = 0; 
            orb._timer = 0;
            orb._maxTime = 0;
            
            const explodeDur = DRAIN_EXPLODE_DUR + Math.randomInt(10);
            const waitDur = DRAIN_HOVER_DUR + Math.randomInt(10);
            const absorbDur = DRAIN_ABSORB_DUR + Math.randomInt(10);
            
            orb._durations = [explodeDur, waitDur, absorbDur];
            orb._maxTime = explodeDur;

            orb.update = function() {
                this._timer++;
                const t = Math.min(1, this._timer / this._maxTime);

                if (this._phase === 0) {
                    const ease = 1 - Math.pow(1 - t, 3);
                    this.x = p1.x + (this._p2x - p1.x) * ease;
                    this.y = p1.y + (this._p2y - p1.y) * ease;
                    
                    if (t >= 1) {
                        this._phase = 1;
                        this._timer = 0;
                        this._maxTime = this._durations[1];
                    }
                } else if (this._phase === 1) {
                    this.y += Math.sin(this._timer * 0.5) * 0.5;
                    
                    if (t >= 1) {
                        this._phase = 2;
                        this._timer = 0;
                        this._maxTime = this._durations[2];
                        this._startX = this.x;
                        this._startY = this.y;
                    }
                } else if (this._phase === 2) {
                    const ease = t * t * t; 
                    this.x = this._startX + (this._targetX - this._startX) * ease;
                    this.y = this._startY + (this._targetY - this._startY) * ease;
                    
                    this.scale.set(1.0 - t * 0.6); 
                    
                    if (t >= 1) {
                        this.parent.removeChild(this);
                        this.destroy();
                    }
                }
            };
            
            this._effectsContainer.addChild(orb);
        }
    };

})();