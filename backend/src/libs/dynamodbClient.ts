import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// このシンプルな書き方が、PCに設定されたAWSの認証情報を使って、
// 自動で本物のAWSクラウドに接続しにいきます。
const client = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(client);