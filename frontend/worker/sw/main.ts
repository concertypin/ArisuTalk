import { precacheAndRoute } from "workbox-precaching";
declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
/**
 * @todo Write additional service worker code below this line.
 */
