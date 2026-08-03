## 1. Project Summary

A B2B Textile Marketplace prototype connecting **Buyers** and **Suppliers**.
Goal: demonstrate the core marketplace workflow end-to-end with clean architecture,
good UX, and scalable structure — not every possible business feature.

---

## 2. Repository Structure

Two separate folders, two separate git repos:

```
project-root/
├── client/     # Next.js + Tailwind CSS (frontend)
├── server/     # Express.js + MongoDB (backend)


## 3. Tech Stack

**Frontend**
- Next.js (App Router, latest stable)
- Tailwind CSS
- React Hook Form + Zod (form validation)
- TanStack Query or Zustand for state/data fetching
- lucide-react for icons

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT authentication (access + refresh token pattern)
- Role-based middleware (`buyer` / `supplier`)
- cloud storage (Cloudinary) for product image uploads


**AI Assistant (bonus, build last)**
- Prefer a Hugging Face hosted model per JD; Anthropic API is an acceptable fallback if HF integration blocks progress — note the substitution clearly in the demo video.
- Must use live marketplace DB data for recommendations/search — no hardcoded responses.
- Traditional search/filter/browse must keep working with or without the AI assistant.

---

## 4. Non-Negotiable Workflow Rules

1. Build **one phase at a time**, in the order defined in Section 5. Do not jump ahead.
2. After finishing a phase: **test it → if it works, commit → then start the next phase.**
3. **Never commit broken or non-functional code.** If something fails, fix it before committing.
4. One feature = one commit. Do not bundle unrelated changes together.
5. Use **conventional commit messages**: `feat:`, `fix:`, `refactor:`, `chore:`, `test:`.
6. Keep code modular and reusable — shared UI components, shared API response helpers, no copy-pasted logic.
7. Every form needs real validation (required fields, types, ranges) — not just UI placeholders.
8. Mobile-first responsive design on every screen, not just desktop.
9. After every phase touching data (products/orders), **create at least one real sample record** through the actual UI (not seeded directly in DB) to verify the full path: UI → API → DB → UI.

---