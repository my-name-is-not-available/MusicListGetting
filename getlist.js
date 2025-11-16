const https = require('https');
const fs = require('fs');
const path = require('path');

// 目标URL
const url = 'https://meting.robnot.us.kg/meting/?type=playlist&id=9610937929';

// 特殊字符映射表：键为需要替换的英文符号，值为对应的中文全角符号
const charMap = {
    ':': '：',   // 英文冒号 → 中文冒号
    '?': '？',   // 英文问号 → 中文问号
    '*': '＊',   // 英文星号 → 中文星号
    '"': '＂',   // 英文双引号 → 中文双引号
    '<': '＜',   // 英文小于号 → 中文小于号
    '>': '＞',   // 英文大于号 → 中文大于号
    '|': '｜',   // 英文竖线 → 中文竖线
    '/': '／',   // 英文斜杠 → 中文斜杠
    '\\': '＼'   // 英文反斜杠 → 中文反斜杠
};

// 对特殊字符进行转义处理（解决正则语法错误）
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 生成需要检测的正则表达式（先转义再拼接）
const specialChars = new RegExp(
    Object.keys(charMap).map(escapeRegExp).join('|'),
    'g'
);

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const jsonArray = JSON.parse(data);
            
            if (Array.isArray(jsonArray)) {
                jsonArray.forEach((item, index) => {
                        // 拼接artist到name
                        item.name = `${item.name} - ${item.artist}`;
                        
                        // 检测违禁字符
                        if (item && typeof item === 'object' && item.name && item.artist) {
                        const originalName = item.name;
                        // 替换特殊字符为对应的中文全角符号
                        item.name = item.name.replace(specialChars, match => charMap[match]);
                        
                        // 输出替换日志（如果有变化）
                        if (item.name !== originalName) {
                            console.log(`已替换特殊字符：索引 ${index}`);
                            console.log(`原始名称：${originalName}`);
                            console.log(`替换后：${item.name}\n`);
                        }
                        delete item.artist;
                    }
                });
            } else {
                console.warn('返回数据不是数组，无法进行处理');
            }
            
            const formattedJson = JSON.stringify(jsonArray, null, 2);
            const filePath = path.join(__dirname, 'list.json');
            
            fs.writeFile(filePath, formattedJson, (err) => {
                if (err) {
                    console.error('写入文件失败:', err);
                    return;
                }
                console.log('处理完成，文件已保存至:', filePath);
            });
        } catch (err) {
            console.error('数据处理出错:', err);
        }
    });
}).on('error', (err) => {
    console.error('请求失败:', err);
});