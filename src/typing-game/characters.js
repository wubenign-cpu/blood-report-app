// 원작 손그림 만화의 등장인물 4명입니다. 모두 한 마을에 사는 단짝 친구라는 설정입니다.
// shape는 Mascot.jsx가 그려주는 몸 형태입니다: round / acorn / tail / mushroom
// image 필드에 실제 캐릭터 그림 경로(public 폴더 기준, 예: "/characters/gomchi.png")를
// 넣으면 코드로 그린 모양 대신 그 이미지가 바로 사용됩니다.
// TODO: 곰치/다람쥐/송이는 이름만 확정되었고 정확한 생김새(모양·색)는 아직 확인 전이라
// 임시 형태를 사용 중입니다. 실제 모습을 알려주시면 shape/color/accent만 바꾸면 됩니다.
export const CHARACTERS = [
  {
    id: "gomchi",
    name: "곰치",
    nameEn: "Gomchi",
    shape: "round",
    color: "#5B9BFF",
    accent: "#3A6FD8",
    colorLight: "#EAF2FF",
    image: null,
  },
  {
    id: "bamtori",
    name: "밤토리",
    nameEn: "Bamtori",
    shape: "acorn", // 도토리처럼 생겼고 머리 끝이 뾰족함
    color: "#A0693D",
    accent: "#7A4B26",
    colorLight: "#F3E8DE",
    image: null,
  },
  {
    id: "daramjwi",
    name: "다람쥐",
    nameEn: "Daramjwi",
    shape: "tail",
    color: "#FF9F43",
    accent: "#FFD9A8",
    colorLight: "#FFF3E6",
    image: null,
  },
  {
    id: "songi",
    name: "송이",
    nameEn: "Songi",
    shape: "mushroom",
    color: "#FF6B9D",
    accent: "#FFD1E1",
    colorLight: "#FFEAF2",
    image: null,
  },
];
