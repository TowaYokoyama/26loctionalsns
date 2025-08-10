import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "src/libs/dynamodbClient";


// S3 URLを組み立てるヘルパー関数
const getS3ImageUrl = (imageName?: string | null): string => {
  if (!imageName) return 'https://placehold.jp/150x150.png';
  const bucketName = process.env.POSTS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  return `https://${bucketName}.s3.${region}.amazonaws.com/${imageName}`;
};

export const main = async (event: any) => {
  const { postId } = event.pathParameters;

  const command = new QueryCommand({
    TableName: process.env.COMMENTS_TABLE_NAME,
    KeyConditionExpression: "postId = :postId",
    ExpressionAttributeValues: { ":postId": postId },
  });

  const result = await docClient.send(command);
  const comments: Record<string, any>[] = result.Items || [];

  const commentsWithDetails = comments.map(comment => ({
    ...comment,
    // ▼▼▼ コメントに保存された情報を元に、表示用のURLなどを組み立てる ▼▼▼
    username: comment.authorUsername || comment.userId,
    userAvatarUrl: getS3ImageUrl(comment.authorAvatar),
  }));

  return {
    statusCode: 200,
    body: JSON.stringify(commentsWithDetails),
  };
};