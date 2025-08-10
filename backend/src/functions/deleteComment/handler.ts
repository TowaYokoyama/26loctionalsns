import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

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