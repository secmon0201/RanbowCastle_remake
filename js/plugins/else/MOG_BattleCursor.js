//=============================================================================
// MOG_BattleCursor.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 【MOG系列】战斗目标光标(v2.0) 终极版：修复指令返回时的帮助窗口残留
 * @author Moghunter 汉化：硕明云书 优化：豆包编程助手 & Gemini
 * @url https://mogplugins.wordpress.com
 *
 * @param -> GENERAL
 * @desc
 *
 * @param Target Window
 * @parent -> GENERAL
 * @text 显示窗口（目标）
 * @desc 显示目标选择对话框
 * @type boolean
 * @default false
 *
 * @param Slide Effect
 * @parent -> GENERAL
 * @text 幻灯动画
 * @desc 幻灯动画
 * @type boolean
 * @default true
 *
 * @param Move Speed
 * @parent -> GENERAL
 * @text 滑动速度
 * @desc 光标移动速度(30%...300%)
 * @default 100
 * @type number
 * @min 30
 * @max 300
 * * @param Float Effect
 * @parent -> GENERAL
 * @text 浮点动画
 * @desc 浮点动画
 * @type boolean
 * @default true
 *
 * @param Align for Actor
 * @parent -> GENERAL
 * @desc 参与者的光标对齐方式
 * @text 对齐（参与者）
 * @type select
 * @default Above
 * @option 在下面
 * @value Below
 * @option 中心点
 * @value Center
 * @option 上面
 * @value Above
 * @option 左边
 * @value Left 
 * @option 右边
 * @value Right
 *
 * @param Align for Enemy
 * @parent -> GENERAL
 * @desc 敌人的光标对齐方式
 * @text 对齐（敌人）
 * @type select
 * @default Center
 * @option 下面
 * @value Below
 * @option 中心点
 * @value Center
 * @option 上面
 * @value Above
 * @option 左边
 * @value Left 
 * @option 右边
 * @value Right
 *
 * @param X-Axis Offset Actor
 * @parent -> GENERAL
 * @text X轴偏移（玩家）
 * @desc 参与者的X轴偏移量
 * @default 0
 *
 * @param Y-Axis Offset Actor
 * @parent -> GENERAL
 * @text Y轴偏移（玩家）
 * @desc 参与者的Y轴偏移量
 * @default 0
 *
 * @param X-Axis Offset Enemy
 * @parent -> GENERAL
 * @text X轴偏移（敌人）
 * @desc 敌人的X轴偏移量
 * @default 0
 *
 * @param Y-Axis Offset Enemy
 * @parent -> GENERAL
 * @text Y轴偏移（敌人）
 * @desc 敌人的Y轴偏移量
 * @default 0
 * * @param -----------------------
 * @desc
 *
 * @param -> NAME
 * @desc 名称显示配置
 *
 * @param Name Visible
 * @parent -> NAME
 * @text 显示名称
 * @desc 是否显示目标名称（光标上的浮动文字）
 * @type boolean
 * @default true
 *
 * @param Font Size
 * @parent -> NAME
 * @text 字体大小
 * @desc 名称字体大小
 * @default 18
 * @type number
 * @min 9
 * @max 48
 *
 * @param Font Bold
 * @parent -> NAME
 * @text 粗体
 * @desc 是否启用粗体
 * @type boolean
 * @default false
 *
 * @param Font Italic
 * @parent -> NAME
 * @text 字体倾斜
 * @desc 是否启用斜体
 * @type boolean
 * @default false
 *
 * @param ------------------------
 * @desc
 *
 * @param -> WINDOW UI
 * @desc 右下角名称窗口配置
 *
 * @param Window Width
 * @parent -> WINDOW UI
 * @text 窗口宽度
 * @desc 名称窗口的宽度
 * @default 200
 * @type number
 * @min 50
 * @max 400
 *
 * @param Window Height
 * @parent -> WINDOW UI
 * @text 窗口高度
 * @desc 名称窗口的高度
 * @default 60
 * @type number
 * @min 30
 * @max 200
 *
 * @param Window X Offset
 * @parent -> WINDOW UI
 * @text 窗口X偏移
 * @desc 距离右边缘的偏移量（正数向右，负数向左）
 * @default 20
 * @type number
 *
 * @param Window Y Offset
 * @parent -> WINDOW UI
 * @text 窗口Y偏移
 * @desc 距离下边缘的偏移量（正数向下，负数向上）
 * @default 20
 * @type number
 *
 * @param Text Color
 * @parent -> WINDOW UI
 * @text 文字颜色
 * @desc 名称文字的颜色（十六进制颜色码）
 * @default #ffffff
 *
 * @param Window Opacity
 * @parent -> WINDOW UI
 * @text 窗口透明度
 * @desc 窗口背景的透明度（0-255）
 * @default 180
 * @type number
 * @min 0
 * @max 255
 *
 * @param Window Back Color
 * @parent -> WINDOW UI
 * @text 窗口背景色
 * @desc 窗口背景的颜色（十六进制颜色码）
 * @default #000000
 *
 * @param Window Border Color
 * @parent -> WINDOW UI
 * @text 窗口边框色
 * @desc 窗口边框的颜色（十六进制颜色码）
 * @default #ffffff
 *
 * @param Window Border Width
 * @parent -> WINDOW UI
 * @text 边框宽度
 * @desc 窗口边框的粗细（0为无边框）
 * @default 2
 * @type number
 * @min 0
 * @max 10
 *
 * @param Text All Enemies
 * @parent -> WINDOW UI
 * @text 全体敌人文本
 * @desc 当目标为全体敌人时显示的文本
 * @default 敌方全体
 *
 * @param Text All Allies
 * @parent -> WINDOW UI
 * @text 全体队友文本
 * @desc 当目标为全体队友时显示的文本
 * @default 我方全体
 *
 * @param ------------------------
 * @desc
 *
 * @param -> ANIMATED
 * @desc 光标动画配置
 *
 * @param Animated
 * @parent -> ANIMATED
 * @text 启用帧动画
 * @desc 启用光标帧动画
 * @type boolean
 * @default false
 *
 * @param Frames
 * @parent -> ANIMATED
 * @text 帧数
 * @desc 动画的总帧数(2..100)
 * @type number
 * @default 3
 * @min 2
 * @max 100
 *
 * @param Animation Speed
 * @parent -> ANIMATED
 * @text 动画速度
 * @desc 动画播放速度(2..240)
 * @type number
 * @default 8
 * @min 2
 * @max 240
 *
 * @help  
 * =============================================================================
 * ♦♦♦ MOG - Battle Cursor 终极修复版 ♦♦♦
 * * 修复日志 (v2.0)：
 * 1. 【核心修复】在每一帧的更新循环中加入了强制检测：
 * 只要“角色指令窗口（攻击/技能/防御等）”是激活状态，强制隐藏帮助窗口。
 * 这可以彻底解决从攻击返回时，帮助窗口因为缓存机制而顽固显示的问题。
 * 2. 保留了之前所有的窗口不重叠、不隐藏指令菜单的修改。
 * =============================================================================
 */
 
 
(() => {
     
　　var Imported = Imported || {};
　　Imported.MOG_BattleCursor = true;
　　var Moghunter = Moghunter || {}; 


    Moghunter.parameters = PluginManager.parameters('MOG_BattleCursor');
    // 基础配置
    Moghunter.bcursor_x_actor = Number(Moghunter.parameters['X-Axis Offset Actor'] || 0);
    Moghunter.bcursor_y_actor = Number(Moghunter.parameters['Y-Axis Offset Actor'] || 0);    
    Moghunter.bcursor_x_enemy = Number(Moghunter.parameters['X-Axis Offset Enemy'] || 0);
    Moghunter.bcursor_y_enemy = Number(Moghunter.parameters['Y-Axis Offset Enemy'] || 0);    
    Moghunter.bcursor_slide = String(Moghunter.parameters['Slide Effect'] || "false");
    Moghunter.bcursor_moveSpeed  = Number(Moghunter.parameters['Move Speed'] || 100);
    Moghunter.bcursor_float = String(Moghunter.parameters['Float Effect'] || "true");
    Moghunter.bcursor_alignActor = String(Moghunter.parameters['Align for Actor'] || "Above");
    Moghunter.bcursor_alignEnemy = String(Moghunter.parameters['Align for Enemy'] || "Above");
    
    // 名称配置
    Moghunter.bcursor_name_visible = String(Moghunter.parameters['Name Visible'] || "true");
    Moghunter.bcursor_fontSize = Number(Moghunter.parameters['Font Size'] || 18);
    Moghunter.bcursor_fontBold = String(Moghunter.parameters['Font Bold'] || "false");
    Moghunter.bcursor_fontItalic = String(Moghunter.parameters['Font Italic'] || "false");
    Moghunter.bcursor_TargetWindow = String(Moghunter.parameters['Target Window'] || "false");
    
    // 动画配置
    Moghunter.bcursor_animated = String(Moghunter.parameters['Animated'] || "true");
    Moghunter.bcursor_aniFrames = Number(Moghunter.parameters['Frames'] || 3);
    Moghunter.bcursor_aniSpeed = Number(Moghunter.parameters['Animation Speed'] || 5);

    // 窗口UI配置
    Moghunter.windowWidth = Number(Moghunter.parameters['Window Width'] || 200);
    Moghunter.windowHeight = Number(Moghunter.parameters['Window Height'] || 60);
    Moghunter.windowXOffset = Number(Moghunter.parameters['Window X Offset'] || 20);
    Moghunter.windowYOffset = Number(Moghunter.parameters['Window Y Offset'] || 20);
    Moghunter.textColor = String(Moghunter.parameters['Text Color'] || "#ffffff");
    Moghunter.windowOpacity = Number(Moghunter.parameters['Window Opacity'] || 180);
    Moghunter.windowBackColor = String(Moghunter.parameters['Window Back Color'] || "#000000");
    Moghunter.windowBorderColor = String(Moghunter.parameters['Window Border Color'] || "#ffffff");
    Moghunter.windowBorderWidth = Number(Moghunter.parameters['Window Border Width'] || 2);
    
    // 全体文本配置
    Moghunter.textAllEnemies = String(Moghunter.parameters['Text All Enemies'] || "敌方全体");
    Moghunter.textAllAllies = String(Moghunter.parameters['Text All Allies'] || "我方全体");


//=============================================================================
// ■■■ Game_Temp ■■■
//=============================================================================

//==============================
// ♦ ALIAS ♦  Initialize
//==============================
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
// ■■■ Game_Party ■■■
//=============================================================================

//==============================
// ♦ ALIAS ♦  addActor
//==============================
const _mog_bCursor_game_party_addActor = Game_Party.prototype.addActor;
Game_Party.prototype.addActor = function(actorId) {
    _mog_bCursor_game_party_addActor.call(this,actorId);
    if (this.inBattle()) {$gameTemp._mogBattleCursor.needRefresh1 = true};
};

//==============================
// ♦ ALIAS ♦  removeActor
//==============================
const _mog_bCursor_game_party_removeActor = Game_Party.prototype.removeActor;
Game_Party.prototype.removeActor = function(actorId) {
    _mog_bCursor_game_party_removeActor.call(this,actorId);
    if (this.inBattle()) {$gameTemp._mogBattleCursor.needRefresh1 = true};
};

//=============================================================================
// ■■■ Game_Battler ■■■
//=============================================================================

//==============================
// ♦ ALIAS ♦  Initialize
//==============================
const _mog_bCursor_game_battler_initMembers = Game_Battler.prototype.initMembers;
Game_Battler.prototype.initMembers = function() {
    _mog_bCursor_game_battler_initMembers.call(this);
    this.initBattleCursor();
};

//==============================
// * initBattleCursor
//==============================
Game_Battler.prototype.initBattleCursor = function() {
    this._battleCursor = {};
    this._battleCursor.enable = true;
    this._battleCursor.X_Offset = 0;
    this._battleCursor.Y_Offset = 0;
};

//==============================
// * notetags mg
//==============================
Game_Battler.prototype.notetags_mg = function() {
    if (this.isEnemy()) {return this.enemy().note.split(/[\r\n]+/)};
    if (this.isActor()) {return this.actor().note.split(/[\r\n]+/)};
};

//==============================
// * setupBattleCursor Note
//==============================
Game_Battler.prototype.setupBattleCursorNote = function() {
     this.notetags_mg().forEach(function(note) {
         const note_data = note.split(' : ')
         if (note_data[0].toLowerCase() == "battle cursor offset"){
             this._battleCursor.X_Offset = Number(note_data[1]);
             this._battleCursor.Y_Offset = Number(note_data[2]);
         }; 
    },this);
};

//=============================================================================
// ■■■ Game_Actor ■■■
//=============================================================================

//==============================
// ♦ ALIAS ♦  Setup
//==============================
const _mog_bCursor_game_actor_setup = Game_Actor.prototype.setup;
Game_Actor.prototype.setup = function(actorId) {
    _mog_bCursor_game_actor_setup.call(this,actorId)
    this.setupBattleCursorNote();
};

//=============================================================================
// ■■■ Game_Enemy ■■■
//=============================================================================

//==============================
// ♦ ALIAS ♦  Setup
//==============================
const _mog_bCursor_game_enemy_setup = Game_Enemy.prototype.setup;
Game_Enemy.prototype.setup = function(enemyId, x, y) {
     _mog_bCursor_game_enemy_setup.call(this,enemyId, x, y);
     this.setupBattleCursorNote();
};

//==============================
// ♦ ALIAS ♦  transform
//==============================
const _mog_battleCursor_game_enemy_transform = Game_Enemy.prototype.transform;
Game_Enemy.prototype.transform = function(enemyId) {
    _mog_battleCursor_game_enemy_transform.call(this,enemyId);
    $gameTemp._mogBattleCursor.needRefresh2 = true; 
    this.setupBattleCursorNote();
};

//=============================================================================
// ■■■ Game Action ■■■
//=============================================================================

//==============================
//  ♦ OVERWRITE ♦ NeedsSelection
//==============================
Game_Action.prototype.needsSelection = function() {
    return this.checkItemScope([1, 2, 7, 8, 9, 10,14]);
};

//==============================
// ♦ ALIAS ♦  apply
//==============================
const _mog_battleCursor_game_action_apply = Game_Action.prototype.apply;
Game_Action.prototype.apply = function(target) {
    _mog_battleCursor_game_action_apply.call(this,target);
    if (target && target.isEnemy() && target.isDead()) {$gameTemp._mogBattleCursor.needRefresh2 = true};
};

//=============================================================================
// ■■■ Window_BattleActor ■■■
//=============================================================================

//==============================
// ♦ ALIAS ♦  Initialize
//==============================
const _mog_battleCursor_window_battleActor_initialize = Window_BattleActor.prototype.initialize;
Window_BattleActor.prototype.initialize = function(rect) {
    _mog_battleCursor_window_battleActor_initialize.call(this,rect);
    this._bcursor_winVisble = String(Moghunter.bcursor_TargetWindow) == "true" ? true : false;
    if (!$dataSystem.optSideView) {this._bcursor_winVisble = true};
    this._bcSo = (Graphics.height * 2);
};

//==============================
// ♦ ALIAS ♦  Select
//==============================
const _mog_battleCursor_window_battleactor_select = Window_BattleActor.prototype.select;
Window_BattleActor.prototype.select = function(index) {
       _mog_battleCursor_window_battleactor_select.call(this,index);
       if (this.battleCursorNeedSelectAllActors()) {
           this.battleCursorSelectAllActors()};    
};

//==============================
// * battleCursorNeedSelectAllActors
//==============================
Window_BattleActor.prototype.battleCursorNeedSelectAllActors = function() {
   if ($gameTemp._mogBattleCursor.isForEveryone) {return true};
   if ($gameTemp._mogBattleCursor.isForOpponent) {return false};
   if (!$gameTemp._mogBattleCursor.isForAll) {return false};
   return true;
};

//==============================
// * battleCursorSelectAllActors
//==============================
Window_BattleActor.prototype.battleCursorSelectAllActors = function() {
    for (const member of $gameParty.battleMembers()) {
         member.select();
    };
    this.setCursorAll(true);
};

//==============================
// ♦ ALIAS ♦ hide
//==============================
const _mog_battleCursor_window_battleactor_hide = Window_BattleActor.prototype.hide;
Window_BattleActor.prototype.hide = function(index) {
       _mog_battleCursor_window_battleactor_hide.call(this);
       this.setCursorAll(false);
};

//==============================
// ♦ ALIAS ♦  cursorDown
//==============================
const _mog_battleCursor_window_battleActor_cursorDown = Window_BattleActor.prototype.cursorDown;
Window_BattleActor.prototype.cursorDown = function(wrap) {
    if (!this._bcursor_winVisble) {this.inputIndex(1);return}
    _mog_battleCursor_window_battleActor_cursorDown.call(this,wrap);
};

//==============================
// ♦ ALIAS ♦  cursorUp
//==============================
const _mog_battleCursor_window_battleActor_cursorUp = Window_BattleActor.prototype.cursorUp;
Window_BattleActor.prototype.cursorUp = function(wrap) {
    if (!this._bcursor_winVisble) {this.inputIndex(-1);return}
    _mog_battleCursor_window_battleActor_cursorUp.call(this,wrap);
};

//=============================================================================
// ■■■ Window_BattleEnemy ■■■
//=============================================================================

//==============================
// ♦ ALIAS ♦  Initialize
//==============================
const _mog_battleCursor_window_battleenemy_initialize = Window_BattleEnemy.prototype.initialize;
Window_BattleEnemy.prototype.initialize = function(rect) {
    _mog_battleCursor_window_battleenemy_initialize.call(this,rect);
    this._bcursor_winVisble = String(Moghunter.bcursor_TargetWindow) == "true" ? true : false;
    this._bcSo = (Graphics.height * 2);
};

//==============================
// ♦ ALIAS ♦  Select
//==============================
const _mog_battleCursor_window_battleenemy_select = Window_BattleEnemy.prototype.select
Window_BattleEnemy.prototype.select = function(index) {
    _mog_battleCursor_window_battleenemy_select.call(this,index);
    if (this.battleCursorNeedSelectAllEnemies()) {this.battleCursorSelectAllEnemies()};    
};

//==============================
// * battleCursorNeedSelectAllEnemies
//==============================
Window_BattleEnemy.prototype.battleCursorNeedSelectAllEnemies = function() {
   if ($gameTemp._mogBattleCursor.isForEveryone) {return true};
   if (!$gameTemp._mogBattleCursor.isForOpponent) {return false};
   if (!$gameTemp._mogBattleCursor.isForAll) {return false};
   return true;
};

//==============================
// * battleCursorSelectAllEnemies
//==============================
Window_BattleEnemy.prototype.battleCursorSelectAllEnemies = function() {
    for (const member of $gameTroop.aliveMembers()) {
         member.select();
    };
    this.setCursorAll(true);
};

//==============================
// ♦ ALIAS ♦  hide
//==============================
const _mog_battleCursor_window_battleenemy_hide = Window_BattleEnemy.prototype.hide;
Window_BattleEnemy.prototype.hide = function() {
     _mog_battleCursor_window_battleenemy_hide.call(this);
     this.setCursorAll(false);
};

//==============================
// * itemRectBatttleCursor
//==============================
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

//==============================
// ♦ OVERWRITE ♦ refreshCursorForAll
//==============================
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

//==============================
// ♦ ALIAS ♦  cursorDown
//==============================
const _mog_battleCursor_window_battleEnemy_cursorDown = Window_BattleEnemy.prototype.cursorDown;
Window_BattleEnemy.prototype.cursorDown = function(wrap) {
    if (!this._bcursor_winVisble) {this.inputIndex(1);return};
    _mog_battleCursor_window_battleEnemy_cursorDown.call(this,wrap);
};

//==============================
// ♦ ALIAS ♦  cursorUp
//==============================
const _mog_battleCursor_window_battleEnemy_cursorUp = Window_BattleEnemy.prototype.cursorUp;
Window_BattleEnemy.prototype.cursorUp = function(wrap) {
    if (!this._bcursor_winVisble) {this.inputIndex(-1);return};
    _mog_battleCursor_window_battleEnemy_cursorUp.call(this,wrap);
};

//==============================
// ♦ 修复：交换左右按键逻辑 ♦  cursorRight
//==============================
const _mog_battleCursor_window_battleEnemy_cursorRight = Window_BattleEnemy.prototype.cursorRight;
Window_BattleEnemy.prototype.cursorRight = function(wrap) {
    if (!this._bcursor_winVisble) {this.inputIndex(-1);return}; // 右按键 → 上一个目标
    _mog_battleCursor_window_battleEnemy_cursorRight.call(this,wrap);
};

//==============================
// ♦ 修复：交换左右按键逻辑 ♦  cursorLeft
//==============================
const _mog_battleCursor_window_battleEnemy_cursorLeft = Window_BattleEnemy.prototype.cursorLeft;
Window_BattleEnemy.prototype.cursorLeft = function(wrap) {
    if (!this._bcursor_winVisble) {this.inputIndex(1);return}; // 左按键 → 下一个目标
    _mog_battleCursor_window_battleEnemy_cursorLeft.call(this,wrap);
};

//=============================================================================
// ■■■ Window Selectable ■■■ 
//=============================================================================

//==============================
// * input Index
//==============================
Window_Selectable.prototype.inputIndex = function(value) {
    var index = this.index();
    var maxValue = this.maxItems() - 1;
    index += value;
    if (index > maxValue) {index = 0};
    if (index < 0) {index = maxValue};
    this.smoothSelect(index)
};

//=============================================================================
// ■■■ Spriteset Battle ■■■ 
//=============================================================================

//==============================
// * create Sprt Field 1
//==============================
Spriteset_Battle.prototype.createSprtField1 = function() {
    this._sprtField1 = new Sprite();
    this._sprtField1.z = 1;
    this.addChild(this._sprtField1);
};

//==============================
// * create Sprt Field 2
//==============================
Spriteset_Battle.prototype.createSprtField2 = function() {
    this._sprtField2 = new Sprite();
    this._sprtField2.z = 5;
    this.addChild(this._sprtField2);
};

//==============================
// ♦ ALIAS ♦  Create Spriteset
//==============================
const _mog_bCursor_spriteset_battle_createLowerLayer = Spriteset_Battle.prototype.createLowerLayer
Spriteset_Battle.prototype.createLowerLayer = function() {
    _mog_bCursor_spriteset_battle_createLowerLayer.call(this);
    if (!this._sprtField2) {this.createSprtField2()};
    this.createBattleCursor();    
    // 创建右下角名称窗口（使用配置参数）
    this.createBattleNameWindow();
};

//==============================
// * 创建右下角名称窗口（使用配置参数）
//==============================
Spriteset_Battle.prototype.createBattleNameWindow = function() {
    // 窗口位置：基于配置参数计算（右下角）
    const rect = new Rectangle(
        Graphics.boxWidth - Moghunter.windowWidth - Moghunter.windowXOffset,  // X坐标 = 屏幕宽度 - 窗口宽 - X偏移
        Graphics.boxHeight - Moghunter.windowHeight - Moghunter.windowYOffset, // Y坐标 = 屏幕高度 - 窗口高 - Y偏移
        Moghunter.windowWidth,  // 窗口宽度（配置参数）
        Moghunter.windowHeight  // 窗口高度（配置参数）
    );
    this._battleNameWindow = new Window_BattleTargetName(rect);
    this._battleNameWindow.z = 100; // 窗口层级：确保在最上层
    this.addChild(this._battleNameWindow);
};

//==============================
// * createBattleCursor
//==============================
Spriteset_Battle.prototype.createBattleCursor = function() {
    for (const sprite of this.battlerSprites()) {
         const battlerSprite = new BattleCursorSprite(this,sprite);
         battlerSprite.z = 5;
         this._sprtField2.addChild(battlerSprite);
    };
};

//=============================================================================
// ■■■  Scene Battle ■■■ 
//=============================================================================

//==============================
// ♦ ALIAS ♦ update
//==============================
const _mog_bCursor_scene_battle_update = Scene_Battle.prototype.update; 
Scene_Battle.prototype.update = function() {
     _mog_bCursor_scene_battle_update.call(this);
     this.updateBattleCursor();
};

//==============================
// * update Battle Cursor
//==============================
Scene_Battle.prototype.updateBattleCursor = function() {
    if ($gameTemp._mogBattleCursor.slideTime > 0) {
        $gameTemp._mogBattleCursor.slideTime--;
        if ($gameTemp._mogBattleCursor.slideTime == 0) {
            $gameTemp._mogBattleCursor.x = 0;
            $gameTemp._mogBattleCursor.y = 0;
        };
    };
    this.updateBattleCursorTargetWindow();
    
    // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
    // 【v2.0 终极修复】：帧更新强制隐藏逻辑
    // 如果角色指令窗口（Attack/Skill/Guard/Item）是激活的，
    // 那么绝对没有任何理由显示技能帮助窗口。
    // 这行代码会覆盖所有“返回”操作后可能产生的残留显示。
    if (this._actorCommandWindow && this._actorCommandWindow.active) {
        if (this._helpWindow && this._helpWindow.visible) {
            this._helpWindow.hide();
            this._helpWindow.visible = false;
        }
    }
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    
    $gameTemp._mogBattleCursor.needRefresh1 = false;
    $gameTemp._mogBattleCursor.needRefresh2 = false;    
};

//==============================
// * updateBattleCursorTargetWindow
//==============================
Scene_Battle.prototype.updateBattleCursorTargetWindow= function() {
    if ($gameTemp._mogBattleCursor.needRefresh1 && this._actorWindow.active) {
        this._actorWindow.refresh();
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
    if (this._actorWindow && !this._actorWindow._bcursor_winVisble) {this._actorWindow.y = this._actorWindow._bcSo};
};

//==============================
// ♦ ALIAS ♦ onEnemyCancel
//==============================
const _mog_bCursor_scene_battle_onEnemyCancel = Scene_Battle.prototype.onEnemyCancel;
Scene_Battle.prototype.onEnemyCancel = function() {
      this._actorWindow.hide();
      _mog_bCursor_scene_battle_onEnemyCancel.call(this);
      
      const action = BattleManager.inputtingAction();
      if (action) {
          if (action.isItem() && this._itemWindow) { 
              this._itemWindow.show(); 
              if (this._helpWindow) this._helpWindow.show();
          }
          else if (action.isSkill() && this._skillWindow) { 
              const attackSkillId = BattleManager.actor() ? BattleManager.actor().attackSkillId() : 1;
              
              if (action.item().id === attackSkillId || action.item().id === 1) {
                  // 回退到指令选择
                  if (this._actorCommandWindow) {
                       this._actorCommandWindow.show();
                       this._actorCommandWindow.activate();
                  }
                  this._skillWindow.hide(); 
                  // 这里的 hide() 是为了瞬时响应，后续由 updateBattleCursor 持续镇压
                  if (this._helpWindow) {
                      this._helpWindow.hide(); 
                      this._helpWindow.visible = false;
                  }
              } else {
                  // 回退到技能列表
                  if (BattleManager.actor()) {
                      this._skillWindow.setActor(BattleManager.actor());
                  }
                  this._skillWindow.show(); 
                  if (this._helpWindow) this._helpWindow.show();
              }
          }
          // 如果不是技能也不是物品，回退到指令窗口
          else if (this._actorCommandWindow) { 
              this._actorCommandWindow.show(); 
          }
      }
};

//==============================
// ♦ ALIAS (NEW) ♦ onActorCancel
//==============================
// 【新增】：取消选择队友时，恢复显示对应的窗口
const _mog_bCursor_scene_battle_onActorCancel = Scene_Battle.prototype.onActorCancel;
Scene_Battle.prototype.onActorCancel = function() {
    _mog_bCursor_scene_battle_onActorCancel.call(this);
    
    // 【修改 v1.2】：逻辑同上，修复取消选择队友时的窗口恢复
    const action = BattleManager.inputtingAction();
    if (action) {
        if (action.isItem() && this._itemWindow) { 
            this._itemWindow.show(); 
            if (this._helpWindow) this._helpWindow.show();
        }
        else if (action.isSkill() && this._skillWindow) { 
             const attackSkillId = BattleManager.actor() ? BattleManager.actor().attackSkillId() : 1;
             
             if (action.item().id === attackSkillId || action.item().id === 1) {
                 if (this._actorCommandWindow) {
                     this._actorCommandWindow.show();
                     this._actorCommandWindow.activate();
                 }
                 this._skillWindow.hide();
                 if (this._helpWindow) {
                     this._helpWindow.hide();
                     this._helpWindow.visible = false;
                 }
             } else {
                 if (BattleManager.actor()) {
                     this._skillWindow.setActor(BattleManager.actor());
                 }
                 this._skillWindow.show();
                 if (this._helpWindow) this._helpWindow.show();
             }
        }
        else if (this._actorCommandWindow) { 
            this._actorCommandWindow.show(); 
        }
    }
};

//==============================
// ♦ ALIAS ♦ onSelectAction
//==============================
const _mog_bCursor_scene_battle_onSelectAction = Scene_Battle.prototype.onSelectAction;
Scene_Battle.prototype.onSelectAction = function() {
    this.battleCursorOnSelectAction();
    _mog_bCursor_scene_battle_onSelectAction.call(this);
    if (this._enemyWindow.active && $gameTemp._mogBattleCursor.isForEveryone) {
        this._actorWindow.battleCursorSelectAllActors();
    }
    
    if (this._skillWindow && this._skillWindow.visible) { this._skillWindow.hide(); }
    if (this._itemWindow && this._itemWindow.visible) { this._itemWindow.hide(); }
    
    // 强制显示指令窗口（v1.8需求）
    if (this._actorCommandWindow) { this._actorCommandWindow.show(); } 
    
    // 【v1.7 修复】：开始选择目标时，强制隐藏“战斗/逃跑”窗口
    if (this._partyCommandWindow) { this._partyCommandWindow.hide(); }
    
    // 根据动作类型决定是否显示帮助窗口
    const action = BattleManager.inputtingAction();
    if (this._helpWindow) {
        if (action && (
            action.isAttack() || 
            action.isGuard() || 
            (action.isSkill() && action.item().id === 1)
        )) {
            this._helpWindow.hide();
            this._helpWindow.visible = false;
        } else {
            this._helpWindow.show();
            this._helpWindow.visible = true;
            this._helpWindow.opacity = 255;
        }
    }
};
//==============================
// ♦ ALIAS (NEW) ♦ commandAttack
//==============================
// 【新增 v1.6】：按下攻击指令时强制隐藏帮助窗口
const _mog_scene_battle_commandAttack = Scene_Battle.prototype.commandAttack;
Scene_Battle.prototype.commandAttack = function() {
    _mog_scene_battle_commandAttack.call(this);
    if (this._helpWindow) { this._helpWindow.hide(); }
};

//==============================
// ♦ ALIAS (NEW) ♦ commandGuard
//==============================
// 【新增 v1.6】：按下防御指令时强制隐藏帮助窗口
const _mog_scene_battle_commandGuard = Scene_Battle.prototype.commandGuard;
Scene_Battle.prototype.commandGuard = function() {
    _mog_scene_battle_commandGuard.call(this);
    if (this._helpWindow) { this._helpWindow.hide(); }
};

//==============================
// * battleCursorOnSelectAction
//==============================
Scene_Battle.prototype.battleCursorOnSelectAction = function() {
    const action = BattleManager.inputtingAction();
    $gameTemp._mogBattleCursor.isForOpponent = action.isForOpponent();
    $gameTemp._mogBattleCursor.isForAll = action.isForAll();
    $gameTemp._mogBattleCursor.isForEveryone = action.isForEveryone();
};

//==============================
// ♦ ALIAS (NEW) ♦ startPartyCommandSelection
//==============================
// 【新增】：重要修复！当回合开始需要选择“战斗/逃跑”时，强制显示窗口
const _mog_scene_battle_startPartyCommandSelection = Scene_Battle.prototype.startPartyCommandSelection;
Scene_Battle.prototype.startPartyCommandSelection = function() {
    _mog_scene_battle_startPartyCommandSelection.call(this);
    if (this._partyCommandWindow) { this._partyCommandWindow.show(); }
};

//==============================
// ♦ ALIAS (NEW) ♦ startActorCommandSelection
//==============================
// 【新增】：重要修复！当轮到角色行动需要输入指令时，强制显示窗口
const _mog_scene_battle_startActorCommandSelection = Scene_Battle.prototype.startActorCommandSelection;
Scene_Battle.prototype.startActorCommandSelection = function() {
    _mog_scene_battle_startActorCommandSelection.call(this);
    if (this._actorCommandWindow) { this._actorCommandWindow.show(); }
    
    if (this._partyCommandWindow) { this._partyCommandWindow.hide(); }
    
    // 【v2.0】确保开始选择指令时，帮助窗口也是隐藏的
    if (this._helpWindow) { this._helpWindow.hide(); }
};


//=============================================================================
// ■■■  BattleCursorSprite ■■■ 
//=============================================================================
function BattleCursorSprite() {
    this.initialize.apply(this, arguments);
};

BattleCursorSprite.prototype = Object.create(Sprite.prototype);
BattleCursorSprite.prototype.constructor = BattleCursorSprite;

//==============================
// * Initialize
//==============================
BattleCursorSprite.prototype.initialize = function(spriteset,sprite) {
    Sprite.prototype.initialize.call(this); 
    this._spriteset = spriteset;
    this._battlerSprite = sprite;
    this._position = {};
    this._position.x = 0;
    this._position.y = 0;
    this._position.height = 0;
    this._position.xOffset = 0;
    this._position.yOffset = 0;
    this._effect = {};
    this._effect.wave = String(Moghunter.bcursor_float) == "true" ? true : false;
    this._effect.waveX = 0;
    this._effect.waveY = 0;
    this._effect.waveMode = 0;
    this._effect.waveTime = 0;
    this._effect.waveSpeed = 0;
    this._anime = {};
    this._anime.enabled = String(Moghunter.bcursor_animated) == "true" ? true : false;
    this._anime.index = 0;
    this._anime.frameMax = (Math.min(Math.max(Moghunter.bcursor_aniFrames,2),100));
    this._anime.time1 = 0;
    this._anime.time2 = (Math.min(Math.max(Moghunter.bcursor_aniSpeed,2),240));
    this._anime.width = 0;
    this._anime.height = 0;
    this._align = 0
    this.refreshBattler();
    this.prepareBitmap();
    this.visible = false;
    this.opacity = 0;
    this._moveSpeed = (Math.min(Math.max(Moghunter.bcursor_moveSpeed,30),300));
    if (String(Moghunter.bcursor_slide) != "true") {this._moveSpeed = 3000};
    this._xf = ((Graphics.width - Graphics.boxWidth) / 2);
    this._yf = ((Graphics.height - Graphics.boxHeight) / 2);    
};

//==============================
// * getAlign
//==============================
BattleCursorSprite.prototype.getAlign = function(mode) {    
     if (mode == "Below") {
         return 0;
     } else if (mode == "Center") {
         return 1;
     } else if (mode == "Left") {
         return 3;
     } else if (mode == "Right") {
         return 4;
     } else {
         return 2;
     } 
};

//==============================
// * prepareAnimation
//==============================
BattleCursorSprite.prototype.prepareAnimation = function() {    
    this._anime.width = this.setCursorBitmap().width / this._anime.frameMax;
    this._anime.height = this.setCursorBitmap().height;
    this.refreshFrameAnimation();
};

//==============================
// * updateAnime
//==============================
BattleCursorSprite.prototype.updateAnime = function() {
    this._anime.time1++;
    if (this._anime.time1 > this._anime.time2) {
        this._anime.time1 = 0;
        this.refreshFrameAnimation();
    };
};

//==============================
// * refresh Frame Animation
//==============================
BattleCursorSprite.prototype.refreshFrameAnimation = function() {
    this._anime.index++;
    if (this._anime.index > (this._anime.frameMax - 1)) {this._anime.index = 0};
    const sx = this._anime.width * this._anime.index;
    this._cursorSprite.setFrame(sx, 0, this._anime.width, this._anime.height);
};

//==============================
// * move Speed
//==============================
BattleCursorSprite.prototype.moveSpeed = function() {
   return this._moveSpeed;
};

//==============================
// * prepare Bitmap
//==============================
BattleCursorSprite.prototype.prepareBitmap = function() {
    this._cursorBitmap1 = ImageManager.loadSystem("BattleCursor_A");
    this._cursorBitmap2 = ImageManager.loadSystem("BattleCursor_B");
};

//==============================
// * create Sprites
//==============================
BattleCursorSprite.prototype.createSprites = function() {   
    this._cursorSprite = new Sprite();
    this._cursorSprite.z = 5;
    this._cursorSprite.anchor.x = 0.5;
    this._cursorSprite.anchor.y = 2;
    this.addChild(this._cursorSprite);
    this._nameSprite = new Sprite(new Bitmap(160,48));
    this._nameSprite.z = 10;
    // 隐藏原光标上的名称显示（避免重复）
    this._nameSprite.visible = false; 
    this._nameSprite.bitmap.fontSize = Moghunter.bcursor_fontSize;
    this._nameSprite.bitmap.fontBold = String(Moghunter.bcursor_fontBold) == "true" ? true : false;
    this._nameSprite.bitmap.fontItalic = String(Moghunter.bcursor_fontItalic) == "true" ? true : false;
    this.addChild(this._nameSprite);
    if (this._battler) {this.refreshBattleCursor()};
};

//==============================
// * refreshBattler
//==============================
BattleCursorSprite.prototype.refreshBattler = function() {   
     this._battler = this.setBattler();
};

//==============================
// * setBattler
//==============================
BattleCursorSprite.prototype.setBattler = function() {   
     if (this._battlerSprite) {
         return this._battlerSprite._battler;
     };
     return null;
};

//==============================
// * Need Refresh
//==============================
BattleCursorSprite.prototype.needRefresh = function() {
    if (this._battlerSprite) {
        if ($gameTemp._mogBattleCursor.needRefresh1) {return true};
        if ($gameTemp._mogBattleCursor.needRefresh2) {return true};
        if (this._battler != this._battlerSprite._battler) {return true};
        if (this._battler && this._position.width == 0 && this._position.height == 0) {
           if (this._battlerSprite._mainSprite) { 
               if (this._battlerSprite._mainSprite.bitmap && this._battlerSprite._mainSprite.bitmap.isReady()) {return true};
           } else {
               if (this._battlerSprite.bitmap && this._battlerSprite.bitmap.isReady()) {return true};
           };
        };
    };
    return false;
};

//==============================
// * Refresh Battle Cursor
//==============================
BattleCursorSprite.prototype.refreshBattleCursor = function() {
    this.visible = false;
    this.refreshBattler();
    if (this._battler) {
        this.refreshData();
        this.refreshBitmap();
        this.refreshName();
    };
};

//==============================
// * Refresh Data
//==============================
BattleCursorSprite.prototype.refreshData = function() {
     if (this._battler.isEnemy()) {
         this._align = this.getAlign(String(Moghunter.bcursor_alignEnemy));      
         this._position.xOffset = Moghunter.bcursor_x_enemy;
         this._position.yOffset = Moghunter.bcursor_y_enemy;         
     } else {
         this._align = this.getAlign(String(Moghunter.bcursor_alignActor));
         this._position.xOffset = Moghunter.bcursor_x_actor;
         this._position.yOffset = Moghunter.bcursor_y_actor;         
     };
};

//==============================
// * refresh Bitmap
//==============================
BattleCursorSprite.prototype.refreshBitmap = function() {
     this._cursorSprite.bitmap = this.setCursorBitmap();
     this._position.width = 0;
     this._position.height = 0;
     if (this._align < 3) {
        this._position.height = this.setCursorAlign(this._align); 
     } else {
        this._position.width = this.setCursorAlign(this._align);
        this._position.height = this.setCursorAlign(1); 
     };
     if (this._anime.enabled) {this.prepareAnimation()};
};

//==============================
// * setCursorAlign
//==============================
BattleCursorSprite.prototype.setCursorAlign = function(align) {
     if (this._battlerSprite) {
         if (this._battlerSprite._mainSprite && this._battlerSprite._mainSprite.bitmap && this._battlerSprite._mainSprite.bitmap.isReady()) {
             if (align == 0) {
                 return 0;
             } else if (align == 1) {
                 return (this._battlerSprite._mainSprite.height / 2) - 5;
             } else if (align == 3) {
                 return -(this._battlerSprite._mainSprite.width / 2) + 5;
             } else if (align == 4) { 
                 return (this._battlerSprite._mainSprite.width / 2) - 5;
             } else {
                 return this._battlerSprite._mainSprite.height - 12;
             };           
         };
         if (this._battlerSprite.bitmap && this._battlerSprite.bitmap.isReady()) {
             if (align == 0) {
                 return 0;
             } else if (align == 1) {
                 return (this._battlerSprite.height / 2) - 10;
             } else if (align == 3) {
                 return -(this._battlerSprite.width / 2) + 10;
             } else if (align == 4) {
                 return (this._battlerSprite.width / 2) - 10;                
             } else {
                 return this._battlerSprite.height - 24;
             };
         };
     };
     return 0;
};

//==============================
// * set Cursor Bitmap
//==============================
BattleCursorSprite.prototype.setCursorBitmap = function() {
     if (this._battler.isEnemy()) {return this._cursorBitmap2};
     return this._cursorBitmap1;
};

//==============================
// * Refresh Name
//==============================
BattleCursorSprite.prototype.refreshName = function() {
    const text = String(this._battler.name());
    this._nameSprite.bitmap.clear();
    this._nameSprite.bitmap.drawText(text,0,0,160,42,"center");
    const sh = -(this._cursorSprite.height * 2) - 28;
    const x_Offset = this._battler.isEnemy() ? 0 : 0;
    const y_Offset = this._battler.isEnemy() ? 0 : 0;
    this._nameSprite.x = x_Offset;
    this._nameSprite.y = y_Offset + sh;
};

//==============================
// * move Cursor
//==============================
BattleCursorSprite.prototype.moveCursor = function(value,real_value) {
    if (value == real_value) {return value};
    var dnspeed = (5 + (Math.abs(value - real_value) / 10)) * (this.moveSpeed() / 100);
    if (value > real_value) {value -= dnspeed;
        if (value < real_value) {value = real_value};}
    else if (value < real_value) {value  += dnspeed;
        if (value  > real_value) {value  = real_value};      
    };
    return Math.floor(value);
};  

//==============================
// * posX
//==============================
BattleCursorSprite.prototype.posX = function() {
   if (!this._battlerSprite) {return 0};
   return this._xf + this._position.xOffset + this._battlerSprite.x + this._effect.waveX + this._battler._battleCursor.X_Offset + this._position.width;   
};

//==============================
// * posY
//==============================
BattleCursorSprite.prototype.posY = function() {
   if (!this._battlerSprite) {return 0};
   return this._yf + this._position.yOffset + this._battlerSprite.y + this._effect.waveY + this._battler._battleCursor.Y_Offset - this._position.height; 
};

//==============================
// * update Wave Effect
//==============================
BattleCursorSprite.prototype.updateWaveEffect = function() {
    this._effect.waveTime++;
    if (this._align < 3) {
        this._effect.waveY = this.updateWaveMovement(this._effect.waveY);
    } else {
        this._effect.waveX = this.updateWaveMovement(this._effect.waveX);
    };
};

//==============================
// * updateWaveMovement
//==============================
BattleCursorSprite.prototype.updateWaveMovement = function(value) { 
    if (this._effect.waveMode == 0) {
        if (this._effect.waveTime > 2) {
            this._effect.waveTime = 0
            value++;
            if (value >= 10) {this._effect.waveMode = 1 };
        };
    } else {
        if (this._effect.waveTime > 2) {
            this._effect.waveTime = 0
            value--;
            if (value <= 0) {this._effect.waveMode = 0};
        };       
    };
    return value
};

//==============================
// * isForAll
//==============================
BattleCursorSprite.prototype.isForAll = function() {
   return $gameTemp._mogBattleCursor.isForAll;;
};

//==============================
// * isVisible
//==============================
BattleCursorSprite.prototype.isVisible = function() {
    if (!this._battler) {return false};
    if (this._battler.isHidden()) {return false};
    if (this._battler.isEnemy() && this._battler.isDead()) {return false};
    return this._battler.isSelected();
};

//==============================
// * Update Battle Cursor
//==============================
BattleCursorSprite.prototype.updateBattleCursor = function() {
     this.visible = this.isVisible();
     if (this._effect.wave) {this.updateWaveEffect()};
     if (this._anime.enabled) {this.updateAnime()};
     this.updatePosition();
};

//==============================
// * Update Position
//==============================
BattleCursorSprite.prototype.updatePosition = function() {
     if (this.visible) {
         this.x = this.moveCursor(this.x,this.posX());
         this.y = this.moveCursor(this.y,this.posY());
         $gameTemp._mogBattleCursor.x = this.x;
         $gameTemp._mogBattleCursor.y = this.y;
         $gameTemp._mogBattleCursor.slideTime = 6;
         this.opacity += 25;
     } else {
         this.x = $gameTemp._mogBattleCursor.x;
         this.y = $gameTemp._mogBattleCursor.y;
         this.opacity = $gameTemp._mogBattleCursor.slideTime == 0 ? 0 : 255;
     };
 };

//==============================
// * need Create Sprites
//==============================
BattleCursorSprite.prototype.needCreateSprites = function() {
   if (this._cursorSprite) {return false};
   if (!this._cursorBitmap1.isReady()) {return false};
   return true;
};

//==============================
// * Update
//==============================
BattleCursorSprite.prototype.update = function() {
    Sprite.prototype.update.call(this); 
    if (this.needCreateSprites()) {this.createSprites()}
    if (this.needRefresh()) {this.refreshBattleCursor()};
    if (this._battler) {this.updateBattleCursor()};
};

//=============================================================================
// ■■■  Window_BattleTargetName（右下角目标名称窗口） ■■■ 
//=============================================================================
function Window_BattleTargetName() {
    this.initialize.apply(this, arguments);
}
Window_BattleTargetName.prototype = Object.create(Window_Base.prototype);
Window_BattleTargetName.prototype.constructor = Window_BattleTargetName;

//==============================
// * 初始化窗口（使用配置参数）
//==============================
Window_BattleTargetName.prototype.initialize = function(rect) {
    Window_Base.prototype.initialize.call(this, rect);
    this._currentTarget = null; // 当前选中的目标
    this.visible = false; // 默认隐藏
    
    // 应用窗口UI配置
    this.opacity = Moghunter.windowOpacity; // 窗口透明度
    this.backColor = Moghunter.windowBackColor; // 背景色
    this.borderColor = Moghunter.windowBorderColor; // 边框色
    this.borderWidth = Moghunter.windowBorderWidth; // 边框宽度
    
    // 应用文字样式配置
    this.contents.fontSize = Moghunter.bcursor_fontSize || 18;
    this.contents.fontBold = String(Moghunter.bcursor_fontBold) == "true" ? true : false;
    this.contents.fontItalic = String(Moghunter.bcursor_fontItalic) == "true" ? true : false;
    this.contents.textColor = Moghunter.textColor; // 文字颜色（配置参数）
};

//==============================
// * 重写：绘制窗口背景（支持自定义颜色和边框）
//==============================
Window_BattleTargetName.prototype.drawBackground = function() {
    const rect = this.baseRect();
    // 绘制背景
    this.contentsBack.bitmap.fillRect(rect, this.backColor);
    // 绘制边框（如果边框宽度>0）
    if (this.borderWidth > 0) {
        this.contentsBack.bitmap.strokeRect(
            rect.x, rect.y, 
            rect.width, rect.height, 
            this.borderColor, 
            this.borderWidth
        );
    }
};

//==============================
// * 更新窗口内容（名称）
//   【修改】：支持传入字符串或对象
//==============================
Window_BattleTargetName.prototype.updateTarget = function(target) {
    // 性能优化：如果目标没变（且不是强制刷新），就不重绘
    if (this._lastTarget === target) return;
    this._lastTarget = target;

    this.contents.clear(); // 清空旧内容
    
    if (target) {
        let text = "";
        // 判断传入的是字符串（全体文本）还是战斗单位对象（单个目标）
        if (typeof target === "string") {
            text = target;
        } else if (target.name) {
            text = target.name();
        }
        
        // 在窗口内居中显示目标名称
        this.contents.drawText(text, 0, 0, this.contentsWidth(), this.lineHeight(), "center");
        this.visible = true; // 显示窗口
    } else {
        this.visible = false; // 无目标时隐藏窗口
    }
};

//==============================
// * 帧更新：同步选择状态
//==============================
Window_BattleTargetName.prototype.update = function() {
    Window_Base.prototype.update.call(this);
    this.syncSelectedTarget();
};

//==============================
// * 同步当前选中的目标
//   【修改】：增加全体目标的判断逻辑
//==============================
Window_BattleTargetName.prototype.syncSelectedTarget = function() {
    let targetData = null;
    const isForAll = $gameTemp._mogBattleCursor.isForAll;         // 是否全体
    const isForEveryone = $gameTemp._mogBattleCursor.isForEveryone; // 是否全场（敌我双方）

    // 1. 敌人窗口激活时
    if (SceneManager._scene._enemyWindow && SceneManager._scene._enemyWindow.active) {
        if (isForAll || isForEveryone) {
            // 如果是全体技能，直接使用配置的文本
            targetData = Moghunter.textAllEnemies; 
        } else {
            // 否则显示选中的单个敌人
            targetData = SceneManager._scene._enemyWindow.enemy();
        }
    }
    // 2. 队友窗口激活时
    else if (SceneManager._scene._actorWindow && SceneManager._scene._actorWindow.active) {
        if (isForAll || isForEveryone) {
            // 如果是全体技能，直接使用配置的文本
            targetData = Moghunter.textAllAllies;
        } else {
            // 否则显示选中的单个队友
            targetData = SceneManager._scene._actorWindow.actor();
        }
    }

    // 3. 更新窗口内容
    this.updateTarget(targetData);
};

})();