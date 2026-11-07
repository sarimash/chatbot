Manual given/when/then cases. Every ticket adds its cases in its own PR, and runs them before moving to Done

ticket: SCRUM-11 user tests
given: `npm run dev` is running
when: I open http://localhost:5173
then: I see a bold dark "Chatbot" heading
status: pass

ticket: SCRUM-11 user tests
given: `npm run dev` is running
when: I open http://localhost:5173 in dark mode
then: I see a bold white "Chatbot" heading on a dark background
status: pass

ticket: SCRUM-11 user tests
given: `docker compose up` is running
when: I open http://localhost:8080 in dark mode
then: I see a bold dark "Chatbot" heading
status: pass

ticket: SCRUM-11 user tests
given: `docker compose up` is running
when: I open http://localhost:8080
then: I see a bold white "Chatbot" heading on a dark background
status: pass

ticket: SCRUM-13 models smoke test
given: `npm run dev` is running, LM studio server running and a model loaded
when: I open http://localhost:8080 
then: I should see the model IDs
status: pass

ticket: SCRUM-13 models smoke test
given: `npm run dev` is running, LM studio server not running
when: I open http://localhost:8080 
then: I should see an error message 502
status: pass

