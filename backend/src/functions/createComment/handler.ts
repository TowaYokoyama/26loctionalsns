import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

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

const client = new DynamoDBClient(dynamoDbClientConfig);
const docClient = DynamoDBDocumentClient.from(client);
export const main = async (event:any) => {
  const { postId } = event.pathParameters;
  const { userId, username, text } = JSON.parse(event.body);

  const newComment = {
    postId,
    createdAt: new Date().toISOString(),
    userId,
    username,
    text,
  };

  const command = new PutCommand({
    TableName: process.env.COMMENTS_TABLE_NAME,
    Item: newComment,
  });

  await docClient.send(command);

  return {
    statusCode: 201,
    body: JSON.stringify(newComment),
  };
};