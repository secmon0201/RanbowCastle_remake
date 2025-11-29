/*:
* @target MZ
* @plugindesc v1.0.0 <防止游戏运行黑屏>
* @author 婧媗收集分享
*
* @help
* 防止游戏运行黑屏（放游戏项目直接使用）
*/
SceneManager.isGameActive = function () {
    return true;
};