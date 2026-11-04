---
name: ui-a11y-surfaces
description: >-
  Agnostic UI/accessibility rules for surfaces (cards, task panels, text blocks):
  border vs fill, non-text contrast, focus rings. Use when reviewing layout
  chrome, "¿borde o sin borde?", WCAG contrast on boxes, light/dark theme
  separation, or when a card/task looks hard to see against the page.
---

# UI a11y · surfaces

Reglas **agnósticas** y **conservadoras**: solo lo muy recomendado (WCAG + patrones de contención). No rediseñar la marca. Ir de a poco: una decisión por revisión.

Complementa `ui-flow` (controles y copy). Acá: **cómo se ve el contenedor**, no el flujo del botón.

## Contención: ¿borde o sin borde?

Un bloque de tarea / card / panel de texto necesita **separarse** del fondo. Hay tres mecanismos válidos (uno basta si cumple contraste):

| Mecanismo | Cuándo |
|-----------|--------|
| **Relleno distinto** (bg card ≠ bg página) | Temas claros/oscuros con diferencia clara |
| **Borde / stroke** | Fondos parecidos, impresión, high-contrast, densidad |
| **Elevación (sombra)** | Floating / overlays; no alcanza sola si el contraste de relleno falla |

**Recomendación práctica (tarea / enunciado):**

- Si el card y la página son tonos vecinos (beige sobre beige, gris sobre gris) → **borde sutil o más contraste de relleno**. La costumbre de “leer bien” no garantiza WCAG.
- Si el relleno ya contrasta ≥ **3:1** con el fondo adyacente → **sin borde está bien** (Material/Fluent permiten card por superficie sola).
- Inputs editables (`textarea`, `input`) → casi siempre **borde o indicador de campo** visible; no se tratan igual que un card de solo lectura.
- El **foco** del teclado nunca se reemplaza con “ya se ve el card”: el anillo de foco es aparte (ver abajo).

No inventar doble marco (borde grueso + sombra fuerte) sin necesidad.

## WCAG — checklist mínimo (100% recomendado)

Usar estos criterios al opinar; no exigir AAA salvo que el usuario lo pida.

1. **1.4.3 Contrast (Text)** — texto normal ≥ 4.5:1; grande ≥ 3:1.
2. **1.4.11 Non-text Contrast** — bordes, iconos esenciales y límites de componentes UI ≥ **3:1** respecto al color adyacente. Si no hay borde, el **relleno del componente** debe cumplir ese 3:1 contra el fondo.
3. **2.4.7 Focus Visible** — foco de teclado siempre perceptible.
4. **2.4.13 Focus Appearance** (WCAG 2.2, ideal) — área de foco con contraste ≥ 3:1; no confiar solo en `outline: none` sin reemplazo.
5. **1.4.13 Content on Hover/Focus** — tooltips/overlays: dismissible, hoverable, persistent lo razonable.

## Qué mirar en una pantalla (orden)

1. ¿Se entiende el bloque de tarea sin leer el copy? (silueta / agrupación)
2. ¿Card vs página: relleno 3:1, borde 3:1, o falla?
3. ¿Modo claro y oscuro? Revisar **los dos**.
4. ¿Foco Tab en botones del card: anillo visible sobre ese fondo?
5. ¿Solo sombra?** Si al quitar la sombra el bloque se pierde → falta borde o relleno.

## Respuesta

Corta, una decisión:

```markdown
## Surface · [nombre del bloque]
Mecanismo hoy: relleno / borde / sombra / ninguno claro
WCAG 1.4.11: OK / FALTA (por qué)
Cambio mínimo: …
No tocar: …
```

El cambio mínimo es uno: subir contraste de relleno, **o** agregar stroke 1px con contraste ≥ 3:1, **o** dejar igual si ya cumple.

## Fuera de alcance (por ahora)

- Micro-animaciones, marketing layout, “más moderno”.
- Refactors grandes de design tokens.
- Reglas de marca específicas del producto (van en otra skill o en CSS existente).
