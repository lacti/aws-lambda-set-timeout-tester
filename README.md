# `AWS Lambda` with `setTimeout`

What does `setTimeout` work on `AWS Lambda` when we don't wait until it is resolving? Let's test it briefly!

## Walkthrough

I use [Serverless framework](https://serverless.com) to test it.

```bash
sls create --name test-set-timeout --template aws-nodejs-typescript
```

And add some codes to test `setTimeout` like this.

```typescript
const sleep = (millis: number) =>
  new Promise<void>(resolve => setTimeout(resolve, millis));

export const helloWithPromise: APIGatewayProxyHandler = async () => {
  console.log(`Before setTimeout`);
  sleep(3000).then(() => {
    console.log(`setTimeout is called!`);
  });
  console.log(`After timeout`);
  return {
    statusCode: 200,
    body: `Hi, there!`
  };
};
```

Then deploy it with `sls deploy` and call this API.

```bash
curl -v https://API-DOMAIN/STAGE/hello
sleep 1
curl -v https://API-DOMAIN/STAGE/hello
sleep 1
curl -v https://API-DOMAIN/STAGE/hello
sleep 1
curl -v https://API-DOMAIN/STAGE/hello
```

Let's check the logs for details!

```bash
$ sls logs -f hello

START RequestId: GUID Version: $LATEST
TIMESTAMP  GUID  INFO  Before setTimeout
TIMESTAMP  GUID  INFO  After timeout
END RequestId: GUID
REPORT RequestId: GUID  Duration: X.XX ms   Billed Duration: X00 ms    Memory Size: 1024 MB    Max Memory Used: XX MB

START RequestId: GUID Version: $LATEST
TIMESTAMP  GUID  INFO  Before setTimeout
TIMESTAMP  GUID  INFO  After timeout
END RequestId: GUID
REPORT RequestId: GUID  Duration: X.XX ms   Billed Duration: X00 ms    Memory Size: 1024 MB    Max Memory Used: XX MB

START RequestId: GUID Version: $LATEST
TIMESTAMP  GUID  INFO  Before setTimeout
TIMESTAMP  GUID  INFO  After timeout
END RequestId: GUID
REPORT RequestId: GUID  Duration: X.XX ms   Billed Duration: X00 ms    Memory Size: 1024 MB    Max Memory Used: XX MB

START RequestId: GUID Version: $LATEST
TIMESTAMP  GUID  INFO  setTimeout is called!
TIMESTAMP  GUID  INFO  Before setTimeout
TIMESTAMP  GUID  INFO  After timeout
END RequestId: GUID
REPORT RequestId: GUID  Duration: X.XX ms   Billed Duration: X00 ms    Memory Size: 1024 MB    Max Memory Used: XX MB
```

The callback is called the only last execution. What's happened? We can inspect with more detail logs.

```typescript
let staticIndex = 0;
const now = () => new Date().toISOString();

export const hello: APIGatewayProxyHandler = async () => {
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
```

Run again!

```bash
$ curl https://API-DOMAIN/STAGE/hello; echo; \
  sleep 1; \
  curl https://API-DOMAIN/STAGE/hello; echo; \
  sleep 1; \
  curl https://API-DOMAIN/STAGE/hello; echo; \
  sleep 1; \
  curl https://API-DOMAIN/STAGE/hello; echo; \
  sleep 3; \
  curl https://API-DOMAIN/STAGE/hello; echo

[1][2019-08-12T13:57:57.870Z] requested at [2019-08-12T13:57:57.869Z]
[2][2019-08-12T13:57:58.964Z] requested at [2019-08-12T13:57:58.964Z]
[3][2019-08-12T13:58:00.068Z] requested at [2019-08-12T13:58:00.068Z]
[4][2019-08-12T13:58:01.132Z] requested at [2019-08-12T13:58:01.132Z]
[5][2019-08-12T13:58:04.216Z] requested at [2019-08-12T13:58:04.216Z]

$ sls logs -f hello
START RequestId: GUID: $LATEST
2019-08-12 22:57:57.869 (+09:00)    GUID    INFO    [1][2019-08-12T13:57:57.868Z] Before requesting a scheduled job.
2019-08-12 22:57:57.870 (+09:00)    GUID    INFO    [1][2019-08-12T13:57:57.869Z] After requesting a scheduled job.
END RequestId: GUID
REPORT RequestId: GUID  Duration: X.XX ms   Billed Duration: X00 ms    Memory Size: 1024 MB    Max Memory Used: XX MB

START RequestId: GUID: $LATEST
2019-08-12 22:57:58.964 (+09:00)    GUID    INFO    [2][2019-08-12T13:57:58.964Z] Before requesting a scheduled job.
2019-08-12 22:57:58.964 (+09:00)    GUID    INFO    [2][2019-08-12T13:57:58.964Z] After requesting a scheduled job.
END RequestId: GUID
REPORT RequestId: GUID  Duration: X.XX ms   Billed Duration: X00 ms    Memory Size: 1024 MB    Max Memory Used: XX MB

START RequestId: GUID: $LATEST
2019-08-12 22:58:00.068 (+09:00)    GUID    INFO    [3][2019-08-12T13:58:00.068Z] Before requesting a scheduled job.
2019-08-12 22:58:00.068 (+09:00)    GUID    INFO    [3][2019-08-12T13:58:00.068Z] After requesting a scheduled job.
END RequestId: GUID
REPORT RequestId: GUID  Duration: X.XX ms   Billed Duration: X00 ms    Memory Size: 1024 MB    Max Memory Used: XX MB

START RequestId: GUID: $LATEST
2019-08-12 22:58:01.131 (+09:00)    GUID    INFO    [1][2019-08-12T13:58:01.131Z] This is requested from [2019-08-12T13:57:57.869Z]
2019-08-12 22:58:01.132 (+09:00)    GUID    INFO    [4][2019-08-12T13:58:01.132Z] Before requesting a scheduled job.
2019-08-12 22:58:01.132 (+09:00)    GUID    INFO    [4][2019-08-12T13:58:01.132Z] After requesting a scheduled job.
END RequestId: GUID
REPORT RequestId: GUID  Duration: X.XX ms   Billed Duration: X00 ms    Memory Size: 1024 MB    Max Memory Used: XX MB

START RequestId: GUID: $LATEST
2019-08-12 22:58:04.215 (+09:00)    GUID    INFO    [2][2019-08-12T13:58:04.215Z] This is requested from [2019-08-12T13:57:58.964Z]
2019-08-12 22:58:04.215 (+09:00)    GUID    INFO    [3][2019-08-12T13:58:04.215Z] This is requested from [2019-08-12T13:58:00.068Z]
2019-08-12 22:58:04.215 (+09:00)    GUID    INFO    [4][2019-08-12T13:58:04.215Z] This is requested from [2019-08-12T13:58:01.132Z]
2019-08-12 22:58:04.216 (+09:00)    GUID    INFO    [5][2019-08-12T13:58:04.216Z] Before requesting a scheduled job.
2019-08-12 22:58:04.216 (+09:00)    GUID    INFO    [5][2019-08-12T13:58:04.216Z] After requesting a scheduled job.
END RequestId: GUID
REPORT RequestId: GUID  Duration: X.XX ms   Billed Duration: X00 ms    Memory Size: 1024 MB    Max Memory Used: XX MB
```

The value of `staticIndex` can be preserved between each of executions because [a Lambda container would be reused](https://aws.amazon.com/blogs/compute/container-reuse-in-lambda/). This is the key. We can find the **first resolving** of `setTimeout` at the **fourth execution** that is executed after _3 seconds_ from the first execution and other resolvings at the **fifth execution** that is executed after _6 seconds_ from the first execution. That is, `setTimeout` cannot be resolved in the execution that requests `setTimeout` because it is already finished due to response a result by `function return`. But a container, that is `NodeJS` runtime, can be reused, so the callback of `setTimeout` that is requested from the previous execution can be resolved at the next execution which is executed after the time to resolve.

It is the very fun fact, some objects which can be preserved at NodeJS runtime such as the callback of `setTimeout` and `Promise` can be preserved between the Lambda executions like global variables. Of course, this rule can be break if a Lambda execution would not be reused because there are concurrent executions or very rarely called executions.
