export function getStateData(registros: any[]) {
  const counts: Record<string, number> = {};

  registros.forEach(registro => {
    let estado = "";
    if (registro.tipo_registro === "PRESTADO") {
      estado = registro.estado_prestador || "";
    } else if (registro.tipo_registro === "TOMADO") {
      estado = registro.estado_tomador || "";
    } else if (registro.tipo_registro === null) {
          estado = registro.estado_tomador;

    } //TIRAR ISSO APOS FINALIZADO

    if (estado) {
      counts[estado] = (counts[estado] || 0) + 1;
    }
  });

  return Object.entries(counts).map(([estado, count]) => ({
    estado,
    count
  }));
}