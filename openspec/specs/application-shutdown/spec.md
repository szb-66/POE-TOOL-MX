# application-shutdown Specification

## Purpose
TBD - created by archiving change fix-app-shutdown-lifecycle. Update Purpose after archive.
## Requirements
### Requirement: Closing the main window exits the application
The application SHALL treat closing the main window as a request to exit the complete application, regardless of whether auxiliary windows are open.

#### Scenario: Main window closes while auxiliary windows exist
- **WHEN** the user closes the main window while one or more auxiliary windows are open
- **THEN** the application starts its shutdown sequence and closes every auxiliary window

### Requirement: Shutdown waits for managed cleanup
The application SHALL stop managed automation, child processes, watchers, shortcuts, services, and windows before completing a normal exit.

#### Scenario: Asynchronous cleanup is still running
- **WHEN** Electron emits `before-quit` and a managed cleanup operation has not completed
- **THEN** the application prevents that quit attempt and exits only after cleanup settles

#### Scenario: Shutdown is requested repeatedly
- **WHEN** multiple quit requests occur during cleanup
- **THEN** the application runs the cleanup sequence exactly once

### Requirement: Cleanup failures cannot leave the application resident
The application MUST continue toward exit when an individual cleanup operation rejects, throws, or exceeds the shutdown timeout.

#### Scenario: A cleanup operation fails
- **WHEN** any managed cleanup operation fails
- **THEN** the application records the failure, attempts the remaining cleanup operations, and completes exit

#### Scenario: Cleanup exceeds the timeout
- **WHEN** the cleanup sequence does not settle within the configured shutdown timeout
- **THEN** the application records a timeout and resumes Electron exit

