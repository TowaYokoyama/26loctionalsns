import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";


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


export const main = async (event: any) => {
  const userId = event.queryStringParameters?.userId;

  const command = new ScanCommand({
    TableName: process.env.POSTS_TABLE_NAME,
  });

  const result = await docClient.send(command);
  const posts: Record<string, any>[] = result.Items || [];

  const bucketName = process.env.POSTS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  
  const postsWithDetails = posts.map(post => {
    const likedByArray = post.likedBy ? Array.from(post.likedBy) : [];
    
    return {
      ...post,
      // imageNames配列から、複数のimageUrlを生成する
      imageUrls: (post.imageNames && Array.isArray(post.imageNames))
        ? post.imageNames.map((imageName: string) => // ← ここで型を string と指定
            `https://${bucketName}.s3.${region}.amazonaws.com/${imageName}`
          )
        : [],
      likes: likedByArray.length,
      isLikedByCurrentUser: userId ? likedByArray.includes(userId) : false,
    };
  });

  return {
    statusCode: 200,
    body: JSON.stringify(postsWithDetails),
  };
};