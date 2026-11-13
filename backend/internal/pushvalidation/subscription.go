package pushvalidation

import (
	"crypto/ecdh"
	"encoding/base64"
	"errors"
	"net/url"
	"strings"
)

// Restrict outgoing delivery to supported browser push providers, rather than arbitrary URLs.
func Endpoint(endpoint string) error {
	u, err := url.Parse(endpoint)
	if err != nil || len(endpoint) > 4096 || u.Scheme != "https" || u.User != nil || u.Fragment != "" || (u.Port() != "" && u.Port() != "443") {
		return errors.New("endpoint push tidak valid")
	}
	host := strings.ToLower(u.Hostname())
	for _, domain := range []string{"fcm.googleapis.com", "android.googleapis.com", "push.services.mozilla.com", "push.apple.com", "notify.windows.com"} {
		if host == domain || strings.HasSuffix(host, "."+domain) {
			return nil
		}
	}
	return errors.New("penyedia push tidak didukung")
}

func Validate(endpoint, key, auth string) error {
	if err := Endpoint(endpoint); err != nil {
		return err
	}
	publicKey, err := base64.RawURLEncoding.DecodeString(strings.TrimRight(key, "="))
	if err != nil {
		return errors.New("kunci push tidak valid")
	}
	if _, err := ecdh.P256().NewPublicKey(publicKey); err != nil {
		return errors.New("kunci push tidak valid")
	}
	secret, err := base64.RawURLEncoding.DecodeString(strings.TrimRight(auth, "="))
	if err != nil || len(secret) != 16 {
		return errors.New("auth push tidak valid")
	}
	return nil
}
