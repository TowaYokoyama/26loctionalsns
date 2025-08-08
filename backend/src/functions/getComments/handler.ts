import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

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

  const command = new QueryCommand({
    TableName: process.env.COMMENTS_TABLE_NAME,
    KeyConditionExpression: "postId = :postId",
    ExpressionAttributeValues: {
      ":postId": postId,
    },
  });

  const result = await docClient.send(command);

  return {
    statusCode: 200,
    body: JSON.stringify(result.Items),
  };
};