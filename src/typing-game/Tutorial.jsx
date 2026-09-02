import { useEffect, useReducer, useRef, useState } from "react";
import Mascot from "./Mascot";
import { sound } from "./sound";
import "./Tutorial.css";

// ---------- 한글(2벌식) 자모 분해 유틸 ----------
const CHO = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const JUNG = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
const JONG = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

function decomposeHangul(char) {
  if (!char) return null;
  const code = char.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return null;
  const cho = CHO[Math.floor(code / (21 * 28))];
  const jung = JUNG[Math.floor((code % (21 * 28)) / 28)];
  const jong = JONG[code % 28];
  return [cho, jung, jong].filter(Boolean);
}

// 2벌식 자판: 물리 키 -> 자모 (키보드에 라벨로 표시)
const FULL_JAMO_MAP = {
  q: "ㅂ", w: "ㅈ", e: "ㄷ", r: "ㄱ", t: "ㅅ", y: "ㅛ", u: "ㅕ", i: "ㅑ", o: "ㅐ", p: "ㅔ",
  a: "ㅁ", s: "ㄴ", d: "ㅇ", f: "ㄹ", g: "ㅎ", h: "ㅗ", j: "ㅓ", k: "ㅏ", l: "ㅣ", ";": "",
  z: "ㅋ", x: "ㅌ", c: "ㅊ", v: "ㅍ", b: "ㅠ", n: "ㅜ", m: "ㅡ", ",": "", ".": "", "/": "",
};
// 2벌식 자판: 자모 -> 물리 키 (위 맵의 역방향, 쉬운 자모만)
const JAMO_TO_KEY = Object.fromEntries(
  Object.entries(FULL_JAMO_MAP)
    .filter(([, jamo]) => jamo)
    .map(([key, jamo]) => [jamo, key])
);

const STAGE_TITLES_EN = ["1단계: 홈 자리", "2단계: 윗줄", "3단계: 아랫줄", "4단계: 통합 문장"];
const STAGE_TITLES_KO = ["1단계: 홈 자리", "2단계: 윗줄", "3단계: 아랫줄", "4단계: 통합 문장"];

const EN_LESSONS = [
  { stage: 0, title: "1. 손가락 집 찾기", desc: "왼손 검지는 F, 오른손 검지는 J 위에 살짝 올려놔요.", guide: "F와 J에는 볼록한 돌기가 있어요. 손가락으로 찾아보세요!", keys: ["f", "j"], words: ["f", "j"], reps: 8 },
  { stage: 0, title: "2. 왼손 홈자리", desc: "왼손 네 손가락을 A S D F 위에 올리고 하나씩 눌러봐요.", guide: "왼손 친구들, 화이팅!", keys: ["a", "s", "d", "f"], words: ["a", "s", "d", "f"], reps: 10 },
  { stage: 0, title: "3. 오른손 홈자리", desc: "오른손 네 손가락을 J K L ; 위에 올리고 하나씩 눌러봐요.", guide: "오른손도 잘 하고 있어요!", keys: ["j", "k", "l", ";"], words: ["j", "k", "l", ";"], reps: 10 },
  { stage: 0, title: "4. 홈자리 단어 연습", desc: "G와 H도 배우면서, 홈자리 글자로 만든 단어를 쳐볼까요?", guide: "우리가 배운 글자로 진짜 단어를 만들 수 있어요!", keys: ["g", "h"], words: ["dad", "sad", "ask", "gas", "has", "fall", "hall", "half", "flag", "glass", "salad", "flask"], reps: 12 },
  { stage: 1, title: "5. 왼손 윗줄", desc: "왼손을 살짝 위로 뻗어서 Q W E R T를 눌러봐요.", guide: "손가락을 위로 움직여봐요!", keys: ["q", "w", "e", "r", "t"], words: ["q", "w", "e", "r", "t"], reps: 10 },
  { stage: 1, title: "6. 오른손 윗줄", desc: "오른손을 살짝 위로 뻗어서 Y U I O P를 눌러봐요.", guide: "이제 오른손도 위로!", keys: ["y", "u", "i", "o", "p"], words: ["y", "u", "i", "o", "p"], reps: 10 },
  { stage: 1, title: "7. 윗줄 + 홈자리 단어", desc: "윗줄과 홈자리를 합쳐서 진짜 단어를 만들어봐요.", guide: "단어가 점점 길어지고 있어요!", keys: [], words: ["water", "paper", "tiger", "great", "after", "trade", "radio", "story", "guitar", "dirty", "today", "alert"], reps: 14 },
  { stage: 2, title: "8. 왼손 아랫줄", desc: "왼손을 살짝 아래로 뻗어서 Z X C V B를 눌러봐요.", guide: "손가락을 아래로 살짝!", keys: ["z", "x", "c", "v", "b"], words: ["z", "x", "c", "v", "b"], reps: 10 },
  { stage: 2, title: "9. 오른손 아랫줄", desc: "오른손을 살짝 아래로 뻗어서 N M , . /를 눌러봐요.", guide: "이제 전체 키보드를 다 알아요!", keys: ["n", "m", ",", ".", "/"], words: ["n", "m", ",", ".", "/"], reps: 10 },
  { stage: 2, title: "10. 전체 단어 연습", desc: "이제 어떤 글자든 다 칠 수 있어요!", guide: "모든 글자를 배웠어요, 대단해요!", keys: [], words: ["zebra", "mouse", "cave", "brave", "music", "cactus", "yellow", "purple", "orange", "monkey", "number", "garden"], reps: 14 },
  { stage: 3, title: "11. 짧은 문장 연습", desc: "이제 문장까지 쳐볼까요? 완전 타자왕이에요!", guide: "마지막 단계예요, 힘내세요!", keys: [], words: ["I love you", "good morning", "have fun today", "read a book", "brush your teeth", "clean your room", "play with friends", "practice makes perfect"], reps: 10 },
];

const KO_LESSONS = [
  { stage: 0, title: "1. 왼손 자음 자리", desc: "왼손 손가락을 A S D F G 위에 올리고 ㅏ와 합쳐서 글자를 만들어요.", guide: "마·나·아·라·하! 왼손으로 만들 수 있어요.", keys: ["a", "s", "d", "f", "g"], words: ["마", "나", "아", "라", "하"], reps: 8 },
  { stage: 0, title: "2. 오른손 모음 자리", desc: "오른손 손가락을 H J K L 위에 올리고 ㅇ과 합쳐서 글자를 만들어요.", guide: "아·어·오·이! 오른손으로 만들 수 있어요.", keys: ["h", "j", "k", "l"], words: ["아", "어", "오", "이"], reps: 8 },
  { stage: 0, title: "3. 글자 조합 연습", desc: "왼손 자음과 오른손 모음을 순서대로 눌러서 글자를 만들어봐요.", guide: "자음이랑 모음을 순서대로 눌러봐요!", keys: ["a", "s", "d", "f", "g", "h", "j", "k", "l"], words: ["마", "너", "호", "리", "나", "어", "로", "히", "마", "니"], reps: 10 },
  { stage: 0, title: "4. 홈자리 단어 연습", desc: "이제 배운 글자로 만든 진짜 단어를 쳐볼까요?", guide: "어머니, 하마, 나라! 진짜 단어를 만들 수 있어요.", keys: [], words: ["어머니", "하마", "나라", "아이", "이마", "머리", "허리", "나이", "마리", "이리"], reps: 12 },
  { stage: 1, title: "5. 윗줄 자음 자리", desc: "Q W E R T 자리에 있는 ㅂㅈㄷㄱㅅ을 눌러봐요.", guide: "바·자·다·가·사!", keys: ["q", "w", "e", "r", "t"], words: ["바", "자", "다", "가", "사"], reps: 10 },
  { stage: 1, title: "6. 윗줄 모음 자리", desc: "Y U I O P 자리에 있는 ㅛㅕㅑㅐㅔ를 눌러봐요.", guide: "묘·며·먀·매·메!", keys: ["y", "u", "i", "o", "p"], words: ["묘", "며", "먀", "매", "메"], reps: 10 },
  { stage: 1, title: "7. 윗줄 + 홈자리 단어", desc: "윗줄과 홈자리를 합쳐서 진짜 단어를 만들어봐요.", guide: "아버지, 저고리! 점점 단어가 길어져요.", keys: [], words: ["아버지", "저고리", "거리", "자리", "다리", "가게", "사자", "바다", "어디", "고기"], reps: 14 },
  { stage: 2, title: "8. 아랫줄 자음 자리", desc: "Z X C V 자리에 있는 ㅋㅌㅊㅍ을 눌러봐요.", guide: "카·타·차·파!", keys: ["z", "x", "c", "v"], words: ["카", "타", "차", "파"], reps: 8 },
  { stage: 2, title: "9. 아랫줄 모음 자리", desc: "B N M 자리에 있는 ㅠㅜㅡ를 눌러봐요.", guide: "뮤·무·므!", keys: ["b", "n", "m"], words: ["뮤", "무", "므"], reps: 8 },
  { stage: 2, title: "10. 전체 단어 연습", desc: "이제 어떤 글자든 다 만들 수 있어요!", guide: "우표, 커피, 구두! 다 만들 수 있어요.", keys: [], words: ["우표", "커피", "치마", "구두", "두부", "포도", "모자", "구름", "나무", "거북이"], reps: 14 },
  { stage: 3, title: "11. 짧은 문장 연습", desc: "이제 문장까지 쳐볼까요? 완전 타자왕이에요!", guide: "마지막 단계예요, 힘내세요!", keys: [], words: ["안녕하세요", "감사합니다", "고맙습니다", "사랑해요", "좋은 아침", "다시 만나요", "잘 자요", "축하해요"], reps: 10 },
];

const KEY_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
];
const LEFT_HAND = new Set(["q", "w", "e", "r", "t", "a", "s", "d", "f", "g", "z", "x", "c", "v", "b"]);

function pickTarget(lesson, avoid) {
  const pool = lesson.words.filter((w) => w !== avoid);
  const source = pool.length ? pool : lesson.words;
  return source[Math.floor(Math.random() * source.length)];
}

function makeInitialState(lessons) {
  return {
    lessonIndex: 0,
    repIndex: 0,
    target: pickTarget(lessons[0]),
    typed: "",
    feedback: "idle",
    done: false,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "CORRECT": {
      const lessons = action.lessons;
      const lesson = lessons[state.lessonIndex];
      if (state.repIndex + 1 >= lesson.reps) {
        if (state.lessonIndex + 1 >= lessons.length) {
          return { ...state, done: true, feedback: "correct", typed: "" };
        }
        const nextLesson = lessons[state.lessonIndex + 1];
        return {
          ...state,
          lessonIndex: state.lessonIndex + 1,
          repIndex: 0,
          target: pickTarget(nextLesson),
          typed: "",
          feedback: "correct",
        };
      }
      return {
        ...state,
        repIndex: state.repIndex + 1,
        target: pickTarget(lesson, state.target),
        typed: "",
        feedback: "correct",
      };
    }
    case "WRONG":
      return { ...state, feedback: "wrong" };
    case "RESET_FEEDBACK":
      return state.feedback === "idle" ? state : { ...state, feedback: "idle" };
    case "SET_TYPED":
      return { ...state, typed: action.value };
    default:
      return state;
  }
}

// 목표 글자를 만드는 데 필요한 물리 키(다음 눌러야 할 자모/글자)를 계산합니다.
function activeKeysFor(target, typedLen, language) {
  if (!target) return [];
  const nextChar = target[Math.min(typedLen, target.length - 1)];
  if (language === "en") return [nextChar];
  const jamo = decomposeHangul(nextChar);
  if (!jamo) return [];
  return jamo.map((j) => JAMO_TO_KEY[j]).filter(Boolean);
}

function TutorialSession({ character, language, onFinish, onSwitchLanguage }) {
  const lessons = language === "en" ? EN_LESSONS : KO_LESSONS;
  const stageTitles = language === "en" ? STAGE_TITLES_EN : STAGE_TITLES_KO;
  const [state, dispatch] = useReducer(reducer, lessons, makeInitialState);
  const lesson = lessons[state.lessonIndex];
  const isComposingRef = useRef(false);

  useEffect(() => {
    if (state.feedback === "idle") return undefined;
    const t = setTimeout(() => dispatch({ type: "RESET_FEEDBACK" }), 350);
    return () => clearTimeout(t);
  }, [state.feedback]);

  // 한글은 조합 중(예: ㅁ -> 마) 중간 상태를 거치므로, 조합이 끝난 뒤에만 오답 여부를 판단합니다.
  const checkMismatch = (value) => {
    if (value !== state.target && !state.target.startsWith(value)) {
      sound.playWrong();
      dispatch({ type: "WRONG" });
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    dispatch({ type: "SET_TYPED", value });
    if (value === state.target) {
      sound.playCorrect();
      dispatch({ type: "CORRECT", lessons });
      return;
    }
    if (!isComposingRef.current) checkMismatch(value);
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (e) => {
    isComposingRef.current = false;
    const value = e.target.value;
    if (value !== state.target) checkMismatch(value);
  };

  const expression = state.feedback === "correct" ? "happy" : state.feedback === "wrong" ? "sad" : "idle";

  const LanguageSwitch = (
    <div className="tt-lang-switch">
      <button
        className={`tt-lang-btn ${language === "ko" ? "active" : ""}`}
        onClick={() => onSwitchLanguage("ko")}
      >
        🇰🇷 한글
      </button>
      <button
        className={`tt-lang-btn ${language === "en" ? "active" : ""}`}
        onClick={() => onSwitchLanguage("en")}
      >
        🇺🇸 English
      </button>
    </div>
  );

  if (state.done) {
    return (
      <div className="tt-root">
        <div className="tt-done">
          <Mascot {...character} size={120} expression="proud" alt={character.name} />
          <h2>축하해요! 타자를 다 배웠어요! 🎉</h2>
          <p>이제 {character.name}와 친구들이 기다리는 진짜 게임으로 가볼까요?</p>
          <div className="tt-done-actions">
            <button className="tt-primary-btn" onClick={onFinish}>
              🏠 메인 화면으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  const allTaughtKeys = lessons.slice(0, state.lessonIndex + 1).flatMap((l) => l.keys);
  const pulsingKeys = activeKeysFor(state.target, state.typed.length, language);

  const totalReps = lessons.reduce((sum, l) => sum + l.reps, 0);
  const doneReps = lessons.slice(0, state.lessonIndex).reduce((sum, l) => sum + l.reps, 0) + state.repIndex;

  return (
    <div className="tt-root">
      <div className="tt-topbar">
        <h2>⌨️ 타자 기초 배우기</h2>
        <button className="tt-exit-btn" onClick={onFinish}>
          ⏹ 나가기
        </button>
      </div>

      {LanguageSwitch}

      <div className="tt-stage-row">
        {stageTitles.map((t, i) => (
          <span key={t} className={`tt-stage-pill ${i === lesson.stage ? "active" : i < lesson.stage ? "done" : ""}`}>
            {t}
          </span>
        ))}
      </div>

      <div className="tt-progress-outer">
        <div className="tt-progress-inner" style={{ width: `${(doneReps / totalReps) * 100}%` }} />
      </div>

      <div className="tt-guide">
        <Mascot {...character} size={64} expression={expression} alt={character.name} />
        <div className="tt-guide-bubble">
          <strong>{lesson.title}</strong>
          <p>{lesson.desc}</p>
          <p className="tt-guide-line">{character.name}: "{lesson.guide}"</p>
        </div>
      </div>

      <div
        className={`tt-target ${state.feedback === "wrong" ? "tt-shake" : ""} ${state.feedback === "correct" ? "tt-flash" : ""}`}
      >
        <span className="tt-target-matched">{state.target.slice(0, state.typed.length)}</span>
        <span className="tt-target-rest">{state.target.slice(state.typed.length)}</span>
      </div>

      <input
        className="tt-word-input"
        value={state.typed}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="여기에 입력하세요"
      />

      <div className="tt-keyboard">
        {KEY_ROWS.map((row, ri) => (
          <div className="tt-key-row" key={ri}>
            {row.map((k) => {
              const taught = allTaughtKeys.includes(k);
              const active = pulsingKeys.includes(k);
              const hand = LEFT_HAND.has(k) ? "left" : "right";
              const label = language === "en" ? k.toUpperCase() : FULL_JAMO_MAP[k] || "";
              return (
                <span
                  key={k}
                  className={`tt-key tt-key-${hand} ${taught ? "taught" : ""} ${active ? "active" : ""}`}
                >
                  {label}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div className="tt-hand-legend">
        <span className="tt-legend-dot tt-key-left" /> 왼손
        <span className="tt-legend-dot tt-key-right" /> 오른손
      </div>
    </div>
  );
}

export default function Tutorial({ character, language = "ko", onFinish }) {
  const [activeLanguage, setActiveLanguage] = useState(language);

  return (
    <TutorialSession
      key={activeLanguage}
      character={character}
      language={activeLanguage}
      onFinish={onFinish}
      onSwitchLanguage={(lang) => {
        if (lang !== activeLanguage) {
          sound.playSelect();
          setActiveLanguage(lang);
        }
      }}
    />
  );
}
