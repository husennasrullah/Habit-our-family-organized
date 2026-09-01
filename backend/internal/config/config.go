package config

import (
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	App     AppConfig
	DB      DBConfig
	Redis   RedisConfig
	JWT     JWTConfig
	Google  GoogleConfig
	Storage StorageConfig
	Push    PushConfig
}

type AppConfig struct {
	Env  string
	Port string
}

type DBConfig struct {
	Host     string
	Port     string
	Name     string
	User     string
	Password string
	SSLMode  string
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

type JWTConfig struct {
	Secret        string
	AccessExpiry  string
	RefreshExpiry string
}

type GoogleConfig struct {
	ClientID        string
	ClientSecret    string
	RedirectURL     string
	FrontendBaseURL string // URL frontend untuk redirect setelah callback
}

type PushConfig struct {
	VAPIDPublicKey   string
	VAPIDPrivateKey  string
	VAPIDSubject     string // contoh: mailto:admin@keluarga.dev
	NotificationTime string // cron expression, default: "0 4 * * *"
}

type StorageConfig struct {
	Endpoint  string
	AccessKey string
	SecretKey string
	Bucket    string
	UseSSL    bool
	// PublicURL opsional: set jika bucket public atau pakai custom domain (R2/CDN).
	// Contoh: "https://media.keluarga.app" atau "https://pub-xxx.r2.dev"
	// Jika kosong, semua file di-serve via presigned URL.
	PublicURL string
}

// Load membaca .env dari direktori backend (satu folder di atas file ini saat runtime,
// atau direktori kerja saat ini), lalu fallback ke environment variables.
func Load() *Config {
	loadDotEnv()

	redisDB, _ := strconv.Atoi(getEnv("REDIS_DB", "0"))

	return &Config{
		App: AppConfig{
			Env:  getEnv("APP_ENV", "development"),
			Port: getEnv("APP_PORT", "8080"),
		},
		DB: DBConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			Name:     getEnv("DB_NAME", "keluarga"),
			User:     getEnv("DB_USER", "keluarga_user"),
			Password: getEnv("DB_PASSWORD", "keluarga_pass"),
			SSLMode:  getEnv("DB_SSL_MODE", "disable"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       redisDB,
		},
		JWT: JWTConfig{
			Secret:        getEnv("JWT_SECRET", "change_me_in_production_min_32_chars"),
			AccessExpiry:  getEnv("JWT_ACCESS_EXPIRY", "15m"),
			RefreshExpiry: getEnv("JWT_REFRESH_EXPIRY", "7d"),
		},
		Google: GoogleConfig{
			ClientID:        getEnv("GOOGLE_CLIENT_ID", ""),
			ClientSecret:    getEnv("GOOGLE_CLIENT_SECRET", ""),
			RedirectURL:     getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/v1/auth/google/callback"),
			FrontendBaseURL: getEnv("FRONTEND_BASE_URL", "http://localhost:3000"),
		},
		Push: PushConfig{
			VAPIDPublicKey:   getEnv("VAPID_PUBLIC_KEY", ""),
			VAPIDPrivateKey:  getEnv("VAPID_PRIVATE_KEY", ""),
			VAPIDSubject:     getEnv("VAPID_SUBJECT", "mailto:admin@keluarga.dev"),
			NotificationTime: getEnv("NOTIFICATION_TIME", "0 4 * * *"),
		},
		Storage: StorageConfig{
			Endpoint:  getEnv("STORAGE_ENDPOINT", "localhost:9000"),
			AccessKey: getEnv("STORAGE_ACCESS_KEY", "minioadmin"),
			SecretKey: getEnv("STORAGE_SECRET_KEY", "minioadmin123"),
			Bucket:    getEnv("STORAGE_BUCKET", "keluarga"),
			UseSSL:    getEnv("STORAGE_USE_SSL", "false") == "true",
			PublicURL: getEnv("STORAGE_PUBLIC_URL", ""),
		},
	}
}

// loadDotEnv mencari file .env dari beberapa lokasi yang mungkin.
func loadDotEnv() {
	candidates := dotEnvCandidates()
	for _, p := range candidates {
		if err := godotenv.Load(p); err == nil {
			log.Printf("Loaded .env from: %s", p)
			return
		}
	}
	log.Println("No .env file found, using environment variables only")
}

// dotEnvCandidates mengembalikan daftar path .env yang akan dicoba secara berurutan.
func dotEnvCandidates() []string {
	var paths []string

	// 1. Working directory (paling umum: jalankan dari dalam folder backend/)
	if wd, err := os.Getwd(); err == nil {
		paths = append(paths, filepath.Join(wd, ".env"))
	}

	// 2. Satu level di atas working directory (jalankan dari root project)
	if wd, err := os.Getwd(); err == nil {
		paths = append(paths, filepath.Join(wd, "backend", ".env"))
	}

	// 3. Lokasi file source ini (berguna saat go test)
	_, filename, _, ok := runtime.Caller(0)
	if ok {
		// config.go ada di internal/config/, naik 3 level → backend/
		dir := filepath.Join(filepath.Dir(filename), "..", "..", ".env")
		paths = append(paths, filepath.Clean(dir))
	}

	return paths
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
