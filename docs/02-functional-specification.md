## Character System

### Overview

The Character System is the core part of the application.

It allows users to:

* create and manage characters
* configure character attributes
* view a live character sheet
* interact with character data during gameplay

The system is divided into two main views:

* My Characters page (entry point)
* Character Dashboard (builder + character sheet)

---

## My Characters Page

### Overview

The My Characters page is the main entry point after login.

It allows the user to manage their characters, including creating, viewing, editing, and deleting them.

Characters are not connected to campaigns.
Each character belongs only to the user who created it.

---

### Purpose

Allow users to manage their characters in a single dashboard view.

---

### Features

* View list of characters
* Create new character
* Open character dashboard
* Edit character
* Delete character
* Search characters
* Sort characters

---

### States

* Not authenticated -> redirect to login
* No characters -> empty state with Create Character button
* Has characters -> grid view of character cards

---

### Character Card

Each character is displayed as a card containing:

* Character name
* Level (informational only)
* Race / species
* Class
* Optional avatar/image

Actions:

* View
* Edit
* Delete

---

## Character Dashboard

### Overview

The Character Dashboard is a character builder interface with a live character sheet preview.

Layout:

* Left sidebar -> input/configuration
* Right panel -> calculated character sheet

---

## Left Sidebar (Character Builder)

### Primary Selection Buttons

At the top of the sidebar:

* Species
* Background
* Class

---

### Button State Behavior

* Default: shows label ("Class", "Species", "Background")
* After selection: shows selected value
  (e.g. "Bard", "Elf", "Soldier")

---

### Interaction

* Click -> open selection panel
* Confirm -> value is stored
* UI updates immediately

---

## Selection Panels

### Class Selection Flow

#### Step 0

User clicks **Class** button in sidebar.

#### Step 1 - Class List

User sees list of classes and selects one.

#### Step 2 - Confirmation Panel

Center screen panel displays:

* full class info (levels 1-20)
* read-only

#### Actions:

* ADD CLASS -> confirm
* CANCEL -> close

---

### Data Modes

**Preview Mode (Center Panel):**

* All levels (1-20)
* Read-only

**Interactive Mode (Left Sidebar):**

* All levels (1-20)
* Editable (feats, subclass, options)

---

### Species & Background

Same flow as Class:

* open panel
* select
* confirm
* apply

---

## Ability Scores

### Input

User can:

* manually enter values
* click **ROLL**

---

### Rolling Logic

* Roll 4d6
* Remove lowest
* Sum remaining 3

---

## Calculation System

### Overview

All character sheet values are calculated automatically.

---

### Calculation Flow

```txt
Ability Score -> Modifier -> Derived Values
```

---

## Ability Modifier

modifier = (score - 10)/2

---

## Proficiency Bonus

| Level | Bonus |
| ----- | ----- |
| 1-4   | +2    |
| 5-8   | +3    |
| 9-12  | +4    |
| 13-16 | +5    |
| 17-20 | +6    |

---

## Derived Calculations

### Saving Throws

Saving Throw = Ability Modifier + Proficiency

---

### Skills

Skill = Ability Modifier + Proficiency

---

### Passive Perception

Passive Perception = 10 + Perception,
Passive Investigation = 10 + Investigation,
Passive Insight = 10 + Insight

---

### Initiative

Initiative = DEX Modifier

---

### Armor Class

AC = 10 + DEX Modifier

---

### Hit Points (MVP)

Max HP = Hit Die + CON Modifier

---

### Attack Modifier

Attack = Ability Modifier + Proficiency

---

### Damage

Damage = Weapon + Ability Modifier

---

### Spell Save DC

DC = 8 + Proficiency + Modifier

---

### Spell Attack

Spell Attack = Proficiency + Modifier

---

### Speed

From Species

---

## Dynamic Class Sections

After class selection:

* sidebar expands
* shows class features (levels 1-20)
* scrollable

---

## Section Behavior

Sections can be:

* expandable
* informational
* interactive

---

## Level Handling

Level is not enforced in MVP.

User decides what to fill.

---

## Right Panel (Character Sheet)

### Overview

Live preview of character.

Updates automatically.

---

### Displays

* Ability scores
* Modifiers
* Saving throws
* Skills
* HP
* AC
* Initiative
* Speed
* Senses
* Proficiency

---

## Combat & Gameplay Panel

Contains:

* Actions
* Bonus Actions
* Reactions
* Spells
* Inventory
* Features
* Notes

---

## Interaction Model

```txt
User input -> state update -> recalculation -> UI update
```

---

## MVP Scope

Includes:

* character creation
* ability scores
* class system
* automatic calculations
* live sheet

Does NOT include:

* full rules engine
* campaigns
* multiplayer
* realtime sync
