"use strict";

let DATA = [];
const DATA_FILES = [
  "data/01-a.json", "data/02-ka.json", "data/03-sa.json", "data/04-ta.json", "data/05-na.json",
  "data/06-ha.json", "data/07-ma.json", "data/08-ya.json", "data/09-ra.json", "data/10-wa.json"
];

const app = document.getElementById("app");
const content = document.getElementById("content");
const speechRateSelect = document.getElementById("speechRate");
const synth = window.speechSynthesis;
const SPEECH_RATE_KEY = "japanese-kana-speech-rate";
const DEFAULT_SPEECH_RATE = 0.55;
const ALLOWED_SPEECH_RATES = new Set([0.42, 0.55, 0.70, 0.90]);

let jaVoice = null;
let speechRate = DEFAULT_SPEECH_RATE;

function chooseVoice() {
  const voices = synth.getVoices();
  jaVoice = voices.find(voice => /^ja(-|_)/i.test(voice.lang))
    || voices.find(voice => /Japanese|Kyoko|Otoya/i.test(voice.name))
    || null;
}

function loadSpeechRate() {
  try {
    const savedRate = Number.parseFloat(localStorage.getItem(SPEECH_RATE_KEY));
    if (ALLOWED_SPEECH_RATES.has(savedRate)) speechRate = savedRate;
  } catch (error) {
    console.warn("無法讀取發音速度設定：", error);
  }

  const matchingOption = [...speechRateSelect.options]
    .find(option => Number.parseFloat(option.value) === speechRate);
  if (matchingOption) speechRateSelect.value = matchingOption.value;
}

function saveSpeechRate() {
  try {
    localStorage.setItem(SPEECH_RATE_KEY, String(speechRate));
  } catch (error) {
    console.warn("無法儲存發音速度設定：", error);
  }
}

chooseVoice();
if ("onvoiceschanged" in synth) synth.onvoiceschanged = chooseVoice;
loadSpeechRate();

function esc(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
  })[character]);
}

function speak(text) {
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = speechRate;
  utterance.pitch = 1;
  utterance.volume = 1;
  if (jaVoice) utterance.voice = jaVoice;
  synth.speak(utterance);
}

function audio(text, label = "播放", icon = false) {
  return `<button type="button" class="audio${icon ? " icon" : ""}" data-speak="${esc(text)}" aria-label="播放 ${esc(text)}">${icon ? "▶" : `▶ ${esc(label)}`}</button>`;
}

function tokenCards(tokens) {
  return tokens.map(token => `<div class="token"><button type="button" class="audio icon" data-speak="${esc(token.reading)}" aria-label="播放 ${esc(token.surface)}">▶</button><div class="token-surface">${esc(token.surface)}</div><div class="token-reading">${esc(token.reading)}｜${esc(token.mora)}</div><div class="token-romaji romaji-only">${esc(token.romaji)}</div><div class="token-meaning meaning-answer">${esc(token.meaning)}</div></div>`).join("");
}

function lesson(sentence, type) {
  return `<section class="lesson ${type}"><div class="lesson-label">${type === "h" ? "平假名生活例句" : "片假名生活例句"}</div><div class="sentence-line"><div class="sentence">${esc(sentence.surface)}</div>${audio(sentence.reading, "整句")}</div><div class="reading-block"><div class="reading-line"><strong>整句假名</strong><span>${esc(sentence.reading)}</span></div><div class="reading-line romaji-only"><strong>逐詞羅馬字</strong><span>${esc(sentence.romaji)}</span></div><div class="reading-line"><strong>中文意思</strong><span class="translation meaning-answer">${esc(sentence.translation)}</span></div></div><div class="token-heading">逐詞拼讀</div><div class="tokens">${tokenCards(sentence.tokens)}</div></section>`;
}

function side(row, type) {
  const isHiragana = type === "h";
  const kana = isHiragana ? row.h : row.k;
  const word = isHiragana ? row.hword_display : row.kw;
  const reading = isHiragana ? row.hw : row.kw;
  const mora = isHiragana ? row.hw_mora : row.kw_mora;
  const romaji = isHiragana ? row.hw_romaji : row.kw_romaji;
  const meaning = isHiragana ? row.hm : row.km;

  return `<section class="kana-side ${type}"><div class="side-label"><span class="type-badge">${isHiragana ? "平假名 HIRAGANA" : "片假名 KATAKANA"}</span><span class="romaji-kana romaji-only">${esc(row.r)}</span></div><div class="kana-row"><div class="kana-mark"><div class="kana-char">${esc(kana)}</div>${audio(kana, "", true)}</div><div class="word-panel"><div class="word-head"><div class="word-title">${esc(word)}</div>${audio(reading, "單字")}</div><div class="meta-grid"><span class="meta-label">假名分拍</span><span class="meta-value">${esc(mora)}</span><span class="meta-label romaji-only">羅馬字</span><span class="meta-value romaji-only">${esc(romaji)}</span><span class="meta-label">中文</span><span class="meta-value meaning-answer">${esc(meaning)}</span></div></div></div></section>`;
}

function pairCard(row) {
  return `<article class="pair-card"><div class="pair-top">${side(row, "h")}${side(row, "k")}</div><div class="details-wrap"><details><summary>展開生活例句與逐詞拼讀</summary><div class="lesson-grid">${lesson(row.hs, "h")}${lesson(row.ks, "k")}</div></details></div></article>`;
}

function render() {
  const query = document.getElementById("search").value.trim().toLowerCase();
  const groupFilter = document.getElementById("groupFilter").value;
  const filtered = DATA.filter(row =>
    (!groupFilter || row.group === groupFilter)
    && (!query || JSON.stringify(row).toLowerCase().includes(query))
  );
  const groups = [...new Set(filtered.map(row => row.group))];

  if (!filtered.length) {
    content.innerHTML = '<div class="empty">找不到符合的假名、單字或例句。</div>';
  } else {
    content.innerHTML = groups.map(group => `<section class="group-section"><h2 class="group-title"><span class="group-badge">${esc(group)}</span></h2><div class="cards">${filtered.filter(row => row.group === group).map(pairCard).join("")}</div></section>`).join("");
  }

  document.getElementById("status").textContent = `顯示 ${filtered.length}／${DATA.length} 個基本音`;
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-speak]");
  if (button) speak(button.dataset.speak);
});

document.getElementById("search").addEventListener("input", render);
document.getElementById("groupFilter").addEventListener("change", render);
document.getElementById("viewFilter").addEventListener("change", event => {
  app.classList.remove("view-hiragana", "view-katakana");
  if (event.target.value !== "both") app.classList.add(`view-${event.target.value}`);
});

speechRateSelect.addEventListener("change", event => {
  const selectedRate = Number.parseFloat(event.target.value);
  if (!ALLOWED_SPEECH_RATES.has(selectedRate)) return;
  synth.cancel();
  speechRate = selectedRate;
  saveSpeechRate();
});

document.getElementById("expandAll").onclick = () => document.querySelectorAll("details").forEach(details => { details.open = true; });
document.getElementById("collapseAll").onclick = () => document.querySelectorAll("details").forEach(details => { details.open = false; });
document.getElementById("stop").onclick = () => synth.cancel();
document.getElementById("toggleRomaji").onclick = event => {
  app.classList.toggle("hidden-romaji");
  event.currentTarget.textContent = app.classList.contains("hidden-romaji") ? "顯示羅馬字" : "隱藏羅馬字";
  event.currentTarget.classList.toggle("active", app.classList.contains("hidden-romaji"));
};
document.getElementById("practice").onclick = event => {
  app.classList.toggle("practice");
  event.currentTarget.textContent = app.classList.contains("practice") ? "關閉測驗模式" : "測驗模式";
  event.currentTarget.classList.toggle("active", app.classList.contains("practice"));
};

async function bootstrap() {
  try {
    const responses = await Promise.all(DATA_FILES.map(path => fetch(path, { cache: "no-store" })));
    const failed = responses.find(response => !response.ok);
    if (failed) throw new Error(`資料載入失敗：${failed.status}`);

    const groups = await Promise.all(responses.map(response => response.json()));
    DATA = groups.flat();
    if (DATA.length !== 46) throw new Error(`資料筆數異常：${DATA.length}`);
    render();
  } catch (error) {
    console.error(error);
    content.innerHTML = '<div class="empty">資料載入失敗，請重新整理頁面。</div>';
    document.getElementById("status").textContent = "載入失敗";
  }
}

bootstrap();