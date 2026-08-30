// 6개의 캐릭터 기본 정보입니다.
// 곰치 / 밤토리 / 다람쥐 / 송이는 원작 손그림 만화 캐릭터로 확정되었고,
// 토실이 / 여우별은 정체 확인 전까지 사용하는 원래 기본 캐릭터입니다.
// image 필드에 실제 캐릭터 그림 경로(public 폴더 기준, 예: "/characters/gomchi.png")를
// 넣으면 emoji 대신 실제 이미지가 사용됩니다.
export const CHARACTERS = [
  {
    id: "gomchi",
    name: "곰치",
    nameEn: "Gomchi",
    animal: null, // TODO: 실제 종/생김새 확인 필요
    emoji: "🐶",
    image: null,
    color: "#5B9BFF",
    colorLight: "#EAF2FF",
  },
  {
    id: "bamtori",
    name: "밤토리",
    nameEn: "Bamtori",
    animal: null, // TODO: 실제 종/생김새 확인 필요
    emoji: "🐻",
    image: null,
    color: "#A0693D",
    colorLight: "#F3E8DE",
  },
  {
    id: "tosil",
    name: "토실이",
    nameEn: "Tosil",
    animal: "토끼",
    emoji: "🐰",
    image: null,
    color: "#FF6B9D",
    colorLight: "#FFEAF2",
  },
  {
    id: "daramjwi",
    name: "다람쥐",
    nameEn: "Daramjwi",
    animal: "다람쥐",
    emoji: "🐿️",
    image: null,
    color: "#FF9F43",
    colorLight: "#FFF3E6",
  },
  {
    id: "yeobyeol",
    name: "여우별",
    nameEn: "Yeobyeol",
    animal: "여우",
    emoji: "🦊",
    image: null,
    color: "#FF5722",
    colorLight: "#FFEBE3",
  },
  {
    id: "songi",
    name: "송이",
    nameEn: "Songi",
    animal: null, // TODO: 실제 종/생김새 확인 필요 (버섯 느낌?)
    emoji: "🍄",
    image: null,
    color: "#3A3A3A",
    colorLight: "#EDEDED",
  },
];
