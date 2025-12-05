/*:
 * @target MZ
 * @plugindesc [彩虹城堡重制] 战斗光标重绘扩展 - 动态四向箭头
 * @author RPG Maker MZ Plugin Master
 * @base MOG_BattleCursor
 * @orderAfter MOG_BattleCursor
 *
 * @param Basic Settings
 * @text —— 基础设置 ——
 *
 * @param Cursor Radius
 * @parent Basic Settings
 * @text 光标半径
 * @desc 箭头尖端距离中心的距离。针对132px的敌人，建议设为 80 左右。
 * @type number
 * @default 80
 *
 * @param Arrow Size
 * @parent Basic Settings
 * @text 箭头大小
 * @desc 三角形箭头的尺寸（像素）。
 * @type number
 * @default 24
 *
 * @param Arrow Color
 * @parent Basic Settings
 * @text 箭头颜色
 * @desc 箭头的填充颜色 (Hex格式)。经典的黄: #FFFF00，红: #FF0000。
 * @type string
 * @default #FFFF00
 *
 * @param Enemy Placeholder Size
 * @parent Basic Settings
 * @text 敌人基准尺寸
 * @desc 用于辅助计算中心点的虚拟尺寸。输入你的敌人素材大小。
 * @type number
 * @default 132
 *
 * @param Animation Settings
 * @text —— 动画设置 ——
 *
 * @param Pulse Speed
 * @parent Animation Settings
 * @text 呼吸速度
 * @desc 箭头缩放移动的速度。数值越大越快。
 * @type number
 * @default 4
 *
 * @param Pulse Range
 * @parent Animation Settings
 * @text 呼吸幅度
 * @desc 箭头浮动的像素距离。
 * @type number
 * @default 8
 *
 * @help
 * ============================================================================
 * ■ MOG_BattleCursor_Procedural.js
 * ============================================================================
 * 这是一个专为《彩虹城堡》竖屏重制版设计的 MOG_BattleCursor 扩展插件。
 * 它利用 RPG Maker MZ 的原生 Canvas 绘图接口，重绘了战斗光标。
 * 
 * ★ 核心功能：
 * 1. 自动生成 4 个指向中心的三角箭头。
 * 2. 修复了 RPG Maker 默认对齐脚底的问题，强制对齐 132px 敌人的中心。
 * 3. 实现了平滑的正弦波呼吸动效。
 *
 * ★ 必须设置：
 * 请在 MOG_BattleCursor 原插件中，将 [Align for Enemy] 设为 [Center]。
 * ============================================================================
 */

(() => {
    const pluginName = "MOG_BattleCursor_Procedural";
    const parameters = PluginManager.parameters(pluginName);
    
    // 参数读取
    const pRadius = Number(parameters['Cursor Radius'] || 80);
    const pArrowSize = Number(parameters['Arrow Size'] || 24);
    const pColor = String(parameters['Arrow Color'] || '#FFFF00');
    const pRefSize = Number(parameters['Enemy Placeholder Size'] || 132);
    const pPulseSpeed = Number(parameters['Pulse Speed'] || 4);
    const pPulseRange = Number(parameters['Pulse Range'] || 8);

    // 依赖检查
    if (!Imported.MOG_BattleCursor) {
        console.warn("警告：未检测到 MOG_BattleCursor，请确保已安装该插件。");
        return;
    }

    //=============================================================================
    // 覆盖 Sprite_BattleCursor 的图片加载逻辑
    //=============================================================================
    
    // 拦截 loadBitmap：不再加载 PNG，而是创建针对敌人尺寸优化的占位符
    const _Sprite_BattleCursor_loadBitmap = Sprite_BattleCursor.prototype.loadBitmap;
    Sprite_BattleCursor.prototype.loadBitmap = function() {
        // 创建一个透明的 Bitmap，大小设为敌人尺寸 (132x132)
        // 这样 MOG 的 "Align: Center" 逻辑在计算时，会准确地把这个框叠在敌人身上
        this.bitmap = new Bitmap(pRefSize, pRefSize);
        
        // 设置锚点为绝对中心
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        
        // 标记光标已加载
        this._cursorLoaded = true;
        
        // 初始化我们的自定义箭头
        this.createProceduralArrows();
    };

    //=============================================================================
    // 绘制与创建箭头
    //=============================================================================

    const _Sprite_BattleCursor_initialize = Sprite_BattleCursor.prototype.initialize;
    Sprite_BattleCursor.prototype.initialize = function(battler) {
        _Sprite_BattleCursor_initialize.call(this, battler);
        this._procAnimTime = 0; 
    };

    Sprite_BattleCursor.prototype.createProceduralArrows = function() {
        // 清理旧的（如果有）
        if (this._arrowSprites) {
            this._arrowSprites.forEach(s => this.removeChild(s));
        }
        this._arrowSprites = [];
        
        // 1. 绘制箭头纹理 (复用同一个Bitmap以节省显存)
        // 画一个向右指的三角形 (>)
        const size = pArrowSize;
        const arrowBitmap = new Bitmap(size, size);
        const ctx = arrowBitmap.context;
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(size, size / 2); // 顶点 (右)
        ctx.lineTo(0, 0);           // 左上
        ctx.lineTo(0, size);        // 左下
        ctx.closePath();
        
        // 填充
        ctx.fillStyle = pColor;
        ctx.fill();
        
        // 描边 (黑色2px，增加复古清晰度)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 外发光 (可选，增加层次感)
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.restore();
        
        arrowBitmap._baseTexture.update(); // 提交绘图到显存

        // 2. 创建四个方向的子 Sprite
        // 索引: 0:上, 1:右, 2:下, 3:左
        for (let i = 0; i < 4; i++) {
            const sprite = new Sprite(arrowBitmap);
            sprite.anchor.x = 0.5;
            sprite.anchor.y = 0.5;
            
            // 计算旋转角度 (弧度)
            let angle = 0;
            if (i === 0) angle = 90;   // 上方箭头：向下指 (90度)
            if (i === 1) angle = 180;  // 右方箭头：向左指 (180度)
            if (i === 2) angle = 270;  // 下方箭头：向上指 (270度)
            if (i === 3) angle = 0;    // 左方箭头：向右指 (0度)
            
            sprite.rotation = angle * (Math.PI / 180);
            
            this.addChild(sprite);
            this._arrowSprites.push(sprite);
        }
    };

    //=============================================================================
    // 动画更新逻辑
    //=============================================================================

    const _Sprite_BattleCursor_update = Sprite_BattleCursor.prototype.update;
    Sprite_BattleCursor.prototype.update = function() {
        _Sprite_BattleCursor_update.call(this);
        // 只有当光标可见时才更新箭头动画
        if (this._arrowSprites && this.visible) {
            this.updateProceduralAnimation();
        }
    };

    Sprite_BattleCursor.prototype.updateProceduralAnimation = function() {
        // 增加时间计数
        this._procAnimTime += pPulseSpeed;
        
        // 呼吸算法 (Math.sin)
        // 产生 -1 到 1 之间的平滑波动
        const wave = Math.sin(this._procAnimTime * 0.05); 
        
        // 计算当前的动态半径
        // 基础半径 + (波动值 * 幅度)
        const currentRadius = pRadius + (wave * pPulseRange);

        // 更新四个箭头的位置
        const arrows = this._arrowSprites;
        
        // 0: 上 (x=0, y负方向)
        if (arrows[0]) { arrows[0].x = 0; arrows[0].y = -currentRadius; }
        
        // 1: 右 (x正方向, y=0)
        if (arrows[1]) { arrows[1].x = currentRadius; arrows[1].y = 0; }
        
        // 2: 下 (x=0, y正方向)
        if (arrows[2]) { arrows[2].x = 0; arrows[2].y = currentRadius; }
        
        // 3: 左 (x负方向, y=0)
        if (arrows[3]) { arrows[3].x = -currentRadius; arrows[3].y = 0; }
        
        // 确保子箭头透明度跟随父级 (处理淡入淡出)
        const parentOpacity = this.opacity;
        for (const arrow of arrows) {
            arrow.opacity = parentOpacity;
            arrow.visible = this.visible; // 双重保险
        }
    };

})();