import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHARACTERS } from "./characters";
import { WORD_BANKS, pickRandomWord } from "./wordLists";
import { sound } from "./sound";
import Mascot from "./Mascot";
import StoryIntro from "./StoryIntro";
import Tutorial from "./Tutorial";
import "./TypingGame.css";

const START_LIVES = 5;
const BASE_FALL_SPEED = 6; // percent of stage height per second
const PARTICLE_COLORS = ["#FF6B9D", "#FFD166", "#5B9BFF", "#06D6A0", "#FF9F43"];
const HIGH_SCORE_KEY = "typingGame.bestScore";
const STORY_SEEN_KEY = "typingGame.storySeen";
const CHEER_LINES = ["우와 잘한다!", "최고야!", "힘내!", "대단해!", "짱이야!"];

function loadBestScore() {
  const raw = Number(localStorage.getItem(HIGH_SCORE_KEY));
  return Number.isFinite(raw) ? raw : 0;
}

export default function TypingGame() {
  // select | tutorial | story | playing | gameover
  const [screen, setScreen] = useState(() =>
    localStorage.getItem(STORY_SEEN_KEY) ? "select" : "story"
  );
  const [characterId, setCharacterId] = useState(CHARACTERS[0].id);
  const [language, setLanguage] = useState("ko");
  const [difficulty, setDifficulty] = useState("easy");
  const [soundOn, setSoundOn] = useState(true);

  const [words, setWords] = useState([]);
  const [typed, setTyped] = useState("");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [level, setLevel] = useState(1);
  const [charAnim, setCharAnim] = useState("idle");
  const [shake, setShake] = useState(false);
  const [particles, setParticles] = useState([]);
  const [bestScore, setBestScore] = useState(loadBestScore);
  const [friendToast, setFriendToast] = useState(null);
  const [cameo, setCameo] = useState(null);

  const wordsRef = useRef([]);
  const comboRef = useRef(0);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const livesRef = useRef(START_LIVES);
  const bestScoreRef = useRef(loadBestScore());
  const languageRef = useRef(language);
  const difficultyRef = useRef(difficulty);
  const fallSpeedRef = useRef(BASE_FALL_SPEED);
  const spawnIntervalRef = useRef(2200);
  const nextSpawnRef = useRef(0);
  const lastTimeRef = useRef(null);
  const rafRef = useRef(null);
  const runningRef = useRef(false);
  const mismatchRef = useRef(false);
  const animTimeoutRef = useRef(null);
  const shakeTimeoutRef = useRef(null);
  const friendToastTimeoutRef = useRef(null);
  const cameoTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const character = useMemo(
    () => CHARACTERS.find((c) => c.id === characterId) ?? CHARACTERS[0],
    [characterId]
  );

  useEffect(() => {
    sound.setEnabled(soundOn);
  }, [soundOn]);

  const triggerCharacterAnim = useCallback((kind) => {
    setCharAnim(kind);
    clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = setTimeout(() => setCharAnim("idle"), 550);
  }, []);

  const triggerShake = useCallback(() => {
    setShake(true);
    clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = setTimeout(() => setShake(false), 320);
  }, []);

  const spawnParticles = useCallback((x, y) => {
    const groupId = `${Date.now()}-${Math.random()}`;
    const burst = Array.from({ length: 10 }).map((_, i) => ({
      id: `${groupId}-${i}`,
      x,
      y,
      angle: (360 / 10) * i + Math.random() * 20,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    }));
    setParticles((prev) => [...prev, ...burst]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !burst.find((b) => b.id === p.id)));
    }, 650);
  }, []);

  const spawnWord = useCallback(() => {
    const bank = WORD_BANKS[languageRef.current][difficultyRef.current];
    const existingTexts = wordsRef.current.map((w) => w.text);
    const text = pickRandomWord(bank, existingTexts);
    const word = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      x: 6 + Math.random() * 76,
      y: -10,
    };
    wordsRef.current = [...wordsRef.current, word];
    setWords(wordsRef.current);
  }, []);

  const applyLevel = useCallback((newLevel) => {
    levelRef.current = newLevel;
    fallSpeedRef.current = BASE_FALL_SPEED + (newLevel - 1) * 1.15;
    spawnIntervalRef.current = Math.max(850, 2200 - (newLevel - 1) * 140);
    setLevel(newLevel);
  }, []);

  const endGame = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    sound.playGameOver();
    setScreen("gameover");
    const finalScore = scoreRef.current;
    if (finalScore > bestScoreRef.current) {
      bestScoreRef.current = finalScore;
      localStorage.setItem(HIGH_SCORE_KEY, String(finalScore));
      setBestScore(finalScore);
    }
  }, []);

  const catchWord = useCallback(
    (word) => {
      wordsRef.current = wordsRef.current.filter((w) => w.id !== word.id);
      setWords(wordsRef.current);

      const newCombo = comboRef.current + 1;
      comboRef.current = newCombo;
      setCombo(newCombo);
      setMaxCombo((m) => Math.max(m, newCombo));

      const base = 10 + word.text.replace(/\s/g, "").length * 2;
      const bonus = Math.round(base * (1 + Math.min(newCombo, 10) * 0.1));
      const newScore = scoreRef.current + bonus;
      scoreRef.current = newScore;
      setScore(newScore);

      const others = CHARACTERS.filter((c) => c.id !== character.id);

      const newLevel = Math.floor(newScore / 120) + 1;
      if (newLevel > levelRef.current) {
        const oldLevel = levelRef.current;
        applyLevel(newLevel);
        sound.playLevelUp();

        const oldUnlocked = Math.max(0, Math.min(oldLevel - 1, others.length));
        const newUnlocked = Math.max(0, Math.min(newLevel - 1, others.length));
        if (newUnlocked > oldUnlocked) {
          const joined = others[newUnlocked - 1];
          setFriendToast(`${joined.name}가 함께하기 시작했어요!`);
          clearTimeout(friendToastTimeoutRef.current);
          friendToastTimeoutRef.current = setTimeout(() => setFriendToast(null), 2200);
        }
      }

      spawnParticles(word.x, word.y);
      triggerCharacterAnim("happy");

      if (newCombo > 0 && newCombo % 5 === 0) {
        sound.playCombo(newCombo);
        if (others.length > 0) {
          const cheerFriend = others[Math.floor(Math.random() * others.length)];
          const text = CHEER_LINES[Math.floor(Math.random() * CHEER_LINES.length)];
          setCameo({ id: cheerFriend.id, text });
          clearTimeout(cameoTimeoutRef.current);
          cameoTimeoutRef.current = setTimeout(() => setCameo(null), 1300);
        }
      } else {
        sound.playCorrect();
      }
    },
    [spawnParticles, triggerCharacterAnim, applyLevel, character]
  );

  const handleMiss = useCallback(
    (count) => {
      comboRef.current = 0;
      setCombo(0);

      const newLives = Math.max(0, livesRef.current - count);
      livesRef.current = newLives;
      setLives(newLives);

      triggerCharacterAnim("sad");
      sound.playMiss();

      if (newLives <= 0) endGame();
    },
    [triggerCharacterAnim, endGame]
  );

  useEffect(() => {
    if (screen !== "playing") return undefined;
    runningRef.current = true;
    lastTimeRef.current = null;
    nextSpawnRef.current = performance.now() + 400;

    function loop(timestamp) {
      if (!runningRef.current) return;
      const last = lastTimeRef.current ?? timestamp;
      const dt = Math.min((timestamp - last) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      if (timestamp >= nextSpawnRef.current) {
        spawnWord();
        nextSpawnRef.current = timestamp + spawnIntervalRef.current;
      }

      const moved = wordsRef.current.map((w) => ({
        ...w,
        y: w.y + fallSpeedRef.current * dt,
      }));
      const remaining = moved.filter((w) => w.y < 92);
      const missed = moved.length - remaining.length;

      wordsRef.current = remaining;
      setWords(remaining);

      if (missed > 0) handleMiss(missed);

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [screen, spawnWord, handleMiss]);

  useEffect(() => {
    if (screen === "playing") inputRef.current?.focus();
  }, [screen]);

  useEffect(
    () => () => {
      clearTimeout(animTimeoutRef.current);
      clearTimeout(shakeTimeoutRef.current);
      clearTimeout(friendToastTimeoutRef.current);
      clearTimeout(cameoTimeoutRef.current);
    },
    []
  );

  const startGame = () => {
    languageRef.current = language;
    difficultyRef.current = difficulty;
    wordsRef.current = [];
    comboRef.current = 0;
    scoreRef.current = 0;
    livesRef.current = START_LIVES;
    mismatchRef.current = false;

    setWords([]);
    setTyped("");
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLives(START_LIVES);
    applyLevel(1);
    setCharAnim("idle");
    setParticles([]);
    setFriendToast(null);
    setCameo(null);
    setScreen("playing");
    sound.playStart();
  };

  const finishStory = () => {
    localStorage.setItem(STORY_SEEN_KEY, "true");
    sound.playSelect();
    setScreen("select");
  };

  const finishTutorial = () => {
    sound.playSelect();
    setDifficulty((d) => (d === "tutorial" ? "easy" : d));
    setScreen("select");
  };

  const backToSelect = () => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setScreen("select");
  };

  const handleTypedChange = (e) => {
    const value = e.target.value;
    setTyped(value);

    if (value === "") {
      mismatchRef.current = false;
      return;
    }

    const exact = wordsRef.current.find((w) => w.text === value);
    if (exact) {
      catchWord(exact);
      setTyped("");
      mismatchRef.current = false;
      return;
    }

    const hasPrefixMatch = wordsRef.current.some((w) => w.text.startsWith(value));
    if (!hasPrefixMatch) {
      if (!mismatchRef.current) {
        mismatchRef.current = true;
        sound.playWrong();
        triggerShake();
      }
    } else {
      mismatchRef.current = false;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key.length === 1) sound.playKeyTick();
  };

  const langLabel = language === "ko" ? "한글" : "English";
  const heartsArray = Array.from({ length: START_LIVES }, (_, i) => i < lives);

  return (
    <div className="tg-root">
      <div className="tg-topbar">
        <h1 className="tg-logo">⌨️ 타자 연습 게임 <span>Typing Game</span></h1>
        <button
          className="tg-sound-toggle"
          onClick={() => setSoundOn((v) => !v)}
          aria-label="소리 켜기/끄기"
        >
          {soundOn ? "🔊" : "🔇"}
        </button>
      </div>

      {screen === "story" && <StoryIntro onDone={finishStory} />}

      {screen === "tutorial" && (
        <Tutorial character={character} language={language} onFinish={finishTutorial} />
      )}

      {screen === "select" && (
        <SelectScreen
          character={character}
          characterId={characterId}
          setCharacterId={(id) => {
            setCharacterId(id);
            sound.playSelect();
          }}
          language={language}
          setLanguage={(v) => {
            setLanguage(v);
            sound.playSelect();
          }}
          difficulty={difficulty}
          setDifficulty={(v) => {
            setDifficulty(v);
            sound.playSelect();
          }}
          bestScore={bestScore}
          onStart={() => {
            if (difficulty === "tutorial") {
              sound.playSelect();
              setScreen("tutorial");
            } else {
              startGame();
            }
          }}
          onStory={() => {
            sound.playSelect();
            setScreen("story");
          }}
        />
      )}

      {screen === "playing" && (
        <PlayScreen
          character={character}
          words={words}
          typed={typed}
          score={score}
          combo={combo}
          level={level}
          hearts={heartsArray}
          charAnim={charAnim}
          shake={shake}
          particles={particles}
          friendToast={friendToast}
          cameo={cameo}
          langLabel={langLabel}
          inputRef={inputRef}
          onChange={handleTypedChange}
          onKeyDown={handleKeyDown}
          onExit={backToSelect}
        />
      )}

      {screen === "gameover" && (
        <GameOverScreen
          character={character}
          score={score}
          maxCombo={maxCombo}
          bestScore={bestScore}
          onRetry={startGame}
          onBackToSelect={backToSelect}
        />
      )}
    </div>
  );
}

function SelectScreen({
  character,
  characterId,
  setCharacterId,
  language,
  setLanguage,
  difficulty,
  setDifficulty,
  bestScore,
  onStart,
  onStory,
}) {
  return (
    <div className="tg-select">
      <div className="tg-preview" style={{ background: character.colorLight }}>
        <div className="tg-preview-char">
          <Mascot {...character} size={110} expression="idle" alt={character.name} />
        </div>
        <p className="tg-preview-name" style={{ color: character.color }}>
          {character.name} <span>({character.nameEn})</span>
        </p>
        <p className="tg-best">🏆 최고 점수: {bestScore}</p>
        <div className="tg-side-actions">
          <button className="tg-link-btn" onClick={onStory}>
            📖 우리들의 이야기
          </button>
        </div>
      </div>

      <div className="tg-panel">
        <section>
          <h2>1. 캐릭터를 골라보세요</h2>
          <div className="tg-character-grid">
            {CHARACTERS.map((c) => (
              <button
                key={c.id}
                className={`tg-character-card ${characterId === c.id ? "selected" : ""}`}
                style={{ "--card-color": c.color, "--card-bg": c.colorLight }}
                onClick={() => setCharacterId(c.id)}
              >
                <Mascot {...c} size={54} expression="idle" alt={c.name} />
                <span className="tg-card-name">{c.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>2. 언어를 골라보세요</h2>
          <div className="tg-toggle-row">
            <button
              className={`tg-toggle ${language === "ko" ? "active" : ""}`}
              onClick={() => setLanguage("ko")}
            >
              🇰🇷 한글
            </button>
            <button
              className={`tg-toggle ${language === "en" ? "active" : ""}`}
              onClick={() => setLanguage("en")}
            >
              🇺🇸 English
            </button>
          </div>
        </section>

        <section>
          <h2>3. 난이도를 골라보세요</h2>
          <p className="tg-hint">타자가 처음이라면 🔰 튜토리얼부터 시작해보세요!</p>
          <div className="tg-toggle-row">
            <button
              className={`tg-toggle ${difficulty === "tutorial" ? "active" : ""}`}
              onClick={() => setDifficulty("tutorial")}
            >
              🔰 튜토리얼
            </button>
            <button
              className={`tg-toggle ${difficulty === "easy" ? "active" : ""}`}
              onClick={() => setDifficulty("easy")}
            >
              🟢 쉬움
            </button>
            <button
              className={`tg-toggle ${difficulty === "normal" ? "active" : ""}`}
              onClick={() => setDifficulty("normal")}
            >
              🟡 보통
            </button>
            <button
              className={`tg-toggle ${difficulty === "hard" ? "active" : ""}`}
              onClick={() => setDifficulty("hard")}
            >
              🔴 어려움
            </button>
          </div>
        </section>

        <button className="tg-start-btn" onClick={onStart}>
          🚀 시작하기 Start
        </button>
      </div>
    </div>
  );
}

function FallingWord({ word, typed }) {
  const isTarget = typed.length > 0 && word.text.startsWith(typed);
  const matched = isTarget ? word.text.slice(0, typed.length) : "";
  const rest = isTarget ? word.text.slice(typed.length) : word.text;

  return (
    <div
      className={`tg-word ${isTarget ? "tg-word-active" : ""}`}
      style={{ left: `${word.x}%`, top: `${word.y}%` }}
    >
      <span className="tg-word-matched">{matched}</span>
      <span className="tg-word-rest">{rest}</span>
    </div>
  );
}

function PlayScreen({
  character,
  words,
  typed,
  score,
  combo,
  level,
  hearts,
  charAnim,
  shake,
  particles,
  friendToast,
  cameo,
  langLabel,
  inputRef,
  onChange,
  onKeyDown,
  onExit,
}) {
  const others = CHARACTERS.filter((c) => c.id !== character.id);
  const unlockedCount = Math.max(0, Math.min(level - 1, others.length));
  const cameoFriend = cameo ? others.find((c) => c.id === cameo.id) : null;

  return (
    <div className="tg-play">
      <div className="tg-hud">
        <div className="tg-hud-item">⭐ 점수 {score}</div>
        <div className="tg-hud-item">🔥 콤보 {combo}</div>
        <div className="tg-hud-item">📈 레벨 {level}</div>
        <div className="tg-hud-item">{langLabel}</div>
        <div className="tg-hearts">
          {hearts.map((alive, i) => (
            <span key={i} className={alive ? "tg-heart" : "tg-heart lost"}>
              {alive ? "❤️" : "🤍"}
            </span>
          ))}
        </div>
        <button className="tg-exit-btn" onClick={onExit}>
          ⏹ 나가기
        </button>
      </div>

      {others.length > 0 && (
        <div className="tg-friend-meter">
          <span className="tg-friend-meter-label">함께하는 친구</span>
          {others.map((c, i) => (
            <span key={c.id} className={`tg-friend-icon ${i < unlockedCount ? "joined" : "locked"}`}>
              <Mascot {...c} size={30} expression="idle" alt={c.name} />
            </span>
          ))}
        </div>
      )}

      <div
        className="tg-stage"
        style={{ background: `linear-gradient(180deg, ${character.colorLight}, #ffffff)` }}
        onClick={() => inputRef.current?.focus()}
      >
        {words.map((w) => (
          <FallingWord key={w.id} word={w} typed={typed} />
        ))}

        {particles.map((p) => (
          <span
            key={p.id}
            className="tg-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              "--pcolor": p.color,
              "--pangle": `${p.angle}deg`,
            }}
          />
        ))}

        <div className="tg-danger-line" />

        {friendToast && <div className="tg-friend-toast">🎉 {friendToast}</div>}

        {cameoFriend && (
          <div className="tg-cameo">
            <Mascot {...cameoFriend} size={54} expression="happy" alt={cameoFriend.name} />
            <div className="tg-cameo-bubble">{cameo.text}</div>
          </div>
        )}

        <div className="tg-character">
          <Mascot {...character} size={70} expression={charAnim} alt={character.name} />
        </div>
      </div>

      <div className={`tg-input-wrap ${shake ? "tg-shake" : ""}`}>
        <input
          ref={inputRef}
          className="tg-input"
          value={typed}
          onChange={onChange}
          onKeyDown={onKeyDown}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="여기에 입력하세요 / Type here"
        />
      </div>
    </div>
  );
}

function GameOverScreen({ character, score, maxCombo, bestScore, onRetry, onBackToSelect }) {
  const isNewBest = score >= bestScore && score > 0;
  return (
    <div className="tg-gameover">
      <div className="tg-preview-char">
        <Mascot {...character} size={130} expression={score > 0 ? "proud" : "sad"} alt={character.name} />
      </div>
      <h2>게임 종료! Game Over</h2>
      {isNewBest && <p className="tg-new-best">🎉 최고 기록 갱신!</p>}
      <div className="tg-result-grid">
        <div>
          <span>⭐ 점수</span>
          <strong>{score}</strong>
        </div>
        <div>
          <span>🔥 최고 콤보</span>
          <strong>{maxCombo}</strong>
        </div>
        <div>
          <span>🏆 최고 점수</span>
          <strong>{bestScore}</strong>
        </div>
      </div>
      <div className="tg-gameover-actions">
        <button className="tg-start-btn" onClick={onRetry}>
          🔁 다시하기
        </button>
        <button className="tg-secondary-btn" onClick={onBackToSelect}>
          🧑‍🤝‍🧑 캐릭터 다시 고르기
        </button>
      </div>
    </div>
  );
}
