package config

import "testing"

func TestStorageEnv(t *testing.T) {
	for _, k := range []string{"STORAGE_ENDPOINT", "STORAGE_ACCESS_KEY", "STORAGE_SECRET_KEY", "STORAGE_USE_SSL", "STORAGE_AUTO_CREATE_BUCKET", "STORAGE_REGION", "STORAGE_SESSION_TOKEN", "MINIO_ENDPOINT"} {
		t.Setenv(k, "")
	}
	t.Setenv("STORAGE_PROVIDER", "minio")
	c := loadStorageConfig()
	if c.Endpoint != "localhost:9000" || !c.AutoCreateBucket || c.UseSSL {
		t.Fatal("legacy defaults changed")
	}
	t.Setenv("MINIO_ENDPOINT", "minio:9000")
	t.Setenv("MINIO_ROOT_USER", "compose-user")
	t.Setenv("MINIO_ROOT_PASSWORD", "compose-secret")
	c = loadStorageConfig()
	if c.Endpoint != "minio:9000" || c.AccessKey != "compose-user" || c.SecretKey != "compose-secret" {
		t.Fatal("compose minio defaults lost")
	}
	t.Setenv("STORAGE_PROVIDER", "s3")
	c = loadStorageConfig()
	if c.Endpoint != "" || c.AccessKey != "" || c.SecretKey != "" || c.AutoCreateBucket || !c.UseSSL {
		t.Fatal("cloud silently inherits local credentials")
	}
	t.Setenv("STORAGE_PROVIDER", "r2")
	t.Setenv("STORAGE_REGION", "auto")
	t.Setenv("STORAGE_ENDPOINT", "https://account.r2.cloudflarestorage.com")
	t.Setenv("STORAGE_SESSION_TOKEN", "test-token")
	c = loadStorageConfig()
	if c.Region != "auto" || c.SessionToken != "test-token" {
		t.Fatal("cloud env not loaded")
	}
}
