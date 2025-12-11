# Sq\_MenuUI - J2ME 风格竖屏菜单系统核心

> **Target:** RPG Maker MZ  
> **Resolution:** 480x854 (Vertical Mobile)  
> **Author:** 神枪手 & Gemini Optimization

## 📖 简介 (Introduction)

本插件是专为复刻 J2ME 经典游戏《彩虹城堡》而设计的 UI 核心系统。它彻底重构了 RPG Maker MZ 的默认菜单逻辑，使其完美适配 480x854 的竖屏分辨率。插件不仅调整了窗口布局，还引入了荧光风格的计量槽、大尺寸头像显示以及硬朗的边框风格，旨在还原经典的同时提供现代化的视觉体验。

## ✨ 核心特性 (Features)

  * **竖屏布局适配**：所有菜单界面（主菜单、物品、技能、装备、状态、商店、存档）均已重新排版，完美填充 480x854 屏幕。
  * **J2ME 视觉风格**：强制使用不透明的窗口背景和自定义窗口皮肤 (`Battlewindow`)，还原经典手机游戏质感。
  * **主菜单重构**：
      * 左侧命令窗口 + 右侧状态窗口布局。
      * 状态窗口支持 144x144px 大头像，并带有金色高亮边框。
      * 自定义 `Sprite_MenuGauge`，带有图标指引的荧光色 HP/MP/TP 槽。
  * **高级物品/技能描述**：
      * 支持通过 `<itemStory>` 或 `<skillStory>` 标签显示“小作文”式的故事描述。
      * 描述窗口字体固定为 18号，并支持金色高亮，避免被系统字体设置覆盖。
  * **存档界面升级**：
      * 卡片式存档列表。
      * 自动缩放头像绘制。
      * 显示地图名称、金币、队长等级等扩展信息。
  * **装备界面优化**：
      * 修复了物品列表遮挡底部描述的问题。
      * 在空装备槽位显示“卸下当前装备”提示。

## ⚙️ 参数设置 (Parameters)

| 参数名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `enableLoadCommand` | Boolean | `true` | 是否在主菜单中添加“读档”选项。 |

## 🎨 资源需求 (Requirements)

为了让插件正常工作，请确保你的工程目录中包含以下文件：

### 1\. 图片资源 (`img/pictures/`)

  * **Menu.png**: 全局菜单背景图。建议尺寸：480x854。
  * **hpicon.png**: HP 计量槽左侧的小图标。
  * **mpicon.png**: MP 计量槽左侧的小图标。
  * **tpicon.png**: TP 计量槽左侧的小图标。
  * **lvicon.png**: 等级显示旁边的小图标。

### 2\. 系统资源 (`img/system/`)

  * **Battlewindow.png**: 自定义的窗口皮肤文件。插件会强制所有菜单窗口使用此皮肤。

## 📝 备注标签 (Notetags)

在数据库的 **技能 (Skill)** 或 **物品 (Item)** 或 **装备 (Weapon/Armor)** 的备注栏中，可以使用以下标签来显示特殊的剧情描述（金色高亮）：

  * `<skillStory:你的描述文本>`
  * `<itemStory:你的描述文本>`
  * `<equipStory:你的描述文本>`

如果未填写这些标签，系统将默认显示数据库中的常规“描述”字段（白色文本）。

## 🖥️ 兼容性说明 (Compatibility)

本插件通过深度覆盖 (`Override`) 的方式修改了以下核心类，因此可能会与修改相同界面的 UI 插件冲突：

  * `Scene_Menu`, `Scene_Item`, `Scene_Skill`, `Scene_Equip`, `Scene_Status`, `Scene_Options`, `Scene_Save`, `Scene_Shop`.
  * `Window_MenuStatus`, `Window_SkillList`, `Window_ItemList` 等。

建议将本插件放置在插件列表的**下方**，以确保其布局逻辑生效。

-----

*Created for Rainbow Castle Remake Project.*