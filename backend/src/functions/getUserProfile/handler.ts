import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "src/libs/dynamodbClient";


export const main = async (event:any) => {
  const { userId } = event.pathParameters;

  const command = new GetCommand({
    TableName: process.env.USERS_TABLE_NAME,
    Key: { userId },
  });

  const { Item } = await docClient.send(command);

  if (!Item) {
    return { statusCode: 404, body: JSON.stringify({ message: 'User not found' }) };
  }
  return { statusCode: 200, body: JSON.stringify(Item) };
};