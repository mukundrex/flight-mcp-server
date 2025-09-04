create mcp server for a flight search:

This mcp server will have three things:

resources to fetch airport details, airline details
tools to fetch available airlines between two airport (include connecting flight also) on a date(if date not provided consider current date), available airlines between two airport between two given dates and two given time.
prompts to create flight search query

use typescript sdk to create this mcp server

to use third party api create mock api for fetching airline details or airport details