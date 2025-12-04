// SuperFrontViewMZ.js Ver.1.1.1
// MIT License (C) 2022 あわやまたな
// http://opensource.org/licenses/mit-license.php

/*:
* @target MZ
* @plugindesc [战斗] 超级前视战斗 & 角色动态反馈 & 状态窗口美化
* @author あわやまたな (Awaya_Matana)
* @url https://awaya3ji.seesaa.net/
* @help 您可以在前视图中的演员上显示动画。
* 某些设置也适用于侧视图。
*
* [更新履歴]
* 2022/03/28：Ver.1.0.0　公開
* 2022/03/28：Ver.1.0.1　ステート重ね合わせの位置をずらせるようにしました。
* 2022/04/04：Ver.1.0.2　競合を減らす処理を追加。パラメータにポップアップのY座標調整機能を追加。
* 2022/04/06：Ver.1.1.0　ダメージエフェクトにシェイクを追加。エネミーも行動時前進可能に。
* 2022/04/06：Ver.1.1.1　回避モーション、反撃モーションを追加。
*
* @param controlAnimation
* @text 控制动画
* @desc 此插件控制前视图的动画位置。。
* @type boolean
* @default true
*
* @param window
* @text 窗口设置
* @desc 配置与窗口相关的设置。
* @type struct<window>
* @default {"variablePosition":"false","autoStatusWidth":"true","maxWidth":"192","frameVisible":"false","backSpriteVisible":"true","noBackGround":"false","noBackGroundRect":"false"}
*
* @param actor
* @text 演员设置
* @desc 配置与执行组件相关的设置。
* @type struct<actor>
* @default {"nonFrameFaceHeight":"false","stateSprite":"false","stateSpriteX":"0","stateSpriteY":"0","stepForward":"false","extraMotion":"false","whiten":"true","selectionEffect":"false","damageEffect":"blink","damageOffsetY":"0","collapseEffect":"flashy","amplitude":"4","enableMirror":"false"}
*
* @param enemy
* @text 敌人设置
* @desc 配置与敌人相关的设置。
* @type struct<enemy>
* @default {"stepForward":"false","extraMotion":"false","whiten":"true","damageEffect":"blink","collapseEffect":"flashy","amplitude":"4"}
*
*/

/*~struct~window:
*
* @param variablePosition
* @text 可変位置
* @desc 根据队员人数更改状态位置。
* @type boolean
* @default false
*
* @param autoStatusWidth
* @text 自动状态宽度计算
* @desc 自动计算状态宽度。
* 影响标距宽度。
* @type boolean
* @default true
*
* @param maxWidth
* @text 最大幅
* @desc 限制状态宽度，使其不能大于指定的数字。 禁用，0。
* @type number
* @default 192
*
* @param frameVisible
* @text 帧可视化
* @desc 显示窗口的框架。
* @type boolean
* @default false
*
* @param backSpriteVisible
* @text 背景精灵可视化
* @desc 显示窗口的背景子画面。
* @type boolean
* @default true
*
* @param noBackGround
* @text 无背景
* @desc ステータスウィンドウを透明にします。
* @type boolean
* @default false
*
* @param noBackGroundRect
* @text 没有简短的背景
* @desc 不绘制状态背景。
* @type boolean
* @default false
*
*/

/*~struct~actor:
*
* @param nonFrameFaceHeight
* @text 人脸图像高度释放
* @desc 绘制人脸图像的所有顶部和底部。
* @type boolean
* @default false
*
* @param stateSprite
* @text 状态精灵
* @desc 显示状态异常时的叠加。
* @type boolean
* @default false
*
* @param stateSpriteX
* @text ステートX
* @desc 按指定数字移动位置。
* @type number
* @default 0
* @min -9999
*
* @param stateSpriteY
* @text ステートY
* @desc 按指定数字移动位置。
* @type number
* @default 0
* @min -9999
*
* @param stepForward
* @text 前進
* @desc 演戏时的高级演员。
* @type boolean
* @default false
*
* @param extraMotion
* @text 更多运动
* @desc 回避時、反撃時にアクターが動きます。
* @type boolean
* @default false
*
* @param whiten
* @text 漂白
* @desc 行動時にアクターを白くします。
* @type boolean
* @default true
*
* @param selectionEffect
* @text 选择效果
* @desc 闪烁所选演员。
* @type boolean
* @default false
*
* @param damageEffect
* @text 伤害效果
* @desc 这是演员在受到伤害时的行为。。
* @type select
* @default blink
* @option 点滅
* @value blink
* @option シェイク
* @value shake
* @option シェイクとフラッシュ
* @value shakeAndFlash
* @option なし
* @value null
*
* @param amplitude
* @text 振幅
* @desc ダメージエフェクトがシェイクの場合の振幅。
* @type number
* @default 4
* @min -99999999
*
* @param damageOffsetY
* @text 损坏抵消Y
* @desc 指定した数だけダメージポップアップの位置をずらせます。
* @type number
* @default 0
* @min -9999
*
* @param collapseEffect
* @text 湮灭效果
* @desc 戦闘不能時にアクターを消滅させます。
* @type select
* @option 派手
* @value flashy
* @option 地味
* @value plain
* @option 無効
* @value disable
* @default flashy
* 
* @param enableMirror
* @text 动画反转
* @desc アニメーションを左右反転して表示します。
* @type boolean
* @default false
*
*/

/*~struct~enemy:
*
* @param stepForward
* @text 前進
* @desc 行動時にエネミーを前進させます。
* @type boolean
* @default false
*
* @param extraMotion
* @text 更多运动
* @desc 回避時、反撃時にエネミーが動きます。
* @type boolean
* @default false
*
* @param whiten
* @text 漂白
* @desc 行動時にエネミーを白くします。
* @type boolean
* @default true
*
* @param damageEffect
* @text 伤害效果
* @desc 被ダメージ時のエネミーの挙動です。
* @type select
* @default blink
* @option 点滅
* @value blink
* @option シェイク
* @value shake
* @option シェイクとフラッシュ
* @value shakeAndFlash
* @option なし
* @value null
*
* @param amplitude
* @text 振幅
* @desc 伤害效果晃动时的振幅。
* @type number
* @default 4
* @min -99999999
*
* @param collapseEffect
* @text 消滅エフェクト
* @desc 戦闘不能時にエネミーを消滅させるエフェクトの挙動。
* @type select
* @option 派手
* @value flashy
* @option 地味
* @value plain
* @default flashy
*
*/

'use strict';

function Sprite_ActorFV() {
	this.initialize(...arguments);
}

{

	const useMZ = Utils.RPGMAKER_NAME === "MZ";
	const pluginName = document.currentScript.src.match(/^.*\/(.*).js$/)[1];
	const hasPluginCommonBase = typeof PluginManagerEx === "function";
	const parameter = PluginManager.parameters(pluginName);

	const controlAnimation = parameter["controlAnimation"] === "true";

	const windowParam = JSON.parse(parameter["window"]);
	const actorParam = JSON.parse(parameter["actor"]);
	const enemyParam = JSON.parse(parameter["enemy"]);
	//windowParam
	const autoStatusWidth = windowParam["autoStatusWidth"] === "true";
	const maxWidth = Number(windowParam["maxWidth"]);
	const variablePosition = windowParam["variablePosition"] === "true";
	const frameVisible = windowParam["frameVisible"] === "true";
	const backSpriteVisible = windowParam["backSpriteVisible"] === "true";
	const noBackGround = windowParam["noBackGround"] === "true";
	const noBackGroundRect = windowParam["noBackGroundRect"] === "true";
	//actorParam
	const nonFrameFaceHeight = actorParam["nonFrameFaceHeight"] === "true";
	const stateSprite = actorParam["stateSprite"] === "true";
	const stateSpriteX = Number(actorParam["stateSpriteX"]);
	const stateSpriteY = Number(actorParam["stateSpriteY"]);
	const stepForward = actorParam["stepForward"] === "true";
	const extraMotion = actorParam["extraMotion"] === "true";
	const whiten = actorParam["whiten"] === "true";
	const selectionEffect = actorParam["selectionEffect"] === "true";
	const shakeAndFlash = actorParam["damageEffect"] === "shakeAndFlash";
	const damageEffect = actorParam["damageEffect"] === "null" ? null : shakeAndFlash ? "shake" : actorParam["damageEffect"];
	const damageOffsetY = Number(actorParam["damageOffsetY"]);
	const collapseEffect = actorParam["collapseEffect"] === "disable" ? false : actorParam["collapseEffect"];
	const actorAmp = Number(actorParam["amplitude"]);
	const mirrorEnabled = actorParam["enableMirror"] === "true";
	//enemyParam
	const enemyStepForward = enemyParam["stepForward"] === "true";
	const enemyExtraMotion = enemyParam["extraMotion"] === "true";
	const enemyWhiten = enemyParam["whiten"] === "true";
	const enemyShakeAndFlash = enemyParam["damageEffect"] === "shakeAndFlash";
	const enemyDamageEffect = enemyParam["damageEffect"] === "null" ? null : enemyShakeAndFlash ? "shake" : enemyParam["damageEffect"];
	const enemyCollapseEffect = enemyParam["collapseEffect"];
	const enemyAmp = Number(enemyParam["amplitude"]);

	//-----------------------------------------------------------------------------
	// Game_Battler

	const _Game_Battler_initMembers = Game_Battler.prototype.initMembers;
	Game_Battler.prototype.initMembers = function() {
		_Game_Battler_initMembers.call(this);
		this._positionType = null;
	};

	Game_Battler.prototype.clearPosition = function() {
		this._positionType = null;
	};

	Game_Battler.prototype.requestPosition = function(positionType) {
		this._positionType = positionType;
	};

	Game_Battler.prototype.isPositionRequested = function() {
		return !!this._positionType;
	};

	Game_Battler.prototype.positionType = function() {
		return this._positionType;
	};

	//-----------------------------------------------------------------------------
	// Game_Enemy

	Game_Enemy.prototype.isPositionRequested = function() {
		return enemyExtraMotion && Game_Battler.prototype.isPositionRequested.call(this);
	};

	const _Game_Enemy_performActionStart = Game_Enemy.prototype.performActionStart;
	Game_Enemy.prototype.performActionStart = function(action) {
		_Game_Enemy_performActionStart.call(this, action);
		this.requestEffect(enemyWhiten ? "whiten" : null);
	};
	//回避
	const _Game_Enemy_performEvasion = Game_Enemy.prototype.performEvasion;
	Game_Enemy.prototype.performEvasion = function() {
		_Game_Enemy_performEvasion.call(this);
		this.requestPosition("evade");
	};
	//魔法回避
	const _Game_Enemy_performMagicEvasion = Game_Enemy.prototype.performMagicEvasion;
	Game_Enemy.prototype.performMagicEvasion = function() {
		_Game_Enemy_performMagicEvasion.call(this);
		this.requestPosition("evade");
	};
	//カウンター
	const _Game_Enemy_performCounter = Game_Enemy.prototype.performCounter;
	Game_Enemy.prototype.performCounter = function() {
		_Game_Enemy_performCounter.call(this);
		this.requestPosition("counter");
	};

	const _Game_Enemy_performDamage = Game_Enemy.prototype.performDamage;
	Game_Enemy.prototype.performDamage = function() {
		_Game_Enemy_performDamage.call(this);
		this.requestEffect(enemyDamageEffect);
	};
	
	//-----------------------------------------------------------------------------
	// Sprite_Enemy

	Sprite_Enemy.POSITIONS = {
		counter: { x: 0, y: 18, speed: 4 },
		evade: { x: -18, y: 0, speed: 4 }
	};

	Sprite_Enemy.POSITIONS_SV = {
		counter: { x: 18, y: 0, speed: 4 },
		evade: { x: 0, y: 18, speed: 4 }
	};

	const _Sprite_Enemy_updateMain = Sprite_Enemy.prototype.updateMain;
	Sprite_Enemy.prototype.updateMain = function() {
		_Sprite_Enemy_updateMain.call(this);
		if (enemyStepForward && this._enemy.isSpriteVisible() && !this.isMoving()) {
			this.updateTargetPosition();
		}
	};

	Sprite_Enemy.prototype.setupPosition = function() {
		if (this._enemy.isPositionRequested()) {
			const positionType = this._enemy.positionType();
			const pos = $gameSystem.isSideView() ? Sprite_Enemy.POSITIONS_SV[positionType] : Sprite_Enemy.POSITIONS[positionType];
			let x = pos.x;
			let y = pos.y;
			if (positionType === "evade") {
				if ($gameSystem.isSideView()) {
					x = this._offsetX;
				} else {
					y = this._offsetY;
				}
			}
			this.startMove(x, y, pos.speed);
			this._enemy.clearPosition();
		}
	};

	Sprite_Enemy.prototype.updateTargetPosition = function() {
		if (this._enemy.isPositionRequested()) {
			this.setupPosition();
		} else if (this.shouldStepForward()) {
			this.stepForward();
		} else if (!this.inHomePosition()) {
			this.stepBack();
		}
	};

	Sprite_Enemy.prototype.shouldStepForward = function() {
		return this._enemy.isActing();
	};

	Sprite_Enemy.prototype.stepForward = function() {
		if ($gameSystem.isSideView()) {
			this.startMove(18, 0, 4);
		} else {
			this.startMove(0, 18, 4);
		}
	};

	Sprite_Enemy.prototype.stepBack = function() {
		this.startMove(0, 0, 4);
	};

	const _Sprite_Enemy_startEffect = Sprite_Enemy.prototype.startEffect;
	Sprite_Enemy.prototype.startEffect = function(effectType) {
		if (effectType === "shake") {
			this.startShake();
		}
		_Sprite_Enemy_startEffect.call(this, effectType);
	};

	const shakeDuration = 16;
	Sprite_Enemy.prototype.startShake = function() {
		this._effectDuration = shakeDuration;
	};

	const _Sprite_Enemy_updateEffect = Sprite_Enemy.prototype.updateEffect;
	Sprite_Enemy.prototype.updateEffect = function() {
		const needsUpdate = this._effectDuration > 0;
		const effectType = this._effectType;
		_Sprite_Enemy_updateEffect.call(this);
		if (needsUpdate && effectType === "shake") {
			this.updateShake();
		}
		
	};

	const enemyShakeSpeed = 540/shakeDuration;
	Sprite_Enemy.prototype.updateShake = function() {
		const angle = enemyShakeSpeed * (shakeDuration - this._effectDuration);
		const rad = angle*Math.PI/180
		this._shake = -Math.floor(enemyAmp * Math.sin(rad));
		if (enemyShakeAndFlash) {
			const alpha = 128 - (shakeDuration - this._effectDuration) * 8;
			this.setBlendColor([255, 128, 128, alpha]);
		}
	};

	const _Sprite_Enemy_updateCollapse = Sprite_Enemy.prototype.updateCollapse;
	Sprite_Enemy.prototype.updateCollapse = function() {
		_Sprite_Enemy_updateCollapse.call(this);
		if (enemyCollapseEffect === "plain") {
			this.blendMode = 0;
			this.setBlendColor([0, 0, 0, 0]);
		}
	};

	const _Sprite_Enemy_updateBossCollapse = Sprite_Enemy.prototype.updateBossCollapse;
	Sprite_Enemy.prototype.updateBossCollapse = function() {
		_Sprite_Enemy_updateBossCollapse.call(this);
		if (enemyCollapseEffect === "plain") {
			this.blendMode = 0;
			this.setBlendColor([0, 0, 0, 0]);
		}
	};

	//-----------------------------------------------------------------------------
	// Game_Actor

	Game_Actor.prototype.isPositionRequested = function() {
		return extraMotion && Game_Battler.prototype.isPositionRequested.call(this);
	};
	//侧视图图像也显示在前视图中
	const _Game_Actor_isSpriteVisible = Game_Actor.prototype.isSpriteVisible;
	Game_Actor.prototype.isSpriteVisible = function() {
		return $gameSystem.isSideView() ? _Game_Actor_isSpriteVisible.call(this) : true;
	};
	//漂白
	const _Game_Actor_performActionStart = Game_Actor.prototype.performActionStart;
	Game_Actor.prototype.performActionStart = function(action) {
		_Game_Actor_performActionStart.call(this, action);
		if (!$gameSystem.isSideView() && whiten) {
			this.requestEffect("whiten");
		}
	};
	//回避
	const _Game_Actor_performEvasion = Game_Actor.prototype.performEvasion;
	Game_Actor.prototype.performEvasion = function() {
		_Game_Actor_performEvasion.call(this);
		this.requestPosition("evade");
	};
	//魔法回避
	const _Game_Actor_performMagicEvasion = Game_Actor.prototype.performMagicEvasion;
	Game_Actor.prototype.performMagicEvasion = function() {
		_Game_Actor_performMagicEvasion.call(this);
		this.requestPosition("evade");
	};
	//カウンターカウンター
	const _Game_Actor_performCounter = Game_Actor.prototype.performCounter;
	Game_Actor.prototype.performCounter = function() {
		_Game_Actor_performCounter.call(this);
		this.requestPosition("counter");
	};
	//ダメージエフェクト伤害效果
	const _Game_Actor_performDamage = Game_Actor.prototype.performDamage;
	Game_Actor.prototype.performDamage = function() {
		_Game_Actor_performDamage.call(this);
		if (!$gameSystem.isSideView() && damageEffect) {
			this.requestEffect(damageEffect);
		}
	};
	//消滅エフェクト
	const _Game_Actor_performCollapse = Game_Actor.prototype.performCollapse;
	Game_Actor.prototype.performCollapse = function() {
		_Game_Actor_performCollapse.call(this);
		if (!$gameSystem.isSideView()) {
			this.requestEffect("collapse");
		}
	};

	//-----------------------------------------------------------------------------
	// Sprite_ActorFV

	Sprite_ActorFV.POSITIONS = {
		counter: { x: 0, y: -18, speed: 4 },
		evade: { x: -18, y: 0, speed: 4}
	};
		
	Sprite_ActorFV.prototype = Object.create(Sprite_Actor.prototype);
	Sprite_ActorFV.prototype.constructor = Sprite_ActorFV;

	Sprite_ActorFV.prototype.initMembers = function() {
		Sprite_Actor.prototype.initMembers.call(this);
		this._actorSprite = false;
		this._syncSprite = null;
	};
		
	Sprite_ActorFV.prototype.setupDamagePopup = function() {
		if (this._actorSprite) {
			Sprite_Battler.prototype.setupDamagePopup.call(this);
		}
	};

	//Sprite_Battler
	Sprite_ActorFV.prototype.updateSelectionEffect = function() {
		if (selectionEffect) Sprite_Actor.prototype.updateSelectionEffect.call(this);
	};

	//在前视图期间将人脸图像加载为侧视图图像。
	Sprite_ActorFV.prototype.updateBitmap = function() {
		Sprite_Battler.prototype.updateBitmap.call(this);
		const name = this._actor.faceName();
		if (this._battlerName !== name) {
			this._battlerName = name;
			this._mainSprite.bitmap = ImageManager.loadFace(name);
		}
	};
	//设置侧视图图像的框架
	Sprite_ActorFV.prototype.updateFrame = function() {
		Sprite_Battler.prototype.updateFrame.call(this);
		const bitmap = this._mainSprite.bitmap;
		if (bitmap) {
			const faceIndex = this._actor.faceIndex();
			const rect = SceneManager._scene._statusWindow.faceRect(0);
			const width = rect.width;
			const height = rect.height;
			const pw = ImageManager.faceWidth;
			const ph = ImageManager.faceHeight;
			const sw = Math.min(width, pw);
			const sh = Math.min(height, ph);
			const sx = Math.floor((faceIndex % 4) * pw + (pw - sw) / 2);
			const sy = Math.floor(Math.floor(faceIndex / 4) * ph + (ph - sh) / 2);
			this._mainSprite.setFrame(sx, sy, sw, sh);
			this.setFrame(0, 0, sw, sh);
		}
	};
	//ステートフキダシ禁止か否か是否禁止使用国家气球
	Sprite_ActorFV.prototype.createStateSprite = function() {
		Sprite_Actor.prototype.createStateSprite.call(this);
		if (stateSprite) {
			this._stateSprite.move(stateSpriteX, stateSpriteY);
		} else {
			this._stateSprite.hide();
		}
	};
	//禁用伤害精灵的 X 坐标偏移
	Sprite_ActorFV.prototype.damageOffsetX = function() {
		return Sprite_Battler.prototype.damageOffsetX.call(this);
	};
	//ダメージスプライトのY座標ずらしを追加
	Sprite_ActorFV.prototype.damageOffsetY = function() {
		return Sprite_Battler.prototype.damageOffsetY.call(this) + damageOffsetY;
	};
	//武器非表示
	Sprite_ActorFV.prototype.createWeaponSprite = function() {
		Sprite_Actor.prototype.createWeaponSprite.call(this);
		this._weaponSprite.hide();
	};
	//影非表示1
	Sprite_ActorFV.prototype.createShadowSprite = function() {
		Sprite_Actor.prototype.createShadowSprite.call(this);
		this._shadowSprite.visible = false;
	};
	//影非表示2
	Sprite_ActorFV.prototype.updateShadow = function() {};
	//入場モーションをキャンセル
	Sprite_ActorFV.prototype.startEntryMotion = function() {};
	//退却モーションをしない
	Sprite_ActorFV.prototype.retreat = function() {};
	//初期位置を変更しない。
	Sprite_ActorFV.prototype.moveToStartPosition = function() {};

	Sprite_ActorFV.prototype.setupPosition = function() {
		if (this._actor.isPositionRequested()) {
			const positionType = this._actor.positionType();
			const pos = Sprite_ActorFV.POSITIONS[positionType];
			const x = pos.x;
			let y = pos.y;
			if (positionType === "evade") {
				y = this._offsetY;
			}
			this.startMove(x, y, pos.speed);
			this._actor.clearPosition();
		}
	};

	const _Sprite_Actor_updateTargetPosition = Sprite_Actor.prototype.updateTargetPosition;
	Sprite_ActorFV.prototype.updateTargetPosition = function() {
		if (this._actor.isPositionRequested()) {
			this.setupPosition();
		} else {
			_Sprite_Actor_updateTargetPosition.call(this);
		}
	};

	Sprite_ActorFV.prototype.shouldStepForward = function() {
		return stepForward && this._actor.isActing();
	};
	//自分のターンになったら前進
	Sprite_ActorFV.prototype.stepForward = function() {
		this.startMove(0, -18, 4);
	};
	//自分のターンが過ぎたら後退
	Sprite_ActorFV.prototype.stepBack = function() {
		this.startMove(0, 0, 4);
	};
	//根本不改变中心位置。
	Sprite_ActorFV.prototype.setActorHome = function(index) {};
	Sprite_ActorFV.prototype.updatePosition = function() {
		Sprite_Actor.prototype.updatePosition.call(this);
		this.x += this._shake;
	};
	//Sprite_Enemyからの移植
	Sprite_ActorFV.prototype.initMembers = function() {
		Sprite_Actor.prototype.initMembers.call(this);
		this._appeared = false;
		this._effectType = null;
		this._effectDuration = 0;
		this._shake = 0;
	};
	//エフェクトのアップデート（共通）
	Sprite_ActorFV.prototype.update = function() {
		Sprite_Actor.prototype.update.call(this);
		if (this._actor && this._actorSprite) {
			this.updateEffect();
			this.syncEffect();
		}
	};

	Sprite_ActorFV.prototype.syncEffect = function() {
		if (this._syncSprite) {
			this._syncSprite._shake = this._shake;
			this._syncSprite.blendMode = this.blendMode;
			this._syncSprite.opacity = this.opacity;
			this._syncSprite.setBlendColor(this._blendColor);
		}
	};

	Sprite_ActorFV.prototype.setupEffect = function() {
		if (this._appeared && this._actor.isEffectRequested()) {
			this.startEffect(this._actor.effectType());
			this._actor.clearEffect();
		}
		if (!this._appeared && this._actor.isAlive()) {
			this.startEffect("appear");
		} else if (this._appeared && this._actor.isHidden()) {
			this.startEffect("disappear");
		}
	};

	Sprite_ActorFV.prototype.startEffect = function(effectType) {
		if (effectType === "shake") {
			this.startShake();
		}
		_Sprite_Enemy_startEffect.call(this, effectType);
	};

	const _Sprite_Enemy_startAppear = Sprite_Enemy.prototype.startAppear;
	Sprite_ActorFV.prototype.startAppear = function() {
		_Sprite_Enemy_startAppear.call(this);
	};

	const _Sprite_Enemy_startDisappear = Sprite_Enemy.prototype.startDisappear;
	Sprite_ActorFV.prototype.startDisappear = function() {
		_Sprite_Enemy_startDisappear.call(this);
	};

	const _Sprite_Enemy_startWhiten = Sprite_Enemy.prototype.startWhiten;
	Sprite_ActorFV.prototype.startWhiten = function() {
		_Sprite_Enemy_startWhiten.call(this);
	};

	const _Sprite_Enemy_startBlink = Sprite_Enemy.prototype.startBlink;
	Sprite_ActorFV.prototype.startBlink = function() {
		_Sprite_Enemy_startBlink.call(this);
	};

	Sprite_ActorFV.prototype.startShake = function() {
		this._effectDuration = shakeDuration;
	};

	const _Sprite_Enemy_startCollapse = Sprite_Enemy.prototype.startCollapse
	Sprite_ActorFV.prototype.startCollapse = function() {
		_Sprite_Enemy_startCollapse.call(this);
	};

	const _Sprite_Enemy_startBossCollapse = Sprite_Enemy.prototype.startBossCollapse;
	Sprite_ActorFV.prototype.startBossCollapse = function() {
		_Sprite_Enemy_startBossCollapse.call(this);
	};

	const _Sprite_Enemy_startInstantCollapse = Sprite_Enemy.prototype.startInstantCollapse;
	Sprite_ActorFV.prototype.startInstantCollapse = function() {
		_Sprite_Enemy_startInstantCollapse.call(this);
	};

	Sprite_ActorFV.prototype.updateEffect = function() {
		const needsUpdate = this._effectDuration > 0;
		const effectType = this._effectType;
		_Sprite_Enemy_updateEffect.call(this);
		if (needsUpdate && effectType === "shake") {
			this.updateShake();
		}
	};

	const _Sprite_Enemy_isEffecting = Sprite_Enemy.prototype.isEffecting;
	Sprite_ActorFV.prototype.isEffecting = function() {
		return _Sprite_Enemy_isEffecting.call(this);
	};

	const _Sprite_Enemy_revertToNormal = Sprite_Enemy.prototype.revertToNormal;
	Sprite_ActorFV.prototype.revertToNormal = function() {
		_Sprite_Enemy_revertToNormal.call(this);
	};

	const _Sprite_Enemy_updateWhiten = Sprite_Enemy.prototype.updateWhiten;
	Sprite_ActorFV.prototype.updateWhiten = function() {
		_Sprite_Enemy_updateWhiten.call(this);
	};

	const _Sprite_Enemy_updateBlink = Sprite_Enemy.prototype.updateBlink;
	Sprite_ActorFV.prototype.updateBlink = function() {
		_Sprite_Enemy_updateBlink.call(this);
	};

	const actorShakeSpeed = 720/shakeDuration;
	Sprite_ActorFV.prototype.updateShake = function() {
		const angle = actorShakeSpeed * (shakeDuration - this._effectDuration);
		const rad = angle*Math.PI/180
		this._shake = -Math.floor(actorAmp * Math.sin(rad));
		if (shakeAndFlash) {
			const alpha = 128 - (shakeDuration - this._effectDuration) * 8;
			this.setBlendColor([255, 128, 128, alpha]);
		}
	};

	const _Sprite_Enemy_updateAppear = Sprite_Enemy.prototype.updateAppear;
	Sprite_ActorFV.prototype.updateAppear = function() {
		if (collapseEffect === "plain") {
			this.revertToNormal();
			return;
		}
		_Sprite_Enemy_updateAppear.call(this);
	};

	const _Sprite_Enemy_updateDisappear = Sprite_Enemy.prototype.updateDisappear;
	Sprite_ActorFV.prototype.updateDisappear = function() {
		_Sprite_Enemy_updateDisappear.call(this);
	};

	Sprite_ActorFV.prototype.updateCollapse = function() {
		if (!collapseEffect) return;
		if (collapseEffect === "plain") {
			this.setBlendColor([0, 0, 0, 128]);
			return;
		}
		_Sprite_Enemy_updateCollapse.call(this);
	};

	Sprite_ActorFV.prototype.updateBossCollapse = function() {
		_Sprite_Enemy_updateBossCollapse.call(this);
	};

	const _Sprite_Enemy_instantCollapse = Sprite_Enemy.prototype.instantCollapse;
	Sprite_ActorFV.prototype.instantCollapse = function() {
		if (collapseEffect === "plain") {
			this.setBlendColor([0, 0, 0, 128]);
			return;
		}
		_Sprite_Enemy_instantCollapse.call(this);
	};
	//同步角色以进行状态显示和角色选择
	const _Sprite_Actor_setBattler = Sprite_Actor.prototype.setBattler;
	Sprite_ActorFV.prototype.setBattler = function(battler) {
		_Sprite_Actor_setBattler.call(this, battler);
		if (this._syncSprite) {
			this._syncSprite.setBattler(battler);
		}
	};

	//-----------------------------------------------------------------------------
	// Window_BattleStatus

	Window_BattleStatus.prototype.initialize = function(rect) {
		Window_StatusBase.prototype.initialize.call(this, rect);
		this.openness = 0;
		this._bitmapsReady = 0;
		this.createBattleField();
		this.preparePartyRefresh();
		if (noBackGround) this.opacity = 0;
		this.frameVisible = frameVisible;
		this._backSprite.visible = backSpriteVisible;
	};

	Window_BattleStatus.prototype.createBattleField = function() {
		if ($gameSystem.isSideView()) return;
		this.createBattleFieldSprite();
		this.createActorSprites();
	};

	Window_BattleStatus.prototype.createBattleFieldSprite = function() {
		const rect = this.innerRect;
		const sprite = new Sprite();
		this.addChild(sprite);
		this._battleField = sprite;
		sprite.move(rect.x, rect.y);
	};

	const _Window_BattleStatus_update = Window_BattleStatus.prototype.update;
	Window_BattleStatus.prototype.update = function() {
		_Window_BattleStatus_update.call(this);
		this.updateBattleField();
	};
	Window_BattleStatus.prototype.updateBattleField = function() {
		if (!this._battleField) return;
		this._battleField.visible = this.isOpen();
	};
		
	const _Window_BattleStatus_itemRect = Window_BattleStatus.prototype.itemRect;
	Window_BattleStatus.prototype.itemRect = function(index) {
		const rect = _Window_BattleStatus_itemRect.call(this, index);
		if (maxWidth) {
			const rectWidth = rect.width;
			rect.width = Math.min(rectWidth, maxWidth);
			rect.x += (rectWidth - rect.width)/2
		}
		return rect;
	};

	const _Window_BattleStatus_extraHeight = Window_BattleStatus.prototype.extraHeight;
	Window_BattleStatus.prototype.extraHeight = function() {
		return frameVisible && $dataSystem.optDisplayTp ? 3 : _Window_BattleStatus_extraHeight.call(this);
	};
	//Window_Selectable
	const _Window_BattleStatus_drawBackgroundRect = Window_BattleStatus.prototype.drawBackgroundRect;
	Window_BattleStatus.prototype.drawBackgroundRect = function(rect) {
		if (!noBackGroundRect) _Window_BattleStatus_drawBackgroundRect.call(this, rect);
	};

	Window_BattleStatus.prototype.createActorSprites = function() {
		for (let i = 0; i < $gameParty.maxBattleMembers(); i++) {
			const key = "sv_actor%1".format(i);
			const sprite = this.createInnerSprite(key, Sprite_ActorFV);
			const actorSprites = SceneManager._scene._spriteset._actorSprites;
			actorSprites.push(sprite);
			sprite._actorSprite = true;
		}
	};
	//顔画像の設置
	Window_BattleStatus.prototype.placeActorFace = function(index, x, y, width, height) {
		const sprite = this._additionalSprites["sv_actor%1".format(index)];
		sprite.setHome(x+width/2, y+height);
		sprite.show();
	};

	const _Window_BattleStatus_faceRect = Window_BattleStatus.prototype.faceRect;
	Window_BattleStatus.prototype.faceRect = function(index) {
		const rect = _Window_BattleStatus_faceRect.call(this, index);
		if (!$gameSystem.isSideView() && nonFrameFaceHeight) {
			rect.y -= Math.round((ImageManager.faceHeight - rect.height)/2);
			rect.height = ImageManager.faceHeight;
		}
		return rect;
	};

	Window_BattleStatus.prototype.createInnerSprite = function(key, spriteClass) {
		let newClass = null;
		if (spriteClass === Sprite_Name) {
			newClass = Sprite_BattleStatusName;
		} else if (spriteClass === Sprite_Gauge) {
			newClass = Sprite_BattleStatusGauge;
		}
		return Window_StatusBase.prototype.createInnerSprite.call(this, key, newClass || spriteClass);
	};
	//突出有效吗？。
	const _Window_BattleStatus_addInnerChild = Window_BattleStatus.prototype.addInnerChild;
	Window_BattleStatus.prototype.addInnerChild = function(child) {
		return $gameSystem.isSideView() ? _Window_BattleStatus_addInnerChild.call(this, child) : this._battleField.addChild(child);
	};
	//不显示默认人脸图像。
	const _Window_BattleStatus_drawItemImage = Window_BattleStatus.prototype.drawItemImage;
	Window_BattleStatus.prototype.drawItemImage = function(index) {
		if ($gameSystem.isSideView()) {
			_Window_BattleStatus_drawItemImage.call(this, index);
			return;
		}
		const rect = this.faceRect(index);
		this.placeActorFace(index, rect.x, rect.y, rect.width, rect.height);
	};

	const _Window_BattleStatus_maxCols = Window_BattleStatus.prototype.maxCols;
	Window_BattleStatus.prototype.maxCols = function() {
		return variablePosition ? $gameParty.battleMembers().length : _Window_BattleStatus_maxCols.call(this);
	};

	//-----------------------------------------------------------------------------
	// Window_BattleActor

	Window_BattleActor.prototype.createActorSprites = function() {
		for (let i = 0; i < $gameParty.maxBattleMembers(); i++) {
			const key = "sv_actor%1".format(i);
			const sprite = this.createInnerSprite(key, Sprite_ActorFV);
			const actorSprites = SceneManager._scene._spriteset._actorSprites;
			actorSprites[i]._syncSprite = sprite;
		}
	};

	//-----------------------------------------------------------------------------
	// Spriteset_Battle
	//为演员准备效果容器

	const _Spriteset_Battle_createBattleField = Spriteset_Battle.prototype.createBattleField;
	Spriteset_Battle.prototype.createBattleField = function() {
		_Spriteset_Battle_createBattleField.call(this);
		if (controlAnimation && !$gameSystem.isSideView()) {
			const sprite = new Sprite();
			this._frontEffectsContainer = sprite;
		}
	};

	//-----------------------------------------------------------------------------
	// Scene_Battle

	const _Scene_Battle_createStatusWindow = Scene_Battle.prototype.createStatusWindow;
	Scene_Battle.prototype.createStatusWindow = function() {
		_Scene_Battle_createStatusWindow.call(this);
		if (!this._spriteset._frontEffectsContainer) return;
		const container = this._spriteset._frontEffectsContainer;
		this.addChild(container);
	};

	const _Scene_Battle_statusWindowRect = Scene_Battle.prototype.statusWindowRect;
    Scene_Battle.prototype.statusWindowRect = function() {
    const rect = _Scene_Battle_statusWindowRect.call(this);
    // 移除因frameVisible导致的位置调整，保持原始窗口位置
    return rect;
};

	//-----------------------------------------------------------------------------
	// Spriteset_Base
	//反转动画
	const _Spriteset_Base_animationShouldMirror = Spriteset_Base.prototype.animationShouldMirror;
	Spriteset_Base.prototype.animationShouldMirror = function(target) {
		return $gameSystem.isSideView() || mirrorEnabled ? _Spriteset_Base_animationShouldMirror.call(this, target) : false;
	};
	//如果以演员为目标，则动画将显示在窗口之前
	const _Spriteset_Base_createAnimationSprite = Spriteset_Base.prototype.createAnimationSprite;
	Spriteset_Base.prototype.createAnimationSprite = function(
		targets, animation, mirror, delay
	) {
		const container = this._effectsContainer;
		if (this._frontEffectsContainer && targets.find(target => target.constructor === Game_Actor)) {
			this._effectsContainer = this._frontEffectsContainer;
		}
		_Spriteset_Base_createAnimationSprite.apply(this, arguments);
		this._effectsContainer = container; 
	};

	const _Spriteset_Base_removeAnimation = Spriteset_Base.prototype.removeAnimation;
	Spriteset_Base.prototype.removeAnimation = function(sprite) {
		if (this._frontEffectsContainer) {
			this._frontEffectsContainer.removeChild(sprite);
		}
		_Spriteset_Base_removeAnimation.call(this, sprite);
	};

	//-----------------------------------------------------------------------------
	// Sprite_AnimationMV

	const _Sprite_AnimationMV_updatePosition = Sprite_AnimationMV.prototype.updatePosition;
	Sprite_AnimationMV.prototype.updatePosition = function() {
		_Sprite_AnimationMV_updatePosition.call(this);
		if (this.parent === this.parent.parent._effectsContainer) return;
		
		if (this._animation.position === 3) {
			this.x = Graphics.width / 2;
			this.y = Graphics.height / 2;
		} else if (this._targets.length > 0) {
			const target = this._targets[0];
			const position = target.getGlobalPosition();
			this.x = position.x;
			this.y = position.y;
			if (this._animation.position === 0) {
				this.y -= target.height;
			} else if (this._animation.position === 1) {
				this.y -= target.height / 2;
			}
		}
	};

	//-----------------------------------------------------------------------------
	// Sprite_BattleStatusGauge

	function Sprite_BattleStatusGauge() {
		this.initialize(...arguments);
	}

	Sprite_BattleStatusGauge.prototype = Object.create(Sprite_Gauge.prototype);
	Sprite_BattleStatusGauge.prototype.constructor = Sprite_BattleStatusGauge;

	const _Sprite_Gauge_initMembers = Sprite_Gauge.prototype.initMembers;
	Sprite_BattleStatusGauge.prototype.initMembers = function() {
		_Sprite_Gauge_initMembers.call(this);
	};

	Sprite_BattleStatusGauge.prototype.createBitmap = function() {
		const width = autoStatusWidth ? Graphics.boxWidth : this.bitmapWidth();
		const height = this.bitmapHeight();
		this.bitmap = new Bitmap(width, height);
	};

	const _Sprite_Gauge_setup = Sprite_Gauge.prototype.setup;
	Sprite_BattleStatusGauge.prototype.setup = function(battler, statusType) {
		_Sprite_Gauge_setup.call(this, battler, statusType);
		this.redraw();
	};

	const _Sprite_Gauge_bitmapWidth = Sprite_Gauge.prototype.bitmapWidth;
	Sprite_BattleStatusGauge.prototype.bitmapWidth = function() {
		if (autoStatusWidth) {
			return this.parent.parent.itemRectWithPadding(0).width +2;
		}
		return _Sprite_Gauge_bitmapWidth.call(this);
	};

	//-----------------------------------------------------------------------------
	// Sprite_BattleStatusName

		function Sprite_BattleStatusName() {
		this.initialize(...arguments);
	}

	Sprite_BattleStatusName.prototype = Object.create(Sprite_Name.prototype);
	Sprite_BattleStatusName.prototype.constructor = Sprite_BattleStatusName;

	const _Sprite_Name_initMembers = Sprite_Name.prototype.initMembers;
	Sprite_BattleStatusName.prototype.initMembers = function() {
		_Sprite_Name_initMembers.call(this);
	};

	Sprite_BattleStatusName.prototype.createBitmap = function() {
		const width = autoStatusWidth ? Graphics.boxWidth : this.bitmapWidth();
		const height = this.bitmapHeight();
		this.bitmap = new Bitmap(width, height);
	};

	const _Sprite_Name_setup = Sprite_Name.prototype.setup;
	Sprite_BattleStatusName.prototype.setup = function(battler) {
		_Sprite_Name_setup.call(this, battler);
		if ($gameParty.inBattle()) {
			this.redraw();
		}
	};

	const _Sprite_Name_bitmapWidth = Sprite_Name.prototype.bitmapWidth;
	Sprite_BattleStatusName.prototype.bitmapWidth = function() {
		if (autoStatusWidth) {
			return this.parent.parent.itemRectWithPadding(0).width +2;
		}
		return _Sprite_Name_bitmapWidth.call(this);
	};

	const _Sprite_Name_fontSize = Sprite_Name.prototype.fontSize;
	Sprite_BattleStatusName.prototype.fontSize = function() {
		let fontSize = _Sprite_Name_fontSize.call(this);
		if (frameVisible && autoStatusWidth && $dataSystem.optDisplayTp) {
			fontSize -= 2;
		}
		return fontSize;
	};

}
