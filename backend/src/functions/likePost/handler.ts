import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const main = async (event:any) => {
  const { postId } = event.pathParameters;

  const command = new UpdateCommand({
    TableName: process.env.POSTS_TABLE_NAME,
    Key: { postId },
    // 'likes'という属性を1増やす。もし属性がなければ、0から始めて1にする。
    UpdateExpression: "SET likes = if_not_exists(likes, :start) + :inc",
    ExpressionAttributeValues: {
      ":inc": 1,
      ":start": 0,
    },
    ReturnValues: "UPDATED_NEW", // 更新後の新しい値を返す
  });

  const result = await docClient.send(command);

  return {
    statusCode: 200,
    body: JSON.stringify(result.Attributes),
  };
};