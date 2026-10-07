FROM golang:1.24-bookworm AS build

ENV CGO_ENABLED=0

RUN go install github.com/minio/minio@RELEASE.2025-10-15T17-29-55Z \
  && go install github.com/minio/mc@RELEASE.2025-08-13T08-35-41Z

FROM debian:bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /go/bin/minio /usr/bin/minio
COPY --from=build /go/bin/mc /usr/bin/mc
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV MINIO_ROOT_USER=minioadmin \
    MINIO_ROOT_PASSWORD=minioadmin \
    MINIO_BUCKET=poke-martech

EXPOSE 9000 9001
VOLUME ["/data"]

ENTRYPOINT ["/entrypoint.sh"]
