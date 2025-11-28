class SinaVideoDownloader {
    constructor() {
        this.validVideos = [];
        this.downloadedVideos = [];
        this.isScanning = false;
        this.isDownloading = false;
        this.proxyUrl = 'https://CorsProxy.io/'; // CORS代理
        this.baseApiUrl = 'http://api.ivideo.sina.com.cn/public/video/play/url';
        this.baseFlvUrl = 'http://cdn.sinacloud.net/edge.v.iask.com/';
        
        this.initializeEventListeners();
        this.log('新浪视频下载工具 Web版 已初始化', 'success');
    }

    initializeEventListeners() {
        // 扫描按钮
        document.getElementById('scanBtn').addEventListener('click', () => this.startScan());
        
        // 下载全部按钮
        document.getElementById('downloadAllBtn').addEventListener('click', () => this.downloadAll());
        
        // 打包ZIP按钮
        document.getElementById('packZipBtn').addEventListener('click', () => this.packToZip());
        
        // 清空日志按钮
        document.getElementById('clearLogBtn').addEventListener('click', () => this.clearLog());
        
        // 模态框关闭
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('videoModal')) {
                this.closeModal();
            }
        });
    }

    async startScan() {
        if (this.isScanning) return;
        
        const startVid = parseInt(document.getElementById('startVid').value);
        const endVid = parseInt(document.getElementById('endVid').value);
        const concurrent = parseInt(document.getElementById('concurrent').value);
        
        if (startVid > endVid) {
            this.log('起始VID不能大于结束VID', 'error');
            return;
        }
        
        this.isScanning = true;
        this.updateScanUI(true);
        this.clearResults();
        
        const total = endVid - startVid + 1;
        this.log(`开始扫描VID范围: ${startVid} - ${endVid} (共${total}个)`, 'info');
        
        try {
            // 分批处理避免阻塞
            const batchSize = Math.min(concurrent, 10);
            let completed = 0;
            
            for (let i = startVid; i <= endVid; i += batchSize) {
                if (!this.isScanning) break;
                
                const batchEnd = Math.min(i + batchSize - 1, endVid);
                const batchPromises = [];
                
                for (let vid = i; vid <= batchEnd; vid++) {
                    batchPromises.push(this.checkVideo(vid));
                }
                
                const batchResults = await Promise.all(batchPromises);
                const validBatch = batchResults.filter(result => result.valid);
                
                validBatch.forEach(result => {
                    this.addVideoToList(result);
                });
                
                completed += batchSize;
                this.updateProgress(completed, total, `扫描中... 已找到 ${this.validVideos.length} 个有效视频`);
                
                // 添加延迟避免请求过于频繁
                await this.delay(100);
            }
            
            this.log(`扫描完成! 找到 ${this.validVideos.length} 个有效视频`, 'success');
            this.updateDownloadButton();
            
        } catch (error) {
            this.log(`扫描过程中出错: ${error.message}`, 'error');
        } finally {
            this.isScanning = false;
            this.updateScanUI(false);
        }
    }

    async checkVideo(vid) {
        try {
            const params = new URLSearchParams({
                appname: "web",
                appver: "web",
                applt: "web",
                tags: "popview",
                direct: "0",
                vid: vid.toString()
            });
            
            const response = await fetch(this.proxyUrl + this.baseApiUrl + '?' + params, {
                method: 'GET',
                headers: {
                    'User-Agent': this.getRandomUserAgent()
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.url) {
                    return {
                        vid: vid,
                        valid: true,
                        title: `视频_${vid}`,
                        format: await this.detectFormat(vid)
                    };
                }
            }
        } catch (error) {
            // 忽略单个视频检查的错误
        }
        
        return { vid: vid, valid: false };
    }

    async detectFormat(vid) {
        const formats = ['flv', 'hlv', 'mp4'];
        
        for (const format of formats) {
            try {
                const testUrl = this.baseFlvUrl + `${vid}.${format}`;
                const response = await fetch(this.proxyUrl + testUrl, {
                    method: 'HEAD',
                    headers: {
                        'User-Agent': this.getRandomUserAgent()
                    }
                });
                
                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && (contentType.includes('video') || contentType.includes('octet-stream'))) {
                        return format;
                    }
                }
            } catch (error) {
                continue;
            }
        }
        
        return 'mp4'; // 默认格式
    }

    async downloadAll() {
        if (this.isDownloading || this.validVideos.length === 0) return;
        
        this.isDownloading = true;
        this.updateDownloadUI(true);
        this.log(`开始下载 ${this.validVideos.length} 个视频...`, 'info');
        
        try {
            for (let i = 0; i < this.validVideos.length; i++) {
                if (!this.isDownloading) break;
                
                const video = this.validVideos[i];
                await this.downloadSingleVideo(video, i);
                this.updateProgress(i + 1, this.validVideos.length, `下载中... ${i + 1}/${this.validVideos.length}`);
            }
            
            this.log(`下载完成! 成功下载 ${this.downloadedVideos.length} 个视频`, 'success');
            this.updatePackButton();
            
        } catch (error) {
            this.log(`下载过程中出错: ${error.message}`, 'error');
        } finally {
            this.isDownloading = false;
            this.updateDownloadUI(false);
        }
    }

    async downloadSingleVideo(video, index) {
        try {
            const fileExtension = document.getElementById('fileExtension').value;
            const format = fileExtension === 'auto' ? video.format : fileExtension;
            const url = this.baseFlvUrl + `${video.vid}.${format}`;
            
            this.updateVideoStatus(video.vid, 'downloading');
            this.log(`开始下载: VID ${video.vid} (${format})`, 'info');
            
            const response = await fetch(this.proxyUrl + url, {
                headers: {
                    'User-Agent': this.getRandomUserAgent()
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const downloadUrl = URL.createObjectURL(blob);
                
                video.downloadUrl = downloadUrl;
                video.blob = blob;
                video.filename = `video_${video.vid}.${format}`;
                
                this.downloadedVideos.push(video);
                this.updateVideoStatus(video.vid, 'completed');
                this.log(`下载完成: ${video.filename}`, 'success');
                
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
            
        } catch (error) {
            this.updateVideoStatus(video.vid, 'error');
            this.log(`下载失败 VID ${video.vid}: ${error.message}`, 'error');
        }
    }

    async packToZip() {
        if (this.downloadedVideos.length === 0) {
            this.log('没有已下载的视频可以打包', 'warning');
            return;
        }
        
        this.log(`开始打包 ${this.downloadedVideos.length} 个视频到ZIP...`, 'info');
        
        try {
            const zip = new JSZip();
            const videoFolder = zip.folder('sina_videos');
            
            for (const video of this.downloadedVideos) {
                if (video.blob) {
                    videoFolder.file(video.filename, video.blob);
                }
            }
            
            const content = await zip.generateAsync({ type: 'blob' });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const zipFilename = `sina_videos_${timestamp}.zip`;
            
            saveAs(content, zipFilename);
            this.log(`ZIP打包完成: ${zipFilename}`, 'success');
            
        } catch (error) {
            this.log(`打包失败: ${error.message}`, 'error');
        }
    }

    // 工具方法
    getRandomUserAgent() {
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
        ];
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    log(message, type = 'info') {
        const logContainer = document.getElementById('logContainer');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    clearLog() {
        document.getElementById('logContainer').innerHTML = '';
        this.log('日志已清空', 'info');
    }

    clearResults() {
        this.validVideos = [];
        this.downloadedVideos = [];
        document.getElementById('videoList').innerHTML = '';
        document.getElementById('validCount').textContent = '0';
        document.getElementById('downloadedCount').textContent = '0';
    }

    addVideoToList(video) {
        this.validVideos.push(video);
        
        const videoList = document.getElementById('videoList');
        const videoItem = document.createElement('div');
        videoItem.className = 'video-item';
        videoItem.id = `video-${video.vid}`;
        videoItem.innerHTML = `
            <div class="video-info">
                <span>VID: ${video.vid}</span>
                <span class="video-status status-found">已找到</span>
                <span>格式: ${video.format}</span>
            </div>
            <div class="video-actions">
                <button class="btn btn-outline" onclick="downloader.previewVideo(${video.vid})">预览</button>
                <button class="btn btn-outline" onclick="downloader.downloadSingle(${video.vid})">单独下载</button>
            </div>
        `;
        
        videoList.appendChild(videoItem);
        document.getElementById('validCount').textContent = this.validVideos.length;
    }

    updateVideoStatus(vid, status) {
        const videoItem = document.getElementById(`video-${vid}`);
        if (videoItem) {
            const statusElement = videoItem.querySelector('.video-status');
            statusElement.className = `video-status status-${status}`;
            
            switch (status) {
                case 'downloading':
                    statusElement.textContent = '下载中';
                    break;
                case 'completed':
                    statusElement.textContent = '已完成';
                    break;
                case 'error':
                    statusElement.textContent = '失败';
                    break;
                default:
                    statusElement.textContent = '已找到';
            }
        }
        
        document.getElementById('downloadedCount').textContent = 
            this.downloadedVideos.length;
    }

    updateProgress(current, total, text) {
        const percentage = (current / total) * 100;
        document.getElementById('progressFill').style.width = `${percentage}%`;
        document.getElementById('progressText').textContent = text;
    }

    updateScanUI(scanning) {
        document.getElementById('scanBtn').disabled = scanning;
        document.getElementById('scanBtn').textContent = scanning ? '🔄 扫描中...' : '🔍 扫描视频';
    }

    updateDownloadUI(downloading) {
        document.getElementById('downloadAllBtn').disabled = downloading || this.validVideos.length === 0;
        document.getElementById('downloadAllBtn').textContent = downloading ? '⏬ 下载中...' : '📥 下载全部';
    }

    updateDownloadButton() {
        document.getElementById('downloadAllBtn').disabled = this.validVideos.length === 0;
    }

    updatePackButton() {
        document.getElementById('packZipBtn').disabled = this.downloadedVideos.length === 0;
    }

    async previewVideo(vid) {
        const video = this.validVideos.find(v => v.vid === vid);
        if (video && video.downloadUrl) {
            const videoPlayer = document.getElementById('videoPlayer');
            videoPlayer.src = video.downloadUrl;
            document.getElementById('videoModal').style.display = 'block';
        } else {
            this.log('请先下载视频以进行预览', 'warning');
        }
    }

    async downloadSingle(vid) {
        const video = this.validVideos.find(v => v.vid === vid);
        if (video && video.downloadUrl) {
            const a = document.createElement('a');
            a.href = video.downloadUrl;
            a.download = video.filename;
            a.click();
            this.log(`单独下载: ${video.filename}`, 'success');
        } else {
            this.log('视频尚未下载，无法单独下载', 'warning');
        }
    }

    closeModal() {
        document.getElementById('videoModal').style.display = 'none';
        const videoPlayer = document.getElementById('videoPlayer');
        videoPlayer.pause();
        videoPlayer.src = '';
    }
}

// 初始化应用
const downloader = new SinaVideoDownloader();
