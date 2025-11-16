# MusicListGetting
通过Meting一键下载QQ音乐、网易云音乐等多种音乐平台的歌单
## 用法
首先将项目下载到本地

接着，我们需要获取一个meting链接

推荐我自己的：https://meting.robnot.us.kg/meting/

接着将想要下载的歌单的id填入参数中

示例：https://meting.robnot.us.kg/meting/?type=playlist&id=9610937929

用这个链接替换 `getlist.js` 中的url

运行 `node getlist.js`

这将生成一个 `list.json`

接着运行 `node downmusic.js`

歌曲会被下载到 `music` 文件夹内

PS：

由于某些字符不能作为文件名所有会进行替换

没有版权的歌曲同样会被下载，但0字节

---
祝您听歌愉快
