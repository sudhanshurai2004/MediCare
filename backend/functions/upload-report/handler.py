"""Create a private MedBridge report record and upload a validated image to S3."""

from __future__ import annotations

import base64
import binascii
import json
import logging
import os
import re
import uuid
from datetime import datetime, timezone
from typing import Any

import boto3
from botocore.exceptions import BotoCoreError, ClientError

LOGGER = logging.getLogger()
LOGGER.setLevel(os.getenv("LOG_LEVEL", "INFO"))

S3 = boto3.client("s3")
DYNAMODB = boto3.resource("dynamodb")
REPORTS_TABLE = DYNAMODB.Table(os.environ["REPORTS_TABLE"])
REPORTS_BUCKET = os.environ["REPORTS_BUCKET"]
MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", "7340032"))

ALLOWED_TYPES = {
    "image/jpeg": ("jpg", b"\xff\xd8\xff"),
    "image/png": ("png", b"\x89PNG\r\n\x1a\n"),
}


class ApiError(Exception):
    """An expected error that can be shown safely to the API caller."""

    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def _origin_for(event: dict[str, Any]) -> str:
    configured = os.getenv("ALLOWED_ORIGIN", "*").strip()
    if configured == "*":
        return "*"

    headers = event.get("headers") or {}
    origin = headers.get("origin") or headers.get("Origin") or ""
    allowed_origins = [value.strip() for value in configured.split(",") if value.strip()]
    if origin in allowed_origins:
        return origin
    return allowed_origins[0] if allowed_origins else "null"


def _response(status_code: int, body: dict[str, Any], event: dict[str, Any]) -> dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": _origin_for(event),
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Cache-Control": "no-store",
        },
        "body": json.dumps(body, ensure_ascii=False, separators=(",", ":")),
    }


def _user_id(event: dict[str, Any]) -> str:
    authorizer = (event.get("requestContext") or {}).get("authorizer") or {}
    claims = authorizer.get("claims") or (authorizer.get("jwt") or {}).get("claims") or {}
    user_id = claims.get("sub")
    if not isinstance(user_id, str) or not user_id:
        raise ApiError(401, "Your session could not be verified. Please sign in again.")
    return user_id


def _request_json(event: dict[str, Any]) -> dict[str, Any]:
    body = event.get("body")
    if body is None:
        raise ApiError(400, "A JSON request body is required.")
    if isinstance(body, dict):
        return body
    if not isinstance(body, str):
        raise ApiError(400, "The request body is invalid.")

    try:
        if event.get("isBase64Encoded"):
            body = base64.b64decode(body).decode("utf-8")
        parsed = json.loads(body)
    except (UnicodeDecodeError, binascii.Error, json.JSONDecodeError) as error:
        raise ApiError(400, "The request body must be valid JSON.") from error

    if not isinstance(parsed, dict):
        raise ApiError(400, "The request body must be a JSON object.")
    return parsed


def _decode_image(payload: dict[str, Any]) -> tuple[bytes, str, str]:
    encoded = payload.get("imageBase64")
    declared_type = str(payload.get("contentType") or "").lower().strip()
    file_name = str(payload.get("fileName") or "lab-report")

    if declared_type == "image/jpg":
        declared_type = "image/jpeg"
    if declared_type not in ALLOWED_TYPES:
        raise ApiError(400, "Only JPG and PNG lab report images are supported.")
    if not isinstance(encoded, str) or not encoded.strip():
        raise ApiError(400, "Please choose a JPG or PNG image to upload.")

    compact = encoded.strip()
    if compact.startswith("data:"):
        _, separator, compact = compact.partition(",")
        if not separator:
            raise ApiError(400, "The image data URL is malformed.")
    compact = re.sub(r"\s+", "", compact)

    try:
        image_bytes = base64.b64decode(compact, validate=True)
    except (binascii.Error, ValueError) as error:
        raise ApiError(400, "The image data is not valid base64.") from error

    if not image_bytes:
        raise ApiError(400, "The uploaded image is empty.")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        limit_mb = max(1, MAX_IMAGE_BYTES // (1024 * 1024))
        raise ApiError(413, f"The image is too large. Please upload an image smaller than {limit_mb} MB.")

    extension, signature = ALLOWED_TYPES[declared_type]
    if not image_bytes.startswith(signature):
        raise ApiError(400, "The image content does not match the selected JPG or PNG type.")

    safe_stem = re.sub(r"[^A-Za-z0-9._-]+", "-", os.path.basename(file_name)).strip(".-")
    if not safe_stem:
        safe_stem = "lab-report"
    if not safe_stem.lower().endswith((".jpg", ".jpeg", ".png")):
        safe_stem = f"{safe_stem}.{extension}"
    return image_bytes, declared_type, safe_stem[:160]


def _timestamp() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    """Upload one authenticated user's private report image and create its metadata item."""
    uploaded_key: str | None = None
    try:
        user_id = _user_id(event)
        payload = _request_json(event)
        image_bytes, content_type, file_name = _decode_image(payload)

        created_at = _timestamp()
        report_id = f"{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex}"
        safe_user_id = re.sub(r"[^A-Za-z0-9_-]", "-", user_id)
        extension = "png" if content_type == "image/png" else "jpg"
        uploaded_key = f"private/{safe_user_id}/{report_id}/original.{extension}"

        S3.put_object(
            Bucket=REPORTS_BUCKET,
            Key=uploaded_key,
            Body=image_bytes,
            ContentType=content_type,
            ContentDisposition=f'attachment; filename="{file_name}"',
            ServerSideEncryption="AES256",
            Metadata={"report-id": report_id, "owner-id": safe_user_id},
        )

        item = {
            "userId": user_id,
            "reportId": report_id,
            "status": "UPLOADED",
            "fileName": file_name,
            "contentType": content_type,
            "imageBytes": len(image_bytes),
            "s3Key": uploaded_key,
            "createdAt": created_at,
            "updatedAt": created_at,
            "language": "en",
        }
        try:
            REPORTS_TABLE.put_item(
                Item=item,
                ConditionExpression="attribute_not_exists(userId) AND attribute_not_exists(reportId)",
            )
        except (ClientError, BotoCoreError):
            # Do not leave an orphaned health document behind when metadata cannot be created.
            S3.delete_object(Bucket=REPORTS_BUCKET, Key=uploaded_key)
            uploaded_key = None
            raise

        LOGGER.info("Created report record reportId=%s", report_id)
        return _response(
            201,
            {
                "reportId": report_id,
                "status": "UPLOADED",
                "createdAt": created_at,
                "message": "Report uploaded securely. It is ready for analysis.",
            },
            event,
        )
    except ApiError as error:
        return _response(error.status_code, {"error": error.message}, event)
    except (ClientError, BotoCoreError) as error:
        error_code = error.response.get("Error", {}).get("Code", "AWS_ERROR") if isinstance(error, ClientError) else "AWS_ERROR"
        LOGGER.exception("Upload failed with AWS error code=%s", error_code)
        return _response(502, {"error": "We could not securely save this report. Please try again."}, event)
    except Exception:
        LOGGER.exception("Unexpected upload failure")
        return _response(500, {"error": "Something went wrong while uploading the report. Please try again."}, event)
