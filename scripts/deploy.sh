#!/usr/bin/env bash
# Deploy the serverless API, write the generated web configuration, then publish the Next.js app.
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

STACK_NAME="${MEDBRIDGE_STACK_NAME:-medbridge}"
AWS_REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-ap-south-1}}"
PROJECT_NAME="${MEDBRIDGE_PROJECT_NAME:-medbridge}"
STAGE="${MEDBRIDGE_STAGE:-prod}"
ALLOWED_ORIGIN="${MEDBRIDGE_ALLOWED_ORIGIN:-*}"
BEDROCK_MODEL_ID="${MEDBRIDGE_BEDROCK_MODEL_ID:-anthropic.claude-3-5-sonnet-20241022-v2:0}"
MAX_IMAGE_BYTES="${MEDBRIDGE_MAX_IMAGE_BYTES:-7340032}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command '$1' was not found. See README.md for prerequisites." >&2
    exit 1
  fi
}

stack_output() {
  local output_key="$1"
  aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='${output_key}'].OutputValue | [0]" \
    --output text
}

require_command sam
require_command aws

cd "$BACKEND_DIR"
echo "Building MedBridge SAM application in $AWS_REGION…"
sam build --template-file template.yaml

confirm_flag="--no-confirm-changeset"
if [[ "${MEDBRIDGE_CONFIRM_CHANGES:-false}" == "true" ]]; then
  confirm_flag="--confirm-changeset"
fi

echo "Deploying CloudFormation stack '$STACK_NAME'…"
sam deploy \
  --config-file samconfig.toml \
  --config-env default \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  "$confirm_flag" \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    "ProjectName=$PROJECT_NAME" \
    "Stage=$STAGE" \
    "AllowedOrigin=$ALLOWED_ORIGIN" \
    "BedrockModelId=$BEDROCK_MODEL_ID" \
    "MaxImageBytes=$MAX_IMAGE_BYTES"

API_URL="$(stack_output ApiUrl)"
USER_POOL_ID="$(stack_output UserPoolId)"
CLIENT_ID="$(stack_output ClientId)"
BUCKET_NAME="$(stack_output BucketName)"

if [[ -z "$API_URL" || "$API_URL" == "None" || -z "$USER_POOL_ID" || "$USER_POOL_ID" == "None" || -z "$CLIENT_ID" || "$CLIENT_ID" == "None" ]]; then
  echo "CloudFormation did not return the required MedBridge outputs." >&2
  exit 1
fi

cat > "$FRONTEND_DIR/.env.production" <<EOF
NEXT_PUBLIC_AWS_REGION=$AWS_REGION
NEXT_PUBLIC_API_URL=$API_URL
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=$CLIENT_ID
EOF
chmod 600 "$FRONTEND_DIR/.env.production"

echo "SAM deployment complete. Private bucket: $BUCKET_NAME"
echo "Wrote frontend/.env.production from CloudFormation outputs."

cd "$FRONTEND_DIR"
if command -v amplify >/dev/null 2>&1; then
  amplify publish
else
  npx --yes @aws-amplify/cli@latest publish
fi
