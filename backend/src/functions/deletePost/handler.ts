import { DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { docClient } from "src/libs/dynamodbClient";


// S3クライアントも、ローカル開発環境を考慮して初期化する
const s3Client = new S3Client(
  process.env.IS_OFFLINE
    ? {
        forcePathStyle: true,
        credentials: {
          accessKeyId: 'S3RVER',
          secretAccessKey: 'S3RVER',
        },
        endpoint: 'http://localhost:4569', // serverless-s3-localのデフォルトポート
        region: 'ap-northeast-1',
      }
    : {}
);

export const main = async (event: any) => {
  const { postId } = event.pathParameters;

  // 1. DynamoDBから投稿情報を取得して、画像ファイル名（複数）を得る
  const getCommand = new GetCommand({
    TableName: process.env.POSTS_TABLE_NAME,
    Key: { postId },
  });
  const { Item } = await docClient.send(getCommand);

  if (Item && Item.imageNames && Array.isArray(Item.imageNames)) {
    // 2. S3から全ての画像ファイルを削除
    const deletePromises = Item.imageNames.map((imageName: string) => {
      const deleteObjectCommand = new DeleteObjectCommand({
        Bucket: process.env.POSTS_S3_BUCKET,
        Key: imageName,
      });
      return s3Client.send(deleteObjectCommand);
    });
    await Promise.all(deletePromises);
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