# Exercise with E-Pet (寵物的運動冒險記)

a proposal
by F94145032 張嘉恩 F94145058 鄧晶晶

---

# Motivation

The idea originated from desktop companion pets that accompany users on their computers. We then started thinking that perhaps we could create a lifestyle companion pet. Since lifestyle covers many aspects, we decided to start with exercise. Originally, we only planned to create a health and exercise companion system, but later we felt that its entertainment value would not be high enough, making it difficult for users to continue using it in the long term. After discussing with ChatGPT, it suggested combining story elements and gameplay systems to turn it into a game, which led to the creation of _Exercise with E-Pet_.

---

# Game Concept

The game combines smartphone pedometers or smartwatches with existing step-counting programs or GPS systems, connecting them to a virtual pet-raising application.

---

# Overview of Game Features

The core pet-raising game application converts the user’s daily calorie consumption and step count into pet food. In other words, the amount of exercise determines the pet’s growth speed and various attributes.

During exercise, users can interact with the environment through the camera, release their pet into the surroundings, and interact with it while exercising, achieving an E-walking and pet-walking experience that can trigger story events and exploration.

Through exploration, users can unlock maps, events, and different boss challenges.

Inside the game software, users can purchase equipment and customize their pets. These tokens are converted from the user’s time spent using the software and accumulated battle achievements. They can improve intimacy with the pet and trigger additional story events.

A daily check-in mechanism accumulates exercise streaks and encourages users to continue using the application consistently.

---

# Software Environment

The goal is to make the application fully functional on mobile devices. If that is not possible, the project may be divided into two applications: GPS functions on the smartphone and pet-raising functions on the computer.

---

# Programming Languages

JAVA, C++, etc.

---

# Table of Contents

1. Title
2. Table of Contents
3. Exercise with E-Pet — Detailed AI Usage Strategy Planning
4. Step 1: Idea Development and Game Concept Design
5. Step 2: UI Interface Design Assistance
6. Step 3: AR Function Development (Core Technology)
7. Step 4: Story System Design
8. Step 5: Step Count and Calorie Conversion System
9. Step 6: Testing and QA
10. Step 7: Presentation and Documentation Writing
11. AI Usage Strategy Overview Table
12. Important Notes
13. Interface
14. Expected Outcome
15. AI Conversation Records

---

# Exercise with E-Pet — Detailed AI Usage Strategy Planning

## Project Name

Exercise with E-Pet (PawStep)

## Team Members

Chang Chia-En F94145032  
Deng Jing-Jing F94145058

---

# Overview: The Role of AI in This Project

This project spans five major fields: game design, UI interface, AR technology, story systems, and step-count integration. AI tools will be used throughout every stage of development and will take on different responsibilities depending on the development phase.

---

# Step 1: Idea Development and Game Concept Design

## Tools Used

ChatGPT / Claude

## Strategy Description

The project initially took inspiration from desktop companion pets. However, a simple health-tracking application lacked entertainment value and would make it difficult for users to continue using it over time. Through discussions with ChatGPT, AI suggested adding story systems and gamification mechanisms, transforming the project from a “health tool” into an “adventure game.”

## Specific AI Usage Methods

### Gamification Design

**Prompt Example:**  
“I want to create a mobile game combined with a pedometer. How can I make users continue using it for more than 30 days?”

**Expected Output:**  
Daily check-in systems, pet growth curves, and daily mission design suggestions.

### Worldbuilding

**Prompt Example:**  
“Help me design the story background of a pet adventure game themed around exercise and exploration.”

**Expected Output:**  
World settings and main storyline outlines.

### Competitor Analysis

**Prompt Example:**  
“Analyze the retention mechanisms of Pokémon GO, Tamagotchi, and Nike Run Club.”

**Expected Output:**  
A feature list that borrows strengths from each application.

### Numerical System Design

**Prompt Example:**  
“Design a formula that converts step count → pet food → pet growth, allowing stable growth when users walk 8,000 steps per day.”

**Expected Output:**  
Specific formulas and balancing suggestions.

---

# Step 2: UI Interface Design Assistance

## Tools Used

Claude / ChatGPT + Figma AI (MagicPattern, etc.)

## Strategy Description

Based on the four existing core interfaces in the document (Homepage, Walks Screen, Goals Screen, Profile Screen, and Pet Selection Bar), AI can assist with:

- Reviewing UX logic
- Providing improvement suggestions
- Generating interface descriptions and button text

---

## 2-1. Design Review

### Prompt Example

“Please review whether this mobile app homepage design follows UX principles:

- Homepage displays pet, step progress, pet mood, and today’s goals
- Bottom navigation contains Activity / Walks / Goals / Profile tabs
- The user goal is to open the app daily to check the pet’s condition and start exercising.”

### Expected Output

Suggestions for user flow, visual hierarchy improvements, and accessibility recommendations.

---

## 2-2. Copywriting Generation

### Prompt Example

“Generate friendly and emotional UI text for a pet exercise app:

- Welcome messages (the pet waiting for the owner to go out)
- Encouragement messages when goals are reached
- Pet mood descriptions (happy / normal / sad)
- Mission unlock notifications

Tone: lively, warm, and suitable for users aged 18–35.”

---

## 2-3. Color Scheme and Style Confirmation

### Prompt Example

“My app uses warm yellow (#F5A623) and cream white (#FDF8E8) as the main colors.

Please suggest:

1. Secondary colors
2. Error/warning colors
3. Button hover colors

Also explain why this color combination is suitable for a pet game theme.”

---

# Step 3: AR Function Development (Core Technology)

## Tools Used

Claude + Unity + Vuforia / EasyAR

## Strategy Description

The document specifically mentions using Claude to assist in developing AR technology through Unity combined with Vuforia or EasyAR. The AR system logic is divided into four stages:

- Environmental sensing
- Image recognition
- Object rendering
- Interactive presentation

---

## 3-1. Unity C# Code Generation

### Prompt Example (Environmental Detection)

“Please write a Unity C# script using AR Foundation that:

- Detects ground planes
- Places a 3D pet model on the detected plane
- Makes the pet walk toward the touched location when the user taps the screen.”

### Prompt Example (Vuforia Image Recognition)

“Explain how to use Vuforia in Unity to set up an Image Target.

When the camera scans a specific image (such as a park entrance sign), trigger the following events:

- Play the pet appearance animation
- Display the UI notification ‘New location discovered! +50 EXP’
- Record the location onto the user’s exploration map.”

---

## 3-2. AR Interaction Logic Design

### Prompt Example

“In AR mode, users walk while using the smartphone camera to observe their surroundings.

Please design an ‘AR walking interaction system’ including:

- Logic for the pet following the user (GPS or IMU?)
- Conditions for randomly triggering exploration events
- Ways to reduce battery consumption in AR mode

Implement using Unity C# and include a simple state machine design.”

---

## 3-3. Debugging and Error Troubleshooting

During development, bugged code can be directly pasted into Claude:

“The following Unity code causes the pet model to shake and drift away from the ground when running in AR Foundation. Please identify the issue and fix it:
[Insert code]”

---

# Step 4: Story System Design

## Tools Used

Claude / ChatGPT

## Strategy Description

The game requires “unlocking maps, events, and boss challenges through exploration” to maintain long-term attraction. AI can batch-generate story events, NPC dialogue, and boss settings.

---

## 4-1. Story Event Generation

### Prompt Example

“Please design 20 exploration-triggered events for Exercise with E-Pet.

Scenario:
The user triggers events while walking in real-world parks or streets.

Each event should include:

- Trigger condition (steps / location / time)
- Story text (2–3 sentences from the pet’s first-person perspective)
- Rewards
- Whether it connects to the main storyline.”

---

## 4-2. Boss Battle Design

### Prompt Example

“Please design 5 exercise challenge bosses with different difficulty levels:

- Boss name and appearance description
- Challenge conditions (e.g., walk 8,000 steps for 7 consecutive days)
- Failure penalties and success rewards
- Boss dialogue (villain style but not frightening)

The game should remain suitable for casual players with gradually increasing difficulty.”

---

## 4-3. Pet Dialogue System

### Prompt Example

“Generate 10 dialogue lines for each pet mood state:

- Extremely happy (after completing the step goal)
- Normal (exercise has not started today)
- Sad (failed to meet the goal for 3 consecutive days)
- Excited (discovered a new location)

Tone should be cute, short, and suitable for app push notifications.”

---

# Step 5: Step Count and Calorie Conversion System

## Tools Used

Claude / ChatGPT

## Strategy Description

The user’s steps and calories burned must be converted into “pet food quantity,” affecting the pet’s growth speed and attributes. This requires a balanced numerical formula design.

## Specific AI Usage Methods

### Prompt Example (Balancing System)

“Please design a ‘steps → pet growth’ conversion system.

Conditions:

- Recommended daily step count: 8,000 steps
- Pets have three attributes: stamina, affection, and growth value
- Game lifespan is designed for 90 days (pet grows from childhood → adulthood → old age)

Requirements:

- Formula for converting steps into food quantity
- Formula for converting food quantity into growth value
- Bonus mechanisms for extra exercise
- Consecutive check-in multiplier formulas
- Anti-cheating mechanisms to prevent fake step farming.”

---

# Step 6: Testing and QA

## Tools Used

Claude

## Strategy Description

After development is completed, AI will assist in generating test cases and identifying edge cases.

## Specific AI Usage Methods

### Prompt Example

“Please generate a testing checklist for the following feature:

Feature: Step synchronization system (mobile pedometer → app → pet food update)

The test cases should include:

- Normal scenarios
- Abnormal scenarios (0 steps, unusually large step counts, offline status)

Output format:

- Test case number
- Preconditions
- Operation steps
- Expected results.”

---

# Step 7: Presentation and Documentation Writing

## Tools Used

Claude

## Specific AI Usage Methods

### Prompt Example (Final Report Summary)

“Based on the following project content, write a 500-word Chinese project summary suitable for placement after the cover page of a final report, including:

- Motivation
- Goals
- Feature highlights
- Technical methods
- Expected outcomes.”

### Prompt Example (Oral Presentation Script)

“Please rewrite the following technical explanation into a 5-minute oral presentation script with a natural tone suitable for presenting to professors and classmates. Include an introduction and conclusion.”

---

# AI Usage Strategy Overview Table

| Development Stage          | AI Tool          | Main Purpose                                  | Estimated Time Saved |
| -------------------------- | ---------------- | --------------------------------------------- | -------------------- |
| Idea Development           | ChatGPT          | Gamification suggestions, competitor analysis | 10 hours             |
| UI Design Assistance       | Claude           | Copywriting generation, UX review             | 5 hours              |
| AR Programming Development | Claude           | C# code generation and debugging              | 20 hours             |
| Story System               | Claude / ChatGPT | Batch generation of events, dialogue, bosses  | 15 hours             |
| Numerical Design           | Claude           | Formula design and balancing suggestions      | 5 hours              |
| Testing QA                 | Claude           | Test case generation                          | 5 hours              |
| Documentation Writing      | Claude           | Summaries and presentation scripts            | 3 hours              |

---

# Important Notes

- AI-generated content requires manual review: Code must be tested in Unity and cannot be directly applied.
- Copyright awareness: AI-generated story text and art descriptions must not infringe on other game IPs.
- Record AI conversations: Screenshots of AI conversations should be saved as report appendices.
- Iterative usage: If the AI response is unsatisfactory, continue asking follow-up questions such as “Please explain point 3 in more detail” or “Please organize it into a table.”

---

# Interface

- Homepage
- Walks Page
- Goals Page
- Profile Page
- Pet Selection Bar
- Phone Display
- Battle Display

---

# Expected Outcome

The proposed application, PawStep, is expected to provide users with an interactive and enjoyable exercise experience through a virtual pet adventure game while doing physical exercise. The system utilizes wearable devices and smartphones to monitor user activity and convert the exercise data into game progress.

During exercise sessions, the virtual pet accompanies the user by traveling around the smartphone screen. Through GPS functions, the pet can explore environments, collect points, and battle NPC enemies that symbolize burned calories. The amount of physical activity performed by users affects the pet’s growth, energy, and overall progression, encouraging users to exercise more consistently.

In addition, the application promotes long-term exercise habits through daily check-in systems, exploration missions, unlockable maps, pet customization, and reward mechanisms. Users can feed, upgrade, and interact with the pet, making exercise feel more enjoyable.

From a Biomedical Engineering perspective, this project demonstrates the application of healthcare gamification, exercise monitoring, wearable technology integration, and programming concepts that aim to motivate users toward physical activity and healthy lifestyle habits.

Overall, PawStep aims to combine healthcare with gaming experiences to encourage users to maintain regular exercise routines while enjoying the companionship of a virtual pet.

---

# AI Conversation Records

## Topic Ideation

https://chatgpt.com/s/t_6a02e286a3dc8191a4d259605760f8f9

## Interface

https://stitch.withgoogle.com/projects/15364370226852533997

## Expected Outcome

https://chatgpt.com/share/6a0b2c35-cfa8-8322-8123-9935e3f95d38
