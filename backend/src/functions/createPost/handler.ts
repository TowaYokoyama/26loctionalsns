import { PutCommand } from "@aws-sdk/lib-dynamodb";

import { randomUUID } from "crypto";
import { docClient } from "src/libs/dynamodbClient";

export const main = async (event: any) => {
  const data = JSON.parse(event.body);

  const command = new PutCommand({
    TableName: process.env.POSTS_TABLE_NAME,
    Item: {
      postId: randomUUID(),
      caption: data.caption,
      imageNames: data.imageNames,
      location: data.location,
      userId: data.userId,
      // ▼▼▼ 投稿した瞬間のユーザー情報を追加 ▼▼▼
      authorUsername: data.authorUsername,
      authorAvatar: data.authorAvatar,
      createdAt: new Date().toISOString(),
    },
  });

  await docClient.send(command);
  return { statusCode: 201, body: JSON.stringify({ message: "Post created successfully" }) };
};