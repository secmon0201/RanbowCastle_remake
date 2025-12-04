/*:
 * @target MZ
 * @plugindesc [地图] 事件显示敌人立绘 & 动态呼吸效果 & 镜像翻转
 * @author 神枪手（gemini）
 *
 * @help
 * ----------------------------------------------------------------------------
 * 【V1.2 更新】
 * 新增 <EnemyFlip> 标签，支持水平翻转图片。
 * ----------------------------------------------------------------------------
 * * 使用方法：
 * 在地图事件的【备注 (Note)】栏中输入：
 * * <EnemyId: 1> 
 * <EnemyFlip>
 * * * 解释：
 * 1. <EnemyId: x> : 显示数据库中ID为 x 的敌人图片。
 * 2. <EnemyFlip>  : (可选) 如果加上这一行，图片会水平翻转。
 * * * 设置提示：
 * 1. 事件图像：建议随便选一个（不要留空），插件会自动覆盖它。
 * 2. 勾选【步行动画】(Walking) = 开启呼吸效果。
 * 3. 去掉【步行动画】(Walking) = 静止立绘（依然支持翻转）。
 */

(() => {
    // ------------------------------------------------------------------------
    // Game_Event: 解析备注
    // ------------------------------------------------------------------------
    const _Game_Event_initialize = Game_Event.prototype.initialize;
    Game_Event.prototype.initialize = function(mapId, eventId) {
        _Game_Event_initialize.call(this, mapId, eventId);
        this._bossEnemyId = 0;
        this._bossFlip = false; // 新增：翻转标记
        this.parseBossNote();
    };

    Game_Event.prototype.parseBossNote = function() {
        if (!this.event() || !this.event().note) return;
        const note = this.event().note;
        
        // 解析 EnemyId
        const matchId = note.match(/<EnemyId:\s*(\d+)>/);
        if (matchId) {
            this._bossEnemyId = Number(matchId[1]);
        }

        // 解析 Flip
        this._bossFlip = /<EnemyFlip>/i.test(note);
    };

    // ------------------------------------------------------------------------
    // Sprite_Character: 核心修改
    // ------------------------------------------------------------------------
    
    // 1. 劫持 updateBitmap：加载敌人图
    const _Sprite_Character_updateBitmap = Sprite_Character.prototype.updateBitmap;
    Sprite_Character.prototype.updateBitmap = function() {
        if (this.isBossEvent()) {
            if (this.isImageChanged()) {
                this._tilesetId = $gameMap.tilesetId();
                this._tileId = 0;
                this._characterName = this._character.characterName();
                this._characterIndex = this._character.characterIndex();
                
                const enemy = $dataEnemies[this._character._bossEnemyId];
                if (enemy) {
                    this.bitmap = ImageManager.loadEnemy(enemy.battlerName);
                    if (!enemy.battlerName) {
                         this.bitmap = ImageManager.loadSvEnemy(enemy.battlerName);
                    }
                    this._isBossSprite = true; 
                }
            }
        } else {
            this._isBossSprite = false;
            _Sprite_Character_updateBitmap.call(this);
        }
    };

    // 2. 劫持 isEmptyCharacter：防止引擎隐藏
    const _Sprite_Character_isEmptyCharacter = Sprite_Character.prototype.isEmptyCharacter;
    Sprite_Character.prototype.isEmptyCharacter = function() {
        if (this._isBossSprite) {
            return false;
        }
        return _Sprite_Character_isEmptyCharacter.call(this);
    };

    // 3. 辅助判定
    Sprite_Character.prototype.isBossEvent = function() {
        return this._character instanceof Game_Event && this._character._bossEnemyId > 0;
    };

    // 4. 覆盖帧更新：显示整张图
    const _Sprite_Character_updateCharacterFrame = Sprite_Character.prototype.updateCharacterFrame;
    Sprite_Character.prototype.updateCharacterFrame = function() {
        if (this._isBossSprite && this.bitmap && this.bitmap.isReady()) {
            const pw = this.bitmap.width;
            const ph = this.bitmap.height;
            this.setFrame(0, 0, pw, ph);
            this.anchor.x = 0.5;
            this.anchor.y = 1; 
        } else {
            _Sprite_Character_updateCharacterFrame.call(this);
        }
    };

    // 5. 更新：呼吸 + 翻转逻辑
    const _Sprite_Character_update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        _Sprite_Character_update.call(this);
        if (this._isBossSprite) {
            this.updateBossTransform();
        }
    };

    Sprite_Character.prototype.updateBossTransform = function() {
        // 计算翻转系数：如果备注里有 <EnemyFlip>，X轴缩放乘 -1
        const flipFactor = this._character._bossFlip ? -1 : 1;

        // 如果没勾选“步行动画”，就是静止状态
        if (!this._character.hasWalkAnime()) {
            this.scale.y = 1;
            this.scale.x = 1 * flipFactor; 
            return;
        }

        // 呼吸计算
        const breathSpeed = 0.0025;
        const breathAmp = 0.025;
        const scaleChange = Math.sin(Date.now() * breathSpeed) * breathAmp;
        
        // 应用 Y轴呼吸
        this.scale.y = 1.0 + scaleChange;
        
        // 应用 X轴挤压 + 翻转
        // (保持体积感：Y变大时X变小)
        this.scale.x = (2.0 - this.scale.y) * flipFactor; 
    };

})();