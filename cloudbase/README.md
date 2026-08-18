# CloudBase feedback resources

- Environment: `poe-tool-d7gbuduivbdb631bf` (`poe-tool`, `ap-shanghai`)
- Runtime: CloudBase PostgreSQL + PG Storage
- Feedback table: `public.app_feedback`
- Private bucket: `feedback`
- Experience-plan expiry observed during setup: `2027-02-18 23:59:59`
- Overrun billing was disabled when the environment was inspected.

Schema changes are versioned in `cloudbase/migrations/`. The platform owns
`storage.objects`, so its policies cannot be changed by the user-migration role;
the exact privileged operations SQL is kept in
`cloudbase/storage/feedback-policies.sql` and must be applied through the
CloudBase PG operations channel.

The feedback bucket enforces a 10MB per-object limit and a MIME allowlist.
Database and storage admission functions additionally cap feedback to 5
submissions per anonymous identity per hour, 6 objects per feedback, 50 objects
per identity, 1000 stored feedback objects globally, and 10000 retained feedback
rows globally. These bounds are an application safety valve; administrators
must remove processed records and objects before either global cap is reached.

The desktop application contains only the Publishable Key. Never add a
CloudBase API Key, Tencent Cloud SecretId/SecretKey, access token, refresh token,
or user contact data to this directory.

## Console-only follow-up

CloudBase MCP can inspect usage but does not expose the notification-recipient
configuration required for a billing/usage alert. In the CloudBase console,
configure a resource-point threshold notification for this environment and
select the intended Tencent Cloud notification recipients. Keep overrun billing
disabled unless a paid overrun is explicitly approved.
