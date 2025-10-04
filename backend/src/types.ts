export type Data = {
  id: string;
  name: string;
  description: string;
  author: string;
  additionalData: string; // BLOBUrl
};

export type PartialData = Partial<Omit<Data, "id">> & { id?: string };
