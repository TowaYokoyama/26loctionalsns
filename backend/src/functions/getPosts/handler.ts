import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const main = async () => {
  const command = new ScanCommand({
    TableName: process.env.POSTS_TABLE_NAME,
  });

  const result = await docClient.send(command);
  const posts = result.Items;

  // 画像の完全なURLを生成してフロントエンドに返す
  const bucketName = process.env.POSTS_S3_BUCKET;
  const region = process.env.AWS_REGION;

  const postsWithImageUrls = posts.map(post => ({
      ...post,
      // S3の画像URLを組み立てる
      imageUrl: `https://${bucketName}.s3.${region}.amazonaws.com/${post.imageName}`
  }));

  return {
    statusCode: 200,
    body: JSON.stringify(postsWithImageUrls),
  };
};