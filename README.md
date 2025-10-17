# VirtualDesk — Next.js + MongoDB (con Suspense y catálogo actualizado)

- Catálogo de servicios (pauta real) con **botón "Me interesa"** por servicio (sin +/−).
- Pedido se guarda al instante en `/api/orders` con `{ clientName, clientEmail, items:[...] }`.
- Endpoints con `try/catch` → errores 500 ahora devuelven JSON legible.
- Suspense en layout/header/footer; ChatWidget `dynamic(..., { ssr:false })`.

## .env.local
```env
MONGODB_URI=mongodb://127.0.0.1:27017/virtualdesk
MONGODB_DB=virtualdesk
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
# opcional, por defecto usa virtualdesk/avatars
CLOUDINARY_AVATARS_FOLDER=virtualdesk/avatars
```

## Comandos
```bash
npm install
npm run dev
```

## Cloudinary y subida de imagenes
- Configura las variables `CLOUDINARY_*` en `.env.local` y en Vercel (Project Settings -> Environment Variables) antes de desplegar.
- Puedes cambiar `CLOUDINARY_AVATARS_FOLDER` para separar imagenes por entorno si lo necesitas.
- El endpoint `POST /api/uploads/avatar` sube la foto, guarda la URL en MongoDB y elimina la imagen previa en Cloudinary; `DELETE /api/uploads/avatar` la elimina.
- La pagina `app/profile` permite actualizar la foto (avatar circular) y ampliarla al hacer click.
- Asegurate de mantener `JWT_SECRET` definido para que la sesion se refresque luego de cada actualizacion.

## Debug de 500
- Asegúrate de que MongoDB esté activo y la URI sea correcta.
- Mira la consola del server: ahora verás `message` con el motivo (auth, URI, etc.).
- En Windows, usa `127.0.0.1` en vez de `localhost` si hay problemas.
