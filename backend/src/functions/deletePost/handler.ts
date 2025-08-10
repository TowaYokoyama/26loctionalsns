import { DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { docClient } from "src/libs/dynamodbClient";


// S3クライアントを、常に本物のAWSに接続するようにシンプルに初期化
const s3Client = new S3Client({});

export const main = async (event: any) => {
  const { postId } = event.pathParameters;

  try {
    // 1. DynamoDBから投稿情報を取得して、画像ファイル名（複数）を得る
    const getCommand = new GetCommand({
      TableName: process.env.POSTS_TABLE_NAME,
      Key: { postId },
    });
    const { Item } = await docClient.send(getCommand);

    // 2. もし画像があれば、S3から全ての画像ファイルを削除
    if (Item && Item.imageNames && Array.isArray(Item.imageNames)) {
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
      statusCode: 204, // 成功
    };

  } catch(e) {
    console.error("!!! DELETE POST ERROR:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to delete post" })
    };
  }
};