import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

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
  : {}; // 本番環境では何もしない（デフォルトの動作）

const client = new DynamoDBClient(dynamoDbClientConfig);
export const docClient = DynamoDBDocumentClient.from(client);