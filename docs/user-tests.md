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
then: I should see an error message 502
status: pass
date: 11/6/2026

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
