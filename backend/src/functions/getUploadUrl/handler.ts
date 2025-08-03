import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const client = new S3Client({ region: process.env.AWS_REGION });

export const main = async () => {
  const imageName = randomUUID(); // 画像ごとにユニークな名前を生成

  const command = new PutObjectCommand({
    Bucket: process.env.POSTS_S3_BUCKET,
    Key: imageName,
  });

  // 1時間だけ有効なアップロード専用URLを生成
  const url = await getSignedUrl(client, command, { expiresIn: 3600 });

  return {
    statusCode: 200,
    body: JSON.stringify({
      uploadUrl: url,
      imageName: imageName,
    }),
  };
};