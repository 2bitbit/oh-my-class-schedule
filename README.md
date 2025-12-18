# 仍处于测试中，最迟2025.12.25前发布，敬请期待
<div align="center"><img src="./docs/logo.svg" height="50" align="top">  </div>
<div align="center">
  ✨🌈💫 **跨 平 台 大 学 课 表** 💫🌈✨<br>
  <sub>🪟 Windows · 🍎 macOS · 🐧 Linux · 🤖 Android</sub>
  <br><br>
    <a href="https://github.com/2bitbit/oh-my-class-schedule/stargazers" style="text-decoration: none;">
      <img src="https://img.shields.io/github/stars/2bitbit/oh-my-class-schedule?style=flat-square&color=fbbf24" alt="Stars" />
    </a>
    <a href="https://github.com/2bitbit/oh-my-class-schedule/issues" style="text-decoration: none;">
      <img src="https://img.shields.io/github/issues/2bitbit/oh-my-class-schedule?style=flat-square&color=ef4444" alt="Issues" />
    </a>
  <img src="https://img.shields.io/badge/Built%20with-Tauri%20v2-blue?style=flat-square&logo=tauri" alt="Tauri" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</div>

## 🤓 送给广大学牲 -- 这是什么
这是一个追求 **极致用户体验** 与 **无感智能适配** 的简洁的跨平台课程表应用。你每天都要查看无数次的工具，值得被我们精心雕琢。

***2026***，<img src="./docs/logo.svg" height="30" align="top"> 震撼来袭！！！：
- 专为 ***翘课*** 生定制！厌倦了校方课表（如HNU微生活）突然把你精心自定义的课程的显示优先级排在原课程之后？<br>大胆说NO，让ta滚犊子！

- 专为 ***简洁*** 党定制！厌倦了校方课表（如HNU微生活）没法删掉水灵灵的课，眼不见心不烦？<br>大胆说NO，让ta滚犊子！

- 专为 ***速通*** 哥定制！厌倦了校方课表（如HNU微生活）打开慢吞吞，每次登录还得手动清空缓存才显示课表？<br>大胆说NO，让ta滚犊子！

- 专为 ***颜值*** 党定制！厌倦了校方课表（如HNU微生活）样式古板单一不走心？<br>大胆说NO，让ta滚犊子！  <!-- 没抄 apple -->

<div align="center">
  <img src="./public/动画_1.gif" width=45%>
  <img src="./public/动画_2.gif" width=45%>
</div>
（此处有两个 demo GIF，体积较大，可能需要加载一些时间。）

## ✨ 眼前一亮的细节

### 1. 🧠 懂你的智能网格
- **今日高亮**: 只有在当前查看的周次确实是“今天”所在的周时，当天的列才会亮起。
- **周末自动折叠**: 系统会智能分析当前周的课程。如果您的周六和周日都没有课程安排，它们会自动隐身，将屏幕空间毫无保留地留给工作日。
- **极简表头**: 摒弃了冗余的“星期几”，我们采用了极简的“一、二、...、日”单字表头，清爽干练，不油腻。

### 2. 🎨 惊艳的视觉呈现
- **多种风格**: 除了默认的玻璃拟态，我们还提供了多种预设主题，满足你的个性化需求和视觉舒适。
- **全屏沉浸**: 无论是在 Windows 桌面还是 Android 手机，应用都会占满显示窗口。每一寸屏幕都被完美利用，不存在欲求不满的像素点。

### 3. ⚡ 纯粹的技术架构
- **Rust 后端**: 快就完事了。稳就完事了。占用小又省电，用它就完事了！
- **Web 前端**: Vue 3 + TypeScript + WebView，带来丝滑又高级，美丽又动人的交互体验。
- **自动化**: 无论是发布版本还是更新网页工具，我们都构建了全自动化的工作流，方便每一位贡献者。

## 📖 如何使用
### 第 1 步：安装配置
- Windows、Linux、Android、macOS请点击 [这里](https://github.com/2bitbit/oh-my-class-schedule/releases/latest) 下载后安装。（macOS的安装方法请自行必应搜索或者问大模型）
- 不支持 IOS <!-- WHAT A SHAME -->

### 第 2 步：导入课表
直接按照 [参考格式](docs/参考格式.txt) 写好文件，在软件中点击设置⚙️，选中文件进行导入，即可使用。

对于部分学校，我们提供了 [***格式化工具***](https://2bitbit.github.io/oh-my-class-schedule/) ：直接在教务系统导出课表，传入该工具即可复制出满足参考格式的文件，直接创建文件向其粘贴内容，使用该文件作为配置即可。

>[!tip] tip: 你也可以对课表本身进行编辑后，再上传至格式化工具，只是记得你编辑的内容要保持和原始课表的格式一致

## 🤝 如何贡献 (Contributing)
我们非常欢迎您为自己的母校添加适配支持！得益于我们的“文件即插件”适配器架构，为您的母校添加课表适配，这变得异常简单，只需根据模板编写一个文件即可：

1.  **复制模板**: 在 `docs/adapters/` 目录下，找到 `template.js`，将其复制并重命名为 `你的学校.js` (例如 `清华大学.js`)。
2.  **实现逻辑**: 打开新文件，参考 `template.js` 或 `湖南大学.js`，实现 `convert` 方法。你只需要将文件解析为我们定义的文本格式即可。
3.  **自动注册**: 运行自动化脚本更新列表：
    ```bash
    python scripts/update_web_tools.py
    ```
4.  **提交 PR**: 没错，只需编写这一个文件，你的学校就会出现在我们的支持列表中，造福你的所有同学！（你可以自定义你们学校的适配器名字哦，比如："清华大学（谢复盘编写）"、"五道口技校"、"不如隔壁的中南"，先到先得，败者食尘！）（从此享受崇敬的目光，也许还能迎来一段迷人的恋/基情！）

>[!tip] tip: 或者更简单地，直接交给 AI 去做。
---

## 🤑 赞赏 💰💴🧧💸👛🪙
<img src="public/求求了给点叭.png" width=46%><img src="public/求求了求求了.png" width=44%>
<!-- 我才不愿意让你看到我这副低声下气的样子呢，哼唧唧。 -->
<!-- 怎么也飞不出，花花的世界，原来我是一只，🦋大的学牲 -->

<div align="center">
<span  style="color: #FFD700; font-weight: bold; text-shadow: 0 0 2px #FFA500;">中国课表，香飘世界！为我的项目点点 star 🌟，让世界看见中国造！</span>
</div>
<!-- 不要怼我什么逻辑诡辩了，求求了给点叭，点点星星叭，求求了求求了 -->
<br><br><br><br><br><br>
<div align="center" style="font-size: 12px;">
  希望 <img src="./docs/logo.svg" height="20" align="top"> 能成为您大学生活中洋洋得意的小确幸。
</div>

