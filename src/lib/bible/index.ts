import { registerProvider, providerFor } from "./provider";
import { localProvider } from "./local";
import { createApiBibleProvider, createBibliaProvider } from "./licensed";

registerProvider(localProvider);
if (process.env.APIBIBLE_KEY) registerProvider(createApiBibleProvider(process.env.APIBIBLE_KEY));
if (process.env.BIBLIA_KEY) registerProvider(createBibliaProvider(process.env.BIBLIA_KEY));

export { providerFor };
export * from "./local";
