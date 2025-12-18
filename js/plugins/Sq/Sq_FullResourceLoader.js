/*:
 * @target MZ
 * @plugindesc [V7.0 终极性能版] 优先级队列 + 预解码 + 智能并发 + 指数重试
 * @author Gemini & You
 *
 * @help
 * 【V7.0 终极优化内容】
 * 1. **优先级加载**：优先下载 System/Title 等核心资源，确保开局不黑屏。
 * 2. **强制预解码**：在加载阶段完成图片解码，消除游戏内的“首帧卡顿”。
 * 3. **指数退避重试**：网络越差，重试等待越长，大幅提高国内连接成功率。
 * 4. **HTTP/2 并发**：针对 Vercel 优化并发数至 32，榨干下载速度。
 *
 * 【必须操作】
 * 1. 开启 DevMode。
 * 2. 在 PC 编辑器里 "测试游戏"，按 F8 看控制台，等待生成 data/file_list.json。
 * 3. 关闭 DevMode，部署到 Vercel。
 *
 * @param DevMode
 * @text 开发者模式(生成清单)
 * @type boolean
 * @default true
 *
 * @param BarColor
 * @text 进度条颜色
 * @default #00ff00
 */

(() => {
    const pluginName = "Sq_FullResourceLoader";
    const parameters = PluginManager.parameters(pluginName);
    const isDevMode = parameters['DevMode'] === 'true';
    const barColor = parameters['BarColor'] || '#00ff00';
    const fs = (Utils.isNwjs() && typeof require === 'function') ? require('fs') : null;
    const path = (Utils.isNwjs() && typeof require === 'function') ? require('path') : null;

    // ======================================================================
    // 1. 开发者模式：智能扫描与排序
    // ======================================================================
    function generateFileList() {
        if (!fs || !path || !Utils.isOptionValid('test')) return;

        const baseDir = path.dirname(process.mainModule.filename);
        
        // 【优化1：优先级排序】
        // 核心UI和标题最先加载，然后是常用角色，最后是特效和地图
        const scanDirs = [
            // 第一梯队：绝对核心 (UI, 标题, 字体, 核心音效)
            'img/system', 'img/titles1', 'img/titles2', 'audio/se', 
            // 第二梯队：常用素材 (角色, 脸图)
            'img/characters', 'img/faces',
            // 第三梯队：战斗相关
            'img/sv_actors', 'img/sv_enemies', 'img/enemies', 'img/animations', 
            'img/battlebacks1', 'img/battlebacks2',
            // 第四梯队：地图与大图
            'img/tilesets', 'img/parallaxes', 'img/pictures',
            // 第五梯队：低优先级音频 (BGM/BGS/ME)
            'audio/me', 'audio/bgs', 'audio/bgm'
        ];

        let fileList = [];

        scanDirs.forEach(dir => {
            const fullPath = path.join(baseDir, dir);
            if (fs.existsSync(fullPath)) {
                const files = fs.readdirSync(fullPath);
                files.forEach(file => {
                    if (file.match(/\.(png|jpg|webp|ogg|m4a)$/i)) {
                        let assetType = 'unknown';
                        if (dir.startsWith('img')) assetType = 'image';
                        else if (dir.includes('/se') || dir.includes('/me')) assetType = 'audio_se';
                        else assetType = 'audio_bgm';

                        fileList.push({
                            path: dir + '/' + file,
                            type: assetType
                        });
                    }
                });
            }
        });

        const jsonPath = path.join(baseDir, 'data', 'file_list.json');
        fs.writeFileSync(jsonPath, JSON.stringify(fileList));
        console.log(`%c[${pluginName}] 资源清单生成完毕！共扫描到 ${fileList.length} 个文件。`, "color: #00ff00; font-weight: bold;");
    }

    // ======================================================================
    // 2. 加载场景
    // ======================================================================
    function Scene_FullLoad() {
        this.initialize(...arguments);
    }

    Scene_FullLoad.prototype = Object.create(Scene_Base.prototype);
    Scene_FullLoad.prototype.constructor = Scene_FullLoad;

    Scene_FullLoad.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
        this._totalAssets = 0;
        this._loadedAssets = 0;
        this._errorCount = 0;
        this._hasStartedLoading = false;
        this._timeoutCheck = Date.now(); 
        this._loadingFile = ""; // 用于显示当前文件名
    };

    Scene_FullLoad.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        this.createBackground();
        this.createProgressBar();
        this.createProgressText();
        this.loadManifest();
    };

    Scene_FullLoad.prototype.loadManifest = function() {
        const xhr = new XMLHttpRequest();
        const url = 'data/file_list.json';
        xhr.open('GET', url);
        xhr.overrideMimeType('application/json');
        xhr.onload = () => {
            if (xhr.status < 400) {
                const fileList = JSON.parse(xhr.responseText);
                this.startLoadingAssets(fileList);
            } else {
                this.gotoNextScene();
            }
        };
        xhr.onerror = () => this.gotoNextScene();
        xhr.send();
    };

    Scene_FullLoad.prototype.startLoadingAssets = function(list) {
        // 依然过滤 BGM，手机端内存杀手
        const loadList = list.filter(item => item.type !== 'audio_bgm');
        
        if (loadList.length === 0) {
            this.gotoNextScene();
            return;
        }

        this._totalAssets = loadList.length;
        this._hasStartedLoading = true;
        this._queue = loadList;
        this._activeDownloads = 0;
        
        // 【优化4：提高并发】Vercel 支持 HTTP/2，可以放心开大并发
        this._maxConcurrent = 32; 
    };

    Scene_FullLoad.prototype.update = function() {
        Scene_Base.prototype.update.call(this);
        
        if (this._hasStartedLoading) {
            this.processQueue();
            this.updateBar();
            
            if (this._loadedAssets >= this._totalAssets) {
                this.gotoNextScene();
            }
            // 90秒兜底超时
            if (Date.now() - this._timeoutCheck > 90000) {
                console.warn("加载超时，强制进入游戏");
                this.gotoNextScene();
            }
        }
    };

    Scene_FullLoad.prototype.processQueue = function() {
        while (this._queue.length > 0 && this._activeDownloads < this._maxConcurrent) {
            const item = this._queue.shift();
            this._activeDownloads++;
            this.loadSingleAsset(item, 0);
        }
    };

    Scene_FullLoad.prototype.loadSingleAsset = function(item, retryCount) {
        // 视觉反馈：偶尔更新一下当前正在加载的文件名（太频繁会闪瞎眼，所以加个随机）
        if (Math.random() < 0.1) this._loadingFile = item.path.split('/').pop(); 

        const onSuccess = () => {
            this._activeDownloads--;
            this._loadedAssets++;
        };

        const onError = () => {
            if (retryCount < 3) {
                // 【优化3：指数退避重试】
                // 第一次失败等 500ms，第二次 1500ms，第三次 4500ms
                // 给网络波动足够的恢复时间
                const delay = 500 * Math.pow(3, retryCount); 
                setTimeout(() => {
                    this.loadSingleAsset(item, retryCount + 1);
                }, delay);
            } else {
                console.warn(`彻底加载失败: ${item.path}`);
                this._activeDownloads--;
                this._loadedAssets++; 
                this._errorCount++;
            }
        };

        if (item.type === 'image') {
            const bitmap = ImageManager.loadBitmapFromUrl(item.path);
            bitmap.addLoadListener(() => {
                // 【优化2：强制预解码】
                // 下载完不算完，解压完才算完。这能消除游戏内的首帧卡顿。
                if (bitmap.image && bitmap.image.decode) {
                    bitmap.image.decode()
                        .then(onSuccess)
                        .catch(() => {
                            // 解码失败不影响流程，算作成功
                            onSuccess();
                        });
                } else {
                    onSuccess();
                }
            });
            // 错误处理劫持
            const originalOnError = bitmap._onError;
            bitmap._onError = () => {
                if (originalOnError) originalOnError.apply(bitmap);
                onError();
            };
        } else {
            // 音频 fetch 预热
            fetch(item.path)
                .then(response => {
                    if (response.ok) return response.blob();
                    throw new Error('Network err');
                })
                .then(() => onSuccess())
                .catch(() => onError());
        }
    };

    Scene_FullLoad.prototype.createBackground = function() {
        this._backSprite = new Sprite(new Bitmap(Graphics.width, Graphics.height));
        this._backSprite.bitmap.fillAll('#000000');
        this.addChild(this._backSprite);
    };

    Scene_FullLoad.prototype.createProgressBar = function() {
        const width = Graphics.width * 0.8; 
        const height = 20;
        const x = (Graphics.width - width) / 2;
        const y = Graphics.height / 2;

        this._barBack = new Sprite(new Bitmap(width + 4, height + 4));
        this._barBack.x = x - 2;
        this._barBack.y = y - 2;
        this._barBack.bitmap.fillAll('#333333');
        this.addChild(this._barBack);

        this._barFront = new Sprite(new Bitmap(width, height));
        this._barFront.x = x;
        this._barFront.y = y;
        this.addChild(this._barFront);
        
        this._barWidth = width;
    };

    Scene_FullLoad.prototype.createProgressText = function() {
        this._textSprite = new Sprite(new Bitmap(Graphics.width, 100));
        this._textSprite.y = Graphics.height / 2 + 30;
        this._textSprite.bitmap.fontFace = "sans-serif"; 
        this._textSprite.bitmap.fontSize = 20; // 稍微改小一点字号适应文件名
        this.addChild(this._textSprite);
    };

    Scene_FullLoad.prototype.updateBar = function() {
        const ratio = this._totalAssets > 0 ? (this._loadedAssets / this._totalAssets) : 0;
        this._barFront.bitmap.clear();
        this._barFront.bitmap.fillRect(0, 0, this._barWidth * ratio, 20, barColor);

        this._textSprite.bitmap.clear();
        this._textSprite.bitmap.fontFace = "sans-serif"; 
        
        const percent = Math.floor(ratio * 100);
        let text = `正在下载... ${percent}%`;
        // 【视觉优化】显示当前正在处理的文件名，让玩家知道没死机
        if (this._loadingFile) text += ` (${this._loadingFile})`; 
        if (this._errorCount > 0) text += ` [失败:${this._errorCount}]`;
        
        const text2 = `(${this._loadedAssets} / ${this._totalAssets})`;
        
        try {
            this._textSprite.bitmap.drawText(text, 0, 0, Graphics.width, 32, 'center');
            this._textSprite.bitmap.drawText(text2, 0, 40, Graphics.width, 32, 'center');
        } catch(e) {}
    };

    Scene_FullLoad.prototype.gotoNextScene = function() {
        if (this._isGoingNext) return;
        this._isGoingNext = true;
        SceneManager.goto(Scene_Boot);
    };

    // ======================================================================
    // 启动拦截
    // ======================================================================
    const _Scene_Boot_startNormalGame = Scene_Boot.prototype.startNormalGame;
    Scene_Boot.prototype.startNormalGame = function() {
        if (isDevMode && Utils.isNwjs() && Utils.isOptionValid('test')) {
            generateFileList();
        }

        if (!Scene_Boot._hasPreloaded && !Utils.isNwjs()) { 
            Scene_Boot._hasPreloaded = true;
            SceneManager.goto(Scene_FullLoad);
        } else {
            _Scene_Boot_startNormalGame.call(this);
        }
    };

})();