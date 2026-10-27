-- New tables inherit broad default grants; replace them with exactly what each role needs.
-- (Without this, a team member could edit columns RLS alone does not protect, such as their own role.)
revoke all on public.admin_users, public.admin_invites, public.site_content, public.gallery_photos, public.releases, public.videos from anon, authenticated;

grant select on public.admin_users to authenticated;
grant update (name) on public.admin_users to authenticated;

grant select on public.site_content to anon, authenticated;
grant update (value, updated_at, updated_by) on public.site_content to authenticated;

grant select on public.gallery_photos to anon, authenticated;
grant insert (kind, ref, width, height, alt, in_gallery, gallery_sort, on_home, home_sort, home_mono, pos, pos_mobile) on public.gallery_photos to authenticated;
grant update (alt, in_gallery, gallery_sort, on_home, home_sort, home_mono, pos, pos_mobile, updated_at, deleted_at) on public.gallery_photos to authenticated;

grant select on public.releases to anon, authenticated;
grant insert (title, credit, kind, year, href, store, sort) on public.releases to authenticated;
grant update (title, credit, kind, year, href, store, sort, updated_at, deleted_at) on public.releases to authenticated;

grant select on public.videos to anon, authenticated;
grant insert (youtube_id, title, credit, embed, sort) on public.videos to authenticated;
grant update (youtube_id, title, credit, embed, sort, updated_at, deleted_at) on public.videos to authenticated;

revoke all on all functions in schema private from public;
grant execute on function private.is_admin(), private.is_owner() to anon, authenticated;
