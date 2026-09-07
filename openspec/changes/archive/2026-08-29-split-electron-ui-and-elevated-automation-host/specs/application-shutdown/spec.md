## MODIFIED Requirements

### Requirement: Shutdown waits for managed cleanup
The application SHALL stop managed automation, local child processes, the elevated Python Host and its input child processes, watchers, shortcuts, services, and windows before completing a normal exit.

#### Scenario: Asynchronous cleanup is still running
- **WHEN** Electron emits `before-quit` and a managed cleanup operation has not completed
- **THEN** the application prevents that quit attempt and exits only after cleanup settles

#### Scenario: Shutdown is requested repeatedly
- **WHEN** multiple quit requests occur during cleanup
- **THEN** the application runs the cleanup sequence exactly once

#### Scenario: Elevated input automation is running
- **WHEN** shutdown or update cleanup begins while the Python Host owns one or more input operations
- **THEN** the application requests Host `stopAll` and shutdown, waits for the bounded result, and then continues the existing cleanup sequence
