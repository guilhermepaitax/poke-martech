interface ObjectStorage {
  upload(input: {
    body: Uint8Array;
    contentType: string;
    filename: string;
  }): Promise<string>;
}

export type { ObjectStorage };
