import type { AWS } from '@serverless/typescript';

// 作成した関数をインポート
import hello from '@functions/hello';
import createPost from '@functions/createPost';
import getUploadUrl from '@functions/getUploadUrl';
import getPosts from '@functions/getPosts';
import deletePost from '@functions/deletePost';
import likePost from '@functions/likePost';
import createComment from '@functions/createComment';
import getComments from '@functions/getComments';
import deleteComment from '@functions/deleteComment';

// コメント用の関数をインポート

const serverlessConfiguration: AWS = {
  service: 'backend',
  frameworkVersion: '4',
  plugins: ['serverless-offline'],
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    region: 'ap-northeast-1',
    timeout: 30,
    iam: {
      role: {
        statements: [
          { // Postsテーブルへの権限
            Effect: 'Allow',
            Action: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan', 'dynamodb:DeleteItem', 'dynamodb:UpdateItem'],
            Resource: 'arn:aws:dynamodb:${aws:region}:${aws:accountId}:table/${self:provider.environment.POSTS_TABLE_NAME}',
          },
          { // S3バケットへの権限
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:DeleteObject'],
            Resource: 'arn:aws:s3:::${self:provider.environment.POSTS_S3_BUCKET}/*',
          },
          { // Commentsテーブルへの権限
            Effect: 'Allow',
            Action: ['dynamodb:PutItem', 'dynamodb:Query',  'dynamodb:DeleteItem'],
            Resource: 'arn:aws:dynamodb:${aws:region}:${aws:accountId}:table/${self:provider.environment.COMMENTS_TABLE_NAME}',
          },
        ],
      },
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      POSTS_TABLE_NAME: '${self:service}-posts-${sls:stage}',
      POSTS_S3_BUCKET: '${self:service}-posts-images-${sls:stage}',
      COMMENTS_TABLE_NAME: '${self:service}-comments-${sls:stage}',
    },
  },
  functions: {
    hello,
    createPost,
    getUploadUrl,
    getPosts,
    deletePost,
    likePost,
    createComment,
    getComments, 
    deleteComment,
  },
  package: { individually: true },
  resources: {
    Resources: {
      // DynamoDB Postsテーブル
      PostsTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.POSTS_TABLE_NAME}',
          AttributeDefinitions: [{ AttributeName: 'postId', AttributeType: 'S' }],
          KeySchema: [{ AttributeName: 'postId', KeyType: 'HASH' }],
          BillingMode: 'PAY_PER_REQUEST',
        },
      },
      // DynamoDB Commentsテーブル
      CommentsTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.COMMENTS_TABLE_NAME}',
          AttributeDefinitions: [
            { AttributeName: 'postId', AttributeType: 'S' },
            { AttributeName: 'createdAt', AttributeType: 'S' },
          ],
          KeySchema: [
            { AttributeName: 'postId', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' },
          ],
          BillingMode: 'PAY_PER_REQUEST',
        },
      },
      // S3バケット本体
      PostsS3Bucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: '${self:provider.environment.POSTS_S3_BUCKET}',
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: false,
            BlockPublicPolicy: false,
            IgnorePublicAcls: false,
            RestrictPublicBuckets: false,
          },
          CorsConfiguration: {
            CorsRules: [{
              AllowedOrigins: ['*'],
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
              MaxAge: 3000,
            }],
          },
        },
      },
      // S3バケットの公開ポリシー
      PostsS3BucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
          Bucket: { Ref: 'PostsS3Bucket' },
          PolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject'],
                Resource: 'arn:aws:s3:::${self:provider.environment.POSTS_S3_BUCKET}/*',
              },
            ],
          },
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;