(() => {
  'use strict';
  const DATA = window.REVERSE_DATA;
  if (!DATA?.items?.length || !DATA?.questions?.length) {
    document.getElementById('app').textContent = 'ゲームデータを読み込めませんでした。ページを再読み込みしてください。';
    return;
  }

  const app = document.getElementById('app');
  const guessDialog = document.getElementById('guess-dialog');
  const resultDialog = document.getElementById('result-dialog');
  const revealDialog = document.getElementById('reveal-dialog');
  const toastNode = document.getElementById('toast');
  const statKey = 'reverse_akinator_stats_v1';
  const settingsKey = 'reverse_akinator_settings_v1';

    let stats = getStored(statKey, {games:0,wins:0,streak:0,best:0,recent:[],daily:{}});
  const settings = getStored(settingsKey, {difficulty:1,mode:'random',sound:false});
  let difficulty = [1,2,3].includes(settings.difficulty) ? settings.difficulty : 1;
  let gameMode = settings.mode === 'daily' ? 'daily' : 'random';
  let sound = !!settings.sound;
  let game = null;
  let choicePage = 0;
  let toastTimer;
  let audioContext = null;

  const ANSWER = {
    yes: {short:'はい！',text:'はい、そうです！', css:'yes'},
    no: {short:'いいえ',text:'いいえ、ちがいます。',css:'no'},
    maybe: {short:'どちらとも',text:'どちらともいえません。',css:'maybe'}
  };
  function getStored(key, fallback) {
    try { const val = JSON.parse(localStorage.getItem(key)); return val && typeof val === 'object' ? {...fallback,...val} : {...fallback}; }
    catch (_e) {return {...fallback};}
  }
  function store(key, value) {try{localStorage.setItem(key,JSON.stringify(value));}catch(_e){/* disabled storage */}}
  function saveSettings(){store(settingsKey,{difficulty,mode:gameMode,sound});}
  function escapeHTML(str) {return String(str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function dayStamp() {
    try { return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
    catch(_e){return new Date().toISOString().slice(0,10);}
  }
  function poolFor(level) {return DATA.items.filter(w => w.level <= level);}
  function hash(s) {let h=2166136261; for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);} return h>>>0;}
  function randomIndex(n) {
    if (globalThis.crypto?.getRandomValues) {const arr=new Uint32Array(1);crypto.getRandomValues(arr);return arr[0]%n;}
    return Math.floor(Math.random()*n);
  }
  function answerFor(item,q) {return item.maybe.has(q.tag) ? 'maybe' : item.tags.has(q.tag) ? 'yes' : 'no';}
  function normalize(s) {
    return String(s).normalize('NFKC').toLowerCase().replace(/[\u30a1-\u30f6]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60))
      .replace(/[\s\u3000「」『』\[\]（）()・.,。、!！?？_\-～〜]/g,'');
  }
  function score() {if(!game)return 0;return Math.max(100,1500-game.asked.length*75-game.misses.length*170);}
  function candidates() {
    if(!game)return [];
    return poolFor(game.difficulty).filter(item => game.asked.every(({id,answer})=>answerFor(item,DATA.questions[id])===answer));
  }
  function used(id) {return !!game?.asked.some(row=>row.id===id);}
function recommended() {
    if (!game) return {rows:[], page:0, pages:0, phase:'', description:''};
    const remaining = candidates();
    const total = poolFor(game.difficulty).length;
    const n = remaining.length;
    const groups = {};
    for (const item of remaining) groups[item.group] = (groups[item.group] || 0) + 1;
    const largest = Math.max(0,...Object.values(groups));
    const leadShare = n ? largest/n : 0;
    const broad = game.asked.length === 0 || (n > 24 && leadShare < .60 && game.asked.length < 5);
    const phase = broad ? 'まずは大きな特徴から' : n > 14 ? '特徴をもう少し詳しく' : 'かなり絞れてきました';
    const description = broad
      ? '今の状況に合う質問を選んでみよう。回答に合わせて次の質問が変わります。'
      : n > 14 ? 'これまでの答えをもとに、より具体的な質問を用意しました。'
      : '違いが出やすい細かな質問です。答えに自信があれば、そのまま回答してもOK！';
    if (n <= 1) return {rows:[],page:0,pages:0,phase:'もう少しで正解！',description:'質問でこれ以上絞り込めません。思いついた名前を入力してみよう。'};
    const scored = [];
    for (const q of DATA.questions) {
      if (used(q.id)) continue;
      if (broad && q.section !== 'all') continue;
      if (!broad && q.section !== 'all' && q.section !== 'color') {
        const related = q.section === 'nature' ? (groups.nature||0)+(groups.plant||0) : (groups[q.section]||0);
        if (related / n < (n <= 12 ? .08 : .19)) continue;
      }
      if (q.section === 'color' && (broad || n > 18)) continue;
      let entropy = 0;
      const counts = {yes:0,no:0,maybe:0};
      const signature=[];
      for (const item of remaining) {
        const a=answerFor(item,q);
        counts[a]++;
        signature.push(a[0]);
      }
      if (Object.values(counts).filter(x=>x>0).length <= 1) continue;
      for (const c of Object.values(counts)) if(c){const p=c/n;entropy-=p*Math.log2(p);}
      const categoryBonus = !broad && q.section !== 'all' ? .16 : 0;
      const shapePenalty = q.section === 'color' && n > 7 ? .23 : 0;
      const score = entropy * 3 + categoryBonus - shapePenalty;
      scored.push({q,score,signature:signature.join('')});
    }
    scored.sort((a,b)=>b.score-a.score || a.q.id-b.q.id);
    // 同じ分け方をする質問を何度も見せず、質問の意味が変わる選択肢を優先。
    const unique=[];
    const signatures=new Set();
    for(const entry of scored){
      if(signatures.has(entry.signature))continue;
      signatures.add(entry.signature);
      unique.push(entry.q);
    }
    const pages=Math.ceil(unique.length/4);
    const page=pages?choicePage%pages:0;
    return {rows:unique.slice(page*4,(page+1)*4),page,pages,phase,description};
  }
    function soundState(){document.getElementById('sound-toggle').innerHTML=sound?'♪':'♫';document.getElementById('sound-toggle').setAttribute('aria-label',sound?'サウンドをオフにする':'サウンドをオンにする');}
  function playSound(kind) {
    if(!sound)return;
    try{
      const AudioCtx = window.AudioContext||window.webkitAudioContext;
      if(!AudioCtx)return;
      audioContext ||= new AudioCtx();
      if(audioContext.state==='suspended')audioContext.resume();
      const now=audioContext.currentTime;
      const tones=kind==='win'?[523,659,784,1046]:kind==='wrong'?[300,235]:kind==='yes'?[520,690]:kind==='no'?[360,285]:[450,500];
      tones.forEach((f,i)=>{
        const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=f;
        const start=now+i*.105;
        g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(.075,start+.016);
        g.gain.exponentialRampToValueAtTime(.0001,start+.18);
        o.connect(g);g.connect(audioContext.destination);o.start(start);o.stop(start+.185);
      });
    }catch(_e){/* audio not supported */}
  }
  function notice(msg,kind=''){
    toastNode.textContent=msg;toastNode.className=`visible ${kind}`;
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toastNode.className='';},2600);
  }
  function home() {
    game=null;
    const options=[['やさしい','定番のお題',1],['ふつう','少し幅広く',2],['むずかしい','全お題から',3]];
    app.innerHTML=`
      <section class="landing">
        <div class="intro-copy">
          <span class="eyebrow">YOU ASK. THE MYSTERY ANSWERS.</span>
          <h1>質問するのは、<em>あなた。</em></h1>
          <p class="lead">今回はゲームが秘密のお題を考えます。<br><strong>質問を選ぶたび、次の質問が変化。</strong><br>手がかりを集めて、正体を当てよう！</p>
          <div class="howto"><span><b>01</b> 質問を選ぶ</span><span><b>02</b> 答えを集める</span><span><b>03</b> 名前を入力する</span></div>
          <div class="selection-label">難易度を選択 <span>質問数に制限なし</span></div>
          <div class="difficulty-grid">${options.map(([name,desc,level])=>`<button class="difficulty ${difficulty===level?'active':''}" data-difficulty="${level}" aria-pressed="${difficulty===level}"><strong>${name}</strong><small>${desc}</small></button>`).join('')}</div>
          <div class="mode-select" role="group" aria-label="ゲームモード">
            <button class="mode-choice ${gameMode==='random'?'active':''}" data-mode="random" aria-pressed="${gameMode==='random'}"><i class="dot"></i> ランダム</button>
            <button class="mode-choice ${gameMode==='daily'?'active':''}" data-mode="daily" aria-pressed="${gameMode==='daily'}"><i class="dot"></i> 今日の1問</button>
          </div>
          <button id="start-game" class="primary-btn">${gameMode==='daily'?'今日の謎に挑戦':'ゲームをはじめる'} <span aria-hidden="true">↗</span></button>
          <div class="intro-foot"><span>お題は <b>${DATA.items.length}種類</b> 収録</span><span>·</span><span>質問は <b>${DATA.questions.length}種類</b></span><span>·</span><span>登録・通信不要</span></div>
        </div>
        <div class="preview-side" aria-hidden="true">
          <div class="preview-glow"></div><div class="orbit-illustration"><div class="orbit-ring"></div><div class="oracle-orb"><span>?</span></div><div class="floating-tag yes">YES! ✓</div><div class="floating-tag no">NO… ×</div><div class="floating-tag maybe">MAYBE ✧</div></div>
          <div class="showcase-caption">WHO AM I?</div>
        </div>
      </section>
      <section class="feature-row" aria-label="ゲームの特徴">
        <div class="feature-card"><div class="feature-icon">✧</div><div><strong>質問で推理</strong><p>今の推理に合う質問が少しずつ登場。答えるたびに内容が変化。</p></div></div>
        <div class="feature-card"><div class="feature-icon">⌕</div><div><strong>ひらめいたら回答</strong><p>思いついたタイミングで入力。ひらがな・漢字の別名にも対応。</p></div></div>
        <div class="feature-card"><div class="feature-icon">♛</div><div><strong>最短クリアに挑戦</strong><p>少ない質問で正解すると高得点。自己ベストを更新しよう。</p></div></div>
      </section>
    `;
    soundState();
  }
  function newGame() {
    const pool=poolFor(difficulty);
    let target;
    if(gameMode==='daily'){
      target=pool[hash(`reverse-akinator-v1:${dayStamp()}:${difficulty}`)%pool.length];
    } else {
      const recent=Array.isArray(stats.recent)?stats.recent:[];
      const eligible=pool.filter(item=>!recent.includes(item.id));
      const options=eligible.length?eligible:pool;
      target=options[randomIndex(options.length)];
    }
    game={target,difficulty,mode:gameMode,asked:[],misses:[],finished:false,won:false,finalScore:0};
    choicePage=0;
    renderGame(false);
    window.scrollTo({top:0,behavior:'instant'});
  }
  function statsHtml(){
    if(!game)return '';
    const total=poolFor(game.difficulty).length;
    const remaining=candidates().length;
    const progress = Math.max(0,Math.min(100,Math.round((1-remaining/total)*100)));
    const latest = game.asked.at(-1);
    const a=latest?ANSWER[latest.answer]:null;
    const qq=latest?DATA.questions[latest.id]:null;
    return `<div class="secret-card">
      <div class="card-header"><span class="tiny-upper">HIDDEN IDENTITY</span><span class="puzzle-id">${game.mode==='daily'?'DAILY':'MYSTERY'} #${String(game.target.id+1).padStart(3,'0').replace(/\d/g,'?')}</span></div>
      <div class="mini-orb-wrap"><div class="mini-orb"><b>?</b></div></div>
      <div class="oracle-label">わたしは <span>何でしょう？</span></div>
      <div class="oracle-quote" aria-live="polite"><small>${qq?escapeHTML(qq.text):'お題はもう決めました。'}</small><strong class="${a?'reply-'+a.css:'reply-idle'}">${a?a.text:'あなたの質問を待っています…'}</strong></div>
      <div class="metrics"><div class="metric"><span>質問</span><strong>${game.asked.length}<small> 回</small></strong></div><div class="metric"><span>ミス</span><strong>${game.misses.length}<small> 回</small></strong></div><div class="metric"><span>予想スコア</span><strong>${score().toLocaleString('ja-JP')}</strong></div></div>
      <div class="progress-track" role="progressbar" aria-label="推理の進み具合" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar" style="width:${progress}%"></div></div>
      <div class="progress-label"><span>手がかりを集めよう</span><span>絞り込みの目安 <strong>${progress}%</strong></span></div>
    </div>`;
  }
  function historyHtml(){
    const rec=game.asked.slice(-7).reverse();
    return `<div class="history-card"><div class="history-title"><strong>これまでの質問</strong><span>${game.asked.length} 件</span></div>
      ${rec.length?`<ol class="history-list">${rec.map((row,i)=>`<li class="history-entry"><span class="history-number">${String(game.asked.length-i).padStart(2,'0')}</span><span class="history-question">${escapeHTML(DATA.questions[row.id].text)}</span><span class="answer-pill ${row.answer==='yes'?'':row.answer}">${ANSWER[row.answer].short}</span></li>`).join('')}</ol>`:`<div class="empty-history">まだ質問はありません。<br>右の質問をタップしてみよう。</div>`}
    </div><div class="left-actions"><button type="button" class="link-button" id="open-reveal">◌ 答えを見る（ギブアップ）</button></div>`;
  }
function recommendedHtml() {
    const plan=recommended();
    const head=`<div class="adaptive-intro">
      <div><span class="eyebrow">CHOOSE YOUR QUESTION</span><h2>${escapeHTML(plan.phase)}</h2>
      <p>${escapeHTML(plan.description)}</p></div>
      <span class="step-chip">QUESTION ${String(game.asked.length+1).padStart(2,'0')}</span>
    </div>`;
    if(!plan.rows.length) return head+`<div class="adaptive-empty"><span aria-hidden="true">✦</span><strong>ひらめいたら答えてみよう！</strong><p>有効な新しい質問はありません。正体を推理して回答しましょう。</p><button type="button" class="secondary-btn" id="open-guess">答えを入力する ↗</button></div>`;
    return head+`<div class="recommended adaptive-questions" aria-label="今選べる質問">
      ${plan.rows.map((q,i)=>`<button type="button" class="recommended-button" data-question="${q.id}"><span class="qtop"><span>${String(plan.page*4+i+1).padStart(2,'0')} · ${escapeHTML(q.label)}</span><span class="q-arrow" aria-hidden="true">↗</span></span><span class="qtext">${escapeHTML(q.text)}</span></button>`).join('')}
    </div>
    <div class="adaptive-bottom"><div class="adaptive-hint">質問は毎回入れ替わります。どれか1つ選んでください。</div>
      ${plan.pages>1?`<button type="button" class="more-questions" id="next-questions">ほかの質問を見る <span aria-hidden="true">↻</span></button>`:''}
    </div>`;
  }
  function renderGame(keepScroll=true){
    if(!game){home();return;}
    const scroll=window.scrollY;
    const last=game.asked.at(-1);
    app.innerHTML=`<section class="game-shell">
      <div class="game-crumb"><div><strong>逆アキネーター</strong><span>　/　${game.mode==='daily'?'今日の1問':'ランダム'}　/　${['','やさしい','ふつう','むずかしい'][game.difficulty]}</span></div><button type="button" id="return-home" class="link-button">← ホームへ</button></div>
      <div class="game-layout"><div class="left-column">${statsHtml()}${historyHtml()}</div>
        <div class="question-zone">
          ${recommendedHtml()}
        </div>
      </div>
      <div class="guess-dock"><div class="dock-copy"><strong>正体がわかった？</strong><small>${last?`${ANSWER[last.answer].short}　·　${game.asked.length} 個の質問済み`:'いつでも答えを入力できます'}</small></div><button type="button" class="primary-btn" id="open-guess">答えを入力 <span aria-hidden="true">↗</span></button></div>
    </section>`;
    soundState();
    if(keepScroll)window.scrollTo({top:scroll,behavior:'instant'});
  }
    function ask(id){
    if(!game||game.finished||used(id))return;
    const q=DATA.questions[id];if(!q)return;
    const answer=answerFor(game.target,q);
    game.asked.push({id,answer});
    choicePage=0;
    renderGame();
    playSound(answer);
    notice(`${q.text} → ${ANSWER[answer].short}`,answer);
  }
  function submitGuess(input){
    if(!game||game.finished)return;
    const entered=normalize(input);
    if(!entered){document.getElementById('guess-error').textContent='名前を入力してください。';return;}
    const accepted=[game.target.name,...game.target.aliases].map(normalize);
    if(accepted.includes(entered)){
      guessDialog.close(); finish(true);
      playSound('win');
    }else{
      game.misses.push(input.trim());
      guessDialog.close();
      renderGame();
      playSound('wrong');
      notice(`「${input.trim().slice(0,22)}」は、ちがいます！ 再挑戦できます。`,'no');
    }
  }
  function finish(won){
    if(!game||game.finished)return;
    game.finished=true;game.won=won;game.finalScore=won?score():0;
    stats.games=(Number(stats.games)||0)+1;
    if(won){
      stats.wins=(Number(stats.wins)||0)+1;
      stats.streak=(Number(stats.streak)||0)+1;
      stats.best=Math.max(Number(stats.best)||0,game.finalScore);
    } else {stats.streak=0;}
    const recent=Array.isArray(stats.recent)?stats.recent:[];
    stats.recent=[game.target.id,...recent.filter(n=>n!==game.target.id)].slice(0,12);
    if(game.mode==='daily'){
      if(!stats.daily||typeof stats.daily!=='object')stats.daily={};
      const key=`${dayStamp()}:${game.difficulty}`;
      const prior=stats.daily[key];
      stats.daily[key]=Math.max(Number(prior)||0,game.finalScore);
      const dates=Object.keys(stats.daily);
      if(dates.length>90)dates.sort().slice(0,dates.length-90).forEach(k=>delete stats.daily[k]);
    }
    store(statKey,stats);
    renderResult();
  }
  function renderResult(){
    if(!game)return;
    const won=game.won;
    const headings=won?(game.asked.length<=5?'名探偵！':'大正解！'):'今回はここまで！';
    const resultScore=game.finalScore.toLocaleString('ja-JP');
    document.getElementById('result-content').innerHTML=`
      <div class="modal-top"><span class="eyebrow">${won?'MYSTERY SOLVED':'MYSTERY REVEALED'}</span><button type="button" class="close-button" id="result-close" aria-label="結果を閉じる">×</button></div>
      <div class="result-emoji" aria-hidden="true">${game.target.icon}</div>
      <h2 class="result-headline ${won?'':'fail'}">${headings}</h2>
      <p class="result-sub">秘密のお題は……<br><strong style="font-size:23px;color:#fff">${escapeHTML(game.target.name)}</strong> でした！</p>
      <div class="result-score">${won?`${resultScore} pt`:'0 pt'}</div>
      <p class="result-sub">${won?'おめでとう！ 少ない質問でのクリアを目指そう。':'正体を知ったら、次の謎へ挑戦しよう。'}</p>
      <div class="result-stats"><div><span>質問回数</span><strong>${game.asked.length}</strong></div><div><span>ミス回数</span><strong>${game.misses.length}</strong></div><div><span>連続正解</span><strong>${stats.streak||0}</strong></div></div>
      <button type="button" class="primary-btn" id="play-again">もう一度あそぶ <span aria-hidden="true">↗</span></button>
      <button type="button" class="secondary-btn" id="share-result">結果をシェアする</button>
      <button type="button" class="text-btn" id="back-to-home">ホームへ戻る</button>
    `;
    if(!resultDialog.open)resultDialog.showModal();
  }
  function shareResult(){
    if(!game)return;
    const text=`逆アキネーター ${game.mode==='daily'?`今日の1問（${dayStamp()}）`:'ランダム'}\n${game.won?'正解！':'ギブアップ'} / 質問 ${game.asked.length}回 / ${game.finalScore}pt\nあなたも秘密のお題を当てられる？\n${location.href.split('#')[0]}`;
    if(navigator.share){
      navigator.share({title:'逆アキネーター',text}).catch(()=>{});
    }else if(navigator.clipboard?.writeText){
      navigator.clipboard.writeText(text).then(()=>notice('結果をコピーしました！')).catch(()=>legacyCopy(text));
    }else legacyCopy(text);
  }
  function legacyCopy(s){
    const el=document.createElement('textarea');el.value=s;el.style.cssText='position:fixed;top:-1000px;left:-1000px';document.body.appendChild(el);el.select();
    try{if(document.execCommand('copy'))notice('結果をコピーしました！');else notice('コピーできませんでした。','no');}
    catch(_e){notice('コピーできませんでした。','no');}
    el.remove();
  }
  function closeResult(){if(resultDialog.open)resultDialog.close();}
  function goHome(){closeResult();if(guessDialog.open)guessDialog.close();if(revealDialog.open)revealDialog.close();home();window.scrollTo({top:0,behavior:'instant'});}
  function openGuess(){if(!game||game.finished)return;document.getElementById('guess-form').reset();document.getElementById('guess-error').textContent='';guessDialog.showModal();setTimeout(()=>document.getElementById('guess-input').focus(),50);}

  app.addEventListener('click', e=>{
    const diff=e.target.closest('[data-difficulty]');
    if(diff){difficulty=Number(diff.dataset.difficulty);saveSettings();home();return;}
    const mode=e.target.closest('[data-mode]');
    if(mode){gameMode=mode.dataset.mode;saveSettings();home();return;}
    if(e.target.closest('#start-game')){newGame();return;}
    if(e.target.closest('#return-home')){goHome();return;}
    if(e.target.closest('#next-questions')){choicePage++;renderGame();return;}
    const q=e.target.closest('[data-question]');
    if(q){ask(Number(q.dataset.question));return;}
    if(e.target.closest('#open-guess')){openGuess();return;}
    if(e.target.closest('#open-reveal')){revealDialog.showModal();return;}
  });
  document.getElementById('guess-form').addEventListener('submit',e=>{e.preventDefault();submitGuess(document.getElementById('guess-input').value);});
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>{
    const dlg=document.getElementById(button.dataset.close+'-dialog');if(dlg?.open)dlg.close();
  }));
  document.getElementById('reveal-yes').addEventListener('click',()=>{revealDialog.close();finish(false);});
  document.getElementById('sound-toggle').addEventListener('click',()=>{sound=!sound;saveSettings();soundState();if(sound)playSound('yes');});
  document.getElementById('result-content').addEventListener('click',e=>{
    if(e.target.closest('#play-again')){closeResult();newGame();}
    if(e.target.closest('#share-result')){shareResult();}
    if(e.target.closest('#back-to-home')){goHome();}
    if(e.target.closest('#result-close')){goHome();}
  });
  document.getElementById('brand-link').addEventListener('click',e=>{e.preventDefault();goHome();});
  // Prevent accidental dismissal of the completed-round dialog via backdrop or Escape.
  resultDialog.addEventListener('cancel', e=>{e.preventDefault();goHome();});
  resultDialog.addEventListener('click',e=>{if(e.target===resultDialog)goHome();});
  home();
})();