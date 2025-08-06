import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const main = async () => {
  const command = new ScanCommand({
    TableName: process.env.POSTS_TABLE_NAME,
  });

  const result = await docClient.send(command);
  const posts: Record<string, any>[] = result.Items || [];

  // 画像の完全なURLを生成してフロントエンドに返す
  const bucketName = process.env.POSTS_S3_BUCKET;
  const region = process.env.AWS_REGION;
 const postsWithImageUrls = posts.map(post => {
    // imageNamesが存在し、配列であることを確認
    const imageUrls = (post.imageNames && Array.isArray(post.imageNames))
      ? post.imageNames.map(imageName => // ここで定義した 'imageName' を...
          `https://${bucketName}.s3.${region}.amazonaws.com/${imageName}` // ...ここで正しく使う
        )
      : []; // もしなければ空の配列を返す

    return {
      ...post,
      imageUrls: imageUrls, // プロパティ名を imageUrls (複数形) に変更
    };
  });

  return {
    statusCode: 200,
    body: JSON.stringify(postsWithImageUrls),
  };
};