import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const main = async (event: any) => {
  const { postId } = event.pathParameters;
  const { userId } = JSON.parse(event.body);

  // いいねを削除するためのコマンド
  const deleteCommand = new UpdateCommand({
    TableName: process.env.POSTS_TABLE_NAME,
    Key: { postId },
    // likedByセットからuserIdを削除する
    UpdateExpression: "DELETE likedBy :userId",
    // 条件: likedByセットにuserIdが含まれている場合のみ実行
    ConditionExpression: "contains(likedBy, :userId)",
    ExpressionAttributeValues: {
      ":userId": new Set([userId]),
    },
    ReturnValues: "ALL_NEW",
  });

  try {
    // まず「削除」を試みる
    const result = await docClient.send(deleteCommand);
    return { statusCode: 200, body: JSON.stringify(result.Attributes) };
  } catch (e:any) {
    // 削除に失敗した場合（＝まだいいねしていなかった場合）、「追加」を実行する
    if (e.name === 'ConditionalCheckFailedException') {
      const addCommand = new UpdateCommand({
        TableName: process.env.POSTS_TABLE_NAME,
        Key: { postId }, // コロンを修正
        // likedByセットにuserIdを追加する
        UpdateExpression: "ADD likedBy :userId",
        ExpressionAttributeValues: {
          ":userId": new Set([userId]),
        },
        ReturnValues: "ALL_NEW",
      });
      const result = await docClient.send(addCommand);
      return { statusCode: 200, body: JSON.stringify(result.Attributes) };
    }
    // その他のエラーはそのままスローする
    throw e;
  }
};