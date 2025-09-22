import { PersonaChatApp } from ".";

export { };

declare global {
  interface Window {
    __dev__?: {
      dumpLocalStorage: () => string;
      dumpIndexedDB: () => Promise<string | null>;
    };
    /**
     * @deprecated Use window.personaApp instead.
     */
    app?: PersonaChatApp
    personaApp?: PersonaChatApp // Same as app, why exist both?
  }
}
