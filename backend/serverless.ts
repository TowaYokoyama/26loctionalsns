import type { AWS } from '@serverless/typescript';

import hello from '@functions/hello';

import getUploadUrl from '@functions/getUploadUrl';
import getPosts from '@functions/getPosts';
import deletePost from '@functions/deletePost';
import likePost from '@functions/likePost';
import createPost from '@functions/createPost';

const serverlessConfiguration: AWS = {
  service: 'backend',
  frameworkVersion: '4',
  plugins: ['serverless-offline', 'serverless-dynamodb-local'],
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    region: 'ap-northeast-1',
    timeout: 30,
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan', 'dynamodb:DeleteItem', 'dynamodb:UpdateItem'],
            Resource: 'arn:aws:dynamodb:${aws:region}:${aws:accountId}:table/${self:provider.environment.POSTS_TABLE_NAME}',
          },
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:DeleteObject'],
            Resource: 'arn:aws:s3:::${self:provider.environment.POSTS_S3_BUCKET}/*',
          },
        ],
      },
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      POSTS_TABLE_NAME: '${self:service}-posts-${sls:stage}',
      POSTS_S3_BUCKET: '${self:service}-posts-images-${sls:stage}',
    },
  },
  functions: {
    hello,
    createPost,
    getUploadUrl,
    getPosts,
    deletePost,
    likePost,
  },
  package: { individually: true },
  custom: {
    dynamodb: {
      start: { port: 8000, inMemory: true, migrate: true },
      stages: 'dev',
    },
  },
  // vvvvvvvvvv ここから下が修正箇所 vvvvvvvvvv
  resources: {
    Resources: {
      // DynamoDBテーブル
      PostsTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:provider.environment.POSTS_TABLE_NAME}',
          AttributeDefinitions: [{ AttributeName: 'postId', AttributeType: 'S' }],
          KeySchema: [{ AttributeName: 'postId', KeyType: 'HASH' }],
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
      // S3バケットの公開ポリシー（ルール）
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
  // ^^^^^^^^^^ ここまでが修正箇所 ^^^^^^^^^^
};

module.exports = serverlessConfiguration;