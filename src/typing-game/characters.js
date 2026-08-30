// 6개의 캐릭터 기본 정보입니다. (원작 손그림 만화의 등장인물 기준)
// image 필드에 실제 캐릭터 그림 경로(public 폴더 기준, 예: "/characters/gomchi.png")를
// 넣으면 emoji 대신 실제 이미지가 사용됩니다. 확정되기 전까지는 emoji로 임시 표시합니다.
// TODO: 3번, 5번 캐릭터는 아직 이름/정체 확인 전이라 임시값입니다.
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
    id: "character3",
    name: "캐릭터3 (확인 필요)",
    nameEn: "TBD",
    animal: null,
    emoji: "❓",
    image: null,
    color: "#8E8E8E",
    colorLight: "#EEEEEE",
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
    id: "character5",
    name: "캐릭터5 (확인 필요)",
    nameEn: "TBD",
    animal: null,
    emoji: "❓",
    image: null,
    color: "#8E8E8E",
    colorLight: "#EEEEEE",
  },
  {
    id: "songi",
    name: "송이",
    nameEn: "Songi",
    animal: null, // TODO: 실제 종/생김새 확인 필요 (버섯 느낌?)
    emoji: "🍄",
    image: null,
    color: "#FF6B9D",
    colorLight: "#FFEAF2",
  },
];
