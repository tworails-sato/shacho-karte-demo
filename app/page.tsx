import Image from "next/image";
import Link from "next/link";

const features = [
  {
    number: "01",
    title: "16テーマで経営の現在地を整理",
    body: "収益性・市場・組織・意思決定・経営体制まで、経営の論点を多面的に見える化します。"
  },
  {
    number: "02",
    title: "目標値との違いを確認",
    body: "感覚的な自己評価だけでなく、成長企業の目安と照らして次の論点を捉えられます。"
  },
  {
    number: "03",
    title: "過去受検者との比較",
    body: "近しい経営者との違いから、優先順位を上げて確認したいテーマを見つけます。"
  },
  {
    number: "04",
    title: "対話と支援の入口になる",
    body: "結果を共通言語にして、経営者・幹部・支援者との対話を具体的な次の一手につなげます。"
  }
] as const;

const partnerItems = [
  {
    title: "「紹介待ち」から、能動的な提案へ",
    body: "社長カルテを活用することで、自社でご提案のきっかけを生み出せます。"
  },
  {
    title: "経営者の「気づき」を引き出す",
    body: "言語化しづらい課題の可視化を通じて、ご支援の質が高まります。"
  },
  {
    title: "自社の領域に合わせて広げられる",
    body: "専門性に合わせた診断のカスタム＆開発が可能です（OEM）。"
  }
] as const;

function RadarSample({ dark = false }: { dark?: boolean }) {
  const gridStroke = dark ? "rgba(255,255,255,0.14)" : "#e7edf2";
  const labelFill = dark ? "#9fb2c4" : "#5b6b7a";
  const averageFill = dark ? "rgba(240,166,62,0.15)" : "rgba(240,166,62,0.12)";
  const scoreFill = dark ? "rgba(62,207,158,0.25)" : "rgba(62,207,158,0.2)";

  return (
    <svg viewBox="0 0 320 300" className="radar-svg" aria-label="16テーマのレーダーチャートサンプル" role="img">
      <g transform="translate(160,150)">
        <polygon points="0,-110 78,-78 110,0 78,78 0,110 -78,78 -110,0 -78,-78" fill="none" stroke={gridStroke} strokeWidth="1" />
        <polygon points="0,-73 52,-52 73,0 52,52 0,73 -52,52 -73,0 -52,-52" fill="none" stroke={gridStroke} strokeWidth="1" />
        <polygon points="0,-37 26,-26 37,0 26,26 0,37 -26,26 -37,0 -26,-26" fill="none" stroke={gridStroke} strokeWidth="1" />
        <g stroke={gridStroke} strokeWidth="1">
          <line x1="0" y1="0" x2="0" y2="-110" />
          <line x1="0" y1="0" x2="78" y2="-78" />
          <line x1="0" y1="0" x2="110" y2="0" />
          <line x1="0" y1="0" x2="78" y2="78" />
          <line x1="0" y1="0" x2="0" y2="110" />
          <line x1="0" y1="0" x2="-78" y2="78" />
          <line x1="0" y1="0" x2="-110" y2="0" />
          <line x1="0" y1="0" x2="-78" y2="-78" />
        </g>
        <polygon points="0,-58 40,-40 62,0 44,44 0,55 -46,46 -60,0 -42,-42" fill={averageFill} stroke="#f0a63e" strokeWidth="1.5" strokeDasharray="4 3" />
        <polygon points="0,-88 60,-60 92,0 58,58 0,70 -54,54 -78,0 -50,-50" fill={scoreFill} stroke="#3ecf9e" strokeWidth="2.5" />
        <g fontSize="8" fill={labelFill} textAnchor="middle" fontFamily="Noto Sans JP, sans-serif">
          <text x="0" y="-118">収益性</text>
          <text x="92" y="-84">成長性</text>
          <text x="124" y="3">組織</text>
          <text x="92" y="92">意思決定</text>
          <text x="0" y="126">採用</text>
          <text x="-92" y="92">事業継続</text>
          <text x="-124" y="3">投資</text>
          <text x="-92" y="-84">市場</text>
        </g>
      </g>
    </svg>
  );
}

function PrimaryCta({ children = "無料で診断をはじめる" }: { children?: string }) {
  return (
    <Link className="kv-cta" href="/basic-info">
      {children}
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="karte-lp">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap');

        .karte-lp{
          --navy-top:#0a1622; --navy-mid:#12283d; --navy-btm:#1c3a52;
          --mint:#3ecf9e; --mint-deep:#2bb488;
          --ink:#0d1b2a; --paper:#ffffff; --bg:#f5f8fa; --line:#e7edf2;
          --muted-light:#9fb2c4; --muted:#5b6b7a;
          --high:#3ecf9e; --mid:#f0a63e; --low:#5b8def;
          background:var(--paper);
          color:var(--ink);
          font-family:'Noto Sans JP',sans-serif;
          line-height:1.7;
        }
        .karte-lp *,.karte-lp *::before,.karte-lp *::after{box-sizing:border-box;}
        .karte-lp a{text-decoration:none;color:inherit;}
        .serif{font-family:'Noto Serif JP',serif;}

        .hd{
          position:sticky;top:0;z-index:50;
          background:rgba(255,255,255,0.92);backdrop-filter:blur(10px);
          border-bottom:1px solid var(--line);
        }
        .hd-in{max-width:1140px;margin:0 auto;padding:14px 24px;display:flex;align-items:center;gap:24px;}
        .hd-logo{font-family:'Noto Serif JP',serif;font-weight:700;font-size:1.1rem;color:var(--ink);display:flex;align-items:center;gap:10px;flex-shrink:0;}
        .hd-logo-img{height:40px;width:auto;object-fit:contain;}
        .hd-logo-txt{font-family:'Noto Serif JP',serif;font-weight:700;font-size:1.05rem;color:var(--ink);letter-spacing:0.02em;white-space:nowrap;}
        .hd-nav{display:flex;gap:26px;margin-left:auto;align-items:center;}
        .hd-nav a{font-size:0.86rem;color:var(--muted);font-weight:500;transition:color .15s,background .15s,transform .15s;}
        .hd-nav a:hover{color:var(--ink);}
        .hd-partner{color:var(--mint-deep)!important;font-weight:700!important;}
        .hd-cta{
          background:var(--mint);color:#08312a!important;font-weight:700;font-size:0.86rem;
          padding:10px 22px;border-radius:9px;transition:background .15s,transform .15s;
          display:inline-flex;align-items:center;justify-content:center;
        }
        .hd-cta:hover{background:var(--mint-deep);transform:translateY(-1px);}
        .hd-burger{display:none;flex-direction:column;gap:4px;cursor:pointer;margin-left:auto;}
        .hd-burger span{width:22px;height:2px;background:var(--ink);}
        .hd-cta-m{display:none;}

        .kv{position:relative;background:linear-gradient(160deg,var(--navy-top) 0%,var(--navy-mid) 55%,var(--navy-btm) 100%);padding:72px 24px 84px;overflow:hidden;}
        .kv::before{content:"";position:absolute;inset:0;background:radial-gradient(1200px 420px at 30% -10%,rgba(62,207,158,0.14),transparent 70%);pointer-events:none;}
        .kv-in{position:relative;max-width:1140px;margin:0 auto;display:grid;grid-template-columns:1.15fr 0.85fr;gap:48px;align-items:center;}
        .kv-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:0.74rem;font-weight:700;letter-spacing:0.14em;color:var(--mint);border:1px solid rgba(62,207,158,0.35);background:rgba(62,207,158,0.08);padding:7px 16px;border-radius:999px;margin-bottom:24px;}
        .kv-eyebrow::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--mint);}
        .kv-title{font-family:'Noto Serif JP',serif;font-size:clamp(1.9rem,3.6vw,2.7rem);font-weight:700;line-height:1.45;color:#fff;margin:0 0 18px;word-break:auto-phrase;}
        .kv-title .u{background:linear-gradient(transparent 64%,rgba(62,207,158,0.35) 64%);padding:0 2px;}
        .kv-lead{font-size:clamp(0.92rem,1.4vw,1.02rem);line-height:1.9;color:var(--muted-light);margin:0 0 30px;word-break:auto-phrase;}
        .kv-benefits{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:26px;}
        .kv-benefit{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:16px 14px;}
        .kv-benefit-key{display:inline-block;font-size:0.66rem;font-weight:700;letter-spacing:0.08em;color:#08312a;background:var(--mint);padding:3px 9px;border-radius:5px;margin-bottom:10px;}
        .kv-benefit-h{font-family:'Noto Serif JP',serif;font-size:0.94rem;font-weight:700;color:#fff;margin-bottom:5px;}
        .kv-benefit-p{font-size:0.74rem;line-height:1.65;color:var(--muted-light);}
        .kv-cta{display:inline-flex;align-items:center;gap:10px;background:var(--mint);color:#08312a;font-size:1.04rem;font-weight:700;padding:17px 46px;border-radius:12px;box-shadow:0 10px 26px rgba(62,207,158,0.32);transition:transform .15s,background .15s;}
        .kv-proof-hero{display:flex;gap:12px;margin-bottom:28px;flex-wrap:wrap;}
        .kv-proof-hero-item{flex:1;min-width:130px;background:rgba(240,166,62,0.12);border:1px solid rgba(240,166,62,0.5);border-radius:12px;padding:16px 14px;text-align:center;}
        .kv-proof-hero-num{display:block;font-family:'Noto Serif JP',serif;font-size:1.9rem;font-weight:700;color:#f7b955;line-height:1.1;}
        .kv-proof-hero-num small{font-size:0.9rem;color:#fff;font-weight:700;}
        .kv-proof-hero-lbl{display:block;font-size:0.72rem;color:#e8d4b0;margin-top:6px;line-height:1.5;}
        .kv-cta:hover{background:var(--mint-deep);transform:translateY(-2px);}
        .kv-cta::after{content:"→";}
        .kv-note{margin-top:12px;font-size:0.78rem;color:var(--muted-light);}
        .kv-card{background:var(--paper);border-radius:18px;padding:24px;box-shadow:0 20px 50px rgba(0,0,0,0.3);}
        .kv-card-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;gap:12px;}
        .kv-card-ttl{font-size:0.82rem;font-weight:700;color:var(--ink);}
        .kv-card-tag{font-size:0.66rem;color:var(--muted);background:var(--bg);padding:3px 9px;border-radius:5px;white-space:nowrap;}
        .kv-card-sub{font-size:0.7rem;color:var(--muted);margin-bottom:14px;}
        .radar-svg{width:100%;height:auto;display:block;}
        .kv-legend{display:flex;gap:14px;margin-top:14px;justify-content:center;font-size:0.68rem;color:var(--muted);flex-wrap:wrap;}
        .kv-legend span{display:flex;align-items:center;gap:5px;}
        .kv-legend i{width:14px;height:3px;border-radius:2px;display:inline-block;}

        .sec{padding:76px 24px;}
        .sec.bg{background:var(--bg);}
        .sec.navy{background:linear-gradient(160deg,var(--navy-top),var(--navy-btm));color:#fff;}
        .sec-in{max-width:1080px;margin:0 auto;}
        .eyebrow{font-size:0.72rem;font-weight:700;letter-spacing:0.16em;color:var(--mint-deep);text-align:center;margin-bottom:12px;}
        .sec.navy .eyebrow{color:var(--mint);}
        .sec-ttl{font-family:'Noto Serif JP',serif;font-size:clamp(1.5rem,3vw,2rem);font-weight:700;text-align:center;line-height:1.5;margin:0 0 14px;word-break:auto-phrase;}
        .sec-desc{text-align:center;color:var(--muted);font-size:0.95rem;max-width:640px;margin:0 auto 48px;word-break:auto-phrase;}
        .sec.navy .sec-desc{color:var(--muted-light);}

        .flow{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;}
        .flow-step{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:26px 20px;text-align:center;position:relative;}
        .flow-num{font-size:0.68rem;font-weight:700;letter-spacing:0.1em;color:var(--mint-deep);margin-bottom:14px;}
        .flow-ic{width:52px;height:52px;margin:0 auto 16px;border-radius:14px;background:rgba(62,207,158,0.1);display:flex;align-items:center;justify-content:center;}
        .flow-ic svg{width:26px;height:26px;}
        .flow-h{font-size:0.95rem;font-weight:700;color:var(--ink);line-height:1.5;}

        .feat{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
        .feat-card{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:30px 28px;display:flex;gap:20px;align-items:flex-start;}
        .feat-no{font-family:'Noto Serif JP',serif;font-size:1.6rem;font-weight:700;color:var(--mint);flex-shrink:0;line-height:1;}
        .feat-h{font-size:1.05rem;font-weight:700;margin-bottom:8px;color:var(--ink);}
        .feat-p{font-size:0.86rem;color:var(--muted);line-height:1.8;}

        .result{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:center;}
        .result-panel{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:18px;padding:28px;}
        .score-row{display:flex;align-items:center;gap:12px;margin-bottom:12px;}
        .score-label{width:120px;font-size:0.82rem;color:#dbe6ef;flex-shrink:0;}
        .score-bar{flex:1;height:9px;background:rgba(255,255,255,0.1);border-radius:5px;overflow:hidden;}
        .score-fill{height:100%;border-radius:5px;}
        .score-val{width:28px;text-align:right;font-weight:700;font-size:0.86rem;}
        .result-lead h3{font-family:'Noto Serif JP',serif;font-size:1.3rem;margin:0 0 14px;line-height:1.5;}
        .result-lead p{color:var(--muted-light);font-size:0.9rem;line-height:1.9;margin:0 0 10px;}
        .result-full{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:32px;}
        .result-full-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:20px;margin-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.1);flex-wrap:wrap;gap:12px;}
        .result-full-tag{font-size:0.68rem;color:#08312a;background:var(--mint);padding:3px 10px;border-radius:5px;margin-right:12px;font-weight:700;}
        .result-full-ttl{font-family:'Noto Serif JP',serif;font-size:1.1rem;font-weight:700;color:#fff;}
        .result-full-score{font-size:0.85rem;color:var(--muted-light);}
        .result-full-score b{font-family:'Noto Serif JP',serif;font-size:1.8rem;color:var(--mint);margin:0 4px;}
        .result-full-body{display:grid;grid-template-columns:0.85fr 1.15fr;gap:36px;align-items:center;}
        .result-chart{display:flex;flex-direction:column;align-items:center;}
        .result-legend{display:flex;gap:16px;margin-top:10px;font-size:0.72rem;color:var(--muted-light);}
        .result-legend span{display:flex;align-items:center;gap:6px;}
        .result-legend i{width:16px;height:3px;border-radius:2px;display:inline-block;}
        .result-full-note{margin-top:26px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);font-size:0.85rem;color:var(--muted-light);line-height:1.85;}

        .faq{max-width:760px;margin:0 auto;}
        .faq-item{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:20px 24px;margin-bottom:12px;}
        .faq-q{font-weight:700;font-size:0.95rem;color:var(--ink);display:flex;gap:10px;}
        .faq-q::before{content:"Q";color:var(--mint-deep);font-family:'Noto Serif JP',serif;}
        .faq-a{font-size:0.86rem;color:var(--muted);line-height:1.8;margin-top:10px;padding-left:22px;}

        .partner-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:28px;}
        .partner-target{text-align:center;color:var(--mint);font-weight:700;font-size:1.05rem;margin-bottom:14px;letter-spacing:0.02em;}
        .partner-card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:28px;}
        .partner-h{font-size:0.98rem;font-weight:700;margin-bottom:8px;color:#fff;}
        .partner-p{font-size:0.82rem;color:var(--muted-light);line-height:1.75;}
        .partner-cta{text-align:center;}

        .final{text-align:center;}
        .final .kv-cta{margin-top:8px;}
        .final .kv-note{color:var(--muted);}
        .foot{background:var(--navy-top);color:var(--muted-light);padding:32px 24px;text-align:center;font-size:0.78rem;}

        @media(max-width:880px){
          .hd-nav{display:none;}
          .hd-in{gap:12px;}
          .hd-burger{display:flex;margin-left:auto;order:3;}
          .hd-cta-m{display:inline-flex;margin-left:auto;padding:9px 16px;font-size:0.8rem;}
          .hd-logo-img{height:36px;}
          .kv-in{grid-template-columns:1fr;gap:32px;}
          .kv-card{order:2;}
        }
        @media(max-width:760px){
          .flow{grid-template-columns:1fr 1fr;}
          .feat{grid-template-columns:1fr;}
          .result{grid-template-columns:1fr;}
          .result-full{padding:22px 18px;}
          .result-full-body{grid-template-columns:1fr;gap:24px;}
          .result-chart{max-width:320px;margin:0 auto;}
          .partner-grid{grid-template-columns:1fr;}
        }
        @media(max-width:560px){
          .hd-logo-txt{display:none;}
          .kv-benefits{grid-template-columns:1fr;}
          .kv-benefit{display:flex;align-items:center;gap:12px;}
          .kv-benefit-key{margin-bottom:0;}
          .kv-benefit-h{margin-bottom:2px;}
        }
      `}</style>

      <header className="hd">
        <div className="hd-in">
          <Link className="hd-logo" href="/" aria-label="社長カルテ トップへ">
            <Image className="hd-logo-img" src="/images/shacho-karte-logo.png" alt="社長カルテ" width={810} height={451} priority />
            <span className="hd-logo-txt">社長カルテ Light</span>
          </Link>
          <nav className="hd-nav" aria-label="グローバルメニュー">
            <a href="#flow">アセスメントの流れ</a>
            <a href="#feature">特徴</a>
            <a href="#result">結果イメージ</a>
            <a href="#partner" className="hd-partner">支援者向けプランを見る</a>
            <Link href="/basic-info" className="hd-cta">診断を始める</Link>
          </nav>
          <Link href="/basic-info" className="hd-cta hd-cta-m">診断を始める</Link>
          <div className="hd-burger" aria-label="メニュー">
            <span />
            <span />
            <span />
          </div>
        </div>
      </header>

      <section className="kv">
        <div className="kv-in">
          <div className="kv-text">
            <span className="kv-eyebrow">経営者専用アセスメント</span>
            <h1 className="kv-title">
              売上を上げるための
              <br />
              「次の一手」は、<span className="u">どこにあるか</span>
              <br />
              見えていますか？
            </h1>
            <p className="kv-lead">
              売上・事業・組織——伸ばしたいのに、何から着手すべきか迷う。社長カルテは、経営の16テーマから「いま、どこに手を打つべきか」を5分で見える化する診断です。
            </p>
            <div className="kv-benefits">
              <div className="kv-benefit">
                <span className="kv-benefit-key">カネ</span>
                <div>
                  <div className="kv-benefit-h">売上の伸ばし方</div>
                  <div className="kv-benefit-p">優先すべき戦略や行動が明らかになる</div>
                </div>
              </div>
              <div className="kv-benefit">
                <span className="kv-benefit-key">モノ</span>
                <div>
                  <div className="kv-benefit-h">事業の広げ方</div>
                  <div className="kv-benefit-p">事業を広げるうえでのマイルストーンが明らかになる</div>
                </div>
              </div>
              <div className="kv-benefit">
                <span className="kv-benefit-key">ヒト</span>
                <div>
                  <div className="kv-benefit-h">組織の開発</div>
                  <div className="kv-benefit-p">現場のGAPや、採用を成功させる要素を理解する</div>
                </div>
              </div>
            </div>
            <div className="kv-proof-hero">
              <div className="kv-proof-hero-item"><span className="kv-proof-hero-num">9<small>割</small></span><span className="kv-proof-hero-lbl">が「課題が整理できた」と回答</span></div>
              <div className="kv-proof-hero-item"><span className="kv-proof-hero-num">約800<small>名</small></span><span className="kv-proof-hero-lbl">の経営者データと比較</span></div>
              <div className="kv-proof-hero-item"><span className="kv-proof-hero-num">5<small>分</small></span><span className="kv-proof-hero-lbl">で完了・無料</span></div>
            </div>
            <PrimaryCta />
            <p className="kv-note">診断はわずか5分 ／ 登録不要</p>
          </div>

          <div className="kv-card">
            <div className="kv-card-top">
              <span className="kv-card-ttl">16テーマ レーダーチャート</span>
              <span className="kv-card-tag">結果サンプル</span>
            </div>
            <div className="kv-card-sub">あなたのスコアを、成長企業の目安・過去受検者平均と比較</div>
            <RadarSample />
            <div className="kv-legend">
              <span><i style={{ background: "#3ecf9e" }} />社長のスコア</span>
              <span><i style={{ background: "#f0a63e" }} />受検者平均</span>
            </div>
          </div>
        </div>
      </section>

      <section className="sec bg" id="flow">
        <div className="sec-in">
          <div className="eyebrow">FLOW</div>
          <h2 className="sec-ttl">アセスメントの流れ</h2>
          <p className="sec-desc">スマートフォンからでも、経営の現在地を短時間で整理できます。</p>
          <div className="flow">
            <div className="flow-step"><div className="flow-num">STEP 01</div><div className="flow-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#2bb488" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg></div><div className="flow-h">基本情報を入力</div></div>
            <div className="flow-step"><div className="flow-num">STEP 02</div><div className="flow-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#2bb488" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="m9 14 2 2 4-4" /></svg></div><div className="flow-h">設問48問に回答</div></div>
            <div className="flow-step"><div className="flow-num">STEP 03</div><div className="flow-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#2bb488" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="5" /><rect x="12" y="8" width="3" height="9" /><rect x="17" y="5" width="3" height="12" /></svg></div><div className="flow-h">結果画面で強み・課題を確認</div></div>
            <div className="flow-step"><div className="flow-num">STEP 04</div><div className="flow-ic"><svg viewBox="0 0 24 24" fill="none" stroke="#2bb488" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /><path d="M8 9h8" /><path d="M8 13h5" /></svg></div><div className="flow-h">個別解説を申し込み</div></div>
          </div>
        </div>
      </section>

      <section className="sec" id="feature">
        <div className="sec-in">
          <div className="eyebrow">FEATURE</div>
          <h2 className="sec-ttl">売上を上げるための「次の一手」がわかる</h2>
          <p className="sec-desc">スコアを並べるだけではなく、経営者が次に整理すべきテーマを見つけるためのアセスメントです。</p>
          <div className="feat">
            {features.map((feature) => (
              <div className="feat-card" key={feature.number}>
                <div className="feat-no">{feature.number}</div>
                <div>
                  <div className="feat-h">{feature.title}</div>
                  <div className="feat-p">{feature.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec navy" id="result">
        <div className="sec-in">
          <div className="eyebrow">RESULT SAMPLE</div>
          <h2 className="sec-ttl">結果は、次の意思決定のための資料になる</h2>
          <p className="sec-desc">レーダーチャートとスコア表で、強み・差分・優先度を一画面で確認できます。</p>
          <div className="result-full">
            <div className="result-full-head">
              <div><span className="result-full-tag">結果サンプル</span><span className="result-full-ttl">16テーマ アセスメント結果</span></div>
              <div className="result-full-score">総合スコア <b>107</b><span>/ 192</span></div>
            </div>
            <div className="result-full-body">
              <div className="result-chart">
                <svg viewBox="0 0 320 300" style={{ width: "100%", height: "auto" }}>
                  <g transform="translate(160,150)">
                    <polygon points="0,-110 78,-78 110,0 78,78 0,110 -78,78 -110,0 -78,-78" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
                    <polygon points="0,-73 52,-52 73,0 52,52 0,73 -52,52 -73,0 -52,-52" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
                    <polygon points="0,-37 26,-26 37,0 26,26 0,37 -26,26 -37,0 -26,-26" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
                    <g stroke="rgba(255,255,255,0.14)" strokeWidth="1">
                      <line x1="0" y1="0" x2="0" y2="-110" /><line x1="0" y1="0" x2="78" y2="-78" /><line x1="0" y1="0" x2="110" y2="0" /><line x1="0" y1="0" x2="78" y2="78" />
                      <line x1="0" y1="0" x2="0" y2="110" /><line x1="0" y1="0" x2="-78" y2="78" /><line x1="0" y1="0" x2="-110" y2="0" /><line x1="0" y1="0" x2="-78" y2="-78" />
                    </g>
                    <polygon points="0,-58 40,-40 62,0 44,44 0,55 -46,46 -60,0 -42,-42" fill="rgba(240,166,62,0.15)" stroke="#f0a63e" strokeWidth="1.5" strokeDasharray="4 3" />
                    <polygon points="0,-88 60,-60 92,0 58,58 0,70 -54,54 -78,0 -50,-50" fill="rgba(62,207,158,0.25)" stroke="#3ecf9e" strokeWidth="2.5" />
                    <g fontSize="8" fill="#9fb2c4" textAnchor="middle" fontFamily="Noto Sans JP">
                      <text x="0" y="-118">収益性</text><text x="92" y="-84">成長性</text><text x="124" y="3">組織</text><text x="92" y="92">意思決定</text>
                      <text x="0" y="126">採用</text><text x="-92" y="92">事業継続</text><text x="-124" y="3">投資</text><text x="-92" y="-84">市場</text>
                    </g>
                  </g>
                </svg>
                <div className="result-legend">
                  <span><i style={{ background: "#3ecf9e" }} />社長のスコア</span>
                  <span><i style={{ background: "#f0a63e", borderStyle: "dashed" }} />受検者平均</span>
                </div>
              </div>
              <div className="result-scores">
                <div className="score-row"><span className="score-label">収益性</span><div className="score-bar"><div className="score-fill" style={{ width: "75%", background: "var(--high)" }} /></div><span className="score-val" style={{ color: "var(--high)" }}>9</span></div>
                <div className="score-row"><span className="score-label">成長性</span><div className="score-bar"><div className="score-fill" style={{ width: "58%", background: "var(--mid)" }} /></div><span className="score-val" style={{ color: "var(--mid)" }}>7</span></div>
                <div className="score-row"><span className="score-label">組織機能</span><div className="score-bar"><div className="score-fill" style={{ width: "67%", background: "var(--high)" }} /></div><span className="score-val" style={{ color: "var(--high)" }}>8</span></div>
                <div className="score-row"><span className="score-label">意思決定力</span><div className="score-bar"><div className="score-fill" style={{ width: "67%", background: "var(--high)" }} /></div><span className="score-val" style={{ color: "var(--high)" }}>8</span></div>
                <div className="score-row"><span className="score-label">経営体制構築力</span><div className="score-bar"><div className="score-fill" style={{ width: "42%", background: "var(--low)" }} /></div><span className="score-val" style={{ color: "var(--low)" }}>5</span></div>
                <div className="score-row"><span className="score-label">事業継続性</span><div className="score-bar"><div className="score-fill" style={{ width: "50%", background: "var(--mid)" }} /></div><span className="score-val" style={{ color: "var(--mid)" }}>6</span></div>
                <div className="score-row"><span className="score-label">内部投資</span><div className="score-bar"><div className="score-fill" style={{ width: "42%", background: "var(--low)" }} /></div><span className="score-val" style={{ color: "var(--low)" }}>5</span></div>
                <div className="score-row"><span className="score-label">市場性</span><div className="score-bar"><div className="score-fill" style={{ width: "58%", background: "var(--mid)" }} /></div><span className="score-val" style={{ color: "var(--mid)" }}>7</span></div>
              </div>
            </div>
            <p className="result-full-note">レーダーチャートで、社長のスコア・成長企業の目安・過去受検者平均を重ねて表示。感覚ではなく、相対的な位置づけで経営を捉えられます。<br />社長カルテ Grande では、業種別・規模別・近しい社長タイプとの比較も可能です。</p>
          </div>
        </div>
      </section>

      <section className="sec bg">
        <div className="sec-in">
          <div className="eyebrow">FAQ</div>
          <h2 className="sec-ttl">よくある質問</h2>
          <div className="faq">
            <div className="faq-item"><div className="faq-q">できていないことを、ダメ出しされるのですか？</div><div className="faq-a">いいえ。社長カルテは、スコアの良し悪しを評価するものではありません。あくまで「いま優先すべきテーマ」を相対的に明らかにするための診断です。スコアは、伸びしろの発見にすぎません。</div></div>
            <div className="faq-item"><div className="faq-q">相対比較とは、何との比較ですか？どこまで信用できますか？</div><div className="faq-a">社長カルテが有する過去の診断者データ（業種・規模別）との比較です。診断や設問ロジックには、およそ800名分の成長企業の経営者の声を採用・体系化しております。</div></div>
            <div className="faq-item"><div className="faq-q">本当に無料ですか？</div><div className="faq-a">WEB診断は完全無料・登録不要です。より深く、詳細な分析をする場合には、別途「社長カルテ詳細版」がございます。</div></div>
            <div className="faq-item"><div className="faq-q">社長以外でも受検は可能ですか？</div><div className="faq-a">可能です。ただし経営者専用の設問が中心となりますので、精度の高い結果をお返しするのが難しい場合がございます。</div></div>
            <div className="faq-item"><div className="faq-q">忙しくて時間がとれないのですが、どれくらいかかりますか？</div><div className="faq-a">診断自体は選択式のため、5分程度で完了します。また、途中保存も可能です。</div></div>
            <div className="faq-item"><div className="faq-q">自分の顧客や知り合いに紹介したいのですが、大丈夫ですか？</div><div className="faq-a">はい、可能です。ご自身のビジネスに活用したいという場合は、<a href="#partner" style={{ color: "var(--mint-deep)", fontWeight: 700 }}>社長カルテ Partners</a> もあわせてご覧ください。</div></div>
          </div>
        </div>
      </section>

      <section className="sec navy" id="partner">
        <div className="sec-in">
          <div className="eyebrow">FOR PARTNERS</div>
          <p className="partner-target">経営コンサルタント・士業・経営支援者の方へ。</p>
          <h2 className="sec-ttl">社長カルテを、経営者との対話のきっかけにしませんか？</h2>
          <p className="sec-desc">過去に接点を持った顧客・経営者との、自然な対話が生まれます。</p>
          <div className="partner-grid">
            {partnerItems.map((item) => (
              <div className="partner-card" key={item.title}>
                <div className="partner-h">{item.title}</div>
                <div className="partner-p">{item.body}</div>
              </div>
            ))}
          </div>
          <div className="partner-cta">
            <Link href="/partners.html" className="kv-cta">支援者向けプランを見る</Link>
          </div>
        </div>
      </section>

      <section className="sec final">
        <div className="sec-in">
          <div className="eyebrow">START ASSESSMENT</div>
          <h2 className="sec-ttl">まず5分、経営の現在地を整理しましょう</h2>
          <p className="sec-desc">迷っている論点が、受けてみると驚くほど整理されます。支援先へ案内する前の確認用としてもどうぞ。</p>
          <PrimaryCta />
          <p className="kv-note">診断はわずか5分 ／ 登録不要</p>
        </div>
      </section>

      <footer className="foot">© Two Rails ／ 社長カルテ Light</footer>
    </main>
  );
}
