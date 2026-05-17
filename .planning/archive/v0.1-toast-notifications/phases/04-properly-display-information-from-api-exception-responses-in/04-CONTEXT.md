# Phase 4: Properly display information from API exception responses in toast - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning
**Source:** Interactive scoping session

<domain>
## Phase Boundary

This phase enhances the existing error interceptor and notification system to fully leverage the backend's RFC 9457 ProblemDetail response structure. The backend sends rich error metadata (`errorCode`, `type` URI, `fieldErrors` array, `instance` URI) that Phase 3's implementation doesn't fully parse or display. This phase closes that gap.

### Backend Error Response Structure (RFC 9457)

The backend (`ApiExceptionHandler.java`) returns ProblemDetail with:
- `type`: URN string (e.g., `urn:chronoscope:error:validation-error`)
- `title`: Human-readable category (e.g., "Validation Failed", "Planning Failed")
- `detail`: Specific error message
- `status`: HTTP status code
- `instance`: Request URI
- `errorCode`: Stable enum string from `ApiErrorCode` (e.g., `VALIDATION_ERROR`, `INSUFFICIENT_SLOTS`)
- `fieldErrors` (validation only): Array of `{field, message}` objects

### Backend ApiErrorCode values:
- `API_NOT_IMPLEMENTED` → "Not Implemented"
- `INSUFFICIENT_SLOTS` → "Planning Failed"
- `RESOURCE_NOT_FOUND` → "Not Found"
- `VALIDATION_ERROR` → "Validation Failed"
- `INVALID_REQUEST` → "Invalid Request"
- `ACCESS_DENIED` → "Access Denied"
- `ACCOUNT_NOT_FOUND` → "Account Not Found"
- `INTERNAL_SERVER_ERROR` → "Internal Server Error"

### Current State (after Phase 3)

The error interceptor (`error.interceptor.ts`) already:
- Parses Blob and JSON error bodies
- Extracts `detail` and `title` from ProblemDetail
- Uses status-based title fallback
- Supports SKIP_ERROR_TOAST opt-out

But it does NOT:
- Read `errorCode` from `properties` bag
- Read `type` URI
- Read or display `fieldErrors` from `properties` bag
- Expose structured error metadata to callers

</domain>

<decisions>
## Implementation Decisions

### Error Code Mapping
- Use `errorCode` from ProblemDetail `properties` to provide user-friendly messages
- Messages should be synced with backend titles where reasonable
- Create a mapping from `ApiErrorCode` values to frontend display strings

### Field Errors Display
- Validation error toasts MUST show per-field errors (field name + message) inline
- Display inside the toast body below the main error message

### Error Metadata Exposure
- errorCode and type URI MUST be available to callers for programmatic error handling
- This means the ProblemDetail's structured data should be parsed and either stored or thrown in a way that callers can access

### Testing
- Minimal test coverage for the critical new parsing paths only
- No comprehensive test suite — cover errorCode mapping, fieldErrors parsing, and metadata exposure

### Agent's Discretion
- Implementation approach for exposing metadata (e.g., custom error class, enhanced HttpErrorResponse, or notification metadata)
- Exact UI layout of field errors in toast (list, bullet points, etc.)
- Whether to create a dedicated error model or extend existing ProblemDetail interface
- Error code map structure (enum, object map, function, etc.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend Exception Structure
- `C:\Users\T16408A\IdeaProjects\ChronoScope-backend\src\main\java\de\ni0\chronoscope\exception\ApiExceptionHandler.java` — Central exception mapper, createProblemDetail method, fieldErrors in validation handler
- `C:\Users\T16408A\IdeaProjects\ChronoScope-backend\src\main\java\de\ni0\chronoscope\exception\ApiErrorCode.java` — Stable error code enum with URN type generation

### Frontend Error Handling
- `src/app/interceptors/error.interceptor.ts` — Current error interceptor (to be enhanced)
- `src/app/interceptors/error.interceptor.spec.ts` — Current tests (to be extended)
- `src/api/models/problem-detail.ts` — Generated ProblemDetail interface

### Notification System
- `src/services/notification.service.ts` — NotificationService (toast API)
- `src/app/model/notification.model.ts` — Notification model

</canonical_refs>

<specifics>
## Specific Ideas

- The `properties` field in ProblemDetail is `{[key: string]: any}` — `errorCode` and `fieldErrors` live there
- Backend errorCode format: `VALIDATION_ERROR` → type URI: `urn:chronoscope:error:validation-error`
- `fieldErrors` is an array of `{field: string, message: string}` only present for `MethodArgumentNotValidException`
- Consider creating a `ChronoscopeError` type/class that wraps the parsed ProblemDetail with typed access to `errorCode`, `fieldErrors`, etc.

</specifics>

<deferred>
## Deferred Ideas

- i18n/translation of error messages — hardcoded English for now
- Error retry actions in toasts (e.g., "Retry" button on connection errors)
- Copy error details to clipboard

</deferred>

---

*Phase: 04-properly-display-information-from-api-exception-responses-in*
*Context gathered: 2026-05-17 via interactive scoping session*
