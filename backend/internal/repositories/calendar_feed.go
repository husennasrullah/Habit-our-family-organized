package repositories

import (
	"github.com/google/uuid"
)

// CalendarRow is a read-only projection of a dated business record, never a copied event.
type CalendarRow struct {
	ID          string
	ParentID    string
	Source      string
	Title       string
	Description string
	Date        string
	EndDate     string
	StartTime   string
	EndTime     string
	Status      string
}

func (r *EventRepository) CalendarRows(familyID uuid.UUID, from, to string, adult bool) ([]CalendarRow, error) {
	rows := make([]CalendarRow, 0)
	type sourceQuery struct {
		source, sql string
		args        []interface{}
	}
	queries := []sourceQuery{
		{"task", `SELECT id::text, title, description, due_date::text AS date, status FROM tasks WHERE family_id = ? AND deleted_at IS NULL AND due_date BETWEEN ?::date AND ?::date`, []interface{}{familyID, from, to}},
		{"meal", `SELECT id::text, name AS title, notes AS description, date::text, meal_type AS status FROM meal_plans WHERE family_id = ? AND deleted_at IS NULL AND date BETWEEN ?::date AND ?::date`, []interface{}{familyID, from, to}},
		{"memory", `SELECT id::text, title, '' AS description, date::text FROM memories WHERE family_id = ? AND deleted_at IS NULL AND storage_delete_pending = false AND date BETWEEN ?::date AND ?::date`, []interface{}{familyID, from, to}},
		{"trip", `SELECT id::text, title, destination AS description, start_date::text AS date, end_date::text AS end_date, status FROM trips WHERE family_id = ? AND deleted_at IS NULL AND status <> 'cancelled' AND start_date <= ?::date AND end_date >= ?::date`, []interface{}{familyID, to, from}},
		{"itinerary", `SELECT i.id::text, t.id::text AS parent_id, i.title, i.location AS description, COALESCE(i.date,t.start_date + (GREATEST(i.day_number,1)-1)::integer)::text AS date, i.time_start AS start_time, i.time_end AS end_time FROM trip_itineraries i JOIN trips t ON t.id=i.trip_id WHERE t.family_id = ? AND t.deleted_at IS NULL AND i.deleted_at IS NULL AND t.status <> 'cancelled' AND COALESCE(i.date,t.start_date + (GREATEST(i.day_number,1)-1)::integer) BETWEEN ?::date AND ?::date`, []interface{}{familyID, from, to}},
	}
	birthdaySQL := `SELECT m.id::text, m.name AS title, m.birth_date AS date FROM family_members m WHERE m.family_id = ? AND m.deleted_at IS NULL AND m.birth_date IS NOT NULL`
	if adult {
		birthdaySQL += ` AND NOT EXISTS (SELECT 1 FROM kid_profiles k WHERE k.family_id=m.family_id AND k.member_id=m.id AND k.deleted_at IS NULL)`
	}
	queries = append(queries, sourceQuery{"birthday", birthdaySQL, []interface{}{familyID}})
	if adult {
		queries = append(queries,
			sourceQuery{"kid_birthday", `SELECT id::text, id::text AS parent_id, name AS title, birth_date::text AS date FROM kid_profiles WHERE family_id=? AND deleted_at IS NULL`, []interface{}{familyID}},
			sourceQuery{"vaccine", `SELECT v.id::text,k.id::text AS parent_id,v.vaccine_name || ' · ' || k.name AS title, COALESCE(v.given_date,v.scheduled_date)::text AS date, v.status FROM vaccine_records v JOIN kid_profiles k ON k.id=v.kid_id WHERE k.family_id=? AND k.deleted_at IS NULL AND v.deleted_at IS NULL AND COALESCE(v.given_date,v.scheduled_date) BETWEEN ?::date AND ?::date`, []interface{}{familyID, from, to}},
			sourceQuery{"vaccine", `SELECT v.id::text,k.id::text AS parent_id,'Jadwal awal ' || v.vaccine_name || ' · ' || k.name AS title,v.scheduled_date::text AS date,v.status FROM vaccine_records v JOIN kid_profiles k ON k.id=v.kid_id WHERE k.family_id=? AND k.deleted_at IS NULL AND v.deleted_at IS NULL AND v.given_date IS NOT NULL AND v.given_date <> v.scheduled_date AND v.scheduled_date BETWEEN ?::date AND ?::date`, []interface{}{familyID, from, to}},
			sourceQuery{"growth", `SELECT g.id::text,k.id::text AS parent_id,'Pertumbuhan · ' || k.name AS title,g.date::text FROM growth_records g JOIN kid_profiles k ON k.id=g.kid_id WHERE k.family_id=? AND k.deleted_at IS NULL AND g.deleted_at IS NULL AND g.date BETWEEN ?::date AND ?::date`, []interface{}{familyID, from, to}},
			sourceQuery{"health", `SELECT h.id::text,k.id::text AS parent_id,'Kesehatan · ' || k.name AS title,h.description,h.date::text FROM health_records h JOIN kid_profiles k ON k.id=h.kid_id WHERE k.family_id=? AND k.deleted_at IS NULL AND h.deleted_at IS NULL AND h.date BETWEEN ?::date AND ?::date`, []interface{}{familyID, from, to}},
			sourceQuery{"milestone", `SELECT m.id::text,k.id::text AS parent_id,m.title || ' · ' || k.name AS title,m.achieved_at::text AS date FROM milestones m JOIN kid_profiles k ON k.id=m.kid_id WHERE k.family_id=? AND k.deleted_at IS NULL AND m.deleted_at IS NULL AND m.is_achieved=true AND m.achieved_at BETWEEN ?::date AND ?::date`, []interface{}{familyID, from, to}},
			sourceQuery{"goal", `SELECT id::text,title,notes AS description,deadline::text AS date,CASE WHEN is_achieved THEN 'done' ELSE 'pending' END AS status FROM financial_goals WHERE family_id=? AND deleted_at IS NULL AND deadline BETWEEN ?::date AND ?::date`, []interface{}{familyID, from, to}},
			sourceQuery{"expense", `SELECT id::text,COALESCE(NULLIF(description,''),category) AS title,category AS description,date::text FROM expenses WHERE family_id=? AND deleted_at IS NULL AND date BETWEEN ?::date AND ?::date`, []interface{}{familyID, from, to}},
			sourceQuery{"trip_expense", `SELECT e.id::text,t.id::text AS parent_id,e.title,t.title AS description,e.date::text FROM trip_expenses e JOIN trips t ON t.id=e.trip_id WHERE e.family_id=? AND t.family_id=e.family_id AND e.deleted_at IS NULL AND t.deleted_at IS NULL AND e.date BETWEEN ?::date AND ?::date`, []interface{}{familyID, from, to}},
			sourceQuery{"budget", `SELECT b.id::text,'Anggaran · ' || b.category AS title,b.first_day::text AS date,(b.first_day + interval '1 month' - interval '1 day')::date::text AS end_date FROM (SELECT *,CASE WHEN year BETWEEN 1 AND 9998 AND month BETWEEN 1 AND 12 THEN make_date(year::integer,month::integer,1) END AS first_day FROM budgets WHERE family_id=? AND deleted_at IS NULL) b WHERE b.first_day <= ?::date AND (b.first_day + interval '1 month' - interval '1 day')::date >= ?::date`, []interface{}{familyID, to, from}},
		)
	}
	for _, q := range queries {
		var records []CalendarRow
		if err := r.db.Raw(q.sql, q.args...).Scan(&records).Error; err != nil {
			return nil, err
		}
		for i := range records {
			records[i].Source = q.source
		}
		rows = append(rows, records...)
	}
	return rows, nil
}
func (r *EventRepository) TripEventIDs(familyID uuid.UUID) (map[uuid.UUID]bool, error) {
	var records []struct{ EventID uuid.UUID }
	err := r.db.Table("trips").Select("event_id").Where("family_id = ? AND event_id IS NOT NULL", familyID).Scan(&records).Error
	ids := map[uuid.UUID]bool{}
	for _, row := range records {
		ids[row.EventID] = true
	}
	return ids, err
}
