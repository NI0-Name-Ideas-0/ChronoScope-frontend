# only works if ChronoScope-frontend and ChronoScope-backend are saved to the same directory xD.

pnpm exec ng-openapi-gen --input ../ChronoScope-backend/openapi/openapi.yaml --output src/api
