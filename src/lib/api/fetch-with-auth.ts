export {
  fetchCmTrainingApiWithBearer as fetchTrainingApiWithBearer,
} from "./client";

/**
 * Call training API routes with Bearer auth only (`Authorization: Bearer <access_token>`).
 * Obtain `access_token` via `auth0.getAccessToken({ audience })` in Route Handlers or middleware.
 */
