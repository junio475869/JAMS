Job Application Management System (JAMS) - Project Requirements
Overview
The Job Application Management System (JAMS) is a comprehensive platform designed to help job seekers organize, track, and optimize their job search process. This system will provide tools to manage applications, track progress, store important documents, and analyze job search performance.

Core Features
1. User Management
User Registration & Authentication

Email/password signup

Social media login (Google)

Two-factor authentication option

Profile Management

Personal information storage

Multiple resume/CV versions

Cover letter templates

Skills inventory

Professional certifications

Work history database

2. Job Application Tracking
Application Dashboard

Visual pipeline of all applications (applied, interview, offer, rejected)

Custom status categories

Quick-view statistics

Application Details

Company information

Job description storage

Application date tracking

Salary/benefits information

Contact person details

Follow-up reminders

Document Management

Resume/CV versions matched to applications

Custom cover letters

Supporting documents

Offer letters and contracts

3. Job Search Tools
Job Board Integration

API connections to major job boards (LinkedIn, Indeed, Glassdoor)

One-click application for supported platforms

Saved searches with alerts

Company Research

Company profiles

Employee reviews integration

Salary range data

Growth metrics

Networking Tracker

Contact management

Meeting/coffee chat scheduler

Follow-up reminders

Relationship strength indicators

4. Interview Management
Interview Preparation

Common questions database

Company-specific question bank

STAR method response builder

Interview Tracking

Schedule coordination

Interview type (phone, video, onsite)

Interviewer details

Notes and feedback storage

Follow-up System

Thank you email templates

Reminder system for follow-ups

Status update tracking

5. Analytics & Reporting
Application Metrics

Application success rates

Time-to-response statistics

Company response patterns

Performance Tracking

Interview conversion rates

Offer rates

Skill gap analysis

Custom Reports

Exportable data for career coaches

Visual progress charts

Job search timeline

6. Productivity Features
Task Management

To-do lists for job search activities

Deadline tracking

Priority tagging

Calendar Integration

Sync with Google/Outlook calendars

Interview scheduling

Follow-up reminders

Goal Setting

Weekly application targets

Networking goals

Skill development tracking

7. Learning Resources
Career Development Library

Resume writing guides

Interview preparation materials

Salary negotiation tips

Skill Assessment

Competency evaluations

Gap identification

Recommended learning paths

Community Features

Peer support forums

Mentor matching

Success stories

Technical Requirements
Frontend
Responsive web application (mobile-first design)

Progressive Web App (PWA) capabilities

Intuitive UI/UX with dark/light mode

Accessibility compliant (WCAG 2.1)

Backend
RESTful API architecture

Secure authentication system

Database for user data and application tracking

Cloud storage for documents

Integration APIs for job boards

Data Security
End-to-end encryption for sensitive data

GDPR/CCPA compliance

Regular security audits

Data export/delete functionality

Additional Considerations
Multi-platform Support: Web, mobile apps (iOS/Android)

Offline Functionality: Basic tracking without internet

Multi-language Support: Initial English with expansion capability

Subscription Model: Freemium with premium features

Data Portability: Export all user data in standard formats

Future Enhancements
AI-powered resume tailoring

Automated application submission

Interview performance analysis via voice/video

Salary negotiation simulator

Company culture matching algorithm

This requirements document provides a comprehensive foundation for developing a Job Application Management System that would significantly enhance a job seeker's organization and effectiveness in their search. Would you like me to elaborate on any particular aspect or prioritize certain features?

there would be 50 users(job seekers)


- add function to help candidate while he having an interview:
before interview candidate turn on the chrome live caption. the program track the caption and analize interviewer's questions and give perfect answers to the candidate.
the perfect answers would be make by openai with pre-given keywords
Enhanced Job Application Management System (JAMS) Requirements
For 50 Job Seekers with AI-Powered Interview Assistance

New Feature: Real-Time Interview AI Assistant
1. Core Functionality
Live Caption Integration

Chrome browser extension that captures live captions during video interviews (Zoom, Google Meet, Teams)

Real-time speech-to-text conversion of interviewer's questions

Auto-detects question type (behavioral, technical, situational)

AI-Powered Answer Generation

Uses OpenAI (GPT-4) to generate optimal responses based on:

Candidate’s pre-submitted resume/CV

Job description keywords

Company research data (from JAMS database)

Common interview frameworks (STAR, CAR, SOAR)

Provides 3 answer variations (concise, detailed, storytelling)

User Customization

Pre-interview keyword input (skills, achievements, projects)

Adjustable tone (formal, conversational, technical)

Option to pre-write answers for expected questions

2. Technical Implementation
Frontend (Chrome Extension)
Captures live captions using Chrome’s Web Speech API

Displays AI-generated answers in a floating sidebar

Hotkey support (quick toggle mute/unmute while reading answers)

Backend (AI Processing)
Python FastAPI server handling OpenAI requests

Cache system for frequent questions (e.g., "Tell me about yourself")

Rate limiting (50 users, ~5 interviews/day max per user)

Data Flow
Interview starts → User activates Chrome extension

Speech → Text → Captions sent to backend

AI processes question + user’s keywords → Generates answer

Answer displayed in sidebar (2-3 sec delay max)

3. Privacy & Security
No audio recording (only processes live captions)

End-to-end encryption for interview data

Auto-delete transcripts post-interview (GDPR compliant)

4. Mock Workflow
Before Interview
User uploads:

Resume

Job description

Keywords ("Python, AWS, Agile")

AI pre-generates common Q&A (e.g., "Why this company?")

During Interview
Interviewer asks: "Describe a time you solved a difficult bug?"

Extension captures text → AI detects behavioral question

Generates answer using:

python
Copy
{  
  "framework": "STAR",  
  "example": "At {Company}, I debugged {AWS Lambda timeout} using {Python logs}...",  
  "keywords": ["AWS", "Python"]  
}  
User reads/personalizes answer in real-time

After Interview
Transcript saved (optional)

Performance analytics (e.g., "5/7 questions answered optimally")

5. Limitations & Notes
Requires Chrome browser (no Safari/Firefox support initially)

~2-second delay for AI processing

Ethical mode (disclaimer: "Use as a guide, not verbatim")

Would you like to prioritize low-latency optimization or multi-browser support next?

by using next.js, nest.js, mongodb, tailwindcss, lazyloading, ai, default dark theme, microservices architecture, 

- record interviewer's questions
- add page which provide this
share interview questions between job seekers
give the best answers by generating AI , briefly , it's okay listed style.
Job Application Management System (JAMS) - Technical Implementation
Tech Stack:

Frontend: Next.js (App Router), TailwindCSS (Dark Theme by Default), Lazy Loading

Backend: Nest.js (Microservices Architecture)

Database: MongoDB (Atlas)

AI: OpenAI API (GPT-4) for answer generation

Real-Time Processing: Web Speech API (Chrome Extension)

1. AI-Powered Interview Assistant
Features:
✅ Live Interview Question Recording & Analysis

Chrome extension captures interviewer’s speech → converts to text (Web Speech API)

AI (OpenAI) analyzes questions in real-time and generates 3 best answers

Answers tailored to:

Candidate’s resume

Job description keywords

Company-specific data

✅ Interview Question Sharing Hub

Job seekers can submit & browse interview questions per company/role

Upvote/downvote system for relevance

AI generates sample answers for each question

✅ Post-Interview Analytics

Full transcript saved (optional)

AI feedback: "You answered 80% of technical questions optimally"

2. System Architecture (Microservices)
Frontend (Next.js)
Pages:

/interview-prep → AI answer generator

/question-hub → Crowdsourced interview Q&A

/analytics → Performance tracking

Features:

Dark theme (TailwindCSS)

Lazy loading for faster performance

Backend (Nest.js Microservices)
Auth Service – JWT-based authentication

Question Processing Service – Handles OpenAI API calls

Storage Service – MongoDB (interview logs, resumes)

Chrome Extension API – Real-time speech-to-text

Database (MongoDB)
Collections:

users (job seeker profiles)

interviews (transcripts, AI feedback)

shared_questions (crowdsourced Q&A)

3. Workflow
Before Interview
User uploads resume & job description

AI pre-generates expected questions

During Interview
Chrome extension captures questions (Web Speech API)

AI generates answers in sidebar (STAR/CAR format)

User reads/adapts responses

After Interview
Transcript saved to /analytics

User can share questions to /question-hub

4. Ethical & Performance Notes
⚠ Privacy:

No audio stored, only processed text

Opt-in for sharing questions

⚡ Optimizations:

Lazy loading (Next.js dynamic imports)

Redis caching for frequent questions

Next Steps?
Prioritize Chrome extension development

Build OpenAI prompt engineering for answer quality

Add mock interview simulation

Would you like a detailed API schema or UI wireframes next?

add calendar for each users
each users can have many gmails.
if is it posibble integrate with third party calendars and show all of them into one calendar
add alerting system from calendar event
alert is slack alert, email alert
Enhanced Calendar & Alert System for JAMS
(Next.js + Nest.js + MongoDB + Third-Party Integrations)

1. Multi-Calendar Integration
Features
✅ Unified Calendar View

Users can connect multiple Google Calendars (Gmail accounts)

Supports Outlook, Apple Calendar (via CalDAV)

All events merged into a single UI (color-coded by source)

✅ Interview Scheduling

Auto-detects interview invites (keywords: "Interview", "Hiring Manager")

Syncs with /interview-prep for AI-powered prep

✅ Manual Event Adding

Users can add custom job-search events (e.g., "Follow up with Amazon recruiter")

2. Alert System
Notification Types
🔔 Slack Alerts

Direct messages to user’s Slack

Example: "Interview with Google in 1 hour! [Prep Link]"

📧 Email Alerts

Gmail/Outlook integration

Example: "Reminder: Resume submission due tomorrow for Meta"

Alert Triggers
Before Interview (15 mins, 1 hour, 1 day prior)

Application Deadlines (customizable)

Follow-up Reminders (e.g., "Send thank-you email to [Recruiter]")

3. Technical Implementation
Backend (Nest.js Microservices)
Calendar Sync Service

Uses Google Calendar API (OAuth 2.0)

Supports Microsoft Graph API (Outlook)

Handles CalDAV (Apple Calendar)

Alert Engine

Checks for upcoming events every 5 mins (cron job)

Triggers Slack Webhooks & SMTP emails

Event Processing

Detects interview-related events (AI keyword matching)

Auto-links to /interview-prep

Frontend (Next.js)
/calendar Page

FullCalendar.io integration (React wrapper)

Toggle calendars on/off

Dark mode support (TailwindCSS)

Alert Settings

Checkbox: "Notify me via Slack 1 hour before interviews"

Database (MongoDB)
user_calendars

json
Copy
{
  "userId": "123",
  "calendarType": "Google",
  "calendarId": "primary",
  "syncToken": "XYZ"
}
user_alerts

json
Copy
{
  "userId": "123",
  "alertType": "slack",
  "slackWebhook": "https://hooks.slack.com/...",
  "rules": [
    { "eventType": "interview", "triggerBefore": "1 hour" }
  ]
}
4. Workflow Example
User connects 2 Gmail calendars + Outlook

System detects:

"Technical Interview - Amazon (Today, 3 PM)" (Google Calendar)

"Follow up: Netflix HR" (Outlook)

Slack Alert at 2 PM:

🚀 "Amazon Interview in 1h! [Review Prep Notes]"

Post-interview: Auto-suggests "Send thank-you email?"

5. Security & Limits
🔒 OAuth-only access (no password storage)
⏳ Rate-limited API calls (avoid Google/Outlook bans)
🗑️ User can disconnect calendars anytime

Next Steps?
Implement Google OAuth flow

Build Slack alert dispatcher

Add Outlook/Apple Calendar support

Would you like a detailed API spec for calendar sync?

on the calendar side add feature which user can summary the availabilities

if is it possible add page to manage emails like spark
add ai feature which can identify email - job apply confirm, invite an interview, send availability, etc
Enhanced Calendar & Email Management for JAMS
1. Smart Availability Summarization
Features
✅ Automated Availability Detection

Scans connected calendars to identify free/busy slots

Generates weekly/monthly availability reports

Visual heatmap of optimal scheduling times

✅ One-Click Availability Sharing

Generates pre-formatted availability messages:

text
Copy
"I'm available:
- Mon 10am-12pm
- Wed 2pm-4pm
- Fri 9am-11am
Please let me know what works best!"
Copy/paste or direct email insertion

✅ AI-Powered Scheduling Suggestions

Recommends best times for:

Follow-up emails

Networking calls

Interview preparation

2. Spark-like Email Management
Email Organization Features
📧 Unified Inbox

Connect multiple Gmail/Outlook accounts

Unified view across all connected accounts

Customizable folder/label system

🤖 AI Email Categorization

Auto-tags emails as:

typescript
Copy
type EmailCategory =
  | "Job Application Confirmation"
  | "Interview Invite"
  | "Recruiter Outreach"
  | "Availability Request"
  | "Offer Communication"
  | "Rejection"
  | "Follow-up Required"
Priority inbox sorting

Email Processing Actions
🚀 Smart Quick Replies

AI-generated responses for common emails:

text
Copy
"Thanks for the interview invite! I'm available [insert available slots]."
One-click insertion into email client

🔔 Follow-up Reminders

Auto-detects emails needing response

Creates calendar reminders for follow-ups

3. Technical Implementation
Backend Services
Calendar Analysis Microservice

Processes free/busy data from Google/Outlook APIs

Implements standard iCal availability algorithms

Email Processing Pipeline

Uses NLP to classify emails (Python FastAPI service)

Integrates with Gmail API and Microsoft Graph API

AI Response Generator

Fine-tuned GPT model for email responses

Context-aware (reads entire email thread)

Frontend Components
🗓️ Availability Dashboard

jsx
Copy
<AvailabilityHeatmap 
  events={calendarEvents}
  workingHours={userPreferences.workingHours}
/>
📩 Email Management Page

Three-panel layout (folder list, email list, email view)

Bulk action toolbar

Smart search with natural language processing

4. Security Considerations
🔒 Data Protection

End-to-end encryption for email content

OAuth token refresh handling

GDPR-compliant data processing

⏱️ Performance Optimizations

Lazy loading of email attachments

Client-side caching for calendar data

Web workers for background email processing

5. User Workflow Example
Morning Routine

Checks AI-organized email inbox

Quick-replies to interview invites with availability

Reviews calendar availability summary

During Job Search

Receives Slack alert about unanswered recruiter email

Uses AI to draft professional response

Schedules follow-up in calendar

Evening Review

Checks analytics on email response times

Adjusts availability preferences for next week

Next Steps
Priority Development

Gmail/OAuth integration

Core availability algorithm

Basic email classification model

Secondary Features

Outlook.com support

Advanced natural language search

Mobile app notifications

Would you like me to elaborate on any particular component's architecture or provide sample API endpoints for these features?

each user makes their own email templates and send it to the email senders
Custom Email Templates & Sending System
1. Email Template Management
Template Creation Features
✏️ User-Defined Templates

WYSIWYG editor with formatting options

Variables for personalization:

text
Copy
"Hi {RecruiterName},
I'm {YourName} applying for {JobTitle}..."
Categorization by purpose:

Follow-ups

Thank-you notes

Status inquiries

Networking requests

📁 Template Organization

Folder system with tags

Search/filter functionality

Import/export as JSON

AI-Assisted Template Creation
🛠️ Smart Template Generator

"Create a follow-up email for [Company] after [X days]"

Auto-fills with job-specific details

Tone adjustment (Professional/Friendly/Enthusiastic)

2. Email Sending System
Integrated Email Client
📤 Direct Sending Features

Select template → Auto-load in composer

Variable replacement from:

Job applications

Calendar events

Contact database

🔗 Attachment Management

Auto-attach relevant:

Resumes (version-matched to job)

Portfolio pieces

Reference letters

Send Tracking & Analytics
📊 Email Performance Dashboard

Open rate tracking (via pixel)

Response rate monitoring

Best time-to-send recommendations

3. Technical Implementation
Database Schema
javascript
Copy
// Email Templates
{
  userId: ObjectId,
  templateName: "Follow-up After Interview",
  category: "follow-up",
  content: "<html>...",
  variables: ["RecruiterName", "JobTitle"],
  lastUsed: Date
}

// Sent Emails
{
  userId: ObjectId,
  templateId: ObjectId,
  recipient: "recruiter@company.com",
  sentAt: Date,
  opened: Boolean,
  variablesUsed: {
    RecruiterName: "Jane Doe",
    JobTitle: "Senior Developer"
  }
}
Microservices Architecture
Template Service (Nest.js)

CRUD operations for templates

Version history

Email Delivery Service

Integrates with:

Nodemailer (SMTP)

AWS SES

Mailgun API

Tracking Service

Open/click tracking

Analytics aggregation

4. User Workflow
Create Template

Uses editor to make thank-you email

Saves as "Technical Interview Follow-up"

Send Email

Selects from job application record:

text
Copy
Recipient: amazon-hiring@amazon.com
Variables:
  - RecruiterName: "Sarah"
  - JobTitle: "SDE II"
Reviews AI-suggested improvements

Sends with one click

Track Response

Receives notification when opened

System prompts follow-up after 5 days

5. Security & Compliance
🔐 Data Protection

Encryption for stored templates

OAuth for email sending

GDPR-compliant tracking

⚙️ Permission Controls

Team sharing options

Approval workflows for orgs

Next Steps
Core Implementation

Template editor component

Variable substitution engine

SMTP integration

Enhancements

Template A/B testing

Browser extension for quick access

Mobile template management

Would you like me to provide sample API endpoints for the template management system or detailed UI mockups for the email composer?

enhance security side, by using ip filtering, each request/response is encrypted, token...
Enhanced Security Architecture for JAMS
1. Multi-Layered Security Implementation
Network-Level Protection
🛡️ IP Filtering & Rate Limiting

Whitelist/blacklist IP ranges via Redis cache

Geo-blocking for suspicious locations

Rate limiting by endpoint:

typescript
Copy
// Nest.js Throttler configuration
@Throttle(100, 60) // 100 requests/minute
@UseGuards(ThrottlerGuard)
Data Encryption
🔒 End-to-End Encryption

TLS 1.3 for all communications

Application-layer encryption using AES-256-GCM

Encrypted database fields:

javascript
Copy
// MongoDB schema example
userEmail: {
  type: String,
  encrypt: {
    keyId: "kms_key_1",
    algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512"
  }
}
2. Advanced Authentication
Token Security
🗝️ JWT Enhancements

Short-lived access tokens (15min expiry)

Rotating refresh tokens with device fingerprinting

Token binding to IP/MAC address:

json
Copy
{
  "token": "xyz",
  "meta": {
    "ip": "192.168.1.100",
    "deviceId": "a1b2c3d4"
  }
}
Multi-Factor Authentication
🔐 Step-Up Authentication

Email/SMS OTP for sensitive actions

Biometric verification for:

Email template changes

Calendar deletions

Bulk exports

3. Secure Microservices Communication
Service-to-Service Auth
🤝 Mutual TLS Authentication

Certificate-based service identity verification

Istio service mesh policies:

yaml
Copy
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
spec:
  mtls:
    mode: STRICT
API Gateway Protection
🚪 Request Validation

Schema validation for all endpoints

GraphQL query depth limiting

SQL injection filters:

typescript
Copy
// Nest.js middleware
app.use(helmet());
app.use(sanitizeInput());
4. Audit & Monitoring
Real-Time Security Logging
📜 Immutable Audit Trail

Blockchain-backed logs for critical operations

Splunk integration for:

bash
Copy
# Sample log entry
[SECURITY] Failed login attempt: 
user=admin@test.com ip=45.227.253.109
Anomaly Detection
🚨 AI-Powered Threat Detection

Baseline normal behavior per user

Real-time alerts for:

Unusual template access patterns

Mass calendar exports

Geographic impossibilities

5. Data Protection
Secure Storage
🗄️ Encryption-at-Rest

AWS KMS for encryption keys

Per-field encryption in MongoDB

Automatic key rotation every 90 days

Data Sanitization
🧼 Input Cleaning Pipeline

XSS prevention:

typescript
Copy
function sanitize(input: string) {
  return DOMPurify.sanitize(input);
}
Content Security Policy (CSP) headers

6. Implementation Roadmap
Phase 1 (Core Security)
IP filtering middleware

JWT IP binding

Field-level encryption

Phase 2 (Advanced)
Service mesh integration

Behavioral biometrics

Blockchain audit logs

Phase 3 (Monitoring)
SIEM integration

Threat intelligence feeds

Automated pentesting

Security Headers Example
http
Copy
HTTP/1.1 200 OK
Strict-Transport-Security: max-age=63072000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
X-XSS-Protection: 1; mode=block
Would you like me to provide specific implementation code samples for any of these security layers? For example:

Nest.js IP filtering middleware

MongoDB field encryption setup

JWT fingerprinting implementation

give me all of requirements from the scratch which i given
Job Application Management System (JAMS) - Complete Requirements Document
1. Core System Overview
A comprehensive platform for job seekers to manage applications, interviews, and communications with AI-powered assistance.

Technical Stack
Frontend: Next.js (App Router), TailwindCSS (Dark Theme), Lazy Loading

Backend: Nest.js (Microservices)

Database: MongoDB Atlas

AI: OpenAI API (GPT-4)

Real-Time: WebSocket, Web Speech API

Security: JWT, IP Filtering, End-to-End Encryption

2. User Management
Authentication
Email/password + social login (Google, LinkedIn)

Two-factor authentication (SMS/Email)

JWT with IP/device binding

Session management dashboard

Profile Management
Multiple resume/CV versions

Cover letter templates with version control

Skills inventory with proficiency levels

Work history timeline

3. Job Application Tracking
Application Pipeline
Visual kanban board (Applied → Interview → Offer → Rejected)

Automatic status detection from emails

Company research integration (Glassdoor/LinkedIn)

Document Management
Resume matching to job descriptions

AI-generated cover letters

Offer letter storage with expiration alerts

4. AI-Powered Interview Assistant
Real-Time Support
Chrome extension for live captioning

AI analysis of interviewer questions (Web Speech API)

Generated responses using:

python
Copy
{
  "framework": "STAR",
  "keywords": ["AWS", "Agile"],
  "tone": "professional"
}
Interview Question Bank
Crowdsourced questions per company/role

AI-generated sample answers

Upvote/downvote system

5. Smart Calendar System
Unified Calendar
Google/Outlook/Apple Calendar integration

Color-coded event sources

Availability detection algorithm:

javascript
Copy
detectAvailability(calendars) {
  return freeSlots.filter(slot => !isWeekend(slot));
}
Automated Scheduling
Interview time suggestion tool

One-click availability sharing

Conflict detection

6. Email Management Suite
Unified Inbox
Multi-account support (Gmail/Outlook)

AI categorization:

typescript
Copy
type EmailType = 
  | "Interview Invite" 
  | "Application Confirmation"
  | "Rejection"
Template Engine
WYSIWYG editor with variables:

text
Copy
"Hi {Recruiter}, Regarding {JobTitle} at {Company}..."
Send tracking with open/response rates

AI-assisted reply generation

7. Security Framework
Data Protection
Field-level encryption (AES-256)

TLS 1.3 for all communications

IP whitelisting/blacklisting

JWT with device fingerprinting

Monitoring
Blockchain audit logs

Anomaly detection:

python
Copy
if request.location != user.last_login.country:
  trigger_2fa()
8. Analytics Dashboard
Job Search Metrics
Application success rates

Interview conversion timelines

Company response patterns

Personal Insights
Skill gap analysis

Networking effectiveness

Email response rates

9. Integration Ecosystem
Service	Integration Method	Use Case
Google Calendar	REST API	Scheduling
LinkedIn	OAuth	Profile Import
Slack	Webhooks	Alerts
OpenAI	API	Content Generation
Mailgun	SMTP	Email Sending
10. Compliance Requirements
GDPR data processing agreement

CCPA opt-out mechanism

SOC 2 Type II readiness

Automated data deletion pipeline

Implementation Roadmap
Phase 1 (Core)
User auth system

Basic application tracker

Email integration

Phase 2 (AI Features)
Interview assistant

Smart templates

Calendar sync

Phase 3 (Advanced)
Microservices refactor

Security hardening

Analytics engine

Technical Appendix
Sample API Endpoints
typescript
Copy
// Calendar sync
POST /api/calendars/connect 
// Requires: { provider: "google", token: "oauth2-token" }

// AI interview prep
GET /api/ai/interview-prep?jobId=123
// Returns: { questions: [], strategies: {} }
Database Schema
javascript
Copy
// applications collection
{
  userId: ObjectId,
  company: "Google",
  status: "interview",
  contacts: [{ name: "Alice", email: "alice@google.com" }],
  timeline: [{ date: Date, event: "Phone screen" }]
}