import { useState } from "react";
import { CHARACTERS } from "./characters";
import Mascot from "./Mascot";
import { sound } from "./sound";
import "./StoryIntro.css";

const findChar = (id) => CHARACTERS.find((c) => c.id === id);

const PANELS = [
  {
    left: "gomchi",
    right: "bamtori",
    leftLine: "얘들아! 오늘도 다같이 놀자!",
    rightLine: "그런데... 글자마을에 이상한 안개가 껴서 글자가 다 사라졌어!",
  },
  {
    left: "daramjwi",
    right: "songi",
    leftLine: "이런! 안개 속에서 글자들이 둥둥 떠다니고 있어!",
    rightLine: "우리가 재빨리 타자를 쳐서 글자를 붙잡으면 다시 마을로 돌아올 거야!",
  },
  {
    left: "bamtori",
    right: "gomchi",
    leftLine: "좋아! 넷이 힘을 합치면 못할 게 없지!",
    rightLine: "가자, 친구들아! 글자 구출 모험을 시작하자!",
  },
];

export default function StoryIntro({ onDone }) {
  const [step, setStep] = useState(0);
  const panel = PANELS[step];
  const isLast = step === PANELS.length - 1;

  const next = () => {
    sound.playSelect();
    if (isLast) {
      onDone();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="story-root">
      <h2 className="story-title">📖 친구들의 글자 구출 모험</h2>

      <div className="story-panel">
        <div className="story-character">
          <Mascot {...findChar(panel.left)} size={92} expression="happy" alt={findChar(panel.left).name} />
          <div className="story-bubble">{panel.leftLine}</div>
        </div>
        <div className="story-character story-character-right">
          <Mascot {...findChar(panel.right)} size={92} expression="idle" alt={findChar(panel.right).name} />
          <div className="story-bubble">{panel.rightLine}</div>
        </div>
      </div>

      <div className="story-dots">
        {PANELS.map((_, i) => (
          <span key={i} className={`story-dot ${i === step ? "active" : ""}`} />
        ))}
      </div>

      <div className="story-actions">
        <button className="story-skip" onClick={onDone}>
          건너뛰기
        </button>
        <button className="story-next" onClick={next}>
          {isLast ? "모험 시작! 🚀" : "다음 ▶"}
        </button>
      </div>
    </div>
  );
}
