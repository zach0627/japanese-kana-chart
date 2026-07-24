"use strict";
let DATA=[];
const DATA_FILES=["data/01-a.json", "data/02-ka.json", "data/03-sa.json", "data/04-ta.json", "data/05-na.json", "data/06-ha.json", "data/07-ma.json", "data/08-ya.json", "data/09-ra.json", "data/10-wa.json"];
const app=document.getElementById('app');
const content=document.getElementById('content');
const synth=window.speechSynthesis;
let jaVoice=null;
function chooseVoice(){const voices=synth.getVoices();jaVoice=voices.find(v=>/^ja(-|_)/i.test(v.lang))||voices.find(v=>/Japanese|Kyoko|Otoya/i.test(v.name))||null}
chooseVoice();if('onvoiceschanged' in synth)synth.onvoiceschanged=chooseVoice;
function esc(v){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function speak(text,rate=.78){synth.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';u.rate=rate;u.pitch=1;if(jaVoice)u.voice=jaVoice;synth.speak(u)}
function audio(text,label='播放',icon=false){return `<button type="button" class="audio${icon?' icon':''}" data-speak="${esc(text)}" aria-label="播放 ${esc(text)}">${icon?'▶':`▶ ${esc(label)}`}</button>`}
function tokenCards(tokens){return tokens.map(t=>`<div class="token"><button type="button" class="audio icon" data-speak="${esc(t.reading)}" aria-label="播放 ${esc(t.surface)}">▶</button><div class="token-surface">${esc(t.surface)}</div><div class="token-reading">${esc(t.reading)}｜${esc(t.mora)}</div><div class="token-romaji romaji-only">${esc(t.romaji)}</div><div class="token-meaning meaning-answer">${esc(t.meaning)}</div></div>`).join('')}
function lesson(s,type){return `<section class="lesson ${type}"><div class="lesson-label">${type==='h'?'平假名生活例句':'片假名生活例句'}</div><div class="sentence-line"><div class="sentence">${esc(s.surface)}</div>${audio(s.reading,'整句')}</div><div class="reading-block"><div class="reading-line"><strong>整句假名</strong><span>${esc(s.reading)}</span></div><div class="reading-line romaji-only"><strong>逐詞羅馬字</strong><span>${esc(s.romaji)}</span></div><div class="reading-line"><strong>中文意思</strong><span class="translation meaning-answer">${esc(s.translation)}</span></div></div><div class="token-heading">逐詞拼讀</div><div class="tokens">${tokenCards(s.tokens)}</div></section>`}
function side(row,type){const h=type==='h';const kana=h?row.h:row.k;const word=h?row.hword_display:row.kw;const reading=h?row.hw:row.kw;const mora=h?row.hw_mora:row.kw_mora;const roma=h?row.hw_romaji:row.kw_romaji;const meaning=h?row.hm:row.km;return `<section class="kana-side ${type}"><div class="side-label"><span class="type-badge">${h?'平假名 HIRAGANA':'片假名 KATAKANA'}</span><span class="romaji-kana romaji-only">${esc(row.r)}</span></div><div class="kana-row"><div class="kana-mark"><div class="kana-char">${esc(kana)}</div>${audio(kana,'',true)}</div><div class="word-panel"><div class="word-head"><div class="word-title">${esc(word)}</div>${audio(reading,'單字')}</div><div class="meta-grid"><span class="meta-label">假名分拍</span><span class="meta-value">${esc(mora)}</span><span class="meta-label romaji-only">羅馬字</span><span class="meta-value romaji-only">${esc(roma)}</span><span class="meta-label">中文</span><span class="meta-value meaning-answer">${esc(meaning)}</span></div></div></div></section>`}
function pairCard(row){return `<article class="pair-card"><div class="pair-top">${side(row,'h')}${side(row,'k')}</div><div class="details-wrap"><details><summary>展開生活例句與逐詞拼讀</summary><div class="lesson-grid">${lesson(row.hs,'h')}${lesson(row.ks,'k')}</div></details></div></article>`}
function render(){const q=document.getElementById('search').value.trim().toLowerCase();const g=document.getElementById('groupFilter').value;const filtered=DATA.filter(row=>(!g||row.group===g)&&(!q||JSON.stringify(row).toLowerCase().includes(q)));const groups=[...new Set(filtered.map(r=>r.group))];if(!filtered.length){content.innerHTML='<div class="empty">找不到符合的假名、單字或例句。</div>'}else{content.innerHTML=groups.map(group=>`<section class="group-section"><h2 class="group-title"><span class="group-badge">${esc(group)}</span></h2><div class="cards">${filtered.filter(r=>r.group===group).map(pairCard).join('')}</div></section>`).join('')}document.getElementById('status').textContent=`顯示 ${filtered.length}／${DATA.length} 個基本音`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-speak]');if(b)speak(b.dataset.speak)});
document.getElementById('search').addEventListener('input',render);document.getElementById('groupFilter').addEventListener('change',render);
document.getElementById('viewFilter').addEventListener('change',e=>{app.classList.remove('view-hiragana','view-katakana');if(e.target.value!=='both')app.classList.add(`view-${e.target.value}`)});
document.getElementById('expandAll').onclick=()=>document.querySelectorAll('details').forEach(d=>d.open=true);
document.getElementById('collapseAll').onclick=()=>document.querySelectorAll('details').forEach(d=>d.open=false);
document.getElementById('stop').onclick=()=>synth.cancel();
document.getElementById('toggleRomaji').onclick=e=>{app.classList.toggle('hidden-romaji');e.currentTarget.textContent=app.classList.contains('hidden-romaji')?'顯示羅馬字':'隱藏羅馬字';e.currentTarget.classList.toggle('active',app.classList.contains('hidden-romaji'))};
document.getElementById('practice').onclick=e=>{app.classList.toggle('practice');e.currentTarget.textContent=app.classList.contains('practice')?'關閉測驗模式':'測驗模式';e.currentTarget.classList.toggle('active',app.classList.contains('practice'))};

async function bootstrap(){
  try{
    const responses=await Promise.all(DATA_FILES.map(path=>fetch(path,{cache:"no-store"})));
    const failed=responses.find(response=>!response.ok);
    if(failed)throw new Error(`資料載入失敗：${failed.status}`);
    const groups=await Promise.all(responses.map(response=>response.json()));
    DATA=groups.flat();
    if(DATA.length!==46)throw new Error(`資料筆數異常：${DATA.length}`);
    render();
  }catch(error){
    console.error(error);
    content.innerHTML='<div class="empty">資料載入失敗，請重新整理頁面。</div>';
    document.getElementById('status').textContent='載入失敗';
  }
}
bootstrap();
