import type { AWS } from '@serverless/typescript';

// 作成した関数をインポート
import hello from '@functions/hello';
import crreatePost from '@functions/crreatePost';


const serverlessConfiguration: AWS = {
  service: 'backend',
  frameworkVersion: '4',
  plugins: [
    'serverless-offline',
    'serverless-dynamodb-local', // 追加
  ],
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x', // Node.jsのバージョンを更新
     region: 'ap-northeast-1', // 東京リージョンを追加
    // ↓↓↓ Lambda関数がDynamoDBを操作する権限を追加
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:Query',
            ],
            Resource: 'arn:aws:dynamodb:${opt:region, self:provider.region}:${aws:accountId}:table/${self:provider.environment.POSTS_TABLE_NAME}',
          },
        ],
      },
    },
    // ↓↓↓ 環境変数を追加
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      POSTS_TABLE_NAME: '${self:service}-posts-${sls:stage}',
    },
  },
  functions: { 
    hello,
    crreatePost, // 作成した関数を登録
  },
  package: { individually: true },
  // ↓↓↓ ローカルDBの設定を追加
  custom: {
    dynamodb: {
      start: {
        port: 8000,
        inMemory: true,
        migrate: true,
      },
      stages: 'dev',
    },
  },
  // ↓↓↓ データベース（テーブル）の定義を追加
  resources: {
    Resources: {
      PostsTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.POSTS_TABLE_NAME}',
          AttributeDefinitions: [
            { AttributeName: 'postId', AttributeType: 'S' },
          ],
          KeySchema: [
            { AttributeName: 'postId', KeyType: 'HASH' },
          ],
          BillingMode: 'PAY_PER_REQUEST',
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;