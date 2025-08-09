import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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




export const main = async (event: any) => {
  const { postId } = event.pathParameters;
  const { userId } = JSON.parse(event.body);

  const deleteCommand = new UpdateCommand({
    TableName: process.env.POSTS_TABLE_NAME,
    Key: { postId },
    UpdateExpression: "DELETE likedBy :userId",
    ConditionExpression: "contains(likedBy, :userId)",
    ExpressionAttributeValues: { ":userId": new Set([userId]) },
    ReturnValues: "ALL_NEW",
  });

  try {
    const result = await docClient.send(deleteCommand);
    const attributes = result.Attributes;
    if (attributes && attributes.likedBy) {
      attributes.likedBy = Array.from(attributes.likedBy as Set<string>);
    }
    return { statusCode: 200, body: JSON.stringify(attributes) };
  } catch (e: any) {
    if (e.name === 'ConditionalCheckFailedException') {
      const addCommand = new UpdateCommand({
        TableName: process.env.POSTS_TABLE_NAME,
        Key: { postId },
        UpdateExpression: "ADD likedBy :userId",
        ExpressionAttributeValues: { ":userId": new Set([userId]) },
        ReturnValues: "ALL_NEW",
      });
      const result = await docClient.send(addCommand);
      const attributes = result.Attributes;
      if (attributes && attributes.likedBy) {
        attributes.likedBy = Array.from(attributes.likedBy as Set<string>);
      }
      return { statusCode: 200, body: JSON.stringify(attributes) };
    }
    throw e;
  }
};