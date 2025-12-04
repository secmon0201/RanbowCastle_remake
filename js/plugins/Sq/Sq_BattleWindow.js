/*:
 * @target MZ
 * @plugindesc [战斗] 窗口皮肤自定义 & 底部居中日志 & MP提示过滤
 * @author 神枪手 (Optimized by Gemini)
 * @version 1.5.0
 *
 * @param battleWindowSkin
 * @text 战斗窗口皮肤名称
 * @desc 自定义战斗相关窗口使用的皮肤文件名（需放在img/system/文件夹）
 * @default Battlewindow
 * @type string
 *
 * @param battleLogOpacity
 * @text 战斗日志透明度
 * @desc 战斗日志窗口的透明度（0-255，0为完全透明）
 * @default 0
 * @type number
 * @min 0
 * @max 255
 *
 * @param logClearDelay
 * @text 日志自动清空延迟(毫秒)
 * @desc 战斗动作结束后，日志保持显示的时间（单位：毫秒，1000=1秒）
 * @default 1000
 * @type number
 * @min 0
 * @max 5000
 *
 * @param --- Enemy Icons ---
 * @text [敌人状态图标设置]
 * @default
 *
 * @param enemyIconSize
 * @parent --- Enemy Icons ---
 * @text 图标显示大小
 * @desc 敌人头顶状态图标的显示尺寸（原版为32）。
 * @default 24
 * @type number
 * @min 8
 *
 * @param enemyIconSpace
 * @parent --- Enemy Icons ---
 * @text 图标间距
 * @desc 多个图标并排显示时的横向间距。
 * @default 2
 * @type number
 * @min -10
 *
 * @param enemyIconMax
 * @parent --- Enemy Icons ---
 * @text 最大图标显示数
 * @desc 超过此数量的图标将被忽略。
 * @default 8
 * @type number
 * @min 1
 *
 * @param enemyIconOffsetY
 * @parent --- Enemy Icons ---
 * @text Y轴位置修正
 * @desc 调整图标在敌人头顶的垂直位置（正数向下，负数向上）。
 * @default 10
 * @type number
 * @min -999
 * @max 999
 *
 * @help
 * ============================================================================
 * 版本更新说明 (v1.5.0)
 * ============================================================================
 * - 新增：敌人战斗状态图标改为横向排列显示（原为轮播）。
 * - 新增：可自定义敌人状态图标的大小、间距和位置。
 *
 * ============================================================================
 * 功能说明
 * ============================================================================
 * 1. 窗口皮肤自定义：
 * 自动将战斗中的命令窗口、状态窗口、日志窗口、帮助窗口等替换为指定皮肤。
 *
 * 2. 战斗日志样式优化：
 * - 日志窗口默认隐藏，有内容时自动显示并置顶（最上层）
 * - 无内容时自动隐藏并恢复原始图层层级
 * - 文字居中显示，强制单行显示
 * - 固定于屏幕底部，宽度与屏幕一致
 *
 * 3. MP日志智能过滤：
 * - 自动屏蔽“自动回蓝”的提示文本，防止刷屏
 * - 需配合战斗机制插件：回蓝前设置 target._ignoreMpLog = true 即可触发过滤
 *
 * 4. 敌人状态图标优化：
 * - 敌人的Buff/Debuff/状态不再轮播，而是横向铺开显示。
 * - 可在参数中调整大小，适配竖屏小分辨率界面。
 *
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 1. 皮肤设置：
 * 将自定义皮肤图片（PNG格式）放入项目的 img/system/ 文件夹。
 *
 * 2. 敌人图标：
 * 调整 "图标显示大小" 和 "图标间距" 以适应你的游戏分辨率（480x854）。
 */

(function() {
    // ========================================================================
    // 1. 获取插件参数
    // ========================================================================
    const parameters = PluginManager.parameters('Sq_BattleWindow');
    const battleWindowSkin = String(parameters['battleWindowSkin'] || 'Battlewindow');
    const battleLogOpacity = Number(parameters['battleLogOpacity'] || 0);
    const logClearDelay = Number(parameters['logClearDelay'] || 1000);

    // 敌人图标相关参数
    const enemyIconSize = Number(parameters['enemyIconSize'] || 24);
    const enemyIconSpace = Number(parameters['enemyIconSpace'] || 2);
    const enemyIconMax = Number(parameters['enemyIconMax'] || 8);
    const enemyIconOffsetY = Number(parameters['enemyIconOffsetY'] || 0);

    // ========================================================================
    // 2. 加载自定义窗口皮肤 (Load Window Skins)
    // ========================================================================
    
    Window_PartyCommand.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem(battleWindowSkin);
    };

    Window_BattleStatus.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem(battleWindowSkin);
    };

    Window_ActorCommand.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem(battleWindowSkin);
    };

    Window_BattleLog.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem(battleWindowSkin);
    };
    
    Window_Help.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem(battleWindowSkin);
    };
    
    Window_MenuCommand.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem(battleWindowSkin);
    };
    
    Window_MenuActor.prototype.loadWindowskin = function() {
        this.windowskin = ImageManager.loadSystem(battleWindowSkin);
    };

    // ========================================================================
    // 3. 战斗日志窗口核心逻辑 (Battle Log Logic)
    // ========================================================================

    const _Window_BattleLog_initialize = Window_BattleLog.prototype.initialize;
    Window_BattleLog.prototype.initialize = function(rect) {
        _Window_BattleLog_initialize.call(this, rect);
        this.opacity = 0; 
        this.visible = false; 
        this._lines = []; 
        this._originalLayerIndex = null;
        this.loadWindowskin();
    };

    Window_BattleLog.prototype.updateVisibilityByContent = function() {
        const hasContent = this._lines.length > 0;
        const parent = this.parent; 

        if (parent) {
            if (this._originalLayerIndex === null) {
                this._originalLayerIndex = parent.children.indexOf(this);
            }

            if (hasContent) {
                if (parent.children.indexOf(this) !== parent.children.length - 1) {
                    parent.removeChild(this); 
                    parent.addChild(this); 
                }
            } else {
                const currentIndex = parent.children.indexOf(this);
                if (currentIndex !== this._originalLayerIndex && this._originalLayerIndex > -1) {
                    parent.removeChild(this);
                    const targetIndex = Math.min(this._originalLayerIndex, parent.children.length);
                    parent.addChildAt(this, targetIndex);
                }
            }
        }

        this.visible = hasContent; 
        this.opacity = hasContent ? battleLogOpacity : 0; 
    };

    const _Window_BattleLog_addText = Window_BattleLog.prototype.addText;
    Window_BattleLog.prototype.addText = function(text) {
        _Window_BattleLog_addText.call(this, text);
        while (this._lines.length > this.maxLines()) {
            this._lines.shift(); 
        }
        this.updateVisibilityByContent();
        this.refresh();
    };

    const _Window_BattleLog_clear = Window_BattleLog.prototype.clear;
    Window_BattleLog.prototype.clear = function() {
        _Window_BattleLog_clear.call(this);
        this.updateVisibilityByContent();
    };

    const _Window_BattleLog_popBaseLine = Window_BattleLog.prototype.popBaseLine;
    Window_BattleLog.prototype.popBaseLine = function() {
        _Window_BattleLog_popBaseLine.call(this);
        this.updateVisibilityByContent();
        this.refresh();
    };

    Window_BattleLog.prototype.maxLines = function() {
        return 1;
    };

    Scene_Battle.prototype.logWindowRect = function() {
        const wx = 0;
        const ww = Graphics.boxWidth;
        const wh = this.calcWindowHeight(1, false); 
        const wy = Graphics.boxHeight - wh; 
        return new Rectangle(wx, wy, ww, wh);
    };

    Window_BattleLog.prototype.drawLineText = function(index) {
        const contentWidth = this.contentsWidth();
        const lineHeight = this.lineHeight();
        const text = this._lines[index];

        const textWidth = this.textSizeEx(text).width;
        const yPos = index * lineHeight;
        this.contents.clearRect(0, yPos, contentWidth, lineHeight);
        const startX = (contentWidth - textWidth) / 2;
        this.drawTextEx(text, startX, yPos);
    };

    const _Scene_Battle_endAction = Scene_Battle.prototype.endAction;
    Scene_Battle.prototype.endAction = function(subject) {
        _Scene_Battle_endAction.call(this, subject);
        const logWindow = this._logWindow;
        if (logWindow) {
            setTimeout(() => {
                if (logWindow && !logWindow.destroyed) {
                    logWindow.clear();
                }
            }, logClearDelay); 
        }
    };

    // ========================================================================
    // 4. MP日志过滤逻辑 (MP Log Filtering)
    // ========================================================================
    
    const _Window_BattleLog_displayMpDamage = Window_BattleLog.prototype.displayMpDamage;
    Window_BattleLog.prototype.displayMpDamage = function(target) {
        if (target._ignoreMpLog) {
            target._ignoreMpLog = false;
            if (target.result().mpDamage < 0) {
                return;
            }
        } else {
            target._ignoreMpLog = false;
        }
        _Window_BattleLog_displayMpDamage.call(this, target);
    };

    // ========================================================================
    // 5. 敌人状态图标自定义 (Enemy State Icons)
    // ========================================================================

    const _Sprite_StateIcon_initMembers = Sprite_StateIcon.prototype.initMembers;
    Sprite_StateIcon.prototype.initMembers = function() {
        _Sprite_StateIcon_initMembers.call(this);
        // 用于记录上一帧的图标列表，防止每帧重绘
        this._lastIconListString = ""; 
    };

    // 重写 update 方法，分流 敌人 和 角色/其他 的逻辑
    const _Sprite_StateIcon_update = Sprite_StateIcon.prototype.update;
    Sprite_StateIcon.prototype.update = function() {
        if (this._battler && this._battler.isEnemy()) {
            // 如果是敌人，运行自定义的横向排列逻辑
            Sprite.prototype.update.call(this);
            this.updateEnemyIcons();
        } else {
            // 如果是角色，保持原版逻辑（轮播）
            _Sprite_StateIcon_update.call(this);
        }
    };

    // 敌人图标的核心更新逻辑
    Sprite_StateIcon.prototype.updateEnemyIcons = function() {
        if (!this._battler) return;

        // 1. 获取当前所有需要显示的图标
        // allIcons() 返回包含 状态图标 和 Buff图标 的数组
        let icons = this._battler.allIcons();

        // 限制最大显示数量
        if (icons.length > enemyIconMax) {
            icons = icons.slice(0, enemyIconMax);
        }

        // 2. 检查图标是否发生变化（简单的字符串比较）
        const currentIconString = JSON.stringify(icons);
        if (this._lastIconListString !== currentIconString) {
            this._lastIconListString = currentIconString;
            this.refreshEnemyIcons(icons);
        }

        // 3. 处理位置偏移 (Y轴)
        // Sprite_Enemy 中会自动更新 this.y，我们在此基础上叠加偏移
        // 注意：Sprite_Enemy.prototype.updateStateSprite 会每帧重置 y
        // 所以我们修改 anchor 或者在 refresh 中控制内部内容位置
        // 这里通过修改 pivot 或在绘制时偏移来实现可能更稳妥，
        // 但简单的方式是修正父类设置后的 y。
        // 由于 update 在父类 update 之后调用，我们可以微调 y。
        this.y += enemyIconOffsetY;
    };

    // 绘制敌人图标
    Sprite_StateIcon.prototype.refreshEnemyIcons = function(icons) {
        if (icons.length === 0) {
            this.bitmap = null;
            return;
        }

        const iconSet = ImageManager.loadSystem("IconSet");
        // 确保 IconSet 已加载
        if (!iconSet.isReady()) {
            // 如果没加载完，清空记录，下一帧重试
            this._lastIconListString = "";
            return;
        }

        const pw = ImageManager.iconWidth; // 默认32
        const ph = ImageManager.iconHeight;
        
        // 计算目标尺寸
        const targetSize = enemyIconSize;
        const spacing = enemyIconSpace;
        
        // 计算Bitmap的总宽度
        const totalWidth = icons.length * targetSize + (icons.length - 1) * spacing;
        const totalHeight = targetSize;

        // 创建新的 Bitmap (或者重用现有的并清空)
        if (this.bitmap) {
            this.bitmap.destroy(); // 销毁旧的以防内存泄漏
        }
        this.bitmap = new Bitmap(totalWidth, totalHeight);

        // 绘制每一个图标
        for (let i = 0; i < icons.length; i++) {
            const iconIndex = icons[i];
            const sx = (iconIndex % 16) * pw;
            const sy = Math.floor(iconIndex / 16) * ph;
            
            const dx = i * (targetSize + spacing);
            const dy = 0;

            // blt(source, sx, sy, sw, sh, dx, dy, dw, dh)
            this.bitmap.blt(iconSet, sx, sy, pw, ph, dx, dy, targetSize, targetSize);
        }

        // 重置 frame 使得整个 Bitmap 可见
        this.setFrame(0, 0, totalWidth, totalHeight);
    };

})();