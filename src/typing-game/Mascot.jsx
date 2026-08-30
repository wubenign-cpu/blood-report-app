import "./Mascot.css";

// 실제 이미지가 없을 때 코드로 그리는 캐릭터입니다.
// shape로 몸의 형태를 결정합니다: round(동글이) / acorn(도토리, 밤토리) / tail(다람쥐, 꼬리) / mushroom(버섯, 송이)
function RoundBody({ color }) {
  return (
    <g>
      <circle cx="30" cy="32" r="9" fill={color} />
      <circle cx="70" cy="32" r="9" fill={color} />
      <circle cx="50" cy="58" r="34" fill={color} />
    </g>
  );
}

function AcornBody({ color, accent }) {
  return (
    <g>
      <rect x="46" y="6" width="8" height="10" rx="3" fill={accent} />
      <path
        d="M50 12 L60 32 C76 37 85 51 85 65 C85 82 69 93 50 93 C31 93 15 82 15 65 C15 51 24 37 40 32 Z"
        fill={color}
      />
      <path
        d="M38 33 Q50 21 62 33"
        fill="none"
        stroke={accent}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </g>
  );
}

function TailBody({ color, accent }) {
  return (
    <g>
      <path
        d="M66 55 C90 45 92 75 78 82 C68 87 58 78 62 66 Z"
        fill={accent}
      />
      <polygon points="26,22 34,34 18,34" fill={color} />
      <polygon points="74,22 82,34 66,34" fill={color} />
      <circle cx="46" cy="58" r="30" fill={color} />
    </g>
  );
}

function MushroomBody({ color, accent }) {
  return (
    <g>
      <rect x="36" y="56" width="28" height="34" rx="12" fill="#FFF6E9" />
      <path d="M12 56 A38 32 0 0 1 88 56 Z" fill={color} />
      <circle cx="30" cy="42" r="5" fill={accent} />
      <circle cx="50" cy="30" r="6" fill={accent} />
      <circle cx="70" cy="42" r="5" fill={accent} />
    </g>
  );
}

function Face({ expression, faceY = 60 }) {
  if (expression === "happy" || expression === "proud") {
    return (
      <g>
        <path
          d={`M35 ${faceY - 4} Q40 ${faceY - 12} 45 ${faceY - 4}`}
          fill="none"
          stroke="#2b2b2b"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d={`M55 ${faceY - 4} Q60 ${faceY - 12} 65 ${faceY - 4}`}
          fill="none"
          stroke="#2b2b2b"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d={`M36 ${faceY + 6} Q50 ${faceY + 20} 64 ${faceY + 6}`}
          fill="none"
          stroke="#2b2b2b"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <ellipse cx="28" cy={faceY + 10} rx="6" ry="4" fill="#FF9FBF" opacity="0.7" />
        <ellipse cx="72" cy={faceY + 10} rx="6" ry="4" fill="#FF9FBF" opacity="0.7" />
      </g>
    );
  }

  if (expression === "sad") {
    return (
      <g>
        <circle cx="40" cy={faceY} r="4.5" fill="#2b2b2b" />
        <circle cx="60" cy={faceY} r="4.5" fill="#2b2b2b" />
        <path
          d={`M36 ${faceY + 16} Q50 ${faceY + 6} 64 ${faceY + 16}`}
          fill="none"
          stroke="#2b2b2b"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d={`M62 ${faceY + 4} q4 6 0 11`}
          fill="none"
          stroke="#5B9BFF"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    );
  }

  return (
    <g>
      <circle cx="40" cy={faceY} r="4.5" fill="#2b2b2b" />
      <circle cx="60" cy={faceY} r="4.5" fill="#2b2b2b" />
      <path
        d={`M40 ${faceY + 10} Q50 ${faceY + 16} 60 ${faceY + 10}`}
        fill="none"
        stroke="#2b2b2b"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <ellipse cx="30" cy={faceY + 8} rx="5" ry="3.5" fill="#FF9FBF" opacity="0.55" />
      <ellipse cx="70" cy={faceY + 8} rx="5" ry="3.5" fill="#FF9FBF" opacity="0.55" />
    </g>
  );
}

export default function Mascot({
  shape = "round",
  color = "#5B9BFF",
  accent = "#3A6FD8",
  size = 90,
  expression = "idle",
  image,
  alt = "",
  className = "",
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={alt}
        className={`mascot-img mascot-anim-${expression} ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const faceY = shape === "mushroom" ? 74 : shape === "acorn" ? 66 : 60;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`mascot-svg mascot-anim-${expression} ${className}`}
      role="img"
      aria-label={alt}
    >
      {shape === "acorn" && <AcornBody color={color} accent={accent} />}
      {shape === "mushroom" && <MushroomBody color={color} accent={accent} />}
      {shape === "tail" && <TailBody color={color} accent={accent} />}
      {shape === "round" && <RoundBody color={color} />}
      <Face expression={expression} faceY={faceY} />
    </svg>
  );
}
