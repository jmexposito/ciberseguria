# CibersegurIA — biblioteca pública de IA responsable

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

## Contenido editorial

Las colecciones que cambian con más frecuencia están centralizadas en `content-data.js`:

- siete plantillas para construir sistemas de agentes de IA;
- tres lecturas seleccionadas de «Chamulleando sobre IA»;
- los proyectos y placeholders experimentales de «La cara B»;
- seis últimos artículos en orden cronológico.

Para actualizar una colección solo hay que editar su array. La interfaz se genera desde esos datos y mantiene el orden indicado en el archivo.

## Desarrollo y publicación

El proyecto es HTML, CSS y JavaScript nativo: no instala dependencias ni requiere compilación. Para probarlo en local conviene servir la carpeta mediante HTTP, ya que así se reproduce el comportamiento de GitHub Pages con mayor fidelidad que abriendo `index.html` directamente.

## Archivos principales

- `index.html`: estructura semántica y contenido estable.
- `nullgen.html`: versión pública de NullGEN integrada en el mismo sistema visual.
- `style.css`: sistema visual base compartido.
- `experience.css`: narrativa visual, composición editorial, responsive y movimiento progresivo de la portada.
- `content-data.js`: plantillas, publicaciones y proyectos de «La cara B» centralizados.
- `script.js`: renderizado de colecciones, navegación, movimiento, formulario y acceso a recursos.
- `LICENSE-RESOURCES.md`: condiciones de uso propuestas para los materiales.
