export let getGlobalContext: () => Record<string, string> | undefined;

export const setGlobalContext = (value: () => Record<string, string>) => {
  getGlobalContext = value;
};
