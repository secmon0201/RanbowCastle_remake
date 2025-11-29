/*:
 * @target MZ
 * @plugindesc [仅战斗测试] 终极编辑器: 防误触 + 一键居中
 * @author Gemini Assistant
 * @help
 * === 终极编辑器修正版 ===
 *
 * 【修正内容】
 * 1. 修复了“点地板导致角色瞬移”的 Bug。
 * 现在必须按在角色身上才能拖拽。
 * 2. 新增【全部居中】按钮，一键把所有敌人重置到 (240, 360)。
 *
 * 【操作流程】
 * 1. 战斗测试 -> 按【Tab】进入编辑模式。
 * 2. 只有鼠标点中角色时，才能拖拽。
 * 3. 点击【全部居中】可重置位置。
 * 4. 调整完按【S】保存。
 *
 * ==========================================
 */

(() => {
    if (!DataManager.isBattleTest()) return;

    const fs = require('fs');
    const path = require('path');

    // --- 全局状态 ---
    let _isEditMode = false;       // 编辑模式开关
    let _activeSprite = null;      // 当前高亮选中的 Sprite (用于键盘控制)
    let _draggingSprite = null;    // 当前正在被鼠标拖拽的 Sprite (防误触核心)
    let _dragOffset = { x: 0, y: 0 };
    
    // UI 引用
    let _domPanel = null;
    let _domInputX = null;
    let _domInputY = null;
    let _domLabel = null;

    // =================================================================
    // 1. 场景层逻辑 (负责全局点击清理)
    // =================================================================
    
    // 注册按键
    Input.keyMapper[9] = 'tab';
    Input.keyMapper[83] = 's_key';

    const _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        // Tab 切换
        if (Input.isTriggered('tab')) toggleEditMode();

        if (_isEditMode) {
            // ★ 核心修复：每当鼠标按下的一瞬间，先清空“正在拖拽谁”的标记
            // 这样如果你点到了地板，_draggingSprite 就会是 null，后续就不会触发移动
            if (TouchInput.isTriggered()) {
                _draggingSprite = null;
            }

            // 拦截 S 键
            if (Input.isTriggered('s_key') && !isInputFocused()) {
                saveTroopData();
            }
            
            // 刷新 UI
            updateUI();
            
            // 强制刷新画面
            this._spriteset.update();
            
            // 屏蔽原版战斗逻辑
            if (this._partyCommandWindow) this._partyCommandWindow.deactivate();
            if (this._actorCommandWindow) this._actorCommandWindow.deactivate();
            if (this._enemyWindow) this._enemyWindow.deactivate();
            
            return; 
        }

        _Scene_Battle_update.call(this);
    };

    // =================================================================
    // 2. Sprite 交互逻辑
    // =================================================================

    const _Sprite_Enemy_update = Sprite_Enemy.prototype.update;
    Sprite_Enemy.prototype.update = function() {
        _Sprite_Enemy_update.call(this);
        if (!_isEditMode) {
            this.setBlendColor([0,0,0,0]);
            return;
        }
        this.updateEditInteraction();
    };

    // 强制坐标覆盖 (防止回弹)
    const _Sprite_Enemy_updatePosition = Sprite_Enemy.prototype.updatePosition;
    Sprite_Enemy.prototype.updatePosition = function() {
        if (this._forceX !== undefined && this._forceY !== undefined) {
            this.x = this._forceX;
            this.y = this._forceY;
            this._enemy._screenX = this.x;
            this._enemy._screenY = this.y;
        } else {
            _Sprite_Enemy_updatePosition.call(this);
        }
    };

    Sprite_Enemy.prototype.setFixedPosition = function(x, y) {
        this._forceX = x;
        this._forceY = y;
        this.x = x;
        this.y = y;
    };

    Sprite_Enemy.prototype.updateEditInteraction = function() {
        if (!this.visible) return;

        // --- A. 点击判定 ---
        if (TouchInput.isTriggered() && this.isBeingTouched()) {
            // 只有点到了自己，才把自己标记为“正在拖拽”
            _draggingSprite = this;
            _activeSprite = this; // 同时也选中，方便键盘微调
            
            // 计算偏移
            _dragOffset.x = this.x - TouchInput.x;
            _dragOffset.y = this.y - TouchInput.y;

            // 初始化强制坐标
            if (this._forceX === undefined) {
                this._forceX = this.x;
                this._forceY = this.y;
            }

            // 让输入框失焦
            if (_domInputX) _domInputX.blur();
            if (_domInputY) _domInputY.blur();
        }

        // --- B. 拖拽执行 ---
        // 只有当前正在被拖拽的 Sprite (_draggingSprite) 才能跟随鼠标
        // _activeSprite 只是为了高亮和键盘微调，不参与鼠标移动
        if (_draggingSprite === this && TouchInput.isPressed()) {
             const nx = TouchInput.x + _dragOffset.x;
             const ny = TouchInput.y + _dragOffset.y;
             this.setFixedPosition(nx, ny);
        }

        // --- C. 键盘微调 (针对 _activeSprite) ---
        if (_activeSprite === this && !isInputFocused()) {
            if (Input.isRepeated('up'))    this.setFixedPosition(this.x, this.y - 1);
            if (Input.isRepeated('down'))  this.setFixedPosition(this.x, this.y + 1);
            if (Input.isRepeated('left'))  this.setFixedPosition(this.x - 1, this.y);
            if (Input.isRepeated('right')) this.setFixedPosition(this.x + 1, this.y);
        }

        // --- D. 视觉高亮 ---
        if (_activeSprite === this) {
            this.setBlendColor([255, 255, 255, 80]);
        } else {
            this.setBlendColor([0, 0, 0, 0]);
        }
    };

    Sprite_Enemy.prototype.isBeingTouched = function() {
        const x = TouchInput.x;
        const y = TouchInput.y;
        const w = (this.bitmap ? this.bitmap.width : 96);
        const h = (this.bitmap ? this.bitmap.height : 96);
        return x >= this.x - w/2 && x <= this.x + w/2 && y >= this.y - h && y <= this.y;
    };

    // =================================================================
    // 3. UI 界面与功能
    // =================================================================

    function toggleEditMode() {
        _isEditMode = !_isEditMode;
        if (_isEditMode) {
            createPanel();
            SoundManager.playOk();
            // 进入模式时，给所有怪初始化坐标，防止第一次没点到
            $gameTroop.members().forEach(enemy => {
                 // 实际上这会在点击时初始化，这里不做处理也可以
            });
        } else {
            if (_domPanel) _domPanel.style.display = 'none';
            SoundManager.playCancel();
            // 恢复窗口
            if (SceneManager._scene._partyCommandWindow) SceneManager._scene._partyCommandWindow.activate();
        }
    }

    function createPanel() {
        if (_domPanel) {
            _domPanel.style.display = 'block';
            return;
        }
        
        const div = document.createElement('div');
        div.style.cssText = 'position:absolute; left:10px; bottom:10px; width:200px; padding:10px; background:rgba(0,0,0,0.85); border:1px solid #666; color:#fff; font-size:12px; font-family:sans-serif; z-index:9999; border-radius:4px;';
        
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="color:#fa0; font-weight:bold;">[编辑模式 ON]</span>
                <button id="btn-center-all" style="background:#444; color:#fff; border:1px solid #888; cursor:pointer; font-size:10px; padding:2px 5px;">全部居中</button>
            </div>
            <div id="drag-enemy-name" style="margin-bottom:5px; color:#0ff;">请点击敌人</div>
            <div style="display:flex; gap:5px; align-items:center; margin-bottom:5px;">
                X: <input id="drag-input-x" type="number" style="width:50px;">
                Y: <input id="drag-input-y" type="number" style="width:50px;">
            </div>
            <div style="color:#aaa; font-size:10px;">
                Tab:退出 / S:保存 / 方向键:微调
            </div>
        `;
        document.body.appendChild(div);
        
        _domPanel = div;
        _domLabel = div.querySelector('#drag-enemy-name');
        _domInputX = div.querySelector('#drag-input-x');
        _domInputY = div.querySelector('#drag-input-y');

        // 输入框监听
        const onInput = () => {
            if (_activeSprite) {
                const x = parseInt(_domInputX.value) || 0;
                const y = parseInt(_domInputY.value) || 0;
                _activeSprite.setFixedPosition(x, y);
            }
        };
        _domInputX.addEventListener('input', onInput);
        _domInputY.addEventListener('input', onInput);

        // 全部居中按钮监听
        div.querySelector('#btn-center-all').addEventListener('click', () => {
            // 居中到 480x720 的中心点 (240, 360)
            const centerX = 240;
            const centerY = 360;
            
            // 找到场景中的所有 Sprite_Enemy
            const spriteset = SceneManager._scene._spriteset;
            if (spriteset && spriteset._enemySprites) {
                spriteset._enemySprites.forEach(sprite => {
                    if (sprite._enemy) {
                        sprite.setFixedPosition(centerX, centerY);
                    }
                });
                SoundManager.playEquip();
                console.log("所有敌人已重置到屏幕中心");
            }
        });
    }

    function updateUI() {
        if (!_domPanel || _domPanel.style.display === 'none') return;
        
        if (_activeSprite) {
            _domLabel.innerText = _activeSprite._enemy.name();
            if (document.activeElement !== _domInputX) _domInputX.value = Math.round(_activeSprite.x);
            if (document.activeElement !== _domInputY) _domInputY.value = Math.round(_activeSprite.y);
        } else {
            _domLabel.innerText = "请点击选择敌人";
        }
    }

    function isInputFocused() {
        return document.activeElement === _domInputX || document.activeElement === _domInputY;
    }

    // =================================================================
    // 4. 保存功能
    // =================================================================
    function saveTroopData() {
        const troopId = $gameTroop._troopId;
        const basePath = path.dirname(process.mainModule.filename);
        const filePath = path.join(basePath, 'data', 'Troops.json');

        try {
            const fileData = fs.readFileSync(filePath, 'utf8');
            const troops = JSON.parse(fileData);
            const targetTroop = troops[troopId];
            const currentMembers = $gameTroop.members();
            let count = 0;

            currentMembers.forEach(mem => {
                const dataIndex = mem.index();
                const memData = targetTroop.members[dataIndex];
                if (memData) {
                    memData.x = Math.round(mem._screenX);
                    memData.y = Math.round(mem._screenY);
                    count++;
                }
            });

            fs.writeFileSync(filePath, JSON.stringify(troops, null, 2));
            SoundManager.playSave();
            alert(`保存成功！\n已更新 ${count} 个敌人的位置。\n\n请【关闭整个工程】再重新打开以生效。`);
        } catch (e) {
            console.error(e);
            SoundManager.playBuzzer();
            alert("保存失败：" + e.message);
        }
    }

})();