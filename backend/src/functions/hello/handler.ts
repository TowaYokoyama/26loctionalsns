export const main = async (event:any) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello from the hello function!`,
      input: event,
    }),
  };
};