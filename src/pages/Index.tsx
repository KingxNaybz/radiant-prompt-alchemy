import { useState } from "react";

// ─── COMPLETE STYLE LIBRARY ───────────────────────────────────────────────────

const CATEGORIES = [
  {
    name: "Gold Drip Portraits",
    icon: "✨",
    color: "#c9a84c",
    description: "Luxury gold leaf faces — the #1 bestseller style",
    styles: [
      {
        label: "Gold Drip Woman",
        leonardo: `hyper-realistic close-up portrait of a beautiful woman, face partially covered in dripping liquid gold, teal and copper painterly brushstrokes across the face, dramatic dark background, emotional closed eyes, gold lips, ultra detailed skin texture, cinematic studio lighting, 8K HDR, professional photography`,
        midjourney: `expressive painterly portrait of a woman, dripping gold leaf and teal paint across face, dark dramatic background, copper and gold palette, thick impasto brushstrokes, chiaroscuro lighting, museum quality fine art, canvas texture --ar 2:3 --stylize 900 --v 6.1`,
        modifier: `In app: Add gold drip overlay layer, boost saturation on gold tones, add subtle canvas texture filter, darken edges with vignette`,
      },
      {
        label: "Gold King Portrait",
        leonardo: `hyper-realistic portrait of a powerful Black king, face adorned with dripping gold, regal expression, dark dramatic background, gold crown elements, ultra detailed skin pores, dramatic side lighting, cinematic quality, 8K`,
        midjourney: `powerful Black king portrait, gold dripping down face, crown of liquid gold, dark stormy background, royal purple and gold palette, painterly expressive strokes, chiaroscuro, emotional gravitas --ar 2:3 --stylize 900 --v 6.1`,
        modifier: `In app: Crown glow effect, gold particle overlay, deep shadow burn on edges, regal purple color grade`,
      },
    ],
  },
  {
    name: "Sports Legends",
    icon: "🏆",
    color: "#e84545",
    description: "Athletes at peak emotion — powerful, cinematic, iconic",
    styles: [
      {
        label: "Basketball Legend",
        leonardo: `hyper-realistic portrait of a basketball player mid-dunk, intense determined expression, sweat droplets, team jersey detail, dramatic court lighting, motion blur on arms, ultra detailed muscles, cinematic 8K photography, stadium lights in background`,
        midjourney: `basketball player rising for dunk, explosive paint splatters in team colors, dark dramatic background, motion energy radiating outward, expressive painterly portrait, gold and red palette, powerful emotion --ar 2:3 --stylize 850 --v 6.1`,
        modifier: `In app: Add paint splatter overlay in team colors, motion blur trails, boost contrast, add crowd bokeh background`,
      },
      {
        label: "Boxing Champion",
        leonardo: `hyper-realistic portrait of a boxer in fighting stance, intense battle-worn expression, sweat and determination, gloves raised, dramatic gym lighting with rim light, ultra detailed skin, cinematic composition, 8K HDR`,
        midjourney: `fierce boxer portrait, paint splatters of red and black, determination on face, dark dramatic background, sweat and fire energy, expressive fine art painting, cinematic chiaroscuro --ar 2:3 --stylize 900 --v 6.1`,
        modifier: `In app: Red paint drip overlay, smoke/fire effect at edges, high contrast black and white with red color pop`,
      },
      {
        label: "Football Warrior",
        leonardo: `hyper-realistic portrait of a football player in helmet, fierce warrior expression visible through face mask, dramatic stadium lights, detailed uniform texture, intense emotion, 8K cinematic photography`,
        midjourney: `football player warrior portrait, helmet gleaming, paint explosion in team colors, dark sky background, warrior energy, painterly expressive brushstrokes, powerful and emotional --ar 2:3 --stylize 900 --v 6.1`,
        modifier: `In app: Team color paint burst, lightning effect behind, chrome helmet shine enhancement`,
      },
    ],
  },
  {
    name: "Majestic Animals",
    icon: "🦁",
    color: "#f0a500",
    description: "Powerful wildlife — emotional close-ups that command any room",
    styles: [
      {
        label: "Lion King",
        leonardo: `hyper-realistic extreme close-up of a male African lion face, piercing amber eyes, detailed fur texture, dramatic golden hour side lighting, dust particles in air, raw power and nobility, 8K wildlife photography, shallow depth of field`,
        midjourney: `majestic lion close-up portrait, explosive gold and copper paint splatters, fierce amber eyes, dark dramatic background, thick impasto brushstrokes, painterly fine art, regal and powerful emotion --ar 2:3 --stylize 950 --v 6.1`,
        modifier: `In app: Gold mane glow, paint splatter overlay in amber tones, deep vignette, fur texture enhancement`,
      },
      {
        label: "Wolf Spirit",
        leonardo: `hyper-realistic wolf portrait, intense yellow eyes piercing the darkness, detailed grey and white fur, dramatic low-key lighting, winter breath mist, raw and wild energy, 8K nature photography`,
        midjourney: `lone wolf portrait, deep blue and silver paint splatter, piercing yellow eyes, dark midnight background, snow and ice energy, expressive painterly brushstrokes, haunting and powerful --ar 2:3 --stylize 900 --v 6.1`,
        modifier: `In app: Blue moonlight glow, snow particle overlay, silver paint splatter effect, cold color grade`,
      },
      {
        label: "Eagle Freedom",
        leonardo: `hyper-realistic bald eagle portrait, piercing yellow eyes, dramatic spread wings implied, detailed white and brown feathers, dramatic sky lighting, patriotic power, 8K wildlife photography`,
        midjourney: `bald eagle portrait, red white and blue paint explosion, fierce piercing eyes, dramatic sky background, freedom and power energy, painterly patriotic fine art, bold American spirit --ar 2:3 --stylize 900 --v 6.1`,
        modifier: `In app: Patriotic color overlay, wind effect on feathers, dramatic sky composite`,
      },
    ],
  },
  {
    name: "African Art & Culture",
    icon: "🌍",
    color: "#c0392b",
    description: "Bold, cultural, deeply meaningful — strong seller",
    styles: [
      {
        label: "African Queen",
        leonardo: `hyper-realistic portrait of a stunning African queen, traditional beaded jewelry, head wrap in vibrant patterns, radiant dark skin with golden highlights, regal expression, dramatic studio lighting, ultra detailed fabric texture, 8K`,
        midjourney: `African queen portrait, rich warm earth tones, golden crown and jewelry, vibrant kente patterns, powerful regal expression, painterly expressive brushstrokes, black and gold palette, cultural pride --ar 2:3 --stylize 900 --v 6.1`,
        modifier: `In app: Golden jewelry glow, kente pattern overlay, warm amber color grade, tribal pattern frame`,
      },
      {
        label: "African Warrior",
        leonardo: `hyper-realistic portrait of an African warrior, traditional face paint, spear implied, intense battle-ready expression, dramatic lighting, traditional beads and cloth, powerful muscular build, 8K cinematic`,
        midjourney: `African warrior portrait, red and black face paint, tribal patterns, explosive paint splatters, dark dramatic sky, strength and pride, painterly expressive fine art, deep emotional power --ar 2:3 --stylize 900 --v 6.1`,
        modifier: `In app: War paint color enhancement, paint burst overlay, earth tone color grade, tribal border design`,
      },
    ],
  },
  {
    name: "Royalty & Black Excellence",
    icon: "👑",
    color: "#8e44ad",
    description: "Empowering portraits celebrating beauty, strength & identity",
    styles: [
      {
        label: "Black Queen",
        leonardo: `hyper-realistic portrait of a beautiful Black woman, crown of gold flowers and jewels, elegant makeup, radiant glowing skin, dark dramatic background, luxury fabric, ultra detailed features, cinematic 8K lighting`,
        midjourney: `Black queen portrait, golden crown dripping jewels, purple and gold palette, painterly regal composition, dark luxurious background, powerful and beautiful, emotional fine art --ar 2:3 --stylize 900 --v 6.1`,
        modifier: `In app: Crown sparkle effect, gold drip overlay, purple royal color grade, floral border elements`,
      },
      {
        label: "Golden Petals Woman",
        leonardo: `hyper-realistic portrait of a Black woman surrounded by golden flowers, petals floating around face, soft ethereal lighting, floral crown, radiant skin with golden shimmer, dreamy cinematic quality, 8K`,
        midjourney: `Black woman portrait surrounded by gold flowers, petals dripping down canvas, warm gold and coral palette, painterly dreamy composition, lush and feminine, emotional beauty --ar 2:3 --stylize 850 --v 6.1`,
        modifier: `In app: Floating petal particle overlay, golden light leak, warm bloom filter, soft vignette`,
      },
    ],
  },
  {
    name: "Spiritual & Motivational",
    icon: "🧘",
    color: "#27ae60",
    description: "Zen, purpose, and power — inspires every room",
    styles: [
      {
        label: "Golden Buddha",
        leonardo: `hyper-realistic golden Buddha portrait, serene expression, intricate gold details, soft ethereal glow, dark peaceful background, sacred geometry implied, meditative energy, ultra detailed, 8K cinematic lighting`,
        midjourney: `golden Buddha portrait, radiant sacred light, deep teal and gold palette, painterly spiritual composition, peaceful and powerful, divine energy radiating, fine art canvas quality --ar 2:3 --stylize 850 --v 6.1`,
        modifier: `In app: Sacred geometry overlay, golden light rays, lotus particle effect, deep meditation atmosphere`,
      },
      {
        label: "Rising Champion",
        leonardo: `hyper-realistic portrait of a person rising with arms raised in triumph, dramatic backlight creating silhouette, intense emotional victory expression, sweat and tears of joy, cinematic 8K stadium lighting`,
        midjourney: `triumphant figure rising, paint explosion of gold and white, arms raised to sky, dark dramatic background, victory and power energy, painterly expressive brushstrokes, deeply emotional --ar 2:3 --stylize 900 --v 6.1`,
        modifier: `In app: Light burst from behind, gold confetti particle overlay, epic sky composite, color grade warm gold`,
      },
    ],
  },
  {
    name: "Dark Fantasy & Mystery",
    icon: "🌑",
    color: "#2c3e50",
    description: "Mystical, haunting, otherworldly — conversation starter pieces",
    styles: [
      {
        label: "Dark Goddess",
        leonardo: `hyper-realistic portrait of a mysterious dark goddess, ethereal glowing eyes, flowing dark hair with stars embedded, dramatic dark atmosphere, otherworldly beauty, mystical symbols, cinematic 8K lighting`,
        midjourney: `dark goddess portrait, deep purple and midnight blue palette, stars and cosmic energy, painterly mystical composition, haunting beauty, ethereal glow, fine art canvas quality --ar 2:3 --stylize 950 --v 6.1`,
        modifier: `In app: Star particle overlay, cosmic glow effect, deep purple color grade, mystical fog at edges`,
      },
      {
        label: "Samurai Spirit",
        leonardo: `hyper-realistic portrait of a Japanese samurai, detailed armor and helmet, intense warrior gaze, dramatic rain and mist, cherry blossoms falling, cinematic 8K historical portrait`,
        midjourney: `samurai warrior portrait, red and black palette, cherry blossoms falling, rain and mist, intense warrior expression, painterly Japanese fine art, deep honor and duty emotion --ar 2:3 --stylize 900 --v 6.1`,
        modifier: `In app: Rain drop overlay, falling cherry blossom particles, red mist effect, cinematic letterbox`,
      },
    ],
  },
  {
    name: "Luxury & Abstract",
    icon: "💛",
    color: "#d4ac0d",
    description: "High-end metallic and geometric art — perfect for modern interiors",
    styles: [
      {
        label: "Black & Gold Abstract",
        leonardo: `hyper-realistic abstract composition, flowing liquid gold on deep matte black surface, metallic textures, geometric shapes emerging, luxury aesthetic, macro detail of gold pours, cinematic lighting, 8K`,
        midjourney: `abstract luxury composition, liquid gold flowing on black canvas, geometric shapes, metallic textures, high-end sophisticated, painterly abstract fine art, black gold silver palette --ar 2:3 --stylize 900 --v 6.1`,
        modifier: `In app: Gold shimmer animation, metallic gloss overlay, geometric line elements, luxury frame design`,
      },
      {
        label: "Charcoal & Gold",
        leonardo: `hyper-realistic abstract charcoal and gold composition, sweeping brushstrokes implied, deep grey and warm gold tones, modern minimalist luxury, textured surface, elegant geometric balance, 8K art photography`,
        midjourney: `abstract charcoal and gold painting, sweeping expressive marks, warm gold accents on deep grey, minimalist luxury aesthetic, painterly sophisticated composition --ar 2:3 --stylize 800 --v 6.1`,
        modifier: `In app: Gold leaf texture overlay, subtle canvas grain, warm gold color grade, modern frame mockup`,
      },
    ],
  },
  {
    name: "Nature & Ocean",
    icon: "🌊",
    color: "#2980b9",
    description: "Dramatic nature scenes — calming yet powerful",
    styles: [
      {
        label: "Crashing Wave",
        leonardo: `hyper-realistic dramatic ocean wave, towering wall of water crashing, deep teal and turquoise colors, golden sunrise light cutting through the wave, sea foam spray, raw power of nature, ultra detailed water texture, 8K photography`,
        midjourney: `dramatic ocean wave crashing, deep teal and gold palette, raw power of nature, painterly expressive brushstrokes, water spray and mist, cinematic fine art canvas --ar 2:3 --stylize 900 --v 6.1`,
        modifier: `In app: Water splash particle overlay, teal color grade, light ray through wave, mist fog effect`,
      },
      {
        label: "Cherry Blossom Zen",
        leonardo: `hyper-realistic Japanese cherry blossom scene, soft pink petals falling, Mount Fuji in background, golden hour light, serene and peaceful, ultra detailed flower texture, 8K nature photography`,
        midjourney: `Japanese cherry blossom landscape, soft pink and white petals, Mount Fuji distant, golden light, painterly zen composition, peaceful and beautiful fine art --ar 2:3 --stylize 800 --v 6.1`,
        modifier: `In app: Falling petal particles, warm golden filter, soft focus depth effect, Japanese border elements`,
      },
    ],
  },
  {
    name: "Multi-Panel Sets",
    icon: "🖼️",
    color: "#16a085",
    description: "5-piece canvas sets — highest price point, living room statement",
    styles: [
      {
        label: "5-Panel Lion",
        leonardo: `hyper-realistic lion face split across 5 panels concept, extreme close up, fierce amber eyes centered, detailed mane spanning panels, dramatic dark background, epic wildlife photography, 8K ultra wide`,
        midjourney: `majestic lion face ultra wide panoramic, centered fierce eyes, gold and dark palette, dramatic lighting, painterly expressive fine art, designed for 5 panel split canvas --ar 16:3 --stylize 900 --v 6.1`,
        modifier: `In app: Split into 5 equal panels with slight gap, add panel border effect, ensure eyes centered on middle panel`,
      },
      {
        label: "5-Panel Abstract City",
        leonardo: `hyper-realistic abstract cityscape panoramic, dramatic golden city lights, dark skyline, motion blur streaks, luxury urban energy, ultra wide composition, 8K cinematography`,
        midjourney: `abstract luxury cityscape panoramic, gold and black palette, city lights bokeh, painterly expressive urban art, wide dramatic composition for 5 panel canvas --ar 16:3 --stylize 850 --v 6.1`,
        modifier: `In app: Split into 5 panels, light streak overlay, gold city glow, deep night atmosphere`,
      },
    ],
  },
];

const SIZES = [
  { label: '12×16"', sub: "Small", ar: "2:3", price: "$45–80" },
  { label: '18×24"', sub: "Medium", ar: "3:4", price: "$80–120" },
  { label: '24×36"', sub: "Large", ar: "2:3", price: "$120–180" },
  { label: '30×40"', sub: "XL", ar: "3:4", price: "$160–220" },
  { label: '40×60"', sub: "Statement", ar: "2:3", price: "$220–300" },
  { label: '24×24"', sub: "Square", ar: "1:1", price: "$100–150" },
  { label: "5-Panel Set", sub: "Living Room", ar: "16:3", price: "$280–400" },
];

const TOOLS = ["Leonardo AI", "Midjourney"];

export default function Index() {
  const [activeCat, setActiveCat] = useState(0);
  const [activeStyle, setActiveStyle] = useState(0);
  const [activeSize, setActiveSize] = useState(2);
  const [activeTool, setActiveTool] = useState(0);
  const [customSubject, setCustomSubject] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"browse" | "custom">("browse");

  const cat = CATEGORIES[activeCat];
  const style = cat.styles[activeStyle];
  const size = SIZES[activeSize];

  const buildPrompt = () => {
    const base = activeTool === 0 ? style.leonardo : style.midjourney;
    if (customSubject) {
      return activeTool === 0
        ? `hyper-realistic ${customSubject}, dramatic cinematic lighting, ultra detailed, 8K HDR, professional fine art photography, canvas print quality, emotionally powerful composition`
        : `${customSubject}, expressive painterly fine art, thick impasto brushstrokes, dramatic chiaroscuro lighting, museum quality canvas, deeply emotional, Michael Naybz style --ar ${size.ar} --stylize 900 --v 6.1`;
    }
    return base;
  };

  const prompt = buildPrompt();

  const copy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080808",
        color: "#f0e6d3",
        fontFamily: "'Georgia', serif",
      }}
    >
      {/* TOP HEADER */}
      <div
        style={{
          background: "linear-gradient(180deg, #111 0%, #080808 100%)",
          borderBottom: "1px solid #c9a84c33",
          padding: "24px 20px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "10px", letterSpacing: "6px", color: "#c9a84c88", marginBottom: "6px" }}>
          FULL PROMPT STUDIO
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px, 6vw, 52px)",
            fontStyle: "italic",
            background: "linear-gradient(135deg, #c9a84c, #fff8e7, #a07830)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "3px",
          }}
        >
          Michael Naybz
        </h1>
        <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#c9a84c66", marginTop: "4px" }}>
          AI MASTER PAINTER · LEONARDO & MIDJOURNEY
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 16px 60px" }}>
        {/* TABS */}
        <div
          style={{
            display: "flex",
            gap: "0",
            marginBottom: "24px",
            borderRadius: "6px",
            overflow: "hidden",
            border: "1px solid #c9a84c33",
          }}
        >
          {["Browse Styles", "Custom Subject"].map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i === 0 ? "browse" : "custom")}
              style={{
                flex: 1,
                padding: "12px",
                border: "none",
                cursor: "pointer",
                background:
                  (tab === "browse" && i === 0) || (tab === "custom" && i === 1) ? "#c9a84c" : "#111",
                color:
                  (tab === "browse" && i === 0) || (tab === "custom" && i === 1) ? "#000" : "#c9a84c88",
                fontSize: "12px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                fontFamily: "Georgia, serif",
                fontWeight: "bold",
                transition: "all 0.2s",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "custom" && (
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                fontSize: "11px",
                letterSpacing: "4px",
                color: "#c9a84c",
                display: "block",
                marginBottom: "10px",
              }}
            >
              TELL MICHAEL WHAT TO PAINT
            </label>
            <textarea
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="e.g. Kobe Bryant in his final game, a phoenix rising from flames, a Black woman with galaxy in her hair, a Spartan warrior at sunset..."
              style={{
                width: "100%",
                minHeight: "100px",
                background: "#111",
                border: "1px solid #c9a84c44",
                borderRadius: "4px",
                color: "#f0e6d3",
                fontSize: "15px",
                padding: "14px",
                fontFamily: "Georgia, serif",
                lineHeight: "1.7",
                resize: "vertical",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>
        )}

        {tab === "browse" && (
          <>
            {/* CATEGORY GRID */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#c9a84c", marginBottom: "12px" }}>
                01 — SELECT CATEGORY
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: "8px",
                }}
              >
                {CATEGORIES.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveCat(i);
                      setActiveStyle(0);
                    }}
                    style={{
                      padding: "10px 8px",
                      border: `1px solid ${i === activeCat ? c.color : "#ffffff15"}`,
                      borderRadius: "4px",
                      background: i === activeCat ? `${c.color}22` : "#ffffff05",
                      color: i === activeCat ? c.color : "#d4b896",
                      cursor: "pointer",
                      fontSize: "12px",
                      textAlign: "left",
                      fontFamily: "Georgia, serif",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontSize: "18px", marginBottom: "4px" }}>{c.icon}</div>
                    <div style={{ fontSize: "11px", lineHeight: "1.3" }}>{c.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* STYLE SELECTOR */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#c9a84c", marginBottom: "12px" }}>
                02 — SELECT STYLE
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {cat.styles.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStyle(i)}
                    style={{
                      padding: "10px 16px",
                      border: `1px solid ${i === activeStyle ? cat.color : "#ffffff15"}`,
                      borderRadius: "4px",
                      background: i === activeStyle ? `${cat.color}33` : "#ffffff05",
                      color: i === activeStyle ? cat.color : "#d4b896",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontFamily: "Georgia, serif",
                      transition: "all 0.2s",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#ffffff44", fontStyle: "italic" }}>
                {cat.description}
              </div>
            </div>
          </>
        )}

        {/* AI TOOL SELECTOR */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#c9a84c", marginBottom: "12px" }}>
            {tab === "browse" ? "03" : "02"} — AI TOOL
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {TOOLS.map((t, i) => (
              <button
                key={t}
                onClick={() => setActiveTool(i)}
                style={{
                  padding: "10px 20px",
                  border: `1px solid ${i === activeTool ? "#c9a84c" : "#ffffff15"}`,
                  borderRadius: "4px",
                  background: i === activeTool ? "linear-gradient(135deg, #c9a84c22, #c9a84c44)" : "#ffffff05",
                  color: i === activeTool ? "#c9a84c" : "#d4b896",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontFamily: "Georgia, serif",
                  transition: "all 0.2s",
                }}
              >
                {i === 0 ? "🎯 " : "🎨 "}
                {t}
                <div
                  style={{
                    fontSize: "10px",
                    color: i === activeTool ? "#c9a84c88" : "#ffffff33",
                    marginTop: "2px",
                  }}
                >
                  {i === 0 ? "Hyper-Real Base" : "Painterly Finish"}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* SIZE SELECTOR */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#c9a84c", marginBottom: "12px" }}>
            {tab === "browse" ? "04" : "03"} — CANVAS SIZE
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {SIZES.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveSize(i)}
                style={{
                  padding: "8px 14px",
                  border: `1px solid ${i === activeSize ? "#c9a84c" : "#ffffff15"}`,
                  borderRadius: "4px",
                  background: i === activeSize ? "linear-gradient(135deg, #c9a84c, #a07830)" : "#ffffff05",
                  color: i === activeSize ? "#000" : "#d4b896",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontFamily: "Georgia, serif",
                  fontWeight: i === activeSize ? "bold" : "normal",
                  transition: "all 0.2s",
                  textAlign: "center",
                }}
              >
                <div>{s.label}</div>
                <div style={{ fontSize: "10px", opacity: 0.7 }}>{s.sub}</div>
                <div style={{ fontSize: "10px", color: i === activeSize ? "#333" : "#c9a84c66" }}>{s.price}</div>
              </button>
            ))}
          </div>
        </div>

        {/* GENERATED PROMPT */}
        <div
          style={{
            background: "linear-gradient(135deg, #0d0d0d, #1a1200)",
            border: "1px solid #c9a84c55",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "0 0 40px #c9a84c11",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#c9a84c" }}>
              ✦ {activeTool === 0 ? "LEONARDO AI" : "MIDJOURNEY"} PROMPT
            </div>
            <div style={{ fontSize: "11px", color: "#c9a84c66" }}>
              Canvas: {size.label} · Sell for {size.price}
            </div>
          </div>
          <div
            style={{
              fontSize: "13px",
              lineHeight: "1.9",
              color: "#f0e6d3",
              background: "#ffffff05",
              borderRadius: "4px",
              padding: "16px",
              border: "1px solid #ffffff10",
              fontFamily: "monospace",
              wordBreak: "break-word",
              minHeight: "80px",
            }}
          >
            {prompt}
          </div>

          {/* App Modifier */}
          {tab === "browse" && style.modifier && (
            <div
              style={{
                marginTop: "14px",
                padding: "14px",
                background: "#c9a84c0a",
                borderRadius: "4px",
                border: "1px solid #c9a84c22",
              }}
            >
              <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#c9a84c", marginBottom: "6px" }}>
                🖌️ APP MODIFICATION (make it unique)
              </div>
              <div style={{ fontSize: "12px", color: "#d4b896", lineHeight: "1.7" }}>{style.modifier}</div>
            </div>
          )}

          <button
            onClick={copy}
            style={{
              marginTop: "16px",
              padding: "12px 24px",
              background: copied ? "#1a4d1a" : "linear-gradient(135deg, #c9a84c, #a07830)",
              border: "none",
              borderRadius: "4px",
              color: copied ? "#7fff7f" : "#000",
              cursor: "pointer",
              fontSize: "12px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              fontFamily: "Georgia, serif",
              fontWeight: "bold",
              transition: "all 0.3s",
            }}
          >
            {copied ? "✓ COPIED!" : "COPY PROMPT"}
          </button>
        </div>

        {/* WORKFLOW GUIDE */}
        <div
          style={{
            marginTop: "24px",
            padding: "20px",
            background: "#ffffff05",
            borderRadius: "6px",
            border: "1px solid #ffffff0f",
          }}
        >
          <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#c9a84c", marginBottom: "14px" }}>
            ✦ MICHAEL NAYBZ WORKFLOW
          </div>
          {(
            [
              ["🎯", "STEP 1 — Generate Base", "Use Leonardo AI prompt for hyper-realistic base image"],
              ["🎨", "STEP 2 — Paint It", "Run through Midjourney OR use Leonardo's Canvas Editor to add painterly effects"],
              ["✏️", "STEP 3 — Make It Unique", "Apply the app modifications above — overlays, color grades, textures"],
              ["📐", "STEP 4 — Upscale", "Use Topaz Gigapixel AI or Adobe Firefly to upscale to print resolution"],
              ["🖼️", "STEP 5 — Fulfill", "Upload to Printful/Gelato — they print & ship to your customer automatically"],
            ] as const
          ).map(([icon, title, desc]) => (
            <div key={title} style={{ display: "flex", gap: "14px", marginBottom: "12px", alignItems: "flex-start" }}>
              <div style={{ fontSize: "20px", flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontSize: "11px", letterSpacing: "2px", color: "#c9a84c", marginBottom: "2px" }}>
                  {title}
                </div>
                <div style={{ fontSize: "13px", color: "#d4b896" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* SIGNATURE */}
        <div style={{ textAlign: "center", marginTop: "40px", opacity: 0.4 }}>
          <div style={{ fontSize: "22px", fontStyle: "italic", color: "#c9a84c", letterSpacing: "2px" }}>
            Michael Naybz
          </div>
          <div style={{ fontSize: "10px", letterSpacing: "4px", color: "#fff", marginTop: "4px" }}>
            ART THAT MOVES THE SOUL
          </div>
        </div>
      </div>
    </div>
  );
}
