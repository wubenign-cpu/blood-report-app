import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHARACTERS } from "./characters";
import { WORD_BANKS, pickRandomWord } from "./wordLists";
import { sound } from "./sound";
import "./TypingGame.css";

const START_LIVES = 5;
const BASE_FALL_SPEED = 6; // percent of stage height per second
const PARTICLE_COLORS = ["#FF6B9D", "#FFD166", "#5B9BFF", "#06D6A0", "#FF9F43"];
const HIGH_SCORE_KEY = "typingGame.bestScore";

function loadBestScore() {
  const raw = Number(localStorage.getItem(HIGH_SCORE_KEY));
  return Number.isFinite(raw) ? raw : 0;
}

export default function TypingGame() {
  const [screen, setScreen] = useState("select"); // select | playing | gameover
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

      const newLevel = Math.floor(newScore / 120) + 1;
      if (newLevel > levelRef.current) {
        applyLevel(newLevel);
        sound.playLevelUp();
      }

      spawnParticles(word.x, word.y);
      triggerCharacterAnim("happy");

      if (newCombo > 0 && newCombo % 5 === 0) {
        sound.playCombo(newCombo);
      } else {
        sound.playCorrect();
      }
    },
    [spawnParticles, triggerCharacterAnim, applyLevel]
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
    setScreen("playing");
    sound.playStart();
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
          onStart={startGame}
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
}) {
  return (
    <div className="tg-select">
      <div className="tg-preview" style={{ background: character.colorLight }}>
        <div className="tg-preview-char tg-idle-bob">
          {character.image ? (
            <img src={character.image} alt={character.name} />
          ) : (
            <span className="tg-emoji">{character.emoji}</span>
          )}
        </div>
        <p className="tg-preview-name" style={{ color: character.color }}>
          {character.name} <span>({character.nameEn})</span>
        </p>
        <p className="tg-best">🏆 최고 점수: {bestScore}</p>
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
                <span className="tg-emoji">{c.emoji}</span>
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
          <div className="tg-toggle-row">
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
  langLabel,
  inputRef,
  onChange,
  onKeyDown,
  onExit,
}) {
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

        <div className={`tg-character tg-anim-${charAnim}`}>
          {character.image ? (
            <img src={character.image} alt={character.name} />
          ) : (
            <span className="tg-emoji">{character.emoji}</span>
          )}
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
      <div className={`tg-preview-char tg-idle-bob ${score > 0 ? "tg-proud" : ""}`}>
        {character.image ? (
          <img src={character.image} alt={character.name} />
        ) : (
          <span className="tg-emoji tg-emoji-big">{character.emoji}</span>
        )}
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
