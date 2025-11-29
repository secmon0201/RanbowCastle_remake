/*:
 * @target MZ
 * @plugindesc 战斗节奏优化 - 提前伤害结算与流程衔接
 * @author Secmon
 * @version 1.0.0
 * @help
 * ===== 战斗节奏优化插件 =====
 * * 这是一个用于优化 RPG Maker MZ 战斗节奏的插件。
 * * 原版问题：
 * 默认的战斗流程中，必须等待技能动画完全播放完毕（包括最后的粒子消失），
 * 才会弹出伤害数字，并且必须等完全结束后，下一个角色才会行动。
 * 这导致战斗节奏拖沓，尤其是使用长动画时。
 * * 插件功能：
 * 1. 【提前结算】：在播放动画后，只等待一个固定的“打击延迟”帧数，
 * 就立即弹出伤害数字。
 * 2. 【快速衔接】：伤害结算完毕后，不再等待动画完全消失，
 * 立即允许下一个角色开始行动。
 * * 使用建议：
 * - 建议将“打击延迟帧数”设置为 12-20 左右，这样伤害数字通常会
 * 在动画的“打击点”出现，观感最佳。
 * - 请将本插件放置在 MOG 等战斗美化插件的【下方】，以确保覆盖等待逻辑。
 * * @param HitDelay
 * @text 打击延迟帧数
 * @desc 技能动画开始播放后，等待多少帧就弹出伤害数字？(推荐 12-20)
 * @type number
 * @min 1
 * @default 12
 * * @param IgnoreAnimBusy
 * @text 忽略动画忙碌
 * @desc 伤害结算完是否忽略剩余动画直接开始下个动作？(true:是, false:否-仅提前伤害)
 * @type boolean
 * @default true
 */

(() => {
    const pluginName = "Sec_FastBattleAnimation";
    const parameters = PluginManager.parameters(pluginName);
    const hitDelay = Number(parameters['HitDelay'] || 12);
    const ignoreAnimBusy = (parameters['IgnoreAnimBusy'] === "true");

    // ======================================================================
    // 1. 修改 BattleLog 的等待逻辑：不完全等待动画，改为只等待打击点
    // ======================================================================
    
    // 覆盖 waitForAnimation，不再使用 setWaitMode("animation")
    Window_BattleLog.prototype.waitForAnimation = function() {
        // 原版逻辑会监视 Spriteset 直到动画完全消失。
        // 修改后：我们只等待一个固定的“打击感”延迟时间。
        this.wait(hitDelay);
    };

    // 强力覆盖 updateWaitMode，防止其他插件（如MOG）通过其他方式设置了 waitMode="animation"
    // 从而导致系统依然在等待。
    const _Window_BattleLog_updateWaitMode = Window_BattleLog.prototype.updateWaitMode;
    Window_BattleLog.prototype.updateWaitMode = function() {
        if (this._waitMode === "animation") {
            // 如果处于动画等待模式，直接强制结束等待
            // 因为我们已经由上面的 waitForAnimation 接管了固定延迟
            return false;
        }
        return _Window_BattleLog_updateWaitMode.call(this);
    };

    // ======================================================================
    // 2. 修改 Spriteset 的忙碌判定：不再因为有动画在播放就阻塞流程
    // ======================================================================
    
    // 只有当开启“忽略动画忙碌”时才生效
    if (ignoreAnimBusy) {
        // 我们不保留原方法，因为原方法通常只有一行 return this.isAnimationPlaying() ...
        // 直接重写以确保逻辑被替换
        Spriteset_Battle.prototype.isBusy = function() {
            // 原版逻辑：return this.isAnimationPlaying() || this.isEffecting() || this.isAnyoneMoving();
            
            // 修改后：移除了 isAnimationPlaying() 的检查。
            // 这意味着只要伤害弹窗(isEffecting)结束，角色归位(isAnyoneMoving)结束，
            // 哪怕屏幕上还有技能动画在播，BattleManager 也会认为空闲了，
            // 从而立即开始下一个 Action。
            return this.isEffecting() || this.isAnyoneMoving();
        };
    }

})();