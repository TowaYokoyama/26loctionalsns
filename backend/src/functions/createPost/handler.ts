import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// API Gatewayからのイベントの型を定義
interface ApiGatewayEvent {
  body: string;
}

export const main = async (event: ApiGatewayEvent) => {
  // フロントエンドから送られてくるJSONデータを取得
  const data = JSON.parse(event.body);

  const command = new PutCommand({
    TableName: process.env.POSTS_TABLE_NAME, // テーブル名は環境変数から取得
    Item: {
      postId: randomUUID(), // 投稿IDを自動生成
      caption: data.caption, // 送信されたキャプション
      imageName: data.imageName,
      createdAt: new Date().toISOString(),
    },
  });

  await docClient.send(command);

  return {
    statusCode: 201, // 201 Created: 作成成功
    body: JSON.stringify({ message: "Post created successfully" }),
  };
};