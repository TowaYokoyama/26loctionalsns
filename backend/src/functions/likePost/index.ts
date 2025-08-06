export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  events: [
    {
      http: {
        method: 'patch', // PATCHは部分的な更新を表す
        path: 'posts/{postId}/like',
        cors: true,
      },
    },
  ],
};