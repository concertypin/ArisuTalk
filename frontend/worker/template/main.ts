import { expose } from "comlink";
expose(
    // Pass the object you want to expose
    {
        hello() {
            return "Howdy from worker!";
        },
        theAnswer: 42,
    }
);
