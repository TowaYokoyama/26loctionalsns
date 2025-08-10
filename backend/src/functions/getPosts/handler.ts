import { ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
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
  const category = event.queryStringParameters?.category;

  let command;
  if(category){
     command = new QueryCommand({
      TableName: process.env.POSTS_TABLE_NAME,
      IndexName: 'CategoryIndex', // GSIを指定
      KeyConditionExpression: "category = :category",
      ExpressionAttributeValues: { ":category": category },
    });
  }else {
     command = new ScanCommand({ TableName: process.env.POSTS_TABLE_NAME });
  }

  const result = await docClient.send(command);
  // 1. まず全ての投稿を取得
  const scanCommand = new ScanCommand({ TableName: process.env.POSTS_TABLE_NAME });
  const scanResult = await docClient.send(scanCommand);
  const posts: Record<string, any>[] = scanResult.Items || [];

  // 2. 各投稿のコメント数を並行して取得
  const commentCountPromises = posts.map(post => {
    const queryCommand = new QueryCommand({
      TableName: process.env.COMMENTS_TABLE_NAME,
      KeyConditionExpression: "postId = :postId",
      ExpressionAttributeValues: { ":postId": post.postId },
      Select: "COUNT" // コメントのアイテムそのものではなく、数だけを取得
    });
    return docClient.send(queryCommand);
  });
  
  const commentCountResults = await Promise.all(commentCountPromises);

  // 3. 投稿情報、プロフィール情報、コメント数を全部合体させて返す
  const postsWithDetails = posts.map((post, index) => {
    const likedBySet = post.likedBy || new Set();
    return {
      ...post,
      username: post.authorUsername || post.userId,
      userAvatarUrl: getS3ImageUrl(post.authorAvatar),
      imageUrls: (post.imageNames || []).map((imageName: string) => 
        getS3ImageUrl(imageName)
      ),
      likes: likedBySet.size,
      isLikedByCurrentUser: userId ? likedBySet.has(userId) : false,
      commentCount: commentCountResults[index].Count || 0, // ▼▼▼ コメント数を追加 ▼▼▼
    };
  });

  return {
    statusCode: 200,
    body: JSON.stringify(postsWithDetails),
  };
};