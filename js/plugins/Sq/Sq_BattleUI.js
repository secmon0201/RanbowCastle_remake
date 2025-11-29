/*:
 * @target MZ
 * @plugindesc [界面] 战斗窗口位置自定义调整插件
 * @author 神枪手
 * @version 1.0
 *
 * @help
 * ============================================================================
 * 插件功能说明
 * ============================================================================
 * 本插件用于自定义调整战斗场景中各类窗口的位置与尺寸，包括：
 * - 角色状态窗口（含头像显示优化）
 * - 战斗消息窗口
 * - 队伍指令/角色指令窗口
 * - 敌人选择窗口
 * - 战斗日志窗口
 * - 帮助窗口
 * - 战斗返回按钮
 * 
 * ============================================================================
 * 使用方法
 * ============================================================================
 * 1. 将插件放入plugins文件夹并启用
 * 2. 直接在插件代码中修改对应窗口的wx/wy/ww/wh参数调整位置
 * 3. 无需额外配置，启用即可生效
 * 
 * ============================================================================
 * 注意事项
 * ============================================================================
 * - 插件直接修改窗口Rect方法，建议单独测试兼容性
 * - 头像绘制已优化等比例缩放，确保显示效果正常
 */

(() => {
// 这是脸图战斗窗口
Scene_Battle.prototype.statusWindowRect = function() {
    const extra = 10;
    const ww = 480
    const wh = 200+ extra;
    const wx = 0;
    const wy = 0;
    return new Rectangle(wx, wy, ww, wh);
};
Window_BattleStatus.prototype.drawFace = function(faceName, faceIndex, x, y, width, height) {
    width = width || ImageManager.faceWidth;
    height = height || ImageManager.faceHeight;
    
    // 获取头像位图
    const bitmap = ImageManager.loadFace(faceName);
    
    // 计算头像在整幅图中的位置
    const pw = ImageManager.faceWidth;
    const ph = ImageManager.faceHeight;
    const sw = pw;
    const sh = ph;
    const dx = x;
    const dy = y;
    
    // 设置可用绘制区域
    const availableWidth = width || 120;
    const availableHeight = height || 120;
    
    // 计算等比例缩放因子
    const scaleX = availableWidth / pw;
    const scaleY = availableHeight / ph;
    const scale = Math.min(scaleX, scaleY, 1);
    
    // 计算缩放后的尺寸
    const dw = pw * scale;
    const dh = ph * scale;
    
    // 计算源图区域（处理faceIndex，支持一张图多个头像）
    const sx = (faceIndex % 4) * pw;
    const sy = Math.floor(faceIndex / 4) * ph;
    
    // 使用正确的方法绘制
    this.contents.blt(bitmap, sx, sy, sw, sh, dx, dy, dw, dh);
};
    // 战斗窗口震动（原代码保留，未添加具体实现）

    // 战斗选择界面位置的数据
    Scene_Message.prototype.messageWindowRect = function() {
        const ww = Graphics.boxWidth;
        const wh = this.calcWindowHeight(4, false) + 8;
        const wx = (Graphics.boxWidth - ww) / 2;
        const wy = 0;
        return new Rectangle(wx, wy, ww, wh);
    };

    // 攻击战斗指令的选择窗口位置
    Scene_Battle.prototype.partyCommandWindowRect = function() {
        const ww = 130;//192是默认值
        const wh = 200;
        const wx = 0;
        const wy = Graphics.boxHeight - wh;
        return new Rectangle(wx, wy, ww, wh);
    };

    // 战斗指令选择窗口的位置
    Scene_Battle.prototype.actorCommandWindowRect = function() {
        const ww = 130;//192是默认值
        const wh = 200;
        const wx = 0;// 固定在左侧x=0的位置，去掉原有的条件判断
        const wy = 70;
        return new Rectangle(wx, wy, ww, wh);
    };

    // 敌人选择窗口
    Scene_Battle.prototype.enemyWindowRect = function() {
        const wx = 190;
        const ww = this._statusWindow.width;
        const wh = this.windowAreaHeight();
        const wy = Graphics.boxHeight - wh;
        return new Rectangle(wx, wy, ww, wh);
    };

    // 战斗日志窗口
    Scene_Battle.prototype.logWindowRect = function() {
        const wx = 0;
        const wy = 500;
        const ww = Graphics.boxWidth;
        const wh = this.calcWindowHeight(10, false);
        return new Rectangle(wx, wy, ww, wh);
    }

    // 战斗中返回按钮的位置
    Scene_Battle.prototype.createCancelButton = function() {
        this._cancelButton = new Sprite_Button("cancel");
        this._cancelButton.x = 10000;
        this._cancelButton.y = this.buttonY();
        this.addWindow(this._cancelButton);
    };

    // 敌人名称显示窗口（注释保留）
    //Scene_Battle.prototype.enemyWindowRect = function() {
    //    const wx = 700;
    //    const ww = 100;
    //    const wh = 80;
    //    const wy = 550;
    //    return new Rectangle(wx, wy, ww, wh);
    //};
    
    // 修正战斗场景帮助窗口高度，避免父类方法调用错误
//if (Scene_Battle) {
   // Scene_Battle.prototype.helpWindowRect = function() {
        // 直接定义窗口位置和尺寸（x, y, 宽度, 高度）
   //     const wx = 0; // 左对齐
   //     const wy = -5; // 顶部显示（战斗场景帮助窗口通常在顶部）
    //    const ww = Graphics.boxWidth; // 宽度铺满屏幕
    //    const wh = 210; // 固定高度为200
    //    return new Rectangle(wx, wy, ww, wh);
   // };
//}
// 修正战斗场景帮助窗口高度，避免父类方法调用错误
//if (Scene_Battle) {
    //Scene_Battle.prototype.helpWindowRect = function() {
        // 直接定义窗口位置和尺寸（x, y, 宽度, 高度）
    //    const wx = 0; // 左对齐
    //    const wy = -5; // 顶部显示（战斗场景帮助窗口通常在顶部）
     //   const ww = Graphics.boxWidth; // 宽度铺满屏幕
     //   const wh = 210; // 固定高度为200
     //   return new Rectangle(wx, wy, ww, wh);
   // };
//}
 // 让角色选择窗口与帮助窗口位置、尺寸完全一致
   // Scene_Battle.prototype.actorWindowRect = function() {
        // 直接复用帮助窗口的参数，确保位置同步
       // const wx = 0; // 与帮助窗口相同的x坐标
       // const wy = -5; // 与帮助窗口相同的y坐标
       // const ww = Graphics.boxWidth; // 与帮助窗口相同的宽度
       // const wh = 210; // 与帮助窗口相同的高度
       // return new Rectangle(wx, wy, ww, wh);
    //};
    Scene_Battle.prototype.helpWindowRect = function() {
    const wx = 0;
    const wy = -5
    const ww = Graphics.boxWidth;
    const wh = this.helpAreaHeight();
    return new Rectangle(wx, wy, ww, wh);
};
    
    
})();