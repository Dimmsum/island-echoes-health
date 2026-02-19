-- Allow users to delete their own notifications (for "clear all")
create policy "Users can delete own notifications"
  on public.notifications for delete
  using (user_id = auth.uid());
