# Notas 8 de agosto 2026 

 
**Cambios**

- Mejoras en el importador de PNJ.
- Cambios en la estructura de PNJ.
- Cambios en las fichas de todos los actores en la parte de equipamiento.
- Implementados objetos mágicos encantados y virtuosos.
- Implementada zona trey donde quedan reflejados los dados.



# Notas 1 de agosto 2026 

 
**Cambios**

- Implementadas las opciones de tirada en las armas de proyectiles.
- Implementadas las otras dos formas de recuperación de puntos de magia.
- Se crea el tipo de item objeto mágico y el tipo de item deidad.
- Añadido compendio de deidades y cambios derivados en el creador de personajes.
- Implementado creador de enlaces.
- Diversos cambios estéticos.
- Resuelto el modal que se disparaba al importar un pj de una aventura.
- Cambios menores en diversas parte del ruleset para mejorar la visibilidad.



# Notas 25 de julio 2026 

**Pendientes**

- Opciones de escudo, cobertura y parada en armas a distancia

  
**Cambios**

- Armas de proyectiles que sobrepasen su distancia máxima hacen mitad de daño.
- Se pone por defecto que las lealtades estén representadas por su iconografía. En las opciones del ruleset se puede revertir a texto con círculo.
- Opciones iniciales de combate cuerpo a cuerpo.




# Notas 21 de julio 2026 

**Pendientes**

- Armas de proyectiles que sobrepasen su distancia máxima hacen mitad de daño.

  
**Cambios**

- Cambios en el orden de la presentación en la pestaña de magia.
- Añadidas descripciones e iconos en el compendio de habilidades.
- Añadida ventana emergente (con retraso de 3 segundos) al pasar el ratón sobre las habilidades que muestra su descripción.
- Cambios en las mecánicas de combate para reflejar la utilización del punto de fortuna para repetir.
- Añadidas marcas en rasgos y motivaciones. Al pulsar fin de sesión se cuentan las marcas y se añaden tantos puntos de fortuna (sin superar el máximo) como marcas estén cubiertas.
- Ahora los Rasguños también generan su entrada en la tabla de heridas (aunque no tienen checkbox circular).
- Se añade a la tabla de heridas un campo numérico. Si se recibe daño de forma automática por el ruleset se autocompletará ese campo con la cantidad de PV perdidos.
- Correcciones de localización.
- Tiradas de lanzamiento de hechizo: Desglose completo de la tirada en la tarjeta del chat.







# Notas 17 de julio 2026 

**Pendientes**

**Cambios**

- Agrupacion de hechizos por esferas en el creador de personajes.
- Cambios estéticos en pestaña de Magia.
- Cambio de checkboxes a círculos estilo ruleset en el creador de personajes.
- Cambios en la estructura de las armas. Las que ofrecen protección se añaden también automáticamente a las protecciones.
- Correcciones en compendio de armas de proyectiles.
- Añadida automatización de heridas en los campos de anotación.
- Cambios en la caja de destino. Ahora pueden crearse "items" en una lista para asignarle puntos.
- Se añade un compendio de Aventuras. Se incluye El Rey Olvidado (con permiso del autor)




# Notas 12 de julio 2026 

**Pendientes**
- Agrupación de hechizos

- 
**Cambios**

- Cambios en hojas de PNJ, Criaturas y Demonios
- Resubidos los compendios de Criaturas, Demonios y Animales
- Correcciones en cálculos de habilidades
- Cambios en colores de diarios
- Añadidos campos para anotación de heridas
- Añadidos campos para anotaciones de uso de puntos de destino.




# Notas 10 de julio 2026 

**Pendientes**
- Armaduras y armas con círculos verdes en lugar de checkboxes en el creador de personajes.

- 
**Cambios**

- Cambios en la mecánica de tiradas enfrentadas.
- Solucionados problema de necesidad de doble arrastres de items.
- Implementada penalización por ceguera.
- Implementada la posibilidad de especialidades en profesiones.





# Notas 24 de junio 2026 

**Pendientes**
- Cambiar tarjetas de chat

- 
**Cambios**

- Cambios diálogos de combate
- Cambios interfaz de PJ
- Cambios interfaz de PNJ
- Se crea el compendio de habilidades. Las habilidades ahora son items arrastrables.
- Cambios en los importadores de PNJ, Criaturas y Demonios.
- Implentado correctamente los niveles de hechizo en los PJ.
- Cambios en espíritu consagrado.
- Cambios en interfaz de demonios y criaturas






# Notas 23 de junio 2026

**Pendientes**
- Cambiar diálogos
- Cambiar tarjetas de chat

- 
**Cambios**

- Cambiada la base de pnj para solucionar los problemas en herencias
- Solucionado fallo en hechizos consagrados en el Creador de PJ
- Importadores de criaturas y demonios casi completados
- solucionado el problema del tamaño en la importación de demonios
  


# Notas 10 de junio 2026

**Cambios**

- Texto informativo en el importador de PNJ
- Cambios en la tarjeta de chat de Hechizos
- Cambios en el registro de numeración en la pestaña de Magia del PJ
- Correcciones en la Lucha de Espíritu




# Notas 9 de junio 2026

**Cambios**

- Cambios en la estética de la ficha de PNJ.
- Mejoras en el importador de PNJ mejorando los procesos de RegEx.
- Corrección de fallos en el paso de habilidades del Creador de Personajes.




# Notas 8 de junio 2026

**Cambios**

- Se ha modificado el diálogo de las habilidades no de combate para reflejar aquellas que están "topadas" por otra habilidad.
- el estorbo ha pasado de ser un modificador fijo (se mantenía como error en el diseño) a un modificador según el habilidad.

**Cosas que funcionan a medias**

- El creador de personajes está al 80% aprox.
- La interacción de los efectos de desangrado, agonía y el recuento de heridas tiene que trabajarse

**Cosas comenzadas**

- Importador de PNJ

**Cosas sin comenzar**

- Creador de PNJ, demonios y criaturas

**Añadidos**
- Widget del director
- El valor de Lealtad que esté 10 puntos por encima de los otros se pone en rojo

**Fallos detectados a corregir**







# Notas 7 de junio 2026

**Cosas que ya funcionan**

- La ficha básica es completamente operativa.
- Los compendios incluidos son utilizables
- Diferencia entre las tiradas normales, las de combate, las académicas y las de primeros auxilios.

**Cosas que funcionan a medias**

- El creador de personajes está al 75% aprox.
- La interacción de los efectos de desangrado, agonía y el recuento de heridas tiene que trabajarse

**Cosas sin comenzar**

- El importador de PNJ
- Creador de PNJ, demonios y criaturas

**Fallos detectados a corregir**

- Cambiar entradas de compendio sobre el personaje crea errores en las puntuaciones de características
- El descuento de PV por agonía salta siempre que se ha llegado a cero en los puntos de vida aunque luego hayan vuelto a aumentar.
