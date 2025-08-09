import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "src/libs/dynamodbClient";


export const main = async (event: any) => {
  const { postId } = event.pathParameters;

  const command = new QueryCommand({
    TableName: process.env.COMMENTS_TABLE_NAME,
    KeyConditionExpression: "postId = :postId",
    ExpressionAttributeValues: {
      ":postId": postId,
    },
  });

  const result = await docClient.send(command);

  return {
    statusCode: 200,
    body: JSON.stringify(result.Items),
  };
};