import { Amplify } from "aws-amplify";

let hasConfiguredAmplify = false;

function readEnvironment(name: "NEXT_PUBLIC_AWS_REGION" | "NEXT_PUBLIC_COGNITO_USER_POOL_ID" | "NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID") {
  // Keep these lookups explicit so Next.js inlines the public build-time values in the browser bundle.
  const values = {
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION?.trim() ?? "",
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID?.trim() ?? "",
    NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID?.trim() ?? "",
  };
  return values[name];
}

export function isAuthConfigured(): boolean {
  return Boolean(
    readEnvironment("NEXT_PUBLIC_AWS_REGION") &&
      readEnvironment("NEXT_PUBLIC_COGNITO_USER_POOL_ID") &&
      readEnvironment("NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID"),
  );
}

export function configureAmplify(): boolean {
  if (hasConfiguredAmplify) {
    return true;
  }
  if (!isAuthConfigured()) {
    return false;
  }

  Amplify.configure(
    {
      Auth: {
        Cognito: {
          userPoolId: readEnvironment("NEXT_PUBLIC_COGNITO_USER_POOL_ID"),
          userPoolClientId: readEnvironment("NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID"),
          loginWith: {
            email: true,
          },
        },
      },
    },
    { ssr: true },
  );
  hasConfiguredAmplify = true;
  return true;
}

export function authConfigurationMessage(): string {
  return "Authentication is not configured yet. Add the Cognito values from the SAM stack outputs to your frontend environment.";
}
