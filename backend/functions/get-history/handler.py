"""Return the authenticated MedBridge user's private report history and stored trends."""

from __future__ import annotations

import base64
import json
import logging
import os
from decimal import Decimal
from typing import Any

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import BotoCoreError, ClientError

LOGGER = logging.getLogger()
LOGGER.setLevel(os.getenv("LOG_LEVEL", "INFO"))

DYNAMODB = boto3.resource("dynamodb")
REPORTS_TABLE = DYNAMODB.Table(os.environ["REPORTS_TABLE"])


class ApiError(Exception):
    """An expected API error with a safe response message."""

    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def _json_default(value: Any) -> str:
    if isinstance(value, Decimal):
        return str(value)
    raise TypeError(f"Cannot serialize {type(value).__name__}")


def _origin_for(event: dict[str, Any]) -> str:
    configured = os.getenv("ALLOWED_ORIGIN", "*").strip()
    if configured == "*":
        return "*"
    headers = event.get("headers") or {}
    origin = headers.get("origin") or headers.get("Origin") or ""
    allowed_origins = [item.strip() for item in configured.split(",") if item.strip()]
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
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Cache-Control": "no-store",
        },
        "body": json.dumps(body, ensure_ascii=False, separators=(",", ":"), default=_json_default),
    }


def _user_id(event: dict[str, Any]) -> str:
    authorizer = (event.get("requestContext") or {}).get("authorizer") or {}
    claims = authorizer.get("claims") or (authorizer.get("jwt") or {}).get("claims") or {}
    user_id = claims.get("sub")
    if not isinstance(user_id, str) or not user_id:
        raise ApiError(401, "Your session could not be verified. Please sign in again.")
    return user_id


def _query_parameters(event: dict[str, Any]) -> dict[str, str]:
    raw = event.get("queryStringParameters") or {}
    return {str(key): str(value) for key, value in raw.items() if value is not None}


def _page_size(parameters: dict[str, str]) -> int:
    raw_limit = parameters.get("limit", "20")
    try:
        limit = int(raw_limit)
    except ValueError as error:
        raise ApiError(400, "The history limit must be a whole number.") from error
    if not 1 <= limit <= 50:
        raise ApiError(400, "The history limit must be between 1 and 50.")
    return limit


def _decode_next_token(token: str | None, user_id: str) -> dict[str, str] | None:
    if not token:
        return None
    try:
        padded = token + "=" * (-len(token) % 4)
        decoded = base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8")
        key = json.loads(decoded)
    except (ValueError, UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ApiError(400, "The history page token is invalid.") from error
    if not isinstance(key, dict) or key.get("userId") != user_id or not isinstance(key.get("reportId"), str):
        raise ApiError(400, "The history page token is invalid.")
    return {"userId": user_id, "reportId": key["reportId"]}


def _encode_next_token(key: dict[str, Any] | None) -> str | None:
    if not key:
        return None
    compact = json.dumps({"userId": key["userId"], "reportId": key["reportId"]}, separators=(",", ":"))
    return base64.urlsafe_b64encode(compact.encode("utf-8")).decode("ascii").rstrip("=")


def _plain_text(value: Any, fallback: str = "") -> str:
    if value is None or isinstance(value, (dict, list)):
        return fallback
    text = str(value).replace("\x00", " ").strip()
    return text if text else fallback


def _history_results(analysis: dict[str, Any]) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []
    source = analysis.get("results") if isinstance(analysis.get("results"), list) else []
    for result in source[:120]:
        if not isinstance(result, dict):
            continue
        results.append(
            {
                "test_name": _plain_text(result.get("test_name"), "Unnamed test"),
                "value": _plain_text(result.get("value"), "Not clearly shown"),
                "unit": _plain_text(result.get("unit"), "Not found"),
                "reference_range": _plain_text(result.get("reference_range"), "Not found"),
                "status": _plain_text(result.get("status"), "BORDERLINE"),
            }
        )
    return results


def _history_trends(analysis: dict[str, Any]) -> list[dict[str, str]]:
    trends: list[dict[str, str]] = []
    source = analysis.get("trends") if isinstance(analysis.get("trends"), list) else []
    for trend in source[:15]:
        if not isinstance(trend, dict):
            continue
        trends.append(
            {
                "test_name": _plain_text(trend.get("test_name"), "Test"),
                "previous_value": _plain_text(trend.get("previous_value"), "Not found"),
                "current_value": _plain_text(trend.get("current_value"), "Not found"),
                "unit": _plain_text(trend.get("unit"), "Not found"),
                "previous_report_date": _plain_text(trend.get("previous_report_date"), "Previous report"),
                "change": _plain_text(trend.get("change"), "Not found"),
                "direction": _plain_text(trend.get("direction"), "UNCHANGED"),
                "message": _plain_text(trend.get("message"), "A previous value is available for comparison."),
            }
        )
    return trends


def _history_item(item: dict[str, Any]) -> dict[str, Any]:
    analysis = item.get("analysis") if isinstance(item.get("analysis"), dict) else {}
    patient_info = analysis.get("patient_info") if isinstance(analysis.get("patient_info"), dict) else {}
    return {
        "reportId": _plain_text(item.get("reportId")),
        "status": _plain_text(item.get("status"), "UPLOADED"),
        "createdAt": _plain_text(item.get("createdAt")),
        "completedAt": _plain_text(item.get("completedAt")),
        "fileName": _plain_text(item.get("fileName"), "Lab report"),
        "language": _plain_text(item.get("language"), "en"),
        "urgency": _plain_text(item.get("urgency") or analysis.get("urgency"), "ROUTINE"),
        "patientInfo": {
            "name": _plain_text(patient_info.get("name"), "Not found"),
            "age": _plain_text(patient_info.get("age"), "Not found"),
            "sex": _plain_text(patient_info.get("sex"), "Not found"),
            "lab_name": _plain_text(patient_info.get("lab_name"), "Not found"),
            "report_date": _plain_text(patient_info.get("report_date"), "Not found"),
        },
        "summary": _plain_text(analysis.get("summary"), "Analysis has not been completed yet."),
        "results": _history_results(analysis),
        "trends": _history_trends(analysis),
    }


def lambda_handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    """Query only the caller's partition and return a paginated, non-image history view."""
    try:
        user_id = _user_id(event)
        parameters = _query_parameters(event)
        limit = _page_size(parameters)
        start_key = _decode_next_token(parameters.get("nextToken"), user_id)

        query_arguments: dict[str, Any] = {
            "KeyConditionExpression": Key("userId").eq(user_id),
            "ScanIndexForward": False,
            "Limit": limit,
        }
        if start_key:
            query_arguments["ExclusiveStartKey"] = start_key
        response = REPORTS_TABLE.query(**query_arguments)
        reports = [_history_item(item) for item in response.get("Items", [])]
        next_token = _encode_next_token(response.get("LastEvaluatedKey"))

        LOGGER.info("Returned %s history records for authenticated user", len(reports))
        return _response(
            200,
            {"reports": reports, "nextToken": next_token, "count": len(reports)},
            event,
        )
    except ApiError as error:
        return _response(error.status_code, {"error": error.message}, event)
    except (ClientError, BotoCoreError) as error:
        error_code = error.response.get("Error", {}).get("Code", "AWS_ERROR") if isinstance(error, ClientError) else "AWS_ERROR"
        LOGGER.exception("History query failed with AWS error code=%s", error_code)
        return _response(502, {"error": "We could not load your report history. Please try again."}, event)
    except Exception:
        LOGGER.exception("Unexpected history failure")
        return _response(500, {"error": "Something went wrong while loading your history. Please try again."}, event)
