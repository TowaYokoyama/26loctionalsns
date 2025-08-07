import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const main = async (event: any) => {
  // クエリパラメータからuserIdを取得（例: /posts?userId=xxx）
  const userId = event.queryStringParameters?.userId;

  const command = new ScanCommand({
    TableName: process.env.POSTS_TABLE_NAME,
  });

  const result = await docClient.send(command);
  const posts: Record<string, any>[] = result.Items || [];

  const bucketName = process.env.POSTS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  
  const postsWithDetails = posts.map(post => {
    // likedByが存在しない場合も考慮して、空のSetをデフォルト値にする
    const likedBy = post.likedBy || new Set();
    
    return {
      ...post,
      // imageNames配列から、複数のimageUrlを生成する
      imageUrls: (post.imageNames && Array.isArray(post.imageNames))
        ? post.imageNames.map(imageName => 
            `https://${bucketName}.s3.${region}.amazonaws.com/${imageName}`
          )
        : [], // もしなければ空の配列を返す
      likes: likedBy.size, // いいねの総数
      isLikedByCurrentUser: userId ? likedBy.has(userId) : false, // 自分がいいねしたか
    };
  });

  return {
    statusCode: 200,
    body: JSON.stringify(postsWithDetails),
  };
};