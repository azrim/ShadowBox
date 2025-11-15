declare module "@zama-fhe/relayer-sdk" {
  export const createInstance: (config: any) => Promise<any>;
  export const SepoliaConfig: any;
}

declare module "@zama-fhe/relayer-sdk/web" {
  export const createInstance: (config: any) => Promise<any>;
  export const SepoliaConfig: any;
  export const initSDK: (options?: any) => Promise<any>;
}

declare module "@zama-fhe/relayer-sdk/node" {
  export const createInstance: (config: any) => Promise<any>;
  export const SepoliaConfig: any;
}
