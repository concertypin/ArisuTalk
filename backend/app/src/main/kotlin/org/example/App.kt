package org.example

/**
 * Main class for the ArisuTalk backend application.
 * This class provides the application's entry point and includes basic greeting functionality.
 */
class App {
    /**
     * Returns the application's greeting message.
     * @return "Hello World!" string
     */
    val greeting: String
        get() {
            return "Hello World!"
        }
}

/**
 * Main entry point for the application.
 * This function creates an App instance and prints the greeting to the console.
 */
fun main() {
    println(App().greeting)
}
