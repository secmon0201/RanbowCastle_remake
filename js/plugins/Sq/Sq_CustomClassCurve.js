/*:
 * @target MZ
 * @plugindesc [系统] 自定义职业成长曲线 & 属性数学公式 & 升级全恢复
 * @author 神枪（Gemini）
 *
 * @help
 * ============================================================================
 * 功能介绍
 * ============================================================================
 * 本插件允许你跳过数据库的职业曲线设置，直接使用数学公式来控制属性成长。
 *
 * [v2.1 新增功能]
 * - 增加了“升级时自动恢复 HP/MP”的开关，还原经典 RPG (如彩虹城堡) 的体验。
 *
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 1. 在右侧参数【自定义职业配置列表】中添加新的项。
 * 2. 设置【职业ID】（例如：1）。
 * 3. 为该职业的 MHP, MMP, ATK 等属性填入公式。
 * 4. (可选) 开启或关闭【升级时全恢复】选项。
 *
 * ============================================================================
 * 公式写法指南
 * ============================================================================
 * 在公式栏中，你可以使用 "level" 代表当前等级。支持标准 JavaScript 数学运算。
 *
 * 常用数学函数：
 * - Math.floor(x): 向下取整
 * - Math.pow(x, y): x 的 y 次方 (用于指数增长)
 *
 * 示例公式：
 * - 线性增长： 400 + level * 40
 * - 指数增长： Math.floor(30 * Math.pow(level, 1.55) + 50)
 *
 * ============================================================================
 *
 * @param EnableRecoverAllOnLevelUp
 * @text 升级时全恢复
 * @desc 是否在角色升级时自动恢复全部 HP 和 MP？(true=开启, false=关闭)
 * @type boolean
 * @default true
 *
 * @param ClassConfigs
 * @text 自定义职业配置列表
 * @desc 在这里添加需要自定义成长的职业。
 * @type struct<ClassParamStruct>[]
 * @default []
 */

/*~struct~ClassParamStruct:
 *
 * @param ClassId
 * @text 职业ID
 * @desc 要接管的职业ID。
 * @type number
 * @min 1
 * @default 1
 *
 * @param MHP_Formula
 * @text MHP (最大生命) 公式
 * @desc 使用 'level' 代表等级。
 * @type string
 * @default Math.floor(30 * Math.pow(level, 1.55) + 50)
 *
 * @param MMP_Formula
 * @text MMP (最大魔法) 公式
 * @desc 使用 'level' 代表等级。
 * @type string
 * @default Math.floor(10 * level + 50)
 *
 * @param ATK_Formula
 * @text ATK (物理攻击) 公式
 * @desc 使用 'level' 代表等级。
 * @type string
 * @default Math.floor(15 + 3 * level + 0.12 * level * level)
 *
 * @param DEF_Formula
 * @text DEF (物理防御) 公式
 * @desc 使用 'level' 代表等级。
 * @type string
 * @default Math.floor(10 + 2.5 * level + 0.08 * level * level)
 *
 * @param MAT_Formula
 * @text MAT (魔法攻击) 公式
 * @desc 使用 'level' 代表等级。
 * @type string
 * @default Math.floor(10 + 1.5 * level)
 *
 * @param MDF_Formula
 * @text MDF (魔法防御) 公式
 * @desc 使用 'level' 代表等级。
 * @type string
 * @default Math.floor(10 + 2 * level + 0.05 * level * level)
 *
 * @param AGI_Formula
 * @text AGI (敏捷) 公式
 * @desc 使用 'level' 代表等级。
 * @type string
 * @default Math.floor(15 + 2 * level)
 *
 * @param LUK_Formula
 * @text LUK (幸运) 公式
 * @desc 使用 'level' 代表等级。
 * @type string
 * @default 10 + level
 */

(() => {
    // 已修改为读取当前文件名对应的参数
    const parameters = PluginManager.parameters('Sq_CustomClassCurve');
    
    // --- 1. 解析参数 ---
    const enableRecover = (parameters['EnableRecoverAllOnLevelUp'] === 'true');
    const rawConfigs = JSON.parse(parameters['ClassConfigs'] || '[]');

    // 将配置转换为以 ClassID 为键的哈希表，方便快速查找
    const classFormulaMap = {};

    rawConfigs.forEach(jsonStr => {
        const data = JSON.parse(jsonStr);
        const cId = Number(data.ClassId);
        
        // 将8个属性的公式存入数组 (对应 paramId 0 到 7)
        classFormulaMap[cId] = [
            data.MHP_Formula,
            data.MMP_Formula,
            data.ATK_Formula,
            data.DEF_Formula,
            data.MAT_Formula,
            data.MDF_Formula,
            data.AGI_Formula,
            data.LUK_Formula
        ];
    });

    // --- 2. 覆盖 paramBase (属性计算核心) ---
    const _Game_Actor_paramBase = Game_Actor.prototype.paramBase;

    Game_Actor.prototype.paramBase = function(paramId) {
        // 基础安全检查
        if (!this.currentClass()) return 0;
        
        const classId = this.currentClass().id;

        // 检查该职业是否在配置表中
        if (classFormulaMap[classId]) {
            const formulaStr = classFormulaMap[classId][paramId];
            return evaluateFormula(formulaStr, this.level);
        }

        // 如果不在配置表中，使用数据库默认值
        return _Game_Actor_paramBase.call(this, paramId);
    };

    // --- 3. 扩展 levelUp (升级全恢复逻辑) ---
    const _Game_Actor_levelUp = Game_Actor.prototype.levelUp;
    
    Game_Actor.prototype.levelUp = function() {
        // 执行原版升级逻辑（增加属性、学习技能等）
        _Game_Actor_levelUp.call(this);
        
        // 如果开启了开关，执行全恢复
        if (enableRecover) {
            this.recoverAll();
        }
    };

    // --- 4. 公式计算辅助函数 ---
    function evaluateFormula(formula, level) {
        try {
            // 如果公式为空，返回0
            if (!formula) return 0;

            // 使用 Function 构造器执行公式
            const func = new Function('level', 'return ' + formula);
            const result = func(level);

            // 确保结果是至少为1的整数
            return Math.max(1, Math.round(result));
        } catch (e) {
            console.error(`[CustomClassCurve] 公式错误: "${formula}" (Level: ${level})`);
            console.error(e);
            return 1; // 出错时返回1防止报错
        }
    }

})();