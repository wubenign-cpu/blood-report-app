// 초등학생용 타자 연습 단어 목록입니다.
// 난이도별로 한글/영문 단어를 분리해두었습니다. 자유롭게 추가/수정하세요.
export const WORD_BANKS = {
  ko: {
    easy: [
      "해", "달", "별", "물", "불", "산", "강", "눈", "비", "꽃",
      "집", "밥", "손", "발", "귀", "눈물", "하늘", "구름", "사과", "딸기",
      "포도", "학교", "친구", "가족", "웃음", "나무", "바다", "우유", "김치", "치즈",
    ],
    normal: [
      "강아지", "고양이", "토끼", "곰돌이", "여우", "판다", "코끼리", "호랑이",
      "병아리", "무지개", "눈사람", "자전거", "우산", "김밥", "떡볶이", "놀이터",
      "도서관", "선생님", "그림책", "생일파티", "축구공", "피아노", "장난감", "동화책",
    ],
    hard: [
      "안녕하세요", "감사합니다", "숙제를 해요", "책을 읽어요", "친구와 놀아요",
      "손을 씻어요", "우유를 마셔요", "그림을 그려요", "학교에 가요", "노래를 불러요",
      "줄넘기를 해요", "이를 닦아요", "일찍 일어나요", "맛있게 먹어요",
    ],
  },
  en: {
    easy: [
      "cat", "dog", "sun", "hat", "cup", "pen", "box", "red", "run", "big",
      "top", "map", "fan", "jam", "bus", "fox", "owl", "bee", "ant", "egg",
    ],
    normal: [
      "apple", "tiger", "water", "house", "happy", "smile", "school", "friend",
      "flower", "rabbit", "orange", "purple", "yellow", "monkey", "spider", "dragon",
    ],
    hard: [
      "I love you", "good morning", "have fun today", "read a book",
      "brush your teeth", "clean your room", "play with friends",
      "practice makes perfect", "look at the stars", "sing a song",
    ],
  },
};

export function pickRandomWord(bank, exclude) {
  const pool = bank.filter((w) => !exclude.includes(w));
  const source = pool.length > 0 ? pool : bank;
  return source[Math.floor(Math.random() * source.length)];
}
