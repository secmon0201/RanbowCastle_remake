@echo off
setlocal enabledelayedexpansion

REM 切换控制台编码为 UTF-8，确保写入的中文字符不乱码
chcp 65001 > nul

echo ==========================================
echo      RPG Maker MZ package.json 修复工具
echo ==========================================
echo.

REM 1. 检查文件是否存在，如果存在且为只读，先去除只读属性以便写入
if exist package.json (
    echo [状态] 发现现有文件，正在移除只读属性...
    attrib -r package.json
)

REM 2. 写入配置内容
echo [状态] 正在重写 package.json 内容...

(
echo {
echo     "name": "rmmz-game",
echo     "main": "index.html",
echo     "chromium-args": "--force-color-profile=srgb --disable-renderer-backgrounding --disable-background-timer-throttling --disable-features=CalculateNativeWinOcclusion",
echo     "window": {
echo         "title": "彩虹城堡完美重置版",
echo         "width": 480,
echo         "height": 854,
echo         "position": "center",
echo         "icon": "icon/icon.png"
echo     }
echo }
) > package.json

REM 3. 将文件设为只读，防止编辑器篡改
echo [状态] 正在锁定文件（设置为只读）...
attrib +r package.json

echo.
echo ==========================================
echo    修复成功！配置已更新并锁定。
echo ==========================================
echo.
pause