export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'posts', // GET /posts で投稿一覧を取得
        cors: true,
      },
    },
  ],
};