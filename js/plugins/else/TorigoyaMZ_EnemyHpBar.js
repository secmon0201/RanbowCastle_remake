/*---------------------------------------------------------------------------*
 * TorigoyaMZ_EnemyHpBar.js v.1.3.4 (Fix: Icon Distance Conflict)
 *---------------------------------------------------------------------------*
 * 2021/10/10 20:48 (JST)
 * Modified by Gemini: Add Icon Position Correction Parameter
 *---------------------------------------------------------------------------*
 * Ruたん ( @ru_shalm )
 * https://torigoya-plugin.rutan.dev
 *---------------------------------------------------------------------------*/

/*:
 * @target MZ
 * @plugindesc [战斗] 敌人HP血条显示 & 打击感 & 状态图标距离修正
 * @author Ruたん（ru_shalm） & Gemini
 * @license public domain
 * @version 1.3.4
 * @url https://raw.githubusercontent.com/rutan/torigoya-rpg-maker-plugin/gh-pages/TorigoyaMZ_EnemyHpBar.js
 * @help
 * 敌人HP条显示插件 (v.1.3.4 - 图标距离修复版)
 * https://torigoya-plugin.rutan.dev
 *
 * 向敌人角色显示HP条
 *
 * * 【v.1.3.4 修改说明 - 解决图标距离过远问题】
 * 1. 新增【状态图标】设置分组。
 * 2. 增加了 [位置修正 Y] 参数。
 * 原本插件强制将图标上移约36像素，导致配合其他UI插件时距离过远。
 * 现在你可以通过调整这个数字来拉近图标和血条的距离。
 *
 * ------------------------------------------------------------
 * ■ 使用方法
 * ------------------------------------------------------------
 * 1. 在插件参数 -> [状态图标] -> [位置修正 Y] 中调整数值。
 * 默认是 -36 (原版距离)。
 * 如果你觉得太远，试着改成 -15 或 -10。
 *
 * ------------------------------------------------------------
 * ■ 想对敌方角色进行个别设置！
 * ------------------------------------------------------------
 * (保留原版所有功能，详细请参考原版帮助)
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
 *
 * @param iconConfig
 * @text ■ 状态图标 (State Icon)
 *
 * @param iconCorrectionY
 * @text [位置修正 Y]
 * @desc 调整状态图标相对于血条的垂直距离。
 * 负数向上移动，正数向下移动。如果觉得太远，请减小负数(如 -10)。
 * @type number
 * @parent iconConfig
 * @min -1000
 * @max 1000
 * @default -36
 *
 * @param impact
 * @text ■ 打击感设置 (Impact)
 *
 * @param impactLagEnabled
 * @text [残影] 是否开启
 * @desc 是否显示HP扣除时的白色缓冲条（残影）。
 * @type boolean
 * @parent impact
 * @on 开启
 * @off 关闭
 * @default true
 *
 * @param impactLagDelay
 * @text [残影] 滞留时间
 * @desc 受到伤害后，残影条停留多少帧才开始减少。
 * @type number
 * @parent impact
 * @min 0
 * @default 30
 *
 * @param impactLagColor
 * @text [残影] 颜色
 * @desc 残影条的颜色 (Hex值，如 #ffffff)。
 * @type string
 * @parent impact
 * @default #ffffff
 *
 * @param impactShakeEnabled
 * @text [震动] 是否开启
 * @desc 受伤时血条是否震动。
 * @type boolean
 * @parent impact
 * @on 开启
 * @off 关闭
 * @default true
 *
 * @param impactShakePower
 * @text [震动] 基础强度
 * @desc 震动的剧烈程度 (像素)。建议 5-10。
 * @type number
 * @parent impact
 * @min 0
 * @default 5
 *
 * @param impactShakeDuration
 * @text [震动] 持续时间
 * @desc 震动持续的帧数。
 * @type number
 * @parent impact
 * @min 0
 * @default 20
 *
 * @param impactFlashEnabled
 * @text [闪烁] 是否开启
 * @desc 受伤瞬间血条是否闪白。
 * @type boolean
 * @parent impact
 * @on 开启
 * @off 关闭
 * @default true
 *
 * @param impactFlashDuration
 * @text [闪烁] 持续时间
 * @desc 闪白持续的帧数。
 * @type number
 * @parent impact
 * @min 0
 * @default 12
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
            version: '1.3.4',
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
            // --- Icon Parameter ---
            iconCorrectionY: pickIntegerValueFromParameter(parameter, 'iconCorrectionY', -36),
            // --- Impact Parameters ---
            impactLagEnabled: pickBooleanValueFromParameter(parameter, 'impactLagEnabled', 'true'),
            impactLagDelay: pickIntegerValueFromParameter(parameter, 'impactLagDelay', 30),
            impactLagColor: pickStringValueFromParameter(parameter, 'impactLagColor', '#ffffff'),
            impactShakeEnabled: pickBooleanValueFromParameter(parameter, 'impactShakeEnabled', 'true'),
            impactShakePower: pickIntegerValueFromParameter(parameter, 'impactShakePower', 5),
            impactShakeDuration: pickIntegerValueFromParameter(parameter, 'impactShakeDuration', 20),
            impactFlashEnabled: pickBooleanValueFromParameter(parameter, 'impactFlashEnabled', 'true'),
            impactFlashDuration: pickIntegerValueFromParameter(parameter, 'impactFlashDuration', 12),
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
            // -- 打击感参数初始化 --
            this._lagValue = 0;        // 残影（白条）的当前值
            this._lagDelay = 0;        // 残影延迟开始减少的计数器
            this._shakeTime = 0;       // 震动时间
            this._shakePower = 0;      // 震动强度
            this._shakeX = 0;          // X轴震动偏移
            this._shakeY = 0;          // Y轴震动偏移
            this._flashTime = 0;       // 闪烁时间
        }

        setup(battler, statusType) {
            if (this._battler === battler) return;
            this._battler = battler;
            this.reCreateBitmap();
            super.setup(battler, statusType);
            this._lagValue = this.currentValue();
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

        update() {
            super.update();
            this.updateShake();
            this.updateLag();
            this.updateFlash();
        }

        updateTargetValue(value, maxValue) {
            const oldValue = this._value;
            const oldTarget = this._targetValue;

            if (value < oldValue && value < oldTarget) {
                this.triggerDamageEffect(oldValue - value);
            }

            const oldDuration = this._duration;
            super.updateTargetValue(value, maxValue);

            if (oldDuration !== this._duration && BattleManager._phase !== '') {
                this._durationWait = this.durationWait();
            }
        }

        // 触发受击特效
        triggerDamageEffect(diff) {
            const p = Torigoya.EnemyHpBar.parameter;

            // 1. 设置震动
            if (p.impactShakeEnabled) {
                this._shakeTime = p.impactShakeDuration;
                // 计算震动力度：基于基础力度，根据伤害比例轻微浮动，但不超过基础力度的2倍
                const basePower = p.impactShakePower;
                const ratio = diff / this._maxValue;
                this._shakePower = Math.min(basePower + (ratio * 100), basePower * 2);
            }

            // 2. 设置残影延迟
            if (p.impactLagEnabled) {
                this._lagDelay = p.impactLagDelay;
            }

            // 3. 设置闪烁
            if (p.impactFlashEnabled) {
                this._flashTime = p.impactFlashDuration;
            }
        }

        updateShake() {
            if (this._shakeTime > 0) {
                this._shakeTime--;
                this._shakeX = (Math.random() - 0.5) * this._shakePower;
                this._shakeY = (Math.random() - 0.5) * this._shakePower;
            } else {
                this._shakeX = 0;
                this._shakeY = 0;
            }
        }

        updateFlash() {
            if (this._flashTime > 0) {
                this._flashTime--;
                const maxDuration = Torigoya.EnemyHpBar.parameter.impactFlashDuration;
                const intensity = (this._flashTime / maxDuration) * 200;
                this.setBlendColor([255, 255, 255, intensity]);
            } else {
                this.setBlendColor([0, 0, 0, 0]);
            }
        }

        updateLag() {
            if (!Torigoya.EnemyHpBar.parameter.impactLagEnabled) return;

            if (this._lagValue > this._value) {
                if (this._lagDelay > 0) {
                    this._lagDelay--;
                } else {
                    const diff = this._lagValue - this._value;
                    const speed = Math.max(diff / 10, 0.5); 
                    this._lagValue -= speed;
                    if (this._lagValue < this._value) this._lagValue = this._value;
                    this.redraw(); 
                }
            } else if (this._lagValue < this._value) {
                this._lagValue = this._value;
                this.redraw();
            }
        }

        updateGaugeAnimation() {
            super.updateGaugeAnimation();
            if (this._durationWait > 0 && this._duration <= 0) {
                --this._durationWait;
            }
        }

        drawGaugeRect(x, y, width, height) {
            const max = this.currentMaxValue();
            const value = this.currentValue();
            
            // 使用残影值（如果开启），否则使用当前值
            const lagEnabled = Torigoya.EnemyHpBar.parameter.impactLagEnabled;
            const lag = lagEnabled ? this._lagValue : value;

            if (max <= 0) return;

            const rateCurrent = value / max;
            const rateLag = lag / max;

            const fillW_Current = Math.floor((width - 2) * rateCurrent);
            const fillW_Lag = Math.floor((width - 2) * rateLag);
            const fillH = height - 2;

            const color0 = this.gaugeBackColor();
            const color1 = this.gaugeColor1();
            const color2 = this.gaugeColor2();
            const colorLag = Torigoya.EnemyHpBar.parameter.impactLagColor;

            this.bitmap.fillRect(x, y, width, height, color0);

            if (lagEnabled && fillW_Lag > fillW_Current) {
                this.bitmap.fillRect(x + 1, y + 1, fillW_Lag, fillH, colorLag);
            }

            this.bitmap.gradientFillRect(x + 1, y + 1, fillW_Current, fillH, color1, color2);
        }

        drawLabel() {
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
        
        getShakeX() { return this._shakeX; }
        getShakeY() { return this._shakeY; }
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

        Sprite_Enemy.prototype.torigoyaEnemyHpBar_updateGaugeSprite = function () {
            let x = this.torigoyaEnemyHpBar_posX();
            let y = this.torigoyaEnemyHpBar_posY();

            if (Torigoya.EnemyHpBar.parameter.impactShakeEnabled) {
                x += this._torigoyaEnemyHpBar_gaugeSprite.getShakeX();
                y += this._torigoyaEnemyHpBar_gaugeSprite.getShakeY();
            }

            this._torigoyaEnemyHpBar_gaugeSprite.x = x;
            this._torigoyaEnemyHpBar_gaugeSprite.y = y;

            this._torigoyaEnemyHpBar_gaugeSprite.opacity += this._torigoyaEnemyHpBar_gaugeSprite.shouldShow()
                ? 48
                : -48;
            
            this.torigoyaEnemyHpBar_fixStateIconPosition();
        };
        
        // --- 核心修复逻辑 ---
        Sprite_Enemy.prototype.torigoyaEnemyHpBar_fixStateIconPosition = function() {
            if (Torigoya.EnemyHpBar.parameter.basePosition === 'top' &&
                this._torigoyaEnemyHpBar_gaugeSprite.shouldShow() &&
                this._stateIconSprite) {
                
                const baseBarY = this.torigoyaEnemyHpBar_posY();
                // 使用参数控制的偏移量，替代原来写死的 16+20
                const correction = Torigoya.EnemyHpBar.parameter.iconCorrectionY; 
                
                this._stateIconSprite.y = baseBarY + correction;
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