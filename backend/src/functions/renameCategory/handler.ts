import { ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "src/libs/dynamodbClient";

export const main = async (event:any) => {
  const { oldCategory, newCategory } = JSON.parse(event.body);

  if (!oldCategory || !newCategory) {
    return { statusCode: 400, body: JSON.stringify({ message: "古いカテゴリ名と新しいカテゴリ名が必要です。" }) };
  }

  try {
    // 1. 古いカテゴリを持つ投稿を全て検索
    const scanCommand = new ScanCommand({
      TableName: process.env.POSTS_TABLE_NAME,
      FilterExpression: "category = :oldCategory",
      ExpressionAttributeValues: { ":oldCategory": oldCategory },
    });
    const { Items } = await docClient.send(scanCommand);

    if (!Items || !Array.isArray(Items) || Items.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ message: "該当する投稿がありません。" }) };
    }

    // 2. 見つかった各投稿のcategoryを更新
    const updatePromises = Items.map(item => {
      const updateCommand = new UpdateCommand({
        TableName: process.env.POSTS_TABLE_NAME,
        Key: { postId: item.postId },
        UpdateExpression: "set category = :newCategory",
        ExpressionAttributeValues: { ":newCategory": newCategory },
      });
      return docClient.send(updateCommand);
    });

    await Promise.all(updatePromises);

    return { statusCode: 200, body: JSON.stringify({ message: `${Items.length}件の投稿を更新しました。` }) };
  } catch (error) {
    console.error("カテゴリの更新に失敗:", error);
    return { statusCode: 500, body: JSON.stringify({ message: "サーバーエラー" }) };
  }
};