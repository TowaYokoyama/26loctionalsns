import { GoogleGenerativeAI } from '@google/generative-ai';

// Base64形式の画像データを、APIが要求する形式に変換するヘルパー関数
function fileToGenerativePart(base64: string, mimeType: string) {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
}

export const main = async (event:any) => {
  // ▼▼▼ ここから追加 ▼▼▼
  // 1. まず環境変数にAPIキーがセットされているか確認する
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables.');
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'サーバーエラー: APIキーが設定されていません。' }),
    };
  }
  
  // 2. キーの存在確認後、クライアントを初期化する
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // ▲▲▲ ここまで追加 ▲▲▲

  try {
    const model =  genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const { image, mimeType } = JSON.parse(event.body);
    
    const prompt = `この画像について、SNS投稿用の短いキャプションと、最も関連性の高いカテゴリを一つ提案してください。形式は以下のJSONフォーマットで回答してください: {"caption": "提案するキャプション", "category": "提案するカテゴリ"}`;
    const imagePart = fileToGenerativePart(image, mimeType);

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();

    return {
      statusCode: 200,
      body: text,
    };
  } catch (error) {
    console.error('AI generation failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'AIによる生成に失敗しました。' }),
    };
  }
};