# CibersegurIA — rediseño 2026

Web estática de recursos públicos y gratuitos sobre IA ética, despliegue seguro, normativa, soberanía digital europea y administración pública.

## Publicación

El sitio no necesita proceso de compilación. GitHub Pages puede servir directamente la rama `main` y conserva el dominio definido en `CNAME`.

## Formulario de acceso a recursos

El formulario usa el endpoint AJAX de FormSubmit y envía los registros a `ciberseguria@gmail.com`. FormSubmit solicita confirmar esa dirección la primera vez que recibe un envío. Hasta completar esa activación, el servicio puede no entregar los registros con normalidad.

Antes de publicar:

1. Realizar un envío de prueba.
2. Confirmar el mensaje de activación recibido en `ciberseguria@gmail.com`.
3. Probar de nuevo un recurso y verificar que el registro llega y el documento se abre.
4. Revisar la nota de privacidad y la licencia con asesoramiento jurídico si se van a conservar datos personales.

## Artículos

Las tres tarjetas de Substack están en `index.html`. Son una instantánea editorial y deben actualizarse cuando se publiquen nuevos posts.

## Archivos principales

- `index.html`: estructura y contenido.
- `nullgen.html`: versión pública de NullGEN integrada en el mismo sistema visual.
- `style.css`: sistema visual responsive basado en los colores del logo.
- `script.js`: navegación móvil, movimiento, formulario y acceso a recursos.
- `LICENSE-RESOURCES.md`: condiciones de uso propuestas para los materiales.
