/*:
 * @target MZ
 * @plugindesc [系统] 天赋菜单系统 - 完美重置版 (Final: Full Legacy Script Support)
 * @author Secmon & Gemini
 * @version 1.9.4
 *
 * @help
 * ============================================================================
 * 🌈 彩虹城堡完美重置版 - 天赋菜单专属 UI (v1.9.4)
 * ============================================================================
 * * 【本次补全 (v1.9.4)】：
 * 1. 完整脚本支持：
 * - 补全了 disableSkill 和 disableSkills 接口。
 * - 现在支持旧工程所有的激活、禁用、重置脚本指令。
 * * * 【脚本指令大全 (兼容旧版)】：
 * 1. 激活技能: 
 * $gameActors.actor(1).enableSkills([301, 302]);
 * 2. 禁用技能: 
 * $gameActors.actor(1).disableSkills([301, 302]);
 * 3. 修改SP上限: 
 * $gameActors.actor(1).setSpMax(150);
 * 4. 重置所有天赋: 
 * $gameActors.actor(1).initSkillStates();
 *
 * ============================================================================
 * @param CommandName
 * @text 菜单命令名称
 * @default 天赋
 * * @param InsertTarget
 * @text 插入位置
 * @desc 将天赋选项插入到哪个选项的【后面】？
 * @type select
 * @option 物品 (Item) 后面
 * @value item
 * @option 技能 (Skill) 后面
 * @value skill
 * @option 装备 (Equip) 后面
 * @value equip
 * @option 状态 (Status) 后面
 * @value status
 * @option 放在最底部
 * @value bottom
 * @default skill
 *
 * @param MaxColumns
 * @text 列表列数
 * @type number
 * @default 1
 *
 * @param DefaultSpMax
 * @text 默认SP上限
 * @type number
 * @default 100
 */

(() => {
    const pluginName = "Sec_TalentMenu";
    const params = PluginManager.parameters(pluginName);
    
    const cmdName = params.CommandName || "天赋";
    const insertTarget = params.InsertTarget || "skill"; 
    const maxColumns = Number(params.MaxColumns) || 1; 
    const defaultSpMax = Number(params.DefaultSpMax) || 100;

    // 属性图标配置
    const ICONS = {
        ATK: 76, DEF: 81, MAT: 64, MDF: 65, AGI: 82, LUK: 84
    };

    // ==============================================================================
    // 模块 1: 核心数据逻辑 (Game_Actor)
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
        if (target && (this.totalSpUsed() + cost) > this._spMax) {
            SoundManager.playBuzzer();
            return false;
        }
        this._skillStates[skillId] = target;
        return true;
    };

    Game_Actor.prototype.isSkillEnabled = function(skillId) {
        if (this._skillStates[skillId] === undefined) this._skillStates[skillId] = false;
        return this._skillStates[skillId];
    };

    Game_Actor.prototype.allSkills = function() {
        return this._skills.map(id => $dataSkills[id]).filter(skill => skill);
    };

    const _Game_Actor_skills = Game_Actor.prototype.skills;
    Game_Actor.prototype.skills = function() {
        return _Game_Actor_skills.call(this).filter(skill => this.isSkillEnabled(skill.id));
    };

    // ------------------------------------------------------------------------------
    // 【核心修复】完整移植旧版接口：支持所有脚本指令
    // ------------------------------------------------------------------------------
    
    // 1. 设置SP上限
    Game_Actor.prototype.setSpMax = function(newMax) {
        if (newMax > 0) {
            this._spMax = newMax;
            if (SceneManager._scene instanceof Scene_Menu && SceneManager._scene._actorInfoWindow) {
                SceneManager._scene._actorInfoWindow.refresh();
            }
        }
    };

    // 2. 重置所有天赋状态
    Game_Actor.prototype.initSkillStates = function() {
        this.allSkills().forEach(skill => {
            this._skillStates[skill.id] = false;
        });
        if (SceneManager._scene instanceof Scene_Menu && SceneManager._scene._talentListWindow) {
            SceneManager._scene._talentListWindow.refresh();
        }
    };

    // 3. 启用技能 (基础)
    Game_Actor.prototype.enableSkill = function(skillId) {
        if (!$dataSkills[skillId]) return false;
        this._skillStates[skillId] = true;
        
        // 刷新UI
        if (SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_Menu' && SceneManager._scene._talentListWindow) {
             SceneManager._scene._talentListWindow.refresh();
        }
        return true;
    };

    // 4. 启用技能 (数组兼容) - 修复你遇到的报错
    Game_Actor.prototype.enableSkills = function(skillIds) {
        if (Array.isArray(skillIds)) {
            let successCount = 0;
            skillIds.forEach(skillId => {
                if (this.enableSkill(skillId)) successCount++;
            });
            return successCount;
        } else if (typeof skillIds === 'number') {
            this.enableSkill(skillIds);
            return 1;
        }
        return 0;
    };

    // 5. 禁用技能 (基础) - 【本次新增补全】
    Game_Actor.prototype.disableSkill = function(skillId) {
        if (!$dataSkills[skillId]) return false;
        this._skillStates[skillId] = false;
        
        if (SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_Menu' && SceneManager._scene._talentListWindow) {
             SceneManager._scene._talentListWindow.refresh();
        }
        return true;
    };

    // 6. 禁用技能 (数组兼容) - 【本次新增补全】
    Game_Actor.prototype.disableSkills = function(skillIds) {
        if (Array.isArray(skillIds)) {
            let successCount = 0;
            skillIds.forEach(skillId => {
                if (this.disableSkill(skillId)) successCount++;
            });
            return successCount;
        } else if (typeof skillIds === 'number') {
            this.disableSkill(skillIds);
            return 1;
        }
        return 0;
    };
    // ------------------------------------------------------------------------------

    // ==============================================================================
    // 模块 2: UI 绘制基类 & 组件 (保持视觉效果完全不变)
    // ==============================================================================

    class Window_TalentBase extends Window_Base {
        initialize(rect) {
            super.initialize(rect);
            this.loadWindowskin();
            this.backOpacity = 255; 
            this.opacity = 255;
            this.padding = 12;
        }

        loadWindowskin() {
            this.windowskin = ImageManager.loadSystem("Battlewindow");
        }
    }

    // 1. 顶部：技能描述
    class Window_SkillDescription extends Window_TalentBase {
        setSkill(skill) {
            this._skill = skill;
            this.refresh();
        }

        refresh() {
            this.contents.clear();
            if (!this._skill) return;
            
            let text = this._skill.meta.skillStory || this._skill.description;
            this.resetFontSettings();
            this.contents.fontSize = 22; 
            
            if (this._skill.meta.skillStory) {
                this.changeTextColor("#FFD700");
            } else {
                this.resetTextColor();
            }
            this.drawTextEx(text, 12, 12, this.innerWidth - 24);
        }
    }

    // 2. 左侧：角色信息窗口
    class Window_ActorInfo extends Window_TalentBase {
        setActor(actor) {
            this._actor = actor;
            this.refresh();
        }
        
        drawFaceFrame(x, y, s) {
            this.contents.fillRect(x, y, s, s, "rgba(0, 0, 0, 0.5)");
            this.contents.strokeRect(x, y, s, s, "rgba(255, 215, 0, 0.9)");
            this.contents.strokeRect(x - 1, y - 1, s + 2, s + 2, "rgba(0, 0, 0, 0.6)");
            this.contents.strokeRect(x + 2, y + 2, s - 4, s - 4, "rgba(255, 255, 255, 0.1)"); 
        }

        refresh() {
            this.contents.clear();
            if (!this._actor) return;

            const width = this.innerWidth;
            const cx = width / 2;
            let cy = 8;

            // --- 区域 1: 头像 ---
            const faceSize = 110; 
            this.drawFaceFrame(cx - faceSize/2, cy, faceSize);
            this.drawFace(this._actor.faceName(), this._actor.faceIndex(), cx - faceSize/2, cy, faceSize, faceSize);
            cy += faceSize + 12;

            // --- 区域 2: 名字 ---
            this.contents.fontSize = 26;
            this.contents.fontBold = true;
            this.changeTextColor("#FFD700");
            this.drawText(this._actor.name(), 0, cy, width, "center");
            cy += 36;
            this.contents.fontBold = false;

            // --- 区域 3: 等级职业 ---
            const classText = `Lv.${this._actor.level} ${this._actor.currentClass().name}`;
            this.contents.fontSize = 18;
            this.changeTextColor("#00FFFF");
            this.drawText(classText, 0, cy, width, "center");
            cy += 32;

            // 分割线
            this.drawHorzLine(cy);
            cy += 16;

            // --- 区域 4: SP 能量 ---
            this.drawSpSection(0, cy, width);
            cy += 72; 

            // 分割线
            this.drawHorzLine(cy);
            cy += 16;

            // --- 区域 5: 属性列表 ---
            const remainingHeight = this.innerHeight - cy;
            const listHeight = 6 * 36;
            let paddingY = 0;
            if (remainingHeight > listHeight) {
                paddingY = (remainingHeight - listHeight) / 2;
            }
            this.drawStatsList(0, cy + paddingY, width);
        }

        drawHorzLine(y) {
            this.contents.fillRect(10, y, this.innerWidth - 20, 2, "rgba(255,255,255,0.2)");
        }

        drawSpSection(x, y, width) {
            this.changeTextColor(ColorManager.systemColor());
            this.contents.fontSize = 18;
            this.drawText("天赋能量 (SP)", x + 6, y, width);
            
            const barY = y + 36; 
            const barH = 20; 
            const used = this._actor.totalSpUsed();
            const max = this._actor._spMax;
            const rate = max > 0 ? Math.min(used / max, 1) : 0;

            this.contents.fillRect(x + 4, barY, width - 8, barH, "#111");
            this.contents.strokeRect(x + 3, barY - 1, width - 6, barH + 2, "#444");

            const color1 = used > max ? "#ff4444" : "#4d96ff";
            const color2 = used > max ? "#ff8888" : "#00FFFF";
            const fillWidth = Math.floor((width - 8) * rate);
            
            if (fillWidth > 0) {
                this.contents.gradientFillRect(x + 4, barY, fillWidth, barH, color1, color2);
            }

            this.contents.fontSize = 16;
            this.changeTextColor("#fff");
            this.drawText(`${used} / ${max}`, x, barY, width, "center");
        }

        drawStatsList(x, y, width) {
            const startY = y;
            const itemH = 36; 
            
            const paramsToShow = [
                { id: 2, icon: ICONS.ATK }, 
                { id: 3, icon: ICONS.DEF }, 
                { id: 4, icon: ICONS.MAT }, 
                { id: 5, icon: ICONS.MDF }, 
                { id: 6, icon: ICONS.AGI }, 
                { id: 7, icon: ICONS.LUK }  
            ];

            for (let i = 0; i < paramsToShow.length; i++) {
                const p = paramsToShow[i];
                const py = startY + i * itemH;

                if (i % 2 === 0) {
                    this.contents.fillRect(x, py, width, itemH, "rgba(255, 255, 255, 0.05)");
                }

                this.drawIcon(p.icon, x + 8, py + 2);

                const name = TextManager.param(p.id);
                this.contents.fontSize = 20;
                this.changeTextColor(ColorManager.systemColor());
                this.drawText(name, x + 46, py, 120);

                this.resetTextColor();
                const val = this._actor.param(p.id);
                this.drawText(val, x, py, width - 12, "right");
            }
        }
    }

    // 3. 右侧：技能列表
    class Window_TalentList extends Window_Selectable {
        initialize(rect) {
            super.initialize(rect);
            this.loadWindowskin();
            this.backOpacity = 255;
            this.opacity = 255;
            this._actor = null;
            this._data = [];
        }

        loadWindowskin() {
            this.windowskin = ImageManager.loadSystem("Battlewindow");
        }

        setActor(actor) {
            this._actor = actor;
            this.refresh();
        }

        maxCols() { return maxColumns; }
        itemHeight() { return 52; } 

        maxItems() { return this._data ? this._data.length : 0; }
        item() { return this._data[this.index()]; }

        refresh() {
            this._data = this._actor ? this._actor.allSkills() : [];
            this.createContents();
            super.refresh();
        }

        drawItem(index) {
            const skill = this._data[index];
            if (!skill) return;
            const rect = this.itemRect(index);
            const enabled = this._actor.isSkillEnabled(skill.id);
            
            if (index === this.index()) {
                const c1 = "rgba(255, 215, 0, 0.2)"; 
                const c2 = "rgba(0, 0, 0, 0)";
                this.contents.gradientFillRect(rect.x, rect.y, rect.width, rect.height, c1, c2);
                this.contents.strokeRect(rect.x, rect.y, rect.width, rect.height, "rgba(255, 215, 0, 0.5)");
            }

            this.drawIcon(skill.iconIndex, rect.x + 4, rect.y + 10);

            const nameX = rect.x + 42;
            const nameY = rect.y + 2;
            
            this.contents.fontSize = 20;
            this.contents.fontBold = true;
            this.changeTextColor(enabled ? "#FFD700" : "#999"); 
            this.drawText(skill.name, nameX, nameY, 200);
            this.contents.fontBold = false;

            const spCost = this._actor.getSpCost(skill.id);
            this.contents.fontSize = 16;
            this.changeTextColor("#54a0ff");
            this.drawText(`SP: ${spCost}`, nameX, nameY + 24, 100);

            const statusText = enabled ? "★已激活" : "○未激活";
            const statusColor = enabled ? "#6bc547" : "#555";
            this.changeTextColor(statusColor);
            this.drawText(statusText, rect.width - 90, rect.y + 12, 80, "right");
        }

        select(index) {
            super.select(index);
            this.refresh(); 
        }
    }

    // 4. 底部：页脚
    class Window_TalentFooter extends Window_TalentBase {
        refresh() {
            this.contents.clear();
            this.changeTextColor("rgba(255,255,255,0.6)");
            this.contents.fontSize = 18;
            const text = "按 [确定] 键切换激活状态 / 按 [取消] 键返回";
            const textHeight = 24; 
            const y = (this.innerHeight - textHeight) / 2;
            this.drawText(text, 0, y, this.innerWidth, "center");
        }
    }

    // ==============================================================================
    // 模块 3: 场景布局逻辑 (新增：排序逻辑)
    // ==============================================================================

    const _Window_MenuCommand_makeCommandList = Window_MenuCommand.prototype.makeCommandList;
    Window_MenuCommand.prototype.makeCommandList = function() {
        _Window_MenuCommand_makeCommandList.call(this);
        
        // --- 排序逻辑 ---
        const command = { name: cmdName, symbol: "talent", enabled: true, ext: null };
        
        if (insertTarget === "bottom") {
            // 直接加在最后
            this.addCommand(cmdName, "talent", true);
        } else {
            // 查找目标位置
            const index = this._list.findIndex(cmd => cmd.symbol === insertTarget);
            if (index >= 0) {
                // 插入到目标后面 (index + 1)
                this._list.splice(index + 1, 0, command);
            } else {
                // 如果找不到目标，就加在最后保底
                this.addCommand(cmdName, "talent", true);
            }
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
        // 指令窗口不隐藏，保持在左侧
        
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
        this.createTalentLayout();
        this._talentListWindow.activate();
        this._talentListWindow.select(0);
        this.updateTalentInfo();
    };

    Scene_Menu.prototype.createTalentLayout = function() {
        if (this._commandWindow) this._commandWindow.hide();
        if (this._goldWindow) this._goldWindow.hide();

        const screenW = Graphics.boxWidth; 
        const screenH = Graphics.boxHeight; 
        
        const topH = 140;   
        const footH = 60;   
        const mainH = screenH - topH - footH; 
        
        const leftW = 190;
        const rightW = screenW - leftW;

        this._skillDescWindow = new Window_SkillDescription(new Rectangle(0, 0, screenW, topH));
        this.addWindow(this._skillDescWindow);

        this._actorInfoWindow = new Window_ActorInfo(new Rectangle(0, topH, leftW, mainH));
        this._actorInfoWindow.setActor(this._selectedActor);
        this.addWindow(this._actorInfoWindow);

        this._talentListWindow = new Window_TalentList(new Rectangle(leftW, topH, rightW, mainH));
        this._talentListWindow.setActor(this._selectedActor);
        this._talentListWindow.setHandler("ok", this.onTalentToggle.bind(this));
        this._talentListWindow.setHandler("cancel", this.exitTalentLayout.bind(this));
        this._talentListWindow.setHandler("cursorMoved", this.updateTalentInfo.bind(this));
        this.addWindow(this._talentListWindow);

        this._footerWindow = new Window_TalentFooter(new Rectangle(0, screenH - footH, screenW, footH));
        this._footerWindow.refresh();
        this.addWindow(this._footerWindow);
    };

    Scene_Menu.prototype.updateTalentInfo = function() {
        if (!this._talentListWindow) return;
        const skill = this._talentListWindow.item();
        if (this._skillDescWindow) this._skillDescWindow.setSkill(skill);
    };

    Scene_Menu.prototype.onTalentToggle = function() {
        const skill = this._talentListWindow.item();
        if (skill && this._selectedActor) {
            const success = this._selectedActor.toggleSkill(skill.id);
            if (success) {
                SoundManager.playUseSkill();
                this._talentListWindow.refresh();
                this._actorInfoWindow.refresh();
            }
        }
        this._talentListWindow.activate();
    };

    Scene_Menu.prototype.exitTalentLayout = function() {
        this._skillDescWindow.destroy();
        this._actorInfoWindow.destroy();
        this._talentListWindow.destroy();
        this._footerWindow.destroy();
        
        this._skillDescWindow = null;
        this._actorInfoWindow = null;
        this._talentListWindow = null;
        this._footerWindow = null;

        this._talentStatusWindow.show();
        this._talentStatusWindow.activate();

        if (this._commandWindow) {
            this._commandWindow.show();
            this._commandWindow.deactivate();
        }
        if (this._goldWindow) {
            this._goldWindow.show();
        }
    };

    Scene_Menu.prototype.closeTalentMenu = function() {
        this._talentStatusWindow.destroy();
        this._talentStatusWindow = null;
        
        this._statusWindow.show();
        this._goldWindow.show();
        if(this._commandWindow) {
            this._commandWindow.show();
            this._commandWindow.activate();
        }
    };

})();