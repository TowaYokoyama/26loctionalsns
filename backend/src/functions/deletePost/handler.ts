import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

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


const s3Client = new S3Client({ region: process.env.AWS_REGION });

export const main = async (event:any) => {
  const { postId } = event.pathParameters;

  // 1. まずDynamoDBから投稿情報を取得して、画像ファイル名を得る
  const getCommand = new GetCommand({
    TableName: process.env.POSTS_TABLE_NAME,
    Key: { postId },
  });
  const { Item } = await docClient.send(getCommand);

  if (Item && Item.imageName) {
    // 2. S3から画像ファイルを削除
    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: process.env.POSTS_S3_BUCKET,
      Key: Item.imageName,
    });
    await s3Client.send(deleteObjectCommand);
  }

  // 3. DynamoDBから投稿情報を削除
  const deleteCommand = new DeleteCommand({
    TableName: process.env.POSTS_TABLE_NAME,
    Key: { postId },
  });
  await docClient.send(deleteCommand);

  return {
    statusCode: 204, // 204 No Content: 削除成功
  };
};