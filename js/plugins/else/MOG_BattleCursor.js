/*:
 * @target MZ
 * @plugindesc [v3.1] 战斗光标重制版 - 动态绘图与平滑移动 (彩虹城堡定制修复版)
 * @author Moghunter & RPG Maker MZ Plugin Master
 * @url https://mogplugins.wordpress.com
 * @orderAfter MOG_BattleCursor
 *
 * @param -> GENERAL
 * @text —— 基础设置 ——
 *
 * @param Disable Actor Selection
 * @parent -> GENERAL
 * @text 禁用我方角色光标逻辑
 * @desc true = 选择我方时使用系统原版窗口(解决与其他插件的冲突)。false = 使用MOG光标。
 * @type boolean
 * @default true
 *
 * @param Target Window
 * @parent -> GENERAL
 * @text 显示目标窗口
 * @desc 是否显示右下角的目标名称窗口。
 * @type boolean
 * @default false
 *
 * @param Slide Effect
 * @parent -> GENERAL
 * @text 幻灯片移动
 * @desc 光标在目标间切换时是否平滑滑动。
 * @type boolean
 * @default true
 *
 * @param Move Speed
 * @parent -> GENERAL
 * @text 移动速度
 * @desc 光标滑动的速度 (30%...300%)。
 * @default 100
 * @type number
 * @min 30
 * @max 300
 * * @param Align for Actor
 * @parent -> GENERAL
 * @text 对齐方式 (角色)
 * @desc 光标相对于角色的对齐位置。建议 Center。
 * @type select
 * @default Center
 * @option Center
 * @option Above
 * @option Below
 * @option Left
 * @option Right
 *
 * @param Align for Enemy
 * @parent -> GENERAL
 * @text 对齐方式 (敌人)
 * @desc 光标相对于敌人的对齐位置。建议 Center。
 * @type select
 * @default Center
 * @option Center
 * @option Above
 * @option Below
 * @option Left
 * @option Right
 *
 * @param -> PROCEDURAL
 * @text —— 绘图设置 ——
 *
 * @param Cursor Radius
 * @parent -> PROCEDURAL
 * @text 光标半径
 * @desc 箭头尖端距离中心的距离。针对132px敌人建议设为 80。
 * @type number
 * @default 80
 *
 * @param Arrow Size
 * @parent -> PROCEDURAL
 * @text 箭头大小
 * @desc 三角形箭头的尺寸（像素）。
 * @type number
 * @default 24
 *
 * @param Arrow Color
 * @parent -> PROCEDURAL
 * @text 箭头颜色
 * @desc Hex颜色代码。黄: #FFFF00, 红: #FF0000。
 * @type string
 * @default #FFFF00
 *
 * @param Pulse Speed
 * @parent -> PROCEDURAL
 * @text 呼吸速度
 * @desc 箭头缩放移动的速度。数值越大越快。
 * @type number
 * @default 4
 *
 * @param Pulse Range
 * @parent -> PROCEDURAL
 * @text 呼吸幅度
 * @desc 箭头浮动的像素距离。
 * @type number
 * @default 8
 *
 * @param -> NAME WINDOW
 * @text —— 名称窗口 ——
 *
 * @param Window Width
 * @parent -> NAME WINDOW
 * @text 窗口宽度
 * @default 200
 *
 * @param Window Height
 * @parent -> NAME WINDOW
 * @text 窗口高度
 * @default 60
 *
 * @param Window X Offset
 * @parent -> NAME WINDOW
 * @text X轴偏移
 * @desc 距离屏幕右边缘的距离。
 * @default 20
 *
 * @param Window Y Offset
 * @parent -> NAME WINDOW
 * @text Y轴偏移
 * @desc 距离屏幕下边缘的距离。
 * @default 20
 *
 * @param Text All Enemies
 * @parent -> NAME WINDOW
 * @text 全体敌人文本
 * @default 敌方全体
 *
 * @param Text All Allies
 * @parent -> NAME WINDOW
 * @text 全体队友文本
 * @default 我方全体
 *
 * @help  
 * =============================================================================
 * ■ MOG_BattleCursor_Redux (融合重制版 v3.1)
 * =============================================================================
 * 这是一个结合了 Moghunter 原版逻辑与 Canvas 动态绘图技术的定制插件。
 * 专为竖屏 JRPG《彩虹城堡》重制版设计。
 *
 * ★ v3.1 更新：
 * 增加了“禁用我方角色光标逻辑”参数。开启后，选择队友时将交还控制权给系统
 * 或其他UI插件（如Sq_BattleComplete），从而解决冲突导致的窗口定格问题。
 *
 * =============================================================================
 */

(() => {
    // 注册插件信息
    var Imported = Imported || {};
    Imported.MOG_BattleCursor = true;
    var Moghunter = Moghunter || {}; 

    Moghunter.parameters = PluginManager.parameters('MOG_BattleCursor'); // 注意文件名对应
    
    // --- 基础参数 ---
    // 新增：禁用我方光标开关
    Moghunter.bcursor_disableActor = String(Moghunter.parameters['Disable Actor Selection'] || "true");

    Moghunter.bcursor_slide = String(Moghunter.parameters['Slide Effect'] || "true");
    Moghunter.bcursor_moveSpeed  = Number(Moghunter.parameters['Move Speed'] || 100);
    Moghunter.bcursor_alignActor = String(Moghunter.parameters['Align for Actor'] || "Center");
    Moghunter.bcursor_alignEnemy = String(Moghunter.parameters['Align for Enemy'] || "Center");
    Moghunter.bcursor_x_actor = 0; 
    Moghunter.bcursor_y_actor = 0;
    Moghunter.bcursor_x_enemy = 0;
    Moghunter.bcursor_y_enemy = 0;
    Moghunter.bcursor_float = "false"; 
    
    // --- 绘图参数 ---
    Moghunter.pRadius = Number(Moghunter.parameters['Cursor Radius'] || 80);
    Moghunter.pArrowSize = Number(Moghunter.parameters['Arrow Size'] || 24);
    Moghunter.pColor = String(Moghunter.parameters['Arrow Color'] || '#FFFF00');
    Moghunter.pPulseSpeed = Number(Moghunter.parameters['Pulse Speed'] || 4);
    Moghunter.pPulseRange = Number(Moghunter.parameters['Pulse Range'] || 8);
    Moghunter.pRefSize = 132; 

    // --- 窗口参数 ---
    Moghunter.bcursor_TargetWindow = String(Moghunter.parameters['Target Window'] || "false");
    Moghunter.windowWidth = Number(Moghunter.parameters['Window Width'] || 200);
    Moghunter.windowHeight = Number(Moghunter.parameters['Window Height'] || 60);
    Moghunter.windowXOffset = Number(Moghunter.parameters['Window X Offset'] || 20);
    Moghunter.windowYOffset = Number(Moghunter.parameters['Window Y Offset'] || 20);
    Moghunter.textAllEnemies = String(Moghunter.parameters['Text All Enemies'] || "敌方全体");
    Moghunter.textAllAllies = String(Moghunter.parameters['Text All Allies'] || "我方全体");

    //=============================================================================
    // ■■■ Game_Temp ■■■
    //=============================================================================
    const _mog_bCursor_game_temp_initialize = Game_Temp.prototype.initialize
    Game_Temp.prototype.initialize = function() {
        _mog_bCursor_game_temp_initialize.call(this);
        this._mogBattleCursor = {};
        this._mogBattleCursor.needRefresh1 = false;
        this._mogBattleCursor.needRefresh2 = false;
        this._mogBattleCursor.x = 0;
        this._mogBattleCursor.y = 0;
        this._mogBattleCursor.slideTime = 0;
        this._mogBattleCursor.isForOpponent = false;
        this._mogBattleCursor.isForAll = false;
        this._mogBattleCursor.isForEveryone = false
    };

    //=============================================================================
    // ■■■ Game_Party & Game_Troop Trigger ■■■
    //=============================================================================
    const _mog_bCursor_game_party_addActor = Game_Party.prototype.addActor;
    Game_Party.prototype.addActor = function(actorId) {
        _mog_bCursor_game_party_addActor.call(this,actorId);
        if (this.inBattle()) {$gameTemp._mogBattleCursor.needRefresh1 = true};
    };

    const _mog_bCursor_game_party_removeActor = Game_Party.prototype.removeActor;
    Game_Party.prototype.removeActor = function(actorId) {
        _mog_bCursor_game_party_removeActor.call(this,actorId);
        if (this.inBattle()) {$gameTemp._mogBattleCursor.needRefresh1 = true};
    };

    const _mog_battleCursor_game_enemy_transform = Game_Enemy.prototype.transform;
    Game_Enemy.prototype.transform = function(enemyId) {
        _mog_battleCursor_game_enemy_transform.call(this,enemyId);
        $gameTemp._mogBattleCursor.needRefresh2 = true; 
    };

    const _mog_battleCursor_game_action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _mog_battleCursor_game_action_apply.call(this,target);
        if (target && target.isEnemy() && target.isDead()) {$gameTemp._mogBattleCursor.needRefresh2 = true};
    };

    //=============================================================================
    // ■■■ Window Logic Fixes ■■■
    //=============================================================================
    
    // Window_BattleActor
    const _mog_battleCursor_window_battleActor_initialize = Window_BattleActor.prototype.initialize;
    Window_BattleActor.prototype.initialize = function(rect) {
        _mog_battleCursor_window_battleActor_initialize.call(this,rect);
        this._bcursor_winVisble = String(Moghunter.bcursor_TargetWindow) == "true" ? true : false;
        this._bcSo = (Graphics.height * 2);
    };

    const _mog_battleCursor_window_battleactor_select = Window_BattleActor.prototype.select;
    Window_BattleActor.prototype.select = function(index) {
        _mog_battleCursor_window_battleactor_select.call(this,index);
        if (this.battleCursorNeedSelectAllActors()) {
            this.battleCursorSelectAllActors()};    
    };

    Window_BattleActor.prototype.battleCursorNeedSelectAllActors = function() {
        if ($gameTemp._mogBattleCursor.isForEveryone) {return true};
        if ($gameTemp._mogBattleCursor.isForOpponent) {return false};
        if (!$gameTemp._mogBattleCursor.isForAll) {return false};
        return true;
    };

    Window_BattleActor.prototype.battleCursorSelectAllActors = function() {
        for (const member of $gameParty.battleMembers()) { member.select(); };
        this.setCursorAll(true);
    };

    const _mog_battleCursor_window_battleactor_hide = Window_BattleActor.prototype.hide;
    Window_BattleActor.prototype.hide = function(index) {
        _mog_battleCursor_window_battleactor_hide.call(this);
        this.setCursorAll(false);
    };

    // Window_BattleEnemy
    const _mog_battleCursor_window_battleenemy_initialize = Window_BattleEnemy.prototype.initialize;
    Window_BattleEnemy.prototype.initialize = function(rect) {
        _mog_battleCursor_window_battleenemy_initialize.call(this,rect);
        this._bcursor_winVisble = String(Moghunter.bcursor_TargetWindow) == "true" ? true : false;
        this._bcSo = (Graphics.height * 2);
    };

    const _mog_battleCursor_window_battleenemy_select = Window_BattleEnemy.prototype.select
    Window_BattleEnemy.prototype.select = function(index) {
        _mog_battleCursor_window_battleenemy_select.call(this,index);
        if (this.battleCursorNeedSelectAllEnemies()) {this.battleCursorSelectAllEnemies()};    
    };

    Window_BattleEnemy.prototype.battleCursorNeedSelectAllEnemies = function() {
        if ($gameTemp._mogBattleCursor.isForEveryone) {return true};
        if (!$gameTemp._mogBattleCursor.isForOpponent) {return false};
        if (!$gameTemp._mogBattleCursor.isForAll) {return false};
        return true;
    };

    Window_BattleEnemy.prototype.battleCursorSelectAllEnemies = function() {
        for (const member of $gameTroop.aliveMembers()) { member.select(); };
        this.setCursorAll(true);
    };

    const _mog_battleCursor_window_battleenemy_hide = Window_BattleEnemy.prototype.hide;
    Window_BattleEnemy.prototype.hide = function() {
        _mog_battleCursor_window_battleenemy_hide.call(this);
        this.setCursorAll(false);
    };

    Window_BattleEnemy.prototype.itemRectBatteCursor = function(index) {
        const maxCols = this.maxCols();
        const itemWidth = this.itemWidth();
        const itemHeight = this.itemHeight();
        const colSpacing = this.colSpacing();
        const rowSpacing = this.rowSpacing();
        const col = index % maxCols;
        const row = Math.floor(index / maxCols);
        const x = itemWidth + colSpacing / 1 - this.scrollBaseX();
        const y = row * itemHeight + rowSpacing / 1 - this.scrollBaseY();
        const width = itemWidth - colSpacing;
        const height = itemHeight - rowSpacing;
        return new Rectangle(x, y, width, height);
    };

    Window_BattleEnemy.prototype.refreshCursorForAll = function() {
        const maxItems = this.maxItems();
        if (maxItems > 0) {
            const rect = this.itemRect(0);
            rect.enlarge(this.itemRectBatteCursor(999));
            this.setCursorRect(rect.x, rect.y, rect.width, rect.height);
        } else {
            this.setCursorRect(0, 0, 0, 0);
        };
        this._index = 0;
    };

    // --- Input Fixes ---
    Window_Selectable.prototype.inputIndex = function(value) {
        var index = this.index();
        var maxValue = this.maxItems() - 1;
        index += value;
        if (index > maxValue) {index = 0};
        if (index < 0) {index = maxValue};
        this.smoothSelect(index)
    };

    // Override cursor inputs to support wrapping and correct logic
    const _mog_battleCursor_window_battleEnemy_cursorRight = Window_BattleEnemy.prototype.cursorRight;
    Window_BattleEnemy.prototype.cursorRight = function(wrap) {
        if (!this._bcursor_winVisble) {this.inputIndex(-1);return}; 
        _mog_battleCursor_window_battleEnemy_cursorRight.call(this,wrap);
    };

    const _mog_battleCursor_window_battleEnemy_cursorLeft = Window_BattleEnemy.prototype.cursorLeft;
    Window_BattleEnemy.prototype.cursorLeft = function(wrap) {
        if (!this._bcursor_winVisble) {this.inputIndex(1);return};
        _mog_battleCursor_window_battleEnemy_cursorLeft.call(this,wrap);
    };

    //=============================================================================
    // ■■■ Scene_Battle Logic ■■■
    //=============================================================================
    
    // 更新光标逻辑
    const _mog_bCursor_scene_battle_update = Scene_Battle.prototype.update; 
    Scene_Battle.prototype.update = function() {
        _mog_bCursor_scene_battle_update.call(this);
        this.updateBattleCursor();
    };

    Scene_Battle.prototype.updateBattleCursor = function() {
        if ($gameTemp._mogBattleCursor.slideTime > 0) {
            $gameTemp._mogBattleCursor.slideTime--;
            if ($gameTemp._mogBattleCursor.slideTime == 0) {
                $gameTemp._mogBattleCursor.x = 0;
                $gameTemp._mogBattleCursor.y = 0;
            };
        };
        this.updateBattleCursorTargetWindow();
        
        // 强制隐藏帮助窗口逻辑 (修复v2.0)
        if (this._actorCommandWindow && this._actorCommandWindow.active) {
            if (this._helpWindow && this._helpWindow.visible) {
                this._helpWindow.hide();
                this._helpWindow.visible = false;
            }
        }
        
        $gameTemp._mogBattleCursor.needRefresh1 = false;
        $gameTemp._mogBattleCursor.needRefresh2 = false;    
    };

    Scene_Battle.prototype.updateBattleCursorTargetWindow= function() {
        if ($gameTemp._mogBattleCursor.needRefresh1 && this._actorWindow.active) {
            this._actorWindow.refresh();
            // 注意：如果你不想每次打开队友选择都重置回第1个人，把下面这行也可以注释掉
            this._actorWindow.select(0); 
        };
        if ($gameTemp._mogBattleCursor.needRefresh2 && this._enemyWindow.active) {
            const enemy = this._enemyWindow.enemy();
            this._enemyWindow.refresh();
            if (!enemy.isDead()) {
                var checked = false;
                for (var i = 0; i < $gameTroop.aliveMembers().length; i++) {    
                    if ($gameTroop.aliveMembers()[i] == enemy) {this._enemyWindow.select(i);checked = true};
                };
                if (!checked) {this._enemyWindow.select(0)};
            } else {
                this._enemyWindow.select(0);
            };
        };
        if (this._enemyWindow && !this._enemyWindow._bcursor_winVisble) {this._enemyWindow.y = this._enemyWindow._bcSo};
        
        // ★★★ 修复：根据参数决定是否隐藏队友窗口 ★★★
        if (String(Moghunter.bcursor_disableActor) !== "true") {
            // 只有当“未禁用”MOG逻辑时，才强制隐藏窗口
            if (this._actorWindow && !this._actorWindow._bcursor_winVisble) {this._actorWindow.y = this._actorWindow._bcSo};
        }
    };

    // 动作选择时的逻辑
    const _mog_bCursor_scene_battle_onSelectAction = Scene_Battle.prototype.onSelectAction;
    Scene_Battle.prototype.onSelectAction = function() {
        this.battleCursorOnSelectAction();
        _mog_bCursor_scene_battle_onSelectAction.call(this);
        if (this._enemyWindow.active && $gameTemp._mogBattleCursor.isForEveryone) {
            this._actorWindow.battleCursorSelectAllActors();
        }
        
        // 隐藏不必要的窗口
        if (this._skillWindow) this._skillWindow.hide();
        if (this._itemWindow) this._itemWindow.hide();
        if (this._partyCommandWindow) this._partyCommandWindow.hide();
        if (this._actorCommandWindow) this._actorCommandWindow.show(); 

        // 帮助窗口控制
        const action = BattleManager.inputtingAction();
        if (this._helpWindow) {
            if (action && (action.isAttack() || action.isGuard() || (action.isSkill() && action.item().id === 1))) {
                this._helpWindow.hide();
            } else {
                this._helpWindow.show();
            }
        }
    };

    Scene_Battle.prototype.battleCursorOnSelectAction = function() {
        const action = BattleManager.inputtingAction();
        $gameTemp._mogBattleCursor.isForOpponent = action.isForOpponent();
        $gameTemp._mogBattleCursor.isForAll = action.isForAll();
        $gameTemp._mogBattleCursor.isForEveryone = action.isForEveryone();
    };

    // 强制窗口显示逻辑
    const _mog_scene_battle_startPartyCommandSelection = Scene_Battle.prototype.startPartyCommandSelection;
    Scene_Battle.prototype.startPartyCommandSelection = function() {
        _mog_scene_battle_startPartyCommandSelection.call(this);
        if (this._partyCommandWindow) this._partyCommandWindow.show();
    };

    const _mog_scene_battle_startActorCommandSelection = Scene_Battle.prototype.startActorCommandSelection;
    Scene_Battle.prototype.startActorCommandSelection = function() {
        _mog_scene_battle_startActorCommandSelection.call(this);
        if (this._actorCommandWindow) this._actorCommandWindow.show();
        if (this._partyCommandWindow) this._partyCommandWindow.hide();
        if (this._helpWindow) this._helpWindow.hide();
    };

    // 取消选择时的恢复逻辑
    const _mog_bCursor_scene_battle_onEnemyCancel = Scene_Battle.prototype.onEnemyCancel;
    Scene_Battle.prototype.onEnemyCancel = function() {
        this._actorWindow.hide();
        _mog_bCursor_scene_battle_onEnemyCancel.call(this);
        this.restoreWindowsAfterTargetCancel();
    };

    const _mog_bCursor_scene_battle_onActorCancel = Scene_Battle.prototype.onActorCancel;
    Scene_Battle.prototype.onActorCancel = function() {
        _mog_bCursor_scene_battle_onActorCancel.call(this);
        this.restoreWindowsAfterTargetCancel();
    };

    Scene_Battle.prototype.restoreWindowsAfterTargetCancel = function() {
        const action = BattleManager.inputtingAction();
        if (!action) return;

        if (action.isItem() && this._itemWindow) {
            this._itemWindow.show();
            if (this._helpWindow) this._helpWindow.show();
        } else if (action.isSkill() && this._skillWindow) {
            const attackSkillId = BattleManager.actor() ? BattleManager.actor().attackSkillId() : 1;
            if (action.item().id === attackSkillId || action.item().id === 1) {
                if (this._actorCommandWindow) {
                    this._actorCommandWindow.show();
                    this._actorCommandWindow.activate();
                }
                this._skillWindow.hide();
                if (this._helpWindow) this._helpWindow.hide();
            } else {
                if (BattleManager.actor()) this._skillWindow.setActor(BattleManager.actor());
                this._skillWindow.show();
                if (this._helpWindow) this._helpWindow.show();
            }
        } else if (this._actorCommandWindow) {
            this._actorCommandWindow.show();
        }
    };

    //=============================================================================
    // ■■■ Spriteset_Battle ■■■
    //=============================================================================
    
    // 创建层级
    Spriteset_Battle.prototype.createSprtField1 = function() {
        this._sprtField1 = new Sprite();
        this._sprtField1.z = 1;
        this.addChild(this._sprtField1);
    };

    Spriteset_Battle.prototype.createSprtField2 = function() {
        this._sprtField2 = new Sprite();
        this._sprtField2.z = 5;
        this.addChild(this._sprtField2);
    };

    const _mog_bCursor_spriteset_battle_createLowerLayer = Spriteset_Battle.prototype.createLowerLayer
    Spriteset_Battle.prototype.createLowerLayer = function() {
        _mog_bCursor_spriteset_battle_createLowerLayer.call(this);
        if (!this._sprtField2) {this.createSprtField2()};
        this.createBattleCursor();    
        this.createBattleNameWindow();
    };

    Spriteset_Battle.prototype.createBattleCursor = function() {
        for (const sprite of this.battlerSprites()) {
            const battlerSprite = new BattleCursorSprite(this,sprite);
            battlerSprite.z = 5;
            this._sprtField2.addChild(battlerSprite);
        };
    };

    Spriteset_Battle.prototype.createBattleNameWindow = function() {
        const rect = new Rectangle(
            Graphics.boxWidth - Moghunter.windowWidth - Moghunter.windowXOffset,
            Graphics.boxHeight - Moghunter.windowHeight - Moghunter.windowYOffset,
            Moghunter.windowWidth,
            Moghunter.windowHeight
        );
        this._battleNameWindow = new Window_BattleTargetName(rect);
        this._battleNameWindow.z = 100;
        this.addChild(this._battleNameWindow);
    };

    //=============================================================================
    // ■■■ BattleCursorSprite (重写核心) ■■■
    //=============================================================================
    function BattleCursorSprite() {
        this.initialize.apply(this, arguments);
    };

    BattleCursorSprite.prototype = Object.create(Sprite.prototype);
    BattleCursorSprite.prototype.constructor = BattleCursorSprite;

    // --- 初始化 ---
    BattleCursorSprite.prototype.initialize = function(spriteset, sprite) {
        Sprite.prototype.initialize.call(this); 
        this._spriteset = spriteset;
        this._battlerSprite = sprite;
        this._procAnimTime = 0; // 呼吸动画计时器
        this._arrowSprites = []; // 存储4个箭头Sprite
        
        // 位置与状态
        this._position = { x: 0, y: 0, xOffset: 0, yOffset: 0 };
        this._moveSpeed = (String(Moghunter.bcursor_slide) === "true") ? Moghunter.bcursor_moveSpeed : 3000;
        this._xf = ((Graphics.width - Graphics.boxWidth) / 2);
        this._yf = ((Graphics.height - Graphics.boxHeight) / 2);    
        
        this.visible = false;
        this.opacity = 0;
        
        this.refreshBattler();
        this.createProceduralArrows(); // ★ 核心：创建绘制的箭头
    };

    // --- ★ 动态绘制逻辑 ---
    BattleCursorSprite.prototype.createProceduralArrows = function() {
        // 清理旧的
        if (this._arrowSprites && this._arrowSprites.length > 0) {
            this._arrowSprites.forEach(s => this.removeChild(s));
        }
        this._arrowSprites = [];
        
        // 1. 创建占位符位图 (用于对齐计算)
        // 这是一个透明的框，MOG的逻辑会用它的大小来计算 "Center" 对齐
        this.bitmap = new Bitmap(Moghunter.pRefSize, Moghunter.pRefSize);
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;

        // 2. 绘制箭头纹理 (复用同一个Bitmap以节省显存)
        // 画一个向右指的三角形 (>)
        const size = Moghunter.pArrowSize;
        const arrowBitmap = new Bitmap(size, size);
        const ctx = arrowBitmap.context;
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(size, size / 2); // 顶点 (右)
        ctx.lineTo(0, 0);           // 左上
        ctx.lineTo(0, size);        // 左下
        ctx.closePath();
        
        // 填充
        ctx.fillStyle = Moghunter.pColor;
        ctx.fill();
        
        // 描边 (黑色2px，增加复古清晰度)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 外发光 (可选)
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.restore();
        
        arrowBitmap._baseTexture.update(); // 提交绘图

        // 3. 创建四个方向的子 Sprite
        // 索引: 0:上, 1:右, 2:下, 3:左
        for (let i = 0; i < 4; i++) {
            const sprite = new Sprite(arrowBitmap);
            sprite.anchor.x = 0.5;
            sprite.anchor.y = 0.5;
            
            let angle = 0;
            if (i === 0) angle = 90;   // 上: 指向下
            if (i === 1) angle = 180;  // 右: 指向左
            if (i === 2) angle = 270;  // 下: 指向上
            if (i === 3) angle = 0;    // 左: 指向右
            
            sprite.rotation = angle * (Math.PI / 180);
            
            this.addChild(sprite);
            this._arrowSprites.push(sprite);
        }
    };

    // --- ★ 呼吸动画逻辑 ---
    BattleCursorSprite.prototype.updateProceduralAnimation = function() {
        this._procAnimTime += Moghunter.pPulseSpeed;
        
        // 正弦波计算 (-1 到 1)
        const wave = Math.sin(this._procAnimTime * 0.05); 
        
        // 动态半径 = 基础半径 + (波动 * 幅度)
        const currentRadius = Moghunter.pRadius + (wave * Moghunter.pPulseRange);

        // 更新四个箭头的位置 (相对于中心点)
        const arrows = this._arrowSprites;
        if (arrows.length === 4) {
            // 0: 上 (y负)
            arrows[0].y = -currentRadius;
            // 1: 右 (x正)
            arrows[1].x = currentRadius;
            // 2: 下 (y正)
            arrows[2].y = currentRadius;
            // 3: 左 (x负)
            arrows[3].x = -currentRadius;
        }
    };

    // --- 数据刷新 ---
    BattleCursorSprite.prototype.refreshBattler = function() {   
        if (this._battlerSprite) {
            this._battler = this._battlerSprite._battler;
        } else {
            this._battler = null;
        }
    };

    BattleCursorSprite.prototype.needRefresh = function() {
        if (this._battlerSprite) {
            if ($gameTemp._mogBattleCursor.needRefresh1) return true;
            if ($gameTemp._mogBattleCursor.needRefresh2) return true;
            if (this._battler != this._battlerSprite._battler) return true;
        }
        return false;
    };

    BattleCursorSprite.prototype.refreshBattleCursor = function() {
        this.visible = false;
        this.refreshBattler();
        if (this._battler) {
            // 根据敌人/角色设置偏移，但我们在 procedural 模式下通常只需要中心对齐
            if (this._battler.isEnemy()) {
                this._position.xOffset = Moghunter.bcursor_x_enemy;
                this._position.yOffset = Moghunter.bcursor_y_enemy;         
            } else {
                this._position.xOffset = Moghunter.bcursor_x_actor;
                this._position.yOffset = Moghunter.bcursor_y_actor;         
            }
        }
    };

    // --- 坐标计算 ---
    BattleCursorSprite.prototype.posX = function() {
        if (!this._battlerSprite) return 0;
        // 计算目标精灵的中心点
        // MOG原版逻辑会去找 _mainSprite.width，但因为我们的 bitmap 是正方形占位符，
        // Center 对齐逻辑 (align=1) 会自动处理得很好。
        return this._xf + this._position.xOffset + this._battlerSprite.x;   
    };

    BattleCursorSprite.prototype.posY = function() {
        if (!this._battlerSprite) return 0;
        // 重点：我们要定位到敌人的身体中心，而不是脚底。
        // _battlerSprite.y 通常是脚底。我们需要减去高度的一半。
        // 为了简单通用，我们假设 enemies 的 anchor.y 是 1 (脚底)。
        let centerY = this._battlerSprite.y;
        
        if (this._battlerSprite._mainSprite && this._battlerSprite._mainSprite.bitmap) {
             // 尝试获取敌人图片高度的一半
             const h = this._battlerSprite._mainSprite.height || this._battlerSprite.bitmap.height || 0;
             centerY -= (h / 2);
        } else if (this._battlerSprite.bitmap) {
             centerY -= (this._battlerSprite.bitmap.height / 2);
        }
        
        return this._yf + this._position.yOffset + centerY; 
    };

    // --- 移动逻辑 ---
    BattleCursorSprite.prototype.moveCursor = function(value, real_value) {
        if (value == real_value) return value;
        var dnspeed = (5 + (Math.abs(value - real_value) / 10)) * (this._moveSpeed / 100);
        if (value > real_value) {
            value -= dnspeed;
            if (value < real_value) value = real_value;
        } else if (value < real_value) {
            value += dnspeed;
            if (value > real_value) value = real_value;      
        }
        return Math.floor(value);
    };  

    BattleCursorSprite.prototype.updatePosition = function() {
        if (this.visible) {
            // 平滑移动
            this.x = this.moveCursor(this.x, this.posX());
            this.y = this.moveCursor(this.y, this.posY());
            
            // 记录全局位置供渐变用
            $gameTemp._mogBattleCursor.x = this.x;
            $gameTemp._mogBattleCursor.y = this.y;
            $gameTemp._mogBattleCursor.slideTime = 6;
            
            // 淡入
            this.opacity += 25;
        } else {
            // 如果不可见，位置跟随全局记录，透明度处理
            this.x = $gameTemp._mogBattleCursor.x;
            this.y = $gameTemp._mogBattleCursor.y;
            this.opacity = $gameTemp._mogBattleCursor.slideTime == 0 ? 0 : 255;
        }
    };

    BattleCursorSprite.prototype.isVisible = function() {
        if (!this._battler) return false;
        
        // ★★★ 修复：如果禁用了我方光标逻辑，且目标是Actor，则不显示箭头 ★★★
        if (this._battler.isActor() && String(Moghunter.bcursor_disableActor) === "true") {
            return false;
        }
        
        if (this._battler.isHidden()) return false;
        if (this._battler.isEnemy() && this._battler.isDead()) return false;
        return this._battler.isSelected();
    };

    // --- 主更新 ---
    BattleCursorSprite.prototype.update = function() {
        Sprite.prototype.update.call(this); 
        
        if (this.needRefresh()) {
            this.refreshBattleCursor();
        }
        
        if (this._battler) {
            this.visible = this.isVisible();
            if (this.visible) {
                this.updateProceduralAnimation(); // 播放呼吸动画
            }
            this.updatePosition(); // 移动位置
        }
    };

    // 将类暴露给全局 (防止 ReferenceError)
    window.BattleCursorSprite = BattleCursorSprite;
    window.Sprite_BattleCursor = BattleCursorSprite;

    //=============================================================================
    // ■■■ Window_BattleTargetName (右下角名称窗口) ■■■
    //=============================================================================
    function Window_BattleTargetName() {
        this.initialize.apply(this, arguments);
    }
    Window_BattleTargetName.prototype = Object.create(Window_Base.prototype);
    Window_BattleTargetName.prototype.constructor = Window_BattleTargetName;

    Window_BattleTargetName.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this._currentTarget = null;
        this.visible = false;
        this.opacity = 255;
        this.contents.fontSize = 20;
    };

    Window_BattleTargetName.prototype.updateTarget = function(target) {
        if (this._lastTarget === target) return;
        this._lastTarget = target;
        this.contents.clear();
        
        if (target) {
            let text = "";
            if (typeof target === "string") {
                text = target;
            } else if (target.name) {
                text = target.name();
            }
            this.contents.drawText(text, 0, 0, this.contentsWidth(), this.lineHeight(), "center");
            this.visible = true;
        } else {
            this.visible = false;
        }
    };

    Window_BattleTargetName.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        this.syncSelectedTarget();
    };

    Window_BattleTargetName.prototype.syncSelectedTarget = function() {
        let targetData = null;
        const isForAll = $gameTemp._mogBattleCursor.isForAll;
        const isForEveryone = $gameTemp._mogBattleCursor.isForEveryone;

        if (SceneManager._scene._enemyWindow && SceneManager._scene._enemyWindow.active) {
            if (isForAll || isForEveryone) {
                targetData = Moghunter.textAllEnemies; 
            } else {
                targetData = SceneManager._scene._enemyWindow.enemy();
            }
        } else if (SceneManager._scene._actorWindow && SceneManager._scene._actorWindow.active) {
            // 如果 MOG 禁用了角色选择，这里其实也不用显示名称窗口了，因为原版窗口会有高亮
            // 但保留它也无妨，或者你可以根据需求在这里加判断
            if (isForAll || isForEveryone) {
                targetData = Moghunter.textAllAllies;
            } else {
                targetData = SceneManager._scene._actorWindow.actor();
            }
        }
        this.updateTarget(targetData);
    };

})();