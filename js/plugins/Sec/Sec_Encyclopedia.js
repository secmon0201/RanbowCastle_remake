/*:
 * @target MZ
 * @plugindesc [Sec] 综合图鉴系统 (最终完整版)
 * @author Secmon
 * 
 * @param menuCommandName
 * @text 主菜单显示名称
 * @desc 在主菜单中显示的命令名称。
 * @default 图鉴
 * 
 * 
 * @help
 * ============================================================================
 * Sec_Encyclopedia.js
 * ============================================================================
 * 专为 480x720 竖屏游戏设计的图鉴系统。
 * 支持：人物、技能、帮助、敌人解锁、自定义文本追加。
 *
 * ============================================================================
 * 资源目录规范 (必须遵守)
 * ============================================================================
 * 请确保以下文件夹存在，并放入对应图片：
 * img/pictures/Encyclopedia/
 * * 1. 角色立绘: Actor_{ID}.png (例如 Actor_1.png)
 * 2. 帮助图片: 自定义文件名.png (在指令中填写文件名)
 * 3. 敌人图片: 自动读取数据库设置，无需额外放入。
 *
 * ============================================================================
 * 方法一：插件指令 (推荐)
 * ============================================================================
 * 在事件编辑器中选择“插件指令”，选择 Sec_Encyclopedia 即可看到中文菜单。
 * * - 打开图鉴
 * - 解锁角色/敌人/技能
 * - 追加角色/技能描述 (支持 \n 换行)
 * - 注册帮助/设置帮助内容
 *
 * ============================================================================
 * 方法二：脚本调用 (高级用法)
 * ============================================================================
 * 如果你需要在脚本框或条件分支中使用，请参考以下代码：
 *
 * 1. 打开图鉴
 * Encyclopedia.open();
 *
 * 2. 解锁操作 (ID为数字)
 * Encyclopedia.unlockActor(1);      // 解锁角色 1
 * Encyclopedia.unlockEnemy(20);     // 解锁敌人 20
 * Encyclopedia.unlockSkill(5);      // 解锁技能 5
 *
 * 3. 追加文本 (支持 \n 换行)
 * Encyclopedia.addActorText(1, "这是第一行\n这是第二行");
 * Encyclopedia.addSkillText(5, "这是技能的隐藏攻略...");
 *
 * 4. 帮助系统配置
 * // 注册一个条目 (key是唯一英文标识, title是中文标题)
 * Encyclopedia.registerHelp("guide_01", "新手指南");
 * * // 设置内容 (key, 图片名, 文字内容)
 * Encyclopedia.setHelpContent("guide_01", "Help_Image", "这是帮助正文。");
 * * // 如果不需要图片，图片名留空字符串 ""
 * Encyclopedia.setHelpContent("guide_02", "", "纯文字帮助。");
 *
 * ============================================================================
 * @command open
 * @text 打开图鉴
 * @desc 打开图鉴场景。
 *
 * @command unlockActor
 * @text [解锁] 角色
 * @desc 解锁指定角色的图鉴条目。
 * @arg id
 * @type actor
 * @text 选择角色
 * @desc 选择要解锁的角色。
 *
 * @command unlockEnemy
 * @text [解锁] 敌人
 * @desc 解锁指定敌人的图鉴条目。
 * @arg id
 * @type enemy
 * @text 选择敌人
 * @desc 选择要解锁的敌人。
 *
 * @command unlockSkill
 * @text [解锁] 技能
 * @desc 解锁指定技能的图鉴条目。
 * @arg id
 * @type skill
 * @text 选择技能
 * @desc 选择要解锁的技能。
 *
 * @command addActorText
 * @text [文本] 追加角色描述
 * @desc 给角色追加一段剧情或备注文本。
 * @arg id
 * @type actor
 * @text 目标角色
 * @arg text
 * @type note
 * @text 描述内容
 * @desc 支持 \n 换行。
 *
 * @command addSkillText
 * @text [文本] 追加技能描述
 * @desc 给技能追加一段攻略或备注文本。
 * @arg id
 * @type skill
 * @text 目标技能
 * @arg text
 * @type note
 * @text 描述内容
 * @desc 支持 \n 换行。
 *
 * @command registerHelp
 * @text [帮助] 注册新条目
 * @desc 在“帮助”栏目中增加一个新的列表项。
 * @arg key
 * @type string
 * @text 唯一ID (Key)
 * @desc 英文标识符，用于后续绑定内容 (例如: guide_01)
 * @arg title
 * @type string
 * @text 显示标题
 * @desc 列表中显示的中文标题 (例如: 战斗操作指南)
 *
 * @command setHelpContent
 * @text [帮助] 设置详细内容
 * @desc 为已注册的帮助条目设置图片和文字。
 * @arg key
 * @type string
 * @text 对应ID (Key)
 * @desc 必须与注册时填写的ID一致。
 * @arg image
 * @type string
 * @text 图片文件名
 * @desc 位于 img/pictures/Encyclopedia/ 下的文件名(不带后缀)。留空则不显示。
 * @arg text
 * @type note
 * @text 帮助正文
 * @desc 详细说明文字，支持滚动查看。
 *
 * ============================================================================
 *
 *
 */

(() => {
    const pluginName = "Sec_Encyclopedia";
    const parameters = PluginManager.parameters(pluginName);
    const menuCommandName = parameters['menuCommandName'] || "图鉴";

    //=============================================================================
    // Data Manager
    //=============================================================================

    const _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this._encyclopedia = null;
    };

    class EncyclopediaManager {
        static get data() {
            if (!$gameSystem._encyclopedia) {
                $gameSystem._encyclopedia = {
                    unlockedActors: [],
                    unlockedEnemies: [],
                    unlockedSkills: [],
                    customTexts: { actor: {}, skill: {} },
                    helps: []
                };
            }
            return $gameSystem._encyclopedia;
        }
        
        static open() { SceneManager.push(Scene_Encyclopedia); }
        static unlockActor(id) { if (!this.data.unlockedActors.includes(id)) this.data.unlockedActors.push(id); }
        static unlockEnemy(id) { if (!this.data.unlockedEnemies.includes(id)) this.data.unlockedEnemies.push(id); }
        static unlockSkill(id) { if (!this.data.unlockedSkills.includes(id)) this.data.unlockedSkills.push(id); }
        
        static addActorText(id, t) { 
            if (!this.data.customTexts.actor[id]) this.data.customTexts.actor[id] = [];
            if (!this.data.customTexts.actor[id].includes(t)) this.data.customTexts.actor[id].push(t);
        }
        
        static addSkillText(id, t) {
            if (!this.data.customTexts.skill[id]) this.data.customTexts.skill[id] = [];
            if (!this.data.customTexts.skill[id].includes(t)) this.data.customTexts.skill[id].push(t);
        }
        
        static registerHelp(key, title) {
            const existing = this.data.helps.find(h => h.key === key);
            if (!existing) this.data.helps.push({ key: key, title: title, image: "", text: "" });
        }
        
        static setHelpContent(key, img, text) {
            const item = this.data.helps.find(h => h.key === key);
            if (item) { item.image = img; item.text = text; }
        }
    }
    window.Encyclopedia = EncyclopediaManager;

    //=============================================================================
    // Plugin Commands
    //=============================================================================
    
    PluginManager.registerCommand(pluginName, "open", () => Encyclopedia.open());
    PluginManager.registerCommand(pluginName, "unlockActor", args => Encyclopedia.unlockActor(Number(args.id)));
    PluginManager.registerCommand(pluginName, "unlockEnemy", args => Encyclopedia.unlockEnemy(Number(args.id)));
    PluginManager.registerCommand(pluginName, "unlockSkill", args => Encyclopedia.unlockSkill(Number(args.id)));
    
    PluginManager.registerCommand(pluginName, "addActorText", args => {
        const text = args.text ? args.text.replace(/\\n/g, "\n") : "";
        Encyclopedia.addActorText(Number(args.id), text);
    });
    PluginManager.registerCommand(pluginName, "addSkillText", args => {
        const text = args.text ? args.text.replace(/\\n/g, "\n") : "";
        Encyclopedia.addSkillText(Number(args.id), text);
    });

    PluginManager.registerCommand(pluginName, "registerHelp", args => {
        Encyclopedia.registerHelp(String(args.key), String(args.title));
    });

    PluginManager.registerCommand(pluginName, "setHelpContent", args => {
        const text = args.text ? args.text.replace(/\\n/g, "\n") : "";
        Encyclopedia.setHelpContent(String(args.key), args.image || "", text);
    });

    //=============================================================================
    // Scene Implementation
    //=============================================================================

    class Scene_Encyclopedia extends Scene_MenuBase {
        create() {
            super.create();
            this.createCategoryWindow();
            this.createListWindow();
            this.createVisualWindow();
            this.createDescWindow();
            this._categoryWindow.activate();
            this._categoryWindow.select(0);
            this.onCategoryChange();
        }

        needsCancelButton() { return false; }

        createCategoryWindow() {
            const rect = new Rectangle(0, 0, Graphics.boxWidth, this.calcWindowHeight(1, true));
            this._categoryWindow = new Window_EncyclopediaCategory(rect);
            this._categoryWindow.setHandler("ok", this.onCategoryOk.bind(this));
            this._categoryWindow.setHandler("cancel", this.popScene.bind(this));
            this._categoryWindow.setHandler("change", this.onCategoryChange.bind(this));
            this.addWindow(this._categoryWindow);
        }

        createListWindow() {
            const wy = this._categoryWindow.y + this._categoryWindow.height;
            const rect = new Rectangle(0, wy, Math.floor(Graphics.boxWidth * 0.35), Graphics.boxHeight - wy);
            this._listWindow = new Window_EncyclopediaList(rect);
            this._listWindow.setHandler("ok", this.onListOk.bind(this));
            this._listWindow.setHandler("cancel", this.onListCancel.bind(this));
            this.addWindow(this._listWindow);
        }

        createVisualWindow() {
            const wx = this._listWindow.width;
            const wy = this._listWindow.y;
            const rect = new Rectangle(wx, wy, Graphics.boxWidth - wx, Math.floor((Graphics.boxHeight - wy) * 0.45));
            this._visualWindow = new Window_EncyclopediaVisual(rect);
            this.addWindow(this._visualWindow);
            this._listWindow.setVisualWindow(this._visualWindow);
        }

        createDescWindow() {
            const wx = this._visualWindow.x;
            const wy = this._visualWindow.y + this._visualWindow.height;
            const rect = new Rectangle(wx, wy, this._visualWindow.width, Graphics.boxHeight - wy);
            this._descWindow = new Window_EncyclopediaDesc(rect);
            this._descWindow.setCancelHandler(this.onDescCancel.bind(this));
            this.addWindow(this._descWindow);
            this._listWindow.setDescWindow(this._descWindow);
        }

        onCategoryOk() {
            this.onCategoryChange();
            this._listWindow.activate();
            this._listWindow.select(0);
        }

        onCategoryChange() {
            const symbol = this._categoryWindow.currentSymbol();
            if (symbol) {
                this.adjustWindowLayout(symbol);
                this._listWindow.setCategory(symbol);
                this._listWindow.deselect();
                this._visualWindow.clear();
                this._descWindow.clear();
            }
        }

        adjustWindowLayout(symbol) {
            const wx = this._listWindow.width;
            const wy = this._listWindow.y;
            const ww = Graphics.boxWidth - wx;
            const totalH = Graphics.boxHeight - wy;

            // 智能布局：技能界面右上角只占 28%，其他占 45%
            let ratio = 0.45;
            if (symbol === 'skill') {
                ratio = 0.28;
            }

            const vh = Math.floor(totalH * ratio);
            const dh = totalH - vh;

            this._visualWindow.move(wx, wy, ww, vh);
            this._descWindow.move(wx, wy + vh, ww, dh);
        }

        onListCancel() {
            this._listWindow.deselect();
            this._categoryWindow.activate();
            this._visualWindow.clear();
            this._descWindow.clear();
        }

        onListOk() {
            this._listWindow.deactivate();
            this._descWindow.activate();
            SoundManager.playOk();
        }

        onDescCancel() {
            this._descWindow.deactivate();
            this._listWindow.activate();
        }
    }

    //=============================================================================
    // Windows
    //=============================================================================

    class Window_EncyclopediaCategory extends Window_HorzCommand {
        makeCommandList() {
            this.addCommand("人物", "character");
            this.addCommand("技能", "skill");
            this.addCommand("帮助", "help");
        }
        windowWidth() { return Graphics.boxWidth; }
        maxCols() { return 3; }
        itemTextAlign() { return "center"; }
    }

    class Window_EncyclopediaList extends Window_Selectable {
        initialize(rect) {
            super.initialize(rect);
            this._category = "";
            this._data = [];
        }
        setCategory(category) {
            this._category = category;
            this.refresh();
            this.scrollTo(0, 0);
        }
        setVisualWindow(win) { this._visualWindow = win; }
        setDescWindow(win) { this._descWindow = win; }
        maxCols() { return 1; }
        resetFontSettings() { super.resetFontSettings(); this.contents.fontSize = 20; }
        itemHeight() { return Math.floor(this.lineHeight() * 0.9); }
        refresh() { this.makeItemList(); this.createContents(); this.drawAllItems(); }
        
        makeItemList() {
            this._data = [];
            const sys = Encyclopedia.data;
            if (this._category === "character") {
                for (let i = 1; i < $dataActors.length; i++) {
                    const actor = $dataActors[i];
                    if (!actor) continue;
                    if ($gameParty.allMembers().some(m => m.actorId() === i) || sys.unlockedActors.includes(i))
                        this._data.push({ type: 'actor', item: actor });
                }
                for (const id of sys.unlockedEnemies) {
                    const enemy = $dataEnemies[id];
                    if (enemy) this._data.push({ type: 'enemy', item: enemy });
                }
            } else if (this._category === "skill") {
                const skillIds = new Set();
                $gameParty.allMembers().forEach(actor => { actor.skills().forEach(s => skillIds.add(s.id)); });
                sys.unlockedSkills.forEach(id => skillIds.add(id));
                const sortedIds = Array.from(skillIds).sort((a, b) => a - b);
                for (const id of sortedIds) {
                    const skill = $dataSkills[id];
                    if (skill && skill.name) this._data.push({ type: 'skill', item: skill });
                }
            } else if (this._category === "help") {
                this._data = sys.helps;
            }
        }
        maxItems() { return this._data ? this._data.length : 0; }
        drawItem(index) {
            const item = this._data[index];
            if (!item) return;
            const rect = this.itemLineRect(index);
            const name = (this._category === "help") ? item.title : item.item.name;
            this.changePaintOpacity(true);
            this.drawText(name, rect.x, rect.y + (rect.height - this.lineHeight())/2, rect.width);
        }
        select(index) {
            super.select(index);
            const item = (this._data && index >= 0) ? this._data[index] : null;
            if (this._visualWindow) this._visualWindow.setItem(item);
            if (this._descWindow) this._descWindow.setItem(item);
        }
    }

    class Window_EncyclopediaVisual extends Window_Base {
        initialize(rect) { super.initialize(rect); this._itemEntry = null; }
        resetFontSettings() { super.resetFontSettings(); this.contents.fontSize = 20; }
        lineHeight() { return 30; }

        setItem(entry) { this._itemEntry = entry; this.refresh(); }
        clear() { this._itemEntry = null; this.contents.clear(); }
        
        refresh() {
            this.contents.clear();
            if (!this._itemEntry) return;
            const entry = this._itemEntry;
            if (entry.type === 'skill') this.drawSkillInfo(entry.item);
            else if (entry.type === 'actor') this.drawActorInfo(entry.item);
            else if (entry.type === 'enemy') this.drawEnemyInfo(entry.item);
            else if (entry.key) this.drawHelpInfo(entry);
        }

        drawSkillInfo(skill) {
            const w = this.contentsWidth();
            let y = 0;
            const lh = this.lineHeight();
            
            // 技能名
            this.drawIcon(skill.iconIndex, 0, y + 2);
            this.contents.fontSize += 6;
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(skill.name, ImageManager.iconWidth + 12, y, w - 50);
            this.resetTextColor();
            this.contents.fontSize -= 6;
            y += lh + 4;
            
            this.drawRect(0, y, w, 2);
            y += 6;
            
            // 属性
            const hitType = ["必中", "物理", "魔法"][skill.hitType] || "必中";
            const elName = $dataSystem.elements[skill.damage.elementId] || "无";
            let cost = "";
            if (skill.mpCost > 0) cost += `MP:${skill.mpCost} `;
            if (skill.tpCost > 0) cost += `TP:${skill.tpCost}`;
            this.changeTextColor(ColorManager.textColor(14));
            this.drawText(`[${hitType}] 属性: ${elName}  ${cost||"无消耗"}`, 0, y, w);
            this.resetTextColor();
            y += lh + 4;
            
            // 技能描述 (只展示数据库中的简短描述)
            this.drawTextEx(skill.description, 0, y, w);
        }
        
        drawActorInfo(a) { this.loadImage("Actor_" + a.id); }
        drawEnemyInfo(e) { 
            const bmp = ImageManager.loadEnemy(e.battlerName, e.battlerHue);
            bmp.addLoadListener(() => this.drawFit(bmp));
        }
        drawHelpInfo(h) { if (h.image) this.loadImage(h.image); }
        loadImage(n) { 
            const bmp = ImageManager.loadBitmap("img/pictures/Encyclopedia/", n);
            bmp.addLoadListener(() => this.drawFit(bmp));
        }
        drawFit(bmp) {
            const w = this.contentsWidth(), h = this.contentsHeight();
            if (bmp.width <=0) return;
            const r = Math.min(w/bmp.width, h/bmp.height, 1);
            const dw = Math.floor(bmp.width * r), dh = Math.floor(bmp.height * r);
            this.contents.blt(bmp, 0, 0, bmp.width, bmp.height, (w-dw)/2, (h-dh)/2, dw, dh);
        }
        drawRect(x, y, w, h) { this.contents.fillRect(x, y, w, h, ColorManager.textColor(8)); }
    }

    class Window_EncyclopediaDesc extends Window_Base {
        initialize(rect) {
            super.initialize(rect);
            this._itemEntry = null;
            this._cancelHandler = null;
            this._isActive = false;
            
            this._scrollY = 0;       
            this._maxScrollY = 0;    
            this._touching = false;
            this._lastTouchY = 0;
            this.hide();
            this.show();
        }

        setCancelHandler(method) { this._cancelHandler = method; }
        resetFontSettings() { super.resetFontSettings(); this.contents.fontSize = 18; }
        lineHeight() { return 26; }
        
        activate() { this._isActive = true; this.opacity = 255; }
        deactivate() { this._isActive = false; this.opacity = 192; }
        isActive() { return this._isActive; }

        setItem(entry) {
            this._itemEntry = entry;
            this.refresh();
        }

        clear() {
            this._itemEntry = null;
            this.contents.clear();
            this._scrollY = 0;
            this.origin.y = 0;
            this._maxScrollY = 0;
        }

        refresh() {
            if (!this._itemEntry) {
                this.contents.clear();
                this.changeTextColor(ColorManager.textColor(7));
                if(this._itemEntry && this._itemEntry.type !== 'skill')
                   this.drawText("暂无详细记录...", 0, 0, this.contentsWidth(), "center");
                this.resetTextColor();
                return;
            }

            const sys = Encyclopedia.data;
            let textArray = [];
            if (this._itemEntry.type === 'actor') textArray = sys.customTexts.actor[this._itemEntry.item.id];
            else if (this._itemEntry.type === 'skill') textArray = sys.customTexts.skill[this._itemEntry.item.id];
            else if (this._itemEntry.key) textArray = [this._itemEntry.text];

            if (!textArray || textArray.length === 0) {
                this.contents.clear();
                if (this._itemEntry.type !== 'skill') {
                    this.changeTextColor(ColorManager.textColor(7));
                    this.drawText("暂无详细记录...", 0, 0, this.contentsWidth(), "center");
                    this.resetTextColor();
                }
                this._maxScrollY = 0;
                return;
            }

            const fullText = textArray.join("\n\n");
            const textState = this.textSizeEx(fullText);
            const contentH = textState.height + 40;
            const visibleH = this.contentsHeight();
            
            this._maxScrollY = Math.max(0, contentH - visibleH);
            this._scrollY = 0;
            this.origin.y = 0;

            if (this.contents) this.contents.destroy();
            this.contents = new Bitmap(this.contentsWidth(), Math.max(contentH, visibleH));
            this.resetFontSettings();
            this.drawTextEx(fullText, 0, 0, this.contentsWidth());
        }

        update() {
            super.update();
            this.processInput();
            this.processTouch();
            this.updateScrollOrigin();
            this.drawScrollBar(); 
        }

        updateScrollOrigin() {
            if (this.origin.y !== this._scrollY) {
                this.origin.y = this._scrollY;
            }
        }

        processInput() {
            if (!this.isActive()) return;
            if (Input.isPressed("up")) this.applyScroll(-5);
            if (Input.isPressed("down")) this.applyScroll(5);
            if (Input.isTriggered("cancel") || TouchInput.isCancelled()) {
                SoundManager.playCancel();
                if (this._cancelHandler) this._cancelHandler();
            }
        }

        processTouch() {
            if (!this.isActive()) return;
            if (TouchInput.wheelY !== 0) this.applyScroll(TouchInput.wheelY);
            if (TouchInput.isTriggered()) {
                const x = TouchInput.x;
                const y = TouchInput.y;
                if (x >= this.x && x < this.x + this.width &&
                    y >= this.y && y < this.y + this.height) {
                    this._touching = true;
                    this._lastTouchY = y;
                }
            } else if (TouchInput.isPressed() && this._touching) {
                const dy = this._lastTouchY - TouchInput.y;
                this.applyScroll(dy);
                this._lastTouchY = TouchInput.y;
            } else {
                this._touching = false;
            }
        }

        applyScroll(delta) {
            if (this._maxScrollY <= 0) return;
            this._scrollY += delta;
            if (this._scrollY < 0) this._scrollY = 0;
            if (this._scrollY > this._maxScrollY) this._scrollY = this._maxScrollY;
        }

        drawScrollBar() {
            if (!this._scrollBarSprite) {
                this._scrollBarSprite = new Sprite();
                this._scrollBarSprite.bitmap = new Bitmap(6, 1);
                this.addChild(this._scrollBarSprite); 
                this._scrollBarSprite.x = this.width - 16;
                this._scrollBarSprite.y = 0;
            }
            const sprite = this._scrollBarSprite;
            if (sprite.bitmap.height !== this.height) {
                sprite.bitmap = new Bitmap(6, this.height);
            }
            sprite.bitmap.clear();

            if (this._maxScrollY <= 0) return; 

            const visibleH = this.contentsHeight(); 
            const contentH = visibleH + this._maxScrollY; 
            
            let barH = visibleH * (visibleH / contentH);
            if (barH < 30) barH = 30; 

            const scrollPercent = this._scrollY / this._maxScrollY;
            const barY = this.padding + scrollPercent * (visibleH - barH);

            sprite.bitmap.fillRect(0, barY, 6, barH, 'rgba(255,255,255,0.7)');
        }
    }

    //=============================================================================
    // Main Menu Integration
    //=============================================================================
    const _Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
    Window_MenuCommand.prototype.addOriginalCommands = function() {
        _Window_MenuCommand_addOriginalCommands.call(this);
        this.addCommand(menuCommandName, "encyclopedia", true);
    };

    const _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        _Scene_Menu_createCommandWindow.call(this);
        this._commandWindow.setHandler("encyclopedia", () => SceneManager.push(Scene_Encyclopedia));
    };

})();