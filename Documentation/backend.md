The backend server is an Express.js webserver containerised in Docker. It serves a Single-Page Application. The server and the page are in SourceCode/backend.

# Files
- app.js - Initialises all the settings and starts the api listening on the specified port.
- Dockerfile - Sets the variables and tells docker how the container should run and which ports to use.
- package.json and package-lock.json - Contains all the dependencies that are required for the application to run. On the first run the application will install the packages from this list.
- .env.example - This is an example .env which will need to be renamed for the application to function. This will contain data such as api keys and ports which need to remain secure.
- src/controller.js - This file is what app.js will read and broadcast the endpoints contained within. In peelback there are 2 main endpoints, one which communicates with the openAI api and the other which is used for testing the connection between the front and back end.
- src/promptBuilder.js - Building the prompt that is sent to ChatGPT
- src/promptConfig.js - This was originally how we were going to communicate with the AI and get it to fill out the required fields but we have changed the approach so this is now depreciated.
- src/routes.js - This file defines how the endpoints will run i.e. the type of request required to run. It also links the endpoints to the functions in controller.js. 
