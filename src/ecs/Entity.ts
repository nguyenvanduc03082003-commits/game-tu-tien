export type Entity = number;

let nextEntityId = 1;

export function createEntityId(): Entity {
  return nextEntityId++;
}

export function resetEntityIdCounter(): void {
  nextEntityId = 1;
}

export function getNextEntityId(): number {
  return nextEntityId;
}

export function setNextEntityId(id: number): void {
  nextEntityId = id;
}
