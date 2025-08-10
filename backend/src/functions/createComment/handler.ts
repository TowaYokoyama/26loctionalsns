import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "src/libs/dynamodbClient";


export const main = async (event: any) => {
  const { postId } = event.pathParameters;
  // authorUsernameとauthorAvatarを追加で受け取る
  const { userId, username, text, authorUsername, authorAvatar } = JSON.parse(event.body);

  const newComment = {
    postId,
    createdAt: new Date().toISOString(),
    userId,
    username,
    text,
    authorUsername,
    authorAvatar,   
  };

  const command = new PutCommand({
    TableName: process.env.COMMENTS_TABLE_NAME,
    Item: newComment,
  });

  await docClient.send(command);
  return { statusCode: 201, body: JSON.stringify(newComment) };
};