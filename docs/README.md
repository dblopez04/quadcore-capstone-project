# Docs Index

- `docs/PROJECT_OVERVIEW.md` - scope, architecture, and current features
- `docs/REQUIREMENTS.md` - requirement status and release mapping
- `docs/AREAS.md` - ownership and file map by domain
- `docs/FRONTEND.md` - frontend routes, structure, and UI conventions
- `docs/BACKEND.md` - API endpoints, auth flow, and test notes
- `docs/DATABASE.md` - schema summary and PostGIS notes
- `docs/MAP.md` - OSRM data and map pipeline notes
- `docs/RUNBOOK.md` - common commands, ports, and local dev notes
- `docs/DECISIONS.md` - lightweight decision log
- `docs/feature-plan/` - implementation plans for new features (see below)

---

## Feature Plans

The `docs/feature-plan/` directory contains implementation plans for new features. These plans are created during plan mode and serve as documentation for proposed changes before implementation.

### Example Workflow

See [example_transcript_antigravity.md](../example_transcript_antigravity.md) for a complete example of planning and implementing the admin privileges feature. Key takeaways:

1. **Explore first** - Start by examining the existing codebase structure, models, and routes before proposing changes
2. **Ask clarifying questions** - Validate assumptions with the user (e.g., "Should closures be a separate model or use reports?")
3. **Iterate on the design** - Refine through discussion (the transcript shows moving indoor attributes from locations to POIs based on user feedback)
4. **Document before implementing** - Write a detailed plan file that can be followed step-by-step, even by a different model/agent with fresh context
5. **Verify at the end** - Test the implementation to confirm endpoints are working and protected

### Plan File Structure

When using plan mode, write your implementation plan to `docs/feature-plan/<feature-name>.md`. Each plan should include:

1. **Overview** - Brief description of what the feature does
2. **User Review Required** - Any breaking changes or important decisions needing approval
3. **Proposed Changes** - Detailed list of files to modify/create with code snippets
4. **Verification Plan** - How to test the implementation
5. **File Summary** - Table of all files affected

See `docs/feature-plan/admin-privileges.md` for a complete example.
