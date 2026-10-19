/* 逆アキネーター — オフラインで使えるオリジナルのお題・質問データ */
(() => {
  'use strict';
  // 属性は、質問に対して明確に「はい」と答えられる特徴だけを記録します。
  const defaults = {
    animal: 'living animal natural moving outdoor',
    food: 'food edible',
    object: 'manmade object',
    vehicle: 'manmade vehicle ride outdoor',
    nature: 'natural outdoor',
    plant: 'living plant natural outdoor'
  };
  const words = [];
  function add(name, icon, group, level, traits, aliases = '', maybe = '') {
    words.push({
      id: words.length,
      name, icon, group, level,
      tags: new Set((defaults[group] + ' ' + traits).trim().split(/\s+/)),
      aliases: aliases ? aliases.split('|') : [],
      maybe: new Set(maybe ? maybe.split(/\s+/) : [])
    });
  }

  // 生き物（40）
  add('ねこ','🐈','animal',1,'pet fur four small voice indoor nocturnal','猫|ネコ|キャット');
  add('いぬ','🐕','animal',1,'pet fur four voice indoor','犬|イヌ|ドッグ');
  add('うさぎ','🐇','animal',1,'pet fur four small herbivore','兎|ウサギ|ラビット');
  add('ハムスター','🐹','animal',1,'pet fur four small nocturnal indoor','はむすたー');
  add('パンダ','🐼','animal',1,'mammal fur four zoo herbivore large black white','ジャイアントパンダ');
  add('ライオン','🦁','animal',1,'mammal fur four zoo predator large voice yellow','獅子');
  add('トラ','🐅','animal',1,'mammal fur four zoo predator large stripes orange','虎|タイガー');
  add('ゾウ','🐘','animal',1,'mammal four zoo herbivore huge longnose','象|エレファント');
  add('キリン','🦒','animal',1,'mammal fur four zoo herbivore huge longneck yellow spots','ジラフ');
  add('サル','🐒','animal',1,'mammal fur zoo hands voice','猿|モンキー');
  add('ゴリラ','🦍','animal',2,'mammal fur zoo large hands black','ごりら');
  add('コアラ','🐨','animal',2,'mammal fur four zoo herbivore tree','こあら');
  add('カンガルー','🦘','animal',2,'mammal fur zoo herbivore large pouch jumps','かんがるー');
  add('ウマ','🐎','animal',1,'mammal fur four farm herbivore large voice','馬|ホース');
  add('ウシ','🐄','animal',1,'mammal fur four farm herbivore large voice horns milk','牛|カウ');
  add('ブタ','🐖','animal',1,'mammal fur four farm voice pink','豚|ピッグ');
  add('ヒツジ','🐑','animal',2,'mammal fur four farm herbivore white voice wool','羊|シープ');
  add('クマ','🐻','animal',1,'mammal fur four zoo predator large voice','熊|ベア');
  add('イルカ','🐬','animal',1,'mammal sea swim zoo predator gray voice','ドルフィン');
  add('クジラ','🐳','animal',1,'mammal sea swim huge gray','鯨|ホエール');
  add('サメ','🦈','animal',1,'fish sea swim predator large gray','鮫|シャーク');
  add('シャチ','🐋','animal',2,'mammal sea swim zoo predator large black white','オルカ');
  add('ペンギン','🐧','animal',1,'bird swim zoo wings black white coldplace','ぺんぎん');
  add('ワシ','🦅','animal',2,'bird fly wings predator large','鷲|イーグル');
  add('フクロウ','🦉','animal',1,'bird fly wings predator nocturnal voice','梟|ふくろう');
  add('スズメ','🐦','animal',2,'bird fly wings small voice','雀|すずめ');
  add('カメ','🐢','animal',1,'reptile four swim shell pet','亀|タートル');
  add('カエル','🐸','animal',1,'amphibian four swim jump green small voice','蛙|フロッグ');
  add('ヘビ','🐍','animal',1,'reptile legless predator long pet','蛇|スネーク');
  add('ワニ','🐊','animal',2,'reptile four swim predator zoo large green','鰐|クロコダイル');
  add('トカゲ','🦎','animal',2,'reptile four small pet green','蜥蜴|リザード');
  add('チョウ','🦋','animal',1,'insect fly wings small','蝶|蝶々|ちょうちょ|バタフライ');
  add('カブトムシ','🪲','animal',1,'insect fly wings small horns pet black','かぶとむし|甲虫');
  add('アリ','🐜','animal',1,'insect small black sixlegs','蟻|あり');
  add('タコ','🐙','animal',1,'mollusk sea swim tentacles predator red','蛸|オクトパス');
  add('クラゲ','🪼','animal',2,'sea swim tentacles clear soft','海月|くらげ|ジェリーフィッシュ');
  add('エビ','🦐','animal',2,'crustacean sea swim shell red','海老|えび|シュリンプ');
  add('カニ','🦀','animal',1,'crustacean sea shell red claws','蟹|かに|クラブ');
  add('キンギョ','🐟','animal',1,'fish freshwater swim pet small red','金魚|きんぎょ');
  add('サケ','🐟','animal',2,'fish sea freshwater swim gray','鮭|さけ|シャケ|しゃけ');

  // 食べ物・飲み物（36）
  add('りんご','🍎','food',1,'fruit sweet raw red round handheld plantbased','林檎|リンゴ|アップル');
  add('バナナ','🍌','food',1,'fruit sweet raw yellow long handheld plantbased','ばなな');
  add('みかん','🍊','food',1,'fruit sweet raw orange round handheld plantbased seasonal','蜜柑|ミカン');
  add('いちご','🍓','food',1,'fruit sweet raw red small handheld plantbased','苺|イチゴ|ストロベリー');
  add('ぶどう','🍇','food',2,'fruit sweet raw purple small plantbased','葡萄|ブドウ|グレープ');
  add('スイカ','🍉','food',1,'fruit sweet raw green red round large plantbased seasonal','西瓜|すいか|ウォーターメロン');
  add('レモン','🍋','food',2,'fruit sour raw yellow plantbased handheld','檸檬|れもん');
  add('もも','🍑','food',2,'fruit sweet raw pink round plantbased handheld','桃|モモ|ピーチ');
  add('にんじん','🥕','food',1,'vegetable orange long plantbased kitchen raw','人参|ニンジン|キャロット');
  add('トマト','🍅','food',1,'vegetable red round plantbased raw kitchen','とまと');
  add('きゅうり','🥒','food',2,'vegetable green long plantbased raw kitchen','胡瓜|キュウリ');
  add('とうもろこし','🌽','food',2,'vegetable yellow long plantbased hot kitchen','トウモロコシ|コーン');
  add('じゃがいも','🥔','food',2,'vegetable plantbased hot kitchen','ジャガイモ|馬鈴薯|ポテト');
  add('おにぎり','🍙','food',1,'rice japanesefood handheld salty white','オニギリ|おむすび|御握り');
  add('すし','🍣','food',1,'rice japanesefood seafood salty cold','寿司|鮨|スシ|お寿司');
  add('ラーメン','🍜','food',1,'noodles hot salty japanesefood meatfish','らーめん|中華そば');
  add('カレーライス','🍛','food',1,'rice hot spicy salty meatfish','カレー|かれーらいす');
  add('ピザ','🍕','food',1,'bread hot salty baked round cheese','ぴざ');
  add('ハンバーガー','🍔','food',1,'bread meatfish salty handheld','バーガー|はんばーがー');
  add('サンドイッチ','🥪','food',2,'bread meatfish cold handheld salty','サンドウィッチ|サンド');
  add('パン','🍞','food',1,'bread baked handheld plantbased','食パン|ぱん|ブレッド');
  add('ごはん','🍚','food',1,'rice white hot staple plantbased','白米|お米|米|ライス');
  add('たまご','🥚','food',1,'egg round white kitchen handheld','卵|玉子|タマゴ|エッグ');
  add('チョコレート','🍫','food',1,'sweet dessert brown handheld','チョコ|ちょこれーと');
  add('ケーキ','🍰','food',1,'sweet dessert baked cream seasonal','ショートケーキ|けーき');
  add('アイスクリーム','🍨','food',1,'sweet dessert cold milk','アイス|あいすくりーむ');
  add('ドーナツ','🍩','food',1,'sweet dessert baked round handheld','ドーナッツ|どーなつ');
  add('プリン','🍮','food',2,'sweet dessert cold egg milk','ぷりん|カスタードプリン');
  add('クッキー','🍪','food',2,'sweet dessert baked handheld','ビスケット|くっきー');
  add('たこやき','🐙','food',1,'japanesefood hot salty round meatfish','たこ焼き|タコヤキ');
  add('ぎょうざ','🥟','food',2,'hot salty meatfish','餃子|ギョウザ');
  add('コーヒー','☕','food',1,'drink hot liquid brown','珈琲|こーひー|ブラックコーヒー');
  add('おちゃ','🍵','food',1,'drink hot liquid green japanesefood plantbased','お茶|茶|緑茶|グリーンティー');
  add('ぎゅうにゅう','🥛','food',1,'drink cold liquid milk white','牛乳|ミルク');
  add('オレンジジュース','🧃','food',2,'drink cold liquid orange fruit sweet','オレンジジュース100%|みかんジュース');
  add('みそしる','🥣','food',2,'hot liquid japanesefood salty','味噌汁|お味噌汁|みそ汁');

  // 道具・日用品（42）
  add('スマートフォン','📱','object',1,'electric battery screen buttons photo communication handheld pocket','スマホ|携帯電話|けいたい|携帯|スマートホン');
  add('パソコン','💻','object',1,'electric screen buttons work school writing communication','PC|コンピューター|コンピュータ|ノートパソコン');
  add('テレビ','📺','object',1,'electric screen buttons home sound entertainment large','TV|てれび');
  add('カメラ','📷','object',1,'electric battery buttons photo handheld','写真機|かめら');
  add('イヤホン','🎧','object',1,'electric battery sound music wearable handheld','イヤフォン|いあほん|ヘッドホン','battery');
  add('とけい','⌚','object',1,'time buttons wearable small','時計|腕時計|ウォッチ','electric');
  add('めがね','👓','object',1,'wearable clear small handheld','眼鏡|メガネ|グラス');
  add('かさ','☂️','object',1,'rain handheld fabric outdoor long','傘|カサ|アンブレラ');
  add('かばん','🎒','object',1,'wearable fabric school work portable','鞄|バッグ|リュック');
  add('くつ','👟','object',1,'wearable fabric outdoor sport','靴|シューズ|スニーカー');
  add('ぼうし','🧢','object',1,'wearable fabric outdoor','帽子|キャップ|ハット');
  add('Tシャツ','👕','object',1,'wearable fabric','ティーシャツ|tshirt|Tシャツ');
  add('えんぴつ','✏️','object',1,'writing school handheld long wooden','鉛筆|エンピツ|ペンシル');
  add('けしゴム','🧽','object',1,'writing school handheld small','消しゴム|消しごむ|ケシゴム');
  add('ノート','📓','object',1,'writing reading paper school handheld','ノートブック|のーと');
  add('ほん','📖','object',1,'reading paper school handheld entertainment','本|書籍|ブック');
  add('はさみ','✂️','object',1,'cutting school handheld metal','鋏|ハサミ|シザーズ');
  add('ほうちょう','🔪','object',1,'cutting kitchen handheld metal long','包丁|ナイフ');
  add('フライパン','🍳','object',1,'kitchen metal handheld hot','ふらいぱん');
  add('さら','🍽️','object',1,'kitchen eattool round handheld','皿|お皿|おさら|プレート');
  add('スプーン','🥄','object',1,'kitchen eattool handheld metal','すぷーん');
  add('フォーク','🍴','object',2,'kitchen eattool handheld metal','ふぉーく');
  add('はぶらし','🪥','object',1,'clean handheld long','歯ブラシ|歯ぶらし|ハブラシ');
  add('せっけん','🧼','object',2,'clean handheld small','石鹸|石けん|セッケン');
  add('タオル','🧺','object',1,'clean fabric handheld','たおる');
  add('いす','🪑','object',1,'furniture sit wooden home','椅子|イス|チェア');
  add('つくえ','🪑','object',1,'furniture wooden school work home writing large','机|デスク|テーブル');
  add('ベッド','🛏️','object',1,'furniture sleep fabric home large','べっど');
  add('ソファ','🛋️','object',2,'furniture sit fabric home large','ソファー|そふぁ');
  add('でんきスタンド','💡','object',2,'electric home light work','電気スタンド|デスクライト|スタンドライト');
  add('かぎ','🗝️','object',1,'metal handheld small home','鍵|キー');
  add('ドア','🚪','object',1,'wooden home large','扉|とびら|どあ');
  add('リモコン','🎛️','object',1,'electric battery buttons handheld home','りもこん|リモートコントローラー');
  add('せんぷうき','🌀','object',1,'electric home buttons summer','扇風機|ファン');
  add('エアコン','❄️','object',1,'electric home buttons summer winter large','えあこん|クーラー');
  add('れいぞうこ','🧊','object',1,'electric home kitchen cold large metal','冷蔵庫|フリッジ');
  add('せんたくき','🫧','object',2,'electric home clean buttons large','洗濯機|せんたく機');
  add('ぬいぐるみ','🧸','object',1,'play fabric soft home','人形|テディベア|縫いぐるみ');
  add('サッカーボール','⚽','object',1,'play sport round sphere outdoor','ボール|サッカーのボール');
  add('ギター','🎸','object',1,'music sound entertainment handheld','ぎたー');
  add('ピアノ','🎹','object',1,'music sound entertainment large wooden','ぴあの');
  add('ゲームき','🎮','object',1,'electric battery buttons screen play entertainment handheld','ゲーム機|テレビゲーム|携帯ゲーム機','battery screen');

  // 乗り物（12）
  add('くるま','🚗','vehicle',1,'road wheels engine metal large','車|自動車|カー|乗用車');
  add('バス','🚌','vehicle',1,'road wheels engine metal large publictransport','路線バス');
  add('トラック','🚚','vehicle',1,'road wheels engine metal large work','貨物車|とらっく');
  add('タクシー','🚕','vehicle',1,'road wheels engine metal large work','たくしー');
  add('バイク','🏍️','vehicle',1,'road wheels twowheels engine metal','オートバイ|単車|モーターバイク');
  add('じてんしゃ','🚲','vehicle',1,'road wheels twowheels pedal metal sport','自転車|チャリ|サイクル');
  add('でんしゃ','🚃','vehicle',1,'rail engine electric metal large publictransport','電車|鉄道');
  add('しんかんせん','🚄','vehicle',1,'rail engine electric metal large publictransport fast','新幹線|bullettrain');
  add('ひこうき','✈️','vehicle',1,'fly wings engine metal large publictransport sky','飛行機|航空機|エアプレーン');
  add('ヘリコプター','🚁','vehicle',2,'fly engine metal sky','ヘリ|へりこぷたー');
  add('ふね','🚢','vehicle',1,'boat water sea large metal publictransport','船|ボート|フェリー');
  add('ロケット','🚀','vehicle',2,'fly engine metal space sky','宇宙ロケット|ろけっと');

  // 自然・植物（20）
  add('たいよう','☀️','nature',1,'space sky bright hot round yellow huge','太陽|おひさま|お日様|サン');
  add('つき','🌙','nature',1,'space sky bright round white night','月|お月さま|ムーン');
  add('ほし','⭐','nature',1,'space sky bright night','星|スター|恒星');
  add('にじ','🌈','nature',1,'weather sky colorful rain','虹|レインボー');
  add('くも','☁️','nature',1,'weather sky water white','雲|クラウド');
  add('あめ','🌧️','nature',1,'weather sky water rain liquid','雨|レイン');
  add('ゆき','❄️','nature',1,'weather sky water white cold winter seasonal','雪|スノー');
  add('かみなり','⚡','nature',1,'weather sky bright sound rain','雷|稲妻|いなずま|サンダー');
  add('うみ','🌊','nature',1,'water sea liquid landscape blue','海|オーシャン');
  add('やま','🏔️','nature',1,'landscape huge green','山|マウンテン');
  add('かわ','🏞️','nature',1,'water liquid landscape freshwater','川|河川|リバー');
  add('たき','💦','nature',2,'water liquid landscape freshwater sound','滝|ウォーターフォール');
  add('はな','🌷','plant',1,'bloom colorful seasonal small','花|フラワー');
  add('さくら','🌸','plant',1,'bloom tree pink seasonal','桜|サクラ|ソメイヨシノ');
  add('ひまわり','🌻','plant',1,'bloom yellow seasonal summer large','向日葵|ヒマワリ|サンフラワー');
  add('き','🌳','plant',1,'tree large green wooden','木|樹木|ツリー');
  add('サボテン','🌵','plant',2,'green thorns desert pet','さぼてん|仙人掌');
  add('たんぽぽ','🌼','plant',2,'bloom yellow small seasonal','タンポポ|蒲公英');
  add('まつぼっくり','🌰','nature',2,'tree small brown handheld','松ぼっくり|松かさ');
  add('きのこ','🍄','nature',2,'small forest edible brown','茸|キノコ');


  // 細かな質問のための、明確に答えられる追加属性（お題名の漏えいには使用しない）。
  const detailedTraits = {
    laysEggs: ['ペンギン','ワシ','フクロウ','スズメ','カメ','カエル','ヘビ','ワニ','トカゲ','チョウ','カブトムシ','アリ','サメ','キンギョ','サケ','タコ','クラゲ','エビ','カニ'],
    hasTail: ['ねこ','いぬ','うさぎ','ハムスター','パンダ','ライオン','トラ','ゾウ','キリン','サル','ゴリラ','コアラ','カンガルー','ウマ','ウシ','ブタ','ヒツジ','クマ','イルカ','クジラ','サメ','シャチ','ワシ','フクロウ','スズメ','カメ','ワニ','トカゲ','キンギョ','サケ'],
    hasFins: ['イルカ','クジラ','サメ','シャチ','キンギョ','サケ'],
    graspingHands: ['サル','ゴリラ'],
    tusks: ['ゾウ'],
    peelToEat: ['バナナ','みかん'],
    hollowCenter: ['ドーナツ'],
    filledInside: ['おにぎり','ぎょうざ'],
    servedWithSoup: ['ラーメン','みそしる'],
    usesCheese: ['ピザ'],
    usesInternet: ['スマートフォン','パソコン'],
    opensCloses: ['かさ','かばん','ノート','ほん','ドア'],
    shinesLight: ['でんきスタンド'],
    plugsIntoWall: ['テレビ','でんきスタンド','せんぷうき','エアコン','れいぞうこ','せんたくき'],
    keyboardInstrument: ['ピアノ'],
    fareMeter: ['タクシー'],
    afterRain: ['にじ'],
    prickly: ['サボテン'],
    rootedPlant: ['はな','さくら','ひまわり','き','サボテン','たんぽぽ'],
    purrs: ['ねこ'],
    forkTines: ['フォーク'],
    freightTruck: ['トラック'],
    frozenFood: ['アイスクリーム'],
    expressRail: ['しんかんせん'],
    waterfallDrop: ['たき']
  };
  for (const [tag, names] of Object.entries(detailedTraits)) {
    for (const item of words) if (names.includes(item.name)) item.tags.add(tag);
  }

  // 全体にまたがる質問の回答を揃えるための共通属性補完。
  // 「自然のもの」は加工前の果物・野菜など、加工品は「人が作ったもの」で分類する。
  const cookedFoods = new Set(['おにぎり','すし','ラーメン','カレーライス','ピザ','ハンバーガー','サンドイッチ','パン','ごはん','チョコレート','ケーキ','アイスクリーム','ドーナツ','プリン','クッキー','たこやき','ぎょうざ','コーヒー','おちゃ','オレンジジュース','みそしる']);
  const mediumWords = new Set(['うさぎ','ハムスター','サル','フクロウ','カメ','カエル','ヘビ','アリ','カニ','キンギョ','にんじん','トマト','たまご','ごはん','たこやき','コーヒー','おちゃ','ノート','ほん','けしゴム','タオル','いす','つくえ','かぎ','ドア','めがね','れいぞうこ','エアコン','ギター','ピアノ','バイク','タクシー','じてんしゃ','トラック','ふね','ほし','かわ','き','はな']);
  const expertWords = new Set(['ゴリラ','コアラ','カンガルー','シャチ','ワシ','ワニ','トカゲ','クラゲ','エビ','サケ','レモン','もも','きゅうり','とうもろこし','じゃがいも','プリン','クッキー','ぎょうざ','みそしる','ソファ','でんきスタンド','せんたくき','ヘリコプター','ロケット','たき','サボテン','たんぽぽ','まつぼっくり','きのこ']);
  for (const item of words) {
    if (mediumWords.has(item.name) && item.level===1) item.level=2;
    if (expertWords.has(item.name)) item.level=3;
    if (item.tags.has('sea')||item.tags.has('freshwater')||item.tags.has('swim')||item.tags.has('boat')) item.tags.add('water');
    if (item.tags.has('fly')) item.tags.add('sky');
    if (item.tags.has('huge')) item.tags.add('large');
    if (item.group==='food' && cookedFoods.has(item.name)) item.tags.add('manmade');
    if (item.tags.has('fruit')||item.tags.has('vegetable')||item.name==='たまご') item.tags.add('natural');
    if (item.name==='きのこ') item.tags.add('food');
  }

  // Common biology corrections: mammals receive class traits for the species listed.
  for (const animal of words.filter(w => w.group === 'animal')) {
    if (['ねこ','いぬ','うさぎ','ハムスター','パンダ','ライオン','トラ','ゾウ','キリン','サル','ゴリラ','コアラ','カンガルー','ウマ','ウシ','ブタ','ヒツジ','クマ','イルカ','クジラ','シャチ'].includes(animal.name)) animal.tags.add('mammal');
  }

  const questions = [
    ['all','基本','生き物ですか？','living'],
    ['all','基本','食べ物・飲み物ですか？','food'],
    ['all','基本','人の手で作られたものですか？','manmade'],
    ['all','基本','動物ですか？','animal'],
    ['all','基本','植物ですか？','plant'],
    ['all','基本','乗り物ですか？','vehicle'],
    ['all','基本','自然界のものですか？','natural'],
    ['all','基本','電気を使いますか？','electric'],
    ['all','基本','屋外にある・暮らすものですか？','outdoor'],
    ['all','基本','水と深い関係がありますか？','water'],
    ['all','基本','空に関係がありますか？','sky'],
    ['all','基本','学校に関係がありますか？','school'],
    ['all','基本','片手で持って使えますか？','handheld'],
    ['all','基本','大きなものですか？','large'],
    ['all','基本','小さなものですか？','small'],
    ['all','基本','丸い形のイメージですか？','round'],
    ['all','基本','長細い形のイメージですか？','long'],
    ['animal','生き物','哺乳類ですか？','mammal'],
    ['animal','生き物','鳥の仲間ですか？','bird'],
    ['animal','生き物','昆虫ですか？','insect'],
    ['animal','生き物','魚の仲間ですか？','fish'],
    ['animal','生き物','は虫類ですか？','reptile'],
    ['animal','生き物','4本足ですか？','four'],
    ['animal','生き物','翼がありますか？','wings'],
    ['animal','生き物','空を飛べますか？','fly'],
    ['animal','生き物','泳げますか？','swim'],
    ['animal','生き物','毛におおわれていますか？','fur'],
    ['animal','生き物','ペットとして飼われますか？','pet'],
    ['animal','生き物','動物園で見られますか？','zoo'],
    ['animal','生き物','牧場で飼われますか？','farm'],
    ['animal','生き物','海に住んでいますか？','sea'],
    ['animal','生き物','肉食の動物ですか？','predator'],
    ['animal','生き物','草を食べる動物ですか？','herbivore'],
    ['animal','生き物','夜行性ですか？','nocturnal'],
    ['animal','生き物','甲羅がありますか？','shell'],
    ['animal','生き物','角がありますか？','horns'],
    ['animal','生き物','ジャンプが得意ですか？','jump'],
    ['food','食べ物','甘い味のイメージですか？','sweet'],
    ['food','食べ物','しょっぱい味のイメージですか？','salty'],
    ['food','食べ物','果物ですか？','fruit'],
    ['food','食べ物','野菜ですか？','vegetable'],
    ['food','食べ物','飲み物ですか？','drink'],
    ['food','食べ物','デザートですか？','dessert'],
    ['food','食べ物','冷やして食べたり飲んだりしますか？','cold'],
    ['food','食べ物','温かい状態で食べたり飲んだりしますか？','hot'],
    ['food','食べ物','お米が使われていますか？','rice'],
    ['food','食べ物','麺料理ですか？','noodles'],
    ['food','食べ物','パンに関係していますか？','bread'],
    ['food','食べ物','肉や魚介が使われていますか？','meatfish'],
    ['food','食べ物','和食のイメージですか？','japanesefood'],
    ['food','食べ物','生で食べることが多いですか？','raw'],
    ['food','食べ物','焼いて作ることが多いですか？','baked'],
    ['food','食べ物','酸っぱい味ですか？','sour'],
    ['object','道具・暮らし','身につけるものですか？','wearable'],
    ['object','道具・暮らし','家具ですか？','furniture'],
    ['object','道具・暮らし','文字を書くことに関係しますか？','writing'],
    ['object','道具・暮らし','料理に使いますか？','kitchen'],
    ['object','道具・暮らし','切るために使いますか？','cutting'],
    ['object','道具・暮らし','音楽に関係していますか？','music'],
    ['object','道具・暮らし','遊びに使いますか？','play'],
    ['object','道具・暮らし','洗ったり清潔にしたりするものですか？','clean'],
    ['object','道具・暮らし','画面がついていますか？','screen'],
    ['object','道具・暮らし','写真を撮ることができますか？','photo'],
    ['object','道具・暮らし','電池で動きますか？','battery'],
    ['object','道具・暮らし','ボタンを押して操作しますか？','buttons'],
    ['object','道具・暮らし','時間を知るためのものですか？','time'],
    ['object','道具・暮らし','座るために使いますか？','sit'],
    ['object','道具・暮らし','寝るために使いますか？','sleep'],
    ['object','道具・暮らし','雨の日に使いますか？','rain'],
    ['object','道具・暮らし','スポーツに使いますか？','sport'],
    ['object','道具・暮らし','紙でできていますか？','paper'],
    ['object','道具・暮らし','布を使っていますか？','fabric'],
    ['object','道具・暮らし','金属が主な素材ですか？','metal'],
    ['object','道具・暮らし','木材が使われていますか？','wooden'],
    ['object','道具・暮らし','食事中に使うものですか？','eattool'],
    ['vehicle','乗り物','道路を走りますか？','road'],
    ['vehicle','乗り物','レールを走りますか？','rail'],
    ['vehicle','乗り物','海や川を進みますか？','boat'],
    ['vehicle','乗り物','車輪で走りますか？','wheels'],
    ['vehicle','乗り物','2輪の乗り物ですか？','twowheels'],
    ['vehicle','乗り物','エンジンやモーターがありますか？','engine'],
    ['vehicle','乗り物','一度に大人数を乗せられますか？','publictransport'],
    ['vehicle','乗り物','人がこいで進みますか？','pedal'],
    ['vehicle','乗り物','宇宙へ向かえますか？','space'],
    ['nature','自然','天気に関係していますか？','weather'],
    ['nature','自然','宇宙にありますか？','space'],
    ['nature','自然','夜空で見られますか？','night'],
    ['nature','自然','明るく光って見えますか？','bright'],
    ['nature','自然','地形の一部ですか？','landscape'],
    ['nature','自然','花が咲きますか？','bloom'],
    ['nature','自然','木の仲間ですか？','tree'],
    ['nature','自然','季節を感じるものですか？','seasonal'],
    ['nature','自然','冬に関係していますか？','winter'],
    ['nature','自然','夏に関係していますか？','summer'],
    ['nature','自然','液体ですか？','liquid'],
    ['nature','自然','雪や氷など冷たいものに関係していますか？','coldplace'],
    ['color','色・形','赤色のイメージがありますか？','red'],
    ['color','色・形','黄色のイメージがありますか？','yellow'],
    ['color','色・形','緑色のイメージがありますか？','green'],
    ['color','色・形','青色のイメージがありますか？','blue'],
    ['color','色・形','白色のイメージがありますか？','white'],
    ['color','色・形','黒色のイメージがありますか？','black'],
    ['color','色・形','ピンク色のイメージがありますか？','pink'],
    ['color','色・形','オレンジ色のイメージがありますか？','orange'],
    ['color','色・形','透明なイメージがありますか？','clear'],
    ['color','色・形','縞模様がありますか？','stripes'],
    ['color','色・形','水玉・斑点模様がありますか？','spots'],
    ['animal','生き物','卵から生まれてきますか？','laysEggs'],
    ['animal','生き物','しっぽがありますか？','hasTail'],
    ['animal','生き物','ヒレがありますか？','hasFins'],
    ['animal','生き物','手で物をつかむのが得意ですか？','graspingHands'],
    ['animal','生き物','大きな牙がありますか？','tusks'],
    ['food','食べ物','皮をむいて食べるイメージですか？','peelToEat'],
    ['food','食べ物','真ん中に穴が開いていますか？','hollowCenter'],
    ['food','食べ物','中に具材が包まれていますか？','filledInside'],
    ['food','食べ物','汁やスープと一緒に食べますか？','servedWithSoup'],
    ['food','食べ物','チーズが使われていますか？','usesCheese'],
    ['object','道具・暮らし','インターネットにつないで使えますか？','usesInternet'],
    ['object','道具・暮らし','開いたり閉じたりできますか？','opensCloses'],
    ['object','道具・暮らし','周りを照らすための道具ですか？','shinesLight'],
    ['object','道具・暮らし','コンセントにつないで使うことが多いですか？','plugsIntoWall'],
    ['object','道具・暮らし','鍵盤を押して音を出しますか？','keyboardInstrument'],
    ['vehicle','乗り物','料金メーターがついていますか？','fareMeter'],
    ['nature','自然','雨上がりに見かけることが多いですか？','afterRain'],
    ['nature','自然','トゲがありますか？','prickly'],
    ['nature','自然','地面に根を張って育ちますか？','rootedPlant'],
    ['animal','生き物','のどをゴロゴロ鳴らしますか？','purrs'],
    ['object','道具・暮らし','先がいくつかに分かれていますか？','forkTines'],
    ['vehicle','乗り物','荷物を運ぶために作られた車ですか？','freightTruck'],
    ['food','食べ物','凍った状態で食べるものですか？','frozenFood'],
    ['vehicle','乗り物','高速で長距離を走る列車ですか？','expressRail'],
    ['nature','自然','高いところから水が流れ落ちていますか？','waterfallDrop']
  ].map(([section,label,text,tag],id) => ({id,section,label,text,tag}));

  // 質問とお題の関係が成立するよう、曖昧さが出やすい属性は定義しない設計です。
  window.REVERSE_DATA = Object.freeze({items: words, questions, version: '1.2.0'});
})();