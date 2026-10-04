let ioRef = null;
export function setIo(io) { ioRef = io; }
export function getIo() { return ioRef; }

export function publish(code, event, payload) {
  if (!ioRef) return;
  ioRef.to(`game-${code}`).emit(event, payload);
}
