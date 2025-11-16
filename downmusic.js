const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// 确保music文件夹存在
const ensureMusicDir = async () => {
    const musicDir = path.join(__dirname, 'music');
    if (!fsSync.existsSync(musicDir)) {
        await fs.mkdir(musicDir, { recursive: true });
        console.log('已创建music文件夹');
    }
    return musicDir;
};

// 获取302重定向后的最终URL
const getRedirectUrl = (url) => {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.get(url, { method: 'HEAD', followRedirect: false }, (res) => {
            if (res.statusCode === 302 && res.headers.location) {
                resolve(res.headers.location);
            } else {
                resolve(url); // 无重定向时返回原URL
            }
        });
        req.on('error', reject);
    });
};

// 下载文件并保存
const downloadFile = async (url, savePath) => {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const fileStream = fsSync.createWriteStream(savePath);
        
        protocol.get(url, (res) => {
            res.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });
        }).on('error', (err) => {
            fsSync.unlink(savePath, () => {}); // 下载失败删除空文件
            reject(err);
        });
    });
};

// 处理单个音乐项
const processMusicItem = async (item, index, total, musicDir) => {
    try {
        // 显示日志：[当前索引/总数量] 开始处理: 歌名
        console.log(`[${index}/${total}] 开始处理: ${item.name}`);

        // 处理音频文件
        if (item.url) {
            const redirectUrl = await getRedirectUrl(item.url);
            const fileExt = path.extname(redirectUrl).toLowerCase() || '.mp3';
            const audioSavePath = path.join(musicDir, `${item.name}${fileExt}`);
            await downloadFile(redirectUrl, audioSavePath);
            console.log(`[${index}/${total}] 音频已保存: ${path.basename(audioSavePath)}`);
        }

        // 处理图片文件
        if (item.pic) {
            const picRedirectUrl = await getRedirectUrl(item.pic);
            const picExt = path.extname(picRedirectUrl).toLowerCase() || '.jpg';
            const picSavePath = path.join(musicDir, `${item.name}${picExt}`);
            await downloadFile(picRedirectUrl, picSavePath);
            console.log(`[${index}/${total}] 图片已保存: ${path.basename(picSavePath)}`);
        }

        // 处理LRC歌词文件
        if (item.lrc) {
            const lrcSavePath = path.join(musicDir, `${item.name}.lrc`);
            await downloadFile(item.lrc, lrcSavePath);
            console.log(`[${index}/${total}] 歌词已保存: ${path.basename(lrcSavePath)}`);
        }

    } catch (err) {
        console.error(`[${index}/${total}] 处理${item.name}时出错:`, err.message);
    }
};

// 主函数
const main = async () => {
    try {
        // 1. 确保music文件夹存在
        const musicDir = await ensureMusicDir();

        // 2. 读取list.json
        const listPath = path.join(__dirname, 'list.json');
        const listData = await fs.readFile(listPath, 'utf8');
        const musicList = JSON.parse(listData);

        if (!Array.isArray(musicList)) {
            throw new Error('list.json内容不是数组');
        }

        const totalCount = musicList.length; // 获取总数量
        console.log(`共发现${totalCount}个项目，开始处理...`);

        // 3. 遍历处理每个音乐项
        for (let i = 0; i < musicList.length; i++) {
            // 索引从1开始
            await processMusicItem(musicList[i], i + 1, totalCount, musicDir);
            // 简单限流（考虑到效率问题暂时删除）
            // await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`所有处理完成（共${totalCount}个项目）`);

    } catch (err) {
        console.error('主流程出错:', err.message);
    }
};

// 启动执行
main();