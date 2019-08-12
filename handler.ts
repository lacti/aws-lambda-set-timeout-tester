import { APIGatewayProxyHandler } from "aws-lambda";
import "source-map-support/register";

const sleep = (millis: number) =>
  new Promise<void>(resolve => setTimeout(resolve, millis));

let staticIndex = 0;
const now = () => new Date().toISOString();

export const helloWithPromise: APIGatewayProxyHandler = async () => {
  const capturedIndex = ++staticIndex;
  const prefix = () => `[${capturedIndex}][${now()}]`;

  console.log(prefix(), `Before requesting a scheduled job.`);
  const requested = now();
  sleep(3000)
    .then(() => {
      console.log(prefix(), `This is requested from [${requested}]`);
    })
    .catch(error => {
      console.error(prefix(), `Error after 3 seconds`, error);
    });
  console.log(prefix(), `After requesting a scheduled job.`);
  return {
    statusCode: 200,
    body: `${prefix()} requested at [${requested}]`
  };
};

export const helloWithoutPromise: APIGatewayProxyHandler = async () => {
  console.log(`[${now()}] No promise in here.`);
  return {
    statusCode: 200,
    body: "Hello from the handler without promise."
  };
};
