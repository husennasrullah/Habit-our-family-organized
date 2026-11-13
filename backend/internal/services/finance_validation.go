package services

import (
	"math"
	"time"
)

func validMoney(n float64, allowZero bool) bool {
	if math.IsNaN(n) || math.IsInf(n, 0) || n < 0 || n > 9999999999999.99 || (!allowZero && n == 0) {
		return false
	}
	return math.Abs(n*100-math.Round(n*100)) < 0.001
}
func roundMoney(n float64) float64 { return math.Round(n*100) / 100 }
func validDate(s string) bool      { _, err := time.Parse("2006-01-02", s); return err == nil }
