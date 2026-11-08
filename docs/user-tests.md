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
date: 11/6/2026

ticket: SCRUM-11 user tests
given: `docker compose up` is running
when: I open http://localhost:8080 in dark mode
then: I see a bold dark "Chatbot" heading
status: pass
date: 11/6/2026

ticket: SCRUM-11 user tests
given: `docker compose up` is running
when: I open http://localhost:8080
then: I see a bold white "Chatbot" heading on a dark background
status: pass
date: 11/6/2026

======================

ticket: SCRUM-13 models smoke test
given: `docker compose up` is running, LM studio server running and a model loaded
when: I open http://localhost:8080 
then: The first model's chat id is shown under heading
status: pass 
date: 11/7/2026

ticket: SCRUM-13 models smoke test
given: `docker compose up` is running, LM studio server not running
when: I open http://localhost:8080 
then: I see "Can't reach LM Studio. Is the server running?"
status: pass
date: 11/7/2026

======================

ticket: SCRUM-14 streaming
given: `docker compose up` is running, instruct model loaded
when: I type "Say hi in 100 words" and press enter
then: My message shows on the right, and the reply appears gradually on the left, not all at once
status: pass
date: 11/7/2026

ticket: SCRUM-14 streaming
given: same as above
when: I press shift+enter in the box
then: A newline is added and nothing is sent
status: pass
date: 11/7/2026

ticket: SCRUM-14 streaming
given: same as above
when: I send "Write five short paragraphs about the sea"
then: The view keeps following the newest text as it streams
status: pass
date: 11/7/2026

ticket: SCRUM-14 streaming
given: Input is empty or only spaces [both must pass to pass this case]
when: I look at send and press enter
then: Send is disabled and nothing is sent
status: pass
date: 11/7/2026

ticket: SCRUM-14 streaming
given: I already sent at least one message
when: I send "What did I just ask you?"
then: The reply refers to my previous message
status: pass
date: 11/7/2026

======================

ticket: SCRUM-15 stop button
given: A reply is streaming
when: I look at the composer
then: The button says Stop instead of Send
status: pass
date: 11/7/2026

ticket: SCRUM-15 stop button
given: A long reply is streaming
when: I click Stop mid-reply
then: Streaming ends, the text so far stays, no error appears, and the button is Send again
status: pass
date: 11/7/2026

ticket: SCRUM-15 stop button
given: A request has been sent
when: I click Stop immediately after sending, before any reply is received
then: No empty assistant bubble remains, and my message stays
status: pass
date: 11/7/2026

ticket: SCRUM-15 stop button
given: The previous test has just been done, I am viewing LM Studio dev logs
when: I stop a reply
then: The log shows generation stopped, and I can send another message
status: pass
date: 11/7/2026

======================

ticket: SCRUM-16 model picker
given: LM Studio has an embedding model and a chat model
when: I open the picker
then: Only chat models are listed; embedding models are filtered out
status: pass
date: 11/7/2026

ticket: SCRUM-16 model picker
given: Two chat models are available
when: I pick each model and send a message
then: LM Studio's log shows the correct model handled each message
status: pass
date: 11/7/2026

ticket: SCRUM-16 model picker
given: A reply is streaming
when: I look at the picker
then: The picker is disabled until the reply ends
status: pass
date: 11/7/2026

======================

ticket: SCRUM-17 errors
given: App open, LM studio server then stopped
when: I send a message
then: The can't reach message appears and no empty bubble remains
status: pass
date: 11/7/2026

ticket: SCRUM-17 errors
given: LM Studio running with no model loaded (just-in-time loading disabled in server settings)
when: I open the app
then: The banner says no models found
status: pass
date: 11/7/2026

ticket: SCRUM-17 errors
given: Same as above, then I load a model
when: I press Try Again
then: The banner goes away and the picker lists the model
status: pass
date: 11/7/2026

ticket: SCRUM-17 errors
given: Page loading, LM Studio healthy
when: I reload the page
then: The banner doesn't flash before the model appears
status: pass
date: 11/7/2026

======================

ticket: SCRUM-18 Persistence
given: A finished conversation
when: I reload the page
then: The same conversation is shown
status: pass
date: 11/7/2026

ticket: SCRUM-18 Persistence
given: I picked a non-default model
when: I reload the page
then: The same model is selected
status: pass
date: 11/7/2026

ticket: SCRUM-18 Persistence
given: A conversation exists
when: I click New Chat
then: The list is empty, and after a reload it stays empty
status: pass
date: 11/7/2026

ticket: SCRUM-18 Persistence
given: A reply is streaming
when: I click New Chat
then: Nothing happens; the button is disabled
status: pass
date: 11/7/2026

ticket: SCRUM-18 Persistence
given: DevTools open, Application tab
when: I send a message
then: The stored message updates once the reply ends, not on every token
status: pass
date: 11/7/2026

======================

ticket: SCRUM-19 System prompt
given: Prompt: "Answer only in French" (and using a thinking model that respects the prompt)
when: I send "Hello"
then: The reply is in French
status: pass
date: 11/7/2026

ticket: SCRUM-19 System prompt
given: Prompt set
when: I look at messages and devtools stored messages
then: The prompt does not appear
status: pass
date: 11/7/2026

ticket: SCRUM-19 System prompt
given: Prompt set 
when: I reload
then: The prompt box still holds the prompt
status: pass
date: 11/7/2026

ticket: SCRUM-19 System prompt
given: Prompt cleared
when: I send a message
then: The model stops following the old instruction
status: pass
date: 11/7/2026

======================

ticket: SCRUM-21 Tests
given: A fresh clone after npm install
when: I run npm test
then: All tests pass
status: pass
date: 11/7/2026

======================

Command for SCRUM-22 tasks: 
docker compose exec api node -e "fetch('http://localhost:3000/tools/fetch-page', {method:'POST', body: JSON.stringify({url:'https://example.com'})}).then(r => r.text()).then(console.log)"


ticket: SCRUM-22 Tests
given: docker compose up --build is running
when: I enter the command: 
then: I get JSON with the title “Example Domain” and some text
status: pass
date: 11/8/2026

ticket: SCRUM-22 Tests
given: docker compose up --build is running
when: I enter the command with the URL of an image
then: I get a clear error, not a crash
status: pass
date: 11/8/2026

ticket: SCRUM-22 Tests
given: docker compose up --build is running
when: I enter the command with {url:'not a url'}
then: I get an invalid-URL error, and the service still responds
status: pass
date: 11/8/2026

