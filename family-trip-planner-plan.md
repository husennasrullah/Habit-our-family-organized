# Plan: Family Trip & Vacation Planner

## Top-Level Overview
Add a dedicated Family Trip & Vacation Planner feature to the Keluarga application. This module enables families to plan vacations collaboratively with day-by-day itinerary schedules, shared packing checklists with member assignments, trip budget tracking, and notes/accommodations information.

---

## Sub-Tasks

### Sub-Task 1: Database Migration & Models
- **Intent**: Define database tables and GORM entities for trips, itineraries, packing items, and trip participants.
- **Expected Outcomes**:
  - Migration file `008_trips.sql` created with tables `trips`, `trip_members`, `trip_itineraries`, `trip_packing_items`.
  - Go models in `backend/internal/models/trip.go` matching the schema and `BaseModel`.
  - `backend/internal/database/migrate.go` updated to register trip models into `AutoMigrate()`.
- **Todo List**:
  1. Create `backend/migrations/008_trips.sql` with foreign keys, cascading deletes, and family indexes.
  2. Create `backend/internal/models/trip.go` defining structs: `Trip`, `TripMember`, `TripItinerary`, `TripPackingItem`.
  3. Register new models in `backend/internal/database/migrate.go`.
- **Relevant Context**:
  - `backend/migrations/007_financial_goals.sql`
  - `backend/internal/models/base.go`
  - `backend/internal/database/migrate.go`
- **Status**: [x] done

---

### Sub-Task 2: Backend Repository, Service, Handler & Routes
- **Intent**: Implement complete CRUD API for trips, itineraries, and packing items with family tenant isolation and validation.
- **Expected Outcomes**:
  - `backend/internal/repositories/trip_repo.go` handling database queries with preloading.
  - `backend/internal/services/trip_service.go` containing business logic, packing progress computation, and input validation.
  - `backend/internal/handlers/trip_handler.go` handling HTTP endpoints under `/api/v1/trips`.
  - Registered trip routes in `backend/cmd/main.go` protected by `authMw`.
- **Todo List**:
  1. Implement `TripRepository` methods: `CreateTrip`, `GetTripsByFamily`, `GetTripByID`, `UpdateTrip`, `DeleteTrip`, `AddItinerary`, `UpdateItinerary`, `DeleteItinerary`, `AddPackingItem`, `TogglePackingItem`, `DeletePackingItem`.
  2. Implement `TripService` request DTOs and validation logic.
  3. Implement `TripHandler` with Fiber context helpers (`getFamilyID`, `getUserID`).
  4. Wire repositories, services, handlers, and endpoints in `backend/cmd/main.go`.
- **Relevant Context**:
  - `backend/internal/repositories/financial_goal_repo.go`
  - `backend/internal/services/financial_goal_service.go`
  - `backend/internal/handlers/financial_goal_handler.go`
  - `backend/cmd/main.go`
- **Status**: [x] done

---

### Sub-Task 3: Frontend Types & API Hooks
- **Intent**: Define TypeScript types and React Query hooks for trips management.
- **Expected Outcomes**:
  - TypeScript interfaces in `frontend/types/index.ts` for `Trip`, `TripItinerary`, `TripPackingItem`, `TripStatus`.
  - Hook `frontend/hooks/useTrips.ts` with queries for list/detail and mutations for CRUD, itinerary, and packing checklists with cache invalidation.
- **Todo List**:
  1. Add trip interfaces and request payload types to `frontend/types/index.ts`.
  2. Create `frontend/hooks/useTrips.ts` using Axios client (`api`) and TanStack Query.
- **Relevant Context**:
  - `frontend/types/index.ts`
  - `frontend/hooks/useFinancialGoals.ts`
  - `frontend/hooks/useEvents.ts`
  - `frontend/lib/api.ts`
- **Status**: [x] done

---

### Sub-Task 4: Frontend Trips Page & Detail View
- **Intent**: Build responsive dashboard UI for managing vacation trips, itinerary timeline, and packing checklist.
- **Expected Outcomes**:
  - Trip list page at `frontend/app/(dashboard)/trips/page.tsx` displaying upcoming, ongoing, and completed trips with a "Rencanakan Liburan" modal.
  - Trip detail page at `frontend/app/(dashboard)/trips/[id]/page.tsx` with tabs:
    - **Itinerary**: Day-by-day activity timeline with time, location link, and notes.
    - **Packing Checklist**: Interactive item checklist with category filter and assignee tags.
    - **Overview & Budget**: Budget progress vs estimate and general lodging/transport notes.
  - Sidebar navigation updated in `frontend/components/layout/Sidebar.tsx` to include "Liburan" (Trips).
- **Todo List**:
  1. Add "Liburan" menu item to `frontend/components/layout/Sidebar.tsx`.
  2. Create trip creation modal component `CreateTripModal.tsx`.
  3. Create `frontend/app/(dashboard)/trips/page.tsx` with summary cards and filters.
  4. Create `frontend/app/(dashboard)/trips/[id]/page.tsx` with interactive tabs (Itinerary, Packing, Info).
  5. Add modal forms for adding itinerary items and packing checklist items.
- **Relevant Context**:
  - `frontend/components/layout/Sidebar.tsx`
  - `frontend/app/(dashboard)/memories/page.tsx`
  - `frontend/app/(dashboard)/budget/page.tsx`
- **Status**: [x] done

---

### Sub-Task 5: End-to-End Verification & Polish
- **Intent**: Validate backend API and frontend UX functionality across desktop and mobile screen sizes.
- **Expected Outcomes**:
  - Go backend compiles cleanly without errors (`go build ./...`).
  - Frontend builds cleanly without TypeScript or Lint errors (`npm run build`).
  - All trip features (create trip, add itinerary, check packing item, delete trip) work cohesively.
- **Todo List**:
  1. Run Go build check on `backend/cmd/main.go`.
  2. Run TypeScript build check on `frontend`.
  3. Verify UI styling consistency with existing Tailwind theme and dark mode.
- **Relevant Context**:
  - `backend/go.mod`
  - `frontend/package.json`
- **Status**: [x] done
