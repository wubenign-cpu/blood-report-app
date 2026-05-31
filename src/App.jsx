import { useState } from "react";
import Tesseract from "tesseract.js";

function App() {
  const [inputText, setInputText] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [resultText, setResultText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);

  const correctionDict = {
    최상의: "췌장의",
    마음대로: "마운자로",
    "심장 수치": "신장 수치",
    "고성 염증 수치": "급성 염증 수치",
    독적으로: "단독적으로",
    이제도: "이대로",
    혈류: "혈뇨",
    포러스: "플러스(+)",
    요담백: "요단백",
    알리라베리: "총 아밀라아제, 리파아제",
    마오인자도: "마운자로",
    "수소에 도망하면서": "치료를 지속하면서 추이를 보면서",
    간내구: "단백뇨",
    에스티: "AST",
    알티: "ALT",
    "유산 수치": "요산 수치",
    글리어즈: "지질 수치"
  };

  const correctSTTErrors = (text) => {
    let corrected = text;
    Object.entries(correctionDict).forEach(([wrong, right]) => {
      corrected = corrected.replaceAll(wrong, right);
    });
    return corrected;
  };

  const splitMedicalPoints = (text) => {
    const protectedText = text
      .replace(/(\d)\.(\d)/g, "$1__DECIMAL__$2")
      .replace(/([A-Za-z])\.([A-Za-z])/g, "$1__DOT__$2");

    return protectedText
      .split(/\n+|[。]|(?<=[가-힣a-zA-Z%)]\s)[.](?=\s|$)/)
      .map((item) =>
        item
          .replaceAll("__DECIMAL__", ".")
          .replaceAll("__DOT__", ".")
          .trim()
      )
      .filter((item) => item.length > 0);
  };

  const makeResult = () => {
    const corrected = correctSTTErrors(inputText);
    const points = splitMedicalPoints(corrected);

    if (points.length === 0) {
      setResultText("내용을 입력해 주세요.");
      return;
    }

    let output = "코스모내과 원장입니다. 피검사결과 아래 결과 확인됩니다.\n\n";

    points.forEach((point, index) => {
      output += `${index + 1}. ${point}\n`;
    });

    if (referenceText.trim()) {
      output += `\n${points.length + 1}. 입력된 참고자료를 기준으로 의학용어는 가능한 표준적이고 환자가 이해하기 쉬운 표현으로 정리하였습니다.\n`;
    }

    output += `\n${points.length + (referenceText.trim() ? 2 : 1)}. 검사 결과는 단일 수치만으로 판단하기보다 기존 검사 결과, 복용 중인 약제, 증상 변화, 생활습관을 함께 고려하여 해석하는 것이 적절합니다.`;

    setResultText(output);
  };

  const handleImageOCR = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setOcrLoading(true);

    try {
      const result = await Tesseract.recognize(file, "kor+eng");
      setInputText((prev) => prev + "\n" + result.data.text);
    } catch (error) {
      alert("OCR 읽기에 실패했습니다.");
    }

    setOcrLoading(false);
  };

  const copyResult = async () => {
    await navigator.clipboard.writeText(resultText);
    alert("결과가 복사되었습니다.");
  };

  return (
    <div style={{ padding: 30, fontFamily: "Arial, sans-serif" }}>
      <h1>피검사 결과 설명문 생성기</h1>

      <h3>1. 환자 정보 및 검사 결과 입력</h3>
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="예: 당화혈색소 7.6%, 고지혈증 수치는 LDLc 167mg/dL, Total cholesterol 350mg/dL"
        style={{ width: "100%", height: 180, fontSize: 16, padding: 12 }}
      />

      <h3>2. 그림 파일 OCR 읽기</h3>
      <input type="file" accept="image/*" onChange={handleImageOCR} />
      <p>{ocrLoading ? "이미지에서 글자를 읽는 중입니다." : ""}</p>

      <h3>3. 참고자료 입력</h3>
      <textarea
        value={referenceText}
        onChange={(e) => setReferenceText(e.target.value)}
        placeholder="필수의학용어집 등 참고할 용어 기준을 붙여넣으세요."
        style={{ width: "100%", height: 120, fontSize: 16, padding: 12 }}
      />

      <div style={{ marginTop: 20 }}>
        <button onClick={makeResult} style={{ padding: 12, marginRight: 10 }}>
          설명문 만들기
        </button>

        <button onClick={copyResult} style={{ padding: 12 }}>
          결과 복사
        </button>
      </div>

      <h2>결과</h2>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          backgroundColor: "#f5f5f5",
          padding: 20,
          minHeight: 220,
          fontSize: 16,
          lineHeight: 1.6
        }}
      >
        {resultText}
      </pre>
    </div>
  );
}

export default App;
