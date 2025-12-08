# Sec_Encyclopedia.js 使用说明

## 插件概述

Sec_Encyclopedia.js 是专为 480x720 竖屏游戏设计的综合图鉴系统，支持人物、技能、帮助、敌人解锁和自定义文本追加功能。该插件为玩家提供了一个集中查看游戏角色、技能、敌人信息和帮助文档的平台。

## 资源目录规范

请确保以下文件夹存在，并放入对应图片：
```
img/pictures/Encyclopedia/
- 角色立绘: Actor_{ID}.png (例如 Actor_1.png)
- 帮助图片: 自定义文件名.png (在指令中填写文件名)
- 敌人图片: 自动读取数据库设置，无需额外放入
```

## 功能介绍

### 1. 主菜单集成
- 自动在主菜单中添加"图鉴"命令
- 可自定义主菜单显示名称

### 2. 图鉴分类
- **人物**：显示已解锁的角色和敌人信息
- **技能**：显示已解锁的技能信息
- **帮助**：显示自定义的帮助文档

### 3. 解锁机制
- 角色：加入队伍自动解锁，支持手动强制解锁
- 敌人：支持手动解锁
- 技能：学会自动解锁，支持手动强制解锁

### 4. 自定义文本
- 支持为角色追加剧情或传记文本
- 支持为技能追加攻略或备注文本
- 支持多次追加，自动合并显示

### 5. 帮助系统
- 支持注册多个帮助条目
- 支持纯文本或带图片的帮助内容
- 支持长文本滚动查看

## 插件指令说明

在事件编辑器中选择"插件指令"，选择 Sec_Encyclopedia 即可看到中文菜单：

### 1. 打开图鉴
```
Sec_Encyclopedia open
```

### 2. 解锁操作
```
Sec_Encyclopedia unlockActor id:1  // 解锁角色 1
Sec_Encyclopedia unlockEnemy id:20 // 解锁敌人 20
Sec_Encyclopedia unlockSkill id:5  // 解锁技能 5
```

### 3. 追加文本
```
Sec_Encyclopedia addActorText id:1 text:"这是第一行\n这是第二行"  // 给角色 1 追加文本
Sec_Encyclopedia addSkillText id:5 text:"这是技能的隐藏攻略..."  // 给技能 5 追加文本
```

### 4. 帮助系统配置
```
// 注册一个帮助条目
Sec_Encyclopedia registerHelp key:guide_01 title:新手指南

// 设置帮助内容（带图片）
Sec_Encyclopedia setHelpContent key:guide_01 image:Help_Image text:"这是帮助正文。"

// 设置帮助内容（纯文本）
Sec_Encyclopedia setHelpContent key:guide_02 image:"" text:"纯文字帮助。"
```

## 脚本调用说明

如果你需要在脚本框或条件分支中使用，请参考以下代码：

### 1. 打开图鉴
```javascript
Encyclopedia.open();
```

### 2. 解锁操作
```javascript
Encyclopedia.unlockActor(1);      // 解锁角色 1
Encyclopedia.unlockEnemy(20);     // 解锁敌人 20
Encyclopedia.unlockSkill(5);      // 解锁技能 5
```

### 3. 追加文本
```javascript
Encyclopedia.addActorText(1, "这是第一行\n这是第二行");
Encyclopedia.addSkillText(5, "这是技能的隐藏攻略...");
```

### 4. 帮助系统配置
```javascript
// 注册一个条目 (key是唯一英文标识, title是中文标题)
Encyclopedia.registerHelp("guide_01", "新手指南");

// 设置内容 (key, 图片名, 文字内容)
Encyclopedia.setHelpContent("guide_01", "Help_Image", "这是帮助正文。");

// 如果不需要图片，图片名留空字符串 ""
Encyclopedia.setHelpContent("guide_02", "", "纯文字帮助。");
```

## 使用案例

### 1. 注册帮助文档
```javascript
// 注册两个帮助条目：一个纯文本，一个带图片
Encyclopedia.registerHelp("game_guide", "游戏说明"); // 注册游戏说明帮助
Encyclopedia.registerHelp("element_chart", "图文说明"); // 注册图文说明帮助

// 设置内容
// 注意：需要在 img/pictures/Encyclopedia/ 下放一张名为 Help_Element.png 的图片
Encyclopedia.setHelpContent("game_guide", "", "这是一个基于RMMZ引擎开发的\n《彩虹城堡》重制版项目。\n旨在还原经典剧情的基础上，\n提升游戏体验，\n保留经典元素，\n优化RM原生内容。\n本项目包含大量独立开发的 \n自定义JS插件系统。\n用于定制战斗系统、UI界面、\n角色系统、制作工具等。"); // 设置游戏说明内容
Encyclopedia.setHelpContent("element_chart", "Help_Element", "这是随便塞的图。\n没有意义，纯私货。"); // 设置图文说明内容，带图片
```

### 2. 解锁角色与追加传记
```javascript
// 强制解锁角色 ID 4 和 6 (即使没入队)
Encyclopedia.unlockActor(4); // 解锁角色 4
Encyclopedia.unlockActor(6); // 解锁角色 6

// 给角色 4 追加一段剧情文本
Encyclopedia.addActorText(4, "在彩虹城堡长得的年轻女孩，\n生性活泼开朗，\n与同龄人相比很有耐心。\n在与童年玩伴的互动中，\n她发现了一些有趣的事情。"); // 追加第一段文本

// 再次追加（测试文本合并功能）
Encyclopedia.addActorText(4, "对阿凯的旅途充满兴趣，\n随着一起离开了家乡，\n踏上了寻找朋友、拯救大陆的旅程。"); // 追加第二段文本，自动合并显示
```

### 3. 解锁技能与备注
```javascript
// 解锁技能 ID 301、302、309 和 314
Encyclopedia.unlockSkill(301); // 解锁技能 301
Encyclopedia.unlockSkill(302); // 解锁技能 302
Encyclopedia.unlockSkill(309); // 解锁技能 309
Encyclopedia.unlockSkill(314); // 解锁技能 314

// 给技能添加额外攻略
Encyclopedia.addSkillText(301, "消耗20MP.\n对目标敌人造成火属性伤害。\n同时对目标敌人施加'引火'。\n '引火'可以叠加，\n最高叠加3层。\n达到3层后继续叠加不会提升层数。\n\n\n【丽莎】\n偷偷给敌人兜里塞火药，\n这就是你的战斗方式吗？"); // 技能 301 攻略
Encyclopedia.addSkillText(302, "消耗50MP,\n对目标造成火属性伤害。\n若敌人身上存在'引火'，\n则根据'引火'累计层数，\n每层额外造成5倍atk伤害，\n并移除目标身上的'引火'。\n\n【阿凯】\n听长辈们说过，\n艺术就是爆炸。"); // 技能 302 攻略
Encyclopedia.addSkillText(309, "消耗30MP,\n恢复自身一定血量。\n初次使用，\n开始为队友抵御一半伤害。\n再次使用，\n停止为队友抵挡。\n抵挡过程中，队友先承担全额伤害，\n然后恢复被抵挡伤害;\n技能使用者则扣除对应血量。\n\n\n【阿凯】\n有你在，\n我们就可以放心挨打了。"); // 技能 309 攻略
Encyclopedia.addSkillText(314, "普通攻击招式。\n若目标身上不存在'引火'，\n则为其施加一层'引火'。\n\n阿凯练剑多年学成的招式，\n将火焰融入普通攻击之中，\n会出带火的直剑。\n充满神秘又数值的力量。\n\n\n【彩虹城堡村民】\n这得多想赢才能学会这一招。"); // 技能 314 攻略
```

### 4. 解锁敌人
```javascript
// 解锁敌人 ID 2 (假设是史莱姆)
Encyclopedia.unlockEnemy(2); // 解锁敌人 2
```

## 功能特点

1. **竖屏适配**：专为 480x720 竖屏游戏设计的界面布局
2. **智能布局**：根据不同分类自动调整窗口比例
3. **触摸支持**：支持触摸滑动查看长文本
4. **自动解锁**：已加入队伍的角色自动解锁图鉴条目
5. **文本合并**：支持多次追加文本，自动合并显示
6. **滚动支持**：长文本内容支持滚动查看
7. **主菜单集成**：自动在主菜单中添加"图鉴"命令
8. **图片支持**：帮助文档支持添加图片
9. **分类清晰**：人物、技能、帮助分类明确，易于查找
10. **灵活配置**：支持插件指令和脚本调用两种方式

## 界面说明

### 图鉴主界面
- **顶部**：分类选择栏（人物、技能、帮助）
- **左侧**：对应分类的列表
- **右侧上半部分**：选中条目的图片或技能信息
- **右侧下半部分**：选中条目的详细描述

### 智能布局
- 技能界面：右侧上半部分只占 28% 高度
- 其他界面：右侧上半部分占 45% 高度

### 操作说明
- **方向键**：选择分类和列表项
- **Enter**：确认选择
- **Escape**：返回上一级或关闭图鉴
- **触摸滑动**：在详细描述区域可上下滑动查看长文本

## 注意事项

1. 确保资源目录结构正确，图片文件放置在指定位置
2. 帮助文档的图片文件名不要带后缀
3. 文本内容支持 \n 换行符，可用于排版
4. 解锁操作不可逆，一旦解锁无法重新锁定
5. 多次追加文本会自动合并，无需担心重复添加
6. 技能描述会自动显示数据库中的基本信息，追加的文本会显示在详细描述区域
7. 敌人图片自动读取数据库设置，无需额外添加

## 常见问题

### Q: 为什么图鉴中没有显示某个角色？
A: 请确保该角色已加入队伍或已通过插件指令手动解锁。

### Q: 为什么帮助文档的图片不显示？
A: 请检查图片文件名是否正确，是否放置在 img/pictures/Encyclopedia/ 目录下，且插件指令中没有带文件后缀。

### Q: 如何修改主菜单中的图鉴命令名称？
A: 在插件参数中修改 "主菜单显示名称" 即可。

### Q: 为什么技能的详细描述为空？
A: 请确保已通过插件指令为该技能追加了文本描述。

### Q: 如何在脚本中判断某个角色是否已解锁？
A: 可以通过 Encyclopedia.data.unlockedActors.includes(actorId) 进行判断。

## 更新日志

### v1.0.0
- 初始版本
- 支持人物、技能、帮助三个分类
- 支持角色、敌人、技能解锁
- 支持自定义文本追加
- 支持帮助文档配置
- 竖屏布局适配
- 触摸滑动支持

## 作者信息

- **作者**：Secmon
- **插件名称**：Sec_Encyclopedia.js
- **适用引擎**：RPG Maker MZ
- **设计目标**：为竖屏游戏提供综合图鉴系统

## 许可协议

本插件采用 MIT 许可协议，可自由使用、修改和分发，但请保留作者信息和插件头注释。

## 联系反馈

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 游戏开发论坛
- 邮件联系

---

感谢使用 Sec_Encyclopedia.js 插件！希望它能为你的游戏增添更多乐趣和丰富的内容展示方式。