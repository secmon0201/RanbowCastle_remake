/*:
 * @target MZ
 * @plugindesc [系统] 综合图鉴 Plus - 自动记录入队角色 & Menu背景
 * @author Secmon (Optimized by Gemini)
 * * @param menuCommandName
 * @text 主菜单显示名称
 * @desc 在主菜单中显示的命令名称。
 * @default 图鉴
 * * @help
 * ============================================================================
 * Sec_Encyclopedia_Plus.js
 * ============================================================================
 * 专为 480x854 竖屏游戏设计。
 * * 【新增特性】
 * ★ 自动记录：只要角色加入过队伍（无论是初始还是中途加入），
 * 即使离队，图鉴也会永久保留该角色信息。
 * * 【核心特性】
 * 1. 只显示已解锁条目（不显示 ???）。
 * 2. 强制使用 img/pictures/Menu.png 作为背景。
 * 3. 强制使用 img/system/BattleWindow.png 作为窗口皮肤。
 * * 【资源规范】
 * 1. 背景图: img/pictures/Menu.png
 * 2. 窗口皮肤: img/system/BattleWindow.png
 * 3. 图鉴图片: img/pictures/Encyclopedia/
 * - 角色: Actor_{ID}.png
 * * ============================================================================
 * @command open
 * @text 打开图鉴
 * @desc 打开图鉴场景。
 *
 * @command unlockActor
 * @text [解锁] 角色
 * @desc (通常无需手动调用) 手动解锁指定角色的图鉴条目。
 * @arg id
 * @type actor
 * @text 选择角色
 *
 * @command unlockEnemy
 * @text [解锁] 敌人
 * @desc 解锁指定敌人的图鉴条目。
 * @arg id
 * @type enemy
 * @text 选择敌人
 *
 * @command unlockSkill
 * @text [解锁] 技能
 * @desc 解锁指定技能的图鉴条目。
 * @arg id
 * @type skill
 * @text 选择技能
 *
 * @command addActorText
 * @text [文本] 追加角色描述
 * @desc 给角色追加一段剧情或备注文本。
 * @arg id
 * @type actor
 * @arg text
 * @type note
 * @text 描述内容
 *
 * @command addSkillText
 * @text [文本] 追加技能描述
 * @desc 给技能追加一段攻略或备注文本。
 * @arg id
 * @type skill
 * @arg text
 * @type note
 * @text 描述内容
 *
 * @command registerHelp
 * @text [帮助] 注册新条目
 * @arg key
 * @type string
 * @arg title
 * @type string
 *
 * @command setHelpContent
 * @text [帮助] 设置详细内容
 * @arg key
 * @type string
 * @arg image
 * @type string
 * @text 图片文件名
 * @arg text
 * @type note
 * @text 帮助正文
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
        this.initEncyclopedia();
    };

    Game_System.prototype.initEncyclopedia = function() {
        if (!this._encyclopedia) {
            this._encyclopedia = {
                unlockedActors: [],
                unlockedEnemies: [],
                unlockedSkills: [],
                customTexts: { actor: {}, skill: {} },
                helps: []
            };
        }
    };

    class EncyclopediaManager {
        static get data() {
            if (!$gameSystem._encyclopedia) $gameSystem.initEncyclopedia();
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
    // ★★★★ Auto Unlock Hook ★★★★ (核心新增代码)
    //=============================================================================

    // 监听：增加队员时自动解锁图鉴
    const _Game_Party_addActor = Game_Party.prototype.addActor;
    Game_Party.prototype.addActor = function(actorId) {
        _Game_Party_addActor.call(this, actorId);
        Encyclopedia.unlockActor(actorId);
    };

    // 监听：新游戏设置初始队员时自动解锁图鉴
    const _Game_Party_setupStartingMembers = Game_Party.prototype.setupStartingMembers;
    Game_Party.prototype.setupStartingMembers = function() {
        _Game_Party_setupStartingMembers.call(this);
        for (const actorId of this._actors) {
            Encyclopedia.unlockActor(actorId);
        }
    };

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
    // Common Base Window
    //=============================================================================
    
    class Window_EncyclopediaBase extends Window_Selectable {
        loadWindowskin() {
            this.windowskin = ImageManager.loadSystem("BattleWindow");
        }
        resetTextColor() {
            this.changeTextColor(ColorManager.normalColor());
            this.changeOutlineColor(ColorManager.outlineColor());
        }
    }

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

        createBackground() {
            this._backgroundSprite = new Sprite();
            this._backgroundSprite.bitmap = ImageManager.loadPicture("Menu");
            this.addChild(this._backgroundSprite);
            this.setBackgroundOpacity(255);
        }

        needsCancelButton() { return true; }

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
            const rect = new Rectangle(0, wy, Math.floor(Graphics.boxWidth * 0.38), Graphics.boxHeight - wy);
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

            let ratio = 0.50; 
            if (symbol === 'skill') {
                ratio = 0.30; 
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
        loadWindowskin() { this.windowskin = ImageManager.loadSystem("BattleWindow"); }
        
        makeCommandList() {
            this.addCommand("人物", "character");
            this.addCommand("技能", "skill");
            this.addCommand("帮助", "help");
        }
        windowWidth() { return Graphics.boxWidth; }
        maxCols() { return 3; }
        itemTextAlign() { return "center"; }
    }

    class Window_EncyclopediaList extends Window_EncyclopediaBase {
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
        
        itemHeight() { return this.lineHeight() + 8; } 
        
        refresh() { this.makeItemList(); this.createContents(); this.drawAllItems(); }
        
        makeItemList() {
            this._data = [];
            const sys = Encyclopedia.data;
            if (this._category === "character") {
                for (let i = 1; i < $dataActors.length; i++) {
                    const actor = $dataActors[i];
                    if (!actor) continue;
                    
                    // 判断逻辑更新：
                    // 虽然有了自动记录，但保留 $gameParty.allMembers 检查作为双重保险
                    // 只要 ID 存在于 unlockedActors 中，就显示
                    const isUnlocked = sys.unlockedActors.includes(i) || $gameParty.allMembers().some(m => m.actorId() === i);
                    
                    if (isUnlocked) {
                        this._data.push({ type: 'actor', item: actor, unlocked: true });
                        // 确保数据同步（如果是意外入队但没记录的情况）
                        if (!sys.unlockedActors.includes(i)) sys.unlockedActors.push(i);
                    }
                }
                for (const id of sys.unlockedEnemies) {
                    const enemy = $dataEnemies[id];
                    if (enemy) this._data.push({ type: 'enemy', item: enemy, unlocked: true });
                }
            } else if (this._category === "skill") {
                const skillIds = new Set();
                $gameParty.allMembers().forEach(actor => { actor.skills().forEach(s => skillIds.add(s.id)); });
                sys.unlockedSkills.forEach(id => skillIds.add(id));
                const sortedIds = Array.from(skillIds).sort((a, b) => a - b);
                for (const id of sortedIds) {
                    const skill = $dataSkills[id];
                    if (skill && skill.name) this._data.push({ type: 'skill', item: skill, unlocked: true });
                }
            } else if (this._category === "help") {
                this._data = sys.helps;
            }
        }
        
        maxItems() { return this._data ? this._data.length : 0; }
        
        drawItem(index) {
            const entry = this._data[index];
            if (!entry) return;
            const rect = this.itemLineRect(index);
            
            if (this._category === "help") {
                this.drawText(entry.title, rect.x, rect.y, rect.width);
            } else {
                let iconIndex = 0;
                if (entry.type === 'skill') iconIndex = entry.item.iconIndex;
                else if (entry.type === 'actor') iconIndex = 0; 
                else if (entry.type === 'enemy') iconIndex = 1; 
                
                const textMargin = iconIndex > 0 ? ImageManager.iconWidth + 4 : 0;
                if (iconIndex > 0) this.drawIcon(iconIndex, rect.x, rect.y + (rect.height - ImageManager.iconHeight)/2);
                
                this.drawText(entry.item.name, rect.x + textMargin, rect.y, rect.width - textMargin);
            }
        }
        
        select(index) {
            super.select(index);
            const entry = (this._data && index >= 0) ? this._data[index] : null;
            if (this._visualWindow) this._visualWindow.setItem(entry);
            if (this._descWindow) this._descWindow.setItem(entry);
        }
    }

    class Window_EncyclopediaVisual extends Window_EncyclopediaBase {
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
            let y = 10;
            const lh = this.lineHeight();
            
            this.contents.fontSize += 4;
            this.changeTextColor(ColorManager.systemColor());
            this.drawIcon(skill.iconIndex, (w - this.textWidth(skill.name) - 36)/2, y);
            this.drawText(skill.name, 0, y, w, 'center');
            this.resetTextColor();
            this.contents.fontSize -= 4;
            y += lh + 10;
            
            this.drawRect(10, y, w - 20, 2);
            y += 10;
            
            const hitType = ["必中", "物理", "魔法"][skill.hitType] || "必中";
            const elName = $dataSystem.elements[skill.damage.elementId] || "无";
            
            this.changeTextColor(ColorManager.textColor(6)); 
            this.drawText(`类型: ${hitType}`, 20, y, w);
            y += lh;
            this.drawText(`属性: ${elName}`, 20, y, w);
            y += lh;
            
            let cost = "";
            if (skill.mpCost > 0) cost += `MP:${skill.mpCost} `;
            if (skill.tpCost > 0) cost += `TP:${skill.tpCost}`;
            this.changeTextColor(ColorManager.textColor(23)); 
            this.drawText(`消耗: ${cost || "无"}`, 20, y, w);
            
            this.resetTextColor();
        }
        
        drawActorInfo(a) { this.loadImage("Actor_" + a.id); }
        drawEnemyInfo(e) { 
            const name = e.battlerName;
            const hue = e.battlerHue;
            const bmp = ImageManager.loadEnemy(name);
            if (bmp.isReady()) {
                this.drawFit(bmp, hue);
            } else {
                bmp.addLoadListener(() => this.drawFit(bmp, hue));
            }
        }
        drawHelpInfo(h) { if (h.image) this.loadImage(h.image); }
        
        loadImage(n) { 
            const bmp = ImageManager.loadBitmap("img/pictures/Encyclopedia/", n);
            if(bmp.isReady()) this.drawFit(bmp);
            else bmp.addLoadListener(() => this.drawFit(bmp));
        }
        
        drawFit(bmp, hue = 0) {
            this.contents.clear();
            const w = this.contentsWidth(), h = this.contentsHeight();
            if (bmp.width <=0) return;
            
            const r = Math.min(w/bmp.width, h/bmp.height, 1);
            const dw = Math.floor(bmp.width * r);
            const dh = Math.floor(bmp.height * r);
            const dx = (w-dw)/2;
            const dy = (h-dh)/2;

            this.contents.blt(bmp, 0, 0, bmp.width, bmp.height, dx, dy, dw, dh);
        }
        
        drawRect(x, y, w, h) { this.contents.fillRect(x, y, w, h, ColorManager.textColor(8)); }
    }

    class Window_EncyclopediaDesc extends Window_EncyclopediaBase {
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
        resetFontSettings() { super.resetFontSettings(); this.contents.fontSize = 22; } 
        lineHeight() { return 32; }
        
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
            this.contents.clear();
            if (!this._itemEntry) {
                return;
            }

            const sys = Encyclopedia.data;
            let textArray = [];
            
            if (this._itemEntry.type === 'actor') textArray = sys.customTexts.actor[this._itemEntry.item.id] || [];
            else if (this._itemEntry.type === 'skill') {
                textArray = [this._itemEntry.item.description];
                if (sys.customTexts.skill[this._itemEntry.item.id]) {
                    textArray = textArray.concat(sys.customTexts.skill[this._itemEntry.item.id]);
                }
            }
            else if (this._itemEntry.key) textArray = [this._itemEntry.text];
            else if (this._itemEntry.type === 'enemy') {
                const enemy = this._itemEntry.item;
                const drops = enemy.dropItems.map(d => {
                    if(d.kind === 1) return $dataItems[d.dataId].name;
                    if(d.kind === 2) return $dataWeapons[d.dataId].name;
                    if(d.kind === 3) return $dataArmors[d.dataId].name;
                    return "";
                }).filter(n => n);
                
                let desc = `HP: ${enemy.params[0]}  MP: ${enemy.params[1]}\n`;
                desc += `攻击: ${enemy.params[2]}  防御: ${enemy.params[3]}\n`;
                if(drops.length > 0) desc += `\n掉落:\n${drops.join('\n')}`;
                else desc += "\n暂无掉落信息。";
                textArray = [desc];
            }

            if (!textArray || textArray.length === 0 || (textArray.length === 1 && !textArray[0])) {
                this.changeTextColor(ColorManager.textColor(7));
                this.drawText("暂无详细记录...", 0, 0, this.contentsWidth(), "center");
                this.resetTextColor();
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
            if (Input.isPressed("up")) this.applyScroll(-10);
            if (Input.isPressed("down")) this.applyScroll(10);
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
                this._scrollBarSprite.x = this.width - 12; 
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

            sprite.bitmap.fillRect(0, barY, 4, barH, 'rgba(255,255,255,0.5)');
        }
    }

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