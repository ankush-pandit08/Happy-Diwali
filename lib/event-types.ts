export type Entry = { id: string; name: string; played: number; win: number };
export type EventState = { entry: Entry | null; winnerCount: number };
