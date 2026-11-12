-- 016: todo mundo aparece no pódio geral por padrão.
-- "Ocultar perfil" (opção no perfil) desliga no_ranking_geral: aí só o próprio dono e os amigos enxergam o
-- perfil (a RLS de perfil_publico já é assim: dono, amigos, ou no_ranking_geral ligado).
alter table public.perfil_publico alter column no_ranking_geral set default true;
update public.perfil_publico set no_ranking_geral = true where no_ranking_geral = false;
