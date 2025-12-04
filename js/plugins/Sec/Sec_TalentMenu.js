/*:
 * @target MZ
 * @plugindesc [系统] 天赋菜单系统 & SP管理 & 原版风格修复
 * @author Secmon
 * @version 1.1.0 (Style Revert)
 * @help
 * ============================================================================
 * 更新日志 (v1.1.0)
 * ============================================================================
 * 1. 【样式恢复】：完全恢复了 RPG Maker MZ 默认的窗口外观（带边框和背景）。
 * 去掉了之前版本强制透明和深色背景的改动。
 * 2. 【重叠修复】：保留了智能排版逻辑。
 * 技能列表现在会自动计算宽度：[图标 技能名...] [SP消耗] [状态]
 * 确保文字绝对不会重叠。
 * 3. 【布局优化】：
 * - 顶部窗口现在 Y=0 绝对顶格。
 * - 移除了窗口之间多余的空隙，使它们紧凑排列。
 * * ============================================================================
 * 功能说明
 * ============================================================================
 * * 1. **天赋SP系统**：
 * - 为角色添加独立的SP（天赋点数）上限。
 * - 技能消耗SP，只有SP足够时才能启用。
 * * 2. **主菜单扩展**：
 * - 主菜单添加"天赋"选项。
 * - 四窗口布局：描述(顶)、信息(左)、列表(右)、进度条(底)。
 * * ============================================================================
 * 脚本调用 & 备注 (保持不变)
 * ============================================================================
 * 角色备注: <spMax:150>
 * 技能备注: <spCost:10>
 * 脚本: $gameActors.actor(1).setSpMax(200);
 * * @param CommandName
 * @text 菜单命令名称
 * @desc 主菜单中"天赋"选项的显示名称
 * @default 天赋
 * * @param MaxColumns
 * @text 每行技能数量
 * @desc 天赋技能列表中每行显示的技能数量
 * @type number
 * @min 1
 * @default 1
 * * @param DefaultSpMax
 * @text 默认SP上限
 * @desc 所有角色的默认初始SP上限
 * @type number
 * @default 100
 */

(() => {
    const pluginName = "Sec_TalentMenu";
    const params = PluginManager.parameters(pluginName);

    const cmdName = params.CommandName || "天赋";
    const maxColumns = Number(params.MaxColumns) || 1; 
    const defaultSpMax = Number(params.DefaultSpMax) || 100;

    const SPICON = ImageManager.loadBitmap("img/rainbow/", "spicon");

    // ==============================================================================
    // 模块 1: Game_Actor 扩展 (数据核心 - 保持原样)
    // ==============================================================================
    const _Game_Actor_initialize = Game_Actor.prototype.initialize;
    Game_Actor.prototype.initialize = function(actorId) {
        _Game_Actor_initialize.call(this, actorId);
        const actorData = $dataActors[actorId];
        let spMax = defaultSpMax;
        if (actorData && actorData.note) {
            const spMatch = actorData.note.match(/<spMax:(\d+)>/i);
            if (spMatch) spMax = Number(spMatch[1]);
        }
        this._spMax = spMax;
        this._skillStates = {};
    };

    const _Game_Actor_setup = Game_Actor.prototype.setup;
    Game_Actor.prototype.setup = function(actorId) {
        _Game_Actor_setup.call(this, actorId);
        const checkData = setInterval(() => {
            if ($dataSkills && $dataSkills.length > 0) {
                clearInterval(checkData);
                this.allSkills().forEach(skill => {
                    if (skill && this._skillStates[skill.id] === undefined) {
                        this._skillStates[skill.id] = false;
                    }
                });
            }
        }, 100);
    };

    Game_Actor.prototype.getSpCost = function(skillId) {
        if (!$dataSkills[skillId]) return 0;
        const note = $dataSkills[skillId].note;
        const match = note.match(/<spCost:(\d+)>/i);
        return match ? Number(match[1]) : 0;
    };

    Game_Actor.prototype.totalSpUsed = function() {
        return this.allSkills().reduce((total, skill) => {
            if (this.isSkillEnabled(skill.id)) {
                total += this.getSpCost(skill.id);
            }
            return total;
        }, 0);
    };

    Game_Actor.prototype.toggleSkill = function(skillId) {
        if (!$dataSkills[skillId]) return false;
        const current = this._skillStates[skillId] || false;
        const target = !current;
        const cost = this.getSpCost(skillId);
        const currentTotal = this.totalSpUsed();
        if (target && (currentTotal + cost) > this._spMax) {
            SoundManager.playBuzzer();
            return false;
        }
        this._skillStates[skillId] = target;
        return true;
    };

    Game_Actor.prototype.isSkillEnabled = function(skillId) {
        if (this._skillStates[skillId] === undefined) {
            this._skillStates[skillId] = false;
        }
        return this._skillStates[skillId];
    };

    Game_Actor.prototype.allSkills = function() {
        return this._skills.map(id => $dataSkills[id]).filter(skill => skill);
    };

    const _Game_Actor_skills = Game_Actor.prototype.skills;
    Game_Actor.prototype.skills = function() {
        return _Game_Actor_skills.call(this).filter(skill =>
            this.isSkillEnabled(skill.id)
        );
    };

    Game_Actor.prototype.setSpMax = function(newMax) {
        if (newMax > 0) {
            this._spMax = newMax;
            if (SceneManager._scene instanceof Scene_Menu && SceneManager._scene._actorInfoWindow) {
                SceneManager._scene._actorInfoWindow.refresh();
            }
        }
    };

    Game_Actor.prototype.initSkillStates = function() {
        this.allSkills().forEach(skill => {
            this._skillStates[skill.id] = false;
        });
        if (SceneManager._scene instanceof Scene_Menu && SceneManager._scene._talentListWindow) {
            SceneManager._scene._talentListWindow.refresh();
        }
    };

    Game_Actor.prototype.enableSkill = function(skillId) {
        if (!$dataSkills[skillId]) return false;
        if (!this._skills.includes(skillId)) return false;
        this._skillStates[skillId] = true;
        if (SceneManager._scene instanceof Scene_Menu && SceneManager._scene._talentListWindow) {
            SceneManager._scene._talentListWindow.refresh();
        }
        return true;
    };

    Game_Actor.prototype.enableSkills = function(skillIds) {
        if (!Array.isArray(skillIds)) return 0;
        let successCount = 0;
        skillIds.forEach(skillId => {
            if (this.enableSkill(skillId)) successCount++;
        });
        return successCount;
    };

    // ==============================================================================
    // 模块 2: 自定义窗口 (Windows) - 恢复原版样式但保留布局修复
    // ==============================================================================

    Window_Base.prototype.drawBox = function(x, y, width, height, style) {
        // 原版风格的内部方框逻辑
        this.contents.fillRect(x, y, width, height, style.bgColor);
        this.contents.penWidth = style.borderWidth;
        this.contents.strokeRect(
            x + style.borderWidth/2,
            y + style.borderWidth/2,
            width - style.borderWidth,
            height - style.borderWidth,
            style.borderColor
        );
        this.contents.penWidth = 1;
    };

    // 1. 顶部窗口：技能描述窗口
    class Window_SkillDescription extends Window_Base {
        constructor(rect) {
            super(rect);
            // 【已恢复】移除 opacity=0，保留原版窗口背景
            this._skill = null;
            this._boxStyle = {
                borderColor: ColorManager.dimColor1(),
                borderWidth: 2,
                bgColor: "rgba(0, 0, 0, 0.1)" // 恢复较浅的背景色
            };
            this.refresh();
        }

        setSkill(skill) {
            this._skill = skill;
            this.refresh();
        }

        refresh() {
            this.contents.clear();
            if (!this._skill) return;

            const padding = 4;
            const textWidth = this.contents.width - padding * 2;

            // 保留内部画框，因为原本插件就有
            this.drawBox(
                0,
                0,
                this.contents.width,
                this.contents.height,
                this._boxStyle
            );

            this.resetTextColor();
            this.drawTextEx(this._skill.description, padding * 2, padding, textWidth);
        }
    }

    // 2. 左侧窗口：角色信息窗口
    class Window_ActorInfo extends Window_StatusBase {
        constructor(rect) {
            super(rect);
            this._actor = null;
            this._defaultFontSize = $gameSystem.mainFontSize();
            this._boxStyle = {
                borderColor: ColorManager.dimColor1(),
                borderWidth: 2,
                bgColor: "rgba(0, 0, 0, 0.1)" // 恢复较浅的背景色
            };
        }
        setActor(actor) {
            this._actor = actor;
            this.refresh();
        }
        refresh() {
            this.contents.clear();
            if (!this._actor) return;
            const lineHeight = this.lineHeight();
            const centerX = this.contents.width / 2;
            const boxMargin = 4; // 稍微紧凑一点
            const boxWidth = this.contents.width - boxMargin * 2;
            let currentY = boxMargin;

            // 1. 头像框
            const faceBoxHeight = 144;
            this.drawBox(boxMargin, currentY, boxWidth, faceBoxHeight, this._boxStyle);
            this.drawActorFace(this._actor, centerX - 64, currentY + (faceBoxHeight - 144)/2, 144, 144);
            currentY += faceBoxHeight + boxMargin;

            // 通用行
            const drawRow = (text) => {
                const h = lineHeight + 8;
                this.drawBox(boxMargin, currentY, boxWidth, h, this._boxStyle);
                this.drawText(text, boxMargin + 4, currentY + 4, boxWidth - 8, "center");
                currentY += h + boxMargin;
            };

            // 2-6. 各项信息
            drawRow(this._actor.name());
            drawRow(`职业: ${this._actor.currentClass().name}`);
            
            const weapons = this._actor.weapons();
            const wNames = weapons.length > 0 ? 
                weapons.map(w => $dataSystem.weaponTypes[$dataWeapons[w.id].wtypeId]).join(" ") : "无";
            drawRow(`武器: ${wNames}`);

            const armors = this._actor.armors();
            const aNames = armors.length > 0 ?
                armors.map(a => $dataSystem.armorTypes[$dataArmors[a.id].atypeId]).join(" ") : "无";
            drawRow(`防具: ${aNames}`);

            const spMax = this._actor._spMax || 0;
            drawRow(`能量阈值: ${spMax}`);
        }
    }

    // 3. 右侧窗口：技能列表窗口 (【保留重叠修复逻辑】)
    class Window_TalentList extends Window_Selectable {
        constructor(rect) {
            super(rect);
            // 【已恢复】移除 opacity=0，恢复原版列表样式
            this._actor = null;
            this._data = [];
        }

        setActor(actor) {
            this._actor = actor;
            this.refresh();
        }

        maxCols() {
            return maxColumns;
        }

        maxItems() {
            return this._data ? this._data.length : 0;
        }

        item() {
            return this._data[this.index()];
        }

        refresh() {
            this._data = this._actor ? this._actor.allSkills() : [];
            this.createContents();
            super.refresh();
        }

        // 重写 drawItem：修复文字重叠，但保持原版无框样式
        drawItem(index) {
            const skill = this._data[index];
            if (!skill) return;
            const rect = this.itemRect(index);
            const enabled = this._actor.isSkillEnabled(skill.id);
            const spCost = this._actor.getSpCost(skill.id);

            // 1. 计算各项宽度，防止重叠
            const padding = 4;
            const iconSize = ImageManager.iconWidth;
            
            // 状态文字宽度
            const statusWidth = this.textWidth("启用") + 10;
            // SP文字宽度
            const spTextStr = `SP:${spCost}`;
            const spWidth = this.textWidth(spTextStr) + 10;
            
            // 坐标计算（从右向左布局）
            const statusX = rect.x + rect.width - statusWidth - padding;
            const spX = statusX - spWidth - padding;
            const iconX = rect.x + padding;
            
            // 技能名可用宽度 = SP数值左边 - 图标右边 - 间距
            const nameX = iconX + iconSize + padding;
            const nameMaxWidth = spX - nameX - padding;

            // 2. 绘制
            this.changePaintOpacity(true); // 确保不透明
            this.drawIcon(skill.iconIndex, iconX, rect.y + 2);

            // 绘制技能名
            this.changeTextColor(enabled ? ColorManager.normalColor() : "#aaaaaa");
            this.drawText(skill.name, nameX, rect.y, nameMaxWidth, "left");

            // 绘制SP
            this.changeTextColor(ColorManager.textColor(14)); // 黄色
            this.drawText(spTextStr, spX, rect.y, spWidth, "right");

            // 绘制状态
            const statusText = enabled ? "启用" : "关闭";
            this.changeTextColor(enabled ? ColorManager.systemColor() : "#888888");
            this.drawText(statusText, statusX, rect.y, statusWidth, "right");
        }
    }

    // 4. 底部窗口：SP进度条窗口
    class Window_SpGauge extends Window_Base {
        constructor(rect) {
            super(rect);
            // 【已恢复】移除 opacity=0
            this._actor = null;
            this._boxStyle = {
                borderColor: ColorManager.dimColor1(),
                borderWidth: 2,
                bgColor: "rgba(0, 0, 0, 0.1)"
            };
            this.refresh();
        }
        setActor(actor) {
            this._actor = actor;
            this.refresh();
        }
        refresh() {
            this.contents.clear();
            if (!this._actor) return;
            
            // 绘制内部框（保留设计）
            this.drawBox(
                0,
                0,
                this.contents.width,
                this.contents.height,
                this._boxStyle
            );

            // 绘制SP图标
            let iconOffset = 0;
            if (SPICON.isReady()) {
                const iconSize = 32;
                this.contents.blt(SPICON, 0, 0, iconSize, iconSize, 12, (this.contents.height - iconSize)/2, iconSize, iconSize);
                iconOffset = 48;
            }

            const currentSp = this._actor.totalSpUsed();
            const maxSp = this._actor._spMax;
            const rate = maxSp > 0 ? currentSp / maxSp : 0;

            const padding = 12;
            const gaugeHeight = 12; 
            const textWidth = this.textWidth("999");
            
            const gaugeWidth = this.contents.width - iconOffset - textWidth - padding * 3;
            const gaugeX = iconOffset + padding;
            const gaugeY = (this.contents.height - gaugeHeight) / 2;

            this.drawCustomGauge(gaugeX, gaugeY, gaugeWidth, rate, "#bee60cff", "#666666");

            // 绘制文字
            this.changeTextColor("#bee60cff");
            this.drawText(`${currentSp}`, 
                this.contents.width - textWidth - padding, 
                0, 
                textWidth, 
                "right"
            );
        }

        drawCustomGauge(x, y, width, rate, color1, color2) {
            const height = 12;
            const fillW = Math.floor(width * rate);
            this.contents.fillRect(x, y, width, height, color2);
            if (fillW > 0) {
                this.contents.fillRect(x, y, fillW, height, color1);
            }
        }
    }

    window.Window_SkillDescription = Window_SkillDescription;
    window.Window_ActorInfo = Window_ActorInfo;
    window.Window_TalentList = Window_TalentList;
    window.Window_SpGauge = Window_SpGauge;

    // ==============================================================================
    // 模块 3: 菜单场景逻辑 (Scene_Menu) - 布局调整
    // ==============================================================================

    const _Window_MenuCommand_makeCommandList = Window_MenuCommand.prototype.makeCommandList;
    Window_MenuCommand.prototype.makeCommandList = function() {
        _Window_MenuCommand_makeCommandList.call(this);
        const skillIndex = this._list.findIndex(cmd => cmd.symbol === "skill");
        if (skillIndex > -1) {
            this._list.splice(skillIndex + 1, 0, { name: cmdName, symbol: "talent", enabled: true });
        } else {
            this.addCommand(cmdName, "talent");
        }
    };

    const _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        _Scene_Menu_createCommandWindow.call(this);
        this._commandWindow.setHandler("talent", this.openTalentMenu.bind(this));
    };

    Scene_Menu.prototype.openTalentMenu = function() {
        if (!$dataSkills) return;
        this._statusWindow.hide();
        this._goldWindow.hide();
        this._talentStatusWindow = new Window_MenuStatus(this.statusWindowRect());
        this._talentStatusWindow.setHandler("ok", this.onTalentStatusOk.bind(this));
        this._talentStatusWindow.setHandler("cancel", this.closeTalentMenu.bind(this));
        this.addWindow(this._talentStatusWindow);
        this._talentStatusWindow.select(0);
        this._talentStatusWindow.activate();
    };

    Scene_Menu.prototype.onTalentStatusOk = function() {
        this._selectedActor = $gameParty.members()[this._talentStatusWindow.index()];
        this._talentStatusWindow.hide();
        this.createFourWindowLayout();
        this._talentListWindow.activate();
        this._talentListWindow.select(0);
        this.updateSkillDescription();
    };

    Scene_Menu.prototype.createFourWindowLayout = function() {
        this._skillDescriptionWindow = new Window_SkillDescription(this.skillDescriptionRect());
        this.addWindow(this._skillDescriptionWindow);

        this._actorInfoWindow = new Window_ActorInfo(this.actorInfoRect());
        this._actorInfoWindow.setActor(this._selectedActor);
        this.addWindow(this._actorInfoWindow);

        this._talentListWindow = new Window_TalentList(this.skillListRect());
        this._talentListWindow.setHandler("ok", this.onSkillOk.bind(this));
        this._talentListWindow.setHandler("cancel", this.backToActorSelect.bind(this));
        this._talentListWindow.setHandler("cursorMoved", this.onSkillCursorMoved.bind(this));
        this._talentListWindow.setActor(this._selectedActor);
        this.addWindow(this._talentListWindow);

        this._spGaugeWindow = new Window_SpGauge(this.spGaugeRect());
        this._spGaugeWindow.setActor(this._selectedActor);
        this.addWindow(this._spGaugeWindow);
    };

    Scene_Menu.prototype.onSkillCursorMoved = function() {
        this.updateSkillDescription();
    };

    Scene_Menu.prototype.updateSkillDescription = function() {
        const skill = this._talentListWindow.item();
        this._skillDescriptionWindow.setSkill(skill || null);
        this._spGaugeWindow.setActor(this._selectedActor);
    };

    Scene_Menu.prototype.onSkillOk = function() {
        const skill = this._talentListWindow.item();
        if (skill && this._selectedActor) {
            const success = this._selectedActor.toggleSkill(skill.id);
            if (success) {
                this._talentListWindow.refresh();
                this._actorInfoWindow.refresh();
                this._spGaugeWindow.setActor(this._selectedActor);
                this.updateSkillDescription();
            }
        }
        this._talentListWindow.activate();
    };

    Scene_Menu.prototype.backToActorSelect = function() {
        this.closeFourWindows();
        this._talentStatusWindow.show();
        this._talentStatusWindow.activate();
    };

    Scene_Menu.prototype.closeTalentMenu = function() {
        if (this._talentStatusWindow) {
            this.removeWindow(this._talentStatusWindow);
            this._talentStatusWindow = null;
        }
        this.closeFourWindows();
        this._statusWindow.show();
        this._goldWindow.show();
        this._commandWindow.activate();
    };

    Scene_Menu.prototype.closeFourWindows = function() {
        if (this._skillDescriptionWindow) {
             this.removeWindow(this._skillDescriptionWindow); this._skillDescriptionWindow = null; 
        }
        if (this._actorInfoWindow) { 
            this.removeWindow(this._actorInfoWindow); this._actorInfoWindow = null; 
        }
        if (this._talentListWindow) { 
            this.removeWindow(this._talentListWindow); this._talentListWindow = null; 
        }
        if (this._spGaugeWindow) { 
            this.removeWindow(this._spGaugeWindow); this._spGaugeWindow = null; 
        }
    };

    Scene_Menu.prototype.lineHeight = function() {
        return Window_Base.prototype.lineHeight();
    };

    // ==============================================================================
    // 布局矩形定义 (Rect) - 【优化】去除空隙，Y=0
    // ==============================================================================

    // 1. 顶部技能描述窗口 (Y=0, 绝对顶格)
    Scene_Menu.prototype.skillDescriptionRect = function() {
        const lineHeight = this.lineHeight();
        const height = lineHeight * 2 + 32;
        
        // 修改说明：
        // 第二个数字 (0) 改为 -4 或 -8 (向上移动，消除缝隙)
        // 第四个变量 (height) 后面加上对应的数字 (补回高度，防止底部也跟着提上去)
        return new Rectangle(0, -4, Graphics.boxWidth, height + 4); 
    };

    // 2. 左侧角色信息窗口
    Scene_Menu.prototype.actorInfoRect = function() {
        const topRect = this.skillDescriptionRect();
        
        // 【修改这里】在后面减去 10 (或者更多)，让它往上提，消除黑缝
        const topY = topRect.height - 10; 
        
        // ...后续代码保持不变...
        const bottomHeight = 60; 
        const height = Graphics.boxHeight - topY - bottomHeight;
        const width = Math.floor(Graphics.boxWidth / 3);
        
        return new Rectangle(0, topY, width, height);
    };
    // 3. 右侧技能列表窗口
    Scene_Menu.prototype.skillListRect = function() {
        const topRect = this.skillDescriptionRect();
        const leftRect = this.actorInfoRect();
        
        // 【修改这里】保持和上面一样的数值 (例如 -10)
        const topY = topRect.height - 10;
        
        const height = leftRect.height;
        const width = Graphics.boxWidth - leftRect.width;

        return new Rectangle(leftRect.width, topY, width, height);
    };
    // 4. 底部SP进度条窗口 (紧接中间窗口)
    Scene_Menu.prototype.spGaugeRect = function() {
        const leftRect = this.actorInfoRect();
        const y = leftRect.y + leftRect.height;
        const height = Graphics.boxHeight - y;

        return new Rectangle(0, y, Graphics.boxWidth, height);
    };

    Scene_Menu.prototype.removeWindow = function(window) {
        if (window) {
            if (window.parent) window.parent.removeChild(window);
            if (window.destroy) window.destroy();
        }
    };

})();