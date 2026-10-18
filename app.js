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
  const tabs = [
    ['all', 'すべて'], ['basic','基本'], ['animal','生き物'], ['food','食べ物'],
    ['object','道具・暮らし'], ['vehicle','乗り物'], ['nature','自然'], ['color','色・形']
  ];
  let stats = getStored(statKey, {games:0,wins:0,streak:0,best:0,recent:[],daily:{}});
  const settings = getStored(settingsKey, {difficulty:1,mode:'random',sound:false});
  let difficulty = [1,2,3].includes(settings.difficulty) ? settings.difficulty : 1;
  let gameMode = settings.mode === 'daily' ? 'daily' : 'random';
  let sound = !!settings.sound;
  let game = null;
  let selectedTab = 'all';
  let queryText = '';
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
    if(!game)return [];
    const remaining = candidates();
    const n = remaining.length;
    const pool = poolFor(game.difficulty);
    const scored = DATA.questions.filter(q=>!used(q.id)).map(q=>{
      const counts = {yes:0,no:0,maybe:0};
      remaining.forEach(item => counts[answerFor(item,q)]++);
      let entropy = 0;
      for(const count of Object.values(counts)) if(count&&n){const p=count/n;entropy-=p*Math.log2(p);}
      // Keep universally useful questions near the top, especially when there is little remaining variation.
      const globalYes = pool.filter(item=>answerFor(item,q)==='yes').length / pool.length;
      const generality = 1-Math.abs(.5-globalYes)*2;
      const base = q.section==='all'?.11:0;
      return {q,value:entropy*1.9+generality*.16+base};
    }).sort((a,b)=>b.value-a.value||a.q.id-b.q.id);
    const selected=[];const counts={};
    for(const row of scored){
      const section=row.q.section;
      if((counts[section]||0)>=2)continue;
      selected.push(row.q);counts[section]=(counts[section]||0)+1;
      if(selected.length===4)break;
    }
    return selected;
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
          <p class="lead">今回はゲームが秘密のお題を考えます。<br><strong>質問を選んで、答えを推理。</strong><br>正体がわかったら、名前を入力して当てよう！</p>
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
        <div class="feature-card"><div class="feature-icon">✧</div><div><strong>質問で推理</strong><p>気になる質問を自由に選択。答えを少しずつ絞っていこう。</p></div></div>
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
    selectedTab='all';queryText='';
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
  function recommendedHtml(){
    const rows=recommended();
    return `<div class="section-heading"><div><span class="eyebrow">SUGGESTED QUESTIONS</span><h2>おすすめの質問</h2><p>これまでの答えをもとに、おすすめを選んでいます。</p></div></div>
      <div class="recommended">${rows.map((q,i)=>`<button type="button" class="recommended-button" data-question="${q.id}"><span class="qtop"><span>${String(i+1).padStart(2,'0')} / ${escapeHTML(q.label)}</span><span class="q-arrow">↗</span></span><span class="qtext">${escapeHTML(q.text)}</span></button>`).join('')}</div>`;
  }
  function tabsHtml(){return tabs.map(([key,label])=>`<button type="button" class="tab ${key===selectedTab?'active':''}" role="tab" aria-selected="${key===selectedTab}" data-tab="${key}">${label}</button>`).join('');}
  function questionListHtml(){
    const result=DATA.questions.filter(q=>
      (selectedTab==='all'||(selectedTab==='basic'?q.section==='all':q.section===selectedTab)) &&
      (!queryText||normalize(q.text).includes(normalize(queryText)))
    );
    return {total:result.length,html:result.length?result.map(q=>{
      const prev=game.asked.find(row=>row.id===q.id);
      return `<button type="button" class="question-button ${prev?'asked':''}" data-question="${q.id}" ${prev?'disabled':''} aria-label="${escapeHTML(q.text)}${prev?' 質問済み':''}"><span>${escapeHTML(q.text)}</span><span class="arrow">${prev?'✓':'↗'}</span></button>`;
    }).join(''):`<div class="empty-search">該当する質問がありません。<br>別のキーワードを試してみてください。</div>`};
  }
  function renderQuestionPanel(){
    const library = document.getElementById('question-list');
    if(!library||!game)return;
    const res=questionListHtml();library.innerHTML=res.html;
    document.getElementById('library-count').textContent=`${res.total} 件`;
    document.getElementById('question-tabs').innerHTML=tabsHtml();
  }
  function renderGame(keepScroll=true){
    if(!game){home();return;}
    const scroll=window.scrollY;
    const list=questionListHtml();
    const last=game.asked.at(-1);
    app.innerHTML=`<section class="game-shell">
      <div class="game-crumb"><div><strong>逆アキネーター</strong><span>　/　${game.mode==='daily'?'今日の1問':'ランダム'}　/　${['','やさしい','ふつう','むずかしい'][game.difficulty]}</span></div><button type="button" id="return-home" class="link-button">← ホームへ</button></div>
      <div class="game-layout"><div class="left-column">${statsHtml()}${historyHtml()}</div>
        <div class="question-zone">
          ${recommendedHtml()}
          <div class="library-header"><div><h3>質問リスト</h3><p>好きな質問を選んで聞いてみよう。同じ質問は1回まで。</p></div><span id="library-count" class="library-count">${list.total} 件</span></div>
          <div id="question-tabs" class="tabs-wrap" role="tablist" aria-label="質問のカテゴリー">${tabsHtml()}</div>
          <div class="search-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5"></circle><path d="m16 16 5 5"></path></svg><label class="sr-only" for="question-search">質問を探す</label><input type="search" id="question-search" placeholder="質問を探す（例：食べ物、空、赤色）" value="${escapeHTML(queryText)}"></div>
          <div id="question-list" class="question-list">${list.html}</div>
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
    const tab=e.target.closest('[data-tab]');
    if(tab){selectedTab=tab.dataset.tab;renderQuestionPanel();return;}
    const q=e.target.closest('[data-question]');
    if(q){ask(Number(q.dataset.question));return;}
    if(e.target.closest('#open-guess')){openGuess();return;}
    if(e.target.closest('#open-reveal')){revealDialog.showModal();return;}
  });
  app.addEventListener('input',e=>{if(e.target.id==='question-search'){queryText=e.target.value;renderQuestionPanel();}});
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