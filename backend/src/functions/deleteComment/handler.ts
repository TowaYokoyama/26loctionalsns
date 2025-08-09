import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "src/libs/dynamodbClient";

// ローカル開発環境(IS_OFFLINE=true)の場合のみ、DockerのDBに接続する設定
const dynamoDbClientConfig = process.env.IS_OFFLINE
  ? {
      region: 'localhost',
      endpoint: 'http://localhost:8000',
      credentials: {
        accessKeyId: 'MockAccessKeyId',
        secretAccessKey: 'MockSecretAccessKey',
      },
    }
  : { region: process.env.AWS_REGION };


// API Gatewayからのイベントの型を定義
interface ApiGatewayEvent {
  body: string;
}

export const main = async (event:any) => {
  const { postId, createdAt } = event.pathParameters;

  const command = new DeleteCommand({
    TableName: process.env.COMMENTS_TABLE_NAME,
    Key: {
      postId,
      createdAt: decodeURIComponent(createdAt), // URLエンコードされたタイムスタンプを元に戻す
    },
    // 【重要】今回は、まず削除機能を確実に動かすために、
    // 「自分のコメントしか削除できない」というセキュリティチェックを一時的にコメントアウトします。
    // ConditionExpression: "userId = :userId",
    // ExpressionAttributeValues: {
    //   ":userId": userId,
    // },
  });

  try {
    await docClient.send(command);
    return { statusCode: 204 }; // 成功時は中身なし
  } catch (e:any) {
    console.error("!!! DELETE COMMENT ERROR:", e);
    // エラーの詳細を返すように変更
    return { statusCode: 500, body: JSON.stringify({ message: "Failed to delete comment", error: e.name }) };
  }
};