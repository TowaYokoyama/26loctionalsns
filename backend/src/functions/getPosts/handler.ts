import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "src/libs/dynamodbClient";

// S3 URLを組み立てるヘルパー関数
const getS3ImageUrl = (imageName?: string | null): string => {
  if (!imageName) return 'https://placehold.jp/150x150.png';
  const bucketName = process.env.POSTS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  return `https://${bucketName}.s3.${region}.amazonaws.com/${imageName}`;
};

export const main = async (event: any) => {
  const userId = event.queryStringParameters?.userId;
  const command = new ScanCommand({ TableName: process.env.POSTS_TABLE_NAME });
  const result = await docClient.send(command);
  const posts: Record<string, any>[] = result.Items || [];
  
  const postsWithDetails = posts.map(post => {
    const likedBySet = post.likedBy || new Set();
    return {
      ...post,
      // ▼▼▼ 投稿に保存されたユーザー情報を元に、表示用のURLなどを組み立てる ▼▼▼
      username: post.authorUsername || post.userId,
      userAvatarUrl: getS3ImageUrl(post.authorAvatar),
      imageUrls: (post.imageNames || []).map((imageName: string) => 
        getS3ImageUrl(imageName) // ヘルパーを使うように変更
      ),
      likes: likedBySet.size,
      isLikedByCurrentUser: userId ? likedBySet.has(userId) : false,
    };
  });

  return { statusCode: 200, body: JSON.stringify(postsWithDetails) };
};