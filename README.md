# Digital Store · Stock Manager

App estática (`index.html`) + una función serverless (`api/sync.js`) para sincronizar con contraseña.

## 1. Supabase (una vez)
En supabase.com → New project → SQL Editor → ejecutá:

    create table if not exists app_data (
      id text primary key,
      data jsonb not null,
      updated_at timestamptz default now()
    );
    alter table app_data enable row level security;

Con eso la tabla queda **cerrada**: solo el servidor (Vercel) puede leerla/escribirla.
Si además querés usar el modo "Supabase" directo desde la app (sin contraseña, con la clave pública), ejecutá también:

    create policy "acceso_publico" on app_data for all to anon using (true) with check (true);

(Cualquiera con la clave pública podría leer y escribir. Para proteger con contraseña usá el modo Vercel y NO crees esta política.)

Datos que vas a necesitar (Project Settings → API):
- Project URL → `SUPABASE_URL`
- Clave `service_role` → `SUPABASE_SERVICE_KEY` (secreta, nunca la pegues en la app)

## 2. Subir a Vercel
1. Subí esta carpeta a un repositorio de GitHub y en vercel.com → Add New → Project importalo.
2. Framework Preset: **Other**. Sin Build Command ni Output Directory.
3. Settings → Environment Variables, agregá (Production):
   - `SYNC_PASSWORD` = la contraseña que elijas (larga)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
4. Deployments → Redeploy (las variables se aplican en el próximo deploy).

## 3. Conectar la app
Más → pestaña **Sincronizar** → panel **Nube de Digital Store (Vercel)** → pegá `SYNC_PASSWORD` en "Contraseña de la nube" → Conectar.
En otros dispositivos: "Ya tengo cuenta · Iniciar sesión" → Vercel → misma contraseña + tu usuario.
