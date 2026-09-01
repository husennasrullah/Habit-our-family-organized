# ─── Build Stage ──────────────────────────────────────────
FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-s -w" \
    -o bin/server ./cmd/main.go

# ─── Run Stage ────────────────────────────────────────────
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata curl
ENV TZ=Asia/Jakarta

WORKDIR /app
COPY --from=builder /app/bin/server .

# .env TIDAK dicopy ke image — semua env dibaca dari env_file / secrets di runtime
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["./server"]
