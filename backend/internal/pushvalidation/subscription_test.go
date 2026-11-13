package pushvalidation

import (
	"crypto/ecdh"
	"crypto/rand"
	"encoding/base64"
	"testing"
)

func TestEndpointAndKeys(t *testing.T) {
	for _, endpoint := range []string{"https://fcm.googleapis.com/fcm/send/token", "https://updates.push.services.mozilla.com/wpush/v2/token", "https://web.push.apple.com/token", "https://wns2.notify.windows.com/token"} {
		if err := Endpoint(endpoint); err != nil {
			t.Fatal(endpoint, err)
		}
	}
	for _, endpoint := range []string{"x", "http://fcm.googleapis.com/x", "https://localhost/x", "https://127.0.0.1/x", "https://fcm.googleapis.com.evil.test/x", "https://evilfcm.googleapis.com/x", "https://fcm.googleapis.com:8443/x", "https://user:pass@fcm.googleapis.com/x", "https://fcm.googleapis.com/x#fragment"} {
		if Endpoint(endpoint) == nil {
			t.Fatalf("accepted %s", endpoint)
		}
	}
	key, _ := ecdh.P256().GenerateKey(rand.Reader)
	public := base64.RawURLEncoding.EncodeToString(key.PublicKey().Bytes())
	auth := base64.RawURLEncoding.EncodeToString(make([]byte, 16))
	if err := Validate("https://fcm.googleapis.com/x", public, auth); err != nil {
		t.Fatal(err)
	}
	for _, pair := range [][2]string{{"bad", auth}, {public, "bad"}, {"", ""}} {
		if Validate("https://fcm.googleapis.com/x", pair[0], pair[1]) == nil {
			t.Fatal("invalid keys accepted")
		}
	}
}
