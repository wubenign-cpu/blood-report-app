import { useEffect, useReducer } from "react";
import { CHARACTERS } from "./characters";
import Mascot from "./Mascot";
import { sound } from "./sound";
import "./Tutorial.css";

const LESSONS = [
  {
    id: "home",
    title: "1. 손가락 집 찾기",
    desc: "왼손 검지는 F, 오른손 검지는 J 위에 살짝 올려놔요. 여기가 손가락의 집이에요!",
    keys: ["f", "j"],
    reps: 6,
  },
  {
    id: "left",
    title: "2. 왼손 자리",
    desc: "왼손 네 손가락을 A S D F 위에 올리고 하나씩 눌러봐요.",
    keys: ["a", "s", "d", "f"],
    reps: 8,
  },
  {
    id: "right",
    title: "3. 오른손 자리",
    desc: "오른손 네 손가락을 J K L ; 위에 올리고 하나씩 눌러봐요.",
    keys: ["j", "k", "l", ";"],
    reps: 8,
  },
  {
    id: "bridge",
    title: "4. 가운데 다리 글자",
    desc: "가운데에 있는 G와 H도 눌러봐요.",
    keys: ["g", "h"],
    reps: 6,
  },
  {
    id: "words",
    title: "5. 짧은 단어 연습",
    desc: "이제 배운 글자로 만든 단어를 쳐볼까요?",
    words: ["dad", "sad", "ask", "gas", "has", "fall", "hall", "half", "flag", "glass"],
    reps: 8,
  },
];

const KEY_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
];
const LEFT_HAND = new Set(["q", "w", "e", "r", "t", "a", "s", "d", "f", "g", "z", "x", "c", "v", "b"]);

function pickTarget(lesson, avoid) {
  if (lesson.words) {
    const pool = lesson.words.filter((w) => w !== avoid);
    return (pool.length ? pool : lesson.words)[Math.floor(Math.random() * (pool.length ? pool.length : lesson.words.length))];
  }
  const pool = lesson.keys.filter((k) => k !== avoid);
  const source = pool.length ? pool : lesson.keys;
  return source[Math.floor(Math.random() * source.length)];
}

const initialState = {
  lessonIndex: 0,
  repIndex: 0,
  target: pickTarget(LESSONS[0]),
  typed: "",
  feedback: "idle",
  done: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "CORRECT": {
      const lesson = LESSONS[state.lessonIndex];
      if (state.repIndex + 1 >= lesson.reps) {
        if (state.lessonIndex + 1 >= LESSONS.length) {
          return { ...state, done: true, feedback: "correct", typed: "" };
        }
        const nextLesson = LESSONS[state.lessonIndex + 1];
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

export default function Tutorial({ onFinish }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const lesson = LESSONS[state.lessonIndex];
  const isWordLesson = Boolean(lesson.words);

  useEffect(() => {
    if (state.done || isWordLesson) return undefined;

    function handleKeyDown(e) {
      if (e.key === " ") e.preventDefault();
      if (e.key.length !== 1) return;
      const key = e.key.toLowerCase();
      sound.playKeyTick();
      if (key === state.target) {
        dispatch({ type: "CORRECT" });
      } else {
        sound.playWrong();
        dispatch({ type: "WRONG" });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.done, isWordLesson, state.target]);

  useEffect(() => {
    if (state.feedback === "idle") return undefined;
    const t = setTimeout(() => dispatch({ type: "RESET_FEEDBACK" }), 350);
    return () => clearTimeout(t);
  }, [state.feedback]);

  const handleWordChange = (e) => {
    const value = e.target.value;
    dispatch({ type: "SET_TYPED", value });
    if (value === state.target) {
      sound.playCorrect();
      dispatch({ type: "CORRECT" });
    }
  };

  if (state.done) {
    const hero = CHARACTERS[0];
    return (
      <div className="tt-root">
        <div className="tt-done">
          <Mascot {...hero} size={120} expression="proud" alt={hero.name} />
          <h2>축하해요! 기초 타자를 다 배웠어요! 🎉</h2>
          <p>이제 {hero.name}와 친구들이 기다리는 진짜 게임으로 가볼까요?</p>
          <button className="tt-primary-btn" onClick={onFinish}>
            게임하러 가기 🎮
          </button>
        </div>
      </div>
    );
  }

  const allTaughtKeys = LESSONS.slice(0, state.lessonIndex + 1).flatMap((l) => l.keys || []);
  const pulsingKey = isWordLesson
    ? state.target.slice(state.typed.length, state.typed.length + 1).toLowerCase()
    : state.target;

  const totalReps = LESSONS.reduce((sum, l) => sum + l.reps, 0);
  const doneReps = LESSONS.slice(0, state.lessonIndex).reduce((sum, l) => sum + l.reps, 0) + state.repIndex;

  return (
    <div className="tt-root">
      <div className="tt-topbar">
        <h2>⌨️ 타자 기초 배우기</h2>
        <button className="tt-exit-btn" onClick={onFinish}>
          ⏹ 나가기
        </button>
      </div>

      <div className="tt-progress-outer">
        <div className="tt-progress-inner" style={{ width: `${(doneReps / totalReps) * 100}%` }} />
      </div>

      <h3 className="tt-lesson-title">{lesson.title}</h3>
      <p className="tt-lesson-desc">{lesson.desc}</p>

      <div className={`tt-target ${state.feedback === "wrong" ? "tt-shake" : ""} ${state.feedback === "correct" ? "tt-flash" : ""}`}>
        {isWordLesson ? (
          <>
            <span className="tt-target-matched">{state.target.slice(0, state.typed.length)}</span>
            <span className="tt-target-rest">{state.target.slice(state.typed.length)}</span>
          </>
        ) : (
          state.target.toUpperCase()
        )}
      </div>

      {isWordLesson && (
        <input
          className="tt-word-input"
          value={state.typed}
          onChange={handleWordChange}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="여기에 입력하세요"
        />
      )}

      <div className="tt-keyboard">
        {KEY_ROWS.map((row, ri) => (
          <div className="tt-key-row" key={ri}>
            {row.map((k) => {
              const taught = allTaughtKeys.includes(k);
              const active = k === pulsingKey;
              const hand = LEFT_HAND.has(k) ? "left" : "right";
              return (
                <span
                  key={k}
                  className={`tt-key tt-key-${hand} ${taught ? "taught" : ""} ${active ? "active" : ""}`}
                >
                  {k.toUpperCase()}
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
