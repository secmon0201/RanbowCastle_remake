/*:
* @target MZ
* @plugindesc [系统] 防止运行黑屏 & 强制保持活跃 & 后台不暂停
* @author 婧媗收集分享
*
* @help
* 防止游戏运行黑屏（放游戏项目直接使用）
*/
SceneManager.isGameActive = function () {
    return true;
};