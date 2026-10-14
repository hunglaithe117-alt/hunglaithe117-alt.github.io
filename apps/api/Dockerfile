# Multi-stage build → distroless runtime (T5.1).
# The build stage compiles a static binary; the runtime stage carries no shell,
# package manager or libc, which keeps the image small (faster container cold
# starts on Cloudflare Containers) and the attack surface minimal.

# --- build stage ---
# Pinned to the current 1.27 patch: govulncheck flags 8 stdlib advisories
# (net/http, net/textproto, crypto/tls) fixed in go1.27.2 (T6.2). Bump with the
# Go toolchain; CI already pins go-version 1.27.2.
FROM golang:1.27.2 AS build

WORKDIR /src

# Cache dependencies first.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# CGO disabled → fully static binary for the distroless/static base.
ENV CGO_ENABLED=0 GOOS=linux
RUN go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/server

# --- runtime stage ---
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app
COPY --from=build /out/api /app/api

# Cloudflare Containers route to a single port; default is 8080 (config.PORT).
EXPOSE 8080
USER nonroot:nonroot

ENTRYPOINT ["/app/api"]
