# Avances Recientes

## Autenticación y Panel
- Se agregó realimentación en los formularios de login y registro, mostrando mensajes de éxito y error.
- Se creó una barra superior que saluda al usuario autenticado y, si corresponde al correo autorizado, habilita accesos privados.
- Se implementó el flujo de bootstrap administrativo (`/admin/bootstrap`) para que la cuenta autorizada pueda asignarse el rol de administrador y responder mensajes en `/admin/messages`.

## Perfil de Usuario
- Se extendió el modelo `User` con campos opcionales: tipo de persona, teléfono, dirección, RUT y razón social.
- La API `/api/auth/me` ahora expone y actualiza dichos campos mediante `PATCH`, firmando nuevamente la sesión después de cada cambio.
- Nueva vista `/profile` que permite a los usuarios editar su información adicional sin campos obligatorios.

## Interfaz y Layout
- El encabezado muestra un enlace directo a “Ver perfil” cuando el usuario está autenticado y reacciona a los cambios enviados por la vista de perfil.
- El pie de página se rediseñó para permanecer siempre al fondo, incluyendo descripción de la empresa, navegación duplicada y enlaces a políticas.

## Verificación
- `npm run build`
