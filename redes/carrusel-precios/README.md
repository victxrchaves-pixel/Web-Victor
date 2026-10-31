# Carrusel — precios

8 diapositivas verticales a 1080 × 1920 (9:16), para TikTok en modo foto y
stories o Reels de Instagram, con la identidad de la web: fondo #111, Geist y Geist Mono,
titulares en contorno y el verde #2bff00 solo como acento.

| | Diapositiva | Fondo (detalle de tu foto) |
| --- | --- | --- |
| 01 | Portada: «Esto es lo que cobro como diseñador freelance» | Tú y el monitor, en color |
| 02 | Diseño de logotipo · desde 350 € | La tablet |
| 03 | Identidad visual completa · desde 900 € | Tablet y lápiz |
| 04 | Diseño web / landing page · desde 750 € | La pantalla, de cerca |
| 05 | Web corporativa · desde 1.500 € | El monitor entero |
| 06 | Branding + web · desde 2.200 € | Tablet y monitor juntos |
| 07 | ¿Por qué cobro esto si la IA…? | Tú, mirando la pantalla |
| 08 | Cierre + llamada a la acción | La lámpara y la planta |

Del 02 al 08 la foto va en blanco y negro, oscurecida y algo desenfocada, para
que mande el texto.

## La foto y los recortes

La foto de fondo es `fondo.webp`. Cada diapositiva la recorta en su
`<section>` de `index.html`: `data-zoom` (1 = foto entera de ancho) y
`data-fx` / `data-fy`, el punto de la foto (de 0 a 1) que queda en la mitad de
arriba, por encima del texto.

Hay márgenes de seguridad: unos 150 px arriba, 280 px abajo y 120 px a la
derecha quedan libres, para que no los tapen la interfaz de TikTok o de
Instagram ni la columna de botones.

Para volver a exportar: `node redes/carrusel-precios/render.js`. Los PNG
salen en `png/`.

> **En el feed de Instagram**, un carrusel 9:16 se recorta a 4:5 (se pierde
> arriba y abajo). Para el feed hace falta la versión 4:5, que está en el
> historial de la rama (commit «Build the pricing carousel for Instagram»).

## Texto para la publicación

```
Esto es lo que cobro como diseñador freelance, sin rodeos 👇

Logotipo, identidad visual, landing page, web corporativa o todo junto.
Son precios de partida: cada proyecto se presupuesta según lo que necesita.

Y sí, la IA ejecuta rápido. Pero el criterio sigue siendo lo que hace que
una marca funcione.

¿Tienes un proyecto en mente? Reserva una llamada gratis desde el enlace
de mi bio, o comenta «PRECIOS» y te escribo.

Precios orientativos, sin IVA.

#diseñodemarca #brandingbarcelona #diseñoweb #identidadvisual #diseñadorfreelance
```

Guárdalo en el perfil como publicación fijada y en la destacada «Cómo trabajo».
