# 日本50音生活例句互動背誦表

給日文初學者使用的互動學習頁面，內容包括：

- 46 個現代基本假名
- 平假名與片假名對照
- 每個假名的實用單字
- 92 個日常生活例句
- 單字、整句與逐詞日文發音
- 假名分拍、羅馬字與中文解釋
- 搜尋、行別篩選、平／片假名切換、隱藏羅馬字與測驗模式

## 公開網站

https://zach0627.github.io/japanese-kana-chart/

## 程式架構

```text
index.html                  # 唯一首頁與語意化頁面骨架
assets/styles.css           # 卡片版面與響應式樣式
assets/app.js               # 資料載入、畫面渲染、搜尋與發音互動
data/01-a.json              # あ行資料
data/02-ka.json             # か行資料
data/03-sa.json             # さ行資料
data/04-ta.json             # た行資料
data/05-na.json             # な行資料
data/06-ha.json             # は行資料
data/07-ma.json             # ま行資料
data/08-ya.json             # や行資料
data/09-ra.json             # ら行資料
data/10-wa.json             # わ行資料
.github/workflows/deploy-pages.yml
```

畫面使用卡片元件，不使用 HTML table。資料、樣式與互動邏輯分開維護，也不使用 HTML chunks、`document.write`、執行期 DOM 補丁或 sticky 表頭。

## 部署與驗證

每次更新 `main` 分支時，GitHub Actions 會：

1. 檢查 JavaScript 語法。
2. 驗證 10 份 JSON 合計正好有 46 筆基本音。
3. 阻擋舊架構關鍵字，包括 table、thead、sticky、`document.write`、`MutationObserver` 與 chunks。
4. 原樣部署 `index.html`、`assets/` 與 `data/` 到 GitHub Pages，不在部署階段重新組裝 HTML。
