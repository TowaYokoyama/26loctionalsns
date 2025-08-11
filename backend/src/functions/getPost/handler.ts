import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "src/libs/dynamodbClient";


// S3 URLを組み立てるヘルパー関数 (getPostsからコピー)
const getS3ImageUrl = (imageName?: string | null): string => {
  if (!imageName) return 'https://placehold.jp/150x150.png';
  const bucketName = process.env.POSTS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  return `https://${bucketName}.s3.${region}.amazonaws.com/${imageName}`;
};

export const main = async (event: any) => {
  const { postId } = event.pathParameters;
  const userId = event.queryStringParameters?.userId;

  const command = new GetCommand({
    TableName: process.env.POSTS_TABLE_NAME,
    Key: { postId },
  });

  const { Item } = await docClient.send(command);

  if (!Item) {
    return { statusCode: 404, body: JSON.stringify({ message: 'Post not found' }) };
  }

  // getPostsと同じように、詳細情報をすべて付けて返す
  const likedBySet = Item.likedBy || new Set();
  const postWithDetails = {
    ...Item,
    username: Item.authorUsername || Item.userId,
    userAvatarUrl: getS3ImageUrl(Item.authorAvatar),
    imageUrls: (Item.imageNames || []).map((imageName: string) => getS3ImageUrl(imageName)),
    likes: likedBySet.size,
    isLikedByCurrentUser: userId ? likedBySet.has(userId) : false,
  };
  
  return {
    statusCode: 200,
    body: JSON.stringify(postWithDetails),
  };
};