ALTER TABLE public.app_feedback
  DROP CONSTRAINT app_feedback_title_check,
  DROP CONSTRAINT app_feedback_description_check;

ALTER TABLE public.app_feedback
  ADD CONSTRAINT app_feedback_title_check
  CHECK (btrim(title) <> '' AND char_length(title) <= 80),
  ADD CONSTRAINT app_feedback_description_check
  CHECK (btrim(description) <> '' AND char_length(description) <= 2000);
