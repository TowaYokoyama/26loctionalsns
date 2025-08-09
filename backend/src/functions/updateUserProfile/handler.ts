import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "src/libs/dynamodbClient";


export const main = async (event:any) => {
  const { userId } = event.pathParameters;
  const { username, avatarImageName } = JSON.parse(event.body);

  const command = new PutCommand({
    TableName: process.env.USERS_TABLE_NAME,
    Item: {
      userId,
      username,
      avatarImageName,
    },
  });

  await docClient.send(command);

  return { statusCode: 200, body: JSON.stringify({ message: "Profile updated" }) };
};