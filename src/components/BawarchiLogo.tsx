import React from 'react';

interface BawarchiLogoProps {
  className?: string;
  style?: React.CSSProperties;
  variant?: 'badge' | 'compact' | 'header';
}

export const BawarchiLogo: React.FC<BawarchiLogoProps> = ({
  className = 'h-16 w-auto',
  style,
  variant = 'badge',
}) => {
  return (
    <div
      className={`inline-flex items-center shrink-0 select-none ${className}`}
      style={style}
      title="Bawarchi The Catering"
    >
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto drop-shadow-md"
        style={{ aspectRatio: '1/1' }}
      >
        <defs>
          {/* Saffron background gradient matching original artwork */}
          <linearGradient id="bgWarmSaffron" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9B872" />
            <stop offset="50%" stopColor="#F6AF65" />
            <stop offset="100%" stopColor="#F4A556" />
          </linearGradient>

          {/* Pot woodcut pattern */}
          <linearGradient id="potGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#301509" />
            <stop offset="50%" stopColor="#220D04" />
            <stop offset="100%" stopColor="#170802" />
          </linearGradient>

          {/* Hat subtle shading */}
          <linearGradient id="hatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF2DC" />
            <stop offset="100%" stopColor="#FBE0BD" />
          </linearGradient>

          {/* Orange accent drop filter */}
          <filter id="bawarchiShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="2.5" dy="3.5" stdDeviation="0" floodColor="#E64A19" floodOpacity="0.95" />
          </filter>
        </defs>

        {/* 1. Warm Saffron Canvas */}
        <rect width="500" height="500" rx="16" fill="url(#bgWarmSaffron)" />

        {/* 2. Outer Ornate Border with Corner Florets */}
        <rect
          x="16"
          y="16"
          width="468"
          height="468"
          rx="10"
          fill="none"
          stroke="#261006"
          strokeWidth="3.5"
        />
        <rect
          x="23"
          y="23"
          width="454"
          height="454"
          rx="6"
          fill="none"
          stroke="#E64A19"
          strokeWidth="1.5"
        />

        {/* Top & Bottom Center Border Florets */}
        <g fill="#E64A19">
          {/* Top floret */}
          <circle cx="250" cy="20" r="3" />
          <path d="M250,13 C248,16 248,18 250,20 C252,18 252,16 250,13 Z" />
          <path d="M250,27 C248,24 248,22 250,20 C252,22 252,24 250,27 Z" />
          <path d="M243,20 C246,18 248,18 250,20 C248,22 246,22 243,20 Z" />
          <path d="M257,20 C254,18 252,18 250,20 C252,22 254,22 257,20 Z" />
          {/* Bottom floret */}
          <circle cx="250" cy="480" r="3" />
          <path d="M250,473 C248,476 248,478 250,480 C252,478 252,476 250,473 Z" />
          <path d="M250,487 C248,484 248,482 250,480 C252,482 252,484 250,487 Z" />
          <path d="M243,480 C246,478 248,478 250,480 C248,482 246,482 243,480 Z" />
          <path d="M257,480 C254,478 252,478 250,480 C252,482 254,482 257,480 Z" />
        </g>

        {/* 4 Corner Botanical Flourishes */}
        {/* Top-Left */}
        <g transform="translate(48, 48)">
          <path d="M-12,-12 C-6,-2 -2,-6 -12,-12 Z" fill="#261006" />
          <path d="M12,-12 C6,-2 2,-6 12,-12 Z" fill="#261006" />
          <path d="M-12,12 C-6,2 -2,6 -12,12 Z" fill="#261006" />
          <path d="M12,12 C6,2 2,6 12,12 Z" fill="#261006" />
          <circle cx="0" cy="0" r="3" fill="#E64A19" />
          <circle cx="-16" cy="0" r="2" fill="#E64A19" />
          <circle cx="16" cy="0" r="2" fill="#E64A19" />
          <circle cx="0" cy="-16" r="2" fill="#E64A19" />
          <circle cx="0" cy="16" r="2" fill="#E64A19" />
        </g>
        {/* Top-Right */}
        <g transform="translate(452, 48)">
          <path d="M-12,-12 C-6,-2 -2,-6 -12,-12 Z" fill="#261006" />
          <path d="M12,-12 C6,-2 2,-6 12,-12 Z" fill="#261006" />
          <path d="M-12,12 C-6,2 -2,6 -12,12 Z" fill="#261006" />
          <path d="M12,12 C6,2 2,6 12,12 Z" fill="#261006" />
          <circle cx="0" cy="0" r="3" fill="#E64A19" />
          <circle cx="-16" cy="0" r="2" fill="#E64A19" />
          <circle cx="16" cy="0" r="2" fill="#E64A19" />
          <circle cx="0" cy="-16" r="2" fill="#E64A19" />
          <circle cx="0" cy="16" r="2" fill="#E64A19" />
        </g>
        {/* Bottom-Left */}
        <g transform="translate(48, 452)">
          <path d="M-12,-12 C-6,-2 -2,-6 -12,-12 Z" fill="#261006" />
          <path d="M12,-12 C6,-2 2,-6 12,-12 Z" fill="#261006" />
          <path d="M-12,12 C-6,2 -2,6 -12,12 Z" fill="#261006" />
          <path d="M12,12 C6,2 2,6 12,12 Z" fill="#261006" />
          <circle cx="0" cy="0" r="3" fill="#E64A19" />
          <circle cx="-16" cy="0" r="2" fill="#E64A19" />
          <circle cx="16" cy="0" r="2" fill="#E64A19" />
          <circle cx="0" cy="-16" r="2" fill="#E64A19" />
          <circle cx="0" cy="16" r="2" fill="#E64A19" />
        </g>
        {/* Bottom-Right */}
        <g transform="translate(452, 452)">
          <path d="M-12,-12 C-6,-2 -2,-6 -12,-12 Z" fill="#261006" />
          <path d="M12,-12 C6,-2 2,-6 12,-12 Z" fill="#261006" />
          <path d="M-12,12 C-6,2 -2,6 -12,12 Z" fill="#261006" />
          <path d="M12,12 C6,2 2,6 12,12 Z" fill="#261006" />
          <circle cx="0" cy="0" r="3" fill="#E64A19" />
          <circle cx="-16" cy="0" r="2" fill="#E64A19" />
          <circle cx="16" cy="0" r="2" fill="#E64A19" />
          <circle cx="0" cy="-16" r="2" fill="#E64A19" />
          <circle cx="0" cy="16" r="2" fill="#E64A19" />
        </g>

        {/* 3. The Ornate Mughal Arch Framing */}
        {/* Outer Arch */}
        <path
          d="M102,280 C102,215 130,150 175,118 C202,98 228,88 250,42 C272,88 298,98 325,118 C370,150 398,215 398,280"
          fill="none"
          stroke="#261006"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Inner Arch Accent */}
        <path
          d="M112,275 C112,218 138,158 180,126 C206,106 230,95 250,54 C270,95 294,106 320,126 C362,158 388,218 388,275"
          fill="none"
          stroke="#E64A19"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* 4. Chef Toque Hat */}
        {/* Hat Headband / Brim */}
        <path
          d="M205,145 L295,145 L295,182 Q250,186 205,182 Z"
          fill="url(#hatGrad)"
          stroke="#261006"
          strokeWidth="2.5"
        />
        {/* Brim vertical pleat lines */}
        <path
          d="M214,146 L214,182 M223,146 L223,183 M232,146 L232,184 M241,146 L241,185 M250,146 L250,185 M259,146 L259,185 M268,146 L268,184 M277,146 L277,183 M286,146 L286,182"
          stroke="#261006"
          strokeWidth="1.2"
        />
        {/* Hat Crown / Puffy Billowing Lobes */}
        <path
          d="M206,145 C190,140 172,124 180,102 C188,80 215,82 225,92 C232,74 250,68 266,74 C282,80 286,94 290,92 C302,82 322,88 326,108 C330,128 312,142 295,145 Z"
          fill="url(#hatGrad)"
          stroke="#261006"
          strokeWidth="3"
        />
        {/* Fold lines inside the chef hat lobes */}
        <g stroke="#261006" strokeWidth="1.4" fill="none">
          <path d="M198,110 C206,120 210,132 212,145" />
          <path d="M216,98 C222,112 226,128 226,145" />
          <path d="M238,82 C242,100 244,122 245,145" />
          <path d="M260,82 C259,102 258,124 257,145" />
          <path d="M280,94 C276,110 272,128 272,145" />
          <path d="M304,106 C296,118 290,132 288,145" />
          <path d="M316,120 C310,130 302,138 295,145" />
        </g>

        {/* 5. Handi / Degh (Cooking Pot) */}
        {/* Handi domed lid & knob */}
        <path
          d="M175,188 Q250,168 325,188 L325,198 Q250,206 175,198 Z"
          fill="url(#potGrad)"
          stroke="#261006"
          strokeWidth="2.5"
        />
        {/* Lid knob handle */}
        <ellipse cx="250" cy="172" rx="14" ry="7" fill="url(#potGrad)" stroke="#261006" strokeWidth="2.5" />
        <ellipse cx="250" cy="168" rx="7" ry="4" fill="#E64A19" />

        {/* Pot rim collar */}
        <path
          d="M172,196 Q250,204 328,196 L332,204 Q250,214 168,204 Z"
          fill="url(#potGrad)"
          stroke="#261006"
          strokeWidth="2.5"
        />

        {/* Pot Belly (Curved handi body) */}
        <path
          d="M170,204 C138,222 142,266 182,274 L318,274 C358,266 362,222 330,204 Q250,214 170,204 Z"
          fill="url(#potGrad)"
          stroke="#261006"
          strokeWidth="3.5"
        />

        {/* Pot Base Foot */}
        <path
          d="M192,274 Q250,281 308,274 L304,280 Q250,286 196,280 Z"
          fill="#170802"
          stroke="#261006"
          strokeWidth="2"
        />

        {/* Side Loop Handles */}
        {/* Left handle */}
        <path
          d="M168,206 C144,204 140,224 150,234 C160,242 170,238 174,232"
          fill="none"
          stroke="#261006"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M166,210 C150,208 148,222 154,228 C160,234 168,230 172,226"
          fill="none"
          stroke="url(#bgWarmSaffron)"
          strokeWidth="2"
        />
        {/* Right handle */}
        <path
          d="M332,206 C356,204 360,224 350,234 C340,242 330,238 326,232"
          fill="none"
          stroke="#261006"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M334,210 C350,208 352,222 346,228 C340,234 332,230 328,226"
          fill="none"
          stroke="url(#bgWarmSaffron)"
          strokeWidth="2"
        />

        {/* Woodcut Shading Hatching across Handi Belly */}
        <g stroke="#F6AF65" strokeWidth="1" opacity="0.45" strokeLinecap="round">
          <line x1="185" y1="216" x2="315" y2="216" />
          <line x1="178" y1="223" x2="322" y2="223" />
          <line x1="172" y1="230" x2="218" y2="230" />
          <line x1="282" y1="230" x2="328" y2="230" />
          <line x1="170" y1="240" x2="214" y2="240" />
          <line x1="286" y1="240" x2="330" y2="240" />
          <line x1="175" y1="250" x2="218" y2="250" />
          <line x1="282" y1="250" x2="325" y2="250" />
          <line x1="182" y1="258" x2="318" y2="258" />
          <line x1="192" y1="266" x2="308" y2="266" />
        </g>

        {/* Pot Floral Star Center Emblem & Accent Dots */}
        <g transform="translate(250, 240)">
          {/* Central 6-Petal Star Floral in Terracotta Orange */}
          <path
            d="M0,-16 C-3,-6 -6,-3 -16,0 C-6,3 -3,6 0,16 C3,6 6,3 16,0 C6,-3 3,-6 0,-16 Z"
            fill="#E64A19"
          />
          <path
            d="M-11,-11 C-6,-2 -2,-6 0,0 C-2,6 -6,2 -11,11 C-2,6 2,6 0,0 C2,-6 -2,-6 -11,-11 Z"
            fill="#E64A19"
          />
          <path
            d="M11,-11 C6,-2 2,-6 0,0 C2,6 6,2 11,11 C2,6 -2,6 0,0 C-2,-6 2,-6 11,-11 Z"
            fill="#E64A19"
          />
          <circle cx="0" cy="0" r="3.5" fill="#F8B46C" />
          {/* Flanking accent dots */}
          <circle cx="-36" cy="0" r="3.5" fill="#E64A19" />
          <circle cx="36" cy="0" r="3.5" fill="#E64A19" />
        </g>

        {/* 6. Rising Steam */}
        <path
          d="M326,192 C338,180 342,165 336,150 C330,136 318,130 326,118 C334,106 338,94 332,82"
          fill="none"
          stroke="#E64A19"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M334,188 C344,178 348,168 344,158"
          fill="none"
          stroke="#E64A19"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* 7. Typography: "BAWARCHI" */}
        {/* Orange 3D Drop Extrusion */}
        <text
          x="253"
          y="370"
          textAnchor="middle"
          fill="#E64A19"
          style={{
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: '66px',
            fontWeight: 900,
            letterSpacing: '0.04em',
          }}
        >
          BAWARCHI
        </text>
        {/* Main Woodcut Lettering */}
        <text
          x="250"
          y="366"
          textAnchor="middle"
          fill="#261006"
          style={{
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: '66px',
            fontWeight: 900,
            letterSpacing: '0.04em',
          }}
        >
          BAWARCHI
        </text>

        {/* 8. Ornamental Divider Flourish between Bawarchi and Cartouche */}
        <g transform="translate(250, 392)">
          {/* Center 4-petal flower */}
          <circle cx="0" cy="0" r="2.5" fill="#E64A19" />
          <path d="M0,-8 C-1.5,-4 -1.5,-2 0,0 C1.5,-2 1.5,-4 0,-8 Z" fill="#E64A19" />
          <path d="M0,8 C-1.5,4 -1.5,2 0,0 C1.5,2 1.5,4 0,8 Z" fill="#E64A19" />
          <path d="M-8,0 C-4,-1.5 -2,-1.5 0,0 C-2,1.5 -4,1.5 -8,0 Z" fill="#E64A19" />
          <path d="M8,0 C4,-1.5 2,-1.5 0,0 C2,1.5 4,1.5 8,0 Z" fill="#E64A19" />
          {/* Horizontal flourished wing lines */}
          <line x1="-14" y1="0" x2="-65" y2="0" stroke="#E64A19" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="-67" cy="0" r="1.5" fill="#E64A19" />
          <line x1="14" y1="0" x2="65" y2="0" stroke="#E64A19" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="67" cy="0" r="1.5" fill="#E64A19" />
        </g>

        {/* 9. "THE CATERING" Vintage Plaque / Cartouche */}
        {/* Cartouche Outer Frame with Notched Scalloped Corners */}
        <path
          d="M110,404 L390,404 C394,404 397,406 399,409 L406,419 C408,422 408,426 406,429 L399,439 C397,442 394,444 390,444 L110,444 C106,444 103,442 101,439 L94,429 C92,426 92,422 94,419 L101,409 C103,406 106,404 110,404 Z"
          fill="none"
          stroke="#261006"
          strokeWidth="2.5"
        />
        {/* Cartouche Inner Outline */}
        <path
          d="M114,408 L386,408 C388,408 390,409 392,412 L398,420 C399,422 399,425 398,428 L392,436 C390,439 388,440 386,440 L114,440 C112,440 110,439 108,436 L102,428 C101,425 101,422 102,420 L108,412 C110,409 112,408 114,408 Z"
          fill="none"
          stroke="#261006"
          strokeWidth="1"
        />

        {/* Red Flanking Accent Dots */}
        <circle cx="132" cy="424" r="5" fill="#E64A19" />
        <circle cx="368" cy="424" r="5" fill="#E64A19" />

        {/* Text: THE CATERING */}
        <text
          x="250"
          y="432"
          textAnchor="middle"
          fill="#261006"
          style={{
            fontFamily: "'Trebuchet MS', 'Impact', sans-serif",
            fontSize: '26px',
            fontWeight: 800,
            letterSpacing: '0.22em',
          }}
        >
          THE CATERING
        </text>
      </svg>
    </div>
  );
};
