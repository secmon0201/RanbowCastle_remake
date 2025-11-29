/*---------------------------------------------------------------------------*
 * TorigoyaMZ_EnemyHpBar.js v.1.3.2 (Modified v3)
 *---------------------------------------------------------------------------*
 * 2021/10/10 20:48 (JST)
 * Modified by Gemini to fix State Icon layering and synchronization
 *---------------------------------------------------------------------------*
 * Ruたん ( @ru_shalm )
 * https://torigoya-plugin.rutan.dev
 *---------------------------------------------------------------------------*/

/*:
 * @target MZ
 * @plugindesc 向敌人显示HP条插件(v.1.3.2 - 图标完美避让版)
 * @author Ruたん（ru_shalm）
 * @license public domain
 * @version 1.3.2
 * @url https://raw.githubusercontent.com/rutan/torigoya-rpg-maker-plugin/gh-pages/TorigoyaMZ_EnemyHpBar.js
 * @help
 * 敌人HP条显示插件 (v.1.3.2)
 * https://torigoya-plugin.rutan.dev
 *
 * 向敌人角色显示HP条
 *
 * * 【修改说明 (v3)】
 * 此版本已由 AI 深度修改，解决了图标重叠和抖动问题：
 * 1. 同步更新：确保状态图标的位置在血条位置确定后立即更新，防止因呼吸动画产生的错位。
 * 2. 强制避让：当血条显示在头顶时，状态图标会自动向上移动，留出安全距离。
 * 3. 距离调整：增加了默认间距，视觉上更舒适。
 *
 * ------------------------------------------------------------
 * ■ 使用方法
 * ------------------------------------------------------------
 * 只需放入此插件即可！
 * 详细显示效果可在插件设置中修改。
 *
 * ------------------------------------------------------------
 * ■ 想对敌方角色进行个别设置！
 * ------------------------------------------------------------
 * 部分设置可以通过在敌方角色的备注栏中写入指定内容来修改。
 *
 * ▼ 不想向特定敌方角色显示HP条
 * <HP条隐藏>
 *
 * ▼ 想将特定敌方角色的HP条左右移动
 * <HP条X: 100>
 *
 * ※将100改为移动的量，负数会向左移动
 *
 * ▼ 想将特定敌方角色的HP条上下移动
 * <HP条Y: 100>
 *
 * ※将100改为移动的量，负数会向上移动
 *
 * ▼ 想改变特定敌方角色的HP条宽度
 * <HP条宽: 320>
 *
 * ▼ 想改变特定敌方角色的HP条高度
 * <HP条高: 30>
 *
 * ▼ 想将敌方角色的HP值显示为“？？？？？？”
 *
 * <HP显示条件: false>
 *
 * ▼ 不想在HP减半时显示为“？？？？？？”
 *
 * <HP显示条件: a.hp < a.mhp * 0.5>
 *
 * 可以用伤害计算公式等格式写入条件。
 *（a包含敌人信息，b不包含）
 * 条件成立时，以数字显示HP，
 * 不成立时，以插件设置中指定的掩码字符（？？？？？？等）显示。
 *
 * ▼ 一旦不再是“????”，即使条件变化也不恢复！
 *
 * <HP显示条件: a.hp < a.mhp * 0.5>
 * <HP显示状态持续>
 *
 * 像这样添加<HP显示状态持续>的话，
 * 在该场战斗中一旦进入HP显示状态，
 * 就会一直显示HP。
 *
 * @param base
 * @text ■ 基本设置
 *
 * @param basePosition
 * @text 显示位置
 * @desc 选择血条的显示位置
 * @type select
 * @parent base
 * @option 敌人图像上方
 * @value top
 * @option 敌人图像下方
 * @value bottom
 * @default top
 *
 * @param basePosX
 * @text 位置:X
 * @desc 调整血条的水平位置
 * 负数向左，正数向右偏移
 * @type number
 * @parent base
 * @min -10000
 * @max 10000
 * @default 0
 *
 * @param basePosY
 * @text 位置:Y
 * @desc 调整血条的垂直位置
 * 负数向上，正数向下偏移
 * @type number
 * @parent base
 * @min -10000
 * @max 10000
 * @default 0
 *
 * @param customize
 * @text ■ 显示自定义
 *
 * @param customizeCondition
 * @text 显示条件
 * @desc 选择何时显示血条
 * @type select
 * @parent customize
 * @option 始终显示
 * @value always
 * @option 仅选中时、受伤害时
 * @value selectOrDamage
 * @default always
 *
 * @param customizeGaugeWidth
 * @text 血条宽度
 * @desc HP条的宽度
 * @type number
 * @parent customize
 * @min 1
 * @default 100
 *
 * @param customizeGaugeHeight
 * @text 血条高度
 * @desc HP条的高度
 * @type number
 * @parent customize
 * @min 1
 * @default 10
 *
 * @param customizeDrawLabel
 * @text HP数值
 * @desc 是否显示HP数值？
 * @type boolean
 * @parent customize
 * @on 显示
 * @off 不显示
 * @default true
 *
 * @param customizeLabelWidth
 * @text HP标签宽度
 * @desc HP标签区域的宽度
 * @type number
 * @parent customize
 * @min 0
 * @default 20
 *
 * @param customizeLabelFontSize
 * @text HP标签字体大小
 * @desc HP标签的文字大小
 * @type number
 * @parent customize
 * @min 1
 * @default 16
 *
 * @param customizeValueFontSize
 * @text HP数值字体大小
 * @desc HP数值的文字大小
 * @type number
 * @parent customize
 * @min 1
 * @default 20
 *
 * @param customizeMaskHpValue
 * @text HP掩码显示
 * @desc 隐藏HP数值时的显示内容
 * @type string
 * @parent customize
 * @default ?????
 */

(function () {
    'use strict';

    const Torigoya = (window.Torigoya = window.Torigoya || {});

    function getPluginName() {
        const cs = document.currentScript;
        return cs ? cs.src.split('/').pop().replace(/\.js$/, '') : 'TorigoyaMZ_EnemyHpBar';
    }

    function pickStringValueFromParameter(parameter, key, defaultValue = '') {
        if (!parameter.hasOwnProperty(key)) return defaultValue;
        return ''.concat(parameter[key] || '');
    }

    function pickIntegerValueFromParameter(parameter, key, defaultValue = 0) {
        if (!parameter.hasOwnProperty(key) || parameter[key] === '') return defaultValue;
        return parseInt(parameter[key], 10);
    }

    function pickBooleanValueFromParameter(parameter, key, defaultValue = 'false') {
        return ''.concat(parameter[key] || defaultValue) === 'true';
    }

    function readParameter() {
        const parameter = PluginManager.parameters(getPluginName());
        return {
            version: '1.3.2',
            basePosition: pickStringValueFromParameter(parameter, 'basePosition', 'top'),
            basePosX: pickIntegerValueFromParameter(parameter, 'basePosX', 0),
            basePosY: pickIntegerValueFromParameter(parameter, 'basePosY', 0),
            customizeCondition: pickStringValueFromParameter(parameter, 'customizeCondition', 'always'),
            customizeGaugeWidth: pickIntegerValueFromParameter(parameter, 'customizeGaugeWidth', 100),
            customizeGaugeHeight: pickIntegerValueFromParameter(parameter, 'customizeGaugeHeight', 10),
            customizeDrawLabel: pickBooleanValueFromParameter(parameter, 'customizeDrawLabel', 'true'),
            customizeLabelWidth: pickIntegerValueFromParameter(parameter, 'customizeLabelWidth', 20),
            customizeLabelFontSize: pickIntegerValueFromParameter(parameter, 'customizeLabelFontSize', 16),
            customizeValueFontSize: pickIntegerValueFromParameter(parameter, 'customizeValueFontSize', 20),
            customizeMaskHpValue: pickStringValueFromParameter(parameter, 'customizeMaskHpValue', '?????'),
        };
    }

    function unescapeMetaString(string) {
        return ''
            .concat(string || '')
            .trim()
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
    }

    Torigoya.EnemyHpBar = {
        name: getPluginName(),
        parameter: readParameter(),
    };

    function isHiddenHpBar(enemy) {
        return !enemy || enemy.meta['hiddenHpBar'] || enemy.meta['HP条隐藏'];
    }

    function hpBarX(enemy) {
        return parseInt((enemy && (enemy.meta['hpBarPosX'] || enemy.meta['HP条X'])) || 0, 10);
    }

    function hpBarY(enemy) {
        return parseInt((enemy && (enemy.meta['hpBarPosY'] || enemy.meta['HP条Y'])) || 0, 10);
    }

    function hpBarWidth(enemy) {
        return parseInt((enemy && (enemy.meta['hpBarWidth'] || enemy.meta['HP条宽'])) || 0, 10);
    }

    function hpBarHeight(enemy) {
        return parseInt((enemy && (enemy.meta['hpBarHeight'] || enemy.meta['HP条高'])) || 0, 10);
    }

    const forceShowHpValueCache = new WeakSet();

    function isShowHpValueOfBattler(a) {
        if (!a) return true;
        if (forceShowHpValueCache.has(a)) return true;

        const enemy = a.enemy();
        const code = enemy.meta['hpShowCondition'] || enemy.meta['HP显示条件'] || '';
        if (!code) return true;
        try {
            if (eval(unescapeMetaString(code))) {
                if (enemy.meta['hpShowPermanently'] || enemy.meta['HP显示状态持续']) {
                    forceShowHpValueCache.add(a);
                }
                return true;
            }
        } catch (e) {
            if ($gameTemp.isPlaytest()) console.error(e);
        }

        return false;
    }

    class Sprite_EnemyHpGauge extends Sprite_Gauge {
        constructor() {
            super();
            this._durationWait = 0;
        }

        setup(battler, statusType) {
            if (this._battler === battler) return;
            this._battler = battler;
            this.reCreateBitmap();
            super.setup(battler, statusType);
        }

        reCreateBitmap() {
            if (this.bitmap) this.bitmap.destroy();
            this.bitmap = null;
            this.createBitmap();
        }

        bitmapWidth() {
            return this.gaugeWidth() + this.gaugeX();
        }

        bitmapHeight() {
            // 适配核心脚本v.1.3.3的以下修正
            // > 修复HP（等）使用部分英文字符时显示不全的问题
            if (Sprite_Gauge.prototype.textHeight) {
                return Math.round(this.textHeight() * 1.5);
            } else {
                return this.textHeight();
            }
        }

        textHeight() {
            if (Torigoya.EnemyHpBar.parameter.customizeDrawLabel) {
                return Math.max(
                    this.labelFontSize() + this.labelOutlineWidth(),
                    this.valueFontSize() + this.valueOutlineWidth(),
                    this.gaugeHeight()
                );
            } else {
                return this.gaugeHeight();
            }
        }

        gaugeWidth() {
            return (
                hpBarWidth(this._battler && this._battler.enemy()) || Torigoya.EnemyHpBar.parameter.customizeGaugeWidth
            );
        }

        gaugeHeight() {
            return (
                hpBarHeight(this._battler && this._battler.enemy()) ||
                Torigoya.EnemyHpBar.parameter.customizeGaugeHeight
            );
        }

        gaugeX() {
            if (!Torigoya.EnemyHpBar.parameter.customizeDrawLabel) return 0;
            return Torigoya.EnemyHpBar.parameter.customizeLabelWidth;
        }

        labelFontSize() {
            return Torigoya.EnemyHpBar.parameter.customizeLabelFontSize;
        }

        valueFontSize() {
            return Torigoya.EnemyHpBar.parameter.customizeValueFontSize;
        }

        updateTargetValue(value, maxValue) {
            const oldDuration = this._duration;

            super.updateTargetValue(value, maxValue);

            if (oldDuration !== this._duration && BattleManager._phase !== '') {
                this._durationWait = this.durationWait();
            }
        }

        updateGaugeAnimation() {
            super.updateGaugeAnimation();
            if (this._durationWait > 0 && this._duration <= 0) {
                --this._durationWait;
            }
        }

        drawLabel() {
            //if (!Torigoya.EnemyHpBar.parameter.customizeDrawLabel) return;
            //super.drawLabel();
        }

        drawValue() {
            if (!Torigoya.EnemyHpBar.parameter.customizeDrawLabel) return;
            if (isShowHpValueOfBattler(this._battler)) {
                super.drawValue();
            } else {
                this.drawMaskValue();
            }
        }

        drawMaskValue() {
            const width = this.bitmapWidth();
            const height = this.bitmapHeight();
            this.setupValueFont();
            this.bitmap.drawText(Torigoya.EnemyHpBar.parameter.customizeMaskHpValue, 0, 0, width, height, 'right');
        }

        durationWait() {
            return this._statusType === 'time' ? 0 : 60;
        }

        shouldShow() {
            if (!this._battler) return false;
            if (this._battler.isDead()) return false;
            if (isHiddenHpBar(this._battler.enemy())) return false;

            switch (Torigoya.EnemyHpBar.parameter.customizeCondition) {
                case 'always': {
                    return true;
                }
                case 'selectOrDamage': {
                    if (BattleManager._phase === 'start') return false;

                    if (this._battler && this._battler.isSelected()) return true;
                    if (BattleManager._phase === 'input') return false;

                    if (this._duration > 0) return true;
                    if (this._durationWait > 0) return true;

                    break;
                }
            }

            return false;
        }
    }

    Torigoya.EnemyHpBar.Sprite_EnemyHpGauge = Sprite_EnemyHpGauge;

    (() => {
        const upstream_Sprite_Enemy_initMembers = Sprite_Enemy.prototype.initMembers;
        Sprite_Enemy.prototype.initMembers = function () {
            upstream_Sprite_Enemy_initMembers.apply(this);
            this.torigoyaEnemyHpBar_createGaugeSprite();
        };

        Sprite_Enemy.prototype.torigoyaEnemyHpBar_createGaugeSprite = function () {
            this._torigoyaEnemyHpBar_gaugeSprite = new Torigoya.EnemyHpBar.Sprite_EnemyHpGauge();
            this._torigoyaEnemyHpBar_gaugeSprite.anchor.x = 0.5;
            this._torigoyaEnemyHpBar_gaugeSprite.opacity = 0;
            
            // --- 修正图层顺序：确保血条在状态图标下面，防止遮挡 ---
            const iconIndex = this.getChildIndex(this._stateIconSprite);
            if (iconIndex >= 0) {
                this.addChildAt(this._torigoyaEnemyHpBar_gaugeSprite, iconIndex);
            } else {
                this.addChild(this._torigoyaEnemyHpBar_gaugeSprite);
            }
        };

        const upstream_Sprite_Enemy_setBattler = Sprite_Enemy.prototype.setBattler;
        Sprite_Enemy.prototype.setBattler = function (battler) {
            upstream_Sprite_Enemy_setBattler.apply(this, arguments);
            this._torigoyaEnemyHpBar_gaugeSprite.setup(battler, 'hp');
        };

        const upstream_Sprite_Enemy_update = Sprite_Enemy.prototype.update;
        Sprite_Enemy.prototype.update = function () {
            upstream_Sprite_Enemy_update.apply(this);
            if (this._enemy) {
                this.torigoyaEnemyHpBar_updateGaugeSprite();
            }
        };

        // --- 核心修正逻辑 ---
        // 我们不在 updateStateIconSprite 中调整位置，因为那个方法执行得太早。
        // 我们在 HP 条的位置计算完毕后，强制覆盖状态图标的位置。
        
        Sprite_Enemy.prototype.torigoyaEnemyHpBar_updateGaugeSprite = function () {
            // 1. 更新 HP 条位置
            this._torigoyaEnemyHpBar_gaugeSprite.x = this.torigoyaEnemyHpBar_posX();
            this._torigoyaEnemyHpBar_gaugeSprite.y = this.torigoyaEnemyHpBar_posY();

            this._torigoyaEnemyHpBar_gaugeSprite.opacity += this._torigoyaEnemyHpBar_gaugeSprite.shouldShow()
                ? 48
                : -48;
            
            // 2. 紧接着更新状态图标位置 (Fix position overlap)
            this.torigoyaEnemyHpBar_fixStateIconPosition();
        };
        
        // 新增：强制修正状态图标位置的方法
        Sprite_Enemy.prototype.torigoyaEnemyHpBar_fixStateIconPosition = function() {
            // 只有当插件配置为“显示在顶部”且 HP 条处于显示状态时才生效
            if (Torigoya.EnemyHpBar.parameter.basePosition === 'top' &&
                this._torigoyaEnemyHpBar_gaugeSprite.shouldShow() &&
                this._stateIconSprite) {
                
                const barY = this._torigoyaEnemyHpBar_gaugeSprite.y;
                // MZ 默认状态图标是 32x32，锚点 0.5。
                // 我们要让图标的底部 (y + 16) 位于血条上方。
                const iconHalfHeight = 16; 
                const spacing = 20; // 增加间距到 20 像素，确保清晰
                
                // 将图标移动到血条上方
                this._stateIconSprite.y = barY - iconHalfHeight - spacing;
            }
        };

        Sprite_Enemy.prototype.torigoyaEnemyHpBar_posX = function () {
            let x = Torigoya.EnemyHpBar.parameter.basePosX;
            x += hpBarX(this._battler && this._battler.enemy());
            return x;
        };

        Sprite_Enemy.prototype.torigoyaEnemyHpBar_posY = function () {
            let y = Torigoya.EnemyHpBar.parameter.basePosY;
            if (this.bitmap && this.bitmap.isReady()) {
                switch (Torigoya.EnemyHpBar.parameter.basePosition) {
                    case 'top':
                        y -= this.bitmap.height + this._torigoyaEnemyHpBar_gaugeSprite.textHeight();
                        break;
                }
            }
            y += hpBarY(this._battler && this._battler.enemy());

            return y;
        };
    })();
})();