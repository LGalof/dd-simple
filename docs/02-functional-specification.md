# Functional Specification – Character System

## 1. Purpose

The Character System is the core part of the D&D Simple application.

It allows authenticated users to create, configure, view, and manage Dungeons & Dragons characters through a web interface. The main goal of this system is to give players a clear character builder and a live character sheet that updates when character data changes.

The Character System is divided into two main views:

- My Characters page
- Character Dashboard / Builder page

The system is designed for Dungeons & Dragons 5e-inspired gameplay, but the MVP will not implement the full ruleset. Only the basic mechanics required for character creation, character overview, and basic calculations are included in the first versions.

---

## 2. Authentication Requirement

Users must be authenticated before they can access character-related functionality.

### Planned authentication direction

The planned authentication method from the original product vision is Google SSO / OAuth.

### Current implementation

The current implementation uses local email/password authentication with bearer-token based sessions.

Implemented auth endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

The frontend stores the auth token in browser local storage and sends it to the backend with protected requests.

### Authentication behavior

- If the user is not authenticated, the application redirects them to the login page.
- If the user is authenticated, the application allows access to protected pages.
- Characters belong to the authenticated user who created them.
- A user should only be able to view, edit, or delete their own characters.

### Protected pages

The following pages require authentication:

- My Characters page
- Create Character page
- Character Dashboard / Builder page
- Inventory page

---

## 3. My Characters Page

## 3.1 Overview

The My Characters page is the main entry point for managing characters.

It allows the user to manage their personal characters. Characters are not connected to campaigns in the current MVP. Each character belongs only to the user who created it.

## 3.2 Purpose

The purpose of this page is to give users a simple overview of their existing characters and allow them to create a new one.

## 3.3 Implemented features

The current implementation supports:

- viewing the list of characters
- displaying character cards
- creating a new character through a Create Character page
- opening a character in the Character Dashboard
- deleting a character
- loading state
- error state
- empty state
- search by name, level, class, or species
- sorting by creation time, name, or level

## 3.4 Page states

### Not authenticated

If the user is not authenticated:

- redirect to login
- do not display character data

### No characters

If the authenticated user has no characters:

- show an empty state
- display a clear Create Character button

### Has characters

If the authenticated user has one or more characters:

- display character cards in a grid
- allow the user to open or delete a character
- allow searching and sorting

## 3.5 Create Character flow

### Planned specification

The earlier specification described a flow where clicking Create Character immediately opened an empty Character Dashboard / Builder.

### Current implementation

The current implementation uses a short Create Character form before opening the dashboard.

The user selects:

- character name
- species
- class
- background
- optional alignment

After submitting the form:

1. The frontend sends a create-character request to the backend.
2. The backend creates the character with default ability scores.
3. The frontend stores the selected character id.
4. The user is redirected to the Character Dashboard.

This flow is currently more compatible with the backend because the backend requires species, class, background, skill indexes, and ability scores when creating a character.

## 3.6 Character Card

Each character is displayed as a card.

A character card should display:

- character name
- level
- species / race
- class
- optional avatar or image placeholder

Character card actions:

- View / Open
- Delete

Level is informational in the MVP. It should be displayed, but it should not lock or unlock functionality.

---

## 4. Character Dashboard / Builder

## 4.1 Overview

The Character Dashboard is both a character builder and a live character sheet.

The page has two main areas:

- left sidebar for input and configuration
- right panel for the calculated character sheet

The intended interaction model is:

User input -> state update -> recalculation -> persistence -> UI update

## 4.2 Purpose

The purpose of the Character Dashboard is to let users create and manage a character while immediately seeing the result on the character sheet.

The user should not have to manually calculate common values such as ability modifiers, initiative, passive perception, basic armor class, or proficiency bonus.

## 4.3 Current implementation

The current Character Dashboard includes:

- builder sidebar
- collapsible sidebar behavior
- species, background, and class selection buttons
- selection panel for species/background/class
- ability score assignment
- single ability score rolling
- roll all ability scores
- HP configuration
- current HP heal/damage controls
- temporary HP controls
- dynamic class feature sections
- live character sheet preview
- workspace tabs for actions, spells, inventory, features, background, notes, and extras
- integration with the inventory sandbox controller
- manual Save Build action

## 4.4 Layout

### Left sidebar

The left sidebar is the input and configuration area.

It contains:

- Species selection button
- Background selection button
- Class selection button
- HP management area
- Ability score inputs and rolling controls
- Dynamic class-specific sections after class selection

### Right panel

The right panel displays the live character sheet.

It contains:

- basic character information
- ability scores
- ability modifiers
- saving throws
- skills
- HP
- AC
- initiative
- speed
- senses
- proficiency bonus
- combat and gameplay tabs

---

## 5. Selection Panels

Selection panels are used for selecting Class, Species, and Background.

They use the same general interaction pattern, but each panel displays data specific to the selected category.

The data for Class, Species, and Background comes from reference/definition data stored in the database and mapped into frontend builder options.

Current database reference models include:

- `RefClass`
- `RefSpecies`
- `RefBackground`

These correspond to the planned concept of reusable definition data.

Definition data describes available game options. User character data stores what the user selected.

## 5.1 Button state behavior

Before a value is selected, the button displays its default label:

- Species
- Background
- Class

After a value is confirmed, the button displays the selected value.

Examples:

- Species button becomes Elf
- Background button becomes Soldier
- Class button becomes Bard

## 5.2 Interaction behavior

When the user clicks a primary selection button:

1. A selection panel opens.
2. The user chooses one item from the list.
3. A preview/confirmation area is displayed.
4. The user confirms or cancels the selection.
5. If confirmed, the selected value is stored in builder state.
6. The button label updates.
7. The character sheet recalculates where needed.

## 5.3 Class Selection Flow

The Class Selection flow allows the user to select a character class.

The class list should display available classes. Each class may include:

- class name
- source/reference information if available
- hit die
- class features
- saving throw proficiencies

After the class is confirmed:

- the selected class is applied to the builder state
- the Class button label updates
- class-specific sections appear in the left sidebar
- relevant character sheet values are recalculated
- feature choices are reset when the class changes

## 5.4 Species Selection Flow

The Species Selection flow allows the user to select a species.

Species data may include:

- species name
- size
- base speed
- description
- source JSON / reference data

After the species is confirmed:

- the selected species is applied to the builder state
- the Species button label updates
- speed and related values may update
- the character sheet preview recalculates

## 5.5 Background Selection Flow

The Background Selection flow allows the user to select a background.

Background data may include:

- background name
- description
- tool proficiencies if available
- source JSON / reference data

After the background is confirmed:

- the selected background is applied to the builder state
- the Background button label updates
- background-related data may update

---

## 6. Ability Scores

## 6.1 Overview

Ability scores are one of the main inputs in the Character Builder.

The system supports the six standard ability scores:

- Strength
- Dexterity
- Constitution
- Intelligence
- Wisdom
- Charisma

## 6.2 Current implementation

The current builder displays ability assignment cards.

Users can:

- roll a single ability score
- roll all ability scores
- assign rolled values to different ability score types
- swap ability score assignments through dropdowns

## 6.3 Rolling logic

The intended rolling behavior is:

1. Roll 4d6.
2. Remove the lowest die.
3. Sum the remaining three dice.
4. Store the result as the ability score.
5. Recalculate dependent values.

Example:

- roll: 6, 5, 3, 1
- remove lowest: 1
- result: 6 + 5 + 3 = 14

---

## 7. Automatic Calculation System

## 7.1 Overview

The system automatically calculates derived character sheet values from character input.

The calculation system should remain separated from visual UI components where possible.

## 7.2 Calculation trigger

Recalculation happens when the user changes relevant character data, such as:

- ability score assignment
- class
- species
- background
- level
- feature choice
- HP configuration
- current HP or temporary HP state
- future equipment or armor selection

## 7.3 Current calculation behavior

The current implementation calculates or displays:

- ability modifiers
- proficiency bonus
- saving throws
- skills
- passive perception
- passive investigation
- passive insight
- initiative
- armor class
- current HP
- max HP
- temporary HP
- speed
- weapon/action previews from inventory data

---

## 8. Calculation Rules

## 8.1 Ability modifier

Formula:

modifier = floor((score - 10) / 2)

Examples:

| Score | Modifier |
| ----- | -------- |
| 8     | -1       |
| 10    | 0        |
| 12    | +1       |
| 14    | +2       |
| 16    | +3       |
| 18    | +4       |

## 8.2 Proficiency bonus

| Level | Proficiency Bonus |
| ----- | ----------------- |
| 1-4   | +2                |
| 5-8   | +3                |
| 9-12  | +4                |
| 13-16 | +5                |
| 17-20 | +6                |

## 8.3 Saving throws

Formula:

Saving Throw = Ability Modifier + Proficiency Bonus, if proficient

If the character is not proficient in that saving throw:

Saving Throw = Ability Modifier

## 8.4 Skills

Formula:

Skill = Related Ability Modifier + Proficiency Bonus + Custom Bonus, if proficient

If the character is not proficient in that skill:

Skill = Related Ability Modifier + Custom Bonus

## 8.5 Passive senses

Formulas:

- Passive Perception = 10 + Perception skill
- Passive Investigation = 10 + Investigation skill
- Passive Insight = 10 + Insight skill

## 8.6 Initiative

Formula:

Initiative = Dexterity Modifier

## 8.7 Armor Class MVP

Current MVP formula:

Armor Class = 10 + Dexterity Modifier

Future versions should support armor and shield calculations.

## 8.8 Hit Points

The system supports basic HP calculation and previewing.

Current behavior includes:

- class hit die
- constitution modifier
- level-based HP preview
- fixed HP mode
- rolled HP mode
- bonus HP
- override max HP
- current HP clamping
- temporary HP as frontend state

## 8.9 Attack and damage preview

The character sheet can display action information based on inventory/equipped item data.

Full weapon, item, and class-specific damage rules are not part of the current MVP.

## 8.10 Spell calculations

Planned formulas:

- Spell Save DC = 8 + Proficiency Bonus + Spellcasting Ability Modifier
- Spell Attack Bonus = Proficiency Bonus + Spellcasting Ability Modifier

The complete spell system is not yet implemented.

---

## 9. Dynamic Class Sections

## 9.1 Overview

After the user confirms a class, class-specific sections appear in the left sidebar.

These sections are based on selected class data and mapped reference data.

## 9.2 Display behavior

Dynamic class sections should:

- appear below the primary selection buttons and HP/ability controls
- be scrollable if there is too much content
- show class information across levels
- mark future/higher-level features visually where appropriate

## 9.3 Level handling

Level is informational only in the MVP.

The system can visually distinguish current and future features, but it does not fully enforce all D&D progression rules.

## 9.4 Section types

Dynamic sections can be:

- informational
- expandable / collapsible
- interactive

Interactive sections allow the user to make choices that affect character state, such as proficiency or feature choices.

---

## 10. Right Panel – Live Character Sheet

## 10.1 Overview

The right panel displays a live character sheet preview.

It updates when the user changes data in the left sidebar.

## 10.2 Displayed information

The right panel currently displays or supports:

- character name
- level
- class
- species
- background
- ability scores
- ability modifiers
- saving throws
- skills
- passive senses
- proficiency bonus
- initiative
- armor class
- current HP
- max HP
- temporary HP
- speed
- training / proficiency information
- action tabs
- spell placeholder tab
- inventory tab
- features and traits tab
- background tab
- notes tab
- extras tab

---

## 11. Combat & Gameplay Panel

## 11.1 Overview

The Combat & Gameplay Panel is part of the right side character sheet.

Its purpose is to give the player quick access to information used during gameplay.

## 11.2 Sections

The current sheet includes workspace tabs for:

- Actions
- Spells
- Inventory
- Features & Traits
- Background
- Notes
- Extras

## 11.3 Future behavior

Future versions may include:

- usable actions
- complete spell management
- backend-persistent inventory interaction
- item effects
- dice roll integration
- combat state tracking

---

## 12. Saving Behavior

## 12.1 Planned behavior

The functional goal is auto-save after changes.

The desired flow is:

1. update local UI state immediately
2. wait briefly after the user stops editing
3. send update request to backend
4. show saving/saved/error state if needed

## 12.2 Current implementation

The current implementation uses a manual Save Build button.

This saves the builder state to the backend after the user changes selections, ability scores, level, and related builder values.

Manual saving is acceptable for the current development stage because it reduces API noise and makes state persistence easier to debug.

## 12.3 Future improvement

The manual Save Build action should later be replaced or extended with a debounced auto-save mechanism.

---

## 13. Data Model Concept

## 13.1 User character data

User character data represents the specific character created by a user.

Examples:

- character name
- level
- selected class
- selected species
- selected background
- ability scores
- selected skill proficiencies
- selected feature options
- current HP
- max HP
- armor class
- inventory records
- dice rolls

## 13.2 Reference data

Reference data represents reusable game options available to all users.

Current reference data includes:

- ability scores
- skills
- species
- classes
- backgrounds
- proficiencies
- equipment
- generic rule documents

## 13.3 Separation of data

The system separates reference data from user character data.

Example:

- `RefClass` describes what a class is.
- `Character` stores that the user selected a specific class for their character.

This makes it easier to reuse the same class, species, background, skill, equipment, and rule data across many users and characters.

---

## 14. Inventory System

## 14.1 Current implementation

The current project contains an inventory sandbox and inventory workspace integration.

The inventory prototype supports:

- containers
- item dimensions
- item location
- equipment slots
- item metadata
- local browser persistence
- item templates
- basic item management interactions

## 14.2 Current limitation

The current inventory system is not yet fully connected to backend character inventory persistence.

The Prisma schema includes `CharacterInventory`, but the frontend inventory sandbox currently acts mainly as a prototype.

## 14.3 Future behavior

Future versions should support:

- saving inventory per character
- loading inventory from the backend
- applying equipped item effects
- calculating AC and attack changes from equipment
- drag-and-drop persistence

---

## 15. Tactical Board / Virtual Tabletop

## 15.1 Current implementation

The current project contains a tactical board prototype.

The prototype supports:

- grid board
- tokens
- token movement
- token HP and max HP
- initiative values
- initiative order
- terrain painting
- saved board state in browser storage
- browser-tab synchronization through storage events

## 15.2 Current limitation

The tactical board is currently a frontend prototype.

It is not yet connected to backend sessions or WebSocket realtime synchronization.

## 15.3 Future behavior

Future versions should support:

- backend session state
- joining sessions by code
- Dungeon Master and player roles
- WebSocket realtime synchronization
- shared token movement
- shared HP and initiative updates

---

## 16. MVP Scope

## 16.1 Included in current implementation

The current implementation includes:

- local email/password authentication
- protected frontend routes
- My Characters page
- Create Character page
- Character Dashboard / Builder page
- class selection flow
- species selection flow
- background selection flow
- ability score rolling
- basic derived calculations
- live character sheet preview
- manual build saving
- backend character persistence
- reference-data API
- inventory prototype
- tactical board prototype

## 16.2 Planned but not fully implemented

The following features are planned but not fully implemented yet:

- Google SSO / OAuth
- debounced auto-save
- backend-persistent inventory UI
- full dice rolling system
- dice roll history UI
- session creation and joining
- Dungeon Master / player roles
- WebSocket realtime synchronization
- full virtual tabletop integration
- complete spell system
- advanced rule engine
- production deployment

## 16.3 Not included in MVP

The MVP does not include:

- full Dungeons & Dragons rules engine
- full campaign management
- voice or video communication
- mobile application
- complete automation for every spell, feat, item, and subclass rule

---

## 17. Open Questions

The following details can be defined later:

- final Google SSO/OAuth provider configuration
- final auto-save debounce timing
- final item/equipment effect model
- final spell system behavior
- final session and WebSocket event model
- final deployment provider
- final test coverage expectations

---

## 18. Acceptance Criteria for the Character System MVP

The Character System MVP is considered complete when:

- authenticated users can access the application
- unauthenticated users are redirected to login
- users can view their characters
- users can create a new character
- users can open the Character Dashboard
- users can select class, species, and background
- users can roll ability scores
- modifiers and basic derived values calculate automatically
- the right character sheet updates from builder changes
- character changes can be saved to the backend
- character data persists in the database
- users cannot access other users' characters
